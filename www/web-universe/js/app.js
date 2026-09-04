// WEB UNIVERSE — app.js — App Runtime (Core Runtime Part 1)
import { createEventBus } from './event-bus.js';
import { createState } from './state.js';
import { createLogger } from './logger.js';
import { createPermissionManager } from './permission-manager.js';
import { createResourceManager } from './resource-manager.js';
import { createWindowManager } from './window-manager.js';
import { createWorkspaceManager } from './workspace-manager.js';
import { createModuleManager } from './module-manager.js';

const START_TS = performance.now();

// --- Core instances ---
const eventBus = createEventBus();
const logger = createLogger({ level: 'info', devMode: false });
const state = createState({ eventBus, logger });
const permissionManager = createPermissionManager({ state, eventBus, logger });
const resourceManager = createResourceManager({ state, eventBus, logger });
const windowManager = createWindowManager({ state, eventBus, logger });
const workspaceManager = createWorkspaceManager({ state, logger });
const moduleManager = createModuleManager({ state, eventBus, logger, windowManager });

// --- Module Catalog (12) ---
const CATALOG = [
  { id: 'text-editor', name: 'Text Editor', version: '1.0.0', category: 'text', description: 'Plain text editor — word/char/line count, autosave, find/replace.', dependencies: [], permissions: [], lazy: true, icon: '📝' },
  { id: 'canvas-lab', name: 'Canvas Lab', version: '1.0.0', category: 'graphics', description: 'Canvas 2D — draw, shapes, gradients, particles, filters.', dependencies: [], permissions: [], lazy: true, icon: '🎨' },
  { id: 'json-tool', name: 'JSON Tool', version: '1.0.0', category: 'devtools', description: 'Formatter, validator, tree viewer, search, copy path.', dependencies: [], permissions: [], lazy: true, icon: '🧩' },
  { id: 'markdown', name: 'Markdown', version: '1.0.0', category: 'text', description: 'Markdown editor + live preview, heading navigation, export HTML/Markdown.', dependencies: [], permissions: [], lazy: true, icon: '📄' },
  { id: 'code-playground', name: 'Code Playground', version: '1.0.0', category: 'text', description: 'HTML/CSS/JS live preview + console, error display, reset.', dependencies: [], permissions: [], lazy: true, icon: '💻' },
  { id: 'diff', name: 'Diff', version: '1.0.0', category: 'devtools', description: 'Text/JSON diff — side-by-side view, stats, swap, copy.', dependencies: [], permissions: [], lazy: true, icon: '⇄' },
  { id: 'svg-lab', name: 'SVG Lab', version: '1.0.0', category: 'graphics', description: 'SVG shapes, paths, interactive, transform, export.', dependencies: [], permissions: [], lazy: true, icon: '🔷' },
  { id: 'webgl-lab', name: 'WebGL Lab', version: '1.0.0', category: 'graphics', description: 'WebGL renderer — triangle, texture, cube, lighting, camera.', dependencies: [], permissions: [], lazy: true, icon: '🧊' },
  { id: 'webgpu', name: 'WebGPU Lab', version: '1.0.0', category: 'graphics', description: 'WebGPU adapter/device detection, limits, basic demo — capability-aware.', dependencies: [], permissions: [], lazy: true, icon: '⚡' },
  { id: 'audio-lab', name: 'Audio Lab', version: '0.9.0', category: 'media', description: 'Audio player, waveform, visualizer — coming in Part 4.', dependencies: [], permissions: [], lazy: true, icon: '🎵' },
  { id: 'file-lab', name: 'File Lab', version: '0.9.0', category: 'files', description: 'File picker, drag & drop, preview — coming in Part 4.', dependencies: [], permissions: [], lazy: true, icon: '📁' },
  { id: 'storage-lab', name: 'Storage Lab', version: '0.9.0', category: 'storage', description: 'LocalStorage / IndexedDB explorer — coming in Part 4.', dependencies: ['file-lab'], permissions: ['storage'], lazy: true, icon: '💾' },
  { id: 'network-lab', name: 'Network Lab', version: '0.9.0', category: 'network', description: 'Fetch, WebSocket, streaming — coming in Part 4.', dependencies: [], permissions: ['network'], lazy: true, icon: '🌐' },
  { id: 'crash-demo', name: 'Crash Demo', version: '1.0.0', category: 'devtools', description: 'Cố tình throw error để test error isolation — app vẫn sống.', dependencies: [], permissions: [], lazy: true, icon: '💥' },
];

// Register all
for (const m of CATALOG) {
  try { moduleManager.register(m); } catch (e) { logger.warn('register failed', e.message); }
}

// --- DOM refs ---
const els = {};
function qs(id) { return document.getElementById(id); }

function initDOMRefs() {
  els.workspace = qs('workspace');
  els.catalog = qs('catalog');
  els.catalogSearch = qs('catalogSearch');
  els.catalogFilter = qs('catalogFilter');
  els.workspaceEmpty = qs('workspaceEmpty');
  els.topMetrics = qs('topMetrics');
  els.metricCpu = qs('metricCpu');
  els.metricFps = qs('metricFps');
  els.metricRam = qs('metricRam');
  els.onlineIndicator = qs('onlineIndicator');
  els.badgeActive = qs('badgeActive');
  els.badgeModules = qs('badgeModules');
  els.resourceMini = qs('resourceMini');
  els.rbarFps = qs('rbarFps');
  els.rbarFpsVal = qs('rbarFpsVal');
  els.rbarDom = qs('rbarDom');
  els.rbarDomVal = qs('rbarDomVal');
  els.rbarTimers = qs('rbarTimers');
  els.rbarTimersVal = qs('rbarTimersVal');
  els.resourceMeta = qs('resourceMeta');
  els.statusActive = qs('statusActive');
  els.statusLoaded = qs('statusLoaded');
  els.statusWorkers = qs('statusWorkers');
  els.statusDom = qs('statusDom');
  els.statusTimers = qs('statusTimers');
  els.statusCanvas = qs('statusCanvas');
  els.statusFps = qs('statusFps');
  els.statusOnline = qs('statusOnline');
  els.logger = qs('logger');
  els.logLevel = qs('logLevel');
  els.benchStartup = qs('benchStartup');
  els.benchLazy = qs('benchLazy');
  els.benchActive = qs('benchActive');
  els.benchFps = qs('benchFps');
  els.palette = qs('palette');
  els.paletteInput = qs('paletteInput');
  els.paletteList = qs('paletteList');
  els.appModal = qs('appModal');
  els.modalTitle = qs('modalTitle');
  els.modalBody = qs('modalBody');
  els.modalActions = qs('modalActions');
  els.contextMenu = qs('contextMenu');
  els.toastStack = qs('toastStack');
  els.sidebar = qs('sidebar');
  els.sidebarBackdrop = qs('sidebarBackdrop');
  els.perfGrid = qs('perfGrid');
  els.permissionList = qs('permissionList');
}

