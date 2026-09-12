import { test, expect, type Page } from '@playwright/test';

/**
 * COSMOS Rework 2026-09-12 — regression cho 4 bug phát hiện bằng diagnostic
 * (36 test cũ xanh vẫn lọt cả 4 — bug chưa có test cover):
 *
 *  #1 critical: #lab 6696px @375 không bao giờ reveal — IO threshold 0.12 cần 803px > viewport 780px
 *  #2 major:    map link ../../docs/... escape deploy root → 404 (KN-030 class)
 *  #3 major:    hover lift .card/.phase bị `.reveal.in{transform:none}` (cùng specificity, đứng sau) đè
 *  #4 minor:    lab card thừa void đáy do grid stretch mà nội dung không fill
 *
 * Evidence → .agent/plans/cosmos-rework/verify/
 */

const SHOTS = '.agent/plans/cosmos-rework/verify';

async function prep(page: Page) {
  await page.goto('/cosmos/index.html');
  await page.keyboard.press('Escape');
  await expect(page.locator('#intro')).toBeHidden({ timeout: 3000 });
  await page.addStyleTag({ content: 'html{scroll-behavior:auto !important}' });
}

async function scrollAll(page: Page) {
  await page.evaluate(async () => {
    const step = Math.round(window.innerHeight * 0.6);
    for (let y = 0; y <= document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 180));
    }
  });
  await page.waitForTimeout(400);
}

