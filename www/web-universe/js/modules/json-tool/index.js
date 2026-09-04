export const manifest = {
  id: 'json-tool',
  name: 'JSON Tool',
  version: '1.0.0',
  category: 'devtools',
  description: 'Formatter, validator, tree viewer, search, copy path — cho JSON.',
  dependencies: [],
  permissions: [],
  lazy: true,
  icon: '🧩',
};

let els = {};
let ctxRef = null;
let lastParsed = null;
let lastPath = '';

export async function mount(container, ctx) {
  ctxRef = ctx;
  container.innerHTML = `
    <div class="module-toolbar">
      <button class="btn btn-primary btn-sm" data-action="format">Format</button>
      <button class="btn btn-ghost btn-sm" data-action="minify">Minify</button>
      <button class="btn btn-ghost btn-sm" data-action="validate">Validate</button>
      <button class="btn btn-ghost btn-sm" data-action="copy">Copy</button>
      <button class="btn btn-ghost btn-sm" data-action="clear">Clear</button>
      <span class="muted small" id="jsonStatus" style="margin-left:auto;align-self:center"></span>
    </div>
    <textarea class="json-input" id="jsonInput" placeholder='Paste JSON here… e.g. {"name":"WEB UNIVERSE","modules":12}' aria-label="JSON input"></textarea>
    <div class="json-actions">
      <input id="jsonSearch" placeholder="Search key or value…" aria-label="Search JSON" style="flex:1;min-width:160px;height:36px;padding:0 10px;background:var(--surface);border:1px solid var(--border);border-radius:8px;font:500 13px var(--font-sans)" />
      <button class="btn btn-ghost btn-sm" data-action="search">Search</button>
      <button class="btn btn-ghost btn-sm" data-action="tree">Tree View</button>
    </div>
    <div class="json-tree" id="jsonTree" style="margin-top:10px;display:none"></div>
    <div class="json-path" id="jsonPath"></div>
    <div class="muted small" id="jsonInfo" style="margin-top:8px"></div>
  `;

  els = {
    input: container.querySelector('#jsonInput'),
    tree: container.querySelector('#jsonTree'),
    path: container.querySelector('#jsonPath'),
    status: container.querySelector('#jsonStatus'),
    info: container.querySelector('#jsonInfo'),
    search: container.querySelector('#jsonSearch'),
  };

  // Restore
  try {
    const saved = localStorage.getItem('web-universe:json-tool');
    if (saved) els.input.value = saved;
  } catch {}

  const save = () => { try { localStorage.setItem('web-universe:json-tool', els.input.value); } catch {} };

  function setStatus(msg, type='') {
    els.status.textContent = msg;
    els.status.style.color = type==='error' ? 'var(--danger)' : type==='success' ? 'var(--success)' : 'var(--text-2)';
  }

  function tryParse() {
    const text = els.input.value.trim();
    if (!text) { lastParsed = null; return null; }
    try {
      const obj = JSON.parse(text);
      lastParsed = obj;
      els.input.classList.remove('error');
      return obj;
    } catch (e) {
      lastParsed = null;
      els.input.classList.add('error');
      setStatus('Invalid JSON: ' + e.message, 'error');
      els.info.textContent = e.message;
      return null;
    }
  }

  container.querySelector('[data-action="format"]')?.addEventListener('click', () => {
    const obj = tryParse();
    if (obj !== null) {
      els.input.value = JSON.stringify(obj, null, 2);
      save();
      setStatus('Formatted ✓', 'success');
      els.info.textContent = `Formatted — ${els.input.value.length} chars`;
      renderTree(obj);
    }
  });
  container.querySelector('[data-action="minify"]')?.addEventListener('click', () => {
    const obj = tryParse();
    if (obj !== null) {
      els.input.value = JSON.stringify(obj);
      save();
      setStatus('Minified ✓', 'success');
      els.info.textContent = `Minified — ${els.input.value.length} chars`;
    }
  });
  container.querySelector('[data-action="validate"]')?.addEventListener('click', () => {
    const obj = tryParse();
    if (obj !== null) {
      setStatus('Valid JSON ✓', 'success');
      els.info.textContent = `Valid — type: ${Array.isArray(obj) ? 'array' : typeof obj}, keys: ${obj && typeof obj==='object' ? Object.keys(obj).length : '—'}`;
      renderTree(obj);
    }
  });
  container.querySelector('[data-action="copy"]')?.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(els.input.value); setStatus('Copied ✓', 'success'); } catch { setStatus('Copy failed', 'error'); }
  });
  container.querySelector('[data-action="clear"]')?.addEventListener('click', () => {
    els.input.value = ''; els.tree.style.display='none'; els.tree.innerHTML=''; els.path.textContent=''; setStatus(''); els.info.textContent=''; save(); lastParsed=null;
  });
  container.querySelector('[data-action="tree"]')?.addEventListener('click', () => {
    const obj = tryParse();
    if (obj !== null) renderTree(obj);
  });
  container.querySelector('[data-action="search"]')?.addEventListener('click', doSearch);
  els.search.addEventListener('keydown', (e)=>{ if(e.key==='Enter') doSearch(); });
  els.input.addEventListener('input', () => { save(); els.input.classList.remove('error'); setStatus(''); });

  function doSearch() {
    const q = els.search.value.trim().toLowerCase();
    if (!q) { els.info.textContent=''; return; }
    const obj = tryParse();
    if (obj === null) return;
    const hits = [];
    walk(obj, '', (path, key, val) => {
      const k = String(key).toLowerCase();
      const v = String(val).toLowerCase();
      if (k.includes(q) || v.includes(q)) hits.push({ path, key, val });
    });
    if (hits.length) {
      els.info.textContent = `Found ${hits.length} match(es) for "${q}" — first: ${hits[0].path}`;
      // highlight first hit in tree
      renderTree(obj, hits[0].path);
      lastPath = hits[0].path;
      els.path.textContent = `Path: ${lastPath}`;
    } else {
      els.info.textContent = `No matches for "${q}"`;
    }
  }

  function renderTree(obj, highlightPath='') {
    els.tree.style.display = 'block';
    els.tree.innerHTML = renderNode(obj, '', 0, highlightPath);
    // click to copy path
    els.tree.querySelectorAll('[data-path]').forEach(el => {
      el.addEventListener('click', () => {
        const p = el.dataset.path;
        lastPath = p;
        els.path.textContent = `Path: ${p} — clicked to copy`;
        navigator.clipboard.writeText(p).catch(()=>{});
        // flash
        el.style.background = 'var(--primary-soft)';
        setTimeout(()=> el.style.background='', 600);
      });
    });
  }

  function renderNode(val, path, depth, highlightPath) {
    const isHighlighted = path === highlightPath;
    const hl = isHighlighted ? ' style="background:var(--primary-soft);border-radius:6px;padding:2px 4px"' : '';
    if (val === null) return `<span class="b" data-path="${path}"${hl}>null</span>`;
    if (typeof val === 'string') return `<span class="s" data-path="${path}"${hl}>"${escapeHtml(val)}"</span>`;
    if (typeof val === 'number') return `<span class="n" data-path="${path}"${hl}>${val}</span>`;
    if (typeof val === 'boolean') return `<span class="b" data-path="${path}"${hl}>${val}</span>`;
    if (Array.isArray(val)) {
      if (val.length===0) return `<span data-path="${path}"${hl}>[]</span>`;
      let html = `<span data-path="${path}"${hl}>[</span><div style="margin-left:${12+depth*8}px">`;
      val.forEach((item, i) => {
        const p = path ? `${path}[${i}]` : `[${i}]`;
        html += `<div><span class="muted">${i}:</span> ${renderNode(item, p, depth+1, highlightPath)}${i < val.length-1 ? ',' : ''}</div>`;
      });
      html += `</div><span data-path="${path}"${hl}>]</span>`;
      return html;
    }
    if (typeof val === 'object') {
      const keys = Object.keys(val);
      if (keys.length===0) return `<span data-path="${path}"${hl}>{}</span>`;
      let html = `<span data-path="${path}"${hl}>{</span><div style="margin-left:${12+depth*8}px">`;
      keys.forEach((k, i) => {
        const p = path ? `${path}.${k}` : k;
        html += `<div><span class="k" data-path="${p}"${hl}>"${escapeHtml(k)}"</span>: ${renderNode(val[k], p, depth+1, highlightPath)}${i < keys.length-1 ? ',' : ''}</div>`;
      });
      html += `</div><span data-path="${path}"${hl}>}</span>`;
      return html;
    }
    return String(val);
  }

  function walk(obj, basePath, fn) {
    if (obj && typeof obj === 'object') {
      if (Array.isArray(obj)) {
        obj.forEach((v,i)=> {
          const p = basePath ? `${basePath}[${i}]` : `[${i}]`;
          fn(p, i, v);
          if (v && typeof v==='object') walk(v, p, fn);
        });
      } else {
        Object.entries(obj).forEach(([k,v])=>{
          const p = basePath ? `${basePath}.${k}` : k;
          fn(p, k, v);
          if (v && typeof v==='object') walk(v, p, fn);
        });
      }
    }
  }

  // Demo JSON
  if (!els.input.value.trim()) {
    els.input.value = JSON.stringify({ name: "WEB UNIVERSE", version: "1.0.0", modules: 12, core: { runtime: "vanilla", lazy: true }, features: ["lifecycle","window","resource","snapshot"] }, null, 2);
    save();
  }
  tryParse();
  ctxRef?.logger?.info('json-tool: mounted');
}

export async function unmount() {
  els = {}; lastParsed=null; ctxRef=null;
}
export async function destroy() { await unmount(); }

function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
