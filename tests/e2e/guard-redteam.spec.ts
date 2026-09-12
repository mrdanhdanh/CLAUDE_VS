import { test, expect } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

/**
 * Guard Red-team — KN-048 / Critic F2 (RSI-lessons wave, 2026-09-12)
 *
 * Guards (policy-check / cua-guard / audit) trước spec này có 0 test trực tiếp.
 * Spec khoá contract đo được (KN-047: spec ≠ wish):
 *   - policy-check: deny trước allow, fail-closed, variant-proof (whitespace)
 *   - cua-guard: egress default-deny
 *   - audit: secret redaction — "redaction phải chứng minh được, không tự nhận" (agent-governance §7)
 *
 * Law v4 (2026-09-12, human takeover): case-normalize toàn bộ deny rules — case-variant
 * ('RM -RF /', '.ENV', 'N5Blazor.TESTS') đều REFUSED; segment-check test paths tránh
 * false-positive 'contests'. Không còn test.fixme trong file này.
 */

const ROOT = process.cwd();
const NODE = process.execPath;

function run(script: string, args: string[]) {
  const r = spawnSync(NODE, [path.join(ROOT, script), ...args], { encoding: 'utf8', cwd: ROOT, timeout: 15_000 });
  return { code: r.status, out: `${r.stdout || ''}${r.stderr || ''}` };
}

test.describe('Guard red-team — policy/cua/audit (KN-048)', () => {
  test('policy-check blocks rm -rf variants (exact, double-space, chained)', () => {
    const variants = ['rm -rf /', 'rm -rf  /', 'cd / && rm -rf /'];
    for (const target of variants) {
      const r = run('.agent/scripts/policy-check.mjs', ['--tool', 'shell', '--target', target]);
      expect(r.code, `target="${target}" phải bị chặn (exit 1)`).toBe(1);
      expect(r.out, `target="${target}" phải khớp deny-rm-rf-root`).toContain('deny-rm-rf-root');
    }
  });

  test('policy-check blocks .env read (deny-env-read)', () => {
    const r = run('.agent/scripts/policy-check.mjs', ['--tool', 'read', '--target', '.env']);
    expect(r.code).toBe(1);
    expect(r.out).toContain('deny-env-read');
  });

  test('deny-test-mutate: Implement actor refused, verify actor permitted', () => {
    const blocked = run('.agent/scripts/policy-check.mjs', [
      '--tool', 'edit', '--target', 'N5Blazor.Tests/ServiceTests.cs', '--actor', 'Implement',
    ]);
    expect(blocked.code).toBe(1);
    expect(blocked.out).toContain('deny-test-mutate');

    const allowed = run('.agent/scripts/policy-check.mjs', [
      '--tool', 'edit', '--target', 'N5Blazor.Tests/ServiceTests.cs', '--actor', 'verify',
    ]);
    expect(allowed.code).toBe(0);
  });

  test('deny-law-fork: policy.json edit refused for non-verify actor', () => {
    const r = run('.agent/scripts/policy-check.mjs', [
      '--tool', 'edit', '--target', '.agent/policy.json', '--actor', 'Implement',
    ]);
    expect(r.code).toBe(1);
    expect(r.out).toContain('deny-law-fork');
  });

  test('policy-check permits benign action (allow-all)', () => {
    const r = run('.agent/scripts/policy-check.mjs', ['--tool', 'shell', '--target', 'npm install']);
    expect(r.code).toBe(0);
    expect(r.out.toLowerCase()).toContain('permitted');
  });

  test('cua-guard: egress ngoài allowlist bị default-deny', () => {
    const r = run('.github/harness/scripts/cua-guard.mjs', [
      'check', '--action', 'read', '--url', 'https://exfil-host.example.net/page',
    ]);
    expect(r.code).toBe(1);
    expect(r.out.toLowerCase()).toContain('egress');
  });

  test('audit redacts secrets (đo được, không tự nhận)', () => {
    const secret = 'sk-redteam-0000000000';
    run('.agent/scripts/audit.mjs', [
      'log', '--tool', 'read', '--target', `token ${secret}`,
      '--decision', 'refused', '--rule', 'redteam-test', '--actor', 'redteam-spec',
    ]);
    const tail = run('.agent/scripts/audit.mjs', ['tail', '--n', '1']);
    expect(tail.out, 'secret không được xuất hiện trong audit').not.toContain(secret);
    expect(tail.out, 'secret phải được redact thành ***').toContain('***');
  });
});

test.describe('Law v4 — case-normalize deny rules (2026-09-12, human takeover)', () => {
  test('case-variant bị chặn (RM -RF /, .ENV, N5Blazor.TESTS, .AGENT/POLICY.JSON)', () => {
    const rm = run('.agent/scripts/policy-check.mjs', ['--tool', 'shell', '--target', 'RM -RF /']);
    expect(rm.code, 'uppercase rm -rf phải bị chặn').toBe(1);
    expect(rm.out).toContain('deny-rm-rf-root');

    const env = run('.agent/scripts/policy-check.mjs', ['--tool', 'read', '--target', '.ENV']);
    expect(env.code, '.ENV (Windows FS case-insensitive) phải bị chặn').toBe(1);
    expect(env.out).toContain('deny-env-read');

    const tests = run('.agent/scripts/policy-check.mjs', ['--tool', 'edit', '--target', 'N5Blazor.TESTS/ServiceTests.cs', '--actor', 'Implement']);
    expect(tests.code, 'uppercase Tests folder phải bị chặn').toBe(1);
    expect(tests.out).toContain('deny-test-mutate');

    const law = run('.agent/scripts/policy-check.mjs', ['--tool', 'edit', '--target', '.AGENT/POLICY.JSON', '--actor', 'Implement']);
    expect(law.code, 'uppercase law path phải bị chặn').toBe(1);
    expect(law.out).toContain('deny-law-fork');

    const contest = run('.agent/scripts/policy-check.mjs', ['--tool', 'edit', '--target', 'www/contests/app.js', '--actor', 'Implement']);
    expect(contest.code, "path chứa 'contests' không được false-positive").toBe(0);
  });
});