// --- Helpers ---
function escapeHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function showToast({ type='info', title='', message='', duration=3000 } = {}) {
  if (!els.toastStack) return;
  const icons = { success:'✓', error:'✗', warn:'⚠', info:'◈' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.setAttribute('role','status');
  el.innerHTML = `
    <div class="toast-icon" aria-hidden="true">${icons[type]||icons.info}</div>
    <div class="toast-body"><strong>${escapeHtml(title)}</strong>${message?`<span>${escapeHtml(message)}</span>`:''}</div>
    <button class="toast-close" aria-label="Đóng">×</button>
  `;
  el.querySelector('.toast-close')?.addEventListener('click', () => el.remove());
  els.toastStack.appendChild(el);
  if (duration>0) setTimeout(()=> { el.style.opacity='0'; el.style.transform='translateY(4px)'; setTimeout(()=> el.remove(), 250); }, duration);
  logger.debug(`toast: ${type} ${title}`);
}

function showModal({ title='Thông báo', body='', actions=[] } = {}) {
  if (!els.appModal) return;
  els.modalTitle.textContent = title;
  els.modalBody.innerHTML = body;
  els.modalActions.innerHTML = '';
  for (const a of actions) {
    const btn = document.createElement('button');
    btn.className = `btn ${a.variant==='primary'?'btn-primary':a.variant==='danger'?'btn-danger':'btn-ghost'} btn-sm`;
    btn.textContent = a.label;
    btn.addEventListener('click', () => {
      try { a.onClick?.(); } finally { if (a.close!==false) els.appModal.close(); }
    });
    els.modalActions.appendChild(btn);
  }
  if (actions.length===0) {
    const btn = document.createElement('button');
    btn.className='btn btn-primary btn-sm'; btn.textContent='Đóng';
    btn.addEventListener('click', ()=> els.appModal.close());
    els.modalActions.appendChild(btn);
  }
  // ESC + click outside handled by dialog
  if (typeof els.appModal.showModal === 'function') {
    try { els.appModal.showModal(); } catch { els.appModal.setAttribute('open',''); }
  } else {
    els.appModal.setAttribute('open','');
  }
  // Focus trap: focus first button
  setTimeout(()=> els.modalActions.querySelector('button')?.focus(), 50);
}

// --- Catalog render ---
let catalogQuery = '';
let catalogFilter = 'all';
let catalogCategory = '';

function getFilteredCatalog() {
  let list = moduleManager.list();
  // Search
  if (catalogQuery) {
    const q = catalogQuery.toLowerCase();
    list = list.filter(m => `${m.id} ${m.meta.name} ${m.meta.category} ${m.meta.description}`.toLowerCase().includes(q));
  }
  // Status filter
  if (catalogFilter !== 'all') {
    list = list.filter(m => m.status === catalogFilter);
  }
  // Category filter
  if (catalogCategory) {
    list = list.filter(m => m.meta.category === catalogCategory);
  }
  return list;
}

function renderCatalog() {
  if (!els.catalog) return;
  const list = getFilteredCatalog();
  if (list.length===0) {
    els.catalog.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:24px;color:var(--text-3);font:500 13px var(--font-sans)">Không tìm thấy module nào — thử từ khóa khác.</div>`;
    return;
  }
  els.catalog.innerHTML = list.map(m => {
    const statusLabel = { unloaded:'UNLOADED', loaded:'LOADED', active:'ACTIVE', paused:'PAUSED', sleeping:'SLEEPING', crashed:'CRASHED', registered:'UNLOADED' }[m.status] || m.status.toUpperCase();
    const statusClass = m.status;
    const isActive = m.status==='active';
    const isCrashed = m.status==='crashed';
    const deps = (m.meta.dependencies||[]).length ? `<span class="badge" title="Dependencies">deps: ${escapeHtml(m.meta.dependencies.join(', '))}</span>` : '';
    const primaryAction = isActive
      ? `<button class="btn btn-ghost btn-sm" data-action="disable" data-id="${m.id}">Disable</button>`
      : isCrashed
        ? `<button class="btn btn-primary btn-sm" data-action="restart" data-id="${m.id}">Restart</button>`
        : `<button class="btn btn-primary btn-sm" data-action="enable" data-id="${m.id}">Enable</button>`;
    const secondaryActions = isActive
      ? `<button class="btn btn-ghost btn-sm" data-action="pause" data-id="${m.id}">Pause</button><button class="btn btn-ghost btn-sm" data-action="sleep" data-id="${m.id}">Sleep</button>`
      : m.status==='paused' || m.status==='sleeping'
        ? `<button class="btn btn-ghost btn-sm" data-action="resume" data-id="${m.id}">Resume</button><button class="btn btn-ghost btn-sm" data-action="disable" data-id="${m.id}">Disable</button>`
        : isCrashed
          ? `<button class="btn btn-ghost btn-sm" data-action="disable" data-id="${m.id}">Remove</button>`
          : `<button class="btn btn-ghost btn-sm" data-action="preview" data-id="${m.id}">Info</button>`;
    return `
      <div class="catalog-card ${statusClass}" role="listitem" data-id="${m.id}">
        <div class="catalog-head">
          <div class="catalog-icon" aria-hidden="true">${escapeHtml(m.meta.icon||'◈')}</div>
          <div class="catalog-info">
            <h3>${escapeHtml(m.meta.name)} <span class="status-dot ${statusClass}" title="${statusLabel}" aria-label="${statusLabel}"></span></h3>
            <p>${escapeHtml(m.meta.description)}</p>
          </div>
        </div>
        <div class="catalog-meta">
          <span class="badge badge-category">${escapeHtml(m.meta.category)}</span>
          <span class="badge">v${escapeHtml(m.meta.version)}</span>
          <span class="badge" style="background:${isActive?'rgba(16,185,129,.12)':isCrashed?'rgba(239,68,68,.12)':'var(--surface-2)'};color:${isActive?'var(--success)':isCrashed?'var(--danger)':'var(--text-2)'}">${statusLabel}</span>
          ${deps}
        </div>
        <div class="catalog-actions">
          ${primaryAction}
          ${secondaryActions}
        </div>
        ${m.error ? `<div class="muted small" style="color:var(--danger);white-space:pre-wrap;word-break:break-word;font:400 11px var(--font-mono)">${escapeHtml(String(m.error.message||m.error).slice(0,200))}</div>` : ''}
      </div>
    `;
  }).join('');

  // Bind actions
  els.catalog.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const action = btn.dataset.action;
      const id = btn.dataset.id;
      if (action==='preview') {
        const m = moduleManager.get(id);
        showModal({
          title: m.meta.name,
          body: `<p><b>${escapeHtml(m.meta.id)}</b> · ${escapeHtml(m.meta.category)} · v${escapeHtml(m.meta.version)}</p><p>${escapeHtml(m.meta.description)}</p><p class="muted small">Status: <b>${escapeHtml(m.status)}</b> · Lazy: ${m.meta.lazy?'yes':'no'} · Deps: ${escapeHtml((m.meta.dependencies||[]).join(', ')||'—')}</p><p class="muted small">Permissions: ${escapeHtml((m.meta.permissions||[]).join(', ')||'—')}</p>`,
          actions: [{ label:'Đóng', variant:'primary' }]
        });
        return;
      }
      btn.disabled = true;
      const origText = btn.textContent;
      btn.textContent = '…';
      try {
        if (action==='enable') await handleEnable(id);
        else if (action==='disable') await handleDisable(id);
        else if (action==='pause') await moduleManager.pause(id);
        else if (action==='resume') await moduleManager.resume(id);
        else if (action==='sleep') await moduleManager.sleep(id);
        else if (action==='restart') await moduleManager.restart(id);
      } catch (err) {
        if (err.dependents) {
          showModal({
            title: 'Không thể tắt module',
            body: `<p>Module <b>${escapeHtml(id)}</b> đang được yêu cầu bởi:</p><p><code>${escapeHtml(err.dependents.join(', '))}</code></p><p>Chọn hành động:</p>`,
            actions: [
              { label:'Hủy', variant:'ghost' },
              { label:'Tắt cả dependents', variant:'danger', onClick: async () => {
                for (const depId of err.dependents) {
                  try { await moduleManager.disable(depId); } catch {}
                }
                try { await moduleManager.disable(id); } catch (e2) { showToast({ type:'error', title:'Disable thất bại', message: e2.message }); }
                renderCatalog(); updateStatusBar();
              }}
            ]
          });
        } else {
          showToast({ type:'error', title:`${action} thất bại`, message: err.message });
        }
      } finally {
        btn.disabled = false;
        btn.textContent = origText;
        renderCatalog();
        updateStatusBar();
      }
    });
  });
}

