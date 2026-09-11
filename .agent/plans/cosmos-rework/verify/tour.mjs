// Scroll-tour COSMOS — trigger reveal rồi chụp từng section (viewport shots)
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const OUT = '.agent/plans/cosmos-rework/verify';
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto('http://localhost:3000/cosmos/index.html', { waitUntil: 'load' });
await page.keyboard.press('Escape');
await page.waitForTimeout(600);

// scroll chậm từ đầu đến cuối để trigger IntersectionObserver
await page.evaluate(async () => {
  const step = 400;
  for (let y = 0; y <= document.body.scrollHeight; y += step) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 60));
  }
  window.scrollTo(0, 0);
});
await page.waitForTimeout(800);

const sections = ['#phil', '#pipeline', '#lab', '#map', '#calendar', '#observatory', '#integration'];
for (const sel of sections) {
  const el = page.locator(sel);
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(350);
  const name = sel.slice(1);
  await page.screenshot({ path: `${OUT}/sec-${name}.png` });
}

// Lab cards — mỗi lab một ảnh (desktop 2 cột)
const labs = await page.locator('.lab-card').count();
for (let i = 0; i < labs; i += 2) {
  const el = page.locator('.lab-card').nth(i);
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${OUT}/lab-${String(i + 1).padStart(2, '0')}.png` });
}

// Zoom hero title — nghi artifact dấu tiếng Việt ở gradient text
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(400);
await page.locator('#hero-title').screenshot({ path: `${OUT}/zoom-hero-title.png` });

// Zoom observatory panels (data thật)
await page.locator('#observatory').scrollIntoViewIfNeeded();
await page.waitForTimeout(400);
await page.locator('.obs-grid').screenshot({ path: `${OUT}/zoom-observatory.png` });

// Mobile — 3 section chính
const m = await browser.newPage({ viewport: { width: 375, height: 780 } });
await m.goto('http://localhost:3000/cosmos/index.html', { waitUntil: 'load' });
await m.keyboard.press('Escape');
await m.waitForTimeout(500);
await m.evaluate(async () => {
  for (let y = 0; y <= document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 50)); }
  window.scrollTo(0, 0);
});
await m.waitForTimeout(600);
for (const sel of ['#phil', '#pipeline', '#lab', '#map', '#calendar']) {
  await m.locator(sel).scrollIntoViewIfNeeded();
  await m.waitForTimeout(300);
  await m.screenshot({ path: `${OUT}/m-${sel.slice(1)}.png` });
}
console.log('done:', labs, 'lab cards');
await browser.close();
