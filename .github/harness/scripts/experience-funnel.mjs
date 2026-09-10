#!/usr/bin/env node
/**
 * Experience Funnel — KN-026 (Experience Funnel 2609.08919v1 + ADMET-EvO 2609.10121v1)
 * Alternating loop: fast state (explicit text, editable) → slow policy (consolidated) + evidence-gated.
 * - distill: trajectory → explicit textual state (knowleged-style draft, validate nhanh)
 * - consolidate: state-enabled behavior hữu ích → policy (instructions/skills patch đề xuất)
 * - evidence gate: falsifiable hypothesis + test across axes + carry supported/rejected/inconclusive
 * Usage:
 *   node experience-funnel.mjs distill --trajectory <run.json|text> [--dry] [--json]
 *   node experience-funnel.mjs consolidate [--dry] [--json]
 *   node experience-funnel.mjs evidence --hypothesis "..." --test "data|feature|model" --outcome supported|rejected|inconclusive [--json]
 *   node experience-funnel.mjs --status [--json]
 * Storage: reuse .agent/memory/* tiers (working/short/episodic) + .agent/funnel.json (evidence ledger)
 * No deps, Node 18+
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..', '..');
const FUNNEL_PATH = path.join(ROOT, '.agent', 'funnel.json');
const MEM_DIR = path.join(ROOT, '.agent', 'memory');

function loadFunnel() {
  try {
    if (!fs.existsSync(FUNNEL_PATH)) return { version: 1, states: [], policies: [], evidence: [] };
    return JSON.parse(fs.readFileSync(FUNNEL_PATH, 'utf8'));
  } catch { return { version: 1, states: [], policies: [], evidence: [] }; }
}

function saveFunnel(f) {
  fs.mkdirSync(path.dirname(FUNNEL_PATH), { recursive: true });
  f.updatedAt = new Date().toISOString();
  const tmp = FUNNEL_PATH + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(f, null, 2), 'utf8');
  fs.renameSync(tmp, FUNNEL_PATH);
  return f;
}

function readTrajectory(src) {
  if (!src) return '';
  try {
    if (fs.existsSync(src)) return fs.readFileSync(src, 'utf8').slice(0, 4000);
    if (fs.existsSync(path.join(ROOT, src))) return fs.readFileSync(path.join(ROOT, src), 'utf8').slice(0, 4000);
  } catch {}
  return String(src).slice(0, 4000);
}

// Fast state: distill trajectory thành explicit textual state (KN-style, human-readable)
function distillState(trajText) {
  const t = String(trajText || '');
  const lines = t.split('\n').filter(l => l.trim()).slice(0, 30);
  const fails = lines.filter(l => /fail|error|❌|refus/i.test(l)).slice(0, 3);
  const passes = lines.filter(l => /pass|✅|ok\b/i.test(l)).slice(0, 3);
  const state = {
    id: `state-${Date.now().toString(36)}`,
    ts: new Date().toISOString(),
    summary: `Distilled từ ${lines.length} dòng trajectory: ${fails.length} fail signals, ${passes.length} pass signals.`,
    fails: fails.map(s => s.slice(0, 160)),
    passes: passes.map(s => s.slice(0, 160)),
    hypothesis: fails.length ? `Falsifiable: fix "${fails[0].slice(0, 80)}" sẽ giảm fail ở vòng sau.` : 'Chưa có fail rõ — thu thêm trajectory.',
    editable: true,
  };
  return state;
}

// Slow policy: identify state-enabled behavior hữu ích qua revisions → đề xuất consolidate
function proposeConsolidation(funnel) {
  const states = funnel.states || [];
  if (states.length < 2) return { ready: false, reason: 'cần ≥2 states mới consolidate (tránh overfit 1 trajectory)', proposals: [] };
  const lastTwo = states.slice(-2);
  const common = lastTwo[0].fails.filter(f => lastTwo[1].summary.includes(f.slice(0, 20)) || (lastTwo[1].fails || []).some(g => g.slice(0, 20) === f.slice(0, 20)));
  const proposals = common.length
    ? [{ to: 'instructions/harness-workflow', change: `Thêm guard cho pattern lặp: "${common[0].slice(0, 100)}"`, evidence: `${states.length} states` }]
    : [{ to: '(chưa)', change: 'Không có behavior chung qua revisions — giữ ở state, chưa consolidate vào policy.', evidence: `${states.length} states` }];
  return { ready: common.length > 0, reason: common.length ? `${common.length} behavior chung` : 'chưa có behavior chung', proposals };
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
  const cmd = args._[0];
  try {
    if (!cmd || cmd === 'status' || args.status) {
      const f = loadFunnel();
      const c = proposeConsolidation(f);
      const out = { states: f.states.length, policies: (f.policies || []).length, evidence: (f.evidence || []).length, consolidateReady: c.ready, reason: c.reason };
      if (args.json) console.log(JSON.stringify(out, null, 2));
      else console.log(`🌀 funnel: ${out.states} states · ${out.policies} policies · ${out.evidence} evidence — consolidate ${c.ready ? 'READY' : 'chưa'} (${c.reason})`);
      return;
    }
    if (cmd === 'distill') {
      const traj = readTrajectory(args.trajectory || args._[1] || '');
      if (!traj) { console.error('Usage: experience-funnel.mjs distill --trajectory <run.json|text> [--dry]'); process.exit(2); }
      const state = distillState(traj);
      if (args.json) console.log(JSON.stringify({ dry: !!args.dry, state }, null, 2));
      else { console.log(`⚡ fast state ${state.id} (dry=${!!args.dry}):\n   ${state.summary}\n   hypothesis: ${state.hypothesis}`); }
      if (!args.dry) {
        const f = loadFunnel();
        f.states.push(state);
        // Mirror vào memory working tier (fast, ephemeral) best-effort
        try {
          const mem = await import('./memory.mjs');
          mem.remember('working', state.id, state.summary);
        } catch {}
        saveFunnel(f);
        console.log(`   → saved (${f.states.length} states) + memory working tier`);
      }
      return;
    }
    if (cmd === 'consolidate') {
      const f = loadFunnel();
      const c = proposeConsolidation(f);
      if (args.json) console.log(JSON.stringify({ dry: !!args.dry, ...c }, null, 2));
      else {
        console.log(`${args.dry ? '🔍 consolidate (dry):' : '🐢 consolidate (slow policy):'} ${c.reason}`);
        c.proposals.forEach(p => console.log(`   - ${p.to}: ${p.change} [${p.evidence}]`));
      }
      if (!args.dry && c.ready) {
        f.policies.push({ ts: new Date().toISOString(), proposals: c.proposals, status: 'proposed-human-duyệt' });
        saveFunnel(f);
        console.log(`   → proposed (human duyệt trước khi patch — không auto-commit knowleged)`);
      }
      return;
    }
    if (cmd === 'evidence') {
      const h = args.hypothesis || args._[1] || '';
      const test = args.test || 'model';
      const outcome = String(args.outcome || 'inconclusive').toLowerCase();
      if (!h) { console.error('Usage: experience-funnel.mjs evidence --hypothesis "..." --test data|feature|model --outcome supported|rejected|inconclusive'); process.exit(2); }
      if (!['supported', 'rejected', 'inconclusive'].includes(outcome)) { console.error('❌ --outcome phải là supported|rejected|inconclusive'); process.exit(2); }
      if (!['data', 'feature', 'model'].includes(test)) { console.error('❌ --test phải là data|feature|model'); process.exit(2); }
      const rec = { ts: new Date().toISOString(), hypothesis: h.slice(0, 300), axis: test, outcome };
      if (args.json) console.log(JSON.stringify(rec, null, 2));
      else console.log(`🧪 evidence [${test}/${outcome}]: ${h.slice(0, 100)}`);
      const f = loadFunnel();
      f.evidence.push(rec);
      saveFunnel(f);
      // Mirror vào episodic (committed) best-effort
      try {
        const mem = await import('./memory.mjs');
        mem.logEpisodic({ task: `funnel-evidence:${test}`, outcome: outcome === 'supported' ? 'pass' : outcome === 'rejected' ? 'fail' : 'partial', note: h.slice(0, 200) });
      } catch {}
      console.log(`   → ledger (${f.evidence.length} records) + episodic`);
      return;
    }
    console.error(`Unknown command: ${cmd}\nUsage: experience-funnel.mjs <distill|consolidate|evidence|--status> [options]`);
    process.exit(2);
  } catch (e) { console.error(`❌ ${e.message}`); process.exit(1); }
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop());
if (isMain) main();

export default { distillState, proposeConsolidation, loadFunnel };
