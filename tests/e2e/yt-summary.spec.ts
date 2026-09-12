/**
 * yt-summary.spec.ts — e2e trang YT Summary (www/yt-summary/)
 * Kiểm: render library + bảng tóm tắt, toggle vi/gốc, accordion, states, responsive 375/768/1280,
 * URL không slash cuối (KN-030/KN-040), không pageerror (KN-032).
 */
import { test, expect, type Page } from '@playwright/test';

const PAGE = '/yt-summary/index.html';

async function collectErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  return errors;
}

test.describe('yt-summary page', () => {
  test('load: library + demo card render, không lỗi console', async ({ page }) => {
    const errors = await collectErrors(page);
    await page.goto(PAGE);
    await expect(page.locator('h1')).toContainText('bảng tóm tắt');
    // library load từ data/index.json
    const cards = page.locator('.lib-card');
    await expect(cards.first()).toBeVisible({ timeout: 10_000 });
    expect(await cards.count()).toBeGreaterThanOrEqual(1);
    expect(errors).toEqual([]);
  });

  test('mở demo: bảng tóm tắt render đủ cột + chips + transcript', async ({ page }) => {
    const errors = await collectErrors(page);
    await page.goto(PAGE + '#demo-vector-db');
    await expect(page.locator('#result')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#resTitle')).toContainText(/Vector Databases/i);

    // polish: sau scrollIntoView, card không bị header cố định (56px) che
    await page.waitForTimeout(700);
    const rb = await page.locator('#result .result-card').boundingBox();
    expect(rb && rb.y).toBeGreaterThanOrEqual(48);

    // bảng: ≥3 hàng phần, có cột thời gian + tóm tắt
    const rows = page.locator('.seg-row');
    expect(await rows.count()).toBeGreaterThanOrEqual(3);
    await expect(rows.first().locator('.td-time')).toContainText(':');

    // chips nói thật về giới hạn: extractive + no AI key ở first screen
    await expect(page.locator('.hero-meta')).toContainText('extractive');
    await expect(page.locator('.hero-meta')).toContainText('không API key');
    await expect(page.locator('#resChips')).toContainText('lược');

    // transcript có nội dung sạch (không [music], không sponsor)
    const body = page.locator('#transcriptBody');
    await expect(body).not.toBeEmpty();
    const text = (await body.textContent()) || '';
    expect(text.toLowerCase()).not.toContain('[music]');
    expect(text.length).toBeGreaterThan(300);

    // dropped note hiển thị vùng sponsor
    await expect(page.locator('#droppedNote')).toContainText('sponsor');

    expect(errors).toEqual([]);
  });

  test('toggle vi ↔ bản gốc + accordion + copy button tồn tại', async ({ page }) => {
    await page.goto(PAGE + '#demo-vector-db');
    await expect(page.locator('#result')).toBeVisible();

    // mặc định vi (demo có bản dịch)
    await expect(page.locator('#langVi')).toHaveAttribute('aria-pressed', 'true');
    const viSummary = await page.locator('.seg-row').first().locator('.td-summary').textContent();

    await page.locator('#langSrc').click();
    await expect(page.locator('#langSrc')).toHaveAttribute('aria-pressed', 'true');
    const srcSummary = await page.locator('.seg-row').first().locator('.td-summary').textContent();
    expect(srcSummary).not.toBe(viSummary);
    expect(srcSummary || '').toMatch(/[a-zA-Z]{4}/); // bản gốc EN

    // accordion mở chi tiết transcript phần 1
    const firstToggle = page.locator('.seg-toggle').first();
    await expect(firstToggle).toHaveAttribute('aria-expanded', 'false');
    await firstToggle.click();
    await expect(firstToggle).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('.seg-detail:not([hidden])')).toHaveCount(1);

    // nút copy + select lọc phần
    await expect(page.locator('#btnCopySeg')).toBeVisible();
    const opts = page.locator('#segSelect option');
    expect(await opts.count()).toBeGreaterThanOrEqual(2); // "Tất cả" + các phần
  });

  test('state: link không hợp lệ → lỗi inline/toast, không nhảy trang', async ({ page }) => {
    await page.goto(PAGE);
    await page.locator('#urlInput').fill('https://example.com/khong-phai-youtube');
    await page.locator('#btnIssue').click();
    await expect(page.locator('#toast')).toContainText('không hợp lệ', { timeout: 3000 });
    expect(page.url()).toContain('/yt-summary/'); // không navigation
  });

  test('URL resolution (KN-030/KN-040): dirBase đúng cả 3 dạng URL + fetch 200', async ({ page }) => {
    await page.goto(PAGE);
    const r = await page.evaluate(async () => {
      const f = (window as unknown as { __ytTest: { dirBase: (p: string) => string } }).__ytTest.dirBase;
      const res = await fetch(f('/yt-summary') + 'data/index.json');
      return {
        noSlash: f('/yt-summary'),
        slash: f('/yt-summary/'),
        explicit: f('/yt-summary/index.html'),
        root: f('/index.html'),
        fetchOk: res.ok,
      };
    });
    // cả 3 dạng URL của trang đều resolve về cùng một base — fetch không bị 404
    expect(r.noSlash).toBe('/yt-summary/');
    expect(r.slash).toBe('/yt-summary/');
    expect(r.explicit).toBe('/yt-summary/');
    expect(r.root).toBe('/');
    expect(r.fetchOk).toBe(true);
  });

  test('responsive 375: không tràn ngang, bảng hiển thị (không bị ẩn), tap target đủ', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 720 });
    await page.goto(PAGE + '#demo-vector-db');
    await expect(page.locator('#result')).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);

    // regression: .table-wrap bị www/styles.css ẩn ở mobile → phải dùng class riêng và bảng vẫn hiện
    await expect(page.locator('.seg-row').first()).toBeVisible();
    const box = await page.locator('.seg-row').first().boundingBox();
    expect(box && box.height).toBeGreaterThan(20);
    // regression: global table{min-width:560px} làm text bị cắt trong card 375 → bảng phải vừa container
    const tableFit = await page.evaluate(() => {
      const t = document.querySelector('.yt-table') as HTMLElement;
      return t.scrollWidth - t.clientWidth;
    });
    expect(tableFit).toBeLessThanOrEqual(1);
    // detail transcript vẫn ẩn đến khi bấm (mobile CSS không được đè [hidden])
    await expect(page.locator('.seg-detail:not([hidden])')).toHaveCount(0);

    const btn = page.locator('#btnIssue');
    const b2 = await btn.boundingBox();
    expect(b2 && b2.height).toBeGreaterThanOrEqual(36);
  });

  test('responsive 768 + 1280: bảng giữ cấu trúc', async ({ page }) => {
    for (const w of [768, 1280]) {
      await page.setViewportSize({ width: w, height: 900 });
      await page.goto(PAGE + '#demo-vector-db');
      await expect(page.locator('#result')).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(1);
      const rows = page.locator('.seg-row');
      expect(await rows.count()).toBeGreaterThanOrEqual(3);
    }
  });

  test('a11y cơ bản: skip-link, aria-live status, toggle có aria-pressed', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('.skip-link')).toHaveAttribute('href', '#main');
    await expect(page.locator('#dispatchStatus')).toHaveAttribute('aria-live', 'polite');
    await expect(page.locator('#libraryList')).toHaveAttribute('aria-live', 'polite');
    await expect(page.locator('#langVi')).toHaveAttribute('aria-pressed');
  });
});
