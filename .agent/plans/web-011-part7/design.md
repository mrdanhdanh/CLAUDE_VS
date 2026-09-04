# Design: WEB 011 Part 7 — ULTIMATE POLISH

> Design system kế thừa Part 1-6 + wireframe cho 6 labs ULTIMATE.

## 1. Design System (kế thừa)

### Palette / Typography / Spacing
- Dùng `css/base.css` variables: `--bg, --surface, --surface-2, --border, --text, --primary, --success, --danger, --warning`
- Typography: `Inter` + `JetBrains Mono`
- Spacing 4/8, radius 8/12/16

### Module-specific tokens
```css
--dep-node: #6366f1;
--dep-edge: #94a3b8;
--dep-highlight: #f59e0b;
--sleep-idle: #64748b;
--sleep-active: #10b981;
--plugin-ok: #10b981;
--theme-preview: #f8fafc;
--bench-bar: #6366f1;
--sandbox-ok: #10b981;
--debug-bg: #0f172a;
```

## 2. Wireframe

### Dependency Graph — Desktop
```
┌─────────────────────────────────────────────────────────┐
│ [Graph SVG]  Nodes: circles, Edges: lines               │
│  A → B → C  (hover highlight)                           │
│ Selected: B — Depends on: A — Required by: C            │
│ [Disable] [Highlight]                                   │
└─────────────────────────────────────────────────────────┘
```

### Plugin Lab — Desktop
```
┌─────────────────────────────────────────────────────────┐
│ Paste manifest JSON: {id, name, version, deps}          │
│ [Validate] [Register] [Enable]                          │
│ Registered plugins list + Example plugins               │
└─────────────────────────────────────────────────────────┘
```

### Theme Lab — Desktop
```
┌─────────────────────────────────────────────────────────┐
│ Colors: [Primary] [Surface] [Text] [Border]             │
│ Radius: ●──  Spacing: ●──                               │
│ Preview: Card + Button + Input                          │
│ [Export JSON] [Import] [Reset]                          │
└─────────────────────────────────────────────────────────┘
```

### Benchmark Lab — Desktop
```
┌─────────────────────────────────────────────────────────┐
│ Startup: 120ms  Lazy: 18/25 not loaded                  │
│ FPS: 60 (10 modules)  58 (20)  55 (30)                   │
│ [Run Benchmark]  Chart: bars                             │
└─────────────────────────────────────────────────────────┘
```

### Sandbox Lab — Desktop
```
┌─────────────────────────────────────────────────────────┐
│ [No sandbox] [sandbox=""] [allow-scripts] [allow-same]  │
│ iframe preview + postMessage test                       │
│ Permissions table                                        │
└─────────────────────────────────────────────────────────┘
```

### Debug Lab — Desktop
```
┌─────────────────────────────────────────────────────────┐
│ [Lifecycle] [Events] [Workers] [Network] [Storage]      │
│ Log list with filter + clear                            │
│ Resource: FPS/DOM/timers/canvas                         │
└─────────────────────────────────────────────────────────┘
```

### Mobile 375
- All: single column, controls stack, graph scroll

## 3. Component Inventory

| Component | States | Notes |
|-----------|--------|-------|
| Dep graph | default/highlight | SVG nodes/edges, hover, click |
| Dep info | — | selected node details |
| Sleep indicator | active/sleeping | badge, auto timer |
| Plugin form | valid/invalid | JSON textarea, validate, register |
| Plugin list | — | registered plugins |
| Theme pickers | — | color, radius, spacing |
| Theme preview | — | live card/button |
| Benchmark bars | — | startup, lazy, FPS |
| Sandbox iframe | none/sandbox/allow | iframe with sandbox attr |
| Debug log | lifecycle/event | filter, clear |
| Test runner | pass/fail | 4 suites |

## 4. Architecture

### Dependency Graph
- Build graph from CATALOG dependencies
- Render SVG: nodes as circles, edges as lines with arrows
- Simple layout: topological sort + grid
- Highlight: on hover/click, highlight node + edges + dependents/dependencies
- Integrate with disable: already in module-manager

### Sleep System
- Track last interaction per module (focus, click, input)
- SetInterval 5s: check idle >30s → call moduleManager.sleep(id)
- On focus/click → resume if sleeping
- Show badge SLEEPING in catalog

### Plugin Architecture
- Validate manifest: id (string, unique), name, version, dependencies (array), permissions
- Register: moduleManager.register(manifest)
- Create module code via Blob URL: `export const manifest = {...}; export async function mount(c){c.innerHTML='Plugin: '+manifest.name}`
- Enable: moduleManager.enable(id) → dynamic import Blob URL
- Persist: localStorage `web-universe:plugins`

### Theme Engine
- CSS variables: `--primary, --surface, --surface-2, --border, --text, --radius-md, --space-4`
- Pickers update `document.documentElement.style.setProperty`
- Export: JSON of current theme
- Import: parse JSON, apply variables
- Persist: localStorage `web-universe:theme-custom`

### Benchmark Lab
- Startup: `performance.now() - START_TS` (from app.js)
- Lazy: count loaded vs total
- FPS: from resourceManager
- Memory: `performance.memory` if available, else estimate
- Run with N modules: enable N modules, measure FPS

### Sandbox Lab
- Iframes with different sandbox attrs
- postMessage test: parent ↔ iframe
- Show permissions table

### Debug Mode
- Lifecycle: listen to `module:enabled/disabled/paused` events
- Events: log eventBus emits
- Workers: count from resourceManager
- Network: log fetch calls
- Storage: show localStorage keys

### Testing
- Vanilla tests: `www/web-universe/tests/runner.js`
- Suites: Module Manager (register/load/enable/disable), Storage (set/get), Workspace (save/load), Error isolation (throw → app alive)
- Run in browser, show pass/fail

## 5. UX States

| View | Loading | Empty | Error | Success |
|------|---------|-------|-------|---------|
| Dep graph | — | "No deps" | — | graph |
| Plugin | — | "No plugins" | "Invalid manifest" | registered |
| Theme | — | — | "Invalid JSON" | preview |
| Benchmark | "Running…" | — | — | results |
| Sandbox | — | — | — | iframe |
| Debug | — | "No logs" | — | logs |

## 6. Animation
- Graph highlight: 150ms
- Theme preview: 200ms
- Respect `prefers-reduced-motion`

## 7. A11y
- Graph: `role="img" aria-label`, keyboard nav
- Plugin: `aria-label`, validation messages
- Theme: `aria-label` per picker
- Benchmark: `role="progressbar"`

## 8. File Map (Part 7)
```
www/web-universe/js/modules/dependency-graph/index.js
www/web-universe/js/modules/plugin-lab/index.js
www/web-universe/js/modules/theme-lab/index.js
www/web-universe/js/modules/benchmark-lab/index.js
www/web-universe/js/modules/sandbox-lab/index.js
www/web-universe/js/modules/debug-lab/index.js
www/web-universe/tests/runner.js
www/web-universe/css/modules.css (append)
```

---
*Generated by YUNIE — Harness v2 Design Phase — Part 7 ULTIMATE*
