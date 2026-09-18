#!/usr/bin/env node
/**
 * kn-review.check.mjs — DETERMINISTIC layer cho OCR-review toàn bộ KN (tạm, review-only).
 * Checks: (1) format fields per detail KN, (2) severity hợp lệ, (3) table↔detail IDs,
 * (4) path refs trong backtick có tồn tại không, (5) heading line numbers cho chia batch subagent.
 * Chạy: node .agent/kn-review/check.mjs [--out <file>]   (--out ghi utf8 — tránh mojibake redirect PS)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseKNs } from '../../.github/harness/scripts/kn-parse.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, '..', '..');
const KN_PATH = path.join(ROOT, 'docs', 'knowleged.md');

const { kns, raw } = await parseKNs(KN_PATH);
const lines = raw.split('\n');

// ---------- 1. heading line numbers (cho batch) ----------
const heads = [];
lines.forEach((l, i) => {
  const m = l.match(/^###\s+(KN-\d{3})\b/);
  if (m) heads.push({ id: m[1], line: i + 1 });
});

// ---------- 2. tách detail blocks ----------
const detailBlocks = new Map(); // id -> { start, end, text }
for (let i = 0; i < heads.length; i++) {
  const start = heads[i].line;
  const end = i + 1 < heads.length ? heads[i + 1].line - 1 : lines.length;
  detailBlocks.set(heads[i].id, { start, end, text: lines.slice(start - 1, end).join('\n') });
}

// ---------- 3. format check ----------
const REQUIRED = [
  ['Ngày', /Ngày:[^\d]*(?:<!--.*?-->)?\s*-?\s*\d{4}-\d{2}-\d{2}/],
  ['Severity', /Severity:[^\w]*(critical|major|minor)/i],
  ['Triệu chứng', /Triệu chứng/],
  ['Nguyên nhân gốc', /Nguyên nhân gốc/],
  ['Cách sửa', /Cách sửa/],
  ['Cách phòng tránh', /Cách phòng tránh/],
  ['Tags', /Tags:\s*[^\n]+/],
];
const formatIssues = [];
for (const [id, blk] of detailBlocks) {
  const missing = REQUIRED.filter(([, re]) => !re.test(blk.text)).map(([name]) => name);
  if (missing.length) formatIssues.push({ id, line: blk.start, missing });
}
// severity không hợp lệ
const badSeverity = [];
for (const kn of kns) {
  if (!['critical', 'major', 'minor'].includes(kn.severity)) badSeverity.push({ id: kn.id, severity: kn.severity });
}

// ---------- 4. table ↔ detail ----------
const tableIds = [...raw.matchAll(/^\|\s*(KN-\d{3})\s*\|/gm)].map(m => m[1]);
const detailIds = heads.map(h => h.id);
const inTableNotDetail = tableIds.filter(x => !detailIds.includes(x));
const inDetailNotTable = detailIds.filter(x => !tableIds.includes(x));

// ---------- 5. path refs tồn tại ----------
const PATH_PREFIX = /^(tests|scripts|www|docs|\.agent|\.github|N5Blazor|N5Blazor\.Tests|books|awesome-design-md|src|playwright-report)\//;
const FILE_EXT = /\.(ts|mjs|js|md|json|cs|razor|css|html|yml|yaml|ps1|cjs|txt)$/;
// entry thật ở root — loại quote path thiếu prefix (vd "skills/…" trong KN-043; OCR review vòng 3)
const TOP = new Set(fs.readdirSync(ROOT));
const refs = []; // { id|'(table/summary)', line, ref }
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const bt = [...line.matchAll(/`([^`\n]+)`/g)].map(m => m[1]);
  for (let r of bt) {
    r = r.replace(/:\d+(-\d+)?$/, '').replace(/#.*$/, '').replace(/[.,;)]+$/, '').trim();
    if (!r || /^https?:/.test(r) || r.includes(' ')) continue;
    // OCR review vòng 3 — loại false positive: placeholder (<slug>/YYYY/…), pipe notation,
    // HTML-absolute (/cosmos/…), quote relative (./ ../ — ngữ cảnh KN-040/043/045)
    if (/[<>|…]/.test(r) || r.includes('YYYY') || r.startsWith('/') || r.startsWith('./') || r.startsWith('../')) continue;
    let isPath = false;
    if (PATH_PREFIX.test(r)) isPath = true;
    else if (r.includes('/') && FILE_EXT.test(r) && TOP.has(r.split('/')[0])) isPath = true;
    if (!isPath) continue;
    // tìm KN gần nhất phía trên
    let id = '(intro/table)';
    for (let h = heads.length - 1; h >= 0; h--) { if (heads[h].line <= i + 1) { id = heads[h].id; break; } }
    if (id === 'KN-001') continue; // KN-001 = mục mẫu định dạng — ref cố ý không tồn tại (khai báo trong detail)
    refs.push({ id, line: i + 1, ref: r });
  }
}
const missingRefs = [];
const seen = new Set();
for (const r of refs) {
  let target = r.ref.replace(/^\.\//, '');
  let exists = false;
  if (target.includes('*')) {
    // glob đơn giản: chỉ hỗ trợ 1 sao trong tên file/dir cuối
    const dir = path.dirname(target);
    const pat = path.basename(target).replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
    const re = new RegExp('^' + pat + '$');
    try { const files = fs.readdirSync(path.join(ROOT, dir)); exists = files.some(f => re.test(f)); } catch { exists = false; }
  } else {
    try { exists = fs.existsSync(path.join(ROOT, target)); } catch { exists = false; }
  }
  if (!exists) {
    const key = target;
    if (!seen.has(key)) { seen.add(key); missingRefs.push({ ...r }); }
  }
}

// ---------- report ----------
const out = {
  counts: { kns: kns.length, tableRows: tableIds.length, detailSections: detailIds.length },
  idDiff: { inTableNotDetail, inDetailNotTable },
  formatIssues,
  badSeverity,
  missingRefs,
  heads,
};
const outArg = process.argv.indexOf('--out');
if (outArg !== -1) {
  const outFile = process.argv[outArg + 1];
  if (!outFile) {
    console.error('⛔ --out cần đường dẫn file');
    process.exit(2);
  }
  fs.writeFileSync(outFile, JSON.stringify(out, null, 2) + '\n', 'utf8');
  console.log(`✅ check-result → ${outFile}`);
} else {
  console.log(JSON.stringify(out, null, 2));
}
