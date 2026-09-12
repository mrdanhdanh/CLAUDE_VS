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
 * Capability C = {kn, skills, e2eSpecs, e2eTests, guards} — đối trọng entropy (assets đếm được, không weight — tránh vanity KN-024) + capabilityDelta vs mốc history trước.
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

// ===== Các phase đo — tách từ main() (mỗi hàm 1 mối quan tâm, ≤80 dòng / CC ≤12 — Slop Gate KN-047) =====

function parseArgs(args) {
  const outIdx = args.indexOf('--out');
  const budgetIdx = args.indexOf('--budget');
  const trendIdx = args.indexOf('--trend');
  let trendN = 3;
  if (trendIdx !== -1 && args[trendIdx + 1] && !args[trendIdx + 1].startsWith('--')) {
    const v = Number(args[trendIdx + 1]);
    if (Number.isInteger(v) && v >= 2) trendN = v;
  }
  return {
    asJson: args.includes('--json'),
    outPath: outIdx !== -1 && args[outIdx + 1] ? path.resolve(ROOT, args[outIdx + 1]) : null,
    budget: budgetIdx !== -1 && args[budgetIdx + 1] ? Number(args[budgetIdx + 1]) : null,
    trendRequested: trendIdx !== -1,
    trendN,
  };
}

// phân loại 1 entry registry vs filesystem — tách riêng để CC thấp (Slop Gate KN-047)
function driftKind(meta, fsOn, fsOff) {
  if (!fsOn && !fsOff) return 'missing';
  if (fsOff && !fsOn) return meta.enabled ? 'registry-on-but-fs-off' : null;
  if (fsOn && !fsOff) return meta.enabled ? null : 'registry-off-but-fs-on';
  return null;
}

// 1. mismatch + disabled + missing (drift vũ trụ)
function scanRegistry(registry) {
  const mismatches = [];
  const missing = [];
  let disabled = 0;
  for (const type of Object.keys(TYPE_DEFS)) {
    for (const [name, meta] of Object.entries(registry[KEY_OF[type]] || {})) {
      const { on, off } = pathsFor(type, name);
      const fsOn = existsSync(on);
      const fsOff = existsSync(off);
      if (!meta.enabled) disabled++;
      const drift = driftKind(meta, fsOn, fsOff);
      if (drift === 'missing') missing.push({ type, name });
      else if (drift) mismatches.push({ type, name, kind: drift });
    }
  }
  return { mismatches, missing, disabled };
}

// lọc tên entry thành orphan-name (null = không phải orphan ứng viên)
function orphanName(d, entry) {
  if (entry.name === '_template' || entry.name.startsWith('.')) return null;
  if (!d.isFolder) return entry.name.match(d.pattern)?.[1] ?? null;
  if (!entry.isDirectory()) return null; // file lẻ (registry.json...) không phải skill
  if (entry.name === 'scripts') return null; // infra folder, không phải skill
  return entry.name;
}

async function scanOrphanDir(type, d, dir, known) {
  const found = [];
  let entries = [];
  try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return found; }
  for (const e of entries) {
    const name = orphanName(d, e);
    if (!name || known.has(name)) continue;
    found.push({ type, name: e.name, where: dir === d.disabledDir ? 'disabled' : 'active' });
  }
  return found;
}

// 1b. dark matter — hidden complexity: orphan files (FS có nhưng registry không biết) + disabled (thiên hà ngủ đông)
async function scanOrphans(registry, disabled) {
  const orphans = [];
  for (const type of Object.keys(TYPE_DEFS)) {
    const d = TYPE_DEFS[type];
    const known = new Set(Object.keys(registry[KEY_OF[type]] || {}));
    for (const dir of [d.dir, d.disabledDir]) {
      orphans.push(...await scanOrphanDir(type, d, dir, known));
    }
  }
  const darkMatter = orphans.length * 2 + disabled * 1;
  const dmLevel = darkMatter < 5 ? 'low' : darkMatter < 15 ? 'medium' : 'high';
  const dmAdvice = dmLevel === 'low'
    ? 'Vật chất tối thấp — registry nhìn thấy gần hết vũ trụ.'
    : dmLevel === 'medium'
      ? 'Vật chất tối vừa phải — có file/hành tinh registry không nhìn thấy: chạy harness-manager sync hoặc gỡ orphan.'
      : 'Vật chất tối cao — hidden complexity lớn: audit orphan + .disabled trước khi code tiếp.';
  return { orphans, darkMatter, dmLevel, dmAdvice };
}

