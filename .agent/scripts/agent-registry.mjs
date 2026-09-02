#!/usr/bin/env node
/**
 * Agent registry — bring your own agent (AG-UI) — học OpenBot
 * Usage:
 *   node .agent/scripts/agent-registry.mjs list [--json]
 *   node .agent/scripts/agent-registry.mjs validate --id <agentId>
 * No deps, Node 18+
 */
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..', '..');
const AGENTS_YAML = path.join(ROOT, '.agent', 'agents.yaml');

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--') && !next.startsWith('-')) { out[key] = next; i++; } else out[key] = true;
    } else out._.push(a);
  }
  return out;
}

function parseYamlSimple(text) {
  // Minimal YAML for agents.yaml — only handles list of agents with id/name/type/endpoint
  const agents = [];
  let current = null;
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    if (line.startsWith('- id:')) {
      if (current) agents.push(current);
      current = { id: line.slice(5).trim() };
    } else if (current && line.includes(':')) {
      const idx = line.indexOf(':');
      const k = line.slice(0, idx).trim();
      let v = line.slice(idx + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      current[k] = v;
    }
  }
  if (current) agents.push(current);
  return agents;
}

function isPrivateHost(hostname) {
  if (!hostname) return false;
  const h = hostname.toLowerCase();
  if (h === 'localhost' || h === '127.0.0.1' || h === '::1' || h === '0.0.0.0') return true;
  if (h.startsWith('10.')) return true;
  if (h.startsWith('192.168.')) return true;
  if (h.startsWith('172.')) {
    const second = Number(h.split('.')[1]);
    if (second >= 16 && second <= 31) return true;
  }
  if (h.endsWith('.local') || h.endsWith('.internal')) return true;
  return false;
}

function getAllowedHosts() {
  const raw = process.env.AGENT_ENDPOINT_ALLOWED_HOSTS || '';
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

function isAllowedEndpoint(endpoint) {
  if (!endpoint) return { allowed: false, reason: 'No endpoint' };
  let url;
  try { url = new URL(endpoint); } catch { return { allowed: false, reason: 'Invalid URL' }; }
  const host = url.hostname;
  const port = url.port;
  const hostWithPort = port ? `${host}:${port}` : host;
  const allowed = getAllowedHosts();
  const isPrivate = isPrivateHost(host);
  if (!isPrivate) return { allowed: true, reason: 'Public host' };
  // private → must be in allowed list
  for (const a of allowed) {
    if (a === host || a === hostWithPort) return { allowed: true, reason: `Allowed via ${a}` };
  }
  return { allowed: false, reason: `Private host ${hostWithPort} not in AGENT_ENDPOINT_ALLOWED_HOSTS` };
}

async function loadAgents() {
  if (!existsSync(AGENTS_YAML)) return [];
  const text = await fs.readFile(AGENTS_YAML, 'utf8');
  // try simple yaml
  try {
    const agents = parseYamlSimple(text);
    return agents.filter(a => a.id);
  } catch (e) {
    console.error(`Failed to parse agents.yaml: ${e.message}`);
    return [];
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0] || 'list';
  const agents = await loadAgents();

  if (cmd === 'list') {
    if (args.json) {
      console.log(JSON.stringify(agents, null, 2));
    } else {
      if (!agents.length) console.log('No agents found — check .agent/agents.yaml');
      else {
        console.log(`Agents: ${agents.length}`);
        for (const a of agents) {
          const type = a.type || 'built-in';
          const ep = a.endpoint ? ` → ${a.endpoint}` : '';
          console.log(`  • ${a.id} (${a.name || a.id}) [${type}]${ep}`);
        }
      }
    }
  } else if (cmd === 'validate') {
    const id = args.id || args._[1];
    if (!id) { console.error('Usage: agent-registry.mjs validate --id <agentId>'); process.exit(1); }
    const agent = agents.find(a => a.id === id);
    if (!agent) { console.error(`Agent not found: ${id}`); process.exit(1); }
    if (agent.type !== 'remote-ag-ui') {
      console.log(`✅ ${id} is built-in — no endpoint to validate`);
      process.exit(0);
    }
    const res = isAllowedEndpoint(agent.endpoint);
    if (res.allowed) {
      console.log(`✅ ${id} endpoint allowed: ${agent.endpoint} (${res.reason})`);
      process.exit(0);
    } else {
      console.error(`⛔ ${id} endpoint refused: ${agent.endpoint} — ${res.reason}`);
      console.error(`   Add to AGENT_ENDPOINT_ALLOWED_HOSTS: ${new URL(agent.endpoint).hostname}`);
      process.exit(1);
    }
  } else {
    console.error(`Unknown command: ${cmd}\nUsage: agent-registry.mjs <list|validate> [options]`);
    process.exit(1);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
