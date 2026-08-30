import { chromium, firefox, webkit } from 'playwright';

const url = 'file:///d:/CLAUDE_VS/www/glassui/index.html';

async function check(browser, label) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'load' });
  const sel = '.rainbow-animated';
  await page.waitForSelector(sel, { timeout: 5000 });
  const el = page.locator(sel).first();
  const info0 = await el.evaluate((e) => {
    const before = getComputedStyle(e, '::before');
    return {
      cls: e.className,
      elAngle: getComputedStyle(e).getPropertyValue('--angle').trim(),
      beforeAnim: before.animationName,
      beforeDur: before.animationDuration,
      supportsRegister: (typeof CSS !== 'undefined' && typeof CSS.registerProperty === 'function'),
      supportsSyntax: (typeof CSS !== 'undefined' && CSS.supports && CSS.supports('syntax: "<angle>"')),
    };
  });
  await page.waitForTimeout(600);
  const info1 = await el.evaluate((e) => ({
    elAngle: getComputedStyle(e).getPropertyValue('--angle').trim(),
    beforeAngle: getComputedStyle(e, '::before').getPropertyValue('--angle').trim(),
  }));
  const animated = info0.elAngle !== info1.elAngle || (info1.beforeAngle && info1.beforeAngle !== '0deg' && info1.beforeAngle !== '');
  console.log(`\n=== ${label} ===`);
  console.log('t0:', JSON.stringify(info0));
  console.log('t1:', JSON.stringify(info1));
  console.log('ANIMATED:', animated ? 'YES' : 'NO  <-- BUG');
  await page.close();
  await ctx.close();
}

(async () => {
  for (const [name, make] of [['chromium', chromium], ['firefox', firefox], ['webkit', webkit]]) {
    const browser = await make.launch();
    await check(browser, name + ' (no reduced-motion)');
    const ctx2 = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx2.newPage();
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForSelector('.rainbow-animated', { timeout: 5000 });
    const el = page.locator('.rainbow-animated').first();
    const a0 = await el.evaluate(e => getComputedStyle(e, '::before').getPropertyValue('--angle').trim());
    await page.waitForTimeout(600);
    const a1 = await el.evaluate(e => getComputedStyle(e, '::before').getPropertyValue('--angle').trim());
    console.log(`=== ${name} (reduced-motion) ===`);
    console.log('before --angle t0:', a0, ' t1:', a1, ' ANIMATED:', a0 !== a1 && a1 !== '0deg' ? 'YES' : 'NO  <-- BUG');
    await page.close(); await ctx2.close();
    await browser.close();
  }
})();
