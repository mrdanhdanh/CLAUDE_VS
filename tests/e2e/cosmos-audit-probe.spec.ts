import { test, expect } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * KN-049 — Entropy KHÔNG đếm red-team probes (spec tự bắn vào policy gate).
 *
 * Incident 2026-09-12: `guard-redteam.spec.ts` log 1 probe refused (rule=redteam-test,
 * actor=redteam-spec) mỗi lần suite chạy → S +2/lần chạy → false ESCAPE VELOCITY gate
 * (S: 7→11→21→23 dù mismatch/drafts/disabled = 0). Perverse incentive: xoá guard test
 * = S giảm. Fix: scanAudit tách lớp — probe = bằng chứng enforcement, không tính S.
 *
 * Invariant khoá 2 CHIỀU (chống "rửa sạch" metric):
 *   1. probe refused (rule=redteam-test HOẶC actor=redteam-spec) → S không đổi, vào parts.refusedProbes
 *   2. refusal THẬT (rule khác, actor khác) → VẪN tính vào S (đúng trọng số ×2)
 *
 * Đo qua `--audit <file>` (crafted) — deterministic, KHÔNG ghi vào `.agent/audit.jsonl`
 * thật (tránh race phá hash-chain với guard-redteam.spec.ts chạy song song — fullyParallel).
 */

const ROOT = process.cwd();
const SCRIPT = path.join(ROOT, '.github/harness/scripts/cosmic-scale.mjs');

function tmpAudit(tag: string) {
  return path.join(os.tmpdir(), `audit-probe-${tag}-${Date.now()}-${Math.floor(Math.random() * 1e6)}.jsonl`);
}

/** 1 event audit tối thiểu đúng shape thật (đủ field cho scanAudit + redaction-free). */
function ev(decision: string, rule: string, actor: string) {
  return JSON.stringify({ ts: new Date().toISOString(), actor, tool: 'read', target: '***', decision, rule });
}

function writeAudit(file: string, lines: string[]) {
  fs.writeFileSync(file, lines.length ? lines.join('\n') + '\n' : '', 'utf8');
}

function measure(file: string) {
  const r = spawnSync('node', [SCRIPT, '--json', '--audit', file], { cwd: ROOT, encoding: 'utf8', timeout: 60_000 });
  expect(r.status, r.stderr).toBe(0);
  const j = JSON.parse(r.stdout);
  return { S: j.entropy.S as number, parts: j.entropy.parts as { refused: number; refusedProbes: number } };
}

test('probe refused (redteam) không đổi S — chỉ hiện ở parts.refusedProbes', () => {
  const base = tmpAudit('base');
  const withProbes = tmpAudit('probes');
  writeAudit(base, [ev('refused', 'deny-env-read', 'YUNIE')]);
  writeAudit(withProbes, [
    ev('refused', 'deny-env-read', 'YUNIE'),          // friction thật — phải giữ nguyên
    ev('refused', 'redteam-test', 'redteam-spec'),    // probe chuẩn (rule + actor)
    ev('refused', 'deny-law-fork', 'redteam-spec'),   // actor probe, rule khác → vẫn là probe
    ev('refused', 'redteam-test', 'YUNIE'),           // rule probe, actor khác → vẫn là probe
  ]);
  const a = measure(base);
  const b = measure(withProbes);
  expect(a.parts.refused, 'friction thật vẫn đếm').toBe(1);
  expect(b.parts.refused, '3 probes không được lẫn vào refused').toBe(1);
  expect(b.parts.refusedProbes, 'probes đếm riêng (2 rule-branch + 1 actor-branch)').toBe(3);
  expect(b.S, 'S(1 friction + 3 probes) === S(1 friction) — probe không bơm entropy').toBe(a.S);
  fs.rmSync(base, { force: true });
  fs.rmSync(withProbes, { force: true });
});

test('refusal THẬT vẫn tăng S đúng trọng số ×2 (metric không bị rửa sạch)', () => {
  const empty = tmpAudit('empty');
  const friction = tmpAudit('friction');
  writeAudit(empty, []);
  writeAudit(friction, [ev('refused', 'deny-test-mutate', 'Implement')]);
  const a = measure(empty);
  const b = measure(friction);
  expect(b.parts.refused).toBe(1);
  expect(b.parts.refusedProbes).toBe(0);
  expect(b.S - a.S, 'refused thật đóng góp ×2').toBe(2);
  fs.rmSync(empty, { force: true });
  fs.rmSync(friction, { force: true });
});

test('audit thật: probes hiện có được đếm riêng, refused chỉ còn friction', () => {
  const r = spawnSync('node', [SCRIPT, '--json'], { cwd: ROOT, encoding: 'utf8', timeout: 60_000 });
  expect(r.status, r.stderr).toBe(0);
  const parts = JSON.parse(r.stdout).entropy.parts as { refused: number; refusedProbes: number };
  expect(typeof parts.refusedProbes, 'parts.refusedProbes luôn có trong output').toBe('number');
  expect(parts.refusedProbes, 'guard-redteam đã log probe ít nhất 1 lần').toBeGreaterThanOrEqual(1);
});
