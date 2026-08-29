/* Focus Flow — app.js | Vanilla, localStorage, a11y, no deps */
const STORAGE_KEY = 'focus-flow:v1';
const DEFAULTS = {
  durations: { focus: 25, short: 5, long: 15 },
  sound: true,
  notify: false,
};

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const els = {
  time: $('#time-display'),
  ringFg: $('#ring-fg'),
  modeHint: $('#mode-hint'),
  timerTitle: $('#timer-title'),
  btnToggle: $('#btn-toggle'),
  btnToggleText: $('#btn-toggle-text'),
  btnReset: $('#btn-reset'),
  tabs: $$('.tab'),
  focusingText: $('#focusing-text'),
  hPomos: $('#h-pomos'),
  hMins: $('#h-mins'),
  hDone: $('#h-done'),
  statPomos: $('#stat-pomos'),
  statMins: $('#stat-mins'),
  statDone: $('#stat-done'),
  bars: $('#bars'),
  barsLabels: $('#bars-labels'),
  taskForm: $('#task-form'),
  taskInput: $('#task-input'),
  taskList: $('#task-list'),
  tasksCount: $('#tasks-count'),
  tasksHint: $('#tasks-hint'),
  empty: $('#empty'),
  skeleton: $('#skeleton'),
  btnClearDone: $('#btn-clear-done'),
  toastStack: $('#toast-stack'),
  confetti: $('#confetti'),
  footerDate: $('#footer-date'),
  dialog: $('#settings-dialog'),
  btnSettings: $('#btn-settings'),
  setFocus: $('#set-focus'),
  setShort: $('#set-short'),
  setLong: $('#set-long'),
  setSound: $('#set-sound'),
  setNotify: $('#set-notify'),
  btnSaveSettings: $('#btn-save-settings'),
};

const CIRC = 2 * Math.PI * 88; // 552.92
els.ringFg.style.setProperty('--circ', CIRC);
els.ringFg.style.strokeDasharray = String(CIRC);

// State
let state = {
  mode: 'focus', // focus | short | long
  durations: { ...DEFAULTS.durations },
  sound: DEFAULTS.sound,
  notify: DEFAULTS.notify,
  remaining: DEFAULTS.durations.focus * 60,
  running: false,
  endAt: null, // timestamp ms
  tickId: null,
  tasks: [], // {id, text, done, createdAt}
  focusedId: null,
  stats: { date: todayStr(), pomodoros: 0, minutes: 0, done: 0 },
  history: {}, // dateStr -> pomodoros
};

let audioCtx = null;

// Helpers
function todayStr(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function fmtTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
function totalForMode(mode) {
  return state.durations[mode] * 60;
}
function save() {
  try {
    const toSave = {
      durations: state.durations,
      sound: state.sound,
      notify: state.notify,
      mode: state.mode,
      remaining: state.running ? Math.max(0, Math.round((state.endAt - Date.now()) / 1000)) : state.remaining,
      tasks: state.tasks,
      focusedId: state.focusedId,
      stats: state.stats,
      history: state.history,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    toast('Không lưu được — bộ nhớ đầy', 'error');
  }
}
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data.durations) state.durations = { ...DEFAULTS.durations, ...data.durations };
    if (typeof data.sound === 'boolean') state.sound = data.sound;
    if (typeof data.notify === 'boolean') state.notify = data.notify;
    if (data.mode) state.mode = data.mode;
    if (typeof data.remaining === 'number') state.remaining = data.remaining;
    if (Array.isArray(data.tasks)) state.tasks = data.tasks;
    if (data.focusedId) state.focusedId = data.focusedId;
    if (data.stats) {
      // rollover if date changed
      if (data.stats.date !== todayStr()) {
        // push yesterday's pomodoros to history if needed? keep as is
        state.stats = { date: todayStr(), pomodoros: 0, minutes: 0, done: 0 };
        state.history = data.history || {};
      } else {
        state.stats = data.stats;
        state.history = data.history || {};
      }
    } else if (data.history) {
      state.history = data.history;
    }
    // ensure remaining matches mode if not running and no saved remaining
    if (!data.remaining && data.remaining !== 0) {
      state.remaining = totalForMode(state.mode);
    }
  } catch {}
}

// Toast
function toast(msg, variant = '') {
  const t = document.createElement('div');
  t.className = `toast ${variant ? 'is-' + variant : ''}`;
  t.textContent = msg;
  els.toastStack.appendChild(t);
  setTimeout(() => {
    t.style.animation = 'toastOut 200ms ease forwards';
    setTimeout(() => t.remove(), 220);
  }, 3000);
}

