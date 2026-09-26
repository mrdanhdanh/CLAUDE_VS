// Guard font coverage tiếng Việt (KN-082) — đo glyph VN trên MÁY RENDER THẬT trước khi build clip.
// Georgia thiếu ằ/ấ/ớ/ố → fallback vỡ metrics im lặng ("thô ng kê"), không throw ở đâu.
//
//   node .github/skills/video-clip/references/font-test.mjs   → font-test.png (xem bằng mắt)
// Font đã đo sạch (Windows + headless Chromium, 26.09.2026): Times New Roman · Cambria · Palatino Linotype ·
// Segoe UI · Consolas · Courier New · Cascadia Mono. Blacklist máy: tests/e2e/clip-font-guard.spec.ts.
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch({ headless: true });
const p = await b.newPage({ viewport: { width: 1000, height: 1180 } });
await p.goto('file://' + path.join(here, 'font-test.html'));
await p.waitForTimeout(400);
await p.locator('#c').screenshot({ path: path.join(here, 'font-test.png') });
await b.close();
console.log('ok — xem font-test.png');
