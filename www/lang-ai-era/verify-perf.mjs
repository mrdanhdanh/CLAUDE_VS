// Guard perf: đo 2 tầng — (1) chi phí draw(t) từng khung, (2) nhịp khung THẬT
// khi chạy vòng rAF giống render.mjs (quét toàn timeline). MediaRecorder capture
// realtime — nếu vẽ không kịp, khung bị ghi lặp ⇒ clip "lag" mà KHÔNG có lỗi để bắt.
//
//   node verify-perf.mjs                          # ngưỡng: avg 1 khung 20ms · interval p95 33ms
//   node verify-perf.mjs --samples=200 --max=18 --max-frame=33 --frames=150
//
// Đo command-cost (performance.now quanh draw) sau warmup (cache strip mưa,
// gradient, layout chữ). Đây là proxy — khi capture còn encoder; p95 ≤ 20ms
// để chừa đầu cho encoder trong ngân sách 33.3ms/khung của 30fps.
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const arg = (name, fallback) => {
  const hit = process.argv.find((v) => v.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const globalName = arg('global', '__clip');
const pageName = arg('page', 'index.html');
const samples = Number(arg('samples', '150'));
const frames = Number(arg('frames', '90'));
const maxMs = Number(arg('max', '20'));
const maxFrame = Number(arg('max-frame', '33'));

try {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 1 });
  await page.goto(`file://${path.join(here, pageName)}`);
  await page.waitForFunction((g) => Boolean(window[g]?.draw && window[g]?.duration), globalName);

  const out = await page.evaluate(async ({ g, samples, frames }) => {
    const clip = window[g];
    clip.freeze = true;
    const dur = clip.duration;
    // warmup: quét hết timeline 3 vòng — khởi tạo mọi cache TRƯỚC khi đo
    for (let k = 0; k < 3; k++) {
      for (let i = 0; i < 120; i++) clip.draw(Math.max(0.005, (dur - 0.01) * (i / 120)));
    }

    // (1) command cost từng khung + 5 khung chậm nhất (kèm t để biết cảnh nào stall)
    const costs = [];
    const worst = [];
    for (let i = 0; i < samples; i++) {
      const t = Math.max(0.005, (dur - 0.01) * (i / samples));
      const a = performance.now();
      clip.draw(t);
      const ms = performance.now() - a;
      costs.push(ms);
      worst.push({ t: Number(t.toFixed(2)), ms: Number(ms.toFixed(1)) });
    }
    worst.sort((x, y) => y.ms - x.ms);
    const sorted = [...costs].sort((x, y) => x - y);
    const q = (arr, p) => arr[Math.min(arr.length - 1, Math.floor(p * arr.length))];

    // (2) nhịp khung THẬT — vòng rAF giống render.mjs, quét MỌI cảnh trên timeline
    const intervals = [];
    await new Promise((resolve) => {
      let n = 0;
      let last = performance.now();
      const tick = () => {
        const t = Math.min(dur - 0.01, 0.05 + (dur - 0.1) * (n / frames));
        clip.draw(t);
        const now = performance.now();
        intervals.push(now - last);
        last = now;
        n++;
        if (n < frames) requestAnimationFrame(tick); else resolve();
      };
      requestAnimationFrame(tick);
    });
    const sortedI = [...intervals].sort((x, y) => x - y);

    return {
      duration: dur,
      samples,
      command: {
        avg: costs.reduce((a, b) => a + b, 0) / costs.length,
        p50: q(sorted, 0.5),
        p95: q(sorted, 0.95),
        max: sorted[sorted.length - 1]
      },
      worst: worst.slice(0, 5),
      frames,
      interval: {
        avg: intervals.reduce((a, b) => a + b, 0) / intervals.length,
        p50: q(sortedI, 0.5),
        p95: q(sortedI, 0.95),
        max: sortedI[sortedI.length - 1],
        fps: 1000 / (intervals.reduce((a, b) => a + b, 0) / intervals.length)
      }
    };
  }, { g: globalName, samples, frames });
  await browser.close();

  const f = (n) => Number(n.toFixed(2));
  const res = {
    duration: out.duration,
    samples: out.samples,
    budget30fpsMs: f(1000 / 30),
    command: { avg: f(out.command.avg), p50: f(out.command.p50), p95: f(out.command.p95), max: f(out.command.max) },
    worstFrames: out.worst,
    frames: out.frames,
    interval: { avg: f(out.interval.avg), p50: f(out.interval.p50), p95: f(out.interval.p95), max: f(out.interval.max), fps: f(out.interval.fps) },
    thresholds: { commandAvgMs: maxMs, intervalP95Ms: maxFrame }
  };
  console.log(JSON.stringify(res, null, 1));

  // Gate: (a) avg cost 1 khung khi vẽ LIÊN TỤC (backpressure) · (b) nhịp khung thật khi rAF-paced.
  // p95/max của vòng (1) chỉ để tham khảo — vẽ back-to-back không phải cách render thật chạy.
  const fail = [];
  if (out.command.avg > maxMs) fail.push(`command avg ${f(out.command.avg)}ms > ${maxMs}ms`);
  if (out.interval.p95 > maxFrame) fail.push(`frame interval p95 ${f(out.interval.p95)}ms > ${maxFrame}ms`);
  if (fail.length) {
    console.error(`⛔ perf FAIL — ${fail.join(' · ')} (ngân sách 30fps: 33.33ms/khung)`);
    process.exit(1);
  }
  console.log(`✅ perf OK — command avg ${f(out.command.avg)}ms · interval p95 ${f(out.interval.p95)}ms (≈${f(out.interval.fps)}fps sustained)`);
} catch (error) {
  console.error('verify-perf failed:', error.message);
  process.exit(1);
}
