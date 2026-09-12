import { test, expect } from '@playwright/test';

/**
 * STATUS audit lock tests (bug 2026-09-12)
 * - L1: mọi link same-origin phải resolve (bắt ../README.md → 404)
 * - L2: registry descriptions phải thật (bắt placeholder "hook hooks", "agent designer", "prompt harness")
 * - L3: mọi aria-labelledby/controls/describedby phải trỏ vào ID tồn tại (bắt tab panels trỏ "governance"/"platform")
 * - L4: tab governance/platform switch đúng + aria state khóa
 */

test.describe('STATUS audit lock', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('L1: all same-origin links resolve (no 404)', async ({ page }) => {
    const bad = await page.evaluate(async () => {
      const urls = [
        ...new Set(
          [...document.querySelectorAll('a[href]')]
            .map((a) => (a as HTMLAnchorElement).href)
            .filter((u) => u.startsWith(location.origin))
        ),
      ];
      const out: { url: string; status: number }[] = [];
      for (const u of urls) {
        try {
          const r = await fetch(u, { method: 'GET' });
          if (r.status >= 400) out.push({ url: u.replace(location.origin, ''), status: r.status });
        } catch (e) {
          out.push({ url: u.replace(location.origin, ''), status: -1 });
        }
      }
      return out;
    });
    expect(bad, 'broken links found').toEqual([]);
  });

  test('L2: registry has no placeholder descriptions', async ({ page }) => {
    const bad = await page.evaluate(async () => {
      const res = await fetch('/status.json');
      const data = await res.json();
      const groups = ['skills', 'instructions', 'agents', 'prompts', 'hooks'];
      const singular: Record<string, string> = {
        skills: 'skill',
        instructions: 'instruction',
        agents: 'agent',
        prompts: 'prompt',
        hooks: 'hook',
      };
      const out: string[] = [];
      const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      for (const g of groups) {
        const entries = data.registry?.[g] || {};
        for (const [name, meta] of Object.entries<{ description?: string }>(entries)) {
          const d = (meta.description || '').trim();
          if (!d) {
            out.push(`${g}/${name}: empty`);
            continue;
          }
          const re = new RegExp(
            `^(skill|instruction|agent|prompt|hook|local)\\s+${esc(name)}$`,
            'i'
          );
          if (re.test(d)) out.push(`${g}/${name}: "${d}"`);
        }
      }
      return out;
    });
    expect(bad, 'placeholder descriptions found').toEqual([]);
  });

  test('L3: all aria references point to existing IDs', async ({ page }) => {
    const bad = await page.evaluate(() => {
      const ids = new Set([...document.querySelectorAll('[id]')].map((e) => e.id));
      const out: string[] = [];
      for (const attr of ['aria-labelledby', 'aria-describedby', 'aria-controls']) {
        document.querySelectorAll(`[${attr}]`).forEach((el) => {
          for (const ref of (el.getAttribute(attr) || '').split(/\s+/).filter(Boolean)) {
            if (!ids.has(ref)) out.push(`${attr}="${ref}" on #${el.id || el.tagName.toLowerCase()}`);
          }
        });
      }
      return out;
    });
    expect(bad, 'broken aria references').toEqual([]);
  });

  test('L4: governance/platform tabs keep aria state wired', async ({ page }) => {
    const plTab = page.locator('.tabs [data-tab="platform"]');
    const govTab = page.locator('.tabs [data-tab="governance"]');
    await expect(plTab).toHaveAttribute('aria-selected', 'false');
    await plTab.click();
    await expect(plTab).toHaveAttribute('aria-selected', 'true');
    await expect(govTab).toHaveAttribute('aria-selected', 'false');
    await expect(page.locator('#tab-platform')).toBeVisible();
    await expect(page.locator('#tab-governance')).toBeHidden();
    // panel labelled-by must resolve to its tab button
    const labelledby = await page.locator('#tab-platform').getAttribute('aria-labelledby');
    expect(labelledby).toBeTruthy();
    await expect(page.locator(`#${labelledby}`)).toHaveCount(1);
  });
});
