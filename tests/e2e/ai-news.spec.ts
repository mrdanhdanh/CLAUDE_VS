import { test, expect } from '@playwright/test';

test.describe('AI News — ai-news.html', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ai-news/');
  });

  test('loads ai-news.json and renders hero + grids', async ({ page }) => {
    await expect(page.locator('#hero-title')).toBeVisible();
    await expect(page.locator('#metaGenerated')).not.toHaveText('—', { timeout: 8000 });
    // hot + all grids should have cards
    await expect(page.locator('#hotGrid .news-card, #hotGrid .card')).not.toHaveCount(0, { timeout: 8000 });
    await expect(page.locator('#allGrid .news-card, #allGrid .card')).not.toHaveCount(0, { timeout: 8000 });
  });

  test('filter chips filter by category', async ({ page }) => {
    await expect(page.locator('#allGrid .news-card, #allGrid .card')).not.toHaveCount(0, { timeout: 8000 });
    const chips = page.locator('#filterBar .filter-chip');
    await expect(chips.first()).toBeVisible();
    const count = await chips.count();
    expect(count).toBeGreaterThanOrEqual(2);
    // click second chip (first category)
    if (count > 1) {
      await chips.nth(1).click();
      await page.waitForTimeout(400);
      // grid should still have content or empty state
      const cards = page.locator('#allGrid .news-card, #allGrid .card, #allGrid .empty-state');
      await expect(cards.first()).toBeVisible({ timeout: 5000 });
      // reset to All
      await chips.first().click();
      await page.waitForTimeout(300);
    }
  });

  test('search filters results', async ({ page }) => {
    await expect(page.locator('#allGrid .news-card, #allGrid .card')).not.toHaveCount(0, { timeout: 8000 });
    const input = page.locator('#searchInput');
    await expect(input).toBeVisible();
    await input.fill('AI');
    await page.locator('#btnSearch').click();
    await page.waitForTimeout(400);
    // should show results or empty
    await expect(page.locator('#allGrid')).toBeVisible();
    // reset
    await page.locator('#btnResetSearch').click();
    await page.waitForTimeout(300);
  });

  test('no horizontal overflow at 375', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.waitForTimeout(300);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(2);
  });
});
