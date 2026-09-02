#!/usr/bin/env node
/**
 * MCP check — governed MCP, grant per agent — học OpenBot
 * Usage:
 *   node .agent/scripts/mcp-check.mjs --tool google-drive --agent general [--json]
 *   node .agent/scripts/mcp-check.mjs --list
 * No deps, Node 18+
 */
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..', '..');
const CATALOG_PATH = path.join(ROOT, '.agent', 'mcp', 'catalog.json');
const GRANTS_PATH = path.join(ROOT, '.agent', 'mcp', 'grants.json');

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

async function loadJson(p, fallback) {
  if (!existsSync(p)) return fallback;
  try { return JSON.parse(await fs.readFile(p, 'utf8')); } catch { return fallback; }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0];

  if (cmd === 'list' || args.list) {
    const catalog = await loadJson(CATALOG_PATH, { vendors: [] });
    const grants = await loadJson(GRANTS_PATH, { grants: {} });
    console.log(`MCP Catalog: ${(catalog.vendors || []).length} vendors`);
    for (const v of catalog.vendors || []) console.log(`  • ${v.id} (${v.name}) tools: ${(v.tools || []).join(',')}`);
    console.log(`\nGrants:`);
    for (const [agent, tools] of Object.entries(grants.grants || {})) console.log(`  • ${agent}: ${(tools || []).join(', ') || '(none)'}`);
    if (args.json) console.log(JSON.stringify({ catalog, grants }, null, 2));
    return;
  }

  const tool = args.tool || args.t;
  const agent = args.agent || args.a;
  if (!tool || !agent) {
    console.error('Usage: mcp-check.mjs --tool <vendorId> --agent <agentId> [--json]\n       mcp-check.mjs --list');
    process.exit(1);
  }

  const catalog = await loadJson(CATALOG_PATH, { vendors: [] });
  const grants = await loadJson(GRANTS_PATH, { grants: {} });

  const vendor = (catalog.vendors || []).find(v => v.id === tool);
  if (!vendor) {
    // unknown tool = write (must be explicitly allowed) — học OpenBot
    const res = { decision: 'refused', reason: `Unknown vendor ${tool} — treated as write, not in catalog` };
    console.log(`⛔ REFUSED (unknown-vendor) ${res.reason}`);
    if (args.json) console.log(JSON.stringify(res, null, 2));
    process.exit(1);
  }

  const agentGrants = (grants.grants || {})[agent] || [];
  if (agentGrants.includes(tool)) {
    const res = { decision: 'permitted', vendor: tool, agent, reason: `Agent ${agent} holds ${tool}` };
    console.log(`✅ PERMITTED (${tool}) Agent ${agent} holds ${tool}`);
    if (args.json) console.log(JSON.stringify(res, null, 2));
    process.exit(0);
  } else {
    const res = { decision: 'refused', vendor: tool, agent, reason: `Agent ${agent} not granted ${tool}` };
    console.log(`⛔ REFUSED (not-granted) Agent ${agent} not granted ${tool} — add to grants.json`);
    if (args.json) console.log(JSON.stringify(res, null, 2));
    process.exit(1);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
