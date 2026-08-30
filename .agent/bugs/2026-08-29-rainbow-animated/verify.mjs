import { chromium, firefox, webkit } from 'playwright';
const url = 'file:///d:/CLAUDE_VS/www/glassui/index.html';

async function checkAll(browser, label, init) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  if (init) await page.addInitScript(init);
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(300);
  const res = await page.evaluate(async () => {
    const out = [];
    const sels = ['.rainbow-animated', '.glass-rainbow.animated'];
    for (const s of sels) document.querySelectorAll(s).forEach((e, i) => {
      const b = getComputedStyle(e, '::before');
      out.push({ s, i, cls: e.className.slice(0,30), anim: b.animationName, a0: getComputedStyle(e, '::before').getPropertyValue('--angle').trim(), htmlClass: document.documentElement.className });
    });
    await new Promise(r => setTimeout(r, 600));
    const out2 = [];
    for (const s of sels) document.querySelectorAll(s).forEach(e => out2.push(getComputedStyle(e, '::before').getPropertyValue('--angle').trim()));
    return { out, out2 };
  });
  const pairs = res.out.map((o, idx) => ({ ...o, a1: res.out2[idx] }));
  // rainbow-hover (index 2) is intentionally static until hover — exclude from fail check
  const failed = pairs.filter(p => p.s === '.rainbow-animated' && p.i === 2 ? false : (p.a0 === p.a1));
  console.log(`\n=== ${label} ===`);
  pairs.forEach(p => {
    const ok = (p.s === '.rainbow-animated' && p.i === 2) ? true : (p.a0 !== p.a1);
    console.log(`${ok ? 'OK ' : 'XX '} ${p.s}[${p.i}] anim=${p.anim} htmlClass=${p.htmlClass} --angle ${p.a0} -> ${p.a1}`);
  });
  console.log(failed.length ? `FAILED: ${JSON.stringify(failed)}` : 'ALL ANIMATED (hover-only excluded)');
  await page.close(); await ctx.close();
}

(async () => {
  const noReg = () => { try { CSS.registerProperty = undefined; } catch(e){} };
  for (const [name, make] of [['chromium', chromium], ['firefox', firefox], ['webkit', webkit]]) {
    const browser = await make.launch();
    await checkAll(browser, `${name} NATIVE (registerProperty present)`);
    const b2 = await make.launch();
    await checkAll(b2, `${name} FALLBACK (registerProperty disabled)`, noReg);
    await browser.close(); await b2.close();
  }
})();
