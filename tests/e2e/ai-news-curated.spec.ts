import { test, expect } from '@playwright/test';

// Curated mirror (KN-051/KN-052) — curated.json merge vào feed, pinned đầu.
// Không sửa ai-news.spec.ts (spec cũ giữ nguyên — KN-012); spec này khoá invariants mới.
test.describe('AI News — curated mirror', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ai-news/');
  });

  test('curated pinned đầu feed: Axios pacing + Pluralistic AI-fake', async ({ page }) => {
    const cards = page.locator('#allGrid .news-card');
    await expect(cards.first()).toBeVisible({ timeout: 8000 });
    await expect(cards.nth(0)).toContainText('slowdown in AI development');
    await expect(cards.nth(1)).toContainText('AI is fake');
  });

  test('curated link nguồn đúng + xuất hiện trong hot section', async ({ page }) => {
    const firstLink = page.locator('#allGrid .news-card').first().locator('a');
    await expect(firstLink).toHaveAttribute('href', 'https://www.axios.com/2026/09/12/anthropic-ai-amodei-pacing');
    const hotGrid = page.locator('#hotGrid .news-card');
    await expect(hotGrid.first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator('#hotGrid')).toContainText('AI is fake');
  });

  test('chip Safety đếm cả 2 bài curated (>= 2)', async ({ page }) => {
    const count = page.locator('.filter-chip[data-filter="safety"] .count');
    await expect(count).toBeVisible({ timeout: 8000 });
    const n = parseInt((await count.textContent()) || '0', 10);
    expect(n).toBeGreaterThanOrEqual(2);
  });
});
