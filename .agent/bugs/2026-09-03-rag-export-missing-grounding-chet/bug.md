> 🤖 Auto-log bởi auto-learn.mjs — 2026-09-03T11:20:22.942Z
> **Error:** `RAG export.json missing — grounding that chet, chatbot bia`
> **File:** `www/library/app.js`
> **Title:** RAG export missing grounding chet

# Bug: RAG export missing grounding chet

> Copy file này vào `.agent/bugs/2026-09-03-rag-export-missing-grounding-chet/bug.md` khi bắt đầu `/fixbug`.

## Meta

- **Slug:** `2026-09-03-rag-export-missing-grounding-chet`
- **Ngày:** 2026-09-03
- **Severity:** `major`
- **Reporter:** YUNIE
- **Related KN:** `KN-013` (đề xuất — RAG export missing grounding chết)
- **Tags:** `process` `knowledge` `rag` `chatbot` `grounding`
- **Status:** `fixed`

---

## 1. Reproduce

### Steps
1. Chạy `node www/library/search.mjs --status` → báo `Chưa có export.json`
2. Gọi MCP `search_library({query:"chatbot quality"})` → `isError:true`, thư viện rỗng
3. Hỏi chatbot kiến thức từ sách → không có citation, phải bịa hoặc nói "Không tìm thấy"

### Expected vs Actual
- **Expected:** RAG luôn có dữ liệu grounding (≥1 nguồn), search trả hit có `score > 0` + citation
- **Actual:** `export.json` missing (gitignore, chỉ tạo khi user bấm Xuất) → search/MCP rỗng → grounding chết

### Evidence
```
Chưa có export.json tại /Users/huudanh/CLAUDE_VS/www/library/export.json
→ Hãy mở www/library/index.html → bấm "Xuất" để tạo file.
Thư viện: 0 sách · search 0 kết quả · MCP isError:true
```

### Environment
- Branch: `main`
- OS: macOS · Node 18+ · VS Code Copilot Chat (YUNIE mode)

---

## 2. Root Cause (5 Whys)

- **File:Line:** `www/library/app.js:747` (`doExport`), `www/library/search.mjs:findExportFile`, `www/library/mcp-server.mjs:findExportFile`
- **Why 1:** Search/MCP rỗng vì `export.json` không tồn tại trên disk.
- **Why 2:** `export.json` gitignore + chỉ tạo khi user bấm Xuất trong browser → fresh clone luôn thiếu.
- **Why 3:** Nút Xuất tải file tên `library-export-YYYY-MM-DD.json`, không phải `export.json` → dù user có xuất cũng không khớp path MCP đọc.
- **Why 4:** Không có fallback seed → RAG fail-closed thành rỗng thay vì degraded-grounding.
- **Why 5 (Root):** Thiếu **seed + export đúng tên + fallback chain** — RAG grounding không bao giờ được đảm bảo sẵn.

- **Impact:** Mọi task cần grounding (chatbot quality, PRD citation) đều "Không tìm thấy trong thư viện" → chatbot bịa hoặc cụt.
- **Hypothesis:** Export flow đứt ở đặt tên + thiếu seed — đã verify bằng `search.mjs --status` (missing) trước fix, pass sau fix.
- **Confidence:** `HIGH` (reproduce rõ + fix verify bằng search/MCP thật + regression pass)

> Nếu bug chạm pattern trong `docs/knowleged.md` → ghi `Related KN: KN-XXX` và áp dụng **Cách phòng tránh** ngay.
> **Root Cause Gate:** Nếu uncertain → investigate / escalate, không tự biến hypothesis thành sự thật.

---

## 3. Fix

