#!/usr/bin/env node
/**
 * Auto-Researcher — AAR for Harness v2
 * Inspired by Anthropic AAR paper 28/08/2026 (Chen Yueh-Han):
 *   Search → Propose → Train 30m → Keep effective
 * Áp vào Harness: suggest knowleged + library BM25 → propose 3 methods → benchmark → report
 * No deps, Node 18+
 * Usage:
 *   node auto-researcher.mjs --task "rainbow border không xoay" --top 3
 *   node auto-researcher.mjs --task "làm feature X" --top 3 --report
 *   node auto-researcher.mjs --task "xxx" --json
 */
import fs from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const GITHUB_DIR = path.resolve(__dirname, '..', '..');
const ROOT = path.resolve(GITHUB_DIR, '..');
const KNOWLEGED = path.join(ROOT, 'docs', 'knowleged.md');
const LIB_CANDIDATES = [
  path.join(ROOT, 'www', 'library', 'export.json'),
  path.join(__dirname, '..', '..', '..', 'www', 'library', 'export.json'),
  path.join(ROOT, 'www', 'library', 'library-export-2026-08-30.json'),
];

// ---------- tokenize (from auto-learn.mjs) ----------
function tokenize(text) {
  if (!text) return [];
  const lower = text.toLowerCase();
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
    idf[qt] = Math.log((N + 1) / (df + 1)) + 1;
  }
  return idf;
}
async function parseKNs() {
  let text = '';
  try { text = await fs.readFile(KNOWLEGED, 'utf8'); } catch (e) { return { kns: [], raw: '', error: e.message }; }
  text = text.replace(/\r\n/g, '\n');
  const kns = [];
  const parts = text.split(/^###\s*KN-/m);
  for (let i = 1; i < parts.length; i++) {
    const part = 'KN-' + parts[i];
    const firstNL = part.indexOf('\n');
    const firstLine = firstNL >= 0 ? part.slice(0, firstNL) : part;
    const m = firstLine.match(/KN-(\d+)\s*[—\-–]\s*(.+)/);
    if (!m) continue;
    const id = `KN-${m[1].padStart(3,'0')}`;
    if (m[1] === 'XXX' || /Tiêu đề ngắn gọn/.test(m[2])) continue;
    const title = m[2].trim();
    const block = firstNL >= 0 ? part.slice(firstNL + 1) : '';
    let tags = [];
    const tagsLineM = block.match(/Tags:\s*([^\n]+)/);
    if (tagsLineM) {
      const raw = tagsLineM[1];
      const bt = [...raw.matchAll(/`([^`]+)`/g)].map(x => x[1].trim());
      if (bt.length) tags = bt;
      else tags = raw.split(/[\s,]+/).filter(Boolean).map(t => t.replace(/`/g,'').trim()).filter(Boolean);
    }
    const sevM = block.match(/Severity:\s*(\w+)/i);
    const severity = sevM ? sevM[1].toLowerCase() : 'minor';
    const dateM = block.match(/Ngày:\s*([0-9\-]+)/);
    const date = dateM ? dateM[1] : '';
    let lesson = '';
    const lessonM = block.match(/Bài học[^:]*:\s*([^\n]+)/);
    if (lessonM) lesson = lessonM[1].trim().slice(0,200);
    else lesson = title.slice(0,120);
    const detail = block.slice(0, 2500);
    const tokens = tokenize(`${title} ${tags.join(' ')} ${lesson} ${detail}`);
    const titleTokens = tokenize(title);
    const tagTokens = tokenize(tags.join(' '));
    if (title.includes('Tiêu đề')) continue;
    kns.push({ id, title, tags, lesson, detail, severity, date, tokens, titleTokens, tagTokens, block: block.slice(0,600) });
  }
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
  if (titleLower.includes(qLower)) score += 3;
  if (detailLower.includes(qLower)) score += 1;
  for (const qt of queryTokens) {
    const w = idf ? (idf[qt] || 1) : 1;
    const cTitle = kn.titleTokens.filter(t=>t===qt || t.includes(qt) || qt.includes(t)).length;
    const cTag = kn.tagTokens.filter(t=>t===qt || t.includes(qt) || qt.includes(t)).length;
    const cAll = kn.tokens.filter(t=>t===qt || t.includes(qt) || qt.includes(t)).length;
    score += (cTitle * 1.5 + cTag * 2.0 + cAll * 0.5) * w;
    const qtNorm = qt.normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    if (qtNorm !== qt) {
      const cNorm = kn.tokens.filter(t=> t.normalize('NFD').replace(/[\u0300-\u036f]/g,'') === qtNorm).length;
      score += cNorm * 0.8 * w;
    }
  }
  return Math.round(score * 10) / 10;
}

