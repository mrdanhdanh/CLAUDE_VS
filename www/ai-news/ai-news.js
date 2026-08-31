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

  card.innerHTML = `
    <div class="news-card-header">
      <span class="news-category" style="background:${catColor}">${escapeHtml(catName)}</span>
      <span class="news-date">${fmtDate(article.date)}</span>
    </div>
    <h3 class="news-title"><a href="${escapeHtml(article.sourceUrl)}" target="_blank" rel="noopener" aria-label="${escapeHtml(article.title)} — mở nguồn">${escapeHtml(article.title)}</a></h3>
    <p class="news-summary">${escapeHtml(article.summary)}</p>
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

async function init() {
  try {
    data = await loadNews();

    // Hero meta
    const genEl = $('#metaGenerated');
    if (genEl) genEl.textContent = fmtDate(data.generatedAt);
    const byEl = $('#metaBy');
    if (byEl) byEl.textContent = data.generatedBy || 'YUNIE';

    renderCategoryFilters(data);
    renderNews();

    // Refresh button
    $('#btnRefresh')?.addEventListener('click', () => {
      toast('Đang làm mới…');
      setTimeout(() => location.reload(), 300);
    });

    // Keyboard: / focus filter
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const active = document.activeElement;
        if (active && active.tagName !== 'INPUT' && active.tagName !== 'TEXTAREA') {
          e.preventDefault();
          const firstFilter = $('.filter-chip');
          if (firstFilter) firstFilter.focus();
        }
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
