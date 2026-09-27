#!/usr/bin/env node
/**
 * Rank Stability — máy chấm eval-hygiene cho KN-080 (arXiv:2609.30074 — Sarkar, 24/09/2026)
 * "How Reproducible Are Evaluation Conclusions? A Self-Audit of LLM-Inferred Prompt Structure"
 *
 * Paper: 72% prompt-model cells không bao giờ node-set-perfect · bootstrap chỉ ĐÁY bảng vững
 * (99%/86%), middle 27–48%, top 68% · 2 quy tắc merge hợp lý đổi 4/8 hàng + headline 7pp
 * · reproducible ≠ accurate · 4/8 endpoint thu hồi trong 10 tuần.
 *
 * Enforce 5 recommendations (declare → machine):
 *   rank stability     → seeded prompt-cluster bootstrap (retention @point-rank + pTop1 + CI diff)
 *   sensitivity        → chạy 3 quy tắc tổng hợp (mean/median/winrate); top1 đổi rule = fault
 *   provenance/raw     → input PHẢI là runs[] per-run (aggregate-only = exit 2)
 *   measurement date   → measuredAt + shelf-life (age > max-age-days → stale)
 *   reproducible≠acc.  → truth optional (--require-truth); so rank-score vs rank-accuracy
 *
 * Usage:
 *   node .github/harness/scripts/rank-stability.mjs check --file <results.json> [--claim "best"]
 *        [--threshold 0.8] [--bootstrap 400] [--seed 42] [--min-runs 2] [--max-age-days 70]
 *        [--require-truth] [--warn] [--json]
 *   node .github/harness/scripts/rank-stability.mjs selftest
 *
 * Input (canonical — design: .agent/plans/rank-stability-gate/design.md):
 *   { "measuredAt": "YYYY-MM-DD", "claim": "best", "models": ["m1","m2"],
 *     "cells": [ { "prompt": "p1", "model": "m1", "runs": [0.9, 0.85], "truth": 0.9 } ] }
 *
 * Exit: 0 = pass/report-only · 1 = claim không được evidence hỗ trợ · 2 = input/usage lỗi (fail-closed)
 * No deps, Node 18+.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DAY_MS = 86400000;
const DEFAULTS = { threshold: 0.8, bootstrap: 400, seed: 42, minRuns: 2, maxAgeDays: 70 };

// ── args: whitelist + validate tại boundary (KN-069 — NaN-pass ẩn = fail-open) ──
const BOOL_FLAGS = new Set(['json', 'warn', 'require-truth']);
const STR_FLAGS = new Set(['file', 'claim']);
const NUM_FLAGS = new Set(['threshold', 'bootstrap', 'seed', 'min-runs', 'max-age-days']);

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) return { error: `arg lạ "${a}" (whitelist — KN-069)` };
    const key = a.slice(2);
    if (BOOL_FLAGS.has(key)) { args[key] = true; continue; }
    if (!STR_FLAGS.has(key) && !NUM_FLAGS.has(key)) return { error: `flag không hỗ trợ --${key} (fail-closed)` };
    const val = argv[i + 1];
    if (val === undefined || val.startsWith('--')) return { error: `--${key} thiếu giá trị (fail-closed — KN-069)` };
    i++;
    if (NUM_FLAGS.has(key)) {
      const n = Number(val);
      if (!Number.isFinite(n)) return { error: `--${key} không hữu hạn: "${val}" (KN-069)` };
      args[key] = n;
    } else args[key] = val;
  }
  return { args };
}

function buildOpts(args) {
  const opt = { ...DEFAULTS };
  const map = { threshold: 'threshold', bootstrap: 'bootstrap', seed: 'seed', 'min-runs': 'minRuns', 'max-age-days': 'maxAgeDays' };
  for (const [k, v] of Object.entries(map)) if (args[k] !== undefined) opt[v] = args[k];
  const bad = rangeErrors(opt);
  if (bad.length) return { error: `giá trị ngoài miền: ${bad.join(' · ')}` };
  opt.claim = typeof args.claim === 'string' ? args.claim : null;
  opt.json = !!args.json;
  opt.warn = !!args.warn;
  opt.requireTruth = !!args['require-truth'];
  return { opt };
}

function rangeErrors(o) {
  const bad = [];
  if (!(o.threshold > 0 && o.threshold <= 1)) bad.push('threshold ∈ (0,1]');
  if (!Number.isInteger(o.bootstrap) || o.bootstrap < 100) bad.push('bootstrap ≥100 (int)');
  if (!Number.isInteger(o.minRuns) || o.minRuns < 1) bad.push('min-runs ≥1 (int)');
  if (!(o.maxAgeDays >= 0)) bad.push('max-age-days ≥0');
  return bad;
}

// ── validate + group (raw per-run bắt buộc — KN-080c) ─────────────────
function parseDateUtc(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const t = Date.parse(s + 'T00:00:00Z');
  return Number.isFinite(t) ? t : null;
}

function validateModels(models) {
  if (!Array.isArray(models) || models.length < 2) return 'cần ≥2 models (mới có rank để so)';
  if (new Set(models).size !== models.length || models.some(m => typeof m !== 'string' || !m.trim())) {
    return 'models: chỉ chuỗi unique không rỗng';
  }
  return null;
}

function validateMeta(doc, nowMs) {
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) return 'results không phải object JSON';
  const ms = parseDateUtc(doc.measuredAt);
  if (ms === null) return 'thiếu/sai measuredAt (YYYY-MM-DD — shelf-life, KN-080d)';
  if (ms > nowMs + DAY_MS) return `measuredAt ở tương lai: ${doc.measuredAt}`;
  const mErr = validateModels(doc.models);
  if (mErr) return mErr;
  if (!Array.isArray(doc.cells) || !doc.cells.length) return 'cells rỗng — raw per-run bắt buộc (aggregate-only = fail-closed)';
  return null;
}

function cellBaseError(cell, models, i) {
  const at = `cells[${i}]`;
  if (!cell || typeof cell !== 'object') return `${at} không phải object`;
  if (typeof cell.prompt !== 'string' || !cell.prompt.trim()) return `${at}.prompt rỗng`;
  if (!models.includes(cell.model)) return `${at}.model "${cell.model}" không thuộc models`;
  return null;
}

function cellValueError(cell, minRuns, i) {
  const at = `cells[${i}]`;
  if (!Array.isArray(cell.runs) || cell.runs.length < minRuns) return `${at}.runs < min-runs (${minRuns}) — 1 run/cell không đo được noise`;
  if (cell.runs.some(r => typeof r !== 'number' || !Number.isFinite(r))) return `${at}.runs chứa giá trị không hữu hạn`;
  if (cell.truth !== undefined && (typeof cell.truth !== 'number' || !Number.isFinite(cell.truth))) return `${at}.truth không hữu hạn`;
  return null;
}

function groupCells(doc, minRuns) {
  const byModel = new Map(doc.models.map(m => [m, new Map()]));
  for (let i = 0; i < doc.cells.length; i++) {
    const cell = doc.cells[i];
    const err = cellBaseError(cell, doc.models, i) || cellValueError(cell, minRuns, i);
    if (err) return { error: err };
    byModel.get(cell.model).set(cell.prompt, { runs: cell.runs, truth: cell.truth });
  }
  const prompts = [...new Set(doc.cells.map(c => c.prompt))];
  for (const m of doc.models) if (!byModel.get(m).size) return { error: `model "${m}" không có cell nào` };
  for (const p of prompts) {
    for (const m of doc.models) {
      if (!byModel.get(m).has(p)) return { error: `prompt "${p}" thiếu model "${m}" — coverage không balanced (rank không công bằng)` };
    }
  }
  const truthCount = doc.cells.filter(c => c.truth !== undefined).length;
  if (truthCount !== 0 && truthCount !== doc.cells.length) return { error: 'truth phải all-or-none (nhất quán toàn file)' };
  return { byModel, prompts, hasTruth: truthCount > 0 };
}

// ── stats + aggregation rules (sensitivity executed — KN-080b) ────────
function mean(xs) { let s = 0; for (const x of xs) s += x; return s / xs.length; }
function median(xs) {
  const s = [...xs].sort((a, b) => a - b);
  const h = s.length >> 1;
  return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2;
}
function round3(x) { return Number(x.toFixed(3)); }
function cellMeanOf(runs) { return mean(runs); }

function ruleScores(byModel, prompts, cellFn) {
  const out = {};
  for (const [m, pm] of byModel) out[m] = mean(prompts.map(p => cellFn(pm.get(p).runs)));
  return out;
}

function winrateScores(byModel, prompts) {
  const wins = Object.fromEntries([...byModel.keys()].map(m => [m, 0]));
  for (const p of prompts) {
    const means = [...byModel.entries()].map(([m, pm]) => [m, mean(pm.get(p).runs)]);
    const best = Math.max(...means.map(x => x[1]));
    const winners = means.filter(x => x[1] === best);
    for (const [w] of winners) wins[w] += 1 / winners.length;
  }
  const out = {};
  for (const m of byModel.keys()) out[m] = wins[m] / prompts.length;
  return out;
}

function rankOrder(scores) {
  return Object.keys(scores).sort((a, b) => scores[b] - scores[a] || (a < b ? -1 : 1));
}

// ── seeded prompt-cluster bootstrap (KN-080a — deterministic, có seed) ──
function mulberry32(seed) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6D2B79F5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function resample(arr, rnd) {
  const out = new Array(arr.length);
  for (let i = 0; i < arr.length; i++) out[i] = arr[Math.floor(rnd() * arr.length)];
  return out;
}

function percentile(sorted, q) {
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.round(q * (sorted.length - 1))))];
}

function bootstrapRanks(byModel, prompts, opt) {
  const rnd = mulberry32(opt.seed);
  const models = [...byModel.keys()];
  const point = rankOrder(ruleScores(byModel, prompts, cellMeanOf));
  const pointRank = Object.fromEntries(point.map((m, i) => [m, i + 1]));
  const rankCounts = Object.fromEntries(models.map(m => [m, {}]));
  const diffs = [];
  for (let b = 0; b < opt.bootstrap; b++) {
    const scores = ruleScores(byModel, resample(prompts, rnd), cellMeanOf);
    rankOrder(scores).forEach((m, i) => { const r = i + 1; rankCounts[m][r] = (rankCounts[m][r] || 0) + 1; });
    diffs.push(scores[point[0]] - scores[point[1]]);
  }
  const perModel = {};
  for (const m of models) {
    const counts = rankCounts[m];
    const rows = Object.entries(counts).map(([r, c]) => [Number(r), c]).sort((a, b) => b[1] - a[1]);
    perModel[m] = {
      rank: pointRank[m],
      retention: round3((counts[pointRank[m]] || 0) / opt.bootstrap),
      modalRank: rows[0][0],
      modalFreq: round3(rows[0][1] / opt.bootstrap),
      pTop1: round3((counts[1] || 0) / opt.bootstrap),
    };
  }
  diffs.sort((a, b) => a - b);
  const beat = diffs.filter(d => d > 0).length + 0.5 * diffs.filter(d => d === 0).length;
  return {
    point,
    perModel,
    ciDiff: [round3(percentile(diffs, 0.05)), round3(percentile(diffs, 0.95))],
    pBeat2: round3(beat / diffs.length),
    gap: round3(mean(diffs)),
  };
}

// ── reproducible ≠ accurate (KN-080e): truth optional ─────────────────
function truthCompare(byModel, prompts, pointOrder) {
  const mae = {};
  for (const [m, pm] of byModel) {
    mae[m] = mean(prompts.map(p => Math.abs(mean(pm.get(p).runs) - pm.get(p).truth)));
  }
  const byAccuracy = Object.keys(mae).sort((a, b) => mae[a] - mae[b] || (a < b ? -1 : 1));
  return {
    provided: true,
    mae: Object.fromEntries(Object.entries(mae).map(([m, v]) => [m, round3(v)])),
    byScore: pointOrder,
    byAccuracy,
    rankMatch: pointOrder.every((m, i) => byAccuracy[i] === m),
  };
}

// ── report + verdict ──────────────────────────────────────────────────
function buildReport(fileLabel, doc, group, opt, nowMs) {
  const rules = {
    mean: ruleScores(group.byModel, group.prompts, cellMeanOf),
    median: ruleScores(group.byModel, group.prompts, median),
    winrate: winrateScores(group.byModel, group.prompts),
  };
  const rankings = { mean: rankOrder(rules.mean), median: rankOrder(rules.median), winrate: rankOrder(rules.winrate) };
  const boot = bootstrapRanks(group.byModel, group.prompts, opt);
  const ageDays = Math.floor((nowMs - parseDateUtc(doc.measuredAt)) / DAY_MS);
  const top1 = boot.point[0];
  const tops = Object.values(rankings).map(o => o[0]);
  const report = {
    tool: 'rank-stability',
    file: fileLabel,
    measuredAt: doc.measuredAt,
    ageDays,
    stale: ageDays > opt.maxAgeDays,
    claim: opt.claim,
    opt: { threshold: opt.threshold, bootstrap: opt.bootstrap, seed: opt.seed, minRuns: opt.minRuns, maxAgeDays: opt.maxAgeDays },
    models: doc.models,
    prompts: group.prompts.length,
    runs: doc.cells.reduce((n, c) => n + c.runs.length, 0),
    rules,
    rankings,
    sensitivity: { stable: new Set(tops).size === 1, top1ByRule: Object.fromEntries(Object.keys(rankings).map(k => [k, rankings[k][0]])) },
    stability: boot.perModel,
    top: {
      model: top1,
      runnerUp: boot.point[1],
      firm: boot.perModel[top1].pTop1 >= opt.threshold,
      withinNoise: boot.ciDiff[0] <= 0,
      pTop1: boot.perModel[top1].pTop1,
      pBeat2: boot.pBeat2,
      gap: boot.gap,
      ciDiff: boot.ciDiff,
    },
    truth: group.hasTruth ? truthCompare(group.byModel, group.prompts, boot.point) : { provided: false },
    reasons: [],
    verdict: 'pass',
  };
  report.reasons = collectReasons(report, opt);
  const v = verdictOf(report, opt);
  report.verdict = v.verdict;
  return { code: v.code, report };
}

function collectReasons(r, opt) {
  const reasons = [];
  if (!r.sensitivity.stable) {
    reasons.push(`sensitivity: top1 phụ thuộc quy tắc (${Object.entries(r.sensitivity.top1ByRule).map(([k, v]) => `${k}=${v}`).join(' · ')})`);
  }
  if (r.top.pTop1 < opt.threshold) reasons.push(`rank stability: pTop1=${r.top.pTop1} < ${opt.threshold} — top chưa đủ vững (KN-080a)`);
  if (r.top.withinNoise) reasons.push(`within noise: CI diff [${r.top.ciDiff.join(', ')}] chứa 0 — không phân biệt được #1/#2 (KN-080a)`);
  if (r.stale) reasons.push(`shelf-life: đo ${r.ageDays}d trước > ${opt.maxAgeDays}d — re-run trước khi tái dùng (KN-080d)`);
  if (r.truth.provided && !r.truth.rankMatch) reasons.push('ground truth: rank theo accuracy KHÁC rank theo raw score — reproducible ≠ accurate (KN-080e)');
  if (opt.requireTruth && !r.truth.provided) reasons.push('--require-truth: thiếu truth — chưa kiểm được reproducible ≠ accurate');
  return reasons;
}

function verdictOf(report, opt) {
  if (!report.claim) return { verdict: report.reasons.length ? 'report' : 'pass', code: 0 };
  if (!report.reasons.length) return { verdict: 'pass', code: 0 };
  return opt.warn ? { verdict: 'warn', code: 0 } : { verdict: 'fail', code: 1 };
}

// ── print ─────────────────────────────────────────────────────────────
function printReport(report, opt) {
  if (opt.json) { console.log(JSON.stringify(report, null, 2)); return; }
  const icon = { pass: '✅ PASS', fail: '❌ FAIL', warn: '⚠ WARN', report: '📊 REPORT' }[report.verdict];
  console.log(`Rank-stability [${report.file}]: ${icon}${report.claim ? ` · claim="${report.claim}"` : ' (không claim — report-only)'}`);
  console.log(`  measuredAt ${report.measuredAt} (age ${report.ageDays}d) · ${report.models.length} models · ${report.prompts} prompts · ${report.runs} runs (raw per-run ✓)`);
  const ruleTxt = Object.entries(report.sensitivity.top1ByRule).map(([k, v]) => `${k}=${v}`).join(' · ');
  console.log(`  rules: ${ruleTxt} ${report.sensitivity.stable ? '(stable)' : '⚠ phụ thuộc rule'}`);
  const ret = report.models.map(m => `${m} pTop1=${report.stability[m].pTop1} retention=${report.stability[m].retention}@#${report.stability[m].rank}`);
  console.log(`  stability (seed ${report.opt.seed}, B=${report.opt.bootstrap}): ${ret.join(' · ')}`);
  console.log(`  top: ${report.top.model} · pTop1=${report.top.pTop1} · P(beat #2)=${report.top.pBeat2} · CI diff [${report.top.ciDiff.join(', ')}] ${report.top.withinNoise ? '⚠ chứa 0' : '✓ loại 0'}`);
  if (report.truth.provided) {
    console.log(`  truth: MAE ${Object.entries(report.truth.mae).map(([m, v]) => `${m}=${v}`).join(' · ')} · rankMatch=${report.truth.rankMatch}`);
  } else {
    console.log('  truth: không cung cấp — stability ≠ accuracy (KN-080e — đối chiếu rubric/grounding)');
  }
  report.reasons.forEach(x => console.log(`  − ${x}`));
}

// ── selftest: 6 case có negative control chạy thật (KN-078) ───────────
function synth(kind) {
  const models = ['m1', 'm2', 'm3'];
  const center = kind === 'clear' || kind === 'stale' ? { m1: 90, m2: 70, m3: 50 } : { m1: 80, m2: 80, m3: 60 };
  const rnd = mulberry32(kind === 'clear' || kind === 'stale' ? 11 : 7);
  const cells = [];
  for (let p = 1; p <= 8; p++) {
    for (const m of models) {
      cells.push({
        prompt: `p${String(p).padStart(2, '0')}`,
        model: m,
        runs: Array.from({ length: 3 }, () => Number(((center[m] + (rnd() - 0.5) * 4) / 100).toFixed(4))),
      });
    }
  }
  const daysAgo = kind === 'stale' ? 100 : 1;
  return { measuredAt: new Date(Date.now() - daysAgo * DAY_MS).toISOString().slice(0, 10), models, cells };
}

function evaluateDoc(doc, fileLabel, opt, nowMs) {
  const metaErr = validateMeta(doc, nowMs);
  if (metaErr) return { code: 2, error: metaErr };
  const group = groupCells(doc, opt.minRuns);
  if (group.error) return { code: 2, error: group.error };
  return buildReport(fileLabel, doc, group, opt, nowMs);
}

function selftest() {
  const opt = { ...DEFAULTS, claim: 'best', json: false, warn: false, requireTruth: false };
  const now = Date.now();
  const clear = evaluateDoc(synth('clear'), 'selftest:clear', opt, now);
  const tie = evaluateDoc(synth('tie'), 'selftest:tie', opt, now);
  const stale = evaluateDoc(synth('stale'), 'selftest:stale', opt, now);
  const malformed = synth('clear');
  delete malformed.cells[0].runs;
  const single = synth('clear');
  single.cells[0].runs = [0.5];
  const argErrs = [
    parseArgs(['--bogus']).error,
    parseArgs(['--threshold', 'abc']).error,
    parseArgs(['--bootstrap']).error,
    buildOpts({ threshold: 2 }).error,
  ];
  const cases = [
    ['clear→firm+pass', clear.code === 0 && clear.report.top.firm === true && clear.report.sensitivity.stable === true],
    ['near-tie→claim fail(exit1)', tie.code === 1 && tie.report.top.withinNoise === true && tie.report.reasons.length >= 1],
    ['stale→claim fail(exit1)', stale.code === 1 && stale.report.stale === true],
    ['malformed→exit2', evaluateDoc(malformed, 'selftest:malformed', opt, now).code === 2],
    ['single-run→exit2', evaluateDoc(single, 'selftest:single', opt, now).code === 2],
    ['bad-args→fail-closed', argErrs.every(Boolean)],
  ];
  const failed = cases.filter(([, ok]) => !ok);
  if (failed.length) {
    console.log(`SELFTEST FAIL: ${failed.map(([n]) => n).join(' · ')}`);
    process.exit(1);
  }
  console.log(`SELFTEST OK (${cases.length} cases: clear ✓firm · tie ✗claim · stale ✗claim · malformed ✗exit2 · single-run ✗exit2 · bad-args ✗fail-closed)`);
  process.exit(0);
}

// ── main ──────────────────────────────────────────────────────────────
function main() {
  const cmd = process.argv[2];
  if (cmd === 'selftest') return selftest();
  if (cmd !== 'check') {
    console.error('usage: rank-stability.mjs check --file <results.json> [--claim "best"] … | selftest');
    process.exit(2);
  }
  const { args, error } = parseArgs(process.argv.slice(3));
  if (error) { console.error(`⛔ ${error}`); process.exit(2); }
  if (!args.file) { console.error('⛔ --file bắt buộc (fail-closed — không verify = không pass)'); process.exit(2); }
  const { opt, error: optErr } = buildOpts(args);
  if (optErr) { console.error(`⛔ ${optErr}`); process.exit(2); }
  let doc;
  try {
    doc = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), args.file), 'utf8'));
  } catch (e) {
    console.error(`⛔ không đọc/parse được ${args.file}: ${String(e.message).slice(0, 140)}`);
    process.exit(2);
  }
  const r = evaluateDoc(doc, args.file, opt, Date.now());
  if (r.error) { console.error(`⛔ ${r.error}`); process.exit(2); }
  printReport(r.report, opt);
  process.exit(r.code);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url); // repo idiom (KN-074)
if (isMain) main();
