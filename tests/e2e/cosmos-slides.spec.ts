import { test, expect } from '@playwright/test';

/**
 * Slides refresh — clip 15 slide khớp trạng thái thật 2026-09-12:
 * - 15 slide, aria-label "N trên 15" (hết stale "trên 12" từ thời 12 slide)
 * - Lab slide #11 eyebrow hiển thị đúng số "11 ·" (hết số cũ "08 ·")
 * - Tổng thời lượng 15 × 6s = 01:30 (hết placeholder "01:12")
 * - Slide 15 "Tương lai": dòng "Đã ship & gỡ khỏi backlog" + 6 đề tài mới
 *   (đồng bộ index.html#future-title sau commit 125ffc5), hết "Multiverse picker"
 * Evidence → .agent/plans/cosmos-slides-refresh/verify/
 */

const SHOTS = '.agent/plans/cosmos-slides-refresh/verify';

test('slides — 15 slide, numbering + thời lượng 01:30', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('/cosmos/slides.html');
  await page.waitForTimeout(400);

  await expect(page.locator('.slide')).toHaveCount(15);
  // không còn "trên 12" — mọi slide phải là "N trên 15"
  await expect(page.locator('.slide[aria-label$="trên 15"]')).toHaveCount(15);

  // tổng thời lượng = 15 × 6s = 01:30 (timeLabel + stageTime)
  await expect(page.locator('#timeLabel')).toContainText('/ 01:30');
  await expect(page.locator('#stageTime')).toContainText('/ 01:30');
  await expect(page.locator('#stageBadge')).toContainText('01 / 15');

  expect(errors).toEqual([]);
  await page.screenshot({ path: `${SHOTS}/slides-01.png` });
});

test('slide 11 — eyebrow "11 ·", hết số cũ "08 ·"', async ({ page }) => {
  await page.goto('/cosmos/slides.html#slide-11');
  await page.waitForTimeout(400);
  const eyebrow = page.locator('#s8 .eyebrow');
  await expect(eyebrow).toContainText('11 · Lab — Superposition & Entanglement');
  await expect(eyebrow).not.toContainText('08 ·');
});

test('slide 15 — "Đã ship" + 6 đề tài mới, hết Multiverse picker', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('/cosmos/slides.html#slide-15');
  await page.waitForTimeout(400);
  const slide = page.locator('#s12');

  await expect(slide).toContainText('Đã ship');
  for (const topic of ['Cosmic Web', 'Hawking', 'CMB', 'LIGO', 'Quantum Error Correction', 'Wormhole']) {
    await expect(slide).toContainText(topic);
  }
  await expect(slide.locator('.eta-chip')).toHaveCount(6);
  await expect(slide).not.toContainText('Multiverse picker');

  expect(errors).toEqual([]);
  await page.screenshot({ path: `${SHOTS}/slides-15.png` });
});
