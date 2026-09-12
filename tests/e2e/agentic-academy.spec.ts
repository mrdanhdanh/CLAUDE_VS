import { test, expect } from '@playwright/test';

/**
 * Agentic Academy — E2E evals (PRD §5 rubric → test)
 * Evidence → .agent/plans/agentic-academy/verify/
 *
 * RED trước (tdd-gate): 8 test phủ
 *  1. Home: hero + 7 cards + 0/7 + no pageerror + no 4xx/5xx (favicon data: URI nên 0 request lỗi)
 *  2. Home → card k1 → deck đúng bài
 *  3. Deck: N slides, counter, ArrowRight, End → slide outcome cuối
 *  4. Mark: aria-pressed → home chip "Đã học" + 1/7 → F5 giữ
 *  5. Reset: confirm accept → 0/7 + localStorage sạch
 *  6. Deep-link k3 + URL không slash không 404 (KN-040 dirBase)
 *  7. Responsive 375: 0 overflow ngang (home + deck) + fullscreen immersive fallback không pageerror
 *  8. Reduced-motion: nội dung hiện đủ, no pageerror (KN-031)
 *  9-10. Light theme: toggle persist + theo hệ thống + contrast ≥4.5 (KN-006)
 */

const SHOTS = '.agent/plans/agentic-academy/verify';
const KEY = 'agentic-academy:progress:v1';

function collectErrors(page: import('@playwright/test').Page) {
  const pageErrors: string[] = [];
  const badResponses: string[] = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  page.on('response', (r) => {
    if (r.status() >= 400) badResponses.push(`${r.status()} ${r.url()}`);
  });
  return { pageErrors, badResponses };
}

/** Contrast WCAG của text chính (.hero-sub) trên nền body — đo bằng công thức, không nhìn mắt (KN-023) */
async function bodyContrast(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const parse = (c: string) => (c.match(/\d+/g) || ['0', '0', '0']).slice(0, 3).map(Number);
    const lum = (c: string) => {
      const [r, g, b] = parse(c);
      const f = (v: number) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const el = document.querySelector('.hero-sub') as HTMLElement;
    const fg = getComputedStyle(el).color;
    const bg = getComputedStyle(document.body).backgroundColor;
    const hi = Math.max(lum(fg), lum(bg));
    const lo = Math.min(lum(fg), lum(bg));
    return (hi + 0.05) / (lo + 0.05);
  });
}

test('1. home — hero, 7 cards, 0/7, no errors', async ({ page }) => {
  const { pageErrors, badResponses } = collectErrors(page);
  await page.goto('/agentic-academy/');

  await expect(page.locator('#heroTitle')).toContainText('Agentic');
  await expect(page.locator('.lesson-card')).toHaveCount(7);
  await expect(page.locator('#progressText')).toContainText('0/7');
  await expect(page.locator('#progressBar')).toHaveAttribute('aria-valuenow', '0');
  await expect(page.locator('#continueBtn')).toBeVisible();
  await expect(page.locator('#sysTree')).toBeVisible();
  // prep chip — người mới biết cần chuẩn bị gì trước khi học
  await expect(page.locator('.hero-stats')).toContainText('1 project');

  // chống bug "vô hình sau animation" (base opacity 0 + fill backwards): sau khi animation xong phải opacity 1
  await page.waitForTimeout(1300);
  const cardOpacity = await page.locator('.lesson-card[data-lesson="k2"]').evaluate((el) => parseFloat(getComputedStyle(el).opacity));
  expect(cardOpacity).toBeGreaterThan(0.95);

  expect(pageErrors).toEqual([]);
  expect(badResponses).toEqual([]);
  await page.screenshot({ path: `${SHOTS}/home-1280.png`, fullPage: true });
});

test('2. home → card k1 → deck đúng bài', async ({ page }) => {
  await page.goto('/agentic-academy/');
  await page.locator('.lesson-card[data-lesson="k1"]').click();
  await page.waitForURL(/slides\.html\?lesson=k1/);

  await expect(page.locator('#deckTitle')).toContainText('Agentic AI');
  await expect(page.locator('.slide')).toHaveCount(await page.locator('.slide').count());
  expect(await page.locator('.slide').count()).toBeGreaterThanOrEqual(8);
});

test('3. deck — counter, ArrowRight, End → outcome', async ({ page }) => {
  const { pageErrors } = collectErrors(page);
  await page.goto('/agentic-academy/slides.html?lesson=k1');

  const total = await page.locator('.slide').count();
  await expect(page.locator('.slide.active')).toHaveCount(1);
  await expect(page.locator('#slideCounter')).toContainText(`1 / ${total}`);
  // aria-label pattern KN-040/cosmos: "1 trên N"
  await expect(page.locator('.slide.active')).toHaveAttribute('aria-label', `1 trên ${total}`);
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${SHOTS}/deck-k1-cover.png` });

  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#slideCounter')).toContainText(`2 / ${total}`);

  // slide 2 = "Trước khi bắt đầu" (chuẩn bị), slide 4 = diagram vòng lặp agent
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#slideCounter')).toContainText(`4 / ${total}`);
  await expect(page.locator('.slide.active .dg')).toBeVisible();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${SHOTS}/deck-k1-diagram.png` });

  await page.keyboard.press('End');
  await expect(page.locator('#slideCounter')).toContainText(`${total} / ${total}`);
  await expect(page.locator('.slide.active .outcome, .slide.active [data-outcome]')).toBeVisible();

  // nội dung outcome phải HIỆN ĐỦ sau animation (không tàng hình — fill backwards an toàn)
  await page.waitForTimeout(1100);
  const outcomeOpacity = await page.locator('.slide.active .outcome').evaluate((el) => parseFloat(getComputedStyle(el).opacity));
  expect(outcomeOpacity).toBeGreaterThan(0.95);

  expect(pageErrors).toEqual([]);
  await page.screenshot({ path: `${SHOTS}/deck-k1-outcome.png` });
});

