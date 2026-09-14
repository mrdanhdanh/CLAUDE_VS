/**
 * yt-summary-chain.spec.ts — Guard KN-063 (routing & failover primitives).
 *
 * Khoá invariants chuỗi failover thật của harness — scripts/yt-summary/build.mjs
 * (gtx → gtx2 → mymemory, circuit breaker theo host; sinh từ incident KN-041):
 *   1. Thứ tự chain: gtx (GTX_URL) → gtx2 (GTX2_URL) → mymemory → giữ bản gốc
 *   2. Breaker theo HOST (không theo URL/global): isDown check TRƯỚC fetch,
 *      mọi nhánh lỗi trip(host), thành công heal(host)
 *   3. Output đã commit theo chunk không bị làm lại (không re-chunk/restart)
 *   4. Fallback cuối giữ bản gốc + đếm failed — provider chết không làm gãy pipeline
 *   5. Telemetry mọi attempt: đếm gtx/gtx2/mymemory/failed + provider label derive từ counts
 *   6. Mọi fetch trong vùng dịch có AbortSignal.timeout (provider treo không chặn chain)
 *   7. Quota fail-fast: MyMemory hết quota → short-circuit, không hammer tiếp
 *
 * CLI không import được (`main()` chạy lúc import — KN-014) → static invariant trên source,
 * theo precedent readme-guard.spec.ts / hooks-integrity.spec.ts. Kèm negative control:
 * mutant source (đảo thứ tự chain · breaker bỏ host · bỏ fallback · bỏ timeout · re-chunk)
 * phải FAIL — test chính phép đo, không chỉ data (KN-049, KN-058).
 */
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const SOURCE_PATH = path.resolve(__dirname, '..', '..', 'scripts', 'yt-summary', 'build.mjs');
const SOURCE = fs.readFileSync(SOURCE_PATH, 'utf8');

/** Vùng chuỗi dịch: từ marker "2. Dịch" đến marker "3. Main" */
function translateRegion(src: string): string {
  const s = src.indexOf('2. Dịch');
  const e = src.indexOf('3. Main');
  return s >= 0 && e > s ? src.slice(s, e) : '';
}

/** Slice từ `from` tới `to` (exclusive); thiếu marker → '' để downstream FAIL loudly */
function slice(src: string, from: string, to: string): string {
  const s = src.indexOf(from);
  if (s < 0) return '';
  const e = src.indexOf(to, s + from.length);
  return e > s ? src.slice(s, e) : src.slice(s);
}

const CHAIN = [
  { name: 'gtx', token: 'googleTranslateLike(GTX_URL' },
  { name: 'gtx2', token: 'googleTranslateLike(GTX2_URL' },
  { name: 'mymemory', token: 'mymemoryText(ch' },
];

/** checkChainOrder: thứ tự failover trong translateText (KN-063) */
function checkChainOrder(reg: string): string[] {
  const issues: string[] = [];
  const tt = slice(reg, 'async function translateText(', '/** Viết hoa chữ đầu');
  if (!tt) return ['không tìm thấy thân translateText'];
  const idx = CHAIN.map((c) => tt.indexOf(c.token));
  CHAIN.forEach((c, i) => {
    if (idx[i] < 0) issues.push(`chain thiếu provider ${c.name} (${c.token})`);
  });
  if (idx.every((i) => i >= 0) && !(idx[0] < idx[1] && idx[1] < idx[2])) {
    issues.push('chain phải đúng thứ tự gtx → gtx2 → mymemory');
  }
  return issues;
}

