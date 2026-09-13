import { test, expect } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * Auto-Learn — Vòng chống tái lập (KN-056): bug đã có KN vẫn quay lại vì
 * KN chỉ là văn xuôi — không có gì tự phát hiện "tái lập" và không có gì FAIL khi thiếu lưới.
 *
 * Spec này khoá 3 mắt xích (dogfood: chính nó là guard của KN-056):
 *  1. `log` tự RADAR — đối chiếu KN + bug cũ (BM25, ngưỡng 25/18) → cảnh báo + inject vào bug.md.
 *  2. `propose` GUARD GATE — bug major/critical thiếu `Guard:` → cảnh báo; `--strict` exit 1.
 *  3. `guards` coverage audit — KN nào có lưới (được test file tham chiếu) — đo được, không wish.
 */

const ROOT = process.cwd();
const SCRIPT = path.join(ROOT, '.github', 'harness', 'scripts', 'auto-learn.mjs');

function run(args: string[]) {
  return spawnSync(process.execPath, [SCRIPT, ...args], { cwd: ROOT, encoding: 'utf8', timeout: 60_000 });
}

function tmpdir(tag: string) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `autolearn-${tag}-`));
}

function writeFixture(dir: string, slug: string, body: string) {
  fs.mkdirSync(path.join(dir, slug), { recursive: true });
  fs.writeFileSync(path.join(dir, slug, 'bug.md'), body, 'utf8');
}

function fixtureBug(slug: string, extraMeta = ''): string {
  return `# Bug: Fixture tái lập (spec auto-learn-guard)

- **Slug:** \`${slug}\`
- **Ngày:** 2026-09-13
- **Severity:** major
- **Tags:** \`test\` \`fixture\`
${extraMeta}
## 3. Fix

- **Approach:** fixture để test guard gate — không phải bug thật
`;
}

test('guards --json: coverage hợp lệ + bắt guard đã biết (KN-049, KN-056)', () => {
    const r = run(['guards', '--json']);
    expect(r.status, `guards exit 0 — stderr: ${r.stderr}`).toBe(0);
    const data = JSON.parse(r.stdout);

    // counts nhất quán
    expect(data.counts.total).toBeGreaterThanOrEqual(50);
    expect(data.counts.withGuard).toBeGreaterThanOrEqual(3);
    expect(data.counts.withoutGuard).toBe(data.counts.total - data.counts.withGuard);

    // guard đã biết: spec tham chiếu KN → phải được nhận diện (không wish — đo từ file thật)
    expect(data.guards['KN-049'], 'slop-check.spec.ts phải là lưới của KN-049').toContain(
      'tests/e2e/slop-check.spec.ts'
    );
    expect(data.guards['KN-056'], 'spec này là lưới của KN-056 (dogfood)').toContain(
      'tests/e2e/auto-learn-guard.spec.ts'
    );

    // priority = major/critical chưa lưới — mọi item phải đúng severity
    expect(Array.isArray(data.priority)).toBe(true);
    for (const m of data.priority) {
      expect(['major', 'critical']).toContain(m.severity);
      expect(m.id).toMatch(/^KN-\d{3}$/);
    }
    // chống hồi quy 2026-09-13: regex severity cũ không khớp "**Severity:**" → 0/55 major parse ra minor
    expect(
      data.counts.priority,
      'severity parse phải hoạt động (format **Severity:** bold) — prior fix: 0/55 major'
    ).toBeGreaterThanOrEqual(10);
  });

  test('guards: human output có coverage summary (fail-loud, không im lặng)', () => {
    const r = run(['guards']);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('GUARD COVERAGE');
    expect(r.stdout).toMatch(/có lưới: \d+/);
  });

  test('log --dry-run: radar bắt KN-003/004 cho bug rainbow + KHÔNG ghi file', () => {
    const dir = tmpdir('radar');
    const r = run([
      'log',
      '--error', 'rainbow border không xoay khi hover, conic-gradient biến lồng var()',
      '--title', 'Rainbow hover lặp lại lần nữa',
      '--file', 'www/styles.css',
      '--slug', 'test-radar-dry',
      '--dir', dir,
      '--dry-run',
    ]);
    const out = r.stdout + r.stderr;
    expect(r.status, `dry-run exit 0 — stderr: ${r.stderr}`).toBe(0);
    expect(out, 'radar phải cảnh báo tái lập').toContain('RADAR TÁI LẬP');
    expect(out, 'phải chỉ đích danh KN cũ liên quan (KN-003/004)').toMatch(/KN-00[34]/);
    expect(out).toContain('[dry-run]');
    // không ghi gì
    expect(fs.readdirSync(dir).length, 'dry-run không được tạo folder/file nào').toBe(0);
  });

  test('log (write, dir tạm): radar inject vào bug.md draft', () => {
    const dir = tmpdir('write');
    try {
      const r = run([
        'log',
        '--error', 'rainbow border không xoay khi hover',
        '--title', 'Rainbow hover tái lập thật',
        '--dir', dir,
      ]);
      expect(r.status).toBe(0);
      const bugDirs = fs.readdirSync(dir);
      expect(bugDirs.length).toBe(1);
      const content = fs.readFileSync(path.join(dir, bugDirs[0], 'bug.md'), 'utf8');
      expect(content, 'bug.md phải mang radar block').toContain('RADAR TÁI LẬP');
      expect(content).toMatch(/KN-00[34]/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  test('propose: major thiếu Guard → gateWarning trong JSON + --strict exit 1', () => {
    const dir = tmpdir('nogr');
    const slug = '2026-09-13-fixture-no-guard';
    try {
      writeFixture(dir, slug, fixtureBug(slug));

      const r = run(['propose', '--bug', slug, '--dir', dir, '--json']);
      expect(r.status, `non-strict exit 0 — stderr: ${r.stderr}`).toBe(0);
      const data = JSON.parse(r.stdout);
      expect(data.guard.present).toBe(false);
      expect(data.gateWarning, 'major thiếu Guard phải bị gate').toContain('THIẾU Guard');
      expect(data.draft).toContain('Guard');

      const strict = run(['propose', '--bug', slug, '--dir', dir, '--strict']);
      expect(strict.status, '--strict phải exit 1 khi gate FAIL').toBe(1);
      expect(strict.stdout + strict.stderr).toContain('GUARD GATE');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  test('propose: có Guard → gate PASS kể cả --strict', () => {
    const dir = tmpdir('guard');
    const slug = '2026-09-13-fixture-with-guard';
    try {
      writeFixture(dir, slug, fixtureBug(slug, '- **Guard:** `tests/e2e/auto-learn-guard.spec.ts`\n'));

      const r = run(['propose', '--bug', slug, '--dir', dir, '--strict', '--json']);
      expect(r.status, `strict + guard exit 0 — stderr: ${r.stderr}`).toBe(0);
      const data = JSON.parse(r.stdout);
      expect(data.guard.present).toBe(true);
      expect(data.gateWarning).toBeNull();
      expect(data.draft).toContain('tests/e2e/auto-learn-guard.spec.ts');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
});
