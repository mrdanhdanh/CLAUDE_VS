# PRD mini — AI News: dịch mô tả ngắn sang tiếng Việt

> Task: 2026-09-13 · YUNIE · Feature nhỏ (1 file JS + 1 CSS + 1 spec)

## User story
Là người xem trang AI News, tôi muốn **mô tả ngắn (summary) của mỗi tin hiển thị tiếng Việt** để hiểu nhanh nội dung mà không cần đọc tiếng Anh — tiêu đề giữ nguyên bản gốc để đối chiếu/tìm kiếm.

## Scope
- **GIỮ:** dịch `summary` của mọi card (static JSON + curated + live fetch + kết quả search); cache theo id+hash; fallback EN khi fail; tooltip bản gốc; chip 🇻🇳 đánh dấu bản dịch.
- **CẮT (YAGNI):** dịch tiêu đề; nút toggle VI/EN; dịch server-side trong fetch.mjs; i18n framework; lưu vĩnh viễn vào repo.

## Nguồn dịch (đo thật 2026-09-13)
- `clients5.google.com/translate_a/t?client=dict-chrome-ex` — CORS `*` ✓ (đo), shape `[["text","en"]]`, sustain @ nhịp chậm → **primary**.
- `api.mymemory.translated.net` — CORS `*` ✓ (đo), quota ẩn danh ~5k ký tự/ngày/IP → **fallback** (KN-041).

## Persistence (static-site contract)
`Persistence: localStorage "ai-news-vi-v1" (id → {hash, vi}, cap 400) · F5: giữ · Scope: per-browser`

## Constraints
- No-key, 0 dep, chạy trên GitHub Pages; queue 1 request/lần + gap 1500ms (chống throttle burst — KN-041).
- Breaker theo host (2 fail → nghỉ, fail liên tiếp tăng); hết quota/cả 2 host chết → dừng + toast 1 lần, KHÔNG retry mù.
- Fail-open: dịch lỗi → giữ nguyên EN, không vỡ trang.

## Dissent Review
- **Who did you think with?** YUNIE tự phản biện: phương án rival = dịch sẵn trong `fetch.mjs` (CI). Lý do không chọn: CI runner IP dùng chung + quota 5k/ngày → dễ fail hàng loạt, và **không phủ live fetch/search** (kết quả chỉ tồn tại trên trình duyệt). Client-side phủ cả 4 đường (json/curated/live/search) + cache theo user.
- **Assumption lật:** "dịch free là dễ" — đã đo: gtx không CORS (loại), clients5 + MyMemory CORS ✓ nhưng đều có giới hạn thật → thiết kế quanh giới hạn (queue chậm + breaker + fallback), không giả định vô hạn.