// ---------- Library BM25 (from mcp-server.mjs) ----------
const STOPWORDS_LIB = new Set([
  'va','la','cua','các','cac','nhung','nhưng','voi','với','cho','trong','tren','trên','duoi','dưới','tu','từ','den','đến','de','để','da','đã','dang','đang','se','sẽ','thi','thì','ma','mà','neu','nếu','khi','tai','tại','ve','về','co','có','khong','không','mot','một','hai','ba','bon','năm','sau','truoc','trước','nay',
  'the','a','an','and','or','but','in','on','at','to','for','of','with','by','is','are','was','were','be','been','being','have','has','had','do','does','did','will','would','could','should','may','might','must','can','this','that','these','those','i','you','he','she','it','we','they','what','which','who','whom','where','when','why','how','all','any','both','each','few','more','most','other','some','such','no','nor','not','only','own','same','so','than','too','very','just','now'
]);
function tokenizeLib(text){
  return String(text).toLowerCase()
    .split(/[^a-z0-9àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]+/g)
    .filter(t=> t.length>=2 && !STOPWORDS_LIB.has(t));
}
const K1 = 1.2, B = 0.75;
function buildIndex(chunks, registry, enabledOnly=true){
  const enabledIds = enabledOnly ? new Set(Object.values(registry).filter(b=>b.enabled).map(b=>b.id)) : null;
  const docs = chunks.filter(c=> !enabledOnly || enabledIds.has(c.bookId)).map(c=>{
    const tokens = tokenizeLib(c.text);
    const tf = {};
    tokens.forEach(t=> tf[t]=(tf[t]||0)+1);
    return { ...c, tokens, tf, len: tokens.length };
  });
  const N = docs.length;
  if(N===0) return { docs:[], docFreq:{}, avgdl:0, N:0 };
  const docFreq = {};
  docs.forEach(d=>{
    const seen = new Set(Object.keys(d.tf));
    seen.forEach(t=> docFreq[t]=(docFreq[t]||0)+1);
  });
  const avgdl = docs.reduce((a,d)=>a+d.len,0)/N;
  return { docs, docFreq, avgdl, N };
}
function searchBM25(query, chunks, registry, top_k=5, enabledOnly=true){
  const idx = buildIndex(chunks, registry, enabledOnly);
  if(idx.N===0) return [];
  const qTokens = tokenizeLib(query);
  if(qTokens.length===0) return [];
  const { docs, docFreq, avgdl, N } = idx;
  const scored = docs.map(d=>{
    let score=0;
    qTokens.forEach(t=>{
      const tf = d.tf[t]||0;
      if(!tf) return;
      const df = docFreq[t]||0;
      const idf = Math.log(1 + (N - df + 0.5)/(df + 0.5));
      const denom = tf + K1 * (1 - B + B * (d.len/(avgdl||1)));
      score += idf * (tf*(K1+1))/denom;
    });
    return { doc:d, score };
  }).filter(x=>x.score>0)
    .sort((a,b)=>b.score-a.score)
    .slice(0, top_k)
    .map(({doc, score})=> ({
      bookId: doc.bookId,
      bookName: doc.bookName || doc.bookId,
      chunkId: doc.id || doc.chunkId,
      index: doc.index,
      page: doc.page,
      text: (doc.text||'').slice(0,600),
      snippet: (doc.text||'').slice(0,300) + ((doc.text||'').length>300?'…':''),
      score: Number(score.toFixed(3))
    }));
  return scored;
}
function loadLibrary() {
  for (const p of LIB_CANDIDATES) {
    if (existsSync(p)) {
      try {
        const raw = readFileSync(p, 'utf8');
        const j = JSON.parse(raw);
        const registry = j.registry || {};
        const chunks = j.chunks || [];
        // normalize registry: if array, convert
        let regObj = registry;
        if (Array.isArray(registry)) {
          regObj = {};
          registry.forEach(b=> { if(b.id) regObj[b.id]=b; });
        }
        // chunks may have bookName inside registry
        const enriched = chunks.map(c=>{
          const book = regObj[c.bookId] || {};
          return { ...c, bookName: c.bookName || book.name || c.bookId };
        });
        return { registry: regObj, chunks: enriched, file: p, missing: false };
      } catch (e) {
        return { registry: {}, chunks: [], file: p, error: e.message, missing: false };
      }
    }
  }
  return { registry: {}, chunks: [], file: LIB_CANDIDATES[0], missing: true };
}

