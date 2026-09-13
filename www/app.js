/* YUNIE STATUS — app.js v2.1 — ui-ux-pro-max · wording tự nhiên · Pipeline modal */
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

function fmtTime(iso){
  try{
    const d = new Date(iso);
    if(isNaN(d.getTime())) return iso || '—';
    const local = d.toLocaleString('vi-VN', { dateStyle:'medium', timeStyle:'short' });
    return `${local}`;
  }catch{ return iso || '—' }
}

function healthBadge(status){
  if(status==='ok') return '<span class="tag tag-on" aria-label="Tình trạng: Ổn định">● Ổn định</span>';
  if(status==='warn') return '<span class="tag tag-warn" aria-label="Tình trạng: Cảnh báo">● Cảnh báo</span>';
  return '<span class="tag tag-off" aria-label="Tình trạng: Sự cố">● Sự cố</span>';
}

async function loadStatus(){
  const res = await fetch('./status.json', { cache:'no-store' });
  if(!res.ok) throw new Error(`status.json ${res.status} ${res.statusText}`);
  return res.json();
}

// ---------- SVG icons for stats (Lucide, stroke 1.8, 16px) ----------
const statIcons = {
  skill: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>',
  instruction: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M10 13H8"/><path d="M16 17H8"/><path d="M13 13h3"/></svg>',
  agent: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M12 11V7a3 3 0 0 1 3-3h1"/><path d="M12 7a3 3 0 0 0-3-3H8"/><circle cx="9" cy="16" r="1" fill="white" stroke="none"/><circle cx="15" cy="16" r="1" fill="white" stroke="none"/></svg>',
  prompt: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>',
  hook: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22a7 7 0 0 0 7-7c0-3.5-2.5-6-7-10-4.5 4-7 6.5-7 10a7 7 0 0 0 7 7z"/><path d="M9 12h6"/></svg>',
};

// ---------- Stats ----------
function renderStats(data){
  const c = data.counts || {};
  const order = [
    { key:'skills', label:'Skills', icon: statIcons.skill, cls:'skill' },
    { key:'instructions', label:'Instructions', icon: statIcons.instruction, cls:'instruction' },
    { key:'agents', label:'Agents', icon: statIcons.agent, cls:'agent' },
    { key:'prompts', label:'Prompts', icon: statIcons.prompt, cls:'prompt' },
    { key:'hooks', label:'Hooks', icon: statIcons.hook, cls:'hook' },
  ];
  const statsEl = $('#stats');
  if(!statsEl) return;
  statsEl.innerHTML = order.map(o=>{
    const v = c[o.key] || { enabled:0, total:0, disabled:0 };
    const pct = v.total ? Math.round(v.enabled / v.total * 100) : 0;
    const sub = v.total ? `${v.enabled}/${v.total} đang bật` : '—';
    const disabledTxt = v.disabled ? ` · ${v.disabled} đã tắt` : '';
    return `
      <div class="stat" role="listitem" tabindex="0" aria-label="${o.label}: ${sub}${disabledTxt}, ${pct}%">
        <div class="stat-top">
          <span class="stat-icon ${o.cls}" aria-hidden="true">${o.icon}</span>
          <span class="tag ${pct===100?'tag-on':''}" aria-label="${pct} phần trăm">${pct}%</span>
        </div>
        <strong aria-label="${v.enabled} ${o.label}">${v.enabled}</strong>
        <span class="stat-label">${o.label}</span>
        <small>${sub}${disabledTxt}</small>
        <div class="progress" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="${o.label} progress">
          <i style="width:${pct}%"></i>
        </div>
      </div>
    `;
  }).join('');
}

// ---------- Registry ----------
let registryData = []; // normalized array of {type, name, desc, enabled}
let activeFilter = 'all';
let searchQuery = '';

const typeIconSvg = {
  skill: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>',
  instruction: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>',
  agent: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M12 11V7a3 3 0 0 1 3-3h1"/><path d="M12 7a3 3 0 0 0-3-3H8"/></svg>',
  prompt: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>',
  hook: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22a7 7 0 0 0 7-7c0-3.5-2.5-6-7-10-4.5 4-7 6.5-7 10a7 7 0 0 0 7 7z"/></svg>',
};

function normItem(meta, iconSvg, name, desc, enabled){
  return { type: meta.type, label: meta.label, iconSvg, name, desc, enabled };
}

function pushArrayItems(val, meta, iconSvg, out){
  for(const item of val){
    if(typeof item === 'string'){
      out.push(normItem(meta, iconSvg, item, '', true));
    } else if(item && typeof item === 'object'){
      out.push(normItem(meta, iconSvg, item.name || item.id || 'unknown', item.description || item.desc || '', item.enabled !== false));
    }
  }
}

function pushObjectItems(val, meta, iconSvg, out){
  for(const [name, info] of Object.entries(val)){
    if(typeof info === 'string'){
      out.push(normItem(meta, iconSvg, name, info, true));
    } else if(info && typeof info === 'object'){
      out.push(normItem(meta, iconSvg, name, info.description || info.desc || '', info.enabled !== false));
    } else {
      out.push(normItem(meta, iconSvg, name, '', !!info));
    }
  }
}

function normalizeRegistry(data){
  const reg = data.registry || {};
  const typeMap = {
    skills: { label:'Skill', type:'skill' },
    instructions: { label:'Instruction', type:'instruction' },
    agents: { label:'Agent', type:'agent' },
    prompts: { label:'Prompt', type:'prompt' },
    hooks: { label:'Hook', type:'hook' },
  };
  const out = [];
  for(const [key, val] of Object.entries(reg)){
    const meta = typeMap[key] || { label:key, type:key.replace(/s$/,'') };
    const iconSvg = typeIconSvg[meta.type] || '';
    if(Array.isArray(val)) pushArrayItems(val, meta, iconSvg, out);
    else if(val && typeof val === 'object') pushObjectItems(val, meta, iconSvg, out);
  }
  out.sort((a,b)=>{
    if(a.enabled !== b.enabled) return a.enabled ? -1 : 1;
    if(a.type !== b.type) return a.type.localeCompare(b.type);
    return a.name.localeCompare(b.name);
  });
  return out;
}

function filteredRegistry(){
  return registryData.filter(r=>{
    if(activeFilter !== 'all' && r.type !== activeFilter) return false;
    if(searchQuery){
      const q = searchQuery.toLowerCase();
      const hay = `${r.name} ${r.desc} ${r.type} ${r.label}`.toLowerCase();
      if(!hay.includes(q)) return false;
    }
    return true;
  });
}

