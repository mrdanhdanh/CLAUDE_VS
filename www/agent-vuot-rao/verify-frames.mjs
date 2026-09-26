// Guard layout: (1) quét tĩnh token C.<key> vs key định nghĩa — bắt chữ tàng hình;
//               (2) chụp N khung ra PNG để người/agent XEM, không đoán.
//
//   node verify-frames.mjs
//   node verify-frames.mjs --marks=2,8,20 --global=__clip --page=index.html
//
// Vì sao cần (1): ctx.fillStyle = undefined KHÔNG throw — nó giữ màu cũ,
// nên thiếu 1 key token = chữ trùng màu nền, không có exception nào.
import { chromium } from 'playwright';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const arg = (name, fallback) => {
  const hit = process.argv.find((v) => v.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};

const globalName = arg('global', '__clip');
const pageName = arg('page', 'index.html');
const outDir = path.resolve(arg('out', path.join(here, 'verify')));
const marks = arg('marks', '2,8,20,33,45').split(',').map(Number).filter((n) => Number.isFinite(n));

try {
  const html = await readFile(path.join(here, pageName), 'utf8');
  const block = html.match(/const C\s*=\s*\{([\s\S]*?)\};/);
  if (!block) throw new Error('không tìm thấy object token C — đổi regex cho khớp code của bạn');
  const defined = new Set([...block[1].matchAll(/([A-Za-z_$][\w$]*)\s*:/g)].map((m) => m[1]));
  const used = new Set([...html.matchAll(/\bC\.([A-Za-z_$][\w$]*)/g)].map((m) => m[1]));
  const missing = [...used].filter((k) => !defined.has(k));
  if (missing.length) throw new Error(`token thiếu trong C: ${missing.join(', ')}`);

  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 1 });
  await page.goto(`file://${path.join(here, pageName)}`);
  await page.waitForFunction((g) => Boolean(window[g]?.draw), globalName);
  await page.evaluate((g) => { window[g].freeze = true; }, globalName);

  const shots = [];
  for (const m of marks) {
    await page.evaluate(({ g, t }) => window[g].draw(t), { g: globalName, t: m });
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
