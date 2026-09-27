# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: clip-font-guard.spec.ts >> Clip font coverage — guard KN-082 (Georgia vỡ dấu VN im lặng) >> mọi clip page: không font blacklist cho text (marker: scan phải tìm thấy pages)
- Location: tests\e2e\clip-font-guard.spec.ts:58:7

# Error details

```
Error: scan phải tìm thấy clip pages (KN-074: chứng minh đã chạy, không pass rỗng)

expect(received).toBeGreaterThanOrEqual(expected)

Expected: >= 6
Received:    0
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import fs from 'node:fs';
  3  | import path from 'node:path';
  4  | 
  5  | /**
  6  |  * Guard font coverage tiếng Việt cho clip canvas (KN-082, 26.09.2026)
  7  |  *
  8  |  * Vì sao: Georgia thiếu glyph ằ/ấ/ớ/ố → canvas rơi fallback vỡ metrics ("thô ng kê"),
  9  |  * KHÔNG throw, KHÔNG console error — guard ảnh (verify-frames) chỉ chụp cho người xem
  10 |  * nên bug sống 2 clip. Lưới này quét máy: mọi clip page không được khai font blacklist
  11 |  * cho text, + negative control chứng minh checker thật sự bắt được (KN-074: phải chứng minh đã chạy).
  12 |  *
  13 |  * Font đã đo sạch trên máy render (Windows + headless Chromium, xem
  14 |  * `.github/skills/video-clip/references/font-test.mjs`): Times New Roman · Cambria ·
  15 |  * Palatino Linotype · Segoe UI · Consolas · Courier New · Cascadia Mono.
  16 |  * Thêm font mới: đo trước rồi mới whitelist.
  17 |  */
  18 | 
  19 | const ROOT = process.cwd();
  20 | const WWW = path.join(ROOT, 'www');
  21 | 
  22 | const BLACKLIST = ['Georgia'];
  23 | 
  24 | /** Tìm khai báo font (const/let/var tên chứa font|serif|mono|sans, hoặc default param `font =`). */
  25 | function fontViolations(html: string): string[] {
  26 |   const hits = new Set<string>();
  27 |   for (const m of html.matchAll(/(?:const|let|var)\s+([\w$]+)\s*=\s*['"`]([^'"`]+)['"`]/g)) {
  28 |     if (!/font|serif|mono|sans/i.test(m[1])) continue;
  29 |     for (const bad of BLACKLIST) if (m[2].includes(bad)) hits.add(`${m[1]}='${m[2]}'`);
  30 |   }
  31 |   for (const m of html.matchAll(/[\s(,]font\s*=\s*['"`]([^'"`]+)['"`]/g)) {
  32 |     for (const bad of BLACKLIST) if (m[1].includes(bad)) hits.add(`font='${m[1]}'`);
  33 |   }
  34 |   return [...hits];
  35 | }
  36 | 
  37 | /** Clip pages: mọi www/<slug>/index.html có canvas 1080×1920 (contract clip). */
  38 | function clipPages(): { file: string; html: string }[] {
  39 |   const out: { file: string; html: string }[] = [];
  40 |   for (const d of fs.readdirSync(WWW, { withFileTypes: true })) {
  41 |     if (!d.isDirectory()) continue;
  42 |     const p = path.join(WWW, d.name, 'index.html');
  43 |     if (!fs.existsSync(p)) continue;
  44 |     const html = fs.readFileSync(p, 'utf8');
  45 |     if (/canvas id="canvas" width="1080"/.test(html)) out.push({ file: path.relative(ROOT, p), html });
  46 |   }
  47 |   return out;
  48 | }
  49 | 
  50 | test.describe('Clip font coverage — guard KN-082 (Georgia vỡ dấu VN im lặng)', () => {
  51 |   test('negative control: checker bắt Georgia const/default param, tha glyph đơn + font sạch', () => {
  52 |     expect(fontViolations(`const SERIF = 'Georgia';`).length, 'const SERIF=Georgia phải bị bắt').toBeGreaterThan(0);
  53 |     expect(fontViolations(`function text(font = 'Georgia') {}`).length, 'default param Georgia phải bị bắt').toBeGreaterThan(0);
  54 |     expect(fontViolations(`text('“', 130, 810, 110, C.yellow, 800, 'left', 'Georgia')`).length, 'glyph đơn (dấu ngoặc kép) — không phải text VN, phải tha').toBe(0);
  55 |     expect(fontViolations(`const SERIF = 'Times New Roman';\nconst MONO = 'Consolas';`).length, 'font đo sạch không được false-positive').toBe(0);
  56 |   });
  57 | 
  58 |   test('mọi clip page: không font blacklist cho text (marker: scan phải tìm thấy pages)', () => {
  59 |     const pages = clipPages();
> 60 |     expect(pages.length, 'scan phải tìm thấy clip pages (KN-074: chứng minh đã chạy, không pass rỗng)').toBeGreaterThanOrEqual(6);
     |                                                                                                         ^ Error: scan phải tìm thấy clip pages (KN-074: chứng minh đã chạy, không pass rỗng)
  61 |     const bad: string[] = [];
  62 |     for (const { file, html } of pages) for (const v of fontViolations(html)) bad.push(`${file}: ${v}`);
  63 |     expect(bad, `font thiếu coverage tiếng Việt (KN-082) — dùng Times New Roman / Cambria / Segoe UI:\n${bad.join('\n')}`).toEqual([]);
  64 |   });
  65 | });
  66 | 
```