import { defineConfig, devices } from '@playwright/test';

/**
 * YUNIE — Playwright foundation for www/ (Harness v2)
 * - Tests: tests/e2e/*.spec.ts
 * - WebServer: serve www/ on 3000 (no deps, npx serve)
 * - Verify animation: --angle before/after 500ms (KN-003/KN-004)
 * - Responsive: 375/768/1280
 */
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  expect: { timeout: 5000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  webServer: {
    command: 'npx --yes serve www -l 3000 --no-clipboard --no-port-switching',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 15_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
