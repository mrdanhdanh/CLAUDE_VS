import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * README guard — chống tái lập KN-058 (bug thật 2026-09-13, 2 lớp):
 *  Lớp 1: GitHub viewscreen render mermaid trong iframe sandbox; khi `ready:ack` tới trước `data`
 *         (race phía GitHub, repro được y nguyên message "Cannot read properties of undefined
 *         (reading 'render')") → README front page hiện "Unable to render rich display".
 *  Lớp 2: SVG thay thế phải LÀ XML HỢP LỆ decode được dạng <img> — bản đầu lọt
 *         foreignObject + `<br>` không đóng (mermaid v11 đọc htmlLabels ở TOP-LEVEL, không phải
 *         trong flowchart) → "source image cannot be decoded" → ảnh vỡ im lặng.
 * Fix: front page dùng SVG tĩnh (<picture> light/dark) render với htmlLabels:false.
 * Nguồn mermaid giữ nguyên ở docs/harness-flow.md (blob page render ổn).
 *
 * Invariants:
 *   1. README.md KHÔNG chứa ```mermaid (front page không phụ thuộc rich-display iframe)
 *   2. docs/assets/harness-pipeline-{light,dark}.svg tồn tại + được README tham chiếu qua <picture>
 *   3. Nguồn mermaid vẫn còn trong docs/harness-flow.md (không mất source of truth)
 *   4. SVG là XML hợp lệ, KHÔNG chứa foreignObject (tồn tại ≠ render được — KN-058 lớp 2)
 *   5. SVG decode được thật dạng <img> (img.decode() + naturalWidth > 0 — như README dùng)
 */

const ROOT = process.cwd();
const README = path.join(ROOT, 'README.md');
const ASSETS = ['docs/assets/harness-pipeline-light.svg', 'docs/assets/harness-pipeline-dark.svg'];

test('README.md không chứa mermaid block (front page dùng SVG tĩnh)', () => {
  const readme = fs.readFileSync(README, 'utf8');
  expect(readme).not.toContain('```mermaid');
});

test('SVG light/dark tồn tại và được README tham chiếu', () => {
  const readme = fs.readFileSync(README, 'utf8');
  for (const rel of ASSETS) {
    const file = path.join(ROOT, rel);
    expect(fs.existsSync(file), `${rel} phải tồn tại`).toBe(true);
    const svg = fs.readFileSync(file, 'utf8');
    expect(svg).toContain('<svg');
    expect(readme, `README phải tham chiếu ${rel}`).toContain(rel);
  }
  expect(readme).toContain('prefers-color-scheme: dark');
});

test('mermaid source vẫn còn ở docs/harness-flow.md', () => {
  const doc = fs.readFileSync(path.join(ROOT, 'docs', 'harness-flow.md'), 'utf8');
  expect(doc).toContain('```mermaid');
});

test('SVG là XML hợp lệ + không chứa foreignObject (htmlLabels:false)', async ({ page }) => {
  for (const rel of ASSETS) {
    const svg = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    const res = await page.evaluate((text) => {
      const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
      const err = doc.querySelector('parsererror');
      return { xmlOk: !err, errMsg: err ? err.textContent.slice(0, 200) : null, hasFO: text.includes('foreignObject') };
    }, svg);
    expect(res.xmlOk, `${rel}: XML phải hợp lệ — ${res.errMsg ?? ''}`).toBe(true);
    expect(res.hasFO, `${rel}: không được chứa foreignObject (mermaid htmlLabels chưa tắt chuẩn — v11 cần key top-level)`).toBe(false);
  }
});

test('SVG decode được dạng <img> (như README dùng)', async ({ page }) => {
  for (const rel of ASSETS) {
    const svg = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    const dataUri = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
    const res = await page.evaluate(async (uri) => {
      const img = new Image();
      img.src = uri;
      try {
        await img.decode();
        return { ok: true, w: img.naturalWidth, h: img.naturalHeight };
      } catch {
        return { ok: false, w: 0, h: 0 };
      }
    }, dataUri);
    expect(res.ok, `${rel}: phải decode được dạng image`).toBe(true);
    expect(res.w, `${rel}: naturalWidth phải > 0`).toBeGreaterThan(0);
    expect(res.h, `${rel}: naturalHeight phải > 0`).toBeGreaterThan(0);
  }
});
