#!/usr/bin/env node
/**
 * Consistency Gap + FEEs — KN-027 (FEEs 2609.08404v1 + Consistency Gap 2609.08832v1 + SOLID 2609.09957v1)
 * - consistency: đo all-N vs per-run (paper: 77% per-run nhưng 53% all-5, gap 24) — metric reliability production
 * - fee-check: environment-side adaptation — observation enrichment > action guidance; intra-group feedback consistency là boundary
 * - solid: evaluator-free self-distillation — multiple rollouts → cluster → majority pseudo-reference → group-relative advantages
 * Usage:
 *   node consistency-gap.mjs --check --runs 5 --results "pass,pass,fail,pass,pass" [--json]
 *   node consistency-gap.mjs --fee-check --env "desc" [--json]
 *   node consistency-gap.mjs --solid --rollouts "a:12,a:12,b:9" [--json]
 * Storage: .agent/consistency.json (gap records, gitignored)
 * No deps, Node 18+
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..', '..');
const CONS_PATH = path.join(ROOT, '.agent', 'consistency.json');

function loadCons() {
  try {
    if (!fs.existsSync(CONS_PATH)) return { version: 1, records: [] };
    return JSON.parse(fs.readFileSync(CONS_PATH, 'utf8'));
  } catch { return { version: 1, records: [] }; }
}

function saveCons(c) {
  fs.mkdirSync(path.dirname(CONS_PATH), { recursive: true });
  c.updatedAt = new Date().toISOString();
  const tmp = CONS_PATH + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(c, null, 2), 'utf8');
  fs.renameSync(tmp, CONS_PATH);
  return c;
}

// all-N: pass hết N runs mới tính pass (khắt khe như paper)
function consistencyGap(results) {
  const rs = results.map(r => /pass|ok|true|1/i.test(String(r).trim()));
  const n = rs.length || 1;
  const perRun = rs.filter(Boolean).length / n;
  const allN = rs.every(Boolean) ? 1 : 0;
  const gap = Math.round((perRun - allN) * 100);
  return { n, perRun: Math.round(perRun * 100) / 100, allN, gap, reliable: gap <= 10 && allN === 1 };
}

function feeCheck(envDesc) {
  const env = String(envDesc || '');
  const checks = [
    { id: 'observation-enrichment', pass: /observ|enrich|context|state/i.test(env), hint: 'enrich observation (state-space), không chỉ guide action' },
    { id: 'no-action-only', pass: !/chỉ guide action|action guidance only/i.test(env), hint: 'tránh action-guidance-only ở later stages' },
    { id: 'group-consistency', pass: /consist|agree|majority|cluster/i.test(env), hint: 'intra-group feedback consistency là boundary cho stable optimization' },
  ];
  return { env: env.slice(0, 200), checks, pass: checks.every(c => c.pass) };
}

// SOLID-lite: cluster objectives từ rollouts, majority làm pseudo-reference
function solidCluster(rolloutsRaw) {
  const items = String(rolloutsRaw || '').split(',').map(s => s.trim()).filter(Boolean);
  const groups = {};
  for (const it of items) {
    const [val, obj] = it.includes(':') ? it.split(':').map(s => s.trim()) : [it, it];
    const key = obj || val;
    if (!groups[key]) groups[key] = [];
    groups[key].push(val);
  }
  const ranked = Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
  const majority = ranked[0] || ['(none)', []];
  return {
    total: items.length,
    clusters: ranked.map(([k, v]) => ({ objective: k, count: v.length })),
    pseudoReference: majority[0],
    pseudoCount: majority[1].length,
    advantage: `group-relative: majority "${majority[0]}" (${majority[1].length}/${items.length}) làm pseudo-reference — update theo dense self-supervision, không cần verified answers`,
  };
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      const nxt = argv[i + 1];
      if (nxt && !nxt.startsWith('--')) { out[k] = nxt; i++; }
      else out[k] = true;
    } else out._.push(a);
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  try {
    if (args.check) {
      const n = Number(args.runs || 5);
      const raw = args.results || args._[0] || '';
      const results = String(raw).split(',').map(s => s.trim()).filter(Boolean);
      if (!results.length) { console.error('Usage: consistency-gap.mjs --check --runs 5 --results "pass,pass,fail,pass,pass"'); process.exit(2); }
      const r = consistencyGap(results);
      const rec = { ts: new Date().toISOString(), kind: 'consistency', ...r };
      const c = loadCons();
      c.records.push(rec);
      saveCons(c);
      if (args.json) console.log(JSON.stringify(r, null, 2));
      else {
        console.log(`🎯 consistency (n=${r.n}): per-run ${Math.round(r.perRun * 100)}% · all-${r.n} ${r.allN ? 'PASS' : 'FAIL'} · gap ${r.gap} điểm ${r.reliable ? '✅ reliable' : '⚠️ unreliable — cần Consistency Analyzer + Guideline → episodic memory (KN-027)'}`);
      }
      process.exit(r.reliable ? 0 : 1);
    }
    if (args['fee-check'] || args.fee) {
      const r = feeCheck(args.env || args._[0] || '');
      if (args.json) console.log(JSON.stringify(r, null, 2));
      else {
        console.log(`🌱 FEEs: ${r.pass ? '✅ PASS' : '⚠️ cần enrich thêm'}`);
        r.checks.forEach(ch => console.log(`   ${ch.pass ? '✅' : '❌'} ${ch.id}: ${ch.hint}`));
      }
      process.exit(r.pass ? 0 : 1);
    }
    if (args.solid) {
      const r = solidCluster(args.rollouts || args._[0] || '');
      if (args.json) console.log(JSON.stringify(r, null, 2));
      else {
        console.log(`🧬 SOLID-lite: ${r.total} rollouts → ${r.clusters.length} clusters`);
        r.clusters.forEach(cl => console.log(`   - "${cl.objective}": ${cl.count}`));
        console.log(`   pseudo-reference: "${r.pseudoReference}" (${r.pseudoCount}/${r.total})`);
        console.log(`   ${r.advantage}`);
      }
      return;
    }
    // default: show last records
    const c = loadCons();
    if (args.json) console.log(JSON.stringify({ records: c.records.slice(-5) }, null, 2));
    else {
      console.log(`Consistency records: ${c.records.length}`);
      c.records.slice(-5).forEach(r => console.log(`   ${r.ts.slice(0, 16)} n=${r.n} per-run=${Math.round(r.perRun * 100)}% all-N=${r.allN ? 'PASS' : 'FAIL'} gap=${r.gap}`));
    }
  } catch (e) { console.error(`❌ ${e.message}`); process.exit(1); }
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop());
if (isMain) main();

export default { consistencyGap, feeCheck, solidCluster };
