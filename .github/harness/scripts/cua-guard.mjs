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
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..', '..');
const EVIDENCE_PATH = path.join(ROOT, '.agent', 'cua', 'evidence.jsonl');
const IDENTITY_POLICY_PATH = path.join(ROOT, '.github', 'harness', 'cua-identity-policy.json');

const OBSERVE_ACTIONS = new Set(['read', 'navigate', 'search', 'inspect', 'screenshot']);
const RISKY_ACTIONS = new Set(['submit', 'book', 'purchase', 'delete', 'pay']);
const IDENTITY_ACTIONS = new Set(['submit', 'book', 'purchase', 'delete', 'pay', 'send', 'post', 'create-account', 'login', 'email']);
const SENSITIVE_DOMAINS = [/bank/i, /payment/i, /paypal/i, /stripe/i];
const ALLOWED_HINT = Object.freeze(['github.com', 'githubusercontent.com', 'localhost', '127.0.0.1', 'example.com']);

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

// Sandbox field guide (2026-09-05): sandbox = boundary + policy + lifecycle.
// Policy defaults: default-deny egress, workspace-only FS, short-lived tokens, limits, telemetry.
export const POLICY_VERSION = '1.2.0';
export const POLICY_DEFAULTS = deepFreeze({
  version: POLICY_VERSION,
  boundary: 'process (host kernel) — for hostile code use microVM/gVisor/Wasm, not container-only',
  egress: { mode: 'default-deny', allowlist: ALLOWED_HINT },
  identity: { mode: 'required-for-risky', unattended: 'human-takeover-required', approval: 'trusted-human-context-required', tuple: 'identity|operation|domain' },
  fs: { mode: 'workspace-only', deny: ['~/.ssh', '~/.aws', '/etc', '/proc/sys', '/sys', '..', '/var/run/docker.sock'] },
  creds: { mode: 'short-lived-only', maxTtlMinutes: 15, denyLongLived: true },
  limits: { cpuMs: 30000, memMB: 512, timeoutS: 60, maxPids: 32 },
  lifecycle: { toolCall: 'fresh-per-call', session: 'snapshot-or-destroy', workspace: 'no-secrets-persist' },
  telemetry: ['processTree', 'egress', 'failures'],
});

export function isAllowlisted(url) {
  try {
    const parsed = new URL(String(url));
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) return false;
  } catch {
    return false;
  }
  const d = domainOf(url);
  return ALLOWED_HINT.some(h => d === h || d.endsWith(`.${h}`));
}

export function workspaceFsReason(fsPath = '') {
  if (!fsPath) return '';
  const raw = String(fsPath);
  const relative = path.relative(ROOT, path.resolve(ROOT, raw));
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    return `workspace-only FS: "${raw}" resolves outside workspace root — refused`;
  }
  const segments = relative.split(path.sep);
  const denied = POLICY_DEFAULTS.fs.deny.find(entry => segments.includes(denySegment(entry)));
  return denied ? `workspace-only FS: "${raw}" touches denied segment (${POLICY_DEFAULTS.fs.deny.join(', ')}) — refused` : '';
}

function denySegment(entry) {
  const parts = String(entry).split(/[\\/]/).filter(Boolean);
  return parts[parts.length - 1] || String(entry);
}

export function isWorkspaceOnly(fsPath = '') {
  return workspaceFsReason(fsPath) === '';
}

export function hasLongLivedSecret(text = '') {
  const t = String(text || '');
  // AWS secret, private key block, .ssh path — must use short-lived scoped tokens instead
  return /AKIA[0-9A-Z]{16}|-----BEGIN (RSA |OPENSSH |EC )?PRIVATE KEY-----|~\/\.ssh|~\/\.aws\/credentials/i.test(t);
}

const BUDGETS = { maxActions: 20, maxTabs: 10, windowMinutes: 15 };

function safeOrigin(value) {
  if (typeof value !== 'string') return '';
  try {
    const parsed = new URL(value);
    if (!['http:', 'https:'].includes(parsed.protocol)) return '';
    if (parsed.username || parsed.password) return '';
    return parsed.origin;
  } catch {
    return '';
  }
}

function hasUntrusted(text) {
  return /ignore\s+(all\s+)?previous\s+instructions|reveal\s+(system\s+)?prompt|delete\s+all|exfiltrate/i.test(String(text || ''));
}

function domainOf(url) {
  try { return new URL(String(url)).hostname.toLowerCase(); } catch { return ''; }
}

