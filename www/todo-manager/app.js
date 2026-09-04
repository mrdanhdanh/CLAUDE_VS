/* TaskBoard — Todo Manager Bài 010 | Vanilla JS, single state, LocalStorage, undo */
(() => {
  'use strict';

  const STORAGE_KEY = 'todo-manager:v2';
  const STORAGE_KEY_LEGACY = 'todo-manager:v1';
  const TASKS_JSON_URL = './tasks.json';
  const GITHUB_CONFIG_KEY = 'todo-manager:github:v1';
  const GITHUB_DEFAULTS = {
    owner: 'mrdanhdanh',
    repo: 'CLAUDE_VS',
    branch: 'main',
    path: 'www/todo-manager/tasks.json',
    token: '',
    autosync: true
  };
  const SYNC_CODE_KEY = 'todo-manager:syncCode:v1';
  const SYNC_CODE_BUCKET = 'K9MBNitexpzGMAzW5rQzJN';
  const KVDB_BASE = 'https://kvdb.io';

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
    btnSync: $('#btn-sync'),
    btnGithubSettings: $('#btn-github-settings'),
    btnSyncCode: $('#btn-sync-code'),
    btnExport: $('#btn-export'),
    btnImport: $('#btn-import'),
    fileImport: $('#file-import'),
    syncStatus: $('#sync-status'),
    syncSub: $('#sync-sub'),
    syncCodeBar: $('#sync-code-bar'),
    syncCodePill: $('#sync-code-pill'),
    syncCodeSub: $('#sync-code-sub'),
    btnCopyCode: $('#btn-copy-code'),
    btnPullCode: $('#btn-pull-code'),
    githubModal: $('#github-modal'),
    githubBackdrop: $('#github-backdrop'),
    ghOwner: $('#gh-owner'),
    ghRepo: $('#gh-repo'),
    ghBranch: $('#gh-branch'),
    ghPath: $('#gh-path'),
    ghToken: $('#gh-token'),
    ghAutosync: $('#gh-autosync'),
    errGithub: $('#err-github'),
    btnCloseGithub: $('#btn-close-github'),
    btnGithubCancel: $('#btn-github-cancel'),
    btnGithubSave: $('#btn-github-save'),
    btnGithubDisconnect: $('#btn-github-disconnect'),
    syncCodeModal: $('#sync-code-modal'),
    syncCodeBackdrop: $('#sync-code-backdrop'),
    syncCodeInput: $('#sync-code-input'),
    errSyncCode: $('#err-sync-code'),
    btnCloseSyncCode: $('#btn-close-sync-code'),
    btnSyncCodeCancel: $('#btn-sync-code-cancel'),
    btnSyncCodeSave: $('#btn-sync-code-save'),
    btnSyncCodeDisconnect: $('#btn-sync-code-disconnect'),
    btnGenerateCode: $('#btn-generate-code'),
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

  // ---------- LocalStorage + tasks.json + GitHub API ----------
  // Pages la static hosting: muon trinh duyet tu ghi tasks.json len repo thi phai goi GitHub Contents API.
  // Chien luoc: localStorage de dung nhanh + tasks.json la ban mac dinh theo repo + GitHub API de auto-push sau them/sua/xoa.
  function getGithubConfig() {
    try {
      const raw = localStorage.getItem(GITHUB_CONFIG_KEY);
      if (!raw) return { ...GITHUB_DEFAULTS };
      const parsed = JSON.parse(raw);
      return {
        owner: (parsed.owner || GITHUB_DEFAULTS.owner).trim(),
        repo: (parsed.repo || GITHUB_DEFAULTS.repo).trim(),
        branch: (parsed.branch || GITHUB_DEFAULTS.branch).trim() || 'main',
        path: (parsed.path || GITHUB_DEFAULTS.path).trim() || GITHUB_DEFAULTS.path,
        token: (parsed.token || '').trim(),
        autosync: parsed.autosync !== false
      };
    } catch {
      return { ...GITHUB_DEFAULTS };
    }
  }

  function saveGithubConfig(cfg) {
    try {
      localStorage.setItem(GITHUB_CONFIG_KEY, JSON.stringify({
        owner: cfg.owner,
        repo: cfg.repo,
        branch: cfg.branch,
        path: cfg.path,
        token: cfg.token,
        autosync: !!cfg.autosync
      }));
    } catch (e) {
      console.warn('saveGithubConfig failed', e);
    }
  }

  function isGithubConnected() {
    const cfg = getGithubConfig();
    return !!(cfg.owner && cfg.repo && cfg.token);
  }

  function setSyncStatus(mode, text, sub) {
    if (els.syncStatus) {
      els.syncStatus.textContent = text;
      els.syncStatus.className = 'sync-status' + (mode ? ' ' + mode : '');
    }
    if (sub !== undefined && els.syncSub) {
      els.syncSub.innerHTML = sub;
    }
    if (els.btnSync) {
      els.btnSync.disabled = mode === 'is-busy';
    }
  }

  function refreshSyncStatus() {
    const cfg = getGithubConfig();
    const code = getSyncCode();
    // Sync Code bar
    refreshSyncCodeBar();
    if (!cfg.token) {
      if (code) {
        setSyncStatus('is-ok', 'Đang dùng Sync Code ●', 'Mã <code>' + escapeHtml(code) + '</code> — thêm/sửa sẽ tự đồng bộ. Máy khác nhập cùng mã là thấy.');
      } else {
        setSyncStatus('', 'Chưa kết nối', 'Bấm <strong>🔗 Sync Code → Tạo mã</strong> để đồng bộ không cần DB, hoặc <strong>⚙ GitHub</strong> để lưu vào <code>tasks.json</code>.');
      }
      return;
    }
    const last = localStorage.getItem('todo-manager:github:lastSync');
    const extra = code ? ' · Sync Code <code>' + escapeHtml(code) + '</code> cũng đang bật' : '';
    setSyncStatus('is-ok', 'Đã kết nối GitHub ●', last ? ('Lần đẩy gần nhất: ' + last + ' → <code>' + escapeHtml(cfg.path) + '</code>' + extra) : ('Sẵn sàng đẩy lên <code>' + escapeHtml(cfg.path) + '</code>' + extra));
  }

  // ---------- Sync Code (kvdb.io — không DB, free) ----------
  function normalizeSyncCode(s) {
    return String(s || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 20);
  }
  function generateSyncCode() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let out = '';
    for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  }
  function getSyncCode() {
    try {
      const v = localStorage.getItem(SYNC_CODE_KEY);
      const n = normalizeSyncCode(v);
      return n.length >= 4 ? n : '';
    } catch { return ''; }
  }
  function setSyncCode(code) {
    const n = normalizeSyncCode(code);
    try {
      if (!n) localStorage.removeItem(SYNC_CODE_KEY);
      else localStorage.setItem(SYNC_CODE_KEY, n);
    } catch {}
    return n;
  }
  function kvdbKey(code) {
    return 'todo:' + normalizeSyncCode(code);
  }
  function refreshSyncCodeBar() {
    const code = getSyncCode();
    if (!els.syncCodeBar) return;
    if (!code) {
      els.syncCodeBar.hidden = true;
      return;
    }
    els.syncCodeBar.hidden = false;
    if (els.syncCodePill) els.syncCodePill.textContent = code;
    const last = localStorage.getItem('todo-manager:syncCode:lastSync');
    if (els.syncCodeSub) els.syncCodeSub.textContent = last ? 'Lần đồng bộ: ' + last : 'Sẵn sàng đồng bộ';
  }
  let kvdbSyncTimer = null;
  let kvdbSyncing = false;
  function scheduleKvdbSync(reason) {
    const code = getSyncCode();
    if (!code) return;
    if (kvdbSyncTimer) clearTimeout(kvdbSyncTimer);
    kvdbSyncTimer = setTimeout(() => { kvdbPush(reason || 'cap-nhat'); }, 1200);
  }
  async function kvdbPush(reason) {
    const code = getSyncCode();
    if (!code) return false;
    if (kvdbSyncing) return false;
    kvdbSyncing = true;
    try {
      const payload = buildBackupPayload();
      const json = JSON.stringify(payload);
      const url = KVDB_BASE + '/' + SYNC_CODE_BUCKET + '/' + encodeURIComponent(kvdbKey(code));
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: json });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error('kvdb POST ' + res.status + ' ' + txt.slice(0, 200));
      }
      const stamp = new Date().toLocaleString('vi-VN');
      try { localStorage.setItem('todo-manager:syncCode:lastSync', stamp); } catch {}
      refreshSyncCodeBar();
      refreshSyncStatus();
      return true;
    } catch (e) {
      console.warn('kvdbPush failed', e);
      showToast('Sync Code that bai: ' + (e.message || 'loi'), 'success');
      return false;
    } finally {
      kvdbSyncing = false;
    }
  }
  async function kvdbPull(opts) {
    opts = opts || {};
    const code = opts.code || getSyncCode();
    if (!code) {
      if (!opts.silent) showToast('Chua co Sync Code - bam Nut Sync Code de tao', 'success');
      return null;
    }
    const url = KVDB_BASE + '/' + SYNC_CODE_BUCKET + '/' + encodeURIComponent(kvdbKey(code));
    const res = await fetch(url, { cache: 'no-store' });
    if (res.status === 404) {
      if (!opts.silent) showToast('Chua co du lieu cho ma nay - day len truoc', 'success');
      return null;
    }
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error('kvdb GET ' + res.status + ' ' + txt.slice(0, 200));
    }
    const text = await res.text();
    if (!text || text.trim() === '' || text.trim() === 'null') return null;
    let data;
    try { data = JSON.parse(text); } catch { throw new Error('Du lieu Sync Code khong hop le'); }
    const list = sanitizeTasks(data.tasks || data);
    return list;
  }
  async function handleKvdbPull() {
    const code = getSyncCode();
    if (!code) { openSyncCodeModal(); return; }
    try {
      const list = await kvdbPull({ silent: false });
      if (!list || !list.length) {
        showToast('Khong co du lieu de keo ve', 'success');
        return;
      }
      if (state.tasks.length && !confirm('Keo ' + list.length + ' viec tu Sync Code "' + code + '" ve? Se thay the list hien tai (' + state.tasks.length + ' viec).')) return;
      state.tasks = list;
      saveData();
      render();
      try { localStorage.setItem('todo-manager:syncCode:lastSync', new Date().toLocaleString('vi-VN')); } catch {}
      refreshSyncCodeBar();
      showToast('Da keo ' + list.length + ' viec tu Sync Code', 'success');
    } catch (e) {
      showToast('Keo Sync Code that bai: ' + (e.message || 'loi'), 'success');
    }
  }

  function encodeBase64Unicode(str) {
    try {
      return btoa(unescape(encodeURIComponent(str)));
    } catch {
      const bytes = new TextEncoder().encode(str);
      let bin = '';
      bytes.forEach(b => { bin += String.fromCharCode(b); });
      return btoa(bin);
    }
  }

  function decodeBase64Unicode(b64) {
    try {
      const bin = atob(b64.replace(/\n/g, ''));
      try {
        return decodeURIComponent(escape(bin));
      } catch {
        const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
        return new TextDecoder().decode(bytes);
      }
    } catch {
      return '';
    }
  }

  async function githubGetFile() {
    const cfg = getGithubConfig();
    const url = 'https://api.github.com/repos/' + encodeURIComponent(cfg.owner) + '/' + encodeURIComponent(cfg.repo) + '/contents/' + cfg.path.split('/').map(encodeURIComponent).join('/') + '?ref=' + encodeURIComponent(cfg.branch);
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': 'Bearer ' + cfg.token
      }
    });
    if (res.status === 404) return { exists: false, sha: null, tasks: null };
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error('GitHub GET ' + res.status + ' ' + txt.slice(0, 200));
    }
    const data = await res.json();
    let tasks = null;
    try {
      const content = decodeBase64Unicode(data.content || '');
      const parsed = JSON.parse(content);
      tasks = sanitizeTasks(parsed.tasks || parsed);
    } catch {
      tasks = null;
    }
    return { exists: true, sha: data.sha || null, tasks };
  }

  let githubSyncTimer = null;
  let githubSyncing = false;

  function scheduleGithubSync(reason) {
    const cfg = getGithubConfig();
    if (!cfg.token || !cfg.autosync) return;
    if (githubSyncTimer) clearTimeout(githubSyncTimer);
    githubSyncTimer = setTimeout(() => { pushTasksToGitHub(reason || 'cap-nhat-task'); }, 1200);
  }

  async function pushTasksToGitHub(reason, opts) {
    opts = opts || {};
    const cfg = getGithubConfig();
    if (!cfg.owner || !cfg.repo) {
      showToast('Thieu owner/repo GitHub - bam Nut GitHub de cau hinh', 'success');
      return false;
    }
    if (!cfg.token) {
      if (!opts.silent) showToast('Chua ket noi GitHub - bam Nut GitHub de nhap token', 'success');
      openGithubModal();
      return false;
    }
    if (githubSyncing) return false;
    githubSyncing = true;
    setSyncStatus('is-busy', 'Đang đẩy lên GitHub…', 'Đang cập nhật <code>' + escapeHtml(cfg.path) + '</code>…');
    try {
      let sha = null;
      try {
        const current = await githubGetFile();
        sha = current.sha;
      } catch (e) {
        if (String(e.message).includes('401')) throw new Error('Token sai / het han (401). Tao token moi co quyen Contents read & write.');
        if (String(e.message).includes('404')) throw new Error('Khong tim thay repo/branch. Kiem tra owner/repo/branch.');
        throw e;
      }
      const payload = buildBackupPayload();
      const json = JSON.stringify(payload, null, 2) + '\n';
      const body = {
        message: (reason || 'cap-nhat-task') + ' (' + state.tasks.length + ' tasks, ' + new Date().toISOString() + ')',
        content: encodeBase64Unicode(json),
        branch: cfg.branch
      };
      if (sha) body.sha = sha;
      const putUrl = 'https://api.github.com/repos/' + encodeURIComponent(cfg.owner) + '/' + encodeURIComponent(cfg.repo) + '/contents/' + cfg.path.split('/').map(encodeURIComponent).join('/');
      let res = await fetch(putUrl, {
        method: 'PUT',
        headers: {
          'Accept': 'application/vnd.github+json',
          'Authorization': 'Bearer ' + cfg.token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      // Conflict (sha cu) -> lay sha moi roi thu lai 1 lan
      if (res.status === 409) {
        const fresh = await githubGetFile();
        if (fresh.sha) body.sha = fresh.sha;
        res = await fetch(putUrl, {
          method: 'PUT',
          headers: {
            'Accept': 'application/vnd.github+json',
            'Authorization': 'Bearer ' + cfg.token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        });
      }
      if (res.status === 401) throw new Error('Token sai / het han (401).');
      if (res.status === 403) throw new Error('Bi tu choi (403) - token thieu quyen Contents write hoac vuot rate limit.');
      if (res.status === 404) throw new Error('Khong tim thay repo/file (404). Kiem tra owner/repo/path/branch.');
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error('GitHub PUT ' + res.status + ' ' + txt.slice(0, 300));
      }
      const stamp = new Date().toLocaleString('vi-VN');
      try { localStorage.setItem('todo-manager:github:lastSync', stamp); } catch {}
      refreshSyncStatus();
      setSyncStatus('is-ok', 'Đã lưu lên GitHub ●', 'Vừa đẩy ' + state.tasks.length + ' việc lúc ' + stamp + '. Pages sẽ deploy lại 1-2 phút.');
      if (!opts.quiet) showToast('Da day ' + state.tasks.length + ' viec len GitHub', 'success');
      return true;
    } catch (e) {
      console.warn('pushTasksToGitHub failed', e);
      setSyncStatus('is-error', 'Đẩy GitHub thất bại', escapeHtml(e.message || 'Loi khong xac dinh'));
      showToast('Day GitHub that bai: ' + (e.message || 'loi'), 'success');
      return false;
    } finally {
      githubSyncing = false;
    }
  }

  function loadData() {
    try {
      let raw = localStorage.getItem(STORAGE_KEY);
      // migrate v1 -> v2
      if (!raw) {
        const legacy = localStorage.getItem(STORAGE_KEY_LEGACY);
        if (legacy) {
          try {
            const p = JSON.parse(legacy);
            if (p && Array.isArray(p.tasks)) {
              localStorage.setItem(STORAGE_KEY, legacy);
              raw = legacy;
            }
          } catch {}
        }
      }
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

  function normalizeTask(t) {
    if (!t || typeof t.title !== 'string' || !t.title.trim()) return null;
    const prio = ['low', 'medium', 'high'].includes(t.priority) ? t.priority : 'medium';
    const status = ['todo', 'doing', 'done'].includes(t.status) ? t.status : 'todo';
    return {
      id: typeof t.id === 'string' && t.id ? t.id : uid(),
      title: t.title.trim().slice(0, 80),
      description: typeof t.description === 'string' ? t.description.trim().slice(0, 2000) : '',
      priority: prio,
      status,
      dueDate: typeof t.dueDate === 'string' ? t.dueDate : '',
      createdAt: typeof t.createdAt === 'string' && !isNaN(Date.parse(t.createdAt)) ? t.createdAt : new Date().toISOString(),
      tags: Array.isArray(t.tags) ? [...new Set(t.tags.map(x => String(x).trim().toLowerCase()).filter(Boolean))].slice(0, 10) : []
    };
  }

  function sanitizeTasks(arr) {
    if (!Array.isArray(arr)) return [];
    return arr.map(normalizeTask).filter(Boolean);
  }

  async function loadDefaultTasks() {
    try {
      const res = await fetch(TASKS_JSON_URL, { cache: 'no-store' });
      if (!res.ok) return null;
      const data = await res.json();
      const list = sanitizeTasks(data.tasks || data);
      return list.length ? list : null;
    } catch {
      return null;
    }
  }

  function buildBackupPayload() {
    return {
      version: 1,
      updatedAt: new Date().toISOString(),
      tasks: state.tasks
    };
  }

  function exportBackup() {
    try {
      const payload = buildBackupPayload();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const stamp = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = 'tasks-backup-' + stamp + '.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast('Da xuat file backup - ghi de tasks.json roi push de giu tren Pages', 'success');
    } catch (e) {
      console.warn('export failed', e);
      showToast('Xuat backup that bai', 'success');
    }
  }

  function importBackupFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result || '{}'));
        const list = sanitizeTasks(data.tasks || data);
        if (!list.length) {
          showToast('File khong co cong viec hop le', 'success');
          return;
        }
        state.tasks = list;
        saveData();
        render();
        scheduleGithubSync('nhap-backup');
        scheduleKvdbSync('nhap-backup');
        showToast('Da nhap ' + list.length + ' cong viec', 'success');
      } catch {
        showToast('File JSON khong hop le', 'success');
      }
    };
    reader.readAsText(file);
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

  // ---------- CRUD (thao tac state + auto-push GitHub + kvdb) ----------
  function afterMutation(reason) {
    saveData();
    render();
    scheduleGithubSync(reason);
    scheduleKvdbSync(reason);
  }

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
    afterMutation('them-task');
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
    afterMutation('sua-task');
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
    scheduleGithubSync('xoa-task');
    scheduleKvdbSync('xoa-task');
    showUndoToast(task, idx);
  }

  function restoreTask(task, originalIndex) {
    const insertAt = Math.min(originalIndex, state.tasks.length);
    state.tasks.splice(insertAt, 0, task);
    afterMutation('hoan-tac-xoa-task');
  }

  function cycleStatus(id) {
    const t = state.tasks.find(x => x.id === id);
    if (!t) return;
    t.status = nextStatus(t.status);
    afterMutation('doi-trang-thai');
    showToast(`"${t.title}" → ${statusLabel(t.status)}`, 'success');
  }

  // ---------- Filter & Sort ----------
  function filterTasks(tasks) {
    const f = state.filters;
    const search = f.search.trim().toLowerCase();
    return tasks.filter(t => {
      if (search) {
        const hay = (t.title + ' ' + (t.description || '') + ' ' + (t.tags||[]).join(' ')).toLowerCase();
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

    // empty — KN-005: gợi ý clear filter khi đang lọc
    if (sorted.length === 0) {
      els.taskGrid.innerHTML = '';
      els.taskGrid.hidden = true;
      els.emptyState.hidden = false;
      const isFiltering = state.filters.search || state.filters.status!=='all' || state.filters.priority!=='all' || state.filters.tag!=='all' || state.filters.overdueOnly;
      const emptyDesc = els.emptyState.querySelector('.empty-desc');
      const emptyTitle = els.emptyState.querySelector('.empty-title');
      if(isFiltering && state.tasks.length>0){
        if(emptyTitle) emptyTitle.textContent = 'Không có kết quả với bộ lọc hiện tại';
        if(emptyDesc) emptyDesc.textContent = `Đang lọc ${state.tasks.length} việc — thử đổi từ khóa hoặc bấm “Xóa bộ lọc”.`;
        const btn = els.emptyState.querySelector('#btn-empty-add');
        if(btn){ btn.textContent = '↺ Xóa bộ lọc'; btn.onclick = ()=> els.btnClearFilters.click(); }
      } else {
        if(emptyTitle) emptyTitle.textContent = 'Chưa có công việc phù hợp';
        if(emptyDesc) emptyDesc.textContent = 'Thử đổi bộ lọc hoặc tạo công việc mới để bắt đầu.';
        const btn = els.emptyState.querySelector('#btn-empty-add');
        if(btn){ btn.textContent = '＋ Thêm việc đầu tiên'; btn.onclick = ()=> openModal(null); }
      }
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
      restoreTask(task, originalIndex);
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
    // KN-005: focus trap + ESC
    document.addEventListener('keydown', trapModalFocus);
  }

  function trapModalFocus(e){
    if(els.modal.hidden) return;
    if(e.key==='Escape'){ e.preventDefault(); closeModal(); return; }
    if(e.key!=='Tab') return;
    const focusable = [...els.modal.querySelectorAll('button, input, select, textarea, [tabindex]:not([tabindex=\"-1\"])')].filter(el=> !el.disabled && el.offsetParent!==null);
    if(!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length-1];
    if(e.shiftKey && document.activeElement===first){ e.preventDefault(); last.focus(); }
    else if(!e.shiftKey && document.activeElement===last){ e.preventDefault(); first.focus(); }
  }
  function closeModal() {
    document.removeEventListener('keydown', trapModalFocus);
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

  // ---------- Sync Code modal ----------
  function openSyncCodeModal() {
    const code = getSyncCode();
    if (els.syncCodeInput) els.syncCodeInput.value = code || '';
    if (els.errSyncCode) els.errSyncCode.textContent = '';
    if (!els.syncCodeModal || !els.syncCodeBackdrop) return;
    els.syncCodeModal.hidden = false;
    els.syncCodeBackdrop.hidden = false;
    requestAnimationFrame(() => {
      els.syncCodeModal.classList.add('is-open');
      els.syncCodeBackdrop.classList.add('is-open');
    });
    setTimeout(() => { if (els.syncCodeInput) els.syncCodeInput.focus(); }, 100);
  }
  function closeSyncCodeModal() {
    if (!els.syncCodeModal || !els.syncCodeBackdrop) return;
    els.syncCodeModal.classList.remove('is-open');
    els.syncCodeBackdrop.classList.remove('is-open');
    setTimeout(() => {
      els.syncCodeModal.hidden = true;
      els.syncCodeBackdrop.hidden = true;
    }, 200);
  }
  async function handleSyncCodeSave() {
    const raw = els.syncCodeInput ? els.syncCodeInput.value : '';
    const code = normalizeSyncCode(raw);
    if (!code || code.length < 4) {
      if (els.errSyncCode) els.errSyncCode.textContent = 'Ma phai co it nhat 4 ky tu (chu/so)';
      if (els.syncCodeInput) els.syncCodeInput.focus();
      return;
    }
    if (els.errSyncCode) els.errSyncCode.textContent = '';
    setSyncCode(code);
    closeSyncCodeModal();
    refreshSyncStatus();
    showToast('Da ket noi Sync Code "' + code + '" - dang dong bo...', 'success');
    // Try pull first if remote has data and local is empty-ish, else push
    try {
      const remote = await kvdbPull({ code, silent: true });
      if (remote && remote.length && state.tasks.length === 0) {
        state.tasks = remote;
        saveData();
        render();
        showToast('Da keo ' + remote.length + ' viec tu Sync Code', 'success');
      } else {
        await kvdbPush('ket-noi-sync-code');
        showToast('Da day ' + state.tasks.length + ' viec len Sync Code', 'success');
      }
    } catch (e) {
      await kvdbPush('ket-noi-sync-code');
    }
    refreshSyncCodeBar();
  }
  function handleSyncCodeDisconnect() {
    try { localStorage.removeItem(SYNC_CODE_KEY); } catch {}
    try { localStorage.removeItem('todo-manager:syncCode:lastSync'); } catch {}
    if (els.syncCodeInput) els.syncCodeInput.value = '';
    closeSyncCodeModal();
    refreshSyncStatus();
    showToast('Da ngat Sync Code', 'success');
  }

  // ---------- GitHub settings modal ----------
  function openGithubModal() {
    const cfg = getGithubConfig();
    if (els.ghOwner) els.ghOwner.value = cfg.owner || '';
    if (els.ghRepo) els.ghRepo.value = cfg.repo || '';
    if (els.ghBranch) els.ghBranch.value = cfg.branch || 'main';
    if (els.ghPath) els.ghPath.value = cfg.path || GITHUB_DEFAULTS.path;
    if (els.ghToken) els.ghToken.value = cfg.token || '';
    if (els.ghAutosync) els.ghAutosync.checked = cfg.autosync !== false;
    if (els.errGithub) els.errGithub.textContent = '';
    if (!els.githubModal || !els.githubBackdrop) return;
    els.githubModal.hidden = false;
    els.githubBackdrop.hidden = false;
    requestAnimationFrame(() => {
      els.githubModal.classList.add('is-open');
      els.githubBackdrop.classList.add('is-open');
    });
    setTimeout(() => { if (els.ghToken) els.ghToken.focus(); }, 100);
  }

  function closeGithubModal() {
    if (!els.githubModal || !els.githubBackdrop) return;
    els.githubModal.classList.remove('is-open');
    els.githubBackdrop.classList.remove('is-open');
    setTimeout(() => {
      els.githubModal.hidden = true;
      els.githubBackdrop.hidden = true;
    }, 200);
  }

  async function handleGithubSave() {
    const cfg = {
      owner: els.ghOwner ? els.ghOwner.value.trim() : '',
      repo: els.ghRepo ? els.ghRepo.value.trim() : '',
      branch: els.ghBranch ? els.ghBranch.value.trim() || 'main' : 'main',
      path: els.ghPath ? els.ghPath.value.trim() || GITHUB_DEFAULTS.path : GITHUB_DEFAULTS.path,
      token: els.ghToken ? els.ghToken.value.trim() : '',
      autosync: els.ghAutosync ? !!els.ghAutosync.checked : true
    };
    if (!cfg.owner || !cfg.repo) {
      if (els.errGithub) els.errGithub.textContent = 'Nhap owner va repo';
      return;
    }
    if (!cfg.token) {
      if (els.errGithub) els.errGithub.textContent = 'Token la bat buoc';
      if (els.ghToken) els.ghToken.focus();
      return;
    }
    saveGithubConfig(cfg);
    if (els.errGithub) els.errGithub.textContent = '';
    closeGithubModal();
    refreshSyncStatus();
    showToast('Da ket noi GitHub - dang dong bo...', 'success');
    await pushTasksToGitHub('ket-noi-github-lan-dau');
  }

  function handleGithubDisconnect() {
    try { localStorage.removeItem(GITHUB_CONFIG_KEY); } catch {}
    try { localStorage.removeItem('todo-manager:github:lastSync'); } catch {}
    if (els.ghToken) els.ghToken.value = '';
    closeGithubModal();
    refreshSyncStatus();
    showToast('Da ngat ket noi GitHub', 'success');
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
      afterMutation('seed-mau');
      showToast(`Đã thêm ${seeds.length} việc mẫu`, 'success');
    });
    if (els.btnSync) {
      els.btnSync.addEventListener('click', () => pushTasksToGitHub('day-thu-cong'));
    }
    if (els.btnGithubSettings) {
      els.btnGithubSettings.addEventListener('click', openGithubModal);
    }
    if (els.btnCloseGithub) els.btnCloseGithub.addEventListener('click', closeGithubModal);
    if (els.btnGithubCancel) els.btnGithubCancel.addEventListener('click', closeGithubModal);
    if (els.githubBackdrop) els.githubBackdrop.addEventListener('click', closeGithubModal);
    if (els.btnGithubSave) els.btnGithubSave.addEventListener('click', handleGithubSave);
    if (els.btnGithubDisconnect) els.btnGithubDisconnect.addEventListener('click', handleGithubDisconnect);
    // Sync Code
    if (els.btnSyncCode) els.btnSyncCode.addEventListener('click', openSyncCodeModal);
    if (els.btnCloseSyncCode) els.btnCloseSyncCode.addEventListener('click', closeSyncCodeModal);
    if (els.btnSyncCodeCancel) els.btnSyncCodeCancel.addEventListener('click', closeSyncCodeModal);
    if (els.syncCodeBackdrop) els.syncCodeBackdrop.addEventListener('click', closeSyncCodeModal);
    if (els.btnSyncCodeSave) els.btnSyncCodeSave.addEventListener('click', handleSyncCodeSave);
    if (els.btnSyncCodeDisconnect) els.btnSyncCodeDisconnect.addEventListener('click', handleSyncCodeDisconnect);
    if (els.btnGenerateCode) els.btnGenerateCode.addEventListener('click', () => {
      const c = generateSyncCode();
      if (els.syncCodeInput) els.syncCodeInput.value = c;
      if (els.errSyncCode) els.errSyncCode.textContent = '';
    });
    if (els.btnCopyCode) els.btnCopyCode.addEventListener('click', async () => {
      const code = getSyncCode();
      if (!code) return;
      try {
        await navigator.clipboard.writeText(code);
        showToast('Da copy ma "' + code + '"', 'success');
      } catch {
        // fallback
        const ta = document.createElement('textarea');
        ta.value = code;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        showToast('Da copy ma "' + code + '"', 'success');
      }
    });
    if (els.btnPullCode) els.btnPullCode.addEventListener('click', handleKvdbPull);
    if (els.btnExport) {
      els.btnExport.addEventListener('click', exportBackup);
    }
    if (els.btnImport && els.fileImport) {
      els.btnImport.addEventListener('click', () => els.fileImport.click());
      els.fileImport.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        importBackupFile(file);
        e.target.value = '';
      });
    }

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
      if (e.key === 'Escape' && els.githubModal && !els.githubModal.hidden) {
        closeGithubModal();
      }
      if (e.key === 'Escape' && els.syncCodeModal && !els.syncCodeModal.hidden) {
        closeSyncCodeModal();
      }
    });

    // footer date
    if (els.footerDate) {
      els.footerDate.textContent = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
    }
  }

  // ---------- Init ----------
  function applyLoadedState(saved) {
    state.tasks = Array.isArray(saved.tasks) ? sanitizeTasks(saved.tasks) : [];
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
  }

  async function init() {
    const saved = loadData();
    if (saved) {
      applyLoadedState(saved);
    } else {
      const defaults = await loadDefaultTasks();
      state.tasks = defaults && defaults.length ? defaults : seedData();
      saveData();
    }

    // ensure tag filter reflects saved tag
    bindEvents();
    render();
    refreshSyncStatus();
    // If Sync Code exists, try to pull latest in background (non-blocking)
    const code = getSyncCode();
    if (code) {
      kvdbPull({ code, silent: true }).then(list => {
        if (list && list.length && list.length !== state.tasks.length) {
          // Only auto-merge if local is empty or user confirms via toast
          // For now, just update sync bar — user can click Kéo về to apply
          if (els.syncCodeSub) els.syncCodeSub.textContent = 'Có ' + list.length + ' việc trên cloud — bấm Kéo về để cập nhật';
        }
      }).catch(() => {});
    }
  }

  // Expose for debugging / rubric check
  window.TaskBoard = {
    get state() { return state; },
    addTask, updateTask, deleteTask, restoreTask, filterTasks, sortTasks, renderTasks, renderDashboard, saveData, loadData, exportBackup, importBackupFile, loadDefaultTasks, pushTasksToGitHub, getGithubConfig,
    getSyncCode, setSyncCode, kvdbPush, kvdbPull, generateSyncCode
  };

  document.addEventListener('DOMContentLoaded', init);
})();
