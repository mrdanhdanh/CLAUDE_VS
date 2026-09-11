#!/usr/bin/env node
/**
 * Fetch Cosmos & Quantum — tải bộ tài liệu vũ trụ + lượng tử (nguồn mở) vào books/
 *
 * Nguồn (đều miễn phí/tải được công khai cho mục đích học tập cá nhân):
 *  - David Tong lecture notes (Cambridge, DAMTP) — phát hành miễn phí trên trang tác giả
 *  - arXiv preprints — tác giả đăng mở (gr-qc, quant-ph, astro-ph, hep-th)
 *
 * Usage:
 *   node scripts/fetch-cosmos-quantum.mjs           # tải tất cả
 *   node scripts/fetch-cosmos-quantum.mjs --list    # chỉ liệt kê
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const BOOKS = path.join(ROOT, 'books');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

const DOCS = [
  // ---- Quantum ----
  { url: 'https://www.damtp.cam.ac.uk/user/tong/qm/qm.pdf',
    file: 'Quantum Mechanics - David Tong (Cambridge).pdf',
    name: 'Quantum Mechanics — David Tong (Cambridge)' },
  { url: 'https://www.damtp.cam.ac.uk/user/tong/qft/qft.pdf',
    file: 'Quantum Field Theory - David Tong (Cambridge).pdf',
    name: 'Quantum Field Theory — David Tong (Cambridge)' },
  { url: 'https://arxiv.org/pdf/quant-ph/0306072',
    file: 'Decoherence and the Transition from Quantum to Classical - Zurek.pdf',
    name: 'Decoherence and the Transition from Quantum to Classical — Wojciech H. Zurek (arXiv quant-ph/0306072)' },
  { url: 'https://arxiv.org/pdf/quant-ph/0702225',
    file: 'Quantum Entanglement Review - Horodecki et al.pdf',
    name: 'Quantum Entanglement — Horodecki et al., Rev. Mod. Phys. 81, 865 (arXiv quant-ph/0702225)' },
  // ---- Cosmos ----
  { url: 'https://www.damtp.cam.ac.uk/user/tong/relativity/dynrel.pdf',
    file: 'Dynamics and Relativity - David Tong (Cambridge).pdf',
    name: 'Dynamics and Relativity (Special Relativity) — David Tong (Cambridge)' },
  { url: 'https://www.damtp.cam.ac.uk/user/tong/gr/gr.pdf',
    file: 'General Relativity - David Tong (Cambridge).pdf',
    name: 'General Relativity — David Tong (Cambridge)' },
  { url: 'https://arxiv.org/pdf/0803.0982',
    file: 'Dark Energy and the Accelerating Universe - Frieman Turner Huterer.pdf',
    name: 'Dark Energy and the Accelerating Universe — Frieman, Turner & Huterer (arXiv 0803.0982)' },
  { url: 'https://arxiv.org/pdf/1807.06209',
    file: 'Planck 2018 Results I Overview - Planck Collaboration.pdf',
    name: 'Planck 2018 Results I: Overview — Planck Collaboration (arXiv 1807.06209)' },
  { url: 'https://arxiv.org/pdf/0907.5424',
    file: 'TASI Lectures on Inflation - Daniel Baumann.pdf',
    name: 'TASI Lectures on Inflation — Daniel Baumann (arXiv 0907.5424)' },
  { url: 'https://arxiv.org/pdf/1602.03837',
    file: 'Observation of Gravitational Waves GW150914 - LIGO Virgo.pdf',
    name: 'Observation of Gravitational Waves from a Binary Black Hole Merger (GW150914) — LIGO & Virgo (arXiv 1602.03837)' },
  { url: 'https://arxiv.org/pdf/astro-ph/0005265',
    file: 'The Cosmological Constant Problem - Steven Weinberg.pdf',
    name: 'The Cosmological Constant Problem — Steven Weinberg (arXiv astro-ph/0005265)' },
];

const listOnly = process.argv.includes('--list');
if (listOnly) {
  DOCS.forEach((d, i) => console.log(`${i + 1}. ${d.name}\n   ${d.url}\n   → books/${d.file}`));
  process.exit(0);
}

fs.mkdirSync(BOOKS, { recursive: true });
let ok = 0, skip = 0, fail = 0;

for (const d of DOCS) {
  const dest = path.join(BOOKS, d.file);
  try {
    const res = await fetch(d.url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.slice(0, 4).toString('latin1') !== '%PDF') throw new Error('not a PDF (magic bytes mismatch)');
    fs.writeFileSync(dest, buf);
    const mb = (buf.length / 1024 / 1024).toFixed(2);
    console.log(`✅ ${d.file}  (${mb} MB)`);
    ok++;
  } catch (err) {
    console.error(`❌ FAIL ${d.file} — ${err.message}`);
    fail++;
  }
  await new Promise(r => setTimeout(r, 800)); // lịch sự với server
}

console.log(`\nDone: ${ok} tải mới · ${fail} lỗi · tổng ${DOCS.length} tài liệu`);
if (fail > 0) process.exit(1);
