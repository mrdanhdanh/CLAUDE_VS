import { test, expect } from '@playwright/test';

/**
 * COSMOS Intro Cinematic — verify (Harness v2, KN-003: đo bằng tool, không nhìn mắt)
 * - Che kín viewport (elementFromPoint 4 góc + tâm)
 * - Auto-reveal sau timeline
 * - Skip: nút / Esc / click
 * - reduced-motion: bản tĩnh, reveal nhanh
 * - Responsive 375/768: không tràn, skip luôn bấm được
 * Evidence screenshots → .agent/plans/cosmos-intro/verify/
 */

const PAGE = '/cosmos/index.html';
const SHOTS = '.agent/plans/cosmos-intro/verify';

// Stub Google Fonts (render-blocking external) → test deterministic, không phụ thuộc CDN timing
test.beforeEach(async ({ page }) => {
  await page.route(/fonts\.(googleapis|gstatic)\.com/, route =>
    route.fulfill({ status: 200, contentType: 'text/css', body: '' })
  );
});

test.describe('COSMOS intro', () => {
  test('che kín viewport + có nút skip + khoá scroll + nền inert', async ({ page }) => {
    await page.goto(PAGE);
    const intro = page.locator('#intro');
    await expect(intro).toBeVisible();

    // Overlay phủ kín: 4 góc + tâm đều thuộc #intro
    const covered = await page.evaluate(() => {
      const pts: Array<[number, number]> = [
        [8, 8], [innerWidth - 8, 8], [8, innerHeight - 8],
        [innerWidth - 8, innerHeight - 8], [innerWidth / 2, innerHeight / 2],
      ];
      return pts.every(([x, y]) => {
        const el = document.elementFromPoint(x, y);
        return !!el && !!el.closest('#intro');
      });
    });
    expect(covered, 'overlay phải che kín viewport').toBe(true);

    // Scroll bị khoá khi intro chạy
    const locked = await page.evaluate(() => getComputedStyle(document.documentElement).overflow === 'hidden');
    expect(locked, 'html phải overflow:hidden khi intro chạy').toBe(true);

    // Nền bị inert (a11y)
    const bgInert = await page.evaluate(() => (document.querySelector('#main') as HTMLElement).inert === true);
    expect(bgInert, '#main phải inert khi intro chạy').toBe(true);

    // Nút skip hiện & bấm được
    await expect(page.locator('#introSkip')).toBeVisible();

    // Canvas buffer phải khớp kích thước hiển thị (bug: quên resize() → 300×150 mặc định → burst từ góc)
    const canvasSize = await page.evaluate(() => {
      const c = document.getElementById('introCanvas') as HTMLCanvasElement;
      return { w: c.width, h: c.height, cw: c.clientWidth, ch: c.clientHeight };
    });
    expect(canvasSize.w).toBe(canvasSize.cw);
    expect(canvasSize.h).toBe(canvasSize.ch);

    await page.screenshot({ path: `${SHOTS}/intro-1280-early.png` });
    await page.waitForTimeout(1600); // stage title + sub
    await page.screenshot({ path: `${SHOTS}/intro-1280-title.png` });
  });

  test('auto-reveal sau khi chạy xong timeline', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('html')).toHaveClass(/intro-on/);
    await expect(page.locator('#intro')).toBeHidden({ timeout: 9000 });
    await expect(page.locator('html')).not.toHaveClass(/intro-on/);

    // Scroll mở lại + nền hết inert + nội dung hiện
    const state = await page.evaluate(() => ({
      locked: getComputedStyle(document.documentElement).overflow === 'hidden',
      inert: (document.querySelector('#main') as HTMLElement).inert === true,
    }));
    expect(state.locked).toBe(false);
    expect(state.inert).toBe(false);
    await expect(page.locator('#hero-title')).toBeVisible();
    await page.screenshot({ path: `${SHOTS}/intro-1280-revealed.png` });
  });

  test('skip bằng nút → reveal ngay', async ({ page }) => {
    await page.goto(PAGE);
    await page.locator('#introSkip').click();
    await expect(page.locator('#intro')).toBeHidden({ timeout: 2000 });
    await expect(page.locator('html')).not.toHaveClass(/intro-on/);
  });

  test('skip bằng Esc', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('#intro')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#intro')).toBeHidden({ timeout: 2000 });
  });

  test('skip bằng click bất kỳ đâu (sau grace period 1000ms)', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('#intro')).toBeVisible();
    await page.waitForTimeout(1200); // qua grace period chống click nhầm (PC: click focus cửa sổ)
    await page.mouse.click(240, 560);
    await expect(page.locator('#intro')).toBeHidden({ timeout: 2000 });
  });

  test('fonts CDN treo vĩnh viễn → engine vẫn chạy ngay (regression KN-029: stylesheet không được block script)', async ({ page }) => {
    // Giả lập môi trường VS Code preview / mạng chậm: Google Fonts request treo mãi không trả
    await page.route(/fonts\.googleapis\.com/, () => new Promise<never>(() => {}));
    await page.route(/fonts\.gstatic\.com/, () => new Promise<never>(() => {}));
    await page.goto(PAGE, { waitUntil: 'domcontentloaded' });

    // Engine phải chạy NGAY dù font treo: chars được inject + .play xuất hiện (trước fix: treo tới khi font load = đứng hình)
    await expect(page.locator('.intro-char').first()).toBeAttached({ timeout: 3000 });
    await expect(page.locator('#intro')).toHaveClass(/play/, { timeout: 3000 });

    // Sau 2.4s: title hiện đầy đủ bằng fallback font — intro không phụ thuộc CDN
    await page.waitForTimeout(2400);
    await page.screenshot({ path: `${SHOTS}/intro-1280-hung-fonts.png` });

    // Vẫn skip được bình thường
    await page.keyboard.press('Escape');
    await expect(page.locator('#intro')).toBeHidden({ timeout: 2000 });
  });

  test('reduced-motion → bản nhẹ (chỉ opacity), có hint giải thích, reveal ~3.5s', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(PAGE);
    const intro = page.locator('#intro');
    await expect(intro).toBeVisible();

    const decor = await page.evaluate(() => {
      const d = (s: string) => getComputedStyle(document.querySelector(s) as Element).display;
      return { canvas: d('#introCanvas'), flash: d('.intro-flash'), core: d('.intro-core') };
    });
    expect(decor.canvas).toBe('none');
    expect(decor.flash).toBe('none');
    expect(decor.core).toBe('none');

    // Char fade nhẹ (opacity-only) — chờ qua stagger rồi đo
    await page.waitForTimeout(1500);
    const charOpacity = await page.evaluate(
      () => parseFloat(getComputedStyle(document.querySelector('.intro-char') as Element).opacity)
    );
    expect(charOpacity).toBeGreaterThan(0.9);

    // Hint phải nói rõ vì sao bản nhẹ (tránh user tưởng "trang không có hiệu ứng" — KN-031)
    await expect(page.locator('.intro-hint')).toContainText(/giảm chuyển động/i);

    await expect(intro).toBeHidden({ timeout: 6000 });
  });
});

test.describe('COSMOS intro responsive', () => {
  for (const w of [375, 768]) {
    test(`@${w} — không tràn ngang, skip trong viewport`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: w === 375 ? 667 : 900 });
      await page.goto(PAGE);
      await expect(page.locator('#intro')).toBeVisible();

      const titleBox = await page.locator('.intro-title').boundingBox();
      expect(titleBox).toBeTruthy();
      expect(titleBox!.x).toBeGreaterThanOrEqual(0);
      expect(titleBox!.x + titleBox!.width).toBeLessThanOrEqual(w + 1);

      const skipBox = await page.locator('#introSkip').boundingBox();
      expect(skipBox).toBeTruthy();
      expect(skipBox!.x + skipBox!.width).toBeLessThanOrEqual(w + 1);

      await page.waitForTimeout(1800);
      await page.screenshot({ path: `${SHOTS}/intro-${w}.png` });
    });
  }
});
