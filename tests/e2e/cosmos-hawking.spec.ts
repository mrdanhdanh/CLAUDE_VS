import { test, expect, type Page } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * Hawking Radiation — Nợ bay hơi (roadmap card #2, 2026-09-12):
 *  - `auto-learn.mjs watchdog`: bug open ≥30d → escalate (journal + nhắc) · ≥90d → evaporate
 *    (note hawking.md + Status → evaporated — giữ lịch sử, gợi ý propose KN)
 *  - journal `.agent/hawking.jsonl` append-only, idempotent (chỉ ghi khi action ĐỔI)
 *  - GATE SIẾT 2026-09-12: mutation bắt buộc **human sign-off** (`--apply --sign <human>`);
 *    thiếu sign / sign bằng danh tính agent → REFUSED (exit 2) + dry-run, không mutate gì
 *  - scale.html section #hawking render từ hawking.json thật (KN-030)
 * Evidence → .agent/plans/cosmos-hawking/verify/
 */

const ROOT = process.cwd();
const SCRIPT = path.join(ROOT, '.github/harness/scripts/auto-learn.mjs');
const SHOTS = '.agent/plans/cosmos-hawking/verify';
const NOW = '2026-09-12T00:00:00Z';

/** Fixture tất định: 3 open (254/42/2 ngày) + 1 fixed — dùng --now cố định. */
function makeFixture(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hawking-'));
  const mk = (slug: string, status: string) => {
    const d = path.join(dir, slug);
    fs.mkdirSync(d, { recursive: true });
    fs.writeFileSync(
      path.join(d, 'bug.md'),
      `# Bug: ${slug}\n\n## Meta\n\n- **Slug:** \`${slug}\`\n- **Status:** \`${status}\`\n`
    );
  };
  mk('2026-01-01-old-open', 'open');       // ~254 ngày → evaporate
  mk('2026-08-01-mid-open', 'open');       // 42 ngày → escalate
  mk('2026-09-10-fresh-open', 'open');     // 2 ngày → fresh
  mk('2026-07-01-old-fixed', 'fixed');     // closed — không tính
  fs.mkdirSync(path.join(dir, '_template'), { recursive: true });
  fs.writeFileSync(path.join(dir, '_template', 'bug.md'), '- **Status:** `open` | `fixed` | `wontfix`\n');
  return dir;
}

function runWatchdog(args: string[]) {
  return spawnSync('node', [SCRIPT, 'watchdog', ...args], { cwd: ROOT, encoding: 'utf8', timeout: 60_000 });
}

async function prep(page: Page) {
  const errors: string[] = [];
  const bad: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('response', (res) => {
    if (res.status() >= 400 && res.url().includes('hawking.json')) bad.push(res.url() + ' → ' + res.status());
  });
  await page.goto('/cosmos/scale.html');
  return { errors, bad };
}

test('watchdog --json: phân hạng tuổi + counts + sort desc', () => {
  const dir = makeFixture();
  try {
    const r = runWatchdog(['--json', '--dir', dir, '--now', NOW]);
    expect(r.status, r.stderr).toBe(0);
    const j = JSON.parse(r.stdout);

    expect(j.generatedBy).toBe('auto-learn.mjs watchdog');
    expect(j.policy).toEqual({ escalateDays: 30, evaporateDays: 90 });
    expect(j.counts).toEqual({ bugsTotal: 4, open: 3, fresh: 1, escalate: 1, evaporate: 1, closed: 1 });

    // chỉ bug open, sort tuổi giảm dần
    expect(j.bugs.map((b: { slug: string }) => b.slug)).toEqual([
      '2026-01-01-old-open',
      '2026-08-01-mid-open',
      '2026-09-10-fresh-open',
    ]);
    expect(j.bugs[0].ageDays).toBe(254);
    expect(j.bugs[0].action).toBe('evaporate');
    expect(j.bugs[1].ageDays).toBe(42);
    expect(j.bugs[1].action).toBe('escalate');
    expect(j.bugs[2].ageDays).toBe(2);
    expect(j.bugs[2].action).toBe('fresh');
    // _template bị bỏ qua
    expect(r.stdout).not.toContain('_template');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('watchdog --apply: cần human sign-off, journal + note + Status→evaporated, idempotent lần 2', () => {
  const dir = makeFixture();
  try {
    const journal = path.join(dir, 'hawking.jsonl');

    // mutation BẮT BUỘC có human sign-off (gate siết 2026-09-12 — tách intent/execution)
    const r1 = runWatchdog(['--apply', '--sign', 'danh', '--dir', dir, '--now', NOW, '--journal', journal]);
    expect(r1.status, r1.stderr).toBe(0);

    // journal: 2 entry (escalate + evaporate), append-only, có signedBy
    const lines1 = fs.readFileSync(journal, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));
    expect(lines1.map((e) => e.action).sort()).toEqual(['escalate', 'evaporate']);
    expect(lines1.find((e) => e.action === 'evaporate').slug).toBe('2026-01-01-old-open');
    expect(lines1.find((e) => e.action === 'escalate').ageDays).toBe(42);
    for (const e of lines1) expect(e.signedBy, 'journal phải ghi người ký').toBe('danh');

    // bug 254d: note + Status đổi, KHÔNG xoá gì
    const oldDir = path.join(dir, '2026-01-01-old-open');
    const note = fs.readFileSync(path.join(oldDir, 'hawking.md'), 'utf8');
    expect(note).toContain('2026-01-01-old-open');
    expect(note).toContain('propose --bug');
    const bugText = fs.readFileSync(path.join(oldDir, 'bug.md'), 'utf8');
    expect(bugText).toContain('`evaporated`');
    expect(bugText).not.toContain('`open`');
    expect(bugText, 'không mất lịch sử').toContain('# Bug: 2026-01-01-old-open');

    // lần 2: bug evaporate không còn open; escalate cùng action → không ghi thêm (idempotent)
    const r2 = runWatchdog(['--apply', '--sign', 'danh', '--dir', dir, '--now', NOW, '--journal', journal]);
    expect(r2.status, r2.stderr).toBe(0);
    const lines2 = fs.readFileSync(journal, 'utf8').trim().split('\n').filter(Boolean);
    expect(lines2.length, 'journal không thêm entry trùng').toBe(lines1.length);

    const j2 = JSON.parse(runWatchdog(['--json', '--dir', dir, '--now', NOW]).stdout);
    expect(j2.counts).toEqual({ bugsTotal: 4, open: 2, fresh: 1, escalate: 1, evaporate: 0, closed: 2 });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('watchdog --apply thiếu --sign: REFUSED, không mutate, có dry-run plan', () => {
  const dir = makeFixture();
  try {
    const journal = path.join(dir, 'hawking.jsonl');
    const r = runWatchdog(['--apply', '--dir', dir, '--now', NOW, '--journal', journal]);

    expect(r.status, 'exit 2 = refused bởi gate').toBe(2);
    expect(r.stderr).toContain('sign');
    // dry-run cho human review trước khi ký
    expect(r.stdout).toContain('2026-01-01-old-open');
    // không mutate gì
    expect(fs.existsSync(journal), 'journal không được tạo').toBe(false);
    expect(fs.existsSync(path.join(dir, '2026-01-01-old-open', 'hawking.md'))).toBe(false);
    expect(fs.readFileSync(path.join(dir, '2026-01-01-old-open', 'bug.md'), 'utf8')).toContain('`open`');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('watchdog --sign bằng danh tính agent: REFUSED (agent không tự ký)', () => {
  const dir = makeFixture();
  try {
    for (const who of ['YUNIE', 'agent', 'auto', 'verify', 'ci-bot', '']) {
      const r = runWatchdog(['--apply', '--sign', who, '--dir', dir, '--now', NOW, '--journal', path.join(dir, 'h.jsonl')]);
      expect(r.status, `signer "${who}" phải bị từ chối`).toBe(2);
      expect(r.stderr).toContain('sign');
    }
    expect(fs.existsSync(path.join(dir, 'h.jsonl')), 'không được ghi gì').toBe(false);
    expect(fs.readFileSync(path.join(dir, '2026-01-01-old-open', 'bug.md'), 'utf8')).toContain('`open`');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('watchdog --out ghi JSON hợp lệ + boundary 30/90', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hawking-b-'));
  try {
    // đúng biên: 30 ngày → escalate (≥), 89 ngày → escalate, 90 ngày → evaporate (≥)
    for (const [slug, status] of [['2026-08-13-b30', 'open'], ['2026-06-15-b89', 'open'], ['2026-06-14-b90', 'open']] as const) {
      const d = path.join(dir, slug);
      fs.mkdirSync(d, { recursive: true });
      fs.writeFileSync(path.join(d, 'bug.md'), `- **Status:** \`${status}\`\n`);
    }
    const out = path.join(os.tmpdir(), `hawking-out-${Date.now()}.json`);
    const r = runWatchdog(['--json', '--dir', dir, '--now', NOW, '--out', out]);
    expect(r.status, r.stderr).toBe(0);
    const j = JSON.parse(fs.readFileSync(out, 'utf8'));
    const by = Object.fromEntries(j.bugs.map((b: { slug: string; action: string }) => [b.slug, b.action]));
    expect(by['2026-08-13-b30'], '30 ngày = escalate').toBe('escalate');
    expect(by['2026-06-15-b89'], '89 ngày = escalate').toBe('escalate');
    expect(by['2026-06-14-b90'], '90 ngày = evaporate').toBe('evaporate');
    fs.rmSync(out, { force: true });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('scale.html — section Hawking render từ hawking.json thật', async ({ page }) => {
  const { errors, bad } = await prep(page);

  await expect(page.locator('#hawking-title')).toBeVisible();
  await expect(page.locator('#hawkingAdvice')).toContainText('open', { timeout: 10_000 });

  const res = await page.request.get('/cosmos/hawking.json');
  expect(res.status(), 'hawking.json phải commit trong www/ (KN-030)').toBe(200);
  const j = await res.json();

  // counts hiển thị khớp data thật
  await expect(page.locator('#hawkingAdvice')).toContainText(String(j.counts.open) + ' open');
  await expect(page.locator('#hawkingAdvice')).toContainText(String(j.counts.escalate) + ' escalate');
  await expect(page.locator('#hawkingAdvice')).toContainText(String(j.counts.evaporate) + ' evaporate');

  // rows khớp từng action (hoặc empty-state)
  const esc = j.bugs.filter((b: { action: string }) => b.action === 'escalate');
  const eva = j.bugs.filter((b: { action: string }) => b.action === 'evaporate');
  if (esc.length) await expect(page.locator('#hawkingEscalate .bh-item')).toHaveCount(esc.length);
  else await expect(page.locator('#hawkingEscalate')).toContainText('không có');
  if (eva.length) await expect(page.locator('#hawkingEvaporate .bh-item')).toHaveCount(eva.length);
  else await expect(page.locator('#hawkingEvaporate')).toContainText('không có');

  expect(bad, 'không fetch nào 404').toEqual([]);
  expect(errors).toEqual([]);

  await page.locator('#hawking-title').scrollIntoViewIfNeeded();
  await expect
    .poll(() => page.locator('section:has(#hawking-title)').evaluate((el) => getComputedStyle(el).opacity), { timeout: 5000 })
    .toBe('1');
  await page.locator('section:has(#hawking-title)').screenshot({ path: `${SHOTS}/hawking-section.png` });
});

test('Hawking @375 — không tràn ngang, không lỗi', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 780 });
  const { errors } = await prep(page);
  await expect(page.locator('#hawkingAdvice')).toContainText('open', { timeout: 10_000 });
  const overflow = await page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
  }));
  expect(overflow.scrollW, 'không tràn ngang').toBeLessThanOrEqual(overflow.clientW + 1);
  expect(errors).toEqual([]);
  await page.locator('#hawking-title').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await page.locator('section:has(#hawking-title)').screenshot({ path: `${SHOTS}/hawking-375.png` });
});
