#!/usr/bin/env node
/**
 * Deploy Check — P1-6 Harness 2.1 (Lesson 16 lifecycle)
 * Lifecycle: version pin → eval offline (gate) → audit verify.
 * Usage:
 *   node deploy-check.mjs
 *   node deploy-check.mjs --json
 * Exit: 0 = deploy OK, 1 = block, 2 = error
 * No deps, Node 18+
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..', '..');

function run(cmd) {
  try {
    const out = execSync(cmd, { cwd: ROOT, encoding: 'utf8', timeout: 60000, stdio: ['ignore', 'pipe', 'pipe'] });
    return { ok: true, out: String(out).slice(0, 1000) };
  } catch (e) {
    return { ok: false, out: String(e.stdout || e.message).slice(0, 1000) };
  }
}

function checkVersion() {
  try {
    const mcpText = fs.readFileSync(path.join(ROOT, 'www/library/mcp-server.mjs'), 'utf8');
    const m = mcpText.match(/MCP_SERVER_VERSION\s*=\s*['"]([^'"]+)['"]/);
    const mcpVer = m ? m[1] : null;
    const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, '.agent/mcp/catalog.json'), 'utf8'));
    const lib = (catalog.vendors || []).find(v => v.id === 'library');
    const catVer = lib?.version || null;
    const pass = !!mcpVer && !!catVer && mcpVer === catVer;
    return { name: 'version-pin', pass, detail: pass ? `mcp ${mcpVer} == catalog ${catVer}` : `mismatch: mcp=${mcpVer} catalog=${catVer}` };
  } catch (e) {
    return { name: 'version-pin', pass: false, detail: e.message.slice(0, 200) };
  }
}

function main() {
  const json = process.argv.includes('--json');
  const checks = [];
  checks.push(checkVersion());
  const evalRes = run('node .github/harness/scripts/eval-gate.mjs --scope www/library');
  checks.push({ name: 'eval-gate', pass: evalRes.ok, detail: evalRes.ok ? 'eval PASS' : evalRes.out.slice(0, 200) });
  const auditRes = run('node .agent/scripts/audit.mjs verify');
  checks.push({ name: 'audit-verify', pass: auditRes.ok, detail: auditRes.ok ? 'chain OK' : auditRes.out.slice(0, 200) });
  const pass = checks.every(c => c.pass);
  if (json) console.log(JSON.stringify({ pass, checks, ts: new Date().toISOString() }, null, 2));
  else {
    console.log(`Deploy check: ${pass ? '✅ DEPLOY OK' : '❌ BLOCK'}`);
    checks.forEach(c => console.log(`  ${c.pass ? '✅' : '❌'} ${c.name}: ${c.detail}`));
  }
  process.exit(pass ? 0 : 1);
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop());
if (isMain) main();

export default {};
