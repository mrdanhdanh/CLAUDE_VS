// Spot-check khung THẬT trong MP4 — chống case "render ra khung đen/trắng" lọt guard khác.
//   node verify-mp4.mjs --video=agentic-data-stack-50s.mp4 --marks=3.1,24
// Nạp video qua blob URL (tránh block file:// trong page trắng), seek, vẽ vào canvas, chụp PNG để XEM.
import { chromium } from 'playwright';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const arg = (name, fallback) => {
  const hit = process.argv.find((v) => v.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};

const video = path.resolve(arg('video', 'clip.mp4'));
const marks = arg('marks', '3.1,24').split(',').map(Number).filter((n) => Number.isFinite(n));
const outDir = path.resolve(arg('out', path.join(here, 'verify')));

try {
  await mkdir(outDir, { recursive: true });
  const b64 = (await readFile(video)).toString('base64');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 540, height: 960 } });
  await page.setContent('<canvas id="c" width="1080" height="1920" style="width:540px;height:960px"></canvas><video id="v" muted playsinline></video>');
  await page.evaluate(async (data) => {
    const bin = atob(data);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([bytes], { type: 'video/mp4' }));
    const v = document.querySelector('#v');
    v.src = url;
    await new Promise((res, rej) => { v.onloadeddata = res; v.onerror = () => rej(new Error('video load error')); });
  }, b64);

  const shots = [];
  for (const m of marks) {
    const frame = await page.evaluate(async (t) => {
      const v = document.querySelector('#v');
      await new Promise((res) => { v.onseeked = res; v.currentTime = t; });
      const c = document.querySelector('#c');
      const g = c.getContext('2d');
      g.drawImage(v, 0, 0, c.width, c.height);
      // đo "khung có nội dung": độ lệch chuẩn thô của kênh xanh
      const d = g.getImageData(0, 0, c.width, c.height).data;
      let sum = 0, sum2 = 0, n = 0;
      for (let i = 1; i < d.length; i += 4000) { sum += d[i]; sum2 += d[i] * d[i]; n++; }
      const mean = sum / n;
      const std = Math.sqrt(Math.max(0, sum2 / n - mean * mean));
      return { mean: Number(mean.toFixed(1)), std: Number(std.toFixed(1)) };
    }, m);
    const file = path.join(outDir, `mp4-${String(m).replace('.', '_')}s.png`);
    await writeFile(file, await page.locator('#c').screenshot());
    shots.push({ t: m, ...frame, file });
  }
  await browser.close();
  const blank = shots.filter((s) => s.std < 3);
  if (blank.length) {
    console.error(`⛔ khung gần như trống (std < 3): ${blank.map((b) => `${b.t}s`).join(', ')}`);
    process.exit(1);
  }
  console.log(JSON.stringify({ ok: true, shots }, null, 2));
} catch (error) {
  console.error('verify-mp4 failed:', error.message);
  process.exit(1);
}
