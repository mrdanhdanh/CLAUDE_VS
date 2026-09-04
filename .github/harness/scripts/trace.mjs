#!/usr/bin/env node
/**
 * Trace — P1-2 Harness 2.1 (Lesson 10 Observability)
 * File-based traces: each harness run = 1 trace, each phase = 1 span.
 * Usage:
 *   node trace.mjs start --task "p1-2"
 *   node trace.mjs span --trace <id> --phase implement
 *   node trace.mjs end --trace <id>
 *   node trace.mjs show --trace <id>
 * Traces stored in .agent/traces/<traceId>.json (gitignored, ephemeral).
 * No deps, Node 18+
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..', '..');
const TRACES_DIR = path.join(ROOT, '.agent', 'traces');

function ensureDir() {
  fs.mkdirSync(TRACES_DIR, { recursive: true });
}

function tracePath(id) {
  return path.join(TRACES_DIR, `${id}.json`);
}

function newId() {
  return crypto.randomBytes(4).toString('hex');
}

export function startTrace(task = 'untitled') {
  ensureDir();
  const traceId = newId();
  const rec = { traceId, task, startedAt: new Date().toISOString(), endedAt: null, durationMs: null, spans: [] };
  fs.writeFileSync(tracePath(traceId), JSON.stringify(rec, null, 2), 'utf8');
  return rec;
}

export function addSpan(traceId, phase) {
  const p = tracePath(traceId);
  if (!fs.existsSync(p)) throw new Error(`trace not found: ${traceId}`);
  const rec = JSON.parse(fs.readFileSync(p, 'utf8'));
  const spanId = newId();
  rec.spans.push({ spanId, phase, startedAt: new Date().toISOString(), parentSpan: rec.spans.length ? rec.spans[rec.spans.length - 1].spanId : null });
  fs.writeFileSync(p, JSON.stringify(rec, null, 2), 'utf8');
  return { traceId, spanId, phase };
}

export function endTrace(traceId) {
  const p = tracePath(traceId);
  if (!fs.existsSync(p)) throw new Error(`trace not found: ${traceId}`);
  const rec = JSON.parse(fs.readFileSync(p, 'utf8'));
  rec.endedAt = new Date().toISOString();
  rec.durationMs = new Date(rec.endedAt) - new Date(rec.startedAt);
  fs.writeFileSync(p, JSON.stringify(rec, null, 2), 'utf8');
  return rec;
}

export function showTrace(traceId) {
  const p = tracePath(traceId);
  if (!fs.existsSync(p)) throw new Error(`trace not found: ${traceId}`);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
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
    if (cmd === 'start') {
      const rec = startTrace(args.task || 'untitled');
      if (args.json) console.log(JSON.stringify(rec, null, 2));
      else console.log(`✅ trace started: ${rec.traceId} task="${rec.task}"`);
    } else if (cmd === 'span') {
      if (!args.trace || !args.phase) {
        console.error('Usage: trace.mjs span --trace <id> --phase <name>');
        process.exit(2);
      }
      const s = addSpan(args.trace, args.phase);
      if (args.json) console.log(JSON.stringify(s, null, 2));
      else console.log(`✅ span: ${s.spanId} phase=${s.phase} trace=${s.traceId}`);
    } else if (cmd === 'end') {
      if (!args.trace) {
        console.error('Usage: trace.mjs end --trace <id>');
        process.exit(2);
      }
      const rec = endTrace(args.trace);
      if (args.json) console.log(JSON.stringify(rec, null, 2));
      else console.log(`✅ trace ended: ${rec.traceId} duration=${rec.durationMs}ms spans=${rec.spans.length}`);
    } else if (cmd === 'show') {
      if (!args.trace) {
        console.error('Usage: trace.mjs show --trace <id>');
        process.exit(2);
      }
      console.log(JSON.stringify(showTrace(args.trace), null, 2));
    } else {
      console.error('Usage: trace.mjs <start|span|end|show> [options]');
      process.exit(2);
    }
  } catch (e) {
    console.error(`❌ ${e.message}`);
    process.exit(1);
  }
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop());
if (isMain) main();

export default { startTrace, addSpan, endTrace, showTrace };
