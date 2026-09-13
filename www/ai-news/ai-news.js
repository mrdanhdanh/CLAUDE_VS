/* YUNIE AI News — app.js for ai-news.html */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const toastEl = $('#toast');

function toast(msg, ms = 2600) {
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastEl._t);
  toastEl._t = setTimeout(() => toastEl.classList.remove('show'), ms);
}

function fmtDate(iso) {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso || '—';
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return iso || '—'; }
}

function freshnessInfo(dateStr) {
  try {
    const d = new Date(dateStr + 'T12:00:00');
    if (isNaN(d.getTime())) return { label: dateStr || '—', cls: 'fresh-old' };
    const now = new Date();
    const diffMs = now - d;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return { label: 'Hôm nay', cls: 'fresh-today' };
    if (diffDays === 1) return { label: 'Hôm qua', cls: 'fresh-yesterday' };
    if (diffDays <= 3) return { label: `${diffDays} ngày trước`, cls: 'fresh-week' };
    if (diffDays <= 7) return { label: `${diffDays} ngày trước`, cls: 'fresh-week' };
    if (diffDays <= 30) return { label: `${diffDays} ngày trước`, cls: 'fresh-month' };
    return { label: fmtDate(dateStr), cls: 'fresh-old' };
  } catch { return { label: dateStr || '—', cls: 'fresh-old' }; }
}

async function loadNews() {
  const res = await fetch('./ai-news.json', { cache: 'no-store' });
  if (!res.ok) throw new Error(`ai-news.json ${res.status} ${res.statusText}`);
  return mergeCurated(await res.json());
}

// ── Curated mirror (KN-051/KN-052) ──
// curated.json là file người quản (fetch.mjs không ghi đè, không phải deny-test-mutate path).
// Pinned top + dedupe theo id; fail-open — curated lỗi thì news vẫn render.
async function mergeCurated(data) {
  try {
    const res = await fetch('./curated.json', { cache: 'no-store' });
    if (!res.ok) return data;
    const c = await res.json();
    const entries = Array.isArray(c && c.articles) ? c.articles : [];
    const seen = new Set((data.articles || []).map(a => a.id));
    const fresh = entries.filter(a => a && a.id && !seen.has(a.id));
    if (!fresh.length) return data;
    const articles = [...fresh, ...(data.articles || [])];
    return { ...data, articles, meta: curatedMeta(data.meta, articles) };
  } catch { return data; }
}

function curatedMeta(meta, articles) {
  return { ...(meta || {}), total: articles.length, hot: articles.filter(a => a.hot).length, sources: [...new Set(articles.map(a => a.source))] };
}

function categoryColor(catId) {
  const map = {
    'self-improving': '#6366f1',
    'big-tech': '#ec4899',
    'safety': '#10b981',
    'products': '#f59e0b',
    'fun': '#8b5cf6'
  };
  return map[catId] || '#6b7280';
}

// ── Live fetch (chạy trực tiếp trên GitHub Pages, không cần VS Code) ──
const LIVE_CATEGORIES = [
  { id: 'self-improving', keywords: ['self-improving','AAR','alignment','self-training','auto-researcher','self-evolving'] },
  { id: 'big-tech', keywords: ['acquisition','funding','valuation','merger','hiring','layoff','earnings','Nvidia','OpenAI','Google','Anthropic','Meta'] },
  { id: 'safety', keywords: ['safety','policy','regulation','lawsuit','IP','copyright','rogue','alignment','risk','governance'] },
  { id: 'products', keywords: ['launch','release','model','API','product','feature','update','Gemma','Claude','GPT','Gemini'] },
  { id: 'fun', keywords: ['robot','cute','weird','fun','meme','viral','duck','earphones'] },
];
function liveCategorize(title, summary) {
  const text = `${title} ${summary}`.toLowerCase();
  let best = 'products', bestScore = 0;
  for (const cat of LIVE_CATEGORIES) {
    let score = 0;
    for (const kw of cat.keywords) if (text.includes(kw.toLowerCase())) score++;
    if (score > bestScore) { bestScore = score; best = cat.id; }
  }
  return best;
}
function fmtDateShort(d) { return new Date(d).toISOString().slice(0,10); }

