import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * CMB Anisotropy — bản đồ điểm lạnh (2026-09-12, roadmap card #3):
 * - CLI: `auto-learn.mjs stats --heatmap [--json] [--out f] [--now ISO]`
 *   Grid KN theo tag × tháng · coldSpots (bug − kn ≥ 1) · zeroRef (0 tham chiếu trong bugs/plans)
 * - UI: section `#cmb` trên scale.html đọc mirror `heatmap.json` (sinh bởi --out, như graph/hawking)
 * - Deterministic: `--now` khóa tuổi zeroRef để test được (pattern watchdog)
 * Evidence → .agent/plans/cosmos-cmb-anisotropy/verify/
 */

const ROOT = path.resolve(__dirname, '..', '..');
const SCRIPT = path.join(ROOT, '.github', 'harness', 'scripts', 'auto-learn.mjs');
const SHOTS = '.agent/plans/cosmos-cmb-anisotropy/verify';

function runStats(args: string[]): { status: number; out: string } {
  try {
    const out = execFileSync(process.execPath, [SCRIPT, 'stats', '--heatmap', ...args], {
      cwd: ROOT,
      encoding: 'utf8',
    });
    return { status: 0, out };
  } catch (e: any) {
    return { status: e.status ?? 1, out: String(e.stdout || '') + String(e.stderr || '') };
  }
}

test.describe('CMB CLI — stats --heatmap', () => {
  test('invariants: grid tổng khớp, cold formula đúng, zeroRef hợp lệ', () => {
    const { status, out } = runStats(['--json', '--now', '2026-09-12T00:00:00Z']);
    expect(status, out).toBe(0);
    const j = JSON.parse(out);

    expect(j.generatedBy).toContain('stats --heatmap');
    expect(j.counts.knTotal).toBeGreaterThanOrEqual(4);

    // grid: mọi row.total === Σ cells; months hợp lệ; tags === số row
    expect(Array.isArray(j.grid.months)).toBe(true);
    expect(j.grid.months.length).toBeGreaterThanOrEqual(1);
    for (const m of j.grid.months) expect(m).toMatch(/^\d{4}-\d{2}$|^unknown$/);
    for (const row of j.grid.rows) {
      expect(row.cells.length, `row ${row.tag} phải có đủ ô theo months`).toBe(j.grid.months.length);
      expect(row.total).toBe(row.cells.reduce((a: number, b: number) => a + b, 0));
    }
    expect(j.counts.tags).toBe(j.grid.rows.length);

    // coldSpots: coldness = bug − kn > 0 + sort giảm dần
    for (const s of j.coldSpots) {
      expect(s.bug).toBeGreaterThan(s.kn);
      expect(s.coldness).toBe(s.bug - s.kn);
    }
    for (let i = 1; i < j.coldSpots.length; i++) {
      expect(j.coldSpots[i - 1].coldness).toBeGreaterThanOrEqual(j.coldSpots[i].coldness);
    }
    expect(j.counts.coldSpots).toBe(j.coldSpots.length);

    // zeroRef: id hợp lệ + action nhất quán với tuổi (freshDays = 14)
    for (const z of j.zeroRef) {
      expect(z.id).toMatch(/^KN-\d{3}$/);
      const expected = z.ageDays >= 14 ? 'merge-or-delete' : 'fresh';
      expect(z.action, `${z.id} age=${z.ageDays}`).toBe(expected);
    }
    expect(j.counts.zeroRef).toBe(j.zeroRef.length);
  });

  test('--now deterministic: cùng ids, 2030 → toàn bộ merge-or-delete', () => {
    const a = JSON.parse(runStats(['--json', '--now', '2026-09-12T00:00:00Z']).out);
    const b = JSON.parse(runStats(['--json', '--now', '2030-01-01T00:00:00Z']).out);
    expect(b.zeroRef.map((z: any) => z.id)).toEqual(a.zeroRef.map((z: any) => z.id));
    for (const z of b.zeroRef) {
      expect(z.action).toBe('merge-or-delete');
      expect(z.ageDays).toBeGreaterThan(365);
    }
  });

  test('thiếu --heatmap → exit 1 + gợi ý lệnh', () => {
    let status = 0;
    let out = '';
    try {
      out = execFileSync(process.execPath, [SCRIPT, 'stats'], { cwd: ROOT, encoding: 'utf8' });
    } catch (e: any) {
      status = e.status ?? 1;
      out = String(e.stdout || '') + String(e.stderr || '');
    }
    expect(status).toBe(1);
    expect(out).toContain('--heatmap');
  });

  test('--out ghi mirror JSON parse được', () => {
    // os.tmpdir — không ghi vào repo (test-results/ là tracked, sẽ pollute git status)
    const outFile = path.join(os.tmpdir(), 'cmb-out.json');
    fs.rmSync(outFile, { force: true });
    const { status } = runStats(['--json', '--out', outFile, '--now', '2026-09-12T00:00:00Z']);
    expect(status).toBe(0);
    const j = JSON.parse(fs.readFileSync(outFile, 'utf8'));
    expect(j.grid.rows.length).toBeGreaterThan(0);
    expect(j.counts.knTotal).toBeGreaterThanOrEqual(4);
  });
});

test.describe('CMB UI — scale.html #cmb', () => {
  test('#cmb render từ mirror thật: grid + điểm lạnh + 0 ref + không pageerror', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto('/cosmos/scale.html');

    const section = page.locator('#cmb');
    await expect(section).toBeVisible();

    await expect(page.locator('#cmbAdvice')).toContainText('KN');
    await expect(page.locator('#cmbAdvice')).toContainText('bug');
    await expect(page.locator('#cmbGrid .cmb-row').first()).toBeVisible();
    expect(await page.locator('#cmbGrid .cmb-cell').count()).toBeGreaterThan(0);
    // cold + zero cards: có item hoặc empty-state — luôn render gì đó
    expect(await page.locator('#cmbCold .bh-item, #cmbCold .web-empty').count()).toBeGreaterThan(0);
    expect(await page.locator('#cmbZero .bh-item, #cmbZero .web-empty').count()).toBeGreaterThan(0);
    await expect(page.locator('#cmbCode')).toContainText('stats --heatmap');

    expect(errors).toEqual([]);

    await section.scrollIntoViewIfNeeded();
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${SHOTS}/cmb-section.png` });
    await page.screenshot({ path: `${SHOTS}/cmb-full.png`, fullPage: true });
  });

  test('404 heatmap.json → error path với hướng dẫn refresh', async ({ page }) => {
    await page.route('**/heatmap.json', (r) => r.abort());
    await page.goto('/cosmos/scale.html');
    await expect(page.locator('#cmbAdvice')).toContainText('cosmos:refresh');
    await expect(page.locator('#cmbFresh')).toContainText('không có data');
    expect(await page.locator('#cmbGrid .web-empty, #cmbCold .web-empty, #cmbZero .web-empty').count()).toBeGreaterThan(0);
  });

  test('375px — #cmb không tràn ngang', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/cosmos/scale.html');
    await page.locator('#cmb').scrollIntoViewIfNeeded();
    const overflow = await page.evaluate(() => {
      const el = document.getElementById('cmb')!;
      return { sw: el.scrollWidth, cw: el.clientWidth };
    });
    expect(overflow.sw).toBeLessThanOrEqual(overflow.cw + 1);
    await page.screenshot({ path: `${SHOTS}/cmb-375.png` });
  });
});
