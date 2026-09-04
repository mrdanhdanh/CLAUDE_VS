export const manifest = {
  id: 'storage-lab',
  name: 'Storage Lab',
  version: '1.0.0',
  category: 'storage',
  description: 'LocalStorage / SessionStorage / IndexedDB explorer — CRUD, search, import/export.',
  dependencies: [],
  permissions: ['storage'],
  lazy: true,
  icon: '💾',
};

let els = {};
let ctxRef = null;
let activeTab = 'local';
let idbDB = null;
let idbStores = [];

function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function getStorage(tab) {
  if (tab==='local') return localStorage;
  if (tab==='session') return sessionStorage;
  return null;
}

function renderStorageTable(tab) {
  const store = getStorage(tab);
  if (!store || !els.storageTable) return;
  const search = (els.storageSearch?.value || '').toLowerCase();
  const rows = [];
  for (let i=0;i<store.length;i++) {
    const key = store.key(i);
    const val = store.getItem(key);
    if (search && !key.toLowerCase().includes(search) && !String(val).toLowerCase().includes(search)) continue;
    rows.push({ key, val });
  }
  if (rows.length===0) {
    els.storageTable.innerHTML = `<div class="muted small" style="padding:16px;text-align:center">${search ? 'No matches' : 'No keys — add one above'}</div>`;
    return;
  }
  els.storageTable.innerHTML = `
    <table style="width:100%;border-collapse:collapse;font:400 11px var(--font-mono)">
      <thead><tr><th style="text-align:left;padding:8px;border:1px solid var(--border);background:var(--surface-2)">Key</th><th style="text-align:left;padding:8px;border:1px solid var(--border);background:var(--surface-2)">Value</th><th style="padding:8px;border:1px solid var(--border);background:var(--surface-2)">Actions</th></tr></thead>
      <tbody>
        ${rows.map(r=> `<tr>
          <td style="padding:6px 8px;border:1px solid var(--border);word-break:break-all"><code>${escapeHtml(r.key)}</code></td>
          <td style="padding:6px 8px;border:1px solid var(--border);word-break:break-all;max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${escapeHtml(String(r.val).slice(0,500))}">${escapeHtml(String(r.val).slice(0,120))}${String(r.val).length>120?'…':''}</td>
          <td style="padding:6px 8px;border:1px solid var(--border);text-align:center;white-space:nowrap">
            <button class="btn btn-ghost btn-xs" data-action="edit" data-key="${escapeHtml(r.key)}">Edit</button>
            <button class="btn btn-ghost btn-xs" data-action="delete" data-key="${escapeHtml(r.key)}">Delete</button>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>
    <div class="muted small" style="margin-top:6px">${rows.length} key(s)${search?` (filtered)` : ''}</div>
  `;
  els.storageTable.querySelectorAll('[data-action="edit"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.key;
      const val = store.getItem(key);
      const newVal = prompt(`Edit value for "${key}":`, val);
      if (newVal===null) return;
      store.setItem(key, newVal);
      renderStorageTable(tab);
      updateUsage();
    });
  });
  els.storageTable.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.key;
      if (!confirm(`Delete "${key}"?`)) return;
      store.removeItem(key);
      renderStorageTable(tab);
      updateUsage();
    });
  });
}

async function updateUsage() {
  if (!els.usage) return;
  let text = '';
  try {
    if (navigator.storage && navigator.storage.estimate) {
      const est = await navigator.storage.estimate();
      const used = est.usage ? (est.usage/1024/1024).toFixed(2) + ' MB' : '—';
      const quota = est.quota ? (est.quota/1024/1024).toFixed(0) + ' MB' : '—';
      text = `Usage: ${used} / ${quota}`;
    } else {
      // Fallback: estimate localStorage size
      let size = 0;
      for (let i=0;i<localStorage.length;i++) {
        const k = localStorage.key(i);
        size += (k?.length||0) + (localStorage.getItem(k)?.length||0);
      }
      text = `LocalStorage: ~${(size/1024).toFixed(1)} KB (estimate)`;
    }
  } catch { text = 'Usage unavailable'; }
  els.usage.textContent = text;
}

// IndexedDB
function openDB(name, version=1) {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) return reject(new Error('IndexedDB not supported'));
    const req = indexedDB.open(name, version);
    req.onupgradeneeded = (e) => {
      const db = req.result;
      // Don't auto-create stores here — user creates via UI
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('DB blocked — close other tabs'));
  });
}

async function refreshIDB() {
  if (!els.idbStores || !els.idbData) return;
  if (!idbDB) {
    els.idbStores.innerHTML = '<div class="muted small">No DB opened — enter name and Create/Open</div>';
    els.idbData.innerHTML = '';
    return;
  }
  idbStores = [...idbDB.objectStoreNames];
  if (idbStores.length===0) {
    els.idbStores.innerHTML = '<div class="muted small">No object stores — create one below</div>';
  } else {
    els.idbStores.innerHTML = idbStores.map(name => `
      <div class="idb-store ${els._selectedStore===name?'selected':''}" data-store="${escapeHtml(name)}" role="button" tabindex="0">
        <span>📦 ${escapeHtml(name)}</span>
        <button class="btn btn-ghost btn-xs" data-action="delete-store" data-store="${escapeHtml(name)}">Delete</button>
      </div>
    `).join('');
    els.idbStores.querySelectorAll('[data-store]').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('[data-action="delete-store"]')) return;
        els._selectedStore = el.dataset.store;
        refreshIDB();
        loadStoreData(els._selectedStore);
      });
    });
    els.idbStores.querySelectorAll('[data-action="delete-store"]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const name = btn.dataset.store;
        if (!confirm(`Delete store "${name}"? This requires DB version bump and will delete all data in store.`)) return;
        const dbName = idbDB.name;
        const version = idbDB.version + 1;
        idbDB.close();
        const req = indexedDB.open(dbName, version);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (db.objectStoreNames.contains(name)) db.deleteObjectStore(name);
        };
        req.onsuccess = () => {
          idbDB = req.result;
          els._selectedStore = null;
          refreshIDB();
          els.idbData.innerHTML = `<div class="muted small">Store "${escapeHtml(name)}" deleted</div>`;
        };
        req.onerror = () => alert('Delete failed: ' + req.error?.message);
      });
    });
  }
  // Highlight selected
  if (els._selectedStore) {
    els.idbStores.querySelectorAll('.idb-store').forEach(el => {
      el.classList.toggle('selected', el.dataset.store===els._selectedStore);
    });
  }
}

async function loadStoreData(storeName) {
  if (!idbDB || !storeName || !els.idbData) return;
  const search = (els.idbSearch?.value || '').toLowerCase();
  try {
    const tx = idbDB.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    const all = await new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
    // Also get keys if autoIncrement or keyPath
    const keysReq = store.getAllKeys();
    const keys = await new Promise((resolve) => {
      keysReq.onsuccess = () => resolve(keysReq.result || []);
      keysReq.onerror = () => resolve([]);
    });
    let filtered = all;
    if (search) {
      filtered = all.filter((item, idx) => {
        const str = JSON.stringify(item).toLowerCase() + String(keys[idx]).toLowerCase();
        return str.includes(search);
      });
    }
    if (filtered.length===0) {
      els.idbData.innerHTML = `<div class="muted small" style="padding:12px;text-align:center">${search?'No matches':'No records — add one'}</div>`;
      return;
    }
    // Show as table if objects with consistent keys
    const sampleKeys = filtered[0] && typeof filtered[0]==='object' && !Array.isArray(filtered[0]) ? Object.keys(filtered[0]) : null;
    if (sampleKeys && sampleKeys.length <= 6) {
      els.idbData.innerHTML = `
        <div style="overflow:auto;max-height:300px">
          <table style="width:100%;border-collapse:collapse;font:400 11px var(--font-mono)">
            <thead><tr><th style="padding:6px;border:1px solid var(--border);background:var(--surface-2)">#</th>${sampleKeys.map(k=>`<th style="padding:6px;border:1px solid var(--border);background:var(--surface-2)">${escapeHtml(k)}</th>`).join('')}<th style="padding:6px;border:1px solid var(--border);background:var(--surface-2)">Actions</th></tr></thead>
            <tbody>
              ${filtered.map((item, idx) => {
                const key = keys[all.indexOf(item)] ?? idx;
                return `<tr>
                  <td style="padding:6px;border:1px solid var(--border)">${escapeHtml(String(key))}</td>
                  ${sampleKeys.map(k=> `<td style="padding:6px;border:1px solid var(--border);max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${escapeHtml(String(item[k]??''))}">${escapeHtml(String(item[k]??''))}</td>`).join('')}
                  <td style="padding:6px;border:1px solid var(--border);text-align:center"><button class="btn btn-ghost btn-xs" data-action="del" data-key="${escapeHtml(String(key))}">Delete</button></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
        <div class="muted small" style="margin-top:6px">${filtered.length}/${all.length} record(s)</div>
      `;
    } else {
      els.idbData.innerHTML = `
        <div style="max-height:300px;overflow:auto;display:flex;flex-direction:column;gap:6px">
          ${filtered.map((item, idx) => {
            const key = keys[all.indexOf(item)] ?? idx;
            return `<div style="padding:8px;background:var(--surface-2);border:1px solid var(--border);border-radius:8px;display:flex;justify-content:space-between;gap:8px;align-items:flex-start">
              <pre style="margin:0;font:400 11px var(--font-mono);white-space:pre-wrap;word-break:break-all;flex:1">${escapeHtml(JSON.stringify(item, null, 2).slice(0,500))}</pre>
              <button class="btn btn-ghost btn-xs" data-action="del" data-key="${escapeHtml(String(key))}">Delete</button>
            </div>`;
          }).join('')}
        </div>
        <div class="muted small" style="margin-top:6px">${filtered.length}/${all.length} record(s)</div>
      `;
    }
    els.idbData.querySelectorAll('[data-action="del"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const key = btn.dataset.key;
        // Try to delete — need to handle key type
        try {
          const tx2 = idbDB.transaction(storeName, 'readwrite');
          const store2 = tx2.objectStore(storeName);
          // Try as number if numeric
          const numKey = Number(key);
          const actualKey = !isNaN(numKey) && String(numKey)===key ? numKey : key;
          store2.delete(actualKey);
          await new Promise((resolve, reject) => { tx2.oncomplete=resolve; tx2.onerror=()=>reject(tx2.error); });
          loadStoreData(storeName);
        } catch (e) { alert('Delete failed: ' + e.message); }
      });
    });
  } catch (e) {
    els.idbData.innerHTML = `<div style="color:var(--danger)">Load failed: ${escapeHtml(e.message)}</div>`;
  }
}

