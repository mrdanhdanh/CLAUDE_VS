# PRD mini — N5 Static Polish

## Vấn đề (Explore)
Soi kỹ 7 trang `www/n5-blazor/` ở 375/768/1280 + light/dark, phát hiện 18 lỗi nhóm:
1. Global: `.theme-toggle` chưa style, `.select{composes}` sai CSS, thiếu `prefers-reduced-motion`, drawer panel hardcode dark, topbar badges chật mobile, footer border tàng hình light, `@import` font trùng.
2. Hero/pill/formation hardcode `#a5b4fc` → contrast fail light theme.
3. Technique cards inline `rgba(255,255,255,0.04)` → tàng hình light.
4. Stats: chỉ Kana bọc rainbow (lệch), ring chữ 22px cố định → tràn ở size 64.
5. Kana modal thiếu `role=dialog`, empty thiếu nút xóa lọc.
6. Vocab topic/type hiện tiếng Anh, `td{display:flex}` sai table, toggle thiếu `aria-pressed`.
7. Grammar mini-exercise `!!input.trim()` → gõ gì cũng đúng.
8. Practice timer re-render header mỗi giây (mất focus nút Thoát), `alert()` thô, count 20 nhưng pool kana chỉ 4 câu, dots hardcode `#86efac`.
9. Progress week labels T2-CN cố định nhưng days rolling → sai, scores `v*10` sai thang 20 câu, bookmarks hiện raw key, export dùng `unescape` deprecated.

## Scope
- GIỮ: layout sidebar/topbar, data 92/36/40/15/20, localStorage key, speechSynthesis.
- CẮT (YAGNI): không tách layout JS chung, không thêm dep, không viết lại flip CSS, không thêm trang mới.
- SỬA: `app.css` + `site.js` + 7 HTML (tối thiểu, đúng chỗ).

## Persistence · F5 · Scope
`Persistence: localStorage n5-progress · F5: giữ · Scope: per-browser` — không đổi.

## Verify
- Mở 7 trang, toggle light/dark, 375/768/1280 không vỡ.
- Modal ESC + click ngoài, quiz/practice/submit, export/reset.
- `get_errors` sạch.
