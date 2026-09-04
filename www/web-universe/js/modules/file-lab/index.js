export const manifest = {
  id: 'file-lab',
  name: 'File Lab',
  version: '1.0.0',
  category: 'files',
  description: 'File picker, drag & drop, folder picker, preview, metadata, save.',
  dependencies: [],
  permissions: [],
  lazy: true,
  icon: '📁',
};

let els = {};
let ctxRef = null;
let files = []; // {file, id}
let selectedId = null;

function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + ' KB';
  return (bytes/1024/1024).toFixed(2) + ' MB';
}
function formatDate(ts) {
  try { return new Date(ts).toLocaleString('vi-VN'); } catch { return String(ts); }
}
function uid(){ return 'f' + Math.random().toString(36).slice(2,8); }

function renderList() {
  if (!els.list) return;
  if (files.length===0) {
    els.list.innerHTML = '<div class="muted small" style="padding:16px;text-align:center">Chưa có file — pick hoặc kéo thả vào drop zone</div>';
    return;
  }
  els.list.innerHTML = files.map(f => `
    <div class="file-item ${f.id===selectedId?'selected':''}" data-id="${f.id}" role="button" tabindex="0" aria-label="${escapeHtml(f.file.name)}">
      <div class="file-item-icon">${iconFor(f.file)}</div>
      <div class="file-item-info">
        <strong>${escapeHtml(f.file.name)}</strong>
        <span>${formatSize(f.file.size)} · ${escapeHtml(f.file.type||'unknown')} · ${formatDate(f.file.lastModified)}</span>
      </div>
      <button class="btn btn-ghost btn-xs" data-action="remove" data-id="${f.id}" aria-label="Xóa">×</button>
    </div>
  `).join('');
  els.list.querySelectorAll('.file-item').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-action="remove"]')) return;
      selectedId = el.dataset.id;
      renderList(); renderPreview();
    });
    el.addEventListener('keydown', (e) => { if(e.key==='Enter') el.click(); });
  });
  els.list.querySelectorAll('[data-action="remove"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      files = files.filter(f=>f.id!==id);
      if (selectedId===id) selectedId = files[0]?.id || null;
      renderList(); renderPreview();
    });
  });
}

function iconFor(file) {
  const type = file.type || '';
  const name = file.name || '';
  if (type.startsWith('image/')) return '🖼';
  if (type.startsWith('audio/')) return '🎵';
  if (type.startsWith('video/')) return '🎬';
  if (type.includes('json') || name.endsWith('.json')) return '🧩';
  if (type.includes('csv') || name.endsWith('.csv')) return '📊';
  if (type.startsWith('text/') || name.endsWith('.txt') || name.endsWith('.md')) return '📄';
  return '📄';
}

