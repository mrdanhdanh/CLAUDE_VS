import { test, expect } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * Rank Stability guard spec (KN-056 lưới · KN-078 negative control · KN-080 enforce)
 *
 * KN-080 từng là advisory checklist — "rank stability chưa có máy chấm". Spec này khoá
 * cỗ máy đó bằng chính các failure mode của paper arXiv:2609.30074:
 *   1. clear + claim="best" → PASS (firm, 3 quy tắc stable, raw per-run, seed cố định)
 *   2. near-tie + claim → FAIL exit 1 (within noise / sensitivity — negative control chạy thật)
 *   3. shelf-life 100d + claim → FAIL exit 1 (4/8 endpoint chết trong 10 tuần)
 *   4. không claim → report-only exit 0 (không claim = không gate)
 *   5. --warn → hạ claim fault có chủ đích (advisory mode)
 *   6. fail-closed class (KN-069): thiếu file / JSON hỏng / arg lạ / NaN / single-run → exit 2
 *   7. wiring: rule không có check = không vào file (KN-047) — registry + skill §6 + KN-080 Guard line
 */

const ROOT = process.cwd();
const SCRIPT = path.join(ROOT, '.github', 'harness', 'scripts', 'rank-stability.mjs');

type Cell = { prompt: string; model: string; runs: number[] };
type Doc = { measuredAt: string; claim?: string; models: string[]; cells: Cell[] };

function run(args: string[]) {
  return spawnSync(process.execPath, [SCRIPT, ...args], { cwd: ROOT, encoding: 'utf8', timeout: 60_000 });
}

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);
}

/** Fixture deterministic (không PRNG): wobble bounded ±0.008 — clear tách xa, tie trùng tâm. */
function synth(kind: 'clear' | 'tie', measuredDaysAgo = 1): Doc {
  const centers = kind === 'clear' ? [0.9, 0.7, 0.5] : [0.8, 0.8, 0.6];
  const models = ['m1', 'm2', 'm3'];
  const cells: Cell[] = [];
  for (let p = 1; p <= 8; p++) {
    for (let mi = 0; mi < models.length; mi++) {
      const wobble = [0, 1, 2].map(k => Number((((p * 7 + mi * 3 + k) % 5) * 0.004 - 0.008).toFixed(4)));
      cells.push({ prompt: `p${p}`, model: models[mi], runs: wobble.map(w => Number((centers[mi] + w).toFixed(4))) });
    }
  }
  return { measuredAt: daysAgo(measuredDaysAgo), claim: 'best', models, cells };
}

function tmpFile(tag: string, doc: Doc | string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `rs-${tag}-`));
  const file = path.join(dir, 'results.json');
  fs.writeFileSync(file, typeof doc === 'string' ? doc : JSON.stringify(doc));
  return file;
}

