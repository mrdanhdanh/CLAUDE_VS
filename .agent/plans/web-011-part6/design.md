# Design: WEB 011 Part 6 — FINAL BOSS

> Design system kế thừa Part 1-5 + wireframe cho 7 labs.

## 1. Design System (kế thừa)

### Palette / Typography / Spacing
- Dùng `css/base.css` variables: `--bg, --surface, --surface-2, --border, --text, --primary, --success, --danger, --warning`
- Typography: `Inter` + `JetBrains Mono`
- Spacing 4/8, radius 8/12/16

### Module-specific tokens
```css
--game-bg: #0f172a;
--game-accent: #6366f1;
--data-header: #1e293b;
--viz-bar: #6366f1;
--viz-line: #06b6d4;
--security-warn: #f59e0b;
--api-ok: #10b981;
--api-warn: #f59e0b;
--api-error: #ef4444;
```

## 2. Wireframe

### Game Lab — Desktop
```
┌─────────────────────────────────────────────────────────┐
│ [Snake] [Pong] [Particles]  Score: 12  [Pause] [Restart]│
│ ┌─────────────────────────────────────────────────────┐ │
│ │  Canvas 400×400  (game)                              │ │
│ │  ███  (snake)  ● (food)                              │ │
│ └─────────────────────────────────────────────────────┘ │
│ Controls: Arrow/WASD  Space=Pause                       │
└─────────────────────────────────────────────────────────┘
```

### Data Lab — Desktop
```
┌─────────────────────────────────────────────────────────┐
│ [Load CSV] [Load JSON] [Generate 1k/10k] [Export]       │
│ Search: [____]  Filter: [col] [op] [val]  [Add]         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Table (virtual scroll)  Sort ↑↓  Pagination          │ │
│ │ col1 | col2 | col3                                   │ │
│ └─────────────────────────────────────────────────────┘ │
│ Benchmark: Normal 4.8s vs Virtual 0.3s                  │
└─────────────────────────────────────────────────────────┘
```

### Viz Lab — Desktop
```
┌─────────────────────────────────────────────────────────┐
│ [Bar] [Line] [Pie] [Scatter] [Histogram] [Heatmap] [RT] │
│ ┌─────────────────────────────────────────────────────┐ │
│ │  Canvas chart                                        │ │
│ └─────────────────────────────────────────────────────┘ │
│ [Random Data] [Export PNG]  Realtime: Worker→Chart      │
└─────────────────────────────────────────────────────────┘
```

### Security Lab — Desktop
```
┌─────────────────────────────────────────────────────────┐
│ Grid: XSS | Escaping | Sanitization | CSP | CORS        │
│       iframe | Same-origin | Cookie | Storage | Perm    │
│ Each: concept + demo + code + result                    │
└─────────────────────────────────────────────────────────┘
```

