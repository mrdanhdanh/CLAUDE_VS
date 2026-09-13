import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Gravity G polarity — ship 2026-09-12 (verify actor tạo spec MỚI, không sửa test cũ — KN-012):
 *  - G cao = scope kiểm soát TỐT (xanh/low) — NGƯỢC S/D/M (cao=xấu/đỏ)
 *  - D/S giữ polarity cũ (cao=xấu): S=30 (mock) → hot đỏ
 *
 * Amendment 2026-09-13 (actor verify — data drift thật, KHÔNG nới guard):
 *  - refresh mirrors đổi G 8→9 (plans 26→27: +plan ai-news-vi-summary có dòng CẮT;
 *    22/26=8.46 → 23/27=8.52) làm vỡ precondition cứng `G=8`.
 *  - Contract THẬT của spec = POLARITY MAPPING, không phải con số → spec đọc giá trị live
 *    từ scale.json + assert mapping (gravity: high→low đảo cực; D/S: class = level;
 *    index tile: G>=6 calm · 3..5 warn · <3 hot). Badge đảo trục → vẫn FAIL.
 * Evidence → .agent/plans/cosmos-gravity-polarity/verify/
 */

const ROOT = process.cwd();
const SHOTS = '.agent/plans/cosmos-gravity-polarity/verify';

function realScale() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'www/cosmos/scale.json'), 'utf8'));
}

test('scale.html — #gravityParts badge khớp polarity ĐẢO (G cao = xanh)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  const j = realScale();
  const { G, level } = j.gravity;
  expect(typeof G, 'precondition: scale.json thật có gravity.G (số)').toBe('number');
  expect(['low', 'medium', 'high'], 'precondition: gravity.level hợp lệ').toContain(level);

  await page.goto('/cosmos/scale.html');
  const gp = page.locator('#gravityParts');
  await expect(gp, '#gravityParts phải render từ scale.json thật').toBeVisible({ timeout: 10_000 });
  await expect(gp).toContainText(`G=${G}`, { timeout: 10_000 });

  const badge = gp.locator('.gauge-level').last();
  await expect(badge).toContainText(`G=${G}`);
  // Mapping đảo (scale.html): high→low (xanh, scope tốt) · low→high (đỏ) · medium→medium
  const expected = level === 'high' ? 'low' : level === 'low' ? 'high' : 'medium';
  await expect(badge, `G=${G} (${level}) → polarity đảo → class ${expected}`).toHaveClass(new RegExp(`\\b${expected}\\b`));
  expect(errors).toEqual([]);

  await gp.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await gp.screenshot({ path: `${SHOTS}/gravity-badge-low.png` });
});

test('scale.html — badge D + gauge S khớp polarity thường (cao = xấu)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  const j = realScale();
  const { D } = j.darkEnergy;
  const { S, level: sLevel } = j.entropy;
  // darkEnergy KHÔNG có field level — scale.html:482 tự derive: D===0→low · D<=5→medium · else high
  const dLevel = D === 0 ? 'low' : D <= 5 ? 'medium' : 'high';

  await page.goto('/cosmos/scale.html');

  const de = page.locator('#deParts');
  await expect(de).toContainText(`D=${D}`, { timeout: 10_000 });
  const deBadge = de.locator('.gauge-level').last();
  await expect(deBadge).toContainText(`D=${D}`);
  await expect(deBadge, 'D — polarity cao=xấu: class = level').toHaveClass(new RegExp(`\\b${dLevel}\\b`));

  await expect(page.locator('#gaugeValue')).toContainText(String(S), { timeout: 10_000 });
  await expect(page.locator('#gaugeLevel'), 'S — polarity cao=xấu: class = level').toHaveClass(new RegExp(`\\b${sLevel}\\b`));
  expect(errors).toEqual([]);
});

test('index.html observatory — tile Gravity G khớp polarity đảo (G cao = trắng/tốt)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  const { G } = realScale().gravity;
  await page.goto('/cosmos/index.html');
  await page.keyboard.press('Escape');
  await expect(page.locator('#intro')).toBeHidden({ timeout: 3000 });

  const stats = page.locator('#deStats');
  await expect(stats).toContainText('Gravity G', { timeout: 10_000 });
  await expect(stats).toContainText(String(G), { timeout: 10_000 });

  const tile = stats.locator('.de-stat', { hasText: 'Gravity G' });
  await expect(tile).toBeVisible();
  await expect(tile).toContainText(String(G));
  // index.html mapping: G>=6 → calm (trắng) · 3..5 → warn · <3 → hot
  if (G >= 6) {
    await expect(tile, `G=${G} → polarity đảo → KHÔNG hot`).not.toHaveClass(/hot/);
    await expect(tile, `G=${G} → KHÔNG warn`).not.toHaveClass(/warn/);
  } else if (G >= 3) {
    await expect(tile, `G=${G} → warn`).toHaveClass(/warn/);
  } else {
    await expect(tile, `G=${G} → hot`).toHaveClass(/hot/);
  }
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
