#!/usr/bin/env node
/**
 * Setup Doctor — P2-4 Harness 2.2 (Lesson 00 Course Setup)
 * Diagnose Harness 2.x environment: node, files, MCP, env presence, ports, git.
 * Never prints secret values (only set/missing).
 * Usage:
 *   node setup-doctor.mjs
 *   node setup-doctor.mjs --json
 *   node setup-doctor.mjs --self-test
 * Exit: 0 = pass (warns allowed), 1 = fail, 2 = error
 * No deps, Node 18+
 */
import { execFileSync, execSync } from 'node:child_process';
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

function nativeCommand(command) {
  if (process.platform === 'win32' && command === 'netstat') {
    const systemRoot = process.env.SystemRoot || process.env.WINDIR;
    if (systemRoot) return path.join(systemRoot, 'System32', 'netstat.exe');
  }
  return command;
}

function runProbe(command, args, { allowExitOne = false } = {}) {
  try {
    const out = String(execFileSync(command, args, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 5000,
      maxBuffer: 2 * 1024 * 1024,
      windowsHide: true,
    }));
    return { ok: true, out };
  } catch (e) {
    const status = typeof e.status === 'number' ? e.status : null;
    const stderr = String(e.stderr || '').trim();
    if (allowExitOne && status === 1 && !stderr) return { ok: true, out: String(e.stdout || '').trim() };
    return { ok: false, error: (stderr || e.message || `${command} failed`).slice(0, 240) };
  }
}

function parseListeningPorts(text, platform) {
  const ports = new Set();
  for (const line of String(text).split(/\r?\n/)) {
    if (platform === 'win32') {
      const match = line.match(/^\s*TCP\s+\S+:(\d+)\s+\S+\s+(?:LISTENING|LISTEN)\s+\d+\s*$/i);
      if (match) ports.add(Number(match[1]));
    } else if (/LISTEN/i.test(line)) {
      for (const match of line.matchAll(/:(\d+)\s/g)) ports.add(Number(match[1]));
    }
  }
  return ports;
}

function probePorts(ports, { platform = process.platform, runner = runProbe } = {}) {
  if (platform === 'win32') {
    const result = runner(nativeCommand('netstat'), ['-ano', '-p', 'tcp']);
    if (!result.ok || !result.out.trim()) return { ok: false, states: {}, error: result.error || 'netstat returned no TCP table' };
    const listening = parseListeningPorts(result.out, platform);
    return { ok: true, states: Object.fromEntries(ports.map(port => [port, listening.has(port)])) };
  }
  const ss = runner('ss', ['-ltn']);
  if (ss.ok && ss.out.trim()) {
    const listening = parseListeningPorts(ss.out, platform);
    return { ok: true, states: Object.fromEntries(ports.map(port => [port, listening.has(port)])) };
  }
  const states = {};
  for (const port of ports) {
    const result = runner('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-t'], { allowExitOne: true });
    if (!result.ok) return { ok: false, states, error: `${ss.error || 'ss unavailable'}; ${result.error}` };
    states[port] = Boolean(result.out.trim());
  }
  return { ok: true, states };
}

function checkPorts() {
  const ports = [5251, 12434];
  const probe = probePorts(ports);
  if (!probe.ok) return { name: 'ports', pass: false, detail: `probe unavailable — ${probe.error}`, warn: false, states: probe.states };
  const listening = ports.filter(port => probe.states[port]);
  const notes = listening.map(port => `${port} LISTENING`);
  const detail = notes.length ? notes.join('; ') : '5251 free, 12434 free';
  return { name: 'ports', pass: true, detail, warn: notes.length > 0, states: probe.states };
}

function selfTest() {
  const ports = [5251];
  const cases = [
    { name: 'windows-free', result: () => probePorts(ports, { platform: 'win32', runner: () => ({ ok: true, out: 'Active Connections\n' }) }), check: r => r.ok && r.states[5251] === false },
    { name: 'windows-listening', result: () => probePorts(ports, { platform: 'win32', runner: () => ({ ok: true, out: 'TCP    127.0.0.1:5251         0.0.0.0:0              LISTENING       42\n' }) }), check: r => r.ok && r.states[5251] === true },
    { name: 'probe-failure', result: () => probePorts(ports, { platform: 'win32', runner: () => ({ ok: false, error: 'fixture probe failure' }) }), check: r => !r.ok && r.error === 'fixture probe failure' },
  ];
  const failed = cases.filter(item => !item.check(item.result()));
  if (failed.length) {
    console.error(`setup-doctor self-test failed: ${failed.map(item => item.name).join(', ')}`);
    process.exit(1);
  }
  console.log('setup-doctor self-test: 3 cases passed');
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
  if (process.argv.includes('--self-test')) {
    selfTest();
    return;
  }
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

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop()); // Windows-safe (fail-silent class fix 2026-09-22)
if (isMain) main();

export default {};
