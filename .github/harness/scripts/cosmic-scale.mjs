#!/usr/bin/env node
/**
 * cosmic-scale.mjs — đo entropy vũ trụ (tech debt) + black-hole (bottleneck) + dark-matter map
 * Usage:
 *   node .github/harness/scripts/cosmic-scale.mjs [--json] [--out www/cosmos/scale.json]
 * No deps, Node 18+. Idempotent — chỉ đọc, không sửa (trừ file --out).
 * Thang S: low <10 · medium <25 · high >=25
 *   S = mismatch*10 + drafts*5 + refused*2 + disabled*1 + failed*5
 */
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const GITHUB_DIR = path.resolve(__dirname, '..', '..');
const ROOT = path.resolve(GITHUB_DIR, '..');
const REGISTRY_PATH = path.join(GITHUB_DIR, 'harness', 'registry.json');
const KNOWLEGED = path.join(ROOT, 'docs', 'knowleged.md');
const BUGS_DIR = path.join(ROOT, '.agent', 'bugs');
const AUDIT_PATH = path.join(ROOT, '.agent', 'audit.jsonl');
const POLICY_PATH = path.join(ROOT, '.agent', 'policy.json');

const TYPE_DEFS = {
  skill: { dir: path.join(GITHUB_DIR, 'skills'), disabledDir: path.join(GITHUB_DIR, 'skills', '.disabled'), isFolder: true, pattern: /^(.+)$/, ext: '', file: 'SKILL.md' },
  instruction: { dir: path.join(GITHUB_DIR, 'instructions'), disabledDir: path.join(GITHUB_DIR, 'instructions', '.disabled'), isFolder: false, pattern: /^(.+)\.instructions\.md$/, ext: '.instructions.md' },
  agent: { dir: path.join(GITHUB_DIR, 'agents'), disabledDir: path.join(GITHUB_DIR, 'agents', '.disabled'), isFolder: false, pattern: /^(.+)\.agent\.md$/, ext: '.agent.md' },
  prompt: { dir: path.join(GITHUB_DIR, 'prompts'), disabledDir: path.join(GITHUB_DIR, 'prompts', '.disabled'), isFolder: false, pattern: /^(.+)\.prompt\.md$/, ext: '.prompt.md' },
  hook: { dir: path.join(GITHUB_DIR, 'hooks'), disabledDir: path.join(GITHUB_DIR, 'hooks', '.disabled'), isFolder: false, pattern: /^(.+)\.json$/, ext: '.json' },
};
const KEY_OF = { skill: 'skills', instruction: 'instructions', agent: 'agents', prompt: 'prompts', hook: 'hooks' };
function pathsFor(type, name) {
  const d = TYPE_DEFS[type];
  if (d.isFolder) return { on: path.join(d.dir, name), off: path.join(d.disabledDir, name) };
  return { on: path.join(d.dir, name + d.ext), off: path.join(d.disabledDir, name + d.ext) };
}

