import { test, expect } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * Eval Gate 2.5 — guard spec (KN-056) cho 2 mechanism mới + 1 bug fail-silent:
 *
 * (1) Component-level evals (KN-037/KN-072): registry .github/harness/evals/components.json
 *     — mọi entry phải pass qua runner thật; gate PHẢI in output (không được no-op im lặng).
 * (2) Grounding fact-grader (Opus 5.5 pattern 22/09): số/quote phải có trong sources,
 *     invented → exit 1; thiếu input/claims thấp → exit 2 (fail-closed).
 * (3) Bug gốc (2026-09-22): isMain `process.argv[1].split('/')` fail trên Windows
 *     (argv[1] = `D:\...` backslash) → main() không chạy → gate exit 0 KHÔNG chạy gì.
 *     Guard: class-check mọi script harness dùng split(/[\\/]/).
 *
 * Invariants khoá (spec ≠ wish — KN-047):
 *   1. `--scope components` phải in report + mọi component pass
 *   2. Grounding PASS: number variants (1,846/1.846/0,20) + quote khác case/whitespace đều khớp
 *   3. Grounding FAIL: số/quote bịa → exit 1 + liệt kê
 *   4. Fail-closed: thiếu content/sources/claims → exit 2; --allow-empty override
 *   5. Không script harness nào còn pattern isMain .split('/') (Windows fail-silent)
 */

const ROOT = process.cwd();
const SCRIPT = path.join(ROOT, '.github', 'harness', 'scripts', 'eval-gate.mjs');

function run(args: string[]) {
  return spawnSync(process.execPath, [SCRIPT, ...args], { cwd: ROOT, encoding: 'utf8', timeout: 120_000 });
}

function tmpdir(tag: string) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `evalgate-${tag}-`));
}

test.describe('Eval Gate — component evals + grounding grader + fail-silent guard', () => {
  test('components: registry pass toàn bộ + gate phải in output (chống no-op im lặng)', () => {
    const r = run(['--scope', 'components', '--json']);
    const out = r.stdout + r.stderr;
    expect(out, 'gate exit 0 không output = fail-silent (bug 2026-09-22) — phải in report').toContain('"scope": "components"');
    const report = JSON.parse(r.stdout);
    expect(report.pass).toBe(true);
    expect(report.checks.length, 'registry phải có ≥6 mắt xích').toBeGreaterThanOrEqual(6);
    for (const c of report.checks) expect(c.pass, `${c.name}: ${c.detail}`).toBe(true);
    expect(r.status).toBe(0);
  });

  test('grounding PASS: number variants (1.846/0,20) + quote normalize đều khớp sources', () => {
    const dir = tmpdir('pass');
    const content = path.join(dir, 'content.md');
    const source = path.join(dir, 'source.md');
    fs.writeFileSync(content, [
      'Report: costs drop 40% with cache reads 0,20/M. Score: 1.846 Elo.',
      'Quote: "screens every action before it runs".',
    ].join('\n'));
    fs.writeFileSync(source, [
      'Costs fall 40%; cache reads 0.20 per M tokens; score 1846 Elo.',
      'The model screens every action before it runs in production.',
    ].join('\n'));

    const r = run(['--scope', 'grounding', '--content', content, '--sources', source, '--json']);
    expect(r.status).toBe(0);
    const j = JSON.parse(r.stdout);
    expect(j.pass).toBe(true);
    expect(j.checks[0].detail).toContain('verified');
    expect(j.checks[0].detail).toMatch(/3 số \+ 1 quote/);
  });

  test('grounding FAIL: số bịa + quote bịa → exit 1 + liệt kê từng claim', () => {
    const dir = tmpdir('fail');
    const content = path.join(dir, 'content.md');
    const source = path.join(dir, 'source.md');
    fs.writeFileSync(content, 'Made up: 999% growth. Quote: "we invented this claim entirely".\n');
    fs.writeFileSync(source, 'Costs fall 40%; score 1846 Elo.\n');

    const r = run(['--scope', 'grounding', '--content', content, '--sources', source]);
    const out = r.stdout + r.stderr;
    expect(r.status, 'invented claim phải fail (exit 1)').toBe(1);
    expect(out).toContain('999');
    expect(out).toContain('we invented this claim');
    expect(out).toMatch(/KHÔNG có trong sources/);
  });

  test('grounding fail-closed: thiếu content/sources/claims → exit 2; --allow-empty override', () => {
    const dir = tmpdir('fc');
    const source = path.join(dir, 'source.md');
    const plain = path.join(dir, 'plain.md');
    fs.writeFileSync(source, 'Costs fall 40%; score 1846 Elo.\n');
    fs.writeFileSync(plain, 'Just plain prose with no numbers and no quoted phrases at all.\n');

    const noContent = run(['--scope', 'grounding', '--content', path.join(dir, 'missing.md'), '--sources', source]);
    expect(noContent.status, 'content không tồn tại → fail-closed').toBe(2);

    const noSources = run(['--scope', 'grounding', '--content', source]);
    expect(noSources.status, 'thiếu --sources → fail-closed').toBe(2);

    const noClaims = run(['--scope', 'grounding', '--content', plain, '--sources', source]);
    expect(noClaims.status, 'claims < min (1) → fail-closed').toBe(2);

    const allowEmpty = run(['--scope', 'grounding', '--content', plain, '--sources', source, '--allow-empty']);
    expect(allowEmpty.status, '--allow-empty override → pass').toBe(0);
  });

  test('class-guard: không script harness nào còn isMain .split(\'/\') (Windows fail-silent)', () => {
    const dir = path.join(ROOT, '.github', 'harness', 'scripts');
    const bad = fs.readdirSync(dir).filter(f => f.endsWith('.mjs')).filter(f => {
      const src = fs.readFileSync(path.join(dir, f), 'utf8');
      return src.includes("process.argv[1].split('/')");
    });
    expect(bad, `dùng split(/[\\\\/]/) — backslash Windows không bị cắt: ${bad.join(', ')}`).toEqual([]);
  });
});
