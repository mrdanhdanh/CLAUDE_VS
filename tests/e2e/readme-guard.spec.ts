import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * README guard — chống tái lập KN-058 (bug thật 2026-09-13):
 * GitHub viewscreen render mermaid trong iframe sandbox; khi `ready:ack` tới trước `data`
 * (race phía GitHub, repro được y nguyên message "Cannot read properties of undefined
 * (reading 'render')") → README front page hiện "Unable to render rich display".
 * Fix: front page dùng SVG tĩnh (<picture> light/dark) — không iframe, không race.
 * Nguồn mermaid giữ nguyên ở docs/harness-flow.md (blob page render ổn).
 *
 * Invariants:
 *   1. README.md KHÔNG chứa ```mermaid (front page không phụ thuộc rich-display iframe)
 *   2. docs/assets/harness-pipeline-{light,dark}.svg tồn tại + được README tham chiếu qua <picture>
 *   3. Nguồn mermaid vẫn còn trong docs/harness-flow.md (không mất source of truth)
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
