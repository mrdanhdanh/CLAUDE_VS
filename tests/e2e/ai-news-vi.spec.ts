import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

// AI News — dịch mô tả ngắn sang tiếng Việt (chain clients5 → MyMemory, KN-041).
// Guard (KN-056): mock clients5 để deterministic — không gọi mạng thật, không phụ thuộc quota.
// Spec cũ giữ nguyên (KN-012) — invariants mới khoá ở file này.
// 2026-09-14 (human takeover "làm cả 2"): pin cũ 'Amodei' drift khi curated.json đổi head
// → derive card đầu từ curated.json (nguồn sự thật), không pin instance (KN-056).

const MOCK_VI = 'Bản dịch thử nghiệm YUNIE';
const curatedFirstId: string = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'www', 'ai-news', 'curated.json'), 'utf8')
).articles[0].id;

const mockClients5 = (page: import('@playwright/test').Page) =>
  page.route(/clients5\.google\.com/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([[MOCK_VI, 'en']]),
    })
  );

test.describe('AI News — summary tiếng Việt', () => {
  test('mock clients5 → card swap sang VI + data-vi + giữ bản gốc trong title', async ({ page }) => {
    await mockClients5(page);
    await page.goto('/ai-news/');
    const viSummary = page.locator('.news-summary[data-vi="1"]').first();
    await expect(viSummary).toContainText(MOCK_VI, { timeout: 15000 });
    await expect(viSummary).toHaveAttribute('title', /Bản gốc:/);
  });

  test('curated (đã tiếng Việt) không bị dịch lại', async ({ page }) => {
    await mockClients5(page);
    await page.goto('/ai-news/');
    const firstCard = page.locator('#allGrid .news-card').first();
    await expect(firstCard).toBeVisible({ timeout: 8000 });
    await expect(firstCard).toHaveAttribute('data-id', curatedFirstId);
    const summary = firstCard.locator('.news-summary');
    await expect(summary).not.toHaveAttribute('data-vi', '1');
    await expect(summary).not.toContainText(MOCK_VI);
  });
});
