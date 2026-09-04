/* YUNIE Showcase — 74 styles · vanilla · fetch designs.json + status.json */
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const toastEl = $('#toast');
function toast(msg, ms=2600){
  if(!toastEl) return;
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastEl._t);
  toastEl._t = setTimeout(()=> toastEl.classList.remove('show'), ms);
}
function escapeHtml(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function fmtTime(iso){
  try{
    const d = new Date(iso);
    if(isNaN(d.getTime())) return iso || '—';
    return d.toLocaleString('vi-VN', { dateStyle:'medium', timeStyle:'short' });
  }catch{ return iso || '—'; }
}

// Category map — reuse from search.mjs CATEGORY_MAP
const CATEGORY_MAP = {
  'claude':'AI & LLM', 'cohere':'AI & LLM', 'elevenlabs':'AI & LLM', 'minimax':'AI & LLM', 'mistral.ai':'AI & LLM', 'ollama':'AI & LLM', 'opencode.ai':'AI & LLM', 'replicate':'AI & LLM', 'runwayml':'AI & LLM', 'together.ai':'AI & LLM', 'voltagent':'AI & LLM', 'x.ai':'AI & LLM',
  'cursor':'Dev Tools', 'expo':'Dev Tools', 'lovable':'Dev Tools', 'raycast':'Dev Tools', 'superhuman':'Dev Tools', 'vercel':'Dev Tools', 'warp':'Dev Tools',
  'clickhouse':'Backend', 'composio':'Backend', 'hashicorp':'Backend', 'mongodb':'Backend', 'posthog':'Backend', 'sanity':'Backend', 'sentry':'Backend', 'supabase':'Backend',
  'cal':'Productivity', 'intercom':'Productivity', 'linear.app':'Productivity', 'mintlify':'Productivity', 'notion':'Productivity', 'resend':'Productivity', 'zapier':'Productivity', 'slack':'Productivity',
  'airtable':'Design Tools', 'clay':'Design Tools', 'figma':'Design Tools', 'framer':'Design Tools', 'miro':'Design Tools', 'webflow':'Design Tools',
  'binance':'Fintech', 'coinbase':'Fintech', 'kraken':'Fintech', 'mastercard':'Fintech', 'revolut':'Fintech', 'stripe':'Fintech', 'wise':'Fintech',
  'airbnb':'E-commerce', 'meta':'E-commerce', 'nike':'E-commerce', 'shopify':'E-commerce', 'starbucks':'E-commerce',
  'apple':'Media', 'hp':'Media', 'ibm':'Media', 'nvidia':'Media', 'pinterest':'Media', 'playstation':'Media', 'spacex':'Media', 'spotify':'Media', 'theverge':'Media', 'uber':'Media', 'vodafone':'Media', 'wired':'Media',
  'bmw':'Automotive', 'bmw-m':'Automotive', 'bugatti':'Automotive', 'ferrari':'Automotive', 'lamborghini':'Automotive', 'renault':'Automotive', 'tesla':'Automotive',
  'dell-1996':'Retro', 'nintendo-2001':'Retro',
};
const ALL_CATEGORIES = [...new Set(Object.values(CATEGORY_MAP))].sort();
ALL_CATEGORIES.push('Khác'); // fallback for slugs not in map

function getCategory(slug){
  return CATEGORY_MAP[slug] || 'Khác';
}

let allDesigns = [];
let filtered = [];
let activeCategory = 'all';
let searchQuery = '';
let sortMode = 'slug-asc';

async function loadDesigns(){
  const res = await fetch('./designs.json', { cache:'no-store' });
  if(!res.ok) throw new Error(`designs.json ${res.status}`);
  const data = await res.json();
  return data.designs || [];
}
async function loadStatus(){
  try{
    const res = await fetch('../status.json', { cache:'no-store' });
    if(!res.ok) throw new Error(`status.json ${res.status}`);
    return await res.json();
  }catch(e){
    return null;
  }
}

function renderStatusBar(data){
  const el = $('#statusCounts');
  const pill = $('#metaStatusText');
  if(!data){
    if(el) el.textContent = 'STATUS chưa tải — mở status.json';
    if(pill) pill.textContent = 'STATUS —';
    return;
  }
  const c = data.counts || {};
  const parts = [];
  if(c.skills) parts.push(`${c.skills.enabled} skills`);
  if(c.instructions) parts.push(`${c.instructions.enabled} instructions`);
  if(c.agents) parts.push(`${c.agents.enabled} agents`);
  if(c.prompts) parts.push(`${c.prompts.enabled} prompts`);
  const txt = parts.length ? parts.join(' · ') : '—';
  if(el) el.textContent = txt;
  if(pill) pill.textContent = txt;
}

function renderFilterPills(){
  const wrap = $('#filterPills');
  if(!wrap) return;
  const cats = ['all', ...ALL_CATEGORIES];
  const counts = {};
  for(const d of allDesigns){
    const cat = getCategory(d.slug);
    counts[cat] = (counts[cat]||0)+1;
  }
  counts['all'] = allDesigns.length;
  wrap.innerHTML = cats.map(cat=>{
    const label = cat==='all' ? 'Tất cả' : cat;
    const n = counts[cat] || 0;
    const isActive = activeCategory===cat;
    return `<button class="filter-pill ${isActive?'is-active':''}" data-cat="${escapeHtml(cat)}" type="button" role="tab" aria-selected="${isActive}" aria-pressed="${isActive}">${escapeHtml(label)} <span style="opacity:.7;font-weight:600">${n}</span></button>`;
  }).join('');
  wrap.querySelectorAll('.filter-pill').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      activeCategory = btn.dataset.cat;
      renderFilterPills();
      applyFilter();
    });
  });
}

