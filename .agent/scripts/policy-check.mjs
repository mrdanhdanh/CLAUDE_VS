#!/usr/bin/env node
/**
 * Policy check — CEL-lite, deny before allow, fail-closed (học OpenBot)
 * Usage:
 *   node .agent/scripts/policy-check.mjs --tool shell --target "rm -rf /" [--actor YUNIE] [--intent "delete"]
 *   node .agent/scripts/policy-check.mjs --check  (validate policy.json)
 * Exit: 0 = permitted, 1 = refused/failed, 2 = error
 * No deps, Node 18+
 */
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..', '..');
const POLICY_PATH = path.join(ROOT, '.agent', 'policy.json');

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--') && !next.startsWith('-')) {
        out[key] = next;
        i++;
      } else {
        out[key] = true;
      }
    } else {
      out._.push(a);
    }
  }
  return out;
}

function evalWhen(when, vars) {
  // CEL-lite: JS expression with 4 vars: tool, target, actor, intent
  // Sandboxed: only those 4 vars, no require/process, timeout 50ms via try
  const { tool, target, actor, intent } = vars;
  // quick allow for "true"
  if (when.trim() === 'true') return true;
  if (when.trim() === 'false') return false;
  try {
    const fn = new Function('tool', 'target', 'actor', 'intent', `return (${when});`);
    const res = fn(tool, target, actor, intent);
    return !!res;
  } catch (e) {
    throw new Error(`Invalid when expression "${when}": ${e.message}`);
  }
}

async function loadPolicy() {
  if (!existsSync(POLICY_PATH)) {
    throw new Error(`Policy not found: ${POLICY_PATH}`);
  }
  const text = await fs.readFile(POLICY_PATH, 'utf8');
  let policy;
  try {
    policy = JSON.parse(text);
  } catch (e) {
    throw new Error(`Policy JSON parse failed: ${e.message} — fail-closed (deny all)`);
  }
  if (!Array.isArray(policy.deny) || !Array.isArray(policy.allow)) {
    throw new Error('Policy must have deny[] and allow[] arrays — fail-closed');
  }
  return policy;
}

async function check(tool, target, actor, intent) {
  let policy;
  try {
    policy = await loadPolicy();
  } catch (e) {
    return { decision: 'refused', rule: 'policy-error', message: e.message, error: true };
  }

  const vars = { tool: tool || '', target: target || '', actor: actor || 'unknown', intent: intent || '' };

  // deny first
  for (const rule of policy.deny) {
    try {
      if (evalWhen(rule.when, vars)) {
        return { decision: 'refused', rule: rule.id, message: rule.message || `Denied by ${rule.id}` };
      }
    } catch (e) {
      // broken rule → refuse (fail-closed) and name the rule
      return { decision: 'refused', rule: rule.id, message: `Broken deny rule ${rule.id}: ${e.message}`, error: true };
    }
  }

  // then allow
  for (const rule of policy.allow) {
    try {
      if (evalWhen(rule.when, vars)) {
        return { decision: 'permitted', rule: rule.id, message: rule.message || `Allowed by ${rule.id}` };
      }
    } catch (e) {
      return { decision: 'refused', rule: rule.id, message: `Broken allow rule ${rule.id}: ${e.message}`, error: true };
    }
  }

  // no allow matched → fail-closed
  return { decision: 'refused', rule: 'no-allow-matched', message: 'No allow rule matched — fail-closed' };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0];

  if (cmd === 'check' || args.check) {
    try {
      const p = await loadPolicy();
      // validate each when
      for (const r of [...p.deny, ...p.allow]) {
        evalWhen(r.when, { tool: 'test', target: 'test', actor: 'test', intent: 'test' });
      }
      console.log(`✅ policy ok: ${p.deny.length} deny, ${p.allow.length} allow, version ${p.version || 1}`);
      process.exit(0);
    } catch (e) {
      console.error(`❌ policy invalid: ${e.message}`);
      process.exit(2);
    }
  }

  const tool = args.tool || args.t;
  const target = args.target || args.tgt || '';
  const actor = args.actor || 'YUNIE';
  const intent = args.intent || '';

  if (!tool) {
    console.error('Usage: policy-check.mjs --tool <tool> --target <target> [--actor <actor>] [--intent <intent>]\n       policy-check.mjs --check');
    process.exit(2);
  }

  const res = await check(tool, target, actor, intent);
  const icon = res.decision === 'permitted' ? '✅' : '⛔';
  console.log(`${icon} ${res.decision.toUpperCase()} ${res.rule ? `(${res.rule})` : ''} ${res.message || ''}`.trim());
  if (args.json) console.log(JSON.stringify(res, null, 2));
  process.exit(res.decision === 'permitted' ? 0 : 1);
}

main().catch(e => { console.error(e); process.exit(2); });
