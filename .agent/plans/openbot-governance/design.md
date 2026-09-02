# Design: OpenBot Governance Upgrade — Harness v2 (Phase 1)

## 1. Design System (kế thừa www/ hiện tại)

> Không tạo palette mới — dùng lại `www/styles.css` v2.1 (Indigo #6366f1, Slate, Amber, glass + rainbow). Governance UI chỉ thêm 1 section + 3 cards, giữ responsive 375/768/1280, animation 150-300ms, a11y ≥4.5:1.

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | `#6366f1` | governance header, badge |
| `--color-success` | `#16a34a` | permitted / ok |
| `--color-warning` | `#f59e0b` | warn / refused |
| `--color-danger` | `#dc2626` | failed / deny |
| `--color-neutral-100` | `#f8fafc` | card bg |
| `--radius-md` | `12px` | card radius |
| `--shadow-sm` | `0 1px 2px rgba(15,23,42,.06)` | card shadow |

Typography: `Inter` + `Plus Jakarta Sans` + `JetBrains Mono` (đã có). Spacing 4/8px, radius 8-22px.

## 2. Architecture — 3 pillars (học OpenBot, 0 deps)

```
┌─────────────────────────────────────────────────────────┐
│  Harness v2 (VS Code Copilot Chat)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐           │
│  │  Audit   │  │  Policy  │  │ Credentials  │           │
│  │ .jsonl   │◄─┤  Gateway │◄─┤  enc.json    │           │
│  │ append   │  │ CEL-lite │  │ AES-256-GCM  │           │
│  └────┬─────┘  └────┬─────┘  └──────┬───────┘           │
│       │             │               │                   │
│       └──────┬──────┴───────┬───────┘                   │
│              ▼              ▼                           │
│     generate-status.mjs → www/status.json → www/index.html │
│              │                                          │
│  instruction: agent-governance (applyTo **)             │
└─────────────────────────────────────────────────────────┘
```

- **Audit:** append-only JSONL, 1 dòng = 1 event. Không DB, không server — như OpenBot audit nhưng file-based.
- **Policy:** `deny[]` trước `allow[]`, `fail-closed` (malformed → deny all). CEL-lite: JS expression với vars `tool, target, actor, intent`.
- **Credentials:** AES-256-GCM, key từ `HARNESS_CRED_KEY` env hoặc `~/.harness/key` fallback, never logged, redacted trong audit/status.

## 3. File Changes

| File | Action | Description |
|------|--------|-------------|
| `.agent/audit.jsonl` | create | Append-only audit log (gitignore) |
| `.agent/policy.json` | create | Policy config (deny/allow, version 1) |
| `.agent/credentials.enc.json` | create | Encrypted credentials (gitignore) |
| `.agent/scripts/audit.mjs` | create | CLI: `log`, `tail`, `stats` |
| `.agent/scripts/policy-check.mjs` | create | CLI: check `tool+target` → ALLOW/DENY |
| `.agent/scripts/credentials.mjs` | create | CLI: `set/get/list` encrypted |
| `.github/instructions/agent-governance.instructions.md` | create | Enforce audit/policy/credentials (applyTo **) |
| `.github/harness/scripts/generate-status.mjs` | edit | Thêm `governance` vào `status.json` |
| `www/index.html` | edit | Thêm section Governance (3 cards + tail) |
| `www/app.js` | edit | Render governance từ `status.json` |
| `www/styles.css` | edit | Styles cho governance cards (kế thừa) |
| `.gitignore` | edit | Thêm `.agent/audit.jsonl`, `.agent/credentials.enc.json` |

## 4. Data Models

### 4.1 Audit Event (JSONL, 1 dòng)
```json
{"ts":"2026-09-02T14:30:00.000Z","actor":"YUNIE","tool":"shell","target":"rm -rf /","decision":"refused","rule":"deny-rm-rf","durationMs":12,"requestId":"a1b2c3"}
```
- `decision`: `permitted` | `refused` | `failed`
- `rule`: id của rule đã match (hoặc `null`)
- `target`: redacted nếu là credential (chỉ ghi `***`)

### 4.2 Policy (`policy.json`)
```json
{
  "version": 1,
  "description": "Harness governance — deny before allow, fail-closed",
  "deny": [
    {"id":"deny-rm-rf","when":"tool === 'shell' && target.includes('rm -rf /')","message":"Refuse rm -rf /"},
    {"id":"deny-env-read","when":"tool === 'read' && target.includes('.env')","message":"Refuse reading .env"},
    {"id":"deny-credentials-leak","when":"target.includes('credentials.enc.json')","message":"Refuse direct read of credentials"}
  ],
  "allow": [
    {"id":"allow-read-www","when":"tool === 'read' && target.startsWith('www/')"},
    {"id":"allow-all","when":"true"}
  ]
}
```
- Evaluator: `new Function('tool','target','actor','intent', 'return ('+when+')')` — sandboxed, chỉ 4 vars, timeout 50ms.
- Order: `deny` trước, nếu match → `refused`; else check `allow` → `permitted`; else `refused` (fail-closed).

### 4.3 Credentials (`credentials.enc.json`)
```json
{"v":1,"iv":"base64","tag":"base64","data":"base64(aes-gcm)"}
```
- Plain: `{"OPENAI_API_KEY":"sk-...","INTELLIGENCE_API_KEY":"cpk-..."}`
- Key: `HARNESS_CRED_KEY` (base64 32 bytes) hoặc `~/.harness/key` (auto-gen nếu chưa có).

### 4.4 Status (`www/status.json` thêm)
```json
"governance":{
  "audit":{"total":42,"permitted":38,"refused":3,"failed":1,"lastTs":"2026-09-02T14:30:00Z"},
  "policy":{"version":1,"deny":3,"allow":2,"status":"ok","lastCheck":"2026-09-02T14:30:00Z"},
  "credentials":{"count":2,"status":"ok","enc":true}
}
```

## 5. Wireframe — Governance Section (trong www/index.html)

### Desktop 1280px (max 1120, 3-col)
```
[Header YUNIE STATUS]
[Hero]
[Stats 5 cols: Skills/Instructions/Agents/Prompts/Hooks]
[Registry table/cards]
[Governance — NEW]
  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
  │ Audit       │ │ Policy      │ │ Credentials │
  │ 42 events   │ │ 3 deny      │ │ 2 keys      │
  │ ● 38 ok     │ │ ● 2 allow   │ │ ● enc ok    │
  │ ● 3 refused │ │ ● fail-closed│ │ ● never log │
  │ [View tail] │ │ [Check]     │ │ [List]      │
  └─────────────┘ └─────────────┘ └─────────────┘
  [Audit tail: last 5 events table]
[Plans / Demos / Health]
[Footer]
```

### Mobile 375px — single column, cards stack
```
[Audit card full width]
[Policy card full width]
[Credentials card full width]
[Tail table → cards]
```

### Tablet 768px — 2-col
```
[Audit | Policy]
[Credentials full width]
```

## 6. Component Inventory

| Component | States | Spec |
|-----------|--------|------|
| **Governance Card** | default/hover | surface white, shadow-sm, hover shadow-md + translateY(-1px), radius 12px, padding 16px |
| **Badge** | ok/warn/danger | dot + text, bg success/warning/danger soft, 150ms |
| **Audit Tail Table** | default/empty | table desktop, cards mobile (như registry), mono font cho tool/target |
| **Policy Check Button** | default/hover/active | btn-ghost, hover bg surface-2, active scale .98 |
| **Credentials List** | empty/has-keys | chỉ hiện key names, không hiện values, mono |

## 7. UX States

| View | Loading | Empty | Error | Success |
|------|---------|-------|-------|---------|
| Audit | skeleton 3 rows | "Chưa có audit — chạy audit.mjs log để ghi" | `audit.jsonl` read fail → warn badge | log xong → toast + count tăng |
| Policy | — | "Chưa có policy — dùng policy.json mặc định" | malformed → danger badge + "fail-closed" | check → toast ALLOW/DENY + rule |
| Credentials | — | "Chưa có key — chạy credentials.mjs set" | decrypt fail → danger | set/list → toast, không lộ value |

## 8. Animation & A11y

- Card hover: `transform 180ms ease, shadow 180ms ease`
- Badge: `opacity 150ms`
- Table row: `background 150ms`
- Contrast: text #0f172a on #f8fafc = 16:1, primary #6366f1 on white = 4.6:1 (AA)
- Focus: `outline 2px solid #6366f1; outline-offset 2px`
- Icon buttons: `aria-label`
- Keyboard: Tab order, Enter on buttons
- Reduced motion: `@media (prefers-reduced-motion)` disable transforms

## 9. Visual Direction

- **Vibe:** Giữ nguyên YUNIE STATUS — calm, Swiss, glass subtle. Governance cards dùng cùng shadow/radius, không thêm màu mới.
- **Delight:** Count animate 300ms khi load, tail row fade-in 150ms.

---
*Generated by YUNIE — Harness v2 Design Phase — 2026-09-02*
