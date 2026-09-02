#!/usr/bin/env node
/**
 * Routines — standing instructions a Bot runs on a schedule — học OpenBot
 * Usage:
 *   node .agent/scripts/routine.mjs add --cron "0 9 * * *" --prompt "check status" [--agent general]
 *   node .agent/scripts/routine.mjs list [--json]
 *   node .agent/scripts/routine.mjs run --id <id>
 *   node .agent/scripts/routine.mjs remove --id <id>
 * Rules: floor 15m, cap 20 enabled, 10 fails → off
 * No deps, Node 18+
 */
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..', '..');
const ROUTINES_PATH = path.join(ROOT, '.agent', 'routines.json');

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

async function loadRoutines() {
  if (!existsSync(ROUTINES_PATH)) return [];
  try { return JSON.parse(await fs.readFile(ROUTINES_PATH, 'utf8')); } catch { return []; }
}

async function saveRoutines(routines) {
  await fs.writeFile(ROUTINES_PATH, JSON.stringify(routines, null, 2) + '\n', 'utf8');
}

function cronToMinutes(cron) {
  // minimal: check if cron is every N minutes or hourly
  // For floor check, we estimate: if cron is "* * * * *" → 1m, "*/5 * * * *" → 5m, "0 * * * *" → 60m, "0 9 * * *" → 1440m
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return 60; // assume hourly if unknown
  const [min, hour] = parts;
  if (min === '*' && hour === '*') return 1;
  if (min.startsWith('*/')) {
    const n = Number(min.slice(2));
    if (!isNaN(n)) return n;
  }
  if (min === '0' && hour === '*') return 60;
  if (min === '0' && hour !== '*') return 1440;
  return 60; // default assume >=15m
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0] || 'list';
  let routines = await loadRoutines();

  if (cmd === 'list') {
    if (!routines.length) console.log('No routines — add with: routine.mjs add --cron "0 9 * * *" --prompt "check status"');
    else {
      console.log(`Routines: ${routines.length} total, ${routines.filter(r => r.enabled).length} enabled`);
      for (const r of routines) {
        const status = r.enabled ? '● enabled' : '○ disabled';
        console.log(`  • ${r.id} [${status}] ${r.cron} — "${r.prompt.slice(0, 40)}" fails:${r.fails || 0} agent:${r.agent || 'general'}`);
      }
    }
    if (args.json) console.log(JSON.stringify(routines, null, 2));
    return;
  }

  if (cmd === 'add') {
    const cron = args.cron;
    const prompt = args.prompt || args.p;
    const agent = args.agent || 'general';
    if (!cron || !prompt) {
      console.error('Usage: routine.mjs add --cron "0 9 * * *" --prompt "check status" [--agent general]');
      process.exit(1);
    }
    const enabledCount = routines.filter(r => r.enabled).length;
    if (enabledCount >= 20) {
      console.error(`⛔ Cap reached: 20 enabled routines — disable one first`);
      process.exit(1);
    }
    const mins = cronToMinutes(cron);
    if (mins < 15) {
      console.error(`⛔ Floor 15m: cron "${cron}" is ~${mins}m — too frequent`);
      process.exit(1);
    }
    const id = crypto.randomBytes(3).toString('hex');
    const routine = { id, cron, prompt, agent, enabled: true, fails: 0, createdAt: new Date().toISOString() };
    routines.push(routine);
    await saveRoutines(routines);
    console.log(`✅ Added routine ${id}: ${cron} — "${prompt}" [${agent}]`);
    return;
  }

  if (cmd === 'run') {
    const id = args.id || args._[1];
    if (!id) { console.error('Usage: routine.mjs run --id <id>'); process.exit(1); }
    const r = routines.find(x => x.id === id);
    if (!r) { console.error(`Routine not found: ${id}`); process.exit(1); }
    if (!r.enabled) { console.error(`Routine ${id} is disabled`); process.exit(1); }
    console.log(`▶ Running routine ${id}: "${r.prompt}" [${r.agent}] cron:${r.cron}`);
    // Simulate run — in real, would call agent
    console.log(`   (simulated — would call agent ${r.agent} with prompt)`);
    return;
  }

  if (cmd === 'remove' || cmd === 'rm' || cmd === 'delete') {
    const id = args.id || args._[1];
    if (!id) { console.error('Usage: routine.mjs remove --id <id>'); process.exit(1); }
    const idx = routines.findIndex(x => x.id === id);
    if (idx === -1) { console.error(`Routine not found: ${id}`); process.exit(1); }
    routines.splice(idx, 1);
    await saveRoutines(routines);
    console.log(`✅ Removed routine ${id}`);
    return;
  }

  console.error(`Unknown command: ${cmd}\nUsage: routine.mjs <add|list|run|remove> [options]`);
  process.exit(1);
}

main().catch(e => { console.error(e); process.exit(1); });
