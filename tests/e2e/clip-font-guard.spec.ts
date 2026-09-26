import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Guard font coverage tiếng Việt cho clip canvas (KN-082, 26.09.2026)
 *
 * Vì sao: Georgia thiếu glyph ằ/ấ/ớ/ố → canvas rơi fallback vỡ metrics ("thô ng kê"),
 * KHÔNG throw, KHÔNG console error — guard ảnh (verify-frames) chỉ chụp cho người xem
 * nên bug sống 2 clip. Lưới này quét máy: mọi clip page không được khai font blacklist
 * cho text, + negative control chứng minh checker thật sự bắt được (KN-074: phải chứng minh đã chạy).
 *
 * Font đã đo sạch trên máy render (Windows + headless Chromium, xem
 * `.github/skills/video-clip/references/font-test.mjs`): Times New Roman · Cambria ·
 * Palatino Linotype · Segoe UI · Consolas · Courier New · Cascadia Mono.
 * Thêm font mới: đo trước rồi mới whitelist.
 */

const ROOT = process.cwd();
const WWW = path.join(ROOT, 'www');

const BLACKLIST = ['Georgia'];

/** Tìm khai báo font (const/let/var tên chứa font|serif|mono|sans, hoặc default param `font =`). */
function fontViolations(html: string): string[] {
  const hits = new Set<string>();
  for (const m of html.matchAll(/(?:const|let|var)\s+([\w$]+)\s*=\s*['"`]([^'"`]+)['"`]/g)) {
    if (!/font|serif|mono|sans/i.test(m[1])) continue;
    for (const bad of BLACKLIST) if (m[2].includes(bad)) hits.add(`${m[1]}='${m[2]}'`);
  }
  for (const m of html.matchAll(/[\s(,]font\s*=\s*['"`]([^'"`]+)['"`]/g)) {
    for (const bad of BLACKLIST) if (m[1].includes(bad)) hits.add(`font='${m[1]}'`);
  }
  return [...hits];
}

/** Clip pages: mọi www/<slug>/index.html có canvas 1080×1920 (contract clip). */
function clipPages(): { file: string; html: string }[] {
  const out: { file: string; html: string }[] = [];
  for (const d of fs.readdirSync(WWW, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    const p = path.join(WWW, d.name, 'index.html');
    if (!fs.existsSync(p)) continue;
    const html = fs.readFileSync(p, 'utf8');
    if (/canvas id="canvas" width="1080"/.test(html)) out.push({ file: path.relative(ROOT, p), html });
  }
  return out;
}

test.describe('Clip font coverage — guard KN-082 (Georgia vỡ dấu VN im lặng)', () => {
  test('negative control: checker bắt Georgia const/default param, tha glyph đơn + font sạch', () => {
    expect(fontViolations(`const SERIF = 'Georgia';`).length, 'const SERIF=Georgia phải bị bắt').toBeGreaterThan(0);
    expect(fontViolations(`function text(font = 'Georgia') {}`).length, 'default param Georgia phải bị bắt').toBeGreaterThan(0);
    expect(fontViolations(`text('“', 130, 810, 110, C.yellow, 800, 'left', 'Georgia')`).length, 'glyph đơn (dấu ngoặc kép) — không phải text VN, phải tha').toBe(0);
    expect(fontViolations(`const SERIF = 'Times New Roman';\nconst MONO = 'Consolas';`).length, 'font đo sạch không được false-positive').toBe(0);
  });

  test('mọi clip page: không font blacklist cho text (marker: scan phải tìm thấy pages)', () => {
    const pages = clipPages();
    expect(pages.length, 'scan phải tìm thấy clip pages (KN-074: chứng minh đã chạy, không pass rỗng)').toBeGreaterThanOrEqual(6);
    const bad: string[] = [];
    for (const { file, html } of pages) for (const v of fontViolations(html)) bad.push(`${file}: ${v}`);
    expect(bad, `font thiếu coverage tiếng Việt (KN-082) — dùng Times New Roman / Cambria / Segoe UI:\n${bad.join('\n')}`).toEqual([]);
  });
});