function identityOf(value) {
  return String(value || '').trim().toLowerCase();
}

function isIdentityOperationAllowed(identity, action, domain, allowlist) {
  const target = `${identity}|${action}|${domain}`;
  return allowlist.some(raw => {
    const parts = String(raw || '').split('|').map(identityOf);
    return parts.length === 3 && parts.join('|') === target;
  });
}

function parseIdentityPolicy(policy) {
  if (policy?.version !== 1 || !Array.isArray(policy.allow)) return { version: 1, allow: [] };
  const valid = policy.allow.every(value => typeof value === 'string' && value.split('|').length === 3 && value.split('|').every(part => part.trim()));
  return valid ? deepFreeze({ version: 1, allow: policy.allow.map(value => value.split('|').map(identityOf).join('|')) }) : { version: 1, allow: [] };
}

function readIdentityPolicy() {
  try { return parseIdentityPolicy(JSON.parse(fs.readFileSync(IDENTITY_POLICY_PATH, 'utf8'))); }
  catch { return { version: 1, allow: [] }; }
}

const IDENTITY_POLICY = readIdentityPolicy();

function readEvidence(evidencePath = EVIDENCE_PATH) {
  if (!fs.existsSync(evidencePath)) {
    // Fresh install (no .agent/cua dir) = empty ledger; dir present but ledger gone = removed/tampered → fail closed.
    return fs.existsSync(path.dirname(evidencePath)) ? null : [];
  }
  try {
    const text = fs.readFileSync(evidencePath, 'utf8');
    if (!text.trim()) return null; // Emptied/truncated ledger = tampering evidence, not a fresh install.
    const records = [];
    for (const line of text.trim().split('\n').filter(Boolean)) {
      const record = JSON.parse(line);
      if (!record || typeof record !== 'object' || Number.isNaN(Date.parse(record.ts))) return null;
      records.push(record);
    }
    return records;
  } catch {
    return null;
  }
}

function appendEvidence(rec, evidencePath = EVIDENCE_PATH) {
  fs.mkdirSync(path.dirname(evidencePath), { recursive: true });
  const safe = {
    ts: rec.ts,
    action: displayAction(rec.action).slice(0, 32),
    operation: rec.operation === undefined ? undefined : displayAction(rec.operation).slice(0, 32),
    identityHash: rec.identity ? crypto.createHash('sha256').update(identityOf(rec.identity)).digest('hex').slice(0, 16) : undefined,
    approvedByCaller: rec.approvedByCaller === true,
    decision: rec.decision || 'unknown',
    reasonCode: rec.reasonCode || 'unknown',
    origin: safeOrigin(rec.url || ''),
    policyVersion: POLICY_VERSION,
    egress: domainOf(rec.url || ''),
  };
  fs.appendFileSync(evidencePath, JSON.stringify(safe) + '\n', 'utf8');
  return safe;
}

function checkBudgets(evidencePath = EVIDENCE_PATH) {
  const records = readEvidence(evidencePath);
  if (records === null) return { actions: 0, tabs: 0, over: true, error: 'evidence unreadable or malformed' };
  const cutoff = Date.now() - BUDGETS.windowMinutes * 60 * 1000;
  // Only permitted actions consume budget — refused attempts do nothing and must not lock out the window (self-DoS).
  const recent = records.filter(e => e.decision === 'permitted' && new Date(e.ts).getTime() > cutoff);
  const actions = recent.length;
  const tabs = new Set(recent.map(e => e.origin).filter(Boolean)).size;
  return { actions, tabs, over: actions >= BUDGETS.maxActions || tabs >= BUDGETS.maxTabs };
}

function checkTokenTtl(tokenTtlMinutes) {
  if (tokenTtlMinutes === null || tokenTtlMinutes === undefined) return [];
  const isNumber = typeof tokenTtlMinutes === 'number';
  const isDecimal = typeof tokenTtlMinutes === 'string' && /^\d+(?:\.\d+)?$/.test(tokenTtlMinutes);
  if (!isNumber && !isDecimal) return ['invalid token TTL — use a decimal value > 0 and <= 15'];
  const ttl = Number(tokenTtlMinutes);
  if (!Number.isFinite(ttl) || ttl <= 0) return ['invalid token TTL — use a finite value > 0'];
  if (ttl > POLICY_DEFAULTS.creds.maxTtlMinutes) return [`token TTL ${tokenTtlMinutes}m exceeds max ${POLICY_DEFAULTS.creds.maxTtlMinutes}m — use short-lived token — refused`];
  return [];
}