// 2. drafts (bug mở) — supernova chưa nguội
async function scanBugDrafts() {
  let drafts = 0, bugsTotal = 0;
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
  return { drafts, bugsTotal };
}

async function scanKnowledge() {
  try {
    const text = await fs.readFile(KNOWLEGED, 'utf8');
    return [...text.matchAll(/^###\s*KN-(\d+)/gm)].filter(m => m[1] !== 'XXX').length;
  } catch { return 0; }
}

// 3. audit refused/failed — va chạm chân trời sự kiện
async function scanAudit() {
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
  return { refused, failed, auditTotal };
}

// 4. black holes — bottleneck đã biết (KN) + dynamic
function buildBlackHoles(missing, failed) {
  const blackHoles = [
    { id: 'KN-008', title: 'file lock MSB3027 (dotnet run giữ handle)', kind: 'known', fix: 'Stop-Process PID trên 5251 rồi build lại' },
    { id: 'KN-015', title: '2 workflows cùng github-pages env', kind: 'known', fix: 'chỉ 1 workflow deploy Pages' },
  ];
  if (missing.length) blackHoles.push({ id: 'drift-missing', title: missing.length + ' registry entries missing file', kind: 'dynamic', fix: 'chạy harness-manager sync hoặc gỡ' });
  if (failed > 0) blackHoles.push({ id: 'audit-failed', title: failed + ' audit failed (200 events gần nhất)', kind: 'dynamic', fix: 'xem audit tail, fix gốc rồi verify lại' });
  return blackHoles;
}

// 5. dark energy — decollaboration (KN-018): tỉ lệ plans CÓ Dissent ("Who did you think with?")
async function measurePlans() {
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
  return { plansTotal, plansWithDissent, plansWithCut };
}

// gravity — scope control: % plans có dòng CẮT/YAGNI (đối trọng của scope creep; đo được offline)
function energyMetrics({ plansTotal, plansWithDissent, plansWithCut }) {
  const dissentRatio = plansTotal ? plansWithDissent / plansTotal : 1;
  const darkEnergy = Math.round((1 - dissentRatio) * 10);
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
  return { dissentRatio, darkEnergy, cutRatio, gravity, gLevel, gAdvice, deAdvice };
}

// 6. entropy
function entropyOf(parts) {
  const S = parts.mismatch * 10 + parts.drafts * 5 + parts.refused * 2 + parts.disabled * 1 + parts.failed * 5;
  const level = S < 10 ? 'low' : S < 25 ? 'medium' : 'high';
  const advice = level === 'low'
    ? 'Vũ trụ ổn định — giữ nhịp audit + generate-status đều.'
    : level === 'medium'
      ? 'Entropy trung bình — bơm năng lượng: fix mismatch/draft, chạy generate-status, polish dead-code.'
      : 'Entropy cao — nguy cơ heat death: human takeover, fix mismatch + refused + failed trước khi code tiếp.';
  return { S, level, advice };
}

async function checkPolicy() {
  try {
    JSON.parse(await fs.readFile(POLICY_PATH, 'utf8'));
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
}

// 8. capability — đo trưởng thành harness (đối trọng S=debt): assets đếm được, không weight (tránh vanity — KN-024)
async function measureCapability(knTotal) {
  let skills = 0, guards = 0;
  try {
    const reg = JSON.parse(await fs.readFile(REGISTRY_PATH, 'utf8'));
    skills = Object.values(reg.skills || {}).filter(m => m.enabled).length;
  } catch {}
  try {
    const pol = JSON.parse(await fs.readFile(POLICY_PATH, 'utf8'));
    guards = (pol.deny || []).length + (pol.allow || []).length;
  } catch {}
  const specDir = path.join(ROOT, 'tests', 'e2e');
  let e2eSpecs = 0, e2eTests = 0;
  try {
    const files = (await fs.readdir(specDir)).filter(f => f.endsWith('.spec.ts'));
    e2eSpecs = files.length;
    for (const f of files) {
      const text = await fs.readFile(path.join(specDir, f), 'utf8');
      e2eTests += (text.match(/^\s*test(\.fixme)?\(/gm) || []).length;
    }
  } catch {}
  return { kn: knTotal, skills, e2eSpecs, e2eTests, guards };
}

// capability delta — so mốc history gần nhất (không chấm điểm, chỉ đếm; không đổi = null)
function capabilityDelta(prev, cur) {
  if (!prev) return null;
  const d = {};
  for (const k of Object.keys(cur)) {
    const diff = (cur[k] ?? 0) - (prev[k] ?? 0);
    if (diff !== 0) d[k] = diff;
  }
  return Object.keys(d).length ? d : null;
}

// 7. escape velocity — gate theo ĐÀ S (roadmap: --trend N).
// History: đọc từ --out nếu có, else scale.json mặc định (explicit — không fallback ngầm).
async function readHistory(source) {
  try {
    const prev = JSON.parse(await fs.readFile(source, 'utf8'));
    if (Array.isArray(prev.history)) return prev.history.slice(-29);
  } catch {}
  return [];
}

function computeTrend(history, trendN) {
  let increases = 0;
  for (let i = history.length - 1; i > 0; i--) {
    if ((history[i].S ?? 0) > (history[i - 1].S ?? 0)) increases++;
    else break;
  }
  const window = history.slice(-(trendN + 1)).map(p => ({ t: p.t, S: p.S ?? 0 }));
  return { window, trend: { increases, needed: trendN, gate: increases >= trendN, window } };
}

async function writeOutput(outPath, result) {
  if (!outPath) return;
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, JSON.stringify(result, null, 2) + '\n', 'utf8');
}

function printHuman(result, outPath, trendN) {
  const { S, level, advice, parts } = result.entropy;
  const { D, plansWithDissent, plansTotal, advice: deAdvice } = result.darkEnergy;
  const { G, level: gLevel, plansWithCut, advice: gAdvice } = result.gravity;
  const { M, level: dmLevel, advice: dmAdvice, orphans, disabledGalaxies } = result.darkMatter;
  console.log('🌌 Entropy S=' + S + ' (' + level + ') — mismatch ' + parts.mismatch + ' · drafts ' + parts.drafts + ' · refused ' + parts.refused + ' · disabled ' + parts.disabled + ' · failed ' + parts.failed);
  console.log('   ' + advice);
  console.log('   💜 dark energy D=' + D + ' (dissent ' + plansWithDissent + '/' + plansTotal + ' plans) — ' + deAdvice);
  console.log('   🧲 gravity G=' + G + ' (' + gLevel + ') — CẮT/YAGNI ' + plansWithCut + '/' + plansTotal + ' plans — ' + gAdvice);
  console.log('   🌑 dark matter M=' + M + ' (' + dmLevel + ') — orphan ' + orphans.length + ' · disabled ' + disabledGalaxies + ' — ' + dmAdvice);
  if (orphans.length) console.log('   orphan: ' + orphans.map(o => o.type + '/' + o.name).join(', '));
  if (result.mismatches.length) console.log('   mismatch: ' + result.mismatches.map(m => m.type + '/' + m.name).join(', '));
  if (result.missing.length) console.log('   missing: ' + result.missing.map(m => m.type + '/' + m.name).join(', '));
  console.log('   black holes: ' + result.blackHoles.map(b => b.id).join(', '));
  const cap = result.capability || {};
  console.log('   📈 capability: KN ' + cap.kn + ' · skills ' + cap.skills + ' · specs ' + cap.e2eSpecs + ' · tests ' + cap.e2eTests + ' · guards ' + cap.guards + (result.capabilityDelta ? ' — Δ ' + JSON.stringify(result.capabilityDelta) : ''));
  console.log('   🚀 escape velocity: đà S tăng ' + result.trend.increases + '/' + trendN + ' lần liên tiếp — ' + (result.trend.gate ? 'GATE ⛔ (--trend chặn feature)' : 'chưa đạt vận tốc thoát'));
  if (outPath) console.log('   wrote ' + path.relative(ROOT, outPath));
}

// Heat Death gate (--budget) + Escape Velocity gate (--trend N): exit 1 → buộc trả nợ entropy trước khi thêm feature
function runGates({ budget, S, trendRequested, trendN, trend, trendWindow }) {
  if (budget != null && !Number.isNaN(budget)) {
    if (S > budget) {
      console.error('❌ ENTROPY BUDGET VƯỢT: S=' + S + ' > budget ' + budget + ' — trả nợ (mismatch/draft/refused) trước khi thêm feature mới.');
      process.exit(1);
    }
    console.log('   ✅ Trong ngân sách entropy: S=' + S + ' ≤ ' + budget);
  }
  if (trendRequested && trend.gate) {
    console.error('🚀 ESCAPE VELOCITY: S tăng ' + trend.increases + ' lần đo liên tiếp (cần ≥' + trendN + ') — ' + trendWindow.map(p => p.S).join('→') + ' — chặn thêm feature: trả nợ entropy (mismatch/draft/refused) trước khi vượt thoát.');
    process.exit(1);
  }
  if (trendRequested) console.log('   ✅ ESCAPE VELOCITY: chưa đạt vận tốc thoát (đà ' + trend.increases + '/' + trendN + ') — được phép thêm feature.');
}

async function main() {
  const args = process.argv.slice(2);
  const { asJson, outPath, budget, trendRequested, trendN } = parseArgs(args);

  let registry = {};
  try { registry = JSON.parse(await fs.readFile(REGISTRY_PATH, 'utf8')); }
  catch (e) { console.error('registry read fail: ' + e.message); process.exit(1); }

  // 1. mismatch + disabled + missing (drift vũ trụ)
  const { mismatches, missing, disabled } = scanRegistry(registry);

  // 1b. dark matter — hidden complexity (orphan + disabled)
  const { orphans, darkMatter, dmLevel, dmAdvice } = await scanOrphans(registry, disabled);

  // 2. drafts (bug mở) — supernova chưa nguội + KN count
  const { drafts, bugsTotal } = await scanBugDrafts();
  const knTotal = await scanKnowledge();
  const capability = await measureCapability(knTotal);

  // 3. audit refused/failed — va chạm chân trời sự kiện
  const { refused, failed, auditTotal } = await scanAudit();

  // 4. black holes — bottleneck đã biết (KN) + dynamic
  const blackHoles = buildBlackHoles(missing, failed);

  // 5. dark energy — decollaboration (KN-018) + gravity — scope control (YAGNI)
  const { plansTotal, plansWithDissent, plansWithCut } = await measurePlans();
  const { dissentRatio, darkEnergy, cutRatio, gravity, gLevel, gAdvice, deAdvice } = energyMetrics({ plansTotal, plansWithDissent, plansWithCut });

  // 6. entropy
  const { S, level, advice } = entropyOf({ mismatch: mismatches.length, drafts, refused, disabled, failed });

  const result = {
    generatedAt: new Date().toISOString(),
    generatedBy: 'cosmic-scale.mjs',
    entropy: { S, level, advice, parts: { mismatch: mismatches.length, drafts, refused, disabled, failed } },
    darkEnergy: { D: darkEnergy, dissentRatio: Math.round(dissentRatio * 100) / 100, plansTotal, plansWithDissent, advice: deAdvice },
    gravity: { G: gravity, level: gLevel, cutRatio: Math.round(cutRatio * 100) / 100, plansTotal, plansWithCut, advice: gAdvice },
    darkMatter: { M: darkMatter, level: dmLevel, advice: dmAdvice, orphans, orphanCount: orphans.length, disabledGalaxies: disabled },
    counts: { knTotal, bugsTotal, auditTotal },
    capability,
    mismatches, missing, blackHoles,
    policy: await checkPolicy(),
  };

  // 7. escape velocity — gate theo ĐÀ S (roadmap: --trend N).
  // History: đọc từ --out nếu có, else scale.json mặc định (explicit — không fallback ngầm).
  const historySource = outPath || path.join(ROOT, 'www', 'cosmos', 'scale.json');
  const history = await readHistory(historySource);
  const prevCap = history.length ? history[history.length - 1].C : undefined;
  history.push({ t: result.generatedAt, S, level, M: darkMatter, D: darkEnergy, G: gravity, C: capability });
  result.history = history;
  result.capabilityDelta = capabilityDelta(prevCap, capability);
  const { trend, window: trendWindow } = computeTrend(history, trendN);
  result.trend = trend;

  await writeOutput(outPath, result);
  if (asJson || outPath) console.log(JSON.stringify(result, null, 2));
  else printHuman(result, outPath, trendN);

  runGates({ budget, S, trendRequested, trendN, trend, trendWindow });
}

main().catch(e => { console.error(e); process.exit(1); });