// ---------- Propose 3 methods ----------
function proposeMethods(task, knHits, libHits) {
  const topKN = knHits[0];
  const topLib = libHits[0];
  const isUI = /ui|css|rainbow|glass|responsive|theme|contrast|animation|a11y|grid|border|hover/i.test(task);
  const isBuild = /build|dotnet|test|error|fail|lock/i.test(task);
  const methods = [];

  // A — Minimal fix (KN phòng tránh)
  methods.push({
    id: 'A',
    title: 'Minimal fix — Áp Cách phòng tránh từ KN',
    source: topKN ? `${topKN.id} · ${topKN.title} (score ${topKN.score})` : 'Không có KN liên quan — dùng checklist chung',
    description: topKN
      ? `Áp dụng **Cách phòng tránh** của ${topKN.id}: ${topKN.lesson.slice(0,120)}`
      : 'Áp checklist phòng tránh chung cuối knowleged.md (responsive, a11y, build)',
    steps: topKN
      ? [`Đọc chi tiết ${topKN.id} trong docs/knowleged.md`, `Áp Cách phòng tránh vào code`, `Verify bằng checklist của KN`]
      : ['Đọc docs/knowleged.md Checklist phòng tránh chung', 'Áp vào code', 'Verify build/test/get_errors'],
    pros: 'Nhanh, ít rủi ro, tránh lặp bug cũ',
    cons: 'Có thể chưa đủ nếu task mới hoàn toàn',
    when: 'Khi task chạm pattern đã từng lỗi',
  });

  // B — Polish + a11y (product-quality)
  methods.push({
    id: 'B',
    title: 'Polish + a11y — Theo product-quality',
    source: 'product-quality.instructions.md + KN-002/KN-006',
    description: isUI
      ? 'Làm đẹp + UX: palette 3-5 màu, spacing 4/8, responsive 375/768/1280, states hover/focus/active, animation 150-300ms, contrast ≥4.5:1'
      : 'Chất lượng product: build/test pass, error/empty/loading states, a11y, không hardcode',
    steps: isUI
      ? ['Design system: CSS variables, palette, typography', 'Responsive 375/768/1280', 'States + animation + a11y audit']
      : ['Thêm states đầy đủ', 'A11y audit', 'Verify build/test'],
    pros: 'Đẹp, bền, đúng chuẩn Harness',
    cons: 'Tốn thêm 20-30% thời gian',
    when: 'Khi task có UI hoặc cần polish',
  });

  // C — Library-inspired
  methods.push({
    id: 'C',
    title: 'Library-inspired — Dùng kiến thức từ sách',
    source: topLib ? `${topLib.bookName} · chunk #${topLib.index} · page ${topLib.page} · score ${topLib.score}` : 'Không tìm thấy trong thư viện — dùng alternative approach',
    description: topLib
      ? `Theo "${topLib.bookName}" (chunk #${topLib.index}): "${topLib.snippet.slice(0,120)}…"`
      : 'Không có hit thư viện → đề xuất alternative: thử approach khác (vd: đổi lib, đổi pattern) và benchmark',
    steps: topLib
      ? [`Đọc chunk #${topLib.index} trang ${topLib.page}`, `Trích pattern vào design`, `Implement + citation`]
      : ['Brainstorm 2 alternative approaches', 'Chọn 1 ít rủi ro nhất', 'Implement + benchmark'],
    pros: topLib ? 'Có grounding, không bịa' : 'Khám phá hướng mới',
    cons: topLib ? 'Cần verify snippet có liên quan thật' : 'Chưa có citation',
    when: topLib ? 'Khi thư viện có kiến thức liên quan' : 'Khi muốn thử hướng mới',
  });

  return methods;
}

