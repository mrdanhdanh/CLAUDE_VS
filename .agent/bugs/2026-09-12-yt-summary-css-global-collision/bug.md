# Bug: YT Summary — CSS toàn cục đè trang mới (bảng bị ẩn/cắt, [hidden] vô hiệu, card nấp dưới header)

## Meta

- **Slug:** `2026-09-12-yt-summary-css-global-collision`
- **Ngày:** 2026-09-12
- **Severity:** `major`
- **Reporter:** YUNIE (visual check phát hiện)
- **Related KN:** `KN-042`
- **Tags:** `ui` `css` `responsive` `a11y`
- **Status:** `fixed`

---

## 1. Reproduce

### Steps
1. Mở `www/yt-summary/index.html#demo-vector-db` ở **375px** → text mỗi dòng tóm tắt **bị cắt ngang** (không wrap hết câu); bảng 560px trong khung 303px.
2. Bấm mở 1 phần (accordion) ở 375px → detail transcript **luôn hiện** dù chưa bấm (các `tr.seg-detail[hidden]` vẫn hiển thị).
3. Cuộn vào `#result` (sau `scrollIntoView`) ở desktop → tiêu đề card **bị header cố định che**.

### Expected vs Actual
- **Expected:** card mobile wrap đủ text, detail ẩn tới khi bấm, card không nấp dưới header.
- **Actual:** 3 lỗi trên — đều do **rule toàn cục của `www/styles.css` đè trang mới**.

### Evidence
- `verify/shots/card-mobile.png` (trước fix — text cắt), desktop shot (title bị che).
- Đo: `.yt-table` computed `min-width: 560px` (từ `www/styles.css:448 table{...min-width:560px}`); `.yts-table-wrap` clientWidth 303.

---

## 2. Root Cause (5 Whys)

- Why1: Mobile text cắt → bảng rộng 560px, wrap tại 560 rồi bị `overflow-x:auto` cắt trong khung 303px.
- Why2: Trang dùng class **`.table-wrap`** nhưng `www/styles.css` có `@media (max-width:767px){ .table-wrap{display:none} }` (phục vụ bảng registry trang STATUS) → ban đầu bảng bị **ẩn hoàn toàn**, sau khi đổi tên thì lộ tiếp lỗi min-width.
- Why3: Rule toàn cục `table{min-width:560px}` (thiết kế cho bảng STATUS scroll ngang) áp lên **mọi** `<table>` của site → bảng card-layout mobile không thể co.
- Why4: Mobile CSS của trang đặt `.yt-table tr{display:block}` — **đè luôn `[hidden]`** (UA style `[hidden]{display:none}` specificity thấp hơn class) → detail rows luôn hiện.
- Why5 (Root): **Tái dùng tên class/element chung từ stylesheet toàn cục mà không namespace** + không assert invariant layout (không chỉ assert "không tràn trang" — tràn trong container scroll thì test mù).

---

## 3. Fix

- Đổi class trang → **`.yts-table-wrap`** (namespaced, không đụng global).
- `.yt-table { min-width: 0 }` — đè `table{min-width:560px}` (class > element).
- Mobile: `.yt-table tr[hidden] { display:none }` — khôi phục `[hidden]`.
- `scroll-margin-top: 72px` cho `.yts .section/.hero` (header cố định 56px).
- Test chống tái phát (red→green): `table.scrollWidth ≤ clientWidth`, `.seg-row` visible + height > 20px, `.seg-detail:not([hidden])` = 0, card `y ≥ 48px`.

## 4. Prevention

- Trang mới **không tái dùng tên class chung** (`.table-wrap`, `.card`…) khi chỉ muốn layout riêng → namespace `.yts-*`; trước khi dùng, **grep `www/styles.css`** tìm rule `display:none`/`min-width`/`hidden` trên tên đó.
- Rule mobile `display:block` cho `tr/td` phải kèm `[hidden]{display:none}`.
- Anchor scroll trong site có fixed header → luôn `scroll-margin-top` (pattern đã có ở cosmos — nay áp cả trang này).
- Test layout mobile phải assert **trong-contain er** (scrollWidth vs clientWidth), không chỉ `documentElement` overflow.

## 5. Links
- File: `www/yt-summary/styles.css`, `www/yt-summary/index.html`, `tests/e2e/yt-summary.spec.ts`
- KN: `docs/knowleged.md` KN-042
