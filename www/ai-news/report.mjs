#!/usr/bin/env node
/**
 * AI News Report — daily digest + ứng viên curated (0-dep)
 *
 * Học pattern từ AIHOT (github.com/KKKKhazix/AIHOT, ~3.9k★): "tự tìm hotspot + tự viết daily report;
 * đổi nguồn/tiêu chuẩn chọn là thành hotspot site của mình". Harness adopt phần VỪA ĐỦ (KN-089):
 *   - report.md sinh từ feed sẵn có (ai-news.json) — digest + phân bố nguồn;
 *   - danh sách ỨNG VIÊN để ghim `curated.json` — người/agent quyết, KHÔNG auto-pin.
 * SKIPPED: config-sources động (6 nguồn ổn định — YAGNI, xem KN-089).
 *
 * Usage:
 *   node report.mjs [--file ai-news.json] [--curated curated.json] [--out report.md] [--json] [--dry]
 *   --json  in JSON ra stdout (không ghi file) · --dry in markdown ra stdout (không ghi)
 * No deps, Node 18+
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function argValue(name, fallback) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx !== -1 && process.argv[idx + 1] && !process.argv[idx + 1].startsWith('--')) return process.argv[idx + 1];
  return fallback;
}

const FEED_PATH = argValue('file', path.join(__dirname, 'ai-news.json'));
const CURATED_PATH = argValue('curated', path.join(__dirname, 'curated.json'));
const OUT_PATH = argValue('out', path.join(__dirname, 'report.md'));
const JSON_MODE = process.argv.includes('--json');
const DRY = process.argv.includes('--dry');

function readJson(file, { required, label }) {
  if (!fs.existsSync(file)) {
    if (required) {
      console.error(`⛔ report: ${label} không tồn tại — ${file}`);
      process.exit(2);
    }
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    console.error(`⛔ report: ${label} không parse được (${e.message}) — ${file}`);
    process.exit(2);
  }
}

function normKey(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().slice(0, 60);
}

function cleanText(s) {
  return String(s == null ? '' : s).replace(/\|/g, '/').replace(/\s+/g, ' ').trim();
}

function num(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  if (n <= 0) return 0;
  return n;
}

function dateOf(v) {
  if (typeof v === 'string' && v.length > 0) return v;
  return '?';
}

function urlOf(a) {
  return a.sourceUrl ? String(a.sourceUrl) : '';
}

function curatedKeys(curated) {
  const keys = new Set();
  for (const a of curated?.articles || []) {
    if (a?.sourceUrl) keys.add(String(a.sourceUrl).trim());
    if (a?.title) keys.add(normKey(a.title));
  }
  return keys;
}

function isCurated(a, keys) {
  const url = String(a.sourceUrl || '').trim();
  if (url && keys.has(url)) return true;
  return keys.has(normKey(a.title));
}

function countBy(list, pick) {
  const out = {};
  for (const item of list) {
    const key = cleanText(pick(item));
    if (!key) continue;
    out[key] = (out[key] || 0) + 1;
  }
  return out;
}

function compareByScoreDesc(a, b) {
  const d = num(b.score) - num(a.score);
  if (d !== 0) return d;
  return new Date(b.date).getTime() - new Date(a.date).getTime();
}

function candidateReason(score, source, hot) {
  if (score >= 500) return `điểm cao (${score})`;
  if (source === 'arXiv') return 'paper mới';
  if (hot) return 'đang hot';
  return 'mới';
}

function toEntry(a, extra) {
  const entry = { title: cleanText(a.title), source: cleanText(a.source), date: dateOf(a.date), score: num(a.score), url: urlOf(a) };
  return Object.assign(entry, extra || {});
}

function curatedTotal(curated) {
  if (Array.isArray(curated?.articles)) return curated.articles.length;
  return 0;
}

function buildReport(feed, curated) {
  const articles = feed.articles;
  const keys = curatedKeys(curated);
  const hot = articles
    .filter((a) => a.hot)
    .sort(compareByScoreDesc)
    .slice(0, 8)
    .map((a) => toEntry(a));
  const candidates = articles
    .filter((a) => !isCurated(a, keys))
    .sort(compareByScoreDesc)
    .slice(0, 5)
    .map((a) => toEntry(a, { reason: candidateReason(num(a.score), a.source, !!a.hot) }));
  return {
    generatedAt: new Date().toISOString(),
    feedGeneratedAt: feed.generatedAt ? feed.generatedAt : null,
    totals: {
      articles: articles.length,
      hot: articles.filter((a) => a.hot).length,
      pinnedInFeed: articles.filter((a) => isCurated(a, keys)).length,
      curatedTotal: curatedTotal(curated),
    },
    bySource: countBy(articles, (a) => a.source),
    byCategory: countBy(articles, (a) => a.category),
    hot,
    candidates,
  };
}

function renderHot(hot) {
  const rows = hot.map((a, i) => `| ${i + 1} | ${a.title} | ${a.source} | ${a.score} | ${a.date} |`);
  return ['## 🔥 Tin nổi bật (hot, top theo score)', '', '| # | Tin | Nguồn | Điểm | Ngày |', '|---|-----|-------|------|------|', ...rows, ''].join('\n');
}

function renderCandidates(candidates) {
  const head = '## 🎯 Ứng viên ghim curated (chưa có trong curated.json)';
  if (!candidates.length) return [head, '', '_Không có ứng viên mới — hoặc feed đã được ghim hết._', ''].join('\n');
  const items = candidates.map((a, i) => {
    const line = `${i + 1}. **${a.title}** — ${a.source} · ${a.date} · score ${a.score} · _${a.reason}_`;
    if (!a.url) return line;
    return `${line}\n   <${a.url}>`;
  });
  return [head, '', ...items, ''].join('\n');
}

function fmtCounts(obj) {
  return Object.entries(obj)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k} (${v})`)
    .join(' · ');
}

function renderMarkdown(report) {
  const { totals } = report;
  return [
    `# AI News Digest — ${dateOf(report.generatedAt.slice(0, 10))}`,
    '',
    `> Sinh tự động bởi \`www/ai-news/report.mjs\` (0-dep) · feed: ${report.feedGeneratedAt ? report.feedGeneratedAt : 'n/a'}`,
    '',
    `- Tổng tin: **${totals.articles}** · hot: **${totals.hot}** · đã ghim curated khớp feed: **${totals.pinnedInFeed}/${totals.curatedTotal}**`,
    '',
    renderHot(report.hot),
    renderCandidates(report.candidates),
    '## 📊 Phân bố',
    '',
    `- Theo nguồn: ${fmtCounts(report.bySource)}`,
    `- Theo category: ${fmtCounts(report.byCategory)}`,
    '',
  ].join('\n');
}

function main() {
  const feed = readJson(FEED_PATH, { required: true, label: 'feed' });
  if (!feed || !Array.isArray(feed.articles) || feed.articles.length === 0) {
    console.error(`⛔ report: feed thiếu articles — fail-closed (${FEED_PATH})`);
    process.exit(2);
  }
  const curated = readJson(CURATED_PATH, { required: false, label: 'curated' });
  const report = buildReport(feed, curated);
  if (JSON_MODE) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }
  const md = renderMarkdown(report);
  if (DRY) {
    console.log(md);
    return;
  }
  fs.writeFileSync(OUT_PATH, md, 'utf8');
  console.log(`✅ report: ${path.relative(process.cwd(), OUT_PATH)} (${report.totals.articles} tin, ${report.candidates.length} ứng viên, ${report.totals.hot} hot)`);
}

main();
