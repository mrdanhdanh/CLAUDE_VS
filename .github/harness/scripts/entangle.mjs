#!/usr/bin/env node
/**
 * entangle.mjs — Entanglement Graph: sửa 1 file thì kéo theo file nào?
 * Hiện thực hoá future card "Entanglement Graph" + "Cosmic Web" (www/cosmos):
 *   --file  : forward refs (file trỏ tới ai) + reverse refs (ai trỏ tới nó)
 *   --graph : Cosmic Web v2 — 1-pass scan toàn repo → vẽ cấu trúc lớn:
 *             hub       = ≥10 reverse refs      → sửa là phải test rộng
 *             cluster   = đổi cùng nhau ≥3 lần   (git co-change) → gộp 1 plan
 *             dead      = www/ 0 ref, không entrypoint → grep rồi xoá (minimal-ladder)
 * 0 deps, Node 18+, chỉ đọc (trừ file --out).
 *
 * Usage:
 *   node .github/harness/scripts/entangle.mjs --file www/cosmos/index.html
 *   node .github/harness/scripts/entangle.mjs --file www/cosmos/index.html --json
 *   node .github/harness/scripts/entangle.mjs --file www/cosmos/index.html --max 30
 *   node .github/harness/scripts/entangle.mjs --graph [--json] [--out www/cosmos/graph.json] [--max N]
 * Exit: 0 OK · 1 file không tồn tại / thiếu --file.
 */
import fs from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const GITHUB_DIR = path.resolve(__dirname, '..', '..'); // .github/harness/scripts → .github
const ROOT = path.resolve(GITHUB_DIR, '..');            // → repo root

const SCAN_EXT = new Set(['.html', '.css', '.js', '.mjs', '.ts', '.json', '.md', '.yml', '.yaml', '.razor', '.cs', '.ps1', '.txt']);
const SKIP_DIRS = new Set(['node_modules', '.git', 'bin', 'obj', 'publish', 'test-results', 'playwright-report', '.vs', 'dist', 'build', 'books', 'library', 'tmp']);
const DOT_DIRS_KEEP = new Set(['.github', '.agent', '.vscode']);
// basename quá phổ biến — reverse refs chỉ dùng basename khi đủ đặc trưng
const GENERIC_BASENAMES = new Set(['index.html', 'index.js', 'index.mjs', 'index.css', 'style.css', 'styles.css', 'app.js', 'app.css', 'main.js', 'README.md', 'package.json', 'SKILL.md']);
const MAX_FILE_BYTES = 512 * 1024;

const rel = (p) => path.relative(ROOT, p).replace(/\\/g, '/');

async function* walk(dir, depth = 0) {
  if (depth > 14) return;
  let entries;
  try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      if (e.name.startsWith('.') && !DOT_DIRS_KEEP.has(e.name)) continue;
      yield* walk(path.join(dir, e.name), depth + 1);
    } else if (SCAN_EXT.has(path.extname(e.name).toLowerCase())) {
      yield path.join(dir, e.name);
    }
  }
}

