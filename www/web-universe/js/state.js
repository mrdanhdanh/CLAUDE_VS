// state.js — Global/UI/Module/Workspace/Runtime split + persist + subscribe
const STORAGE_KEY = 'web-universe:workspace-v1';
const THEME_KEY = 'web-universe:theme';

function deepClone(o) { return JSON.parse(JSON.stringify(o)); }

export function createState({ eventBus, logger } = {}) {
  const initial = {
    ui: { theme: 'dark', sidebarCollapsed: false, commandOpen: false, devMode: false, motion: true },
    modules: {}, // id -> { status, error }
    workspace: { id: 'default', windows: [] }, // windows: [{id, x, y, w, h, z, minimized, maximized}]
    runtime: { fps: 60, domNodes: 0, workers: 0, timers: 0, canvas: 0, online: true, startedAt: Date.now() },
    permissions: { camera: 'prompt', microphone: 'prompt', location: 'prompt', notifications: 'default', clipboard: 'prompt' },
  };

  let state = deepClone(initial);
  const subs = new Set();
  let saveTimer = null;

  // Load persisted
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // merge shallow for known keys
      if (parsed.ui) Object.assign(state.ui, parsed.ui);
      if (parsed.workspace) state.workspace = { ...state.workspace, ...parsed.workspace };
      if (parsed.modules) state.modules = parsed.modules;
      // theme is separate key — sync
      const t = localStorage.getItem(THEME_KEY);
      if (t === 'light' || t === 'dark') state.ui.theme = t;
    } else {
      const t = localStorage.getItem(THEME_KEY);
      if (t === 'light' || t === 'dark') state.ui.theme = t;
      else if (typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: light)').matches) state.ui.theme = 'light';
    }
  } catch (e) { logger?.warn('state: load failed', e); }

  function get() { return state; }
  function getClone() { return deepClone(state); }

  function setTheme(theme) {
    if (theme !== 'dark' && theme !== 'light') return;
    state.ui.theme = theme;
    try { localStorage.setItem(THEME_KEY, theme); } catch {}
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    try { document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#f8fafc' : '#0b0f1a'); } catch {}
    eventBus?.emit('theme:changed', theme);
    scheduleSave();
    notify();
  }
  function toggleTheme() { setTheme(state.ui.theme === 'dark' ? 'light' : 'dark'); }

  function setModuleStatus(id, status, error = null) {
    if (!state.modules[id]) state.modules[id] = {};
    state.modules[id].status = status;
    state.modules[id].error = error;
    if (error) state.modules[id].stack = error?.stack || String(error);
    else delete state.modules[id].stack;
    eventBus?.emit('module:status', { id, status, error });
    scheduleSave();
    notify();
  }

  function setWorkspace(patch) {
    Object.assign(state.workspace, patch);
    scheduleSave();
    notify();
  }
  function setWindows(windows) {
    state.workspace.windows = windows;
    scheduleSave();
    notify();
  }
  function setRuntime(patch) {
    Object.assign(state.runtime, patch);
    notify();
  }
  function setUI(patch) {
    Object.assign(state.ui, patch);
    if ('theme' in patch) setTheme(patch.theme);
    else { scheduleSave(); notify(); }
  }

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, 300);
  }
  function saveNow() {
    try {
      const toSave = { ui: state.ui, workspace: state.workspace, modules: state.modules };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      localStorage.setItem(THEME_KEY, state.ui.theme);
    } catch (e) { logger?.warn('state: save failed', e); }
  }
  function reset() {
    state = deepClone(initial);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    // keep theme? reset to dark
    setTheme('dark');
    notify();
    eventBus?.emit('workspace:reset', null);
  }

  function subscribe(fn) { subs.add(fn); return () => subs.delete(fn); }
  function notify() { for (const s of [...subs]) try { s(state); } catch {} }

  // Apply theme immediately
  try {
    document.documentElement.dataset.theme = state.ui.theme;
    document.documentElement.style.colorScheme = state.ui.theme;
  } catch {}

  return {
    get, getClone, setTheme, toggleTheme, setModuleStatus, setWorkspace, setWindows, setRuntime, setUI,
    saveNow, reset, subscribe,
    STORAGE_KEY, THEME_KEY,
  };
}
