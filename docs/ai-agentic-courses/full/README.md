# 📚 Corpus đầy đủ — AI Agentic Courses (cho RAG + đọc offline)

> **Nguyên tắc:** nội dung **verbatim** (nguyên văn) từ nguồn gốc — không tóm tắt, không cắt gọt — để dùng làm tài liệu tham khảo/RAG **không cần fetch lại**.
> **Tải ngày:** 2026-09-12 · **Công cụ:** `scripts/fetch-agentic-courses.mjs` (Node 18+, 0 deps, re-runnable)

## 1. Có gì trong này (3 repo công khai — tải toàn bộ)

| Folder | Nguồn gốc | License | Files | Dung lượng | Nội dung |
|--------|-----------|---------|-------|------------|----------|
| `microsoft-ai-agents-for-beginners/` | https://github.com/microsoft/ai-agents-for-beginners | MIT | 23 | 389.3 KB | 19 lesson READMEs (00–18) **nguyên văn** + README + STUDY_GUIDE + AGENTS.md |
| `huggingface-agents-course/` | https://github.com/huggingface/agents-course | Apache-2.0 | 78 | 460.3 KB | Toàn bộ `units/en/**` — unit0–unit4 + bonus-unit1/2/3 + communication (mdx→md) |
| `anthropic-courses-github/` | https://github.com/anthropics/courses | xem LICENSE (trong folder) | 99 | 1882.7 KB | 5 khóa: API fundamentals, prompt engineering, real-world prompting, prompt evaluations, **tool use** — README + notebook đã chuyển thành .md (bỏ outputs) |
| **TỔNG** | | | **200** | **~2.7 MB** | |

## 2. Snapshot trang web public (nguồn không có repo)

| Folder | Nguồn | Ghi chú |
|--------|-------|---------|
| `langchain-academy/` | academy.langchain.com (8 khóa) | Curriculum + mô tả từng khóa — phần công khai đầy đủ nhất có thể |
| `aws-skill-builder/` | skillbuilder.aws (5 khóa/plan AI) | Mô tả, objectives, thời lượng, level, rating |
| `google-skills/` | skills.google (path + activities) | 6 activities của path multi-agent + path liên quan |

## 3. Truy xuất nguồn từng file (provenance)

- `_manifest.json` — ghi **từng đường dẫn file gốc trong repo** + repo/branch/URL + số liệu. Ví dụ muốn biết `unit1/introduction.md` từ đâu → tra `paths` trong manifest.
- Mỗi file giữ nguyên **đường dẫn tương đối như trong repo gốc** → dễ đối chiếu ngược.

## 4. Tải lại / cập nhật

```bash
node scripts/fetch-agentic-courses.mjs            # tải, bỏ qua file đã có (idempotent)
node scripts/fetch-agentic-courses.mjs --force    # tải lại toàn bộ (lấy bản mới nhất)
node scripts/fetch-agentic-courses.mjs --only huggingface-agents-course
node scripts/fetch-agentic-courses.mjs --list     # xem danh sách file sẽ tải
```

## 5. Dùng cho RAG (www/library) — ĐÃ NẠP ✅

- **Nạp hàng loạt** (đã chạy 2026-09-12: **190 sách · 1.611 chunks**, 0.6s):
  ```bash
  node scripts/library-ingest-batch.mjs                 # nạp docs/ai-agentic-courses/full (idempotent — chạy lại = skip)
  node scripts/library-ingest-batch.mjs --dry-run       # xem kế hoạch, không ghi
  node scripts/library-ingest-batch.mjs --replace       # corpus cập nhật → xóa bản cũ + nạp đè
  node scripts/library-ingest-batch.mjs --limit 10      # test nhanh 10 file
  ```
  Đặc điểm: 1 backup `library-export-*-pre-batch.json` trước khi ghi · 1 write duy nhất · validate JSON sau ghi · dedupe theo tên sách.
- **Nạp từng file** (script gốc): `node scripts/library-ingest.mjs <file.md|pdf> --name "Tên sách"`.
- **Verify qua MCP** (đúng lớp API — không đọc export.json trực tiếp): `node scripts/mcp-query.mjs --status` hoặc `--q "ReAct"`.
- Corpus **chunk-friendly**: mỗi file một chủ đề, markdown thuần, không outputs/JSON thừa.

## 6. Giới hạn đã biết (trung thực)

- **Không tải được (bản chất nền tảng):** Skilljar/DLAI video lessons, Coursera/Udemy/Maven (paywall), OpenAI Academy events, Google/AWS lab environments — cần login/mua mới xem.
- **Berkeley MOOC:** video + slides nằm Google Drive/YouTube — syllabus đầy đủ đã lưu ở file nguồn cha (`../berkeley-llm-agents-mooc.md`).
- **Code samples Microsoft/HF:** nằm trong repo (notebooks) — script chỉ tải phần **text đọc**; muốn chạy code thì clone repo (link trong manifest).
- Nội dung là **bản gốc tại thời điểm 2026-09-12** — khóa học cập nhật thì chạy lại `--force`.

---
*Sinh bởi YUNIE — Harness v2 · script: `scripts/fetch-agentic-courses.mjs` · manifest: `_manifest.json`*