function benchmarkChecklist(task) {
  const isUI = /ui|css|rainbow|glass|responsive|theme|contrast|animation|a11y|grid|border|hover|www|styles/i.test(task);
  const isAnim = /rainbow|animation|conic|angle|rotate/i.test(task);
  const checks = [
    { id: 'build', label: 'dotnet build pass (không MSB3027 file lock — KN-008)', required: true },
    { id: 'test', label: 'dotnet test pass', required: true },
    { id: 'errors', label: 'get_errors 0', required: true },
    { id: 'how', label: 'Grader check HOW not just WHETHER (học từ HF incident)', required: true },
  ];
  if (isUI) {
    checks.push({ id: 'responsive', label: 'Responsive 375/768/1280 không vỡ (KN-002/KN-004)', required: true });
    checks.push({ id: 'a11y', label: 'Contrast ≥4.5:1, keyboard, aria-label (KN-006)', required: true });
    checks.push({ id: 'states', label: 'States: hover/focus/active/disabled/loading + empty/error', required: false });
  }
  if (isAnim) {
    checks.push({ id: 'angle', label: 'Đo --angle bằng Playwright trước/sau 500ms (KN-003/KN-004)', required: true });
  }
  checks.push({ id: 'no-hack', label: 'Không reward hacking — không hardcode để qua test', required: true });
  checks.push({ id: 'safe-stop', label: 'Có safe stop nếu task impossible (học từ HF)', required: false });
  return checks;
}

function slugify(s) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').slice(0,40) || 'task';
}

// ---------- CLI ----------
function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = { task: '', top: 3, report: false, json: false, help: false };
  for (let i=0;i<args.length;i++) {
    const a = args[i];
    if (a==='--task' && args[i+1]) { opts.task = args[++i]; }
    else if (a==='--top' && args[i+1]) { opts.top = parseInt(args[++i],10)||3; }
    else if (a==='--report') opts.report = true;
    else if (a==='--json') opts.json = true;
    else if (a==='--help' || a==='-h') opts.help = true;
    else if (!a.startsWith('--') && !opts.task) opts.task = a;
  }
  return opts;
}

function helpText() {
  return `
Auto-Researcher — AAR for Harness v2 (Anthropic 28/08/2026)

Usage:
  node auto-researcher.mjs --task "mô tả task" [--top 3] [--report] [--json]
  node auto-researcher.mjs "mô tả task" --top 3 --report

Options:
  --task <string>  Mô tả task (bắt buộc)
  --top <n>        Số KN + library hits (mặc định 3)
  --report         Sinh markdown report tại .agent/plans/aar-harness/report-<slug>.md
  --json           Output JSON (cho YUNIE/www)
  --help           Hiện help

Workflow (như paper AAR):
  1. Suggest knowleged.md (BM25-lite + IDF)
  2. Library search (BM25 local, 303 chunks)
  3. Propose 3 methods (A: KN, B: product-quality, C: library)
  4. Benchmark checklist (HOW not just WHETHER)
  5. Report + recommendation

Examples:
  node .github/harness/scripts/auto-researcher.mjs --task "rainbow border không xoay" --top 3
  node .github/harness/scripts/auto-researcher.mjs --task "làm web pomodoro" --top 3 --report --json
`.trim();
}

