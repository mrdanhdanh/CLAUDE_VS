// window-manager.js — drag, resize, min/max/close, z-index, snap, persist
export function createWindowManager({ state, eventBus, logger } = {}) {
  let workspaceEl = null;
  let zCounter = 20;
  const windows = new Map(); // id -> {el, meta, state: 'active'|'minimized'|'maximized'|'paused'|'sleeping'}

  function init(workspaceElement) {
    workspaceEl = workspaceElement;
    if (!workspaceEl) return;
    // Ensure workspace is relative for absolute windows
    workspaceEl.style.position = 'relative';
  }

  function getNextPosition() {
    const count = windows.size;
    const offset = 24 + (count % 5) * 24;
    return { x: offset, y: offset, w: 480, h: 360 };
  }

  function createWindow(id, meta) {
    if (!workspaceEl) {
      logger?.warn('window: workspace not initialized');
      const div = document.createElement('div');
      div.id = `win-${id}`;
      return div;
    }
    // If already exists, focus and return its body
    if (windows.has(id)) {
      focus(id);
      return windows.get(id).body;
    }

    // Check persisted position
    const persisted = (state?.get()?.workspace?.windows || []).find(w => w.id === id);
    const pos = persisted ? { x: persisted.x, y: persisted.y, w: persisted.w, h: persisted.h } : getNextPosition();
    const z = persisted?.z ?? (++zCounter);

    const win = document.createElement('div');
    win.className = 'window focused';
    win.id = `win-${id}`;
    win.dataset.moduleId = id;
    win.style.left = pos.x + 'px';
    win.style.top = pos.y + 'px';
    win.style.width = pos.w + 'px';
    win.style.height = pos.h + 'px';
    win.style.zIndex = z;
    win.setAttribute('role', 'dialog');
    win.setAttribute('aria-label', meta.name || id);

    win.innerHTML = `
      <div class="window-header" data-drag-handle>
        <div class="window-title">
          <span class="window-title-icon" aria-hidden="true">${meta.icon || '◈'}</span>
          <span class="window-title-text">${escapeHtml(meta.name || id)}</span>
          <span class="window-title-meta">${escapeHtml(meta.category || '')} · v${escapeHtml(meta.version || '1.0.0')}</span>
        </div>
        <div class="window-controls">
          <button class="window-control" data-action="minimize" aria-label="Thu nhỏ" title="Thu nhỏ">—</button>
          <button class="window-control" data-action="maximize" aria-label="Phóng to" title="Phóng to">□</button>
          <button class="window-control close" data-action="close" aria-label="Đóng" title="Đóng">×</button>
        </div>
      </div>
      <div class="window-body" id="win-body-${id}"></div>
      <div class="window-resize-handle" data-resize-handle aria-hidden="true" title="Kéo để đổi kích thước"></div>
    `;

    const body = win.querySelector('.window-body');
    const header = win.querySelector('[data-drag-handle]');

    // Focus on click
    win.addEventListener('mousedown', () => focus(id));
    win.addEventListener('focusin', () => focus(id));

    // Controls
    win.querySelector('[data-action="minimize"]')?.addEventListener('click', (e) => { e.stopPropagation(); toggleMinimize(id); });
    win.querySelector('[data-action="maximize"]')?.addEventListener('click', (e) => { e.stopPropagation(); toggleMaximize(id); });
    win.querySelector('[data-action="close"]')?.addEventListener('click', (e) => { e.stopPropagation(); eventBus?.emit('window:close-request', { id }); });

    // Drag
    let dragState = null;
    header.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.window-control')) return;
      if (win.classList.contains('maximized')) return;
      // Only left button / touch
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      focus(id);
      const rect = win.getBoundingClientRect();
      const wsRect = workspaceEl.getBoundingClientRect();
      dragState = {
        startX: e.clientX,
        startY: e.clientY,
        origLeft: rect.left - wsRect.left + workspaceEl.scrollLeft,
        origTop: rect.top - wsRect.top + workspaceEl.scrollTop,
        wsRect,
      };
      win.classList.add('dragging');
      header.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    header.addEventListener('pointermove', (e) => {
      if (!dragState) return;
      const dx = e.clientX - dragState.startX;
      const dy = e.clientY - dragState.startY;
      let nx = dragState.origLeft + dx;
      let ny = dragState.origTop + dy;
      // Clamp to workspace
      const maxX = workspaceEl.clientWidth - win.offsetWidth;
      const maxY = workspaceEl.clientHeight - win.offsetHeight;
      nx = Math.max(0, Math.min(maxX, nx));
      ny = Math.max(0, Math.min(maxY, ny));
      // Snap near edges (8px)
      if (Math.abs(nx) < 12) nx = 0;
      if (Math.abs(ny) < 12) ny = 0;
      if (Math.abs(nx - maxX) < 12) nx = maxX;
      if (Math.abs(ny - maxY) < 12) ny = maxY;
      win.style.left = nx + 'px';
      win.style.top = ny + 'px';
    });
    const endDrag = (e) => {
      if (!dragState) return;
      dragState = null;
      win.classList.remove('dragging');
      try { header.releasePointerCapture(e.pointerId); } catch {}
      persistWindows();
    };
    header.addEventListener('pointerup', endDrag);
    header.addEventListener('pointercancel', endDrag);

    // Resize
    const handle = win.querySelector('[data-resize-handle]');
    let resizeState = null;
    handle.addEventListener('pointerdown', (e) => {
      if (win.classList.contains('maximized') || win.classList.contains('minimized')) return;
      focus(id);
      const rect = win.getBoundingClientRect();
      resizeState = {
        startX: e.clientX,
        startY: e.clientY,
        origW: rect.width,
        origH: rect.height,
      };
      win.classList.add('resizing');
      handle.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    handle.addEventListener('pointermove', (e) => {
      if (!resizeState) return;
      const dx = e.clientX - resizeState.startX;
      const dy = e.clientY - resizeState.startY;
      let nw = resizeState.origW + dx;
      let nh = resizeState.origH + dy;
      nw = Math.max(320, Math.min(workspaceEl.clientWidth - parseInt(win.style.left || '0'), nw));
      nh = Math.max(200, Math.min(workspaceEl.clientHeight - parseInt(win.style.top || '0'), nh));
      win.style.width = nw + 'px';
      win.style.height = nh + 'px';
    });
    const endResize = (e) => {
      if (!resizeState) return;
      resizeState = null;
      win.classList.remove('resizing');
      try { handle.releasePointerCapture(e.pointerId); } catch {}
      persistWindows();
    };
    handle.addEventListener('pointerup', endResize);
    handle.addEventListener('pointercancel', endResize);

    // Append
    workspaceEl.appendChild(win);
    workspaceEl.classList.add('has-windows');
    const empty = document.getElementById('workspaceEmpty');
    if (empty) empty.classList.add('hidden');

    windows.set(id, { el: win, body, meta, minimized: !!persisted?.minimized, maximized: !!persisted?.maximized });
    if (persisted?.minimized) win.classList.add('minimized');
    if (persisted?.maximized) win.classList.add('maximized');

    // Bring to front
    focus(id);
    persistWindows();
    eventBus?.emit('window:created', { id });
    logger?.debug(`window: created ${id}`, pos);
    return body;
  }

  function focus(id) {
    const entry = windows.get(id);
    if (!entry) return;
    zCounter++;
    entry.el.style.zIndex = zCounter;
    // Remove focused from others
    for (const [otherId, other] of windows) {
      other.el.classList.toggle('focused', otherId === id);
    }
    eventBus?.emit('window:focused', { id });
  }

  function removeWindow(id) {
    const entry = windows.get(id);
    if (!entry) return;
    entry.el.remove();
    windows.delete(id);
    if (windows.size === 0) {
      workspaceEl?.classList.remove('has-windows');
      const empty = document.getElementById('workspaceEmpty');
      if (empty) empty.classList.remove('hidden');
    }
    persistWindows();
    eventBus?.emit('window:removed', { id });
    logger?.debug(`window: removed ${id}`);
  }

  function toggleMinimize(id) {
    const entry = windows.get(id);
    if (!entry) return;
    entry.el.classList.toggle('minimized');
    entry.minimized = entry.el.classList.contains('minimized');
    if (entry.minimized) entry.el.classList.remove('maximized');
    persistWindows();
    eventBus?.emit('window:minimized', { id, minimized: entry.minimized });
  }

  function toggleMaximize(id) {
    const entry = windows.get(id);
    if (!entry) return;
    const wasMax = entry.el.classList.contains('maximized');
    entry.el.classList.toggle('maximized');
    entry.maximized = !wasMax;
    if (entry.maximized) entry.el.classList.remove('minimized');
    // When maximized, clear inline pos/size? Keep but CSS overrides
    persistWindows();
    eventBus?.emit('window:maximized', { id, maximized: entry.maximized });
  }

  function setWindowState(id, stateName) {
    const entry = windows.get(id);
    if (!entry) return;
    entry.el.dataset.windowState = stateName;
    // Visual hint: add class
    entry.el.classList.toggle('is-paused', stateName === 'paused');
    entry.el.classList.toggle('is-sleeping', stateName === 'sleeping');
  }

  function showError(id, error) {
    const entry = windows.get(id);
    const body = entry?.body || document.getElementById(`win-body-${id}`);
    if (!body) return;
    const stack = error?.stack || String(error);
    body.innerHTML = `
      <div class="window-error">
        <div class="window-error-icon">⚠</div>
        <h4>Module crashed</h4>
        <p><b>${escapeHtml(id)}</b> gặp lỗi và đã được cô lập.<br/>Các module khác vẫn chạy bình thường.</p>
        <pre>${escapeHtml(stack.slice(0, 800))}</pre>
        <div class="window-error-actions">
          <button class="btn btn-primary btn-sm" data-error-action="restart">Restart</button>
          <button class="btn btn-ghost btn-sm" data-error-action="remove">Remove</button>
          <button class="btn btn-ghost btn-sm" data-error-action="details">Copy stack</button>
        </div>
      </div>
    `;
    body.querySelector('[data-error-action="restart"]')?.addEventListener('click', () => eventBus?.emit('window:restart-request', { id }));
    body.querySelector('[data-error-action="remove"]')?.addEventListener('click', () => eventBus?.emit('window:close-request', { id }));
    body.querySelector('[data-error-action="details"]')?.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(stack); eventBus?.emit('toast', { type: 'success', title: 'Đã copy stack', message: id }); } catch { eventBus?.emit('toast', { type: 'error', title: 'Copy thất bại', message: stack.slice(0, 200) }); }
    });
    const winEl = entry?.el;
    if (winEl) winEl.classList.add('crashed');
  }

  function persistWindows() {
    if (!state) return;
    const list = [];
    for (const [id, entry] of windows) {
      const el = entry.el;
      list.push({
        id,
        x: parseInt(el.style.left || '0', 10) || 0,
        y: parseInt(el.style.top || '0', 10) || 0,
        w: parseInt(el.style.width || '480', 10) || 480,
        h: parseInt(el.style.height || '360', 10) || 360,
        z: parseInt(el.style.zIndex || '10', 10) || 10,
        minimized: el.classList.contains('minimized'),
        maximized: el.classList.contains('maximized'),
      });
    }
    state.setWindows(list);
  }

  function getWindowIds() { return [...windows.keys()]; }
  function hasWindow(id) { return windows.has(id); }
  function getWindowEl(id) { return windows.get(id)?.el || null; }

  function destroy() {
    for (const id of [...windows.keys()]) removeWindow(id);
    windows.clear();
  }

  return {
    init, createWindow, focus, removeWindow, toggleMinimize, toggleMaximize, setWindowState, showError,
    persistWindows, getWindowIds, hasWindow, getWindowEl, destroy,
  };
}

function escapeHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