async function handleEnable(id) {
  try {
    await moduleManager.enable(id);
    showToast({ type:'success', title:`Đã bật ${id}`, message:'Lazy-load thành công — kiểm tra Network tab.' });
    logger.info(`app: enabled ${id}`);
  } catch (e) {
    // If import failed for stub, show placeholder window instead
    if (e.message && (e.message.includes('Failed to fetch') || e.message.includes('not found') || e.message.includes('Failed to load'))) {
      // Create fallback window
      const meta = moduleManager.get(id)?.meta || { name: id, category: 'general', version: '0.9.0', icon: '◈' };
      const body = windowManager.createWindow(id, meta);
      if (body) {
        body.innerHTML = `
          <div style="text-align:center;padding:24px">
            <div style="width:56px;height:56px;border-radius:16px;display:grid;place-items:center;background:var(--primary-soft);color:var(--primary);font-size:24px;margin:0 auto 12px">${escapeHtml(meta.icon||'◈')}</div>
            <h3 style="font:700 16px var(--font-sans)">${escapeHtml(meta.name)}</h3>
            <p class="muted small" style="margin-top:8px;max-width:40ch;margin-left:auto;margin-right:auto">${escapeHtml(meta.description)}</p>
            <div style="margin-top:16px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
              <span class="badge">v${escapeHtml(meta.version)}</span>
              <span class="badge badge-category">${escapeHtml(meta.category)}</span>
              <span class="badge">Part ${meta.category==='text'?'2':meta.category==='graphics'?'3':meta.category==='media'?'3':'4'}+</span>
            </div>
            <p class="muted small" style="margin-top:16px">Module này sẽ được hoàn thiện ở Part tiếp theo.<br/>Hiện tại là stub để demo catalog + lazy-load + dependency.</p>
          </div>
        `;
        // Mark as active in state even though import failed — for demo
        state.setModuleStatus(id, 'active');
        eventBus.emit('module:enabled', { id });
        showToast({ type:'info', title:`${meta.name} (stub)`, message:'Đây là stub — sẽ hoàn thiện ở Part sau.' });
        return;
      }
    }
    throw e;
  }
}

async function handleDisable(id) {
  await moduleManager.disable(id);
  showToast({ type:'info', title:`Đã tắt ${id}`, message:'Đã cleanup timers/listeners.' });
}

