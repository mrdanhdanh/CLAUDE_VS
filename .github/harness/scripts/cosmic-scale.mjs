#!/usr/bin/env node
/**
 * cosmic-scale.mjs — đo entropy vũ trụ (tech debt) + black-hole (bottleneck) + dark-matter map
 * Usage:
 *   node .github/harness/scripts/cosmic-scale.mjs [--json] [--out www/cosmos/scale.json]
 *   node .github/harness/scripts/cosmic-scale.mjs --budget 10   # Heat Death gate: exit 1 nếu S vượt ngân sách
 *   node .github/harness/scripts/cosmic-scale.mjs --trend 3    # Escape Velocity gate: exit 1 nếu S tăng liên tiếp ≥3 lần đo (chặn theo ĐÀ, khác --budget chặn theo MỨC)
 * No deps, Node 18+. Idempotent — chỉ đọc, không sửa (trừ file --out).
 * Thang S: low <10 · medium <25 · high >=25
 *   S = mismatch*10 + drafts*5 + refused*2 + disabled*1 + failed*5
 * Gravity G = cutRatio*10 (scope control — % plans có dòng CẮT/YAGNI) — đối trọng định lượng của scope creep.
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
  const budgetIdx = args.indexOf('--budget');
  const budget = budgetIdx !== -1 && args[budgetIdx + 1] ? Number(args[budgetIdx + 1]) : null;
  const trendIdx = args.indexOf('--trend');
  const trendRequested = trendIdx !== -1;
  let trendN = 3;
  if (trendRequested && args[trendIdx + 1] && !args[trendIdx + 1].startsWith('--')) {
    const v = Number(args[trendIdx + 1]);
    if (Number.isInteger(v) && v >= 2) trendN = v;
  }

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

  // 1b. dark matter — hidden complexity: orphan files (FS có nhưng registry không biết) + disabled (thiên hà ngủ đông)
  const orphans = [];
  for (const type of Object.keys(TYPE_DEFS)) {
    const d = TYPE_DEFS[type];
    const known = new Set(Object.keys(registry[KEY_OF[type]] || {}));
    for (const dir of [d.dir, d.disabledDir]) {
      let entries = [];
      try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { continue; }
      for (const e of entries) {
        if (e.name === '_template' || e.name.startsWith('.')) continue;
        if (d.isFolder && !e.isDirectory()) continue; // file lẻ (registry.json...) không phải skill
        if (d.isFolder && e.name === 'scripts') continue; // infra folder, không phải skill
        const name = d.isFolder ? e.name : (e.name.match(d.pattern)?.[1] ?? null);
        if (!name || known.has(name)) continue;
        orphans.push({ type, name: e.name, where: dir === d.disabledDir ? 'disabled' : 'active' });
      }
    }
  }
  const darkMatter = orphans.length * 2 + disabled * 1;
  const dmLevel = darkMatter < 5 ? 'low' : darkMatter < 15 ? 'medium' : 'high';
  const dmAdvice = dmLevel === 'low'
    ? 'Vật chất tối thấp — registry nhìn thấy gần hết vũ trụ.'
    : dmLevel === 'medium'
      ? 'Vật chất tối vừa phải — có file/hành tinh registry không nhìn thấy: chạy harness-manager sync hoặc gỡ orphan.'
      : 'Vật chất tối cao — hidden complexity lớn: audit orphan + .disabled trước khi code tiếp.';

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

  // 5. dark energy — decollaboration (KN-018): tỉ lệ plans CÓ Dissent ("Who did you think with?")
  const PLANS_DIR = path.join(ROOT, '.agent', 'plans');
  let plansTotal = 0, plansWithDissent = 0, plansWithCut = 0;
  try {
    const entries = await fs.readdir(PLANS_DIR, { withFileTypes: true });
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      try {
        const prd = await fs.readFile(path.join(PLANS_DIR, e.name, 'prd.md'), 'utf8');
        plansTotal++;
        if (/who did you think with\?/i.test(prd) || /dissent review/i.test(prd)) plansWithDissent++;
        if (/yagni/i.test(prd) || /^[-*]\s*\*{0,2}cắt/im.test(prd)) plansWithCut++;
      } catch {}
    }
  } catch {}
  const dissentRatio = plansTotal ? plansWithDissent / plansTotal : 1;
  const darkEnergy = Math.round((1 - dissentRatio) * 10);

  // gravity — scope control: % plans có dòng CẮT/YAGNI (đối trọng của scope creep; đo được offline)
  const cutRatio = plansTotal ? plansWithCut / plansTotal : 0;
  const gravity = Math.round(cutRatio * 10);
  const gLevel = gravity < 3 ? 'low' : gravity < 6 ? 'medium' : 'high';
  const gAdvice = gLevel === 'high'
    ? 'Gravity mạnh — đa số PRD có dòng CẮT/YAGNI: scope được kiểm soát tốt.'
    : gLevel === 'medium'
      ? 'Gravity vừa — thêm dòng CẮT/YAGNI vào PRD mới để giữ scope.'
      : 'Gravity yếu — ít PRD có dòng CẮT/YAGNI: scope dễ phình (dark energy thắng).';
  const deAdvice = darkEnergy === 0
    ? 'Gravity thắng — mọi plan đều có Dissent/Who did you think with.'
    : darkEnergy <= 5
      ? 'Dark energy vừa phải — các plan mới thêm Dissent Review gate (KN-018) để chống decollaboration.'
      : 'Dark energy cao — decollaboration đang nở rộng: áp KN-018 cho mọi PRD mới (Who did you think with?).';

  // 6. entropy
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
    darkEnergy: { D: darkEnergy, dissentRatio: Math.round(dissentRatio * 100) / 100, plansTotal, plansWithDissent, advice: deAdvice },
    gravity: { G: gravity, level: gLevel, cutRatio: Math.round(cutRatio * 100) / 100, plansTotal, plansWithCut, advice: gAdvice },
    darkMatter: { M: darkMatter, level: dmLevel, advice: dmAdvice, orphans, orphanCount: orphans.length, disabledGalaxies: disabled },
    counts: { knTotal, bugsTotal, auditTotal },
    mismatches, missing, blackHoles,
    policy: (() => { try { return { ok: true }; } catch { return { ok: false }; } })(),
  };
  try {
    JSON.parse(await fs.readFile(POLICY_PATH, 'utf8'));
    result.policy = { ok: true };
  } catch (e) { result.policy = { ok: false, error: e.message }; }

  // 7. escape velocity — gate theo ĐÀ S (roadmap: --trend N).
  // History: đọc từ --out nếu có, else scale.json mặc định (explicit — không fallback ngầm).
  const historySource = outPath || path.join(ROOT, 'www', 'cosmos', 'scale.json');
  let history = [];
  try {
    const prev = JSON.parse(await fs.readFile(historySource, 'utf8'));
    if (Array.isArray(prev.history)) history = prev.history.slice(-29);
  } catch {}
  history.push({ t: result.generatedAt, S, level, M: darkMatter, D: darkEnergy, G: gravity });
  result.history = history;
  let increases = 0;
  for (let i = history.length - 1; i > 0; i--) {
    if ((history[i].S ?? 0) > (history[i - 1].S ?? 0)) increases++;
    else break;
  }
  const trendWindow = history.slice(-(trendN + 1));
  result.trend = {
    increases,
    needed: trendN,
    gate: increases >= trendN,
    window: trendWindow.map(p => ({ t: p.t, S: p.S ?? 0 })),
  };

  if (outPath) {
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await fs.writeFile(outPath, JSON.stringify(result, null, 2) + '\n', 'utf8');
  }
  if (asJson || outPath) console.log(JSON.stringify(result, null, 2));
  else {
    console.log('🌌 Entropy S=' + S + ' (' + level + ') — mismatch ' + mismatches.length + ' · drafts ' + drafts + ' · refused ' + refused + ' · disabled ' + disabled + ' · failed ' + failed);
    console.log('   ' + advice);
    console.log('   💜 dark energy D=' + darkEnergy + ' (dissent ' + plansWithDissent + '/' + plansTotal + ' plans) — ' + deAdvice);
    console.log('   🧲 gravity G=' + gravity + ' (' + gLevel + ') — CẮT/YAGNI ' + plansWithCut + '/' + plansTotal + ' plans — ' + gAdvice);
    console.log('   🌑 dark matter M=' + darkMatter + ' (' + dmLevel + ') — orphan ' + orphans.length + ' · disabled ' + disabled + ' — ' + dmAdvice);
    if (orphans.length) console.log('   orphan: ' + orphans.map(o => o.type + '/' + o.name).join(', '));
    if (mismatches.length) console.log('   mismatch: ' + mismatches.map(m => m.type + '/' + m.name).join(', '));
    if (missing.length) console.log('   missing: ' + missing.map(m => m.type + '/' + m.name).join(', '));
    console.log('   black holes: ' + blackHoles.map(b => b.id).join(', '));
    console.log('   🚀 escape velocity: đà S tăng ' + increases + '/' + trendN + ' lần liên tiếp — ' + (result.trend.gate ? 'GATE ⛔ (--trend chặn feature)' : 'chưa đạt vận tốc thoát'));
    if (outPath) console.log('   wrote ' + path.relative(ROOT, outPath));
  }

  // Heat Death gate (--budget): S vượt ngân sách → exit 1, buộc trả nợ entropy trước khi thêm feature
  if (budget != null && !Number.isNaN(budget)) {
    if (S > budget) {
      console.error('❌ ENTROPY BUDGET VƯỢT: S=' + S + ' > budget ' + budget + ' — trả nợ (mismatch/draft/refused) trước khi thêm feature mới.');
      process.exit(1);
    }
    console.log('   ✅ Trong ngân sách entropy: S=' + S + ' ≤ ' + budget);
  }

  // Escape Velocity gate (--trend N): S tăng N lần đo liên tiếp → chặn thêm feature, buộc trả nợ entropy.
  if (trendRequested && result.trend.gate) {
    console.error('🚀 ESCAPE VELOCITY: S tăng ' + increases + ' lần đo liên tiếp (cần ≥' + trendN + ') — ' + trendWindow.map(p => p.S).join('→') + ' — chặn thêm feature: trả nợ entropy (mismatch/draft/refused) trước khi vượt thoát.');
    process.exit(1);
  }
  if (trendRequested) console.log('   ✅ ESCAPE VELOCITY: chưa đạt vận tốc thoát (đà ' + increases + '/' + trendN + ') — được phép thêm feature.');
}

main().catch(e => { console.error(e); process.exit(1); });
