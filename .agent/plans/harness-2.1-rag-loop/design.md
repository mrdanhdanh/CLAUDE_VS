# Design: Harness 2.1 — P0-1 Agentic RAG Loop

> **Version:** 2.1-P0-1 · **Ngày:** 2026-09-04 · **Tác giả:** YUNIE
> **PRD:** `.agent/plans/harness-2.1-rag-loop/prd.md` · **Nguồn:** Lesson 05 Agentic RAG (maker-checker)

## 1. Design System

### Palette (không đổi — reuse `www/library/styles.css`)
| Token | Hex | Usage |
|-------|-----|-------|
| `--color-primary` | `#6366f1` | CTA, link |
| `--color-surface` | `#ffffff` | Card |
| `--color-neutral-900` | `#0f172a` | Text |

> Không thêm màu mới — reuse existing (minimal-ladder).

### Typography / Spacing / Radius / Shadow
Reuse `www/library/styles.css` — không thêm.

## 2. Wireframe

### Logic Flow (không phải UI, là data flow)
```
User query ──► agenticSearch(query, {maxRounds:3, minHits:2, minScore:1.0})
                │
                ├─► Round 1: searchBM25(query) → hits1 → evaluateGap(hits1)
                │         hasGap? ──► refineQuery(query, attempt=1) → query2
                │         noGap? ──► return {hits: hits1, rounds:1}
                │
                ├─► Round 2: searchBM25(query2) → hits2 → evaluateGap(hits2)
                │         hasGap? ──► refineQuery(query, attempt=2) → query3
                │         noGap? ──► return {hits: hits2, rounds:2}
                │
                └─► Round 3: searchBM25(query3) → hits3 → return {hits: hits3, rounds:3}
```

### Browser UI (minimal — chỉ thêm badge)
```
[Search input: "mcp a2a nlweb"] [Search] [Iterative: ON/OFF toggle]
[Results: 5 hits · 2 rounds · queries: "mcp a2a nlweb" → "mcp tool a2a agent"]
[Each hit: bookName · chunk # · page · score · snippet + highlight]
```

- Mobile 375px: single column, toggle dưới input
- Tablet 768px: input + toggle inline
- Desktop 1280px: same, max-width 800 centered

## 3. Component Inventory

| Component | States | Notes |
|-----------|--------|-------|
| `www/library/rag-loop.mjs` | — | **Mới** — ESM, Node + browser, 0 deps. Exports: `tokenize`, `buildIndex`, `searchBM25`, `evaluateGap`, `refineQuery`, `agenticSearch` |
| `www/library/mcp-server.mjs` | — | **Sửa** — import `rag-loop.mjs`, thêm tool `search_library_iterative` (giữ `search_library` cũ) |
| `www/library/app.js` | — | **Sửa** — import hoặc inline `agenticSearch`, thêm `window.LibrarySearch.searchIterative` + UI toggle |
| `www/library/search.mjs` | — | **Sửa nhẹ** — thêm flag `--iterative` (optional, P1) |

## 4. UX States

| View | Loading | Empty | Error | Success |
|------|---------|-------|-------|---------|
| Library Search | spinner 150ms | "Không tìm thấy trong thư viện" + gợi ý refine | "query rỗng" | hits + rounds + refinedQueries + toast |
| MCP `search_library_iterative` | — | `hits: []` + `gap: no_data` | `isError: true` | JSON `{query, hits, rounds, refinedQueries, gap}` |

## 5. Animation
- Không thêm animation mới — reuse `toast` 150-300ms hiện có.

## 6. Accessibility
- Toggle `Iterative` có `aria-label="Tìm kiếm lặp (Agentic RAG)"`
- Results có `role="list"` + `aria-live="polite"`

## 7. API Design

### `rag-loop.mjs` Exports
```js
// Pure functions, no side effects, 0 deps
export const STOPWORDS: Set<string>
export function tokenize(text: string): string[]
export function buildIndex(chunks, registry, enabledOnly): {docs, docFreq, avgdl, N}
export function searchBM25(query, chunks, registry, top_k, enabledOnly): Hit[]
export function evaluateGap(hits: Hit[], {minHits, minScore}): {hasGap: boolean, reason: string}
export function refineQuery(query: string, attempt: number): string
// attempt 1 → original, 2 → synonym expand, 3 → split tokens fallback
export function agenticSearch(query, chunks, registry, {top_k, enabledOnly, maxRounds, minHits, minScore}): {
  query: string,
  hits: Hit[],
  rounds: number,
  refinedQueries: string[],
  gap: {hasGap, reason},
  total_chunks: number,
  enabled_books: number
}
```

### MCP Tool `search_library_iterative`
```json
{
  "name": "search_library_iterative",
  "description": "Agentic RAG loop (maker-checker, max 3 vòng) — tự refine query khi 0 hits/score thấp. Trả về rounds + refinedQueries.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": {"type": "string"},
      "top_k": {"type": "number", "default": 5},
      "enabled_only": {"type": "boolean", "default": true},
      "maxRounds": {"type": "number", "default": 3},
      "minHits": {"type": "number", "default": 2},
      "minScore": {"type": "number", "default": 1.0}
    },
    "required": ["query"]
  }
}
```

### Browser API
```js
window.LibrarySearch.searchIterative(query, {top_k: 5, maxRounds: 3, minHits: 2, minScore: 1.0})
// → Promise<{hits, rounds, refinedQueries, gap}>
```

## 8. Synonym Map (heuristic, v1)
```js
const SYNONYMS = {
  "mcp": ["mcp", "tool", "client-server"],
  "a2a": ["a2a", "agent", "agent card"],
  "nlweb": ["nlweb", "embeddings", "vector"],
  "rag": ["rag", "retrieval", "agentic rag"],
  "planning": ["planning", "task decomposition", "pydantic"],
  "multi-agent": ["multi-agent", "group chat", "hand-off"],
  "metacognition": ["metacognition", "self-reflection", "corrective rag"],
  "memory": ["memory", "mem0", "cognee"],
  "context": ["context", "poisoning", "scratchpad"],
  "receipt": ["receipt", "ed25519", "jcs", "hash chain"],
  "browser": ["browser", "playwright", "cdp", "cua"],
  "local": ["local", "slm", "qwen", "foundry local"]
}
```
- `refineQuery` attempt 2: expand tokens via SYNONYMS (nếu token match key → thêm synonyms)
- attempt 3: split query thành tokens, search từng token riêng, merge hits (fallback khi expand vẫn 0 hits)

## 9. Audit
- Mỗi vòng loop không ghi audit riêng (để tránh spam), chỉ ghi 1 event khi xong: `tool: "search_library_iterative", decision: "permitted", rounds, hasGap`
- Dùng `audit.mjs log` nếu cần (optional, P1)

---
*Generated by Claude Harness v2 — Design Phase (P0-1 Agentic RAG Loop)*
