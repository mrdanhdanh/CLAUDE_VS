/**
 * V4 verify — COSMOS intro (BOOM → MATTER → GRAVITY → LIFE → INTELLIGENCE)
 * Đo bằng tool (KN-003): camera inertia · quantum collapse · canvas invariant · no-pageerror (KN-032).
 * Self-serve static server (0 dep) + chromium (fallback msedge) — không cần webServer của playwright.
 *
 * Chạy: node .agent/plans/cosmos-intro/verify/v4-verify.mjs
 * Evidence: verify/v4-*.png (screenshot từng stage)
 */
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..', '..', '..', 'www');
const PORT = 3187;
const PAGE = `http://127.0.0.1:${PORT}/cosmos/index.html`;
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
};

// ---------- self-serve static server ----------
const srv = http.createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const fp = path.join(ROOT, p);
    const data = await readFile(fp);
    res.setHeader('content-type', MIME[path.extname(fp)] || 'application/octet-stream');
    res.end(data);
  } catch {
    res.statusCode = 404; res.end('404');
  }
});
await new Promise(r => srv.listen(PORT, '127.0.0.1', r));

// ---------- asserts ----------
const fails = [];
let passed = 0;
const ok = (cond, msg) => {
  if (cond) { passed++; console.log('✅ ' + msg); }
  else { fails.push(msg); console.log('❌ ' + msg); }
};

let browser;
try { browser = await chromium.launch(); }
catch { browser = await chromium.launch({ channel: 'msedge' }); }   // fallback Edge thật
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push('[console] ' + m.text()); });
page.on('pageerror', e => errors.push('[pageerror] ' + e.message));
await page.route(/fonts\.(googleapis|gstatic)\.com/, r =>
  r.fulfill({ status: 200, contentType: 'text/css', body: '' }));   // stub fonts — deterministic (KN-029)

