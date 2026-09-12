import { test, expect, type Page } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * Escape Velocity — roadmap card #2 (ship 2026-09-12): gate theo ĐÀ S
 *  - `cosmic-scale.mjs --trend N`: exit 1 khi S tăng LIÊN TIẾP ≥N lần đo (mỗi bước Δ≥1)
 *  - `result.trend` LUÔN có trong output (kể cả không --trend) — gate chỉ nổ khi có flag
 *  - scale.html#escape render từ scale.json.trend thật (KN-030 mirror data) + state gate=true (mock)
 * History đọc từ --out nếu có, else www/cosmos/scale.json — crafted temp file = deterministic.
 * Evidence → .agent/plans/cosmos-escape-velocity/verify/
 */

const ROOT = process.cwd();
const SCRIPT = path.join(ROOT, '.github/harness/scripts/cosmic-scale.mjs');
const SHOTS = '.agent/plans/cosmos-escape-velocity/verify';

function run(args: string[]) {
  return spawnSync('node', [SCRIPT, ...args], { cwd: ROOT, encoding: 'utf8', timeout: 60_000 });
}

function measureS(): number {
  const r = run(['--json']);
  expect(r.status, r.stderr).toBe(0);
  return JSON.parse(r.stdout).entropy.S;
}

function tmpFile(tag: string) {
  return path.join(os.tmpdir(), `scale-ev-${tag}-${Date.now()}-${Math.floor(Math.random() * 1e6)}.json`);
}

/** Dựng history file với các mốc S cho trước (cũ → mới). */
function writeHistory(file: string, values: number[]) {
  const history = values.map((S, i) => ({
    t: new Date(Date.now() - (values.length - i) * 3_600_000).toISOString(),
    S,
    level: 'low',
    M: 0,
    D: 0,
    G: 0,
  }));
  fs.writeFileSync(file, JSON.stringify({ generatedAt: new Date().toISOString(), history }, null, 2));
}

test('--trend 3: S tăng 3 lần liên tiếp → exit 1 + chặn feature', () => {
  const S = measureS();
  const out = tmpFile('gate');
  // bước nhảy +3 để robust trước drift nhỏ giữa 2 lần đo trong cùng test
  writeHistory(out, [S - 9, S - 6, S - 3]);
  const r = run(['--trend', '3', '--out', out]);
  expect(r.status, r.stdout + r.stderr).toBe(1);
  expect(r.stderr).toContain('ESCAPE VELOCITY');
  expect(r.stderr).toContain('chặn thêm feature');
  fs.rmSync(out, { force: true });
});

test('--trend 4: đà 3 < ngưỡng → exit 0, trend ghi vào scale.json', () => {
  const S = measureS();
  const out = tmpFile('pass');
  writeHistory(out, [S - 9, S - 6, S - 3]);
  const r = run(['--trend', '4', '--out', out]);
  expect(r.status, r.stdout + r.stderr).toBe(0);
  expect(r.stdout).toContain('chưa đạt');
  const j = JSON.parse(fs.readFileSync(out, 'utf8'));
  expect(j.trend.increases).toBe(3);
  expect(j.trend.needed).toBe(4);
  expect(j.trend.gate).toBe(false);
  expect(j.trend.window.length).toBe(4); // 4 history + 1 điểm mới → slice(-(N+1)) = cả 4
  fs.rmSync(out, { force: true });
});

test('--trend 3: history đi ngang/giảm → exit 0 (đà reset)', () => {
  const S = measureS();
  const out = tmpFile('flat');
  writeHistory(out, [S + 9, S + 9, S + 9]);
  const r = run(['--trend', '3', '--out', out]);
  expect(r.status, r.stdout + r.stderr).toBe(0);
  const j = JSON.parse(fs.readFileSync(out, 'utf8'));
  expect(j.trend.increases).toBe(0);
  expect(j.trend.gate).toBe(false);
  fs.rmSync(out, { force: true });
});

