/* TaskBoard — Todo Manager Bài 010 | Vanilla JS, single state, LocalStorage, undo */
(() => {
  'use strict';

  const STORAGE_KEY = 'todo-manager:v1';

  // ---------- Helpers ----------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }
  function todayStart() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }
  function isOverdue(task) {
    if (!task.dueDate || task.status === 'done') return false;
    const due = new Date(task.dueDate + 'T00:00:00');
    return due < todayStart();
  }
  function formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
  function formatCreatedAt(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  }
  function parseTags(str) {
    if (!str) return [];
    return [...new Set(
      str.split(',')
        .map(s => s.trim().toLowerCase())
        .filter(Boolean)
    )];
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }
  function priorityLabel(p) {
    return p === 'high' ? 'High' : p === 'medium' ? 'Medium' : 'Low';
  }
  function statusLabel(s) {
    return s === 'todo' ? 'Todo' : s === 'doing' ? 'Doing' : 'Done';
  }
  function nextStatus(s) {
    return s === 'todo' ? 'doing' : s === 'doing' ? 'done' : 'todo';
  }

  // ---------- State (duy nhất) ----------
  let state = {
    tasks: [],
    filters: {
      search: '',
      status: 'all',
      priority: 'all',
      tag: 'all',
      overdueOnly: false
    },
    sortBy: 'newest' // newest | oldest | dueDate | priority
  };

  // Undo stack: each entry { task, index, timeoutId, toastEl }
  const undoStack = [];

  // ---------- DOM refs ----------
  const els = {
    dashTotal: $('#dash-total'),
    dashTodo: $('#dash-todo'),
    dashDoing: $('#dash-doing'),
    dashDone: $('#dash-done'),
    dashOverdue: $('#dash-overdue'),
    searchInput: $('#search-input'),
    filterStatus: $('#filter-status'),
    filterPriority: $('#filter-priority'),
    filterTag: $('#filter-tag'),
    filterOverdue: $('#filter-overdue'),
    sortBy: $('#sort-by'),
    countBadge: $('#count-badge'),
    taskGrid: $('#task-grid'),
    emptyState: $('#empty-state'),
    btnClearFilters: $('#btn-clear-filters'),
    btnSeed: $('#btn-seed'),
    btnOpenAdd: $('#btn-open-add'),
    btnEmptyAdd: $('#btn-empty-add'),
    modal: $('#modal'),
    modalBackdrop: $('#modal-backdrop'),
    modalTitle: $('#modal-title'),
    btnCloseModal: $('#btn-close-modal'),
    btnCancel: $('#btn-cancel'),
    taskForm: $('#task-form'),
    fieldId: $('#field-id'),
    fieldTitle: $('#field-title'),
    fieldDesc: $('#field-desc'),
    fieldPriority: $('#field-priority'),
    fieldStatus: $('#field-status'),
    fieldDue: $('#field-due'),
    fieldTags: $('#field-tags'),
    errTitle: $('#err-title'),
    btnSubmit: $('#btn-submit'),
    toastStack: $('#toast-stack'),
    footerDate: $('#footer-date')
  };

  // ---------- LocalStorage ----------
  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.tasks)) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  }

  function saveData() {
    try {
      const toSave = {
        tasks: state.tasks,
        filters: state.filters,
        sortBy: state.sortBy
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.warn('saveData failed', e);
    }
  }

  // ---------- Seed ----------
  function seedData() {
    const today = new Date();
    const fmt = d => d.toISOString().slice(0, 10);
    const addDays = (n) => {
      const d = new Date(today);
      d.setDate(d.getDate() + n);
      return fmt(d);
    };
    return [
      {
        id: uid(),
        title: 'Học JavaScript',
        description: 'Học Array và Object, làm bài tập 010',
        priority: 'high',
        status: 'todo',
        dueDate: addDays(3),
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
        tags: ['javascript', 'study']
      },
      {
        id: uid(),
        title: 'Thiết kế giao diện TaskBoard',
        description: 'Hoàn thiện dashboard và card, responsive 375/768/1280',
        priority: 'high',
        status: 'doing',
        dueDate: addDays(1),
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
        tags: ['design', 'ui']
      },
      {
        id: uid(),
        title: 'Viết báo cáo tuần',
        description: 'Tổng hợp tiến độ và kế hoạch tuần tới',
        priority: 'medium',
        status: 'todo',
        dueDate: addDays(-1),
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
        tags: ['work']
      },
      {
        id: uid(),
        title: 'Mua sắm cuối tuần',
        description: 'Siêu thị, chuẩn bị đồ cho tuần mới',
        priority: 'low',
        status: 'done',
        dueDate: addDays(-2),
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
        tags: ['personal']
      },
      {
        id: uid(),
        title: 'Ôn lại CSS Grid & Flexbox',
        description: 'Làm lại layout toolbar và card grid',
        priority: 'medium',
        status: 'todo',
        dueDate: '',
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        tags: ['css', 'study']
      }
    ];
  }

  // ---------- CRUD (chỉ thao tác state) ----------
  function addTask(data) {
    const task = {
      id: uid(),
      title: data.title.trim(),
      description: (data.description || '').trim(),
      priority: data.priority,
      status: data.status,
      dueDate: data.dueDate || '',
      createdAt: new Date().toISOString(),
      tags: parseTags(data.tagsRaw || '')
    };
    state.tasks.unshift(task);
    saveData();
    render();
    showToast(`Đã thêm "${task.title}"`, 'success');
  }

  function updateTask(id, data) {
    const idx = state.tasks.findIndex(t => t.id === id);
    if (idx === -1) return;
    const prev = state.tasks[idx];
    state.tasks[idx] = {
      ...prev,
      title: data.title.trim(),
      description: (data.description || '').trim(),
      priority: data.priority,
      status: data.status,
      dueDate: data.dueDate || '',
      tags: parseTags(data.tagsRaw || '')
    };
    saveData();
    render();
    showToast(`Đã cập nhật "${state.tasks[idx].title}"`, 'success');
  }

  function deleteTask(id) {
    const idx = state.tasks.findIndex(t => t.id === id);
    if (idx === -1) return;
    const task = state.tasks[idx];
    // remove from state
    state.tasks.splice(idx, 1);
    saveData();
    render();
    showUndoToast(task, idx);
  }

  function cycleStatus(id) {
    const t = state.tasks.find(x => x.id === id);
    if (!t) return;
    t.status = nextStatus(t.status);
    saveData();
    render();
    showToast(`"${t.title}" → ${statusLabel(t.status)}`, 'success');
  }

  // ---------- Filter & Sort ----------
  function filterTasks(tasks) {
    const f = state.filters;
    const search = f.search.trim().toLowerCase();
    return tasks.filter(t => {
      if (search) {
        const hay = (t.title + ' ' + (t.description || '')).toLowerCase();
        if (!hay.includes(search)) return false;
      }
      if (f.status !== 'all' && t.status !== f.status) return false;
      if (f.priority !== 'all' && t.priority !== f.priority) return false;
      if (f.tag !== 'all' && !t.tags.includes(f.tag)) return false;
      if (f.overdueOnly && !isOverdue(t)) return false;
      return true;
    });
  }

  function sortTasks(tasks) {
    const arr = [...tasks];
    const prioWeight = { high: 3, medium: 2, low: 1 };
    switch (state.sortBy) {
      case 'newest':
        arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'oldest':
        arr.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'dueDate':
        arr.sort((a, b) => {
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate) - new Date(b.dueDate);
        });
        break;
      case 'priority':
        arr.sort((a, b) => {
          const diff = prioWeight[b.priority] - prioWeight[a.priority];
          if (diff !== 0) return diff;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        break;
    }
    return arr;
  }

  // ---------- Render ----------
  function renderDashboard() {
    const total = state.tasks.length;
    const todo = state.tasks.filter(t => t.status === 'todo').length;
    const doing = state.tasks.filter(t => t.status === 'doing').length;
    const done = state.tasks.filter(t => t.status === 'done').length;
    const overdue = state.tasks.filter(isOverdue).length;

    els.dashTotal.textContent = total;
    els.dashTodo.textContent = todo;
    els.dashDoing.textContent = doing;
    els.dashDone.textContent = done;
    els.dashOverdue.textContent = overdue;
  }

  function renderTagFilter() {
    const allTags = [...new Set(state.tasks.flatMap(t => t.tags))].sort();
    const current = state.filters.tag;
    // rebuild options
    els.filterTag.innerHTML = '<option value="all">Tất cả tags</option>';
    allTags.forEach(tag => {
      const opt = document.createElement('option');
      opt.value = tag;
      opt.textContent = tag;
      if (tag === current) opt.selected = true;
      els.filterTag.appendChild(opt);
    });
    if (!allTags.includes(current)) {
      els.filterTag.value = 'all';
      if (current !== 'all') {
        state.filters.tag = 'all';
      }
    }
  }

  function renderTasks() {
    const filtered = filterTasks(state.tasks);
    const sorted = sortTasks(filtered);

    // count badge
    els.countBadge.textContent = `${sorted.length} công việc${filtered.length !== state.tasks.length ? ` / ${state.tasks.length}` : ''}`;

    // empty
    if (sorted.length === 0) {
      els.taskGrid.innerHTML = '';
      els.taskGrid.hidden = true;
      els.emptyState.hidden = false;
      return;
    }
    els.emptyState.hidden = true;
    els.taskGrid.hidden = false;

    els.taskGrid.setAttribute('aria-busy', 'true');
    els.taskGrid.innerHTML = sorted.map(task => {
      const overdue = isOverdue(task);
      const prioClass = task.priority === 'high' ? 'badge-priority-high' : task.priority === 'medium' ? 'badge-priority-medium' : 'badge-priority-low';
      const statusClass = task.status === 'todo' ? 'badge-status-todo' : task.status === 'doing' ? 'badge-status-doing' : 'badge-status-done';
      const cardClass = `card ${overdue ? 'is-overdue' : ''} ${task.status === 'done' ? 'is-done' : ''}`;
      const dueText = task.dueDate ? formatDate(task.dueDate) : 'Không hạn';
      const dueClass = overdue ? 'meta-item overdue' : 'meta-item';
      const dueIcon = overdue ? '⚠️' : '📅';
      const tagsHtml = task.tags.length
        ? `<div class="tags">${task.tags.map(tag => `<span class="tag">#${escapeHtml(tag)}</span>`).join('')}</div>`
        : '';
      const descHtml = task.description ? `<p class="card-desc">${escapeHtml(task.description)}</p>` : `<p class="card-desc" style="opacity:.6">Không có mô tả</p>`;

      return `
        <article class="${cardClass}" role="listitem" data-id="${task.id}">
          <div class="card-top">
            <span class="badge ${prioClass}"><span aria-hidden="true">●</span> ${priorityLabel(task.priority)}</span>
            <span class="badge ${statusClass}">${statusLabel(task.status)}</span>
            ${overdue ? `<span class="badge badge-overdue">Quá hạn</span>` : ''}
          </div>
          <h3 class="card-title">${escapeHtml(task.title)}</h3>
          ${descHtml}
          ${tagsHtml}
          <div class="card-meta">
            <span class="${dueClass}"><span aria-hidden="true">${dueIcon}</span> ${dueText}</span>
            <span class="meta-item">🕒 ${formatCreatedAt(task.createdAt)}</span>
          </div>
          <div class="card-actions">
            <button class="btn btn-ghost btn-sm" data-action="edit" data-id="${task.id}" aria-label="Sửa ${escapeHtml(task.title)}">✎ Sửa</button>
            <button class="btn btn-ghost btn-sm" data-action="status" data-id="${task.id}" aria-label="Đổi trạng thái ${escapeHtml(task.title)}">⇄ ${statusLabel(nextStatus(task.status))}</button>
            <button class="btn btn-ghost btn-sm" data-action="delete" data-id="${task.id}" aria-label="Xóa ${escapeHtml(task.title)}" style="color:var(--danger); border-color:rgba(239,68,68,.25)">🗑 Xóa</button>
          </div>
        </article>
      `;
    }).join('');
    els.taskGrid.setAttribute('aria-busy', 'false');
  }

  function render() {
    renderDashboard();
    renderTagFilter();
    renderTasks();
  }

  // ---------- Toast ----------
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.setAttribute('role', 'status');
    toast.innerHTML = `
      <span class="toast-msg">${escapeHtml(message)}</span>
      <button class="toast-close" aria-label="Đóng">✕</button>
      <div class="toast-progress"></div>
    `;
    // progress 2.5s for success
    const progress = toast.querySelector('.toast-progress');
    progress.style.animationDuration = '2.5s';
    els.toastStack.appendChild(toast);
    const close = () => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      setTimeout(() => toast.remove(), 200);
    };
    toast.querySelector('.toast-close').addEventListener('click', close);
    setTimeout(close, 2500);
  }

  function showUndoToast(task, originalIndex) {
    const toast = document.createElement('div');
    toast.className = 'toast toast--undo';
    toast.setAttribute('role', 'status');
    toast.innerHTML = `
      <span class="toast-msg">Đã xóa "<strong>${escapeHtml(task.title)}</strong>"</span>
      <button class="toast-action">Hoàn tác</button>
      <button class="toast-close" aria-label="Đóng">✕</button>
      <div class="toast-progress"></div>
    `;
    els.toastStack.appendChild(toast);

    let timeoutId = null;
    let closed = false;

    const cleanup = () => {
      if (closed) return;
      closed = true;
      clearTimeout(timeoutId);
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      setTimeout(() => toast.remove(), 200);
      const idx = undoStack.findIndex(e => e.toastEl === toast);
      if (idx !== -1) undoStack.splice(idx, 1);
    };

    const undo = () => {
      if (closed) return;
      // restore at original index (clamp)
      const insertAt = Math.min(originalIndex, state.tasks.length);
      state.tasks.splice(insertAt, 0, task);
      saveData();
      render();
      cleanup();
      showToast(`Đã khôi phục "${task.title}"`, 'success');
    };

    toast.querySelector('.toast-action').addEventListener('click', undo);
    toast.querySelector('.toast-close').addEventListener('click', cleanup);

    timeoutId = setTimeout(() => {
      cleanup();
    }, 5000);

    undoStack.push({ task, index: originalIndex, timeoutId, toastEl: toast });
  }

  // ---------- Modal ----------
  let lastFocus = null;

  function openModal(task = null) {
    lastFocus = document.activeElement;
    const isEdit = !!task;
    els.modalTitle.textContent = isEdit ? 'Sửa công việc' : 'Thêm công việc';
    els.btnSubmit.textContent = isEdit ? 'Cập nhật' : 'Thêm mới';
    els.fieldId.value = task ? task.id : '';
    els.fieldTitle.value = task ? task.title : '';
    els.fieldDesc.value = task ? task.description : '';
    els.fieldPriority.value = task ? task.priority : 'medium';
    els.fieldStatus.value = task ? task.status : 'todo';
    els.fieldDue.value = task ? task.dueDate : '';
    els.fieldTags.value = task ? task.tags.join(', ') : '';
    els.errTitle.textContent = '';
    els.fieldTitle.classList.remove('is-error');
    els.fieldTitle.removeAttribute('aria-invalid');

    els.modal.hidden = false;
    els.modalBackdrop.hidden = false;
    // trigger reflow for transition
    requestAnimationFrame(() => {
      els.modal.classList.add('is-open');
      els.modalBackdrop.classList.add('is-open');
    });
    document.body.style.overflow = 'hidden';
    setTimeout(() => els.fieldTitle.focus(), 100);
  }

  function closeModal() {
    els.modal.classList.remove('is-open');
    els.modalBackdrop.classList.remove('is-open');
    setTimeout(() => {
      els.modal.hidden = true;
      els.modalBackdrop.hidden = true;
      document.body.style.overflow = '';
      if (lastFocus) lastFocus.focus();
    }, 200);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const title = els.fieldTitle.value.trim();
    if (!title) {
      els.errTitle.textContent = 'Tên công việc là bắt buộc';
      els.fieldTitle.classList.add('is-error');
      els.fieldTitle.setAttribute('aria-invalid', 'true');
      els.fieldTitle.focus();
      return;
    }
    els.errTitle.textContent = '';
    els.fieldTitle.classList.remove('is-error');
    els.fieldTitle.removeAttribute('aria-invalid');

    const data = {
      title,
      description: els.fieldDesc.value,
      priority: els.fieldPriority.value,
      status: els.fieldStatus.value,
      dueDate: els.fieldDue.value,
      tagsRaw: els.fieldTags.value
    };
    const id = els.fieldId.value;
    if (id) {
      updateTask(id, data);
    } else {
      addTask(data);
    }
    closeModal();
  }

  // ---------- Events ----------
  function bindEvents() {
    // toolbar
    els.searchInput.addEventListener('input', (e) => {
      state.filters.search = e.target.value;
      saveData();
      renderTasks();
      renderDashboard();
    });
    els.filterStatus.addEventListener('change', (e) => {
      state.filters.status = e.target.value;
      saveData();
      render();
    });
    els.filterPriority.addEventListener('change', (e) => {
      state.filters.priority = e.target.value;
      saveData();
      render();
    });
    els.filterTag.addEventListener('change', (e) => {
      state.filters.tag = e.target.value;
      saveData();
      renderTasks();
      renderDashboard();
    });
    els.filterOverdue.addEventListener('change', (e) => {
      state.filters.overdueOnly = e.target.checked;
      saveData();
      renderTasks();
      renderDashboard();
    });
    els.sortBy.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      saveData();
      renderTasks();
    });
    els.btnClearFilters.addEventListener('click', () => {
      state.filters = { search: '', status: 'all', priority: 'all', tag: 'all', overdueOnly: false };
      state.sortBy = 'newest';
      els.searchInput.value = '';
      els.filterStatus.value = 'all';
      els.filterPriority.value = 'all';
      els.filterTag.value = 'all';
      els.filterOverdue.checked = false;
      els.sortBy.value = 'newest';
      saveData();
      render();
      showToast('Đã xóa bộ lọc', 'success');
    });
    els.btnSeed.addEventListener('click', () => {
      if (state.tasks.length > 0 && !confirm('Thêm dữ liệu mẫu? (sẽ giữ việc hiện có)')) return;
      const seeds = seedData();
      state.tasks.push(...seeds);
      saveData();
      render();
      showToast(`Đã thêm ${seeds.length} việc mẫu`, 'success');
    });

    // modal triggers
    els.btnOpenAdd.addEventListener('click', () => openModal(null));
    els.btnEmptyAdd.addEventListener('click', () => openModal(null));
    els.btnCloseModal.addEventListener('click', closeModal);
    els.btnCancel.addEventListener('click', closeModal);
    els.modalBackdrop.addEventListener('click', closeModal);
    els.taskForm.addEventListener('submit', handleSubmit);

    // live validation clear
    els.fieldTitle.addEventListener('input', () => {
      if (els.fieldTitle.value.trim()) {
        els.errTitle.textContent = '';
        els.fieldTitle.classList.remove('is-error');
        els.fieldTitle.removeAttribute('aria-invalid');
      }
    });

    // task grid delegation
    els.taskGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      if (action === 'edit') {
        const task = state.tasks.find(t => t.id === id);
        if (task) openModal(task);
      } else if (action === 'delete') {
        if (confirm('Xóa công việc này? Bạn có 5 giây để hoàn tác.')) {
          deleteTask(id);
        }
      } else if (action === 'status') {
        cycleStatus(id);
      }
    });

    // keyboard
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !els.modal.hidden) {
        closeModal();
      }
    });

    // footer date
    if (els.footerDate) {
      els.footerDate.textContent = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
    }
  }

  // ---------- Init ----------
  function init() {
    const saved = loadData();
    if (saved) {
      state.tasks = Array.isArray(saved.tasks) ? saved.tasks : [];
      if (saved.filters) {
        state.filters = {
          search: saved.filters.search || '',
          status: saved.filters.status || 'all',
          priority: saved.filters.priority || 'all',
          tag: saved.filters.tag || 'all',
          overdueOnly: !!saved.filters.overdueOnly
        };
      }
      if (saved.sortBy) state.sortBy = saved.sortBy;
      // sync UI
      els.searchInput.value = state.filters.search;
      els.filterStatus.value = state.filters.status;
      els.filterPriority.value = state.filters.priority;
      els.filterOverdue.checked = state.filters.overdueOnly;
      els.sortBy.value = state.sortBy;
    } else {
      state.tasks = seedData();
      saveData();
    }

    // ensure tag filter reflects saved tag
    bindEvents();
    render();
  }

  // Expose for debugging / rubric check
  window.TaskBoard = {
    get state() { return state; },
    addTask, updateTask, deleteTask, filterTasks, sortTasks, renderTasks, renderDashboard, saveData, loadData
  };

  document.addEventListener('DOMContentLoaded', init);
})();
