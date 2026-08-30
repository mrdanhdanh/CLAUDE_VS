# Plan — Library RAG Local (www/library/)

> **Slug:** `library-rag` · **Ngày:** 2026-08-29 · **Owner:** YUNIE

## 1. Context

- **PRD:** `.agent/plans/library-rag/prd.md` — thư viện tháo lắp + tìm siêu nhanh, local 0đ, PDF/DOCX/TXT/MD, cả người + AI
- **Design:** `.agent/plans/library-rag/design.md` — palette, wireframe 375/768/1280, BM25, registry shape, API + MCP
- **Stack hiện tại:** `www/` là static GitHub Pages, đã có `index.html` + `styles.css` + `app.js` + `status.json`, 3 demos (focus-flow, todo-manager, glassui)
- **Pattern:** Bê nguyên `harness-manager` (registry.json + enable/disable + .disabled) sang `localStorage` + IndexedDB

## 2. File Changes

| File | Action | Mô tả |
|------|--------|-------|
| `www/library/index.html` | CREATE | 1 trang: hero + search sticky + upload zone + filter bar + book grid + results + modal + toast |
| `www/library/styles.css` | CREATE | Design system (kế thừa STATUS), responsive 375/768/1280, states, animation 150-300ms, a11y |
| `www/library/app.js` | CREATE | Registry + parser (pdf.js/mammoth) + chunk + BM25 + IndexedDB + UI + window.LibrarySearch API |
| `www/library/mcp-server.mjs` | CREATE | MCP stdio server, tools: search_library, list_books, get_book, đọc export.json |
| `www/library/README.md` | CREATE | Hướng dẫn cho AI + người |
| `www/status.json` | EDIT | Thêm `demos` entry cho library, update counts |
| `www/index.html` | EDIT | Thêm card/link tới `library/` trong demos section |
| `docs/capabilities.md` | EDIT | Thêm section Library RAG |
| `.gitignore` | EDIT | Thêm `www/library/export.json` nếu cần |

## 3. Architecture

```
www/library/
├── index.html      # Hero + search + upload + filter + grid + results
├── styles.css      # Tokens + layout + responsive + states
├── app.js          # All logic (registry, parser, chunk, BM25, UI, API)
└── mcp-server.mjs  # MCP server (Node stdio)

Storage:
- localStorage `library:registry` → { id: {id,name,type,enabled,read,progress,chunks,size,addedAt,pages} }
- IndexedDB `libraryDB` store `chunks` → {id, bookId, bookName, index, text, page}
- localStorage `library:export` → JSON export cho MCP (auto-sync)

BM25:
- k1=1.2, b=0.75, avgdl trên enabled books
- Tokenize: lowercase, split \W+, remove stopwords vi+en, keep 2+ chars
- Search chỉ trên enabled, debounce 150ms, highlight <mark>

Parser:
- PDF: pdf.js (CDN + fallback), getText per page, join
- DOCX: mammoth.js (CDN), extractRawText
- TXT/MD: FileReader.readAsText
- Chunk: 2400 chars (~600 tokens), overlap 400, split by \n\n then sentence

API:
- window.LibrarySearch = { search(q, opts), listBooks(), getBook(id), getStatus(), toggleEnable(id), toggleRead(id), setProgress(id, v) }
- fetch wrapper: nếu AI ngoài browser, đọc export.json
```

## 4. Todos (8 steps)

| # | Todo | Files | Est |
|---|------|-------|-----|
| 1 | Scaffold `www/library/` + `index.html` skeleton | index.html | 30m |
| 2 | Build `styles.css` design system + responsive | styles.css | 30m |
| 3 | Implement registry + IndexedDB + chunk + BM25 core | app.js (core) | 45m |
| 4 | Implement parser PDF/DOCX/TXT/MD + upload zone | app.js (parser) | 30m |
| 5 | Implement UI: grid, filter, search results, highlight, citation | app.js (UI) | 40m |
| 6 | Implement enable/disable, read/progress, delete, export/import | app.js (actions) | 25m |
| 7 | Implement `window.LibrarySearch` API + `mcp-server.mjs` | app.js + mcp-server.mjs | 25m |
| 8 | Polish + Verify + update STATUS | all + status.json + index.html | 30m |

## 5. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| pdf.js CDN fail | Try 2 CDNs + báo lỗi rõ, vẫn cho upload TXT/MD |
| mammoth CDN fail | Tương tự, fallback |
| IndexedDB quota | Check quota, cảnh báo, cho xóa |
| Chunk lớn miss | Overlap 400 + split by paragraph |
| Search chậm 10k chunk | BM25 in-memory + debounce + limit top 20 |
| XSS via file name | escapeHtml mọi render |

## 6. Verify Checklist

- [ ] Upload PDF/DOCX/TXT/MD → parse → chunk → hiện trong grid
- [ ] Tháo/gắn → loại/khôi phục khỏi search, không xóa chunks
- [ ] Đã đọc/progress → lưu, filter được
- [ ] Search <100ms, highlight, citation (sách · chunk # · score)
- [ ] Filter: Tất cả/Đang gắn/Đã tháo/Đã đọc/Chưa đọc + sort
- [ ] Xóa có confirm modal (ESC + focus trap + click outside)
- [ ] Export/import JSON
- [ ] `window.LibrarySearch.search()` gọi được từ console
- [ ] `mcp-server.mjs` chạy `node mcp-server.mjs` không lỗi
- [ ] Responsive 375/768/1280 không vỡ, không scroll ngang
- [ ] A11y: skip-link, aria, focus-visible, contrast, keyboard
- [ ] `get_errors` 0, `status.json` valid, link từ `www/index.html` tới `library/`

---

*Plan này là input cho Implement. Mỗi todo 1 in-progress, get_errors sau mỗi edit.*
