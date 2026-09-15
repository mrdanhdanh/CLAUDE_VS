import { test, expect } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';

/**
 * Dream v0 — replay history, 0 execution (Dream-RSI lite — PRD: .agent/plans/dream-simulator/).
 * Khoá 5 invariant:
 *  1. score deterministic + recall đúng trên corpus tốt (title = bug title → hit).
 *  2. phân biệt được: candidate xấu (title/body lạc đề, decoy keyword-sink) → recall 0.
 *  3. run: π0-in-set ⇒ winner never worse (candidate tệ → winner = baseline) + no-write (hash bất biến).
 *  4. integrity gate: dup ID chi tiết → gate fail, score 0.
 *  5. fail-closed: 0 query resolve (thiếu Bug report) → exit 2.
 */

const ROOT = process.cwd();
const SCRIPT = path.join(ROOT, '.github', 'harness', 'scripts', 'dream.mjs');

function run(args: string[]) {
  return spawnSync(process.execPath, [SCRIPT, ...args], { cwd: ROOT, encoding: 'utf8', timeout: 60_000 });
}

const sha = (f: string) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');

function buildBugs(dir: string): string {
  const bugs = path.join(dir, 'bugs');
  fs.mkdirSync(path.join(bugs, '2026-01-01-alpha'), { recursive: true });
  fs.mkdirSync(path.join(bugs, '2026-01-02-beta'), { recursive: true });
  fs.writeFileSync(path.join(bugs, '2026-01-01-alpha', 'bug.md'), '# Bug: Alpha rainbow border xoay khi hover\n', 'utf8');
  fs.writeFileSync(path.join(bugs, '2026-01-02-beta', 'bug.md'), '# Bug: Beta file lock build fail\n', 'utf8');
  return bugs;
}

// Decoy: chứa token của cả 2 query nhưng KHÔNG title-match, KHÔNG exact phrase → keyword-sink yếu.
const DECOY_BODY = 'sink alpha rainbow border xoay hover beta file locks build failing sink words';

interface CorpusOpts {
  alphaTitle: string;
  alphaBody: string;
  betaTitle: string;
  betaBody: string;
  alphaLink: boolean;
  betaLink: boolean;
  dupDetail: boolean;
}

function buildKn(opts: CorpusOpts): string {
  const row = (id: string, t: string) => `| ${id} | 2026-01-0${id.slice(-1)} | ${t} | root | lesson | \`test\` |`;
  const block = (id: string, t: string, body: string, link?: string) =>
    `### ${id} — ${t}\n\n- **Ngày:** 2026-01-0${id.slice(-1)}\n` +
    (link ? `- **Bug report:** \`.agent/bugs/${link}/bug.md\`\n` : '') +
    `- **Guard:** tests/e2e/fixture-${id}.spec.ts\n${body}\n`;
  const rows = [
    row('KN-001', opts.alphaTitle),
    row('KN-002', opts.betaTitle),
    row('KN-003', 'Sink one fixture'),
    row('KN-004', 'Sink two fixture'),
    row('KN-005', 'Sink three fixture'),
  ].join('\n');
  const details = [
    block('KN-001', opts.alphaTitle, opts.alphaBody, opts.alphaLink ? '2026-01-01-alpha' : undefined),
    block('KN-002', opts.betaTitle, opts.betaBody, opts.betaLink ? '2026-01-02-beta' : undefined),
    block('KN-003', 'Sink one fixture', DECOY_BODY),
    block('KN-004', 'Sink two fixture', DECOY_BODY),
    block('KN-005', 'Sink three fixture', DECOY_BODY),
  ];
  if (opts.dupDetail) details.push(details[0]);
  return (
    '# Knowleged fixture\n\n## Bảng tóm tắt\n\n' +
    '| ID | Ngày | Bug | Nguyên nhân gốc | Bài học | Tags |\n' +
    '|----|------|-----|-----------------|---------|------|\n' +
    rows +
    '\n\n## Chi tiết bài học\n\n' +
    details.join('\n')
  );
}

const GOOD: CorpusOpts = {
  alphaTitle: 'Alpha rainbow border xoay khi hover',
  alphaBody: 'Body: alpha rainbow border xoay khi hover — replay phrase bonus.',
  betaTitle: 'Beta file lock build fail',
  betaBody: 'Body: beta file lock build fail — replay phrase bonus.',
  alphaLink: true,
  betaLink: true,
  dupDetail: false,
};

