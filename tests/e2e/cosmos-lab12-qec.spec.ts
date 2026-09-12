import { test, expect, type Locator, type Page } from '@playwright/test';

/**
 * COSMOS Lab #12 — Quantum Error Correction (upgrade 2026-09-12):
 *  - 12 lab card (thêm lab thứ 12: bit-flip → syndrome → fix gốc)
 *  - luồng chuẩn: inject → ĐO syndrome (FAIL + file:line) → fix gốc → GREEN, fidelity 100%
 *  - reward hacking: "sửa test cho pass" → ⛔ REFUSED (deny-test-mutate, KN-012)
 *  - 3-fix limit: 3 workaround → 🌑 Event horizon → human takeover (inject bị chặn tới khi Reset)
 *  - bug fix: section tương lai thiếu id="future" → scroll-dot "Tương lai" chết (getElementById null)
 *  - 375: lab card visible, không tràn ngang, không pageerror/console error (KN-032)
 * Evidence → .agent/plans/cosmos-lab12-qec/verify/
 */

const SHOTS = '.agent/plans/cosmos-lab12-qec/verify';

async function prep(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push('console: ' + m.text());
  });
  await page.goto('/cosmos/index.html');
  await page.keyboard.press('Escape');
  await expect(page.locator('#intro')).toBeHidden({ timeout: 3000 });
  return errors;
}

/** Evidence: scroll tới element + chờ reveal xong (opacity 1) rồi mới chụp — tránh ảnh trắng. */
async function shoot(locator: Locator, path: string) {
  await locator.scrollIntoViewIfNeeded();
  await expect
    .poll(() => locator.evaluate((el) => getComputedStyle(el).opacity), { timeout: 5000 })
    .toBe('1');
  await locator.screenshot({ path });
}

test('Lab #12 — card QEC tồn tại, tổng 12 lab', async ({ page }) => {
  const errors = await prep(page);
  await expect(page.locator('#lab .lab-card')).toHaveCount(12);

  const card = page.locator('#lab .lab-card').filter({ has: page.locator('#btnQecInject') });
  await expect(card).toHaveCount(1);
  await expect(card).toContainText('Quantum Error Correction');
  await expect(card.locator('.lab-badge')).toContainText('KN-012');
  await expect(card.locator('.qec-tile')).toHaveCount(3);

  // copy section head đã sync 12 thí nghiệm
  await expect(page.locator('#lab .section-head p')).toContainText('12 thí nghiệm');

  expect(errors).toEqual([]);
  await shoot(card, `${SHOTS}/lab-12-card.png`);
});

test('Lab #12 — luồng chuẩn: inject → syndrome → fix gốc → GREEN', async ({ page }) => {
  const errors = await prep(page);
  const log = page.locator('#qecLog');
  const tile = page.locator('#lab .qec-tile');

  await page.locator('#btnQecInject').scrollIntoViewIfNeeded();
  await page.locator('#btnQecInject').click();
  await expect(log).toContainText('⚛️ bit-flip');
  await expect(tile.filter({ hasText: 'bit-flip' })).toHaveCount(1);
  await expect(page.locator('#qecState')).toContainText('chưa đo');

  // chưa đo mà fix = đoán → không được đổi trạng thái
  await page.locator('#btnQecFix').click();
  await expect(log).toContainText('đo syndrome trước');
  await expect(tile.filter({ hasText: 'bit-flip' })).toHaveCount(1);

  await page.locator('#btnQecMeasure').click();
  await expect(log).toContainText('FAIL');
  await expect(log).toContainText(/\.cs:\d+/); // syndrome chỉ đúng file:line
  await expect(log).toContainText('syndrome');

  await page.locator('#btnQecFix').click();
  await expect(log).toContainText('✅ GREEN');
  await expect(tile.filter({ hasText: 'bit-flip' })).toHaveCount(0);
  await expect(page.locator('#qecFidVal')).toContainText('100%');
  await expect(page.locator('#qecState')).toContainText('GREEN');

  expect(errors).toEqual([]);
  await shoot(page.locator('#lab .lab-card').filter({ has: page.locator('#btnQecInject') }), `${SHOTS}/lab-12-green.png`);
});