function registryEmptyRow(msg, hint){
  return `<tr><td colspan="4"><div class="empty"><strong>${msg}</strong><br>${hint}</div></td></tr>`;
}

function registryEmptyState(tbody, cards, empty, kind){
  if(kind === 'nodata'){
    tbody.innerHTML = registryEmptyRow('Chưa có dữ liệu registry', 'Kiểm tra <span class="kbd">.github/harness/registry.json</span> và chạy <span class="kbd">harness-manager status</span>');
    cards.innerHTML = '';
    if(empty) empty.style.display = 'none';
  } else {
    tbody.innerHTML = registryEmptyRow('Không tìm thấy', 'Thử từ khóa khác hoặc đổi bộ lọc.');
    cards.innerHTML = '';
    if(empty) empty.style.display = 'block';
  }
}

function registryStatusTag(r){
  return r.enabled
    ? '<span class="tag tag-on"><i class="status-dot dot-on" aria-hidden="true"></i>đang bật</span>'
    : '<span class="tag tag-off"><i class="status-dot dot-off" aria-hidden="true"></i>đã tắt</span>';
}

function registryRowHtml(r){
  return `
    <tr>
      <td><span class="tag">${r.iconSvg} ${r.label}</span></td>
      <td class="mono"><strong>${escapeHtml(r.name)}</strong></td>
      <td style="color:var(--color-neutral-500);max-width:420px;word-break:break-word">${r.desc ? escapeHtml(r.desc.slice(0,120)) : '<span style="color:var(--color-neutral-400)">—</span>'}</td>
      <td>${registryStatusTag(r)}</td>
    </tr>
  `;
}

function registryCardHtml(r){
  return `
    <div class="reg-card" tabindex="0" role="article" aria-label="${r.label} ${r.name} ${r.enabled?'đang bật':'đã tắt'}">
      <div class="reg-card-head">
        <span class="reg-card-title">${r.iconSvg} ${escapeHtml(r.name)}</span>
        ${registryStatusTag(r)}
      </div>
      <div style="display:flex;gap:6px;align-items:center;margin-bottom:6px">
        <span class="tag">${r.iconSvg} ${r.label}</span>
        <span class="mono" style="color:var(--color-neutral-400);font-size:11px">${r.type}</span>
      </div>
      <div class="reg-card-desc">${r.desc ? escapeHtml(r.desc.slice(0,120)) : '<span style="color:var(--color-neutral-400)">Không có mô tả</span>'}</div>
    </div>
  `;
}

function renderRegistryTable(rows){
  const tbody = $('#registryBody');
  const cards = $('#registryCards');
  const empty = $('#registryEmpty');
  if(!tbody || !cards) return;
  if(!registryData.length) return registryEmptyState(tbody, cards, empty, 'nodata');
  if(!rows.length) return registryEmptyState(tbody, cards, empty, 'filtered');
  if(empty) empty.style.display = 'none';
  tbody.innerHTML = rows.map(registryRowHtml).join('');
  cards.innerHTML = rows.map(registryCardHtml).join('');
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function updateRegistryTag(data){
  const counts = data.counts || {};
  const total = Object.values(counts).reduce((a,b)=>a+(b.total||0),0);
  const enabled = Object.values(counts).reduce((a,b)=>a+(b.enabled||0),0);
  const tag = $('#registryTag');
  if(tag) tag.textContent = total ? `${enabled}/${total} đang bật · ${filteredRegistry().length} hiển thị` : `${filteredRegistry().length} mục`;
}

function bindRegistryControls(data){
  const search = $('#registrySearch');
  const pills = $$('#registryFilter .filter-pill');
  if(search){
    search.addEventListener('input', (e)=>{
      searchQuery = e.target.value.trim();
      const rows = filteredRegistry();
      renderRegistryTable(rows);
      updateRegistryTag(data);
    });
  }
  pills.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      activeFilter = btn.dataset.filter || 'all';
      pills.forEach(p=>{
        const isActive = p.dataset.filter === activeFilter;
        p.classList.toggle('is-active', isActive);
        p.setAttribute('aria-pressed', String(isActive));
      });
      const rows = filteredRegistry();
      renderRegistryTable(rows);
      updateRegistryTag(data);
    });
  });
}

function renderRegistry(data){
  registryData = normalizeRegistry(data);
  const rows = filteredRegistry();
  renderRegistryTable(rows);
  updateRegistryTag(data);
  if(!renderRegistry._bound){
    bindRegistryControls(data);
    renderRegistry._bound = true;
  } else {
    updateRegistryTag(data);
  }
  const sub = $('#registrySub');
  if(sub){
    const total = registryData.length;
    const enabled = registryData.filter(r=>r.enabled).length;
    sub.textContent = `Nguồn: .github/harness/registry.json · ${enabled}/${total} đang bật · Đồng bộ với skills/registry.json`;
  }
}

// ---------- Presets ----------
function renderPresets(data){
  const presets = data.presets || [];
  const el = $('#presetList');
  const tag = $('#presetTag');
  if(!el) return;
  if(tag) tag.textContent = `${presets.length} bộ`;
  if(!presets.length){
    el.innerHTML = `<div class="empty">Chưa có bộ cấu hình<br><span class="mono small">Tạo bằng <span class="kbd">preset save &lt;tên&gt;</span></span></div>`;
    return;
  }
  el.innerHTML = presets.map(p=>{
    const name = typeof p === 'string' ? p : p.name;
    const desc = typeof p === 'string' ? '' : (p.description || '');
    const badge = name==='api-minimal' ? 'tối giản' : name==='full' ? 'đầy đủ' : 'web';
    return `
      <div class="preset-item">
        <div style="min-width:0">
          <div class="mono" style="font-weight:700;font-size:13px">${escapeHtml(name)}</div>
          <div style="color:var(--color-neutral-500);font-size:13px;margin-top:2px;line-height:1.5">${escapeHtml(desc)}</div>
        </div>
        <span class="tag" style="flex-shrink:0">${badge}</span>
      </div>
    `;
  }).join('') + `<div style="margin-top:12px;color:var(--color-neutral-500);font-size:12px">Dùng: <span class="kbd">preset apply &lt;tên&gt;</span></div>`;
}

