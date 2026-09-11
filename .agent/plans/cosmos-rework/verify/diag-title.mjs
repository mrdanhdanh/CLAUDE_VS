// So sánh render title: headless chromium vs msedge (KN-031 pattern)
import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 700, height: 500 }, deviceScaleFactor: 3 });
await page.goto('http://localhost:3000/cosmos/_diag-title.html', { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1200);
await page.screenshot({ path: '.agent/plans/cosmos-rework/verify/diag-chromium.png' });
await browser.close();

// msedge thật (nếu có)
try {
  const b2 = await chromium.launch({ channel: 'msedge' });
  const p2 = await b2.newPage({ viewport: { width: 700, height: 500 }, deviceScaleFactor: 3 });
  await p2.goto('http://localhost:3000/cosmos/_diag-title.html', { waitUntil: 'load' });
  await p2.evaluate(() => document.fonts.ready);
  await p2.waitForTimeout(1200);
  await p2.screenshot({ path: '.agent/plans/cosmos-rework/verify/diag-msedge.png' });
  await b2.close();
  console.log('edge ok');
} catch (e) {
  console.log('edge fail:', String(e).slice(0, 120));
}
