// Pairwise runner — orig vs refactored CLI (same-moment, normalize timestamps)
// Usage: node .agent/plans/harness-core-refactor/pairwise.mjs <basename> <jsonScenariosFile>
// Vd:   node .agent/plans/harness-core-refactor/pairwise.mjs auto-learn
// Đọc scenarios từ <basename>-scenarios.json: [{ args: [...], label }]
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', '..', '..');
const SCRIPT_DIR = path.join(ROOT, '.github', 'harness', 'scripts');
const base = process.argv[2];
if (!base) { console.error('Thiếu basename'); process.exit(2); }
const scenarios = JSON.parse(readFileSync(path.join(import.meta.dirname, `${base}-scenarios.json`), 'utf8'));

const ISO_RX = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/g;
const norm = (s) => (s || '').replace(ISO_RX, 'TS');
const clean = (s) => (s || '').replace(/\r\n/g, '\n');

let pass = 0, fail = 0;
for (const sc of scenarios) {
  const args = sc.args || [];
  const o = spawnSync('node', [`${base}.orig.mjs`, ...args], { cwd: SCRIPT_DIR, encoding: 'utf8' });
  const n = spawnSync('node', [`${base}.mjs`, ...args], { cwd: SCRIPT_DIR, encoding: 'utf8' });
  const oOut = norm(clean(o.stdout)), nOut = norm(clean(n.stdout));
  const oErr = norm(clean(o.stderr)), nErr = norm(clean(n.stderr));
  const sameExit = o.status === n.status;
  const sameOut = oOut === nOut;
  const sameErr = oErr === nErr;
  if (sameExit && sameOut && sameErr) {
    console.log(`✅ IDENTICAL — ${sc.label || args.join(' ')} (exit ${o.status})`);
    pass++;
  } else {
    fail++;
    console.log(`❌ DIFF — ${sc.label || args.join(' ')}`);
    if (!sameExit) console.log(`   exit: orig=${o.status} new=${n.status}`);
    if (!sameOut) {
      const ol = oOut.split('\n'), nl = nOut.split('\n');
      console.log(`   stdout lines: orig=${ol.length} new=${nl.length}`);
      for (let i = 0; i < Math.max(ol.length, nl.length); i++) {
        if (ol[i] !== nl[i]) { console.log(`   L${i}: [-${(ol[i] || '').slice(0, 90)}] [+${(nl[i] || '').slice(0, 90)}]`); if (i > 4) break; }
      }
    }
    if (!sameErr) console.log(`   stderr: [-${oErr.slice(0, 150)}] [+${nErr.slice(0, 150)}]`);
  }
}
console.log(`\n${fail === 0 ? '🎯 ALL IDENTICAL' : '⚠️ CÓ DIFF'} — ${pass}/${pass + fail}`);
process.exit(fail === 0 ? 0 : 1);
