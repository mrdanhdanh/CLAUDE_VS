#!/usr/bin/env node
/**
 * Eval Gate — P1-2 Harness 2.1 (Lesson 10 offline eval)
 * Offline smoke checks before deploy: syntax + MCP tools + plan-validate.
 * Harness 2.5 (KN-037/KN-072 + Opus 5.5 pattern 2026-09-22):
 *   --scope components  → component-level evals (registry: .github/harness/evals/components.json)
 *   --scope grounding   → fact-grader: số/quote trong content phải có trong sources (invented = fail)
 * Usage:
 *   node eval-gate.mjs --scope www/library
 *   node eval-gate.mjs --scope all --json
 *   node eval-gate.mjs --scope components
 *   node eval-gate.mjs --scope grounding --content <f> --sources "a,b" [--min-claims N] [--warn] [--allow-empty]
 * Exit: 0 = pass, 1 = fail, 2 = error/fail-closed
 * No deps, Node 18+
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..', '..');

function run(cmd, opts = {}) {
  try {
    const out = execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 60000, ...opts });
    return { ok: true, status: 0, out: String(out).slice(0, 2000) };
  } catch (e) {
    const status = typeof e.status === 'number' ? e.status : 1;
    return { ok: false, status, out: String(e.stdout || e.message).slice(0, 2000) };
  }
}

function checkSyntax(files) {
  const failed = [];
  for (const f of files) {
    const full = path.join(ROOT, f);
    if (!fs.existsSync(full)) continue;
    // Node 18 `node --check` treats `.js` as CommonJS → ESM `import/export`
    // in a browser `.js` (e.g. www/library/app.js) fails on Node 18 but passes
    // on Node 20+. Check ESM `.js` via a temp `.mjs` copy so the gate is
    // version-robust across CI (Node 18) and local (Node 20+).
    let r;
    const src = fs.readFileSync(full, 'utf8');
    const isESM = f.endsWith('.js') && /^\s*(import|export)\s/m.test(src);
    if (isESM) {
      const tmp = `.tmp-eval-check-${process.pid}.mjs`;
      try {
        fs.writeFileSync(path.join(ROOT, tmp), src);
        r = run(`node --check ${tmp}`);
      } finally {
        try { fs.unlinkSync(path.join(ROOT, tmp)); } catch {}
      }
    } else {
      r = run(`node --check ${f}`);
    }
    if (!r.ok) failed.push(f);
  }
  return { name: 'syntax', pass: failed.length === 0, detail: failed.length ? `failed: ${failed.join(', ')}` : `${files.length} files checked` };
}

function checkMcp() {
  // MCP smoke via stdio: search_library + iterative + get_status
  // Cross-platform (fix 2026-09-22): pipe payload qua execSync `input` — không dùng printf/grep (cmd.exe không có).
  const payload = [
    '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}',
    '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"search_library","arguments":{"query":"test","top_k":3}}}',
    '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"search_library_iterative","arguments":{"query":"test","top_k":3}}}',
    '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"get_status","arguments":{}}}',
  ].join('\n') + '\n';
  try {
    const out = String(execSync('node www/library/mcp-server.mjs', { cwd: ROOT, encoding: 'utf8', input: payload, timeout: 30000 }));
    const lines = out.split('\n').filter(l => l.includes('"id":'));
    const hasSearch = lines.some(l => l.includes('"id":2'));
    const hasIter = lines.some(l => l.includes('"id":3'));
    const hasStatus = lines.some(l => l.includes('"id":4'));
    const pass = hasSearch && hasIter && hasStatus;
    return { name: 'mcp-smoke', pass, detail: pass ? 'search + iterative + status OK' : `missing: ${[!hasSearch && 'search', !hasIter && 'iterative', !hasStatus && 'status'].filter(Boolean).join(', ')}` };
  } catch (e) {
    return { name: 'mcp-smoke', pass: false, detail: String(e.message).slice(0, 300) };
  }
}

function checkPlans() {
  // plan-validate smoke: legacy plans must pass (with warning allowed)
  const plans = [
    '.agent/plans/harness-2.1-rag-loop/plan.md',
    '.agent/plans/harness-2.1-tool-use/plan.md',
    '.agent/plans/harness-2.1-planning/plan.md',
  ].filter(f => fs.existsSync(path.join(ROOT, f)));
  if (!plans.length) return { name: 'plan-validate', pass: true, detail: 'no plans to check' };
  const failed = [];
  for (const f of plans) {
    const r = run(`node .github/harness/scripts/plan-validate.mjs --file ${f}`);
    if (!r.ok) failed.push(f);
  }
  return { name: 'plan-validate', pass: failed.length === 0, detail: failed.length ? `failed: ${failed.join(', ')}` : `${plans.length} plans pass` };
}

function readJsonOrNull(rel) {
  try { return JSON.parse(fs.readFileSync(path.resolve(ROOT, rel), 'utf8')); } catch { return null; }
}

function proceduralGraphCheck() {
  const g = readJsonOrNull('.agent/procedural-graph.json');
  if (g && Array.isArray(g.triplets) && g.triplets.length > 0) {
    return { pass: true, detail: `procedural-graph ${g.triplets.length} triplets` };
  }
  return { pass: false, detail: 'procedural-graph missing/empty (chạy --init)' };
}

function funnelDetailOf(funnel) {
  if (!funnel) return 'funnel empty (chưa distill — ok nếu mới)';
  const states = funnel.states ? funnel.states.length : 0;
  const evidence = funnel.evidence ? funnel.evidence.length : 0;
  return `funnel ${states} states/${evidence} evidence`;
}

function consistencyDetailOf(consistency) {
  if (!consistency) return 'consistency empty (chưa check — ok nếu mới)';
  const records = consistency.records ? consistency.records.length : 0;
  return `consistency ${records} records`;
}

function checkSelfImproving() {
  // KN-025/026/027: 3 seams phải healthy — procedural graph init + funnel status + consistency records
  const pg = proceduralGraphCheck();
  const details = [pg.detail, funnelDetailOf(readJsonOrNull('.agent/funnel.json')), consistencyDetailOf(readJsonOrNull('.agent/consistency.json'))];
  return { name: 'self-improving', pass: pg.pass, detail: details.join(' · ') };
}

// ── Component-level evals (KN-037/KN-072) ──────────────────────────────
// Mỗi entry registry = 1 mắt xích được đo RIÊNG (exit code + stdout marker).
// Fail-closed: registry thiếu/hỏng/rỗng → FAIL, không skip im lặng.
const COMPONENTS_PATH = path.join(ROOT, '.github', 'harness', 'evals', 'components.json');

function validateComponentEntry(c) {
  return !!c && !!c.cmd && !!c.expect && typeof c.expect.exit === 'number' && !!c.expect.stdout;
}

function runComponentEval(c) {
  if (!validateComponentEntry(c)) {
    return { name: `component:${(c && c.id) || '?'}`, pass: false, detail: 'entry thiếu cmd/expect — fail-closed' };
  }
  const r = run(c.cmd);
  const pass = r.status === c.expect.exit && r.out.includes(c.expect.stdout) &&
    (!c.expect.stdoutNot || !r.out.includes(c.expect.stdoutNot));
  const detail = pass
    ? `${c.claim || c.name} [${c.ref || '—'}]`
    : `exit=${r.status} (mong đợi ${c.expect.exit}) · ${r.out.trim().split('\n')[0].slice(0, 140)}`;
  return { name: `component:${c.id}`, pass, detail };
}

function checkComponents() {
  const registry = readJsonOrNull(COMPONENTS_PATH);
  if (!registry) {
    return [{ name: 'component-evals', pass: false, detail: `registry missing/invalid (${COMPONENTS_PATH}) — fail-closed` }];
  }
  const comps = Array.isArray(registry.components) ? registry.components : [];
  if (!comps.length) return [{ name: 'component-evals', pass: false, detail: 'registry rỗng — fail-closed' }];
  return comps.map(runComponentEval);
}

// ── Grounding fact-grader (Opus 5.5 pattern: check every figure/quote) ──
// Claim = number token hoặc quote trong content; phải xuất hiện trong sources.
// invented claim → FAIL (exit 1). Thiếu input/parse lỗi/claims < min → exit 2.
const GROUNDING_TEXT_EXT = new Set(['.md', '.txt', '.vtt', '.srt', '.json', '.html', '.htm', '.csv', '.ts', '.js', '.mjs', '.yml', '.yaml']);
const GROUNDING_NUM_RE = /(?<!\w)\d[\d.,]*(?!\w)/g;
const GROUNDING_QUOTE_RES = [
  /"([^"\n]{8,500})"/g,
  /“([^”\n]{8,500})”/g,
  /«([^»\n]{8,500})»/g,
  /(?<!\w)'(?=\S)([^'\n]{8,500})'(?!\w)/g,
];

function stripNum(raw) {
  const t = String(raw).replace(/[.,]+$/, '');
  if (!t || !/\d/.test(t)) return null;
  if (/^\d{1,3}(?:[.,]\d{3})+$/.test(t)) return t.replace(/[.,]/g, ''); // thousands: 1,846 / 1.846
  if (/^\d+,\d{1,2}$/.test(t)) return t.replace(',', '.'); // decimal comma: 68,83
  return t;
}

function numVariants(canon, unit) {
  const out = new Set([canon]);
  if (/^\d+\.\d*0$/.test(canon)) out.add(String(parseFloat(canon)));
  const mult = { K: 1e3, M: 1e6, B: 1e9 }[unit];
  if (mult) for (const v of [...out]) out.add(String(parseFloat(v) * mult));
  return out;
}

function extractNumbers(text) {
  const claims = [];
  GROUNDING_NUM_RE.lastIndex = 0;
  let m;
  while ((m = GROUNDING_NUM_RE.exec(text))) {
    const canon = stripNum(m[0]);
    if (!canon) continue;
    const after = text.slice(m.index + m[0].length, m.index + m[0].length + 3);
    const unit = (/^\s?([KMB])(?=\s|$|[^\w])/.exec(after) || [])[1] || null;
    claims.push({ kind: 'number', raw: m[0], at: m.index, variants: [...numVariants(canon, unit)] });
  }
  return claims;
}

function extractQuotes(text) {
  const quotes = [];
  for (const re of GROUNDING_QUOTE_RES) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text))) quotes.push({ raw: m[1], at: m.index });
  }
  return quotes;
}

function collectSourceFiles(entries, depth = 0) {
  const files = [];
  for (const p of entries) {
    const full = path.resolve(ROOT, p);
    if (!fs.existsSync(full)) continue;
    const st = fs.statSync(full);
    if (st.isDirectory() && depth < 5) {
      for (const e of fs.readdirSync(full, { withFileTypes: true })) {
        files.push(...collectSourceFiles([path.join(p, e.name)], depth + 1));
      }
    } else if (st.isFile() && GROUNDING_TEXT_EXT.has(path.extname(full).toLowerCase())) {
      files.push(full);
    }
  }
  return files;
}

function groundingLineAt(text, idx) {
  return text.slice(0, idx).split('\n').length;
}

function jsonStringValues(doc) {
  const values = [];
  (function walk(v) {
    if (typeof v === 'string') values.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  })(doc);
  return values;
}

function numberClaim(n, suffix) {
  return { kind: 'number', label: `number \`${n.raw}\`${suffix}`, variants: n.variants };
}

function quoteClaim(q, suffix) {
  return { kind: 'quote', label: `quote ${JSON.stringify(q.raw.slice(0, 80))}${suffix}`, raw: q.raw };
}

function claimsFromText(contentText, suffixFor) {
  const claims = [];
  for (const n of extractNumbers(contentText)) claims.push(numberClaim(n, suffixFor(n.at)));
  for (const q of extractQuotes(contentText)) claims.push(quoteClaim(q, suffixFor(q.at)));
  return claims;
}

function extractClaimsFromContent(contentFull, contentText) {
  if (!contentFull.toLowerCase().endsWith('.json')) {
    return claimsFromText(contentText, at => ` @L${groundingLineAt(contentText, at)}`);
  }
  const values = jsonStringValues(JSON.parse(contentText));
  const claims = [];
  values.forEach((s, idx) => {
    claims.push(...claimsFromText(s, () => ` [value#${idx + 1}]`));
  });
  return claims;
}

function groundingFail(detail) {
  return { exit: 2, check: { name: 'grounding', pass: false, detail } };
}

function groundingPreflight(args) {
  const contentRel = args.content;
  const sourceArgs = String(args.sources || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!contentRel || !sourceArgs.length) return { error: 'usage: --scope grounding --content <file> --sources "a,b" — fail-closed' };
  const contentFull = path.resolve(ROOT, contentRel);
  if (!fs.existsSync(contentFull)) return { error: `content không tồn tại: ${contentRel}` };
  const files = collectSourceFiles(sourceArgs);
  if (!files.length) return { error: 'không tìm thấy source file nào — fail-closed (không verify = không pass)' };
  const srcText = files.map(f => fs.readFileSync(f, 'utf8')).join('\n');
  return {
    contentFull,
    files,
    srcNums: new Set(extractNumbers(srcText).flatMap(c => c.variants)),
    srcNorm: srcText.toLowerCase().replace(/\s+/g, ' '),
    minClaims: args['min-claims'] !== undefined ? parseInt(args['min-claims'], 10) : 1,
  };
}

function verifyGroundingClaims(claims, srcNums, srcNorm) {
  const unverified = [];
  for (const c of claims) {
    const ok = c.kind === 'number'
      ? c.variants.some(v => srcNums.has(v))
      : srcNorm.includes(String(c.raw).toLowerCase().replace(/\s+/g, ' '));
    if (!ok) unverified.push(c.label);
  }
  return unverified;
}

function checkGrounding(args) {
  const pre = groundingPreflight(args);
  if (pre.error) return groundingFail(pre.error);
  let claims;
  try {
    claims = extractClaimsFromContent(pre.contentFull, fs.readFileSync(pre.contentFull, 'utf8'));
  } catch (e) {
    return groundingFail(`content không đọc/parse được: ${String(e.message).slice(0, 140)}`);
  }
  if (claims.length < pre.minClaims && !args['allow-empty']) {
    return groundingFail(`chỉ ${claims.length} claims < min ${pre.minClaims} — fail-closed (dùng --allow-empty nếu file thật sự không có số/quote)`);
  }
  const unverified = verifyGroundingClaims(claims, pre.srcNums, pre.srcNorm);
  const nNum = claims.filter(c => c.kind === 'number').length;
  const base = `${nNum} số + ${claims.length - nNum} quote · ${pre.files.length} source`;
  if (unverified.length && args.warn) {
    return { exit: 0, check: { name: 'grounding', pass: true, detail: `${base} · ⚠ ${unverified.length} unverified (warn-only): ${unverified.slice(0, 3).join(' · ')}`, unverified } };
  }
  const pass = unverified.length === 0;
  const check = { name: 'grounding', pass, detail: pass ? `${base} · tất cả verified` : `${base} · ❌ ${unverified.length} KHÔNG có trong sources (invented = fail)`, unverified };
  return { exit: pass ? 0 : 1, check };
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) { out[key] = next; i++; }
      else out[key] = true;
    }
  }
  return out;
}

function buildScopeChecks(scope) {
  const checks = [];
  if (scope === 'www/library' || scope === 'all') {
    checks.push(checkSyntax(['www/library/rag-loop.mjs', 'www/library/tool-registry.mjs', 'www/library/mcp-server.mjs', 'www/library/app.js']));
    checks.push(checkMcp());
  }
  if (scope === 'plans' || scope === 'all') {
    checks.push(checkPlans());
  }
  if (scope === 'harness' || scope === 'all') {
    checks.push(checkSyntax(['.github/harness/scripts/plan-validate.mjs', '.github/harness/scripts/handoff.mjs', '.github/harness/scripts/reflect.mjs', '.github/harness/scripts/trace.mjs', '.agent/scripts/audit.mjs', '.github/harness/scripts/procedural-graph.mjs', '.github/harness/scripts/experience-funnel.mjs', '.github/harness/scripts/consistency-gap.mjs']));
    checks.push(checkPlans());
    checks.push(checkSelfImproving());
  }
  if (scope === 'components' || scope === 'all') {
    checks.push(...checkComponents());
  }
  // default scope www/library already covered; if custom scope unknown, run all
  if (!checks.length) {
    checks.push(checkSyntax(['www/library/rag-loop.mjs', 'www/library/tool-registry.mjs', 'www/library/mcp-server.mjs']));
    checks.push(checkMcp());
  }
  return checks;
}

function printReport(report, args) {
  if (args.json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }
  console.log(`Eval gate [${report.scope}]: ${report.pass ? '✅ PASS' : '❌ FAIL'}`);
  report.checks.forEach(c => console.log(`  ${c.pass ? '✅' : '❌'} ${c.name}: ${c.detail}`));
}

function runGroundingScope(args) {
  const result = checkGrounding(args);
  const report = { scope: 'grounding', pass: result.check.pass, checks: [result.check], ts: new Date().toISOString() };
  if (args.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`Eval gate [grounding]: ${result.check.pass ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  ${result.check.pass ? '✅' : '❌'} grounding: ${result.check.detail}`);
    (result.check.unverified || []).slice(0, 20).forEach(u => console.log(`     - ${u}`));
  }
  return result.exit;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const scope = args.scope || 'www/library';
  if (scope === 'grounding') process.exit(runGroundingScope(args));
  const checks = buildScopeChecks(scope);
  const pass = checks.every(c => c.pass);
  printReport({ scope, pass, checks, ts: new Date().toISOString() }, args);
  process.exit(pass ? 0 : 1);
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop()); // Windows-safe (fail-silent class fix 2026-09-22)
if (isMain) main();

export default { checkSyntax, checkMcp, checkPlans, checkComponents, checkGrounding, extractNumbers, extractQuotes, stripNum };
