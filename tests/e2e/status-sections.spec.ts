import { test, expect } from '@playwright/test';

// STATUS page — section render invariants sau refactor www/app.js (KN-047).
// Audit spec cũ chỉ phủ link/placeholder/ARIA/tab; spec này khoá các section
// vừa tách helper: governance (audit/policy/cred/tail), platform (4 cards),
// yunie lore (letters/aliases/intros), health card + copy button.
test.describe('STATUS — section render invariants', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('governance: 3 cards render + tail có rows hoặc empty state', async ({ page }) => {
    await expect(page.locator('#govAuditCard')).toContainText('Audit Trail', { timeout: 8000 });
    await expect(page.locator('#govPolicyCard')).toContainText('Policy Gate');
    await expect(page.locator('#govCredCard')).toContainText('Credentials');
    const rows = page.locator('#govTailBody tr');
    const cards = page.locator('#govTailCards .reg-card');
    await expect(rows.first()).toBeVisible();
    expect(await rows.count()).toBeGreaterThanOrEqual(1);
    expect(await cards.count()).toBeGreaterThanOrEqual(1);
    // 2 view đồng bộ số dòng
    expect(await cards.count()).toBe(await rows.count());
  });

  test('platform: 4 cards render đủ', async ({ page }) => {
    await expect(page.locator('#platAgentCard')).toContainText('AG-UI Agents', { timeout: 8000 });
    await expect(page.locator('#platMcpCard')).toContainText('Governed MCP');
    await expect(page.locator('#platCompCard')).toContainText('Components');
    await expect(page.locator('#platRoutineCard')).toContainText('Routines');
  });

  test('yunie lore: 5 letters Y-U-N-I-E + aliases + intro tabs đổi nội dung', async ({ page }) => {
    await expect(page.locator('#yunieLetters .yunie-letter-card')).toHaveCount(5, { timeout: 8000 });
    await expect(page.locator('#yunieLetters')).toContainText('Yielding');
    await expect(page.locator('#yunieLetters')).toContainText('Executing');
    // aliases + intros nằm trong <details> đóng mặc định → mở trước
    await page.locator('.yunie-details summary').click();
    await expect(page.locator('#yunieAliases .yunie-alias-item').first()).toBeVisible();
    // tab đổi intro text
    const introText = page.locator('#yunieIntroText');
    await expect(introText).not.toHaveText('—', { timeout: 8000 });
    const before = await introText.textContent();
    await page.locator('.yunie-tabs [data-intro="fun"]').click();
    await expect(page.locator('#yunieIntroTag')).toHaveText('vui 🎉');
    const after = await introText.textContent();
    expect(after).not.toBe(before);
    // surprise button tồn tại và click được
    await page.locator('#btnYunieSurprise').click();
    await expect(introText).not.toHaveText('—');
  });

  test('health card: status text + nút copy JSON', async ({ page }) => {
    await expect(page.locator('#healthCard')).toContainText('Hệ thống ổn định', { timeout: 8000 });
    await expect(page.locator('#btnCopyJson')).toBeVisible();
    await expect(page.locator('#healthCard a[href="./status.json"]')).toBeVisible();
  });

  test('search filter vẫn hoạt động sau refactor renderRegistryTable', async ({ page }) => {
    await expect(page.locator('#registryBody tr').first()).toBeVisible({ timeout: 8000 });
    const allCount = await page.locator('#registryBody tr').count();
    await page.fill('#registrySearch', 'skill');
    await page.waitForTimeout(300);
    const filtered = await page.locator('#registryBody tr, #registryEmpty').count();
    expect(filtered).toBeGreaterThanOrEqual(1);
    expect(allCount).toBeGreaterThan(0);
    await page.fill('#registrySearch', 'zzz-khong-ton-tai-xyz');
    await page.waitForTimeout(300);
    await expect(page.locator('#registryEmpty')).toBeVisible();
    await page.fill('#registrySearch', '');
    await page.waitForTimeout(300);
    await expect(page.locator('#registryBody tr').first()).toBeVisible();
  });
});
