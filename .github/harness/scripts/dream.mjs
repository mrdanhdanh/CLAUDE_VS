#!/usr/bin/env node
/**
 * dream.mjs — Dream v0 (Dream-RSI lite — arXiv:2609.14858, xem KN-067 draft)
 *
 * "History is already a simulator": chấm candidate artifact (biến thể knowleged.md)
 * bằng REPLAY trên history đã ghi — 0 execution, không chạy lại task nào.
 *
 * Battery v0 (deterministic, offline):
 *   1. INTEGRITY GATE — checkKnIntegrity (dup/orphan/order — KN-066). Fail ⇒ score = 0.
 *   2. RECALL@K — replay mọi bug title trong corpus (KN → `.agent/bugs/<slug>/bug.md`):
 *      title phải tìm lại được chính KN của nó (cùng máy BM25 với `suggest`).
 *   3. GUARDS — số KN có lưới (info, không weight — KN-024).
 *
 * π0-in-set (winner never worse): `run` luôn thêm baseline (docs/knowleged.md) vào set
 *   ⇒ winner = argmax score với π0 ∈ set ⇒ π(t+1) ≥ π(t).
 *
 * KHÔNG ghi file nào — deploy winner = người copy đè (manual).
 *
 * Usage:
 *   node .github/harness/scripts/dream.mjs score --file <candidate.md> [--baseline <ref.md>] [--bugs <dir>] [--top 3] [--json]
 *   node .github/harness/scripts/dream.mjs run --candidate <a.md> [--candidate <b.md> ...] [--baseline <ref.md>] [--bugs <dir>] [--top 3] [--json]
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseKNs, checkKnIntegrity, tokenize, computeIDF, scoreKN } from './kn-parse.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const DEFAULT_KN = path.join(ROOT, 'docs', 'knowleged.md');
const DEFAULT_BUGS = path.join(ROOT, '.agent', 'bugs');

const rel = (f) => {
  const r = path.relative(ROOT, f);
  return r.startsWith('..') ? f : r;
};
const pct = (x) => `${(x * 100).toFixed(1)}%`;
const failClosed = (msg) => { console.error(msg); process.exit(2); };
const usageFail = (msg) => {
  console.error(`❌ ${msg}`);
  console.error('→ node .github/harness/scripts/dream.mjs help');
  process.exit(1);
};

// ---------- args ----------
function parseArgs(argv) {
  const args = argv.slice(2);
  const hasCmd = args[0] && !args[0].startsWith('--');
  const cmd = hasCmd ? args[0] : 'help';
  const rest = hasCmd ? args.slice(1) : args;
  const opts = {};
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const val = rest[i + 1] && !rest[i + 1].startsWith('--') ? rest[++i] : true;
    if (key === 'candidate') opts.candidates = [...(opts.candidates || []), val];
    else opts[key] = val;
  }
  return { cmd, opts };
}

// ---------- history: bug titles (1 nguồn cho cả run) ----------
async function loadBugTitles(bugsDir) {
  const titles = new Map();
  let entries = [];
  try { entries = await fs.readdir(bugsDir, { withFileTypes: true }); } catch { return titles; }
  for (const e of entries) {
    if (!e.isDirectory() || e.name.startsWith('_')) continue;
    try {
      const text = await fs.readFile(path.join(bugsDir, e.name, 'bug.md'), 'utf8');
      const m = text.match(/^#\s*Bug:\s*(.+)$/m) || text.match(/Title:\s*(.+)/);
      if (m) titles.set(e.name, m[1].trim());
    } catch { /* bug.md thiếu → bỏ qua, không fatal */ }
  }
  return titles;
}

