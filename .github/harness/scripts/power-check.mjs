#!/usr/bin/env node
/**
 * Power Sweep — YUNIE 1 lệnh = toàn bộ health (Harness v2, self-upgrade 2026-09-25)
 *
 * Aggregate các mắt xích deterministic đã có (REUSE — không copy logic):
 * registry · doctor · audit chain · policy · budget · KN integrity · guards · component evals · status mirror.
 *
 * Nguyên tắc:
 *  1. Mỗi spawn check cần exit ĐÚNG + MARKER chứng minh ĐÃ CHẠY (KN-074: gate im lặng = gate chết).
 *  2. Thiếu marker = FAIL, không phải "chắc là pass".
 *  3. Arg lạ/rác → exit 2 (fail-closed, KN-069).
 *
 * Usage:
 *   node .github/harness/scripts/power-check.mjs            # human scoreboard
 *   node .github/harness/scripts/power-check.mjs --json
 *   node .github/harness/scripts/power-check.mjs --self-test
 * Exit: 0 = all pass · 1 = ≥1 check đỏ · 2 = arg sai / lỗi nội bộ
 * No deps, Node 18+
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const STATUS_PATH = path.join(ROOT, 'www', 'status.json');
const REGISTRY_PATH = path.join(ROOT, '.github', 'harness', 'registry.json');
const SCALE_PATH = path.join(ROOT, 'www', 'cosmos', 'scale.json');
const GUARD_FLOOR = 50; // floor lưới KN — 59 hiện tại; tụt dưới = ai đó xoá guard (auto-learn guards --json)
const SCALE_FRESH_HOURS = 24; // khớp badge '🟢 tươi' trong www/cosmos/scale.html + guard cosmos-freshness.spec.ts

// 1 dòng / mắt xích — muốn thêm check mới = thêm 1 entry, không sửa logic.
const CHECKS = [
  { id: 'registry', script: '.github/harness/scripts/harness-manager.mjs', args: ['list'], expectExit: 0, marker: 'INSTRUCTIONS', forbid: ['⚠️ mismatch', '❌ missing'], ref: 'KN-002' },
  { id: 'doctor', script: '.github/harness/scripts/setup-doctor.mjs', args: ['--json'], expectExit: 0, marker: '"pass": true', ref: 'KN-077' },
  { id: 'audit', script: '.agent/scripts/audit.mjs', args: ['verify'], expectExit: 0, marker: 'audit chain OK', ref: 'KN-048' },
  { id: 'policy', script: '.agent/scripts/policy-check.mjs', args: ['--check'], expectExit: 0, marker: 'policy ok', ref: 'KN-012' },
  { id: 'budget', script: 'scripts/instruction-budget.mjs', args: ['--budget', '1100'], expectExit: 0, marker: 'Trong budget 1100', ref: 'KN-068' },
  { id: 'knowledge', script: '.github/harness/scripts/auto-learn.mjs', args: ['status'], expectExit: 0, marker: 'KN ID integrity OK', ref: 'KN-066' },
  { id: 'guards', script: '.github/harness/scripts/auto-learn.mjs', args: ['guards', '--json'], expectExit: 0, marker: '"withGuard"', assert: assertGuardFloor, ref: 'KN-056' },
  { id: 'evals', script: '.github/harness/scripts/eval-gate.mjs', args: ['--scope', 'all', '--json'], expectExit: 0, marker: '"pass": true', timeoutMs: 120000, ref: 'KN-037' },
];

function assertGuardFloor(out) {
  try {
    const counts = JSON.parse(out).counts || {};
    if (!counts.total) return 'guards JSON thiếu counts';
    if (counts.withGuard < GUARD_FLOOR) return `guard floor: ${counts.withGuard}/${counts.total} < ${GUARD_FLOOR}`;
    return null;
  } catch (e) {
    return `guards JSON parse fail — ${e.message}`.slice(0, 120);
  }
}

function defaultRunner(script, args, { timeoutMs = 60000 } = {}) {
  try {
    const out = String(execFileSync(process.execPath, [path.join(ROOT, script), ...args], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: timeoutMs,
      maxBuffer: 4 * 1024 * 1024,
      windowsHide: true,
    }));
    return { status: 0, out };
  } catch (e) {
    const status = typeof e.status === 'number' ? e.status : null;
    return { status, out: String(e.stdout || '') + String(e.stderr || e.message || '') };
  }
}

function failDetail(check, result, { hasMarker, violated, assertErr }) {
  if (!hasMarker) return `no marker — gate ran? (KN-074) · exit=${result.status}`;
  if (violated.length) return `drift: ${violated.join(' · ')}`;
  if (assertErr) return assertErr;
  return `exit=${result.status} (mong đợi ${check.expectExit}) · ${result.out.trim().split('\n')[0].slice(0, 120)}`;
}

function runCheck(check, runner) {
  const start = Date.now();
  const result = runner(check.script, check.args, { timeoutMs: check.timeoutMs || 60000 });
  const ms = Date.now() - start;
  const hasMarker = result.out.includes(check.marker);
  const violated = (check.forbid || []).filter(f => result.out.includes(f));
  const assertErr = hasMarker && !violated.length && check.assert ? check.assert(result.out) : null;
  const pass = hasMarker && result.status === check.expectExit && !violated.length && !assertErr;
  const detail = pass ? check.marker : failDetail(check, result, { hasMarker, violated, assertErr });
  return { id: check.id, ref: check.ref, pass, ms, detail };
}

function mirrorProblems(status) {
  const problems = [];
  if (status.generatedBy !== 'YUNIE') problems.push('generatedBy≠YUNIE');
  if (!status.health || status.health.status !== 'ok') problems.push(`health=${status.health && status.health.status}`);
  for (const type of ['skills', 'instructions', 'agents', 'prompts', 'hooks']) {
    const count = status.counts && status.counts[type];
    if (!count || !(count.total > 0)) problems.push(`counts.${type} rỗng`);
  }
  const generatedAt = Date.parse(status.generatedAt || '');
  if (!Number.isFinite(generatedAt)) problems.push('generatedAt không parse được');
  return { problems, generatedAt };
}

function checkStatusMirror(statusPath = STATUS_PATH, registryPath = REGISTRY_PATH) {
  const start = Date.now();
  const fail = detail => ({ id: 'status-mirror', ref: 'KN-002', pass: false, ms: Date.now() - start, detail: detail.slice(0, 160) });
  let status;
  try {
    status = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
  } catch (e) {
    return fail(`parse fail — ${e.message}`);
  }
  const { problems, generatedAt } = mirrorProblems(status);
  if (Number.isFinite(generatedAt) && fs.statSync(registryPath).mtimeMs > generatedAt) problems.push('stale: registry.json mới hơn status.json — chạy generate-status');
  if (problems.length) return fail(problems.join(' · '));
  return { id: 'status-mirror', ref: 'KN-002', pass: true, ms: Date.now() - start, detail: `status.json ok (${status.learn ? status.learn.knTotal : '?'} KN)` };
}

function checkCosmosFreshness(scalePath = SCALE_PATH, now = Date.now()) {
  const start = Date.now();
  const fail = detail => ({ id: 'cosmos-freshness', ref: 'KN-002', pass: false, ms: Date.now() - start, detail });
  let scale;
  try {
    scale = JSON.parse(fs.readFileSync(scalePath, 'utf8'));
  } catch (e) {
    return fail(`parse fail — ${e.message}`.slice(0, 140));
  }
  const ts = Date.parse(scale.generatedAt || '');
  if (!Number.isFinite(ts)) return fail('generatedAt không parse được');
  const ageH = (now - ts) / 36e5;
  const ageTxt = ageH < 1 ? '<1h' : ageH < 48 ? `${Math.round(ageH)}h` : `${Math.round(ageH / 24)} ngày`;
  if (ageH < SCALE_FRESH_HOURS) return { id: 'cosmos-freshness', ref: 'KN-002', pass: true, ms: Date.now() - start, detail: `scale.json tươi · ${ageTxt}` };
  return fail(`scale.json hơi cũ · ${ageTxt} — chạy npm run cosmos:refresh`);
}

function runChecks(checks, { runner = defaultRunner, withLocal = true } = {}) {
  const results = checks.map(check => runCheck(check, runner));
  if (withLocal) results.push(checkStatusMirror(), checkCosmosFreshness());
  return results;
}

function selfTest() {
  const sample = { id: 'x', script: 'x.mjs', args: [], expectExit: 0, marker: 'OK', ref: 'test' };
  const cases = [
    { name: 'pass', runner: () => ({ status: 0, out: 'OK' }), expect: r => r.pass },
    { name: 'missing-marker', runner: () => ({ status: 0, out: 'im lặng' }), expect: r => !r.pass && r.detail.includes('KN-074') },
    { name: 'exit-mismatch', runner: () => ({ status: 1, out: 'OK' }), expect: r => !r.pass && r.detail.includes('exit=') },
    { name: 'forbid-violation', runner: () => ({ status: 0, out: 'OK ❌ missing' }), check: { ...sample, forbid: ['❌ missing'] }, expect: r => !r.pass && r.detail.includes('drift') },
  ];
  const failed = cases.filter(c => {
    const [r] = runChecks([c.check || sample], { runner: c.runner, withLocal: false });
    return !c.expect(r);
  });
  const argProbe = defaultRunner('.github/harness/scripts/power-check.mjs', ['--bogus'], { timeoutMs: 30000 });
  if (argProbe.status !== 2) failed.push({ name: `arg-exit2 (got ${argProbe.status})` });
  const mirrorProbe = checkStatusMirror(path.join(ROOT, 'no-such-status.json'), REGISTRY_PATH);
  if (mirrorProbe.pass) failed.push({ name: 'mirror-missing-file-must-fail' });
  const scaleProbe = checkCosmosFreshness(path.join(ROOT, 'no-such-scale.json'));
  if (scaleProbe.pass) failed.push({ name: 'scale-missing-file-must-fail' });
  const staleProbe = checkCosmosFreshness(SCALE_PATH, Date.parse('2099-01-01T00:00:00Z'));
  if (staleProbe.pass || !staleProbe.detail.includes('cosmos:refresh')) failed.push({ name: 'scale-stale-must-fail' });
  if (failed.length) {
    console.error(`power-check self-test failed: ${failed.map(c => c.name).join(', ')}`);
    process.exit(1);
  }
  console.log('power-check self-test: 7 cases passed');
}

function parseArgs(argv) {
  const known = new Set(['--json', '--self-test']);
  const unknown = argv.filter(a => !known.has(a));
  if (unknown.length) {
    console.error(`❌ arg không hợp lệ: ${unknown.join(' ')} — chỉ nhận ${[...known].join(' | ')}`);
    process.exit(2);
  }
  return { json: argv.includes('--json'), selfTest: argv.includes('--self-test') };
}

function printHuman(results, durationMs) {
  const passed = results.filter(r => r.pass).length;
  const allPass = passed === results.length;
  console.log(`⚡ POWER SWEEP — ${passed}/${results.length} checks · ${(durationMs / 1000).toFixed(1)}s`);
  for (const r of results) {
    console.log(`  ${r.pass ? '✅' : '❌'} ${r.id.padEnd(14)} (${String(r.ms).padStart(5)}ms) [${r.ref}] ${r.detail}`);
  }
  if (allPass) {
    console.log('✅ ALL GREEN — mọi gate đã chứng minh đã chạy (KN-074: no silent pass).');
  } else {
    console.log(`❌ ${results.length - passed} check đỏ: ${results.filter(r => !r.pass).map(r => r.id).join(', ')} — fix rồi chạy lại \`npm run power\`.`);
  }
}

function main() {
  const { json, selfTest: wantsSelfTest } = parseArgs(process.argv.slice(2));
  if (wantsSelfTest) return selfTest();
  const start = Date.now();
  const results = runChecks(CHECKS);
  const pass = results.every(r => r.pass);
  if (json) {
    console.log(JSON.stringify({ cmd: 'power', pass, ranAt: new Date().toISOString(), durationMs: Date.now() - start, checks: results }, null, 2));
  } else {
    printHuman(results, Date.now() - start);
  }
  process.exit(pass ? 0 : 1);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url); // repo idiom (KN-074)
if (isMain) main();

export { CHECKS, GUARD_FLOOR, SCALE_FRESH_HOURS, runCheck, runChecks, checkStatusMirror, checkCosmosFreshness, parseArgs };
