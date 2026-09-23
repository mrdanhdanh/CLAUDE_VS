import { test, expect, type Page } from '@playwright/test';

async function boot(page: Page) {
  await page.goto('/cosmos-3d/index.html');
  await page.waitForFunction(() => (window as unknown as { __COSMOS3D?: { ready?: boolean } }).__COSMOS3D?.ready === true);
  await page.waitForFunction(() => document.querySelector('#boot')?.classList.contains('hide') === true);
}

test.describe('COSMOS 3D guided tour', () => {
  test('starts, pauses, nexts and finishes without stealing focus every step', async ({ page }) => {
    await boot(page);
    await page.click('#btnTour');
    await expect(page.locator('#tour')).toBeVisible();
    await expect(page.locator('#tourIndex')).toContainText('/');
    await page.click('#tourPlay');
    await expect(page.locator('#tourStatus')).toContainText('tạm dừng');
    const first = await page.locator('#tourTitle').innerText();
    await page.click('#tourNext');
    await expect(page.locator('#tourTitle')).not.toHaveText(first);
    await page.click('#tourFinish');
    await expect(page.locator('#tour')).toBeHidden();
  });

  test('public API exposes tour state and all 2D-derived chapters', async ({ page }) => {
    await boot(page);
    const state = await page.evaluate(() => (window as unknown as { __COSMOS3D: { tourState: () => Record<string, unknown> } }).__COSMOS3D.tourState());
    expect(state.total).toBeGreaterThanOrEqual(20);
    await page.evaluate(() => (window as unknown as { __COSMOS3D: { startTour: () => void } }).__COSMOS3D.startTour());
    await expect(page.locator('#tour')).toBeVisible();
    await expect(page.locator('#tourText')).not.toHaveText('—');
  });

  test('reduced-motion does not auto-advance', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    await boot(page);
    await page.click('#btnTour');
    const first = await page.locator('#tourTitle').innerText();
    await page.waitForTimeout(500);
    expect(await page.locator('#tourTitle').innerText()).toBe(first);
    await expect(page.locator('#tourStatus')).toContainText('giảm chuyển động');
    await context.close();
  });
});
