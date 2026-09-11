// Tour v2 — tắt smooth-scroll để chụp ổn định (desktop + mobile)
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const OUT = '.agent/plans/cosmos-rework/verify';
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();

async function prep(page) {
  await page.goto('http://localhost:3000/cosmos/index.html', { waitUntil: 'load' });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(700);
  await page.addStyleTag({ content: 'html{scroll-behavior:auto !important}' });
  // reveal toàn bộ + scroll hết trang để IO trigger
  await page.evaluate(async () => {
    for (let y = 0; y <= document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(900);
}

const d = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await prep(d);
for (const sel of ['#phil', '#pipeline', '#lab', '#map', '#calendar', '#observatory', '#integration']) {
  await d.evaluate((s) => { const el = document.querySelector(s); if (el) window.scrollTo(0, el.offsetTop - 8); }, sel);
  await d.waitForTimeout(700);
  await d.screenshot({ path: `${OUT}/v2-${sel.slice(1)}.png` });
}
await d.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await d.waitForTimeout(700);
await d.screenshot({ path: `${OUT}/v2-footer.png` });

const m = await browser.newPage({ viewport: { width: 375, height: 780 } });
await prep(m);
for (const sel of ['#phil', '#pipeline', '#lab', '#map', '#calendar', '#observatory', '#integration']) {
  await m.evaluate((s) => { const el = document.querySelector(s); if (el) window.scrollTo(0, el.offsetTop - 8); }, sel);
  await m.waitForTimeout(600);
  await m.screenshot({ path: `${OUT}/v2m-${sel.slice(1)}.png` });
}

const t = await browser.newPage({ viewport: { width: 768, height: 900 } });
await prep(t);
for (const sel of ['#pipeline', '#lab', '#observatory']) {
  await t.evaluate((s) => { const el = document.querySelector(s); if (el) window.scrollTo(0, el.offsetTop - 8); }, sel);
  await t.waitForTimeout(600);
  await t.screenshot({ path: `${OUT}/v2t-${sel.slice(1)}.png` });
}
console.log('tour v2 done');
await browser.close();