### API Explorer — Desktop
```
┌─────────────────────────────────────────────────────────┐
│ Search: [____]  Filter: [All/✓/✗]                       │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ✓ Canvas — supported — [Demo]                        │ │
│ │ ✗ Bluetooth — not supported                          │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### DevTools — Desktop
```
┌─────────────────────────────────────────────────────────┐
│ Tabs: [JSON] [Base64] [URL] [Time] [UUID] [Color] ...   │
│ Each: input → output + [Copy]                           │
└─────────────────────────────────────────────────────────┘
```

### Utilities — Desktop
```
┌─────────────────────────────────────────────────────────┐
│ Grid: Calculator | Stopwatch | Timer | Clock | Random   │
│       Password | Unit | Text Stats | Color              │
└─────────────────────────────────────────────────────────┘
```

### Mobile 375
- Game: canvas full-width, controls stack
- Data: table scroll, controls stack
- Viz: chart full-width, controls wrap
- Security/API/DevTools/Utilities: single column, cards stack

## 3. Component Inventory

| Component | States | Notes |
|-----------|--------|-------|
| Game canvas | playing/paused/gameover | 400×400, rAF, keyboard |
| Game controls | default | Snake/Pong/Particles, score, pause/restart |
| Data table | default/sorted/filtered | virtual scroll, pagination, sort |
| Data controls | default | load, generate, filter, search, export |
| Viz canvas | bar/line/pie/etc | Canvas, responsive, export |
| Viz controls | default | chart type, random, export, realtime |
| Security card | concept/demo | XSS, CSP, CORS, etc. |
| API card | ok/warn/error | ✓/⚠/✗, permission, demo |
| DevTools tab | default/active | JSON, base64, URL, etc. |
| Utility card | default | calculator, timer, etc. |

## 4. Architecture

### Game Lab
- Engine: rAF loop, input (keydown), collision (AABB), state (playing/paused/gameover), score, particles
- Snake: grid 20×20, direction, food, grow, collision wall/self
- Pong: paddles, ball, collision, score, AI
- Particles: sandbox, gravity, emit on click

### Data Lab
- Parser: CSV (split lines, handle quotes), JSON (parse)
- Table: virtual scroll — only render visible rows (windowed), 30 rows visible, 10k total
- Sort: click header, asc/desc
- Filter: col + op (contains/equals/gt/lt) + val
- Search: global search
- Group: group by col, aggregation (count/sum/avg)
- Pagination: page size 20, prev/next
- Generator: random data (id, name, value, category)
- Benchmark: measure render time normal vs virtual

### Viz Lab
- Bar: rects, scale, labels
- Line: path, points, axes
- Pie: arcs, labels, legend
- Scatter: dots, axes
- Histogram: bars from bins
- Heatmap: grid, color scale
- Realtime: Worker generates data → postMessage → aggregator → chart update
- Export: canvas.toDataURL → download

### Security Lab
- XSS: show escaped vs unescaped, sanitization via textContent
- CSP: meta tag demo, explain
- CORS: fetch demo, explain
- iframe: sandbox attribute demo
- Same-origin: explain, demo via iframe
- Cookie: flags (HttpOnly, Secure, SameSite) explain
- Storage: isolation demo
- Permissions: via Permissions API

### API Explorer
- Detect: `'geolocation' in navigator`, `'Worker' in window`, etc. for 20+ APIs
- For each: support status, permission if applicable, demo button, description
- No fake — real detection

### DevTools
- JSON: formatter, validator (try parse)
- Base64: btoa/atob
- URL: encode/decode
- Timestamp: Date.now, convert
- UUID: crypto.randomUUID
- Color: hex/rgb/hsl converter, picker
- Regex: tester with flags
- Text: upper/lower/camel/snake
- Hash: SubtleCrypto digest (SHA-256)
- Query: URLSearchParams
- CSV: json↔csv
- Number: base converter (2/8/10/16)

### Utilities
- Calculator: eval with sanitization
- Stopwatch: setInterval, start/stop/reset
- Timer: countdown, setInterval
- Clock: setInterval, Date
- Countdown: target date, diff
- Random: Math.random, range
- Password: charset, length, generate
- Unit: length/weight/temp converters
- Text stats: word/char/line, reading time
- Color: picker, palette

## 5. UX States

| View | Loading | Empty | Error | Success |
|------|---------|-------|-------|---------|
| Game | — | "Select game" | — | playing |
| Data | "Loading…" | "No data" | "Parse failed" | table |
| Viz | — | "No data" | — | chart |
| Security | — | — | — | demo |
| API | "Checking…" | — | — | list |
| DevTools | — | "Enter input" | "Invalid" | output |
| Utilities | — | — | — | result |

## 6. Animation
- Game: rAF 60fps
- Viz: 200ms transition
- Respect `prefers-reduced-motion`

## 7. A11y
- Game: keyboard, aria-label, focus
- Table: semantic, sort aria-sort
- Chart: aria-label, alt text
- Security/API: semantic, headings

## 8. File Map (Part 6)
```
www/web-universe/js/modules/game-lab/index.js
www/web-universe/js/modules/data-lab/index.js
www/web-universe/js/modules/viz-lab/index.js
www/web-universe/js/modules/security-lab/index.js
www/web-universe/js/modules/api-explorer/index.js
www/web-universe/js/modules/devtools/index.js
www/web-universe/js/modules/utilities/index.js
www/web-universe/css/modules.css (append)
```

---
*Generated by YUNIE — Harness v2 Design Phase — Part 6 Final Boss*
