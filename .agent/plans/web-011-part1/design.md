# Design: WEB 011 Part 1 — Core Runtime

> Design system + wireframe + architecture cho Core Runtime. Shell mang cảm giác Modern Developer OS / Browser Desktop.

## 1. Design System

### Palette (CSS variables — Dark default + Light override)
| Token | Dark | Light | Usage |
|-------|------|-------|-------|
| `--bg` | `#0b0f1a` | `#f8fafc` | Page bg |
| `--surface` | `#111827` | `#ffffff` | Card/window |
| `--surface-2` | `#1f2937` | `#f1f5f9` | Sidebar, topbar |
| `--border` | `#1f2a3a` | `#e2e8f0` | Border |
| `--text` | `#e5e7eb` | `#0f172a` | Primary text |
| `--text-2` | `#9ca3af` | `#64748b` | Secondary |
| `--text-3` | `#6b7280` | `#94a3b8` | Hint |
| `--primary` | `#6366f1` | `#6366f1` | CTA, active |
| `--primary-hover` | `#4f46e5` | `#4f46e5` | Hover |
| `--success` | `#10b981` | `#10b981` | Online, active |
| `--warning` | `#f59e0b` | `#f59e0b` | Sleeping, warn |
| `--danger` | `#ef4444` | `#ef4444` | Error, crash |
| `--accent-cyan` | `#06b6d4` | `#06b6d4` | FPS, accent |
| `--accent-violet` | `#8b5cf6` | `#8b5cf6` | Module icon |

### Typography
- **Sans:** `Inter` / system-ui — body, UI (400/500/600/700)
- **Display:** `Plus Jakarta Sans` — hero, window title (700/800)
- **Mono:** `JetBrains Mono` — code, logger, resource numbers
- Scale: `xs 12 / sm 13 / base 14 / md 16 / lg 18 / xl 20 / 2xl 24 / 3xl 30`

### Spacing / Radius / Shadow
```css
:root {
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px;
  --space-5: 20px; --space-6: 24px; --space-8: 32px; --space-10: 40px;
  --radius-sm: 8px; --radius-md: 12px; --radius-lg: 16px; --radius-xl: 20px; --radius-full: 9999px;
  --shadow-sm: 0 1px 2px rgba(0,0,0,.06);
  --shadow-md: 0 4px 12px rgba(0,0,0,.10);
  --shadow-lg: 0 8px 24px rgba(0,0,0,.16);
  --shadow-window: 0 12px 40px rgba(0,0,0,.25);
}
```

### Theme Engine
- `data-theme="dark|light"` on `<html>` — early script in `<head>` reads `localStorage: web-universe:theme` + `prefers-color-scheme` → apply before paint (chống flash, KN-006).
- Toggle button in Top bar → `state.setTheme()` → persist + `document.documentElement.dataset.theme`.

## 2. Layout — Wireframe

### Desktop 1280px
```
┌────────────────────────────────────────────────────────────────────┐
│ 🌐 WEB UNIVERSE  🔍 Search (Ctrl+K)   CPU ~31%  FPS 60  RAM ~420MB  ⚙ │
├──────────────┬─────────────────────────────────────────────────────┤
│              │                                                     │
│ 🏠 Home      │                WORKSPACE (grid)                     │
│ 📦 Modules   │  ┌──────────────┐  ┌──────────────┐                │
│ ⭐ Favorites │  │ Text Editor  │  │ Canvas Lab   │                │
│ 🧪 Labs      │  │  [window]    │  │  [window]    │                │
│ 🎨 Graphics  │  └──────────────┘  └──────────────┘                │
│ 🎵 Media     │                                                     │
│ 🌐 Network   │  ┌──────────────┐  ┌──────────────┐                │
│ 💾 Storage   │  │ JSON Tool    │  │ Catalog      │                │
│ ⚡ Perf      │  │  [window]    │  │  [list]      │                │
│ ⚙ Settings   │  └──────────────┘  └──────────────┘                │
├──────────────┴─────────────────────────────────────────────────────┤
│ Modules: 3 active │ 3 loaded │ Workers: 0 │ FPS: 60 │ ● Online    │
└────────────────────────────────────────────────────────────────────┘
```