function resolveOriginSlug(kn) {
  const m = kn.detail.match(/\.agent\/bugs\/([^/\s`]+)\//);
  return m ? m[1] : null;
}

function countGuards(raw) {
  const vals = [...raw.matchAll(/-\s*\*\*Guard:\*\*\s*([^\n]*)/g)].map((m) => m[1].trim());
  return vals.filter((v) => v && !/^(—|–|-|⚠|<)/.test(v)).length;
}

// ---------- battery ----------
function buildQueries(kns, bugTitles) {
  return kns
    .map((kn) => ({ knId: kn.id, slug: resolveOriginSlug(kn) }))
    .filter((q) => q.slug && bugTitles.has(q.slug))
    .map((q) => ({ ...q, title: bugTitles.get(q.slug) }));
}

function scoreQueries(kns, queries, topK) {
  const misses = [];
  let hits = 0;
  for (const q of queries) {
    const tokens = tokenize(q.title);
    const idf = computeIDF(tokens, kns);
    const ranked = kns
      .map((kn) => ({ id: kn.id, s: scoreKN(tokens, q.title, kn, idf) }))
      .sort((a, b) => b.s - a.s);
    const rank = ranked.findIndex((x) => x.id === q.knId);
    if (rank >= 0 && rank < topK) hits++;
    else misses.push(q.knId);
  }
  return { hits, misses };
}

async function evaluateArtifact(file, bugTitles, topK) {
  const abs = path.resolve(file);
  let parsed;
  try { parsed = await parseKNs(abs); } catch (e) { return { file: abs, fatal: `không đọc được: ${e.message}` }; }
  const { kns, raw, error } = parsed;
  if (error || kns.length === 0) return { file: abs, fatal: error || 'không parse được KN nào' };

  const integrity = checkKnIntegrity(raw);
  const queries = buildQueries(kns, bugTitles);
  const { hits, misses } = scoreQueries(kns, queries, topK);
  const recall = queries.length ? Math.round((hits / queries.length) * 1000) / 1000 : 0;
  const gateOk = integrity.length === 0;
  return {
    file: abs,
    knCount: kns.length,
    guards: countGuards(raw),
    integrity: { ok: gateOk, issues: integrity },
    queries: { total: queries.length, hits, recall, misses },
    score: gateOk ? recall : 0,
    gate: gateOk ? 'pass' : 'fail',
  };
}

function requireScorable(ev) {
  if (ev.fatal) failClosed(`⛔ ${rel(ev.file)}: ${ev.fatal}`);
  if (ev.queries.total === 0) {
    failClosed(
      `⛔ ${rel(ev.file)}: 0 query resolve được từ history — cần dòng '- **Bug report:** \`.agent/bugs/<slug>/bug.md\`' trong KN để replay (fail-closed).`
    );
  }
}

// ---------- output ----------
function printArtifact(ev, baseline, topK) {
  const d = baseline ? ev.score - baseline.score : null;
  const dTxt = d === null ? '' : ` (Δ ${d >= 0 ? '+' : ''}${(d * 100).toFixed(1)}pt)`;
  const missTxt = ev.queries.misses.length
    ? ` · miss: ${ev.queries.misses.slice(0, 8).join(', ')}${ev.queries.misses.length > 8 ? ` …+${ev.queries.misses.length - 8}` : ''}`
    : '';
  console.log(`📄 ${rel(ev.file)}`);
  console.log(`   gate: ${ev.gate === 'pass' ? '✅ integrity OK' : `⛔ integrity FAIL — ${ev.integrity.issues.join(' · ')}`}`);
  console.log(`   recall@${topK}: ${pct(ev.queries.recall)} (${ev.queries.hits}/${ev.queries.total})${dTxt}`);
  console.log(`   kn: ${ev.knCount} · guards: ${ev.guards} · score: ${ev.score}${missTxt}`);
}

function resolveCommon(opts) {
  const bugsDir = opts.bugs ? path.resolve(opts.bugs) : DEFAULT_BUGS;
  const topK = Math.max(1, parseInt(opts.top || '3', 10) || 3);
  return { bugsDir, topK };
}

function printScoreResult(ev, baseline, topK, json) {
  if (json) {
    console.log(JSON.stringify({ cmd: 'score', topK, baseline, candidate: ev }, null, 2));
    return;
  }
  console.log(`🌙 dream score — replay history, 0 execution · top-${topK}`);
  if (baseline) printArtifact(baseline, null, topK);
  printArtifact(ev, baseline, topK);
  if (baseline) {
    console.log(`\n⚖️  ${ev.score >= baseline.score ? '✅ ≥ π0 — đáng cân nhắc deploy' : '⛔ < π0 — không nên deploy (giữ baseline)'}`);
  }
}

async function cmdScore(opts) {
  const file = opts.file || (opts.candidates && opts.candidates[0]);
  if (!file) usageFail('score cần --file <candidate.md>');
  const { bugsDir, topK } = resolveCommon(opts);
  const bugTitles = await loadBugTitles(bugsDir);
  const ev = await evaluateArtifact(file, bugTitles, topK);
  requireScorable(ev);
  const baseline = opts.baseline ? await evaluateArtifact(opts.baseline, bugTitles, topK) : null;
  if (baseline) requireScorable(baseline);
  printScoreResult(ev, baseline, topK, opts.json);
}

async function evaluateAll(paths, bugTitles, topK, baselinePath) {
  const evaluated = [];
  for (const f of paths) {
    const ev = await evaluateArtifact(f, bugTitles, topK);
    requireScorable(ev);
    evaluated.push({ ...ev, isBaseline: f === baselinePath });
  }
  return evaluated;
}

function printRunResult({ evaluated, candidates, baseline, winner, topK }, json) {
  if (json) {
    console.log(JSON.stringify({
      cmd: 'run', topK,
      baseline: { file: rel(baseline.file), score: baseline.score },
      candidates: candidates.map((c) => ({ file: rel(c.file), score: c.score, gate: c.gate })),
      winner: { file: rel(winner.file), score: winner.score, isBaseline: !!winner.isBaseline },
      guarantee: 'winner >= pi0 (baseline trong candidate set)',
    }, null, 2));
    return;
  }
  console.log(`🌙 dream run — ${evaluated.length} artifacts (π0 included) · top-${topK}`);
  for (const e of [...candidates, baseline]) printArtifact(e, e.isBaseline ? null : baseline, topK);
  console.log(`\n⚖️  π0-in-set ⇒ winner never worse (π0 = ${rel(baseline.file)})`);
  if (winner.isBaseline) {
    console.log(`🏆 winner: π0 (không candidate nào tốt hơn — giữ nguyên, score ${winner.score})`);
  } else {
    console.log(`🏆 winner: ${rel(winner.file)} — score ${winner.score} vs π0 ${baseline.score}`);
  }
  console.log('→ deploy = MANUAL: copy winner đè target rồi verify (dream không tự ghi file).');
}

async function cmdRun(opts) {
  const cands = (opts.candidates || []).map((f) => path.resolve(f));
  if (cands.length === 0) usageFail('run cần ít nhất 1 --candidate <file>');
  const { bugsDir, topK } = resolveCommon(opts);
  const baselinePath = path.resolve(opts.baseline || DEFAULT_KN);
  const bugTitles = await loadBugTitles(bugsDir);

  const evaluated = await evaluateAll([...new Set([...cands, baselinePath])], bugTitles, topK, baselinePath);
  const baseline = evaluated.find((e) => e.isBaseline);
  const candidates = evaluated.filter((e) => !e.isBaseline);
  // π0-in-set ⇒ winner never worse: baseline ∈ set; tie → giữ π0 ('>' strict)
  const winner = evaluated.reduce((best, e) => (e.score > best.score ? e : best), baseline);
  printRunResult({ evaluated, candidates, baseline, winner, topK }, opts.json);
}

function printHelp() {
  console.log(`🌙 dream — chấm candidate artifact bằng replay history (0 execution) — Dream-RSI lite

Usage:
  node .github/harness/scripts/dream.mjs score --file <candidate.md> [--baseline <ref.md>] [--bugs <dir>] [--top 3] [--json]
  node .github/harness/scripts/dream.mjs run --candidate <a.md> [--candidate <b.md> ...] [--baseline <ref.md>] [--bugs <dir>] [--top 3] [--json]
  node .github/harness/scripts/dream.mjs help

Battery (deterministic, offline):
  1. integrity gate  — dup/orphan/order (KN-066); fail ⇒ score = 0
  2. recall@K        — mỗi bug title trong corpus phải tìm lại KN của nó (BM25, như suggest)
  3. guards          — số KN có lưới (info)

Guarantee: π0 (baseline) luôn nằm trong candidate set ⇒ winner never worse.
Deploy = MANUAL — dream không ghi file nào. Giới hạn: recall là proxy (K=3, title dài
dễ hòa) — giá trị phân biệt rõ khi candidate VIẾT LẠI title/tags/summary.

Ví dụ kích hoạt thủ công:
  node .github/harness/scripts/dream.mjs score --file docs/knowleged.md --top 3
  node .github/harness/scripts/dream.mjs run --candidate .agent/tmp/variant-a.md --candidate .agent/tmp/variant-b.md`);
}

async function main() {
  const { cmd, opts } = parseArgs(process.argv);
  if (cmd === 'score') return cmdScore(opts);
  if (cmd === 'run') return cmdRun(opts);
  printHelp();
}

main().catch((e) => {
  console.error(`❌ dream lỗi: ${e.message}`);
  if (process.env.DEBUG) console.error(e.stack);
  process.exit(1);
});