export async function mount(container, ctx) {
  ctxRef = ctx;
  activeTab = 'local';

  container.innerHTML = `
    <div class="storage-tabs" role="tablist" aria-label="Storage tabs">
      <button class="storage-tab active" data-tab="local" role="tab" aria-selected="true">LocalStorage</button>
      <button class="storage-tab" data-tab="session" role="tab" aria-selected="false">SessionStorage</button>
      <button class="storage-tab" data-tab="idb" role="tab" aria-selected="false">IndexedDB</button>
    </div>

    <div class="storage-pane active" data-pane="local">
      <div class="storage-toolbar">
        <input id="localKey" placeholder="Key" aria-label="Key" style="flex:1;min-width:120px;height:36px;padding:0 10px;background:var(--surface);border:1px solid var(--border);border-radius:8px;font:500 12px var(--font-sans)" />
        <input id="localVal" placeholder="Value" aria-label="Value" style="flex:2;min-width:160px;height:36px;padding:0 10px;background:var(--surface);border:1px solid var(--border);border-radius:8px;font:500 12px var(--font-sans)" />
        <button class="btn btn-primary btn-sm" data-action="local-set">Set</button>
        <button class="btn btn-ghost btn-sm" data-action="local-clear">Clear All</button>
      </div>
      <div style="display:flex;gap:8px;margin-top:8px">
        <input id="localSearch" placeholder="Search key/value…" aria-label="Search" style="flex:1;height:32px;padding:0 10px;background:var(--surface);border:1px solid var(--border);border-radius:8px;font:500 12px var(--font-sans)" />
        <span class="muted small" id="storageUsage" style="align-self:center"></span>
      </div>
      <div class="storage-table" id="localTable" style="margin-top:10px"></div>
    </div>

    <div class="storage-pane" data-pane="session">
      <div class="storage-toolbar">
        <input id="sessionKey" placeholder="Key" aria-label="Key" style="flex:1;min-width:120px;height:36px;padding:0 10px;background:var(--surface);border:1px solid var(--border);border-radius:8px;font:500 12px var(--font-sans)" />
        <input id="sessionVal" placeholder="Value" aria-label="Value" style="flex:2;min-width:160px;height:36px;padding:0 10px;background:var(--surface);border:1px solid var(--border);border-radius:8px;font:500 12px var(--font-sans)" />
        <button class="btn btn-primary btn-sm" data-action="session-set">Set</button>
        <button class="btn btn-ghost btn-sm" data-action="session-clear">Clear All</button>
      </div>
      <div style="display:flex;gap:8px;margin-top:8px">
        <input id="sessionSearch" placeholder="Search…" aria-label="Search" style="flex:1;height:32px;padding:0 10px;background:var(--surface);border:1px solid var(--border);border-radius:8px;font:500 12px var(--font-sans)" />
      </div>
      <div class="storage-table" id="sessionTable" style="margin-top:10px"></div>
    </div>

    <div class="storage-pane" data-pane="idb">
      <div class="idb-toolbar">
        <input id="idbName" placeholder="DB name (e.g. myDB)" value="web-universe-db" aria-label="DB name" style="flex:1;min-width:140px;height:36px;padding:0 10px;background:var(--surface);border:1px solid var(--border);border-radius:8px;font:500 12px var(--font-sans)" />
        <button class="btn btn-primary btn-sm" data-action="idb-open">Open/Create</button>
        <button class="btn btn-ghost btn-sm" data-action="idb-delete">Delete DB</button>
        <button class="btn btn-ghost btn-sm" data-action="idb-export">Export JSON</button>
        <input type="file" id="idbImportFile" accept=".json" style="display:none" />
        <button class="btn btn-ghost btn-sm" data-action="idb-import">Import JSON</button>
      </div>
      <div class="idb-layout">
        <div class="idb-sidebar">
          <div class="idb-head"><span>Object Stores</span><button class="btn btn-ghost btn-xs" data-action="idb-create-store">+ Create</button></div>
          <div id="idbStores"></div>
          <div style="margin-top:12px;display:flex;gap:6px">
            <input id="idbNewStore" placeholder="New store name" style="flex:1;height:32px;padding:0 8px;background:var(--surface);border:1px solid var(--border);border-radius:8px;font:500 11px var(--font-sans)" />
          </div>
          <div style="margin-top:8px;display:flex;gap:6px">
            <input id="idbAddKey" placeholder="Key (optional)" style="flex:1;height:32px;padding:0 8px;background:var(--surface);border:1px solid var(--border);border-radius:8px;font:500 11px var(--font-sans)" />
            <input id="idbAddVal" placeholder='Value JSON (e.g. {"name":"a"})' style="flex:2;height:32px;padding:0 8px;background:var(--surface);border:1px solid var(--border);border-radius:8px;font:500 11px var(--font-sans)" />
            <button class="btn btn-primary btn-xs" data-action="idb-add">Add</button>
          </div>
        </div>
        <div class="idb-main">
          <div style="display:flex;gap:8px;margin-bottom:8px">
            <input id="idbSearch" placeholder="Search records…" style="flex:1;height:32px;padding:0 10px;background:var(--surface);border:1px solid var(--border);border-radius:8px;font:500 12px var(--font-sans)" />
          </div>
          <div id="idbData"></div>
        </div>
      </div>
      <div class="muted small" id="idbInfo" style="margin-top:8px"></div>
    </div>
  `;

  els = {
    storageTable: container.querySelector('#localTable'),
    storageSearch: container.querySelector('#localSearch'),
    sessionTable: container.querySelector('#sessionTable'),
    sessionSearch: container.querySelector('#sessionSearch'),
    usage: container.querySelector('#storageUsage'),
    idbStores: container.querySelector('#idbStores'),
    idbData: container.querySelector('#idbData'),
    idbSearch: container.querySelector('#idbSearch'),
    idbInfo: container.querySelector('#idbInfo'),
    _selectedStore: null,
  };

  // Tabs
  container.querySelectorAll('.storage-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab;
      container.querySelectorAll('.storage-tab').forEach(b => {
        const active = b.dataset.tab===activeTab;
        b.classList.toggle('active', active);
        b.setAttribute('aria-selected', String(active));
      });
      container.querySelectorAll('.storage-pane').forEach(p => p.classList.toggle('active', p.dataset.pane===activeTab));
      if (activeTab==='local') { els.storageTable = container.querySelector('#localTable'); els.storageSearch = container.querySelector('#localSearch'); renderStorageTable('local'); }
      if (activeTab==='session') { els.storageTable = container.querySelector('#sessionTable'); els.storageSearch = container.querySelector('#sessionSearch'); renderStorageTable('session'); }
      if (activeTab==='idb') { els.idbStores = container.querySelector('#idbStores'); els.idbData = container.querySelector('#idbData'); refreshIDB(); }
    });
  });

  // LocalStorage
  const localKey = container.querySelector('#localKey');
  const localVal = container.querySelector('#localVal');
  container.querySelector('[data-action="local-set"]')?.addEventListener('click', () => {
    const k = localKey.value.trim();
    if (!k) return;
    localStorage.setItem(k, localVal.value);
    localKey.value=''; localVal.value='';
    renderStorageTable('local'); updateUsage();
  });
  container.querySelector('[data-action="local-clear"]')?.addEventListener('click', () => {
    if (!confirm('Clear all LocalStorage?')) return;
    localStorage.clear();
    renderStorageTable('local'); updateUsage();
  });
  container.querySelector('#localSearch')?.addEventListener('input', () => renderStorageTable('local'));

  // SessionStorage
  const sessionKey = container.querySelector('#sessionKey');
  const sessionVal = container.querySelector('#sessionVal');
  container.querySelector('[data-action="session-set"]')?.addEventListener('click', () => {
    const k = sessionKey.value.trim();
    if (!k) return;
    sessionStorage.setItem(k, sessionVal.value);
    sessionKey.value=''; sessionVal.value='';
    els.storageTable = container.querySelector('#sessionTable');
    els.storageSearch = container.querySelector('#sessionSearch');
    renderStorageTable('session');
  });
  container.querySelector('[data-action="session-clear"]')?.addEventListener('click', () => {
    if (!confirm('Clear all SessionStorage?')) return;
    sessionStorage.clear();
    els.storageTable = container.querySelector('#sessionTable');
    renderStorageTable('session');
  });
  container.querySelector('#sessionSearch')?.addEventListener('input', () => {
    els.storageTable = container.querySelector('#sessionTable');
    els.storageSearch = container.querySelector('#sessionSearch');
    renderStorageTable('session');
  });

  // IndexedDB
  const idbNameInput = container.querySelector('#idbName');
  container.querySelector('[data-action="idb-open"]')?.addEventListener('click', async () => {
    const name = idbNameInput.value.trim() || 'web-universe-db';
    try {
      if (idbDB) idbDB.close();
      idbDB = await openDB(name);
      els.idbInfo.textContent = `DB "${name}" opened — version ${idbDB.version} — ${idbDB.objectStoreNames.length} store(s)`;
      els.idbInfo.style.color='var(--success)';
      refreshIDB();
    } catch (e) {
      els.idbInfo.textContent = 'Open failed: ' + e.message;
      els.idbInfo.style.color='var(--danger)';
    }
  });
  container.querySelector('[data-action="idb-delete"]')?.addEventListener('click', async () => {
    const name = idbNameInput.value.trim() || 'web-universe-db';
    if (!confirm(`Delete DB "${name}"? All data will be lost.`)) return;
    if (idbDB) { idbDB.close(); idbDB=null; }
    const req = indexedDB.deleteDatabase(name);
    req.onsuccess = () => { els.idbInfo.textContent=`DB "${name}" deleted`; refreshIDB(); };
    req.onerror = () => { els.idbInfo.textContent='Delete failed: ' + req.error?.message; };
  });
  container.querySelector('[data-action="idb-create-store"]')?.addEventListener('click', async () => {
    const storeName = container.querySelector('#idbNewStore')?.value.trim();
    if (!storeName) { alert('Enter store name'); return; }
    if (!idbDB) { alert('Open a DB first'); return; }
    if (idbDB.objectStoreNames.contains(storeName)) { alert('Store already exists'); return; }
    const dbName = idbDB.name;
    const version = idbDB.version + 1;
    idbDB.close();
    const req = indexedDB.open(dbName, version);
    req.onupgradeneeded = () => {
      const db = req.result;
      db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
    };
    req.onsuccess = () => {
      idbDB = req.result;
      container.querySelector('#idbNewStore').value='';
      els._selectedStore = storeName;
      refreshIDB();
      loadStoreData(storeName);
      els.idbInfo.textContent=`Store "${storeName}" created`;
    };
    req.onerror = () => alert('Create failed: ' + req.error?.message);
  });
  container.querySelector('[data-action="idb-add"]')?.addEventListener('click', async () => {
    const storeName = els._selectedStore;
    if (!storeName) { alert('Select a store first'); return; }
    const keyVal = container.querySelector('#idbAddKey')?.value.trim();
    const valStr = container.querySelector('#idbAddVal')?.value.trim();
    if (!valStr) { alert('Enter value JSON'); return; }
    let val;
    try { val = JSON.parse(valStr); } catch { val = valStr; }
    // If key provided and object, set id
    if (keyVal && typeof val==='object' && val!==null) val.id = isNaN(Number(keyVal)) ? keyVal : Number(keyVal);
    else if (keyVal && typeof val!=='object') {
      // For primitive, wrap?
      val = { id: isNaN(Number(keyVal)) ? keyVal : Number(keyVal), value: val };
    }
    try {
      const tx = idbDB.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      if (keyVal && typeof val!=='object') {
        // already handled
      }
      const req = store.add(val);
      await new Promise((resolve, reject) => { req.onsuccess=resolve; req.onerror=()=>reject(req.error); });
      await new Promise((resolve, reject) => { tx.oncomplete=resolve; tx.onerror=()=>reject(tx.error); });
      container.querySelector('#idbAddVal').value='';
      container.querySelector('#idbAddKey').value='';
      loadStoreData(storeName);
    } catch (e) { alert('Add failed: ' + e.message); }
  });
  container.querySelector('#idbSearch')?.addEventListener('input', () => {
    if (els._selectedStore) loadStoreData(els._selectedStore);
  });
  // Export/Import
  container.querySelector('[data-action="idb-export"]')?.addEventListener('click', async () => {
    if (!idbDB) { alert('Open a DB first'); return; }
    const dump = { dbName: idbDB.name, version: idbDB.version, stores: {} };
    for (const storeName of [...idbDB.objectStoreNames]) {
      const tx = idbDB.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const all = await new Promise((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess=()=>resolve(req.result||[]);
        req.onerror=()=>reject(req.error);
      });
      dump.stores[storeName] = all;
    }
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download=`${dump.dbName}-export.json`; a.click();
    setTimeout(()=> URL.revokeObjectURL(url), 1000);
  });
  const importFile = container.querySelector('#idbImportFile');
  container.querySelector('[data-action="idb-import"]')?.addEventListener('click', () => importFile.click());
  importFile?.addEventListener('change', async () => {
    const file = importFile.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const dump = JSON.parse(text);
      if (!dump.stores || typeof dump.stores!=='object') throw new Error('Invalid export format');
      // Need to create stores if not exist, then put data
      let dbName = dump.dbName || idbNameInput.value.trim() || 'web-universe-db';
      // Open with version bump if needed
      if (idbDB) idbDB.close();
      // First, ensure DB exists and has stores
      let db = await new Promise((resolve, reject) => {
        const req = indexedDB.open(dbName);
        req.onupgradeneeded = () => {
          const d = req.result;
          for (const storeName of Object.keys(dump.stores)) {
            if (!d.objectStoreNames.contains(storeName)) d.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
          }
        };
        req.onsuccess=()=>resolve(req.result);
        req.onerror=()=>reject(req.error);
      });
      // Check if any store missing (if DB existed before)
      const missing = Object.keys(dump.stores).filter(s=> !db.objectStoreNames.contains(s));
      if (missing.length>0) {
        const version = db.version + 1;
        db.close();
        db = await new Promise((resolve, reject) => {
          const req = indexedDB.open(dbName, version);
          req.onupgradeneeded = () => {
            const d = req.result;
            for (const s of missing) if (!d.objectStoreNames.contains(s)) d.createObjectStore(s, { keyPath: 'id', autoIncrement: true });
          };
          req.onsuccess=()=>resolve(req.result);
          req.onerror=()=>reject(req.error);
        });
      }
      idbDB = db;
      idbNameInput.value = dbName;
      // Put data
      for (const [storeName, records] of Object.entries(dump.stores)) {
        const tx = idbDB.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        for (const rec of records) {
          try { store.put(rec); } catch {}
        }
        await new Promise((resolve, reject) => { tx.oncomplete=resolve; tx.onerror=()=>reject(tx.error); });
      }
      els.idbInfo.textContent = `Imported ${Object.keys(dump.stores).length} store(s)`;
      refreshIDB();
      if (els._selectedStore) loadStoreData(els._selectedStore);
    } catch (e) { alert('Import failed: ' + e.message); }
    importFile.value='';
  });

  // Initial render
  renderStorageTable('local');
  updateUsage();
  // Try to auto-open default DB
  try {
    idbDB = await openDB('web-universe-db');
    els.idbInfo.textContent = `DB "web-universe-db" opened — ${idbDB.objectStoreNames.length} store(s)`;
    refreshIDB();
  } catch (e) {
    els.idbInfo.textContent = 'IndexedDB: ' + e.message;
  }

  ctxRef?.logger?.info('storage-lab: mounted');
}

export async function unmount() {
  if (idbDB) { try{ idbDB.close(); }catch{} idbDB=null; }
  idbStores=[]; els={}; ctxRef=null;
}
export async function destroy() { await unmount(); }