// Confetti
function confettiBurst() {
  const colors = ['#6366f1', '#06b6d4', '#f59e0b', '#10b981', '#ec4899'];
  for (let i = 0; i < 18; i++) {
    const dot = document.createElement('i');
    dot.style.left = (10 + Math.random() * 80) + '%';
    dot.style.top = '-10px';
    dot.style.background = colors[i % colors.length];
    dot.style.animationDelay = (Math.random() * 0.15) + 's';
    dot.style.transform = `translateX(${(Math.random() - 0.5) * 60}px)`;
    els.confetti.appendChild(dot);
    setTimeout(() => dot.remove(), 900);
  }
}

// Sound
function ensureAudio() {
  if (audioCtx) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  } catch {}
}
function beep() {
  if (!state.sound) return;
  ensureAudio();
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = 'sine';
  o.frequency.value = 880;
  g.gain.value = 0.0001;
  o.connect(g); g.connect(audioCtx.destination);
  const now = audioCtx.currentTime;
  g.gain.exponentialRampToValueAtTime(0.25, now + 0.02);
  o.start(now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
  o.stop(now + 0.5);
  // second beep
  setTimeout(() => {
    if (!audioCtx) return;
    const o2 = audioCtx.createOscillator();
    const g2 = audioCtx.createGain();
    o2.type = 'sine'; o2.frequency.value = 1108;
    g2.gain.value = 0.0001;
    o2.connect(g2); g2.connect(audioCtx.destination);
    const n2 = audioCtx.currentTime;
    g2.gain.exponentialRampToValueAtTime(0.25, n2 + 0.02);
    o2.start(n2);
    g2.gain.exponentialRampToValueAtTime(0.0001, n2 + 0.6);
    o2.stop(n2 + 0.65);
  }, 220);
}

// Notification
async function maybeNotify(title, body) {
  if (!state.notify) return;
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    new Notification(title, { body });
  } else if (Notification.permission !== 'denied') {
    const p = await Notification.requestPermission();
    if (p === 'granted') new Notification(title, { body });
  }
}

// Render
function renderAll() {
  renderTimer();
  renderHeaderStats();
  renderStats();
  renderHistory();
  renderTasks();
  renderFocusing();
  renderFooter();
  syncSettingsForm();
}

function renderTimer() {
  const total = totalForMode(state.mode);
  const remaining = state.running
    ? Math.max(0, Math.round((state.endAt - Date.now()) / 1000))
    : state.remaining;
  els.time.textContent = fmtTime(remaining);
  document.title = state.running
    ? `${fmtTime(remaining)} · ${state.mode === 'focus' ? 'Focus' : state.mode === 'short' ? 'Break' : 'Long Break'} — Focus Flow`
    : 'Focus Flow — Pomodoro & Task';

  const progress = total > 0 ? remaining / total : 0;
  const offset = CIRC * (1 - progress);
  els.ringFg.style.strokeDashoffset = String(offset);
  els.ringFg.classList.toggle('is-break', state.mode !== 'focus');

  const hints = {
    focus: `${state.durations.focus} phút tập trung`,
    short: `${state.durations.short} phút nghỉ ngắn`,
    long: `${state.durations.long} phút nghỉ dài`,
  };
  els.modeHint.textContent = hints[state.mode];
  els.timerTitle.textContent =
    state.mode === 'focus'
      ? state.running ? 'Đang tập trung…' : 'Sẵn sàng tập trung'
      : state.mode === 'short' ? 'Nghỉ ngắn — thở sâu' : 'Nghỉ dài — nạp năng lượng';

  els.tabs.forEach(t => {
    const active = t.dataset.mode === state.mode;
    t.classList.toggle('is-active', active);
    t.setAttribute('aria-selected', String(active));
  });

  // controls
  if (state.running) {
    els.btnToggleText.textContent = 'Tạm dừng';
    els.btnToggle.querySelector('.btn-icon').textContent = '⏸';
    els.btnToggle.setAttribute('aria-label', 'Tạm dừng');
  } else {
    const isAtStart = remaining === total;
    els.btnToggleText.textContent = remaining === 0 ? 'Bắt đầu lại' : isAtStart ? 'Bắt đầu' : 'Tiếp tục';
    els.btnToggle.querySelector('.btn-icon').textContent = '▶';
    els.btnToggle.setAttribute('aria-label', els.btnToggleText.textContent);
  }
}

