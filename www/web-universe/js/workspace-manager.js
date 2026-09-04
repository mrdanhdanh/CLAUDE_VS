// workspace-manager.js — persist workspace + snapshots (localStorage + IndexedDB)
const DB_NAME = 'web-universe-db';
const DB_VERSION = 1;
const STORE_SNAPSHOTS = 'snapshots';
const STORE_WORKSPACES = 'workspaces';

function openDB() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) return reject(new Error('IndexedDB not supported'));
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_SNAPSHOTS)) db.createObjectStore(STORE_SNAPSHOTS, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(STORE_WORKSPACES)) db.createObjectStore(STORE_WORKSPACES, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function createWorkspaceManager({ state, logger } = {}) {
  let dbPromise = null;
  function getDB() {
    if (!dbPromise) dbPromise = openDB().catch(e => { logger?.warn('workspace: IndexedDB unavailable', e.message); return null; });
    return dbPromise;
  }

  function getCurrentSnapshotData() {
    const s = state.get();
    return {
      version: 1,
      workspace: s.workspace.id,
      modules: Object.entries(s.modules).filter(([,v])=> v.status==='active' || v.status==='loaded' || v.status==='sleeping' || v.status==='paused').map(([id])=>id),
      moduleStates: s.modules,
      layout: { windows: s.workspace.windows },
      settings: { theme: s.ui.theme, devMode: s.ui.devMode, motion: s.ui.motion },
      exportedAt: new Date().toISOString(),
    };
  }

  function validateSnapshot(data) {
    if (!data || typeof data !== 'object') return { ok:false, error:'Snapshot phải là object JSON' };
    if (data.version !== 1) return { ok:false, error:`Version không hỗ trợ: ${data.version} (expected 1)` };
    if (!data.workspace || typeof data.workspace !== 'string') return { ok:false, error:'Thiếu workspace id' };
    if (!Array.isArray(data.modules)) return { ok:false, error:'modules phải là array' };
    if (data.layout && typeof data.layout !== 'object') return { ok:false, error:'layout phải là object' };
    // check modules are strings
    for (const m of data.modules) if (typeof m !== 'string') return { ok:false, error:`module id phải là string: ${m}` };
    return { ok:true };
  }

  async function saveSnapshotToDB(snapshot) {
    const db = await getDB();
    if (!db) return false;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SNAPSHOTS, 'readwrite');
      tx.objectStore(STORE_SNAPSHOTS).put({ id: snapshot.id || `snap-${Date.now()}`, ...snapshot, savedAt: Date.now() });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }

  async function listSnapshots() {
    const db = await getDB();
    if (!db) return [];
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SNAPSHOTS, 'readonly');
      const req = tx.objectStore(STORE_SNAPSHOTS).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  function exportJSON() {
    const data = getCurrentSnapshotData();
    data.id = `snapshot-${Date.now()}`;
    return JSON.stringify(data, null, 2);
  }

  function downloadExport() {
    const json = exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `web-universe-snapshot-${Date.now()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=> URL.revokeObjectURL(url), 1000);
    // also save to IDB
    try { const data = JSON.parse(json); saveSnapshotToDB(data).catch(()=>{}); } catch {}
    return json;
  }

  async function importJSON(text) {
    let data;
    try { data = JSON.parse(text); } catch (e) { return { ok:false, error:'JSON không hợp lệ: ' + e.message }; }
    const v = validateSnapshot(data);
    if (!v.ok) return v;
    // Apply to state — restore windows + modules (modules will be enabled by caller)
    try {
      if (data.layout?.windows) state.setWindows(data.layout.windows);
      if (data.settings?.theme) state.setTheme(data.settings.theme);
      if (data.settings) state.setUI({ devMode: !!data.settings.devMode, motion: data.settings.motion !== false });
      state.saveNow();
      await saveSnapshotToDB({ ...data, id: data.id || `import-${Date.now()}` });
    } catch (e) { return { ok:false, error: e.message }; }
    return { ok:true, data };
  }

  function saveNow() { state.saveNow(); }

  return { getCurrentSnapshotData, validateSnapshot, exportJSON, downloadExport, importJSON, listSnapshots, saveSnapshotToDB, saveNow, openDB };
}
