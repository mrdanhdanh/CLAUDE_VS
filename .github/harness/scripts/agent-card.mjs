#!/usr/bin/env node
/**
 * Agent Card Validate — P1-3 Harness 2.1 (Lesson 11 A2A)
 * Validate A2A agent cards in agents.yaml (name, type, endpoint/version).
 * Usage:
 *   node agent-card.mjs --file .agent/agents.yaml
 *   node agent-card.mjs --card '{"name":"x","type":"built-in"}'
 *   node agent-card.mjs --file .agent/agents.yaml --json
 * Exit: 0 = all valid, 1 = invalid, 2 = error
 * No deps, Node 18+
 */
import fs from 'node:fs';
import path from 'node:path';

const ALLOWED_TYPES = ['built-in', 'remote-ag-ui'];
const PRIVATE_HOST_RE = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|localhost|.*\.internal|.*\.local)/i;

function isSemver(v) {
  return /^\d+\.\d+\.\d+(-[a-z0-9.-]+)?$/i.test(String(v));
}

function isHttpsUrl(u) {
  try {
    const url = new URL(String(u));
    return url.protocol === 'https:';
  } catch { return false; }
}

export function validateCard(card, idx = 0) {
  const errors = [];
  const where = card.id ? `"${card.id}"` : `#${idx + 1}`;
  if (!card.id || typeof card.id !== 'string' || !/^[a-z0-9-]{1,64}$/.test(card.id)) {
    errors.push(`${where}: id must match /^[a-z0-9-]{1,64}$/`);
  }
  if (!card.name || typeof card.name !== 'string' || !card.name.trim()) {
    errors.push(`${where}: name is required`);
  }
  if (!card.type || !ALLOWED_TYPES.includes(card.type)) {
    errors.push(`${where}: type must be one of: ${ALLOWED_TYPES.join(', ')}`);
  }
  if (card.type === 'remote-ag-ui') {
    if (!card.endpoint || typeof card.endpoint !== 'string') {
      errors.push(`${where}: endpoint is required for remote-ag-ui`);
    } else if (!isHttpsUrl(card.endpoint) && !PRIVATE_HOST_RE.test(new URL(card.endpoint).hostname || '')) {
      // Allow https always; private hosts need allowlist (warn, not fail in v1)
      errors.push(`${where}: endpoint must be https or allowlisted private host`);
    }
    if (card.version && !isSemver(card.version)) {
      errors.push(`${where}: version must be semver (got "${card.version}")`);
    }
  }
  if (card.visibility && !['public', 'private'].includes(card.visibility)) {
    errors.push(`${where}: visibility must be public|private`);
  }
  return { valid: errors.length === 0, errors };
}

// Minimal YAML subset for agents.yaml: parse top-level agents list
function parseAgentsYaml(text) {
  const lines = String(text).split('\n');
  const agents = [];
  let current = null;
  let inAgents = false;
  for (const raw of lines) {
    const line = raw.replace(/\r$/, '');
    if (/^\s*#/.test(line)) continue;
    if (/^agents:\s*$/.test(line.trim())) { inAgents = true; continue; }
    if (!inAgents) continue;
    const m = line.match(/^(\s*)-\s+id:\s*(.+)\s*$/);
    if (m) {
      current = { id: m[2].trim().replace(/^['"]|['"]$/g, '') };
      agents.push(current);
      continue;
    }
    if (current) {
      const kv = line.match(/^\s{2,}(name|title|type|prompt|visibility|endpoint|version|description):\s*(.*)\s*$/);
      if (kv) {
        current[kv[1]] = kv[2].trim().replace(/^['"]|['"]$/g, '');
      }
    }
  }
  return agents;
}

export function validateFile(file) {
  const full = path.resolve(file);
  if (!fs.existsSync(full)) throw new Error(`file not found: ${full}`);
  const text = fs.readFileSync(full, 'utf8');
  const agents = parseAgentsYaml(text);
  if (!agents.length) return { valid: false, errors: ['no agents found'], agents: [] };
  const results = agents.map((c, i) => ({ card: c, ...validateCard(c, i) }));
  const errors = results.flatMap(r => r.errors);
  return { valid: errors.length === 0, errors, agents: results.map(r => ({ id: r.card.id, valid: r.valid })) };
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) { out[key] = next; i++; }
      else out[key] = true;
    }
  }
  return out;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  try {
    if (args.card) {
      const card = JSON.parse(args.card);
      const res = validateCard(card);
      if (args.json) console.log(JSON.stringify(res, null, 2));
      else if (res.valid) console.log('✅ card valid');
      else { console.error('❌ card invalid:'); res.errors.forEach(e => console.error(`  - ${e}`)); }
      process.exit(res.valid ? 0 : 1);
    }
    const file = args.file || '.agent/agents.yaml';
    const res = validateFile(file);
    if (args.json) {
      console.log(JSON.stringify(res, null, 2));
    } else if (res.valid) {
      console.log(`✅ ${res.agents.length} agent cards valid: ${res.agents.map(a => a.id).join(', ')}`);
    } else {
      console.error(`❌ agent cards invalid:`);
      res.errors.forEach(e => console.error(`  - ${e}`));
    }
    process.exit(res.valid ? 0 : 1);
  } catch (e) {
    console.error(`❌ ${e.message}`);
    process.exit(2);
  }
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop());
if (isMain) main();

export default { validateCard, validateFile };