// ---------- Plans ----------
function renderPlans(data){
  const plans = data.plans || [];
  const demos = data.demos || [];
  const el = $('#plansList');
  const tag = $('#plansTag');
  if(!el) return;
  const all = [
    ...plans.map(p=> typeof p === 'string' ? ({ name:p, type:'plan', path:`.agent/plans/${p}/` }) : p),
    ...demos.map(d=>({ name:d.name, type:'demo', path:d.path, status:d.status }))
  ];
  if(tag) tag.textContent = `${all.length} mục`;
  if(!all.length){
    el.innerHTML = `<div class="empty">Chưa có kế hoạch<br><span class="small">Chạy <span class="kbd">/harness</span> để tạo kế hoạch đầu tiên</span></div>`;
    return;
  }
  const typeIcon = {
    plan: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M10 13H8"/><path d="M16 17H8"/></svg>',
    demo: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z"/></svg>',
    'tin AI': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1m2 13a2 2 0 0 1-2-2V7m2 13a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2"/><path d="M7 8h6"/><path d="M7 12h6"/><path d="M7 16h6"/></svg>',
    'so sánh': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>',
  };
  el.innerHTML = all.map(x=>`
    <div class="plan-item">
      <div style="min-width:0">
        <div style="font-weight:700;font-size:13px;display:flex;align-items:center;gap:6px;min-width:0">${typeIcon[x.type]||''} <span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(x.name)}</span></div>
        <div class="mono" style="color:var(--color-neutral-500);font-size:11px;word-break:break-all">${escapeHtml(x.path)}</div>
      </div>
      <span class="tag ${x.status==='ok'?'tag-on':''}" style="flex-shrink:0">${x.type==='demo'?'bản thử':'kế hoạch'}</span>
    </div>
  `).join('');
}

// ---------- Health ----------
function healthChecksHtml(checks){
  return (checks||[]).map(c=>`<li style="padding:6px 0;border-bottom:1px solid #f1f5f9;display:flex;gap:8px"><span aria-hidden="true" style="color:var(--color-success)">✓</span><span>${escapeHtml(c)}</span></li>`).join('');
}

function healthStatusText(h){
  if(h.status==='ok') return 'Hệ thống ổn định';
  if(h.status==='warn') return 'Cần chú ý';
  return h.status ? escapeHtml(h.status) : 'Không rõ';
}

function bindCopyStatusJson(data){
  const btn = $('#btnCopyJson');
  if(!btn) return;
  btn.addEventListener('click', async ()=>{
    try{
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      toast('Đã sao chép status.json');
    }catch{
      toast('Không sao chép được — hãy mở status.json thủ công');
    }
  }, { once:true });
}