function applyFilter(){
  const q = searchQuery.trim().toLowerCase();
  filtered = allDesigns.filter(d=>{
    const cat = getCategory(d.slug);
    if(activeCategory!=='all' && cat!==activeCategory) return false;
    if(!q) return true;
    const hay = `${d.slug} ${d.name} ${d.description||''} ${Object.values(d.colors||{}).join(' ')} ${cat}`.toLowerCase();
    return hay.includes(q);
  });
  // sort
  if(sortMode==='slug-asc') filtered.sort((a,b)=> a.slug.localeCompare(b.slug));
  else if(sortMode==='name-asc') filtered.sort((a,b)=> (a.name||a.slug).localeCompare(b.name||b.slug));
  else if(sortMode==='category') filtered.sort((a,b)=> getCategory(a.slug).localeCompare(getCategory(b.slug)) || a.slug.localeCompare(b.slug));
  renderGrid();
  const tag = $('#countTag');
  if(tag) tag.textContent = `Hiển thị ${filtered.length}/${allDesigns.length}`;
}

function renderGrid(){
  const grid = $('#grid');
  const empty = $('#emptyState');
  const error = $('#errorState');
  if(!grid) return;
  if(error) error.hidden = true;
  if(!filtered.length){
    grid.innerHTML = '';
    if(empty) empty.hidden = false;
    return;
  }
  if(empty) empty.hidden = true;
  grid.innerHTML = filtered.map(d=>{
    const cat = getCategory(d.slug);
    const primary = d.colors?.primary || '#6366f1';
    const dots = Object.entries(d.colors||{}).slice(0,5).map(([k,v])=> `<span class="palette-dot" style="background:${escapeHtml(v)}" title="${escapeHtml(k)}: ${escapeHtml(v)}"></span>`).join('');
    const more = Object.keys(d.colors||{}).length > 5 ? `<span class="palette-more">+${Object.keys(d.colors).length-5}</span>` : '';
    const desc = (d.description||'').slice(0,140);
    return `
      <article class="card showcase-card" role="listitem" tabindex="0" data-slug="${escapeHtml(d.slug)}" aria-label="${escapeHtml(d.name||d.slug)} — ${escapeHtml(cat)}">
        <div class="card-top-bar" style="background:${escapeHtml(primary)}"></div>
        <div class="card-body">
          <div class="card-kicker">
            <span class="card-category"><i style="background:${escapeHtml(primary)}"></i>${escapeHtml(cat)}</span>
            <span class="card-slug">${escapeHtml(d.slug)}</span>
          </div>
          <h3 class="card-title">${escapeHtml(d.name||d.slug)}</h3>
          <p class="card-desc">${escapeHtml(desc)}${(d.description||'').length>140?'…':''}</p>
          <div class="card-palette" aria-label="Palette">${dots}${more}</div>
          <div class="card-actions">
            <a class="card-link" href="./preview.html?slug=${escapeHtml(d.slug)}" target="_blank" rel="noopener" aria-label="Xem demo ${escapeHtml(d.slug)}" onclick="event.stopPropagation()" style="background:var(--color-primary);color:white;border-color:var(--color-primary)">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              Demo
            </a>
            <a class="card-link" href="./designs/${escapeHtml(d.slug)}.md" target="_blank" rel="noopener" aria-label="Mở DESIGN.md của ${escapeHtml(d.slug)}" onclick="event.stopPropagation()">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
              DESIGN.md
            </a>
            <button class="card-link secondary" type="button" data-detail="${escapeHtml(d.slug)}" aria-label="Xem chi tiết ${escapeHtml(d.slug)}" onclick="event.stopPropagation()">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 12h.01"/><path d="M12 16h.01"/><path d="M8 8h8"/></svg>
              Chi tiết
            </button>
            <button class="card-copy" type="button" data-copy="${escapeHtml(d.slug)}" aria-label="Copy slug ${escapeHtml(d.slug)}" onclick="event.stopPropagation()">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v3"/></svg>
              Copy
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');
  // bind card click + copy + keyboard
  grid.querySelectorAll('.showcase-card').forEach(card=>{
    const slug = card.dataset.slug;
    const design = allDesigns.find(d=> d.slug===slug);
    card.addEventListener('click', ()=> openDetail(design));
    card.addEventListener('keydown', (e)=>{
      if(e.key==='Enter' || e.key===' '){
        e.preventDefault();
        openDetail(design);
      }
    });
  });
  grid.querySelectorAll('.card-copy').forEach(btn=>{
    btn.addEventListener('click', async (e)=>{
      e.stopPropagation();
      const txt = btn.dataset.copy || '';
      try{ await navigator.clipboard.writeText(txt); toast(`Đã copy: ${txt}`); }catch{ toast('Không copy được'); }
    });
  });
  grid.querySelectorAll('[data-detail]').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      e.stopPropagation();
      const slug = btn.dataset.detail;
      const d = allDesigns.find(x=> x.slug===slug);
      if(d) openDetail(d);
    });
  });
}

// Detail modal
let lastFocusBeforeDetail = null;
let detailDesign = null;
function openDetail(design){
  if(!design) return;
  detailDesign = design;
  const modal = $('#detailModal');
  if(!modal) return;
  lastFocusBeforeDetail = document.activeElement;
  const cat = getCategory(design.slug);
  const primary = design.colors?.primary || '#6366f1';
  $('#detailKicker').textContent = `${cat} · ${design.slug}`;
  $('#detailKicker').style.color = primary;
  $('#detailTitle').textContent = design.name || design.slug;
  $('#detailDesc').textContent = design.description || '—';
  const body = $('#detailBody');
  if(body){
    const colors = design.colors || {};
    const palette = Object.entries(colors).map(([k,v])=> `
      <div class="detail-palette-item">
        <i style="background:${escapeHtml(v)}"></i>
        <span>${escapeHtml(k)}</span>
        <span style="color:var(--color-neutral-500)">${escapeHtml(v)}</span>
        <button class="btn btn-ghost btn-sm" type="button" data-copy="${escapeHtml(v)}" aria-label="Copy ${escapeHtml(v)}" style="margin-left:auto;padding:4px 8px;min-height:28px">Copy</button>
      </div>
    `).join('') || '<div class="empty small">Không có palette</div>';
    body.innerHTML = `
      <div class="detail-palette">${palette}</div>
      <div class="detail-desc">${escapeHtml(design.description||'—')}</div>
      <div class="detail-meta">
        <span class="tag">${escapeHtml(cat)}</span>
        <span class="tag">${escapeHtml(design.slug)}</span>
        <span class="tag">${Object.keys(colors).length} màu</span>
      </div>
      <div class="detail-actions">
        <a class="btn btn-primary btn-sm" href="./preview.html?slug=${escapeHtml(design.slug)}" target="_blank" rel="noopener">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          Xem Demo
        </a>
        <a class="btn btn-ghost btn-sm" href="./designs/${escapeHtml(design.slug)}.md" target="_blank" rel="noopener">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
          DESIGN.md
        </a>
        <button class="btn btn-ghost btn-sm" type="button" id="btnViewMd">Xem DESIGN.md</button>
        <button class="btn btn-ghost btn-sm" type="button" id="btnCopySlug">Copy slug</button>
        <button class="btn btn-ghost btn-sm" type="button" id="btnCopyPrimary">Copy primary</button>
      </div>
      <div style="margin-top:12px;color:var(--color-neutral-500);font:500 11px var(--font-mono)">Đường dẫn: <span class="kbd">www/design-showcase/designs/${escapeHtml(design.slug)}.md</span> · Gốc: <span class="kbd">awesome-design-md/design-md/${escapeHtml(design.slug)}/DESIGN.md</span></div>
      <details id="mdDetails" style="margin-top:12px">
        <summary>Xem DESIGN.md đầy đủ <span class="chev" aria-hidden="true">›</span></summary>
        <div class="detail-body" style="padding:12px 0 0">
          <div id="mdContent" style="max-height:360px;overflow:auto;padding:12px;background:var(--color-neutral-50);border:1px solid var(--color-neutral-200);border-radius:10px;font:400 12px var(--font-mono);line-height:1.6;white-space:pre-wrap;word-break:break-word">Đang tải…</div>
        </div>
      </details>
    `;
    body.querySelectorAll('[data-copy]').forEach(b=>{
      b.addEventListener('click', async ()=>{
        const t = b.dataset.copy||'';
        try{ await navigator.clipboard.writeText(t); toast(`Đã copy: ${t}`);}catch{ toast('Không copy được');}
      });
    });
    $('#btnCopySlug')?.addEventListener('click', async ()=>{
      try{ await navigator.clipboard.writeText(design.slug); toast(`Đã copy: ${design.slug}`);}catch{ toast('Không copy được');}
    });
    $('#btnCopyPrimary')?.addEventListener('click', async ()=>{
      try{ await navigator.clipboard.writeText(primary); toast(`Đã copy: ${primary}`);}catch{ toast('Không copy được');}
    });
    // Fetch DESIGN.md inline — works on http(s), graceful on file://
    const mdDetails = $('#mdDetails');
    const mdContent = $('#mdContent');
    const btnViewMd = $('#btnViewMd');
    async function loadMd(){
      if(!mdContent) return;
      try{
        const res = await fetch(`./designs/${design.slug}.md`, { cache:'no-store' });
        if(!res.ok) throw new Error(`${res.status}`);
        const text = await res.text();
        mdContent.textContent = text.slice(0, 12000) + (text.length>12000 ? '\n… (cắt ngắn)' : '');
      }catch(e){
        const isFileProtocol = location.protocol === 'file:';
        mdContent.textContent = isFileProtocol
          ? `Không tải được qua file:// (CORS). Hãy chạy: npx serve www → http://localhost:3000/design-showcase/ — hoặc mở trực tiếp: www/design-showcase/designs/${design.slug}.md`
          : `Không tải được DESIGN.md (${e.message}). Thử mở: ./designs/${design.slug}.md`;
      }
    }
    if(btnViewMd && mdDetails){
      btnViewMd.addEventListener('click', async ()=>{
        mdDetails.open = true;
        await loadMd();
        mdContent?.scrollIntoView({ behavior:'smooth', block:'nearest' });
      });
      mdDetails.addEventListener('toggle', ()=>{
        if(mdDetails.open && mdContent && mdContent.textContent==='Đang tải…') loadMd();
      });
    }
  }
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';
  const closeBtn = $('#btnCloseDetail');
  if(closeBtn) closeBtn.focus();
  else modal.querySelector('.modal-panel')?.focus();
  document.addEventListener('keydown', trapDetail);
}
function closeDetail(){
  const modal = $('#detailModal');
  if(!modal) return;
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden','true');
  document.body.style.overflow='';
  document.removeEventListener('keydown', trapDetail);
  if(lastFocusBeforeDetail && typeof lastFocusBeforeDetail.focus==='function') lastFocusBeforeDetail.focus();
}
function trapDetail(e){
  const modal = $('#detailModal');
  if(!modal || !modal.classList.contains('is-open')) return;
  if(e.key==='Escape'){ e.preventDefault(); closeDetail(); return; }
  if(e.key!=='Tab') return;
  const focusable = [...modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter(el=> !el.hasAttribute('disabled') && el.getAttribute('aria-hidden')!=='true');
  if(!focusable.length) return;
  const first = focusable[0], last = focusable[focusable.length-1];
  if(e.shiftKey && document.activeElement===first){ e.preventDefault(); last.focus(); }
  else if(!e.shiftKey && document.activeElement===last){ e.preventDefault(); first.focus(); }
}
function bindDetail(){
  $('#btnCloseDetail')?.addEventListener('click', closeDetail);
  $('#detailOverlay')?.addEventListener('click', closeDetail);
  $('#detailModal')?.addEventListener('click', (e)=>{ if(e.target.dataset.close==='true') closeDetail(); });
}

// Init
async function init(){
  bindDetail();
  const searchInput = $('#searchInput');
  const searchClear = $('#searchClear');
  const sortSelect = $('#sortSelect');
  const btnRandom = $('#btnRandom');
  const btnClear = $('#btnClearFilter');
  const btnRetry = $('#btnRetry');

  if(searchInput){
    searchInput.addEventListener('input', ()=>{
      searchQuery = searchInput.value;
      if(searchClear) searchClear.hidden = !searchQuery;
      applyFilter();
    });
    // "/" to focus
    document.addEventListener('keydown', (e)=>{
      if(e.key==='/' && !e.ctrlKey && !e.metaKey && !e.altKey){
        const tag = document.activeElement?.tagName;
        if(tag==='INPUT' || tag==='TEXTAREA' || tag==='SELECT') return;
        e.preventDefault();
        searchInput.focus();
      }
    });
  }
  if(searchClear){
    searchClear.addEventListener('click', ()=>{
      searchQuery = '';
      if(searchInput) searchInput.value = '';
      searchClear.hidden = true;
      applyFilter();
      searchInput?.focus();
    });
  }
  if(sortSelect){
    sortSelect.addEventListener('change', ()=>{
      sortMode = sortSelect.value;
      applyFilter();
    });
  }
  if(btnRandom){
    btnRandom.addEventListener('click', ()=>{
      if(!filtered.length) return;
      const pick = filtered[Math.floor(Math.random()*filtered.length)];
      openDetail(pick);
      toast(`🎲 ${pick.slug} — ${getCategory(pick.slug)}`);
    });
  }
  if(btnClear){
    btnClear.addEventListener('click', ()=>{
      activeCategory='all';
      searchQuery='';
      if(searchInput) searchInput.value='';
      if(searchClear) searchClear.hidden=true;
      renderFilterPills();
      applyFilter();
    });
  }
  if(btnRetry){
    btnRetry.addEventListener('click', ()=> initLoad());
  }

  await initLoad();
}

async function initLoad(){
  const grid = $('#grid');
  const error = $('#errorState');
  const empty = $('#emptyState');
  if(error) error.hidden = true;
  if(empty) empty.hidden = true;
  try{
    const [designs, status] = await Promise.all([loadDesigns(), loadStatus()]);
    allDesigns = designs;
    renderStatusBar(status);
    renderFilterPills();
    applyFilter();
    const meta = $('#metaCount');
    if(meta) meta.textContent = String(allDesigns.length);
  }catch(e){
    if(grid) grid.innerHTML = '';
    if(error) error.hidden = false;
    const statusEl = $('#statusCounts');
    if(statusEl) statusEl.textContent = '—';
    console.error(e);
  }
}

init();
