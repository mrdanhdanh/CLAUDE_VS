import { test, expect } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

/**
 * Self-evolving tools — smoke + fail-closed.
 * KN-025 (procedural-graph) · KN-026 (experience-funnel) · KN-027 (consistency-gap).
 *
 * Disclosure (review 2026-09-18): ĐÂY LÀ SMOKE + FAIL-CLOSED — tool còn chạy đúng usage contract;
 * KHÔNG PHẢI behavioral lock đầy đủ (không assert chất lượng thuật toán distill/cluster).
 * Mọi case stateless (không ghi .agent/) — hermetic cho CI.
 */

const ROOT = process.cwd();
const tool = (f: string) => path.join(ROOT, '.github', 'harness', 'scripts', f);
const run = (f: string, args: string[]) =>
  spawnSync(process.execPath, [tool(f), ...args], { cwd: ROOT, encoding: 'utf8', timeout: 60_000 });

test.describe('self-evolving tools — smoke + fail-closed', () => {
  test('procedural-graph --refine (dry) → exit 0, đề xuất không commit (KN-025)', () => {
    const r = run('procedural-graph.mjs', ['--refine', '--failed', 'plan,build', '--success', 'plan,build,verify']);
    expect(r.status, `stderr: ${r.stderr}`).toBe(0);
    expect(r.stdout).toMatch(/refine/i);
  });

  test('procedural-graph --guide thiếu node → exit 2 fail-closed (KN-025)', () => {
    const r = run('procedural-graph.mjs', ['--guide']);
    expect(r.status).toBe(2);
    expect(r.stderr).toMatch(/Usage/i);
  });

  test('experience-funnel evidence --outcome rác → exit 2 fail-closed (KN-026)', () => {
    const r = run('experience-funnel.mjs', ['evidence', '--hypothesis', 'smoke', '--test', 'model', '--outcome', 'bogus']);
    expect(r.status).toBe(2);
    expect(r.stderr).toMatch(/outcome/i);
  });

  test('experience-funnel unknown command → exit 2 + usage (KN-026)', () => {
    const r = run('experience-funnel.mjs', ['frobnicate']);
    expect(r.status).toBe(2);
    expect(r.stderr).toMatch(/Unknown|Usage/i);
  });

  test('consistency-gap --solid → exit 0 + cluster + pseudo-reference (stateless) (KN-027)', () => {
    const r = run('consistency-gap.mjs', ['--solid', '--rollouts', 'fix bug A,fix bug A,refactor B']);
    expect(r.status, `stderr: ${r.stderr}`).toBe(0);
    expect(r.stdout).toMatch(/SOLID-lite/);
    expect(r.stdout).toMatch(/pseudo-reference/i);
  });
});
