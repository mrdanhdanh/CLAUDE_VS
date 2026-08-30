import { chromium, firefox, webkit } from 'playwright';
const url = 'file:///d:/CLAUDE_VS/www/glassui/index.html';

async function checkAll(browser, label) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(300);
  const results = await page.evaluate(async () => {
    const out = [];
    const sels = ['.rainbow-animated', '.glass-rainbow.animated', '.rainbow-border', '.rainbow-glow'];
    for (const s of sels) {
      document.querySelectorAll(s).forEach((e, i) => {
        const before = getComputedStyle(e, '::before');
        const a0 = getComputedStyle(e, '::before').getPropertyValue('--angle').trim();
        out.push({ s, i, cls: e.className.slice(0,40), anim: before.animationName, dur: before.animationDuration, a0 });
      });
    }
    await new Promise(r => setTimeout(r, 600));
    // second pass
    const out2 = [];
    for (const s of sels) {
      document.querySelectorAll(s).forEach((e, i) => {
        out2.push(getComputedStyle(e, '::before').getPropertyValue('--angle').trim());
      });
    }
    return { out, out2 };
  });
  // pair them
  const pairs = results.out.map((o, idx) => ({ ...o, a1: results.out2[idx] }));
  const failed = pairs.filter(p => p.a0 === p.a1 || (p.a1 === '0deg' && p.anim !== 'none' && p.a0 === '0deg'));
  console.log(`\n=== ${label} ===`);
  pairs.forEach(p => {
    const anim = (p.a0 !== p.a1) || (p.anim !== 'none' && p.a0 !== '0deg');
    console.log(`${anim ? 'OK ' : 'XX '} ${p.s}[${p.i}] anim=${p.anim} dur=${p.dur} --angle ${p.a0} -> ${p.a1}`);
  });
  if (failed.length) console.log('FAILED:', JSON.stringify(failed));
  else console.log('ALL ANIMATED');
  await page.close(); await ctx.close();
}

(async () => {
  for (const [name, make] of [['chromium', chromium], ['firefox', firefox], ['webkit', webkit]]) {
    const browser = await make.launch();
    await checkAll(browser, name);
    await browser.close();
  }
})();
