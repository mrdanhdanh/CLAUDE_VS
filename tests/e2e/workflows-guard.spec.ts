import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Workflows guard (KN-015): chỉ ĐÚNG 1 workflow deploy Pages — chống tái diễn vụ
 * ai-news.yml copy 3 bước deploy → 2 workflow cùng env `github-pages` → deploy fail.
 * Static check (không cần browser).
 */
test('KN-015: chỉ 1 workflow deploy Pages', () => {
  const dir = path.join(process.cwd(), '.github', 'workflows');
  const files = fs.readdirSync(dir).filter((f) => /\.ya?ml$/.test(f));
  const deployers = files.filter((f) => fs.readFileSync(path.join(dir, f), 'utf8').includes('deploy-pages'));
  expect(deployers.length, `deployer phải đúng 1 (KN-015) — thấy: ${deployers.join(', ')}`).toBe(1);
  expect(deployers[0], 'deployer duy nhất phải là pages.yml').toBe('pages.yml');
});
