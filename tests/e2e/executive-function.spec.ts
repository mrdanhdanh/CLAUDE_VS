import { test, expect } from '@playwright/test';

// executive-function — KN-054 (ADHD × Harness): explorer tabs + lab flow + invariants.
// Serve: dùng explicit index.html (serve không rewrite /executive-function/ — như cosmos specs).
// Invariants khoá: dot chết (KN-046), tab ARIA resolve, lab deterministic (từ cố định), no pageerror (KN-032).

test.describe('executive-function — load + explorer (KN-054)', () => {
  const pageErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    pageErrors.length = 0;
    page.on('pageerror', (e) => pageErrors.push(e.message));
    await page.goto('/executive-function/index.html');
  });

  test('load: title + back link resolve + không lỗi console', async ({ page }) => {
    await expect(page).toHaveTitle(/Executive Function/);
    await expect(page.locator('header a.btn[href="../index.html"]')).toBeVisible();
    const res = await page.request.get('/index.html');
    expect(res.status()).toBe(200);
    expect(pageErrors).toEqual([]);
  });

  test('dots nav: mọi target resolve — không dot chết (KN-046)', async ({ page }) => {
    const missing = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.dots a'))
        .map((a) => a.getAttribute('href') || '')
        .filter((h) => !document.querySelector(h))
    );
    expect(missing).toEqual([]);
    const count = await page.locator('.dots a').count();
    expect(count).toBeGreaterThanOrEqual(5);
    expect(pageErrors).toEqual([]);
  });

  test('explorer: 6 tab, aria-controls resolve, click + keyboard arrows (KN-050)', async ({ page }) => {
    const tabs = page.locator('#ef-tablist [role="tab"]');
    await expect(tabs).toHaveCount(6);

    const badTargets = await page.evaluate(() =>
      Array.from(document.querySelectorAll('#ef-tablist [role="tab"]'))
        .map((t) => t.getAttribute('aria-controls') || '')
        .filter((id) => !document.getElementById(id))
    );
    expect(badTargets).toEqual([]);

    // click tab 2 → panel 2 hiện, panel 1 ẩn
    await tabs.nth(1).click();
    await expect(page.locator('#panel-memory')).toBeVisible();
    await expect(page.locator('#panel-inhibit')).toBeHidden();
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');

    // keyboard: ArrowRight → tab 3
    await page.locator('#tab-memory').focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#tab-emotion')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#panel-emotion')).toBeVisible();

    // Home → về tab 1
    await page.keyboard.press('Home');
    await expect(page.locator('#tab-inhibit')).toHaveAttribute('aria-selected', 'true');
    expect(pageErrors).toEqual([]);
  });
});

test.describe('executive-function — lab working memory', () => {
  const pageErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    pageErrors.length = 0;
    page.on('pageerror', (e) => pageErrors.push(e.message));
    await page.goto('/executive-function/index.html');
  });

  test('lab full flow: nhiễu xong → nhập đúng (1 từ thiếu dấu) → 4/4', async ({ page }) => {
    await page.click('#lab-start');
    await expect(page.locator('#phase-memorize')).toBeVisible();

    // hết 6s memorize → quiz (timeout 10s: đủ rộng, không dùng wall-clock cứng — KN-031)
    await expect(page.locator('#phase-quiz')).toBeVisible({ timeout: 10_000 });

    // trả lời 3 câu nhiễu (không tính điểm) → nút đi tiếp mở khoá
    const qs = page.locator('#lab-quiz fieldset');
    for (let i = 0; i < 3; i++) await qs.nth(i).locator('.opt').first().click();
    await expect(page.locator('#lab-to-recall')).toBeEnabled();
    await page.click('#lab-to-recall');

    await expect(page.locator('#phase-recall')).toBeVisible();
    // "hat" thiếu dấu vẫn tính là "hạt" (normalize VN) — 4/4
    await page.fill('#lab-recall-input', 'hat đèn sông chuông');
    await page.click('#lab-check');

    await expect(page.locator('#phase-result')).toBeVisible();
    await expect(page.locator('#lab-score')).toHaveText('4/4');
    await expect(page.locator('#lab-chips .chip.ok')).toHaveCount(4);
    expect(pageErrors).toEqual([]);
  });

  test('lab replay: reset sạch state (input, nút, phase)', async ({ page }) => {
    await page.click('#lab-start');
    await expect(page.locator('#phase-quiz')).toBeVisible({ timeout: 10_000 });
    const qs = page.locator('#lab-quiz fieldset');
    for (let i = 0; i < 3; i++) await qs.nth(i).locator('.opt').nth(1).click();
    await page.click('#lab-to-recall');
    await page.fill('#lab-recall-input', 'sông');
    await page.click('#lab-check');
    await expect(page.locator('#lab-score')).toHaveText('1/4');

    await page.click('#lab-replay');
    await expect(page.locator('#phase-idle')).toBeVisible();
    await expect(page.locator('#lab-to-recall')).toBeDisabled();
    await expect(page.locator('#lab-recall-input')).toHaveValue('');
    await expect(page.locator('#lab-score')).toHaveText('0/4');
    expect(pageErrors).toEqual([]);
  });
});

test.describe('executive-function — responsive', () => {
  test('375: không tràn ngang, explorer + lab vẫn dùng được', async ({ page }) => {
    await page.goto('/executive-function/index.html');
    await page.setViewportSize({ width: 375, height: 800 });
    await page.waitForTimeout(200);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(2);

    await expect(page.locator('#ef-tablist [role="tab"]')).toHaveCount(6);
    await page.click('#ef-tablist [role="tab"] >> nth=2');
    await expect(page.locator('#panel-emotion')).toBeVisible();

    await page.click('#lab-start');
    await expect(page.locator('#phase-memorize')).toBeVisible();
  });
});
