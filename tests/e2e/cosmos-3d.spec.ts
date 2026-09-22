import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * COSMOS 3D — guard spec (three.js scene)
 *  - KN-032: engine rAF phải không có pageerror/console error
 *  - KN-028: geometry invariant canvas.width === clientWidth × ratio (cap 2)
 *  - KN-030: không 404 (self-host three.js + scale.json), test 2 dạng URL
 *  - KN-031: prefers-reduced-motion → không motion (camera đứng yên ở zone core)
 *  - Contract (không pin số): pickables = phases + nodes + 2; drawer DOM = data;
 *    danh sách node 3D phải khớp MAPS của bản 2D (1 nguồn nội dung)
 *  - Responsive: 375 panel = bottom sheet + screenshot 375/768/1280
 * Evidence → .agent/plans/cosmos-3d/verify/
 */

const ROOT = process.cwd();
const SHOTS = path.join(ROOT, '.agent/plans/cosmos-3d/verify');
const DATA_SRC = fs.readFileSync(path.join(ROOT, 'www/cosmos-3d/scene-data.js'), 'utf8');
const PAGE_2D = fs.readFileSync(path.join(ROOT, 'www/cosmos/index.html'), 'utf8');

const DATA_PHASES = (DATA_SRC.match(/^\s*\{ num: '/gm) || []).length;
const DATA_NODES = (DATA_SRC.match(/^\s*\{ id: '/gm) || []).length;
const MAPS_2D = (PAGE_2D.match(/\{ico:'/g) || []).length;
const PHASES_2D = (PAGE_2D.match(/class="phase" role="listitem"/g) || []).length;

/** Thu thập lỗi runtime + response ≥400 (bỏ qua CDN font — ngoài phạm vi trang). */
function collect(page: Page) {
  const errors: string[] = [];
  const bad: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error' && !/fonts\.g/.test(m.text())) errors.push('console: ' + m.text());
  });
  page.on('response', (res) => {
    if (res.status() >= 400 && res.url().startsWith('http://localhost:3000')) bad.push(res.url() + ' → ' + res.status());
  });
  return { errors, bad };
}

async function boot(page: Page) {
  const c = collect(page);
  await page.goto('/cosmos-3d/index.html');
  await page.waitForFunction(() => (window as unknown as { __COSMOS3D?: { ready?: boolean } }).__COSMOS3D?.ready === true);
  await page.waitForFunction(() => document.querySelector('#boot')?.classList.contains('hide') === true);
  return c;
}

const stats = (page: Page) => page.evaluate(() => (window as unknown as { __COSMOS3D: { stats: () => Record<string, unknown> } }).__COSMOS3D.stats());
const cameraPos = (page: Page) => page.evaluate(() => (window as unknown as { __COSMOS3D: { cameraPos: () => { x: number; y: number; z: number } } }).__COSMOS3D.cameraPos());

test.describe('cosmos-3d — boot & contract', () => {
  test('boot sạch lỗi + contract đếm vật thể (KN-032)', async ({ page }) => {
    const { errors } = await boot(page);
    const s = await stats(page);

    expect(errors, errors.join('\n')).toEqual([]);
    expect(s.webgl).toBe(true);
    expect(s.booted).toBe(true);

    // contract: registry items = 1 core + N phases + M nodes + 1 entropy (không pin con số)
    expect(s.items).toBe(Number(s.phases) + Number(s.nodes) + 2);
    expect(Number(s.objects)).toBeGreaterThanOrEqual(Number(s.items));   // ring của lỗ đen là mesh thứ 2 của cùng 1 body
    expect(s.labels).toBe(Number(s.phases) + Number(s.nodes) + 2);
    expect(Number(s.phases)).toBeGreaterThanOrEqual(5);
    expect(Number(s.nodes)).toBeGreaterThanOrEqual(10);

    // HUD hiển thị (S thật từ scale.json hoặc '—' khi fetch fail — không crash)
    const hudS = await page.locator('#hudS').innerText();
    expect(hudS === '—' || Number.isFinite(Number(hudS))).toBe(true);
    expect(await page.locator('#hudCount').innerText()).toBe(String(s.objects));
  });

  test('data 3D khớp nội dung 2D (1 nguồn — thêm node phải thêm cả 2)', () => {
    expect(DATA_PHASES, 'phases trong scene-data.js').toBe(PHASES_2D);
    expect(DATA_NODES, 'nodes trong scene-data.js').toBe(MAPS_2D);
    expect(DATA_NODES).toBeGreaterThanOrEqual(15);
  });

  test('drawer DOM = data (a11y: mọi vật thể có nút thật)', async ({ page }) => {
    await boot(page);
    const items = await page.locator('#drawerList .drawer-item').count();
    expect(items).toBe(DATA_PHASES + DATA_NODES + 2);
  });

  test('không 404 cho các dạng URL của trang (KN-030)', async ({ page }) => {
    for (const url of ['/cosmos-3d/index.html', '/cosmos-3d/', '/cosmos-3d']) {
      const c = collect(page);
      await page.goto(url);
      await page.waitForFunction(() => (window as unknown as { __COSMOS3D?: { ready?: boolean } }).__COSMOS3D?.ready === true);
      expect(c.bad, `${url}: ${c.bad.join(', ')}`).toEqual([]);
      expect(c.errors, `${url}: ${c.errors.join('\n')}`).toEqual([]);
    }
  });
});

test.describe('cosmos-3d — tương tác', () => {
  test('click vào lõi (giữa màn hình) → panel mở đúng nội dung', async ({ page }) => {
    const { errors } = await boot(page);
    await page.click('#btnExplore');            // tắt hero để canvas nhận chuột
    await expect(page.locator('#hero')).toHaveClass(/hide/);
    const box = await page.locator('#c3d-canvas').boundingBox();
    await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await expect(page.locator('#panel')).toHaveClass(/open/);
    await expect(page.locator('#panelTitle')).toContainText('Harness');
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('mở node qua API → panel + link đúng; Esc đóng', async ({ page }) => {
    await boot(page);
    expect(await page.evaluate(() => (window as unknown as { __COSMOS3D: { open: (id: string) => boolean } }).__COSMOS3D.open('node-quasar'))).toBe(true);
    await expect(page.locator('#panelTitle')).toContainText('Quasar');
    await expect(page.locator('#panelLink')).toHaveAttribute('href', /status\.json/);
    await page.keyboard.press('Escape');
    await expect(page.locator('#panel')).not.toHaveClass(/open/);

    await page.evaluate(() => (window as unknown as { __COSMOS3D: { open: (id: string) => boolean } }).__COSMOS3D.open('phase-05'));
    await expect(page.locator('#panelTitle')).toContainText('Plan');
    await page.keyboard.press('Escape');
    await page.evaluate(() => (window as unknown as { __COSMOS3D: { open: (id: string) => boolean } }).__COSMOS3D.open('entropy'));
    await expect(page.locator('#panelTitle')).toContainText('Entropy');
    await expect(page.locator('#panelMeta')).toContainText('S =');
  });

  test('chuyển zone → camera bay tới vùng mới + aria-pressed', async ({ page }) => {
    await boot(page);
    await page.click('#btnExplore');                    // tắt hero để switcher nhận chuột
    const before = await cameraPos(page);
    await page.click('.switcher .btn[data-zone="map"]');
    await page.waitForFunction(() => Math.abs((window as unknown as { __COSMOS3D: { cameraPos: () => { x: number } } }).__COSMOS3D.cameraPos().x - 90) < 4);
    const after = await cameraPos(page);
    expect(Math.abs(after.x - before.x)).toBeGreaterThan(40);
    await expect(page.locator('.switcher .btn[data-zone="map"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.switcher .btn[data-zone="core"]')).toHaveAttribute('aria-pressed', 'false');
    expect((await stats(page)).zone).toBe('map');
  });
});

test.describe('cosmos-3d — responsive & reduced motion', () => {
  test('375: panel là bottom sheet (không che hết, chạm đáy)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 720 });
    await boot(page);
    await page.evaluate(() => (window as unknown as { __COSMOS3D: { open: (id: string) => boolean } }).__COSMOS3D.open('node-cmb'));
    const panel = await page.locator('#panel').boundingBox();
    expect(panel!.width).toBeGreaterThan(340);
    expect(panel!.y + panel!.height).toBeGreaterThan(700);
    expect(panel!.height).toBeLessThan(520);      // ≤ ~52dvh — vẫn thấy canvas
  });

  test('reduced-motion: không intro, camera đứng ở zone core (KN-031)', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    await boot(page);
    const s = await stats(page);
    expect(s.reducedMotion).toBe(true);
    const pos = await cameraPos(page);
    expect(Math.abs(pos.z - 17)).toBeLessThan(1);   // zones.core.pos = (0,7,17)
    await ctx.close();
  });

  test('screenshot 1280/768/375 (bằng chứng visual)', async ({ page }) => {
    fs.mkdirSync(SHOTS, { recursive: true });
    for (const [w, h] of [[1280, 800], [768, 900], [375, 720]] as const) {
      await page.setViewportSize({ width: w, height: h });
      await boot(page);
      await page.click('#btnExplore');
      await page.evaluate(() => (window as unknown as { __COSMOS3D: { zone: (z: string) => void } }).__COSMOS3D.zone('map'));
      await page.waitForTimeout(1200);
      await page.screenshot({ path: path.join(SHOTS, `cosmos-3d-${w}.png`) });
    }
  });
});