function renderHealth(data){
  const h = data.health || {};
  const sub = $('#healthSub');
  const badge = $('#healthBadge');
  const card = $('#healthCard');
  if(!card) return;
  if(sub) sub.textContent = h.lastCheck ? `Kiểm tra lần cuối: ${fmtTime(h.lastCheck)}` : 'Chưa có lần kiểm tra';
  if(badge) badge.innerHTML = healthBadge(h.status||'ok');
  const checks = healthChecksHtml(h.checks);
  const errors = h.errors || 0;
  const statusText = healthStatusText(h);
  card.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap">
      ${healthBadge(h.status||'ok')}
      <span style="font-weight:700;font-size:14px">${statusText}</span>
      <span style="margin-left:auto;color:var(--color-neutral-500);font-size:12px" aria-label="${errors} lỗi">${errors} lỗi</span>
    </div>
    <ul style="margin:0;padding:0;list-style:none;font-size:13px;line-height:1.6">${checks || '<li style="color:var(--color-neutral-400)">Chưa có mục kiểm tra</li>'}</ul>
    <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap">
      <a class="btn btn-ghost btn-sm" href="./status.json" target="_blank" rel="noopener">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
        Xem status.json
      </a>
      <button class="btn btn-ghost btn-sm" id="btnCopyJson" type="button">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v3"/></svg>
        Sao chép JSON
      </button>
    </div>
  `;
  bindCopyStatusJson(data);
}

// ---------- Pages ----------
const pageIcons14 = {
  demo: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z"/></svg>',
  'tin AI': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1m2 13a2 2 0 0 1-2-2V7m2 13a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2"/><path d="M7 8h6"/><path d="M7 12h6"/><path d="M7 16h6"/></svg>',
  'so sánh': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>',
  trang: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M10 13H8"/><path d="M16 17H8"/></svg>',
};

function pageEntryHtml(e){
  const href = /^https?:\/\//.test(e.path) ? escapeHtml(e.path) : './' + escapeHtml(e.path);
  const rel = e.path.startsWith('http') ? 'target="_blank" rel="noopener"' : '';
  return `
        <a class="page-link" href="${href}" ${rel}>
          <div style="min-width:0">
            <div style="font-weight:700;font-size:13px;display:flex;align-items:center;gap:6px;min-width:0">
              ${pageIcons14[e.type]||pageIcons14['trang']} <span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(e.title||e.path)}</span>
            </div>
            <div class="mono" style="color:var(--color-neutral-500);font-size:11px;word-break:break-all">${escapeHtml(e.path)}</div>
          </div>
          <span class="tag" style="flex-shrink:0">${escapeHtml(e.type||'trang')}</span>
        </a>
      `;
}

function renderPages(data){
  const p = data.pages || {};
  const entries = p.entries || [];
  const card = $('#pagesCard');
  const tag = $('#pagesTag');
  if(!card) return;
  if(tag) tag.textContent = `${entries.length} trang`;
  const body = entries.length
    ? entries.map(pageEntryHtml).join('')
    : '<div class="empty">Chưa có trang nào<br><span class="small">Thêm tệp vào <span class="kbd">www/</span> để tạo trang mới</span></div>';
  card.innerHTML = `
    <div style="color:var(--color-neutral-500);font-size:13px;margin-bottom:12px;line-height:1.6">
      Thư mục gốc: <span class="kbd">${escapeHtml(p.root||'www')}</span> · Workflow: <span class="kbd">${escapeHtml(p.workflow||'.github/workflows/pages.yml')}</span>
    </div>
    <div style="display:grid;gap:8px;grid-template-columns:minmax(0,1fr)">${body}</div>
    <div style="margin-top:12px;color:var(--color-neutral-500);font-size:12px;line-height:1.5">${escapeHtml(p.note||'Mọi tệp mới trong www/ sẽ tự động được triển khai lên GitHub Pages (workflow tải toàn bộ thư mục www).')}</div>
  `;
}

// ---------- Hero ----------
function heroHealthHtml(h){
  if(!h) return '—';
  const label = h.status==='ok' ? 'Ổn định' : h.status==='warn' ? 'Cảnh báo' : h.status==='fail' ? 'Sự cố' : h.status;
  return `${healthBadge(h.status)} <span style="margin-left:6px">${escapeHtml(label)}</span>`;
}

function renderHero(data){
  const gen = $('#metaGenerated');
  const by = $('#metaBy');
  const pipe = $('#metaPipeline');
  const health = $('#metaHealth');
  if(gen) gen.textContent = data.generatedAt ? fmtTime(data.generatedAt) : '—';
  if(by) by.textContent = data.generatedBy || 'YUNIE';
  if(pipe) pipe.textContent = data.harness?.pipeline || 'Idea → … → Done';
  if(health){
    if(data.health){
      health.innerHTML = heroHealthHtml(data.health);
    } else {
      health.textContent = '—';
    }
  }
}

// ---------- Pipeline Modal ----------
let lastFocusBeforeModal = null;
function openPipeline(){
  const modal = $('#pipelineModal');
  if(!modal) return;
  lastFocusBeforeModal = document.activeElement;
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden','false');
  document.body.style.overflow = 'hidden';
  // focus close button
  const panel = modal.querySelector('.modal-panel');
  const closeBtn = $('#btnClosePipeline');
  if(closeBtn) closeBtn.focus();
  else if(panel) panel.focus();
  // trap focus
  document.addEventListener('keydown', trapFocus);
}

function closePipeline(){
  const modal = $('#pipelineModal');
  if(!modal) return;
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden','true');
  document.body.style.overflow = '';
  document.removeEventListener('keydown', trapFocus);
  if(lastFocusBeforeModal && typeof lastFocusBeforeModal.focus === 'function'){
    lastFocusBeforeModal.focus();
  }
}

function trapFocus(e){
  const modal = $('#pipelineModal');
  if(!modal || !modal.classList.contains('is-open')) return;
  if(e.key === 'Escape'){
    e.preventDefault();
    closePipeline();
    return;
  }
  if(e.key !== 'Tab') return;
  const focusable = [...modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter(el=> !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true');
  if(!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if(e.shiftKey){
    if(document.activeElement === first){
      e.preventDefault();
      last.focus();
    }
  } else {
    if(document.activeElement === last){
      e.preventDefault();
      first.focus();
    }
  }
}

function bindPipelineTabs(ptabs, ppanels){
  ptabs.forEach(tab=>{
    tab.addEventListener('click', ()=>{
      const target = tab.dataset.ptab;
      ptabs.forEach(t=>{
        const isActive = t.dataset.ptab === target;
        t.classList.toggle('is-active', isActive);
        t.setAttribute('aria-selected', String(isActive));
      });
      ppanels.forEach(p=>{
        const isActive = p.id === `ptab-${target}`;
        p.classList.toggle('is-active', isActive);
        if(isActive) p.removeAttribute('hidden');
        else p.setAttribute('hidden', '');
      });
    });
  });
}

function wirePipelineButtons(){
  const pairs = [
    [$('#btnPipeline'), openPipeline],
    [$('#btnPipelineHero'), openPipeline],
    [$('#btnClosePipeline'), closePipeline],
    [$('#btnClosePipeline2'), closePipeline],
    [$('#pipelineOverlay'), closePipeline],
  ];
  pairs.forEach(([el, fn])=>{ if(el) el.addEventListener('click', fn); });
}

function bindPipeline(){
  const modal = $('#pipelineModal');
  wirePipelineButtons();
  // pipeline tabs: /harness · /fixbug · Gates & Skills
  const ptabs = $$('.ptab', modal || document);
  const ppanels = $$('.ptab-panel', modal || document);
  if(ptabs.length && ppanels.length && !bindPipeline._ptabsBound){
    bindPipelineTabs(ptabs, ppanels);
    bindPipeline._ptabsBound = true;
  }
  // close on [data-close] click
  if(modal){
    modal.addEventListener('click', (e)=>{
      if(e.target.dataset.close === 'true') closePipeline();
    });
  }
}


// ---------- YUNIE Lore ----------
function yunieDefaultLetters(){
  return [
    { letter:'Y', word:'Yielding', vi:'Kiên nhẫn', desc:'Không bỏ cuộc giữa pipeline, theo tới Done', icon:'🌱' },
    { letter:'U', word:'Understanding', vi:'Thấu hiểu', desc:'Hiểu toàn bộ registry, presets, plans, www/', icon:'🧠' },
    { letter:'N', word:'Navigating', vi:'Dẫn đường', desc:'Dẫn qua Explore \u2192 Clarify \u2192 \u2026 \u2192 Verify không lạc', icon:'🧭' },
    { letter:'I', word:'Intelligent', vi:'Thông minh', desc:'Thông minh nhưng không đoán bừa — luôn verify', icon:'✨' },
    { letter:'E', word:'Executing', vi:'Thực thi', desc:'Làm tới nơi, deploy tới GitHub Pages luôn', icon:'⚡' },
  ];
}

function yunieLetterCardsHtml(letters){
  return letters.map(l=>`
      <div class="yunie-letter-card" role="listitem" tabindex="0" aria-label="${escapeHtml(l.letter)} — ${escapeHtml(l.word)} — ${escapeHtml(l.vi)}">
        <div class="yunie-letter-head">
          <div class="yunie-letter-badge" aria-hidden="true">${escapeHtml(l.letter)}</div>
          <div>
            <div class="yunie-letter-word">${escapeHtml(l.word)}</div>
            <div class="yunie-letter-vi">${escapeHtml(l.vi)}</div>
          </div>
          <span class="yunie-letter-icon" aria-hidden="true">${l.icon||''}</span>
        </div>
        <p class="yunie-letter-desc">${escapeHtml(l.desc||'')}</p>
      </div>
    `).join('');
}

function renderYunieHeader(y, fullname, pronounce, slogan){
  const fnEl = document.getElementById('yunieFullname');
  if(fnEl) fnEl.textContent = fullname;
  const prEl = document.getElementById('yuniePronounce');
  if(prEl){
    if(pronounce.includes('You & I')) prEl.innerHTML = 'Yu-ni = <strong>You & I</strong> — Bạn và Mình cùng build product';
    else prEl.textContent = pronounce;
  }
  const slEl = document.getElementById('yunieSlogan');
  if(slEl) slEl.textContent = '\u201C' + slogan + '\u201D';
  const sub = document.getElementById('yunieSub');
  if(sub) sub.textContent = fullname + ' \u00B7 ' + pronounce;
  const tag = document.getElementById('yunieTag');
  if(tag) tag.textContent = ((y.letters||[]).length || 5) + ' chữ \u00B7 3 bản giới thiệu';
}

function renderYunieLetters(y){
  const lettersEl = document.getElementById('yunieLetters');
  if(!lettersEl) return;
  const letters = y.letters && y.letters.length ? y.letters : yunieDefaultLetters();
  lettersEl.innerHTML = yunieLetterCardsHtml(letters);
}

function bindYunieAliasCopy(aliasesEl){
  aliasesEl.querySelectorAll('.yunie-copy-alias').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      const txt = btn.getAttribute('data-copy') || '';
      try{ await navigator.clipboard.writeText(txt); toast('Đã copy: ' + txt.slice(0,32) + '…'); }catch{ toast('Không copy được'); }
    });
  });
}

function renderYunieAliases(y){
  const aliasesEl = document.getElementById('yunieAliases');
  if(!aliasesEl) return;
  const aliases = y.aliases || [];
  if(!aliases.length){
    aliasesEl.innerHTML = '<div class="empty small">Chưa có alias</div>';
    return;
  }
  aliasesEl.innerHTML = aliases.map(a=>`
        <div class="yunie-alias-item">
          <div style="min-width:0">
            <div style="font:700 12px var(--font-sans)">${escapeHtml(a.label)}</div>
            <div style="font:600 13px var(--font-sans);margin-top:2px">${escapeHtml(a.value)}</div>
            <div class="small muted" style="margin-top:2px">${escapeHtml(a.hint||'')}</div>
          </div>
          <button class="btn btn-ghost btn-sm yunie-copy-alias" type="button" data-copy="${escapeHtml(a.value)}" aria-label="Copy ${escapeHtml(a.label)}">📋</button>
        </div>
      `).join('');
  bindYunieAliasCopy(aliasesEl);
}

function yunieIntroLabel(key){
  return key==='short' ? 'ngắn' : key==='full' ? 'đầy đủ' : 'vui 🎉';
}

function setYunieIntro(y, key){
  const intros = y.intros || {};
  const introText = document.getElementById('yunieIntroText');
  const introTag = document.getElementById('yunieIntroTag');
  if(introText) introText.textContent = intros[key] || intros.short || '—';
  if(introTag) introTag.textContent = yunieIntroLabel(key);
  document.querySelectorAll('.yunie-tabs [data-intro]').forEach(b=>{
    const isActive = b.dataset.intro===key;
    b.classList.toggle('is-active', isActive);
    b.setAttribute('aria-selected', String(isActive));
  });
}

function bindYunieIntroTabs(y){
  document.querySelectorAll('.yunie-tabs [data-intro]').forEach(btn=>{
    btn.addEventListener('click', ()=> setYunieIntro(y, btn.dataset.intro));
  });
}

function bindYunieCopyIntro(){
  document.getElementById('btnCopyIntro')?.addEventListener('click', async ()=>{
    const txt = document.getElementById('yunieIntroText')?.textContent || '';
    try{ await navigator.clipboard.writeText(txt); toast('Đã copy giới thiệu'); }catch{ toast('Không copy được'); }
  });
}

function bindYunieSpeakIntro(){
  document.getElementById('btnSpeakIntro')?.addEventListener('click', ()=>{
    const txt = document.getElementById('yunieIntroText')?.textContent || '';
    if(!txt || txt==='—') return toast('Chưa có nội dung');
    if(!('speechSynthesis' in window)) return toast('Trình duyệt không hỗ trợ đọc');
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(txt);
    u.lang = 'vi-VN'; u.rate = 0.95;
    speechSynthesis.speak(u);
    toast('🔊 Đang đọc…');
  });
}

function bindYunieCopyShort(y, fullname, slogan){
  document.getElementById('btnYunieCopy')?.addEventListener('click', async ()=>{
    const txt = (y.intros||{}).short || (fullname + ' — ' + slogan);
    try{ await navigator.clipboard.writeText(txt); toast('Đã copy giới thiệu ngắn'); }catch{ toast('Không copy được'); }
  });
}

function bindYunieSurprise(y){
  document.getElementById('btnYunieSurprise')?.addEventListener('click', ()=>{
    const keys = ['short','full','fun'];
    const rnd = keys[Math.floor(Math.random()*keys.length)];
    setYunieIntro(y, rnd);
    const aliasPool = y.aliases || [];
    const pick = aliasPool.length ? aliasPool[Math.floor(Math.random()*aliasPool.length)].value : 'You & I!';
    toast('🎲 Bản ' + (rnd==='short'?'ngắn':rnd==='full'?'đầy đủ':'vui') + ' — ' + pick.slice(0,40));
    document.getElementById('yunieIntrosCard')?.scrollIntoView({behavior:'smooth', block:'center'});
  });
}

function renderYunie(data){
  const y = data.yunie || {};
  const fullname = y.fullName || 'Your Unified Navigator for Intelligent Execution';
  const pronounce = y.pronunciation || 'Yu-ni = You & I';
  const slogan = y.slogan || 'Hiểu hệ thống. Làm thay bạn. Trực 24/7.';
  renderYunieHeader(y, fullname, pronounce, slogan);
  renderYunieLetters(y);
  renderYunieAliases(y);
  if(!renderYunie._bound){
    bindYunieIntroTabs(y);
    bindYunieCopyIntro();
    bindYunieSpeakIntro();
    bindYunieCopyShort(y, fullname, slogan);
    bindYunieSurprise(y);
    renderYunie._bound = true;
  }
  setYunieIntro(y, 'short');
}

// ---------- Governance (học OpenBot) ----------
function renderGovTag(audit, policy, cred){
  const tag = $('#governanceTag');
  if(!tag) return;
  const total = audit.total || 0;
  const refused = audit.refused || 0;
  const status = policy.status === 'error' ? 'lỗi policy' : refused ? `${refused} refused` : `${total} events`;
  tag.textContent = `audit ${total} · policy ${policy.deny}/${policy.allow} · ${cred.count} keys`;
  tag.title = status;
}

function renderGovAuditCard(audit){
  const auditCard = $('#govAuditCard');
  if(!auditCard) return;
  const last = audit.lastTs ? fmtTime(audit.lastTs) : '—';
  auditCard.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <span style="width:32px;height:32px;border-radius:10px;display:grid;place-items:center;background:#6366f1;color:white;flex-shrink:0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M10 13H8"/><path d="M16 17H8"/></svg>
        </span>
        <div style="min-width:0">
          <div style="font:700 13px var(--font-sans)">Audit Trail</div>
          <div style="font:500 11px var(--font-sans);color:var(--color-neutral-500)">append-only JSONL</div>
        </div>
        <span class="tag ${audit.total?'tag-on':''}" style="margin-left:auto">${audit.total} events</span>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
        <span class="tag tag-on">● ${audit.permitted||0} permitted</span>
        <span class="tag ${audit.refused?'tag-warn':''}">● ${audit.refused||0} refused</span>
        <span class="tag ${audit.failed?'tag-off':''}">● ${audit.failed||0} failed</span>
      </div>
      <div style="font:500 11px var(--font-mono);color:var(--color-neutral-500)">last: ${escapeHtml(last)}</div>
      <div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap">
        <span class="kbd">audit.mjs stats</span>
        <span class="kbd">audit.mjs tail</span>
      </div>
    `;
}

