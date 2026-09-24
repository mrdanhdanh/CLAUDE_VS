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
 *  2. output thật `.claude/rules/` suy từ registry (enabled) + applyTo trong file nguồn
 *     — bật/tắt instruction không còn làm đỏ oan (amend 2026-09-24)
 *  3. CLI vẫn sống sau main-guard (import-guard không được làm chết entrypoint)
 */

const ROOT = process.cwd();
const MOD = path.join(ROOT, '.github', 'harness', 'scripts', 'harness-manager.mjs');
const INSTR_DIR = path.join(ROOT, '.github', 'instructions');

function read(f: string): string {
  return fs.readFileSync(path.join(ROOT, '.claude', 'rules', f), 'utf8');
}

/** applyTo khai trong FILE NGUỒN (không dùng registry.applyTo — field đó còn cũ, xem KN-045). */
function sourceApplyTo(name: string): string {
  const p = path.join(INSTR_DIR, `${name}.instructions.md`);
  if (!fs.existsSync(p)) return '';
  const fm = (fs.readFileSync(p, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/) || [])[1] || '';
  return (fm.match(/^applyTo:\s*"?(.*?)"?\s*$/m) || [])[1] || '**';
}

/** So 1 rule đã xuất với kỳ vọng suy từ applyTo nguồn; trả '' nếu khớp. */
function ruleProblem(name: string, content: string): string {
  const applyTo = sourceApplyTo(name);
  if (applyTo === '**') {
    return content.startsWith('---') ? `always-on lại có frontmatter: ${name}.md` : '';
  }
  // paths list phải bằng đúng splitGlobs(applyTo) — cùng hàm exporter dùng
  const expected = runSplitGlobs([applyTo])[0];
  const actual = [...content.matchAll(/^\s*-\s*"(.*)"$/gm)].map((m) => m[1]);
  if (JSON.stringify(actual) === JSON.stringify(expected)) return '';
  return `${name}.md paths lệch: nhận ${JSON.stringify(actual)} ≠ ${JSON.stringify(expected)}`;
}

/** Thu mọi lệch giữa .claude/rules/ và registry (enabled) + applyTo trong file nguồn. */
function collectRuleProblems(): string[] {
  const rulesDir = path.join(ROOT, '.claude', 'rules');
  const registry = JSON.parse(fs.readFileSync(path.join(ROOT, '.github/harness/registry.json'), 'utf8'));
  const entries = Object.entries<{ enabled?: boolean }>(registry.instructions || {});
  const problems: string[] = [];
  for (const [name, entry] of entries) {
    const rulePath = path.join(rulesDir, `${name}.md`);
    const exists = fs.existsSync(rulePath);
    if (entry.enabled === false) {
      if (exists) problems.push(`disabled nhưng vẫn xuất: ${name}.md`);
      continue;
    }
    if (!exists) {
      problems.push(`enabled nhưng thiếu rule: ${name}.md`);
      continue;
    }
    const problem = ruleProblem(name, fs.readFileSync(rulePath, 'utf8'));
    if (problem) problems.push(problem);
  }
  return problems;
}

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

test('export thật: mọi instruction ENABLED có rule khớp applyTo nguồn, DISABLED không xuất', () => {
  // Guard KN-056 (bản 2026-09-24): trước đây test hardcode tên 4 file → đỏ oan mỗi lần
  // bật/tắt instruction. Bản này suy ra kỳ vọng từ registry (enabled) + applyTo trong
  // FILE NGUỒN (không dùng registry.applyTo — field đó còn cũ, xem KN-045).
  expect(collectRuleProblems(), 'export .claude/rules lệch registry/nguồn').toEqual([]);

  // Ca hồi quy cụ thể của guard gốc 18/09: applyTo comma top-level → paths list 2 dòng.
  expect(read('yunie-personality.md')).toContain('paths:\n  - "www/yunie-chat/**"\n  - ".github/agents/**"');
});

test('main-guard: CLI vẫn chạy khi gọi trực tiếp (status exit 0 + có output)', () => {
  const r = spawnSync(process.execPath, [MOD, 'status'], { cwd: ROOT, encoding: 'utf8', timeout: 30_000 });
  expect(r.status, `status exit 0 — stderr: ${r.stderr}`).toBe(0);
  expect(r.stdout.trim().length, 'status phải in output — main-guard không được làm CLI im lặng').toBeGreaterThan(0);
});
