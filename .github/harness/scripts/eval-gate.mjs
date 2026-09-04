#!/usr/bin/env node
/**
 * Eval Gate — P1-2 Harness 2.1 (Lesson 10 offline eval)
 * Offline smoke checks before deploy: syntax + MCP tools + plan-validate.
 * Usage:
 *   node eval-gate.mjs --scope www/library
 *   node eval-gate.mjs --scope all --json
 * Exit: 0 = pass, 1 = fail, 2 = error
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
    return { ok: true, out: String(out).slice(0, 2000) };
  } catch (e) {
    return { ok: false, out: String(e.stdout || e.message).slice(0, 2000) };
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
  const payload = [
    '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}',
    '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"search_library","arguments":{"query":"test","top_k":3}}}',
    '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"search_library_iterative","arguments":{"query":"test","top_k":3}}}',
    '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"get_status","arguments":{}}}',
  ].join('\n') + '\n';
  try {
    const out = execSync(`printf '%s' '${payload.replace(/'/g, "'\\''")}' | node www/library/mcp-server.mjs 2>/dev/null | grep '"id":'`, { cwd: ROOT, encoding: 'utf8', timeout: 30000 });
    const lines = out.trim().split('\n').filter(Boolean);
    const hasSearch = lines.some(l => l.includes('"id":2'));
    const hasIter = lines.some(l => l.includes('"id":3'));
    const hasStatus = lines.some(l => l.includes('"id":4'));
    const pass = hasSearch && hasIter && hasStatus;
    return { name: 'mcp-smoke', pass, detail: pass ? 'search + iterative + status OK' : `missing: ${[!hasSearch && 'search', !hasIter && 'iterative', !hasStatus && 'status'].filter(Boolean).join(', ')}` };
  } catch (e) {
    return { name: 'mcp-smoke', pass: false, detail: e.message.slice(0, 300) };
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

function main() {
  const args = parseArgs(process.argv.slice(2));
  const scope = args.scope || 'www/library';
  const checks = [];
  if (scope === 'www/library' || scope === 'all') {
    checks.push(checkSyntax(['www/library/rag-loop.mjs', 'www/library/tool-registry.mjs', 'www/library/mcp-server.mjs', 'www/library/app.js']));
    checks.push(checkMcp());
  }
  if (scope === 'plans' || scope === 'all') {
    checks.push(checkPlans());
  }
  if (scope === 'harness' || scope === 'all') {
    checks.push(checkSyntax(['.github/harness/scripts/plan-validate.mjs', '.github/harness/scripts/handoff.mjs', '.github/harness/scripts/reflect.mjs', '.github/harness/scripts/trace.mjs', '.agent/scripts/audit.mjs']));
    checks.push(checkPlans());
  }
  // default scope www/library already covered; if custom scope unknown, run all
  if (!checks.length) {
    checks.push(checkSyntax(['www/library/rag-loop.mjs', 'www/library/tool-registry.mjs', 'www/library/mcp-server.mjs']));
    checks.push(checkMcp());
  }
  const pass = checks.every(c => c.pass);
  const report = { scope, pass, checks, ts: new Date().toISOString() };
  if (args.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`Eval gate [${scope}]: ${pass ? '✅ PASS' : '❌ FAIL'}`);
    checks.forEach(c => console.log(`  ${c.pass ? '✅' : '❌'} ${c.name}: ${c.detail}`));
  }
  process.exit(pass ? 0 : 1);
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop());
if (isMain) main();

export default { checkSyntax, checkMcp, checkPlans };
