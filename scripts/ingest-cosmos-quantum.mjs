#!/usr/bin/env node
/**
 * Ingest Cosmos & Quantum — nạp lần lượt 10 tài liệu còn lại vào www/library/export.json
 * Gọi scripts/library-ingest.mjs cho từng file (backup + validate JSON tự động trong đó).
 *
 * Usage: node scripts/ingest-cosmos-quantum.mjs
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const DOCS = [
  { file: 'Quantum Mechanics - David Tong (Cambridge).pdf',
    name: 'Quantum Mechanics — David Tong (Cambridge)' },
  { file: 'Quantum Field Theory - David Tong (Cambridge).pdf',
    name: 'Quantum Field Theory — David Tong (Cambridge)' },
  { file: 'Quantum Entanglement Review - Horodecki et al.pdf',
    name: 'Quantum Entanglement — Horodecki et al., Rev. Mod. Phys. 81, 865 (arXiv quant-ph/0702225)' },
  { file: 'Dynamics and Relativity - David Tong (Cambridge).pdf',
    name: 'Dynamics and Relativity (Special Relativity) — David Tong (Cambridge)' },
  { file: 'General Relativity - David Tong (Cambridge).pdf',
    name: 'General Relativity — David Tong (Cambridge)' },
  { file: 'Dark Energy and the Accelerating Universe - Frieman Turner Huterer.pdf',
    name: 'Dark Energy and the Accelerating Universe — Frieman, Turner & Huterer (arXiv 0803.0982)' },
  { file: 'Planck 2018 Results I Overview - Planck Collaboration.pdf',
    name: 'Planck 2018 Results I: Overview — Planck Collaboration (arXiv 1807.06209)' },
  { file: 'TASI Lectures on Inflation - Daniel Baumann.pdf',
    name: 'TASI Lectures on Inflation — Daniel Baumann (arXiv 0907.5424)' },
  { file: 'Observation of Gravitational Waves GW150914 - LIGO Virgo.pdf',
    name: 'Observation of Gravitational Waves from a Binary Black Hole Merger (GW150914) — LIGO & Virgo (arXiv 1602.03837)' },
  { file: 'The Cosmological Constant Problem - Steven Weinberg.pdf',
    name: 'The Cosmological Constant Problem — Steven Weinberg (arXiv astro-ph/0005265)' },
];

let ok = 0, fail = 0;
const t0 = Date.now();

for (const d of DOCS) {
  const rel = path.join('books', d.file);
  console.log(`\n===== ${d.file} =====`);
  const r = spawnSync(process.execPath, ['scripts/library-ingest.mjs', rel, '--name', d.name], {
    encoding: 'utf8', stdio: ['ignore', 'inherit', 'inherit'],
  });
  if (r.status === 0) ok++; else { fail++; console.error(`❌ Thất bại: ${d.file} (exit ${r.status})`); }
}

const mins = ((Date.now() - t0) / 60000).toFixed(1);
console.log(`\n🏁 Hoàn tất: ${ok}/${DOCS.length} thành công · ${fail} lỗi · ${mins} phút`);
if (fail > 0) process.exit(1);
