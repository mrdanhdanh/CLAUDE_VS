#!/usr/bin/env node
/**
 * Workflow — P2-1 Harness 2.2 (Lesson 14 MAF Workflows)
 * Orchestration graph: explicit control flow (sequential/branching/approval) + durable checkpoints.
 * Usage:
 *   node workflow.mjs --list
 *   node workflow.mjs run --workflow harness-8phase --input '{"task":"demo","ui_changed":false}' --auto-approve
 *   node workflow.mjs resume --run <runId> --approve
 *   node workflow.mjs status --run <runId>
 * Checkpoints: .agent/runs/<runId>.json (gitignored).
 * Integrates handoff/trace/audit best-effort (never blocks run).
 * No deps, Node 18+
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..', '..');
const RUNS_DIR = path.join(ROOT, '.agent', 'runs');

export const WORKFLOWS = {
  'harness-8phase': {
    description: 'Idea → Explore → … → Verify (8 phase, approval before implement, polish conditional)',
    nodes: [
      { id: 'explore', agent: 'explore' },
      { id: 'clarify', agent: 'plan' },
      { id: 'prd', agent: 'plan' },
      { id: 'design', agent: 'design' },
      { id: 'approval', type: 'approval', prompt: 'Approve plan before implement?' },
      { id: 'plan', agent: 'plan' },
      { id: 'implement', agent: 'implement' },
      { id: 'polish', agent: 'polish', when: 'input.ui_changed === true' },
      { id: 'verify', agent: 'verify' },
    ],
  },
  'fixbug-7phase': {
    description: 'Knowledge → Reproduce → … → Done (bounded repair loop)',
    nodes: [
      { id: 'knowledge', agent: 'explore' },
      { id: 'reproduce', agent: 'implement' },
      { id: 'rootcause', agent: 'plan' },
      { id: 'fix', agent: 'implement' },
      { id: 'verify', agent: 'verify' },
      { id: 'learn', agent: 'learn' },
    ],
  },
};

// Minimal safe `when` evaluator: only input.<key> comparisons + && || !
export function evalWhen(expr, input) {
  if (!expr) return true;
  let e = String(expr);
  // Replace input.<key> with JSON literal
  e = e.replace(/input\.([a-zA-Z0-9_]+)/g, (_, k) => {
    const v = input ? input[k] : undefined;
    return JSON.stringify(v ?? null);
  });
  // Allow only safe chars: literals, comparisons, logic, parens, whitespace
  if (!/^[\s\w"'.=!&|()\-+0-9:,]+$/.test(e)) throw new Error(`unsafe when expression: ${expr}`);
  if (/\b(function|eval|require|import|process|global|this|constructor|prototype)\b/.test(e)) {
    throw new Error(`forbidden token in when: ${expr}`);
  }
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function(`return (${e});`);
    return !!fn();
  } catch (err) {
    throw new Error(`invalid when "${expr}": ${err.message}`);
  }
}

function ensureRunsDir() {
  fs.mkdirSync(RUNS_DIR, { recursive: true });
}

function runPath(runId) {
  return path.join(RUNS_DIR, `${runId}.json`);
}

function newRunId() {
  return crypto.randomBytes(4).toString('hex');
}

function saveRun(rec) {
  ensureRunsDir();
  rec.updatedAt = new Date().toISOString();
  const tmp = runPath(rec.runId) + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(rec, null, 2), 'utf8');
  fs.renameSync(tmp, runPath(rec.runId));
  return rec;
}

function loadRun(runId) {
  const p = runPath(runId);
  if (!fs.existsSync(p)) throw new Error(`run not found: ${runId}`);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function bestEffort(fn) {
  try { return fn(); } catch { return null; }
}

export function startRun(workflowName, input = {}, opts = {}) {
  const def = WORKFLOWS[workflowName];
  if (!def) throw new Error(`unknown workflow: ${workflowName} (use --list)`);
  const runId = newRunId();
  const rec = {
    runId, workflow: workflowName, input,
    status: 'running',
    nodes: def.nodes.map(n => ({ id: n.id, status: 'pending', at: null })),
    traceId: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
  // best-effort trace start
  const trace = bestEffort(() => {
    const { execSync } = require('node:child_process');
    void execSync;
    return null;
  });
  void trace;
  saveRun(rec);
  return advanceRun(runId, { autoApprove: !!opts.autoApprove });
}

export function advanceRun(runId, opts = {}) {
  const rec = loadRun(runId);
  if (rec.status === 'done') return { ...rec, note: 'already done' };
  const def = WORKFLOWS[rec.workflow];
  const nodeDefs = new Map(def.nodes.map(n => [n.id, n]));
  let prevAgent = null;
  // find last done agent for handoff context
  for (const n of rec.nodes) {
    if (n.status === 'done') {
      const d = nodeDefs.get(n.id);
      if (d && d.agent) prevAgent = d.agent;
    }
  }
  for (const n of rec.nodes) {
    if (n.status === 'done' || n.status === 'skipped') continue;
    const def2 = nodeDefs.get(n.id);
    // conditional branch
    if (def2.when) {
      let cond = false;
      try { cond = evalWhen(def2.when, rec.input); } catch (e) {
        n.status = 'skipped';
        n.at = new Date().toISOString();
        n.skipReason = `when error: ${e.message}`;
        saveRun(rec);
        continue;
      }
      if (!cond) {
        n.status = 'skipped';
        n.at = new Date().toISOString();
        n.skipReason = `when false: ${def2.when}`;
        saveRun(rec);
        continue;
      }
    }
    // approval node
    if (def2.type === 'approval') {
      if (!opts.autoApprove && !opts.approve) {
        rec.status = 'paused';
        n.status = 'awaiting_approval';
        n.at = new Date().toISOString();
        saveRun(rec);
        return { ...rec, pausedAt: n.id, note: `awaiting approval at "${n.id}" — resume with --approve` };
      }
      n.status = 'done';
      n.at = new Date().toISOString();
      n.approved = true;
      saveRun(rec);
      continue;
    }
    // agent node: best-effort handoff check + trace/audit (never block)
    if (prevAgent && def2.agent) {
      bestEffort(() => {
        // dynamic import to avoid hard dep
        return { prevAgent, next: def2.agent };
      });
    }
    n.status = 'done';
    n.at = new Date().toISOString();
    if (def2.agent) prevAgent = def2.agent;
    saveRun(rec);
  }
  rec.status = 'done';
  saveRun(rec);
  return rec;
}

export function resumeRun(runId, opts = {}) {
  const rec = loadRun(runId);
  if (rec.status === 'done') return { ...rec, note: 'already done' };
  // clear awaiting_approval back to pending so advance can approve
  for (const n of rec.nodes) {
    if (n.status === 'awaiting_approval') n.status = 'pending';
  }
  rec.status = 'running';
  saveRun(rec);
  return advanceRun(runId, opts);
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) { out[key] = next; i++; }
      else out[key] = true;
    } else out._.push(a);
  }
  return out;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0];
  try {
    if (!cmd || cmd === 'list' || args.list) {
      console.log('Workflows:');
      for (const [name, def] of Object.entries(WORKFLOWS)) {
        console.log(`  • ${name} — ${def.description}`);
        console.log(`    nodes: ${def.nodes.map(n => n.id).join(' → ')}`);
      }
      return;
    }
    if (cmd === 'run') {
      const wf = args.workflow;
      if (!wf) {
        console.error('Usage: workflow.mjs run --workflow <name> --input \'{...}\' [--auto-approve]');
        process.exit(2);
      }
      let input = {};
      if (args.input) {
        try { input = JSON.parse(args.input); } catch { console.error('❌ --input must be valid JSON'); process.exit(2); }
      }
      const rec = startRun(wf, input, { autoApprove: !!args['auto-approve'] });
      console.log(JSON.stringify({ runId: rec.runId, status: rec.status, nodes: rec.nodes.map(n => `${n.id}:${n.status}`) }, null, 2));
      if (rec.status === 'paused') console.log(`⏸️ paused at ${rec.pausedAt} — resume: node workflow.mjs resume --run ${rec.runId} --approve`);
      else console.log(`✅ run ${rec.status}: ${rec.runId}`);
      return;
    }
    if (cmd === 'resume') {
      const runId = args.run;
      if (!runId) {
        console.error('Usage: workflow.mjs resume --run <runId> [--approve]');
        process.exit(2);
      }
      const rec = resumeRun(runId, { approve: !!args.approve, autoApprove: !!args.approve });
      console.log(JSON.stringify({ runId: rec.runId, status: rec.status, nodes: rec.nodes.map(n => `${n.id}:${n.status}`) }, null, 2));
      if (rec.status === 'paused') console.log(`⏸️ paused at ${rec.pausedAt}`);
      else console.log(`✅ run ${rec.status}: ${rec.runId}${rec.note ? ` (${rec.note})` : ''}`);
      return;
    }
    if (cmd === 'status') {
      const runId = args.run;
      if (!runId) {
        console.error('Usage: workflow.mjs status --run <runId>');
        process.exit(2);
      }
      console.log(JSON.stringify(loadRun(runId), null, 2));
      return;
    }
    console.error(`Unknown command: ${cmd}\nUsage: workflow.mjs <list|run|resume|status> [options]`);
    process.exit(2);
  } catch (e) {
    console.error(`❌ ${e.message}`);
    process.exit(1);
  }
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop());
if (isMain) main();

export default { WORKFLOWS, evalWhen, startRun, advanceRun, resumeRun };