async function main() {
  const args = process.argv.slice(2);
  const asJson = args.includes('--json');
  const outIdx = args.indexOf('--out');
  const outPath = outIdx !== -1 && args[outIdx + 1] ? path.resolve(ROOT, args[outIdx + 1]) : null;

  let registry = {};
  try { registry = JSON.parse(await fs.readFile(REGISTRY_PATH, 'utf8')); }
  catch (e) { console.error('registry read fail: ' + e.message); process.exit(1); }

  // 1. mismatch + disabled + missing (drift vũ trụ)
  const mismatches = [];
  const missing = [];
  let disabled = 0;
  for (const type of Object.keys(TYPE_DEFS)) {
    const key = KEY_OF[type];
    for (const [name, meta] of Object.entries(registry[key] || {})) {
      const { on, off } = pathsFor(type, name);
      const fsOn = existsSync(on);
      const fsOff = existsSync(off);
      if (!meta.enabled) disabled++;
      if (meta.enabled && !fsOn && fsOff) mismatches.push({ type, name, kind: 'registry-on-but-fs-off' });
      else if (!meta.enabled && fsOn && !fsOff) mismatches.push({ type, name, kind: 'registry-off-but-fs-on' });
      else if (!fsOn && !fsOff) missing.push({ type, name });
    }
  }

  // 2. drafts (bug mở) — supernova chưa nguội
  let drafts = 0, bugsTotal = 0, knTotal = 0;
  try {
    const bugs = await fs.readdir(BUGS_DIR, { withFileTypes: true });
    const dirs = bugs.filter(b => b.isDirectory() && b.name !== '_template').map(b => b.name);
    bugsTotal = dirs.length;
    for (const b of dirs) {
      try {
        const t = await fs.readFile(path.join(BUGS_DIR, b, 'bug.md'), 'utf8');
        if (/-\s*\*\*Status:\*\*\s*open/i.test(t) || t.includes('Status:** `open`')) drafts++;
      } catch {}
    }
  } catch {}
  try {
    const text = await fs.readFile(KNOWLEGED, 'utf8');
    knTotal = [...text.matchAll(/^###\s*KN-(\d+)/gm)].filter(m => m[1] !== 'XXX').length;
  } catch {}

  // 3. audit refused/failed — va chạm chân trời sự kiện
  let refused = 0, failed = 0, auditTotal = 0;
  try {
    if (existsSync(AUDIT_PATH)) {
      const lines = (await fs.readFile(AUDIT_PATH, 'utf8')).trim().split('\n').filter(Boolean);
      auditTotal = lines.length;
      for (const line of lines.slice(-200)) {
        try {
          const e = JSON.parse(line);
          if (e.decision === 'refused') refused++;
          else if (e.decision === 'failed') failed++;
        } catch {}
      }
    }
  } catch {}

  // 4. black holes — bottleneck đã biết (KN) + dynamic
  const blackHoles = [
    { id: 'KN-008', title: 'file lock MSB3027 (dotnet run giữ handle)', kind: 'known', fix: 'Stop-Process PID trên 5251 rồi build lại' },
    { id: 'KN-015', title: '2 workflows cùng github-pages env', kind: 'known', fix: 'chỉ 1 workflow deploy Pages' },
  ];
  if (missing.length) blackHoles.push({ id: 'drift-missing', title: missing.length + ' registry entries missing file', kind: 'dynamic', fix: 'chạy harness-manager sync hoặc gỡ' });
  if (failed > 0) blackHoles.push({ id: 'audit-failed', title: failed + ' audit failed (200 events gần nhất)', kind: 'dynamic', fix: 'xem audit tail, fix gốc rồi verify lại' });

  // 5. entropy
  const S = mismatches.length * 10 + drafts * 5 + refused * 2 + disabled * 1 + failed * 5;
  const level = S < 10 ? 'low' : S < 25 ? 'medium' : 'high';
  const advice = level === 'low'
    ? 'Vũ trụ ổn định — giữ nhịp audit + generate-status đều.'
    : level === 'medium'
      ? 'Entropy trung bình — bơm năng lượng: fix mismatch/draft, chạy generate-status, polish dead-code.'
      : 'Entropy cao — nguy cơ heat death: human takeover, fix mismatch + refused + failed trước khi code tiếp.';

  const result = {
    generatedAt: new Date().toISOString(),
    generatedBy: 'cosmic-scale.mjs',
    entropy: { S, level, advice, parts: { mismatch: mismatches.length, drafts, refused, disabled, failed } },
    counts: { knTotal, bugsTotal, auditTotal },
    mismatches, missing, blackHoles,
    policy: (() => { try { return { ok: true }; } catch { return { ok: false }; } })(),
  };
  try {
    JSON.parse(await fs.readFile(POLICY_PATH, 'utf8'));
    result.policy = { ok: true };
  } catch (e) { result.policy = { ok: false, error: e.message }; }

  if (outPath) {
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await fs.writeFile(outPath, JSON.stringify(result, null, 2) + '\n', 'utf8');
  }
  if (asJson || outPath) console.log(JSON.stringify(result, null, 2));
  else {
    console.log('🌌 Entropy S=' + S + ' (' + level + ') — mismatch ' + mismatches.length + ' · drafts ' + drafts + ' · refused ' + refused + ' · disabled ' + disabled + ' · failed ' + failed);
    console.log('   ' + advice);
    if (mismatches.length) console.log('   mismatch: ' + mismatches.map(m => m.type + '/' + m.name).join(', '));
    if (missing.length) console.log('   missing: ' + missing.map(m => m.type + '/' + m.name).join(', '));
    console.log('   black holes: ' + blackHoles.map(b => b.id).join(', '));
    if (outPath) console.log('   wrote ' + path.relative(ROOT, outPath));
  }
}

main().catch(e => { console.error(e); process.exit(1); });
