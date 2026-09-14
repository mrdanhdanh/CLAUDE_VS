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
 *
 * Protocol paste KN (KN-066): re-check ID ngay TRƯỚC khi ghi → chạy spec này SAU khi ghi.
 */
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const KN_PATH = path.resolve(__dirname, '..', '..', 'docs', 'knowleged.md');
const SOURCE = fs.readFileSync(KN_PATH, 'utf8');

const ROW_RE = /^\|\s*(KN-\d{3})\s*\|/gm; // dòng bảng tóm tắt
const DET_RE = /^###\s+(KN-\d{3})\b/gm;   // heading chi tiết

const collectIds = (text: string, re: RegExp): string[] =>
  [...text.matchAll(re)].map((m) => m[1]);

/** ID xuất hiện >1 lần */
const findDuplicates = (list: string[]): string[] => {
  const count = new Map<string, number>();
  for (const id of list) count.set(id, (count.get(id) || 0) + 1);
  return [...count.entries()].filter(([, n]) => n > 1).map(([id, n]) => `${id} ×${n}`);
};

/** ID có trong `list` nhưng thiếu trong `other` */
const findOrphans = (list: string[], other: string[]): string[] => {
  const has = new Set(other);
  return list.filter((id) => !has.has(id));
};

/** Cặp đảo thứ tự (số giảm) — gap OK, đảo thì không */
const findOrderIssues = (ids: string[]): string[] => {
  const num = (id: string) => parseInt(id.slice(3), 10);
  const bad: string[] = [];
  for (let i = 1; i < ids.length; i++) {
    if (num(ids[i]) < num(ids[i - 1])) bad.push(`${ids[i - 1]} → ${ids[i]}`);
  }
  return bad;
};

/** checkKnIds: [] = OK — pure function để negative-control được */
function checkKnIds(text: string): string[] {
  const rows = collectIds(text, ROW_RE);
  const det = collectIds(text, DET_RE);
  return [
    ...findDuplicates(rows).map((d) => `bảng tóm tắt: trùng ${d}`),
    ...findDuplicates(det).map((d) => `chi tiết: trùng ${d}`),
    ...findOrphans(rows, det).map((id) => `bảng có ${id}, chi tiết thiếu`),
    ...findOrphans(det, rows).map((id) => `chi tiết có ${id}, bảng thiếu`),
    ...findOrderIssues(rows).map((p) => `bảng tóm tắt sai thứ tự: ${p}`),
    ...findOrderIssues(det).map((p) => `chi tiết sai thứ tự: ${p}`),
  ];
}

test.describe('knowleged.md ID integrity — guard KN-066', () => {
  test('baseline: file thật sạch (không dup/orphan/sai thứ tự)', () => {
    expect(checkKnIds(SOURCE)).toEqual([]);
    expect(collectIds(SOURCE, ROW_RE).length).toBeGreaterThan(50);
  });

  test('negative control: trùng row bảng tóm tắt phải FAIL', () => {
    const mutant = `${SOURCE}\n| KN-063 | fake row |\n`;
    expect(checkKnIds(mutant).join('\n')).toMatch(/bảng tóm tắt: trùng KN-063/);
  });

  test('negative control: trùng heading chi tiết phải FAIL', () => {
    const mutant = `${SOURCE}\n### KN-063 — fake detail\n`;
    expect(checkKnIds(mutant).join('\n')).toMatch(/chi tiết: trùng KN-063/);
  });

  test('negative control: row không có detail (orphan) phải FAIL', () => {
    const mutant = `${SOURCE}\n| KN-099 | fake row |\n`;
    expect(checkKnIds(mutant).join('\n')).toMatch(/bảng có KN-099, chi tiết thiếu/);
  });

  test('negative control: detail không có row (orphan) phải FAIL', () => {
    const mutant = `${SOURCE}\n### KN-099 — fake detail\n`;
    expect(checkKnIds(mutant).join('\n')).toMatch(/chi tiết có KN-099, bảng thiếu/);
  });

  test('negative control: đảo thứ tự (điền gap 061 vào cuối) phải FAIL', () => {
    // assert ĐỘNG: cặp đảo = row cuối thật → KN-061 (file lớn thêm vẫn đúng — KN-064/065 lấy trong lúc build)
    const lastRow = collectIds(SOURCE, ROW_RE).slice(-1)[0];
    const mutant = `${SOURCE}\n| KN-061 | fake row |\n`;
    expect(checkKnIds(mutant).join('\n')).toMatch(
      new RegExp(`bảng tóm tắt sai thứ tự: ${lastRow} → KN-061`)
    );
  });
});
