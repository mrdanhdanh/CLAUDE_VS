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
import { existsSync, createReadStream } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import readline from 'node:readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..', '..');
const AUDIT_PATH = path.join(ROOT, '.agent', 'audit.jsonl');

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

async function cmdLog(args) {
  const tool = args.tool || args.t;
  const target = args.target || args.tgt || '';
  const decision = args.decision || args.d;
  const actor = args.actor || 'YUNIE';
  const rule = args.rule || null;
  const durationMs = args.durationMs ? Number(args.durationMs) : undefined;
  const error = args.error || null;
  const intent = args.intent || null;

  if (!tool || !decision) {
    console.error('Usage: audit.mjs log --tool <tool> --target <target> --decision <permitted|refused|failed> [--actor <actor>] [--rule <id>] [--durationMs <n>] [--error <msg>]');
    process.exit(1);
  }
  if (!['permitted', 'refused', 'failed'].includes(decision)) {
    console.error('decision must be permitted|refused|failed');
    process.exit(1);
  }

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
  };

  await fs.mkdir(path.dirname(AUDIT_PATH), { recursive: true });
  await fs.appendFile(AUDIT_PATH, JSON.stringify(event) + '\n', 'utf8');
  console.log(`✅ audit logged: ${event.decision} ${event.tool} ${event.target} ${event.rule ? '(' + event.rule + ')' : ''} [${event.requestId}]`);
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

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0] || 'stats';
  if (cmd === 'log') await cmdLog(args);
  else if (cmd === 'tail') await cmdTail(args);
  else if (cmd === 'stats') await cmdStats(args);
  else {
    console.error(`Unknown command: ${cmd}\nUsage: audit.mjs <log|tail|stats> [options]`);
    process.exit(1);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
