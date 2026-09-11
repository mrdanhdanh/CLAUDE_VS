# PRD — Self-Improving Distillation Round 2 (KN-033 → KN-036)

> Who did you think with?: Critic framing (đối lập): "6 papers có đủ giá trị thành 4 KN mới không, hay 2 KN gộp là đủ? Nguy cơ trùng KN-025/026/027 (round 1)." — Quyết định: gộp theo 4 cụm chủ đề riêng biệt (RSI roadmap / failure diagnosis / negative learning / harness design patterns) — mỗi cụm có Cách phòng tránh khác nhau, không trùng lặp; giữ 4 KN. Human duyệt "quất luôn".
> Cosmic-Quantum: Macro hệ thống tự học vòng 2 — bổ sung 4 trục tri thức (RSI/failure-diagnosis/negative-learning/harness-design) · Micro 6 papers → 4 KN + 6 library books · Entanglement `docs/knowleged.md` ↔ skill `harness-process` ↔ `www/status.json` ↔ `README.md`
> Persistence: `books/papers/*.md` + `www/library/export.json` (local, gitignore) + `docs/knowleged.md` (repo, commit) · F5: giữ (file) · Scope: repo + library local

## Vision

Hút 6 papers mới (2026-09-09/10) từ `ai-news` vào long-term memory — biến tin tức thành bài học áp dụng được (Cách phòng tránh cụ thể), đóng vòng: fetch → distill KN → skill (`harness-process`) → STATUS.

## User Stories

- P0: Là agent, tôi search find KN-033→036 khi task chạm self-improving/failure-diagnosis/uncertainty/harness-design.
- P0: Là thư viện, 6 papers có trong export.json để MCP `search_library` ground được về sau.
- P1: Là STATUS dashboard, `learn.knTotal` phản ánh 36 KN sau regenerate.

## Scope In / Out

- In: 6 papers → KN-033/034/035/036 (bảng + chi tiết + anti-patterns + checklist + UpdatedAt); ingest library; fix 3 dòng checklist hỏng (merge lỗi cũ trong `knowleged.md`).
- Out (CẮT — YAGNI): không thêm script/seam mới (khác round 1 — đây là knowledge, không phải capability); không sửa `policy.json`; không đụng test files (KN-012); 5 HN articles không distill (tin sản phẩm, giá trị bài học thấp).

## Metrics

- `distill-agnostic.mjs` parse + verify 4 KN mới (G-accepted, không warning tags).
- `generate-status.mjs` → `learn.knTotal` 32 → 36, JSON valid.
- Checklist/anti-patterns cập nhật; 3 dòng hỏng được fix.