function checkEgress(url, egress, approve) {
  if (egress !== undefined && egress !== null && egress !== '' && !safeOrigin(egress)) return ['egress must be a valid http/https URL without credentials'];
  if (!isAllowlisted(url) && !approve) return [`egress default-deny: "${domainOf(url)}" not in allowlist (${ALLOWED_HINT.join(', ')}) — requires --approve`];
  if (egress && !isAllowlisted(egress) && !approve) return [`egress default-deny: "${domainOf(egress)}" not in allowlist — requires --approve`];
  return [];
}

function checkSandboxRequest({ url, element, fsPath, tokenTtlMinutes, approve, egress }) {
  if (!safeOrigin(url)) return ['valid http/https URL is required'];
  const egressReasons = checkEgress(url, egress, approve);
  if (egressReasons.length) return egressReasons;
  if (hasUntrusted(element)) return ['untrusted content: page instructs to change goal/reveal data — refused'];
  const fsReason = workspaceFsReason(fsPath);
  if (fsReason) return [fsReason];
  if (hasLongLivedSecret(fsPath)) return ['long-lived credential path in sandbox (AWS key / private key / ~/.ssh) — use short-lived scoped token — refused'];
  if (hasLongLivedSecret(element)) return ['long-lived credential in sandbox (AWS key / private key / ~/.ssh) — use short-lived scoped token — refused'];
  return checkTokenTtl(tokenTtlMinutes);
}

function classifyAction(act) {
  const isObserve = OBSERVE_ACTIONS.has(act);
  return {
    isObserve,
    isRisky: RISKY_ACTIONS.has(act) || IDENTITY_ACTIONS.has(act) || !isObserve,
  };
}

function identityTupleReasons({ needsIdentity, principal, act, domain, allowlist }) {
  if (!needsIdentity) return [];
  const reasons = [];
  if (!principal) reasons.push('identity is required for identity-bearing action');
  if (!isIdentityOperationAllowed(principal, act, domain, allowlist)) reasons.push(`identity-operation-domain not allowlisted: ${principal}|${act}|${domain}`);
  return reasons;
}

function verificationReasons(request, input) {
  const sensitive = SENSITIVE_DOMAINS.some(re => re.test(request.domain) || re.test(input.url));
  const risky = classifyAction(request.act).isRisky;
  if (!risky && !sensitive) return [];
  const label = risky ? 'risky action' : 'sensitive URL';
  const reasons = [];
  if (!safeOrigin(input.verifyUrl)) reasons.push(`${label} requires valid http/https --verify-url`);
  else if (domainOf(input.verifyUrl) !== request.domain) reasons.push('verify-url domain mismatch');
  if (typeof input.verifyDetail !== 'string' || !input.verifyDetail.trim()) reasons.push(`${label} requires non-empty --verify-detail`);
  return reasons;
}

function checkIdentityGate({ act, domain, principal, approve, unattended, allowlist, sensitive }) {
  const { isObserve, isRisky } = classifyAction(act);
  const needsIdentity = isRisky || sensitive;
  if (isObserve && !sensitive) return { permitted: true, metadata: { operation: act, egress: domain } };
  if (needsIdentity && unattended) return { permitted: false, reasons: [`human takeover required for unattended ${act}`] };
  const reasons = identityTupleReasons({ needsIdentity, principal, act, domain, allowlist });
  if (!approve) reasons.push(sensitive ? `sensitive URL (${domain}) requires explicit approval — bank/payment keyword` : `${act} requires --approve (separate observation vs action)`);
  if (needsIdentity) reasons.push('trusted human approval context is required; caller flags cannot grant it');
  return { permitted: reasons.length === 0, reasons, operation: act, egress: domain, ...(principal ? { identity: principal } : {}) };
}

function parseActionRequest({ action, url, identity } = {}) {
  if (!action) return { error: { permitted: false, reasons: ['action is required'] } };
  const act = String(action).toLowerCase();
  if (!/^[a-z][a-z0-9_-]{0,31}$/.test(act)) return { error: { permitted: false, reasons: ['action must be a short operation name (a-z, 0-9, -, _)'] } };
  const domain = domainOf(url);
  if (!safeOrigin(url) || !domain) return { error: { permitted: false, reasons: ['valid http/https url is required'] } };
  return { act, domain, principal: identityOf(identity) };
}