function renderHeaderStats() {
  els.hPomos.textContent = state.stats.pomodoros;
  els.hMins.textContent = state.stats.minutes;
  els.hDone.textContent = state.stats.done;
}

function renderStats() {
  // animate number? simple
  els.statPomos.textContent = state.stats.pomodoros;
  els.statMins.innerHTML = `${state.stats.minutes}<span class="stat-unit">m</span>`;
  els.statDone.textContent = state.stats.done;
}

function renderHistory() {
  const days = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = todayStr(d);
    const label = i === 0 ? 'Hôm nay' : d.toLocaleDateString('vi-VN', { weekday: 'short' });
    const val = state.history[key] || (key === todayStr() ? state.stats.pomodoros : 0);
    days.push({ key, label, val, isToday: i === 0 });
  }
  const max = Math.max(1, ...days.map(d => d.val));
  els.bars.innerHTML = '';
  els.barsLabels.innerHTML = '';
  days.forEach(d => {
    const bar = document.createElement('div');
    bar.className = 'bar' + (d.isToday ? ' is-today' : '');
    const h = Math.max(6, (d.val / max) * 88);
    bar.style.height = h + 'px';
    if (d.val > 0) {
      const lbl = document.createElement('span');
      lbl.className = 'bar-label';
      lbl.textContent = d.val;
      bar.appendChild(lbl);
    }
    bar.setAttribute('aria-label', `${d.label}: ${d.val} pomodoros`);
    bar.title = `${d.label}: ${d.val} 🍅`;
    els.bars.appendChild(bar);

    const lab = document.createElement('span');
    lab.textContent = d.label.slice(0, 3);
    els.barsLabels.appendChild(lab);
  });
  els.bars.setAttribute('aria-label', `7 ngày: ${days.map(d => `${d.label} ${d.val}`).join(', ')}`);
}

function renderTasks() {
  const total = state.tasks.length;
  const doneCount = state.tasks.filter(t => t.done).length;
  els.tasksCount.textContent = total === 0 ? '0 task' : `${total} task · ${doneCount} xong`;
  els.taskList.innerHTML = '';

  if (total === 0) {
    els.empty.hidden = false;
    els.taskList.hidden = true;
  } else {
    els.empty.hidden = true;
    els.taskList.hidden = false;
    state.tasks.forEach(task => {
      const li = document.createElement('li');
      li.className = 'task' + (task.id === state.focusedId ? ' is-focused' : '') + (task.done ? ' is-done' : '');
      li.dataset.id = task.id;

      const check = document.createElement('button');
      check.className = 'task-check' + (task.done ? ' is-done' : '');
      check.setAttribute('aria-label', task.done ? 'Đánh dấu chưa xong' : 'Đánh dấu đã xong');
      check.type = 'button';
      check.innerHTML = task.done ? '✓' : '';
      check.addEventListener('click', () => toggleDone(task.id));

      const name = document.createElement('span');
      name.className = 'task-name';
      name.textContent = task.text;
      name.title = task.text;

      const actions = document.createElement('div');
      actions.className = 'task-actions';

      const focusBtn = document.createElement('button');
      focusBtn.className = 'btn-icon-sm' + (task.id === state.focusedId ? ' is-active' : '');
      focusBtn.type = 'button';
      focusBtn.setAttribute('aria-label', task.id === state.focusedId ? 'Đang focus' : 'Focus task này');
      focusBtn.textContent = '◎';
      focusBtn.title = 'Focus';
      focusBtn.addEventListener('click', () => setFocused(task.id));

      const del = document.createElement('button');
      del.className = 'btn-icon-sm danger';
      del.type = 'button';
      del.setAttribute('aria-label', `Xóa task ${task.text}`);
      del.textContent = '✕';
      del.title = 'Xóa';
      del.addEventListener('click', () => deleteTask(task.id));

      actions.append(focusBtn, del);
      li.append(check, name, actions);
      els.taskList.appendChild(li);
    });
  }
}

function renderFocusing() {
  if (!state.focusedId) {
    els.focusingText.textContent = 'Chưa chọn task — chọn 1 task để focus';
    return;
  }
  const t = state.tasks.find(x => x.id === state.focusedId);
  if (!t) {
    state.focusedId = null;
    els.focusingText.textContent = 'Chưa chọn task — chọn 1 task để focus';
    return;
  }
  els.focusingText.textContent = `Đang focus: ${t.text}`;
}

function renderFooter() {
  els.footerDate.textContent = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
}

