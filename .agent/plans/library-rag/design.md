# Design — Library RAG Local (www/library/)

> **Slug:** `library-rag` · **Ngày:** 2026-08-29 · **Designer:** YUNIE · **Stack:** Static HTML/CSS/JS + IndexedDB + pdf.js + mammoth.js

## 1. Design System

### Palette (kế thừa STATUS, thêm accent cho library)

| Token | Value | Dùng cho |
|-------|-------|----------|
| `--lib-primary` | `#6366f1` (indigo) | Primary button, active tab, highlight |
| `--lib-primary-600` | `#4f46e5` | Hover |
| `--lib-accent` | `#f59e0b` | Đã đọc badge, progress |
| `--lib-success` | `#16a34a` | Enabled, search hit |
| `--lib-danger` | `#dc2626` | Disabled, xóa |
| `--lib-surface` | `#ffffff` | Card |
| `--lib-bg` | `#f8fafc` → `#eef2ff` gradient | Page bg (đồng bộ STATUS) |
| `--lib-text` | `#0f172a` / `#64748b` | Text / muted |
| `--lib-border` | `#e2e8f0` | Border |

### Typography

- **Sans:** `Inter` 400/500/600/700 (body, UI)
- **Display:** `Plus Jakarta Sans` 700/800 (hero, card title)
- **Mono:** `JetBrains Mono` 400/500 (chunk id, citation, code)

### Spacing & Radius (4/8 system)

- `--space-1:4px` `--space-2:8px` `--space-3:12px` `--space-4:16px` `--space-6:24px` `--space-8:32px`
- `--radius-sm:8px` `--radius-md:12px` `--radius-lg:16px` `--radius-xl:20px` `--radius-full:9999px`
- Shadow: `sm` (card), `md` (hover), `lg` (modal)

### Icon

- Lucide stroke 1.8, 16-20px, inline SVG (không CDN icon)

## 2. Kiến trúc Local RAG (0đ, offline)

```
Upload (PDF/DOCX/TXT/MD)
  → Parser (pdf.js / mammoth / text)
  → Chunk (600 tokens ~ 2400 chars, overlap 100 tokens ~400 chars, split by \n\n + sentence)
  → Registry (localStorage: library:registry)
  → Chunks (IndexedDB: library:chunks)
  → Index (BM25 in-memory, build on load)
  → Search (BM25 + highlight + citation)
  → Optional Semantic (Transformers.js MiniLM lazy, toggle)
  → API (window.LibrarySearch) + MCP (library/mcp-server.mjs đọc export.json)
```

**Registry shape (localStorage `library:registry`):**
```json
{
  "sach-a": { "id":"sach-a", "name":"Tài liệu 1000 trang A.pdf", "type":"pdf", "enabled":true, "read":false, "progress":0, "chunks":512, "size": 2450000, "addedAt":"2026-08-29T...", "pages": 1000 },
  "sach-b": { "id":"sach-b", "name":"Ghi chú.md", "type":"md", "enabled":false, "read":true, "progress":100, "chunks":12, "addedAt":"..." }
}
```

**Chunk shape (IndexedDB `library:chunks`):**
```json
{ "id":"sach-a#042", "bookId":"sach-a", "bookName":"...", "index":42, "text":"...", "page": 5 }
```

**BM25:** k1=1.2, b=0.75, avgdl tính trên enabled books only. Search chỉ trên enabled.

**Tháo/gắn:** `enabled=false` → loại khỏi BM25 index, UI badge "Đã tháo", không xóa chunks (để gắn lại instant). Xóa hẳn mới xóa IndexedDB.

## 3. Wireframe

### Desktop 1280px

```
[Header: Brand "Thư Viện" | Stats: Tổng/Đã đọc/Đang gắn/Tổng chunk | Actions: Export/Import]
[Hero: "Thư viện tháo lắp — Tìm siêu nhanh" + sub + Search bar lớn (sticky) + filter pills]
[Upload Zone: Drag-drop + nút chọn file (PDF/DOCX/TXT/MD) + progress bar]
[Filter Bar: [Tất cả] [Đang gắn] [Đã tháo] [Đã đọc] [Chưa đọc] | Sort: Mới nhất/Tên/Chunks | View: Grid/List]
[Book Grid: 3 cols]
  Card: [icon type] [Tên] [badge enabled/disabled] [badge read] [progress bar] [chunks · size · ngày] [actions: Tháo/Gắn · Đã đọc · Xóa]
[Search Results: khi có query → list kết quả với highlight + citation (sách · chunk # · score) + snippet]
```