function renderGovPolicyCard(policy){
  const policyCard = $('#govPolicyCard');
  if(!policyCard) return;
  const ok = policy.status === 'ok';
  policyCard.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <span style="width:32px;height:32px;border-radius:10px;display:grid;place-items:center;background:${ok?'#16a34a':'#dc2626'};color:white;flex-shrink:0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22a7 7 0 0 0 7-7c0-3.5-2.5-6-7-10-4.5 4-7 6.5-7 10a7 7 0 0 0 7 7z"/></svg>
        </span>
        <div style="min-width:0">
          <div style="font:700 13px var(--font-sans)">Policy Gate</div>
          <div style="font:500 11px var(--font-sans);color:var(--color-neutral-500)">deny trước allow · fail-closed</div>
        </div>
        <span class="tag ${ok?'tag-on':'tag-off'}" style="margin-left:auto">${ok?'● ok':'● lỗi'}</span>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
        <span class="tag tag-warn">${policy.deny||0} deny</span>
        <span class="tag tag-on">${policy.allow||0} allow</span>
        <span class="tag">v${policy.version||1}</span>
      </div>
      <div style="font:500 11px var(--font-mono);color:var(--color-neutral-500)">${policy.error ? escapeHtml(policy.error.slice(0,80)) : 'CEL-lite · 4 vars: tool/target/actor/intent'}</div>
      <div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap">
        <span class="kbd">policy-check.mjs --check</span>
      </div>
    `;
}

function renderGovCredCard(cred){
  const credCard = $('#govCredCard');
  if(!credCard) return;
  const ok = cred.status === 'ok';
  credCard.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <span style="width:32px;height:32px;border-radius:10px;display:grid;place-items:center;background:${ok?'#0ea5e9':'#dc2626'};color:white;flex-shrink:0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a3 3 0 0 1 5-3 3 3 0 0 1 5 3v4"/><circle cx="12" cy="16" r="1" fill="white" stroke="none"/></svg>
        </span>
        <div style="min-width:0">
          <div style="font:700 13px var(--font-sans)">Credentials</div>
          <div style="font:500 11px var(--font-sans);color:var(--color-neutral-500)">AES-256-GCM · never logged</div>
        </div>
        <span class="tag ${ok?'tag-on':'tag-off'}" style="margin-left:auto">${cred.enc?'● enc':'● plain'}</span>
      </div>
      <div style="font:700 22px var(--font-display);letter-spacing:-.02em">${cred.count||0}</div>
      <div style="font:600 11px var(--font-sans);letter-spacing:.06em;text-transform:uppercase;color:var(--color-neutral-500)">keys · redacted in audit</div>
      <div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap">
        <span class="kbd">credentials.mjs list</span>
      </div>
    `;
}