test('#1 reveal — mọi .reveal hiện ở 375px (bug: #lab tàng hình)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.setViewportSize({ width: 375, height: 780 });
  await prep(page);
  await scrollAll(page);

  // Poll — dưới tải song song, rAF/IO có thể trễ vài trăm ms; yêu cầu: không bao giờ kẹt ẩn
  await expect
    .poll(() => page.evaluate(() => document.querySelectorAll('.reveal:not(.in)').length), { timeout: 5000 })
    .toBe(0);

  const state = await page.evaluate(() => {
    const lab = document.getElementById('lab')!;
    return { labIn: lab.classList.contains('in'), labOpacity: getComputedStyle(lab).opacity };
  });
  expect(state.labIn).toBe(true);
  expect(state.labOpacity).toBe('1');
  expect(errors).toEqual([]);

  await page.evaluate(() => document.getElementById('lab')!.scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${SHOTS}/spec-375-lab-visible.png` });
});

test('#1b reveal — desktop 1280 cũng đủ .reveal + không tràn ngang', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await prep(page);
  await scrollAll(page);
  // Poll — dưới tải song song, rAF/IO có thể trễ vài trăm ms; yêu cầu là "không bao giờ kẹt ẩn".
  // Timeout 8s (không phải nới invariant): trang dài thêm ~450px sau khi ship Lab #12 (2026-09-12)
  // → scrollAll nhiều bước hơn và IO/transitionDelay xếp hàng lâu hơn dưới 6 worker song song.
  await expect
    .poll(() => page.evaluate(() => document.querySelectorAll('.reveal:not(.in)').length), { timeout: 8000 })
    .toBe(0);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, 'no horizontal overflow').toBeLessThanOrEqual(1);
});

test('#2 links — map node không escape deploy root; internal 200', async ({ page, request }) => {
  await prep(page);
  // Click + đọc trong cùng 1 evaluate — renderDetail là handler sync, không phụ thuộc actionability/timing
  const links = await page.evaluate(() => {
    const out: string[] = [];
    document.querySelectorAll<HTMLButtonElement>('.map-node').forEach((b) => {
      b.click();
      const href = document.querySelector('#mapDetail a.map-link')?.getAttribute('href');
      if (href) out.push(href);
    });
    return out;
  });
  expect(links.length, 'các node có link phải render link').toBeGreaterThanOrEqual(4);

  // `../../` từ /cosmos/ = repo root → ngoài deploy root www/ → 404 trên Pages (KN-030).
  // `../x` (1 cấp) = www/x — hợp lệ, check 200 ở dưới.
  const escaping = links.filter((h) => h.startsWith('../../'));
  expect(escaping, 'link không được escape khỏi www/ (KN-030)').toEqual([]);

  for (const h of links.filter((h) => !/^https?:/.test(h))) {
    const res = await request.get(new URL(h, page.url()).toString());
    expect(res.status(), h).toBe(200);
  }
  for (const h of links.filter((h) => /^https?:/.test(h))) {
    expect(h, 'link ngoài phải là GitHub repo (Pages không deploy ngoài www/)').toMatch(
      /^https:\/\/github\.com\/mrdanhdanh\/CLAUDE_VS\//
    );
  }
});

test('#3 hover lift — .card & .phase không bị reveal đè', async ({ page }) => {
  await prep(page);

  async function hoverTransform(selector: string): Promise<string> {
    const el = page.locator(selector).first();
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(700);
    const box = await el.boundingBox();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.waitForTimeout(400);
    return page.evaluate((sel) => getComputedStyle(document.querySelector(sel)!).transform, selector);
  }

  expect(await hoverTransform('#phil .card'), '.card:hover → translateY(-3px)').toMatch(
    /matrix\(1, 0, 0, 1, 0, -3/
  );
  expect(await hoverTransform('.timeline .phase'), '.phase:hover → translateY(-2px)').toMatch(
    /matrix\(1, 0, 0, 1, 0, -2/
  );
});

test('#4 lab card — không còn void đáy (lab-body fill card)', async ({ page }) => {
  await prep(page);
  await page.locator('#lab').scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  const gaps = await page.evaluate(() =>
    [...document.querySelectorAll('.lab-card')].map((c) => {
      const body = c.querySelector('.lab-body')!;
      return Math.round(c.getBoundingClientRect().bottom - body.getBoundingClientRect().bottom);
    })
  );
  expect(gaps.length).toBe(12); // 11 lab → 12 lab (Lab #12 QEC, 2026-09-12) — count lớn lên theo thiết kế, không nới ngưỡng
  for (const g of gaps) expect(g, 'khoảng trống đáy lab card ≤ 24px').toBeLessThanOrEqual(24);
});

test('#5 anchor — heading #lab không bị sticky header che', async ({ page }) => {
  await prep(page);
  await page.locator('a[href="#lab"]').first().click();
  await expect
    .poll(() => page.evaluate(() => Math.round(document.getElementById('lab')!.getBoundingClientRect().top)), {
      timeout: 5000,
    })
    .toBeLessThan(300);
  const r = await page.evaluate(() => ({
    header: document.querySelector('.header')!.getBoundingClientRect().height,
    heading: document.getElementById('lab-title')!.getBoundingClientRect().top,
  }));
  expect(r.heading, 'heading phải nằm dưới header').toBeGreaterThanOrEqual(r.header);
});

test('#6 hiệu ứng — brand --angle xoay + click mọi nút không lỗi console', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push('console: ' + m.text());
  });
  await prep(page);

  const a1 = await page.evaluate(() =>
    getComputedStyle(document.querySelector('.brand-mark')!).getPropertyValue('--angle')
  );
  await page.waitForTimeout(500);
  const a2 = await page.evaluate(() =>
    getComputedStyle(document.querySelector('.brand-mark')!).getPropertyValue('--angle')
  );
  expect(Math.abs(parseFloat(a2) - parseFloat(a1)), '--angle phải xoay').toBeGreaterThan(5);

  const ids = await page.evaluate(() => [...document.querySelectorAll('button[id]')].map((b) => b.id));
  expect(ids.length).toBeGreaterThanOrEqual(30);
  for (const id of ids) {
    await page.evaluate((i) => document.getElementById(i)?.click(), id);
  }
  await page.waitForTimeout(600);
  expect(errors).toEqual([]);
});
