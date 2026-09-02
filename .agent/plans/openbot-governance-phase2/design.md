# Design: OpenBot Governance Phase 2 — AG-UI + MCP + Components + Routines

## 1. Design System (kế thừa www/ hiện tại)

> Không tạo palette mới — dùng lại `www/styles.css` v2.1 (Indigo #6366f1, Slate, Amber, glass + rainbow). Platform UI chỉ thêm 1 section + 4 cards, giữ responsive 375/768/1280, animation 150-300ms, a11y ≥4.5:1.

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | `#6366f1` | platform header, badge |
| `--color-success` | `#16a34a` | permitted / ok |
| `--color-warning` | `#f59e0b` | warn / refused |
| `--color-danger` | `#dc2626` | failed / deny |
| `--color-neutral-100` | `#f8fafc` | card bg |
| `--radius-md` | `12px` | card radius |
| `--shadow-sm` | `0 1px 2px rgba(15,23,42,.06)` | card shadow |

Typography: `Inter` + `Plus Jakarta Sans` + `JetBrains Mono` (đã có). Spacing 4/8px, radius 8-22px.

## 2. Architecture — 4 pillars (học OpenBot, 0 deps)

```
┌─────────────────────────────────────────────────────────┐
│  Harness v2 (VS Code Copilot Chat)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │  AG-UI   │  │   MCP    │  │Components│  │ Routines │ │
│  │ agents.yaml│ │catalog   │  │ gallery  │  │ routines │ │
│  │ registry │  │ grants   │  │ playground│  │ .json    │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘ │
│       │             │             │             │       │
│       └──────┬──────┴──────┬──────┴──────┬──────┘       │
│              ▼             ▼             ▼              │
│     generate-status.mjs → www/status.json → www/index.html │
│              │                                          │
│  instruction: platform-seam (applyTo **)                │
│  governance: audit/policy/credentials (Phase 1)         │
└─────────────────────────────────────────────────────────┘
```

- **AG-UI:** `agents.yaml` khai báo `built-in` (system prompt) hoặc `remote-ag-ui` (endpoint). `agent-registry.mjs` validate endpoint với `AGENT_ENDPOINT_ALLOWED_HOSTS` (exact match, no wildcard).
- **MCP:** `catalog.json` liệt kê vendors, `grants.json` per-agent. Unknown tool = write (phải allow). `mcp-check.mjs` check `tool + agent → ALLOW/DENY`.
- **Components:** `www/components/gallery/` chứa React-like HTML components, `playground.html` preview. `component-check.mjs` check `published + not withheld`.
- **Routines:** `routines.json` lưu schedule, `routine.mjs` add/list/run với floor 15m + cap 20 + 10 fails → off.

## 3. File Changes

| File | Action | Description |
|------|--------|-------------|
| `.agent/agents.yaml` | create | 3 agents mẫu (general, knowledge, risk) |
| `.agent/mcp/catalog.json` | create | 2 MCP mẫu (google-drive, notion) |
| `.agent/mcp/grants.json` | create | Grants per-agent |
| `.agent/routines.json` | create | Empty routines |
| `.agent/scripts/agent-registry.mjs` | create | CLI: `list`, `validate` |
| `.agent/scripts/mcp-check.mjs` | create | CLI: `--tool X --agent Y` → ALLOW/DENY |
| `.agent/scripts/component-check.mjs` | create | CLI: `--component X --agent Y` → ALLOW/DENY |
| `.agent/scripts/routine.mjs` | create | CLI: `add/list/run` |
| `www/components/gallery/hello.html` | create | Mẫu component 1 |
| `www/components/gallery/stats.html` | create | Mẫu component 2 |
| `www/components/gallery/audit.html` | create | Mẫu component 3 |
| `www/components/playground.html` | create | Preview playground |
| `.github/instructions/platform-seam.instructions.md` | create | Enforce AG-UI/MCP/components/routines |
| `.github/harness/scripts/generate-status.mjs` | edit | Thêm `platform` vào `status.json` |
| `www/index.html` | edit | Thêm section Platform (4 cards) |
| `www/app.js` | edit | Render platform từ `status.json` |
| `.gitignore` | edit | Thêm `.agent/routines.json` nếu cần |

## 4. Data Models

### 4.1 Agents (`agents.yaml`)
```yaml
agents:
  - id: general
    name: General Assistant
    type: built-in
    prompt: "You are a helpful assistant..."
  - id: knowledge
    name: Knowledge
    type: remote-ag-ui
    endpoint: https://agents.internal/knowledge
```

### 4.2 MCP (`catalog.json` + `grants.json`)
```json
// catalog.json
{"vendors":[{"id":"google-drive","name":"Google Drive","tools":["read","write"]}]}
// grants.json
{"general":["google-drive"],"knowledge":[]}
```

### 4.3 Components (`gallery/` + check)
```json
// component meta in HTML comment
<!-- meta: {"id":"hello","published":true,"withheld":[]} -->
```

### 4.4 Routines (`routines.json`)
```json
[{"id":"a1b2c3","cron":"0 9 * * *","prompt":"check status","enabled":true,"fails":0}]
```

### 4.5 Status (`www/status.json` thêm)
```json
"platform":{
  "agents":{"total":3,"builtIn":2,"remote":1},
  "mcp":{"vendors":2,"grants":1},
  "components":{"total":3,"published":3},
  "routines":{"total":0,"enabled":0}
}
```

## 5. Wireframe — Platform Section (trong www/index.html)

### Desktop 1280px (max 1120, 4-col)
```
[Header YUNIE STATUS]
[Hero]
[Stats 5 cols]
[Registry]
[Governance 3 cols] — Phase 1
[Platform — NEW 4 cols]
  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
  │ AG-UI    │ │ MCP      │ │Components│ │ Routines │
  │ 3 agents │ │ 2 vendors│ │ 3 comps  │ │ 0 routines│
  │ ● 2 built│ │ ● 1 grant│ │ ● 3 pub  │ │ ● floor 15m│
  │ [List]   │ │ [Check]  │ │ [Gallery]│ │ [Add]    │
  └──────────┘ └──────────┘ └──────────┘ └──────────┘
[Plans / Demos / Health]
[Footer]
```

### Mobile 375px — single column, cards stack
```
[AG-UI card full width]
[MCP card full width]
[Components card full width]
[Routines card full width]
```

### Tablet 768px — 2-col
```
[AG-UI | MCP]
[Components | Routines]
```

## 6. Component Inventory

| Component | States | Spec |
|-----------|--------|------|
| **Platform Card** | default/hover | surface white, shadow-sm, hover shadow-md + translateY(-1px), radius 12px, padding 16px |
| **Badge** | ok/warn/danger | dot + text, bg success/warning/danger soft, 150ms |
| **Gallery Link** | default/hover | card, hover primary, 150ms |
| **Routine Row** | enabled/disabled | tag + cron + prompt, 150ms |

## 7. UX States

| View | Loading | Empty | Error | Success |
|------|---------|-------|-------|---------|
| AG-UI | skeleton | "Chưa có agent — thêm vào agents.yaml" | endpoint invalid → warn | list → 3 agents |
| MCP | skeleton | "Chưa có vendor — thêm vào catalog.json" | unknown tool → warn | check → ALLOW/DENY |
| Components | skeleton | "Chưa có component — thêm vào gallery/" | not published → warn | gallery → 3 comps |
| Routines | skeleton | "Chưa có routine — chạy routine.mjs add" | floor/cap fail → warn | add → 1 routine |

## 8. Animation & A11y

- Card hover: `transform 180ms ease, shadow 180ms ease`
- Badge: `opacity 150ms`
- Contrast: text #0f172a on #f8fafc = 16:1, primary #6366f1 on white = 4.6:1 (AA)
- Focus: `outline 2px solid #6366f1; outline-offset 2px`
- Icon buttons: `aria-label`
- Keyboard: Tab order, Enter on buttons
- Reduced motion: `@media (prefers-reduced-motion)` disable transforms

## 9. Visual Direction

- **Vibe:** Giữ nguyên YUNIE STATUS — calm, Swiss, glass subtle. Platform cards dùng cùng shadow/radius, không thêm màu mới.
- **Delight:** Count animate 300ms khi load, gallery hover 150ms.

---
*Generated by YUNIE — Harness v2 Design Phase 2 — 2026-09-02*