// Forward refs — chuỗi trong quotes trông như đường dẫn file & tồn tại thật
function forwardRefs(targetAbs, content) {
  const dir = path.dirname(targetAbs);
  const found = new Map();
  const QUOTED = /['"`]([^'"`\n]{1,180})['"`]/g;
  let m;
  while ((m = QUOTED.exec(content))) {
    let ref = m[1].trim();
    if (!ref || /[\s<>{}]/.test(ref)) continue;
    ref = ref.split('#')[0].split('?')[0];
    if (!ref || /^[./]+$/.test(ref)) continue;
    if (/^(https?:)?\/\//.test(ref) || ref.startsWith('data:') || ref.startsWith('mailto:')) continue;
    const ext = path.extname(ref).toLowerCase();
    const looksPath = ref.startsWith('./') || ref.startsWith('../') || ref.includes('/') || SCAN_EXT.has(ext);
    if (!looksPath) continue;
    let cand;
    if (ref.startsWith('.')) cand = path.resolve(dir, ref);
    else if (ref.includes('/')) cand = path.resolve(ROOT, ref);
    else { const a = path.resolve(dir, ref); cand = existsSync(a) ? a : path.resolve(ROOT, ref); }
    if (!existsSync(cand)) continue;
    try { if (statSync(cand).isDirectory()) continue; } catch { continue; } // ref trỏ tới thư mục (vd "www/") — không phải file
    const r = rel(cand);
    if (r === rel(targetAbs)) continue; // self-ref
    if (!found.has(r)) found.set(r, m[1].trim());
  }
  return [...found.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([p, ref]) => ({ path: p, ref }));
}

// Reverse refs — ai chứa needle (path chuẩn / dir+basename / basename đặc trưng)
async function reverseRefs(targetAbs, needles) {
  const needleArr = [...needles];
  const hits = [];
  for await (const file of walk(ROOT)) {
    if (path.resolve(file) === path.resolve(targetAbs)) continue;
    let stat;
    try { stat = await fs.stat(file); } catch { continue; }
    if (stat.size > MAX_FILE_BYTES) continue;
    let content;
    try { content = await fs.readFile(file, 'utf8'); } catch { continue; }
    const lines = content.split('\n');
    let count = 0, firstLine = 0;
    for (let i = 0; i < lines.length; i++) {
      if (needleArr.some((n) => lines[i].includes(n))) { count++; if (!firstLine) firstLine = i + 1; }
    }
    if (count) hits.push({ file: rel(file), line: firstLine, count });
  }
  hits.sort((a, b) => b.count - a.count || a.file.localeCompare(b.file));
  return hits;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--graph')) return runGraph(args);
  const fi = args.indexOf('--file');
  const fileArg = fi !== -1 ? args[fi + 1] : null;
  const asJson = args.includes('--json');
  const mi = args.indexOf('--max');
  const max = mi !== -1 && args[mi + 1] ? Number(args[mi + 1]) : 20;

  if (!fileArg) { console.error('Usage: entangle.mjs --file <path> [--json] [--max N]'); process.exit(1); }
  const targetAbs = path.resolve(ROOT, fileArg);
  if (!existsSync(targetAbs)) { console.error('⛔ Không thấy file: ' + fileArg); process.exit(1); }

  const targetRel = rel(targetAbs);
  const base = path.basename(targetAbs);
  const parentDir = path.basename(path.dirname(targetAbs));
  const needles = new Set([targetRel, parentDir + '/' + base]);
  if (!GENERIC_BASENAMES.has(base)) needles.add(base);

  let content = '';
  try { content = await fs.readFile(targetAbs, 'utf8'); } catch {}
  const forward = forwardRefs(targetAbs, content);
  const reverse = await reverseRefs(targetAbs, needles);
  const result = { file: targetRel, counts: { forward: forward.length, reverse: reverse.length }, forward, reverse: reverse.slice(0, max) };

  if (asJson) { console.log(JSON.stringify(result, null, 2)); return; }

  console.log('🔗 ENTANGLE — ' + targetRel);
  console.log('');
  console.log('→ Forward refs (' + forward.length + ') — nó trỏ tới:');
  if (!forward.length) console.log('   (không thấy ref nội bộ nào)');
  for (const f of forward) console.log('   ' + f.path + '   ‹ ' + f.ref + ' ›');
  console.log('');
  console.log('← Reverse refs (' + reverse.length + ' file) — ai trỏ tới nó (sửa file này là entanglement vỡ ở đây):');
  if (!reverse.length) console.log('   (không ai tham chiếu — file mồ côi?)');
  for (const r of reverse.slice(0, max)) console.log('   ' + r.file + ':' + r.line + (r.count > 1 ? ' (+' + (r.count - 1) + ' dòng khác)' : ''));
  if (reverse.length > max) console.log('   … +' + (reverse.length - max) + ' file nữa (--max để xem thêm)');
  console.log('');
  console.log('Verify gợi ý: get_errors + test trên CẢ cụm refs ở trên — không chỉ file vừa sửa.');
}

// ===== Graph mode — Cosmic Web (entangle v2) =====
const HUB_MIN = 10;          // ≥10 reverse refs = hub: sửa là phải test rộng
const CO_CHANGE_MIN = 3;     // ≥3 lần cùng commit = cluster: gộp 1 plan
const CO_CHANGE_COMMITS = 400;
const GLUE_MIN = 6;          // file đổi cùng ≥6 nhóm khác nhau = "keo dính" — bỏ khỏi cluster (chống mega-merge)
const DEAD_SCOPE = 'www/';   // dead filament chỉ xét www/ (Pages-served) — nơi code chết thực sự quan trọng
const DEAD_EXT = new Set(['.html', '.css', '.js', '.mjs']);
// data generated — bỏ làm NGUỒN ref (tránh edge giả: audit.json chứa path đã sửa, graph.json chứa mọi path)
const GENERATED_FILES = new Set([
  'www/status.json', 'www/cosmos/scale.json', 'www/cosmos/audit.json', 'www/cosmos/graph.json', 'www/ai-news/ai-news.json',
]);
// token "đặc trưng" (có . - _) — dùng chống false-positive dead filament do load động (registry id, string lệnh)
const TOKEN_RE = /[A-Za-z0-9][A-Za-z0-9._-]{3,}/g;
const TOKEN_DISTINCTIVE = /[._-]/;

function pathSkipped(relPath) {
  const segs = relPath.split('/');
  for (let i = 0; i < segs.length - 1; i++) {
    const s = segs[i];
    if (SKIP_DIRS.has(s)) return true;
    if (s.startsWith('.') && !DOT_DIRS_KEEP.has(s)) return true;
  }
  return false;
}

// 1-pass: mọi file quét MỘT lần → edge list (thay vì reverseRefs O(n²) per file)
// + thu token đặc trưng toàn repo → chống false-positive dead filament (file load động / nhắc trong string)
async function scanGraph() {
  const allFiles = [];
  const edges = [];
  const tokenHit = new Map(); // token → { count, last } (last = file gần nhất chứa token)
  for await (const file of walk(ROOT)) {
    const r = rel(file);
    allFiles.push(r);
    if (GENERATED_FILES.has(r)) continue; // không đọc file generated làm nguồn
    let content;
    try {
      const st = await fs.stat(file);
      if (st.size > MAX_FILE_BYTES) continue;
      content = await fs.readFile(file, 'utf8');
    } catch { continue; }
    for (const f of forwardRefs(file, content)) edges.push({ from: r, to: f.path });
    for (const tok of content.match(TOKEN_RE) || []) {
      if (!TOKEN_DISTINCTIVE.test(tok)) continue;
      const k = tok.toLowerCase();
      const e = tokenHit.get(k);
      if (e) { e.count++; e.last = r; } else tokenHit.set(k, { count: 1, last: r });
    }
  }
  return { allFiles, edges, tokenHit };
}

// cụm file hay đổi cùng nhau (git co-change) → gộp 1 plan
function gitClusters() {
  let out;
  try {
    out = execFileSync('git', ['log', '--name-only', '--no-merges', '--pretty=format:@@C@@', '-n', String(CO_CHANGE_COMMITS)], {
      cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
    });
  } catch { return { clusters: [], commitsScanned: 0 }; }
  const commits = [];
  let cur = null;
  for (const raw of out.split('\n')) {
    const line = raw.trim();
    if (line === '@@C@@') { cur = new Set(); commits.push(cur); continue; }
    if (!line || !cur) continue;
    const p = line.replace(/\\/g, '/');
    if (!SCAN_EXT.has(path.extname(p).toLowerCase())) continue;
    if (pathSkipped(p)) continue;
    if (GENERATED_FILES.has(p)) continue;
    if (p.startsWith('.agent/plans/') || p.startsWith('.agent/bugs/')) continue;
    cur.add(p);
  }
  const pairCount = new Map();
  const pk = (a, b) => (a < b ? a + '\u0000' + b : b + '\u0000' + a);
  for (const set of commits) {
    const arr = [...set];
    if (arr.length < 2 || arr.length > 25) continue; // bỏ commit khổng lồ (merge regen) — tránh O(n²)
    for (let i = 0; i < arr.length; i++) for (let j = i + 1; j < arr.length; j++) {
      const k = pk(arr[i], arr[j]);
      pairCount.set(k, (pairCount.get(k) || 0) + 1);
    }
  }
  // union-find trên các cặp đủ mạnh, BỎ file "keo dính" (đổi cùng ≥GLUE_MIN nhóm) — chống mega-merge
  const strongPairs = [...pairCount.entries()].filter(([, c]) => c >= CO_CHANGE_MIN);
  const pairDegree = new Map();
  for (const [k] of strongPairs) {
    const [a, b] = k.split('\u0000');
    pairDegree.set(a, (pairDegree.get(a) || 0) + 1);
    pairDegree.set(b, (pairDegree.get(b) || 0) + 1);
  }
  const parent = new Map();
  const find = (x) => { while (parent.get(x) !== x) { parent.set(x, parent.get(parent.get(x))); x = parent.get(x); } return x; };
  const union = (a, b) => { parent.set(find(a), find(b)); };
  const members = new Set();
  for (const [k] of strongPairs) {
    const [a, b] = k.split('\u0000');
    if ((pairDegree.get(a) || 0) >= GLUE_MIN || (pairDegree.get(b) || 0) >= GLUE_MIN) continue;
    for (const x of [a, b]) { if (!parent.has(x)) parent.set(x, x); members.add(x); }
    union(a, b);
  }
  const groups = new Map();
  for (const m of members) {
    const r = find(m);
    if (!groups.has(r)) groups.set(r, []);
    groups.get(r).push(m);
  }
  const clusters = [];
  for (const [, files] of groups) {
    if (files.length < 3) continue;
    let w = 0;
    for (let i = 0; i < files.length; i++) for (let j = i + 1; j < files.length; j++) {
      const c = pairCount.get(pk(files[i], files[j]));
      if (c && c > w) w = c;
    }
    clusters.push({ files: files.sort(), weight: w });
  }
  clusters.sort((a, b) => b.weight - a.weight || a.files[0].localeCompare(b.files[0]));
  return { clusters: clusters.slice(0, 5), commitsScanned: commits.length };
}

async function runGraph(args) {
  const asJson = args.includes('--json');
  const oi = args.indexOf('--out');
  const outPath = oi !== -1 && args[oi + 1] ? path.resolve(ROOT, args[oi + 1]) : null;
  const mi = args.indexOf('--max');
  const max = mi !== -1 && args[mi + 1] ? Number(args[mi + 1]) : 20;

  const { allFiles, edges, tokenHit } = await scanGraph();
  const indeg = new Map();
  for (const e of edges) indeg.set(e.to, (indeg.get(e.to) || 0) + 1);

  const hubs = [...indeg.entries()]
    .filter(([file, c]) => c >= HUB_MIN && !file.includes('/vendor/'))
    .map(([file, refs]) => ({ file, refs }))
    .sort((a, b) => b.refs - a.refs || a.file.localeCompare(b.file))
    .slice(0, max);

  // dead = 0 path-ref VÀ không xuất hiện như token đặc trưng ở file khác (chống false-positive load động)
  const tokenReferencedElsewhere = (f) => {
    for (const t of [path.basename(f).toLowerCase(), path.basename(f, path.extname(f)).toLowerCase()]) {
      const e = tokenHit.get(t);
      if (e && !(e.count === 1 && e.last === f)) return true;
    }
    return false;
  };
  const deadFilaments = allFiles
    .filter((f) => f.startsWith(DEAD_SCOPE) && DEAD_EXT.has(path.extname(f).toLowerCase()))
    .filter((f) => path.basename(f) !== 'index.html')
    .filter((f) => (indeg.get(f) || 0) === 0)
    .filter((f) => !tokenReferencedElsewhere(f))
    .sort();

  const git = gitClusters();
  const result = {
    generatedAt: new Date().toISOString(),
    generatedBy: 'entangle.mjs --graph',
    scanned: { files: allFiles.length, edges: edges.length, commits: git.commitsScanned },
    thresholds: { hubMinRefs: HUB_MIN, coChangeMin: CO_CHANGE_MIN },
    hubs,
    clusters: git.clusters,
    deadFilaments,
    counts: { hubs: hubs.length, clusters: git.clusters.length, deadFilaments: deadFilaments.length },
  };

  if (outPath) {
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await fs.writeFile(outPath, JSON.stringify(result, null, 2) + '\n', 'utf8');
  }
  if (asJson || outPath) { console.log(JSON.stringify(result, null, 2)); return; }

  console.log('🕸️ COSMIC WEB — ' + result.scanned.files + ' files · ' + result.scanned.edges + ' edges · ' + result.scanned.commits + ' commits');
  console.log('');
  console.log('🌌 Hubs (≥' + HUB_MIN + ' refs) — sửa là phải test rộng (' + hubs.length + '):');
  if (!hubs.length) console.log('   (không có hub — không file nào được ref dày đặc)');
  for (const h of hubs) console.log('   ' + h.file + '   ' + h.refs + ' refs');
  console.log('');
  console.log('🧩 Clusters (đổi cùng nhau ≥' + CO_CHANGE_MIN + ' lần) — gộp 1 plan (' + result.counts.clusters + '):');
  if (!result.counts.clusters) console.log('   (không có cụm ≥3 file — files đổi tương đối độc lập)');
  for (const c of result.clusters) console.log('   [×' + c.weight + '] ' + c.files.join(' · '));
  console.log('');
  console.log('🪶 Dead filaments (www/, 0 ref) — grep usage rồi xoá (minimal-ladder) (' + deadFilaments.length + '):');
  if (!deadFilaments.length) console.log('   ✅ không có — mọi file www/ đều được trỏ tới');
  for (const d of deadFilaments) console.log('   ' + d);
  console.log('');
  console.log('Hành động: hub ⇒ entangle --file + test rộng · cluster ⇒ gộp 1 plan · dead ⇒ grep usage rồi xoá.');
}

main().catch((e) => { console.error(e); process.exit(1); });
