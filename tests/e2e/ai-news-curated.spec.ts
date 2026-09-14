import { test, expect, type Locator } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

// Curated mirror (KN-051/KN-052) — curated.json merge vào feed, pinned đầu, theo đúng file order.
// Không sửa ai-news.spec.ts (spec cũ giữ nguyên — KN-012); spec này khoá invariants mới.
// 2026-09-14 (human takeover "làm cả 2"): pin cũ (Axios/Pluralistic) drift khi curated.json đổi thứ tự
// → assert lấy chính curated.json làm nguồn sự thật (KN-056: guard khoá invariant, không khoá instance).
const curated = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'www', 'ai-news', 'curated.json'), 'utf8'));
const curatedIds: string[] = curated.articles.map((a: { id: string }) => a.id);
const curatedHotIds: string[] = curated.articles
  .filter((a: { hot?: boolean }) => a.hot)
  .map((a: { id: string }) => a.id);

const readCardIds = (locator: Locator, n: number) =>
  locator.evaluateAll((els, count) => els.slice(0, count).map(el => (el as HTMLElement).dataset.id || ''), n);

test.describe('AI News — curated mirror', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ai-news/');
  });

  test('curated render đầu feed, đúng thứ tự curated.json', async ({ page }) => {
    const cards = page.locator('#allGrid .news-card');
    await expect(cards.first()).toBeVisible({ timeout: 8000 });
    expect(curatedIds.length).toBeGreaterThan(0);
    expect(await readCardIds(cards, curatedIds.length)).toEqual(curatedIds);
  });

  test('curated link nguồn đúng + hot curated có trong hot section', async ({ page }) => {
    const firstLink = page.locator('#allGrid .news-card').first().locator('h3 a');
    await expect(firstLink).toHaveAttribute('href', curated.articles[0].sourceUrl);
    const hotGrid = page.locator('#hotGrid .news-card');
    await expect(hotGrid.first()).toBeVisible({ timeout: 8000 });
    expect(curatedHotIds.length).toBeGreaterThan(0);
    expect(await readCardIds(hotGrid, curatedHotIds.length)).toEqual(curatedHotIds);
  });

  test('chip category có đếm bài curated', async ({ page }) => {
    const safetyCount = curated.articles.filter((a: { category: string }) => a.category === 'safety').length;
    const count = page.locator('.filter-chip[data-filter="safety"] .count');
    await expect(count).toBeVisible({ timeout: 8000 });
    const n = parseInt((await count.textContent()) || '0', 10);
    expect(n).toBeGreaterThanOrEqual(safetyCount);
  });
});