async function main() {
  const opts = parseArgs(process.argv);
  if (opts.help || !opts.task) {
    console.log(helpText());
    if (!opts.task) {
      console.error('\n❌ Thiếu --task. Ví dụ: --task "rainbow border không xoay"');
      process.exit(1);
    }
    return;
  }
  const task = opts.task;
  const topK = opts.top;

  // 1. Suggest KN
  const { kns, error: knErr } = await parseKNs();
  let knHits = [];
  if (!knErr && kns.length>0) {
    const qTokens = tokenize(task);
    if (qTokens.length===0) qTokens.push(...task.toLowerCase().split(/\s+/).filter(Boolean));
    const idf = computeIDF(qTokens, kns);
    knHits = kns.map(kn=> ({...kn, score: scoreKN(qTokens, task, kn, idf)}))
      .filter(k=>k.score>0)
      .sort((a,b)=>b.score-a.score)
      .slice(0, topK);
  }

  // 2. Library search
  const lib = loadLibrary();
  let libHits = [];
  if (!lib.missing && !lib.error && lib.chunks.length>0) {
    libHits = searchBM25(task, lib.chunks, lib.registry, topK, true);
  }

  // 3. Propose
  const methods = proposeMethods(task, knHits, libHits);
  const checks = benchmarkChecklist(task);

  // 4. Recommendation (simple heuristic: prefer A if KN score high, else B if UI, else C if lib hit)
  let recommended = 'A';
  if (knHits.length>0 && knHits[0].score >= 8) recommended = 'A';
  else if (/ui|css|www|responsive|theme/i.test(task)) recommended = 'B';
  else if (libHits.length>0 && libHits[0].score >= 5) recommended = 'C';
  else if (knHits.length===0 && libHits.length===0) recommended = 'B';

  const result = {
    task,
    topK,
    generatedAt: new Date().toISOString(),
    generatedBy: 'auto-researcher.mjs (AAR for Harness v2)',
    paper: 'Anthropic AAR 28/08/2026 — Automated Researchers Can Reliably Mitigate Alignment Failures',
    warningShot: 'OpenAI HF incident 26/08/2026 — benchmark phải check HOW not just WHETHER',
    knowleged: { total: kns.length, hits: knHits.map(k=>({ id:k.id, title:k.title, tags:k.tags, severity:k.severity, score:k.score, lesson:k.lesson.slice(0,120), snippet:k.block.slice(0,150).replace(/\n/g,' ') })) },
    library: { file: lib.file, totalChunks: lib.chunks.length, enabledBooks: Object.values(lib.registry).filter(b=>b.enabled).length, hits: libHits, missing: lib.missing, error: lib.error || null },
    propose: methods,
    benchmark: checks,
    recommendation: { keep: recommended, reason: methods.find(m=>m.id===recommended)?.description.slice(0,120) || '' },
  };

  if (opts.json) {
    console.log(JSON.stringify(result, null, 2));
    if (opts.report) {
      const slug = slugify(task);
      const outDir = path.join(ROOT, '.agent', 'plans', 'aar-harness');
      await fs.mkdir(outDir, { recursive: true });
      const outPath = path.join(outDir, `report-${slug}.md`);
      const md = toMarkdown(result);
      await fs.writeFile(outPath, md, 'utf8');
      console.error(`\n📄 Report: ${path.relative(ROOT, outPath)}`);
    }
    return;
  }

  // Human readable
  console.log(`\n🔬 Auto-Researcher — AAR for Harness v2`);
  console.log(`   Task: "${task}" | top ${topK} | ${new Date().toISOString()}`);
  console.log(`   Paper: Anthropic AAR 28/08/2026 · Warning shot: OpenAI HF 26/08/2026\n`);

  console.log(`📚 1. Suggest — knowleged.md (${kns.length} KN):`);
  if (knErr) console.log(`   ⚠️  ${knErr}`);
  else if (knHits.length===0) console.log(`   → Không tìm thấy KN liên quan (đã scan ${kns.length} KN). Gợi ý: thử từ khóa khác hoặc thêm KN mới.`);
  else knHits.forEach(k=>{
    console.log(`   [${k.id}] score ${k.score} — ${k.title} (${k.severity}, ${k.tags.join(' ')||'no-tags'})`);
    console.log(`       → ${k.lesson.slice(0,100)}`);
  });

  console.log(`\n📖 2. Library — ${lib.missing ? '⚠️  export.json missing' : `${lib.chunks.length} chunks, ${Object.values(lib.registry).filter(b=>b.enabled).length} books enabled` } (${lib.file}):`);
  if (lib.missing) console.log(`   → Mở www/library/index.html → bấm Xuất để tạo export.json`);
  else if (lib.error) console.log(`   ⚠️  ${lib.error}`);
  else if (libHits.length===0) console.log(`   → Không tìm thấy trong thư viện (đã search ${lib.chunks.length} chunks).`);
  else libHits.forEach(h=>{
    console.log(`   "${h.bookName}" · chunk #${h.index} · page ${h.page} · score ${h.score}`);
    console.log(`       → ${h.snippet.slice(0,120)}…`);
  });

  console.log(`\n💡 3. Propose — 3 methods (keep best, discard rest):`);
  methods.forEach(m=>{
    const star = m.id===recommended ? '⭐ KEEP' : '  ';
    console.log(`   ${star} [${m.id}] ${m.title}`);
    console.log(`       Source: ${m.source}`);
    console.log(`       → ${m.description.slice(0,120)}`);
    console.log(`       Steps: ${m.steps.join(' → ')}`);
  });

  console.log(`\n✅ 4. Benchmark checklist (HOW not just WHETHER):`);
  checks.forEach(c=>{
    console.log(`   [ ] ${c.label}${c.required ? ' (required)' : ''}`);
  });

  console.log(`\n🎯 5. Recommendation: KEEP Method ${recommended} — ${methods.find(m=>m.id===recommended).title}`);
  console.log(`   Reason: ${methods.find(m=>m.id===recommended).description.slice(0,100)}`);
  console.log(`\n💡 Next: Implement Method ${recommended} todo-driven (tdd-gate) → benchmark → nếu fail thì thử method khác (max 3).`);
  console.log(`   Tip: node auto-researcher.mjs --task "${task}" --top 3 --report  → sinh .agent/plans/aar-harness/report-${slugify(task)}.md`);

  if (opts.report) {
    const slug = slugify(task);
    const outDir = path.join(ROOT, '.agent', 'plans', 'aar-harness');
    await fs.mkdir(outDir, { recursive: true });
    const outPath = path.join(outDir, `report-${slug}.md`);
    const md = toMarkdown(result);
    await fs.writeFile(outPath, md, 'utf8');
    console.log(`\n📄 Report saved: ${path.relative(ROOT, outPath)}`);
  }
}

