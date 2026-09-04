#!/usr/bin/env node
/**
 * Audit trail — append-only JSONL
 * Usage:
 *   node .agent/scripts/audit.mjs log --tool read --target "www/status.json" --decision permitted [--actor YUNIE] [--rule id] [--durationMs 12] [--error msg]
 *   node .agent/scripts/audit.mjs tail [--n 20]
 *   node .agent/scripts/audit.mjs stats [--json]
 * No deps, Node 18+
 */
import fs from 'node:fs/promises';
import { existsSync, createReadStream, readFileSync } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import readline from 'node:readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..', '..');
const AUDIT_PATH = path.join(ROOT, '.agent', 'audit.jsonl');
const AUDIT_KEY_PATH = path.join(ROOT, '.agent', 'audit.key');

// ---------- JCS canonical JSON (RFC 8785 subset, P0-4) ----------
function canonicalize(value) {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('Non-finite number cannot be canonicalized');
    return JSON.stringify(value);
  }
  if (typeof value === 'string') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(canonicalize).join(',') + ']';
  if (typeof value === 'object') {
    const keys = Object.keys(value).sort();
    return '{' + keys.map(k => JSON.stringify(k) + ':' + canonicalize(value[k])).join(',') + '}';
  }
  throw new Error(`Cannot canonicalize ${typeof value}`);
}