// --- Status bar + resource ---
function updateStatusBar() {
  const list = moduleManager.list();
  const active = list.filter(m=>m.status==='active').length;
  const loaded = list.filter(m=>m.status==='loaded' || m.status==='active' || m.status==='paused' || m.status==='sleeping').length;
  const snap = resourceManager.getSnapshot();
  if (els.badgeActive) els.badgeActive.textContent = active;
  if (els.badgeModules) els.badgeModules.textContent = list.length;
  if (els.statusActive) els.statusActive.textContent = active;
  if (els.statusLoaded) els.statusLoaded.textContent = loaded;
  if (els.statusWorkers) els.statusWorkers.textContent = snap.workers;
  if (els.statusDom) els.statusDom.textContent = snap.domNodes || '—';
  if (els.statusTimers) els.statusTimers.textContent = snap.timers;
  if (els.statusCanvas) els.statusCanvas.textContent = snap.canvas;
  if (els.statusFps) els.statusFps.textContent = snap.fps;
  if (els.benchActive) els.benchActive.textContent = String(active);
  if (els.resourceMeta) els.resourceMeta.textContent = `${active} active · ${loaded} loaded · ${snap.workers} workers`;
  // Top metrics
  if (els.metricFps) els.metricFps.textContent = String(snap.fps);
  if (els.metricCpu) {
    const cpu = resourceManager.estimateCpu(snap.fps, snap.domNodes, snap.timers);
    els.metricCpu.textContent = `~${cpu}%`;
  }
  // Resource bars
  if (els.rbarFps) {
    const pct = Math.min(100, Math.max(10, (snap.fps/60)*100));
    els.rbarFps.style.width = pct + '%';
    els.rbarFpsVal.textContent = String(snap.fps);
  }
  if (els.rbarDom) {
    const pct = Math.min(100, (snap.domNodes/8000)*100);
    els.rbarDom.style.width = pct + '%';
    els.rbarDomVal.textContent = String(snap.domNodes);
  }
  if (els.rbarTimers) {
    const pct = Math.min(100, (snap.timers/50)*100);
    els.rbarTimers.style.width = pct + '%';
    els.rbarTimersVal.textContent = String(snap.timers);
  }
}

// --- Logger panel ---
function initLoggerPanel() {
  if (!els.logger || !els.logLevel) return;
  function renderLogs() {
    const level = els.logLevel.value;
    const entries = logger.getEntries(level);
    // Show last 80
    const slice = entries.slice(-80);
    els.logger.innerHTML = slice.map(e => {
      const time = new Date(e.ts).toLocaleTimeString('vi-VN', { hour12:false });
      const lvl = e.level.toUpperCase().padEnd(5);
      return `<div class="log-line ${e.level}">[${time}] [${lvl}] ${escapeHtml(e.msg)}${e.data?` ${escapeHtml(typeof e.data==='string'?e.data:JSON.stringify(e.data).slice(0,200))}`:''}</div>`;
    }).join('') || `<div class="muted small">Chưa có log — bật module để xem.</div>`;
    els.logger.scrollTop = els.logger.scrollHeight;
  }
  logger.subscribe(()=> renderLogs());
  els.logLevel.addEventListener('change', renderLogs);
  qs('btnClearLog')?.addEventListener('click', ()=> { logger.clear(); renderLogs(); });
  const devToggle = qs('toggleDevMode');
  if (devToggle) {
    devToggle.checked = state.get().ui.devMode;
    devToggle.addEventListener('change', ()=> {
      const v = devToggle.checked;
      state.setUI({ devMode: v });
      logger.setDevMode(v);
      logger.setLevel(v ? 'debug' : 'info');
      if (els.logLevel) els.logLevel.value = v ? 'debug' : 'info';
      renderLogs();
      showToast({ type:'info', title: v?'Dev Mode ON':'Dev Mode OFF', message: v?'Hiện DEBUG logs':'Chỉ INFO+' });
    });
    logger.setDevMode(devToggle.checked);
    logger.setLevel(devToggle.checked ? 'debug' : 'info');
  }
  renderLogs();
}

// --- Theme ---
function initTheme() {
  const btn = qs('btnThemeToggle');
  const btn2 = qs('btnToggleTheme2');
  const apply = () => {
    const t = state.get().ui.theme;
    document.documentElement.dataset.theme = t;
    document.documentElement.style.colorScheme = t;
    try { document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t==='light'?'#f8fafc':'#0b0f1a'); } catch {}
  };
  apply();
  const toggle = () => {
    state.toggleTheme();
    apply();
    showToast({ type:'info', title:`Theme: ${state.get().ui.theme}`, message:'Đã lưu — F5 vẫn giữ.' });
  };
  btn?.addEventListener('click', toggle);
  btn2?.addEventListener('click', toggle);
  // Motion toggle
  const motionToggle = qs('toggleMotion');
  if (motionToggle) {
    motionToggle.checked = state.get().ui.motion !== false;
    motionToggle.addEventListener('change', ()=> {
      const v = motionToggle.checked;
      state.setUI({ motion: v });
      document.documentElement.style.setProperty('--motion', v?'1':'0');
      if (!v) document.documentElement.classList.add('no-motion');
      else document.documentElement.classList.remove('no-motion');
    });
  }
  eventBus.on('theme:changed', apply);
}

// --- Sidebar ---
function initSidebar() {
  const btn = qs('btnSidebarToggle');
  const backdrop = els.sidebarBackdrop;
  const sidebar = els.sidebar;
  if (!btn || !sidebar) return;
  const toggle = () => {
    const open = sidebar.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
    backdrop?.classList.toggle('open', open);
    backdrop?.setAttribute('aria-hidden', String(!open));
  };
  btn.addEventListener('click', toggle);
  backdrop?.addEventListener('click', toggle);
  // Nav active
  document.querySelectorAll('.nav-item').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const view = a.dataset.view;
      const cat = a.dataset.category;
      if (cat) {
        catalogCategory = catalogCategory===cat ? '' : cat;
        document.querySelectorAll('.nav-item').forEach(x=> x.classList.remove('active'));
        if (catalogCategory) a.classList.add('active');
        else document.querySelector('[data-view="home"]')?.classList.add('active');
        renderCatalog();
        showToast({ type:'info', title: catalogCategory?`Lọc: ${cat}`:'Tất cả modules', message: catalogCategory?`Đang lọc ${cat}`:'Đã bỏ lọc' });
        // On mobile, close sidebar
        if (window.innerWidth < 1024) toggle();
        return;
      }
      if (view) {
        document.querySelectorAll('.nav-item').forEach(x=> x.classList.remove('active'));
        a.classList.add('active');
        document.querySelectorAll('.view').forEach(v=> v.classList.remove('active'));
        const target = qs(view==='home'?'viewHome': view==='performance'?'viewPerformance': view==='settings'?'viewSettings': 'viewHome');
        target?.classList.add('active');
        if (view==='performance') renderPerfGrid();
        if (view==='settings') renderPermissions();
        if (window.innerWidth < 1024) {
          sidebar.classList.remove('open');
          backdrop?.classList.remove('open');
          btn.setAttribute('aria-expanded','false');
        }
      }
    });
  });
}

