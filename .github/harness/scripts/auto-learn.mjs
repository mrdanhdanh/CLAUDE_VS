#!/usr/bin/env node
/**
 * Auto-Learn — hệ thống tự học hỏi tự động
 * - suggest: gợi ý KN liên quan khi code (BM25-lite)
 * - log: auto tạo draft bug.md khi có lỗi
 * - propose: sinh KN draft từ bug.md để dán vào knowleged.md
 * - status: tổng quan học hỏi
 * No deps, Node 18+
 */
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const GITHUB_DIR = path.resolve(__dirname, '..', '..');
const ROOT = path.resolve(GITHUB_DIR, '..');
const KNOWLEGED = path.join(ROOT, 'docs', 'knowleged.md');
const BUGS_DIR = path.join(ROOT, '.agent', 'bugs');
const TEMPLATE = path.join(BUGS_DIR, '_template', 'bug.md');
const VERSIONS_DIR = path.join(ROOT, '.agent', 'versions');
const RECORDS_DIR = path.join(ROOT, '.agent', 'records');
const REPORTS_FILE = path.join(ROOT, '.agent', 'reports.jsonl');

// ---------- helpers ----------
function tokenize(text) {
  if (!text) return [];
  const lower = text.toLowerCase();
  // keep Vietnamese chars
  const tokens = lower.match(/[a-z0-9àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]+/gi) || [];
  const stop = new Set([
    'va','và','la','là','cua','của','cho','voi','với','trong','mot','một','cac','các','nhung','nhưng','de','để','co','có','khong','không','da','đã','bi','bị','thi','thì','ma','mà','ve','về','tu','từ','den','đến','khi','neu','nếu','se','sẽ','duoc','được','nay','này','do','đó','voi','với','the','and','or','a','an','is','are','to','of','in','on','for','with','as','by','at','be','this','that','it','from','are','was','were','has','have','had','will','would','can','could','should','may','might','must','been','being','also','just','only','very','more','most','some','any','all','each','few','many','other','such','no','nor','not','but','if','then','than','so','too','very'
  ]);
  return tokens.filter(t => t.length > 1 && !stop.has(t));
}

function computeIDF(queryTokens, kns) {
  const N = kns.length || 1;
  const idf = {};
  for (const qt of queryTokens) {
    let df = 0;
    const qtNorm = qt.normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    for (const kn of kns) {
      const has = kn.tokens.some(t => t===qt || t.includes(qt) || qt.includes(t) || t.normalize('NFD').replace(/[\u0300-\u036f]/g,'')===qtNorm);
      if (has) df++;
    }
    // smooth IDF
    idf[qt] = Math.log((N + 1) / (df + 1)) + 1; // 1..~2.5
  }
  return idf;
}

function normalizeSlug(s) {
  return s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'bug';
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

async function parseKNs() {
  let text = '';
  try { text = await fs.readFile(KNOWLEGED, 'utf8'); } catch (e) {
    return { kns: [], raw: '', error: e.message };
  }
  text = text.replace(/\r\n/g, '\n');
  const kns = [];
  // Robust split by ### KN- to avoid regex lookahead issues with \r\n and em dash
  const parts = text.split(/^###\s*KN-/m);
  // parts[0] is header before first KN, rest are KN blocks
  for (let i = 1; i < parts.length; i++) {
    const part = 'KN-' + parts[i];
    // First line: KN-XXX — Title
    const firstNL = part.indexOf('\n');
    const firstLine = firstNL >= 0 ? part.slice(0, firstNL) : part;
    const m = firstLine.match(/KN-(\d+)\s*[—\-–]\s*(.+)/);
    if (!m) continue;
    const id = `KN-${m[1].padStart(3,'0')}`;
    // Skip template placeholder KN-XXX
    if (m[1] === 'XXX' || /Tiêu đề ngắn gọn/.test(m[2])) continue;
    const title = m[2].trim();
    const block = firstNL >= 0 ? part.slice(firstNL + 1) : '';
    // Stop at next section markers inside block (but split already handles, so just trim)
    // Extract tags: look for Tags: line and collect all `tag`
    let tags = [];
    const tagsLineM = block.match(/Tags:\s*([^\n]+)/);
    if (tagsLineM) {
      const raw = tagsLineM[1];
      const bt = [...raw.matchAll(/`([^`]+)`/g)].map(x => x[1].trim());
      if (bt.length) tags = bt;
      else tags = raw.split(/[\s,]+/).filter(Boolean).map(t => t.replace(/`/g,'').trim()).filter(Boolean);
    }
    // Severity
    const sevM = block.match(/Severity:\s*(\w+)/i);
    const severity = sevM ? sevM[1].toLowerCase() : 'minor';
    const dateM = block.match(/Ngày:\s*([0-9\-]+)/);
    const date = dateM ? dateM[1] : '';
    // Lesson: try to find **Bài học** or first meaningful line after table
    let lesson = '';
    const lessonM = block.match(/Bài học[^:]*:\s*([^\n]+)/);
    if (lessonM) lesson = lessonM[1].trim().slice(0,200);
    else {
      // fallback: use title as lesson
      lesson = title.slice(0,120);
    }
    const detail = block.slice(0, 2500);
    const tokens = tokenize(`${title} ${tags.join(' ')} ${lesson} ${detail}`);
    const titleTokens = tokenize(title);
    const tagTokens = tokenize(tags.join(' '));
    // Skip if title is template
    if (title.includes('Tiêu đề')) continue;
    kns.push({ id, title, tags, lesson, detail, severity, date, tokens, titleTokens, tagTokens, block: block.slice(0,600) });
  }
  // Fallback: if still 0, try table parse
  if (kns.length === 0) {
    const tableRe = /\|\s*(KN-\d+)\s*\|[^|]*\|[^|]*\|[^|]*\|([^|]+)\|/g;
    let tm;
    while ((tm = tableRe.exec(text)) !== null) {
      const id = tm[1].trim();
      if (id === 'KN-001' && tm[2].includes('Ví dụ')) continue;
      const lesson = tm[2].trim();
      kns.push({ id, title: lesson.slice(0,60), tags: [], lesson, detail: lesson, severity:'minor', date:'', tokens: tokenize(lesson), titleTokens: tokenize(lesson), tagTokens: [], block: lesson });
    }
  }
  return { kns, raw: text };
}