### Tablet 768px

- Grid 2 cols, header stats thu gọn, search bar full width, filter bar wrap.

### Mobile 375px

- Grid 1 col, header stack, stats 2x2, upload zone full, filter pills scroll horizontal, card vertical, search results full width.

## 4. Component States

| Component | States |
|-----------|--------|
| Upload Zone | default, dragover (border primary, bg primary-50), uploading (progress), success (toast), error (danger border + msg) |
| Book Card | default, hover (shadow-md, lift 2px), disabled (opacity 0.6, grayscale badge), read (accent border-left) |
| Button | default, hover, active, disabled, loading (spinner) |
| Search Input | default, focus (ring primary), has-query (clear button), loading (spinner) |
| Result Item | default, hover (bg neutral-50), selected (bg primary-50) |
| Toggle/Switch | on/off, focus-visible |
| Progress | 0-100%, color: primary (0-99), success (100) |

## 5. Interaction & Animation

- **Transition:** 150-300ms ease (transform, opacity, background, border)
- **Card hover:** `transform: translateY(-2px)` + shadow-md
- **Upload dragover:** scale 1.01 + border-color transition
- **Search:** debounce 150ms, results fade-in 200ms, highlight pulse
- **Toast:** slide-in 200ms, auto-dismiss 2600ms
- **Modal (confirm xóa):** backdrop fade 150ms, modal scale 0.96→1 200ms, ESC + click outside + focus trap

## 6. A11y

- Skip-link, semantic header/main/section, aria-label cho mọi icon button
- Contrast ≥4.5:1 (text trên bg), focus-visible ring 2px primary
- Keyboard: Tab qua card actions, Enter/Space toggle, `/` focus search, ESC đóng modal
- Live region cho search results (`aria-live="polite"`)
- Empty states: chưa có sách, không tìm thấy, đã tháo hết

## 7. Responsive Rules

| Breakpoint | Grid | Header | Filter |
|------------|------|--------|--------|
| 375px | 1 col | stack, brand + hamburger stats | pills scroll x |
| 768px | 2 cols | row, stats compact | wrap |
| 1280px | 3 cols | row full | row |

## 8. API cho AI (cả hai)

### A. REST / window (cho mọi AI gọi fetch)

```js
// Trong browser, AI có thể:
await fetch('/library/api/search?q=điều khoản thanh toán&top_k=5').then(r=>r.json())
// Hoặc:
window.LibrarySearch.search("điều khoản thanh toán", { top_k: 5, enabledOnly: true })
// → [{ bookId, bookName, chunkId, text, snippet, score, page }]
window.LibrarySearch.listBooks() // → registry array
window.LibrarySearch.getStatus() // → { total, enabled, read, chunks }
```

Implement: `library/api.js` là static JSON + JS wrapper đọc cùng localStorage/IndexedDB. Không cần server — AI chạy trong cùng origin (VS Code webview, browser) gọi được. Nếu AI ngoài browser, đọc `library/export.json` (export registry + chunks).

### B. MCP (cho Copilot/Claude Code)

- File: `library/mcp-server.mjs` (Node, stdio)
- Tool: `search_library` (query, top_k, enabled_only), `list_books`, `get_book`
- Đọc `library/export.json` (do UI export tự động sau mỗi thay đổi)
- Cài: thêm vào `mcp.json` → `"library": { "command": "node", "args": ["./www/library/mcp-server.mjs"] }`

## 9. File Map

```
www/library/
├── index.html      # 1 trang: hero + search + upload + filter + grid + results + modal
├── styles.css      # Design system + responsive + states + animation
├── app.js          # Registry + parser + chunk + BM25 + search + UI + API
├── api.js          # Wrapper cho AI (optional, có thể gộp vào app.js)
└── mcp-server.mjs  # MCP stdio server (Node)
www/library/export.json  # Auto-generated, gitignored, cho MCP đọc
```

## 10. Polish Checklist

- [ ] Spacing 4/8, radius, shadow đúng token
- [ ] Responsive 375/768/1280 không vỡ, không scroll ngang
- [ ] Hover/focus/active/disabled/loading đủ
- [ ] Empty/error/loading states
- [ ] Animation 150-300ms, không giật
- [ ] A11y: contrast, keyboard, aria, skip-link, focus-visible
- [ ] Toast + confirm modal đúng KN-001 (ESC + focus trap)
- [ ] Search highlight + citation rõ

---

*Design này là input cho Plan + Implement. Mọi thay đổi phải update lại đây.*