### Tablet 768px
```
[Sidebar 260px collapsible] [Workspace flex-1, windows 1-col]
Top bar: search collapsed to icon, metrics hidden except FPS
Status bar: 2 rows
```

### Mobile 375px
```
[Top bar: hamburger + logo + search icon + theme toggle]
[Drawer overlay for sidebar]
[Workspace: windows full-screen, stacked, no drag — tap to focus]
[Status bar: compact, 2 cols]
[Command palette: full-screen sheet]
```

## 3. Component Inventory

| Component | States | Notes |
|-----------|--------|-------|
| Top bar | default | Logo, search trigger, metrics (CPU/FPS/RAM estimate), theme toggle, settings |
| Sidebar | default/collapsed/drawer | Nav groups, active indicator, badge count, collapse button |
| Window/Card | default/focused/minimized/maximized/dragging/resizing | Header drag handle, controls (min/max/close), z-index, snap, shadow |
| Module catalog card | unloaded/loaded/active/sleeping/crashed | Icon, name, version, category, status dot, Enable/Disable/Pause buttons |
| Command palette | closed/open | Overlay, input, list, keyboard nav (↑↓/Enter/Esc), shortcut hints |
| Search | idle/focused/results | Debounced, filters catalog |
| Status bar | default | Active/loaded/workers/FPS/online, live update |
| Resource monitor | default/warn | CPU bar, FPS, DOM nodes, workers, timers, canvas — estimate label |
| Notification toast | info/success/warn/error | Auto-dismiss 3s, stack, aria-live |
| Modal/Dialog | closed/open | ESC + click outside + focus trap + aria-modal (KN-001) |
| Context menu | closed/open | Right-click on window/module, keyboard accessible |
| Button primary | default/hover/focus/active/disabled/loading | 150-300ms, translateY(-1px) + shadow on hover |
| Button ghost | default/hover/focus | For toolbar |
| Badge | default | Category, version |
| Empty state | — | Icon + message + CTA |
| Error boundary | — | ❌ Module crashed + Restart/Remove + stack (dev mode) |
| Logger panel | — | Level filter, clear, copy |

## 4. Architecture — Core Runtime

```
                    WEB UNIVERSE
                         │
                 ┌───────┴───────┐
                 │  App Runtime  │  js/app.js — init order, DI container
                 └───────┬───────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
  Module Manager   Event Bus        State Manager
  (lifecycle)      (pub/sub)        (global/ui/module/workspace)
        │                │                │
  Resource Mgr    Window Mgr      Workspace Mgr
  (FPS/DOM/etc)   (drag/resize)   (persist/snapshot)
        │                │                │
  Permission Mgr  Error Mgr         Logger
  (stub P1)       (isolation)       (levels)
        │                │                │
        └────────────────┼────────────────┘
                         │
                    Shell UI
              (Top/Sidebar/Workspace/Status)
                         │
                    Modules (lazy)
              text-editor / canvas-lab / json-tool
```

### Module Manager — API
```js
register(meta)            // {id, name, version, category, description, dependencies, permissions, lazy}
load(id)                  // dynamic import() → {manifest, hooks}
enable(id)                // load → mount(container) → ACTIVE
disable(id)               // pause → unmount → SLEEP/UNLOADED + cleanup
pause(id) / resume(id) / sleep(id) / unload(id) / restart(id)
get(id) / list()          // {id, status, meta, instance}
```

### Lifecycle — State Machine
```
UNLOADED → (register) → REGISTERED → (load) → LOADED → (mount) → ACTIVE
ACTIVE ↔ PAUSE ↔ SLEEPING → (unmount) → LOADED → (destroy) → UNLOADED
Any → CRASHED → (restart) → LOADED
```

### Module Contract (ESM)
```js
// js/modules/<id>/index.js
export const manifest = { id, name, version, category, description, dependencies, permissions, lazy };
export async function load() {}      // optional: preload
export async function mount(container, ctx) {} // ctx: {eventBus, state, logger, permissions}
export async function pause() {}
export async function resume() {}
export async function unmount() {}  // cleanup timers/listeners/workers
export async function destroy() {}
```