async function getJson(url, label, headers) {
  const res = await fetch(url, { headers: headers || { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error(`${label} ${res.status}`);
  return res.json();
}

function hnSummary(h, title, points, comments) {
  const base = (h.story_text || title || '').slice(0, 220);
  return points ? `${base} — ${points} points, ${comments} comments on HN.` : base;
}

function mapHNItem(h, topic) {
  const points = h.points || 0;
  const comments = h.num_comments || 0;
  const title = h.title || h.story_title || 'Untitled';
  return {
    id: `hn-${h.objectID}`,
    title,
    summary: hnSummary(h, title, points, comments),
    source: 'Hacker News',
    sourceUrl: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
    category: liveCategorize(title, h.story_text || ''),
    date: fmtDateShort(h.created_at),
    hot: points > 100 || comments > 50,
    tags: ['HN', topic, ...((h._tags || []).slice(0, 2))],
    score: points,
  };
}

async function fetchLiveHN(topic = 'AI', days = 30) {
  let url = `https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent(topic)}&tags=story&hitsPerPage=20`;
  if (days > 0) {
    const since = Math.floor(Date.now()/1000) - days*24*60*60;
    url += `&numericFilters=created_at_i>${since}`;
  }
  const data = await getJson(url, 'HN');
  return (data.hits || []).map(h => mapHNItem(h, topic));
}
function mapGhRepoItem(r) {
  const desc = r.description || '';
  const stars = r.stargazers_count || 0;
  const topics = (r.topics || []).slice(0, 2);
  return {
    id: `gh-${r.id}`,
    title: `${r.full_name} — ${(desc || 'Trending AI repo').slice(0, 80)}`,
    summary: `${desc} ⭐ ${stars} stars, ${r.language || ''}. ${(r.topics || []).slice(0, 3).join(', ')}`.slice(0, 220),
    source: 'GitHub',
    sourceUrl: r.html_url,
    category: 'products',
    date: fmtDateShort(r.created_at),
    hot: stars > 500,
    tags: ['GitHub', r.language || 'AI', ...topics],
    score: stars,
  };
}

async function fetchLiveGitHub(topic = 'AI', days = 30) {
  let q = encodeURIComponent(topic);
  if (days > 0) {
    const since = fmtDateShort(Date.now() - days*24*60*60*1000);
    q += `+created:>${since}`;
  }
  const url = `https://api.github.com/search/repositories?q=${q}&sort=stars&order=desc&per_page=10`;
  const data = await getJson(url, 'GitHub', { 'Accept': 'application/vnd.github.v3+json' });
  return (data.items || []).slice(0, 5).map(mapGhRepoItem);
}
function devToTag(topic) {
  if (topic.toLowerCase().includes('ai')) return 'ai';
  return (topic.toLowerCase().split(/\s+/)[0] || 'ai').replace(/[^a-z0-9-]/g, '') || 'ai';
}

function devSummary(desc, reactions, comments) {
  const base = desc.slice(0, 220);
  return reactions ? `${base} — ${reactions} reactions, ${comments} comments on DEV.to.` : base;
}

function mapDevItem(a, tag) {
  const desc = a.description || a.title || '';
  const reactions = a.public_reactions_count || 0;
  return {
    id: `dev-${a.id}`,
    title: a.title || 'Untitled',
    summary: devSummary(desc, reactions, a.comments_count || 0),
    source: 'DEV.to',
    sourceUrl: a.url || `https://dev.to${a.path}`,
    category: liveCategorize(a.title || '', a.description || ''),
    date: fmtDateShort(a.published_at),
    hot: reactions > 30,
    tags: ['DEV.to', tag, ...((a.tag_list || []).slice(0, 2))],
    score: reactions,
  };
}

async function fetchLiveDevTo(topic = 'AI', days = 30) {
  const tag = devToTag(topic);
  const url = `https://dev.to/api/articles?tag=${encodeURIComponent(tag)}&per_page=15&top=7`;
  const items = await getJson(url, 'DEV.to');
  const since = days > 0 ? Date.now() - days*24*60*60*1000 : 0;
  return items.filter(a => days === 0 || new Date(a.published_at).getTime() >= since).map(a => mapDevItem(a, tag));
}
function rdSummary(d, score, comments) {
  return `${(d.selftext || d.title || '').slice(0, 180)} — ${score} upvotes, ${comments} comments on r/MachineLearning.`;
}

function rdHot(score, comments) {
  return score > 50 || comments > 30;
}

function mapRdItem(c) {
  const d = c.data || {};
  const score = d.score || 0;
  const comments = d.num_comments || 0;
  return {
    id: `rd-${d.id}`,
    title: d.title || 'Untitled',
    summary: rdSummary(d, score, comments),
    source: 'Reddit r/MachineLearning',
    sourceUrl: d.permalink ? `https://www.reddit.com${d.permalink}` : 'https://www.reddit.com/r/MachineLearning/',
    category: liveCategorize(d.title || '', d.selftext || ''),
    date: fmtDateShort((d.created_utc || 0) * 1000),
    hot: rdHot(score, comments),
    tags: ['Reddit', d.link_flair_text || 'ML'].filter(Boolean).slice(0, 3),
    score,
  };
}

async function fetchLiveReddit(topic = 'AI', days = 30) {
  const data = await getJson('https://www.reddit.com/r/MachineLearning/hot.json?limit=20&raw_json=1', 'Reddit');
  const children = (data && data.data && data.data.children) || [];
  const since = Math.floor(Date.now()/1000) - days*24*60*60;
  return children.filter(c => days === 0 || ((c.data || {}).created_utc || 0) >= since).map(mapRdItem);
}
// HackerNoon RSS free, no key — nhưng không có CORS header nên browser phải qua rss2json (CORS *, free, no key)
// Probe 2026-09-10: /tagged/ai/feed → 50 items, /feed → 20 items RSS 2.0
const HNOON_FEEDS = ['https://hackernoon.com/tagged/ai/feed', 'https://hackernoon.com/feed'];

function stripHtml(s) {
  const d = document.createElement('div');
  d.innerHTML = s || '';
  return (d.textContent || '').replace(/\s+/g, ' ').trim();
}

function hnoonContext(topic, days) {
  const topicLow = (topic || '').toLowerCase().trim();
  return {
    since: days > 0 ? Date.now() - days * 24 * 60 * 60 * 1000 : 0,
    topic: topic || 'AI',
    topicLow,
    topicWords: topicLow.split(/[\s\-]+/).filter(w => w.length > 2 && w !== 'the' && w !== 'and'),
    isGeneralAI: topicLow === 'ai',
  };
}

function hnoonTopicMatch(text, ctx) {
  if (ctx.isGeneralAI || !ctx.topicWords.length) return true;
  if (ctx.topicLow.length > 3 && text.includes(ctx.topicLow)) return true;
  return ctx.topicWords.some(w => text.includes(w));
}

function hnoonSlug(link, title) {
  const last = link.split('/').filter(Boolean).pop() || title.slice(0, 30);
  return last.replace(/[^a-zA-Z0-9-]+/g, '-').slice(0, 60);
}

function hnoonScore(ageDays) {
  if (ageDays <= 3) return 100;
  if (ageDays <= 7) return 50;
  return 10;
}

function hnoonTooOld(pubTime, ctx) {
  return ctx.since && pubTime && pubTime < ctx.since;
}

function hnoonLink(it) {
  return (it.link || 'https://hackernoon.com').split('?')[0] || 'https://hackernoon.com';
}

function hnoonSummary(summaryRaw, author) {
  return (summaryRaw.slice(0, 180) + (author ? ` — by ${author} on HackerNoon.` : '')).slice(0, 220);
}

function mapHnoonItem(it, ctx) {
  const title = it.title || 'Untitled';
  const summaryRaw = stripHtml(it.description || it.content || title);
  const link = hnoonLink(it);
  const pubTime = it.pubDate ? new Date(it.pubDate).getTime() : 0;
  if (hnoonTooOld(pubTime, ctx)) return null;
  const cats = it.categories || [];
  if (!hnoonTopicMatch(`${title} ${summaryRaw} ${cats.join(' ')}`.toLowerCase(), ctx)) return null;
  const ageDays = pubTime ? (Date.now() - pubTime) / (24 * 60 * 60 * 1000) : 99;
  return {
    id: `hnoon-${hnoonSlug(link, title)}`,
    title,
    summary: hnoonSummary(summaryRaw, it.author),
    source: 'HackerNoon',
    sourceUrl: link,
    category: liveCategorize(title, summaryRaw),
    date: fmtDateShort(pubTime || Date.now()),
    hot: ageDays <= 3,
    tags: ['HackerNoon', ...(cats.slice(0, 1)), ctx.topic].filter(Boolean).slice(0, 3),
    score: hnoonScore(ageDays),
  };
}

async function fetchHnoonFeed(feedUrl) {
  const api = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`;
  const j = await getJson(api, 'HackerNoon');
  return j.items || [];
}

function dedupeByUrl(list) {
  const seen = new Set();
  return list.filter(a => {
    if (seen.has(a.sourceUrl)) return false;
    seen.add(a.sourceUrl);
    return true;
  });
}

async function fetchLiveHackerNoon(topic = 'AI', days = 30) {
  const ctx = hnoonContext(topic, days);
  const all = [];
  for (const feedUrl of HNOON_FEEDS) {
    try {
      const items = await fetchHnoonFeed(feedUrl);
      for (const it of items) {
        const a = mapHnoonItem(it, ctx);
        if (a) all.push(a);
        if (all.length >= 8) break;
      }
    } catch { /* bỏ qua feed lỗi — các nguồn khác vẫn render */ }
    if (all.length >= 8) break;
  }
  return dedupeByUrl(all)
    .sort((a, b) => (new Date(b.date) - new Date(a.date)) || ((b.hot ? 1 : 0) - (a.hot ? 1 : 0)))
    .slice(0, 8);
}
let isLiveFetching = false;
let isSearching = false;
let searchKeyword = '';
let searchDays = 30;
let originalData = null;
const SEARCH_COOLDOWN_MS = 30 * 1000;
const LS_SEARCH_LAST = 'ai-news-search-last';

// ── Cooldown 1 giờ ──
const COOLDOWN_MS = 60 * 60 * 1000; // 1 giờ
const LS_LAST_UPDATE = 'ai-news-last-update';
function getLastUpdateTime() {
  try {
    const v = localStorage.getItem(LS_LAST_UPDATE);
    if (v) { const n = parseInt(v, 10); if (!isNaN(n) && n > 0) return n; }
    const live = JSON.parse(localStorage.getItem('ai-news-live') || 'null');
    if (live?.at && !isNaN(live.at)) return live.at;
  } catch {}
  return 0;
}
function setLastUpdateTime(ts) {
  try { localStorage.setItem(LS_LAST_UPDATE, String(ts)); } catch {}
}
function getRemainingMs() {
  const last = getLastUpdateTime();
  if (!last) return 0;
  return Math.max(0, COOLDOWN_MS - (Date.now() - last));
}
function formatRemaining(ms) {
  const sec = Math.ceil(ms / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m > 0) return `${m} phút ${s.toString().padStart(2,'0')} giây`;
  return `${s} giây`;
}
let cooldownTimer = null;
function updateRefreshButtonState() {
  const btn = $('#btnRefresh');
  if (!btn) return false;
  if (isLiveFetching) return false;
  const remain = getRemainingMs();
  const textEl = btn.querySelector('.btn-text-full');
  if (remain > 0) {
    btn.disabled = true;
    btn.style.opacity = '0.6';
    btn.style.pointerEvents = 'none';
    btn.title = `Đã cập nhật lúc ${new Date(getLastUpdateTime()).toLocaleString('vi-VN')} — vui lòng đợi ${formatRemaining(remain)} nữa`;
    if (textEl) {
      if (!textEl.dataset.originalText) textEl.dataset.originalText = textEl.textContent;
      const mins = Math.ceil(remain / 60000);
      textEl.textContent = mins > 1 ? `Đợi ${mins}p` : `Đợi ${Math.ceil(remain/1000)}s`;
    }
    return true;
  } else {
    btn.disabled = false;
    btn.style.opacity = '';
    btn.style.pointerEvents = '';
    btn.title = 'Lấy tin mới trực tiếp từ HN + GitHub + HackerNoon (không cần VS Code) — mỗi giờ 1 lần';
    if (textEl && textEl.dataset.originalText) textEl.textContent = textEl.dataset.originalText;
    if (cooldownTimer) { clearInterval(cooldownTimer); cooldownTimer = null; }
    return false;
  }
}
function startCooldownTicker() {
  if (cooldownTimer) clearInterval(cooldownTimer);
  if (getRemainingMs() <= 0) return;
  updateRefreshButtonState();
  cooldownTimer = setInterval(() => {
    if (getRemainingMs() <= 0) {
      updateRefreshButtonState();
      clearInterval(cooldownTimer); cooldownTimer = null;
      toast('Đã có thể cập nhật lại rồi sếp ơi ✅', 2500);
    } else {
      updateRefreshButtonState();
    }
  }, 1000);
}

// ── Shared helpers (live refresh + search + reset) ──
const LIVE_SOURCES = ['Hacker News (live)', 'GitHub (live)', 'DEV.to (live)', 'Reddit (live)', 'HackerNoon (live)'];

function dedupeByTitle(list) {
  const seen = new Set();
  return list.filter(a => {
    const k = (a.title || '').toLowerCase().slice(0, 40);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function mergeLiveArticles(groups) {
  const merged = dedupeByTitle(groups.flat());
  return merged.sort((a,b) => (new Date(b.date) - new Date(a.date)) || (b.hot - a.hot) || (b.score - a.score));
}

function normalizeArticles(articles) {
  return articles.map(a => ({ id:a.id, title:a.title, summary:a.summary, source:a.source, sourceUrl:a.sourceUrl, category:a.category, date:a.date, hot:!!a.hot, tags:(a.tags||[]).slice(0,5) }));
}

function buildLiveData(articles, opts) {
  return {
    ...data,
    generatedAt: new Date().toISOString(),
    generatedBy: opts.by,
    articles: normalizeArticles(articles),
    meta: { fetchedAt: new Date().toISOString(), topic: opts.topic, total: articles.length, hot: articles.filter(a => a.hot).length, sources: [...new Set(articles.map(a => a.source))] },
    last30days: { ...(data.last30days || {}), topic: opts.topic, since: opts.since, sources: LIVE_SOURCES, engine: opts.engine },
  };
}

async function fetchLiveMerged(keyword, days, fallbackTo) {
  const [hn, gh, dev, rd, hnoon] = await Promise.all([
    fetchLiveHN(keyword, days),
    fetchLiveGitHub(keyword, days).catch(() => []),
    fetchLiveDevTo(keyword, days).catch(() => []),
    fetchLiveReddit(keyword, days).catch(() => []),
    fetchLiveHackerNoon(keyword, days).catch(() => []),
  ]);
  let articles = mergeLiveArticles([hn, gh, dev, rd, hnoon]).slice(0, 15);
  if (articles.length < 5 && fallbackTo && fallbackTo.length) {
    const ids = new Set(articles.map(a => a.id));
    const keep = fallbackTo.filter(a => !ids.has(a.id)).slice(0, 15 - articles.length);
    articles = [...articles, ...keep];
  }
  if (articles.filter(a => a.hot).length === 0 && articles.length > 0) {
    articles[0].hot = true;
    if (articles[1]) articles[1].hot = true;
  }
  return articles;
}

function syncHeroMeta() {
  const genEl = $('#metaGenerated');
  if (genEl) genEl.textContent = fmtDate(data.generatedAt);
  const byEl = $('#metaBy');
  if (byEl) byEl.textContent = data.generatedBy || 'YUNIE';
}

function syncFilterCounts() {
  const bar = $('#filterBar');
  if (!bar) return;
  $$('.filter-chip', bar).forEach(btn => {
    const fid = btn.dataset.filter;
    if (fid === 'all') return;
    const cnt = (data.articles || []).filter(a => a.category === fid).length;
    const countEl = btn.querySelector('.count');
    if (countEl) countEl.textContent = cnt;
    else if (cnt > 0) {
      const s = document.createElement('span');
      s.className = 'count';
      s.textContent = cnt;
      btn.appendChild(s);
    }
  });
}

function resetFilterToAll() {
  activeFilter = 'all';
  $$('.filter-chip').forEach(btn => {
    const isActive = btn.dataset.filter === 'all';
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
}

function refreshBadge() {
  const oldBadge = document.getElementById('last30daysBadge');
  if (oldBadge) oldBadge.remove();
  renderLast30DaysBadge(data);
}

function persistLive(now) {
  try { localStorage.setItem('ai-news-live', JSON.stringify({ at: now, data })); } catch {}
}

function persistSearchTime() {
  try { localStorage.setItem(LS_SEARCH_LAST, String(Date.now())); } catch {}
}

function applyDataToUI(opts = {}) {
  syncHeroMeta();
  syncFilterCounts();
  if (opts.resetFilter) resetFilterToAll();
  renderNews();
  if (opts.status) updateSearchStatusUI();
  refreshBadge();
}

function showLiveLoading() {
  const hotGrid = $('#hotGrid'), allGrid = $('#allGrid');
  if (hotGrid) hotGrid.innerHTML = '<div class="empty-state"><div class="empty-icon">⏳</div><p>Đang fetch trực tiếp từ Hacker News + GitHub + DEV.to + Reddit + HackerNoon…</p><p class="small muted" style="font-size:12px;margin-top:6px">Chạy ngay trên trình duyệt, không cần VS Code</p></div>';
  if (allGrid) allGrid.innerHTML = '';
}

function restoreAfterLiveError(e) {
  console.error('Live fetch failed', e);
  toast(`Lỗi live fetch: ${e.message} — đang hiện cache`, 4000);
  try {
    const cached = JSON.parse(localStorage.getItem('ai-news-live')||'null');
    if (cached?.data?.articles?.length) { data = cached.data; renderNews(); toast('Đã khôi phục từ cache trình duyệt', 2500); }
    else { renderNews(); }
  } catch { renderNews(); }
}

async function handleLiveRefresh() {
  if (isLiveFetching) return;
  const remain = getRemainingMs();
  if (remain > 0) {
    toast(`⏳ Vừa cập nhật rồi — đợi ${formatRemaining(remain)} nữa nhé sếp`, 3500);
    startCooldownTicker();
    return;
  }
  const btn = $('#btnRefresh');
  isLiveFetching = true;
  if (btn) { btn.disabled = true; btn.style.opacity = '0.6'; btn.style.pointerEvents = 'none'; }
  toast('Đang lấy tin mới từ HN + GitHub + HackerNoon… ⏳', 4000);
  showLiveLoading();
  try {
    const articles = await fetchLiveMerged('AI', 30, data.articles);
    if (articles.length === 0) throw new Error('Không lấy được tin nào — thử lại sau');
    data = buildLiveData(articles, {
      by: 'YUNIE × Live (trình duyệt)',
      topic: 'AI',
      since: fmtDateShort(Date.now()-30*24*60*60*1000),
      engine: 'Live fetch trực tiếp trên trình duyệt (không cần VS Code)',
    });
    applyDataToUI();
    toast(`Đã cập nhật ${articles.length} tin trực tiếp ✅`, 3000);
    const now = Date.now();
    persistLive(now);
    setLastUpdateTime(now);
    startCooldownTicker();
  } catch (e) {
    restoreAfterLiveError(e);
  } finally {
    isLiveFetching = false;
    // nếu vừa update thành công thì đã set cooldown, else khôi phục theo cooldown hiện tại
    if (getRemainingMs() > 0) startCooldownTicker();
    else if (btn) { btn.disabled = false; btn.style.opacity=''; btn.style.pointerEvents=''; }
  }
}

function escapeRegExp(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function highlightKeyword(text, keyword) {
  if (!keyword || !text) return escapeHtml(text);
  const esc = escapeHtml(text);
  const kw = escapeRegExp(keyword.trim());
  if (!kw) return esc;
  try {
    const re = new RegExp(`(${kw})`, 'gi');
    return esc.replace(re, '<mark class="hl">$1</mark>');
  } catch { return esc; }
}
function getSearchDays() {
  const active = document.querySelector('.time-chip.active');
  if (active) { const d = parseInt(active.dataset.days, 10); if (!isNaN(d)) return d; }
  return 30;
}
function setSearchDays(days) {
  $$('.time-chip').forEach(btn => {
    const isActive = parseInt(btn.dataset.days, 10) === days;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
  searchDays = days;
}
function getSearchRemainingMs() {
  try {
    const v = localStorage.getItem(LS_SEARCH_LAST);
    if (!v) return 0;
    const n = parseInt(v, 10);
    if (isNaN(n) || n <= 0) return 0;
    return Math.max(0, SEARCH_COOLDOWN_MS - (Date.now() - n));
  } catch { return 0; }
}
function updateSearchStatusUI() {
  const el = $('#searchStatus');
  if (!el) return;
  if (!searchKeyword) { el.hidden = true; el.textContent = ''; return; }
  const daysLabel = searchDays === 0 ? 'không giới hạn' : `${searchDays} ngày`;
  const total = (data.articles||[]).length;
  const hotCount = (data.articles||[]).filter(a=>a.hot).length;
  el.hidden = false;
  el.textContent = `Kết quả: ${total} bài cho "${searchKeyword}" trong ${daysLabel} · ${hotCount} hot`;
}
function showSearchLoading(kw) {
  const hotGrid = $('#hotGrid'), allGrid = $('#allGrid');
  if (hotGrid) hotGrid.innerHTML = '<div class="empty-state"><div class="empty-icon">🔍</div><p>Đang tìm tin hot cho "' + escapeHtml(kw) + '"…</p><p class="small muted" style="font-size:12px;margin-top:6px">HN + GitHub + DEV.to + Reddit + HackerNoon · giữ chuẩn hot như Cập nhật</p></div>';
  if (allGrid) allGrid.innerHTML = '';
  const statusEl = $('#searchStatus');
  if (statusEl) { statusEl.hidden = false; statusEl.textContent = `Đang tìm "${kw}"…`; }
}

function showSearchEmpty(kw, days) {
  const hotGrid = $('#hotGrid'), allGrid = $('#allGrid');
  const daysLabel = days===0?'không giới hạn':`${days} ngày`;
  if (hotGrid) hotGrid.innerHTML = '';
  if (allGrid) allGrid.innerHTML = `<div class="empty-state"><div class="empty-icon">🔍</div><p>Không tìm thấy tin nào cho "${escapeHtml(kw)}" trong ${escapeHtml(daysLabel)}.</p><p class="small muted" style="font-size:12px;margin-top:6px">Thử từ khoá khác hoặc chọn "Không giới hạn"</p></div>`;
  data = { ...data, articles: [], meta: { ...(data.meta||{}), topic: kw, total: 0, hot: 0 } };
  updateSearchStatusUI();
  $$('.filter-chip', $('#filterBar')).forEach(btn => {
    if (btn.dataset.filter === 'all') return;
    const c = btn.querySelector('.count'); if (c) c.textContent = '0';
  });
  const countEl = $('#metaCount'); if (countEl) countEl.textContent = '0 bài';
  toast(`Không có kết quả cho "${kw}"`, 3000);
  persistSearchTime();
}

function saveOriginalData() {
  if (originalData) return;
  try { originalData = JSON.parse(JSON.stringify(data)); } catch { originalData = { ...data, articles: [...(data.articles||[])] }; }
  // also try to keep a copy from initial load if available
  if (!originalData.articles?.length) {
    try { const cached = JSON.parse(localStorage.getItem('ai-news-live')||'null'); if (cached?.data) originalData = cached.data; } catch {}
  }
}

function applySearchData(articles, kw, days) {
  data = buildLiveData(articles, {
    by: `YUNIE × Tìm kiếm "${kw}"`,
    topic: kw,
    since: days===0 ? 'không giới hạn' : fmtDateShort(Date.now()-days*24*60*60*1000),
    engine: 'Tìm kiếm live — HN + GitHub + DEV.to + Reddit + HackerNoon, giữ chuẩn hot',
  });
  applyDataToUI({ resetFilter: true, status: true });
  toast(`Tìm thấy ${articles.length} tin cho "${kw}" ✅`, 3000);
  persistSearchTime();
  try { localStorage.setItem('ai-news-last-search', JSON.stringify({ kw, days, at: Date.now() })); } catch {}
}

function searchCoolingDown() {
  const remain = getSearchRemainingMs();
  if (remain <= 0) return false;
  toast(`⏳ Đợi ${Math.ceil(remain/1000)}s nữa rồi tìm tiếp nhé sếp`, 2500);
  return true;
}

function showSearchError(e) {
  console.error('Search failed', e);
  toast(`Lỗi tìm kiếm: ${e.message}`, 4000);
  const statusEl = $('#searchStatus');
  if (statusEl) statusEl.textContent = `Lỗi: ${e.message}`;
}

function searchStart(kw, days) {
  searchKeyword = kw;
  searchDays = days;
  isSearching = true;
  const btn = $('#btnSearch');
  if (btn) { btn.disabled = true; btn.style.opacity = '0.6'; }
  toast(`Đang tìm "${kw}" trong ${days===0?'không giới hạn':days+' ngày'}… ⏳`, 3000);
  showSearchLoading(kw);
  return btn;
}

function searchFinish(btn) {
  isSearching = false;
  if (btn) { btn.disabled = false; btn.style.opacity = ''; }
}

async function handleSearch() {
  const input = $('#searchInput');
  const kw = (input?.value || '').trim();
  if (!kw) { toast('Nhập từ khoá đã sếp ơi ✍️', 2500); input?.focus(); return; }
  if (isSearching || isLiveFetching) return;
  if (searchCoolingDown()) return;
  const days = getSearchDays();
  const btn = searchStart(kw, days);
  try {
    const articles = await fetchLiveMerged(kw, days);
    if (articles.length === 0) {
      showSearchEmpty(kw, days);
      return;
    }
    saveOriginalData();
    applySearchData(articles, kw, days);
  } catch (e) {
    showSearchError(e);
  } finally {
    searchFinish(btn);
  }
}
async function handleResetSearch() {
  const input = $('#searchInput');
  if (input) input.value = '';
  searchKeyword = '';
  searchDays = 30;
  setSearchDays(30);
  const statusEl = $('#searchStatus');
  if (statusEl) { statusEl.hidden = true; statusEl.textContent = ''; }
  // restore original data if we have it, else reload json
  if (originalData && originalData.articles?.length) {
    data = JSON.parse(JSON.stringify(originalData));
    originalData = null;
    applyDataToUI({ resetFilter: true });
    toast('Đã xoá tìm kiếm — về danh sách gốc ✅', 2500);
    try { localStorage.removeItem('ai-news-last-search'); } catch {}
    return;
  }
  try {
    data = await loadNews();
    applyDataToUI({ resetFilter: true });
    toast('Đã xoá tìm kiếm ✅', 2500);
  } catch (e) {
    toast('Lỗi khôi phục: ' + e.message, 3000);
  }
}

function renderCategoryFilters(data) {
  const bar = $('#filterBar');
  if (!bar) return;
  // Keep "all" button, add categories
  data.categories.forEach(cat => {
    const count = data.articles.filter(a => a.category === cat.id).length;
    const btn = document.createElement('button');
    btn.className = 'filter-chip';
    btn.dataset.filter = cat.id;
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', 'false');
    btn.innerHTML = `<span>${cat.icon} ${cat.name}</span><span class="count">${count}</span>`;
    btn.addEventListener('click', () => setFilter(cat.id));
    bar.appendChild(btn);
  });
}

function setFilter(filterId) {
  activeFilter = filterId;
  $$('.filter-chip').forEach(btn => {
    const isActive = btn.dataset.filter === filterId;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
  renderNews();
}

function createCard(article, isHot = false) {
  const card = document.createElement('article');
  card.className = `news-card${isHot ? ' hot-card' : ''}`;
  card.dataset.category = article.category;

  const cat = (data.categories || []).find(c => c.id === article.category);
  const catName = cat ? `${cat.icon} ${cat.name}` : article.category;
  const catColor = cat ? cat.color : categoryColor(article.category);

  const tagsHtml = (article.tags || []).slice(0, 3).map(t =>
    `<span class="news-tag">#${escapeHtml(t)}</span>`
  ).join('');
  const moreCount = (article.tags || []).length - 3;
  const moreHtml = moreCount > 0 ? `<span class="news-tag more">+${moreCount}</span>` : '';
  const fresh = freshnessInfo(article.date);
  const titleHtml = searchKeyword ? highlightKeyword(article.title, searchKeyword) : escapeHtml(article.title);
  const summaryHtml = searchKeyword ? highlightKeyword(article.summary, searchKeyword) : escapeHtml(article.summary);

  card.innerHTML = `
    <div class="news-card-header">
      <span class="news-category" style="background:${catColor}">${escapeHtml(catName)}</span>
      <span class="fresh-badge ${fresh.cls}">${escapeHtml(fresh.label)}</span>
      <span class="news-date">${fmtDate(article.date)}</span>
    </div>
    <h3 class="news-title"><a href="${escapeHtml(article.sourceUrl)}" target="_blank" rel="noopener" aria-label="${escapeHtml(article.title)} — mở nguồn">${titleHtml}</a></h3>
    <p class="news-summary">${summaryHtml}</p>
    <div class="news-footer">
      <span class="news-source">${escapeHtml(article.source)}</span>
      <div class="news-tags">${tagsHtml}${moreHtml}</div>
    </div>
  `;
  return card;
}

function renderNews() {
  const hotGrid = $('#hotGrid');
  const allGrid = $('#allGrid');
  const hotSection = $('#hotSection');
  const allSection = $('#allSection');
  if (!hotGrid || !allGrid) return;

  const articles = data.articles || [];
  const hot = articles.filter(a => a.hot);
  const filtered = activeFilter === 'all' ? articles : articles.filter(a => a.category === activeFilter);

  // Hot section
  if (hot.length > 0 && activeFilter === 'all') {
    hotSection.classList.remove('section-hidden');
    hotGrid.innerHTML = '';
    hot.forEach(a => hotGrid.appendChild(createCard(a, true)));
  } else {
    hotSection.classList.add('section-hidden');
  }

  // All section
  allGrid.innerHTML = '';
  if (filtered.length === 0) {
    allGrid.innerHTML = '<div class="empty-state"><div class="empty-icon">🔍</div><p>Không có tin nào trong chuyên mục này.</p></div>';
  } else {
    filtered.forEach(a => allGrid.appendChild(createCard(a, false)));
  }

  // Update count
  const countEl = $('#metaCount');
  if (countEl) countEl.textContent = `${filtered.length} bài`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

let data = { articles: [], categories: [] };
let activeFilter = 'all';

function badgePillHtml(meta) {
  const topic = escapeHtml(meta.topic || 'AI');
  const since = escapeHtml(meta.since || '30 ngày qua');
  const srcs = escapeHtml((meta.sources || []).slice(0, 2).join(' + ') || 'HN+GitHub');
  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg> <span style="margin-left:4px;word-break:break-word">Last30Days · ${topic} · từ ${since}</span> <span class="tag tag-accent" style="margin-left:6px;font-size:10px;flex-shrink:0">${srcs}</span>`;
}

function heroDescHtml(skill) {
  return `Tổng hợp tin AI 30 ngày qua qua <span class="kbd">Last30Days</span> (${escapeHtml(skill)}) — HN Algolia + GitHub + HackerNoon, scored by upvotes/stars. Chạy <span class="kbd">node www/ai-news/fetch.mjs --topic "AI"</span> để làm mới.`;
}

function renderLast30DaysBadge(d) {
  const meta = d.last30days;
  if (!meta || !meta.enabled) return;
  const heroMeta = $('#heroMeta');
  if (!heroMeta) return;
  // Avoid duplicate
  if (document.getElementById('last30daysBadge')) return;
  const pill = document.createElement('span');
  pill.className = 'meta-pill';
  pill.id = 'last30daysBadge';
  pill.title = `${meta.skill || 'Last30Days'} · ${meta.engine || ''}`;
  pill.innerHTML = badgePillHtml(meta);
  pill.style.cssText = 'flex-wrap:wrap;min-width:0;max-width:100%';
  heroMeta.appendChild(pill);
  // Also update hero description if needed
  const heroDesc = document.querySelector('.hero-card p');
  if (heroDesc && meta.skill) heroDesc.innerHTML = heroDescHtml(meta.skill);
}

function isCacheNewer(cached) {
  const serverTime = data.generatedAt ? new Date(data.generatedAt).getTime() : 0;
  return !serverTime || isNaN(serverTime) || cached.at > serverTime;
}

async function restoreLiveCache() {
  // ── Restore live cache so F5 keeps updated content (per-browser) ──
  // Browser không ghi được ai-news.json trên server (GitHub Pages là static).
  // Nên sau khi bấm Cập nhật, mình lưu vào localStorage và khôi phục khi F5.
  // Để lưu vĩnh viễn cho mọi người: chạy `node www/ai-news/fetch.mjs` local rồi push,
  // hoặc bấm Run workflow trên GitHub (Actions → AI News — Daily Auto Update).
  try {
    const cached = JSON.parse(localStorage.getItem('ai-news-live') || 'null');
    if (!cached?.data?.articles?.length || !cached.at) return;
    if (!isCacheNewer(cached)) {
      console.log('[ai-news] server is newer than cache — using server data');
      return;
    }
    if (Date.now() - cached.at >= 24 * 60 * 60 * 1000) return; // cache quá 24h — bỏ
    data = await mergeCurated(cached.data);
    console.log('[ai-news] restored live cache from', new Date(cached.at).toLocaleString('vi-VN'));
  } catch (e) { console.warn('restore cache failed', e); }
}

function wireRefreshButton() {
  // Refresh button — live fetch trực tiếp trên Pages (không cần VS Code) + cooldown 1h
  const refreshBtn = $('#btnRefresh');
  if (!refreshBtn) return;
  refreshBtn.addEventListener('click', handleLiveRefresh);
  // Khởi tạo trạng thái cooldown ngay khi load
  // Nếu ai-news.json vừa được server cập nhật (generatedAt mới hơn local) thì đồng bộ last-update
  try {
    if (data.generatedAt) {
      const serverTime = new Date(data.generatedAt).getTime();
      if (!isNaN(serverTime) && serverTime > getLastUpdateTime()) {
        // server mới hơn — coi như lần update gần nhất là serverTime (tránh spam ngay sau deploy)
        // nhưng không ghi đè nếu user chưa từng update live (để lần đầu vẫn được bấm)
        const hasLocal = !!localStorage.getItem(LS_LAST_UPDATE) || !!localStorage.getItem('ai-news-live');
        if (hasLocal) setLastUpdateTime(serverTime);
      }
    }
  } catch {}
  updateRefreshButtonState();
  if (getRemainingMs() > 0) startCooldownTicker();
}

function wireSearchChips(searchInput) {
  $$('.time-chip').forEach(btn => {
    btn.addEventListener('click', () => setSearchDays(parseInt(btn.dataset.days, 10)));
  });
  $$('.hint-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const hint = btn.dataset.hint || btn.textContent;
      if (searchInput) searchInput.value = hint;
      handleSearch();
    });
  });
  // restore last search hint (optional)
  try {
    const last = JSON.parse(localStorage.getItem('ai-news-last-search')||'null');
    if (last?.kw && searchInput && !searchInput.value) {
      // don't auto-search, just hint placeholder
      searchInput.placeholder = `Thử: ${last.kw} — hoặc nhập từ khoá mới...`;
    }
  } catch {}
}

function wireSearch() {
  const searchInput = $('#searchInput');
  const btnSearch = $('#btnSearch');
  const btnReset = $('#btnResetSearch');
  if (btnSearch) btnSearch.addEventListener('click', handleSearch);
  if (btnReset) btnReset.addEventListener('click', handleResetSearch);
  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); handleSearch(); }
      if (e.key === 'Escape') { e.preventDefault(); handleResetSearch(); }
    });
  }
  wireSearchChips(searchInput);
}

function filterShortcut(e) {
  const active = document.activeElement;
  if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;
  e.preventDefault();
  const firstFilter = $('.filter-chip');
  if (firstFilter) firstFilter.focus();
}

function wireKeyboard() {
  // Keyboard: / focus filter (skip when typing in search)
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) filterShortcut(e);
    if (e.key === 'Escape' && searchKeyword) {
      // Esc anywhere clears search if active
      const active = document.activeElement;
      if (active && active.id === 'searchInput') return; // already handled
      handleResetSearch();
    }
  });
}

function showLoadError(err) {
  console.error('AI News load error:', err);
  const hotGrid = $('#hotGrid');
  const allGrid = $('#allGrid');
  if (hotGrid) hotGrid.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><p>Lỗi tải dữ liệu: ${escapeHtml(err.message)}</p></div>`;
  if (allGrid) allGrid.innerHTML = '';
  toast('Lỗi tải ai-news.json');
}

async function init() {
  try {
    data = await loadNews();
    await restoreLiveCache();
    syncHeroMeta();
    renderCategoryFilters(data);
    renderNews();
    renderLast30DaysBadge(data);
    wireRefreshButton();
    wireSearch();
    wireKeyboard();
  } catch (err) {
    showLoadError(err);
  }
}

document.addEventListener('DOMContentLoaded', init);
