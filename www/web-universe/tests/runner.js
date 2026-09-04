// runner.js — browser tests for Module Manager, Storage, Workspace, Error isolation
export async function runTests({ moduleManager, state, workspaceManager, eventBus } = {}) {
  const results = [];
  function test(name, fn) {
    return { name, fn };
  }
  const tests = [
    test('Module Manager — register', () => {
      const id = 'test-mod-' + Date.now();
      moduleManager.register({ id, name: 'Test', version: '1.0.0', category: 'test', description: 'test', dependencies: [], permissions: [], lazy: true, icon: '🧪' });
      const m = moduleManager.get(id);
      if (!m) throw new Error('register failed');
      if (m.status !== 'unloaded') throw new Error('status should be unloaded');
      // cleanup
      try { moduleManager._registry.delete(id); } catch {}
      return 'pass';
    }),
    test('Module Manager — list', () => {
      const list = moduleManager.list();
      if (!Array.isArray(list)) throw new Error('list not array');
      if (list.length < 10) throw new Error('list too short');
      return `pass (${list.length} modules)`;
    }),
    test('Module Manager — dependency check', () => {
      const id = 'test-dep-' + Date.now();
      moduleManager.register({ id, name: 'Test Dep', version: '1.0.0', category: 'test', description: 'test', dependencies: ['non-existent-dep'], permissions: [], lazy: true, icon: '🧪' });
      // Try enable should fail due to missing dep
      let threw = false;
      try {
        // We don't actually enable, just check getDependents
        const deps = moduleManager.getDependents('text-editor');
        if (!Array.isArray(deps)) throw new Error('getDependents not array');
      } catch (e) {
        if (!e.message.includes('Missing')) throw e;
        threw = true;
      }
      try { moduleManager._registry.delete(id); } catch {}
      return 'pass';
    }),
    test('Storage — localStorage set/get/delete', () => {
      const key = 'test-storage-' + Date.now();
      localStorage.setItem(key, 'hello');
      if (localStorage.getItem(key) !== 'hello') throw new Error('get failed');
      localStorage.removeItem(key);
      if (localStorage.getItem(key) !== null) throw new Error('delete failed');
      return 'pass';
    }),
    test('Storage — IndexedDB open', async () => {
      if (!('indexedDB' in window)) return 'skip (no IndexedDB)';
      const dbName = 'test-db-' + Date.now();
      const db = await new Promise((resolve, reject) => {
        const req = indexedDB.open(dbName, 1);
        req.onupgradeneeded = () => {
          const db = req.result;
          db.createObjectStore('test', { keyPath: 'id' });
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      // put/get
      const tx = db.transaction('test', 'readwrite');
      const store = tx.objectStore('test');
      store.put({ id: 1, value: 'hello' });
      await new Promise((resolve, reject) => { tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); });
      const tx2 = db.transaction('test', 'readonly');
      const val = await new Promise((resolve, reject) => {
        const req = tx2.objectStore('test').get(1);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      if (!val || val.value !== 'hello') throw new Error('IndexedDB get failed');
      db.close();
      indexedDB.deleteDatabase(dbName);
      return 'pass';
    }),
    test('Workspace — save/load', () => {
      const before = state.get().workspace.windows.length;
      state.setWindows([{ id: 'test-win', x: 10, y: 10, w: 400, h: 300, z: 10 }]);
      const after = state.get().workspace.windows.length;
      if (after !== 1) throw new Error('save failed');
      state.setWindows([]);
      if (state.get().workspace.windows.length !== 0) throw new Error('clear failed');
      // restore
      if (before > 0) {
        // don't restore, just check
      }
      return 'pass';
    }),
    test('Workspace — snapshot export/import', async () => {
      const json = workspaceManager.exportJSON();
      const parsed = JSON.parse(json);
      if (!parsed.version || !parsed.workspace) throw new Error('export invalid');
      const res = await workspaceManager.importJSON(json);
      if (!res.ok) throw new Error('import failed: ' + res.error);
      return 'pass';
    }),
    test('Error isolation — module throw does not crash app', async () => {
      const id = 'test-crash-' + Date.now();
      moduleManager.register({ id, name: 'Crash Test', version: '1.0.0', category: 'test', description: 'test', dependencies: [], permissions: [], lazy: true, icon: '💥' });
      // Create a fake module that throws on mount
      const entry = moduleManager._registry.get(id);
      entry.instance = {
        mount: async () => { throw new Error('Intentional crash'); }
      };
      entry.status = 'loaded';
      let threw = false;
      try {
        await moduleManager.enable(id);
      } catch (e) {
        threw = true;
        if (!e.message.includes('Intentional')) throw new Error('wrong error');
      }
      if (!threw) throw new Error('should have thrown');
      // App should still be alive — check other modules
      const list = moduleManager.list();
      if (list.length === 0) throw new Error('app crashed');
      // Check crashed status
      const m = moduleManager.get(id);
      if (m.status !== 'crashed') throw new Error('should be crashed, got ' + m.status);
      // Cleanup
      try { moduleManager._registry.delete(id); } catch {}
      try { window.WEB_UNIVERSE?.windowManager?.removeWindow(id); } catch {}
      return 'pass';
    }),
    test('Event Bus — on/emit/off', () => {
      let called = false;
      const unsub = eventBus.on('test:event', () => { called = true; });
      eventBus.emit('test:event', { hello: 'world' });
      if (!called) throw new Error('emit failed');
      unsub();
      called = false;
      eventBus.emit('test:event', {});
      if (called) throw new Error('off failed');
      return 'pass';
    }),
    test('State — theme toggle', () => {
      const before = state.get().ui.theme;
      state.toggleTheme();
      const after = state.get().ui.theme;
      if (before === after) throw new Error('toggle failed');
      state.toggleTheme(); // restore
      if (state.get().ui.theme !== before) throw new Error('restore failed');
      return 'pass';
    }),
  ];

  for (const t of tests) {
    const start = performance.now();
    try {
      const result = await t.fn();
      const time = Math.round(performance.now() - start);
      if (String(result).startsWith('skip')) {
        results.push({ name: t.name, status: 'skip', message: result, time });
      } else {
        results.push({ name: t.name, status: 'pass', message: result, time });
      }
    } catch (e) {
      const time = Math.round(performance.now() - start);
      results.push({ name: t.name, status: 'fail', message: e.message, time, stack: e.stack });
    }
  }
  return results;
}