function scoreKN(queryTokens, queryRaw, kn, idf) {
  let score = 0;
  const qLower = queryRaw.toLowerCase();
  const titleLower = kn.title.toLowerCase();
  const detailLower = kn.detail.toLowerCase();
  // phrase boost
  if (titleLower.includes(qLower)) score += 3;
  if (detailLower.includes(qLower)) score += 1;
  for (const qt of queryTokens) {
    const w = idf ? (idf[qt] || 1) : 1;
    const cTitle = kn.titleTokens.filter(t=>t===qt || t.includes(qt) || qt.includes(t)).length;
    const cTag = kn.tagTokens.filter(t=>t===qt || t.includes(qt) || qt.includes(t)).length;
    const cAll = kn.tokens.filter(t=>t===qt || t.includes(qt) || qt.includes(t)).length;
    score += (cTitle * 1.5 + cTag * 2.0 + cAll * 0.5) * w;
    // also partial match for Vietnamese without diacritics
    const qtNorm = qt.normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    if (qtNorm !== qt) {
      const cNorm = kn.tokens.filter(t=> t.normalize('NFD').replace(/[\u0300-\u036f]/g,'') === qtNorm).length;
      score += cNorm * 0.8 * w;
    }
  }
  return Math.round(score * 10) / 10;
}

async function suggest(query, topK=3, json=false) {
  const { kns, error } = await parseKNs();
  if (error) {
    console.error(`⚠️  Không đọc được knowleged.md: ${error}`);
    process.exit(1);
  }
  if (kns.length === 0) {
    const msg = 'Chưa có bài học nào trong knowleged.md — hãy tạo KN đầu tiên sau khi fix bug.';
    if (json) console.log(JSON.stringify({ query, results: [], message: msg }, null, 2));
    else console.log(`🔍 suggest "${query}" → ${msg}`);
    return;
  }
  const qTokens = tokenize(query);
  if (qTokens.length === 0) qTokens.push(...query.toLowerCase().split(/\s+/).filter(Boolean));
  const idf = computeIDF(qTokens, kns);
  const scored = kns.map(kn => ({ ...kn, score: scoreKN(qTokens, query, kn, idf) }))
    .filter(k=>k.score>0)
    .sort((a,b)=>b.score-a.score)
    .slice(0, topK);
  if (json) {
    console.log(JSON.stringify({ query, queryTokens: qTokens, totalKN: kns.length, results: scored.map(k=>({ id:k.id, title:k.title, tags:k.tags, severity:k.severity, date:k.date, score:k.score, lesson:k.lesson.slice(0,120), snippet:k.block.slice(0,200).replace(/\n/g,' ') })) }, null, 2));
    return;
  }
  if (scored.length === 0) {
    console.log(`🔍 suggest "${query}" → Không tìm thấy KN liên quan (đã scan ${kns.length} KN). Thử từ khóa khác: ${qTokens.join(', ')}`);
    console.log(`💡 Gợi ý: kiểm tra lại tags trong knowleged.md hoặc thêm KN mới.`);
    return;
  }
  console.log(`🔍 suggest "${query}" — tìm thấy ${scored.length}/${kns.length} KN liên quan:`);
  for (const k of scored) {
    console.log(`  [${k.id}] score ${k.score} — ${k.title} (${k.severity}, ${k.tags.join(' ') || 'no-tags'})`);
    if (k.lesson) console.log(`       → ${k.lesson.slice(0,100)}`);
    console.log(`       snippet: ${k.block.slice(0,120).replace(/\n/g,' ').trim()}...`);
  }
  console.log(`\n📚 Xem chi tiết: docs/knowleged.md → ${scored.map(s=>s.id).join(', ')}`);
}

async function logBug(opts) {
  const error = opts.error || opts.msg || 'unknown error';
  const file = opts.file || '';
  const title = opts.title || error.slice(0, 60);
  let slug = opts.slug || normalizeSlug(title);
  const date = todayISO();
  let dirName = `${date}-${slug}`;
  let dir = path.join(BUGS_DIR, dirName);
  // handle duplicate
  let suffix = 2;
  while (existsSync(dir)) {
    dirName = `${date}-${slug}-${suffix}`;
    dir = path.join(BUGS_DIR, dirName);
    suffix++;
    if (suffix>20) break;
  }
  await fs.mkdir(dir, { recursive: true });
  let template = '';
  try { template = await fs.readFile(TEMPLATE, 'utf8'); } catch {
    template = `# Bug: ${title}\n\n## Meta\n- **Slug:** ${dirName}\n- **Ngày:** ${date}\n- **Severity:** minor\n- **Tags:** \n\n## 1. Reproduce\n\n## 2. Root Cause\n\n## 3. Fix\n\n## 4. Verification\n\n## 5. Lesson\n\n## 6. Prevention\n`;
  }
  // fill template
  const now = new Date().toISOString();
  let content = template
    .replace('<Tiêu đề ngắn gọn>', title)
    .replace('YYYY-MM-DD-<slug>', dirName)
    .replace('YYYY-MM-DD', date);
  // inject error info at top if not already
  const header = `> 🤖 Auto-log bởi auto-learn.mjs — ${now}\n> **Error:** \`${error.replace(/`/g,"'")}\`${file ? `\n> **File:** \`${file}\`` : ''}\n> **Title:** ${title}\n\n`;
  if (!content.includes('Auto-log')) content = header + content;
  // ensure file:line hint
  if (file && !content.includes(file)) {
    content = content.replace('## 1. Reproduce', `## 1. Reproduce\n\n> File gợi ý: \`${file}\` — kiểm tra log/error trên.\n`);
  }
  const outPath = path.join(dir, 'bug.md');
  await fs.writeFile(outPath, content, 'utf8');
  console.log(`✅ Đã tạo draft bug: ${path.relative(ROOT, outPath)}`);
  console.log(`   Slug: ${dirName}`);
  console.log(`   Error: ${error.slice(0,80)}`);
  if (file) console.log(`   File: ${file}`);
  console.log(`\n📝 Tiếp theo:`);
  console.log(`   1. Mở ${path.relative(ROOT, outPath)} điền Reproduce + Root Cause`);
  console.log(`   2. Sau khi fix: node .github/harness/scripts/auto-learn.mjs propose --bug ${dirName}`);
  return dirName;
}

