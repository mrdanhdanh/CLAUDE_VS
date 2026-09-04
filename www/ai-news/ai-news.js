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
  return res.json();
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

async function fetchLiveHN(topic = 'AI', days = 30) {
  let url = `https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent(topic)}&tags=story&hitsPerPage=20`;
  if (days > 0) {
    const since = Math.floor(Date.now()/1000) - days*24*60*60;
    url += `&numericFilters=created_at_i>${since}`;
  }
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error(`HN ${res.status}`);
  const data = await res.json();
  return (data.hits||[]).map(h => ({
    id: `hn-${h.objectID}`,
    title: h.title || h.story_title || 'Untitled',
    summary: (h.story_text || h.title || '').slice(0,220) + (h.points ? ` — ${h.points} points, ${h.num_comments||0} comments on HN.` : ''),
    source: 'Hacker News',
    sourceUrl: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
    category: liveCategorize(h.title||'', h.story_text||''),
    date: fmtDateShort(h.created_at),
    hot: (h.points||0) > 100 || (h.num_comments||0) > 50,
    tags: ['HN', topic, ...((h._tags||[]).slice(0,2))],
    score: h.points||0,
  }));
}
async function fetchLiveGitHub(topic = 'AI', days = 30) {
  let q = encodeURIComponent(topic);
  if (days > 0) {
    const since = fmtDateShort(Date.now() - days*24*60*60*1000);
    q += `+created:>${since}`;
  }
  const url = `https://api.github.com/search/repositories?q=${q}&sort=stars&order=desc&per_page=10`;
  const res = await fetch(url, { headers: { 'Accept': 'application/vnd.github.v3+json' } });
  if (!res.ok) throw new Error(`GitHub ${res.status}`);
  const data = await res.json();
  return (data.items||[]).slice(0,5).map(r => ({
    id: `gh-${r.id}`,
    title: `${r.full_name} — ${(r.description||'Trending AI repo').slice(0,80)}`,
    summary: `${r.description||''} ⭐ ${r.stargazers_count} stars, ${r.language||''}. ${(r.topics||[]).slice(0,3).join(', ')||''}`.slice(0,220),
    source: 'GitHub',
    sourceUrl: r.html_url,
    category: 'products',
    date: fmtDateShort(r.created_at),
    hot: r.stargazers_count > 500,
    tags: ['GitHub', r.language||'AI', ...((r.topics||[]).slice(0,2))],
    score: r.stargazers_count||0,
  }));
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
    btn.title = 'Lấy tin mới trực tiếp từ HN + GitHub (không cần VS Code) — mỗi giờ 1 lần';
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
  toast('Đang lấy tin mới từ HN + GitHub… ⏳', 4000);
  // show loading in grids
  const hotGrid = $('#hotGrid'), allGrid = $('#allGrid');
  if (hotGrid) hotGrid.innerHTML = '<div class="empty-state"><div class="empty-icon">⏳</div><p>Đang fetch trực tiếp từ Hacker News + GitHub…</p><p class="small muted" style="font-size:12px;margin-top:6px">Chạy ngay trên trình duyệt, không cần VS Code</p></div>';
  if (allGrid) allGrid.innerHTML = '';
  try {
    const [hn, gh] = await Promise.all([fetchLiveHN('AI', 30), fetchLiveGitHub('AI', 30).catch(()=>[])]);
    const seen = new Set();
    const merged = [...hn, ...gh].filter(a => {
      const k = a.title.toLowerCase().slice(0,40);
      if (seen.has(k)) return false;
      seen.add(k); return true;
    });
    merged.sort((a,b) => (new Date(b.date) - new Date(a.date)) || (b.hot - a.hot) || (b.score - a.score));
    let articles = merged.slice(0,15);
    if (articles.length < 5 && data.articles?.length) {
      const ids = new Set(articles.map(a=>a.id));
      const keep = data.articles.filter(a=>!ids.has(a.id)).slice(0, 15-articles.length);
      articles = [...articles, ...keep];
    }
    if (articles.filter(a=>a.hot).length===0 && articles.length>0) { articles[0].hot=true; if(articles[1]) articles[1].hot=true; }
    if (articles.length === 0) throw new Error('Không lấy được tin nào — thử lại sau');
    // update global data
    data = {
      ...data,
      generatedAt: new Date().toISOString(),
      generatedBy: 'YUNIE × Live (trình duyệt)',
      articles: articles.map(a=>({ id:a.id, title:a.title, summary:a.summary, source:a.source, sourceUrl:a.sourceUrl, category:a.category, date:a.date, hot:!!a.hot, tags:(a.tags||[]).slice(0,5) })),
      meta: { fetchedAt: new Date().toISOString(), topic:'AI', total: articles.length, hot: articles.filter(a=>a.hot).length, sources:[...new Set(articles.map(a=>a.source))] },
      last30days: { ...(data.last30days||{}), topic:'AI', since: fmtDateShort(Date.now()-30*24*60*60*1000), sources:['Hacker News (live)','GitHub (live)'], engine:'Live fetch trực tiếp trên trình duyệt (không cần VS Code)' }
    };
    // update hero meta
    const genEl = $('#metaGenerated'); if (genEl) genEl.textContent = fmtDate(data.generatedAt);
    const byEl = $('#metaBy'); if (byEl) byEl.textContent = data.generatedBy;
    // re-render filters counts
    const bar = $('#filterBar');
    if (bar) {
      // update counts on existing chips
      $$('.filter-chip', bar).forEach(btn => {
        const fid = btn.dataset.filter;
        if (fid === 'all') return;
        const cnt = data.articles.filter(a=>a.category===fid).length;
        const countEl = btn.querySelector('.count');
        if (countEl) countEl.textContent = cnt;
        else if (cnt>0) { const s=document.createElement('span'); s.className='count'; s.textContent=cnt; btn.appendChild(s); }
      });
    }
    renderNews();
    // update badge
    const oldBadge = document.getElementById('last30daysBadge');
    if (oldBadge) oldBadge.remove();
    renderLast30DaysBadge(data);
    toast(`Đã cập nhật ${articles.length} tin trực tiếp ✅`, 3000);
    const now = Date.now();
    try { localStorage.setItem('ai-news-live', JSON.stringify({ at: now, data })); } catch {}
    setLastUpdateTime(now);
    startCooldownTicker();
  } catch (e) {
    console.error('Live fetch failed', e);
    toast(`Lỗi live fetch: ${e.message} — đang hiện cache`, 4000);
    // restore from cache if possible
    try {
      const cached = JSON.parse(localStorage.getItem('ai-news-live')||'null');
      if (cached?.data?.articles?.length) { data = cached.data; renderNews(); toast('Đã khôi phục từ cache trình duyệt', 2500); }
      else { renderNews(); }
    } catch { renderNews(); }
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
async function handleSearch() {
  const input = $('#searchInput');
  const btn = $('#btnSearch');
  const kw = (input?.value || '').trim();
  if (!kw) { toast('Nhập từ khoá đã sếp ơi ✍️', 2500); input?.focus(); return; }
  if (isSearching || isLiveFetching) return;
  const remain = getSearchRemainingMs();
  if (remain > 0) {
    const s = Math.ceil(remain/1000);
    toast(`⏳ Đợi ${s}s nữa rồi tìm tiếp nhé sếp`, 2500);
    return;
  }
  const days = getSearchDays();
  searchKeyword = kw;
  searchDays = days;
  isSearching = true;
  if (btn) { btn.disabled = true; btn.style.opacity = '0.6'; }
  toast(`Đang tìm "${kw}" trong ${days===0?'không giới hạn':days+' ngày'}… ⏳`, 3000);
  const hotGrid = $('#hotGrid'), allGrid = $('#allGrid');
  if (hotGrid) hotGrid.innerHTML = '<div class="empty-state"><div class="empty-icon">🔍</div><p>Đang tìm tin hot cho "' + escapeHtml(kw) + '"…</p><p class="small muted" style="font-size:12px;margin-top:6px">HN Algolia + GitHub · giữ chuẩn hot như Cập nhật</p></div>';
  if (allGrid) allGrid.innerHTML = '';
  const statusEl = $('#searchStatus');
  if (statusEl) { statusEl.hidden = false; statusEl.textContent = `Đang tìm "${kw}"…`; }
  try {
    const [hn, gh] = await Promise.all([
      fetchLiveHN(kw, days),
      fetchLiveGitHub(kw, days).catch(()=>[])
    ]);
    const seen = new Set();
    const merged = [...hn, ...gh].filter(a => {
      const k = a.title.toLowerCase().slice(0,40);
      if (seen.has(k)) return false;
      seen.add(k); return true;
    });
    merged.sort((a,b) => (new Date(b.date) - new Date(a.date)) || (b.hot - a.hot) || (b.score - a.score));
    let articles = merged.slice(0, 15);
    if (articles.filter(a=>a.hot).length===0 && articles.length>0) { articles[0].hot=true; if(articles[1]) articles[1].hot=true; }
    if (articles.length === 0) {
      const daysLabel = days===0?'không giới hạn':`${days} ngày`;
      if (hotGrid) hotGrid.innerHTML = '';
      if (allGrid) allGrid.innerHTML = `<div class="empty-state"><div class="empty-icon">🔍</div><p>Không tìm thấy tin nào cho "${escapeHtml(kw)}" trong ${escapeHtml(daysLabel)}.</p><p class="small muted" style="font-size:12px;margin-top:6px">Thử từ khoá khác hoặc chọn "Không giới hạn"</p></div>`;
      data = { ...data, articles: [], meta: { ...(data.meta||{}), topic: kw, total: 0, hot: 0 } };
      updateSearchStatusUI();
      // update counts to 0
      $$('.filter-chip', $('#filterBar')).forEach(btn => {
        if (btn.dataset.filter === 'all') return;
        const c = btn.querySelector('.count'); if (c) c.textContent = '0';
      });
      const countEl = $('#metaCount'); if (countEl) countEl.textContent = '0 bài';
      toast(`Không có kết quả cho "${kw}"`, 3000);
      try { localStorage.setItem(LS_SEARCH_LAST, String(Date.now())); } catch {}
      return;
    }
    // save original on first search
    if (!originalData) {
      try { originalData = JSON.parse(JSON.stringify(data)); } catch { originalData = { ...data, articles: [...(data.articles||[])] }; }
      // also try to keep a copy from initial load if available
      if (!originalData.articles?.length) {
        try { const cached = JSON.parse(localStorage.getItem('ai-news-live')||'null'); if (cached?.data) originalData = cached.data; } catch {}
      }
    }
    data = {
      ...data,
      generatedAt: new Date().toISOString(),
      generatedBy: `YUNIE × Tìm kiếm "${kw}"`,
      articles: articles.map(a=>({ id:a.id, title:a.title, summary:a.summary, source:a.source, sourceUrl:a.sourceUrl, category:a.category, date:a.date, hot:!!a.hot, tags:(a.tags||[]).slice(0,5) })),
      meta: { fetchedAt: new Date().toISOString(), topic: kw, total: articles.length, hot: articles.filter(a=>a.hot).length, sources:[...new Set(articles.map(a=>a.source))] },
      last30days: { ...(data.last30days||{}), topic: kw, since: days===0 ? 'không giới hạn' : fmtDateShort(Date.now()-days*24*60*60*1000), sources:['Hacker News (live)','GitHub (live)'], engine:'Tìm kiếm live — HN Algolia + GitHub, giữ chuẩn hot' }
    };
    const genEl = $('#metaGenerated'); if (genEl) genEl.textContent = fmtDate(data.generatedAt);
    const byEl = $('#metaBy'); if (byEl) byEl.textContent = data.generatedBy;
    // update filter counts
    const bar = $('#filterBar');
    if (bar) {
      $$('.filter-chip', bar).forEach(btn => {
        const fid = btn.dataset.filter;
        if (fid === 'all') return;
        const cnt = data.articles.filter(a=>a.category===fid).length;
        const countEl = btn.querySelector('.count');
        if (countEl) countEl.textContent = cnt;
        else if (cnt>0) { const s=document.createElement('span'); s.className='count'; s.textContent=cnt; btn.appendChild(s); }
      });
    }
    // reset filter to all to show results
    activeFilter = 'all';
    $$('.filter-chip').forEach(btn => {
      const isActive = btn.dataset.filter === 'all';
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    renderNews();
    updateSearchStatusUI();
    const oldBadge = document.getElementById('last30daysBadge');
    if (oldBadge) oldBadge.remove();
    renderLast30DaysBadge(data);
    toast(`Tìm thấy ${articles.length} tin cho "${kw}" ✅`, 3000);
    try { localStorage.setItem(LS_SEARCH_LAST, String(Date.now())); } catch {}
    try { localStorage.setItem('ai-news-last-search', JSON.stringify({ kw, days, at: Date.now() })); } catch {}
  } catch (e) {
    console.error('Search failed', e);
    toast(`Lỗi tìm kiếm: ${e.message}`, 4000);
    if (statusEl) statusEl.textContent = `Lỗi: ${e.message}`;
  } finally {
    isSearching = false;
    if (btn) { btn.disabled = false; btn.style.opacity = ''; }
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
    const genEl = $('#metaGenerated'); if (genEl) genEl.textContent = fmtDate(data.generatedAt);
    const byEl = $('#metaBy'); if (byEl) byEl.textContent = data.generatedBy || 'YUNIE';
    const bar = $('#filterBar');
    if (bar) {
      $$('.filter-chip', bar).forEach(btn => {
        const fid = btn.dataset.filter;
        if (fid === 'all') return;
        const cnt = data.articles.filter(a=>a.category===fid).length;
        const c = btn.querySelector('.count'); if (c) c.textContent = cnt;
      });
    }
    activeFilter = 'all';
    $$('.filter-chip').forEach(btn => {
      const isActive = btn.dataset.filter === 'all';
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    renderNews();
    const oldBadge = document.getElementById('last30daysBadge');
    if (oldBadge) oldBadge.remove();
    renderLast30DaysBadge(data);
    toast('Đã xoá tìm kiếm — về danh sách gốc ✅', 2500);
    try { localStorage.removeItem('ai-news-last-search'); } catch {}
  } else {
    try {
      data = await loadNews();
      const genEl = $('#metaGenerated'); if (genEl) genEl.textContent = fmtDate(data.generatedAt);
      const byEl = $('#metaBy'); if (byEl) byEl.textContent = data.generatedBy || 'YUNIE';
      // re-render filter counts
      const bar = $('#filterBar');
      if (bar) {
        $$('.filter-chip', bar).forEach(btn => {
          const fid = btn.dataset.filter;
          if (fid === 'all') return;
          const cnt = data.articles.filter(a=>a.category===fid).length;
          const c = btn.querySelector('.count'); if (c) c.textContent = cnt;
        });
      }
      activeFilter = 'all';
      $$('.filter-chip').forEach(btn => {
        const isActive = btn.dataset.filter === 'all';
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
      renderNews();
      const oldBadge = document.getElementById('last30daysBadge');
      if (oldBadge) oldBadge.remove();
      renderLast30DaysBadge(data);
      toast('Đã xoá tìm kiếm ✅', 2500);
    } catch (e) {
      toast('Lỗi khôi phục: ' + e.message, 3000);
    }
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
  pill.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg> <span style="margin-left:4px;word-break:break-word">Last30Days · ${escapeHtml(meta.topic||'AI')} · từ ${escapeHtml(meta.since||'30 ngày qua')}</span> <span class="tag tag-accent" style="margin-left:6px;font-size:10px;flex-shrink:0">${escapeHtml((meta.sources||[]).slice(0,2).join(' + ')||'HN+GitHub')}</span>`;
  pill.style.cssText = 'flex-wrap:wrap;min-width:0;max-width:100%';
  heroMeta.appendChild(pill);
  // Also update hero description if needed
  const heroDesc = document.querySelector('.hero-card p');
  if (heroDesc && meta.skill) {
    heroDesc.innerHTML = `Tổng hợp tin AI 30 ngày qua qua <span class="kbd">Last30Days</span> (${escapeHtml(meta.skill)}) — HN Algolia + GitHub, scored by upvotes/stars. Chạy <span class="kbd">node www/ai-news/fetch.mjs --topic "AI"</span> để làm mới.`;
  }
}

async function init() {
  try {
    data = await loadNews();

    // ── Restore live cache so F5 keeps updated content (per-browser) ──
    // Browser không ghi được ai-news.json trên server (GitHub Pages là static).
    // Nên sau khi bấm Cập nhật, mình lưu vào localStorage và khôi phục khi F5.
    // Để lưu vĩnh viễn cho mọi người: chạy `node www/ai-news/fetch.mjs` local rồi push,
    // hoặc bấm Run workflow trên GitHub (Actions → AI News — Daily Auto Update).
    try {
      const cached = JSON.parse(localStorage.getItem('ai-news-live') || 'null');
      if (cached?.data?.articles?.length && cached.at) {
        const serverTime = data.generatedAt ? new Date(data.generatedAt).getTime() : 0;
        const cachedTime = cached.at;
        const isCachedNewer = !serverTime || isNaN(serverTime) || cachedTime > serverTime;
        const ageMs = Date.now() - cachedTime;
        const maxAgeMs = 24 * 60 * 60 * 1000; // giữ cache 24h
        if (isCachedNewer && ageMs < maxAgeMs) {
          data = cached.data;
          console.log('[ai-news] restored live cache from', new Date(cachedTime).toLocaleString('vi-VN'));
        } else if (!isCachedNewer) {
          console.log('[ai-news] server is newer than cache — using server data');
        }
      }
    } catch (e) { console.warn('restore cache failed', e); }

    // Hero meta
    const genEl = $('#metaGenerated');
    if (genEl) genEl.textContent = fmtDate(data.generatedAt);
    const byEl = $('#metaBy');
    if (byEl) byEl.textContent = data.generatedBy || 'YUNIE';

    renderCategoryFilters(data);
    renderNews();
    renderLast30DaysBadge(data);

    // Refresh button — live fetch trực tiếp trên Pages (không cần VS Code) + cooldown 1h
    const refreshBtn = $('#btnRefresh');
    if (refreshBtn) {
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

    // Search wiring
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

    // Keyboard: / focus filter (skip when typing in search)
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const active = document.activeElement;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;
        e.preventDefault();
        const firstFilter = $('.filter-chip');
        if (firstFilter) firstFilter.focus();
      }
      if (e.key === 'Escape' && searchKeyword) {
        // Esc anywhere clears search if active
        const active = document.activeElement;
        if (active && active.id === 'searchInput') return; // already handled
        handleResetSearch();
      }
    });

  } catch (err) {
    console.error('AI News load error:', err);
    const hotGrid = $('#hotGrid');
    const allGrid = $('#allGrid');
    if (hotGrid) hotGrid.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><p>Lỗi tải dữ liệu: ${escapeHtml(err.message)}</p></div>`;
    if (allGrid) allGrid.innerHTML = '';
    toast('Lỗi tải ai-news.json');
  }
}

document.addEventListener('DOMContentLoaded', init);
