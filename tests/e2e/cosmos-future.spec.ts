import { test, expect } from '@playwright/test';

/**
 * Future Roads — section "Khai thác tương lai" chỉ chứa đề tài CHƯA làm:
 * - gỡ toàn bộ card ✅ Done (đã ship) để danh sách giữ tính "tương lai"
 * - còn ≥6 đề tài mới, mỗi đề tài có ETA
 * - 2026-09-12: QEC shipped (Lab #12) → Light Echo; Cosmic Web → Gravitational Lensing; Hawking → Escape Velocity; Escape Velocity shipped (cosmic-scale --trend gate); CMB Anisotropy shipped (stats --heatmap + #cmb, 2026-09-12) → còn 4 đề tài; section có id="future" (fix scroll-dot chết)
 * - 2026-09-12 bổ sung Supernova (mutation thật) + Event Horizon Lock (khóa verifier) → 6 đề tài.
 * Evidence → .agent/plans/cosmos-future-roads/verify/
 */

const SHOTS = '.agent/plans/cosmos-future-roads/verify';

test('future section — 6 đề tài mới, không còn card Done', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('/cosmos/index.html');
  await page.keyboard.press('Escape');
  await expect(page.locator('#intro')).toBeHidden({ timeout: 3000 });

  const section = page.locator('section[aria-labelledby="future-title"]');
  const cards = section.locator('.future-card');
  await expect(cards).toHaveCount(6);
  // counter sống cùng danh sách — 9 hướng đã ship (QEC/Cosmic Web/Hawking/Escape Velocity/CMB...), còn 6
  await expect(section).toContainText('9 hướng cũ đã ship');
  await expect(section).toContainText('còn 6 đề tài');

  // đã gỡ hết card đã-xong: không tag Done, không chữ "✅ Done"
  await expect(section.locator('.future-card .tag')).toHaveCount(0);
  await expect(section).not.toContainText('✅ Done');

  // đề tài mới phải xuất hiện
  await expect(section).toContainText('LIGO');
  await expect(section).toContainText('Light Echo');
  await expect(section).toContainText('Wormhole');
  await expect(section).toContainText('Gravitational Lensing');
  await expect(section).toContainText('Supernova');
  await expect(section).toContainText('Event Horizon Lock');
  // Escape Velocity đã ship (cosmic-scale --trend gate, 2026-09-12) → rời danh sách "chưa làm"
  await expect(section).not.toContainText('Escape Velocity');
  // Hawking đã ship (watchdog nợ bay hơi, 2026-09-12) → rời danh sách "chưa làm"
  await expect(section).not.toContainText('Hawking');
  // Cosmic Web đã ship (entangle --graph, 2026-09-12) → rời danh sách "chưa làm"
  await expect(section).not.toContainText('Cosmic Web');
  // QEC đã ship thành Lab #12 (2026-09-12) → rời danh sách "chưa làm"
  await expect(section).not.toContainText('Quantum Error Correction');
  // CMB Anisotropy đã ship (stats --heatmap + #cmb trên scale.html, 2026-09-12) → rời danh sách "chưa làm"
  await expect(section).not.toContainText('CMB');
  // mỗi card có ETA
  await expect(section.locator('.future-card .eta')).toHaveCount(6);

  expect(errors).toEqual([]);

  await section.scrollIntoViewIfNeeded();
  await page.waitForTimeout(900); // chờ reveal animation (.reveal .6s) hoàn tất trước khi chụp evidence
  await page.screenshot({ path: `${SHOTS}/future-roads.png` });
});