function collectEgressWarnings(url, egress, approve) {
  const warnings = [];
  if (!isAllowlisted(url) && approve) warnings.push(`egress allowlist bypass: "${domainOf(url)}" approved by caller flag (untrusted) — no human verification enforced`);
  const target = safeOrigin(egress);
  if (target && !isAllowlisted(target) && approve) warnings.push(`egress allowlist bypass: "${domainOf(target)}" approved by caller flag (untrusted) — no human verification enforced`);
  return warnings;
}

function sandboxWarnings(input) {
  const reasons = checkSandboxRequest(input);
  if (reasons.length) return { reasons, warnings: [] };
  return { reasons: [], warnings: collectEgressWarnings(input.url, input.egress, input.approve) };
}

function budgetReason() {
  const budget = checkBudgets();
  if (budget.error) return [budget.error];
  return budget.over ? [`budget exceeded: ${budget.actions} permitted actions / ${budget.tabs} tabs in ${BUDGETS.windowMinutes}m`] : [];
}

function safeInputOf(input) {
  return input && typeof input === 'object' ? input : {};
}

const CUA_INPUT_KEYS = new Set(['action', 'url', 'element', 'verifyUrl', 'verifyDetail', 'fsPath', 'fs', 'egress', 'tokenTtlMinutes', 'identity', 'approve', 'unattended', 'allowIdentityOp', 'supervised']);
const CUA_STRING_KEYS = ['action', 'url', 'element', 'verifyUrl', 'verifyDetail', 'fsPath', 'fs', 'egress', 'identity'];
const CUA_BOOLEAN_INPUT_KEYS = ['approve', 'unattended', 'supervised'];

function displayAction(action) {
  return String(action || 'unknown').replace(/[^\w.-]/g, '?');
}

function displayUrl(url) {
  return safeOrigin(url) || '<invalid-url>';
}

function inputTypeError(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return 'input must be a plain object';
  const proto = Object.getPrototypeOf(input);
  if (proto !== Object.prototype && proto !== null) return 'input must be a plain object';
  const unknown = Object.keys(input).find(key => !CUA_INPUT_KEYS.has(key));
  if (unknown) return `unknown input field ${unknown}`;
  const badString = CUA_STRING_KEYS.find(key => input[key] !== undefined && typeof input[key] !== 'string');
  if (badString) return `${badString} must be a string`;
  const badBoolean = CUA_BOOLEAN_INPUT_KEYS.find(key => input[key] !== undefined && typeof input[key] !== 'boolean');
  if (badBoolean) return `${badBoolean} must be a boolean`;
  return null;
}

function inputPolicyError(input) {
  if (input.tokenTtlMinutes !== undefined && input.tokenTtlMinutes !== null && typeof input.tokenTtlMinutes !== 'number' && typeof input.tokenTtlMinutes !== 'string') return 'tokenTtlMinutes must be a number or decimal string';
  if (input.allowIdentityOp !== undefined) return 'operator policy tuple cannot be supplied by caller';
  if (input.supervised !== undefined) return 'trusted human context cannot be supplied by caller input';
  if (Object.hasOwn(input, 'fs') && Object.hasOwn(input, 'fsPath')) return 'use only one of fs or fsPath';
  return null;
}

function recordEvidence({ action, operation, identity, url, approvedByCaller, decision, reasonCode }) {
  appendEvidence({ ts: new Date().toISOString(), action, operation, identity, url, approvedByCaller: approvedByCaller === true, decision, reasonCode });
}

function mergeWarnings(preflightWarnings, result) {
  if (!preflightWarnings.length || !result.permitted) return result;
  return { ...result, warnings: [...preflightWarnings, ...(result.warnings || [])] };
}

