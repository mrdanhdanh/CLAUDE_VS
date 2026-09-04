export const manifest = {
  id: 'plugin-lab',
  name: 'Plugin Lab',
  version: '1.0.0',
  category: 'system',
  description: 'Register new modules at runtime — manifest validate, Blob import, no reload.',
  dependencies: [],
  permissions: [],
  lazy: true,
  icon: '🔌',
};

let els = {};
let ctxRef = null;

function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function validateManifest(obj) {
  if (!obj || typeof obj !== 'object') return 'Must be JSON object';
  if (!obj.id || typeof obj.id !== 'string' || !/^[a-z0-9-]+$/.test(obj.id)) return 'id required: lowercase alphanumeric + hyphen';
  if (!obj.name || typeof obj.name !== 'string') return 'name required';
  if (!obj.version || typeof obj.version !== 'string') return 'version required';
  if (obj.dependencies && !Array.isArray(obj.dependencies)) return 'dependencies must be array';
  if (obj.permissions && !Array.isArray(obj.permissions)) return 'permissions must be array';
  // check duplicate
  try {
    if (window.WEB_UNIVERSE?.moduleManager?.get(obj.id)) return `id "${obj.id}" already exists`;
  } catch {}
  return null;
}

const EXAMPLES = [
  { id: 'hello-plugin', name: 'Hello Plugin', version: '1.0.0', category: 'demo', description: 'A minimal hello world plugin', dependencies: [], permissions: [], lazy: true, icon: '👋' },
  { id: 'clock-plugin', name: 'Clock Plugin', version: '1.0.0', category: 'utilities', description: 'Live clock widget', dependencies: [], permissions: [], lazy: true, icon: '🕐' },
  { id: 'notes-plugin', name: 'Notes Plugin', version: '1.0.0', category: 'text', description: 'Quick notes with autosave', dependencies: [], permissions: [], lazy: true, icon: '📝' },
];

function createPluginCode(manifest) {
  const name = manifest.name || manifest.id;
  const icon = manifest.icon || '🔌';
  // Simple plugin that renders a card
  return `
export const manifest = ${JSON.stringify(manifest, null, 2)};
export async function mount(container, ctx) {
  container.innerHTML = \`
    <div style="text-align:center;padding:24px">
      <div style="width:56px;height:56px;border-radius:16px;display:grid;place-items:center;background:var(--primary-soft);color:var(--primary);font-size:24px;margin:0 auto 12px">${icon}</div>
      <h3 style="font:700 16px var(--font-sans)">${name}</h3>
      <p class="muted small" style="margin-top:8px">${manifest.description || 'A dynamically registered plugin'}</p>
      <div style="margin-top:12px;display:flex;gap:6px;justify-content:center;flex-wrap:wrap">
        <span class="badge">v\${manifest.version}</span>
        <span class="badge badge-category">\${manifest.category||'demo'}</span>
        <span class="badge">Plugin</span>
      </div>
      <div style="margin-top:16px;padding:12px;background:var(--surface-2);border:1px solid var(--border);border-radius:8px;text-align:left">
        <div style="font:600 11px var(--font-sans)">This is a runtime plugin!</div>
        <div class="muted small" style="margin-top:4px">Registered via Plugin Lab without reloading. Try the button:</div>
        <button class="btn btn-primary btn-sm" id="pluginBtn" style="margin-top:8px">Click me</button>
        <div class="muted small" id="pluginOut" style="margin-top:6px"></div>
      </div>
    </div>
  \`;
  container.querySelector('#pluginBtn')?.addEventListener('click', () => {
    const out = container.querySelector('#pluginOut');
    if (out) out.textContent = 'Clicked at ' + new Date().toLocaleTimeString() + ' ✓';
    ctx?.logger?.info('plugin:' + manifest.id + ' clicked');
  });
  ctx?.logger?.info('plugin:' + manifest.id + ' mounted');
}
export async function unmount() {}
export async function destroy() {}
`;
}