function govDecisionCls(decision){
  return decision === 'permitted' ? 'tag-on' : decision === 'refused' ? 'tag-warn' : 'tag-off';
}

function govTailDecTag(e){
  if(e.decision === 'permitted') return '<span class="tag tag-on">permitted</span>';
  if(e.decision === 'refused') return '<span class="tag tag-warn">refused</span>';
  return '<span class="tag tag-off">failed</span>';
}

function govTailRowHtml(e){
  const rule = e.rule ? `<span class="mono" style="font-size:11px">${escapeHtml(e.rule)}</span>` : '<span style="color:var(--color-neutral-400)">—</span>';
  return `<tr><td class="mono" style="font-size:11px;white-space:nowrap">${escapeHtml(fmtTime(e.ts))}</td><td>${govTailDecTag(e)}</td><td class="mono" style="font-size:11px">${escapeHtml(e.tool||'')}</td><td class="mono" style="font-size:11px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${escapeHtml(e.target||'')}">${escapeHtml((e.target||'').slice(0,40))}</td><td>${rule}</td></tr>`;
}

function govTailCardHtml(e){
  return `<div class="reg-card" tabindex="0" role="article" aria-label="${escapeHtml(e.decision)} ${escapeHtml(e.tool)}">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px">
            <span class="tag ${govDecisionCls(e.decision)}">${escapeHtml(e.decision)}</span>
            <span class="mono" style="font-size:11px;color:var(--color-neutral-500)">${escapeHtml(fmtTime(e.ts))}</span>
          </div>
          <div style="font:600 12px var(--font-mono)">${escapeHtml(e.tool||'')} → ${escapeHtml((e.target||'').slice(0,40))}</div>
          <div style="font:500 11px var(--font-mono);color:var(--color-neutral-500);margin-top:4px">rule: ${e.rule ? escapeHtml(e.rule) : '—'} · ${escapeHtml(e.actor||'')}</div>
        </div>`;
}

function renderGovTailEmpty(tailBody, tailCards, tailEmpty, tailWrap){
  if(tailBody) tailBody.innerHTML = `<tr><td colspan="5"><div class="empty" style="border:none;padding:12px">Chưa có audit — chạy <span class="kbd">audit.mjs log</span></div></td></tr>`;
  if(tailCards) tailCards.innerHTML = '';
  if(tailEmpty) tailEmpty.style.display = 'block';
  if(tailWrap) tailWrap.style.display = 'none';
}

