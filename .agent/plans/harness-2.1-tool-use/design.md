# Design: Harness 2.1 — P0-2 Tool Use Hardening

> **Version:** 2.1-P0-2 · **Ngày:** 2026-09-04 · **Tác giả:** YUNIE
> **PRD:** `prd.md` · **Nguồn:** Lesson 04 Tool Use (6 building blocks)

## 1. Design System

### Palette / Typography / Spacing
Reuse `www/library/styles.css` — không thêm (minimal-ladder).

## 2. Wireframe

### Data Flow (6 building blocks Lesson 04)
```
LLM / Browser ──► validateParams(tool, args) ──► checkApproval(tool, actor) ──► execute (searchBM25/agenticSearch) ──► history.push ──► return {hits} or {error}
                      │                              │                              │                      │
                      │ fail → {isError, errors}     │ refused → {isError}          │ success              │ max 20, in-memory
                      └──────────────────────────────┴──────────────────────────────┴──────────────────────┘
```

### Browser UI
Không thêm UI mới — chỉ thêm `window.LibrarySearch.validate(tool, args)` cho debug. Lỗi validation hiện trong console + toast nếu gọi qua UI.

## 3. Component Inventory

| Component | States | Notes |
|-----------|--------|-------|
| `www/library/tool-registry.mjs` | — | **MỚI** — ESM 0 deps, Node+browser. Exports: `TOOL_SCHEMAS`, `TOOL_APPROVAL`, `validateParams`, `getApprovalMode`, `checkApproval`, `toolHistory`, `executeWithValidation`, `normalizeArgs` |
| `www/library/mcp-server.mjs` | — | **SỬA** — import `tool-registry.mjs`, validate trước khi handle `tools/call`, trả lỗi structured, ghi history |
| `www/library/app.js` | — | **SỬA** — import `tool-registry.mjs`, validate trước khi `bm25Search`/`agenticSearch`, expose `validate` |

## 4. UX States

| View | Loading | Empty | Error | Success |
|------|---------|-------|-------|---------|
| MCP `search_library` | — | `hits: []` | `isError: true` + `errors: ["missing required: query"]` | `hits` + `history` |
| Browser `search` | — | `[]` | toast `Lỗi: query must be string` | hits |

## 5. Animation
Không thêm.

## 6. Accessibility
Không thêm.

## 7. API Design

### `tool-registry.mjs` Exports
```js
export const TOOL_SCHEMAS = [
  { name: "search_library", approval_mode: "never_require", inputSchema: {type:"object", properties:{query:{type:"string", minLength:1}, top_k:{type:"number", minimum:1, maximum:20, default:5}, enabled_only:{type:"boolean", default:true}}, required:["query"]} },
  { name: "search_library_iterative", approval_mode: "never_require", inputSchema: {...} },
  { name: "list_books", approval_mode: "never_require", inputSchema: {type:"object", properties:{}, required:[]} },
  { name: "get_book", approval_mode: "never_require", inputSchema: {type:"object", properties:{id:{type:"string", minLength:1}, include_chunks:{type:"boolean", default:false}}, required:["id"]} },
  { name: "get_status", approval_mode: "never_require", inputSchema: {type:"object", properties:{}, required:[]} }
]
export const TOOL_APPROVAL = { search_library: "never_require", ... }
export function validateParams(toolName, args): {valid: boolean, errors: string[], normalized: object}
export function getApprovalMode(toolName): string
export function checkApproval(toolName, actor, intent): {permitted: boolean, reason: string}
export const toolHistory: Array<{tool, args, timestamp, durationMs, success, error}>
export function executeWithValidation(toolName, args, fn): {result, errors}
export function normalizeArgs(toolName, args): object // fill defaults + clamp
```

### Validation Rules (minimal JSON Schema subset)
- `type`: `string` | `number` | `boolean` | `object`
- `required`: array
- `properties`: {prop: {type, minimum, maximum, minLength, default, enum}}
- Extra params: ignore (không fail)
- Clamp: `top_k` 1-20, `maxRounds` 1-5, `minHits` 1-20, `minScore` 0-10 — clamp thay vì error (để metric 3 pass)
- `query` trim length 0 → error `query must be non-empty string`

### MCP Integration
```js
import { validateParams, toolHistory } from './tool-registry.mjs';
// in handleMessage tools/call:
const v = validateParams(name, args);
if(!v.valid) { send({isError:true, content:[{text: JSON.stringify({error: "validation failed", errors: v.errors}, null, 2)}]}); return; }
const normalized = v.normalized;
// then execute with normalized
```

### Browser Integration
```js
import { validateParams } from './tool-registry.mjs';
window.LibrarySearch.validate = (tool, args) => validateParams(tool, args);
window._toolHistory = toolHistory;
```

## 8. Error Handling (Lesson 04)
- Missing required → `missing required: query`
- Wrong type → `wrong type: query must be string (got number)`
- Empty string → `query must be non-empty string`
- Unknown tool → `Unknown tool: foo`
- Execution error (e.g., `query rỗng` from BM25) → catch + return `isError: true` + `error: e.message`

## 9. State Management (Lesson 04)
- `toolHistory` max 20, push mỗi call (success + fail), `timestamp: Date.now()`, `durationMs`
- In-memory only (MCP process) + `window._toolHistory` (browser)
- Không persist, không log secret (redact nếu args chứa `token`/`secret`)

## 10. Audit
- Không ghi `audit.jsonl` cho read tools (để tránh spam) — chỉ ghi history in-memory
- Nếu cần, `audit.mjs log --tool search_library --decision permitted` có thể thêm ở P1

---
*Generated by Claude Harness v2 — Design Phase (P0-2 Tool Use Hardening)*