async function renderPreview() {
  if (!els.preview) return;
  const entry = files.find(f=>f.id===selectedId);
  if (!entry) {
    els.preview.innerHTML = '<div class="muted small" style="padding:16px;text-align:center">Chọn file để xem preview</div>';
    if (els.meta) els.meta.innerHTML = '';
    return;
  }
  const file = entry.file;
  // Meta
  if (els.meta) {
    els.meta.innerHTML = `
      <div class="file-meta"><span>Name</span><b>${escapeHtml(file.name)}</b></div>
      <div class="file-meta"><span>Size</span><b>${formatSize(file.size)}</b></div>
      <div class="file-meta"><span>Type</span><b>${escapeHtml(file.type||'—')}</b></div>
      <div class="file-meta"><span>Modified</span><b>${formatDate(file.lastModified)}</b></div>
      <div style="display:flex;gap:8px;margin-top:8px">
        <button class="btn btn-ghost btn-xs" data-action="rename">Rename</button>
        <button class="btn btn-ghost btn-xs" data-action="download">Download</button>
        <button class="btn btn-ghost btn-xs" data-action="save-picker">Save via Picker</button>
      </div>
    `;
    els.meta.querySelector('[data-action="rename"]')?.addEventListener('click', () => {
      const newName = prompt('New name:', file.name);
      if (!newName || newName===file.name) return;
      // Create new File with new name (in-memory)
      const newFile = new File([file], newName, { type: file.type, lastModified: Date.now() });
      entry.file = newFile;
      renderList(); renderPreview();
    });
    els.meta.querySelector('[data-action="download"]')?.addEventListener('click', () => {
      const url = URL.createObjectURL(file);
      const a=document.createElement('a'); a.href=url; a.download=file.name; a.click();
      setTimeout(()=> URL.revokeObjectURL(url), 1000);
    });
    els.meta.querySelector('[data-action="save-picker"]')?.addEventListener('click', async () => {
      if ('showSaveFilePicker' in window) {
        try {
          const handle = await window.showSaveFilePicker({ suggestedName: file.name });
          const writable = await handle.createWritable();
          await writable.write(file);
          await writable.close();
          alert('Saved via File System Access API ✓');
        } catch (e) { if (e.name!=='AbortError') alert('Save failed: ' + e.message); }
      } else {
        // Fallback download
        const url = URL.createObjectURL(file);
        const a=document.createElement('a'); a.href=url; a.download=file.name; a.click();
        setTimeout(()=> URL.revokeObjectURL(url), 1000);
      }
    });
  }

  // Preview per type
  const type = file.type || '';
  const name = file.name || '';
  try {
    if (type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      els.preview.innerHTML = `<img src="${url}" style="max-width:100%;max-height:400px;border-radius:8px;display:block;margin:0 auto" alt="${escapeHtml(file.name)}" />`;
      // Revoke after load? Keep for now, revoke on next preview
      els.preview.querySelector('img')?.addEventListener('load', () => {}, { once:true });
    } else if (type.startsWith('audio/')) {
      const url = URL.createObjectURL(file);
      els.preview.innerHTML = `<audio controls src="${url}" style="width:100%"></audio>`;
    } else if (type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      els.preview.innerHTML = `<video controls src="${url}" style="width:100%;max-height:400px;background:#000;border-radius:8px"></video>`;
    } else if (type.includes('json') || name.endsWith('.json')) {
      const text = await file.text();
      try {
        const obj = JSON.parse(text);
        const pretty = JSON.stringify(obj, null, 2);
        els.preview.innerHTML = `<pre style="max-height:400px;overflow:auto;background:#0f172a;color:#e2e8f0;padding:12px;border-radius:8px;font:400 11px var(--font-mono);white-space:pre-wrap;word-break:break-all">${escapeHtml(pretty.slice(0, 8000))}</pre>`;
      } catch {
        els.preview.innerHTML = `<pre style="max-height:400px;overflow:auto;background:var(--surface-2);padding:12px;border-radius:8px;font:400 11px var(--font-mono);white-space:pre-wrap">${escapeHtml(text.slice(0,8000))}</pre>`;
      }
    } else if (type.includes('csv') || name.endsWith('.csv')) {
      const text = await file.text();
      const lines = text.split('\n').slice(0, 20);
      const rows = lines.map(l => l.split(',').map(c=>c.trim()));
      let html = '<div style="overflow:auto;max-height:400px"><table style="width:100%;border-collapse:collapse;font:400 11px var(--font-mono)">';
      rows.forEach((row,i) => {
        html += '<tr>' + row.map(c => `<${i===0?'th':'td'} style="border:1px solid var(--border);padding:6px;text-align:left;${i===0?'background:var(--surface-2);font-weight:700':''}">${escapeHtml(c)}</${i===0?'th':'td'}>`).join('') + '</tr>';
      });
      html += '</table></div>';
      if (text.split('\n').length > 20) html += `<div class="muted small" style="margin-top:6px">Showing 20/${text.split('\n').length} rows</div>`;
      els.preview.innerHTML = html;
    } else {
      // Text
      const text = await file.text();
      if (file.size > 2*1024*1024) {
        els.preview.innerHTML = `<div class="muted small">File too large for preview (${formatSize(file.size)}) — download to view</div><pre style="max-height:200px;overflow:auto;background:var(--surface-2);padding:12px;border-radius:8px;font:400 11px var(--font-mono)">${escapeHtml(text.slice(0,2000))}</pre>`;
      } else {
        els.preview.innerHTML = `<pre style="max-height:400px;overflow:auto;background:var(--surface-2);padding:12px;border-radius:8px;font:400 11px var(--font-mono);white-space:pre-wrap;word-break:break-all">${escapeHtml(text.slice(0, 10000))}</pre>`;
      }
    }
  } catch (e) {
    els.preview.innerHTML = `<div style="color:var(--danger)">Preview failed: ${escapeHtml(e.message)}</div>`;
  }
}

function addFiles(fileList) {
  for (const file of fileList) {
    if (file.size > 50*1024*1024) {
      alert(`File too large (>50MB): ${file.name} — skipped`);
      continue;
    }
    const id = uid();
    files.push({ file, id });
    if (!selectedId) selectedId = id;
  }
  renderList(); renderPreview();
}

