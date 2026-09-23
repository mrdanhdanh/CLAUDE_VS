import { test, expect, type Page } from '@playwright/test';

/**
 * RED guard cho COSMOS 3D upgrade.
 * Contract mới: telemetry thật có provenance, có constellation links, có warp state.
 * File này độc lập guard spec hiện có; không sửa assertion cũ để làm xanh.
 */

async function boot(page: Page) {
  await page.goto('/cosmos-3d/index.html');
  await page.waitForFunction(() => (window as unknown as { __COSMOS3D?: { ready?: boolean } }).__COSMOS3D?.ready === true);
  await page.waitForFunction(() => document.querySelector('#boot')?.classList.contains('hide') === true);
}

test.describe('cosmos-3d upgrade — observatory', () => {
  test('telemetry exposes real provenance and five signals', async ({ page }) => {
    await boot(page);
    const telemetry = await page.evaluate(() => (window as unknown as {
      __COSMOS3D: { telemetry: () => Record<string, unknown> };
    }).__COSMOS3D.telemetry());
    expect(telemetry.source).toContain('scale.json');
    expect(telemetry.generatedAt).toBeTruthy();
    expect(telemetry.stale).toBe(false);
    expect(['entropy', 'policy', 'dissent', 'gravity', 'kn']).toEqual(Object.keys(telemetry.signals));
    await expect(page.locator('#telemetrySource')).toContainText('scale.json');
    await expect(page.locator('#telemetryGenerated')).not.toHaveText('—');
  });

  test('map zone exposes one constellation link layer and changes visibility', async ({ page }) => {
    await boot(page);
    await page.evaluate(() => (window as unknown as { __COSMOS3D: { zone: (z: string) => void } }).__COSMOS3D.zone('map'));
    const links = await page.evaluate(() => (window as unknown as {
      __COSMOS3D: { constellation: () => { segments: number; visible: boolean } };
    }).__COSMOS3D.constellation());
    expect(links.segments).toBeGreaterThan(0);
    expect(links.visible).toBe(true);
  });

  test('zone switch emits a short warp state', async ({ page }) => {
    await boot(page);
    await page.click('#btnExplore');
    await page.click('.switcher .btn[data-zone="map"]');
    await expect(page.locator('#warp')).toHaveClass(/active/);
    await expect(page.locator('#warp')).toHaveAttribute('data-warp', 'map');
  });
});