function b64urlEncode(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(s) {
  s = String(s).replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return Buffer.from(s, 'base64');
}

async function getOrCreateKeypair() {
  try {
    if (existsSync(AUDIT_KEY_PATH)) {
      const raw = await fs.readFile(AUDIT_KEY_PATH, 'utf8');
      const j = JSON.parse(raw);
      if (j.priv && j.pub) return j;
    }
  } catch {}
  // generate new ed25519 keypair
  let kp;
  try {
    kp = crypto.generateKeyPairSync('ed25519');
  } catch (e) {
    return { unsupported: true, error: e.message };
  }
  const privDer = kp.privateKey.export({ format: 'der', type: 'pkcs8' });
  const pubDer = kp.publicKey.export({ format: 'der', type: 'spki' });
  const j = { priv: b64urlEncode(privDer), pub: b64urlEncode(pubDer), createdAt: new Date().toISOString() };
  try {
    const fsp = await import('node:fs/promises');
    await fsp.mkdir(path.dirname(AUDIT_KEY_PATH), { recursive: true });
    await fsp.writeFile(AUDIT_KEY_PATH, JSON.stringify(j), { mode: 0o600 });
    try { await fsp.chmod(AUDIT_KEY_PATH, 0o600); } catch {}
  } catch {}
  return { ...j, _created: true };
}

async function getPublicKey() {
  if (!existsSync(AUDIT_KEY_PATH)) return null;
  try {
    const fsp = await import('node:fs/promises');
    const raw = await fsp.readFile(AUDIT_KEY_PATH, 'utf8');
    const j = JSON.parse(raw);
    return j.pub || null;
  } catch { return null; }
}

function signPayload(canonical, privB64) {
  const privDer = b64urlDecode(privB64);
  const privateKey = crypto.createPrivateKey({ key: privDer, format: 'der', type: 'pkcs8' });
  const sig = crypto.sign(null, Buffer.from(canonical, 'utf8'), privateKey);
  return b64urlEncode(sig);
}

function verifyPayload(canonical, sigB64, pubB64) {
  try {
    const pubDer = b64urlDecode(pubB64);
    const publicKey = crypto.createPublicKey({ key: pubDer, format: 'der', type: 'spki' });
    const sig = b64urlDecode(sigB64);
    return crypto.verify(null, Buffer.from(canonical, 'utf8'), publicKey, sig);
  } catch {
    return false;
  }
}

function receiptPayload(event) {
  // Payload đã ký: mọi field trừ sig/pub (JCS canonical)
  const { sig, pub, ...rest } = event;
  void sig; void pub;
  return rest;
}

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
    } else if (a.startsWith('-')) {
      const key = a.slice(1);
      const next = argv[i + 1];
      if (next && !next.startsWith('-')) {
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

function redactTarget(target) {
  if (!target) return target;
  const lower = target.toLowerCase();
  const sensitive = ['sk-', 'cpk-', 'key', 'token', 'secret', 'password', 'credentials.enc.json'];
  for (const s of sensitive) {
    if (lower.includes(s)) {
      // if it's a credential file path, keep path but redact value part
      if (target.includes('credentials.enc.json')) return target;
      // if target looks like a key value (long), redact
      if (target.length > 20 && (target.includes('sk-') || target.includes('cpk-'))) return '***';
    }
  }
  // redact if target contains actual secret value pattern
  if (/sk-[a-zA-Z0-9]{10,}/.test(target) || /cpk-[a-zA-Z0-9]{10,}/.test(target)) return '***';
  return target;
}

function canonicalHash(prevHash, e) {
  // Backward compat: old events (pre-Jern-lite) don't have policyDigest/tokens — hash without them
  // New events have them — hash with them. Detect by presence in event.
  const hasNewFields = e.policyDigest !== undefined || e.tokens !== undefined;
  if (hasNewFields) {
    const core = { ts: e.ts, actor: e.actor, tool: e.tool, target: e.target, decision: e.decision, rule: e.rule, durationMs: e.durationMs ?? null, error: e.error ?? null, intent: e.intent ?? null, requestId: e.requestId, policyDigest: e.policyDigest ?? null, tokens: e.tokens ?? null };
    return crypto.createHash('sha256').update(prevHash + '|' + JSON.stringify(core)).digest('hex').slice(0, 16);
  }
  const core = { ts: e.ts, actor: e.actor, tool: e.tool, target: e.target, decision: e.decision, rule: e.rule, durationMs: e.durationMs ?? null, error: e.error ?? null, intent: e.intent ?? null, requestId: e.requestId };
  return crypto.createHash('sha256').update(prevHash + '|' + JSON.stringify(core)).digest('hex').slice(0, 16);
}

function policyDigestSync() {
  try {
    const p = path.join(ROOT, '.agent', 'policy.json');
    if (!existsSync(p)) return null;
    const content = readFileSync(p, 'utf8');
    return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
  } catch { return null; }
}

async function cmdLog(args) {
  const tool = args.tool || args.t;
  const target = args.target || args.tgt || '';
  const decision = args.decision || args.d;
  const actor = args.actor || 'YUNIE';
  const rule = args.rule || null;
  const durationMs = args.durationMs ? Number(args.durationMs) : undefined;
  const error = args.error || null;
  const intent = args.intent || null;
  const traceId = args.traceId || args.trace || null;
  const spanId = args.spanId || args.span || null;
  const parentSpan = args.parentSpan || null;
  const tokens = args.tokens ? Number(args.tokens) : (args.tokenCount ? Number(args.tokenCount) : null);
  const policyDigest = args.policyDigest || policyDigestSync();

  if (!tool || !decision) {
    console.error('Usage: audit.mjs log --tool <tool> --target <target> --decision <permitted|refused|failed> [--actor <actor>] [--rule <id>] [--durationMs <n>] [--error <msg>]');
    process.exit(1);
  }
  if (!['permitted', 'refused', 'failed'].includes(decision)) {
    console.error('decision must be permitted|refused|failed');
    process.exit(1);
  }

  // hash-chain (KN-012, BTP notary-lite): prevHash + sha256 → tamper-evident
  let prevHash = 'GENESIS';
  try {
    if (existsSync(AUDIT_PATH)) {
      const prev = (await fs.readFile(AUDIT_PATH, 'utf8')).trim().split('\n').filter(Boolean).pop();
      if (prev) {
        const last = JSON.parse(prev);
        if (last.hash) prevHash = last.hash;
      }
    }
  } catch {}
  const event = {
    ts: new Date().toISOString(),
    actor,
    tool,
    target: redactTarget(target),
    decision,
    rule,
    durationMs: durationMs ?? null,
    error: error ? String(error).slice(0, 500) : null,
    intent: intent || null,
    requestId: crypto.randomBytes(3).toString('hex'),
    prevHash,
    ...(policyDigest ? { policyDigest } : {}),
    ...(tokens !== null ? { tokens } : {}),
    ...(traceId ? { traceId: String(traceId).slice(0, 64) } : {}),
    ...(spanId ? { spanId: String(spanId).slice(0, 64) } : {}),
    ...(parentSpan ? { parentSpan: String(parentSpan).slice(0, 64) } : {}),
  };
  event.hash = canonicalHash(prevHash, event);

  // P0-4 Receipt: JCS canonical + Ed25519 sign (0 deps, node:crypto)
  let sigInfo = '';
  try {
    const kp = await getOrCreateKeypair();
    if (kp.unsupported) {
      console.error(`⚠️ ed25519 unsupported: ${kp.error} — logging without signature`);
    } else {
      if (kp._created) console.error(`⚠️ created new audit keypair at .agent/audit.key (keep private, never commit)`);
      const payload = receiptPayload(event);
      const canon = canonicalize(payload);
      event.sig = signPayload(canon, kp.priv);
      event.pub = kp.pub;
      sigInfo = ` sig=${String(event.sig).slice(0, 12)}…`;
    }
  } catch (e) {
    console.error(`⚠️ sign failed: ${e.message} — logging without signature`);
  }

  await fs.mkdir(path.dirname(AUDIT_PATH), { recursive: true });
  await fs.appendFile(AUDIT_PATH, JSON.stringify(event) + '\n', 'utf8');
  console.log(`✅ audit logged: ${event.decision} ${event.tool} ${event.target} ${event.rule ? '(' + event.rule + ')' : ''} [${event.requestId}] hash=${event.hash}${sigInfo}`);
}

async function cmdKeygen() {
  const kp = await getOrCreateKeypair();
  if (kp.unsupported) {
    console.error(`❌ ed25519 unsupported: ${kp.error}`);
    process.exit(2);
  }
  if (kp._created) console.log(`✅ keypair created at .agent/audit.key (0600, gitignored)`);
  else console.log(`✅ keypair already exists at .agent/audit.key`);
  console.log(`pub: ${kp.pub}`);
}

async function cmdPubkey() {
  const pub = await getPublicKey();
  if (!pub) {
    console.error('No keypair yet — run: node .agent/scripts/audit.mjs keygen');
    process.exit(2);
  }
  console.log(pub);
}

async function cmdTail(args) {
  const n = Number(args.n || args.lines || 20);
  if (!existsSync(AUDIT_PATH)) {
    console.log('No audit log yet — .agent/audit.jsonl not found');
    return;
  }
  const lines = (await fs.readFile(AUDIT_PATH, 'utf8')).trim().split('\n').filter(Boolean);
  const tail = lines.slice(-n);
  for (const line of tail) {
    try {
      const e = JSON.parse(line);
      const ruleStr = e.rule ? ` rule=${e.rule}` : '';
      const errStr = e.error ? ` error=${e.error}` : '';
      console.log(`${e.ts} ${e.decision.padEnd(9)} ${e.tool.padEnd(12)} ${e.target}${ruleStr}${errStr} [${e.requestId}] actor=${e.actor}`);
    } catch {
      console.log(line);
    }
  }
  console.log(`\n— ${tail.length}/${lines.length} events shown`);
}

async function cmdStats(args) {
  if (!existsSync(AUDIT_PATH)) {
    const out = { total: 0, permitted: 0, refused: 0, failed: 0, lastTs: null };
    if (args.json) console.log(JSON.stringify(out, null, 2));
    else console.log(`audit: 0 events (no log yet)`);
    return;
  }
  const text = await fs.readFile(AUDIT_PATH, 'utf8');
  const lines = text.trim().split('\n').filter(Boolean);
  let permitted = 0, refused = 0, failed = 0;
  let lastTs = null;
  for (const line of lines) {
    try {
      const e = JSON.parse(line);
      if (e.decision === 'permitted') permitted++;
      else if (e.decision === 'refused') refused++;
      else if (e.decision === 'failed') failed++;
      if (e.ts) lastTs = e.ts;
    } catch {}
  }
  const out = { total: lines.length, permitted, refused, failed, lastTs };
  if (args.json) {
    console.log(JSON.stringify(out, null, 2));
  } else {
    console.log(`audit: ${out.total} total · ${out.permitted} permitted · ${out.refused} refused · ${out.failed} failed${out.lastTs ? ` · last ${out.lastTs}` : ''}`);
  }
}

async function cmdVerify(args) {
  if (!existsSync(AUDIT_PATH)) {
    console.log('No audit log yet — .agent/audit.jsonl not found');
    return;
  }
  const lines = (await fs.readFile(AUDIT_PATH, 'utf8')).trim().split('\n').filter(Boolean);
  let prevHash = 'GENESIS';
  let ok = 0, legacy = 0, broken = 0;
  let sigOk = 0, sigFail = 0, sigLegacy = 0;
  let brokenAt = -1;
  let sigFailAt = -1;
  for (let i = 0; i < lines.length; i++) {
    let e;
    try { e = JSON.parse(lines[i]); } catch { broken++; if (brokenAt < 0) brokenAt = i; continue; }
    if (!e.hash) { legacy++; prevHash = e.hash || prevHash; continue; } // pre-chain events: skip link check
    if (e.prevHash !== prevHash) { broken++; if (brokenAt < 0) brokenAt = i; prevHash = e.hash || prevHash; continue; }
    if (canonicalHash(e.prevHash, e) !== e.hash) { broken++; if (brokenAt < 0) brokenAt = i; prevHash = e.hash; continue; }
    prevHash = e.hash;
    ok++;
    // P0-4: verify Ed25519 receipt if present
    if (!e.sig || !e.pub) {
      sigLegacy++;
    } else {
      try {
        const payload = receiptPayload(e);
        const canon = canonicalize(payload);
        if (verifyPayload(canon, e.sig, e.pub)) sigOk++;
        else { sigFail++; if (sigFailAt < 0) sigFailAt = i; broken++; if (brokenAt < 0) brokenAt = i; }
      } catch {
        sigFail++; if (sigFailAt < 0) sigFailAt = i; broken++; if (brokenAt < 0) brokenAt = i;
      }
    }
  }
  const out = { total: lines.length, chained: ok, legacy, broken, brokenAt, chainOk: broken === 0, sigOk, sigFail, sigLegacy, sigFailAt };
  if (args.json) console.log(JSON.stringify(out, null, 2));
  else if (broken > 0) console.log(`❌ audit chain BROKEN: ${broken} bad event(s), first at line ${brokenAt + 1}/${lines.length} · chained ${ok} · legacy ${legacy} · sig ok ${sigOk} / fail ${sigFail} / legacy ${sigLegacy}${sigFailAt >= 0 ? ` (first sig fail line ${sigFailAt + 1})` : ''}`);
  else console.log(`✅ audit chain OK: ${ok} chained · ${legacy} legacy (pre-chain) · ${lines.length} total · sig ok ${sigOk} / legacy ${sigLegacy}`);
  if (broken > 0) process.exit(1);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0] || 'stats';
  if (cmd === 'log') await cmdLog(args);
  else if (cmd === 'tail') await cmdTail(args);
  else if (cmd === 'stats') await cmdStats(args);
  else if (cmd === 'verify') await cmdVerify(args);
  else if (cmd === 'keygen') await cmdKeygen();
  else if (cmd === 'pubkey') await cmdPubkey();
  else if (cmd === 'digest') {
    const d = policyDigestSync();
    console.log(d || 'unknown');
    if (args.json) console.log(JSON.stringify({ policyDigest: d }, null, 2));
  }
  else {
    console.error(`Unknown command: ${cmd}\nUsage: audit.mjs <log|tail|stats|verify|keygen|pubkey|digest> [options]`);
    process.exit(1);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
