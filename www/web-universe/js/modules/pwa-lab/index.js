export const manifest = {
  id: 'pwa-lab',
  name: 'PWA Lab',
  version: '1.0.0',
  category: 'pwa',
  description: 'Manifest, Service Worker, Cache, Offline, Install — PWA status.',
  dependencies: [],
  permissions: [],
  lazy: true,
  icon: '📲',
};

let els = {};
let ctxRef = null;

function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

export async function mount(container, ctx) {
  ctxRef = ctx;
  container.innerHTML = `
    <div class="pwa-grid">
      <div class="pwa-card">
        <h4>📄 Manifest</h4>
        <div id="pwaManifest" class="muted small">Loading…</div>
      </div>
      <div class="pwa-card">
        <h4>⚙ Service Worker</h4>
        <div id="pwaSW" class="muted small">Checking…</div>
        <div style="display:flex;gap:6px;margin-top:8px">
          <button class="btn btn-ghost btn-xs" data-action="sw-update">Check Update</button>
          <button class="btn btn-ghost btn-xs" data-action="sw-unregister">Unregister</button>
        </div>
      </div>
      <div class="pwa-card">
        <h4>💾 Cache API</h4>
        <div id="pwaCache" class="muted small">Checking…</div>
        <div style="display:flex;gap:6px;margin-top:8px">
          <button class="btn btn-ghost btn-xs" data-action="cache-clear">Clear Caches</button>
          <button class="btn btn-ghost btn-xs" data-action="cache-refresh">Refresh</button>
        </div>
      </div>
      <div class="pwa-card">
        <h4>🌐 Offline</h4>
        <div id="pwaOffline" class="muted small">Checking…</div>
        <div style="display:flex;gap:6px;margin-top:8px">
          <button class="btn btn-ghost btn-xs" data-action="offline-test">Test Offline</button>
        </div>
        <div class="pwa-offline-demo" id="pwaOfflineDemo" style="margin-top:8px;padding:10px;background:var(--surface-2);border:1px solid var(--border);border-radius:8px;font:400 11px var(--font-mono)"></div>
      </div>
      <div class="pwa-card">
        <h4>📲 Install</h4>
        <div id="pwaInstall" class="muted small">Checking…</div>
        <button class="btn btn-primary btn-sm" data-action="install" style="margin-top:8px;display:none" id="btnInstall">Install App</button>
      </div>
      <div class="pwa-card">
        <h4>🔄 Update Detection</h4>
        <div id="pwaUpdate" class="muted small">Checking…</div>
      </div>
    </div>
  `;

  els = {
    manifest: container.querySelector('#pwaManifest'),
    sw: container.querySelector('#pwaSW'),
    cache: container.querySelector('#pwaCache'),
    offline: container.querySelector('#pwaOffline'),
    offlineDemo: container.querySelector('#pwaOfflineDemo'),
    install: container.querySelector('#pwaInstall'),
    update: container.querySelector('#pwaUpdate'),
    btnInstall: container.querySelector('#btnInstall'),
  };

  // Manifest
  try {
    const res = await fetch('./manifest.webmanifest', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const mf = await res.json();
    els.manifest.innerHTML = `
      <div>Name: <b>${escapeHtml(mf.name||'—')}</b></div>
      <div>Short: <b>${escapeHtml(mf.short_name||'—')}</b></div>
      <div>Display: <b>${escapeHtml(mf.display||'—')}</b></div>
      <div>Theme: <b>${escapeHtml(mf.theme_color||'—')}</b></div>
      <div>Start URL: <b>${escapeHtml(mf.start_url||'—')}</b></div>
      <div>Icons: <b>${(mf.icons||[]).length}</b></div>
      <div style="margin-top:6px"><span class="badge badge-ok">✓ Manifest found</span></div>
    `;
  } catch (e) {
    els.manifest.innerHTML = `<span style="color:var(--danger)">✗ Manifest failed: ${escapeHtml(e.message)}</span>`;
  }

  // SW
  async function updateSW() {
    if (!('serviceWorker' in navigator)) {
      els.sw.innerHTML = '<span style="color:var(--danger)">✗ Service Worker not supported</span>';
      return;
    }
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        els.sw.innerHTML = '<span style="color:var(--warning)">○ Not registered — will register on next load</span><div class="muted small" style="margin-top:4px">SW: ./sw.js (stub, Part 1)</div>';
      } else {
        const state = reg.active?.state || reg.installing?.state || reg.waiting?.state || 'unknown';
        els.sw.innerHTML = `
          <div><span class="badge badge-ok">● Registered</span> State: <b>${escapeHtml(state)}</b></div>
          <div>Scope: <b>${escapeHtml(reg.scope)}</b></div>
          <div>Controller: <b>${navigator.serviceWorker.controller ? 'Yes' : 'No'}</b></div>
          <div>Update via: <b>${escapeHtml(reg.updateViaCache||'—')}</b></div>
        `;
      }
    } catch (e) {
      els.sw.innerHTML = `<span style="color:var(--danger)">Error: ${escapeHtml(e.message)}</span>`;
    }
  }
  await updateSW();
  container.querySelector('[data-action="sw-update"]')?.addEventListener('click', async () => {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) { await reg.update(); els.sw.innerHTML += '<div class="muted small" style="margin-top:4px">Update checked</div>'; }
      else els.sw.innerHTML += '<div class="muted small">No registration to update</div>';
    } catch (e) { alert('Update failed: ' + e.message); }
  });
  container.querySelector('[data-action="sw-unregister"]')?.addEventListener('click', async () => {
    if (!confirm('Unregister Service Worker?')) return;
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) await reg.unregister();
      await updateSW();
    } catch (e) { alert('Unregister failed: ' + e.message); }
  });

  // Cache
  async function updateCache() {
    if (!('caches' in window)) {
      els.cache.innerHTML = '<span style="color:var(--danger)">✗ Cache API not supported</span>';
      return;
    }
    try {
      const keys = await caches.keys();
      if (keys.length===0) {
        els.cache.innerHTML = '<div>0 caches — SW stub does not cache yet (Part 6 will add)</div><div class="muted small">Cache API available ✓</div>';
        return;
      }
      let totalEntries = 0;
      let html = `<div>${keys.length} cache(s):</div>`;
      for (const key of keys) {
        const cache = await caches.open(key);
        const entries = await cache.keys();
        totalEntries += entries.length;
        html += `<div style="margin-top:4px"><b>${escapeHtml(key)}</b>: ${entries.length} entries</div>`;
        if (entries.length>0) {
          html += `<div class="muted small" style="margin-left:8px">${entries.slice(0,5).map(r=>escapeHtml(r.url.slice(-60))).join('<br/>')}${entries.length>5?'…':''}</div>`;
        }
      }
      html += `<div class="muted small" style="margin-top:6px">Total: ${totalEntries} entries</div>`;
      els.cache.innerHTML = html;
    } catch (e) {
      els.cache.innerHTML = `<span style="color:var(--danger)">Error: ${escapeHtml(e.message)}</span>`;
    }
  }
  await updateCache();
  container.querySelector('[data-action="cache-clear"]')?.addEventListener('click', async () => {
    if (!confirm('Clear all caches?')) return;
    const keys = await caches.keys();
    for (const k of keys) await caches.delete(k);
    await updateCache();
  });
  container.querySelector('[data-action="cache-refresh"]')?.addEventListener('click', updateCache);

  // Offline
  function updateOffline() {
    const online = navigator.onLine;
    els.offline.innerHTML = online
      ? '<span class="badge badge-ok">● Online</span> <span class="muted small">All features available</span>'
      : '<span class="badge" style="background:rgba(239,68,68,.15);color:var(--danger)">🔴 Offline</span> <span class="muted small">Local modules still work</span>';
    // Demo
    els.offlineDemo.innerHTML = `
      <div>Documents <span style="float:right">${online?'✓':'✓'}</span></div>
      <div>Editor <span style="float:right">${online?'✓':'✓'}</span></div>
      <div>Calculator <span style="float:right">${online?'✓':'✓'}</span></div>
      <div>Saved data <span style="float:right">${online?'✓':'✓'}</span></div>
      <div>Network API <span style="float:right">${online?'✓':'<span style="color:var(--danger)">✗</span>'}</span></div>
    `;
  }
  updateOffline();
  window.addEventListener('online', updateOffline);
  window.addEventListener('offline', updateOffline);
  els._offlineHandler = updateOffline;
  container.querySelector('[data-action="offline-test"]')?.addEventListener('click', () => {
    alert(`Current: ${navigator.onLine ? 'Online' : 'Offline'}\n\nTo test offline:\n1. Open DevTools → Network → Offline\n2. Reload — local modules should still work\n3. Network Lab should show 🔴`);
  });

  // Install
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    els.install.innerHTML = '<span class="badge badge-ok">● Install available</span> <span class="muted small">Click Install</span>';
    els.btnInstall.style.display = 'inline-flex';
  });
  // Check if already installed
  if (window.matchMedia('(display-mode: standalone)').matches) {
    els.install.innerHTML = '<span class="badge badge-ok">● Already installed (standalone)</span>';
  } else if (!deferredPrompt) {
    // Wait a bit, then show not available
    setTimeout(() => {
      if (!deferredPrompt && els.install.textContent.includes('Checking')) {
        els.install.innerHTML = '<span class="muted small">Install prompt not available — need HTTPS + SW + manifest + user engagement</span>';
      }
    }, 2000);
  }
  els.btnInstall?.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    els.install.innerHTML = `Choice: <b>${choice.outcome}</b>`;
    deferredPrompt = null;
    els.btnInstall.style.display = 'none';
  });

  // Update detection
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      els.update.innerHTML = '<span class="badge badge-ok">● Controller changed — new SW activated</span>';
    });
    // Check for waiting SW
    navigator.serviceWorker.getRegistration().then(reg => {
      if (reg?.waiting) {
        els.update.innerHTML = '<span style="color:var(--warning)">⚠ Update available — waiting to activate</span> <button class="btn btn-ghost btn-xs" data-action="skip-waiting">Activate</button>';
        els.update.querySelector('[data-action="skip-waiting"]')?.addEventListener('click', () => {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        });
      } else {
        els.update.innerHTML = '<span class="muted small">No update — SW is current</span>';
      }
    });
  } else {
    els.update.innerHTML = '<span style="color:var(--danger)">✗ SW not supported</span>';
  }

  ctxRef?.logger?.info('pwa-lab: mounted');
}

export async function unmount() {
  if (els._offlineHandler) {
    window.removeEventListener('online', els._offlineHandler);
    window.removeEventListener('offline', els._offlineHandler);
  }
  els={}; ctxRef=null;
}
export async function destroy() { await unmount(); }
