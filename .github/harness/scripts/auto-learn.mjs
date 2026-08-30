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
}

async function status(json=false) {
  const { kns } = await parseKNs();
  let bugs = [];
  let drafts = 0;
  try {
    const entries = await fs.readdir(BUGS_DIR, { withFileTypes:true });
    bugs = entries.filter(e=>e.isDirectory() && e.name !== '_template').map(e=>e.name);
    // count drafts: only if Status is still open (not fixed) — Auto-log alone doesn't mean draft if already fixed
    for (const b of bugs) {
      try {
        const t = await fs.readFile(path.join(BUGS_DIR, b, 'bug.md'), 'utf8');
        const isOpen = t.includes('Status:** `open`') || t.includes('Status: `open`') || t.includes('**Status:** open') || /-\s*\*\*Status:\*\*\s*open/i.test(t);
        if (isOpen) drafts++;
      } catch {}
    }
  } catch {}
  // last updated from knowleged.md
  let lastUpdated = '';
  try {
    const raw = await fs.readFile(KNOWLEGED, 'utf8');
    const m = raw.match(/UpdatedAt:\s*([^\n]+)/);
    if (m) lastUpdated = m[1].trim();
  } catch {}
  // top tags
  const tagCount = {};
  for (const k of kns) for (const t of k.tags) tagCount[t]=(tagCount[t]||0)+1;
  const topTags = Object.entries(tagCount).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const out = { knTotal: kns.length, bugsTotal: bugs.length, drafts, lastUpdated, topTags, bugs: bugs.slice(0,10), kns: kns.map(k=>({id:k.id, title:k.title, tags:k.tags, severity:k.severity})) };
  if (json) { console.log(JSON.stringify(out, null, 2)); return; }
  console.log(`📊 Auto-Learn Status — ${new Date().toISOString()}`);
  console.log(`   KN: ${kns.length} bài học trong docs/knowleged.md ${lastUpdated ? `(UpdatedAt: ${lastUpdated})` : ''}`);
  if (kns.length) console.log(`      → ${kns.map(k=>k.id).join(', ')}`);
  if (topTags.length) console.log(`      top tags: ${topTags.map(([t,c])=>`${t}(${c})`).join(', ')}`);
  console.log(`   Bugs: ${bugs.length} trong .agent/bugs/ (${drafts} drafts auto-log)`);
  if (bugs.length) console.log(`      → ${bugs.slice(0,5).join(', ')}${bugs.length>5?' ...':''}`);
  console.log(`   Health: ${kns.length>=5 ? '✅' : '⚠️'} ${kns.length>=5 ? 'đủ bài học' : 'cần thêm KN'} | ${drafts>0 ? `⚠️ ${drafts} draft chưa propose` : '✅ không có draft tồn'}`);
  console.log(`\n💡 Lệnh:`);
  console.log(`   suggest "từ khóa"  → gợi ý KN liên quan`);
  console.log(`   log --error "msg" --file "path" --title "tên" → tạo bug draft`);
  console.log(`   propose --bug <slug> → sinh KN draft`);
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
    console.log(`Auto-Learn — hệ thống tự học hỏi tự động

Usage:
  node .github/harness/scripts/auto-learn.mjs suggest "từ khóa" [--top 3] [--json]
  node .github/harness/scripts/auto-learn.mjs log --error "msg" --file "path" --title "tên" [--slug slug] 
  node .github/harness/scripts/auto-learn.mjs propose --bug <slug> [--json]
  node .github/harness/scripts/auto-learn.mjs status [--json]

Examples:
  node .github/harness/scripts/auto-learn.mjs suggest "rainbow border không xoay"
  node .github/harness/scripts/auto-learn.mjs suggest "theme sáng contrast"
  node .github/harness/scripts/auto-learn.mjs log --error "RZ9986 Techniques Blazor" --file "N5Blazor/Components/Pages/Home.razor" --title "mất dấu tiếng Việt"
  node .github/harness/scripts/auto-learn.mjs propose --bug 2026-08-30-mat-dau-tieng-viet
  node .github/harness/scripts/auto-learn.mjs status

Flow tự động:
  1. Trước khi code → suggest "mô tả task" để xem KN liên quan
  2. Khi lỗi → log --error "..." để tạo bug draft
  3. Sau khi fix → propose --bug <slug> để sinh KN draft dán vào knowleged.md
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
