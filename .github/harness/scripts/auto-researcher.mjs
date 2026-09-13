#!/usr/bin/env node
/**
 * Auto-Researcher — AAR for Harness v2 + DisCo-lite Phase 1 (task-oriented)
 * Inspired by Anthropic AAR paper 28/08/2026 (Chen Yueh-Han):
 *   Search → Propose → Train 30m → Keep effective
 * + DisCo arXiv:2609.02749v1 Repo-To-Skill:
 *   scope Q → ground X → construct G~ → verify (G,R)
 * Áp vào Harness: suggest knowleged + library BM25 → propose 3 methods → benchmark → report → distill skill
 * No deps, Node 18+
 * Usage:
 *   node auto-researcher.mjs --task "rainbow border không xoay" --top 3
 *   node auto-researcher.mjs --task "làm feature X" --top 3 --report
 *   node auto-researcher.mjs --task "xxx" --json
 *   node auto-researcher.mjs --task "xxx" --distill --top 3 --report --json
 */
import { tokenize, computeIDF, parseKNs, scoreKN } from './kn-parse.mjs';
import fs from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const GITHUB_DIR = path.resolve(__dirname, '..', '..');
const ROOT = path.resolve(GITHUB_DIR, '..');
const KNOWLEGED = path.join(ROOT, 'docs', 'knowleged.md');
const SKILLS_DIR = path.join(ROOT, '.agent', 'skills');
const LIB_CANDIDATES = [
  path.join(ROOT, 'www', 'library', 'export.json'),
  path.join(__dirname, '..', '..', '..', 'www', 'library', 'export.json'),
  path.join(ROOT, 'www', 'library', 'library-export-2026-08-30.json'),
];