test('4. mark đã học — persist qua F5, sync trang chủ', async ({ page }) => {
  await page.goto('/agentic-academy/slides.html?lesson=k1');
  await page.locator('#markBtn').click();
  await expect(page.locator('#markBtn')).toHaveAttribute('aria-pressed', 'true');

  const stored = await page.evaluate((k) => JSON.parse(localStorage.getItem(k) || '{}'), KEY);
  expect(stored.done?.k1).toBe(true);

  await page.goto('/agentic-academy/');
  await expect(page.locator('#progressText')).toContainText('1/7');
  await expect(page.locator('.lesson-card[data-lesson="k1"] .status-chip')).toContainText('Đã học');

  await page.reload();
  await expect(page.locator('#progressText')).toContainText('1/7');
  await page.screenshot({ path: `${SHOTS}/home-1of7.png`, fullPage: true });
});

test('5. reset — confirm → 0/7 + localStorage sạch', async ({ page }) => {
  await page.goto('/agentic-academy/');
  await page.evaluate((k) => localStorage.setItem(k, JSON.stringify({ v: 1, done: { k1: true, k2: true } })), KEY);
  await page.reload();
  await expect(page.locator('#progressText')).toContainText('2/7');

  page.on('dialog', (d) => d.accept());
  await page.locator('#resetBtn').click();
  await expect(page.locator('#progressText')).toContainText('0/7');

  const stored = await page.evaluate((k) => localStorage.getItem(k), KEY);
  expect(stored === null || JSON.parse(stored).done.k1 !== true).toBe(true);
});

test('6. deep-link k3 + URL không slash không 404 (KN-040)', async ({ page }) => {
  const { badResponses } = collectErrors(page);
  await page.goto('/agentic-academy/slides.html?lesson=k3');
  await expect(page.locator('#deckTitle')).toContainText('AGENTS.md');
  // chip "Cần trước" trên cover — biết bài này phụ thuộc bài nào
  await expect(page.locator('.slide.active')).toContainText('Cần trước');
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${SHOTS}/deck-k3-cover.png` });

  // URL không slash cuối → serve redirect → trang vẫn hoạt động, home link đúng
  await page.goto('/agentic-academy');
  await expect(page.locator('#heroTitle')).toBeVisible();
  const homeHref = await page.locator('#homeLink').getAttribute('href');
  expect(homeHref).toContain('index.html');
  expect(badResponses).toEqual([]);
});

test('7. 375px — no overflow + fullscreen fallback không lỗi', async ({ page }) => {
  const { pageErrors } = collectErrors(page);
  await page.setViewportSize({ width: 375, height: 780 });

  await page.goto('/agentic-academy/');
  let overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await page.screenshot({ path: `${SHOTS}/home-375.png`, fullPage: true });

  await page.goto('/agentic-academy/slides.html?lesson=k5');
  overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);

  await page.locator('#fsBtn').click();
  await expect(page.locator('body')).toHaveClass(/immersive/);
  await page.locator('#fsBtn').click();
  await expect(page.locator('body')).not.toHaveClass(/immersive/);

  expect(pageErrors).toEqual([]);
  await page.screenshot({ path: `${SHOTS}/deck-k5-375.png` });
});

test('8. reduced-motion — nội dung đủ, no pageerror', async ({ page }) => {
  const { pageErrors } = collectErrors(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });

  await page.goto('/agentic-academy/');
  await expect(page.locator('#heroTitle')).toBeVisible();
  await expect(page.locator('.lesson-card')).toHaveCount(7);

  await page.goto('/agentic-academy/slides.html?lesson=k2');
  const active = page.locator('.slide.active');
  await expect(active).toBeVisible();
  const opacity = await active.evaluate((el) => getComputedStyle(el).opacity);
  expect(parseFloat(opacity)).toBeGreaterThan(0.9); // hiện đủ, không tàng hình

  expect(pageErrors).toEqual([]);
});

test('9. theme — toggle sáng/tối + persist F5 + đồng bộ 2 trang', async ({ page }) => {
  const { pageErrors } = collectErrors(page);
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/agentic-academy/');
  await page.evaluate(() => localStorage.removeItem('agentic-academy:theme:v1'));
  await page.reload();

  // chưa chọn → theo hệ thống (dark)
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('#themeBtn')).toBeVisible();
  expect(await bodyContrast(page)).toBeGreaterThanOrEqual(4.5);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${SHOTS}/home-dark-1280.png`, fullPage: true });

  // toggle → light, F5 giữ
  await page.locator('#themeBtn').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

  // sang deck — cùng lựa chọn, toggle hoạt động ở đó
  await page.goto('/agentic-academy/slides.html?lesson=k1');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('#themeBtn')).toBeVisible();
  await page.locator('#themeBtn').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${SHOTS}/deck-k1-dark.png` });

  expect(pageErrors).toEqual([]);
});

test('10. light theme — mặc định theo hệ thống + contrast ≥4.5', async ({ page }) => {
  const { pageErrors } = collectErrors(page);
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/agentic-academy/');
  await page.evaluate(() => localStorage.removeItem('agentic-academy:theme:v1'));
  await page.reload();

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  expect(await bodyContrast(page)).toBeGreaterThanOrEqual(4.5);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${SHOTS}/home-light-1280.png`, fullPage: true });

  await page.goto('/agentic-academy/slides.html?lesson=k1');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${SHOTS}/deck-k1-light.png` });

  expect(pageErrors).toEqual([]);
});
