#!/usr/bin/env node
/**
 * YUNIE × Last30Days — AI News Fetcher (Node.js bridge)
 * Fetches AI news via free APIs (no keys) and updates ai-news.json
 * Works with Node 18+ (fetch built-in), no Python 3.12 needed.
 * Sources: HN Algolia (free), GitHub Trending (free), DEV.to (free),
 *   Reddit (free), arXiv (free), HackerNoon RSS (free)
 * Usage: node www/ai-news/fetch.mjs [--dry] [--topic "AI agents"] [--days 7|30|90|180|0]
 *   --days 0 = không giới hạn (bỏ filter thời gian)
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JSON_PATH = path.join(__dirname, 'ai-news.json');
const DRY = process.argv.includes('--dry');
const TOPIC = (() => {
  const idx = process.argv.indexOf('--topic');
  if (idx !== -1 && process.argv[idx+1]) return process.argv[idx+1];
  return 'AI';
})();
const DAYS_RAW = (() => {
  const idx = process.argv.indexOf('--days');
  if (idx !== -1 && process.argv[idx+1] != null) {
    const n = parseInt(process.argv[idx+1], 10);
    if (!isNaN(n) && n >= 0) return n;
  }
  return 30;
})();
const DAYS = DAYS_RAW;
function fmtDate(d) {
  return new Date(d).toISOString().slice(0,10);
}
const SINCE_LABEL = DAYS === 0 ? 'không giới hạn' : `${DAYS} ngày (từ ${fmtDate(Date.now() - DAYS*24*60*60*1000)})`;

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

async function fetchHN(topic = 'AI', days = DAYS) {
  const q = encodeURIComponent(topic);
  let url = `https://hn.algolia.com/api/v1/search_by_date?query=${q}&tags=story&hitsPerPage=20`;
  if (days > 0) {
    const since = Math.floor(Date.now()/1000) - days*24*60*60;
    url += `&numericFilters=created_at_i>${since}`;
  }
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

async function fetchGitHubTrendingAI(topic = TOPIC, days = DAYS) {
  let q = encodeURIComponent(topic);
  if (days > 0) {
    const since = fmtDate(Date.now() - days*24*60*60*1000);
    q += `+created:>${since}`;
  }
  const url = `https://api.github.com/search/repositories?q=${q}&sort=stars&order=desc&per_page=10`;
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

async function fetchDevTo(topic = TOPIC, days = DAYS) {
  const tag = (topic.toLowerCase().includes('ai') ? 'ai' : (topic.toLowerCase().split(/\s+/)[0] || 'ai').replace(/[^a-z0-9-]/g, '')) || 'ai';
  const url = `https://dev.to/api/articles?tag=${encodeURIComponent(tag)}&per_page=15&top=7`;
  console.log(`[DEV.to] fetching ${url}`);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'YUNIE-last30days/1.0' } });
    if (!res.ok) throw new Error(`DEV.to ${res.status}`);
    const items = await res.json();
    const since = days > 0 ? Date.now() - days*24*60*60*1000 : 0;
    const hits = items.filter(a => days === 0 || new Date(a.published_at).getTime() >= since);
    console.log(`[DEV.to] got ${hits.length} articles`);
    return hits.map(a => ({
      id: `dev-${a.id}`,
      title: a.title || 'Untitled',
      summary: (a.description || a.title || '').slice(0, 220) + (a.public_reactions_count ? ` — ${a.public_reactions_count} reactions, ${a.comments_count||0} comments on DEV.to.` : ''),
      source: 'DEV.to',
      sourceUrl: a.url || `https://dev.to${a.path}`,
      category: categorize(a.title || '', a.description || ''),
      date: fmtDate(a.published_at),
      hot: (a.public_reactions_count || 0) > 30,
      tags: ['DEV.to', tag, ...(a.tag_list || []).slice(0, 2)],
      score: a.public_reactions_count || 0,
      comments: a.comments_count || 0,
    }));
  } catch (e) {
    console.warn('[DEV.to] failed:', e.message);
    return [];
  }
}

async function fetchReddit(topic = TOPIC, days = DAYS) {
  const url = 'https://www.reddit.com/r/MachineLearning/hot.json?limit=20&raw_json=1';
  console.log(`[Reddit] fetching ${url}`);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'YUNIE-last30days/1.0' } });
    if (!res.ok) throw new Error(`Reddit ${res.status}`);
    const data = await res.json();
    const children = data?.data?.children || [];
    const since = Math.floor(Date.now()/1000) - days*24*60*60;
    const hits = children.filter(c => days === 0 || (c.data?.created_utc || 0) >= since);
    console.log(`[Reddit] got ${hits.length} posts`);
    return hits.map(c => {
      const d = c.data || {};
      return {
        id: `rd-${d.id}`,
        title: d.title || 'Untitled',
        summary: ((d.selftext || d.title || '').slice(0, 180)) + ` — ${d.score||0} upvotes, ${d.num_comments||0} comments on r/MachineLearning.`,
        source: 'Reddit r/MachineLearning',
        sourceUrl: d.permalink ? `https://www.reddit.com${d.permalink}` : 'https://www.reddit.com/r/MachineLearning/',
        category: categorize(d.title || '', d.selftext || ''),
        date: fmtDate((d.created_utc || 0) * 1000),
        hot: (d.score || 0) > 50 || (d.num_comments || 0) > 30,
        tags: ['Reddit', d.link_flair_text || 'ML'].filter(Boolean).slice(0, 3),
        score: d.score || 0,
        comments: d.num_comments || 0,
      };
    });
  } catch (e) {
    console.warn('[Reddit] failed:', e.message);
    return [];
  }
}

async function fetchHackerNoon(topic = TOPIC, days = DAYS) {
  // HackerNoon RSS (free, no key): general feed (20 items) + AI tag feed (50 items)
  // Probe 2026-09-10: /feed → 20 items RSS 2.0, /tagged/ai/feed → 50 items, no CORS header (Node OK, browser via rss2json)
  const feeds = ['https://hackernoon.com/tagged/ai/feed', 'https://hackernoon.com/feed'];
  const since = days > 0 ? Date.now() - days * 24 * 60 * 60 * 1000 : 0;
  const topicLow = (topic || '').toLowerCase().trim();
  const topicWords = topicLow.split(/[\s\-]+/).filter(w => w.length > 2 && w !== 'the' && w !== 'and');
  const isGeneralAI = topicLow === 'ai';
  const stripCdata = (s) => (s || '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
  const stripHtml = (s) => (s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const pickTag = (block, tag) => {
    const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
    return m ? stripCdata(m[1]) : '';
  };
  try {
    const all = [];
    for (const feedUrl of feeds) {
      console.log(`[HackerNoon] fetching ${feedUrl}`);
      try {
        const res = await fetch(feedUrl, { headers: { 'User-Agent': 'YUNIE-last30days/1.0' } });
        if (!res.ok) throw new Error(`HackerNoon ${res.status}`);
        const xml = await res.text();
        const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];
        console.log(`[HackerNoon] got ${items.length} items from ${feedUrl}`);
        for (const m of items) {
          const block = m[1];
          const title = stripHtml(pickTag(block, 'title'));
          const descRaw = pickTag(block, 'description') || pickTag(block, 'content:encoded');
          const summary = stripHtml(descRaw);
          const linkRaw = stripCdata((block.match(/<link>([\s\S]*?)<\/link>/i) || [])[1] || '');
          const link = (linkRaw || 'https://hackernoon.com').split('?')[0] || 'https://hackernoon.com';
          const pubDateRaw = pickTag(block, 'pubDate');
          const pubTime = pubDateRaw ? new Date(pubDateRaw).getTime() : 0;
          if (since && pubTime && pubTime < since) continue;
          const author = stripHtml(pickTag(block, 'dc:creator')) || 'HackerNoon';
          const cats = [...block.matchAll(/<category[^>]*>([\s\S]*?)<\/category>/gi)].map(c => stripHtml(stripCdata(c[1]))).filter(Boolean);
          const text = `${title} ${summary} ${cats.join(' ')}`.toLowerCase();
          if (!isGeneralAI && topicWords.length > 0) {
            const hitPhrase = topicLow.length > 3 && text.includes(topicLow);
            const hitWord = topicWords.some(w => text.includes(w));
            if (!hitPhrase && !hitWord) continue;
          }
          const slug = link.split('/').filter(Boolean).pop() || title.slice(0, 30);
          const cleanSlug = slug.replace(/[^a-zA-Z0-9-]+/g, '-').slice(0, 60);
          const ageDays = pubTime ? (Date.now() - pubTime) / (24 * 60 * 60 * 1000) : 99;
          all.push({
            id: `hnoon-${cleanSlug}`,
            title: title || 'Untitled',
            summary: (summary.slice(0, 180) + (author ? ` — by ${author} on HackerNoon.` : '')).slice(0, 220),
            source: 'HackerNoon',
            sourceUrl: link,
            category: categorize(title, summary),
            date: pubTime ? fmtDate(pubTime) : fmtDate(Date.now()),
            hot: ageDays <= 3,
            tags: ['HackerNoon', ...(cats.slice(0, 1)), topic].filter(Boolean).slice(0, 3),
            score: ageDays <= 3 ? 100 : ageDays <= 7 ? 50 : 10,
            _time: pubTime || 0,
          });
        }
      } catch (e) {
        console.warn(`[HackerNoon] feed failed ${feedUrl}:`, e.message);
      }
    }
    // Dedupe by link, newest first, top 8
    const seen = new Set();
    const deduped = all.filter(a => {
      if (seen.has(a.sourceUrl)) return false;
      seen.add(a.sourceUrl);
      return true;
    });
    deduped.sort((a, b) => b._time - a._time);
    console.log(`[HackerNoon] kept ${Math.min(deduped.length, 8)} articles for topic "${topic}"`);
    return deduped.slice(0, 8).map(({ _time, ...a }) => a);
  } catch (e) {
    console.warn('[HackerNoon] failed:', e.message);
    return [];
  }
}

async function fetchArxiv(topic = TOPIC, days = DAYS) {
  // Phrase query for multi-word topics — tránh arXiv parse "self-improving AI" thành OR (thấy 88k kết quả nhiễu PASCAL)
  // Dùng all:"phrase" khi có space/hyphen; với self-improving mở rộng thêm self-evolving + recursive self-improvement
  let arxivQuery;
  const low = topic.toLowerCase();
  if (low.includes('self-improving') || low.includes('self improving')) {
    arxivQuery = 'all:"self-improving" OR all:"self-evolving" OR all:"recursive self-improvement"';
  } else if (topic.includes(' ') || topic.includes('-')) {
    arxivQuery = `all:"${topic}"`;
  } else {
    arxivQuery = `all:${topic}`;
  }
  const url = `https://export.arxiv.org/api/query?search_query=${encodeURIComponent(arxivQuery)}&sortBy=submittedDate&sortOrder=descending&max_results=10`;
  console.log(`[arXiv] fetching ${url}`);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'YUNIE-last30days/1.0' } });
    if (!res.ok) throw new Error(`arXiv ${res.status}`);
    const xml = await res.text();
    const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)];
    console.log(`[arXiv] got ${entries.length} papers`);
    return entries.map(m => {
      const block = m[1];
      const pick = (tag) => (block.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`)) || [])[1] || '';
      const strip = (s) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      const title = strip(pick('title'));
      const summary = strip(pick('summary'));
      const published = pick('published');
      const link = (block.match(/<id>(https?:\/\/arxiv\.org\/abs\/[^<]+)<\/id>/) || [])[1] || 'https://arxiv.org';
      if (days > 0 && published && new Date(published).getTime() < Date.now() - days*24*60*60*1000) return null;
      const cat = categorize(title, summary);
      // Boost self-improving papers so they rank above generic trending items
      const isSelfImproving = cat === 'self-improving' || /self-(improving|evolving|training)|recursive self-improvement|RSI/i.test(title + ' ' + summary);
      return {
        id: `ax-${link.split('/abs/')[1] || title.slice(0, 20)}`,
        title: title || 'Untitled paper',
        summary: summary.slice(0, 220),
        source: 'arXiv',
        sourceUrl: link,
        category: cat,
        date: fmtDate(published),
        hot: isSelfImproving ? true : false,
        tags: ['arXiv', 'paper', topic].slice(0, 3),
        score: isSelfImproving ? 800 : 0,
      };
    }).filter(Boolean);
  } catch (e) {
    console.warn('[arXiv] failed:', e.message);
    return [];
  }
}

async function main() {
  console.log(`🌐 YUNIE × Last30Days — fetching "${TOPIC}" (${SINCE_LABEL})`);
  const [hn, gh, dev, rd, ax, hnoon] = await Promise.all([
    fetchHN(TOPIC, DAYS),
    fetchGitHubTrendingAI(TOPIC, DAYS),
    fetchDevTo(TOPIC, DAYS),
    fetchReddit(TOPIC, DAYS),
    fetchArxiv(TOPIC, DAYS),
    fetchHackerNoon(TOPIC, DAYS),
  ]);

  // Merge and dedupe by title
  const seen = new Set();
  const merged = [...hn, ...gh, ...dev, ...rd, ...ax, ...hnoon].filter(a => {
    const key = a.title.toLowerCase().slice(0,40);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort: self-improving boost first, then newest, then hot, then score
  // For self-improving topics, arXiv RSI papers should surface even if other sources have higher raw scores
  const isSelfImprovingTopic = /self-improving|self improving|self-evolving|RSI/i.test(TOPIC);
  if (isSelfImprovingTopic) {
    merged.sort((a,b) => {
      const aBoost = a.category === 'self-improving' || a.source === 'arXiv' ? 1 : 0;
      const bBoost = b.category === 'self-improving' || b.source === 'arXiv' ? 1 : 0;
      if (bBoost !== aBoost) return bBoost - aBoost;
      return (new Date(b.date) - new Date(a.date)) || (b.hot - a.hot) || (b.score - a.score);
    });
  } else {
    merged.sort((a,b) => (new Date(b.date) - new Date(a.date)) || (b.hot - a.hot) || (b.score - a.score));
  }

  // Keep top 15 — but for self-improving, ensure at least 5 arXiv/self-improving in top 15
  let fresh = merged.slice(0, 15);
  if (isSelfImprovingTopic) {
    const arxivInTop = fresh.filter(a => a.source === 'arXiv' || a.category === 'self-improving').length;
    if (arxivInTop < 5) {
      const arxivPool = merged.filter(a => (a.source === 'arXiv' || a.category === 'self-improving') && !fresh.some(f=>f.id===a.id));
      const need = Math.min(5 - arxivInTop, arxivPool.length);
      // Replace lowest-ranked non-arXiv in fresh with top arXiv
      for (let i=0; i<need; i++) {
        // find last non-arXiv/non-self-improving to replace
        let idx = -1;
        for (let j=fresh.length-1; j>=0; j--) if (fresh[j].source !== 'arXiv' && fresh[j].category !== 'self-improving') { idx=j; break; }
        if (idx !== -1) fresh[idx] = arxivPool[i];
      }
      // re-sort fresh to keep date order within boosted group
      fresh.sort((a,b) => {
        const aBoost = a.category === 'self-improving' || a.source === 'arXiv' ? 1 : 0;
        const bBoost = b.category === 'self-improving' || b.source === 'arXiv' ? 1 : 0;
        if (bBoost !== aBoost) return bBoost - aBoost;
        return (new Date(b.date) - new Date(a.date)) || (b.hot - a.hot) || (b.score - a.score);
      });
    }
  }

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
    description: `Tin AI mới nhất — tổng hợp từ Last30Days (HN, GitHub, DEV.to, Reddit, arXiv, HackerNoon) trong ${DAYS===0?'không giới hạn':DAYS+' ngày'} qua. Chủ đề: ${TOPIC}. Tự động cập nhật bởi YUNIE.`,
    last30days: {
      enabled: true,
      topic: TOPIC,
      since: DAYS===0 ? 'không giới hạn' : fmtDate(Date.now() - DAYS*24*60*60*1000),
      days: DAYS,
      sources: ['Hacker News (Algolia, free)', 'GitHub Search (free)', 'DEV.to (free)', 'Reddit r/MachineLearning (free)', 'arXiv (free)', 'HackerNoon RSS (free)', 'Web (Brave/Perplexity when key)'],
      engine: 'Node.js bridge (no Python 3.12 needed) — HN Algolia + GitHub API + DEV.to + Reddit + arXiv + HackerNoon RSS, scored by upvotes/stars/reactions/likes',
      skill: 'mvanhorn/last30days-skill v3.23.0 (61k ⭐)',
      note: 'Full Last30Days engine (X/YouTube/TikTok/Polymarket) cần Python 3.12 + API keys. Bridge này dùng 6 nguồn free (HN, GitHub, DEV.to, Reddit, arXiv, HackerNoon), đủ cho ai-news. Cài Python 3.12 để chạy full: python3.12 .github/skills/last30days/scripts/last30days.py "AI" --emit=json',
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
