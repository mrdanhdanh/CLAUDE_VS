#!/usr/bin/env node
/**
 * Memory — P1-5 Harness 2.1 (Lesson 13 Agent Memory)
 * Tiers: working (ephemeral) | short (session) | long (knowleged.md) | persona | episodic
 * Usage:
 *   node memory.mjs remember --tier working --key "task" --value "..."
 *   node memory.mjs recall --tier working --key "task"
 *   node memory.mjs recall --tier long --query "rainbow"
 *   node memory.mjs forget --tier working --key "task"
 *   node memory.mjs persona --get
 *   node memory.mjs persona --set --role "barista" --traits "genz,warm" --language "vi"
 *   node memory.mjs episodic --log --task "P1-5" --outcome "pass" --note "..."
 *   node memory.mjs episodic --list
 * Storage: .agent/memory/*.jsonl (working/short gitignored, persona/episodic committed).
 * No deps, Node 18+
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..', '..');
const MEM_DIR = path.join(ROOT, '.agent', 'memory');
const KNOWLEGE_PATH = path.join(ROOT, 'docs', 'knowleged.md');

const TIERS = ['working', 'short', 'long', 'persona', 'episodic'];

function tierPath(tier) {
  if (tier === 'persona') return path.join(MEM_DIR, 'persona.json');
  if (tier === 'long') return KNOWLEGE_PATH;
  return path.join(MEM_DIR, `${tier}.jsonl`);
}

function ensureDir() {
  fs.mkdirSync(MEM_DIR, { recursive: true });
}

function redactSecrets(text) {
  return String(text ?? '')
    .replace(/sk-[a-zA-Z0-9]{10,}/g, '***')
    .replace(/cpk-[a-zA-Z0-9]{10,}/g, '***');
}

function readJsonl(file) {
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8').trim().split('\n').filter(Boolean).map(l => {
    try { return JSON.parse(l); } catch { return null; }
  }).filter(Boolean);
}

export function remember(tier, key, value) {
  if (!['working', 'short'].includes(tier)) throw new Error(`remember only supports working|short (got ${tier})`);
  if (!key) throw new Error('key is required');
  ensureDir();
  const file = tierPath(tier);
  const records = readJsonl(file).filter(r => r.key !== key);
  records.push({ key, value: redactSecrets(value), ts: new Date().toISOString() });
  fs.writeFileSync(file, records.map(r => JSON.stringify(r)).join('\n') + '\n', 'utf8');
  return { tier, key };
}

export function recallTier(tier, key) {
  if (!['working', 'short'].includes(tier)) throw new Error(`recall with key only supports working|short`);
  const records = readJsonl(tierPath(tier));
  const found = records.find(r => r.key === key);
  return found || null;
}

export function forget(tier, key) {
  if (!['working', 'short'].includes(tier)) throw new Error(`forget only supports working|short`);
  const file = tierPath(tier);
  const records = readJsonl(file).filter(r => r.key !== key);
  ensureDir();
  fs.writeFileSync(file, records.length ? records.map(r => JSON.stringify(r)).join('\n') + '\n' : '', 'utf8');
  return { tier, key, removed: true };
}

function tokenize(s) {
  return String(s).toLowerCase().split(/[^a-z0-9àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]+/g).filter(t => t.length >= 2);
}

export function recallLong(query, top = 3) {
  if (!fs.existsSync(KNOWLEGE_PATH)) return [];
  const text = fs.readFileSync(KNOWLEGE_PATH, 'utf8');
  // Parse summary table rows: | KN-xxx | date | bug | cause | lesson | tags |
  const rows = [];
  for (const line of text.split('\n')) {
    const m = line.match(/^\|\s*(KN-\d+)\s*\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|/);
    if (m) rows.push({ id: m[1].trim(), date: m[2].trim(), bug: m[3].trim(), cause: m[4].trim(), lesson: m[5].trim(), tags: m[6].trim() });
  }
  const qTokens = tokenize(query);
  const scored = rows.map(r => {
    const hay = tokenize(`${r.id} ${r.bug} ${r.cause} ${r.lesson} ${r.tags}`);
    let score = 0;
    for (const t of qTokens) if (hay.includes(t)) score++;
    // bonus for exact ID match
    if (qTokens.includes(r.id.toLowerCase())) score += 5;
    return { ...r, score };
  }).filter(r => r.score > 0).sort((a, b) => b.score - a.score).slice(0, top);
  return scored;
}

export function getPersona() {
  const file = tierPath('persona');
  if (!fs.existsSync(file)) {
    return { role: 'barista công nghệ', traits: 'genz,ấm áp,chuyên nghiệp', language: 'vi' };
  }
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return {}; }
}

export function setPersona({ role, traits, language }) {
  ensureDir();
  const cur = getPersona();
  const next = { ...cur, ...(role ? { role } : {}), ...(traits ? { traits } : {}), ...(language ? { language } : {}) };
  fs.writeFileSync(tierPath('persona'), JSON.stringify(next, null, 2), 'utf8');
  return next;
}

export function logEpisodic({ task, outcome, note }) {
  if (!task || !outcome) throw new Error('task and outcome are required');
  ensureDir();
  const file = path.join(MEM_DIR, 'episodic.jsonl');
  const rec = { ts: new Date().toISOString(), task, outcome, note: redactSecrets(note || '') };
  fs.appendFileSync(file, JSON.stringify(rec) + '\n', 'utf8');
  return rec;
}

export function listEpisodic(n = 20) {
  return readJsonl(path.join(MEM_DIR, 'episodic.jsonl')).slice(-n);
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
    if (cmd === 'remember') {
      const r = remember(args.tier, args.key, args.value || '');
      console.log(JSON.stringify({ ok: true, ...r }, null, 2));
    } else if (cmd === 'recall') {
      if (args.tier === 'long') {
        const res = recallLong(args.query || '', Number(args.top || 3));
        console.log(JSON.stringify(res, null, 2));
      } else {
        const found = recallTier(args.tier, args.key);
        if (!found) { console.error(`not found: ${args.tier}/${args.key}`); process.exit(1); }
        console.log(JSON.stringify(found, null, 2));
      }
    } else if (cmd === 'forget') {
      console.log(JSON.stringify({ ok: true, ...forget(args.tier, args.key) }, null, 2));
    } else if (cmd === 'persona') {
      if (args.get || (!args.set && !args.role && !args.traits && !args.language)) {
        console.log(JSON.stringify(getPersona(), null, 2));
      } else {
        console.log(JSON.stringify(setPersona({ role: args.role, traits: args.traits, language: args.language }), null, 2));
      }
    } else if (cmd === 'episodic') {
      if (args.log) {
        console.log(JSON.stringify(logEpisodic({ task: args.task, outcome: args.outcome, note: args.note }), null, 2));
      } else {
        console.log(JSON.stringify(listEpisodic(Number(args.n || 20)), null, 2));
      }
    } else {
      console.error('Usage: memory.mjs <remember|recall|forget|persona|episodic> [options]');
      process.exit(2);
    }
  } catch (e) {
    console.error(`❌ ${e.message}`);
    process.exit(1);
  }
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop());
if (isMain) main();

export default { remember, recallTier, forget, recallLong, getPersona, setPersona, logEpisodic, listEpisodic };
