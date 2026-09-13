import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Hooks integrity — Guard cho KN-039 (tái lập class 2026-09-13): lệnh trong hooks.json được
 * VS Code chạy qua PowerShell. Metacharacter `( ) | ; &` + backtick bị parse thành
 * subexpression/pipe → hook lỗi "The term 'x' is not recognized"
 * (bug thật: `echo ... (lưới chống tái lập: guards)` — Stop hook spam lỗi).
 *
 * Invariants:
 *   1. hooks.json: JSON hợp lệ, mọi command free of PowerShell metacharacter, timeout dương
 *   2. .claude/settings.json (export từ hooks.json): cùng invariant — chống drift bản export
 */

const ROOT = process.cwd();
const HOOKS_FILE = path.join(ROOT, '.github', 'hooks', 'hooks.json');
const CLAUDE_SETTINGS = path.join(ROOT, '.claude', 'settings.json');
const PS_METACHAR = /[()|;&`]/;

function collectCommands(node: unknown, out: string[] = []): string[] {
  if (Array.isArray(node)) {
    for (const item of node) collectCommands(item, out);
    return out;
  }
  if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      if (key === 'command' && typeof value === 'string') out.push(value);
      else collectCommands(value, out);
    }
  }
  return out;
}

function assertCommandsSafe(file: string) {
  const commands = collectCommands(JSON.parse(fs.readFileSync(file, 'utf8')));
  expect(commands.length, `${file}: phải có ít nhất 1 hook command`).toBeGreaterThan(0);
  for (const cmd of commands) {
    expect(
      PS_METACHAR.test(cmd),
      `${file}: command chứa metacharacter PowerShell → hook sẽ lỗi khi chạy: ${cmd}`
    ).toBe(false);
  }
}

test('hooks.json — mọi command an toàn với PowerShell metacharacters (KN-039)', () => {
  expect(fs.existsSync(HOOKS_FILE), '.github/hooks/hooks.json phải tồn tại').toBe(true);
  const data = JSON.parse(fs.readFileSync(HOOKS_FILE, 'utf8'));
  for (const [event, list] of Object.entries(data.hooks as Record<string, { timeout?: number }[]>)) {
    expect(Array.isArray(list), `${event} phải là array`).toBe(true);
    for (const hook of list) {
      expect(typeof hook.timeout === 'number' && hook.timeout > 0, `${event}: timeout phải là số dương`).toBe(true);
    }
  }
  assertCommandsSafe(HOOKS_FILE);
});

test('.claude/settings.json — bản export không drift khỏi invariant (KN-039)', () => {
  expect(fs.existsSync(CLAUDE_SETTINGS), '.claude/settings.json phải tồn tại (đã commit)').toBe(true);
  assertCommandsSafe(CLAUDE_SETTINGS);
});
