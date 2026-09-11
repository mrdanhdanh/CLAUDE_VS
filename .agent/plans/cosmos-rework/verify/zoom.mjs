// Zoom title ở deviceScaleFactor 3 + kiểm tra font load
import { chromium } from 'playwright';
const OUT = '.agent/plans/cosmos-rework/verify';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 3 });
await page.goto('http://localhost:3000/cosmos/index.html', { waitUntil: 'load' });
await page.keyboard.press('Escape');
await page.waitForTimeout(1500);

const fonts = await page.evaluate(async () => {
  await document.fonts.ready;
  const loaded = [];
  document.fonts.forEach((f) => loaded.push(`${f.family} ${f.weight} ${f.status}`));
  return { loaded: [...new Set(loaded)], computed: getComputedStyle(document.querySelector('#hero-title')).fontFamily };
});
console.log(JSON.stringify(fonts, null, 2));

await page.locator('#hero-title').screenshot({ path: `${OUT}/zoom2-hero-title.png` });
// cắt sát chữ "nở"
const box = await page.locator('#hero-title span').first().boundingBox();
console.log('span box', box);
await page.screenshot({ path: `${OUT}/zoom2-span.png`, clip: { x: box.x - 4, y: box.y - 10, width: box.width + 8, height: box.height + 20 } });
await browser.close();