export function checkAction(input = {}) {
  const safeInput = safeInputOf(input);
  const approvedByCaller = safeInput.approve === true;
  const typeError = inputTypeError(safeInput) || inputPolicyError(safeInput);
  if (typeError) {
    recordEvidence({ action: 'invalid', url: '', approvedByCaller, decision: 'refused', reasonCode: 'input' });
    return { permitted: false, reasons: [typeError] };
  }
  const request = parseActionRequest(safeInput);
  if (request.error) {
    recordEvidence({ action: 'invalid', url: '', approvedByCaller, decision: 'refused', reasonCode: 'request' });
    return request.error;
  }
  const { act, domain, principal } = request;
  const normalizedInput = { ...safeInput, fsPath: safeInput.fsPath ?? safeInput.fs };
  const evidenceFields = { action: act, operation: act, identity: principal, url: normalizedInput.url, approvedByCaller };
  const preflight = sandboxWarnings(normalizedInput);
  if (preflight.reasons.length) {
    recordEvidence({ ...evidenceFields, decision: 'refused', reasonCode: 'sandbox' });
    return { permitted: false, reasons: preflight.reasons };
  }
  const sensitive = SENSITIVE_DOMAINS.some(re => re.test(domain) || re.test(normalizedInput.url));
  const verification = verificationReasons(request, normalizedInput);
  const identityGate = checkIdentityGate({ act, domain, principal, approve: safeInput.approve, unattended: safeInput.unattended, allowlist: IDENTITY_POLICY.allow, sensitive });
  if (identityGate.permitted === false && verification.length === 0) {
    recordEvidence({ ...evidenceFields, decision: 'refused', reasonCode: 'identity' });
    return { permitted: false, ...identityGate };
  }
  if (verification.length) {
    recordEvidence({ ...evidenceFields, decision: 'refused', reasonCode: 'verification' });
    return { permitted: false, reasons: [...identityGate.reasons || [], ...verification] };
  }
  const overBudget = budgetReason();
  if (overBudget.length) {
    recordEvidence({ ...evidenceFields, decision: 'refused', reasonCode: 'budget' });
    return { permitted: false, reasons: overBudget };
  }
  recordEvidence({ ...evidenceFields, decision: 'permitted', reasonCode: 'observe' });
  return mergeWarnings(preflight.warnings, { permitted: true, reasons: ['observe action permitted'], ...identityGate.metadata });
}

export function decideAgentVsActor(task = '') {
  const t = String(task).toLowerCase();
  const agentHints = [/dynamic|layout.*chang|explor|pop-?up|unknown|adapt|complex workflow|find.*element/i];
  const actorHints = [/known.*(table|selector|structure)|exact selector|timing|predictable|known structure/i];
  if (actorHints.some(re => re.test(t))) return { choice: 'actor', reason: 'known structure — fast, precise' };
  if (agentHints.some(re => re.test(t))) return { choice: 'agent', reason: 'dynamic — needs adaptation' };
  return { choice: 'hybrid', reason: 'agent explore → actor execute' };
}

const CUA_BOOLEAN_OPTIONS = new Set(['approve', 'unattended', 'json']);
const CUA_SCALAR_OPTIONS = new Set(['action', 'url', 'element', 'verify-url', 'verify-detail', 'fs-path', 'fs', 'egress', 'token-ttl', 'identity', 'task', 'allow-identity-op']);

function parseCuaBoolean(key, eq, token, next) {
  if (eq < 0) {
    if (next === 'true' || next === 'false') return { value: next === 'true', consumed: 1 };
    return { value: true, consumed: 0 };
  }
  const value = token.slice(eq + 1);
  if (value !== 'true' && value !== 'false') throw new Error(`--${key} must be true or false`);
  return { value: value === 'true', consumed: 0 };
}

function parseCuaScalar(key, eq, token, next) {
  if (eq >= 0) {
    const value = token.slice(eq + 1);
    if (!value) throw new Error(`--${key} requires a value`);
    return { value, consumed: 0 };
  }
  if (!next || next.startsWith('--')) throw new Error(`--${key} requires a value`);
  return { value: next, consumed: 1 };
}

function parseCuaOption(token, next, seen) {
  const eq = token.indexOf('=');
  const key = eq >= 0 ? token.slice(2, eq) : token.slice(2);
  if (!CUA_BOOLEAN_OPTIONS.has(key) && !CUA_SCALAR_OPTIONS.has(key)) throw new Error(`unknown option --${key}`);
  if (seen.has(key)) throw new Error(`duplicate --${key}`);
  seen.add(key);
  if (CUA_BOOLEAN_OPTIONS.has(key)) return { key, ...parseCuaBoolean(key, eq, token, next) };
  return { key, ...parseCuaScalar(key, eq, token, next) };
}

function parseArgs(argv) {
  const out = { _: [] };
  const seen = new Set();
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith('--')) {
      out._.push(token);
      continue;
    }
    const parsed = parseCuaOption(token, argv[i + 1], seen);
    out[parsed.key] = parsed.value;
    i += parsed.consumed;
  }
  if (out._.length > 1) throw new Error('unexpected positional argument');
  return out;
}