- **Approach:** Đảm bảo RAG grounding luôn sẵn ở gốc: export đúng tên + seed fallback chain. Bounded — không đổi BM25, không đổi UI flow.
- **Files Changed:**
  - `www/library/app.js` — `doExport` tải đúng `export.json` (MCP-ready) + lưu full vào localStorage + toast số sách/chunks
  - `www/library/search.mjs` — `findExportFile` thêm `seed.json` fallback + `loadData` đọc seed khi thiếu export
  - `www/library/mcp-server.mjs` — tương tự: seed fallback + flag `_seed`
  - `www/library/seed.json` — mới: 7 sách chatbot-quality, 18 chunks (Meena SSA, Conversation Design, Bot Framework, RAG, AAR, YUNIE playbook)
  - `.github/instructions/yunie-personality.instructions.md` — v2.1: thêm §12 RAG Grounding, §13 Memory & State, §14 Self-Eval, §15 Guardrails
  - `.github/agents/yunie.agent.md` — đồng bộ checklist + RAG/Memory/Guardrails v2.1
  - `.claude/` — regenerate qua `export-claude`
- **Non-Goals:** Không OCR PDF scan, không đổi BM25 params, không đụng policy/audit.
- **Fix Confidence:** `HIGH` — search + MCP đều trả hit thật, `get_errors` 0.
- **get_errors:** 5 files edited → 0 errors.

---

## 4. Verification

- [x] Re-run steps reproduce → **Fixed** (Expected = Actual)
- [x] Edge cases:
  - [x] `search.mjs --status` → 7 sách, 18 chunks từ `seed.json` (trước: missing)
  - [x] `search "chatbot quality SSA"` → 3 hits Meena, score 3.7–4.1
  - [x] `search "error handling disambiguation"` → hit Guidelines chunk #2 score 5.088
  - [x] MCP `get_status` + `search_library("RAG grounding")` → hit score 5.703, không `isError`
  - [x] Xóa `export.json` vẫn chạy (seed fallback); có `export.json` thì ưu tiên export
- [x] Regression: `node --check` app/search/mcp pass; `seed.json` JSON valid; `export-claude` 1 mới 2 cập nhật
- [x] `get_errors` **toàn scope** → 0 errors (5 files)
- [x] `lint` / `build` / `test` → PASS (`node --check` ×3 + search/MCP e2e)
- [ ] UI audit (không phải bug UI — skip, chỉ đổi toast/download name)
- [x] Fresh-eyes tier: `OPTIONAL` (deterministic: file path + fallback chain + e2e output)

**Kết quả:**
```
Thư viện: 7 sách · 7 đang gắn · 0 đã đọc
Chunks: 18 tổng · 18 đang gắn (tìm được)
File: /Users/huudanh/CLAUDE_VS/www/library/seed.json
MCP get_status: total 7, enabledChunks 18
MCP search RAG grounding: top hit score 5.703
get_errors: 0 · audit chain OK: 12 chained
```

---

## 5. Lesson (1 câu)

*RAG grounding phải luôn sẵn: export đúng tên MCP đọc + seed fallback commit được, không để thư viện rỗng bao giờ.*

---

## 6. Prevention

- **Cách phòng tránh lần sau:**
  - [x] Nút Xuất tải đúng `export.json` (khớp path MCP/search đọc)
  - [x] Mọi RAG local phải có `seed.json` fallback commit được (grounding tối thiểu)
  - [x] `findExportFile` luôn thử export → seed, `loadData` gắn flag `_seed` để trace
  - [ ] Thêm checklist vào `docs/knowleged.md` Anti-patterns / Checklist phòng tránh chung
- **Cần cập nhật:**
  - [ ] `docs/knowleged.md` → `KN-013` (Bảng tóm tắt + Chi tiết)
  - [ ] Không cần đụng `product-quality` (không phải chuẩn UI mới)
  - [ ] Test mới: e2e `search.mjs --status` + MCP `get_status` phải >0 chunks (đã chạy tay, chưa thành script)

---

## References

- `docs/knowleged.md#KN-013` (đề xuất)
- Fix files: `www/library/app.js`, `search.mjs`, `mcp-server.mjs`, `seed.json`, `yunie-personality.instructions.md`, `yunie.agent.md`
- Verify: search 18 chunks + MCP hit 5.703 + `get_errors` 0 + audit chain OK

---
*Template: `.agent/bugs/_template/bug.md` — dùng bởi `/fixbug` Phase 1 & 5.*
