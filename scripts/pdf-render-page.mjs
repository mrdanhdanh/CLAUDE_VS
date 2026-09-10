#!/usr/bin/env node
/**
 * Render 1 trang PDF → PNG (Playwright + pdf.js) — xem trước PDF scan trước khi OCR
 * Usage: node scripts/pdf-render-page.mjs <file.pdf> <page> [--out .agent/tmp/render.png] [--width 1400]
 */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { chromium } from 'playwright';

const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const argv = process.argv.slice(2);
let out = '.agent/tmp/render.png';
let width = 1400;
const positional = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--out') { out = argv[++i] || out; continue; }
  if (argv[i] === '--width') { width = parseInt(argv[++i] || '1400', 10); continue; }
  positional.push(argv[i]);
}
const file = path.resolve(process.cwd(), positional[0] || '');
const pageNum = parseInt(positional[1] || '1', 10);
if (!file || !fs.existsSync(file)) {
  console.error('Usage: node scripts/pdf-render-page.mjs <file.pdf> <page> [--out x.png] [--width 1400]');
  process.exit(1);
}

const b64 = fs.readFileSync(file).toString('base64');
const srv = http.createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(`<!doctype html><html><head><meta charset="utf-8"><script src="${PDFJS}"></script></head><body></body></html>`);
});
srv.listen(0, '127.0.0.1', async () => {
  const port = srv.address().port;
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'load', timeout: 60000 });
    await page.waitForFunction(() => typeof window.pdfjsLib !== 'undefined', null, { timeout: 60000 });
    const dataUrl = await page.evaluate(async ({ b64, pageNum, width, workerUrl }) => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
      const pg = await pdf.getPage(Math.min(Math.max(1, pageNum), pdf.numPages));
      const vp1 = pg.getViewport({ scale: 1 });
      const scale = width / vp1.width;
      const vp = pg.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = vp.width; canvas.height = vp.height;
      const ctx = canvas.getContext('2d');
      await pg.render({ canvasContext: ctx, viewport: vp }).promise;
      return canvas.toDataURL('image/png');
    }, { b64, pageNum, width, workerUrl: PDFJS_WORKER });
    const outPath = path.resolve(process.cwd(), out);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, Buffer.from(dataUrl.split(',')[1], 'base64'));
    console.log(`✅ Rendered trang ${pageNum} → ${out} (${(fs.statSync(outPath).size / 1024).toFixed(0)} KB)`);
  } finally {
    await browser.close();
    srv.close();
  }
});
