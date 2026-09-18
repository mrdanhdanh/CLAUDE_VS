import { test, expect } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * Guard (KN-056 — OCR review vòng 3, 18/09/2026): `buildRules` export-claude tách `applyTo`
 * comma top-level → YAML `paths:` list (VS Code "a/**,b/**" ↔ Claude Code paths list).
 * Regression bắt được: comma đôi sinh phần tử rỗng (`- ""` trong paths) + không lưới nào
 * phủ `splitGlobs`. Spec khoá 3 mắt xích:
 *  1. splitGlobs unit (qua node con — module có main-guard, import không chạy CLI)
 *  2. output thật `.claude/rules/`: scoped → paths list đúng · always-on → không frontmatter
 *  3. CLI vẫn sống sau main-guard (import-guard không được làm chết entrypoint)
 */

const ROOT = process.cwd();
const MOD = path.join(ROOT, '.github', 'harness', 'scripts', 'harness-manager.mjs');

function runSplitGlobs(cases: string[]): string[][] {
  const code = [
    `const m = await import(${JSON.stringify(pathToFileURL(MOD).href)});`,
    `const cases = ${JSON.stringify(cases)};`,
    'console.log(JSON.stringify(cases.map((c) => m.splitGlobs(c))));',
  ].join('\n');
  const r = spawnSync(process.execPath, ['--input-type=module', '-e', code], { cwd: ROOT, encoding: 'utf8', timeout: 30_000 });
  expect(r.status, `node con phải exit 0 — stderr: ${r.stderr}`).toBe(0);
  return JSON.parse(r.stdout);
}

test('splitGlobs: tách comma top-level, giữ {} nguyên khối, bỏ phần tử rỗng', () => {
  const out = runSplitGlobs(['a/**,b/**', 'a/**, b/**', '**/*.{html,css}', 'a/**,,**', ',a/**', '', '{a,b']);
  expect(out[0]).toEqual(['a/**', 'b/**']);
  expect(out[1]).toEqual(['a/**', 'b/**']); // trim khoảng trắng quanh glob
  expect(out[2]).toEqual(['**/*.{html,css}']); // comma trong {} KHÔNG tách
  expect(out[3]).toEqual(['a/**', '**']); // comma đôi → không sinh phần tử rỗng (regression 18/09)
  expect(out[4]).toEqual(['a/**']);
  expect(out[5]).toEqual([]);
  expect(out[6]).toEqual(['{a,b']); // { không đóng → không tách (an toàn, không crash)
});

test('export thật: rule scoped có paths list đúng, always-on không frontmatter', () => {
  const read = (f: string) => fs.readFileSync(path.join(ROOT, '.claude', 'rules', f), 'utf8');
  expect(read('yunie-personality.md')).toContain('paths:\n  - "www/yunie-chat/**"\n  - ".github/agents/**"');
  expect(read('platform-seam.md')).toContain('paths:\n  - ".agent/**"\n  - "www/components/**"');
  expect(read('cosmic-quantum.md')).toContain('paths:\n  - ".agent/plans/**"\n  - "www/cosmos/**"\n  - "www/cosmos.html"');
  expect(read('agent-governance.md').startsWith('<!--'), 'always-on ("**") không được có frontmatter paths').toBe(true);
});

test('main-guard: CLI vẫn chạy khi gọi trực tiếp (status exit 0 + có output)', () => {
  const r = spawnSync(process.execPath, [MOD, 'status'], { cwd: ROOT, encoding: 'utf8', timeout: 30_000 });
  expect(r.status, `status exit 0 — stderr: ${r.stderr}`).toBe(0);
  expect(r.stdout.trim().length, 'status phải in output — main-guard không được làm CLI im lặng').toBeGreaterThan(0);
});
