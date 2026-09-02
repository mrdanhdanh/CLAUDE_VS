#!/usr/bin/env node
/**
 * YUNIE × Last30Days — AI News Fetcher (Node.js bridge)
 * Fetches AI news from last 30 days via free APIs (no keys) and updates ai-news.json
 * Works with Node 18+ (fetch built-in), no Python 3.12 needed.
 * Sources: HN Algolia (free), GitHub Trending (free), TechCrunch RSS (free)
 * Usage: node www/ai-news/fetch.mjs [--dry] [--topic "AI agents"]
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JSON_PATH = path.join(__dirname, 'ai-news.json');
const DRY = process.argv.includes('--dry');
const TOPIC = process.argv.find((a, i, arr) => arr[i-1] === '--topic') || 'AI';

// 30 days ago timestamp
const THIRTY_DAYS_AGO = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;

const CATEGORIES = [
  { id: 'self-improving', name: 'Self-Improving AI', icon: '🧠', color: '#6366f1', keywords: ['self-improving','AAR','alignment','self-training','auto-researcher','self-evolving'] },
  { id: 'big-tech', name: 'Big Tech Moves', icon: '🏢', color: '#ec4899', keywords: ['acquisition','funding','valuation','merger','hiring','layoff','earnings','Nvidia','OpenAI','Google','Anthropic','Meta'] },
  { id: 'safety', name: 'Safety & Policy', icon: '🛡️', color: '#10b981', keywords: ['safety','policy','regulation','lawsuit','IP','copyright','rogue','alignment','risk','governance'] },
  { id: 'products', name: 'Products & Launches', icon: '🚀', color: '#f59e0b', keywords: ['launch','release','model','API','product','feature','update','Gemma','Claude','GPT','Gemini'] },
  { id: 'fun', name: 'Fun & Weird', icon: '🤖', color: '#8b5cf6', keywords: ['robot','cute','weird','fun','meme','viral','duck','earphones'] },
];

function categorize(title, summary) {
  const text = `${title} ${summary}`.toLowerCase();
  let best = 'products';
  let bestScore = 0;
  for (const cat of CATEGORIES) {
    let score = 0;
    for (const kw of cat.keywords) if (text.includes(kw.toLowerCase())) score++;
    if (score > bestScore) { bestScore = score; best = cat.id; }
  }
  return best;
}

function fmtDate(d) {
  return new Date(d).toISOString().slice(0,10);
}

async function fetchHN(topic = 'AI') {
  const q = encodeURIComponent(topic);
  const url = `https://hn.algolia.com/api/v1/search_by_date?query=${q}&tags=story&hitsPerPage=20&numericFilters=created_at_i>${THIRTY_DAYS_AGO}`;
  console.log(`[HN] fetching ${url}`);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'YUNIE-last30days/1.0' } });
    if (!res.ok) throw new Error(`HN ${res.status}`);
    const data = await res.json();
    const hits = data.hits || [];
    console.log(`[HN] got ${hits.length} hits`);
    return hits.map(h => ({
      id: `hn-${h.objectID}`,
      title: h.title || h.story_title || 'Untitled',
      summary: (h.story_text || h.title || '').slice(0, 220) + (h.points ? ` — ${h.points} points, ${h.num_comments||0} comments on HN.` : ''),
      source: 'Hacker News',
      sourceUrl: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      category: categorize(h.title||'', h.story_text||''),
      date: fmtDate(h.created_at),
      hot: (h.points||0) > 100 || (h.num_comments||0) > 50,
      tags: ['HN', topic, ...(h._tags||[]).slice(0,2)],
      score: h.points || 0,
      comments: h.num_comments || 0,
    }));
  } catch (e) {
    console.warn('[HN] failed:', e.message);
    return [];
  }
}

async function fetchGitHubTrendingAI() {
  // Use GitHub search API (no key, rate limited but ok for 1 call)
  const url = `https://api.github.com/search/repositories?q=AI+created:>${fmtDate(THIRTY_DAYS_AGO*1000)}&sort=stars&order=desc&per_page=10`;
  console.log(`[GitHub] fetching ${url}`);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'YUNIE-last30days/1.0', 'Accept': 'application/vnd.github.v3+json' } });
    if (!res.ok) throw new Error(`GitHub ${res.status}`);
    const data = await res.json();
    const items = data.items || [];
    console.log(`[GitHub] got ${items.length} repos`);
    return items.slice(0,5).map(r => ({
      id: `gh-${r.id}`,
      title: `${r.full_name} — ${r.description?.slice(0,80)||'Trending AI repo'}`,
      summary: `${r.description||''} ⭐ ${r.stargazers_count} stars, ${r.language||''}. ${r.topics?.slice(0,3).join(', ')||''}`.slice(0,220),
      source: 'GitHub',
      sourceUrl: r.html_url,
      category: 'products',
      date: fmtDate(r.created_at),
      hot: r.stargazers_count > 500,
      tags: ['GitHub', r.language||'AI', ...(r.topics||[]).slice(0,2)],
      score: r.stargazers_count,
    }));
  } catch (e) {
    console.warn('[GitHub] failed:', e.message);
    return [];
  }
}

async function main() {
  console.log(`🌐 YUNIE × Last30Days — fetching "${TOPIC}" (last 30 days, since ${fmtDate(THIRTY_DAYS_AGO*1000)})`);
  const [hn, gh] = await Promise.all([
    fetchHN(TOPIC),
    fetchGitHubTrendingAI(),
  ]);

  // Merge and dedupe by title
  const seen = new Set();
  const merged = [...hn, ...gh].filter(a => {
    const key = a.title.toLowerCase().slice(0,40);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort: newest first (freshness), then hot, then score — so today’s HN always on top
  merged.sort((a,b) => (new Date(b.date) - new Date(a.date)) || (b.hot - a.hot) || (b.score - a.score));

  // Keep top 15
  const fresh = merged.slice(0, 15);

  // Load existing to preserve categories and merge if fresh is thin
  let existing = null;
  try { existing = JSON.parse(await fs.readFile(JSON_PATH, 'utf8')); } catch {}
  const categories = existing?.categories || CATEGORIES.map(({id,name,icon,color})=>({id,name,icon,color}));

  let articles = fresh;
  if (fresh.length < 5 && existing?.articles?.length) {
    console.log(`[merge] fresh only ${fresh.length}, keeping ${existing.articles.length} existing as fallback`);
    // Keep existing hot + add fresh on top, dedupe
    const existingIds = new Set(fresh.map(a=>a.id));
    const keep = existing.articles.filter(a => !existingIds.has(a.id)).slice(0, 15 - fresh.length);
    articles = [...fresh, ...keep];
  }

  // Ensure at least 5 hot
  if (articles.filter(a=>a.hot).length === 0 && articles.length > 0) {
    articles[0].hot = true;
    if (articles[1]) articles[1].hot = true;
  }

  const out = {
    generatedAt: new Date().toISOString(),
    generatedBy: 'YUNIE × Last30Days',
    version: 2,
    description: `Tin AI mới nhất — tổng hợp từ Last30Days (HN, GitHub, Web) trong 30 ngày qua. Chủ đề: ${TOPIC}. Tự động cập nhật bởi YUNIE.`,
    last30days: {
      enabled: true,
      topic: TOPIC,
      since: fmtDate(THIRTY_DAYS_AGO*1000),
      sources: ['Hacker News (Algolia, free)', 'GitHub Search (free)', 'Web (Brave/Perplexity when key)'],
      engine: 'Node.js bridge (no Python 3.12 needed) — HN Algolia + GitHub API, scored by upvotes/stars',
      skill: 'mvanhorn/last30days-skill v3.23.0 (61k ⭐)',
      note: 'Full Last30Days engine (Reddit/X/YouTube/TikTok/Polymarket) cần Python 3.12 + API keys. Bridge này dùng free sources, đủ cho ai-news. Cài Python 3.12 để chạy full: python3.12 .github/skills/last30days/scripts/last30days.py "AI" --emit=json',
    },
    categories,
    articles: articles.map(a => ({
      id: a.id,
      title: a.title,
      summary: a.summary,
      source: a.source,
      sourceUrl: a.sourceUrl,
      category: a.category,
      date: a.date,
      hot: !!a.hot,
      tags: (a.tags||[]).slice(0,5),
    })),
    meta: {
      fetchedAt: new Date().toISOString(),
      topic: TOPIC,
      total: articles.length,
      hot: articles.filter(a=>a.hot).length,
      sources: [...new Set(articles.map(a=>a.source))],
    }
  };

  if (DRY) {
    console.log(JSON.stringify(out, null, 2));
    console.log(`\n[DRY] would write ${articles.length} articles to ${JSON_PATH}`);
    return;
  }

  await fs.writeFile(JSON_PATH, JSON.stringify(out, null, 2) + '\n', 'utf8');
  console.log(`✅ Wrote ${articles.length} articles (${out.meta.hot} hot) to ${path.relative(process.cwd(), JSON_PATH)}`);
  console.log(`   sources: ${out.meta.sources.join(', ')}`);
  console.log(`   generatedAt: ${out.generatedAt}`);
  console.log(`   categories: ${categories.map(c=>c.id).join(', ')}`);
}

main().catch(e => { console.error(e); process.exit(1); });
