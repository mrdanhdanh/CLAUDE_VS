import { test, expect } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * Gravitational Lensing — Blast radius 2-hop (roadmap card #1 www/cosmos/index.html#future, 2026-09-15):
 *  - `entangle.mjs --lens --file X [--hops 2] [--json] [--out]`: BFS reverse từ edges (như --graph)
 *    → hop 1 (ai ref X) + hop 2 (ai ref người đó) + testSet tối thiểu (pre-flight trước refactor)
 *  - graph.json nhúng `edges` [[from,to]] — nguồn duy nhất cho widget client-side (không file mới)
 *  - forwardRefs web-root: ref bắt đầu `/` (`page.goto('/cosmos/x')`) resolve vào `www/` → graph bắt cạnh test→page
 *  - scale.html#web widget 🔭 Lensing: select file → hop1/hop2 chips + test set
 *  - Honesty (archify research): text-refs reachability — KHÔNG claim runtime impact / safe-to-merge
 * Evidence → .agent/plans/cosmos-lensing/verify/
 */

const ROOT = process.cwd();
const SCRIPT = path.join(ROOT, '.github/harness/scripts/entangle.mjs');
const SHOTS = '.agent/plans/cosmos-lensing/verify';
const TARGET = 'www/cosmos/index.html';
const HOPS = 2;

function run(args: string[], timeout = 120_000) {
  return spawnSync('node', [SCRIPT, ...args], { cwd: ROOT, encoding: 'utf8', timeout });
}

// Mirror thuật toán lens ĐỘC LẬP trong test: BFS reverse shortest-hop từ edges
function blastFromEdges(edges: [string, string][], target: string, hops: number) {
  const rev = new Map<string, Set<string>>();
  for (const [from, to] of edges) {
    if (!rev.has(to)) rev.set(to, new Set());
    rev.get(to)!.add(from);
  }
  const hopOf = new Map<string, number>([[target, 0]]);
  let frontier = [target];
  const out: { file: string; hop: number }[] = [];
  for (let h = 1; h <= hops; h++) {
    const next = new Set<string>();
    for (const f of frontier)
      for (const src of rev.get(f) || []) {
        if (hopOf.has(src)) continue;
        hopOf.set(src, h);
        next.add(src);
      }
    if (!next.size) break;
    for (const f of [...next].sort()) out.push({ file: f, hop: h });
    frontier = [...next];
  }
  return out;
}

// isTest — mirror rule deny-test-mutate (segment test|tests|*.test|*.tests hoặc .spec./.test.)
const isTest = (f: string) => {
  const segs = f.toLowerCase().split('/');
  return (
    segs.some((s) => s === 'test' || s === 'tests' || s.endsWith('.test') || s.endsWith('.tests')) ||
    /\.spec\.|\.test\./.test(f.toLowerCase())
  );
};

test('--lens --json: 2-hop blast khớp tự tính lại từ graph edges · có test set (webroot refs)', () => {
  const g = run(['--graph', '--json']);
  expect(g.status, g.stderr).toBe(0);
  const graph = JSON.parse(g.stdout);
  expect(Array.isArray(graph.edges), 'graph.json nhúng edges [from,to]').toBe(true);
  expect(graph.edges.length, 'edges đủ như scanned').toBe(graph.scanned.edges);

  // mirror semantic lens: loại edge TỪ artifacts lịch sử (.agent/bugs, .agent/plans, .agent/versions) như gitClusters
  const usable = (graph.edges as [string, string][]).filter(
    ([from]) => !['.agent/bugs/', '.agent/plans/', '.agent/versions/'].some((p) => from.startsWith(p)),
  );
  const expected = blastFromEdges(usable, TARGET, HOPS);
  const wantHop1 = expected.filter((e) => e.hop === 1).map((e) => e.file).sort();
  const wantHop2 = expected.filter((e) => e.hop === 2).map((e) => e.file).sort();

  const r = run(['--lens', '--file', TARGET, '--json']);
  expect(r.status, r.stderr).toBe(0);
  const j = JSON.parse(r.stdout);

  expect(j.generatedBy).toBe('entangle.mjs --lens');
  expect(j.file).toBe(TARGET);
  expect(j.hops).toBe(HOPS);
  expect(j.method, 'honesty: không phải runtime impact').toContain('không phải runtime impact');

  const gotHop1 = j.blastRadius.filter((b: { hop: number }) => b.hop === 1).map((b: { file: string }) => b.file).sort();
  const gotHop2 = j.blastRadius.filter((b: { hop: number }) => b.hop === 2).map((b: { file: string }) => b.file).sort();
  expect(gotHop1, 'hop 1 khớp tự tính từ edges').toEqual(wantHop1);
  expect(gotHop2, 'hop 2 khớp tự tính từ edges').toEqual(wantHop2);
  expect(gotHop1.length, 'target phải có ≥1 ref trực tiếp').toBeGreaterThan(0);

  // webroot refs fix: spec `page.goto('/cosmos/index.html')` phải xuất hiện ở hop 1
  expect(gotHop1.some((f) => f.startsWith('tests/')), 'cạnh test→page bắt được').toBe(true);

  // testSet ⊆ blast + đúng pattern test (mirror policy)
  const blastAll = new Set([...gotHop1, ...gotHop2]);
  expect(j.testSet.length, 'phải có test set pre-flight').toBeGreaterThanOrEqual(1);
  for (const t of j.testSet) {
    expect(blastAll.has(t.file), t.file + ' ⊆ blast').toBe(true);
    expect(isTest(t.file), t.file + ' là test').toBe(true);
  }

  // counts consistent + dedup hop
  expect(j.counts.blast).toBe(j.blastRadius.length);
  expect(j.counts.testSet).toBe(j.testSet.length);
  expect(j.counts.byHop['1']).toBe(gotHop1.length);
  expect(j.counts.byHop['2']).toBe(gotHop2.length);
  expect(new Set(j.blastRadius.map((b: { file: string }) => b.file)).size, 'dedup 2 hop').toBe(j.blastRadius.length);
});

test('--hops 1: chỉ hop 1 (không bẻ cong)', () => {
  const r = run(['--lens', '--file', TARGET, '--hops', '1', '--json']);
  expect(r.status, r.stderr).toBe(0);
  const j = JSON.parse(r.stdout);
  expect(j.hops).toBe(1);
  expect(j.blastRadius.every((b: { hop: number }) => b.hop === 1)).toBe(true);
  expect(j.counts.byHop['2'] ?? 0).toBe(0);
});

test('--out ghi JSON hợp lệ · thiếu --file → exit 1 usage', () => {
  const out = path.join(os.tmpdir(), `lens-${Date.now()}.json`);
  const r = run(['--lens', '--file', TARGET, '--out', out]);
  expect(r.status, r.stderr).toBe(0);
  const j = JSON.parse(fs.readFileSync(out, 'utf8'));
  expect(j.blastRadius.length).toBeGreaterThan(0);
  fs.rmSync(out, { force: true });

  const noArgs = run(['--lens'], 30_000);
  expect(noArgs.status, 'thiếu --file → exit 1').toBe(1);
  expect(noArgs.stderr).toContain('Usage');
});

test('scale.html — widget 🔭 Lensing: select → hop 1/2 + test set, no pageerror, 375 không tràn', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('/cosmos/scale.html');
  await expect(page.locator('#webAdvice')).toContainText('files', { timeout: 10_000 });

  const select = page.locator('#webLensFile');
  await expect(select).toBeVisible();
  await select.selectOption(TARGET);
  await page.locator('#webLensBtn').click();

  const out = page.locator('#webLensOut');
  await expect(out).toContainText('Hop 1');
  await expect(out).toContainText('Hop 2');
  await expect(out).toContainText('test set', { ignoreCase: true });
  await expect(out).toContainText('cosmos-future.spec.ts');
  expect(errors).toEqual([]);

  await page.locator('#web-title').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await page.locator('section:has(#web-title)').screenshot({ path: `${SHOTS}/lensing-widget.png` });

  await page.setViewportSize({ width: 375, height: 780 });
  await page.waitForTimeout(400);
  const overflow = await page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
  }));
  expect(overflow.scrollW, '375px không tràn ngang').toBeLessThanOrEqual(overflow.clientW + 1);
  await page.locator('section:has(#web-title)').screenshot({ path: `${SHOTS}/lensing-widget-375.png` });
});
