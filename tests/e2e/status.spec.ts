import { test, expect } from '@playwright/test';

test.describe('STATUS — YUNIE dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('loads status.json and renders hero + stats', async ({ page }) => {
    await expect(page.locator('#hero-title')).toBeVisible();
    await expect(page.locator('#metaGenerated')).not.toHaveText('—', { timeout: 8000 });
    // stats should render 5 items
    await expect(page.locator('#stats .stat')).toHaveCount(5, { timeout: 8000 });
    // each stat has progress bar
    const firstStat = page.locator('#stats .stat').first();
    await expect(firstStat.locator('.progress i')).toBeVisible();
  });

  test('registry renders and search filters', async ({ page }) => {
    // wait for registry to load
    await expect(page.locator('#registryBody tr')).not.toHaveCount(0, { timeout: 8000 });
    const initialRows = await page.locator('#registryBody tr').count();
    expect(initialRows).toBeGreaterThan(5);

    // search filter
    const search = page.locator('#registrySearch');
    await expect(search).toBeVisible();
    await search.fill('harness');
    await page.waitForTimeout(300);
    const filtered = await page.locator('#registryBody tr').count();
    // should filter down (or show empty state)
    // either filtered < initial or empty message visible
    const emptyVisible = await page.locator('#registryEmpty').isVisible().catch(() => false);
    expect(filtered < initialRows || emptyVisible).toBeTruthy();

    // clear search
    await search.fill('');
    await page.waitForTimeout(300);
    await expect(page.locator('#registryBody tr')).toHaveCount(initialRows);
  });

  test('filter pills work', async ({ page }) => {
    await expect(page.locator('#registryBody tr')).not.toHaveCount(0, { timeout: 8000 });
    const skillPill = page.locator('#registryFilter [data-filter="skill"]');
    await expect(skillPill).toBeVisible();
    await skillPill.click();
    await page.waitForTimeout(300);
    // should show only skills or empty
    const rows = page.locator('#registryBody tr');
    const count = await rows.count();
    if (count > 0) {
      // check first row type is skill
      const firstType = await rows.first().locator('td').first().textContent();
      expect(firstType?.toLowerCase()).toContain('skill');
    }
    // reset to all
    await page.locator('#registryFilter [data-filter="all"]').click();
    await page.waitForTimeout(300);
  });

  test('quick pages grid has 9+ cards', async ({ page }) => {
    const count = await page.locator('.quick-grid .quick-card').count();
    expect(count).toBeGreaterThanOrEqual(9);
  });

  test('no horizontal overflow at 375', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.waitForTimeout(300);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(2);
  });
});
