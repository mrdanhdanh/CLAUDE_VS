# PRD — Agentic Academy: giao diện SÁNG (light theme)

> Cosmic-Quantum: **Macro** — light là "pha vật chất" thứ 2 của cùng vũ trụ trang (1 hệ, 2 theme) · **Micro** — collapse palette từ tham chiếu Linear/Stripe light · **Entanglement** — `styles.css ↔ store.js ↔ index.html ↔ slides.html ↔ spec (test 9-10)`

## Why

User yêu cầu (2026-09-12): *"thêm 1 giao diện màu sáng"*. PRD gốc cắt light theme theo YAGNI — **user request đảo quyết định cắt đó** (đúng KN-006: design system phải có 2 theme từ đầu).

## Scope

- **THÊM:** toggle ☀/☾ ở header cả 2 trang · light palette đầy đủ (tokens + diagram SVG + code/table/chips/chú thích) · early-init chống flash · default theo hệ thống (`prefers-color-scheme`) · persist localStorage · test toggle/persist/contrast.
- **CẮT (YAGNI):** theme cho các trang khác (`www/` STATUS, cosmos...) — ngoài phạm vi · auto-đổi khi hệ thống đổi giữa chừng (chỉ đọc lúc load) · theme per-lesson.

## Persistence · F5 · Scope

`localStorage["agentic-academy:theme:v1"]` = `"light" | "dark"` · **F5: giữ** · **Scope: per-browser** (không sync thiết bị).

## Tiêu chí hoàn thành (rubric — viết trước)

1. Toggle đổi theme tức thì ở **cả 2 trang**; F5 giữ lựa chọn.
2. Chưa chọn → theo `prefers-color-scheme`; **không flash** (early init trong `<head>`, trước stylesheet).
3. Contrast text chính ≥ **4.5:1** ở light (đo bằng test JS); dark không đổi hành vi.
4. 0 pageerror / 0 response lỗi; toàn bộ test cũ vẫn xanh.
5. Visual: screenshot light home (1280) + light deck + dark home (qua toggle).

## Dissent Review (KN-018)

- **Who did you think with?** — Framing đối lập: *"sao không chuyển hẳn sang light-only?"* → dark là bản sắc gốc (VoltAgent vibe, screenshot đã ship); light là **thêm**, không thay. Toggle + system-default phủ cả 2 nhóm người dùng, revert bằng 1 nút nếu sai.
- **Assumption có thể sai:** "user muốn nút bấm" — có thể chỉ muốn theme sáng tự động. Giải pháp phủ cả hai: mặc định theo hệ thống, muốn cố định thì bấm 1 lần.
- **Rủi ro kỹ thuật:** hardcoded `rgba(255,255,255,…)` rải rác trong CSS → light sẽ "tàng hình" nếu chỉ override tokens. Đối sách: refactor các literal lặp thành token (`--card-grad`, `--track`, `--link`) + block override tường minh cho diagram/chips/toast, và **test contrast bằng công thức WCAG** thay vì nhìn mắt (KN-023).
