import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * STATUS audit lock tests (bug 2026-09-12) — Guard: KN-045 (L1 link 404 · L2 registry desc thật · L3 ARIA trỏ ID tồn tại · L4 tab switch)
 * - L1: mọi link same-origin phải resolve (bắt ../README.md → 404)
 * - L2: registry descriptions phải thật (bắt placeholder "hook hooks", "agent designer", "prompt harness" + prose template "Mô tả skill/agent/instruction/prompt …")
 * - L3: mọi aria-labelledby/controls/describedby phải trỏ vào ID tồn tại (bắt tab panels trỏ "governance"/"platform")
 * - L4: tab governance/platform switch đúng + aria state khóa
 *
 * Cấu trúc: thân `page.evaluate` tách thành hàm top-level (chạy trong browser — KHÔNG được
 * tham chiếu biến ngoài, Playwright chỉ serialize thân hàm). Nhờ vậy callback `test.describe`
 * giữ dưới ngưỡng slop-check (function ≤80 dòng · CC ≤12 · KN-047).
 */

/** L1 (browser): thu các link same-origin trả >= 400 hoặc fetch lỗi. */
async function collectBrokenLinksInPage() {
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
    } catch {
      out.push({ url: u.replace(location.origin, ''), status: -1 });
    }
  }
  return out;
}

/**
 * L2 (browser): thu mọi description còn là placeholder.
 *
 * KN-045 + amend 2026-09-24: placeholder có **3 họ**, phải khớp hết:
 *   1. `${type} ${name}` — fallback của harness-manager khi thiếu frontmatter
 *   2. prose template — `harness-manager create` lưu nguyên câu template vào registry
 *      (`Mô tả skill/agent/instruction/prompt …`) ⇒ lưới cũ chỉ khớp họ 1 nên mù với họ này
 *   3. `{{NAME}}` chưa resolve
 * ⚠️ Regex họ 1 phải dựng **trong** vòng lặp nơi `name` đã bind. Dựng ngoài vòng lặp thì
 * `name` rơi vào `window.name` (chuỗi rỗng) → regex thành `^(skill|…)\s+$` → lưới rỗng,
 * im lặng không báo lỗi (đã xảy ra 2026-09-24, sửa tại đây).
 */
async function collectPlaceholderDescriptionsInPage() {
  const res = await fetch('/status.json');
  const data = await res.json();
  const groups = ['skills', 'instructions', 'agents', 'prompts', 'hooks'];

  function isPlaceholder(desc: string, name: string): boolean {
    const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const typeName = new RegExp(`^(skill|instruction|agent|prompt|hook|local)\\s+${esc}$`, 'i');
    return (
      typeName.test(desc) ||
      /^Mô tả (skill|agent|instruction|prompt|hook|ngắn)\b/i.test(desc) ||
      /\{\{[A-Z_]+\}\}/.test(desc)
    );
  }

  const out: string[] = [];
  for (const g of groups) {
    const entries = data.registry?.[g] || {};
    for (const [name, meta] of Object.entries<{ description?: string }>(entries)) {
      const d = (meta.description || '').trim();
      if (!d) {
        out.push(`${g}/${name}: empty`);
        continue;
      }
      if (isPlaceholder(d, name)) out.push(`${g}/${name}: "${d}"`);
    }
  }
  return out;
}

/** L3 (browser): thu mọi aria-labelledby/describedby/controls trỏ vào ID không tồn tại. */
function collectBrokenAriaRefsInPage() {
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
}

test.describe('STATUS audit lock', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('L1: all same-origin links resolve (no 404)', async ({ page }) => {
    const bad = await page.evaluate(collectBrokenLinksInPage);
    expect(bad, 'broken links found').toEqual([]);
  });

  test('L2: registry has no placeholder descriptions', async ({ page }) => {
    const bad = await page.evaluate(collectPlaceholderDescriptionsInPage);
    expect(bad, 'placeholder descriptions found').toEqual([]);
  });

  test('L5: status.json counts khớp registry.json — single source of truth (KN-002)', async () => {
    // KN-002: status.json phải regenerate từ registry.json — hand-edit lệch số là bug.
    const registry = JSON.parse(fs.readFileSync(path.join(process.cwd(), '.github/harness/registry.json'), 'utf8'));
    const status = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'www/status.json'), 'utf8'));
    for (const type of ['skills', 'instructions', 'agents', 'prompts', 'hooks']) {
      const entries = Object.values(registry[type] || {}) as Array<{ enabled?: boolean }>;
      expect(status.counts[type].total, `${type}.total khớp registry`).toBe(entries.length);
      expect(status.counts[type].enabled, `${type}.enabled khớp registry`).toBe(
        entries.filter((e) => e.enabled !== false).length
      );
    }
  });

  test('L3: all aria references point to existing IDs', async ({ page }) => {
    const bad = await page.evaluate(collectBrokenAriaRefsInPage);
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
