/* Agentic Academy — store.js
 * Lõi chung cho index.html + slides.html: progress localStorage, URL helpers, toast, mini-markdown.
 * 0 dep · KN-040 dirBase · KN-029 không webfont. Sửa file này = văng cả 2 trang (entanglement).
 */
(function () {
  'use strict';

  var KEY = 'agentic-academy:progress:v1';

  function emptyState() { return { v: 1, done: {}, updatedAt: null }; }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return emptyState();
      var s = JSON.parse(raw);
      if (!s || typeof s !== 'object' || !s.done || typeof s.done !== 'object') return emptyState();
      var done = {};
      Object.keys(s.done).forEach(function (k) { if (s.done[k] === true) done[k] = true; });
      return { v: 1, done: done, updatedAt: s.updatedAt || null };
    } catch (e) { return emptyState(); }
  }

  function save(state) {
    try {
      state.v = 1;
      state.updatedAt = new Date().toISOString();
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) { /* private mode — bỏ qua êm */ }
  }

  function isDone(id) { return load().done[id] === true; }

  function setDone(id, val) {
    var s = load();
    if (val) s.done[id] = true; else delete s.done[id];
    save(s);
    return !!s.done[id];
  }

  function toggle(id) { return setDone(id, !isDone(id)); }

  function count() { return Object.keys(load().done).length; }

  function reset() { try { localStorage.removeItem(KEY); } catch (e) { /* noop */ } }

  /* URL robustness — KN-030/KN-040: '/academy' (no slash) + './x' → '/x' 404 */
  function dirBase(p) {
    if (!p) return '/';
    if (p.endsWith('/')) return p;
    var last = p.slice(p.lastIndexOf('/') + 1);
    return last.includes('.') ? p.slice(0, p.lastIndexOf('/') + 1) : p + '/';
  }

  function fixRelLinks(root) {
    root = root || document;
    Array.prototype.forEach.call(root.querySelectorAll('a[href^="./"]'), function (a) {
      var h = a.getAttribute('href');
      if (!h) return;
      a.setAttribute('href', dirBase(location.pathname) + h.slice(2));
    });
  }

  /* Toast — aria-live polite, pattern cosmos */
  var toastEl = null;
  function toast(msg, ms) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.id = 'aToast';
      toastEl.setAttribute('role', 'status');
      toastEl.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(function () { toastEl.classList.remove('show'); }, ms || 2600);
  }

  /* Escape + mini-markdown: `code` **bold** *italic* — an toàn XSS (escape trước) */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function md(s) {
    return esc(s)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>');
  }

  /* ---- Theme sáng/tối (KN-006: toggle persist + early init trong <head> chống flash) ---- */
  var THEME_KEY = 'agentic-academy:theme:v1';

  function themeCurrent() {
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }
  function paintThemeBtns() {
    var t = themeCurrent();
    Array.prototype.forEach.call(document.querySelectorAll('[data-theme-toggle]'), function (btn) {
      btn.setAttribute('aria-pressed', t === 'light' ? 'true' : 'false');
      btn.setAttribute('aria-label', t === 'light' ? 'Chuyển sang giao diện tối' : 'Chuyển sang giao diện sáng');
      var ico = btn.querySelector('.theme-ico');
      if (ico) ico.textContent = t === 'light' ? '☾' : '☀';
    });
  }
  function themeSet(t) {
    t = t === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem(THEME_KEY, t); } catch (e) { /* private mode */ }
    paintThemeBtns();
    return t;
  }
  function themeToggle() {
    var next = themeCurrent() === 'light' ? 'dark' : 'light';
    themeSet(next);
    toast(next === 'light' ? '☀ Giao diện sáng' : '☾ Giao diện tối');
  }
  Array.prototype.forEach.call(document.querySelectorAll('[data-theme-toggle]'), function (btn) {
    btn.addEventListener('click', themeToggle);
  });
  paintThemeBtns();

  window.Academy = {
    KEY: KEY,
    load: load, save: save, isDone: isDone, setDone: setDone, toggle: toggle,
    count: count, reset: reset,
    dirBase: dirBase, fixRelLinks: fixRelLinks,
    toast: toast, md: md, esc: esc,
    theme: { current: themeCurrent, set: themeSet, toggle: themeToggle, KEY: THEME_KEY }
  };
})();