const BAD: CorpusOpts = {
  ...GOOD,
  alphaTitle: 'Generic thing one',
  alphaBody: 'zzz nothing relevant here',
  betaTitle: 'Generic thing two',
  betaBody: 'qqq unrelated content',
};

function writeKn(dir: string, name: string, opts: CorpusOpts): string {
  const f = path.join(dir, name);
  fs.writeFileSync(f, buildKn(opts), 'utf8');
  return f;
}

test('1) score deterministic — corpus tốt recall 1.0, gate pass', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dream-good-'));
  const bugs = buildBugs(dir);
  const f = writeKn(dir, 'base.md', GOOD);

  const r1 = run(['score', '--file', f, '--bugs', bugs, '--json']);
  expect(r1.status, `exit 0 — stderr: ${r1.stderr}`).toBe(0);
  const r2 = run(['score', '--file', f, '--bugs', bugs, '--json']);
  expect(r2.stdout, 'deterministic — 2 run cho cùng output').toBe(r1.stdout);

  const j = JSON.parse(r1.stdout);
  expect(j.candidate.gate).toBe('pass');
  expect(j.candidate.queries.total).toBe(2);
  expect(j.candidate.queries.hits).toBe(2);
  expect(j.candidate.queries.recall).toBe(1);
  expect(j.candidate.knCount).toBe(5);
  expect(j.candidate.guards).toBe(5);
});

test('2) phân biệt: candidate xấu → recall 0 (decoy sink không cứu)', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dream-bad-'));
  const bugs = buildBugs(dir);
  const worse = writeKn(dir, 'worse.md', BAD);

  const r = run(['score', '--file', worse, '--bugs', bugs, '--json']);
  expect(r.status, r.stderr).toBe(0);
  const j = JSON.parse(r.stdout);
  expect(j.candidate.gate).toBe('pass');
  expect(j.candidate.queries.recall).toBe(0);
  expect(j.candidate.queries.misses.sort()).toEqual(['KN-001', 'KN-002']);
});

test('3) run: π0-in-set — candidate tệ ⇒ winner = baseline + no-write', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dream-run-'));
  const bugs = buildBugs(dir);
  const base = writeKn(dir, 'base.md', GOOD);
  const worse = writeKn(dir, 'worse.md', BAD);
  const hBase = sha(base);
  const hWorse = sha(worse);

  const r = run(['run', '--candidate', worse, '--baseline', base, '--bugs', bugs, '--json']);
  expect(r.status, r.stderr).toBe(0);
  const j = JSON.parse(r.stdout);
  expect(j.winner.isBaseline, 'winner never worse — π0 thắng khi candidate tệ hơn').toBe(true);
  expect(j.candidates[0].score).toBeLessThan(j.baseline.score);
  expect(j.guarantee).toContain('winner >= pi0');

  // no-write guarantee — dream không ghi file nào
  expect(sha(base), 'baseline bất biến').toBe(hBase);
  expect(sha(worse), 'candidate bất biến').toBe(hWorse);
});

test('4) integrity gate — dup chi tiết → gate fail, score 0', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dream-dup-'));
  const bugs = buildBugs(dir);
  const dup = writeKn(dir, 'dup.md', { ...GOOD, dupDetail: true });

  const r = run(['score', '--file', dup, '--bugs', bugs, '--json']);
  expect(r.status, r.stderr).toBe(0);
  const j = JSON.parse(r.stdout);
  expect(j.candidate.gate).toBe('fail');
  expect(j.candidate.integrity.issues.length).toBeGreaterThan(0);
  expect(j.candidate.score, 'gate fail ⇒ score bị zero — không đo trên history hỏng').toBe(0);
});

test('5) fail-closed — 0 query resolve (thiếu Bug report) → exit 2', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dream-nolink-'));
  const bugs = buildBugs(dir);
  const nolinks = writeKn(dir, 'nolinks.md', { ...GOOD, alphaLink: false, betaLink: false });

  const r = run(['score', '--file', nolinks, '--bugs', bugs, '--json']);
  expect(r.status, 'fail-closed: không đo được trên history rỗng').toBe(2);
  expect(r.stderr).toContain('0 query');
});