async function propose(bugSlug, json=false) {
  if (!bugSlug) {
    console.error('❌ Thiếu --bug <slug>. Ví dụ: --bug 2026-08-30-mat-dau-tieng-viet');
    process.exit(1);
  }
  const bugPath = path.join(BUGS_DIR, bugSlug, 'bug.md');
  if (!existsSync(bugPath)) {
    console.error(`❌ Không tìm thấy ${path.relative(ROOT, bugPath)}`);
    // try find similar
    try {
      const dirs = await fs.readdir(BUGS_DIR, { withFileTypes:true });
      const cands = dirs.filter(d=>d.isDirectory() && d.name.includes(bugSlug.slice(0,10))).map(d=>d.name).slice(0,5);
      if (cands.length) console.log(`Gợi ý slug gần đúng: ${cands.join(', ')}`);
    } catch {}
    process.exit(1);
  }
  const bugText = await fs.readFile(bugPath, 'utf8');
  const { kns, raw } = await parseKNs();
  // find max KN id
  let maxId = 0;
  for (const k of kns) {
    const n = parseInt(k.id.replace('KN-',''),10);
    if (n>maxId) maxId=n;
  }
  const nextId = `KN-${String(maxId+1).padStart(3,'0')}`;
  // extract title from bug
  const titleM = bugText.match(/^#\s*Bug:\s*(.+)/m) || bugText.match(/Title:\s*(.+)/);
  const title = titleM ? titleM[1].trim().slice(0,80) : bugSlug;
  const sevM = bugText.match(/Severity:\s*(\w+)/i);
  const severity = sevM ? sevM[1].toLowerCase() : 'major';
  const tagsM = bugText.match(/Tags:\s*([^\n]+)/);
  const tags = tagsM ? tagsM[1].trim().replace(/`/g,'') : 'ui';
  const today = todayISO();
  // try extract root cause
  const whyM = bugText.match(/Why 5.*?:\s*(.+)/) || bugText.match(/Root.*?:\s*(.+)/i);
  const root = whyM ? whyM[1].trim().slice(0,200) : 'Chưa điền — hãy bổ sung 5 Whys trong bug.md';
  const fixM = bugText.match(/Approach:\s*(.+)/) || bugText.match(/Cách sửa:\s*(.+)/);
  const fix = fixM ? fixM[1].trim().slice(0,200) : 'Chưa điền — mô tả cách sửa ở gốc';

  const draft = `### ${nextId} — ${title}

- **Ngày:** ${today}
- **Bug report:** \`.agent/bugs/${bugSlug}/bug.md\`
- **Severity:** ${severity}
- **Triệu chứng:** ${title} — xem bug.md Reproduce
- **Nguyên nhân gốc:** ${root}
- **Cách sửa:** ${fix}
- **Cách phòng tránh:**
  - Thêm checklist liên quan vào docs/knowleged.md Checklist phòng tránh chung
  - Chạy \`node .github/harness/scripts/auto-learn.mjs suggest "<từ khóa>"\` trước khi code tương tự
- **Tags:** ${tags}
- **Người ghi:** YUNIE / auto-learn propose
`;

  const tableRow = `| ${nextId} | ${today} | ${title.slice(0,30)} | ${root.slice(0,30)} | ${title.slice(0,40)} | \`${tags.split(/\s+/).slice(0,3).join(' ')}\` |`;

  if (json) {
    console.log(JSON.stringify({ nextId, bugSlug, title, severity, tags, draft, tableRow }, null, 2));
    return;
  }
  console.log(`📋 Đề xuất KN mới từ bug ${bugSlug}:\n`);
  console.log(`— Bảng tóm tắt (dán vào ## Bảng tóm tắt):`);
  console.log(tableRow);
  console.log(`\n— Chi tiết (dán vào ## Chi tiết bài học, trước <!-- Thêm bài học mới -->):\n`);
  console.log(draft);
  console.log(`\n— Anti-pattern (thêm vào ## Anti-patterns tích lũy nếu phù hợp):`);
  console.log(`- ❌ ${title} — ${root.slice(0,60)}`);
  console.log(`\n✅ Sau khi dán, chạy: node .github/harness/scripts/auto-learn.mjs status`);
  console.log(`   và commit docs/knowleged.md + .agent/bugs/${bugSlug}/bug.md`);
  console.log(`\n🔬 Reef-lite: để có gate evaluate trước khi commit:`);
  console.log(`   node .github/harness/scripts/auto-learn.mjs evaluate --bug ${bugSlug}`);
  console.log(`   node .github/harness/scripts/auto-learn.mjs commit --bug ${bugSlug}  # chỉ commit khi evaluate PASS`);
}

// ---------- Reef-lite: Serve → Observe → Grow → Commit ----------

function genRecordId() {
  const ts = Date.now().toString(36);
  const rnd = Math.random().toString(36).slice(2, 6);
  return `rec-${ts}-${rnd}`;
}

async function recordInteraction(opts, json=false) {
  const scenario = opts.scenario || opts.s || 'default';
  const prompt = opts.prompt || opts.p || opts.msg || '';
  const response = opts.response || opts.r || '';
  if (!prompt) {
    console.error('❌ Thiếu --prompt "mô tả interaction". Ví dụ: record --scenario "fix-rainbow" --prompt "sửa border xoay"');
    process.exit(1);
  }
  await fs.mkdir(RECORDS_DIR, { recursive: true });
  const id = genRecordId();
  const rec = {
    id,
    scenario,
    prompt: prompt.slice(0, 2000),
    response: response.slice(0, 2000),
    createdAt: new Date().toISOString(),
    meta: { file: opts.file || '', title: opts.title || '' }
  };
  await fs.writeFile(path.join(RECORDS_DIR, `${id}.json`), JSON.stringify(rec, null, 2), 'utf8');
  // also append to reports index for quick lookup
  if (json) console.log(JSON.stringify(rec, null, 2));
  else {
    console.log(`✅ Recorded interaction: ${id}`);
    console.log(`   scenario: ${scenario}`);
    console.log(`   prompt: ${prompt.slice(0, 80)}`);
    console.log(`   → report: node .github/harness/scripts/auto-learn.mjs report --references ${id} --score 1 --feedback "ok"`);
  }
  return id;
}

async function reportFeedback(opts, json=false) {
  const scoreRaw = opts.score;
  const feedback = opts.feedback || opts.msg || '';
  const refsRaw = opts.references || opts.refs || opts.receipt || opts.bug || '';
  const scenario = opts.scenario || opts.s || 'default';
  // allow --bug <slug> as shorthand for referencing a bug
  let references = [];
  let bugSlug = opts.bug || '';
  if (bugSlug && !refsRaw) {
    // find record ids linked to bug or just use bug slug as reference
    references = [bugSlug];
  } else if (refsRaw) {
    references = refsRaw.split(/[,\s]+/).filter(Boolean);
    // if refs contain bug slug pattern, keep as is
  }
  if (scoreRaw === undefined || scoreRaw === '') {
    console.error('❌ Thiếu --score <0..1>. Ví dụ: report --score 1 --feedback "pass" --references rec-xxx');
    process.exit(1);
  }
  const score = parseFloat(scoreRaw);
  if (isNaN(score) || score < 0 || score > 1) {
    console.error('❌ --score phải là số 0..1 (ví dụ 0, 0.5, 1)');
    process.exit(1);
  }
  if (references.length === 0) {
    console.error('❌ Thiếu --references <id> hoặc --bug <slug>. Ví dụ: --references rec-abc123 hoặc --bug 2026-08-30-xyz');
    process.exit(1);
  }
  await fs.mkdir(path.dirname(REPORTS_FILE), { recursive: true });
  // validate references exist (warn if not)
  for (const r of references) {
    const recPath = path.join(RECORDS_DIR, `${r}.json`);
    const bugPath = path.join(BUGS_DIR, r, 'bug.md');
    if (!existsSync(recPath) && !existsSync(bugPath) && !r.startsWith('rec-')) {
      console.warn(`⚠️  Reference "${r}" không tìm thấy trong records/ hay bugs/ — vẫn ghi nhưng nên kiểm tra.`);
    }
  }
  const entry = {
    ts: new Date().toISOString(),
    scenario,
    score,
    feedback: feedback.slice(0, 2000),
    references,
    bug: bugSlug || null
  };
  await fs.appendFile(REPORTS_FILE, JSON.stringify(entry) + '\n', 'utf8');
  // if bug slug provided, also append a note to bug.md
  if (bugSlug) {
    const bugPath = path.join(BUGS_DIR, bugSlug, 'bug.md');
    if (existsSync(bugPath)) {
      try {
        let bugText = await fs.readFile(bugPath, 'utf8');
        const note = `\n\n> 📊 Report ${entry.ts}: score=${score} feedback="${feedback.slice(0,80)}" refs=${references.join(',')}\n`;
        if (!bugText.includes(entry.ts)) {
          await fs.appendFile(bugPath, note, 'utf8');
        }
      } catch {}
    }
  }
  if (json) console.log(JSON.stringify(entry, null, 2));
  else {
    console.log(`✅ Reported feedback: score=${score} → ${references.join(', ')}`);
    if (feedback) console.log(`   feedback: ${feedback.slice(0, 100)}`);
    console.log(`   scenario: ${scenario}`);
    console.log(`   → evaluate: node .github/harness/scripts/auto-learn.mjs evaluate --bug ${bugSlug || references[0]}`);
  }
  return entry;
}

async function evaluateCandidate(bugSlug, json=false) {
  if (!bugSlug) {
    console.error('❌ Thiếu --bug <slug>. Ví dụ: evaluate --bug 2026-08-30-xyz');
    process.exit(1);
  }
  const bugPath = path.join(BUGS_DIR, bugSlug, 'bug.md');
  if (!existsSync(bugPath)) {
    console.error(`❌ Không tìm thấy ${path.relative(ROOT, bugPath)}`);
    process.exit(1);
  }
  const bugText = await fs.readFile(bugPath, 'utf8');
  const { kns } = await parseKNs();
  // extract title
  const titleM = bugText.match(/^#\s*Bug:\s*(.+)/m) || bugText.match(/Title:\s*(.+)/);
  const title = titleM ? titleM[1].trim().slice(0, 80) : bugSlug;
  // check Fix section filled
  const fixSection = bugText.match(/## 3\. Fix([\s\S]*?)## 4\./);
  const fixContent = fixSection ? fixSection[1].trim() : '';
  const hasFix = fixContent.length > 50 && !fixContent.includes('<Tiêu đề') && !fixContent.includes('Chưa điền');
  const hasApproach = /Approach:/i.test(bugText) && !/Approach:\s*Chưa điền/i.test(bugText);
  // check status
  const isFixed = /Status:\s*`?fixed`?/i.test(bugText) || /Status:\s*fixed/i.test(bugText);
  const isOpen = /Status:\s*`?open`?/i.test(bugText);
  // duplicate check via suggest
  const qTokens = tokenize(title);
  const idf = computeIDF(qTokens, kns);
  const scored = kns.map(kn => ({ ...kn, score: scoreKN(qTokens, title, kn, idf) }))
    .sort((a,b)=>b.score-a.score)
    .slice(0, 3);
  const topScore = scored[0]?.score || 0;
  const duplicateThreshold = 15; // tuned: >15 likely duplicate
  const isDuplicate = topScore >= duplicateThreshold;
  // reports for this bug
  let reports = [];
  try {
    if (existsSync(REPORTS_FILE)) {
      const lines = (await fs.readFile(REPORTS_FILE, 'utf8')).trim().split('\n').filter(Boolean);
      for (const l of lines) {
        try {
          const r = JSON.parse(l);
          if (r.references && r.references.includes(bugSlug) || r.bug === bugSlug) reports.push(r);
        } catch {}
      }
    }
  } catch {}
  const avgScore = reports.length ? (reports.reduce((s,r)=>s+r.score,0)/reports.length) : null;
  const hasPositiveReport = reports.some(r=>r.score >= 0.7);
  // gate logic: PASS if hasFix and not duplicate and (no reports or has positive)
  let decision = 'PASS';
  let reasons = [];
  if (!hasFix) { decision = 'FAIL'; reasons.push('Fix section chưa điền đủ (cần Approach + Files Changed)'); }
  if (isDuplicate) { decision = 'FAIL'; reasons.push(`Trùng KN hiện có: ${scored[0].id} score ${topScore} ≥ ${duplicateThreshold} — có thể đã có bài học tương tự`); }
  if (reports.length > 0 && !hasPositiveReport && avgScore !== null && avgScore < 0.5) {
    decision = 'FAIL'; reasons.push(`Reports điểm thấp avg ${avgScore.toFixed(2)} — chưa đủ bằng chứng fix tốt`);
  }
  if (isOpen && !isFixed && reports.length===0) {
    // allow PASS with warning if no reports but fix exists — reef-lite local doesn't require report
    reasons.push('Chưa có report — sẽ commit nhưng nên report --score để có version history đầy đủ');
  }
  if (decision === 'PASS' && reasons.length===0) reasons.push('Đủ điều kiện commit — không trùng, có fix, reports ok');
  const result = {
    bug: bugSlug,
    title,
    decision,
    reasons,
    checks: {
      hasFix,
      hasApproach,
      isFixed,
      isOpen,
      topDuplicate: scored[0] ? { id: scored[0].id, title: scored[0].title, score: topScore } : null,
      isDuplicate,
      reports: reports.length,
      avgScore,
      hasPositiveReport
    },
    scored: scored.map(s=>({ id:s.id, title:s.title, score:s.score })),
    nextId: `KN-${String(Math.max(0, ...kns.map(k=>parseInt(k.id.replace('KN-',''),10)))+1).padStart(3,'0')}`
  };
  if (json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    const icon = decision==='PASS' ? '✅' : '⛔';
    console.log(`${icon} Evaluate ${bugSlug} → ${decision}`);
    console.log(`   title: ${title}`);
    console.log(`   nextId: ${result.nextId}`);
    console.log(`   checks: hasFix=${hasFix} hasApproach=${hasApproach} isFixed=${isFixed} reports=${reports.length} avgScore=${avgScore!==null?avgScore.toFixed(2):'—'} duplicate=${isDuplicate ? scored[0].id+'('+topScore+')' : 'no'}`);
    if (scored.length) console.log(`   top KN: ${scored.map(s=>`${s.id}(${s.score})`).join(', ')}`);
    console.log(`   reasons:`);
    for (const r of reasons) console.log(`     - ${r}`);
    if (decision==='PASS') console.log(`\n→ Sẵn sàng commit: node .github/harness/scripts/auto-learn.mjs commit --bug ${bugSlug}`);
    else console.log(`\n→ Chưa commit được — hãy bổ sung fix/report hoặc kiểm tra trùng lặp.`);
  }
  return result;
}

async function commitCandidate(bugSlug, json=false) {
  if (!bugSlug) {
    console.error('❌ Thiếu --bug <slug>. Ví dụ: commit --bug 2026-08-30-xyz');
    process.exit(1);
  }
  // first evaluate
  const evalRes = await evaluateCandidate(bugSlug, false);
  if (evalRes.decision !== 'PASS') {
    console.log(`\n⛔ Commit bị chặn — evaluate = FAIL. Sửa theo reasons trên rồi thử lại.`);
    if (!json) process.exit(2);
    return { ...evalRes, committed: false };
  }
  // generate draft
  const bugPath = path.join(BUGS_DIR, bugSlug, 'bug.md');
  const bugText = await fs.readFile(bugPath, 'utf8');
  const { kns, raw } = await parseKNs();
  let maxId = 0;
  for (const k of kns) { const n=parseInt(k.id.replace('KN-',''),10); if(n>maxId) maxId=n; }
  const nextId = `KN-${String(maxId+1).padStart(3,'0')}`;
  const titleM = bugText.match(/^#\s*Bug:\s*(.+)/m) || bugText.match(/Title:\s*(.+)/);
  const title = titleM ? titleM[1].trim().slice(0,80) : bugSlug;
  const sevM = bugText.match(/Severity:\s*(\w+)/i);
  const severity = sevM ? sevM[1].toLowerCase() : 'major';
  const tagsM = bugText.match(/Tags:\s*([^\n]+)/);
  const tags = tagsM ? tagsM[1].trim().replace(/`/g,'') : 'process';
  const today = todayISO();
  const whyM = bugText.match(/Why 5.*?:\s*(.+)/) || bugText.match(/Root.*?:\s*(.+)/i);
  const root = whyM ? whyM[1].trim().slice(0,200) : 'Xem bug.md Root Cause';
  const fixM = bugText.match(/Approach:\s*(.+)/) || bugText.match(/Cách sửa:\s*(.+)/);
  const fix = fixM ? fixM[1].trim().slice(0,200) : 'Xem bug.md Fix';
  // create version snapshot before edit
  await fs.mkdir(VERSIONS_DIR, { recursive: true });
  const snapshotName = `${today}-${nextId}-${normalizeSlug(title).slice(0,20)}`;
  const snapshotPath = path.join(VERSIONS_DIR, `${snapshotName}.md`);
  try {
    const before = await fs.readFile(KNOWLEGED, 'utf8');
    await fs.writeFile(snapshotPath, before, 'utf8');
  } catch {}
  // build draft blocks
  const tableRow = `| ${nextId} | ${today} | ${title.slice(0,30)} | ${root.slice(0,30)} | ${title.slice(0,40)} | \`${tags.split(/\s+/).slice(0,3).join(' ')}\` |`;
  const detail = `### ${nextId} — ${title}

- **Ngày:** ${today}
- **Bug report:** \`.agent/bugs/${bugSlug}/bug.md\`
- **Severity:** ${severity}
- **Triệu chứng:** ${title} — xem bug.md Reproduce
- **Nguyên nhân gốc:** ${root}
- **Cách sửa:** ${fix}
- **Cách phòng tránh:**
  - Thêm checklist liên quan vào docs/knowleged.md Checklist phòng tránh chung
  - Chạy \`node .github/harness/scripts/auto-learn.mjs suggest "<từ khóa>"\` trước khi code tương tự
- **Tags:** ${tags}
- **Người ghi:** YUNIE / reef-lite commit
`;
  // append to knowleged.md: find table end and detail insertion point
  let text = await fs.readFile(KNOWLEGED, 'utf8');
  // 1) insert table row before the line that starts with "> Dòng ví dụ"
  if (text.includes('| KN-')) {
    // find last table row
    const lines = text.split('\n');
    let lastTableIdx = -1;
    for (let i=0;i<lines.length;i++) if (/^\|\s*KN-\d+/.test(lines[i])) lastTableIdx=i;
    if (lastTableIdx>=0) {
      lines.splice(lastTableIdx+1, 0, tableRow);
      text = lines.join('\n');
    }
  }
  // 2) insert detail before "<!-- Thêm bài học mới"
  const marker = '<!-- Thêm bài học mới';
  if (text.includes(marker)) {
    text = text.replace(marker, detail + '\n' + marker);
  } else {
    // fallback: append before Anti-patterns
    const apMarker = '## Anti-patterns';
    if (text.includes(apMarker)) text = text.replace(apMarker, detail + '\n' + apMarker);
    else text += '\n' + detail;
  }
  // 3) update UpdatedAt
  const nowISO = new Date().toISOString();
  if (text.includes('UpdatedAt:')) {
    text = text.replace(/UpdatedAt:\s*[^\n]+/, `UpdatedAt: ${nowISO} — ${nextId} added (${title.slice(0,30)})`);
  }
  await fs.writeFile(KNOWLEGED, text, 'utf8');
  // update bug.md status to fixed if not already
  try {
    let bugT = await fs.readFile(bugPath, 'utf8');
    if (bugT.includes('Status:** `open`') || bugT.includes('Status: `open`')) {
      bugT = bugT.replace(/Status:\s*`?open`?/i, 'Status: `fixed`');
      await fs.writeFile(bugPath, bugT, 'utf8');
    }
  } catch {}
  // write version meta
  const meta = {
    id: nextId,
    bug: bugSlug,
    title,
    committedAt: nowISO,
    snapshot: path.relative(ROOT, snapshotPath),
    eval: evalRes,
    tableRow,
    detail: detail.slice(0, 500)
  };
  await fs.writeFile(path.join(VERSIONS_DIR, `${snapshotName}.json`), JSON.stringify(meta, null, 2), 'utf8');
  if (json) console.log(JSON.stringify({ ...meta, committed: true }, null, 2));
  else {
    console.log(`\n✅ Committed ${nextId} từ ${bugSlug}`);
    console.log(`   snapshot: ${path.relative(ROOT, snapshotPath)}`);
    console.log(`   knowleged.md đã cập nhật — UpdatedAt: ${nowISO}`);
    console.log(`   → kiểm tra: node .github/harness/scripts/auto-learn.mjs status`);
    console.log(`   → history: node .github/harness/scripts/auto-learn.mjs history`);
  }
  return { ...meta, committed: true };
}

async function listVersions(json=false) {
  let files = [];
  try {
    const entries = await fs.readdir(VERSIONS_DIR, { withFileTypes:true });
    files = entries.filter(e=>e.isFile() && e.name.endsWith('.json')).map(e=>e.name).sort().reverse();
  } catch { files=[]; }
  const versions = [];
  for (const f of files.slice(0, 20)) {
    try {
      const j = JSON.parse(await fs.readFile(path.join(VERSIONS_DIR, f), 'utf8'));
      versions.push(j);
    } catch {}
  }
  if (json) { console.log(JSON.stringify({ total: files.length, versions }, null, 2)); return; }
  console.log(`📚 Versions — ${files.length} snapshots trong .agent/versions/`);
  if (versions.length===0) console.log('   (chưa có version nào — commit lần đầu sẽ tạo snapshot)');
  for (const v of versions.slice(0, 10)) {
    console.log(`  ${v.id} ← ${v.bug} @ ${v.committedAt.slice(0,10)} — ${v.title.slice(0,50)}`);
  }
  if (files.length>10) console.log(`   ... và ${files.length-10} version cũ hơn`);
}

async function showHistory(json=false) {
  let reports = [];
  try {
    if (existsSync(REPORTS_FILE)) {
      const lines = (await fs.readFile(REPORTS_FILE, 'utf8')).trim().split('\n').filter(Boolean);
      for (const l of lines.slice(-20)) {
        try { reports.push(JSON.parse(l)); } catch {}
      }
    }
  } catch {}
  let versions = [];
  try {
    const entries = await fs.readdir(VERSIONS_DIR, { withFileTypes:true });
    const jsons = entries.filter(e=>e.isFile() && e.name.endsWith('.json')).map(e=>e.name).sort().reverse().slice(0,10);
    for (const f of jsons) {
      try { versions.push(JSON.parse(await fs.readFile(path.join(VERSIONS_DIR, f), 'utf8'))); } catch {}
    }
  } catch {}
  let records = [];
  try {
    const entries = await fs.readdir(RECORDS_DIR, { withFileTypes:true });
    records = entries.filter(e=>e.isFile() && e.name.endsWith('.json')).map(e=>e.name).slice(-5);
  } catch {}
  if (json) { console.log(JSON.stringify({ reports: reports.slice(-10), versions: versions.slice(0,5), records }, null, 2)); return; }
  console.log(`🔄 Reef-lite History — Serve → Observe → Grow → Commit`);
  console.log(`\n  Serve (records): ${records.length} interactions trong .agent/records/`);
  if (records.length) console.log(`    → ${records.join(', ')}`);
  console.log(`\n  Observe (reports): ${reports.length} reports gần đây`);
  for (const r of reports.slice(-5)) {
    console.log(`    ${r.ts.slice(0,16)} score=${r.score} refs=${r.references.join(',')} — ${r.feedback.slice(0,50)}`);
  }
  if (reports.length===0) console.log('    (chưa có report — dùng: report --bug <slug> --score 1 --feedback "ok")');
  console.log(`\n  Grow → Commit (versions): ${versions.length} commits`);
  for (const v of versions.slice(0,5)) {
    console.log(`    ${v.committedAt.slice(0,16)} ${v.id} ← ${v.bug}`);
  }
  if (versions.length===0) console.log('    (chưa có commit — dùng: commit --bug <slug> sau khi evaluate PASS)');
  console.log(`\n💡 Loop: record → report → propose → evaluate → commit → versions`);
}

async function status(json=false) {
  const { kns } = await parseKNs();
  let bugs = [];
  let drafts = 0;
  try {
    const entries = await fs.readdir(BUGS_DIR, { withFileTypes:true });
    bugs = entries.filter(e=>e.isDirectory() && e.name !== '_template').map(e=>e.name);
    for (const b of bugs) {
      try {
        const t = await fs.readFile(path.join(BUGS_DIR, b, 'bug.md'), 'utf8');
        const isOpen = t.includes('Status:** `open`') || t.includes('Status: `open`') || t.includes('**Status:** open') || /-\s*\*\*Status:\*\*\s*open/i.test(t);
        if (isOpen) drafts++;
      } catch {}
    }
  } catch {}
  let lastUpdated = '';
  try {
    const raw = await fs.readFile(KNOWLEGED, 'utf8');
    const m = raw.match(/UpdatedAt:\s*([^\n]+)/);
    if (m) lastUpdated = m[1].trim();
  } catch {}
  const tagCount = {};
  for (const k of kns) for (const t of k.tags) tagCount[t]=(tagCount[t]||0)+1;
  const topTags = Object.entries(tagCount).sort((a,b)=>b[1]-a[1]).slice(0,5);
  // reef-lite counts
  let recordsCount = 0, reportsCount = 0, versionsCount = 0;
  try { const e = await fs.readdir(RECORDS_DIR, { withFileTypes:true }); recordsCount = e.filter(x=>x.isFile() && x.name.endsWith('.json')).length; } catch {}
  try { if (existsSync(REPORTS_FILE)) { const t=(await fs.readFile(REPORTS_FILE,'utf8')).trim(); reportsCount = t ? t.split('\n').filter(Boolean).length : 0; } } catch {}
  try { const e = await fs.readdir(VERSIONS_DIR, { withFileTypes:true }); versionsCount = e.filter(x=>x.isFile() && x.name.endsWith('.json')).length; } catch {}
  const out = { knTotal: kns.length, bugsTotal: bugs.length, drafts, lastUpdated, topTags, bugs: bugs.slice(0,10), kns: kns.map(k=>({id:k.id, title:k.title, tags:k.tags, severity:k.severity})), reefLite: { records: recordsCount, reports: reportsCount, versions: versionsCount } };
  if (json) { console.log(JSON.stringify(out, null, 2)); return; }
  console.log(`📊 Auto-Learn Status — ${new Date().toISOString()}`);
  console.log(`   KN: ${kns.length} bài học trong docs/knowleged.md ${lastUpdated ? `(UpdatedAt: ${lastUpdated})` : ''}`);
  if (kns.length) console.log(`      → ${kns.map(k=>k.id).join(', ')}`);
  if (topTags.length) console.log(`      top tags: ${topTags.map(([t,c])=>`${t}(${c})`).join(', ')}`);
  console.log(`   Bugs: ${bugs.length} trong .agent/bugs/ (${drafts} drafts auto-log)`);
  if (bugs.length) console.log(`      → ${bugs.slice(0,5).join(', ')}${bugs.length>5?' ...':''}`);
  console.log(`   Reef-lite: records=${recordsCount} reports=${reportsCount} versions=${versionsCount} (.agent/records/ + reports.jsonl + versions/)`);
  console.log(`   Health: ${kns.length>=5 ? '✅' : '⚠️'} ${kns.length>=5 ? 'đủ bài học' : 'cần thêm KN'} | ${drafts>0 ? `⚠️ ${drafts} draft chưa propose` : '✅ không có draft tồn'}`);
  console.log(`\n💡 Lệnh:`);
  console.log(`   suggest "từ khóa"  → gợi ý KN liên quan`);
  console.log(`   log --error "msg" --file "path" --title "tên" → tạo bug draft`);
  console.log(`   propose --bug <slug> → sinh KN draft`);
  console.log(`   record --prompt "mô tả" [--scenario name] → ghi interaction (Serve)`);
  console.log(`   report --score 0..1 --feedback "ok" --references <id> → ghi feedback (Observe)`);
  console.log(`   evaluate --bug <slug> → kiểm tra trước khi commit (Grow gate)`);
  console.log(`   commit --bug <slug> → evaluate PASS mới ghi knowleged.md + snapshot (Commit)`);
  console.log(`   history / versions → xem loop Serve→Commit`);
}

// ---------- CLI ----------
function parseArgs(argv) {
  const args = argv.slice(2);
  const cmd = args[0];
  const opts = {};
  let query = '';
  if (cmd === 'suggest') {
    // suggest "query with spaces" or suggest word1 word2
    const rest = args.slice(1);
    // handle --json, --top
    const qParts = [];
    for (let i=0;i<rest.length;i++) {
      if (rest[i]==='--json') opts.json=true;
      else if (rest[i]==='--top' || rest[i]==='--top_k') { opts.top = parseInt(rest[i+1],10); i++; }
      else if (rest[i].startsWith('--')) {}
      else qParts.push(rest[i]);
    }
    query = qParts.join(' ').replace(/^["']|["']$/g,'');
    return { cmd, query, opts };
  }
  // generic --key value
  for (let i=1;i<args.length;i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      const v = args[i+1] && !args[i+1].startsWith('--') ? args[i+1] : 'true';
      if (v!=='true') i++;
      opts[k]=v;
      if (k==='json') opts.json=true;
    }
  }
  return { cmd, query, opts };
}

async function main() {
  const { cmd, query, opts } = parseArgs(process.argv);
  if (!cmd || cmd==='help' || cmd==='--help' || cmd==='-h') {
    console.log(`Auto-Learn — hệ thống tự học hỏi tự động (reef-lite)

Usage:
  node .github/harness/scripts/auto-learn.mjs suggest "từ khóa" [--top 3] [--json]
  node .github/harness/scripts/auto-learn.mjs log --error "msg" --file "path" --title "tên" [--slug slug] 
  node .github/harness/scripts/auto-learn.mjs propose --bug <slug> [--json]
  node .github/harness/scripts/auto-learn.mjs status [--json]
  # Reef-lite (Serve → Observe → Grow → Commit):
  node .github/harness/scripts/auto-learn.mjs record --prompt "mô tả" [--scenario name] [--response "..."] [--json]
  node .github/harness/scripts/auto-learn.mjs report --score 0..1 --feedback "ok" --references <id> [--bug <slug>] [--scenario name] [--json]
  node .github/harness/scripts/auto-learn.mjs evaluate --bug <slug> [--json]
  node .github/harness/scripts/auto-learn.mjs commit --bug <slug> [--json]
  node .github/harness/scripts/auto-learn.mjs history [--json]
  node .github/harness/scripts/auto-learn.mjs versions [--json]

Examples:
  node .github/harness/scripts/auto-learn.mjs suggest "rainbow border không xoay"
  node .github/harness/scripts/auto-learn.mjs log --error "RZ9986 Techniques Blazor" --file "N5Blazor/Components/Pages/Home.razor" --title "mất dấu tiếng Việt"
  node .github/harness/scripts/auto-learn.mjs propose --bug 2026-08-30-mat-dau-tieng-viet
  node .github/harness/scripts/auto-learn.mjs record --prompt "sửa border xoay" --scenario fix-rainbow
  node .github/harness/scripts/auto-learn.mjs report --bug 2026-08-30-xyz --score 1 --feedback "pass"
  node .github/harness/scripts/auto-learn.mjs evaluate --bug 2026-08-30-xyz
  node .github/harness/scripts/auto-learn.mjs commit --bug 2026-08-30-xyz
  node .github/harness/scripts/auto-learn.mjs history

Flow tự động:
  1. Trước khi code → suggest "mô tả task" để xem KN liên quan
  2. Khi lỗi → log --error "..." để tạo bug draft
  3. Sau khi fix → propose --bug <slug> để sinh KN draft dán vào knowleged.md
  Reef-lite:
  4. Serve: record --prompt "..." → .agent/records/rec-xxx.json (x-reef-agent-record-id)
  5. Observe: report --score 1 --references rec-xxx → .agent/reports.jsonl
  6. Grow: evaluate --bug <slug> → gate (trùng? có fix? reports?)
  7. Commit: commit --bug <slug> → snapshot + append knowleged.md (chỉ khi PASS)
`);
    return;
  }
  try {
    if (cmd==='suggest') {
      if (!query) { console.error('❌ Thiếu query. Ví dụ: suggest "rainbow border"'); process.exit(1); }
      await suggest(query, opts.top||3, !!opts.json);
    } else if (cmd==='log') {
      await logBug(opts);
    } else if (cmd==='propose') {
      await propose(opts.bug || opts.slug, !!opts.json);
    } else if (cmd==='status') {
      await status(!!opts.json);
    } else if (cmd==='record') {
      await recordInteraction(opts, !!opts.json);
    } else if (cmd==='report') {
      await reportFeedback(opts, !!opts.json);
    } else if (cmd==='evaluate') {
      await evaluateCandidate(opts.bug || opts.slug, !!opts.json);
    } else if (cmd==='commit') {
      await commitCandidate(opts.bug || opts.slug, !!opts.json);
    } else if (cmd==='history') {
      await showHistory(!!opts.json);
    } else if (cmd==='versions') {
      await listVersions(!!opts.json);
    } else {
      console.error(`❌ Lệnh không biết: ${cmd}. Gõ --help để xem.`);
      process.exit(1);
    }
  } catch (e) {
    console.error(`❌ Lỗi: ${e.message}`);
    if (process.env.DEBUG) console.error(e.stack);
    process.exit(1);
  }
}

main();
