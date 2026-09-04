// event-bus.js — pub/sub with cleanup
export function createEventBus() {
  const map = new Map(); // event -> Set<handler>
  function on(event, handler) {
    if (!map.has(event)) map.set(event, new Set());
    map.get(event).add(handler);
    return () => off(event, handler);
  }
  function once(event, handler) {
    const wrap = (payload) => {
      off(event, wrap);
      handler(payload);
    };
    return on(event, wrap);
  }
  function off(event, handler) {
    const set = map.get(event);
    if (set) {
      set.delete(handler);
      if (set.size === 0) map.delete(event);
    }
  }
  function emit(event, payload) {
    const set = map.get(event);
    if (!set) return;
    // copy to avoid mutation during emit
    for (const h of [...set]) {
      try { h(payload); } catch (e) { console.error('[event-bus]', event, e); }
    }
  }
  function clear() { map.clear(); }
  function count(event) { return map.get(event)?.size ?? 0; }
  return { on, once, off, emit, clear, count };
}
