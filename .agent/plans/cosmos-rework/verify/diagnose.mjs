// Diagnostic COSMOS · QUANTUM — errors, links, requests, screenshots (YUNIE rework 2026-09-12)
// Chạy: node .agent/plans/cosmos-rework/verify/diagnose.mjs
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const OUT = '.agent/plans/cosmos-rework/verify';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();

const pageErrors = [];
const consoleErrors = [];
const badResponses = [];
page.on('pageerror', (e) => pageErrors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('response', (r) => { if (r.status() >= 400) badResponses.push(`${r.status()} ${r.url()}`); });

await page.goto('http://localhost:3000/cosmos/index.html', { waitUntil: 'load' });
await page.keyboard.press('Escape');
await page.waitForTimeout(800);

// ---- 1. Links audit ----
const links = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll('a[href]').forEach((a) => {
    out.push({ href: a.getAttribute('href'), text: (a.textContent || '').trim().slice(0, 60), target: a.getAttribute('target') || '' });
  });
  return out;
});

const internal = links.filter((l) => l.href && !l.href.startsWith('#') && !/^(https?:|mailto:|javascript:)/.test(l.href));
const anchors = links.filter((l) => l.href && l.href.startsWith('#'));
const external = links.filter((l) => /^https?:/.test(l.href));

const internalResults = [];
for (const l of internal) {
  const url = new URL(l.href, 'http://localhost:3000/cosmos/index.html').toString();
  try {
    const res = await ctx.request.get(url, { timeout: 5000 });
    internalResults.push({ ...l, status: res.status() });
  } catch (e) {
    internalResults.push({ ...l, status: 'ERR ' + String(e).slice(0, 60) });
  }
}

const anchorResults = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    const id = a.getAttribute('href').slice(1);
    if (!id) return;
    out.push({ href: a.getAttribute('href'), exists: !!document.getElementById(id) });
  });
  return out;
});

// ---- 2. Element id references from scripts (quick sanity: getElementById targets) ----
const missingIds = await page.evaluate(() => {
  const src = [...document.querySelectorAll('script')].map((s) => s.textContent || '').join('\n');
  const ids = new Set();
  for (const m of src.matchAll(/getElementById\(['"]([^'"]+)['"]\)/g)) ids.add(m[1]);
  const missing = [];
  for (const id of ids) if (!document.getElementById(id)) missing.push(id);
  return missing;
});

// ---- 3. Screenshots ----
const shot = async (name, w, h) => {
  await page.setViewportSize({ width: w, height: h });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
};

await shot('desktop-1280-hero', 1280, 800);
await shot('mobile-375-hero', 375, 720);
await shot('tablet-768-hero', 768, 900);

// full page desktop (sections)
await page.setViewportSize({ width: 1280, height: 800 });
await page.waitForTimeout(400);
await page.evaluate(() => window.scrollTo(0, 0));
await page.screenshot({ path: `${OUT}/fullpage-desktop.png`, fullPage: true });

// ---- 4. Interaction smoke: click all lab buttons, catch errors ----
await page.setViewportSize({ width: 1280, height: 900 });
await page.evaluate(() => { document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in')); });
const btnIds = await page.evaluate(() => [...document.querySelectorAll('button[id]')].map((b) => b.id));
const clickErrors = [];
for (const id of btnIds) {
  try {
    await page.evaluate((bid) => {
      const el = document.getElementById(bid);
      if (el) el.click();
    }, id);
  } catch (e) {
    clickErrors.push(`${id}: ${String(e).slice(0, 80)}`);
  }
}
await page.waitForTimeout(600);

// ---- Report ----
const report = {
  pageErrors,
  consoleErrors,
  badResponses,
  brokenInternal: internalResults.filter((r) => r.status !== 200),
  internalCount: internalResults.length,
  anchorMissing: anchorResults.filter((a) => !a.exists),
  missingIds,
  clickErrors,
  externalLinks: external.map((l) => l.href),
};
console.log(JSON.stringify(report, null, 2));
await browser.close();
