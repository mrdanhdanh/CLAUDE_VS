// Guard: chụp từng beat ra PNG để tự kiểm layout trước khi render MP4.
// Chạy: node www/space-bunny-free/verify-frames.mjs
import { chromium } from 'playwright';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(here, '../../.agent/plans/space-bunny-tiktok/verify');
const marks = [2, 8, 20, 33, 45];

try {
  // Guard tĩnh: mọi C.<key> dùng trong file phải có trong object token C.
  // Lý do: ctx.fillStyle = undefined KHÔNG throw — nó giữ màu cũ, làm chữ tàng hình.
  const html = await readFile(path.join(here, 'index.html'), 'utf8');
  const block = html.match(/const C\s*=\s*\{([\s\S]*?)\};/);
  if (!block) throw new Error('không tìm thấy object token C');
  const defined = new Set([...block[1].matchAll(/([A-Za-z_$][\w$]*)\s*:/g)].map((m) => m[1]));
  const used = new Set([...html.matchAll(/\bC\.([A-Za-z_$][\w$]*)/g)].map((m) => m[1]));
  const missing = [...used].filter((k) => !defined.has(k));
  if (missing.length) throw new Error(`token thiếu trong C: ${missing.join(', ')}`);

  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 1 });
  await page.goto(`file://${path.join(here, 'index.html')}`);
  await page.waitForFunction(() => window.__spaceBunny?.duration === 50);
  await page.evaluate(() => { window.__spaceBunny.freeze = true; });
  const shots = [];
  for (const m of marks) {
    await page.evaluate((t) => window.__spaceBunny.draw(t), m);
    const file = path.join(outDir, `frame-${String(m).padStart(2, '0')}s.png`);
    await writeFile(file, await page.locator('#canvas').screenshot());
    shots.push(file);
  }
  await browser.close();
  console.log(JSON.stringify({ ok: true, tokens: `${used.size} dùng / ${defined.size} định nghĩa`, frames: shots }, null, 2));
} catch (error) {
  console.error('verify-frames failed:', error.message);
  process.exit(1);
}