function syncSettingsForm() {
  els.setFocus.value = state.durations.focus;
  els.setShort.value = state.durations.short;
  els.setLong.value = state.durations.long;
  els.setSound.checked = state.sound;
  els.setNotify.checked = state.notify;
}

// Timer control
function switchMode(mode) {
  if (state.running) {
    // pause first
    pause();
  }
  state.mode = mode;
  state.remaining = totalForMode(mode);
  renderTimer();
  save();
}

function start() {
  if (state.running) return;
  ensureAudio();
  // if remaining is 0, reset to total
  if (state.remaining <= 0) state.remaining = totalForMode(state.mode);
  state.running = true;
  state.endAt = Date.now() + state.remaining * 1000;
  state.tickId = setInterval(tick, 250);
  renderTimer();
  save();
  toast(state.mode === 'focus' ? 'Bắt đầu tập trung — cố lên!' : 'Bắt đầu nghỉ ngơi', 'success');
}

function pause() {
  if (!state.running) return;
  state.running = false;
  state.remaining = Math.max(0, Math.round((state.endAt - Date.now()) / 1000));
  clearInterval(state.tickId);
  state.tickId = null;
  state.endAt = null;
  renderTimer();
  save();
}

function reset() {
  const wasRunning = state.running;
  if (state.tickId) clearInterval(state.tickId);
  state.running = false;
  state.tickId = null;
  state.endAt = null;
  state.remaining = totalForMode(state.mode);
  renderTimer();
  save();
  if (wasRunning) toast('Đã đặt lại timer');
}

function tick() {
  const remaining = Math.max(0, Math.round((state.endAt - Date.now()) / 1000));
  state.remaining = remaining;
  renderTimer();
  if (remaining <= 0) {
    clearInterval(state.tickId);
    state.tickId = null;
    state.running = false;
    state.endAt = null;
    onTimerComplete();
  }
}

function onTimerComplete() {
  beep();
  if (state.mode === 'focus') {
    // stats
    state.stats.pomodoros += 1;
    state.stats.minutes += state.durations.focus;
    const key = todayStr();
    state.history[key] = (state.history[key] || 0) + 1;
    // if focused task exists and not done, maybe keep? don't auto done
    confettiBurst();
    toast(`Hoàn thành 1 pomodoro! Tổng ${state.stats.pomodoros} 🍅`, 'success');
    maybeNotify('Focus Flow', `Xong 1 pomodoro (${state.durations.focus} phút) — nghỉ thôi!`);
    // auto switch to break
    const isLong = state.stats.pomodoros % 4 === 0;
    state.mode = isLong ? 'long' : 'short';
    state.remaining = totalForMode(state.mode);
    renderAll();
    save();
    // optional auto start break? not auto, let user start
  } else {
    toast('Hết giờ nghỉ — quay lại focus nào!', 'success');
    maybeNotify('Focus Flow', 'Hết giờ nghỉ — sẵn sàng focus tiếp!');
    state.mode = 'focus';
    state.remaining = totalForMode(state.mode);
    renderAll();
    save();
  }
}

// Tasks
function addTask(text) {
  const t = text.trim();
  if (!t) return;
  const task = { id: String(Date.now()) + Math.random().toString(36).slice(2, 6), text: t, done: false, createdAt: Date.now() };
  state.tasks.unshift(task);
  // auto focus if none
  if (!state.focusedId) state.focusedId = task.id;
  renderTasks();
  renderFocusing();
  renderHeaderStats();
  save();
  toast('Đã thêm task', 'success');
  // subtle add animation: handled by CSS transition
}

function toggleDone(id) {
  const t = state.tasks.find(x => x.id === id);
  if (!t) return;
  t.done = !t.done;
  if (t.done) {
    state.stats.done += 1;
    // if focused task done, clear focus or move to next undone
    if (state.focusedId === id) {
      const next = state.tasks.find(x => !x.done);
      state.focusedId = next ? next.id : null;
    }
    confettiBurst();
    toast('Tuyệt — xong 1 task!', 'success');
  } else {
    state.stats.done = Math.max(0, state.stats.done - 1);
  }
  renderTasks();
  renderFocusing();
  renderStats();
  renderHeaderStats();
  save();
}

function setFocused(id) {
  if (state.focusedId === id) {
    state.focusedId = null;
  } else {
    state.focusedId = id;
  }
  renderTasks();
  renderFocusing();
  save();
}

