import { test, expect, type Page } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * Cosmic Web — Entangle v2 (roadmap card #1, 2026-09-12):
 *  - `entangle.mjs --graph`: 1-pass scan → hubs (≥10 refs) · clusters (git co-change ≥3) · dead filaments (www/, 0 ref)
 *  - `--out` ghi graph.json · `--file` v1 giữ nguyên (backward compat)
 *  - scale.html section 🕸️ Cosmic Web render TỪ graph.json thật (không 404 — KN-030)
 * Evidence → .agent/plans/cosmos-cosmic-web/verify/
 */

const ROOT = process.cwd();
const SCRIPT = path.join(ROOT, '.github/harness/scripts/entangle.mjs');
const SHOTS = '.agent/plans/cosmos-cosmic-web/verify';

function runGraph(args: string[]) {
  return spawnSync('node', [SCRIPT, '--graph', ...args], { cwd: ROOT, encoding: 'utf8', timeout: 90_000 });
}

async function prep(page: Page) {
  const errors: string[] = [];
  const badResponses: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('response', (res) => {
    if (res.status() >= 400 && res.url().includes('graph.json')) badResponses.push(res.url() + ' → ' + res.status());
  });
  await page.goto('/cosmos/scale.html');
  return { errors, badResponses };
}

test('--graph --json: hubs ≥10 refs sorted · clusters ≥3 file · dead trong www/', () => {
  const r = runGraph(['--json']);
  expect(r.status, r.stderr).toBe(0);
  const j = JSON.parse(r.stdout);

  expect(j.generatedBy).toBe('entangle.mjs --graph');
  expect(Date.parse(j.generatedAt), 'generatedAt ISO hợp lệ').not.toBeNaN();
  expect(j.scanned.files).toBeGreaterThan(50);
  expect(j.scanned.edges).toBeGreaterThan(50);

  // hubs — sửa là phải test rộng
  expect(j.counts.hubs).toBe(j.hubs.length);
  for (const h of j.hubs) expect(h.refs, h.file).toBeGreaterThanOrEqual(j.thresholds.hubMinRefs);
  const refs = j.hubs.map((h: { refs: number }) => h.refs);
  expect(refs, 'hubs sorted desc').toEqual([...refs].sort((a, b) => b - a));

  // clusters — gộp 1 plan
  expect(j.counts.clusters).toBe(j.clusters.length);
  for (const c of j.clusters) {
    expect(c.files.length, 'cluster ≥3 file').toBeGreaterThanOrEqual(3);
    expect(c.weight, 'cluster weight ≥ coChangeMin').toBeGreaterThanOrEqual(j.thresholds.coChangeMin);
  }

  // dead filaments — ứng viên xoá (chỉ www/, không entrypoint)
  expect(j.counts.deadFilaments).toBe(j.deadFilaments.length);
  for (const d of j.deadFilaments) {
    expect(d.startsWith('www/'), d).toBe(true);
    expect(d.endsWith('index.html'), d).toBe(false);
  }
});

test('--out ghi graph.json hợp lệ', () => {
  const out = path.join(os.tmpdir(), `graph-web-${Date.now()}.json`);
  const r = runGraph(['--out', out]);
  expect(r.status, r.stderr).toBe(0);
  const j = JSON.parse(fs.readFileSync(out, 'utf8'));
  expect(j.hubs).toBeTruthy();
  expect(j.counts.hubs).toBe(j.hubs.length);
  fs.rmSync(out, { force: true });
});

test('--file v1 backward compat: usage khi thiếu flag, output shape giữ nguyên', () => {
  const noArgs = spawnSync('node', [SCRIPT], { cwd: ROOT, encoding: 'utf8', timeout: 30_000 });
  expect(noArgs.status, 'thiếu --file → exit 1').toBe(1);
  expect(noArgs.stderr).toContain('Usage');

  const one = spawnSync('node', [SCRIPT, '--file', 'www/cosmos/scale.html', '--json'], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 90_000,
  });
  expect(one.status, one.stderr).toBe(0);
  const j = JSON.parse(one.stdout);
  expect(j.file).toBe('www/cosmos/scale.html');
  expect(j.counts.forward).toBeGreaterThanOrEqual(1); // fetch './scale.json'
  expect(Array.isArray(j.forward)).toBe(true);
  expect(Array.isArray(j.reverse)).toBe(true);
});

test('scale.html — Cosmic Web render từ graph.json thật, rows khớp data', async ({ page }) => {
  const { errors, badResponses } = await prep(page);

  await expect(page.locator('#web-title')).toBeVisible();
  await expect(page.locator('#webAdvice')).toContainText('files', { timeout: 10_000 });
  await expect(page.locator('#webAdvice')).toContainText('hub');

  const res = await page.request.get('/cosmos/graph.json');
  expect(res.status(), 'graph.json phải commit trong www/ (KN-030)').toBe(200);
  const j = await res.json();

  // hubs: UI hiển thị top 6 (card không dài vượt section khác), row khớp data thật, note "+N nữa" khi còn
  const hubsShown = Math.min(6, j.hubs.length);
  const hubRows = page.locator('#webHubs .part');
  if (j.hubs.length) {
    await expect(hubRows).toHaveCount(hubsShown);
    await expect(hubRows.first()).toContainText(j.hubs[0].file);
    await expect(hubRows.first()).toContainText(String(j.hubs[0].refs));
    if (j.hubs.length > 6) await expect(page.locator('#webHubs')).toContainText('+ ' + (j.hubs.length - 6) + ' hub nữa');
  } else {
    await expect(page.locator('#webHubs')).toContainText('không có hub');
  }

  // clusters
  const clusterRows = page.locator('#webClusters .bh-item');
  if (j.clusters.length) await expect(clusterRows).toHaveCount(j.clusters.length);
  else await expect(page.locator('#webClusters')).toContainText('không có cluster');

  // dead filaments
  if (j.deadFilaments.length) await expect(page.locator('#webDead .bh-item')).toHaveCount(j.deadFilaments.length);
  else await expect(page.locator('#webDead')).toContainText('dead filament');

  expect(badResponses, 'không fetch nào 404').toEqual([]);
  expect(errors).toEqual([]);

  await page.locator('#web-title').scrollIntoViewIfNeeded();
  await expect
    .poll(() => page.locator('section:has(#web-title)').evaluate((el) => getComputedStyle(el).opacity), { timeout: 5000 })
    .toBe('1');
  await page.locator('section:has(#web-title)').screenshot({ path: `${SHOTS}/cosmic-web-section.png` });
});

test('Cosmic Web @375 — không tràn ngang, không lỗi', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 780 });
  const { errors } = await prep(page);
  await expect(page.locator('#webAdvice')).toContainText('files', { timeout: 10_000 });
  const overflow = await page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
  }));
  expect(overflow.scrollW, 'không tràn ngang').toBeLessThanOrEqual(overflow.clientW + 1);
  expect(errors).toEqual([]);
  await page.locator('#web-title').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await page.locator('section:has(#web-title)').screenshot({ path: `${SHOTS}/cosmic-web-375.png` });
});