// --- Search + Filter ---
function initSearch() {
  if (!els.catalogSearch) return;
  let t = null;
  els.catalogSearch.addEventListener('input', () => {
    clearTimeout(t);
    t = setTimeout(()=> { catalogQuery = els.catalogSearch.value.trim(); renderCatalog(); }, 200);
  });
  els.catalogSearch.addEventListener('keydown', (e)=> {
    if (e.key==='Escape') { els.catalogSearch.value=''; catalogQuery=''; renderCatalog(); }
  });
  // "/" to focus search
  document.addEventListener('keydown', (e)=> {
    if ((e.key==='/' && !e.ctrlKey && !e.metaKey && !e.altKey) && document.activeElement?.tagName!=='INPUT' && document.activeElement?.tagName!=='TEXTAREA') {
      e.preventDefault();
      els.catalogSearch.focus();
    }
  });
  els.catalogFilter?.addEventListener('change', ()=> { catalogFilter = els.catalogFilter.value; renderCatalog(); });
}

// --- Command Palette ---
let paletteSelected = 0;
let paletteItems = [];

function buildPaletteItems(query='') {
  const q = query.toLowerCase();
  const items = [];
  // Modules
  for (const m of moduleManager.list()) {
    const label = `${m.meta.name} — ${m.meta.category}`;
    const hay = `${m.id} ${m.meta.name} ${m.meta.category} ${m.meta.description}`.toLowerCase();
    if (!q || hay.includes(q)) {
      const isActive = m.status==='active';
      items.push({
        id: `module:${m.id}`,
        icon: m.meta.icon||'◈',
        title: m.meta.name,
        subtitle: `${m.meta.category} · ${m.status} · ${m.meta.description.slice(0,60)}`,
        kbd: isActive?'Disable':'Enable',
        action: async () => {
          if (isActive) await handleDisable(m.id);
          else await handleEnable(m.id);
          renderCatalog(); updateStatusBar();
        }
      });
    }
  }
  // Commands
  const cmds = [
    { title:'Toggle Theme', subtitle:'Đổi Dark/Light', kbd:'T', action: ()=> { state.toggleTheme(); document.documentElement.dataset.theme=state.get().ui.theme; showToast({type:'info',title:`Theme: ${state.get().ui.theme}`}); } },
    { title:'Pause All Modules', subtitle:'Tạm dừng tất cả', action: async ()=> { for(const m of moduleManager.list().filter(x=>x.status==='active')) try{await moduleManager.pause(m.id)}catch{} renderCatalog(); } },
    { title:'Resume All Modules', subtitle:'Tiếp tục tất cả', action: async ()=> { for(const m of moduleManager.list().filter(x=>x.status==='paused'||x.status==='sleeping')) try{await moduleManager.resume(m.id)}catch{} renderCatalog(); } },
    { title:'Sleep All Modules', subtitle:'Cho ngủ tất cả', action: async ()=> { for(const m of moduleManager.list().filter(x=>x.status==='active')) try{await moduleManager.sleep(m.id)}catch{} renderCatalog(); } },
    { title:'Close All Windows', subtitle:'Đóng tất cả window', action: async ()=> { for(const m of moduleManager.list().filter(x=>x.status==='active')) try{await handleDisable(m.id)}catch{} } },
    { title:'Export Snapshot', subtitle:'Tải snapshot JSON', action: ()=> { workspaceManager.downloadExport(); showToast({type:'success',title:'Đã export snapshot'}); } },
    { title:'Reset Workspace', subtitle:'Xóa workspace và reload', kbd:'Danger', action: ()=> { showModal({ title:'Reset workspace?', body:'<p>Sẽ xóa tất cả windows và trạng thái module. Không thể hoàn tác.</p>', actions:[{label:'Hủy',variant:'ghost'},{label:'Reset',variant:'danger',onClick:()=>{ state.reset(); location.reload(); }}]}); } },
    { title:'Clear Logs', subtitle:'Xóa logger', action: ()=> { logger.clear(); showToast({type:'info',title:'Đã xóa logs'}); } },
    { title:'Go to Home', subtitle:'Về trang chính', action: ()=> { document.querySelector('[data-view="home"]')?.click(); } },
    { title:'Go to Performance', subtitle:'Mở Performance Monitor', action: ()=> { document.querySelector('[data-view="performance"]')?.click(); } },
    { title:'Go to Settings', subtitle:'Mở Settings', action: ()=> { document.querySelector('[data-view="settings"]')?.click(); } },
  ];
  for (const c of cmds) {
    if (!q || `${c.title} ${c.subtitle}`.toLowerCase().includes(q)) {
      items.push({ id:`cmd:${c.title}`, icon:'⌘', title:c.title, subtitle:c.subtitle, kbd:c.kbd||'↵', action:c.action });
    }
  }
  return items.slice(0, 30);
}

function renderPaletteList() {
  if (!els.paletteList) return;
  if (paletteItems.length===0) {
    els.paletteList.innerHTML = `<div class="palette-empty">Không tìm thấy — thử từ khóa khác.</div>`;
    return;
  }
  els.paletteList.innerHTML = paletteItems.map((it, idx) => `
    <div class="palette-item ${idx===paletteSelected?'active':''}" role="option" aria-selected="${idx===paletteSelected}" data-idx="${idx}">
      <div class="palette-item-icon" aria-hidden="true">${escapeHtml(it.icon)}</div>
      <div class="palette-item-text"><strong>${escapeHtml(it.title)}</strong><span>${escapeHtml(it.subtitle)}</span></div>
      <span class="palette-item-kbd">${escapeHtml(it.kbd||'↵')}</span>
    </div>
  `).join('');
  // Scroll selected into view
  const sel = els.paletteList.querySelector('.palette-item.active');
  sel?.scrollIntoView({ block:'nearest' });
  // Click
  els.paletteList.querySelectorAll('.palette-item').forEach(el => {
    el.addEventListener('click', async () => {
      const idx = parseInt(el.dataset.idx,10);
      paletteSelected = idx;
      await execPaletteSelected();
    });
  });
}

async function execPaletteSelected() {
  const it = paletteItems[paletteSelected];
  if (!it) return;
  closePalette();
  try { await it.action(); } catch (e) { showToast({type:'error',title:'Lỗi',message:e.message}); }
  renderCatalog(); updateStatusBar();
}

