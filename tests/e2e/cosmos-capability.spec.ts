import { test, expect } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * Capability metric — cosmic-scale (2026-09-12, backlog item 2)
 * Đối trọng định lượng của entropy S: assets đếm được {kn, skills, e2eSpecs, e2eTests, guards}.
 * Không weight (tránh vanity metric — KN-024): chỉ đo + delta so mốc history trước.
 */

const ROOT = process.cwd();
const SCRIPT = path.join(ROOT, '.github/harness/scripts/cosmic-scale.mjs');

function run(args: string[]) {
  return spawnSync('node', [SCRIPT, ...args], { cwd: ROOT, encoding: 'utf8', timeout: 60_000 });
}

test('capability block có trong output + history ghi C + delta tính từ mốc trước', () => {
  const out = path.join(os.tmpdir(), `scale-cap-${Date.now()}.json`);
  fs.writeFileSync(out, JSON.stringify({
    generatedAt: new Date().toISOString(),
    history: [{ t: new Date(Date.now() - 3_600_000).toISOString(), S: 1, level: 'low', M: 0, D: 0, G: 0, C: { kn: 1, skills: 1, e2eSpecs: 1, e2eTests: 1, guards: 1 } }],
  }));
  const r = run(['--json', '--out', out]);
  expect(r.status, r.stderr).toBe(0);
  const j = JSON.parse(fs.readFileSync(out, 'utf8'));
  const cap = j.capability;
  expect(cap.kn, 'KN count ≥ 48').toBeGreaterThanOrEqual(48);
  expect(cap.guards).toBeGreaterThanOrEqual(11);
  expect(cap.e2eSpecs).toBeGreaterThanOrEqual(10);
  expect(cap.e2eTests).toBeGreaterThanOrEqual(60);
  const last = j.history[j.history.length - 1];
  expect(last.C, 'history entry phải ghi C').toBeTruthy();
  expect(last.C.kn).toBe(cap.kn);
  expect(j.capabilityDelta && j.capabilityDelta.kn > 0, 'delta vs mốc trước phải dương').toBeTruthy();
  fs.rmSync(out, { force: true });
});

test('capability: history rỗng → delta null (không crash)', () => {
  const out = path.join(os.tmpdir(), `scale-cap-empty-${Date.now()}.json`);
  fs.writeFileSync(out, JSON.stringify({ generatedAt: new Date().toISOString(), history: [] }));
  const r = run(['--json', '--out', out]);
  expect(r.status, r.stderr).toBe(0);
  const j = JSON.parse(fs.readFileSync(out, 'utf8'));
  expect(j.capabilityDelta).toBeNull();
  fs.rmSync(out, { force: true });
});
