import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Gravity G polarity — ship 2026-09-12 (verify actor tạo spec MỚI, không sửa test cũ — KN-012):
 *  - G cao = scope kiểm soát TỐT (xanh/low) — NGƯỢC S/D/M (cao=xấu/đỏ)
 *  - scale.html #gravityParts: badge G=8 (high) render class gauge-level low (xanh)
 *  - index.html observatory: tile Gravity G=8 KHÔNG hot/warn (trắng = tốt)
 *  - D/S giữ polarity cũ (cao=xấu): D=0 low, S=9 low; S=30 (mock) → hot đỏ
 * Evidence → .agent/plans/cosmos-gravity-polarity/verify/
 */

const ROOT = process.cwd();
const SHOTS = '.agent/plans/cosmos-gravity-polarity/verify';

function realScale() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'www/cosmos/scale.json'), 'utf8'));
}

test('scale.html — #gravityParts badge G=8 có class low (xanh), KHÔNG high (đỏ)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  const j = realScale();
  expect(j.gravity.G, 'precondition: scale.json thật G=8').toBe(8);
  expect(j.gravity.level, 'precondition: level high').toBe('high');

  await page.goto('/cosmos/scale.html');
  const gp = page.locator('#gravityParts');
  await expect(gp, '#gravityParts phải render từ scale.json thật').toBeVisible({ timeout: 10_000 });
  await expect(gp).toContainText('G=8', { timeout: 10_000 });

  const badge = gp.locator('.gauge-level').last();
  await expect(badge).toContainText('G=8');
  await expect(badge, 'G=8 high → polarity đảo → class low (xanh)').toHaveClass(/low/);
  await expect(badge, 'KHÔNG được đỏ').not.toHaveClass(/high/);
  expect(errors).toEqual([]);

  await gp.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await gp.screenshot({ path: `${SHOTS}/gravity-badge-low.png` });
});

test('scale.html — badge D=0 vẫn low + badge S=9 vẫn low (polarity D/S không đổi)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  const j = realScale();
  expect(j.darkEnergy.D, 'precondition: D=0').toBe(0);
  expect(j.entropy.S, 'precondition: S=9').toBe(9);

  await page.goto('/cosmos/scale.html');

  const de = page.locator('#deParts');
  await expect(de).toContainText('D=0', { timeout: 10_000 });
  const deBadge = de.locator('.gauge-level').last();
  await expect(deBadge).toContainText('D=0');
  await expect(deBadge, 'D=0 → low (xanh), polarity cao=xấu giữ nguyên').toHaveClass(/low/);

  await expect(page.locator('#gaugeValue')).toContainText('9', { timeout: 10_000 });
  await expect(page.locator('#gaugeLevel')).toHaveClass(/low/);
  expect(errors).toEqual([]);
});

test('index.html observatory — tile Gravity G=8 KHÔNG hot/warn (trắng = tốt)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('/cosmos/index.html');
  await page.keyboard.press('Escape');
  await expect(page.locator('#intro')).toBeHidden({ timeout: 3000 });

  const stats = page.locator('#deStats');
  await expect(stats).toContainText('Gravity G', { timeout: 10_000 });
  await expect(stats).toContainText('8', { timeout: 10_000 });

  const tile = stats.locator('.de-stat', { hasText: 'Gravity G' });
  await expect(tile).toBeVisible();
  await expect(tile, 'G=8 high → polarity đảo → KHÔNG hot').not.toHaveClass(/hot/);
  await expect(tile, 'G=8 high → KHÔNG warn').not.toHaveClass(/warn/);
  expect(errors).toEqual([]);

  await stats.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${SHOTS}/observatory-gravity-tile.png` });
});

test('index.html — tile Entropy S=30 (mock) vẫn hot đỏ (S giữ polarity cao=xấu)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  const real = realScale();
  const mocked = {
    ...real,
    entropy: { ...real.entropy, S: 30, level: 'high' },
    history: [...(real.history ?? []), { t: new Date().toISOString(), S: 30 }],
  };
  await page.route('**/scale.json', (route) => route.fulfill({ json: mocked }));
  await page.goto('/cosmos/index.html');
  await page.keyboard.press('Escape');
  await expect(page.locator('#intro')).toBeHidden({ timeout: 3000 });

  const stats = page.locator('#deStats');
  await expect(stats).toContainText('Entropy S', { timeout: 10_000 });
  const tile = stats.locator('.de-stat', { hasText: 'Entropy S' });
  await expect(tile).toContainText('30');
  await expect(tile, 'S=30 high → hot đỏ (polarity cũ giữ nguyên)').toHaveClass(/hot/);
  expect(errors).toEqual([]);
});

test('scale.html @375 — không tràn ngang + 0 pageerror', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.setViewportSize({ width: 375, height: 780 });
  await page.goto('/cosmos/scale.html');
  await expect(page.locator('#gravityParts')).toContainText('G=', { timeout: 10_000 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, 'không tràn ngang ở 375px').toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
  await page.locator('#gravityParts').screenshot({ path: `${SHOTS}/gravity-375.png` });
});
