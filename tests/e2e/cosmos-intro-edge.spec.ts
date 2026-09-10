import { test, expect } from '@playwright/test';

/**
 * Diagnostic + regression: intro COSMOS trên Edge THẬT (channel: msedge).
 * User report: "phone thấy hiệu ứng, Edge PC không thấy".
 * - Test 1: Edge default — intro phải chạy đầy đủ, canvas vẽ hạt, không lỗi console.
 * - Test 2: Edge + prefers-reduced-motion (Windows "Animation effects" tắt) — đo bản rút gọn.
 *
 * Chạy: npx playwright test tests/e2e/cosmos-intro-edge.spec.ts --reporter=list
 * Evidence → .agent/plans/cosmos-intro/verify/
 */

const PAGE = '/cosmos/index.html';
const SHOTS = '.agent/plans/cosmos-intro/verify';

test.use({ channel: 'msedge' });

test.describe('COSMOS intro @ real Edge', () => {
  test.beforeEach(async ({ page }) => {
    // Stub fonts để deterministic (không phụ thuộc CDN)
    await page.route(/fonts\.(googleapis|gstatic)\.com/, route =>
      route.fulfill({ status: 200, contentType: 'text/css', body: '' })
    );
  });

  test('Edge default: intro chạy đầy đủ + canvas vẽ hạt + không lỗi console', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push('[console] ' + m.text()); });
    page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));

    await page.goto(PAGE);

    const reduced = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
    console.log('[EDGE] prefers-reduced-motion =', reduced);

    const intro = page.locator('#intro');
    await expect(intro).toBeVisible();

    // Canvas phải có kích thước thật (không bị 300×150 mặc định — KN-028)
    const canvasSize = await page.evaluate(() => {
      const c = document.getElementById('introCanvas') as HTMLCanvasElement;
      return { w: c.width, h: c.height, cw: c.clientWidth, ch: c.clientHeight };
    });
    expect(canvasSize.w).toBe(canvasSize.cw);
    expect(canvasSize.h).toBe(canvasSize.ch);
    console.log('[EDGE] canvas buffer =', canvasSize.w, 'x', canvasSize.h);

    // Đợi burst nổ + hạt vẽ — POLL thay vì wall-clock cố định (Edge cold-start timing khác nhau;
    // hạt sống từ ~0.85s đến ~3.4s của timeline, đo cố định sẽ miss trên máy chậm)
    const countPixels = () => page.evaluate(() => {
      const c = document.getElementById('introCanvas') as HTMLCanvasElement;
      const ctx = c.getContext('2d')!;
      const d = ctx.getImageData(0, 0, c.width, c.height).data;
      let n = 0;
      for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++;
      return n;
    });
    await expect.poll(countPixels, { timeout: 6000, intervals: [150, 250, 400] })
      .toBeGreaterThan(0);
    const painted = await countPixels();
    console.log('[EDGE] painted pixels =', painted);

    await page.screenshot({ path: `${SHOTS}/edge-1280-burst.png` });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${SHOTS}/edge-1280-title.png` });

    // Auto-reveal hoàn tất
    await expect(intro).toBeHidden({ timeout: 9000 });
    expect(errors, 'Edge không được có lỗi console/pageerror').toEqual([]);
  });

  test('Edge + reduced-motion (Windows tắt animation): ĐO bản rút gọn — user thấy gì?', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(PAGE);
    const intro = page.locator('#intro');
    await expect(intro).toBeVisible();

    // Đo xem sau 1s user thấy gì (bản nhẹ: fade dần vào)
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SHOTS}/edge-reduced-1s.png` });
    await page.waitForTimeout(1400);
    await page.screenshot({ path: `${SHOTS}/edge-reduced-2.4s.png` });

    // Hint phải nói rõ lý do (tránh tưởng "trang không có hiệu ứng" — KN-031)
    await expect(page.locator('.intro-hint')).toContainText(/giảm chuyển động/i);

    const t0 = Date.now();
    await expect(intro).toBeHidden({ timeout: 8000 });
    console.log('[EDGE-reduced] intro tự mở sau ~', Date.now() - t0 + 2400, 'ms từ lúc load');
  });
});
