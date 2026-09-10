#!/usr/bin/env node
/**
 * entangle.mjs — Entanglement Graph (minimal): sửa 1 file thì kéo theo file nào?
 * Hiện thực hoá future card "Entanglement Graph" (www/cosmos):
 *   forward refs  = file trỏ tới ai (href/src/fetch/import trỏ tới file có thật)
 *   reverse refs  = ai trỏ tới nó (quét text toàn workspace, bỏ dir nặng)
 * 0 deps, Node 18+, chỉ đọc.
 *
 * Usage:
 *   node .github/harness/scripts/entangle.mjs --file www/cosmos/index.html
 *   node .github/harness/scripts/entangle.mjs --file www/cosmos/index.html --json
 *   node .github/harness/scripts/entangle.mjs --file www/cosmos/index.html --max 30
 * Exit: 0 OK · 1 file không tồn tại / thiếu --file.
 */
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
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

main().catch((e) => { console.error(e); process.exit(1); });
