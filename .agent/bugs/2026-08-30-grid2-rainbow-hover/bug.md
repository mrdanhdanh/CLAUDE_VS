# Bug — grid-2 spacing + rainbow border không xoay khi hover

- **Date:** 2026-08-30
- **Severity:** minor
- **Report:** YUNIE / fixbug
- **Tags:** `ui` `css` `animation` `spacing`

## Reproduce

1. Mở `www/index.html` (hoặc `npx serve www`).
2. **Spacing:** Quan sát phần `Presets + Plans` (`<div class="grid-2">`) và `Health + Pages` (`<div class="grid-2">`). Khoảng cách phía trên 2 khối này ~48px, trong khi mọi `.section` khác chỉ 24px → lệch nhịp, trông "dính" hoặc thưa bất thường so với phần phía trên.
3. **Rainbow:** Di chuột vào `.hero-card` / `.card` / `.stat` / `.yunie-hero` / `.yunie-letter-card`. Viền cầu vồng hiện ra (opacity 1) nhưng **đứng yên, không xoay** dù animation `rainbow-rotate` được bật (`animation-play-state:running`).

- **Expected:** (a) grid-2 cách phần trên đúng 24px như các section; (b) viền rainbow xoay mượt 3s khi hover.
- **Actual:** (a) grid-2 thừa/thiếu khoảng cách do margin kép; (b) viền hiện nhưng tĩnh.

## Root Cause (5 Whys)

- **Why 1:** Viền rainbow không xoay khi hover.
- **Why 2:** `::before`/`::after` dùng `background:var(--rainbow)` mà `--rainbow` định nghĩa tại `:root` là `conic-gradient(from var(--angle), ...)`.
- **Why 3:** Khi `--angle` thay đổi (animation), một số engine không re-resolve `var(--angle)` nằm trong custom property lồng (`--rainbow`) → `::before` giữ giá trị tĩnh 0deg.
- **Why 4:** Đây là anti-pattern KN-003 (animate custom property qua biến lồng `var()` chứa `var()`).
- **Why 5 (Root):** `www/styles.css` lặp lại lỗi KN-003 — dùng `background:var(--rainbow)` thay vì gradient conic trực tiếp tại `::before`/`::after`.

- **Spacing Why:** `.grid-2` không có `margin`, trong khi `.section` con có `margin:24px 0`. Vì grid item không collapse margin, khoảng cách giữa section trên và nội dung grid-2 = 24px (section trên) + 24px (section con) = 48px → lệch nhịp 24px chuẩn.

- **Hypothesis (đã xác thực):** (1) Thay `background:var(--rainbow)` → `background:conic-gradient(from var(--angle,0deg), ...)` trực tiếp tại `::before`/`::after` → `--angle` resolve tại chỗ, xoay được. (2) Thêm `margin:24px 0` cho `.grid-2` và `margin:0` cho `.grid-2 > .section` → nhịp 24px đồng nhất.

## Fix

- `www/styles.css`:
  - `.grid-2{display:grid;gap:16px;margin:24px 0}` (thêm `margin:24px 0`).
  - Thêm `.grid-2 > .section{margin:0}` để tránh margin kép.
  - Rule `::before` (line ~734) và `::after` (line ~748): đổi `background:var(--rainbow)` → `background:conic-gradient(from var(--angle,0deg), #ff3b30, #ff9500, #ffcc02, #34c759, #007aff, #af52de, #ff3b30)`.

## Verification

- `npx serve www` → kiểm tra grid-2 cách phần trên 24px (đồng nhất).
- Hover `.hero-card`/`.card`/`.yunie-hero` → viền rainbow xoay mượt 3s.
- `get_errors` không lỗi; responsive 375/768/1280 không vỡ.
- Regression: các section khác giữ 24px; rainbow vẫn ẩn (opacity 0) khi chưa hover.

## Lesson

Animate custom property phải dùng giá trị trực tiếp tại property đích (KN-003) — đừng lặp lại lỗi `var(--rainbow)` lồng; và wrapper grid phải tự mang margin thay để grid item margin kép.

## Prevention

- Checklist CSS: animate `--angle` → luôn `background:conic-gradient(from var(--angle), ...)` trực tiếp, không qua `--rainbow`.
- Wrapper `.grid-2` luôn có `margin` riêng, con `.section` đặt `margin:0` để tránh doubling.

## Related KN

- KN-003 (rainbow nested var) — cùng root cause, khác file (`www/styles.css` thay vì `www/glassui/styles.css`).

## Tags

`ui` `css` `animation` `spacing`