function renderGovTail(audit){
  const tail = audit.tail || [];
  const tailBody = $('#govTailBody');
  const tailCards = $('#govTailCards');
  const tailEmpty = $('#govTailEmpty');
  const tailTag = $('#govTailTag');
  const tailWrap = $('#govTailWrap');
  if(tailTag) tailTag.textContent = tail.length ? `${tail.length} dòng` : '0 dòng';
  if(!tail.length){
    renderGovTailEmpty(tailBody, tailCards, tailEmpty, tailWrap);
    return;
  }
  if(tailEmpty) tailEmpty.style.display = 'none';
  if(tailWrap) tailWrap.style.display = '';
  if(tailBody) tailBody.innerHTML = tail.map(govTailRowHtml).join('');
  if(tailCards) tailCards.innerHTML = tail.map(govTailCardHtml).join('');
}

function renderGovernance(data){
  const g = data.governance || { audit:{total:0,permitted:0,refused:0,failed:0,lastTs:null,tail:[]}, policy:{version:1,deny:0,allow:0,status:'ok'}, credentials:{count:0,status:'ok',enc:false} };
  const audit = g.audit || {total:0,permitted:0,refused:0,failed:0,lastTs:null,tail:[]};
  const policy = g.policy || {version:1,deny:0,allow:0,status:'ok'};
  const cred = g.credentials || {count:0,status:'ok',enc:false};
  renderGovTag(audit, policy, cred);
  renderGovAuditCard(audit);
  renderGovPolicyCard(policy);
  renderGovCredCard(cred);
  renderGovTail(audit);
}

// ---------- Platform (học OpenBot Phase 2) ----------
function platVendorRows(vendorList){
  if(!vendorList.length) return '<div style="font:500 11px var(--font-mono);color:var(--color-neutral-500)">Chưa có vendor nào trong catalog</div>';
  return vendorList.map(v => `
        <div style="display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid var(--color-neutral-200)">
          <strong style="font:600 12px var(--font-sans);min-width:0">${escapeHtml(v.name)}</strong>
          <span class="tag" style="margin-left:auto;flex-shrink:0">${escapeHtml(v.scope)}</span>
          <span class="tag" style="flex-shrink:0">${v.tools} tools</span>
        </div>`).join('');
}

function platGrantRows(grantsByAgent){
  const agents = Object.keys(grantsByAgent);
  if(!agents.length) return '';
  return agents.map(agent => `
        <div style="display:flex;align-items:center;gap:6px;padding:4px 0">
          <strong style="font:600 12px var(--font-sans)">${escapeHtml(agent)}</strong>
          <span style="font:500 11px var(--font-mono);color:var(--color-neutral-500);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml((grantsByAgent[agent]||[]).join(', ') || '—')}</span>
        </div>`).join('');
}

function renderPlatAgents(agents){
  const agentCard = $('#platAgentCard');
  if(!agentCard) return;
  agentCard.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <span style="width:32px;height:32px;border-radius:10px;display:grid;place-items:center;background:#6366f1;color:white;flex-shrink:0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M12 11V7a3 3 0 0 1 3-3h1"/><path d="M12 7a3 3 0 0 0-3-3H8"/></svg>
        </span>
        <div style="min-width:0">
          <div style="font:700 13px var(--font-sans)">AG-UI Agents</div>
          <div style="font:500 11px var(--font-sans);color:var(--color-neutral-500)">bring your own agent</div>
        </div>
        <span class="tag tag-on" style="margin-left:auto">${agents.total} agents</span>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
        <span class="tag tag-on">${agents.builtIn||0} built-in</span>
        <span class="tag ${agents.remote?'tag-warn':''}">${agents.remote||0} remote</span>
      </div>
      <div style="font:500 11px var(--font-mono);color:var(--color-neutral-500)">agents.yaml · AGENT_ENDPOINT_ALLOWED_HOSTS</div>
      <div style="margin-top:10px"><span class="kbd">agent-registry.mjs list</span></div>
    `;
}

function renderPlatMcp(mcp){
  const mcpCard = $('#platMcpCard');
  if(!mcpCard) return;
  const vendorList = Array.isArray(mcp.list) ? mcp.list : [];
  const grantsByAgent = mcp.grantsByAgent && typeof mcp.grantsByAgent === 'object' ? mcp.grantsByAgent : {};
  const vendorRows = platVendorRows(vendorList);
  const grantRows = platGrantRows(grantsByAgent);
  mcpCard.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <span style="width:32px;height:32px;border-radius:10px;display:grid;place-items:center;background:#0ea5e9;color:white;flex-shrink:0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22a7 7 0 0 0 7-7c0-3.5-2.5-6-7-10-4.5 4-7 6.5-7 10a7 7 0 0 0 7 7z"/></svg>
        </span>
        <div style="min-width:0">
          <div style="font:700 13px var(--font-sans)">Governed MCP</div>
          <div style="font:500 11px var(--font-sans);color:var(--color-neutral-500)">catalog + grants per agent</div>
        </div>
        <span class="tag tag-on" style="margin-left:auto">${mcp.vendors||0} vendors</span>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
        <span class="tag">${mcp.vendors||0} vendors</span>
        <span class="tag tag-on">${mcp.grants||0} grants</span>
      </div>
      ${vendorList.length ? `<div style="margin:8px 0;padding-top:8px;border-top:1px solid var(--color-neutral-200)"><div style="font:600 11px var(--font-sans);color:var(--color-neutral-500);margin-bottom:4px">Vendors</div>${vendorRows}</div>` : ''}
      ${grantRows ? `<div style="margin:8px 0;padding-top:8px;border-top:1px solid var(--color-neutral-200)"><div style="font:600 11px var(--font-sans);color:var(--color-neutral-500);margin-bottom:4px">Grants per agent</div>${grantRows}</div>` : ''}
      <div style="font:500 11px var(--font-mono);color:var(--color-neutral-500)">unknown tool = write → refused</div>
      <div style="margin-top:10px"><span class="kbd">mcp-check.mjs --tool google-drive</span></div>
    `;
}

