# Thư Viện RAG Local — Tháo lắp · Tìm siêu nhanh

> **Local 0đ · Offline 100% · Cho cả người và AI**

Upload **PDF / DOCX / TXT / MD** (kể cả 1000 trang) → tự chia chunk (600 tokens, overlap 100) → **BM25** tìm trong **<100ms**. Tháo ra là AI không thấy, gắn vào là tìm được ngay.

## Dùng cho người

1. Mở `www/library/index.html` (hoặc `https://<user>.github.io/<repo>/library/`)
2. Kéo thả file vào vùng upload
3. Gõ vào ô tìm kiếm → kết quả có highlight + citation (sách · chunk · score)
4. **Tháo/Gắn**: nút 🧩 Tháo / ✓ Gắn — tháo = loại khỏi search (không xóa)
5. **Đã đọc**: toggle + slider tiến độ 0-100%
6. **Lọc**: Tất cả / Đang gắn / Đã tháo / Đã đọc / Chưa đọc + sắp xếp

Dữ liệu lưu: `localStorage` (`library:registry`) + `IndexedDB` (`libraryDB` chunks) — không gửi đi đâu.

## Dùng cho AI — 2 cách

### A. Trong browser (mọi AI, Copilot Chat, webview)

```js
// Trong console hoặc AI webview cùng origin
await window.LibrarySearch.search("điều khoản thanh toán", {top_k: 5})
// → [{bookName, chunkId, index, page, text, snippet, score}]

window.LibrarySearch.listBooks()   // → [{id, name, type, enabled, read, progress, chunks}]
window.LibrarySearch.getStatus()   // → {total, enabled, read, chunks, enabledChunks}
```

### B. MCP cho VS Code / Claude Code

1. Mở `www/library/index.html` → bấm **Xuất** → tạo `export.json` (chứa registry + chunks)
2. Thêm vào `.vscode/mcp.json`:

```json
{
  "servers": {
    "library": {
      "command": "node",
      "args": ["./www/library/mcp-server.mjs"]
    }
  }
}
```

3. AI gọi tools:
   - `search_library({query, top_k, enabled_only})`
   - `list_books()`
   - `get_book({id, include_chunks})`
   - `get_status()`

Hoặc chỉ định file:

```json
{ "command": "node", "args": ["./www/library/mcp-server.mjs", "--file", "./www/library/export.json"] }
```

## Kiến trúc

```
Upload → Parser (pdf.js / mammoth / text) → Chunk (2400 chars, overlap 400)
→ Registry (localStorage) + Chunks (IndexedDB) → BM25 index (in-memory)
→ Search (<100ms) → highlight + citation
→ API (window.LibrarySearch) + MCP (mcp-server.mjs đọc export.json)
```

- **BM25**: k1=1.2, b=0.75, chỉ trên sách `enabled`
- **Chunk**: giữ paragraph boundary, overlap để không miss
- **Tháo**: `enabled=false` → loại khỏi index, không xóa chunks (gắn lại instant)
- **Xóa**: confirm modal (ESC + focus trap) → xóa IndexedDB

## Hỗ trợ file

| Loại | Cách đọc | Lưu ý |
|------|----------|-------|
| PDF | pdf.js | Chỉ PDF có text, scan chưa hỗ trợ OCR |
| DOCX | mammoth.js | .doc cũ phải Save As .docx |
| TXT | FileReader | UTF-8 |
| MD | FileReader | Giữ nguyên markdown |

## Export / Import

- **Xuất**: nút Xuất → tải `library-export-YYYY-MM-DD.json` (registry + chunks) — dùng cho backup và MCP
- **Nhập**: nút Nhập → chọn file JSON đã xuất → merge vào thư viện

## Phím tắt

- `/` → focus ô tìm kiếm
- `ESC` → xóa query / đóng modal
- `Enter` trên upload zone → chọn file

## Giới hạn

- Tối đa ~50MB/file (tránh treo browser)
- PDF scan (ảnh) chưa OCR — sẽ báo lỗi rõ
- Không cần server, không cần API key, offline sau khi CDN pdf.js/mammoth đã cache