function requestFromArgs(args) {
  const scalar = (name) => typeof args[name] === 'string' ? args[name] : '';
  const ttl = args['token-ttl'];
  return {
    action: scalar('action'), url: scalar('url'), element: scalar('element'),
    approve: args.approve === true, verifyUrl: scalar('verify-url'), verifyDetail: scalar('verify-detail'),
    fsPath: scalar('fs-path') || scalar('fs'), egress: scalar('egress'),
    tokenTtlMinutes: ttl === undefined ? null : ttl,
    identity: scalar('identity'), unattended: args.unattended === true,
    ...(Object.hasOwn(args, 'allow-identity-op') ? { allowIdentityOp: scalar('allow-identity-op') } : {}),
  };
}

function printCheckResult(args, result) {
  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  if (result.permitted) {
    console.log(`✅ CUA permitted: ${displayAction(args.action)} ${displayUrl(args.url)}`);
    (result.warnings || []).forEach(w => console.log(`  ⚠️ ${w}`));
    return;
  }
  console.log(`⛔ CUA refused: ${displayAction(args.action)} ${displayUrl(args.url)}`);
  result.reasons.forEach(reason => console.log(`  - ${reason}`));
}

function runCheck(args) {
  const result = checkAction(requestFromArgs(args));
  printCheckResult(args, result);
  process.exit(result.permitted ? 0 : 1);
}

function runDecide(args) {
  const result = decideAgentVsActor(args.task || '');
  if (args.json) console.log(JSON.stringify({ task: args.task, ...result }, null, 2));
  else console.log(`🤖 ${result.choice}: ${result.reason}`);
}

function printPolicy(json) {
  if (json) {
    console.log(JSON.stringify(POLICY_DEFAULTS, null, 2));
    return;
  }
  console.log(`🛡️ CUA sandbox policy v${POLICY_VERSION}: boundary + policy + lifecycle`);
  console.log(`  boundary: ${POLICY_DEFAULTS.boundary}`);
  console.log(`  egress: ${POLICY_DEFAULTS.egress.mode} [${POLICY_DEFAULTS.egress.allowlist.join(', ')}]`);
  console.log(`  identity: ${POLICY_DEFAULTS.identity.mode} · unattended=${POLICY_DEFAULTS.identity.unattended} · approval=${POLICY_DEFAULTS.identity.approval} · tuple=${POLICY_DEFAULTS.identity.tuple}`);
  console.log(`  fs: ${POLICY_DEFAULTS.fs.mode} (deny: ${POLICY_DEFAULTS.fs.deny.join(', ')})`);
  console.log(`  creds: ${POLICY_DEFAULTS.creds.mode} (max TTL ${POLICY_DEFAULTS.creds.maxTtlMinutes}m; validated only when caller declares --token-ttl)`);
  console.log(`  limits: cpu ${POLICY_DEFAULTS.limits.cpuMs}ms · mem ${POLICY_DEFAULTS.limits.memMB}MB · timeout ${POLICY_DEFAULTS.limits.timeoutS}s · pids ${POLICY_DEFAULTS.limits.maxPids}  (declared — enforced by executor, not by this checker)`);
  console.log(`  lifecycle: tool=${POLICY_DEFAULTS.lifecycle.toolCall} · session=${POLICY_DEFAULTS.lifecycle.session}`);
  console.log(`  telemetry: ${POLICY_DEFAULTS.telemetry.join(', ')}  (declared — this checker writes redacted evidence only)`);
  console.log(`  identity.allow: ${IDENTITY_POLICY.allow.length} tuple(s) — inert until a trusted human takeover channel exists (P1); risky identity actions stay fail-closed`);
}

function main() {
  try {
    const args = parseArgs(process.argv.slice(2));
    const cmd = args._[0];
    if (cmd === 'check') runCheck(args);
    else if (cmd === 'decide') runDecide(args);
    else if (cmd === 'policy') printPolicy(args.json);
    else {
      console.error('Usage: cua-guard.mjs <check|decide|policy> [options]');
      process.exit(2);
    }
  } catch (error) {
    console.error(`❌ ${error.message}`);
    process.exit(1);
  }
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop());
if (isMain) main();

export default { checkAction, decideAgentVsActor, POLICY_DEFAULTS, POLICY_VERSION, isAllowlisted, isWorkspaceOnly, workspaceFsReason, hasLongLivedSecret };