/** checkCommittedOutput: output chunk đã commit là terminal (không restart) + telemetry per attempt (KN-063) */
function checkCommittedOutput(reg: string): string[] {
  const issues: string[] = [];
  const tt = slice(reg, 'async function translateText(', '/** Viết hoa chữ đầu');
  if (!tt) return [];
  if (!/vi\s*=\s*ch\b/.test(tt)) issues.push('thiếu fallback giữ bản gốc (vi = ch) — mọi provider chết không được làm gãy pipeline');
  if ((tt.match(/chunkForTranslation\(/g) || []).length !== 1) {
    issues.push('translateText phải gọi chunkForTranslation đúng 1 lần — không re-chunk/restart (output chunk đã commit là terminal)');
  }
  if (!/out\.push\(/.test(tt)) issues.push('translateText phải commit từng chunk vào out (out.push)');
  if (!/stats\[via[\s\S]{0,160}?'failed'\]\+\+/.test(tt)) issues.push('telemetry: phải đếm attempt theo provider + nhánh failed');
  return issues;
}

/** checkBreaker: breaker theo host — fail-fast trước fetch, trip mọi nhánh lỗi, heal khi thành công (KN-063) */
function checkBreaker(reg: string): string[] {
  const issues: string[] = [];
  if (!/const breakers = new Map\(\)/.test(reg)) issues.push('thiếu breakers Map');
  if (!/new URL\(u\)\.host/.test(reg)) issues.push('hostOf phải key theo URL host (không theo full URL)');
  const g = slice(reg, 'async function googleTranslateLike(', 'const GTX_URL = ');
  if (!g) return [...issues, 'không tìm thấy googleTranslateLike'];
  if (!/const host = hostOf\(endpoint\)/.test(g)) issues.push('googleTranslateLike phải derive host qua hostOf(endpoint)');
  const iDown = g.indexOf('isDown(host)');
  const iFetch = g.indexOf('fetch(');
  if (iDown < 0 || iDown > iFetch) issues.push('isDown(host) phải check TRƯỚC fetch (fail-fast, không gọi mạng khi breaker mở)');
  if ((g.match(/trip\(host\)/g) || []).length < 2) issues.push('mọi nhánh lỗi của googleTranslateLike phải trip(host) breaker');
  if (!/heal\(host\)/.test(g)) issues.push('thành công phải heal(host) breaker');
  return issues;
}

/** checkTimeouts: provider treo không chặn chain (KN-063) */
function checkTimeouts(reg: string): string[] {
  const issues: string[] = [];
  const fetches = (reg.match(/\bfetch\(/g) || []).length;
  const timeouts = (reg.match(/AbortSignal\.timeout\(/g) || []).length;
  if (fetches === 0) issues.push('vùng dịch không có fetch nào — marker/parse sai?');
  if (timeouts < fetches) issues.push(`mọi fetch trong vùng dịch phải có AbortSignal.timeout (fetch ${fetches} > timeout ${timeouts})`);
  return issues;
}

/** checkQuota: MyMemory hết quota → short-circuit, không hammer tiếp (KN-063) */
function checkQuota(reg: string): string[] {
  const issues: string[] = [];
  if (!/let memoQuotaTripped = false/.test(reg)) issues.push('thiếu memoQuotaTripped (quota fail-fast)');
  if (!/if \(memoQuotaTripped\)/.test(reg)) issues.push('mymemoryText phải short-circuit khi quota hết');
  if (!/USED ALL AVAILABLE FREE TRANSLATIONS/.test(reg)) issues.push('phải detect quota message của MyMemory');
  return issues;
}

/** checkChain: aggregator — trả danh sách vi phạm (rỗng = OK) — pure để negative-control được */
function checkChain(src: string): string[] {
  const reg = translateRegion(src);
  if (!reg) return ['không tìm thấy vùng dịch (marker "2. Dịch"/"3. Main" mất hoặc đảo thứ tự)'];
  const providerLabel = /const provider = stats\.mymemory === 0/.test(src)
    ? []
    : ['provider label phải derive từ counts (không hardcode)'];
  return [
    ...checkChainOrder(reg),
    ...checkCommittedOutput(reg),
    ...checkBreaker(reg),
    ...checkTimeouts(reg),
    ...checkQuota(reg),
    ...providerLabel,
  ];
}

test.describe('YT Summary chain — guard KN-063 (routing & failover)', () => {
  test('baseline: source hiện tại không vi phạm invariant nào', () => {
    expect(checkChain(SOURCE)).toEqual([]);
    // markers phải resolve (nếu slice sai, baseline sẽ báo ở trên — assert tường minh cho rõ)
    expect(translateRegion(SOURCE).length).toBeGreaterThan(500);
  });

  test('negative control: đảo thứ tự chain (gtx → gtx2) phải FAIL', () => {
    const mutant = SOURCE.replace('googleTranslateLike(GTX_URL, ch)', 'googleTranslateLike(GTX2_URL, ch)');
    expect(mutant).not.toBe(SOURCE);
    expect(checkChain(mutant).join('\n')).toMatch(/gtx/);
  });

  test('negative control: breaker không key theo host phải FAIL', () => {
    const mutant = SOURCE.replace('const host = hostOf(endpoint);', 'const host = endpoint;');
    expect(mutant).not.toBe(SOURCE);
    expect(checkChain(mutant).join('\n')).toMatch(/hostOf/);
  });

  test('negative control: bỏ fallback giữ bản gốc phải FAIL', () => {
    const mutant = SOURCE.replace('if (vi == null) { vi = ch; }', 'if (vi == null) { vi = null; }');
    expect(mutant).not.toBe(SOURCE);
    expect(checkChain(mutant).join('\n')).toMatch(/giữ bản gốc/);
  });

  test('negative control: bỏ timeout 1 fetch phải FAIL', () => {
    const mutant = SOURCE.replace('AbortSignal.timeout(15000)', '');
    expect(mutant).not.toBe(SOURCE);
    expect(checkChain(mutant).join('\n')).toMatch(/timeout/);
  });

  test('negative control: re-chunk/restart trong translateText phải FAIL', () => {
    const mutant = SOURCE.replace(
      'const chunks = pipeline.chunkForTranslation(text, 900);',
      'const chunks = pipeline.chunkForTranslation(text, 900); const chunks2 = pipeline.chunkForTranslation(text, 900);'
    );
    expect(mutant).not.toBe(SOURCE);
    expect(checkChain(mutant).join('\n')).toMatch(/chunkForTranslation/);
  });
});
