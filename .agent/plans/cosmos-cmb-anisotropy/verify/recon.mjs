#!/usr/bin/env node
/**
 * CMB Anisotropy — RECON (Explorer phase)
 * Khảo sát dữ liệu thật TRƯỚC khi thiết kế heatmap:
 *  - KN: tags + ngày (từ docs/knowleged.md, cùng cách parse với auto-learn.mjs)
 *  - Bugs: tags + ngày (từ .agent/bugs/<date-slug>/bug.md)
 *  - KN 0 tham chiếu: đếm KN-XXX trong .agent/bugs + .agent/plans
 * Chỉ đọc — không ghi gì. Output để chọn formula cold spot + bucket thời gian.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..', '..', '..');

const KNOWLEGED = path.join(ROOT, 'docs', 'knowleged.md');
const BUGS_DIR = path.join(ROOT, '.agent', 'bugs');
const PLANS_DIR = path.join(ROOT, '.agent', 'plans');

// ---- parse KN giống parseKNs() của auto-learn.mjs ----
const raw = (await fs.readFile(KNOWLEGED, 'utf8')).replace(/\r\n/g, '\n');
const parts = raw.split(/^###\s*KN-/m);
const kns = [];
for (let i = 1; i < parts.length; i++) {
  const part = 'KN-' + parts[i];
  const firstNL = part.indexOf('\n');
  const firstLine = firstNL >= 0 ? part.slice(0, firstNL) : part;
  const m = firstLine.match(/KN-(\d+)\s*[—\-–]\s*(.+)/);
  if (!m || m[1] === 'XXX') continue;
  const id = `KN-${m[1].padStart(3, '0')}`;
  const block = firstNL >= 0 ? part.slice(firstNL + 1) : '';
  const tagsLineM = block.match(/Tags:\s*([^\n]+)/);
  const tags = tagsLineM ? ([...tagsLineM[1].matchAll(/`([^`]+)`/g)].map((x) => x[1].trim())) : [];
  const dateM = block.match(/Ngày:\s*([0-9\-]+)/);
  // ngày cũng có thể nằm trong bảng tóm tắt dạng "| KN-xxx | 2026-09-12 |" — fallback quét summary row
  let date = dateM ? dateM[1] : '';
  if (!date) {
    const rowM = raw.match(new RegExp('\\|\\s*' + id + '\\s*\\|\\s*([0-9]{4}-[0-9]{2}-[0-9]{2})'));
    if (rowM) date = rowM[1];
  }
  kns.push({ id, title: m[2].trim().slice(0, 60), tags, date });
}

// ---- bugs ----
const bugDirs = (await fs.readdir(BUGS_DIR, { withFileTypes: true }))
  .filter((e) => e.isDirectory() && e.name !== '_template')
  .map((e) => e.name);
const bugs = [];
for (const slug of bugDirs) {
  let text = '';
  try { text = await fs.readFile(path.join(BUGS_DIR, slug, 'bug.md'), 'utf8'); } catch { continue; }
  const tagsLineM = text.match(/-\s*\*\*Tags:\*\*\s*([^\n]+)/);
  const tags = tagsLineM ? ([...tagsLineM[1].matchAll(/`([^`]+)`/g)].map((x) => x[1].trim())) : [];
  bugs.push({ slug, date: slug.slice(0, 10), tags });
}

// ---- tag counts ----
const knTag = {}, bugTag = {};
for (const k of kns) for (const t of new Set(k.tags)) knTag[t] = (knTag[t] || 0) + 1;
for (const b of bugs) for (const t of new Set(b.tags)) bugTag[t] = (bugTag[t] || 0) + 1;
const allTags = [...new Set([...Object.keys(knTag), ...Object.keys(bugTag)])].sort();

console.log('=== KN: ' + kns.length + ' · Bugs: ' + bugs.length + ' ===\n');
console.log('--- Bảng tag: knCount / bugCount / coldness(=bug-kn) / coldness2(=bug-2*kn) ---');
for (const t of allTags) {
  const k = knTag[t] || 0, b = bugTag[t] || 0;
  console.log(`  ${t.padEnd(18)} kn=${String(k).padStart(2)} bug=${String(b).padStart(2)} cold=${String(b - k).padStart(3)} cold2=${String(b - 2 * k).padStart(3)}`);
}

console.log('\n--- KN theo tháng (từ Ngày:) ---');
const months = {};
for (const k of kns) { const mo = k.date ? k.date.slice(0, 7) : 'unknown'; months[mo] = (months[mo] || 0) + 1; }
console.log(' ', JSON.stringify(months));

console.log('\n--- KN theo tuần (7 ngày từ 2026-08-24) ---');
const weeks = {};
for (const k of kns) {
  if (!k.date) { weeks.unknown = (weeks.unknown || 0) + 1; continue; }
  const d = new Date(k.date + 'T00:00:00Z').getTime();
  const w = Math.floor((d - Date.parse('2026-08-24T00:00:00Z')) / (7 * 864e5));
  weeks['W' + w] = (weeks['W' + w] || 0) + 1;
}
console.log(' ', JSON.stringify(weeks));

// ---- KN refs: bug files + plan files ----
async function walk(dir, out = []) {
  let entries = [];
  try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) await walk(p, out);
    else if (e.isFile() && (e.name.endsWith('.md') || e.name.endsWith('.json'))) out.push(p);
  }
  return out;
}
const refFiles = [...await walk(BUGS_DIR), ...await walk(PLANS_DIR)];
const refTexts = [];
for (const f of refFiles) { try { refTexts.push(await fs.readFile(f, 'utf8')); } catch {} }
const allRefs = refTexts.join('\n');

const zeroRef = [];
for (const k of kns) {
  const re = new RegExp(k.id + '(?!\\d)', 'g');
  const hits = (allRefs.match(re) || []).length;
  if (hits === 0) zeroRef.push(k);
}
console.log('\n--- KN 0 tham chiếu (trong .agent/bugs + .agent/plans; ' + refFiles.length + ' files) ---');
for (const k of zeroRef) console.log(`  ${k.id} (${k.date || 'no-date'}) ${k.title}`);
console.log('  → tổng: ' + zeroRef.length + '/' + kns.length);

console.log('\n--- KN có nhiều tham chiếu nhất (top 8) ---');
const refCount = kns.map((k) => ({ id: k.id, hits: (allRefs.match(new RegExp(k.id + '(?!\\d)', 'g')) || []).length }))
  .sort((a, b) => b.hits - a.hits).slice(0, 8);
for (const r of refCount) console.log(`  ${r.id}: ${r.hits}`);
