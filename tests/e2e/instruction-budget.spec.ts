import { test, expect } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * Instruction Budget (2026-09-16): pool instruction `applyTo: "**"` load MỌI session
 * = thuế token thường trú. Nguồn: HackerNoon 16/09/2026 "How to Write a CLAUDE.md..."
 * (curated mirror www/ai-news/curated.json). Spec khoá 4 mắt xích:
 *  1. report trên repo thật: JSON hợp lệ + alwaysOn tính đúng = tổng dòng file "**"
 *  2. ratchet: pool always-on ≤ softBudget (vượt = phải path-scope/gộp trước — KN-047)
 *  3. gate `--budget`: vượt → exit 1, trong → exit 0
 *  4. fail-closed: dir rỗng / không tồn tại → exit 2 (không pass oan)
 *  5. fail-closed arg: số rác / flag thiếu giá trị / dạng "=" / flag lạ → exit 2
 *     (regression 2026-09-18: parseInt('abc') = NaN → so sánh luôn false → pass oan exit 0)
 *     + vòng 3 (OCR review): single-dash `-budget` / positional `budget 1100` → exit 2
 */

const ROOT = process.cwd();
const SCRIPT = path.join(ROOT, 'scripts', 'instruction-budget.mjs');

function run(args: string[]) {
  return spawnSync(process.execPath, [SCRIPT, ...args], { cwd: ROOT, encoding: 'utf8', timeout: 30_000 });
}

function tmpdir(tag: string) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `budget-${tag}-`));
}

test('report repo thật: JSON hợp lệ + alwaysOn khớp tổng dòng + ratchet chưa vượt', () => {
  const r = run(['--json']);
  expect(r.status, `exit 0 — stderr: ${r.stderr}`).toBe(0);
  const data = JSON.parse(r.stdout);

  expect(data.files).toBeGreaterThanOrEqual(15);
  const alwaysOnRows = data.rows.filter((x: { alwaysOn: boolean }) => x.alwaysOn);
  expect(data.alwaysOn.count).toBe(alwaysOnRows.length);
  expect(data.alwaysOn.lines).toBe(
    alwaysOnRows.reduce((s: number, x: { lines: number }) => s + x.lines, 0)
  );

  // Core fail-safe phải là always-on (KN: knowleged/governance không được rời "**" khi chưa có thay thế)
  const gov = data.rows.find((x: { name: string }) => x.name === 'agent-governance');
  expect(gov.alwaysOn, 'agent-governance phải luôn là always-on').toBe(true);

  // Ratchet: pool always-on không vượt soft budget — vượt thì spec này đỏ = tín hiệu path-scope
  expect(data.alwaysOn.lines, 'pool always-on vượt ratchet — path-scope hoặc gộp trước khi thêm mới').toBeLessThanOrEqual(data.softBudget);
});

test('gate --budget: 63 dòng always-on → budget 10 fail exit 1, budget 9999 pass exit 0', () => {
  const dir = tmpdir('gate');
  const always = ['---', 'applyTo: "**"', '---', ...Array.from({ length: 60 }, (_, i) => `line ${i + 1}`)].join('\n');
  fs.writeFileSync(path.join(dir, 'a.instructions.md'), always, 'utf8');
  fs.writeFileSync(path.join(dir, 'b.instructions.md'), ['---', 'applyTo: "**/*.ts"', '---', '# B'].join('\n'), 'utf8');

  const report = run(['--dir', dir, '--json']);
  expect(report.status).toBe(0);
  const data = JSON.parse(report.stdout);
  expect(data.alwaysOn.count).toBe(1);
  expect(data.alwaysOn.lines).toBe(63); // 3 frontmatter + 60 body
  expect(data.scoped.count).toBe(1);

  const fail = run(['--dir', dir, '--budget', '10']);
  expect(fail.status, 'vượt budget phải exit 1').toBe(1);

  const pass = run(['--dir', dir, '--budget', '9999']);
  expect(pass.status, 'trong budget phải exit 0').toBe(0);
});

test('fail-closed: dir rỗng → exit 2, dir không tồn tại → exit 2', () => {
  const empty = run(['--dir', tmpdir('empty')]);
  expect(empty.status).toBe(2);

  const missing = run(['--dir', path.join(os.tmpdir(), `budget-nope-${Date.now()}`)]);
  expect(missing.status).toBe(2);
});

test('fail-closed arg: số rác/flag lạ không được NaN-pass oan — --budget abc / --top abc / thiếu giá trị / --budget=9999 / -budget / positional → exit 2', () => {
  const nanBudget = run(['--budget', 'abc']);
  expect(nanBudget.status, '--budget abc phải exit 2 (trước fix 18/09: NaN-pass exit 0)').toBe(2);
  expect(nanBudget.stderr).toMatch(/fail-closed/);

  const nanTop = run(['--top', 'abc']);
  expect(nanTop.status, '--top abc phải exit 2 thay vì top rỗng').toBe(2);

  const missingValue = run(['--budget']);
  expect(missingValue.status, '--budget thiếu giá trị phải exit 2 (flag không được nuốt im lặng)').toBe(2);

  const topMissing = run(['--top']);
  expect(topMissing.status, '--top thiếu giá trị cũng phải exit 2 (nhất quán với --budget)').toBe(2);

  const eqForm = run(['--budget=9999']);
  expect(eqForm.status, '--budget=9999 (dạng =) không nhận diện → exit 2, gate không được tưởng bật mà tắt').toBe(2);

  const singleDash = run(['-budget', '1100']);
  expect(singleDash.status, '-budget (single-dash typo) không được nuốt im lặng → exit 2 (vòng 3 OCR review)').toBe(2);

  const positional = run(['budget', '1100']);
  expect(positional.status, 'positional "budget 1100" (thiếu --) không được tắt gate im lặng → exit 2 (vòng 3 OCR review)').toBe(2);
});
