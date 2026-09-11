// Final evidence — ảnh trước/sau các điểm fix
import { chromium } from 'playwright';
const OUT = '.agent/plans/cosmos-rework/verify';
const browser = await chromium.launch();

async function prep(page) {
  await page.goto('http://localhost:3000/cosmos/index.html', { waitUntil: 'load' });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(600);
  await page.addStyleTag({ content: 'html{scroll-behavior:auto !important}' });
  await page.evaluate(async () => {
    const step = Math.round(window.innerHeight * 0.6);
    for (let y = 0; y <= document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 150));
    }
  });
  await page.waitForTimeout(600);
}

// Mobile — #lab giờ hiển thị (trước: tàng hình)
const m = await browser.newPage({ viewport: { width: 375, height: 780 } });
await prep(m);
await m.evaluate(() => document.getElementById('lab').scrollIntoView({ block: 'start' }));
await m.waitForTimeout(700);
await m.screenshot({ path: `${OUT}/final-375-lab-visible.png` });
await m.evaluate(() => document.getElementById('pipeline').scrollIntoView({ block: 'start' }));
await m.waitForTimeout(500);
await m.screenshot({ path: `${OUT}/final-375-pipeline.png` });

// Superposition stack — polish (trước: chữ bị cắt)
await m.evaluate(() => document.getElementById('superStack').scrollIntoView({ block: 'center' }));
await m.waitForTimeout(500);
await m.locator('#superStack').screenshot({ path: `${OUT}/final-stack.png` });

// Desktop
const d = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await prep(d);
await d.evaluate(() => window.scrollTo(0, 0));
await d.waitForTimeout(500);
await d.screenshot({ path: `${OUT}/final-1280-hero.png` });

// card hover state
await d.evaluate(() => document.getElementById('phil').scrollIntoView({ block: 'start' }));
await d.waitForTimeout(600);
const box = await d.locator('#phil .card').first().boundingBox();
await d.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
await d.waitForTimeout(450);
await d.screenshot({ path: `${OUT}/final-1280-card-hover.png` });

// lab card fill (không còn void)
await d.evaluate(() => document.getElementById('lab').scrollIntoView({ block: 'start' }));
await d.waitForTimeout(600);
await d.screenshot({ path: `${OUT}/final-1280-lab-fill.png` });

console.log('final shots done');
await browser.close();
