#!/usr/bin/env node
/**
 * Setup Doctor — P2-4 Harness 2.2 (Lesson 00 Course Setup)
 * Diagnose Harness 2.x environment: node, files, MCP, env presence, ports, git.
 * Never prints secret values (only set/missing).
 * Usage:
 *   node setup-doctor.mjs
 *   node setup-doctor.mjs --json
 * Exit: 0 = pass (warns allowed), 1 = fail, 2 = error
 * No deps, Node 18+
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..', '..');

const REQUIRED_FILES = [
  '.github/harness/scripts/plan-validate.mjs',
  '.github/harness/scripts/handoff.mjs',
  '.github/harness/scripts/reflect.mjs',
  '.github/harness/scripts/trace.mjs',
  '.github/harness/scripts/eval-gate.mjs',
  '.github/harness/scripts/deploy-check.mjs',
  '.github/harness/scripts/agent-card.mjs',
  '.github/harness/scripts/context.mjs',
  '.github/harness/scripts/memory.mjs',
  '.github/harness/scripts/workflow.mjs',
  '.github/harness/scripts/cua-guard.mjs',
  '.github/harness/scripts/local.mjs',
  '.github/harness/registry.json',
  '.agent/policy.json',
  '.agent/mcp/catalog.json',
  '.agent/mcp/grants.json',
  'docs/knowleged.md',
  'www/library/mcp-server.mjs',
  'www/library/rag-loop.mjs',
  'www/library/tool-registry.mjs',
  'www/library/router.mjs',
];

const ENV_KEYS = [
  'FOUNDRY_LOCAL_ENDPOINT',
  'FOUNDRY_LOCAL_MODEL',
  'AZURE_AI_PROJECT_ENDPOINT',
  'AZURE_AI_MODEL_DEPLOYMENT_NAME',
  'AZURE_OPENAI_ENDPOINT',
  'HARNESS_CRED_KEY',
];

function checkNode() {
  const v = process.version;
  const major = Number(v.replace('v', '').split('.')[0]);
  return { name: 'node', pass: major >= 18, detail: `${v} (>=18 required)`, warn: false };
}

function checkFiles() {
  const missing = REQUIRED_FILES.filter(f => !fs.existsSync(path.join(ROOT, f)));
  return { name: 'files', pass: missing.length === 0, detail: missing.length ? `missing: ${missing.join(', ')}` : `${REQUIRED_FILES.length}/${REQUIRED_FILES.length} present`, warn: false };
}

function checkMcp() {
  try {
    const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, '.agent/mcp/catalog.json'), 'utf8'));
    const grants = JSON.parse(fs.readFileSync(path.join(ROOT, '.agent/mcp/grants.json'), 'utf8'));
    const vendors = (catalog.vendors || []).length;
    const hasLibrary = (catalog.vendors || []).some(v => v.id === 'library');
    const pass = vendors > 0 && hasLibrary;
    return { name: 'mcp', pass, detail: `catalog ${vendors} vendors${hasLibrary ? ' (library ✅)' : ' (library missing ❌)'}, grants OK`, warn: false };
  } catch (e) {
    return { name: 'mcp', pass: false, detail: `parse failed: ${e.message}`, warn: false };
  }
}

function checkEnv() {
  const states = ENV_KEYS.map(k => `${k}=${process.env[k] ? 'set' : 'missing'}`);
  // env never fails (all optional in v1) — report as warn info
  return { name: 'env', pass: true, detail: states.join(', '), warn: true };
}

function portListening(port) {
  // best-effort: lsof → ss → fail open (unknown)
  const cmds = [
    `lsof -iTCP:${port} -sTCP:LISTEN -t 2>/dev/null`,
    `ss -ltn 2>/dev/null | grep -q ':${port} ' && echo LISTEN`,
  ];
  for (const c of cmds) {
    try {
      const out = execSync(c, { encoding: 'utf8', timeout: 5000 }).trim();
      if (out) return true;
    } catch {}
  }
  return false;
}

function checkPorts() {
  const notes = [];
  if (portListening(5251)) notes.push('5251 LISTENING (dotnet? stop before build — KN-008)');
  if (portListening(12434)) notes.push('12434 LISTENING (foundry local running ✅)');
  const detail = notes.length ? notes.join('; ') : '5251 free, 12434 free';
  return { name: 'ports', pass: true, detail, warn: notes.length > 0 };
}

function checkGit() {
  try {
    const out = execSync('git ls-files', { cwd: ROOT, encoding: 'utf8', timeout: 10000 });
    const tracked = out.split('\n').map(s => s.trim()).filter(Boolean);
    const bad = tracked.filter(f => f === '.env' || f === '.agent/audit.key' || f === 'www/library/export.json');
    return { name: 'git', pass: bad.length === 0, detail: bad.length ? `leaked: ${bad.join(', ')}` : 'no secret tracked (.env, audit.key, export.json clean)', warn: false };
  } catch {
    return { name: 'git', pass: true, detail: 'git unavailable — skipped', warn: true };
  }
}

function main() {
  const json = process.argv.includes('--json');
  const checks = [checkNode(), checkFiles(), checkMcp(), checkEnv(), checkPorts(), checkGit()];
  const fail = checks.filter(c => !c.pass);
  const pass = fail.length === 0;
  if (json) {
    console.log(JSON.stringify({ pass, checks, ts: new Date().toISOString() }, null, 2));
  } else {
    console.log(`Setup doctor: ${pass ? '✅ PASS' : '❌ FAIL'} (${checks.filter(c => c.pass).length}/${checks.length})`);
    for (const c of checks) {
      const icon = !c.pass ? '❌' : c.warn ? '○' : '✅';
      console.log(`  ${icon} ${c.name}: ${c.detail}`);
    }
  }
  process.exit(pass ? 0 : 1);
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop());
if (isMain) main();

export default {};
