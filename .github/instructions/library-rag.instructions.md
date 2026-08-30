---
description: "Thư viện RAG Local — cho /harness trích xuất thông tin từ sách (PDF/DOCX/TXT/MD) qua BM25. Use when harness needs to extract knowledge from library books, need to search library, need citation from documents, or task mentions sách/thư viện/tài liệu."
applyTo: "**"
---

# Library RAG — Harness trích xuất từ sách

> **Thư viện:** `www/library/` — Local 0đ, BM25 <100ms, tháo lắp như plugin. Sách lưu `localStorage` + `IndexedDB`, export ra `www/library/export.json` cho harness đọc.

## Khi nào áp dụng

- Task nhắc tới **sách, tài liệu, PDF, DOCX, thư viện, trích xuất, citation, kiến thức từ sách**
- User nói: `/harness làm X dựa trên sách Y trong thư viện`
- Cần **grounding** — không bịa, phải có nguồn từ sách

## Quy tắc cho harness (BẮT BUỘC ở phase Explore)

### 1. Kiểm tra thư viện có sách không

```bash
node www/library/search.mjs --status
node www/library/search.mjs --list
```

- Nếu `total: 0` hoặc `export.json` chưa có → báo user: **"Mở www/library/index.html → bấm Xuất để tạo export.json"** rồi mới tiếp tục.
- Nếu có sách nhưng `enabled: 0` → báo: **"Không có sách đang gắn — vào thư viện bấm Gắn"**.

### 2. Search trước khi code (Explore phase)

```bash
# Tìm kiến thức liên quan tới task
node www/library/search.mjs "từ khóa liên quan tới task" --top_k 5 --json
node www/library/search.mjs "điều khoản thanh toán chương 5" --top_k 5 --json
```

- **Top_k:** 5 là đủ cho PRD, 10 nếu task rộng.
- **Chỉ tìm trong sách đang gắn** (mặc định). Dùng `--all` nếu muốn cả sách đã tháo.
- **Kết quả:** `hits: [{bookName, chunkId, page, text, snippet, score}]` — dùng làm context cho PRD/Design/Implement.

### 3. Đưa vào PRD/Design/Plan

- **PRD:** Thêm section `## Nguồn từ thư viện` — liệt kê `bookName · chunk # · page · score` + snippet.
- **Design:** Nếu sách có spec/UI/kiến thức domain → trích vào design system.
- **Plan:** Ghi rõ `Dùng kiến thức từ: <bookName> chunk #<index> (score X)`.

### 4. Citation khi trả lời

Mọi thông tin lấy từ sách phải có citation:

```
Theo "Machine Learning - Andrew Ng" (chunk #42, trang 15, score 2.34):
> "Gradient descent cập nhật tham số theo hướng ngược gradient..."
```

### 5. Không bịa

- Nếu search **không ra** → nói rõ **"Không tìm thấy trong thư viện"**, không bịa.
- Nếu sách không liên quan → bỏ qua, không ép.

## CLI Reference

```bash
# Search (cho harness parse JSON)
node www/library/search.mjs "query" --top_k 5 --json
node www/library/search.mjs --query "query" --top_k 5 --json
node www/library/search.mjs "query" --all --json   # cả sách đã tháo

# List & Status
node www/library/search.mjs --list --json
node www/library/search.mjs --status --json

# Chỉ định file export
node www/library/search.mjs "query" --file ./www/library/export.json --json

# Help
node www/library/search.mjs --help
```

## API trong browser (nếu harness chạy trong webview)

```js
await window.LibrarySearch.search("điều khoản thanh toán", {top_k: 5})
window.LibrarySearch.listBooks()
window.LibrarySearch.getStatus()
```

## MCP (cho Copilot/Claude Code)

```json
// .vscode/mcp.json
{ "servers": { "library": { "command": "node", "args": ["./www/library/mcp-server.mjs"] } } }
// Tools: search_library, list_books, get_book, get_status
```

## Checklist cho agent (tự kiểm)

- [ ] Đã `node www/library/search.mjs --status` để biết thư viện có gì?
- [ ] Đã `search.mjs "keywords" --json` trước khi viết PRD?
- [ ] Đã ghi citation (bookName · chunk · page · score) vào PRD/Plan?
- [ ] Nếu không tìm thấy → đã báo rõ, không bịa?

## Liên kết

- Thư viện: `www/library/index.html` + `www/library/README.md`
- CLI: `www/library/search.mjs` + `www/library/mcp-server.mjs`
- Data: `www/library/export.json` (do UI nút Xuất tạo, gitignored)
- PRD: `.agent/plans/library-rag/prd.md`
