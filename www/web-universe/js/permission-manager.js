// permission-manager.js — stub for Part 1 (real permissions in Part 6)
export function createPermissionManager({ state, eventBus, logger } = {}) {
  const defaults = {
    camera: 'prompt',
    microphone: 'prompt',
    location: 'prompt',
    notifications: 'default',
    clipboard: 'prompt',
    storage: 'granted',
    network: 'granted',
  };
  function getAll() {
    const s = state?.get()?.permissions || {};
    return { ...defaults, ...s };
  }
  function get(name) { return getAll()[name] ?? 'prompt'; }
  async function query(name) {
    // Try real Permissions API if available
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const map = { camera: 'camera', microphone: 'microphone', location: 'geolocation', notifications: 'notifications' };
        const permName = map[name];
        if (permName) {
          const res = await navigator.permissions.query({ name: permName });
          return res.state; // granted/denied/prompt
        }
      }
    } catch (e) { logger?.debug('permission query failed', e.message); }
    return get(name);
  }
  async function request(name) {
    // Stub: just toggle to granted for demo
    const current = get(name);
    const next = current === 'granted' ? 'denied' : 'granted';
    const perms = getAll();
    perms[name] = next;
    state?.setUI({}); // trigger save? actually permissions in state
    try {
      const s = state.get();
      s.permissions = perms;
      state.saveNow();
    } catch {}
    eventBus?.emit('permission:changed', { name, state: next });
    logger?.info(`permission: ${name} -> ${next}`);
    return next;
  }
  function listForUI() {
    const all = getAll();
    return Object.entries(all).map(([name, status]) => ({
      name, status,
      label: name.charAt(0).toUpperCase() + name.slice(1),
      supported: isSupported(name),
    }));
  }
  function isSupported(name) {
    const checks = {
      camera: () => !!navigator.mediaDevices?.getUserMedia,
      microphone: () => !!navigator.mediaDevices?.getUserMedia,
      location: () => 'geolocation' in navigator,
      notifications: () => 'Notification' in window,
      clipboard: () => !!navigator.clipboard,
      storage: () => true,
      network: () => true,
    };
    try { return checks[name] ? checks[name]() : true; } catch { return false; }
  }
  return { get, getAll, query, request, listForUI, isSupported };
}