test.describe('Rank Stability — gate behavior + negative controls (KN-080)', () => {
  test('selftest: negative controls chạy thật → SELFTEST OK (exit 0)', () => {
    const r = run(['selftest']);
    expect(r.stdout, 'gate im lặng = gate chết (KN-074) — phải in marker').toContain('SELFTEST OK');
    expect(r.stdout).toMatch(/tie ✗claim/);
    expect(r.status).toBe(0);
  });

  test('clear + claim="best" → PASS: firm, 3 quy tắc stable, raw per-run, seed cố định', () => {
    const file = tmpFile('clear', synth('clear'));
    const r = run(['check', '--file', file, '--claim', 'best', '--json']);
    expect(r.status).toBe(0);
    const j = JSON.parse(r.stdout);
    expect(j.verdict).toBe('pass');
    expect(j.top.firm).toBe(true);
    expect(j.sensitivity.stable).toBe(true);
    expect(Object.keys(j.rules).sort()).toEqual(['mean', 'median', 'winrate']);
    expect(j.opt.seed).toBe(42);
    expect(j.runs).toBe(72);
    expect(j.reasons).toEqual([]);
  });

  test('negative control — near-tie + claim → FAIL exit 1 (within noise / sensitivity)', () => {
    const file = tmpFile('tie', synth('tie'));
    const r = run(['check', '--file', file, '--claim', 'best', '--json']);
    expect(r.status, 'claim "best" trên near-tie phải FAIL (exit 1)').toBe(1);
    const j = JSON.parse(r.stdout);
    expect(j.verdict).toBe('fail');
    expect(j.top.withinNoise, 'CI diff phải chứa 0 → không phân biệt được #1/#2').toBe(true);
    expect(j.reasons.length).toBeGreaterThan(0);
  });

  test('negative control — shelf-life: đo 100d trước + claim → FAIL exit 1', () => {
    const file = tmpFile('stale', synth('clear', 100));
    const r = run(['check', '--file', file, '--claim', 'best', '--json']);
    expect(r.status).toBe(1);
    const j = JSON.parse(r.stdout);
    expect(j.stale).toBe(true);
    expect(j.reasons.join(' ')).toContain('shelf-life');
  });

  test('không claim → report-only exit 0 (kể cả unstable); --warn → warn exit 0', () => {
    const file = tmpFile('report', synth('tie'));
    const plain = run(['check', '--file', file, '--json']);
    expect(plain.status).toBe(0);
    expect(JSON.parse(plain.stdout).verdict).toBe('report');
    const warned = run(['check', '--file', file, '--claim', 'best', '--warn', '--json']);
    expect(warned.status).toBe(0);
    expect(JSON.parse(warned.stdout).verdict).toBe('warn');
  });
});

test.describe('Rank Stability — fail-closed class + wiring (KN-080 · KN-069 · KN-047)', () => {
  test('fail-closed class (KN-069): thiếu file · JSON hỏng · arg lạ · NaN · single-run → exit 2', () => {
    const single = synth('clear');
    single.cells[0].runs = [0.5];
    const cases = [
      run(['check']),
      run(['check', '--file', path.join(os.tmpdir(), 'khong-ton-tai-rs.json')]),
      run(['check', '--file', tmpFile('bad', '{ not json')]),
      run(['check', '--file', tmpFile('flag', synth('clear')), '--bogus']),
      run(['check', '--file', tmpFile('nan', synth('clear')), '--threshold', 'abc']),
      run(['check', '--file', tmpFile('single', single)]),
    ];
    for (const r of cases) {
      expect(r.status, `phải fail-closed exit 2 · stderr=${r.stderr}`).toBe(2);
    }
  });

  test('wiring: rule phải có check trong file (KN-047) — registry + skill §6 + KN-080 Guard line', () => {
    const components = JSON.parse(fs.readFileSync(path.join(ROOT, '.github', 'harness', 'evals', 'components.json'), 'utf8'));
    const entry = components.components.find((c: { id: string }) => c.id === 'rank-stability-selftest');
    expect(entry, 'components.json phải có entry rank-stability-selftest').toBeTruthy();
    expect(entry.cmd).toContain('rank-stability.mjs');
    expect(entry.expect.stdout).toContain('SELFTEST OK');

    const skill = fs.readFileSync(path.join(ROOT, '.github', 'skills', 'evals-gate', 'SKILL.md'), 'utf8');
    expect(skill, 'skill §6 phải trỏ machine command').toContain('rank-stability.mjs');

    const kn = fs.readFileSync(path.join(ROOT, 'docs', 'knowleged.md'), 'utf8');
    const start = kn.indexOf('### KN-080');
    expect(start, 'KN-080 phải tồn tại').toBeGreaterThan(-1);
    const block = kn.slice(start, kn.indexOf('### KN-081', start));
    expect(block, 'KN-080 Guard line phải trỏ script máy chấm').toContain('rank-stability.mjs');
    expect(block, 'KN-080 Guard line phải trỏ spec này').toContain('tests/e2e/rank-stability-guard.spec.ts');
  });
});