function toMarkdown(r) {
  const knLines = r.knowleged.hits.length
    ? r.knowleged.hits.map(k=>`- **[${k.id}]** score ${k.score} — ${k.title} (${k.severity}, ${k.tags.join(' ')||'no-tags'})\n  - ${k.lesson}\n  - snippet: ${k.snippet}…`).join('\n')
    : `Không tìm thấy KN liên quan (đã scan ${r.knowleged.total} KN).`;
  const libLines = r.library.missing
    ? `⚠️ export.json missing (${r.library.file}) — mở www/library/index.html → Xuất`
    : r.library.hits.length
      ? r.library.hits.map(h=>`- **"${h.bookName}"** · chunk #${h.index} · page ${h.page} · score ${h.score}\n  > ${h.snippet}…`).join('\n')
      : `Không tìm thấy trong thư viện (${r.library.totalChunks} chunks).`;
  const methodLines = r.propose.map(m=>{
    const star = m.id===r.recommendation.keep ? '⭐ **KEEP**' : '';
    return `### [${m.id}] ${m.title} ${star}\n- **Source:** ${m.source}\n- **Mô tả:** ${m.description}\n- **Steps:** ${m.steps.join(' → ')}\n- **Pros:** ${m.pros} | **Cons:** ${m.cons}\n- **When:** ${m.when}`;
  }).join('\n\n');
  const checkLines = r.benchmark.map(c=>`- [ ] ${c.label}${c.required ? ' **(required)**' : ''}`).join('\n');
  return `# AAR Report — ${r.task}

> Generated: ${r.generatedAt} by ${r.generatedBy}
> Paper: ${r.paper}
> Warning shot: ${r.warningShot}

## 1. Suggest — knowleged.md (top ${r.topK})

${knLines}

## 2. Library — BM25 (${r.library.totalChunks} chunks)

${libLines}
- File: \`${r.library.file}\`

## 3. Propose — 3 methods

${methodLines}

## 4. Benchmark checklist

${checkLines}

> Học từ HF incident: benchmark phải check **HOW** (cách làm) không chỉ **WHETHER** (có pass không). Không reward hacking.

## 5. Recommendation

**KEEP Method ${r.recommendation.keep}** — ${r.propose.find(m=>m.id===r.recommendation.keep).title}

Reason: ${r.recommendation.reason}

Next: Implement Method ${r.recommendation.keep} todo-driven (tdd-gate) → benchmark → nếu fail thử method khác (max 3).

---
*Auto-Researcher — AAR for Harness v2. Process > Model. $4/h vs $150/h.*
`;
}

main().catch(e=>{ console.error('❌', e.message); console.error(e.stack); process.exit(1); });
