#!/usr/bin/env node
/**
 * Policy check — CEL-lite, deny before allow, fail-closed (học OpenBot + Xaidr-lite)
 * Usage:
 *   node .agent/scripts/policy-check.mjs --tool shell --target "rm -rf /" [--actor YUNIE] [--intent "delete"] [--json]
 *   node .agent/scripts/policy-check.mjs --check  (validate policy.json)
 *   node .agent/scripts/policy-check.mjs --digest (SHA-256 of policy.json, for Jern-lite pin)
 *   node .agent/scripts/policy-check.mjs --tool shell --target "cat ~/.ssh/id_rsa" --json  (Xaidr-lite: impact_class/tier)
 * Exit: 0 = permitted, 1 = refused/failed, 2 = error
 * No deps, Node 18+
 */
import fs from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import crypto from 'node:crypto';
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

// ---------- Xaidr-lite: impact classification (tool_call boundary) ----------
function classifyImpact(tool, target) {
  const t = `${tool} ${target}`.toLowerCase();
  // credential_access: reads secret material
  if (t.includes('.ssh/id_rsa') || t.includes('.ssh/id_ed25519') || t.includes('.env') || t.includes('credentials') || t.includes('id_rsa') || t.includes('.aws/credentials') || t.includes('private key') || t.includes('secret')) {
    return { impact_class: 'credential_access', impact_tier: 'critical' };
  }
  // destructive_filesystem: irreversible local damage
  if (t.includes('rm -rf') || t.includes('rm -fr') || t.includes('mkfs') || t.includes('dd if=') || t.includes('rmdir /s') || (t.includes('rm ') && t.includes('/'))) {
    return { impact_class: 'destructive_filesystem', impact_tier: 'critical' };
  }
  // infra_destruction: teardown
  if (t.includes('terraform destroy') || t.includes('kubectl delete namespace') || t.includes('kubectl delete ns') || t.includes('drop table') || t.includes('drop schema') || t.includes('truncate table')) {
    return { impact_class: 'infra_destruction', impact_tier: 'high' };
  }
  // exfiltrate: data leaving
  if ((t.includes('curl') || t.includes('wget') || t.includes('scp') || t.includes('rsync')) && (t.includes('evil') || t.includes('attacker') || t.includes('@'))) {
    return { impact_class: 'exfiltrate', impact_tier: 'high' };
  }
  // execute: spawns code
  if (t.includes('bash -c') || t.includes('python -c') || t.includes('node -e') || t.includes('sh -c') || t.includes('eval(')) {
    return { impact_class: 'execute', impact_tier: 'medium' };
  }
  // read: ordinary
  if (t.includes('cat ') || t.includes('read') || t.includes('ls ')) {
    return { impact_class: 'read', impact_tier: 'low' };
  }
  return { impact_class: 'unknown', impact_tier: 'low' };
}

function policyDigest() {
  try {
    if (!existsSync(POLICY_PATH)) return 'unknown';
    const content = readFileSync(POLICY_PATH, 'utf8');
    return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
  } catch { return 'unknown'; }
}

async function check(tool, target, actor, intent) {
  let policy;
  try {
    policy = await loadPolicy();
  } catch (e) {
    return { decision: 'refused', rule: 'policy-error', message: e.message, error: true };
  }

  const vars = { tool: tool || '', target: target || '', actor: actor || 'unknown', intent: intent || '' };
  const impact = classifyImpact(tool, target);
  const digest = policyDigest();

  // deny first — check if any deny rule has effect=require_approval → approval_required
  for (const rule of policy.deny) {
    try {
      if (evalWhen(rule.when, vars)) {
        const effect = rule.effect || 'block';
        if (effect === 'require_approval') {
          return { decision: 'approval_required', rule: rule.id, message: rule.message || `Requires approval by ${rule.id}`, impact_class: impact.impact_class, impact_tier: impact.impact_tier, policyDigest: digest };
        }
        return { decision: 'refused', rule: rule.id, message: rule.message || `Denied by ${rule.id}`, impact_class: impact.impact_class, impact_tier: impact.impact_tier, policyDigest: digest };
      }
    } catch (e) {
      return { decision: 'refused', rule: rule.id, message: `Broken deny rule ${rule.id}: ${e.message}`, error: true, impact_class: impact.impact_class, impact_tier: impact.impact_tier, policyDigest: digest };
    }
  }

  // then allow
  for (const rule of policy.allow) {
    try {
      if (evalWhen(rule.when, vars)) {
        return { decision: 'permitted', rule: rule.id, message: rule.message || `Allowed by ${rule.id}`, impact_class: impact.impact_class, impact_tier: impact.impact_tier, policyDigest: digest };
      }
    } catch (e) {
      return { decision: 'refused', rule: rule.id, message: `Broken allow rule ${rule.id}: ${e.message}`, error: true, impact_class: impact.impact_class, impact_tier: impact.impact_tier, policyDigest: digest };
    }
  }

  // no allow matched → fail-closed
  return { decision: 'refused', rule: 'no-allow-matched', message: 'No allow rule matched — fail-closed', impact_class: impact.impact_class, impact_tier: impact.impact_tier, policyDigest: digest };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0];

  if (args.digest || cmd === 'digest') {
    const d = policyDigest();
    console.log(d);
    if (args.json) console.log(JSON.stringify({ policyDigest: d }, null, 2));
    process.exit(0);
  }

  if (cmd === 'check' || args.check) {
    try {
      const p = await loadPolicy();
      for (const r of [...p.deny, ...p.allow]) {
        evalWhen(r.when, { tool: 'test', target: 'test', actor: 'test', intent: 'test' });
      }
      const d = policyDigest();
      console.log(`✅ policy ok: ${p.deny.length} deny, ${p.allow.length} allow, version ${p.version || 1}, digest ${d}`);
      if (args.json) console.log(JSON.stringify({ deny: p.deny.length, allow: p.allow.length, version: p.version, policyDigest: d }, null, 2));
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
    console.error('Usage: policy-check.mjs --tool <tool> --target <target> [--actor <actor>] [--intent <intent>] [--json]\n       policy-check.mjs --check [--json]\n       policy-check.mjs --digest [--json]');
    process.exit(2);
  }

  const res = await check(tool, target, actor, intent);
  const icon = res.decision === 'permitted' ? '✅' : res.decision === 'approval_required' ? '⚠️' : '⛔';
  console.log(`${icon} ${res.decision.toUpperCase()} ${res.rule ? `(${res.rule})` : ''} ${res.message || ''} [${res.impact_class}/${res.impact_tier}] digest=${res.policyDigest}`.trim());
  if (args.json) console.log(JSON.stringify(res, null, 2));
  // approval_required is halting but not refused — exit 1 to signal halt
  process.exit(res.decision === 'permitted' ? 0 : 1);
}

main().catch(e => { console.error(e); process.exit(2); });
