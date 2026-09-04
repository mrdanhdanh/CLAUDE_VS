import { test, expect } from '@playwright/test';

const viewports = [
  { width: 375, height: 800, label: 'mobile 375' },
  { width: 768, height: 900, label: 'tablet 768' },
  { width: 1280, height: 900, label: 'desktop 1280' },
];

for (const vp of viewports) {
  test.describe(`Responsive — ${vp.label}`, () => {
    test(`no horizontal overflow at ${vp.width}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await page.waitForTimeout(500);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `overflow at ${vp.width}`).toBeLessThanOrEqual(2);
    });

    test(`header not broken at ${vp.width}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await expect(page.locator('.header')).toBeVisible();
      await expect(page.locator('.brand')).toBeVisible();
      // header actions should be visible (at least one btn)
      await expect(page.locator('.header-actions .btn, .header-actions a').first()).toBeVisible();
    });
  });
}

test.describe('Responsive — ai-news at 375/1280', () => {
  test('ai-news no overflow at 375', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto('/ai-news/');
    await page.waitForTimeout(500);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(2);
  });

  test('ai-news no overflow at 1280', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/ai-news/');
    await page.waitForTimeout(500);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(2);
  });
});
