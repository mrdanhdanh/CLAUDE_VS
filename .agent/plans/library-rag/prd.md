# PRD — Library RAG Local (Thư viện tháo lắp + Tìm siêu nhanh)

> **Slug:** `library-rag` · **Ngày:** 2026-08-29 · **Owner:** YUNIE · **Pipeline:** Harness v2

## 1. Vision

Biến tài liệu 1000 trang (PDF/DOC/TXT/MD) thành **thư viện tháo lắp như plugin** — sếp và AI đều tìm được nội dung trong <100ms, offline 100%, 0đ, không cần server.

- **Sếp (người):** Upload → tự chunk/index → search box gõ là ra, biết cuốn nào đã đọc, tháo/gắn được.
- **AI (model):** Gọi `search_library({query, top_k})` qua **REST API** (`fetch`) và **MCP tool** — trả về citation (sách, trang/chunk, score).

Triết lý: **Process > Model** — cùng pattern `harness-manager` (registry.json + .disabled/ + enable/disable).

## 2. User Stories

### P0 — Bắt buộc (MVP)

| ID | Role | Story | Acceptance |
|----|------|-------|------------|
| US-01 | Sếp | Upload PDF/DOC/TXT/MD (drag-drop + chọn file) | Hỗ trợ 4 loại, parse được text, báo lỗi nếu file hỏng |
| US-02 | Sếp | Xem danh sách sách với trạng thái | Mỗi sách hiện: tên, loại, số chunk, ngày thêm, `enabled/disabled`, `read/unread`, `progress %` |
| US-03 | Sếp | Tháo/gắn sách (enable/disable) | Disable = move vào `.disabled` logic (loại khỏi search), enable = gắn lại. Không xóa file |
| US-04 | Sếp | Đánh dấu đã đọc + tiến độ | Toggle `Đã đọc/Chưa đọc`, slider 0-100%, lưu localStorage |
| US-05 | Sếp | Tìm kiếm siêu nhanh | Gõ query → kết quả <100ms, highlight từ khóa, citation (sách + chunk + score), filter theo sách/enabled |
| US-06 | AI | Gọi search qua REST API | `GET /library/api/search?q=...&top_k=5` hoặc `window.LibrarySearch.search(q)` trả JSON |
| US-07 | AI | Gọi search qua MCP | MCP server `library-mcp` expose tool `search_library` cho Copilot/Claude Code |

### P1 — Nên có

| ID | Story | Acceptance |
|----|-------|------------|
| US-08 | Xóa sách | Xóa hẳn khỏi registry + IndexedDB, confirm dialog |
| US-09 | Export/Import registry | Export JSON để backup, import lại |
| US-10 | Semantic search (optional) | Toggle bật embedding local (Transformers.js MiniLM) nếu muốn, fallback BM25 nếu chưa load |
| US-11 | Thống kê | Tổng sách, đã đọc, đang gắn, tổng chunk |

### P2 — Nice to have (để sau)

- Phân trang kết quả, highlight trong PDF viewer, tag/category, full-text preview modal.

## 3. Scope

### In Scope (MVP)

- `www/library/` — 1 trang duy nhất: upload + list + search + detail
- Parser: PDF (pdf.js), DOCX (mammoth.js), TXT/MD (native)
- Chunking: 600 tokens/chunk, overlap 100, giữ header/paragraph boundary
- Index: **BM25 + TF-IDF** (instant, 0 model download) + optional semantic (Transformers.js lazy)
- Storage: `localStorage` (registry) + `IndexedDB` (vectors/chunks) — key `library:*`
- Search: BM25 ranking, highlight, citation, filter enabled/read
- Registry: `registry.json` shape như harness (enabled, read, progress, chunks, addedAt)
- API: `window.LibrarySearch` global + `fetch` wrapper
- MCP: `library/mcp-server.mjs` (Node, stdio) đọc cùng storage (export JSON)

### Out of Scope (Non-Goals)

- Không cần backend/server, không cần Weaviate/Supermemory cloud
- Không OCR cho PDF scan (chỉ text-based PDF)
- Không auth, không multi-user
- Không vector DB nặng (Qdrant/Pinecone) — local BM25 đủ cho 1000 trang

## 4. Non-Goals

- Không làm mobile app riêng — responsive web là đủ (375/768/1280)
- Không hỗ trợ .doc cũ (chỉ .docx), không .pptx

## 5. Metrics (Success)

| Metric | Target |
|--------|--------|
| Upload 1000 trang PDF → index xong | <10s (BM25), <3 phút nếu bật semantic |
| Search latency (500 chunks) | <100ms (BM25), <300ms (semantic) |
| Search recall (keyword) | Top 5 chứa đáp án với query chính xác |
| Tháo/gắn | <200ms, không reload |
| Lighthouse a11y | ≥95 |
| Build errors | 0 |

## 6. Constraints

- **Local 0đ:** Không gọi API ngoài, không cần key, offline sau khi load CDN (pdf.js, mammoth)
- **Static site:** `www/` là root GitHub Pages — chỉ HTML/CSS/JS, không server
- **Product quality:** Design system, responsive 375/768/1280, states, animation 150-300ms, a11y ≥4.5:1
- **Locale:** Tiếng Việt, không hardcode text lẻ — dùng `t()` dict

## 7. Open Questions → Assumptions Chốt

| Q | Assumption |
|---|------------|
| PDF scan không có text? | Báo "PDF này là scan, cần OCR — chưa hỗ trợ", vẫn lưu meta |
| DOC là .doc cũ? | Báo "Chỉ hỗ trợ .docx, vui lòng Save As .docx" |
| Model embedding nặng? | Lazy load, default OFF, user bật mới tải (~25MB MiniLM) |
| MCP chạy ở đâu? | File `library/mcp-server.mjs` chạy bằng `node`, đọc `library/export.json` |

## 8. Risks

| Risk | Mitigation |
|------|------------|
| pdf.js CDN fail offline | Bundle fallback + báo lỗi rõ |
| IndexedDB quota đầy | Cảnh báo khi >80%, cho xóa sách |
| Chunk quá lớn → miss | Overlap 100 + giữ paragraph boundary |
| Search chậm với 10k chunk | BM25 + debounce 150ms + Web Worker nếu cần |

---

*PRD này là source cho Design + Plan. Mọi thay đổi phải update lại đây.*