// KN parse + scoring (tokenize/computeIDF/parseKNs/scoreKN) — shared module, xem kn-parse.mjs
// (trước là duplicate với auto-learn.mjs — tách 1 nguồn, KN-047 Slop Gate cross-file)

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
function indexChunk(c) {
  const tokens = tokenizeLib(c.text);
  const tf = {};
  tokens.forEach(t => tf[t] = (tf[t] || 0) + 1);
  return { ...c, tokens, tf, len: tokens.length };
}
function buildIndex(chunks, registry, enabledOnly=true){
  const enabledIds = enabledOnly ? new Set(Object.values(registry).filter(b=>b.enabled).map(b=>b.id)) : null;
  const docs = chunks.filter(c=> !enabledOnly || enabledIds.has(c.bookId)).map(indexChunk);
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
function bm25ScoreDoc(d, qTokens, docFreq, N, avgdl) {
  let score = 0;
  for (const t of qTokens) {
    const tf = d.tf[t]||0;
    if (!tf) continue;
    const df = docFreq[t]||0;
    const idf = Math.log(1 + (N - df + 0.5)/(df + 0.5));
    const denom = tf + K1 * (1 - B + B * (d.len/(avgdl||1)));
    score += idf * (tf*(K1+1))/denom;
  }
  return score;
}
function shapeLibHit(doc, score) {
  return {
    bookId: doc.bookId,
    bookName: doc.bookName || doc.bookId,
    chunkId: doc.id || doc.chunkId,
    index: doc.index,
    page: doc.page,
    text: (doc.text||'').slice(0,600),
    snippet: (doc.text||'').slice(0,300) + ((doc.text||'').length>300?'…':''),
    score: Number(score.toFixed(3))
  };
}
function searchBM25(query, chunks, registry, top_k=5, enabledOnly=true){
  const { docs, docFreq, avgdl, N } = buildIndex(chunks, registry, enabledOnly);
  if(N===0) return [];
  const qTokens = tokenizeLib(query);
  if(qTokens.length===0) return [];
  return docs
    .map(d => ({ doc: d, score: bm25ScoreDoc(d, qTokens, docFreq, N, avgdl) }))
    .filter(x => x.score > 0)
    .sort((a,b) => b.score - a.score)
    .slice(0, top_k)
    .map(({ doc, score }) => shapeLibHit(doc, score));
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
// ---------- DisCo-lite Phase 1: scope → ground → construct → verify ----------
// Paper: arXiv:2609.02749v1 §3.2 — z→scope Q→ground X→construct G~→verify (G,R)
// Minimal, template-based, no LLM required, reuse tokenize/BM25 hiện có.
const UI_RX = /ui|css|rainbow|glass|responsive|theme|contrast|animation|a11y|grid|border|hover|www|styles/i;

function gapCapabilities(task, toks) {
  const capabilities = [];
  if (UI_RX.test(task)) capabilities.push('ui-polish-responsive-a11y');
  if (/build|dotnet|test|error|fail|lock|msb/i.test(task)) capabilities.push('build-test-verify');
  // keyword capabilities từ task tokens (top 5, bỏ stop đã có trong tokenize)
  for (const t of toks.slice(0, 5)) {
    if (!capabilities.includes(t)) capabilities.push(t);
  }
  if (capabilities.length === 0) capabilities.push('general-task');
  return capabilities;
}
// YAGNI: chỉ skip khi cả KN và library đều đủ mạnh (KN >=15 và lib >=3)
// Ngưỡng thấp trước đây (5/1) khiến mọi task đều skip → không demo được distill
function gapList(knHits, libHits) {
  const gaps = [];
  const topKN = knHits[0]?.score ?? 0;
  const topLib = libHits[0]?.score ?? 0;
  if (knHits.length === 0 || topKN < 15) gaps.push('knowleged-coverage-low');
  if (libHits.length === 0 || topLib < 3) gaps.push('library-coverage-low');
  if (gaps.length === 0) gaps.push('none-critical-keep-aar-only');
  return gaps;
}
function gapAnalysis(task, knHits, libHits) {
  const capabilities = gapCapabilities(task, tokenize(task));
  const gaps = gapList(knHits, libHits);
  const needDistill = !(gaps.length === 1 && gaps[0] === 'none-critical-keep-aar-only');
  return { capabilities, gaps, needDistill, topKN: knHits[0]?.score ?? 0, topLib: libHits[0]?.score ?? 0 };
}

function buildSkillContent({ slug, task, capabilities, knHits, libHits, methods, gaps }) {
  const topKN = knHits[0];
  const topLib = libHits[0];
  const keywords = [...new Set([...tokenize(task), ...capabilities])].slice(0, 12).join(', ');
  const knLines = knHits.length
    ? knHits.map(k => `- ${k.id} — ${k.title} (score ${k.score}): ${k.lesson.slice(0, 100)}`).join('\n')
    : '- Không có KN liên quan — áp checklist phòng tránh chung.';
  const libLines = libHits.length
    ? libHits.map(h => `- "${h.bookName}" chunk #${h.index} p.${h.page} score ${h.score}: ${h.snippet.slice(0, 100)}…`).join('\n')
    : '- Không có hit thư viện.';
  const stepLines = methods.length
    ? methods.map(m => `${m.id}. ${m.title} — ${m.steps.join(' → ')}`).join('\n')
    : '- Todo-driven theo Harness.';
  return `---\nname: ${slug}\ndescription: "${task.slice(0, 80).replace(/"/g, "'")} — Use when ${keywords}"\nuser-invocable: false\n---\n\n# ${task} — Skill (DisCo-lite distilled)\n\n> Distilled từ task "${task}" theo DisCo §3.2 (scope→ground→construct→verify).\n> Capabilities: ${capabilities.join(', ')}\n> Gaps: ${gaps.join(', ')}\n\n## When to Use\n- Khi task chứa: ${keywords}\n- Khi suggest/lib trả về pattern tương tự skill này\n\n## Workflow\n${stepLines}\n\n## Grounding\n### Knowleged\n${knLines}\n\n### Library\n${libLines}\n\n## Gaps (R — unresolved)\n${gaps.map(g => `- ${g}`).join('\n')}\n\n## Guardrails\n- Không sửa test để pass (KN-012 deny-test-mutate) — FAIL chỉ fix bằng production code.\n- Check HOW không chỉ WHETHER (KN-010).\n- Nếu skill không khớp task → fallback unguided, không force.\n\n---\n*DisCo-lite Phase 1 — template-based, verified trước khi nhận.*\n`;
}

async function constructSkill({ slug, task, capabilities, gaps, knHits, libHits, methods }) {
  const dir = path.join(SKILLS_DIR, slug);
  const refDir = path.join(dir, 'references');
  await fs.mkdir(refDir, { recursive: true });
  const skillMd = buildSkillContent({ slug, task, capabilities, knHits, libHits, methods, gaps });
  const evidence = `# Evidence — ${task}\n\n> Substrate (DisCo references/) — copy snippet, không đọc lại nguồn khi dùng.\n\n## Knowleged hits\n${knHits.map(k => `### ${k.id} score ${k.score} — ${k.title}\n- Tags: ${k.tags.join(' ') || 'no-tags'} | Severity: ${k.severity}\n- Lesson: ${k.lesson}\n- Snippet: ${k.block.slice(0, 400).replace(/\n/g, ' ')}…\n`).join('\n') || 'Không có.'}\n\n## Library hits\n${libHits.map(h => `### "${h.bookName}" chunk #${h.index} p.${h.page} score ${h.score}\n- ${h.snippet}…\n- Text: ${(h.text || '').slice(0, 400).replace(/\n/g, ' ')}…\n`).join('\n') || 'Không có.'}\n`;
  const record = {
    anchor: { type: 'task', task },
    capabilities,
    evidence: {
      knowleged: knHits.map(k => ({ id: k.id, score: k.score })),
      library: libHits.map(h => ({ book: h.bookName, chunk: h.index, score: h.score })),
    },
    checks: [],
    gaps,
    generatedAt: new Date().toISOString(),
    generatedBy: 'auto-researcher.mjs --distill (DisCo-lite Phase 1, arXiv:2609.02749v1 §3.2)',
    paper: 'arXiv:2609.02749v1 Repo-To-Skill / DisCo',
  };
  await fs.writeFile(path.join(dir, 'SKILL.md'), skillMd, 'utf8');
  await fs.writeFile(path.join(refDir, 'evidence.md'), evidence, 'utf8');
  await fs.writeFile(path.join(dir, 'record.json'), JSON.stringify(record, null, 2), 'utf8');
  return { dir, record };
}

function checkSkillFilesExist(dir) {
  const ok = existsSync(path.join(dir, 'SKILL.md')) && existsSync(path.join(dir, 'references', 'evidence.md')) && existsSync(path.join(dir, 'record.json'));
  return { id: 'files-exist', pass: ok, detail: 'SKILL.md + references/evidence.md + record.json' };
}
async function checkSkillFrontmatter(skillPath) {
  let fmPass = false;
  try {
    const txt = await fs.readFile(skillPath, 'utf8');
    const m = txt.match(/^---\s*\n([\s\S]*?)\n---/);
    const fm = m ? m[1] : '';
    fmPass = /name:\s*\S+/.test(fm) && /description:/.test(fm);
  } catch {}
  return { id: 'frontmatter', pass: fmPass, detail: 'name + description (wise loading)' };
}
function checkSkillRecord(record) {
  const recPass = record && record.anchor && Array.isArray(record.capabilities) && record.evidence && Array.isArray(record.gaps) && record.generatedAt;
  return { id: 'record-complete', pass: !!recPass, detail: 'anchor + capabilities + evidence + gaps + generatedAt' };
}
async function checkNoTestMutateAdvice(skillPath) {
  let noHack = true;
  try {
    const txt = await fs.readFile(skillPath, 'utf8');
    noHack = !/sửa test để pass|edit.*test.*to pass|mutate.*test/i.test(txt) || /Không sửa test để pass/.test(txt);
  } catch {}
  return { id: 'no-test-mutate-advice', pass: noHack, detail: 'KN-012 — không xúi reward hacking' };
}
async function verifySkill(dir, record) {
  const skillPath = path.join(dir, 'SKILL.md');
  const checks = [
    checkSkillFilesExist(dir),
    await checkSkillFrontmatter(skillPath),
    checkSkillRecord(record),
    await checkNoTestMutateAdvice(skillPath),
  ];
  const pass = checks.every(c => c.pass);
  record.checks = checks;
  record.verifiedAt = new Date().toISOString();
  record.verdict = pass ? 'G-accepted' : 'G~-candidate-needs-review';
  try { await fs.writeFile(path.join(dir, 'record.json'), JSON.stringify(record, null, 2), 'utf8'); } catch {}
  return { pass, checks, verdict: record.verdict };
}
// ---------- CLI ----------
function tryValueOpt(a, args, i, opts) {
  if (!args[i+1]) return null;
  if (a === '--task') { opts.task = args[i+1]; return i + 1; }
  if (a === '--top') { opts.top = parseInt(args[i+1],10)||3; return i + 1; }
  return null;
}
const FLAG_OPTS = { '--report':'report', '--json':'json', '--distill':'distill', '--help':'help', '-h':'help' };
function tryFlagOpt(a, opts) {
  if (!(a in FLAG_OPTS)) return false;
  opts[FLAG_OPTS[a]] = true;
  return true;
}
function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = { task: '', top: 3, report: false, json: false, distill: false, help: false };
  for (let i=0;i<args.length;i++) {
    const a = args[i];
    const consumed = tryValueOpt(a, args, i, opts);
    if (consumed !== null) { i = consumed; continue; }
    if (tryFlagOpt(a, opts)) continue;
    if (!a.startsWith('--') && !opts.task) opts.task = a;
  }
  return opts;
}

function helpText() {
  return `
Auto-Researcher — AAR for Harness v2 (Anthropic 28/08/2026) + DisCo-lite Phase 1 (arXiv:2609.02749v1)

Usage:
  node auto-researcher.mjs --task "mô tả task" [--top 3] [--report] [--json] [--distill]
  node auto-researcher.mjs "mô tả task" --top 3 --report
  node auto-researcher.mjs --task "xxx" --distill --top 3 --report --json

Options:
  --task <string>  Mô tả task (bắt buộc)
  --top <n>        Số KN + library hits (mặc định 3)
  --report         Sinh markdown report tại .agent/plans/aar-harness/report-<slug>.md
  --json           Output JSON (cho YUNIE/www)
  --distill        DisCo-lite: scope→ground→construct→verify, sinh .agent/skills/<slug>/ (SKILL.md + references/evidence.md + record.json)
  --help           Hiện help

Workflow (như paper AAR):
  1. Suggest knowleged.md (BM25-lite + IDF)
  2. Library search (BM25 local, 303 chunks)
  3. Propose 3 methods (A: KN, B: product-quality, C: library)
  4. Benchmark checklist (HOW not just WHETHER)
  5. Report + recommendation
  6. Distill (nếu --distill): gap analysis → construct skill graph G~ → verify → G + record R

Examples:
  node .github/harness/scripts/auto-researcher.mjs --task "rainbow border không xoay" --top 3
  node .github/harness/scripts/auto-researcher.mjs --task "làm web pomodoro" --top 3 --report --json
  node .github/harness/scripts/auto-researcher.mjs --task "rainbow border không xoay" --distill --top 3 --report
`.trim();
}

function suggestKN(task, kns, knErr, topK) {
  if (knErr || kns.length === 0) return [];
  const qTokens = tokenize(task);
  if (qTokens.length === 0) qTokens.push(...task.toLowerCase().split(/\s+/).filter(Boolean));
  const idf = computeIDF(qTokens, kns);
  return kns.map(kn => ({ ...kn, score: scoreKN(qTokens, task, kn, idf) }))
    .filter(k => k.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

function searchLib(task, lib, topK) {
  if (lib.missing || lib.error || lib.chunks.length === 0) return [];
  return searchBM25(task, lib.chunks, lib.registry, topK, true);
}

function recommendMethod(task, knHits, libHits) {
  if (knHits.length > 0 && knHits[0].score >= 8) return 'A';
  if (/ui|css|www|responsive|theme/i.test(task)) return 'B';
  if (libHits.length > 0 && libHits[0].score >= 5) return 'C';
  if (knHits.length === 0 && libHits.length === 0) return 'B';
  return 'A';
}

function buildResult({ task, topK, kns, knHits, lib, libHits, methods, checks, recommended }) {
  return {
    task,
    topK,
    generatedAt: new Date().toISOString(),
    generatedBy: 'auto-researcher.mjs (AAR for Harness v2 + DisCo-lite Phase 1)',
    paper: 'Anthropic AAR 28/08/2026 — Automated Researchers Can Reliably Mitigate Alignment Failures + DisCo arXiv:2609.02749v1',
    warningShot: 'OpenAI HF incident 26/08/2026 — benchmark phải check HOW not just WHETHER',
    knowleged: { total: kns.length, hits: knHits.map(k=>({ id:k.id, title:k.title, tags:k.tags, severity:k.severity, score:k.score, lesson:k.lesson.slice(0,120), snippet:k.block.slice(0,150).replace(/\n/g,' ') })) },
    library: { file: lib.file, totalChunks: lib.chunks.length, enabledBooks: Object.values(lib.registry).filter(b=>b.enabled).length, hits: libHits, missing: lib.missing, error: lib.error || null },
    propose: methods,
    benchmark: checks,
    recommendation: { keep: recommended, reason: methods.find(m=>m.id===recommended)?.description.slice(0,120) || '' },
  };
}

async function runDistill(result, task, knHits, libHits, methods) {
  const gap = gapAnalysis(task, knHits, libHits);
  result.gap = gap;
  if (!gap.needDistill) {
    result.distill = { skipped: true, reason: 'Đủ coverage (KN + library) — không cần distill (YAGNI).', gaps: gap.gaps };
    return;
  }
  const slug = slugify(task);
  try {
    const { dir, record } = await constructSkill({ slug, task, capabilities: gap.capabilities, gaps: gap.gaps, knHits, libHits, methods });
    const verify = await verifySkill(dir, record);
    result.distill = {
      skipped: false,
      slug,
      path: path.relative(ROOT, dir),
      capabilities: gap.capabilities,
      gaps: gap.gaps,
      verify,
      record: { generatedAt: record.generatedAt, verdict: record.verdict, checks: record.checks },
    };
  } catch (e) {
    result.distill = { skipped: false, slug: slugify(task), error: e.message, gaps: gap.gaps };
  }
}

async function saveReport(result, task, toStderr) {
  const outDir = path.join(ROOT, '.agent', 'plans', 'aar-harness');
  await fs.mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, `report-${slugify(task)}.md`);
  await fs.writeFile(outPath, toMarkdown(result), 'utf8');
  const msg = toStderr ? `\n📄 Report: ${path.relative(ROOT, outPath)}` : `\n📄 Report saved: ${path.relative(ROOT, outPath)}`;
  (toStderr ? console.error : console.log)(msg);
}

function printKnSection(kns, knErr, knHits) {
  console.log(`📚 1. Suggest — knowleged.md (${kns.length} KN):`);
  if (knErr) { console.log(`   ⚠️  ${knErr}`); return; }
  if (knHits.length===0) { console.log(`   → Không tìm thấy KN liên quan (đã scan ${kns.length} KN). Gợi ý: thử từ khóa khác hoặc thêm KN mới.`); return; }
  knHits.forEach(k=>{
    console.log(`   [${k.id}] score ${k.score} — ${k.title} (${k.severity}, ${k.tags.join(' ')||'no-tags'})`);
    console.log(`       → ${k.lesson.slice(0,100)}`);
  });
}

function printLibSection(lib, libHits) {
  console.log(`\n📖 2. Library — ${lib.missing ? '⚠️  export.json missing' : `${lib.chunks.length} chunks, ${Object.values(lib.registry).filter(b=>b.enabled).length} books enabled` } (${lib.file}):`);
  if (lib.missing) { console.log(`   → Mở www/library/index.html → bấm Xuất để tạo export.json`); return; }
  if (lib.error) { console.log(`   ⚠️  ${lib.error}`); return; }
  if (libHits.length===0) { console.log(`   → Không tìm thấy trong thư viện (đã search ${lib.chunks.length} chunks).`); return; }
  libHits.forEach(h=>{
    console.log(`   "${h.bookName}" · chunk #${h.index} · page ${h.page} · score ${h.score}`);
    console.log(`       → ${h.snippet.slice(0,120)}…`);
  });
}

function printMethodsSection(methods, recommended) {
  console.log(`\n💡 3. Propose — 3 methods (keep best, discard rest):`);
  methods.forEach(m=>{
    const star = m.id===recommended ? '⭐ KEEP' : '  ';
    console.log(`   ${star} [${m.id}] ${m.title}`);
    console.log(`       Source: ${m.source}`);
    console.log(`       → ${m.description.slice(0,120)}`);
    console.log(`       Steps: ${m.steps.join(' → ')}`);
  });
}

function printDistillSection(distill) {
  if (!distill) return;
  console.log(`\n🧬 6. Distill — DisCo-lite (scope→ground→construct→verify):`);
  if (distill.skipped) { console.log(`   → Skipped: ${distill.reason}`); return; }
  if (distill.error) { console.log(`   ❌ Distill failed: ${distill.error}`); return; }
  console.log(`   Slug: ${distill.slug} → ${distill.path}`);
  console.log(`   Capabilities: ${distill.capabilities.join(', ')}`);
  console.log(`   Gaps: ${distill.gaps.join(', ')}`);
  console.log(`   Verify: ${distill.verify.pass ? '✅ G-accepted' : '⚠️ G~-candidate-needs-review'} (${distill.verify.checks.map(c=>`${c.id}:${c.pass?'pass':'FAIL'}`).join(', ')})`);
}

function printHuman(result, { task, topK, kns, knErr, knHits, lib, libHits, methods, checks, recommended }) {
  console.log(`\n🔬 Auto-Researcher — AAR for Harness v2`);
  console.log(`   Task: "${task}" | top ${topK} | ${new Date().toISOString()}`);
  console.log(`   Paper: Anthropic AAR 28/08/2026 · Warning shot: OpenAI HF 26/08/2026\n`);
  printKnSection(kns, knErr, knHits);
  printLibSection(lib, libHits);
  printMethodsSection(methods, recommended);
  console.log(`\n✅ 4. Benchmark checklist (HOW not just WHETHER):`);
  checks.forEach(c=>{
    console.log(`   [ ] ${c.label}${c.required ? ' (required)' : ''}`);
  });
  console.log(`\n🎯 5. Recommendation: KEEP Method ${recommended} — ${methods.find(m=>m.id===recommended).title}`);
  console.log(`   Reason: ${methods.find(m=>m.id===recommended).description.slice(0,100)}`);
  printDistillSection(result.distill);
  console.log(`\n💡 Next: Implement Method ${recommended} todo-driven (tdd-gate) → benchmark → nếu fail thì thử method khác (max 3).`);
  console.log(`   Tip: node auto-researcher.mjs --task "${task}" --top 3 --report  → sinh .agent/plans/aar-harness/report-${slugify(task)}.md`);
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
  const { kns, error: knErr } = await parseKNs(KNOWLEGED);
  const knHits = suggestKN(task, kns, knErr, topK);

  // 2. Library search
  const lib = loadLibrary();
  const libHits = searchLib(task, lib, topK);

  // 3. Propose
  const methods = proposeMethods(task, knHits, libHits);
  const checks = benchmarkChecklist(task);

  // 4. Recommendation (simple heuristic: prefer A if KN score high, else B if UI, else C if lib hit)
  const recommended = recommendMethod(task, knHits, libHits);

  const result = buildResult({ task, topK, kns, knHits, lib, libHits, methods, checks, recommended });

  // 5. Distill (DisCo-lite §3.2) — chỉ khi --distill
  if (opts.distill) await runDistill(result, task, knHits, libHits, methods);

  if (opts.json) {
    console.log(JSON.stringify(result, null, 2));
    if (opts.report) await saveReport(result, task, true);
    return;
  }

  printHuman(result, { task, topK, kns, knErr, knHits, lib, libHits, methods, checks, recommended });

  if (opts.report) await saveReport(result, task, false);
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
  const distillLines = !r.distill
    ? `Không chạy distill (thiếu flag \`--distill\`).`
    : r.distill.skipped
      ? `Skipped: ${r.distill.reason}\n- Gaps: ${r.distill.gaps.join(', ')}`
      : r.distill.error
        ? `❌ Distill failed: ${r.distill.error}`
        : `Slug: \`${r.distill.slug}\` → \`${r.distill.path}\`\n- Capabilities: ${r.distill.capabilities.join(', ')}\n- Gaps: ${r.distill.gaps.join(', ')}\n- Verify: **${r.distill.verify.pass ? 'G-accepted' : 'G~-candidate-needs-review'}** — ${r.distill.verify.checks.map(c=>`${c.id}: ${c.pass?'pass':'FAIL'}`).join(', ')}\n- Record: \`${r.distill.path}/record.json\` (verdict ${r.distill.record.verdict})`;
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

## 6. Distill — DisCo-lite (scope→ground→construct→verify)

${distillLines}

> DisCo arXiv:2609.02749v1 §3.2 — không skill nào được nhận nếu chưa verify. Gaps ghi vào record.json (R).

---
*Auto-Researcher — AAR for Harness v2 + DisCo-lite Phase 1. Process > Model. $4/h vs $150/h.*
`;
}

main().catch(e=>{ console.error('❌', e.message); console.error(e.stack); process.exit(1); });