### Event Bus
```js
on(event, handler) → unsubscribe
once(event, handler)
off(event, handler)
emit(event, payload)
clear() // on destroy
// events: module:registered/enabled/disabled/paused/resumed/crashed, workspace:saved/restored, theme:changed, window:focused/closed
```

### State Shape
```js
{
  ui: { theme: 'dark|light', sidebarCollapsed: bool, commandOpen: bool, devMode: bool },
  modules: { [id]: { status, meta, error } },
  workspace: { id: 'default', windows: [{id, x, y, w, h, z, minimized, maximized}], layout: 'grid' },
  runtime: { fps, domNodes, workers, timers, online, startedAt },
  permissions: { camera: 'prompt', microphone: 'prompt', ... }
}
Persist: localStorage `web-universe:workspace-v1` (UI + workspace) + IndexedDB `web-universe-db` (snapshots, large state)
```

### Window Manager
- Container: `#workspace` (relative, grid or absolute for windows)
- Window: `.window` (absolute, header drag handle, resize handle SE, controls)
- Drag: pointerdown on header → pointermove → clamp to workspace → persist x/y
- Resize: pointerdown on handle → pointermove → min 320x200 → persist w/h
- Z-index: bringToFront on focus/click → increment global z
- Snap: drag near edge → snap 8px
- Min/Max: minimize → bar at bottom, maximize → fill workspace
- Remember: `workspace.windows` persisted

### Resource Manager
- FPS: rAF loop, count frames per second
- DOM nodes: `document.querySelectorAll('*').length` every 1s
- Workers: count from Module Manager
- Timers: wrap setTimeout/setInterval count (estimate)
- Canvas: `document.querySelectorAll('canvas').length`
- CPU/RAM: **estimate** (telemetry nội bộ, not OS) — label "estimate" (spec §25)
- Update: emit `resource:update` every 1s → Status bar + Resource panel

### Error Isolation
- Every `enable/mount` wrapped in try/catch → on throw → status CRASHED → render error boundary in window → toast
- App shell never crashes — error boundary per window
- Restart: `disable → enable`, Remove: `unload`

## 5. UX States

| View | Loading | Empty | Error | Success |
|------|---------|-------|-------|---------|
| Catalog | skeleton | "No modules" | — | cards |
| Window | spinner | — | ❌ crashed + Restart/Remove | module UI |
| Workspace | — | "No active modules — enable from catalog" | — | windows |
| Resource | — | — | — | live numbers |
| Snapshot | — | "No snapshots" | invalid JSON toast | list + import |

## 6. Animation
- Transition: `150-300ms ease` (transform, opacity, background)
- Window open: `scale(.98) → scale(1)` + `opacity 0→1` 200ms
- Hover: `translateY(-1px)` + shadow
- Command palette: `opacity + translateY(-8px)→0` 200ms
- Toast: slide-in from bottom-right 200ms
- Respect `prefers-reduced-motion` → disable transform animations

## 7. A11y
- Skip-link, semantic header/nav/main/footer, aria-labels
- Keyboard: Tab, Shift+Tab, Enter, Esc, Ctrl+K, Arrow nav in palette
- Focus-visible ring (`:focus-visible`), contrast ≥4.5:1 (both themes)
- Dialog: `role="dialog" aria-modal="true"` + focus trap + ESC

## 8. File Map (Part 1)
```
www/web-universe/
├── index.html
├── manifest.webmanifest
├── sw.js (stub)
├── css/
│   ├── base.css      (reset, variables, themes)
│   ├── layout.css    (top/sidebar/workspace/status)
│   ├── windows.css   (window system)
│   └── modules.css   (catalog, palette, toast, modal)
├── js/
│   ├── app.js
│   ├── event-bus.js
│   ├── state.js
│   ├── module-manager.js
│   ├── window-manager.js
│   ├── resource-manager.js
│   ├── workspace-manager.js
│   ├── logger.js
│   ├── permission-manager.js
│   └── modules/
│       ├── text-editor/index.js + manifest.js
│       ├── canvas-lab/index.js + manifest.js
│       └── json-tool/index.js + manifest.js
```

---
*Generated by YUNIE — Harness v2 Design Phase — Part 1 Core Runtime*