export async function mount(container, ctx) {
  ctxRef = ctx;
  files = [];
  selectedId = null;

  container.innerHTML = `
    <div class="file-toolbar">
      <input type="file" id="filePick" style="display:none" />
      <input type="file" id="filePickMulti" multiple style="display:none" />
      <input type="file" id="filePickFolder" webkitdirectory style="display:none" />
      <button class="btn btn-primary btn-sm" data-action="pick">Pick File</button>
      <button class="btn btn-ghost btn-sm" data-action="pick-multi">Pick Multiple</button>
      <button class="btn btn-ghost btn-sm" data-action="pick-folder">Pick Folder</button>
      <button class="btn btn-ghost btn-sm" data-action="clear">Clear All</button>
      <span class="muted small" id="fileCount" style="margin-left:auto"></span>
    </div>
    <div class="file-drop" id="fileDrop" role="region" aria-label="Drop zone">
      <div class="file-drop-icon">📁</div>
      <div><b>Drag & drop files here</b></div>
      <div class="muted small">or use Pick buttons above · Supports image/audio/video/text/json/csv</div>
      <div class="muted small" id="fileSupport" style="margin-top:6px"></div>
    </div>
    <div class="file-layout">
      <div class="file-list-wrap">
        <div class="file-list-head"><span>Files</span><span class="muted small" id="fileListCount"></span></div>
        <div class="file-list" id="fileList" role="list"></div>
      </div>
      <div class="file-preview-wrap">
        <div class="file-preview-head"><span>Preview</span></div>
        <div class="file-preview" id="filePreview"></div>
        <div class="file-meta-wrap" id="fileMeta"></div>
      </div>
    </div>
  `;

  els = {
    list: container.querySelector('#fileList'),
    preview: container.querySelector('#filePreview'),
    meta: container.querySelector('#fileMeta'),
    drop: container.querySelector('#fileDrop'),
    count: container.querySelector('#fileCount'),
    listCount: container.querySelector('#fileListCount'),
    support: container.querySelector('#fileSupport'),
  };

  // Support info
  const supports = [];
  if ('showSaveFilePicker' in window) supports.push('✓ File System Access');
  else supports.push('✗ File System Access not supported (fallback download)');
  if ('webkitdirectory' in document.createElement('input')) supports.push('✓ Folder picker');
  else supports.push('✗ Folder picker not supported');
  els.support.textContent = supports.join(' · ');

  const pick = container.querySelector('#filePick');
  const pickMulti = container.querySelector('#filePickMulti');
  const pickFolder = container.querySelector('#filePickFolder');

  container.querySelector('[data-action="pick"]')?.addEventListener('click', () => pick.click());
  container.querySelector('[data-action="pick-multi"]')?.addEventListener('click', () => pickMulti.click());
  container.querySelector('[data-action="pick-folder"]')?.addEventListener('click', () => pickFolder.click());
  container.querySelector('[data-action="clear"]')?.addEventListener('click', () => {
    files=[]; selectedId=null; renderList(); renderPreview(); updateCount();
  });

  pick.addEventListener('change', () => { if(pick.files.length) addFiles(pick.files); pick.value=''; updateCount(); });
  pickMulti.addEventListener('change', () => { if(pickMulti.files.length) addFiles(pickMulti.files); pickMulti.value=''; updateCount(); });
  pickFolder.addEventListener('change', () => { if(pickFolder.files.length) addFiles(pickFolder.files); pickFolder.value=''; updateCount(); });

  function updateCount() {
    const total = files.length;
    const size = files.reduce((s,f)=>s+f.file.size,0);
    if (els.count) els.count.textContent = total ? `${total} file(s) · ${formatSize(size)}` : '';
    if (els.listCount) els.listCount.textContent = total ? `${total}` : '';
  }
  // Wrap addFiles to update count
  const origAdd = addFiles;
  addFiles = function(list) { origAdd(list); updateCount(); };

  // Drag & drop
  els.drop.addEventListener('dragover', (e) => { e.preventDefault(); els.drop.classList.add('dragover'); });
  els.drop.addEventListener('dragleave', () => els.drop.classList.remove('dragover'));
  els.drop.addEventListener('drop', (e) => {
    e.preventDefault();
    els.drop.classList.remove('dragover');
    const dt = e.dataTransfer;
    if (dt.files.length) addFiles(dt.files);
    else if (dt.items) {
      const filesFromItems = [];
      for (const item of dt.items) {
        if (item.kind==='file') {
          const f = item.getAsFile();
          if (f) filesFromItems.push(f);
        }
      }
      if (filesFromItems.length) addFiles(filesFromItems);
    }
  });

  renderList(); renderPreview();
  ctxRef?.logger?.info('file-lab: mounted');
}

export async function unmount() {
  files=[]; selectedId=null; els={}; ctxRef=null;
}
export async function destroy() { await unmount(); }