export async function mount(container, ctx) {
  ctxRef = ctx;
  // Load persisted plugins list
  let persisted = [];
  try { const raw = localStorage.getItem('web-universe:plugins'); if (raw) persisted = JSON.parse(raw); } catch {}

  container.innerHTML = `
    <div class="plugin-examples">
      <div class="muted small" style="margin-bottom:6px">Example plugins — click to load:</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        ${EXAMPLES.map(ex=> `<button class="btn btn-ghost btn-xs" data-example="${ex.id}">${escapeHtml(ex.icon)} ${escapeHtml(ex.name)}</button>`).join('')}
      </div>
    </div>
    <div style="margin-top:12px">
      <label class="muted small" style="font:600 11px var(--font-sans)">Manifest JSON</label>
      <textarea id="pluginManifest" placeholder='{"id":"my-plugin","name":"My Plugin","version":"1.0.0","category":"demo","description":"...","dependencies":[],"permissions":[]}' style="width:100%;min-height:120px;margin-top:4px;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:10px;font:400 11px var(--font-mono)">${JSON.stringify(EXAMPLES[0], null, 2)}</textarea>
      <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
        <button class="btn btn-ghost btn-sm" data-action="validate">Validate</button>
        <button class="btn btn-primary btn-sm" data-action="register">Register</button>
        <button class="btn btn-ghost btn-sm" data-action="clear">Clear</button>
      </div>
      <div id="pluginStatus" style="margin-top:8px;min-height:24px;font:500 11px var(--font-mono)"></div>
    </div>
    <div style="margin-top:12px">
      <h4 style="font:700 12px var(--font-sans)">Registered Plugins</h4>
      <div id="pluginList" style="margin-top:6px;display:flex;flex-direction:column;gap:6px"></div>
    </div>
    <div class="muted small" style="margin-top:12px;padding:10px;background:var(--surface-2);border:1px solid var(--border);border-radius:8px">
      <b>How it works:</b> Validate → Register (moduleManager.register) → Create Blob URL with module code → Enable (dynamic import). No reload, no app.js edit. Follows spec §32 Plugin Architecture.
    </div>
  `;

  els = {
    manifest: container.querySelector('#pluginManifest'),
    status: container.querySelector('#pluginStatus'),
    list: container.querySelector('#pluginList'),
  };

  function renderList() {
    const all = window.WEB_UNIVERSE?.moduleManager?.list() || [];
    const plugins = all.filter(m=> {
      // Consider plugins as those not in original CATALOG or with id in persisted
      const isOriginal = ['text-editor','canvas-lab','json-tool','markdown','code-playground','diff','svg-lab','webgl-lab','webgpu','audio-lab','file-lab','storage-lab','network-lab','concurrency-lab','device-lab','audio-engine','pwa-lab','game-lab','data-lab','viz-lab','security-lab','api-explorer','devtools','utilities','crash-demo','dependency-graph','plugin-lab','theme-lab','benchmark-lab','sandbox-lab','debug-lab'].includes(m.id);
      return !isOriginal;
    });
    // Also show persisted
    const combined = [...new Set([...plugins.map(p=>p.id), ...persisted.map(p=>p.id)])];
    if (combined.length===0) {
      els.list.innerHTML = '<span class="muted small">No plugins yet — register one above</span>';
      return;
    }
    els.list.innerHTML = combined.map(id=> {
      const m = window.WEB_UNIVERSE?.moduleManager?.get(id);
      const status = m?.status || 'unknown';
      const meta = m?.meta || persisted.find(p=>p.id===id) || { name: id };
      return `<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 10px;background:var(--surface-2);border:1px solid var(--border);border-radius:8px">
        <span><b>${escapeHtml(meta.name||id)}</b> <span class="badge">${escapeHtml(id)}</span> <span class="badge" style="background:${status==='active'?'rgba(16,185,129,.12)':'var(--surface)'}">${escapeHtml(status)}</span></span>
        <span style="display:flex;gap:4px">
          <button class="btn btn-ghost btn-xs" data-enable="${id}" ${status==='active'?'disabled':''}>Enable</button>
          <button class="btn btn-ghost btn-xs" data-disable="${id}" ${status!=='active'?'disabled':''}>Disable</button>
        </span>
      </div>`;
    }).join('');
    els.list.querySelectorAll('[data-enable]').forEach(btn=>{
      btn.addEventListener('click', async()=>{
        const id=btn.dataset.enable;
        try { await window.WEB_UNIVERSE.moduleManager.enable(id); els.status.innerHTML=`<span style="color:var(--success)">✓ Enabled ${escapeHtml(id)}</span>`; renderList(); } catch(e){ els.status.innerHTML=`<span style="color:var(--danger)">Enable failed: ${escapeHtml(e.message)}</span>`; }
      });
    });
    els.list.querySelectorAll('[data-disable]').forEach(btn=>{
      btn.addEventListener('click', async()=>{
        const id=btn.dataset.disable;
        try { await window.WEB_UNIVERSE.moduleManager.disable(id); els.status.innerHTML=`<span style="color:var(--success)">✓ Disabled ${escapeHtml(id)}</span>`; renderList(); } catch(e){ els.status.innerHTML=`<span style="color:var(--danger)">${escapeHtml(e.message)}</span>`; }
      });
    });
  }

  // Example buttons
  container.querySelectorAll('[data-example]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const ex=EXAMPLES.find(e=>e.id===btn.dataset.example);
      if(ex) els.manifest.value=JSON.stringify(ex,null,2);
    });
  });

  container.querySelector('[data-action="validate"]')?.addEventListener('click',()=>{
    try{
      const obj=JSON.parse(els.manifest.value);
      const err=validateManifest(obj);
      if(err) els.status.innerHTML=`<span style="color:var(--danger)">✗ ${escapeHtml(err)}</span>`;
      else els.status.innerHTML=`<span style="color:var(--success)">✓ Valid — ready to register</span>`;
    }catch(e){
      els.status.innerHTML=`<span style="color:var(--danger)">✗ JSON invalid: ${escapeHtml(e.message)}</span>`;
    }
  });

  container.querySelector('[data-action="register"]')?.addEventListener('click', async()=>{
    let obj;
    try{ obj=JSON.parse(els.manifest.value); }catch(e){ els.status.innerHTML=`<span style="color:var(--danger)">✗ JSON invalid: ${escapeHtml(e.message)}</span>`; return; }
    const err=validateManifest(obj);
    if(err){ els.status.innerHTML=`<span style="color:var(--danger)">✗ ${escapeHtml(err)}</span>`; return; }
    // Check dependencies exist
    for(const dep of obj.dependencies||[]){
      if(!window.WEB_UNIVERSE.moduleManager.get(dep)){
        els.status.innerHTML=`<span style="color:var(--danger)">✗ Missing dependency: ${escapeHtml(dep)}</span>`;
        return;
      }
    }
    try{
      // Register
      window.WEB_UNIVERSE.moduleManager.register(obj);
      // Create Blob URL for module code
      const code=createPluginCode(obj);
      const blob=new Blob([code],{type:'application/javascript'});
      const url=URL.createObjectURL(blob);
      // Store mapping for moduleManager to import — we need to intercept import
      // Instead, we store code and override enable to use Blob URL
      // Simplest: store in window and patch moduleManager.load for this id
      if(!window._pluginBlobs) window._pluginBlobs={};
      window._pluginBlobs[obj.id]=url;
      // Patch load if not already
      if(!window._pluginPatched){
        const origLoad=window.WEB_UNIVERSE.moduleManager.load;
        window.WEB_UNIVERSE.moduleManager.load=async function(id){
          if(window._pluginBlobs[id]){
            const mod=await import(window._pluginBlobs[id]);
            const entry=window.WEB_UNIVERSE.moduleManager._registry.get(id);
            if(entry){
              entry.instance=mod;
              entry.status='loaded';
              window.WEB_UNIVERSE.state.setModuleStatus(id,'loaded');
            }
            return entry;
          }
          return origLoad.call(this,id);
        };
        window._pluginPatched=true;
      }
      // Persist
      persisted.push(obj);
      try{ localStorage.setItem('web-universe:plugins', JSON.stringify(persisted)); }catch{}
      els.status.innerHTML=`<span style="color:var(--success)">✓ Registered ${escapeHtml(obj.id)} — now click Enable</span>`;
      renderList();
      ctxRef?.logger?.info('plugin-lab: registered', obj.id);
    }catch(e){
      els.status.innerHTML=`<span style="color:var(--danger)">✗ Register failed: ${escapeHtml(e.message)}</span>`;
    }
  });

  container.querySelector('[data-action="clear"]')?.addEventListener('click',()=>{
    els.manifest.value='';
    els.status.innerHTML='';
  });

  renderList();
  ctxRef?.logger?.info('plugin-lab: mounted');
}

export async function unmount(){ els={}; ctxRef=null; }
export async function destroy(){ await unmount(); }