await page.goto(PAGE, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('#introCanvas');

// canvas invariant (KN-028)
const csz = await page.evaluate(() => {
  const c = document.getElementById('introCanvas');
  return { w: c.width, h: c.height, cw: c.clientWidth, ch: c.clientHeight };
});
ok(csz.w === csz.cw && csz.h === csz.ch, `canvas buffer khớp hiển thị (${csz.w}×${csz.h})`);

// engine armed + start (`.play` = t0 thật của intro)
const played = await page.waitForFunction(
  () => document.getElementById('intro')?.classList.contains('play'), null, { timeout: 8000 }
).then(() => true).catch(() => false);
ok(played, 'engine chạy (.play) trong 8s');

// ---------- Pass A: METRICS — không screenshot, sample đúng engine time ----------
const t0 = Date.now();
const samples = [];
const waitT = ts => page.waitForFunction(t => window.__introDbg && window.__introDbg.T >= t, ts, { timeout: 15000 })
  .then(() => true).catch(() => false);
const sample = async (ts) => {
  await waitT(ts);
  const s = await page.evaluate(() => {
    const d = window.__introDbg;
    return d ? { t: d.T, cam: d.cam, qProg: d.qProg, cloudN: d.cloudN } : null;
  });
  samples.push({ want: ts, wall: Date.now() - t0, ...(s || {}) });
  return s;
};
await sample(0.6);
const s125 = await sample(1.25);
const s2k = await sample(2.0);
const s35 = await sample(3.5);
const s46 = await sample(4.6);

// ---------- V4 asserts (RED trước khi implement) ----------
const hasDbg = samples.some(s => s.cam !== undefined);
ok(hasDbg, '__introDbg tồn tại (camera + quantum hooks)');

if (s125 && s125.cam !== undefined) {
  ok(s125.cam > 1.02, `cam @1.25s > 1.02 — kick có lực (${s125.cam?.toFixed(4)})`);
} else ok(false, 'cam @1.25s > 1.02 — kick có lực (thiếu hook)');
if (s2k && s2k.cam !== undefined) {
  ok(s2k.cam > 0.99 && s2k.cam < 1.035, `cam @2.0s settle cho hero silhouette (${s2k.cam?.toFixed(4)})`);
} else ok(false, 'cam @2.0s settle cho hero silhouette (thiếu hook)');
if (s46 && s35 && s46.cam !== undefined && s35.cam !== undefined) {
  ok(s46.cam > 1.035, `cam @4.6s push in > 1.035 (${s46.cam?.toFixed(4)})`);
  ok(s46.cam > s35.cam + 0.008, `camera tiến 3.5s → 4.6s (inertia, Δ ${(s46.cam - s35.cam)?.toFixed(4)})`);
} else { ok(false, 'cam @4.6s push in > 1.035 (thiếu hook)'); ok(false, 'camera tiến 3.5s → 4.6s (thiếu hook)'); }
if (s35 && s35.qProg !== undefined) {
  ok(s35.qProg < 0.05, `qProg @3.5s ≈ 0 — nhiễu còn superposition (${s35.qProg})`);
} else ok(false, 'qProg @3.5s ≈ 0 (thiếu hook)');
if (s46 && s46.qProg !== undefined) {
  ok(s46.qProg >= 0.99, `qProg @4.6s = 1 — đã collapse thành trật tự (${s46.qProg})`);
  ok((s46.cloudN || 0) >= 80, `quantum cloud đủ hạt (${s46.cloudN})`);
} else ok(false, 'qProg @4.6s = 1 (thiếu hook)');

// reveal hoàn tất (trên metrics page) rồi đóng page
const revealed = await page.waitForSelector('#intro', { state: 'hidden', timeout: 9000 }).then(() => true).catch(() => false);
ok(revealed, 'intro tự reveal (≤ ~7s từ .play)');
await page.close();

// ---------- Pass B: EVIDENCE — mỗi stage 1 page load riêng (không drift do screenshot cost) ----------
const STAGES = [
  [0.6, 'v4-0600-void.png'], [0.8, 'v4-0800-contract.png'],
  [1.25, 'v4-1250-burst.png'], [1.7, 'v4-1700-matter.png'],
  [2.0, 'v4-2000-galaxy-hero.png'], [2.52, 'v4-2500-outline.png'],
  [2.72, 'v4-2700-fill.png'], [2.93, 'v4-2950-collapse.png'],
  [3.16, 'v4-3100-firstlight.png'], [3.55, 'v4-3500-noise.png'],
  [4.6, 'v4-4600-hero.png'], [4.9, 'v4-4900-after.png'],
];
for (const [ts, name] of STAGES) {
  const p = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  p.on('pageerror', e => errors.push('[B pageerror] ' + e.message));
  await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await p.goto(PAGE, { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(t => window.__introDbg && window.__introDbg.T >= t, ts, { timeout: 15000 }).catch(() => {});
  await p.evaluate(t => window.__introDbg && window.__introDbg.freeze(t), ts);   // freeze exact stage — screenshot không trôi
  await p.waitForTimeout(180);
  await p.screenshot({ path: path.join(HERE, name) });
  await p.close();
  console.log(`  📸 ${name} @T=${ts}s (frozen)`);
}

ok(errors.length === 0, 'no console/page errors (metrics + evidence)' + (errors.length ? ' → ' + errors.join(' | ') : ''));

// ---------- summary ----------
console.log('\n— Timeline samples —');
for (const s of samples) {
  console.log(`  want ${s.want}s · T ${s.t !== undefined ? s.t.toFixed(2) : '?'}s · cam ${s.cam !== undefined ? s.cam.toFixed(4) : '?'} · qProg ${s.qProg !== undefined ? s.qProg : '?'}`);
}
console.log(`\n${passed} pass / ${fails.length} fail`);
await browser.close();
srv.close();
process.exit(fails.length ? 1 : 0);
