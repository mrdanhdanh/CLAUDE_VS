# Design: WEB 011 Part 3 — GRAPHICS LAB

> Design system kế thừa Part 1-2 + wireframe cho 3 modules Graphics.

## 1. Design System (kế thừa)

### Palette / Typography / Spacing
- Dùng `css/base.css` variables: `--bg, --surface, --surface-2, --border, --text, --primary, --success, --danger, --warning`
- Typography: `Inter` (UI) + `JetBrains Mono` (code)
- Spacing 4/8, radius 8/12/16, shadow sm/md/lg

### Module-specific tokens
```css
--svg-bg: #ffffff;
--svg-grid: #e2e8f0;
--svg-select: #6366f1;
--webgl-bg: #0f172a;
--webgpu-ok: #10b981;
--webgpu-warn: #f59e0b;
--webgpu-error: #ef4444;
```

## 2. Wireframe

### SVG Lab — Desktop
```
┌─────────────────────────────────────────────────────────┐
│ Palette: [○] [▭] [⬭] [—] [⬡] [T] [Path]  [Clear] [Export] │
├──────────────────────┬──────────────────────────────────┤
│ Canvas (SVG)         │ Props Panel                      │
│ ┌──────────────────┐ │ Shape: circle                    │
│ │  ○  ▭            │ │ x: 50  y: 50                     │
│ │    ⬡             │ │ r: 30  fill: #6366f1             │
│ │  T Hello         │ │ stroke: #000  width: 2           │
│ └──────────────────┘ │ opacity: 100%  rotate: 0°         │
├──────────────────────┴──────────────────────────────────┤
│ Code: <svg>…</svg>  [Copy]                              │
└─────────────────────────────────────────────────────────┘
```

### WebGL Lab — Desktop
```
┌─────────────────────────────────────────────────────────┐
│ [Triangle] [Texture] [Cube] [Wireframe ☐] [Lighting ☐]  │
├──────────────────────┬──────────────────────────────────┤
│ Canvas (WebGL)       │ Controls                         │
│ ┌──────────────────┐ │ Clear: [#0f172a]                 │
│ │   ▲              │ │ FPS: 60  Vendor: …               │
│ │  / \  (cube)     │ │ Extensions: …                    │
│ │ /___\            │ │ [View Shader]                    │
│ └──────────────────┘ │                                  │
├──────────────────────┴──────────────────────────────────┤
│ Shader source / Capability info                          │
└─────────────────────────────────────────────────────────┘
```

### WebGPU Lab — Desktop
```
┌─────────────────────────────────────────────────────────┐
│ Status: ✓ Supported / ⚠ NOT SUPPORTED                   │
├─────────────────────────────────────────────────────────┤
│ Adapter: …  Device: …  Limits: …                        │
│ [Request Adapter] [Request Device] [Triangle Demo]      │
│ Canvas (if supported)                                    │
└─────────────────────────────────────────────────────────┘
```

### Mobile 375
- SVG: palette wrap, canvas + props stack, code below
- WebGL: controls stack, canvas full-width
- WebGPU: single column, status prominent

## 3. Component Inventory

| Component | States | Notes |
|-----------|--------|-------|
| SVG palette | default/active | shape buttons, active primary |
| SVG canvas | default/selected/dragging | SVG element, grid bg, select ring |
| Props panel | default/empty | inputs for x/y/fill/stroke/etc, live update |
| WebGL canvas | default/loading/error | WebGL context, fallback message |
| WebGL controls | default | demo selector, toggles, color picker |
| WebGL info | — | vendor/renderer/version/extensions |
| WebGPU status | supported/not-supported | big badge, icon, message |
| WebGPU info | — | adapter/device/limits table |

## 4. Architecture

### SVG Lab
- SVG via `createElementNS('http://www.w3.org/2000/svg', tag)`
- State: `shapes: [{id, type, props}]` — persist localStorage
- Render: clear SVG → create elements → append
- Select: click shape → set selectedId → highlight + props panel
- Drag: pointerdown on shape → pointermove → update x/y → re-render
- Transform: rotate via `transform="rotate(angle cx cy)"`
- Export: `new XMLSerializer().serializeToString(svgEl)` → Blob → download

### WebGL Lab
- Vanilla WebGL: `canvas.getContext('webgl')` or `webgl2`
- Shaders: vertex + fragment (minimal)
- Buffers: position, color, texCoord, indices
- Matrix: minimal mat4 (perspective, translate, rotate)
- Demos: triangle (2D), textured quad, rotating cube (3D with depth test)
- Lighting: simple directional (toggle)
- Camera: orbit via mouse drag (rotate Y/X)
- Capability: `gl.getParameter(VENDOR/RENDERER/VERSION)`, `gl.getSupportedExtensions()`
- Context lost: `canvas.addEventListener('webglcontextlost', e=>e.preventDefault())`

### WebGPU Lab
- Detection: `if (!navigator.gpu) → NOT SUPPORTED`
- Adapter: `await navigator.gpu.requestAdapter()` → `adapter.requestAdapterInfo()` or `adapter.info`
- Device: `await adapter.requestDevice()` → `device.limits`, `device.features`
- Demo: basic triangle via GPURenderPipeline if supported (optional, fallback to message)
- No fake data — if not supported, show NOT SUPPORTED clearly

## 5. UX States

| View | Loading | Empty | Error | Success |
|------|---------|-------|-------|---------|
| SVG canvas | — | "Add a shape" | — | shapes rendered |
| SVG props | — | "Select a shape" | — | props form |
| WebGL canvas | "Loading…" | — | "WebGL not supported" | rendered |
| WebGPU status | "Checking…" | — | "NOT SUPPORTED" | adapter/device info |

## 6. Animation
- SVG drag: immediate (no transition)
- WebGL cube: rAF 60fps, pause on unmount
- Respect `prefers-reduced-motion`

## 7. A11y
- Palette buttons: `aria-label`, keyboard
- Canvas: `role="img" aria-label`
- Props: `aria-label` per input
- WebGL/WebGPU info: semantic table

## 8. File Map (Part 3)
```
www/web-universe/js/modules/svg-lab/index.js
www/web-universe/js/modules/webgl-lab/index.js
www/web-universe/js/modules/webgpu/index.js
www/web-universe/css/modules.css (append)
```

---
*Generated by YUNIE — Harness v2 Design Phase — Part 3 Graphics Lab*