function openPalette() {
  if (!els.palette) return;
  paletteSelected = 0;
  paletteItems = buildPaletteItems('');
  renderPaletteList();
  if (els.paletteInput) els.paletteInput.value = '';
  if (typeof els.palette.showModal === 'function') {
    try { els.palette.showModal(); } catch { els.palette.setAttribute('open',''); }
  } else els.palette.setAttribute('open','');
  setTimeout(()=> els.paletteInput?.focus(), 50);
  state.setUI({ commandOpen: true });
}
function closePalette() {
  if (!els.palette) return;
  try { els.palette.close(); } catch { els.palette.removeAttribute('open'); }
  state.setUI({ commandOpen: false });
}

function initPalette() {
  const btn = qs('btnCommandPalette');
  const btnSearch = qs('btnSearchTrigger');
  btn?.addEventListener('click', openPalette);
  btnSearch?.addEventListener('click', openPalette);
  // Ctrl+K / Cmd+K
  document.addEventListener('keydown', (e)=> {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase()==='k') {
      e.preventDefault();
      if (els.palette?.open) closePalette(); else openPalette();
    }
    if (e.key==='Escape' && els.palette?.open) {
      e.preventDefault(); closePalette();
    }
    if (e.key==='t' && !e.ctrlKey && !e.metaKey && !e.altKey && document.activeElement?.tagName!=='INPUT' && document.activeElement?.tagName!=='TEXTAREA' && !els.palette?.open) {
      // T to toggle theme (when not typing)
      if (e.target.closest && e.target.closest('input,textarea,select')) return;
      state.toggleTheme();
      document.documentElement.dataset.theme = state.get().ui.theme;
      showToast({type:'info',title:`Theme: ${state.get().ui.theme}`});
    }
  });
  els.paletteInput?.addEventListener('input', ()=> {
    paletteSelected = 0;
    paletteItems = buildPaletteItems(els.paletteInput.value);
    renderPaletteList();
  });
  els.paletteInput?.addEventListener('keydown', async (e)=> {
    if (e.key==='ArrowDown') { e.preventDefault(); paletteSelected = Math.min(paletteItems.length-1, paletteSelected+1); renderPaletteList(); }
    else if (e.key==='ArrowUp') { e.preventDefault(); paletteSelected = Math.max(0, paletteSelected-1); renderPaletteList(); }
    else if (e.key==='Enter') { e.preventDefault(); await execPaletteSelected(); }
    else if (e.key==='Escape') { e.preventDefault(); closePalette(); }
  });
  // Click outside to close
  els.palette?.addEventListener('click', (e)=> {
    const rect = els.palette.querySelector('.palette-inner')?.getBoundingClientRect();
    if (!rect) return;
    if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) closePalette();
  });
  // Also close on backdrop click via dialog light dismiss? handled above
}

// --- Workspace actions ---
function initWorkspaceActions() {
  qs('btnPauseAll')?.addEventListener('click', async ()=> {
    for (const m of moduleManager.list().filter(x=>x.status==='active')) try{await moduleManager.pause(m.id)}catch{}
    renderCatalog(); showToast({type:'info',title:'Đã pause tất cả'});
  });
  qs('btnResumeAll')?.addEventListener('click', async ()=> {
    for (const m of moduleManager.list().filter(x=>x.status==='paused'||x.status==='sleeping')) try{await moduleManager.resume(m.id)}catch{}
    renderCatalog(); showToast({type:'info',title:'Đã resume tất cả'});
  });
  qs('btnSleepAll')?.addEventListener('click', async ()=> {
    for (const m of moduleManager.list().filter(x=>x.status==='active')) try{await moduleManager.sleep(m.id)}catch{}
    renderCatalog(); showToast({type:'info',title:'Đã sleep tất cả'});
  });
  qs('btnCloseAll')?.addEventListener('click', async ()=> {
    for (const m of [...moduleManager.list()].filter(x=>x.status==='active')) try{await handleDisable(m.id)}catch{}
    renderCatalog(); updateStatusBar();
  });
  qs('btnSaveWorkspace')?.addEventListener('click', ()=> { state.saveNow(); showToast({type:'success',title:'Đã lưu workspace'}); });
  qs('btnResetWorkspace')?.addEventListener('click', ()=> {
    showModal({ title:'Reset workspace?', body:'<p>Sẽ xóa tất cả windows và trạng thái. Không thể hoàn tác.</p>', actions:[{label:'Hủy',variant:'ghost'},{label:'Reset',variant:'danger',onClick:()=>{ state.reset(); location.reload(); }}]});
  });
  qs('btnExportSnapshot')?.addEventListener('click', ()=> { workspaceManager.downloadExport(); showToast({type:'success',title:'Đã export snapshot',message:'Kiểm tra thư mục tải về.'}); });
  const importBtn = qs('btnImportSnapshot');
  const importFile = qs('importFile');
  importBtn?.addEventListener('click', ()=> importFile?.click());
  importFile?.addEventListener('change', async (e)=> {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const res = await workspaceManager.importJSON(text);
    if (!res.ok) {
      showToast({type:'error',title:'Import thất bại',message:res.error});
      showModal({ title:'Import thất bại', body:`<p><code>${escapeHtml(res.error)}</code></p>`, actions:[{label:'Đóng',variant:'primary'}]});
    } else {
      showToast({type:'success',title:'Đã import snapshot',message:`Workspace: ${res.data.workspace} · ${res.data.modules.length} modules`});
      // Try to enable modules from snapshot
      for (const id of res.data.modules) {
        if (moduleManager.get(id) && moduleManager.get(id).status!=='active') {
          try { await handleEnable(id); } catch {}
        }
      }
      renderCatalog(); updateStatusBar();
    }
    e.target.value='';
  });
}