test('không --trend: trend luôn có trong output, gate không tự nổ', () => {
  const r = run(['--json']);
  expect(r.status, r.stderr).toBe(0);
  const j = JSON.parse(r.stdout);
  expect(j.trend, 'trend luôn được tính + ghi').toBeTruthy();
  expect(typeof j.trend.increases).toBe('number');
  expect(j.trend.needed).toBe(3); // default
  expect(typeof j.trend.gate).toBe('boolean');
  expect(Array.isArray(j.trend.window)).toBe(true);
  expect(j.history.length, 'history thật của repo (scale.json đã commit)').toBeGreaterThan(1);
});

test('thiếu history (file mới): increases=0, không crash', () => {
  const out = tmpFile('fresh'); // chưa tồn tại
  const r = run(['--trend', '3', '--out', out]);
  expect(r.status, r.stdout + r.stderr).toBe(0);
  const j = JSON.parse(fs.readFileSync(out, 'utf8'));
  expect(j.trend.increases).toBe(0);
  expect(j.trend.window.length).toBe(1);
  fs.rmSync(out, { force: true });
});

test('scale.html — Escape section render từ trend thật trong scale.json', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('/cosmos/scale.html');

  await expect(page.locator('#ev-title')).toBeVisible();
  const res = await page.request.get('/cosmos/scale.json');
  expect(res.status(), 'scale.json phải commit trong www/ (KN-030)').toBe(200);
  const j = await res.json();
  expect(j.trend, 'refresh phải ghi trend — chạy npm run cosmos:refresh').toBeTruthy();

  await expect(page.locator('#evAdvice')).toContainText(`tăng ${j.trend.increases}/${j.trend.needed}`, {
    timeout: 10_000,
  });
  const win = j.trend.window as { t: string; S: number }[];
  if (win.length >= 2) {
    await expect(page.locator('#evWindow .web-chip')).toHaveCount(win.length);
    await expect(page.locator('#evWindow .web-chip').last()).toContainText(String(win[win.length - 1].S));
  } else {
    await expect(page.locator('#evWindow')).toContainText('cần ≥2 điểm');
  }
  expect(errors).toEqual([]);

  await page.locator('#ev-title').scrollIntoViewIfNeeded();
  await expect
    .poll(() => page.locator('section:has(#ev-title)').evaluate((el) => getComputedStyle(el).opacity), { timeout: 5000 })
    .toBe('1');
  await page.locator('section:has(#ev-title)').screenshot({ path: `${SHOTS}/escape-section.png` });
});

test('scale.html — gate=true (mock) hiện trạng thái ⛔ chặn', async ({ page }) => {
  const real = JSON.parse(fs.readFileSync(path.join(ROOT, 'www/cosmos/scale.json'), 'utf8'));
  real.trend = {
    increases: 3,
    needed: 3,
    gate: true,
    window: [
      { t: '2026-09-12T00:00:00.000Z', S: 1 },
      { t: '2026-09-12T01:00:00.000Z', S: 2 },
      { t: '2026-09-12T02:00:00.000Z', S: 3 },
      { t: '2026-09-12T03:00:00.000Z', S: 4 },
    ],
  };
  await page.route('**/scale.json', (route) => route.fulfill({ json: real }));
  await page.goto('/cosmos/scale.html');

  await expect(page.locator('#evAdvice')).toContainText('GATE', { timeout: 10_000 });
  await expect(page.locator('#evGate')).toContainText('chặn');
  await expect(page.locator('#evGate .bh-item')).toHaveClass(/dynamic/);
  await expect(page.locator('#evWindow .web-chip').nth(1)).toContainText('↑'); // S 1→2→3→4 đều tăng
  await page.locator('section:has(#ev-title)').screenshot({ path: `${SHOTS}/escape-gate-mock.png` });
});

test('scale.html — escape section @375 không tràn ngang', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 780 });
  await page.goto('/cosmos/scale.html');
  await expect(page.locator('#evAdvice')).toContainText('Đà S', { timeout: 10_000 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await page.locator('section:has(#ev-title)').screenshot({ path: `${SHOTS}/escape-375.png` });
});
