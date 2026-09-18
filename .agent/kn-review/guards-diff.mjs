// guards-diff.mjs — so sánh mapping guards trước/sau khi thêm fixture-filter (review 2026-09-18)
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
const tmp = os.tmpdir();
const before = JSON.parse(fs.readFileSync(path.join(tmp, 'kn-guards-before.json'), 'utf8'));
const after = JSON.parse(fs.readFileSync(path.join(tmp, 'kn-guards-after.json'), 'utf8'));
const pairs = (g) => {
  const out = new Set();
  for (const [k, v] of Object.entries(g.guards)) for (const f of v) out.add(k + ' :: ' + f);
  return out;
};
const b = pairs(before), a = pairs(after);
const lost = [...b].filter((x) => !a.has(x));
const gained = [...a].filter((x) => !b.has(x));
console.log('counts BEFORE:', JSON.stringify(before.counts));
console.log('counts AFTER :', JSON.stringify(after.counts));
console.log('LOST (' + lost.length + '):');
lost.forEach((x) => console.log('  - ' + x));
console.log('GAINED (' + gained.length + '):');
gained.forEach((x) => console.log('  + ' + x));