test('Lab #12 — reward hacking bị chặn (deny-test-mutate)', async ({ page }) => {
  const errors = await prep(page);
  const log = page.locator('#qecLog');

  await page.locator('#btnQecInject').scrollIntoViewIfNeeded();
  await page.locator('#btnQecInject').click();
  await page.locator('#btnQecMeasure').click();
  await page.locator('#btnQecTest').click();

  await expect(log).toContainText('⛔ REFUSED');
  await expect(log).toContainText('deny-test-mutate');
  // lỗi vẫn còn nguyên — sửa test không chữa được production bug
  await expect(page.locator('#lab .qec-tile').filter({ hasText: 'bit-flip' })).toHaveCount(1);
  await expect(page.locator('#qecStats')).toContainText('chặn');

  expect(errors).toEqual([]);
});

test('Lab #12 — 3-fix limit → Event horizon → takeover, Reset mở lại', async ({ page }) => {
  const errors = await prep(page);
  const log = page.locator('#qecLog');

  await page.locator('#btnQecInject').scrollIntoViewIfNeeded();
  await page.locator('#btnQecInject').click();
  for (let i = 0; i < 3; i++) await page.locator('#btnQecWorkaround').click();

  await expect(log).toContainText('🩹 workaround');
  await expect(log).toContainText('🌑 Event horizon');
  await expect(log).toContainText('takeover');
  await expect(page.locator('#qecState')).toContainText('takeover');

  // qua event horizon: agent không tự fix loop — inject bị chặn
  await expect(page.locator('#btnQecInject')).toBeDisabled();

  await page.locator('#btnQecReset').click();
  await expect(page.locator('#btnQecInject')).toBeEnabled();
  await page.locator('#btnQecInject').click();
  await expect(log).toContainText('⚛️ bit-flip');

  // đo khi không có lỗi = nhiễu, không được bịa syndrome
  await page.locator('#btnQecReset').click();
  await page.locator('#btnQecMeasure').click();
  await expect(log).toContainText('0 syndrome');

  expect(errors).toEqual([]);
});

test('scroll-dot "Tương lai" — section phải có id="future"', async ({ page }) => {
  const errors = await prep(page);
  await page.addStyleTag({ content: 'html{scroll-behavior:auto !important}' });

  const dots = page.locator('.scroll-dot');
  await expect(dots).toHaveCount(9);
  // mọi dot phải trỏ tới element có thật — dot chết là im lặng (bug 2026-09-12)
  const missing = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('.scroll-dot')]
      .map((d) => d.dataset.target!)
      .filter((id) => !document.getElementById(id))
  );
  expect(missing, 'dot trỏ tới id không tồn tại').toEqual([]);

  await page.locator('.scroll-dot[data-target="future"]').click();
  await expect
    .poll(() => page.evaluate(() => Math.round(document.getElementById('future')!.getBoundingClientRect().top)), {
      timeout: 5000,
    })
    .toBeLessThan(300);

  expect(errors).toEqual([]);
  await shoot(page.locator('#future .section-head'), `${SHOTS}/future-head.png`);
  await shoot(page.locator('#future .future-grid'), `${SHOTS}/future-grid.png`);
});

test('Lab #12 @375 — card visible, không tràn ngang, không lỗi', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 780 });
  const errors = await prep(page);

  const card = page.locator('#lab .lab-card').filter({ has: page.locator('#btnQecInject') });
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(700);
  await expect(card).toBeVisible();

  const overflow = await page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
    cardW: Math.round(
      document.querySelector<HTMLElement>('#btnQecInject')!.closest('.lab-card')!.getBoundingClientRect().width
    ),
  }));
  expect(overflow.scrollW, 'không tràn ngang').toBeLessThanOrEqual(overflow.clientW + 1);
  expect(overflow.cardW, 'card vừa khung 375').toBeLessThanOrEqual(375);

  expect(errors).toEqual([]);
  await shoot(card, `${SHOTS}/lab-12-375.png`);
});

test('Lab #12 — mọi nút bấm tuần tự không lỗi console', async ({ page }) => {
  const errors = await prep(page);
  await page.locator('#btnQecInject').scrollIntoViewIfNeeded();
  for (const sel of ['#btnQecInject', '#btnQecMeasure', '#btnQecTest', '#btnQecWorkaround', '#btnQecFix', '#btnQecReset']) {
    await page.locator(sel).click();
  }
  await expect(page.locator('#qecLog')).toContainText('bit-flip');
  expect(errors).toEqual([]);
});
