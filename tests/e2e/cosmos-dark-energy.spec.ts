import { test, expect } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Dark Energy D fix — ship 2026-09-12 (PRD .agent/plans/cosmos-dark-energy-fix/prd.md):
 *  - measurePlans() chỉ đếm plans có prd.md mtime >= 2026-09-07 (ngày KN-018)
 *  - plans cũ hơn = "tiền-gate" → plansLegacy, KHÔNG tính D/G (tránh HIGH giả)
 *  - web-011-part8/prd.md đã append Dissent → D về 0
 *  - scale.html#deParts render row tiền-gate + badge D
 * Evidence → .agent/plans/cosmos-dark-energy-fix/verify/
 */

const ROOT = process.cwd();
const SCRIPT = path.join(ROOT, '.github/harness/scripts/cosmic-scale.mjs');
const SHOTS = '.agent/plans/cosmos-dark-energy-fix/verify';

function run(args: string[]) {
  return spawnSync('node', [SCRIPT, ...args], { cwd: ROOT, encoding: 'utf8', timeout: 60_000 });
}

function cliJson() {
  const r = run(['--json']);
  expect(r.status, r.stderr).toBe(0);
  return JSON.parse(r.stdout);
}

function countDirsWithPrd(): number {
  const plansDir = path.join(ROOT, '.agent', 'plans');
  let n = 0;
  for (const e of fs.readdirSync(plansDir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    if (fs.existsSync(path.join(plansDir, e.name, 'prd.md'))) n++;
  }
  return n;
}

test('CLI: darkEnergy.D <= 1, plansLegacy = 49, total + legacy = dirs có prd.md', () => {
  const j = cliJson();
  expect(j.darkEnergy.D, 'D sau fix phải <= 1 (25/25 dissent sau khi vá part8)').toBeLessThanOrEqual(1);
  expect(j.darkEnergy.plansLegacy, '49 plans sinh trước gate 2026-09-07').toBe(49);
  const prdDirs = countDirsWithPrd();
  expect(
    j.darkEnergy.plansTotal + j.darkEnergy.plansLegacy,
    `plansTotal (${j.darkEnergy.plansTotal}) + legacy (${j.darkEnergy.plansLegacy}) phải = dirs có prd.md (${prdDirs}) — chống mtime drift`,
  ).toBe(prdDirs);
});

test('CLI: gravity có plansLegacy = 49 (cùng cửa sổ gate với D)', () => {
  const j = cliJson();
  expect(j.gravity.plansLegacy, 'gravity dùng chung mẫu gate với darkEnergy').toBe(49);
  expect(j.gravity.plansTotal, 'gravity.plansTotal = darkEnergy.plansTotal (cùng mẫu)').toBe(j.darkEnergy.plansTotal);
});

test('CLI: web-011-part8/prd.md chứa "Who did you think with?"', () => {
  const prd = fs.readFileSync(path.join(ROOT, '.agent', 'plans', 'web-011-part8', 'prd.md'), 'utf8');
  expect(prd).toContain('Who did you think with?');
});

test('scale.html — #deParts chứa "Tiền-gate" + badge D=0 (low)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('/cosmos/scale.html');

  const de = page.locator('#deParts');
  await expect(de, '#deParts phải render từ scale.json thật').toBeVisible({ timeout: 10_000 });
  await expect(de).toContainText('Tiền-gate', { timeout: 10_000 });
  await expect(de).toContainText('D=0', { timeout: 10_000 });
  await expect(de).toContainText('(low)', { timeout: 10_000 });
  await expect(de.locator('.gauge-level.low')).toBeVisible();
  expect(errors).toEqual([]);

  await page.locator('#de-title').scrollIntoViewIfNeeded();
  await expect
    .poll(() => page.locator('section:has(#de-title)').evaluate((el) => getComputedStyle(el).opacity), { timeout: 5000 })
    .toBe('1');
  await page.locator('section:has(#de-title)').screenshot({ path: `${SHOTS}/dark-energy-section.png` });
});

test('scale.html — dark-energy section @375 không tràn ngang + 0 pageerror', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.setViewportSize({ width: 375, height: 780 });
  await page.goto('/cosmos/scale.html');
  await expect(page.locator('#deParts')).toContainText('Tiền-gate', { timeout: 10_000 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, 'không tràn ngang ở 375px').toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
  await page.locator('section:has(#de-title)').screenshot({ path: `${SHOTS}/dark-energy-375.png` });
});
