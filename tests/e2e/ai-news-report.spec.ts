import { test, expect } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * Guard cho `www/ai-news/report.mjs` (KN-089 — học AIHOT: daily digest + ứng viên curated).
 * R1: fixture → report có hot + ứng viên, tin đã ghim curated KHÔNG xuất hiện trong ứng viên.
 * R2: feed hỏng/thiếu articles → exit 2 fail-closed (không sinh report rác).
 * R3: curated.json thiếu → vẫn chạy (negative control chống phụ thuộc cứng).
 */

const ROOT = process.cwd();
const NODE = process.execPath;

function runReport(args: string[]) {
  return spawnSync(NODE, [path.join(ROOT, 'www', 'ai-news', 'report.mjs'), ...args], {
    encoding: 'utf8', cwd: ROOT, timeout: 15_000,
  });
}

const tmp = (suffix: string) => path.join(os.tmpdir(), `ai-news-report-${Date.now()}-${Math.random().toString(36).slice(2)}${suffix}`);

const FEED = {
  generatedAt: '2026-09-30T00:00:00.000Z',
  articles: [
    { id: 'a1', title: 'OpenAI ships new agent tool', summary: '', source: 'Hacker News', sourceUrl: 'https://news.ycombinator.com/item?id=1', category: 'products', date: '2026-09-30', hot: true, score: 300, tags: [] },
    { id: 'a2', title: 'Pinned big story about safety', summary: '', source: 'Hacker News', sourceUrl: 'https://news.ycombinator.com/item?id=2', category: 'safety', date: '2026-09-29', hot: true, score: 900, tags: [] },
    { id: 'a3', title: 'arXiv paper on risk-averse agents', summary: '', source: 'arXiv', sourceUrl: 'http://arxiv.org/abs/2609.38093v1', category: 'safety', date: '2026-09-29', hot: true, score: 800, tags: [] },
  ],
};

test.describe('AI News Report — digest + ứng viên curated (KN-089, học AIHOT)', () => {
  test('R1: report có hot + ứng viên; tin đã ghim curated bị loại khỏi ứng viên', () => {
    const feedPath = tmp('.json');
    const curatedPath = tmp('.curated.json');
    const outPath = tmp('.md');
    fs.writeFileSync(feedPath, JSON.stringify(FEED));
    fs.writeFileSync(curatedPath, JSON.stringify({
      description: 'pins',
      articles: [{ id: 'c1', title: 'Pinned big story about safety', sourceUrl: 'https://news.ycombinator.com/item?id=2' }],
    }));

    const r = runReport(['--file', feedPath, '--curated', curatedPath, '--out', outPath]);
    expect(r.status, r.stderr).toBe(0);
    const md = fs.readFileSync(outPath, 'utf8');

    expect(md).toContain('Tin nổi bật');
    expect(md).toContain('arXiv paper on risk-averse agents');
    const candidatesBlock = md.split('Ứng viên ghim curated')[1] || '';
    expect(candidatesBlock, 'ứng viên phải bỏ qua tin đã ghim curated').not.toContain('Pinned big story about safety');
    expect(candidatesBlock, 'tin chưa ghim phải là ứng viên').toContain('OpenAI ships new agent tool');

    for (const p of [feedPath, curatedPath, outPath]) fs.rmSync(p);
  });

  test('R2: feed thiếu articles → exit 2 fail-closed, không sinh report', () => {
    const feedPath = tmp('.json');
    const outPath = tmp('.md');
    fs.writeFileSync(feedPath, JSON.stringify({ nope: true }));
    const r = runReport(['--file', feedPath, '--out', outPath]);
    expect(r.status, 'feed hỏng phải fail-closed (exit 2)').toBe(2);
    expect(fs.existsSync(outPath), 'không được ghi report từ feed hỏng').toBe(false);
    fs.rmSync(feedPath);
  });

  test('R3: curated.json thiếu → vẫn chạy (ứng viên = top toàn feed)', () => {
    const feedPath = tmp('.json');
    const outPath = tmp('.md');
    fs.writeFileSync(feedPath, JSON.stringify(FEED));
    const r = runReport(['--file', feedPath, '--curated', tmp('.missing.json'), '--out', outPath]);
    expect(r.status, r.stderr).toBe(0);
    const md = fs.readFileSync(outPath, 'utf8');
    expect(md).toContain('Ứng viên ghim curated');
    expect(md).toContain('Pinned big story about safety');
    fs.rmSync(feedPath);
    fs.rmSync(outPath);
  });
});
