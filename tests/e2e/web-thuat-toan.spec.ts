import { test, expect } from '@playwright/test';

// web-thuat-toan — step/auto/reset controller invariants (KN-047 refactor safety net).
// Lưu ý: id bắt đầu bằng số → CSS '#001-...' invalid, phải dùng [id="..."];
// serve local không rewrite /web-thuat-toan/ → dùng explicit index.html (như cosmos specs).
const S = (id: string) => `[id="${id}"]`;

test.describe('web-thuat-toan — visualizer controller', () => {
  const pageErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    pageErrors.length = 0;
    page.on('pageerror', (e) => pageErrors.push(e.message));
    await page.goto('/web-thuat-toan/index.html');
  });

  test('001 Kadane: step init → advance, không lỗi console', async ({ page }) => {
    await page.fill(S('001-input'), '-2, 1, -3, 4, -1, 2, 1, -5, 4');
    await page.click(S('001-step-btn'));
    await expect(page.locator(S('001-viz-card'))).toBeVisible();
    await page.click(S('001-step-btn'));
    await expect(page.locator(`${S('001-steps-list')} li`)).toHaveCount(1);
    await page.click(S('001-step-btn'));
    await expect(page.locator(`${S('001-steps-list')} li`)).toHaveCount(2);
    expect(pageErrors).toEqual([]);
  });

  test('001 auto toggle: 1 click = chạy, 1 click = dừng', async ({ page }) => {
    await page.fill(S('001-input'), '-2, 1, -3, 4, -1, 2, 1, -5, 4');
    await page.click(S('001-step-btn'));
    await page.click(S('001-auto-btn'));
    await expect(page.locator(S('001-auto-btn'))).toHaveText('⏸ Dừng');
    await page.click(S('001-auto-btn'));
    await expect(page.locator(S('001-auto-btn'))).toHaveText('▶ Tự động');
    expect(pageErrors).toEqual([]);
  });

  test('reset khi đang auto → stop sạch; click auto lần sau vẫn 1 click là chạy (desync guard)', async ({ page }) => {
    await page.fill(S('001-input'), '-2, 1, -3, 4, -1, 2, 1, -5, 4');
    await page.click(S('001-step-btn'));
    await page.click(S('001-auto-btn'));
    await expect(page.locator(S('001-auto-btn'))).toHaveText('⏸ Dừng');
    await page.click(S('001-reset-btn'));
    await expect(page.locator(S('001-auto-btn'))).toHaveText('▶ Tự động');
    await expect(page.locator(S('001-viz-card'))).toBeHidden();
    // desync guard: sau reset, 1 click phải khởi động lại được (không cần click thứ 2)
    await page.click(S('001-auto-btn'));
    await expect(page.locator(S('001-auto-btn'))).toHaveText('⏸ Dừng');
    await page.click(S('001-reset-btn'));
    expect(pageErrors).toEqual([]);
  });

  test('010 Knapsack (controller thứ 2): step init → advance', async ({ page }) => {
    await page.click('.nav-item[data-bai="010"]');
    await page.fill(S('010-w'), '2, 3, 4, 5');
    await page.fill(S('010-v'), '3, 4, 5, 6');
    await page.fill(S('010-cap'), '5');
    await page.click(S('010-step-btn'));
    await expect(page.locator(S('010-viz-card'))).toBeVisible();
    await page.click(S('010-step-btn'));
    await expect(page.locator(`${S('010-steps-list')} li`)).toHaveCount(1);
    expect(pageErrors).toEqual([]);
  });

  test('responsive 375: không tràn ngang', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.waitForTimeout(300);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(2);
  });
});
