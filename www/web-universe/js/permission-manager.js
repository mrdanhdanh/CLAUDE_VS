// permission-manager.js — real permissions (Part 8)
// request() gọi API thật: getUserMedia / geolocation / Notification — không còn toggle giả.
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
    // Real permission requests (Part 8) — gọi API trình duyệt thật
    let next = 'denied';
    try {
      if (name === 'notifications' && 'Notification' in window) {
        next = await Notification.requestPermission(); // 'granted' | 'denied' | 'default'
      } else if ((name === 'camera' || name === 'microphone') && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia(
          name === 'camera' ? { video: true } : { audio: true }
        );
        stream.getTracks().forEach((t) => t.stop()); // test xong nhả ngay, không giữ thiết bị
        next = 'granted';
      } else if (name === 'location' && 'geolocation' in navigator) {
        await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
        });
        next = 'granted';
      } else if (name === 'clipboard' && navigator.clipboard) {
        // Clipboard-write không có prompt riêng — test ghi thật (cần user gesture, đã có qua click)
        await navigator.clipboard.writeText('WEB UNIVERSE permission test');
        next = 'granted';
      } else if (!isSupported(name)) {
        next = 'denied';
      } else {
        // storage/network: không có prompt chuẩn — coi như granted khi khả dụng
        next = 'granted';
      }
    } catch (e) {
      const denied = e && (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError' || e.code === 1);
      next = denied ? 'denied' : 'prompt';
      logger?.warn(`permission request ${name} failed:`, e?.message || e);
    }

    const perms = getAll();
    perms[name] = next;
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
