/** Guided Tour state machine and UI wiring. */

function makeTourState(stops) {
  let index = -1;
  let timer = 0;
  let playing = false;
  const emit = (onState) => onState?.({ index, total: stops.length, playing, current: stops[index] || null });
  const clear = () => { if (timer) window.clearTimeout(timer); timer = 0; };
  return {
    show(i, onState, onStep, onFinish, intervalMs, reduced) {
      if (!stops.length) return;
      index = Math.max(0, Math.min(i, stops.length - 1));
      playing = !reduced;
      clear();
      onStep?.(stops[index], index);
      const last = index === stops.length - 1;
      if (last) { playing = false; onFinish?.(); }
      emit(onState);
      if (!last && !reduced) timer = window.setTimeout(() => this.show(index + 1, onState, onStep, onFinish, intervalMs, reduced), intervalMs);
    },
    stop(onState) { playing = false; clear(); emit(onState); },
    state: () => ({ index, total: stops.length, playing, current: stops[index] || null }),
  };
}

export function createTour({ stops, intervalMs = 5200, reduced = false, onStep, onFinish, onState }) {
  const state = makeTourState(stops);
  const show = (i) => state.show(i, onState, onStep, onFinish, intervalMs, reduced);
  return {
    start: (i = 0) => show(i),
    stop: () => state.stop(onState),
    toggle: () => state.state().playing ? state.stop(onState) : show(Math.max(0, state.state().index)),
    next: () => show(Math.min(state.state().index + 1, stops.length - 1)),
    prev: () => show(Math.max(state.state().index - 1, 0)),
    seek: show,
    state: state.state,
  };
}

function setTourText(root, selector, value) {
  const el = root.querySelector(selector);
  if (el) el.textContent = value;
}

function setTourProgress(root, state) {
  const progress = root.querySelector('#tourProgress');
  if (progress) progress.style.width = `${state.total ? ((state.index + 1) / state.total) * 100 : 0}%`;
}

function setTourControls(root, state, reduced) {
  const play = root.querySelector('#tourPlay');
  const label = reduced ? '▶ Bắt đầu' : (state.playing ? 'Ⅱ Tạm dừng' : '▶ Tiếp tục');
  if (play) { play.textContent = label; play.setAttribute('aria-label', label); }
  setTourText(root, '#tourStatus', reduced ? 'Chế độ giảm chuyển động · điều khiển bằng tay' : (state.playing ? 'Đang trình bày tự động' : 'Đã tạm dừng'));
}

function updateTourText(state, root, reduced) {
  if (!state || root.hidden) return;
  const current = state.current || {};
  setTourText(root, '#tourTitle', current.title || 'Chưa có nội dung');
  setTourText(root, '#tourMeta', current.meta || '');
  setTourText(root, '#tourText', current.text || '');
  setTourText(root, '#tourIndex', `${String(Math.max(0, state.index) + 1).padStart(2, '0')} / ${String(state.total).padStart(2, '0')}`);
  setTourProgress(root, state);
  setTourControls(root, state, reduced);
}

export function createTourUI({ tour, reduced = false }) {
  const root = document.querySelector('#tour');
  if (!root) return { sync() {} };
  const hide = () => { root.hidden = true; };
  const show = (state) => { root.hidden = false; updateTourText(state, root, reduced); };
  root.querySelector('#tourPlay')?.addEventListener('click', () => tour.toggle());
  root.querySelector('#tourPrev')?.addEventListener('click', () => tour.prev());
  root.querySelector('#tourNext')?.addEventListener('click', () => tour.next());
  root.querySelector('#tourFinish')?.addEventListener('click', () => { tour.stop(); hide(); document.querySelector('#btnTour')?.setAttribute('aria-expanded', 'false'); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !root.hidden) { tour.stop(); hide(); document.querySelector('#btnTour')?.setAttribute('aria-expanded', 'false'); } });
  return { sync: show, hide };
}
