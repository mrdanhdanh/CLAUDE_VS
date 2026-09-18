import { test, expect } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * Auto-Learn — Vòng chống tái lập (KN-056): bug đã có KN vẫn quay lại vì
 * KN chỉ là văn xuôi — không có gì tự phát hiện "tái lập" và không có gì FAIL khi thiếu lưới.
 *
 * Spec này khoá 5 mắt xích (dogfood: guard của KN-056 + KN-062):
 *  1. `log` tự RADAR — đối chiếu KN + bug cũ (BM25, ngưỡng 25/18) → cảnh báo + inject vào bug.md.
 *  2. `propose` GUARD GATE — bug major/critical thiếu `Guard:` → cảnh báo; `--strict` exit 1.
 *  3. `guards` coverage audit — KN nào có lưới (được test file tham chiếu) — đo được, không wish.
 *  4. `evaluate` CONSOLIDATION gate (KN-062 — Memora): KN trùng ≥ threshold → FAIL + chỉ đích danh + hint GỘP;
 *     chủ đề mới → PASS không chặn oan. Retrieval/consolidation phải có lưới, không chỉ văn xuôi.
 *  5. `propose` LAYER (co-evolution — Echoverse): parse `Layer:` (tầng chứa defect) + soft-warn khi thiếu
 *     — load-bearing wiring (parse/warn/json/draft), không hard gate. Attribution đúng = human judgment.
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

function fixtureBug(slug: string, extraMeta = '', title = 'Fixture tái lập (spec auto-learn-guard)'): string {
  return `# Bug: ${title}

- **Slug:** \`${slug}\`
- **Ngày:** 2026-09-13
- **Severity:** major
- **Tags:** \`test\` \`fixture\`
${extraMeta}
## 3. Fix

- **Approach:** fixture để test guard gate — không phải bug thật, nội dung đủ dài để qua checkBugReadiness (>50 ký tự)

## 4. Verification

- [x] N/A — fixture hermetic (spec spawn CLI), không cần re-run thật
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

  test('guards: fixture refs KHÔNG tính là lưới (guard ảo — review 2026-09-18)', () => {
    const r = run(['guards', '--json']);
    expect(r.status).toBe(0);
    const data = JSON.parse(r.stdout);
    const files = (id: string): string[] => data.guards[id] || [];
    // dream.spec.ts dùng các id KN-0xx làm fixture DATA (row/block/toEqual) — không phải citation bài học (KN-049 class: đo nhầm tín hiệu)
    expect(files('KN-001'), 'fixture dream.spec không tính là lưới').not.toContain('tests/e2e/dream.spec.ts');
    expect(files('KN-003'), 'KN-003 vẫn giữ lưới thật angle.spec').toContain('tests/e2e/angle.spec.ts');
    expect(files('KN-003'), 'dream.spec (fixture) không tính').not.toContain('tests/e2e/dream.spec.ts');
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
      // KN-062: tags parse không được lẫn '**' từ format '- **Tags:**' (leak vào table row/draft)
      expect(data.tags, 'tags phải sạch khỏi ký tự bold').not.toContain('*');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
});

  test('evaluate: KN trùng → FAIL + chỉ đích danh + hint GỘP (consolidation gate — KN-062)', () => {
    const dir = tmpdir('dup');
    const slug = '2026-09-14-fixture-dup';
    try {
      writeFixture(dir, slug, fixtureBug(slug, '', 'Rainbow border conic-gradient var lồng không xoay khi hover'));

      const r = run(['evaluate', '--bug', slug, '--dir', dir, '--json']);
      expect(r.status, `evaluate exit 0 — stderr: ${r.stderr}`).toBe(0);
      const data = JSON.parse(r.stdout);
      expect(data.decision).toBe('FAIL');
      expect(data.checks.isDuplicate).toBe(true);
      const reasons = data.reasons.join(' ');
      expect(reasons, 'phải chỉ đích danh KN cũ (consolidation)').toMatch(/KN-00[34]/);
      expect(reasons, 'phải hint GỘP/amend thay vì tạo mới (Memora consolidation)').toMatch(/GỘP|amend/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  test('evaluate: chủ đề mới → không trùng → PASS (không chặn oan)', () => {
    const dir = tmpdir('novel');
    const slug = '2026-09-14-fixture-novel';
    try {
      writeFixture(dir, slug, fixtureBug(slug, '', 'Zqxjvk kxqzvj mqzvjk'));

      const r = run(['evaluate', '--bug', slug, '--dir', dir, '--json']);
      expect(r.status, `evaluate exit 0 — stderr: ${r.stderr}`).toBe(0);
      const data = JSON.parse(r.stdout);
      expect(data.checks.isDuplicate, 'query novel không được trùng').toBe(false);
      expect(data.decision).toBe('PASS');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  test('guard co-evolution: propose parse Layer + soft-warn khi thiếu (behavioral wiring, không hard gate)', () => {
    const dir = tmpdir('layer');
    try {
      writeFixture(dir, 'with-layer', fixtureBug('with-layer', '- **Layer:** env-fixture\n'));
      writeFixture(dir, 'no-layer', fixtureBug('no-layer'));

      const r1 = run(['propose', '--bug', 'with-layer', '--dir', dir, '--json']);
      expect(r1.status, r1.stderr).toBe(0);
      const d1 = JSON.parse(r1.stdout);
      expect(d1.layer?.present, 'Layer: env-fixture phải được parse (load-bearing, không theater)').toBe(true);
      expect(d1.layer.raw).toContain('env-fixture');
      expect(d1.layerWarning).toBeNull();
      expect(d1.draft, 'KN draft phải mang Layer line').toContain('**Layer:**');

      const r2 = run(['propose', '--bug', 'no-layer', '--dir', dir, '--json']);
      expect(r2.status).toBe(0);
      const d2 = JSON.parse(r2.stdout);
      expect(d2.layer?.present).toBe(false);
      expect(d2.layerWarning, 'thiếu Layer → soft-warn (không im lặng, không chặn)').toBeTruthy();
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
