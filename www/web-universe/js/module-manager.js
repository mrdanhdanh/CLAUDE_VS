// module-manager.js — lifecycle + dynamic import + deps + error isolation
const STATUS = {
  UNLOADED: 'unloaded',
  REGISTERED: 'registered',
  LOADED: 'loaded',
  ACTIVE: 'active',
  PAUSED: 'paused',
  SLEEPING: 'sleeping',
  CRASHED: 'crashed',
};

export function createModuleManager({ state, eventBus, logger, windowManager } = {}) {
  const registry = new Map(); // id -> { meta, status, instance, error, container }
  let zCounter = 10;

  function register(meta) {
    if (!meta || !meta.id) throw new Error('register: meta.id required');
    if (registry.has(meta.id)) {
      logger?.warn(`module: ${meta.id} already registered`);
      return registry.get(meta.id);
    }
    const entry = {
      meta: {
        version: '1.0.0',
        category: 'general',
        description: '',
        dependencies: [],
        permissions: [],
        lazy: true,
        ...meta,
      },
      status: STATUS.UNLOADED,
      instance: null,
      error: null,
      container: null,
    };
    registry.set(meta.id, entry);
    state?.setModuleStatus(meta.id, STATUS.UNLOADED);
    eventBus?.emit('module:registered', { id: meta.id, meta: entry.meta });
    logger?.info(`module: registered ${meta.id}`, meta);
    return entry;
  }

  async function load(id) {
    const entry = registry.get(id);
    if (!entry) throw new Error(`module not found: ${id}`);
    if (entry.status === STATUS.LOADED || entry.status === STATUS.ACTIVE || entry.status === STATUS.PAUSED || entry.status === STATUS.SLEEPING) {
      return entry;
    }
    if (entry.status === STATUS.CRASHED) {
      // allow reload after crash
      entry.error = null;
    }
    try {
      logger?.info(`module: loading ${id}…`);
      // Dynamic import — lazy-load proof (Network tab)
      const mod = await import(`./modules/${id}/index.js`);
      entry.instance = mod;
      // Validate manifest if present
      if (mod.manifest && mod.manifest.id && mod.manifest.id !== id) {
        logger?.warn(`module ${id}: manifest.id mismatch ${mod.manifest.id}`);
      }
      if (typeof mod.load === 'function') {
        await mod.load();
      }
      entry.status = STATUS.LOADED;
      state?.setModuleStatus(id, STATUS.LOADED);
      eventBus?.emit('module:loaded', { id });
      logger?.info(`module: loaded ${id}`);
      return entry;
    } catch (e) {
      entry.status = STATUS.CRASHED;
      entry.error = e;
      state?.setModuleStatus(id, STATUS.CRASHED, e);
      eventBus?.emit('module:crashed', { id, error: e });
      logger?.error(`module: load failed ${id}`, e.message);
      throw e;
    }
  }

  async function enable(id) {
    const entry = registry.get(id);
    if (!entry) throw new Error(`module not found: ${id}`);
    if (entry.status === STATUS.ACTIVE) {
      // bring to front
      windowManager?.focus(id);
      return entry;
    }
    // Dependency check — auto-enable deps first
    const deps = entry.meta.dependencies || [];
    for (const depId of deps) {
      const dep = registry.get(depId);
      if (!dep) {
        const err = new Error(`Missing dependency: ${depId} required by ${id}`);
        logger?.warn(err.message);
        throw err;
      }
      if (dep.status !== STATUS.ACTIVE) {
        logger?.info(`module: auto-enabling dependency ${depId} for ${id}`);
        await enable(depId);
      }
    }

    // Load if needed
    if (!entry.instance || entry.status === STATUS.UNLOADED || entry.status === STATUS.CRASHED) {
      await load(id);
    }

    // Create window container
    const container = windowManager ? windowManager.createWindow(id, entry.meta) : document.createElement('div');
    entry.container = container;

    // Mount with error isolation
    try {
      const ctx = { eventBus, state, logger, windowManager, id, meta: entry.meta };
      if (typeof entry.instance.mount === 'function') {
        await entry.instance.mount(container, ctx);
      } else {
        container.innerHTML = `<div class="muted small">Module <b>${id}</b> has no mount() — stub.</div>`;
      }
      entry.status = STATUS.ACTIVE;
      state?.setModuleStatus(id, STATUS.ACTIVE);
      eventBus?.emit('module:enabled', { id });
      logger?.info(`module: enabled ${id}`);
      // Persist workspace windows
      windowManager?.persistWindows();
      return entry;
    } catch (e) {
      entry.status = STATUS.CRASHED;
      entry.error = e;
      state?.setModuleStatus(id, STATUS.CRASHED, e);
      eventBus?.emit('module:crashed', { id, error: e });
      logger?.error(`module: mount crashed ${id}`, e.message);
      // Render error boundary in window
      if (container && windowManager) {
        windowManager.showError(id, e);
      }
      throw e;
    }
  }

  async function disable(id) {
    const entry = registry.get(id);
    if (!entry) throw new Error(`module not found: ${id}`);
    // Check dependents — warn if others depend on this
    const dependents = [...registry.values()].filter(e => (e.meta.dependencies || []).includes(id) && e.status === STATUS.ACTIVE);
    if (dependents.length > 0) {
      const names = dependents.map(d => d.meta.name || d.meta.id).join(', ');
      const err = new Error(`Cannot disable ${id} — required by: ${names}`);
      err.dependents = dependents.map(d => d.meta.id);
      throw err;
    }

    try {
      if (entry.instance) {
        if (typeof entry.instance.pause === 'function' && entry.status === STATUS.ACTIVE) {
          try { await entry.instance.pause(); } catch (e) { logger?.warn(`pause failed ${id}`, e.message); }
        }
        if (typeof entry.instance.unmount === 'function') {
          try { await entry.instance.unmount(); } catch (e) { logger?.warn(`unmount failed ${id}`, e.message); }
        }
      }
    } finally {
      windowManager?.removeWindow(id);
      entry.status = STATUS.UNLOADED;
      entry.error = null;
      entry.container = null;
      // Keep instance for fast re-enable? Clear to force reload next time if needed
      // Keep instance but mark unloaded — next enable will reuse if still loaded
      state?.setModuleStatus(id, STATUS.UNLOADED);
      eventBus?.emit('module:disabled', { id });
      logger?.info(`module: disabled ${id}`);
      windowManager?.persistWindows();
    }
    return entry;
  }

  async function pause(id) {
    const entry = registry.get(id);
    if (!entry) throw new Error(`module not found: ${id}`);
    if (entry.status !== STATUS.ACTIVE) return entry;
    try {
      if (typeof entry.instance?.pause === 'function') await entry.instance.pause();
      entry.status = STATUS.PAUSED;
      state?.setModuleStatus(id, STATUS.PAUSED);
      eventBus?.emit('module:paused', { id });
      logger?.info(`module: paused ${id}`);
      windowManager?.setWindowState(id, 'paused');
    } catch (e) {
      entry.status = STATUS.CRASHED;
      entry.error = e;
      state?.setModuleStatus(id, STATUS.CRASHED, e);
      logger?.error(`pause crashed ${id}`, e.message);
      throw e;
    }
    return entry;
  }

  async function resume(id) {
    const entry = registry.get(id);
    if (!entry) throw new Error(`module not found: ${id}`);
    if (entry.status !== STATUS.PAUSED && entry.status !== STATUS.SLEEPING) return entry;
    try {
      if (typeof entry.instance?.resume === 'function') await entry.instance.resume();
      entry.status = STATUS.ACTIVE;
      state?.setModuleStatus(id, STATUS.ACTIVE);
      eventBus?.emit('module:resumed', { id });
      logger?.info(`module: resumed ${id}`);
      windowManager?.setWindowState(id, 'active');
    } catch (e) {
      entry.status = STATUS.CRASHED;
      entry.error = e;
      state?.setModuleStatus(id, STATUS.CRASHED, e);
      logger?.error(`resume crashed ${id}`, e.message);
      throw e;
    }
    return entry;
  }

  async function sleep(id) {
    const entry = registry.get(id);
    if (!entry) throw new Error(`module not found: ${id}`);
    if (entry.status !== STATUS.ACTIVE && entry.status !== STATUS.PAUSED) return entry;
    try {
      if (typeof entry.instance?.pause === 'function') await entry.instance.pause();
      entry.status = STATUS.SLEEPING;
      state?.setModuleStatus(id, STATUS.SLEEPING);
      eventBus?.emit('module:sleep', { id });
      logger?.info(`module: sleeping ${id}`);
      windowManager?.setWindowState(id, 'sleeping');
    } catch (e) {
      logger?.warn(`sleep failed ${id}`, e.message);
    }
    return entry;
  }

  async function unload(id) {
    const entry = registry.get(id);
    if (!entry) throw new Error(`module not found: ${id}`);
    try {
      if (entry.instance?.destroy) await entry.instance.destroy();
      if (entry.instance?.unmount) await entry.instance.unmount();
    } catch (e) { logger?.warn(`unload destroy failed ${id}`, e.message); }
    windowManager?.removeWindow(id);
    entry.instance = null;
    entry.status = STATUS.UNLOADED;
    entry.error = null;
    entry.container = null;
    state?.setModuleStatus(id, STATUS.UNLOADED);
    eventBus?.emit('module:unloaded', { id });
    logger?.info(`module: unloaded ${id}`);
    return entry;
  }

  async function restart(id) {
    const entry = registry.get(id);
    if (!entry) throw new Error(`module not found: ${id}`);
    try { await disable(id); } catch (e) { if (!e.dependents) throw e; /* if dependents, force? */ }
    // Small delay to ensure cleanup
    await new Promise(r => setTimeout(r, 50));
    return enable(id);
  }

  function get(id) {
    const e = registry.get(id);
    if (!e) return null;
    return { id: e.meta.id, status: e.status, meta: e.meta, error: e.error, hasInstance: !!e.instance };
  }

  function list() {
    return [...registry.values()].map(e => ({
      id: e.meta.id,
      status: e.status,
      meta: e.meta,
      error: e.error,
      hasInstance: !!e.instance,
    }));
  }

  function getDependents(id) {
    return [...registry.values()].filter(e => (e.meta.dependencies || []).includes(id)).map(e => e.meta.id);
  }

  function getActiveDependents(id) {
    return [...registry.values()].filter(e => (e.meta.dependencies || []).includes(id) && e.status === STATUS.ACTIVE).map(e => e.meta.id);
  }

  return {
    register, load, enable, disable, pause, resume, sleep, unload, restart, get, list, getDependents, getActiveDependents,
    STATUS,
    _registry: registry,
  };
}