function renderPlatComp(comps){
  const compCard = $('#platCompCard');
  if(!compCard) return;
  compCard.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <span style="width:32px;height:32px;border-radius:10px;display:grid;place-items:center;background:#f59e0b;color:white;flex-shrink:0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
        </span>
        <div style="min-width:0">
          <div style="font:700 13px var(--font-sans)">Components</div>
          <div style="font:500 11px var(--font-sans);color:var(--color-neutral-500)">generative UI · gallery</div>
        </div>
        <span class="tag tag-on" style="margin-left:auto">${comps.total||0} comps</span>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
        <span class="tag tag-on">${comps.published||0} published</span>
        <span class="tag">${(comps.total||0)-(comps.published||0)} draft</span>
      </div>
      <div style="font:500 11px var(--font-mono);color:var(--color-neutral-500)">published + not withheld</div>
      <div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap"><a class="kbd" href="./components/playground.html" style="text-decoration:none">playground.html</a> <span class="kbd">component-check.mjs</span></div>
    `;
}

function renderPlatRoutine(routines){
  const routineCard = $('#platRoutineCard');
  if(!routineCard) return;
  routineCard.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <span style="width:32px;height:32px;border-radius:10px;display:grid;place-items:center;background:#16a34a;color:white;flex-shrink:0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
        </span>
        <div style="min-width:0">
          <div style="font:700 13px var(--font-sans)">Routines</div>
          <div style="font:500 11px var(--font-sans);color:var(--color-neutral-500)">schedule · floor 15m · cap 20</div>
        </div>
        <span class="tag ${routines.enabled?'tag-on':''}" style="margin-left:auto">${routines.total||0} routines</span>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
        <span class="tag tag-on">${routines.enabled||0} enabled</span>
        <span class="tag">${(routines.total||0)-(routines.enabled||0)} disabled</span>
      </div>
      <div style="font:500 11px var(--font-mono);color:var(--color-neutral-500)">10 fails → off</div>
      <div style="margin-top:10px"><span class="kbd">routine.mjs add --cron "0 9 * * *"</span></div>
    `;
}

function renderPlatform(data){
  const p = data.platform || { agents:{total:0,builtIn:0,remote:0}, mcp:{vendors:0,grants:0}, components:{total:0,published:0}, routines:{total:0,enabled:0} };
  const agents = p.agents || {total:0,builtIn:0,remote:0};
  const mcp = p.mcp || {vendors:0,grants:0};
  const comps = p.components || {total:0,published:0};
  const routines = p.routines || {total:0,enabled:0};
  const tag = $('#platformTag');
  if(tag) tag.textContent = `${agents.total} agents · ${mcp.vendors} mcp · ${comps.total} comps · ${routines.total} routines`;
  renderPlatAgents(agents);
  renderPlatMcp(mcp);
  renderPlatComp(comps);
  renderPlatRoutine(routines);
}

function bindTabs(){
  const tabs = $$('.tabs .tab');
  const panels = $$('.tab-panel');
  if(!tabs.length || !panels.length) return;
  tabs.forEach(tab=>{
    tab.addEventListener('click', ()=>{
      const target = tab.dataset.tab;
      tabs.forEach(t=>{
        const isActive = t.dataset.tab === target;
        t.classList.toggle('is-active', isActive);
        t.setAttribute('aria-selected', String(isActive));
      });
      panels.forEach(p=>{
        const isActive = p.id === `tab-${target}`;
        p.classList.toggle('is-active', isActive);
        p.hidden = !isActive;
      });
    });
  });
}

function bindSectionNav(){
  const links = $$('.section-nav-link');
  if(!links.length) return;
  const sections = links.map(a=> document.querySelector(a.getAttribute('href'))).filter(Boolean);
  const observer = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        const id = entry.target.id;
        links.forEach(a=> a.classList.toggle('is-active', a.getAttribute('href') === `#${id}`));
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
  sections.forEach(s=> observer.observe(s));
}

// ---------- Boot ----------
async function boot(){
  const statsEl = $('#stats');
  // KN-005 fresh eyes: file:// detect — user mới double-click index.html sẽ thấy ngay
  if(location.protocol === 'file:'){
    toast('⚠️ Đang mở bằng file:// — hãy chạy npx serve www rồi mở http://localhost:3000');
    console.warn('file:// detected — fetch status.json sẽ bị CORS. Chạy npx serve www');
  }
  try{
    const data = await loadStatus();
    renderHero(data);
    renderStats(data);
    renderRegistry(data);
    renderPresets(data);
    renderPlans(data);
    renderHealth(data);
    renderPages(data);
    renderGovernance(data);
    renderPlatform(data);
    renderYunie(data);
    bindTabs();
    bindSectionNav();
  }catch(e){
    console.error(e);
    if(statsEl){
      statsEl.innerHTML = `<div class="card card-pad" style="grid-column:1/-1"><div class="error-card" role="alert"><strong>Không tải được status.json</strong><br><span class="mono" style="font-size:11px;word-break:break-all">${escapeHtml(String(e.message||e))}</span><br><span style="font-size:12px;margin-top:8px;display:block">Chạy <span class="kbd">npx serve www</span> thay vì <span class="kbd">file://</span> (lỗi CORS), hoặc đẩy lên GitHub Pages để xem.</span><div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap"><a class="btn btn-ghost btn-sm" href="./status.json" target="_blank" rel="noopener">Mở status.json</a><button class="btn btn-primary btn-sm" onclick="location.reload()">Thử lại</button></div></div></div>`;
    }
    const regBody = $('#registryBody');
    if(regBody) regBody.innerHTML = `<tr><td colspan="4"><div class="error-card" role="alert">Không tải được registry — xem console</div></td></tr>`;
    const cards = $('#registryCards');
    if(cards) cards.innerHTML = `<div class="error-card" role="alert">Không tải được registry — ${escapeHtml(String(e.message||e))}</div>`;
    toast('Không tải được status.json — xem console');
  }
}

$('#btnRefresh')?.addEventListener('click', async ()=>{
  toast('Đang làm mới…');
  await boot();
  toast('Đã làm mới');
});
$('#btnCheck')?.addEventListener('click', async ()=>{
  toast('YUNIE đang kiểm tra… (mở Copilot Chat và nhập: yunie kiểm tra hệ thống)');
  await boot();
});

function isTypingInInput(){
  const t = document.activeElement?.tagName;
  return t === 'INPUT' || t === 'TEXTAREA';
}

function focusSearchIfIdle(e, isModalOpen){
  if(e.key !== '/') return;
  if(e.ctrlKey || e.metaKey || isModalOpen || isTypingInInput()) return;
  e.preventDefault();
  $('#registrySearch')?.focus();
}

function handleGlobalKeydown(e){
  const modal = $('#pipelineModal');
  const isModalOpen = modal && modal.classList.contains('is-open');
  if(isModalOpen && e.key === 'Escape') return;
  focusSearchIfIdle(e, isModalOpen);
  if(e.key === 'Escape' && document.activeElement?.id === 'registrySearch'){
    document.activeElement.blur();
  }
}

document.addEventListener('keydown', handleGlobalKeydown);

bindPipeline();
boot();
