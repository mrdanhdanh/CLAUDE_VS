#!/usr/bin/env node
/**
 * Context — P1-4 Harness 2.1 (Lesson 12 Context Engineering)
 * Dynamic context management: scratchpad, compress, isolate, inspect, quarantine.
 * Usage:
 *   node context.mjs compress --max-chars 2000 [--file hits.json]
 *   node context.mjs isolate --subtask "plan" --subtask "implement"
 *   node context.mjs inspect --file hits.json
 *   node context.mjs quarantine --text "hello sk-abc123xyz"
 *   echo '<hits.json>' | node context.mjs compress --max-chars 2000
 * No deps, Node 18+
 */
import fs from 'node:fs';
import crypto from 'node:crypto';

function redactSecrets(text) {
  return String(text)
    .replace(/sk-[a-zA-Z0-9]{10,}/g, '***')
    .replace(/cpk-[a-zA-Z0-9]{10,}/g, '***');
}

function hasSecret(text) {
  return /sk-[a-zA-Z0-9]{10,}|cpk-[a-zA-Z0-9]{10,}/.test(String(text));
}

export function quarantine(text) {
  const t = String(text || '');
  if (hasSecret(t)) {
    return { pass: false, reason: 'secret detected', redacted: redactSecrets(t) };
  }
  // Poisoning heuristic: impossible-goal phrases without evidence
  if (/ignore (all )?previous instructions|reveal (system )?prompt|delete all/i.test(t)) {
    return { pass: false, reason: 'prompt-injection pattern', redacted: t };
  }
  return { pass: true, reason: 'ok', redacted: t };
}

export function compressHits(hits, maxChars = 2000) {
  if (!Array.isArray(hits) || !hits.length) return { hits: [], totalChars: 0, kept: 0 };
  const sorted = [...hits].sort((a, b) => (b.score || 0) - (a.score || 0));
  const out = [];
  let total = 0;
  for (const h of sorted) {
    const q = quarantine(h.text || h.snippet || '');
    const clean = { ...h, text: redactSecrets((h.text || '').slice(0, 600)), snippet: redactSecrets((h.snippet || '').slice(0, 300)) };
    if (!q.pass && q.reason === 'secret detected') {
      // keep but redacted (don't drop — visibility)
      clean._quarantined = true;
    }
    const size = JSON.stringify(clean).length;
    if (total + size > maxChars && out.length > 0) break;
    out.push(clean);
    total += size;
  }
  return { hits: out, totalChars: total, kept: out.length, dropped: sorted.length - out.length };
}

export function isolateContexts(subtasks) {
  // Each subtask gets a bounded summary slot (no cross-contamination)
  const map = {};
  for (const st of subtasks || []) {
    const key = String(st).slice(0, 64);
    map[key] = { subtask: key, summary: '', updatedAt: new Date().toISOString(), maxChars: 1000 };
  }
  return map;
}

export function inspectHits(hits) {
  // Small records only: counts, ids, hashes — never raw prompt
  const list = Array.isArray(hits) ? hits : [];
  return {
    count: list.length,
    ids: list.map(h => h.chunkId || h.id || '?'),
    scores: list.map(h => h.score ?? null),
    hashes: list.map(h => crypto.createHash('sha256').update(String(h.text || h.snippet || '')).digest('hex').slice(0, 8)),
    totalChars: list.reduce((a, h) => a + String(h.text || '').length, 0),
  };
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (key === 'subtask') {
        if (!out.subtask) out.subtask = [];
        if (next && !next.startsWith('--')) { out.subtask.push(next); i++; }
      } else if (next && !next.startsWith('--')) { out[key] = next; i++; }
      else out[key] = true;
    } else out._.push(a);
  }
  return out;
}

function readInput(file) {
  if (file) return fs.readFileSync(file, 'utf8');
  if (!process.stdin.isTTY) return fs.readFileSync(0, 'utf8');
  return '';
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0];
  try {
    if (cmd === 'compress') {
      const maxChars = Number(args['max-chars'] || args.maxChars || 2000);
      const raw = readInput(args.file);
      const data = raw.trim() ? JSON.parse(raw) : [];
      const hits = Array.isArray(data) ? data : data.hits || [];
      const res = compressHits(hits, maxChars);
      if (args.json || !process.stdout.isTTY) console.log(JSON.stringify(res, null, 2));
      else console.log(`✅ compress: kept ${res.kept}/${hits.length} hits, ${res.totalChars} chars (max ${maxChars})`);
    } else if (cmd === 'isolate') {
      const subs = args.subtask || [];
      const map = isolateContexts(subs);
      console.log(JSON.stringify(map, null, 2));
    } else if (cmd === 'inspect') {
      const raw = readInput(args.file);
      const data = raw.trim() ? JSON.parse(raw) : [];
      const hits = Array.isArray(data) ? data : data.hits || [];
      console.log(JSON.stringify(inspectHits(hits), null, 2));
    } else if (cmd === 'quarantine') {
      const text = args.text || readInput(args.file);
      const res = quarantine(text);
      if (args.json) console.log(JSON.stringify(res, null, 2));
      else console.log(res.pass ? '✅ quarantine pass' : `⛔ quarantine reject: ${res.reason}`);
      process.exit(res.pass ? 0 : 1);
    } else {
      console.error('Usage: context.mjs <compress|isolate|inspect|quarantine> [options]');
      process.exit(2);
    }
  } catch (e) {
    console.error(`❌ ${e.message}`);
    process.exit(1);
  }
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop());
if (isMain) main();

export default { quarantine, compressHits, isolateContexts, inspectHits };
