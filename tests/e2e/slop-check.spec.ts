import { test, expect } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * Slop Check scanner — hợp đồng đo (KN-049 residual, fix 2026-09-12):
 *
 * Incident: scanner strip từng dòng (line-local) → 2 bug:
 *   (A) template literal ĐA DÒNG: `` /`[^`]*`/g `` chỉ match khi backtick đóng cùng dòng →
 *       brace trong template bị đếm → depth không về 0 → hàm phía sau bị "nuốt" tới EOF (span sai,
 *       tên sai — vd logBug() 960 dòng = chính là swallow).
 *   (B) comment `//`: `.replace(/\/\/.*$/, '')` — `.` KHÔNG match line terminator, `\r` LÀ
 *       line terminator → file CRLF (working copy Windows) không strip được comment → keyword
 *       trong comment bị tính CC (vd parseKNs CC 20@LF vs 23@CRLF).
 *
 * Invariants khoá (spec ≠ wish — KN-047):
 *   1. Hàm sau multiline template được nhận diện riêng (không swallow tới EOF)
 *   2. Cùng nội dung LF vs CRLF → CÙNG findings (không phụ thuộc line-ending)
 *   3. Comment chứa keyword không bị tính CC (cả LF lẫn CRLF)
 *   4. Không regression: vẫn bắt dup ≥8 dòng · fn >80 dòng · CC >12
 *   5. Fail-closed: 0 file → exit 2
 */

const ROOT = process.cwd();
const SCRIPT = path.join(ROOT, 'scripts', 'slop-check.mjs');

function run(args: string[]) {
  return spawnSync(process.execPath, [SCRIPT, ...args], { cwd: ROOT, encoding: 'utf8', timeout: 60_000 });
}

function tmpdir(tag: string) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `slopcheck-${tag}-`));
}

test.describe('Slop Check — scanner invariants (KN-049)', () => {
  test('multiline template không "nuốt" hàm phía sau (span tới EOF)', () => {
    const dir = tmpdir('tpl');
    const lines = ['function tpl() {', '  const t = `', '    { "unbalanced": true', '  `;', '  return t.length;', '}', ''];
    lines.push('function after() {');
    for (let i = 0; i < 85; i++) lines.push(`  const v${i} = ${i};`);
    lines.push('  return v0;', '}');
    const f = path.join(dir, 'fixture.mjs');
    fs.writeFileSync(f, lines.join('\n') + '\n');

    const r = run([f]);
    const out = r.stdout + r.stderr;
    expect(out, 'after() (88 dòng) phải được nhận diện là function riêng').toMatch(/\[size\].*after\(\)/);
    expect(out, 'tpl() chỉ 6 dòng — không được flag [size] (bị swallow từ before-fix)').not.toMatch(/\[size\].*tpl\(\)/);
    expect(r.status).toBe(1); // vẫn có finding của after() — gate logic nguyên vẹn
  });

  test('LF vs CRLF: cùng nội dung → cùng findings', () => {
    const src = fs.readFileSync(path.join(ROOT, '.github/harness/scripts/auto-learn.mjs'), 'utf8').replace(/\r\n/g, '\n');
    const dir = tmpdir('eol');
    const lf = path.join(dir, 'eol-lf.mjs');
    const crlf = path.join(dir, 'eol-crlf.mjs');
    fs.writeFileSync(lf, src);
    fs.writeFileSync(crlf, src.replace(/\n/g, '\r\n'));

    const clean = (out: string) =>
      out
        .replaceAll(path.relative(ROOT, lf).replace(/\\/g, '/'), '<F>')
        .replaceAll(path.relative(ROOT, crlf).replace(/\\/g, '/'), '<F>');

    const a = run([lf]);
    const b = run([crlf]);
    expect(clean(a.stdout + a.stderr), 'LF vs CRLF phải identical (normalize \\r\\n khi đọc)').toBe(clean(b.stdout + b.stderr));
    expect(a.status, 'exit code cũng phải khớp').toBe(b.status);
  });

  test('comment chứa keyword không tính CC (LF + CRLF)', () => {
    const dir = tmpdir('cmt');
    const body = [
      'function quiet() {',
      '  const a = 1;',
      '  // if a && b then for loop while case catch',
      '  // if a && b then for loop while case catch',
      '  const b = a + 1;',
      '  const c = b + 1;',
      '  const d = c + 1;',
      '  const e = d + 1;',
      '  const f = e + 1;',
      '  const g = f + 1;',
      '  return g;',
      '}',
    ];
    const src = body.join('\n') + '\n';
    const lf = path.join(dir, 'cmt-lf.mjs');
    const crlf = path.join(dir, 'cmt-crlf.mjs');
    fs.writeFileSync(lf, src);
    fs.writeFileSync(crlf, src.replace(/\n/g, '\r\n'));

    const a = run([lf]);
    const b = run([crlf]);
    expect(a.stdout + a.stderr, 'LF: comment strip đúng → Clean').toContain('Clean');
    expect(b.stdout + b.stderr, 'CRLF: comment phải được strip như LF → Clean (before-fix: CC đếm cả comment)').toContain('Clean');
    expect(a.status).toBe(0);
    expect(b.status).toBe(0);
  });
});

test.describe('Slop Check — metric integrity & gate', () => {
  test('regression: vẫn bắt fn >80 dòng + CC >12 + dup ≥8 dòng cross-file', () => {
    const dir = tmpdir('reg');
    const big = ['function big() {'];
    for (let i = 0; i < 13; i++) big.push(`  if (a${i}) { b${i} = ${i}; }`);
    for (let i = 0; i < 72; i++) big.push(`  const p${i} = ${i};`);
    big.push('  return 0;', '}');
    const f1 = path.join(dir, 'reg1.mjs');
    fs.writeFileSync(f1, big.join('\n') + '\n');
    const r1 = run([f1]);
    expect(r1.stdout + r1.stderr).toMatch(/\[size\].*big\(\)/);
    expect(r1.stdout + r1.stderr).toMatch(/\[complexity\].*big\(\)/);

    const dupBlock = Array.from({ length: 9 }, (_, i) => `  const dup${i} = ${i} * 2;`).join('\n');
    const f2 = path.join(dir, 'reg2.mjs');
    const f3 = path.join(dir, 'reg3.mjs');
    fs.writeFileSync(f2, `function one() {\n${dupBlock}\n  return dup0;\n}\n`);
    fs.writeFileSync(f3, `function two() {\n${dupBlock}\n  return dup0;\n}\n`);
    const r2 = run([f2, f3]);
    expect(r2.stdout + r2.stderr, 'dup block 9 dòng cross-file phải bị bắt').toContain('Duplication');
  });

  test('fail-closed: 0 file → exit 2', () => {
    const r = run([]);
    expect(r.status).toBe(2);
    expect(r.stdout + r.stderr).toMatch(/cần ít nhất 1 file|fail-closed/i);
  });
});
