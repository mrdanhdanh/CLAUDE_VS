/**
 * kn-id-integrity.spec.ts — Guard KN-066 (integrity ID trong knowleged.md).
 *
 * Incident 14/09: 3 phiên song song cùng nhận KN-061 (Routing · Memora · Echoverse) →
 * 2 phiên cùng yield (double-yield — cả hai cùng nhận KN-062) → cascading renumber
 * 061→062→063; file có lúc chứa 2 khối cùng ID mà không máy nào bắt được.
 * Số cuối = KN-066: 064/065 bị 2 phiên khác lấy LIVE trong lúc build guard này
 * (vòng lặp tái diễn ngay) → guard phải robust với file lớn thêm (assert động).
 * Guard này khoá 4 invariant:
 *   1. Không trùng ID trong Bảng tóm tắt (`| KN-XXX |`)
 *   2. Không trùng ID trong Chi tiết (`### KN-XXX —`)
 *   3. Không orphan: mọi row có detail + mọi detail có row
 *   4. Thứ tự tăng dần ở cả 2 danh sách (gap được phép — 061 bỏ trống sau renumber)
 * Negative control: mutant text phải FAIL (test chính phép đo — KN-049/KN-058).
 * 2 test CLI wiring: `auto-learn.mjs status` trả `idIntegrity` (JSON) + in dòng human.
 *
 * Protocol paste KN (KN-066): re-check ID ngay TRƯỚC khi ghi → chạy spec này SAU khi ghi.
 */
import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const KN_PATH = path.resolve(__dirname, '..', '..', 'docs', 'knowleged.md');
const SOURCE = fs.readFileSync(KN_PATH, 'utf8');

const ROW_RE = /^\|\s*(KN-\d{3})\s*\|/gm; // dòng bảng tóm tắt — dùng cho assert động (count, lastRow)

const collectIds = (text: string, re: RegExp): string[] =>
  [...text.matchAll(re)].map((m) => m[1]);

// Shared source of truth: `.github/harness/scripts/kn-parse.mjs` → checkKnIntegrity
// (dùng CHUNG với `auto-learn.mjs status` — 1 nguồn, không duplicate 2 nơi; KN-066)
const knParsePromise = import('../../.github/harness/scripts/kn-parse.mjs');
async function checkKnIds(text: string): Promise<string[]> {
  const { checkKnIntegrity } = (await knParsePromise) as { checkKnIntegrity: (t: string) => string[] };
  return checkKnIntegrity(text);
}

test.describe('knowleged.md ID integrity — guard KN-066', () => {
  test('baseline: file thật sạch (không dup/orphan/sai thứ tự)', async () => {
    expect(await checkKnIds(SOURCE)).toEqual([]);
    expect(collectIds(SOURCE, ROW_RE).length).toBeGreaterThan(50);
  });

  test('negative control: trùng row bảng tóm tắt phải FAIL', async () => {
    const mutant = `${SOURCE}\n| KN-063 | fake row |\n`;
    expect((await checkKnIds(mutant)).join('\n')).toMatch(/bảng tóm tắt: trùng KN-063/);
  });

  test('negative control: trùng heading chi tiết phải FAIL', async () => {
    const mutant = `${SOURCE}\n### KN-063 — fake detail\n`;
    expect((await checkKnIds(mutant)).join('\n')).toMatch(/chi tiết: trùng KN-063/);
  });

  test('negative control: row không có detail (orphan) phải FAIL', async () => {
    const mutant = `${SOURCE}\n| KN-099 | fake row |\n`;
    expect((await checkKnIds(mutant)).join('\n')).toMatch(/bảng có KN-099, chi tiết thiếu/);
  });

  test('negative control: detail không có row (orphan) phải FAIL', async () => {
    const mutant = `${SOURCE}\n### KN-099 — fake detail\n`;
    expect((await checkKnIds(mutant)).join('\n')).toMatch(/chi tiết có KN-099, bảng thiếu/);
  });

  test('negative control: đảo thứ tự (điền gap 061 vào cuối) phải FAIL', async () => {
    // assert ĐỘNG: cặp đảo = row cuối thật → KN-061 (file lớn thêm vẫn đúng — KN-064/065 lấy trong lúc build)
    const lastRow = collectIds(SOURCE, ROW_RE).slice(-1)[0];
    const mutant = `${SOURCE}\n| KN-061 | fake row |\n`;
    expect((await checkKnIds(mutant)).join('\n')).toMatch(
      new RegExp(`bảng tóm tắt sai thứ tự: ${lastRow} → KN-061`)
    );
  });

  test('CLI wiring: status --json trả idIntegrity.ok=true (file thật sạch)', () => {
    const out = execFileSync(process.execPath, ['.github/harness/scripts/auto-learn.mjs', 'status', '--json'], {
      encoding: 'utf8', cwd: path.resolve(__dirname, '..', '..'), maxBuffer: 16 * 1024 * 1024,
    });
    const j = JSON.parse(out);
    expect(j.idIntegrity.ok).toBe(true);
    expect(j.idIntegrity.issues).toEqual([]);
  });

  test('CLI wiring: status human in dòng KN ID integrity', () => {
    const out = execFileSync(process.execPath, ['.github/harness/scripts/auto-learn.mjs', 'status'], {
      encoding: 'utf8', cwd: path.resolve(__dirname, '..', '..'), maxBuffer: 16 * 1024 * 1024,
    });
    // assertion SIẾT: chuỗi 'KN ID integrity' trần cũng xuất hiện trong dòng UpdatedAt (pass giả 14/09)
    // → chỉ match dòng status in ra thật (✅/⚠️ + hậu tố OK)
    expect(out).toMatch(/[✅⚠️] KN ID integrity/);
  });
});
