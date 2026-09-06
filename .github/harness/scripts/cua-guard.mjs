#!/usr/bin/env node
/**
 * CUA Guard — P2-2 Harness 2.2 (Lesson 15 Safety Guardrails) + Sandbox field guide (2026-09-05)
 * Sandbox = boundary + policy + lifecycle. 7 guardrails: scope, observe/action, secrets, untrusted, deterministic, budgets, evidence.
 * Policy defaults: egress default-deny + allowlist, workspace-only FS, short-lived tokens, resource limits, telemetry.
 * Usage:
 *   node cua-guard.mjs check --action read --url "https://docs.example.com"
 *   node cua-guard.mjs check --action submit --url "https://shop.example.com/buy" --element "Buy" --approve --verify-url "https://shop.example.com/buy" --verify-detail "price=10"
 *   node cua-guard.mjs decide --task "extract prices from known table"
 *   node cua-guard.mjs policy [--json]
 * Evidence: .agent/cua/evidence.jsonl (gitignored).
 * No deps, Node 18+
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..', '..');
const EVIDENCE_PATH = path.join(ROOT, '.agent', 'cua', 'evidence.jsonl');

const OBSERVE_ACTIONS = new Set(['read', 'navigate', 'search', 'inspect', 'screenshot']);
const RISKY_ACTIONS = new Set(['submit', 'book', 'purchase', 'delete', 'pay']);
const SENSITIVE_DOMAINS = [/bank/i, /payment/i, /paypal/i, /stripe/i];
const ALLOWED_HINT = ['docs', 'github', 'localhost', '127.0.0.1', 'example.com'];

// Sandbox field guide (2026-09-05): sandbox = boundary + policy + lifecycle.
// Policy defaults: default-deny egress, workspace-only FS, short-lived tokens, limits, telemetry.
export const POLICY_VERSION = '1.1.0';
export const POLICY_DEFAULTS = {
  version: POLICY_VERSION,
  boundary: 'process (host kernel) — for hostile code use microVM/gVisor/Wasm, not container-only',
  egress: { mode: 'default-deny', allowlist: ALLOWED_HINT },
  fs: { mode: 'workspace-only', deny: ['~/.ssh', '~/.aws', '/etc', '/proc/sys', '/sys', '..', '/var/run/docker.sock'] },
  creds: { mode: 'short-lived-only', maxTtlMinutes: 15, denyLongLived: true },
  limits: { cpuMs: 30000, memMB: 512, timeoutS: 60, maxPids: 32 },
  lifecycle: { toolCall: 'fresh-per-call', session: 'snapshot-or-destroy', workspace: 'no-secrets-persist' },
  telemetry: ['processTree', 'egress', 'failures'],
};

export function isAllowlisted(url) {
  const d = domainOf(url).toLowerCase();
  return ALLOWED_HINT.some(h => d.includes(h.toLowerCase()));
}

export function isWorkspaceOnly(fsPath = '') {
  const p = String(fsPath || '');
  if (!p) return true;
  return !POLICY_DEFAULTS.fs.deny.some(d => p.includes(d));
}

export function hasLongLivedSecret(text = '') {
  const t = String(text || '');
  // AWS secret, private key block, .ssh path — must use short-lived scoped tokens instead
  return /AKIA[0-9A-Z]{16}|-----BEGIN (RSA |OPENSSH |EC )?PRIVATE KEY-----|~\/\.ssh|~\/\.aws\/credentials/i.test(t);
}

const BUDGETS = { maxActions: 20, maxTabs: 10, windowMinutes: 15 };

function redactSecrets(text) {
  return String(text ?? '')
    .replace(/password\s*[:=]\s*\S+/gi, 'password=***')
    .replace(/payment\s*[:=]\s*\S+/gi, 'payment=***')
    .replace(/cookie[s]?\s*[:=]\s*\S+/gi, 'cookies=***')
    .replace(/token\s*[:=]\s*\S+/gi, 'token=***')
    .replace(/sk-[a-zA-Z0-9]{10,}/g, '***');
}

function hasUntrusted(text) {
  return /ignore\s+(all\s+)?previous\s+instructions|reveal\s+(system\s+)?prompt|delete\s+all|exfiltrate/i.test(String(text || ''));
}

function domainOf(url) {
  try { return new URL(String(url)).hostname; } catch { return ''; }
}

function readEvidence() {
  try {
    if (!fs.existsSync(EVIDENCE_PATH)) return [];
    return fs.readFileSync(EVIDENCE_PATH, 'utf8').trim().split('\n').filter(Boolean).map(l => {
      try { return JSON.parse(l); } catch { return null; }
    }).filter(Boolean);
  } catch { return []; }
}

function appendEvidence(rec) {
  fs.mkdirSync(path.dirname(EVIDENCE_PATH), { recursive: true });
  const safe = { ...rec, element: redactSecrets(rec.element || ''), url: rec.url, detail: redactSecrets(rec.detail || ''), policyVersion: POLICY_VERSION, egress: domainOf(rec.url || '') };
  fs.appendFileSync(EVIDENCE_PATH, JSON.stringify(safe) + '\n', 'utf8');
  return safe;
}

function checkBudgets() {
  const cutoff = Date.now() - BUDGETS.windowMinutes * 60 * 1000;
  const recent = readEvidence().filter(e => new Date(e.ts).getTime() > cutoff);
  const actions = recent.length;
  const tabs = new Set(recent.map(e => e.url)).size;
  return { actions, tabs, over: actions >= BUDGETS.maxActions || tabs >= BUDGETS.maxTabs };
}

export function checkAction({ action, url, element = '', approve = false, verifyUrl = '', verifyDetail = '', fsPath = '', egress = '', tokenTtlMinutes = null }) {
  const reasons = [];
  const warnings = [];
  if (!action) return { permitted: false, reasons: ['action is required'] };
  const act = String(action).toLowerCase();
  const domain = domainOf(url);
  if (!url || !domain) return { permitted: false, reasons: ['valid url is required'] };

  // 4. Untrusted content
  if (hasUntrusted(element)) {
    return { permitted: false, reasons: ['untrusted content: page instructs to change goal/reveal data — refused'] };
  }
  // Sandbox policy: default-deny egress — non-allowlisted domains need explicit approve
  if (!isAllowlisted(url)) {
    if (!approve) {
      return { permitted: false, reasons: [`egress default-deny: "${domain}" not in allowlist (${ALLOWED_HINT.join(', ')}) — requires --approve`] };
    }
    warnings.push(`egress allowlist bypass: "${domain}" approved explicitly`);
  }
  if (egress && !isAllowlisted(egress)) {
    if (!approve) {
      return { permitted: false, reasons: [`egress default-deny: "${egress}" not in allowlist — requires --approve`] };
    }
    warnings.push(`egress allowlist bypass: "${egress}" approved explicitly`);
  }
  // Sandbox policy: workspace-only FS
  if (fsPath && !isWorkspaceOnly(fsPath)) {
    return { permitted: false, reasons: [`workspace-only FS: "${fsPath}" touches denied path (${POLICY_DEFAULTS.fs.deny.join(', ')}) — refused`] };
  }
  // Sandbox policy: short-lived tokens only
  if (hasLongLivedSecret(element + ' ' + verifyDetail)) {
    return { permitted: false, reasons: ['long-lived credential in sandbox (AWS key / private key / ~/.ssh) — use short-lived scoped token — refused'] };
  }
  if (tokenTtlMinutes !== null && Number(tokenTtlMinutes) > POLICY_DEFAULTS.creds.maxTtlMinutes) {
    return { permitted: false, reasons: [`token TTL ${tokenTtlMinutes}m exceeds max ${POLICY_DEFAULTS.creds.maxTtlMinutes}m — use short-lived token — refused`] };
  }
  // 6. Budgets
  const b = checkBudgets();
  if (b.over) {
    return { permitted: false, reasons: [`budget exceeded: ${b.actions} actions / ${b.tabs} tabs in ${BUDGETS.windowMinutes}m`] };
  }
  // 1. Scope: sensitive domains need explicit approve
  const sensitive = SENSITIVE_DOMAINS.some(re => re.test(domain) || re.test(String(url)));
  // 2. Observe vs Action
  const isObserve = OBSERVE_ACTIONS.has(act);
  const isRisky = RISKY_ACTIONS.has(act) || (!isObserve && !['navigate', 'search'].includes(act));
  if (isObserve && !sensitive) {
    appendEvidence({ ts: new Date().toISOString(), action: act, url, element, approved: false });
    return { permitted: true, reasons: ['observe action permitted'] };
  }
  // Risky or sensitive → need approve
  if (!approve) {
    reasons.push(`${act} requires --approve (separate observation vs action)`);
    if (sensitive) reasons.push(`sensitive domain "${domain}" requires explicit approval`);
    return { permitted: false, reasons };
  }
  // 5. Deterministic checks for risky
  if (isRisky || sensitive) {
    if (!verifyUrl) reasons.push('risky action requires --verify-url');
    else if (domainOf(verifyUrl) !== domain) reasons.push('verify-url domain mismatch');
    if (!verifyDetail) reasons.push('risky action requires --verify-detail (e.g. price, recipient)');
  }
  if (reasons.length) return { permitted: false, reasons };
  // 3. Secrets redacted in evidence (+ telemetry: processTree/egress/failures)
  appendEvidence({ ts: new Date().toISOString(), action: act, url, element, approved: true, detail: verifyDetail, fsPath: fsPath || undefined, egress: egress || undefined });
  if (/password|payment|cookie|token|sk-/i.test(element + verifyDetail)) warnings.push('secrets redacted in evidence');
  return { permitted: true, reasons: ['approved + deterministic checks pass'], ...(warnings.length ? { warnings } : {}) };
}

export function decideAgentVsActor(task = '') {
  const t = String(task).toLowerCase();
  const agentHints = [/dynamic|layout.*chang|explor|pop-?up|unknown|adapt|complex workflow|find.*element/i];
  const actorHints = [/known.*(table|selector|structure)|exact selector|timing|predictable|known structure/i];
  if (actorHints.some(re => re.test(t))) return { choice: 'actor', reason: 'known structure — fast, precise' };
  if (agentHints.some(re => re.test(t))) return { choice: 'agent', reason: 'dynamic — needs adaptation' };
  return { choice: 'hybrid', reason: 'agent explore → actor execute' };
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
    if (cmd === 'check') {
      const res = checkAction({
        action: args.action, url: args.url, element: args.element || '',
        approve: !!args.approve, verifyUrl: args['verify-url'] || '', verifyDetail: args['verify-detail'] || '',
        fsPath: args['fs-path'] || args.fs || '', egress: args.egress || '',
        tokenTtlMinutes: args['token-ttl'] !== undefined ? Number(args['token-ttl']) : null,
      });
      if (args.json) console.log(JSON.stringify(res, null, 2));
      else if (res.permitted) {
        console.log(`✅ CUA permitted: ${args.action} ${args.url}`);
        (res.warnings || []).forEach(w => console.log(`  ⚠️ ${w}`));
      } else {
        console.log(`⛔ CUA refused: ${args.action} ${args.url || ''}`);
        res.reasons.forEach(r => console.log(`  - ${r}`));
      }
      process.exit(res.permitted ? 0 : 1);
    } else if (cmd === 'decide') {
      const res = decideAgentVsActor(args.task || '');
      if (args.json) console.log(JSON.stringify({ task: args.task, ...res }, null, 2));
      else console.log(`🤖 ${res.choice}: ${res.reason}`);
    } else if (cmd === 'policy') {
      if (args.json) console.log(JSON.stringify(POLICY_DEFAULTS, null, 2));
      else {
        console.log(`🛡️ CUA sandbox policy v${POLICY_VERSION}: boundary + policy + lifecycle`);
        console.log(`  boundary: ${POLICY_DEFAULTS.boundary}`);
        console.log(`  egress: ${POLICY_DEFAULTS.egress.mode} [${POLICY_DEFAULTS.egress.allowlist.join(', ')}]`);
        console.log(`  fs: ${POLICY_DEFAULTS.fs.mode} (deny: ${POLICY_DEFAULTS.fs.deny.join(', ')})`);
        console.log(`  creds: ${POLICY_DEFAULTS.creds.mode} (max TTL ${POLICY_DEFAULTS.creds.maxTtlMinutes}m)`);
        console.log(`  limits: cpu ${POLICY_DEFAULTS.limits.cpuMs}ms · mem ${POLICY_DEFAULTS.limits.memMB}MB · timeout ${POLICY_DEFAULTS.limits.timeoutS}s · pids ${POLICY_DEFAULTS.limits.maxPids}`);
        console.log(`  lifecycle: tool=${POLICY_DEFAULTS.lifecycle.toolCall} · session=${POLICY_DEFAULTS.lifecycle.session}`);
        console.log(`  telemetry: ${POLICY_DEFAULTS.telemetry.join(', ')}`);
      }
    } else {
      console.error('Usage: cua-guard.mjs <check|decide|policy> [options]');
      process.exit(2);
    }
  } catch (e) {
    console.error(`❌ ${e.message}`);
    process.exit(1);
  }
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop());
if (isMain) main();

export default { checkAction, decideAgentVsActor, POLICY_DEFAULTS, POLICY_VERSION, isAllowlisted, isWorkspaceOnly, hasLongLivedSecret };
