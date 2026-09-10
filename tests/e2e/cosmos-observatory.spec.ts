import { test, expect } from '@playwright/test';

/**
 * COSMOS Observatory — audit chain phải đọc dữ liệu THẬT trên Pages.
 * Bug gốc (user report): fetch('../../.agent/audit.jsonl') → 404 trên GitHub Pages
 * (Pages chỉ deploy www/, không có .agent/) → observatory rơi về demo + console đỏ.
 * Fix: mirror www/cosmos/audit.json (generate-status.mjs) — fetch relative './audit.json'.
 *
 * Evidence → .agent/plans/cosmos-observatory/verify/
 */

const SHOTS = '.agent/plans/cosmos-observatory/verify';

test('observatory đọc audit.json thật — không 404 ra ngoài www/', async ({ page }) => {
  const notFound: string[] = [];
  const dataResponses: Array<{ url: string; status: number }> = [];
  page.on('response', (r) => {
    if (r.status() === 404) notFound.push(r.url());
    if (r.url().includes('audit.json') || r.url().includes('scale.json')) {
      dataResponses.push({ url: r.url(), status: r.status() });
    }
  });

  await page.goto('/cosmos/index.html');

  // Tắt intro trước — observatory nằm dưới overlay intro
  await page.keyboard.press('Escape');
  await expect(page.locator('#intro')).toBeHidden({ timeout: 3000 });

  // Badge phải thoát 'loading' và hiện dữ liệu thật (trước fix: 'demo')
  const badge = page.locator('#chainBadge');
  await expect(badge).not.toHaveClass(/loading/, { timeout: 8000 });
  await expect(badge).toContainText('thật');

  // Mirror công khai phải load 200
  const mirror = dataResponses.find((r) => r.url.includes('/cosmos/audit.json'));
  expect(mirror, 'phải fetch ./audit.json (mirror công khai)').toBeTruthy();
  expect(mirror!.status).toBe(200);

  // Dark Energy — scale.json cũng phải là dữ liệu thật (cùng bug class fetch relative)
  await expect(page.locator('#deBadge')).toContainText('thật', { timeout: 8000 });
  const scaleResp = dataResponses.find((r) => r.url.includes('/cosmos/scale.json'));
  expect(scaleResp, 'phải fetch ./scale.json').toBeTruthy();
  expect(scaleResp!.status).toBe(200);

  // KHÔNG được có bất kỳ 404 nào trỏ vào .agent (bug user report)
  expect(notFound.filter((u) => u.includes('.agent'))).toHaveLength(0);

  // Chain rows render từ data thật
  await expect(page.locator('#chainList .chain-row').first()).toBeVisible();

  // Evidence
  await badge.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${SHOTS}/observatory-real-chain.png` });
});
