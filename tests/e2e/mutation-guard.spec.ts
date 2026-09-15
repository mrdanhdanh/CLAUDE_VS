import { test, expect } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Mutation honesty guard — KN-049 (calibrate-before-gate · D6, Meta "RL for Code Optimization" 29/07/2026)
 *
 * Bối cảnh: `scripts/mutation.mjs` là bản lite — mỗi mutant chỉ chạy `node --check` (syntax),
 * KHÔNG chạy test thật per-mutant. Bản cũ in "tests may be weak" / "tests are strong!" từ số proxy
 * = overclaim — metric nhiễu đem gate sẽ làm hại (Meta: "once timing drives the reward... RL fail";
 * xem `docs/meta-research-deep-dive.md` §3.3 + §5-GỘP).
 *
 * Lưới khoá (spec ≠ wish — KN-047):
 *   1. Static: source tự khai `mode: 'lite-proxy'` + disclaimer + per-mutant label honest
 *   2. Static: cấm quay lại claim cũ ('tests are strong' / 'tests may be weak' / 'Mutation score:')
 *   3. Runtime: banner + summary tự khai PROXY, không claim strong/weak (--limit 0 — 0 mutant, không mutate file)
 *
 * Human takeover 2026-09-15 (deny-test-mutate → intent=takeover, như G3 guard-redteam).
 */

const ROOT = process.cwd();
const SOURCE = path.join(ROOT, 'scripts', 'mutation.mjs');

const FORBIDDEN_CLAIMS = ['tests are strong', 'tests may be weak', 'All mutants killed', 'Mutation score:'];

test.describe('mutation.mjs — honesty labels (KN-049 calibrate-before-gate)', () => {
  test('static: self-declare lite-proxy + không còn claim tests strong/weak', () => {
    const src = fs.readFileSync(SOURCE, 'utf8');
    expect(src, 'report JSON phải khai mode lite-proxy').toContain("mode: 'lite-proxy'");
    expect(src, 'phải có disclaimer trong report').toContain('disclaimer');
    expect(src, 'summary phải nói rõ không phải mutation score').toContain('KHÔNG phải mutation score');
    expect(src, 'per-mutant label phải honest (proxy)').toContain('syntax-ok (proxy');
    for (const claim of FORBIDDEN_CLAIMS) {
      expect(src, `claim cũ "${claim}" không được quay lại`).not.toContain(claim);
    }
  });

  test('runtime: banner + summary tự khai PROXY, không claim (--limit 0)', () => {
    const r = spawnSync(process.execPath, [SOURCE, '--limit', '0'], { cwd: ROOT, encoding: 'utf8', timeout: 20_000 });
    expect(r.status, 'exit code 0').toBe(0);
    const out = `${r.stdout}${r.stderr}`;
    expect(out, 'banner phải ghi PROXY').toContain('mutation PROXY scan');
    expect(out, 'summary phải ghi rõ không phải mutation score').toContain('KHÔNG phải mutation score');
    for (const claim of FORBIDDEN_CLAIMS) {
      expect(out, `output không được chứa claim "${claim}"`).not.toContain(claim);
    }
  });
});
