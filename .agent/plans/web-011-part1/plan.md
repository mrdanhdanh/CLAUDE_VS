# Plan: WEB 011 Part 1 — Core Runtime

> Phased plan cho Core Runtime. Mỗi phase là 1 todo batch, 1 in-progress tại 1 thời điểm, get_errors sau mỗi edit.

## 1. Architecture
- **Stack:** Vanilla HTML + CSS (variables, 4/8 spacing) + JS ES Modules (no framework)
- **Pattern:** App Runtime DI → Module Manager (state machine) → Window Manager (DOM) → Shell UI
- **State:** `state.js` pub/sub + localStorage `web-universe:workspace-v1` + IndexedDB `web-universe-db`
- **Lazy:** `import(`./modules/${id}/index.js`)` only on enable — Network tab proof
- **Isolation:** try/catch per module mount, error boundary per window

## 2. File Changes

| File | Action | Description |
|------|--------|-------------|
| `www/web-universe/index.html` | Create | Shell: top/sidebar/workspace/status + palette/modal/toast + early theme script |
| `www/web-universe/manifest.webmanifest` | Create | PWA manifest |
| `www/web-universe/sw.js` | Create | Stub SW (install/activate, offline indicator) |
| `www/web-universe/css/base.css` | Create | Reset, variables (dark/light), typography, spacing, radius, shadow |
| `www/web-universe/css/layout.css` | Create | Top bar, sidebar, workspace grid, status bar, responsive 375/768/1280 |
| `www/web-universe/css/windows.css` | Create | Window system: header, drag, resize, min/max, z-index, snap, animations |
| `www/web-universe/css/modules.css` | Create | Catalog cards, palette, toast, modal, context menu, resource panel, logger |
| `www/web-universe/js/event-bus.js` | Create | on/off/once/emit/clear |
| `www/web-universe/js/state.js` | Create | Global/UI/Module/Workspace/Runtime split, persist, subscribe |
| `www/web-universe/js/logger.js` | Create | DEBUG/INFO/WARN/ERROR + devMode + UI panel |
| `www/web-universe/js/permission-manager.js` | Create | Stub: query/request, permission center data |
| `www/web-universe/js/resource-manager.js` | Create | FPS rAF, DOM nodes, workers, timers, canvas, estimate CPU |
| `www/web-universe/js/window-manager.js` | Create | create/drag/resize/min/max/close/focus/snap/persist |
| `www/web-universe/js/workspace-manager.js` | Create | save/load/snapshot export/import/validate (localStorage + IndexedDB) |
| `www/web-universe/js/module-manager.js` | Create | register/load/enable/disable/pause/resume/sleep/unload/restart/get/list + deps + lifecycle |
| `www/web-universe/js/app.js` | Create | App Runtime init order, wiring, shell UI, palette, search, theme, online/offline |
| `www/web-universe/js/modules/text-editor/index.js` | Create | Demo module: editor + counters + autosave + find/replace |
| `www/web-universe/js/modules/canvas-lab/index.js` | Create | Demo module: canvas 2D draw/shapes/gradients/particles |
| `www/web-universe/js/modules/json-tool/index.js` | Create | Demo module: formatter/validator/tree/search/copy path |

## 3. Todos (7 phases)

### Phase 1 — Scaffold + Base
- [ ] Tạo folder `www/web-universe/css` + `js/modules/*`
- [ ] `index.html` shell + early theme script + a11y skip-link
- [ ] `base.css` variables dark/light + reset + typography
- [ ] `manifest.webmanifest` + `sw.js` stub

### Phase 2 — Core Primitives
- [ ] `event-bus.js` + `state.js` + `logger.js` + `permission-manager.js`
- [ ] `resource-manager.js` (FPS, DOM, timers, canvas)
- [ ] `workspace-manager.js` (localStorage + IndexedDB + snapshot validate)

### Phase 3 — Module + Window
- [ ] `module-manager.js` (state machine + dynamic import + deps + lifecycle)
- [ ] `window-manager.js` (drag/resize/min/max/close/z-index/snap/persist)
- [ ] `layout.css` + `windows.css` (shell layout + window system)

### Phase 4 — Shell UI + App Runtime
- [ ] `modules.css` (catalog, palette, toast, modal, context menu)
- [ ] `app.js` wiring: init order, render catalog, enable/disable, palette, search, theme, status bar, notifications, error boundaries
- [ ] 3 demo modules (text-editor, canvas-lab, json-tool) — minimal but functional

### Phase 5 — Polish
- [ ] Responsive 375/768/1280 (sidebar drawer, windows full-screen mobile)
- [ ] States: hover/focus/active/disabled/loading + empty/error/success
- [ ] Animation 150-300ms + prefers-reduced-motion
- [ ] A11y: keyboard nav, focus-visible, aria, dialog trap, contrast ≥4.5:1

### Phase 6 — Verify
- [ ] `get_errors` 0
- [ ] Manual: startup lazy-load (Network), enable/disable cleanup, crash isolation, reload persist, snapshot export/import, Ctrl+K palette, theme persist
- [ ] Update `www/status.json` via generate-status

### Phase 7 — Done
- [ ] Ghi memory + báo cáo

## 4. Risks

| Risk | Mitigation |
|------|------------|
| Dynamic import path wrong | Test with `import(`./modules/${id}/index.js`)` relative to `js/` |
| Drag/resize leak listeners | Cleanup pointermove/up on pointerup, remove on unmount |
| State persist race | Debounce save 300ms, validate on load |
| Module crash kills app | try/catch per mount, error boundary per window |
| FPS loop leak | Cancel rAF on unload, pause when sleeping |
| IndexedDB blocked | Fallback to localStorage only |

## 5. Verification Checklist

- [ ] `get_errors` → 0
- [ ] Open `www/web-universe/index.html` → shell renders (top/sidebar/workspace/status)
- [ ] Catalog shows ≥12 modules (3 real + 9 stub) with status dots
- [ ] Click Enable on text-editor → Network shows `text-editor/index.js` fetched, window appears
- [ ] Drag/resize/min/max/close window works, z-index brings to front
- [ ] Ctrl+K opens palette → type "canvas" → Enter enables canvas-lab
- [ ] Resource monitor updates FPS/DOM/workers/timers
- [ ] Disable module → Resource counts drop, window removed, no leak
- [ ] Throw in module → only that window shows ❌ + Restart/Remove, app still works
- [ ] Reload → workspace restored (modules + positions + theme)
- [ ] Export snapshot → reset → import → restored
- [ ] Theme toggle persists after F5
- [ ] Responsive: 375 drawer, 768 collapsible, 1280 full
- [ ] A11y: Tab nav, Esc closes palette/modal, focus-visible, aria
- [ ] `manifest.webmanifest` valid, SW registers, offline indicator works

---
*Generated by YUNIE — Harness v2 Plan Phase — Part 1 Core Runtime*
