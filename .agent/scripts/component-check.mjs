#!/usr/bin/env node
/**
 * Component check — published/withheld per agent — học OpenBot
 * Usage:
 *   node .agent/scripts/component-check.mjs --component hello --agent general [--json]
 *   node .agent/scripts/component-check.mjs --list
 * No deps, Node 18+
 */
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..', '..');
const GALLERY_DIR = path.join(ROOT, 'www', 'components', 'gallery');

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

function parseMeta(html) {
  // <!-- meta: {"id":"hello","published":true,"withheld":[]} -->
  const m = html.match(/<!--\s*meta:\s*(\{[\s\S]*?\})\s*-->/);
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch { return null; }
}

async function listComponents() {
  if (!existsSync(GALLERY_DIR)) return [];
  const files = await fs.readdir(GALLERY_DIR);
  const out = [];
  for (const f of files) {
    if (!f.endsWith('.html')) continue;
    const html = await fs.readFile(path.join(GALLERY_DIR, f), 'utf8');
    const meta = parseMeta(html) || { id: f.replace('.html', ''), published: true, withheld: [] };
    out.push({ file: f, ...meta });
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0];

  if (cmd === 'list' || args.list) {
    const comps = await listComponents();
    if (!comps.length) console.log('No components — add to www/components/gallery/');
    else {
      console.log(`Components: ${comps.length}`);
      for (const c of comps) console.log(`  • ${c.id} ${c.published ? 'published' : 'draft'} withheld: ${(c.withheld || []).join(',') || '(none)'} [${c.file}]`);
    }
    if (args.json) console.log(JSON.stringify(comps, null, 2));
    return;
  }

  const compId = args.component || args.c;
  const agent = args.agent || args.a;
  if (!compId) {
    console.error('Usage: component-check.mjs --component <id> --agent <agentId> [--json]\n       component-check.mjs --list');
    process.exit(1);
  }

  const comps = await listComponents();
  const comp = comps.find(c => c.id === compId);
  if (!comp) {
    const res = { decision: 'refused', reason: `Component not found: ${compId}` };
    console.log(`⛔ REFUSED (not-found) ${res.reason}`);
    if (args.json) console.log(JSON.stringify(res, null, 2));
    process.exit(1);
  }
  if (!comp.published) {
    const res = { decision: 'refused', reason: `Component ${compId} not published` };
    console.log(`⛔ REFUSED (not-published) ${res.reason}`);
    if (args.json) console.log(JSON.stringify(res, null, 2));
    process.exit(1);
  }
  if (agent && (comp.withheld || []).includes(agent)) {
    const res = { decision: 'refused', reason: `Component ${compId} withheld from ${agent}` };
    console.log(`⛔ REFUSED (withheld) ${res.reason}`);
    if (args.json) console.log(JSON.stringify(res, null, 2));
    process.exit(1);
  }
  const res = { decision: 'permitted', component: compId, agent: agent || '(any)', reason: `Component ${compId} published and not withheld` };
  console.log(`✅ PERMITTED (${compId}) ${res.reason}`);
  if (args.json) console.log(JSON.stringify(res, null, 2));
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
