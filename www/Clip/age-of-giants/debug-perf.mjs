// TẠM — phân biệt GC/alloc (theo số lần vẽ) vs raster (theo t). Xoá sau khi xong.
// A) vẽ 600 lần CÙNG t liên tục (như verify-perf)  B) vẽ 600 lần CÙNG t, paced rAF (như render thật)
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 1 });
await page.goto(`file://${path.join(here, 'index.html')}`);
await page.waitForFunction(() => Boolean(window.__clip?.draw));

const out = await page.evaluate(async () => {
  const clip = window.__clip;
  clip.freeze = true;
  const dur = clip.duration;

  // Mô phỏng ĐÚNG vòng render.mjs: rAF-paced, t theo wall-clock, 30fps, cả timeline
  const gaps = [];
  const slow = [];
  const started = performance.now();
  let last = started;
  await new Promise((resolve) => {
    const tick = () => {
      const t = (performance.now() - started) / 1000;
      const a = performance.now();
      clip.draw(Math.min(dur, t));
      const ms = performance.now() - a;
      const now = performance.now();
      gaps.push(now - last);
      if (ms > 50) slow.push({ t: Number(t.toFixed(2)), ms: Number(ms.toFixed(1)) });
      last = now;
      if (t >= dur) resolve(); else requestAnimationFrame(tick);
    };
    tick();
  });
  const sorted = [...gaps].sort((x, y) => x - y);
  const q = (p) => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
  return {
    frames: gaps.length,
    slow,
    gapP50: Number(q(0.5).toFixed(1)),
    gapP95: Number(q(0.95).toFixed(1)),
    gapMax: Number(sorted[sorted.length - 1].toFixed(1)),
    fps: Number((1000 / (gaps.reduce((a, b) => a + b, 0) / gaps.length)).toFixed(1))
  };
});
await browser.close();
console.log('Mô phỏng render 50s:', JSON.stringify(out, null, 1));