// --- Context menu ---
function initContextMenu() {
  if (!els.contextMenu || !els.workspace) return;
  els.workspace.addEventListener('contextmenu', (e)=> {
    const win = e.target.closest('.window');
    if (!win) return;
    e.preventDefault();
    const id = win.dataset.moduleId;
    if (!id) return;
    const m = moduleManager.get(id);
    if (!m) return;
    els.contextMenu.innerHTML = `
      <button class="ctx-item" data-ctx="focus"><span class="ctx-icon">◈</span> Bring to front</button>
      <button class="ctx-item" data-ctx="minimize"><span class="ctx-icon">—</span> Minimize</button>
      <button class="ctx-item" data-ctx="maximize"><span class="ctx-icon">□</span> Maximize</button>
      <div class="ctx-sep"></div>
      <button class="ctx-item" data-ctx="pause"><span class="ctx-icon">⏸</span> Pause</button>
      <button class="ctx-item" data-ctx="sleep"><span class="ctx-icon">💤</span> Sleep</button>
      <button class="ctx-item" data-ctx="restart"><span class="ctx-icon">↻</span> Restart</button>
      <div class="ctx-sep"></div>
      <button class="ctx-item danger" data-ctx="close"><span class="ctx-icon">×</span> Close</button>
    `;
    els.contextMenu.style.left = e.clientX + 'px';
    els.contextMenu.style.top = e.clientY + 'px';
    els.contextMenu.classList.add('open');
    els.contextMenu.setAttribute('aria-hidden','false');
    // Clamp to viewport
    requestAnimationFrame(()=> {
      const r = els.contextMenu.getBoundingClientRect();
      if (r.right > window.innerWidth) els.contextMenu.style.left = (window.innerWidth - r.width - 8) + 'px';
      if (r.bottom > window.innerHeight) els.contextMenu.style.top = (window.innerHeight - r.height - 8) + 'px';
    });
    els.contextMenu.querySelectorAll('[data-ctx]').forEach(btn=> {
      btn.addEventListener('click', async ()=> {
        const action = btn.dataset.ctx;
        els.contextMenu.classList.remove('open');
        try {
          if (action==='focus') windowManager.focus(id);
          else if (action==='minimize') windowManager.toggleMinimize(id);
          else if (action==='maximize') windowManager.toggleMaximize(id);
          else if (action==='pause') await moduleManager.pause(id);
          else if (action==='sleep') await moduleManager.sleep(id);
          else if (action==='restart') await moduleManager.restart(id);
          else if (action==='close') await handleDisable(id);
        } catch (err) { showToast({type:'error',title:'Lỗi',message:err.message}); }
        renderCatalog(); updateStatusBar();
      });
    });
  });
  document.addEventListener('click', (e)=> {
    if (!els.contextMenu.contains(e.target)) {
      els.contextMenu.classList.remove('open');
      els.contextMenu.setAttribute('aria-hidden','true');
    }
  });
  document.addEventListener('keydown', (e)=> {
    if (e.key==='Escape') { els.contextMenu.classList.remove('open'); els.contextMenu.setAttribute('aria-hidden','true'); }
  });
}

// --- Perf grid ---
function renderPerfGrid() {
  if (!els.perfGrid) return;
  const snap = resourceManager.getSnapshot();
  const cpu = resourceManager.estimateCpu(snap.fps, snap.domNodes, snap.timers);
  const startupMs = Math.round(performance.now() - START_TS);
  // Use actual startup from earlier? We'll store
  const startup = window.__WEB_UNIVERSE_STARTUP_MS ?? startupMs;
  els.perfGrid.innerHTML = `
    <div class="perf-card"><h4>FPS</h4><div class="big">${snap.fps}</div><div class="perf-bar"><div class="perf-bar-fill" style="width:${Math.min(100,(snap.fps/60)*100)}%;background:linear-gradient(90deg,var(--success),var(--accent-cyan))"></div></div><div class="hint">Target 60 · rAF loop</div></div>
    <div class="perf-card"><h4>CPU (estimate)</h4><div class="big">~${cpu}%</div><div class="perf-bar"><div class="perf-bar-fill" style="width:${cpu}%;background:linear-gradient(90deg,var(--warning),#f97316)"></div></div><div class="hint">Telemetry nội bộ, không phải OS</div></div>
    <div class="perf-card"><h4>DOM Nodes</h4><div class="big">${snap.domNodes}</div><div class="perf-bar"><div class="perf-bar-fill" style="width:${Math.min(100,(snap.domNodes/8000)*100)}%;background:linear-gradient(90deg,var(--primary),var(--accent-violet))"></div></div><div class="hint">document.querySelectorAll('*')</div></div>
    <div class="perf-card"><h4>Timers</h4><div class="big">${snap.timers}</div><div class="perf-bar"><div class="perf-bar-fill" style="width:${Math.min(100,(snap.timers/50)*100)}%;background:linear-gradient(90deg,var(--warning),var(--danger))"></div></div><div class="hint">setTimeout/Interval active (wrapped)</div></div>
    <div class="perf-card"><h4>Canvas</h4><div class="big">${snap.canvas}</div><div class="hint">document.querySelectorAll('canvas')</div></div>
    <div class="perf-card"><h4>Startup</h4><div class="big">${startup}ms</div><div class="hint">Core only — modules lazy</div></div>
  `;
}

// --- Permissions ---
function renderPermissions() {
  if (!els.permissionList) return;
  const list = permissionManager.listForUI();
  els.permissionList.innerHTML = list.map(p=> `
    <div class="setting-row">
      <span>${escapeHtml(p.label)} <span class="badge" style="margin-left:6px">${p.supported?'✓':'✗'}</span> <span class="muted small">${escapeHtml(p.status)}</span></span>
      <button class="btn btn-ghost btn-xs" data-perm="${p.name}">${p.status==='granted'?'Revoke':'Request'}</button>
    </div>
  `).join('');
  els.permissionList.querySelectorAll('[data-perm]').forEach(btn=> {
    btn.addEventListener('click', async ()=> {
      const name = btn.dataset.perm;
      const next = await permissionManager.request(name);
      showToast({type:'info',title:`Permission: ${name}`,message:next});
      renderPermissions();
    });
  });
}

// --- Online/offline ---
function initOnline() {
  const update = () => {
    const online = navigator.onLine;
    state.setRuntime({ online });
    if (els.onlineIndicator) {
      els.onlineIndicator.querySelector('.online-text').textContent = online ? 'Online' : 'Offline';
      els.onlineIndicator.querySelector('.online-dot').style.background = online ? 'var(--success)' : 'var(--danger)';
      els.onlineIndicator.title = online ? 'Đang online' : 'Đang offline — các module local vẫn chạy';
    }
    if (els.statusOnline) {
      els.statusOnline.textContent = online ? '● Online' : '○ Offline';
      els.statusOnline.style.color = online ? 'var(--success)' : 'var(--danger)';
    }
    if (!online) showToast({type:'warn',title:'Offline',message:'Các module local vẫn chạy — Network Lab sẽ hiện 🔴'});
  };
  window.addEventListener('online', update);
  window.addEventListener('offline', update);
  update();
}

