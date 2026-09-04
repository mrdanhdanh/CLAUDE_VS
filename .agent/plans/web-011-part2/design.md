# Design: WEB 011 Part 2 — TEXT UNIVERSE

> Design system kế thừa Part 1 + wireframe cho 3 modules Text.

## 1. Design System (kế thừa Part 1)

### Palette / Typography / Spacing
- Dùng `css/base.css` variables: `--bg, --surface, --surface-2, --border, --text, --primary, --success, --danger, --warning`
- Typography: `Inter` (UI) + `JetBrains Mono` (code/editor)
- Spacing 4/8, radius 8/12/16, shadow sm/md/lg — giữ nguyên

### Module-specific tokens
```css
--editor-bg: var(--surface);
--editor-border: var(--border);
--editor-focus: var(--primary);
--preview-bg: var(--surface);
--diff-added: rgba(16,185,129,.14);
--diff-removed: rgba(239,68,68,.14);
--diff-added-border: rgba(16,185,129,.35);
--diff-removed-border: rgba(239,68,68,.35);
--code-bg: #0f172a; /* dark code area, even in light theme */
--code-text: #e2e8f0;
```

## 2. Wireframe

### Markdown — Desktop 1280
```
┌─────────────────────────────────────────────────────────┐
│ Toolbar: [B] [I] [Link] [Code] [H1] [H2] [Quote] [List] │
├──────────────────────┬──────────────────────────────────┤
│ Editor (textarea)    │ Preview (rendered HTML)          │
│ # Hello              │ # Hello                          │
│ **bold**             │ bold                             │
│ - item               │ • item                           │
│                      │                                  │
├──────────────────────┴──────────────────────────────────┤
│ Outline: [H1 Hello] [H2 Section]  [Export HTML] [Export MD] │
└─────────────────────────────────────────────────────────┘
```

### Code Playground — Desktop
```
┌─────────────────────────────────────────────────────────┐
│ [HTML] [CSS] [JS] tabs  [Run ▶] [Auto-run ☐] [Reset]   │
├──────────────────────┬──────────────────────────────────┤
│ Editor (active tab)  │ Preview (iframe sandbox)         │
│ <h1>Hello</h1>       │ Hello (rendered)                 │
├──────────────────────┴──────────────────────────────────┤
│ Console: > log · error (dark bg, mono)                  │
└─────────────────────────────────────────────────────────┘
```

### Diff — Desktop
```
┌─────────────────────────────────────────────────────────┐
│ [Text] [JSON]  [Swap ⇄] [Clear]  Stats: +3 -2 =10      │
├──────────────────────┬──────────────────────────────────┤
│ Left input           │ Right input                      │
│ line1                │ line1 changed                    │
├──────────────────────┴──────────────────────────────────┤
│ Side-by-side diff (added green, removed red)            │
└─────────────────────────────────────────────────────────┘
```

### Mobile 375
- Markdown: editor trên, preview dưới (stack), toolbar wrap
- Code Playground: tabs full-width, editor + preview stack, console dưới
- Diff: inputs stack, diff stack, stats wrap

## 3. Component Inventory

| Component | States | Notes |
|-----------|--------|-------|
| Markdown toolbar | default/hover/active | Bold/italic/link/code/heading/quote/list — insert at cursor |
| Markdown editor | default/focus | textarea, mono, line-height 1.6, sync scroll |
| Markdown preview | default/empty | rendered HTML, prose style, code block dark |
| Markdown outline | default/active | heading list, click scroll, active highlight |
| Code tabs | default/active | HTML/CSS/JS, active border-bottom primary |
| Code editor | default/focus | textarea, dark bg, mono, tab inserts 2 spaces |
| Preview iframe | default/loading/error | sandbox allow-scripts, srcdoc, border |
| Console | log/warn/error/empty | dark bg, mono, timestamp, clear |
| Diff mode toggle | text/json | segmented control |
| Diff inputs | default/focus | textarea pair |
| Diff view | added/removed/unchanged | line highlight, gutter +/- |
| Diff stats | — | +added -removed =unchanged |

## 4. Architecture

### Markdown
- Parser: minimal regex — headings (`#`), bold (`**`), italic (`*`/`_`), inline code (`` ` ``), code block (```), link (`[text](url)`), list (`-`/`*`/`1.`), blockquote (`>`), hr (`---`), paragraph
- Escape HTML trước khi parse (XSS safe)
- Debounce 200ms on input → render preview
- Outline: extract headings via regex → list → click scroll to preview heading (id slug)
- Export: HTML → Blob `text/html`, MD → Blob `text/markdown`

### Code Playground
- 3 textarea (HTML/CSS/JS) + tab switch
- Run: compose `srcdoc` = `<!doctype html><style>${css}</style>${html}<script>try{${js}}catch(e){parent.postMessage({type:'code-error',msg:e.message},'*')}<\/script>`
- Console: override `console.log/warn/error` trong iframe via injected script that `postMessage` to parent; parent listens `message` event
- Auto-run: debounce 600ms when toggle on
- Reset: clear all 3 + console
- Persist: localStorage `web-universe:code-playground` (JSON {html,css,js})

### Diff
- Text diff: LCS DP (O(n*m) but n,m = lines, ok for <500 lines) → produce ops (equal/added/removed)
- JSON diff: try parse both → pretty stringify (2 spaces) → text diff; if parse fails → text diff + hint
- Render: two columns side-by-side, each line with gutter (+/-/ ) and bg
- Stats: count added/removed/unchanged
- Swap: swap left/right values

## 5. UX States

| View | Loading | Empty | Error | Success |
|------|---------|-------|-------|---------|
| Markdown preview | — | "Start typing…" | — | rendered HTML |
| Code preview | spinner | "Run to preview" | error banner | iframe content |
| Code console | — | "No logs yet" | error line | log lines |
| Diff view | — | "Enter text on both sides" | "JSON invalid" hint | diff lines + stats |

## 6. Animation
- Tab switch: 150ms ease
- Preview update: fade 150ms
- Diff highlight: 200ms
- Respect `prefers-reduced-motion`

## 7. A11y
- Toolbar buttons: `aria-label`, keyboard (Tab, Enter)
- Editor: `aria-label`, focus-visible
- Preview: `role="region" aria-label="Preview"`
- Console: `role="log" aria-live="polite"`
- Diff: `aria-label` per pane

## 8. File Map (Part 2)
```
www/web-universe/js/modules/markdown/index.js
www/web-universe/js/modules/code-playground/index.js
www/web-universe/js/modules/diff/index.js
www/web-universe/css/modules.css (append)
```

---
*Generated by YUNIE — Harness v2 Design Phase — Part 2 Text Universe*
