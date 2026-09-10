#!/usr/bin/env node
/**
 * Procedural Graph — KN-025 (Procedural Graphs 2609.09153v1 + A-JIT 2609.10248v1)
 * Explicit execution structure: (procedure, relation, procedure) triplets + guidance bias (not dictate)
 * + LLM refiner contrast failed/success + held-out validation + rejected memory.
 * Usage:
 *   node procedural-graph.mjs --init --from-workflow harness-8phase
 *   node procedural-graph.mjs --check [--json]
 *   node procedural-graph.mjs --guide --node implement --history "explore,clarify,prd"
 *   node procedural-graph.mjs --refine --failed "verify fail X" --success "verify pass Y" [--apply] [--dry]
 *   node procedural-graph.mjs --list [--json]
 * Storage: .agent/procedural-graph.json (explicit fast state, committed like episodic)
 * No deps, Node 18+
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..', '..');
const GRAPH_PATH = path.join(ROOT, '.agent', 'procedural-graph.json');

// Reuse workflow definitions (Ladder nấc 2: reuse, không rewrite)
async function loadWorkflows() {
  try {
    const mod = await import('./workflow.mjs');
    return mod.WORKFLOWS || {};
  } catch { return {}; }
}

function loadGraph() {
  try {
    if (!fs.existsSync(GRAPH_PATH)) return null;
    return JSON.parse(fs.readFileSync(GRAPH_PATH, 'utf8'));
  } catch { return null; }
}

function saveGraph(g) {
  fs.mkdirSync(path.dirname(GRAPH_PATH), { recursive: true });
  g.updatedAt = new Date().toISOString();
  const tmp = GRAPH_PATH + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(g, null, 2), 'utf8');
  fs.renameSync(tmp, GRAPH_PATH);
  return g;
}

// Build triplets from workflow nodes: (a, enables|requires|branches-to, b)
function tripletsFromWorkflow(name, def) {
  const nodes = def.nodes || [];
  const triplets = [];
  for (let i = 0; i < nodes.length; i++) {
    const cur = nodes[i];
    const nxt = nodes[i + 1];
    if (!nxt) break;
    let rel = 'enables';
    if (nxt.type === 'approval') rel = 'requires';
    else if (nxt.when) rel = 'branches-to';
    else if (cur.type === 'approval') rel = 'unlocks';
    triplets.push({ from: cur.id, rel, to: nxt.id, source: `workflow:${name}` });
  }
  return triplets;
}

function guidanceFor(nodeId, history, graph) {
  const hist = String(history || '').split(',').map(s => s.trim()).filter(Boolean);
  const edges = (graph?.triplets || []).filter(t => t.from === nodeId || t.to === nodeId);
  const prev = hist[hist.length - 1] || '(start)';
  const nexts = (graph?.triplets || []).filter(t => t.from === nodeId).map(t => t.to);
  // Bias, không dictate (KN-025): gợi ý situational, solver vẫn quyết
  const lines = [
    `Active node: ${nodeId} (prev: ${prev})`,
    nexts.length ? `Tiếp theo thường: ${nexts.join(', ')} — ưu tiên theo graph, nhưng solver tự quyết nếu evidence khác.` : `Node cuối hoặc chưa có edge — solver tự quyết, ghi lại để refine.`,
    edges.length ? `Liên quan: ${edges.map(e => `${e.from} -[${e.rel}]-> ${e.to}`).join('; ')}` : `Chưa có triplet cho node này — dùng workflow mặc định.`,
  ];
  // Rejected memory: cảnh báo lặp lại
  const rejected = (graph?.rejected || []).filter(r => (r.node || '') === nodeId).slice(-3);
  if (rejected.length) lines.push(`⚠️ Đã reject ${rejected.length} edit cho node này — tránh lặp: ${rejected.map(r => r.reason).join('; ').slice(0, 200)}`);
  return { node: nodeId, prev, nexts, guidance: lines.join('\n'), biasNotDictate: true };
}

function proposeRefine(failed, success) {
  // Contrast failed vs success (KN-025): tìm điểm flip, đề xuất edit topology
  const f = String(failed || '');
  const s = String(success || '');
  const edits = [];
  if (f && s && f !== s) {
    edits.push({ type: 'add-guard', reason: `contrast failed/success: "${f.slice(0, 60)}" vs "${s.slice(0, 60)}" — thêm guard trước node fail`, node: 'verify', proposal: 'thêm Consistency Analyzer trước verify (KN-027)' });
  }
  if (/order|sequence|thứ tự/i.test(f)) {
    edits.push({ type: 'reorder-edge', reason: 'tool sai thứ tự — thêm edge requires rõ ràng', node: 'implement', proposal: 'bổ sung (implement, requires, plan-approved)' });
  }
  if (!edits.length) {
    edits.push({ type: 'observe', reason: 'chưa đủ contrast — ghi nhận, không commit bừa', node: '', proposal: 'giữ nguyên, thu thêm trajectory' });
  }
  return edits;
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
    if (args.init) {
      const wfName = args['from-workflow'] || args.from || 'harness-8phase';
      const wfs = await loadWorkflows();
      const def = wfs[wfName];
      if (!def) { console.error(`❌ unknown workflow: ${wfName}`); process.exit(2); }
      const triplets = tripletsFromWorkflow(wfName, def);
      const g = { version: 1, workflow: wfName, triplets, rejected: loadGraph()?.rejected || [], createdAt: new Date().toISOString(), paper: 'Procedural Graphs 2609.09153v1 + A-JIT 2609.10248v1 (KN-025)' };
      saveGraph(g);
      console.log(`✅ procedural-graph init from ${wfName}: ${triplets.length} triplets → .agent/procedural-graph.json`);
      triplets.forEach(t => console.log(`   ${t.from} -[${t.rel}]-> ${t.to}`));
      return;
    }
    if (args.check) {
      const g = loadGraph();
      const ok = !!g && Array.isArray(g.triplets) && g.triplets.length > 0;
      const detail = !g ? 'missing .agent/procedural-graph.json — chạy --init' : `${g.triplets.length} triplets, ${g.rejected?.length || 0} rejected`;
      if (args.json) console.log(JSON.stringify({ pass: ok, detail, graph: g?.workflow || null }, null, 2));
      else console.log(`${ok ? '✅' : '❌'} procedural-graph: ${detail}`);
      process.exit(ok ? 0 : 1);
    }
    if (args.guide) {
      const node = args.node || args._[0];
      if (!node) { console.error('Usage: procedural-graph.mjs --guide --node <id> [--history "a,b"]'); process.exit(2); }
      const g = loadGraph();
      const r = guidanceFor(node, args.history || '', g);
      if (args.json) console.log(JSON.stringify(r, null, 2));
      else { console.log(`🧭 guidance (bias, không dictate):\n${r.guidance}`); }
      return;
    }
    if (args.refine) {
      const edits = proposeRefine(args.failed || args.fail || '', args.success || '');
      const dry = args.dry || !args.apply;
      if (args.json) console.log(JSON.stringify({ dry, edits }, null, 2));
      else {
        console.log(`${dry ? '🔍 refine (dry — chưa commit):' : '✏️ refine (apply):'}`);
        edits.forEach(e => console.log(`   - [${e.type}] ${e.reason} → ${e.proposal}`));
      }
      if (!dry) {
        const g = loadGraph() || { version: 1, workflow: 'manual', triplets: [], rejected: [] };
        // Held-out validation tối thiểu: chỉ commit edit có node + proposal rõ, còn lại vào rejected
        for (const e of edits) {
          if (e.type === 'observe') { g.rejected = g.rejected || []; g.rejected.push({ ts: new Date().toISOString(), reason: e.reason }); }
          else if (e.node && e.proposal) {
            // Commit dạng triplet mới nếu là reorder/guard
            if (e.type === 'reorder-edge') g.triplets.push({ from: e.node, rel: 'requires', to: 'plan-approved', source: 'refine' });
            else { g.rejected = g.rejected || []; g.rejected.push({ ts: new Date().toISOString(), node: e.node, reason: e.reason }); }
          }
        }
        saveGraph(g);
        console.log(`   → saved (${g.triplets.length} triplets, ${g.rejected?.length || 0} rejected)`);
      }
      return;
    }
    // default: list
    const g = loadGraph();
    if (!g) { console.log('(chưa init — chạy --init --from-workflow harness-8phase)'); return; }
    if (args.json) console.log(JSON.stringify(g, null, 2));
    else {
      console.log(`Procedural graph (${g.workflow}): ${g.triplets.length} triplets`);
      g.triplets.forEach(t => console.log(`   ${t.from} -[${t.rel}]-> ${t.to}`));
    }
  } catch (e) { console.error(`❌ ${e.message}`); process.exit(1); }
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop());
if (isMain) main();

export default { tripletsFromWorkflow, guidanceFor, proposeRefine, loadGraph };