// --- Modal close handlers ---
function initModal() {
  qs('btnModalClose')?.addEventListener('click', ()=> { try{els.appModal.close()}catch{els.appModal.removeAttribute('open')} });
  els.appModal?.addEventListener('click', (e)=> {
    const rect = els.appModal.querySelector('.modal-inner')?.getBoundingClientRect();
    if (!rect) return;
    if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
      try{els.appModal.close()}catch{els.appModal.removeAttribute('open')}
    }
  });
  // ESC handled by dialog natively
}

// --- Restore workspace ---
async function restoreWorkspace() {
  const s = state.get();
  const wins = s.workspace.windows || [];
  if (wins.length===0) return;
  // Sort by z to restore order
  const sorted = [...wins].sort((a,b)=> (a.z||0)-(b.z||0));
  for (const w of sorted) {
    const m = moduleManager.get(w.id);
    if (!m) continue;
    // Only restore if it was active/paused/sleeping
    const shouldRestore = ['active','paused','sleeping','loaded'].includes(m.status) || wins.some(x=>x.id===w.id);
    // Actually, state.modules may have status from previous session — check if window existed
    // We restore any window that was persisted, regardless of current status (which is unloaded after reload)
    // So we need to enable it
    try {
      // If module was active before, enable it
      // We consider any persisted window as should be active
      await handleEnable(w.id);
      // Restore minimized/maximized
      if (w.minimized) {
        const el = windowManager.getWindowEl(w.id);
        if (el && !el.classList.contains('minimized')) windowManager.toggleMinimize(w.id);
      }
      if (w.maximized) {
        const el = windowManager.getWindowEl(w.id);
        if (el && !el.classList.contains('maximized')) windowManager.toggleMaximize(w.id);
      }
    } catch (e) {
      logger.warn(`restore failed for ${w.id}`, e.message);
    }
  }
  // After restore, re-apply positions (handleEnable already created window at persisted pos, but ensure)
  // Positions are already handled via windowManager.createWindow reading state
}

// --- Benchmark ---
function initBenchmark() {
  const startupMs = Math.round(performance.now() - START_TS);
  window.__WEB_UNIVERSE_STARTUP_MS = startupMs;
  if (els.benchStartup) els.benchStartup.textContent = `${startupMs}ms`;
  if (els.benchLazy) {
    // Estimate: if all 12 modules were eager, assume ~12*15KB = 180KB extra
    // Lazy saving = not loaded yet
    const loaded = moduleManager.list().filter(m=>m.status==='active'||m.status==='loaded').length;
    const total = moduleManager.list().length;
    els.benchLazy.textContent = `${total - loaded}/${total} chưa tải (tiết kiệm)`;
  }
  // Update FPS avg periodically
  setInterval(()=> {
    const snap = resourceManager.getSnapshot();
    if (els.benchFps) els.benchFps.textContent = `${snap.fps} FPS`;
  }, 1000);
}

// --- SW ---
function initSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').then(()=> logger.info('sw: registered')).catch(e=> logger.warn('sw: failed', e.message));
  }
}

// --- Main init ---
async function main() {
  initDOMRefs();
  windowManager.init(els.workspace);
  resourceManager.start();
  initTheme();
  initSidebar();
  initSearch();
  initPalette();
  initWorkspaceActions();
  initContextMenu();
  initLoggerPanel();
  initOnline();
  initModal();
  initSW();

  // Event wiring
  eventBus.on('resource:update', updateStatusBar);
  eventBus.on('module:enabled', ()=> { renderCatalog(); updateStatusBar(); });
  eventBus.on('module:disabled', ()=> { renderCatalog(); updateStatusBar(); });
  eventBus.on('module:paused', ()=> { renderCatalog(); updateStatusBar(); });
  eventBus.on('module:resumed', ()=> { renderCatalog(); updateStatusBar(); });
  eventBus.on('module:sleep', ()=> { renderCatalog(); updateStatusBar(); });
  eventBus.on('module:crashed', ({id, error})=> {
    renderCatalog(); updateStatusBar();
    showToast({type:'error',title:`Module crashed: ${id}`,message: error?.message||String(error)});
  });
  eventBus.on('window:close-request', async ({id})=> { try{await handleDisable(id)}catch(e){showToast({type:'error',title:'Close failed',message:e.message})} renderCatalog(); updateStatusBar(); });
  eventBus.on('window:restart-request', async ({id})=> {
    try { await moduleManager.restart(id); showToast({type:'success',title:`Đã restart ${id}`}); } catch(e){ showToast({type:'error',title:'Restart failed',message:e.message}); }
    renderCatalog(); updateStatusBar();
  });
  eventBus.on('toast', (p)=> showToast(p));

  // Initial render
  renderCatalog();
  updateStatusBar();
  renderPermissions();
  initBenchmark();

  // Restore workspace after a tick (so DOM ready)
  setTimeout(async ()=> {
    await restoreWorkspace();
    renderCatalog(); updateStatusBar();
    const startupMs = Math.round(performance.now() - START_TS);
    logger.info(`app: ready in ${startupMs}ms — ${moduleManager.list().length} modules registered`);
    // Update benchmark
    if (els.benchStartup) els.benchStartup.textContent = `${startupMs}ms`;
    // Resource sample
    resourceManager.sample();
    updateStatusBar();
  }, 100);

  // Periodic status update
  setInterval(updateStatusBar, 1000);
  // Perf grid refresh if visible
  setInterval(()=> { if (qs('viewPerformance')?.classList.contains('active')) renderPerfGrid(); }, 1000);

  // Handle details button
  qs('btnResourceDetails')?.addEventListener('click', ()=> {
    document.querySelector('[data-view="performance"]')?.click();
  });

  // Expose for debug
  window.WEB_UNIVERSE = { eventBus, state, logger, moduleManager, windowManager, resourceManager, workspaceManager, permissionManager, CATALOG };
  logger.info('WEB UNIVERSE — Core Runtime ready', { modules: CATALOG.length, startupMs: Math.round(performance.now()-START_TS) });
}

main().catch(e=> {
  console.error('app init failed', e);
  document.body.innerHTML = `<pre style="padding:24px;color:#ef4444">App init failed: ${escapeHtml(e.stack||e.message)}</pre>`;
});
