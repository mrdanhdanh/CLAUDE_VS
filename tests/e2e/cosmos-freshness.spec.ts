import { test, expect } from '@playwright/test';

/**
 * COSMOS Freshness + Lab #11 (Dark Energy vs Gravity) — evidence cho upgrade 2026-09-11:
 * - scale.html: badge "tươi/cũ" theo tuổi scale.json + Gravity card G
 * - observatory: deStats có D & G, deHint có "Đo lúc" + freshness
 * - lab #11: expand/contract đổi D/G, không có pageerror (KN-032)
 * Evidence → .agent/plans/cosmos-freshness-upgrade/verify/
 */

const SHOTS = '.agent/plans/cosmos-freshness-upgrade/verify';

test('scale.html — badge tươi + Gravity G render', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('/cosmos/scale.html');
  await expect(page.locator('#freshBadge')).toContainText('tươi', { timeout: 8000 });
  await expect(page.locator('#freshBadge')).toHaveClass(/ok/);
  await expect(page.locator('#gravityParts')).toContainText('CẮT/YAGNI', { timeout: 5000 });
  await expect(page.locator('#gravityParts')).toContainText('G=', { timeout: 5000 });
  expect(errors).toEqual([]);
  await page.screenshot({ path: `${SHOTS}/scale-fresh-gravity.png` });
});

test('observatory — D & G stats + Đo lúc, không pageerror', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('/cosmos/index.html');
  await page.keyboard.press('Escape');
  await expect(page.locator('#intro')).toBeHidden({ timeout: 3000 });
  await expect(page.locator('#deBadge')).toContainText('thật', { timeout: 8000 });
  await expect(page.locator('#deStats')).toContainText('Dark Energy D');
  await expect(page.locator('#deStats')).toContainText('Gravity G');
  await expect(page.locator('#deHint')).toContainText('Đo lúc');
  expect(errors).toEqual([]);
});

test('Lab #11 — Dark Energy vs Gravity tương tác + không pageerror', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('/cosmos/index.html');
  await page.keyboard.press('Escape');
  await expect(page.locator('#intro')).toBeHidden({ timeout: 3000 });
  const status = page.locator('#dgStatus');
  await page.locator('#btnDgExpand').scrollIntoViewIfNeeded();
  await page.locator('#btnDgExpand').click();
  await page.locator('#btnDgExpand').click();
  await expect(status).toContainText('D=2');
  await page.locator('#btnDgContract').click();
  await expect(status).toContainText('G=1');
  await page.locator('#btnDgContract').click();
  await page.locator('#btnDgContract').click();
  await page.locator('#btnDgContract').click();
  // 4 lần contract sau 2 lần expand → D=2, G=4 (counter đếm đúng từng click)
  await expect(status).toContainText('D=2');
  await expect(status).toContainText('G=4');
  await expect(status).toContainText('Gravity thắng');
  await page.locator('#btnDgReset').click();
  await expect(status).toContainText('D=0');
  expect(errors).toEqual([]);
  await page.locator('#btnDgExpand').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${SHOTS}/lab-11-dg.png` });
});

test('scale.json — có gravity + history D/G', async ({ request }) => {
  const res = await request.get('/cosmos/scale.json');
  expect(res.status()).toBe(200);
  const j = await res.json();
  expect(j.gravity).toBeTruthy();
  expect(typeof j.gravity.G).toBe('number');
  const last = j.history[j.history.length - 1];
  expect(typeof last.D).toBe('number');
  expect(typeof last.G).toBe('number');
});