function deleteTask(id) {
  const idx = state.tasks.findIndex(x => x.id === id);
  if (idx === -1) return;
  const wasDone = state.tasks[idx].done;
  state.tasks.splice(idx, 1);
  if (state.focusedId === id) state.focusedId = null;
  // if deleted was done, decrement stats? keep stats as history, don't decrement? but for consistency, if user deletes a done task, keep done count? We'll keep.
  renderTasks();
  renderFocusing();
  renderHeaderStats();
  save();
  toast('Đã xóa task');
}

function clearDone() {
  const before = state.tasks.length;
  state.tasks = state.tasks.filter(t => !t.done);
  if (state.focusedId && !state.tasks.find(t => t.id === state.focusedId)) state.focusedId = null;
  const removed = before - state.tasks.length;
  if (removed === 0) return toast('Không có task đã xong');
  renderTasks();
  renderFocusing();
  save();
  toast(`Đã xóa ${removed} task đã xong`);
}

// Settings
function openSettings() {
  syncSettingsForm();
  if (typeof els.dialog.showModal === 'function') els.dialog.showModal();
  else els.dialog.setAttribute('open', '');
}
function closeSettings() {
  if (els.dialog.open) els.dialog.close();
}
function saveSettings(e) {
  e.preventDefault();
  const f = parseInt(els.setFocus.value, 10);
  const s = parseInt(els.setShort.value, 10);
  const l = parseInt(els.setLong.value, 10);
  if ([f, s, l].some(v => Number.isNaN(v) || v < 1 || v > 90)) {
    toast('Thời lượng không hợp lệ (1-90)', 'error');
    return;
  }
  state.durations = { focus: f, short: s, long: l };
  state.sound = els.setSound.checked;
  state.notify = els.setNotify.checked;
  if (state.notify && 'Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
  // if not running, update remaining to new total for current mode
  if (!state.running) state.remaining = totalForMode(state.mode);
  renderTimer();
  save();
  closeSettings();
  toast('Đã lưu cài đặt', 'success');
}

// Events
function bindEvents() {
  els.tabs.forEach(tab => {
    tab.addEventListener('click', () => switchMode(tab.dataset.mode));
  });
  els.btnToggle.addEventListener('click', () => {
    if (state.running) pause();
    else start();
  });
  els.btnReset.addEventListener('click', reset);

  els.taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = els.taskInput.value;
    if (!v.trim()) return;
    addTask(v);
    els.taskInput.value = '';
    els.taskInput.focus();
  });

  els.btnClearDone.addEventListener('click', clearDone);

  els.btnSettings.addEventListener('click', openSettings);
  els.dialog.addEventListener('click', (e) => {
    const rect = els.dialog.getBoundingClientRect();
    const inDialog = rect.top <= e.clientY && e.clientY <= rect.top + rect.height && rect.left <= e.clientX && e.clientX <= rect.left + rect.width;
    if (!inDialog) closeSettings();
  });
  els.btnSaveSettings.addEventListener('click', saveSettings);
  // also handle form submit via dialog
  els.dialog.querySelector('form').addEventListener('submit', (e) => {
    // let dialog handle close, but intercept save
    if (e.submitter && e.submitter.id === 'btn-save-settings') {
      saveSettings(e);
    }
  });

  // Keyboard
  document.addEventListener('keydown', (e) => {
    const tag = document.activeElement.tagName;
    const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement.isContentEditable;
    if (e.code === 'Space' && !isTyping) {
      e.preventDefault();
      if (state.running) pause();
      else start();
    } else if ((e.key === 'r' || e.key === 'R') && !isTyping) {
      reset();
    }
  });

  // Visibility: correct drift on return
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && state.running) {
      renderTimer();
    }
  });
}

// Init
function init() {
  load();
  // ensure stats date is today
  if (state.stats.date !== todayStr()) {
    state.stats = { date: todayStr(), pomodoros: 0, minutes: 0, done: 0 };
  }
  // ensure remaining valid
  if (typeof state.remaining !== 'number' || state.remaining < 0) state.remaining = totalForMode(state.mode);
  if (state.remaining > totalForMode(state.mode)) state.remaining = totalForMode(state.mode);

  bindEvents();
  renderAll();

  // skeleton demo: show briefly then hide (simulate loading)
  els.skeleton.hidden = false;
  els.taskList.hidden = true;
  els.empty.hidden = true;
  setTimeout(() => {
    els.skeleton.hidden = true;
    renderTasks();
  }, 400);
}

init();

// Expose for debug
window.FocusFlow = { state, save, renderAll };
