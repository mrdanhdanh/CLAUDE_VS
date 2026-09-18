// dup-calibrate.mjs — Calibrate DUPLICATE_THRESHOLD (finding #14a, review 2026-09-18).
// Mirror evaluate: query = KN title, kns = corpus; scoreKN top-1 non-self.
// Mục đích: đo phân bố + precision proxy trước khi đổi ngưỡng (không đoán).
import fs from 'node:fs';
import { parseKNs, tokenize, computeIDF, scoreKN } from '../../.github/harness/scripts/kn-parse.mjs';

const { kns } = await parseKNs('docs/knowleged.md');
const rows = [];
for (const kn of kns) {
  const qTokens = tokenize(kn.title);
  const idf = computeIDF(qTokens, kns);
  const scored = kns
    .filter((k) => k.id !== kn.id)
    .map((k) => ({ id: k.id, title: k.title.slice(0, 60), score: Math.round(scoreKN(qTokens, kn.title, k, idf) * 10) / 10 }))
    .sort((a, b) => b.score - a.score);
  rows.push({ id: kn.id, top1: scored[0], top2: scored[1], top3: scored[2] });
}

const hist = {};
for (const r of rows) {
  const b = Math.floor(r.top1.score / 5) * 5;
  hist[b] = (hist[b] || 0) + 1;
}
const counts = {
  total: rows.length,
  ge15: rows.filter((r) => r.top1.score >= 15).length,
  ge25: rows.filter((r) => r.top1.score >= 25).length,
  ge40: rows.filter((r) => r.top1.score >= 40).length,
  ge50: rows.filter((r) => r.top1.score >= 50).length,
};

console.log('=== counts ===');
console.log(JSON.stringify(counts, null, 1));
console.log('=== histogram bucket(top1, step 5) ===');
console.log(JSON.stringify(hist, null, 1));
console.log('=== top-15 pairs (theo top1 desc) ===');
for (const r of [...rows].sort((a, b) => b.top1.score - a.top1.score).slice(0, 15)) {
  console.log(`${r.id} → ${r.top1.id} (${r.top1.score})  | "${r.top1.title}"`);
}
console.log('=== known candidate pairs ===');
const need = [['KN-004', 'KN-003'], ['KN-021', 'KN-012'], ['KN-051', 'KN-048'], ['KN-065', 'KN-064'], ['KN-064', 'KN-033'], ['KN-033', 'KN-064'], ['KN-029', 'KN-031'], ['KN-049', 'KN-056'], ['KN-067', 'KN-055']];
for (const [a, b] of need) {
  const r = rows.find((x) => x.id === a);
  const hit = [r.top1, r.top2, r.top3].find((s) => s && s.id === b);
  console.log(`${a} vs ${b}: ${hit ? 'score ' + hit.score + ' rank' + ([r.top1, r.top2, r.top3].indexOf(hit) + 1) : 'KHÔNG trong top-3 (top1=' + r.top1.id + ' ' + r.top1.score + ')'}`);
}

fs.writeFileSync('.agent/kn-review/dup-calibration.json', JSON.stringify({ counts, hist, rows }, null, 2), 'utf8');
console.log('\n→ .agent/kn-review/dup-calibration.json');
