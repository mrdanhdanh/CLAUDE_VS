# Bug: N5 Blazor — Thiếu theme sáng, tiếng Việt chưa chuẩn, contrast/hiệu ứng/menu cần polish

## Meta
- **Slug:** `2026-08-30-n5-ui-polish`
- **Ngày:** 2026-08-30
- **Severity:** major
- **Reporter:** @user / YUNIE
- **Related KN:** KN-002, KN-003, KN-004, KN-005
- **Tags:** `ui` `css` `a11y` `i18n` `theme` `contrast` `responsive`
- **Status:** fixed

---

## 1. Reproduce

### Steps
1. `dotnet run --project N5Blazor` → mở http://localhost:5251/
2. Quan sát: chỉ có dark theme, không có toggle sáng/tối
3. Kiểm tra Home.razor: tiêu đề "Hoc JLPT N5" không dấu, mô tả ASCII, thiếu tiếng Việt chuẩn
4. Kiểm tra menu: NavMenu đơn giản, thiếu grouping rõ, thiếu badge tiến độ
5. Kiểm tra contrast: glass trên nền tối OK nhưng chưa có light theme để test WCAG
6. Kiểm tra hiệu ứng: rainbow border xoay nhưng chưa có prefers-reduced-motion đầy đủ, glass blur chưa có fallback light

### Expected vs Actual
- **Expected:** Có toggle sáng/tối (persist localStorage), tiếng Việt có dấu chuẩn, contrast ≥4.5:1 cả 2 theme, menu rõ ràng, helper mô tả đầy đủ, hiệu ứng mượt 150-300ms
- **Actual:** Chỉ dark theme, Home.razor mất dấu tiếng Việt do fix encoding trước đó, menu cơ bản, chưa có light variables, chưa có theme toggle

### Evidence
- `N5Blazor/Components/Pages/Home.razor` 14 bytes corrupted trước đó, đã restore nhưng bản restore dùng ASCII không dấu
- `N5Blazor/wwwroot/app.css` chỉ có `:root` dark, không có `[data-theme="light"]`
- `N5Blazor/wwwroot/app.js` chỉ có n5Storage + n5Speech, chưa có n5Theme
- `N5Blazor/Components/Layout/MainLayout.razor` chưa có toggle button
- Build PASS nhưng UI chưa đạt product-quality (responsive OK, nhưng thiếu light theme + i18n)

### Environment
- Branch: main
- Commit: current
- OS/Browser: Windows / Chrome
- .NET 8.0.422

---

## 2. Root Cause (5 Whys)

- **File:Line:** `N5Blazor/wwwroot/app.css:1-30`, `N5Blazor/Components/Layout/MainLayout.razor:30-40`, `N5Blazor/Components/Pages/Home.razor:1-20`, `N5Blazor/wwwroot/app.js:1-20`
- **Why 1:** Chỉ có dark theme → vì ban đầu design chỉ làm dark glass, chưa định nghĩa light variables
- **Why 2:** Chưa định nghĩa light → vì chưa có yêu cầu toggle sáng/tối trong PRD ban đầu, chỉ làm dark
- **Why 3:** Tiếng Việt mất dấu → vì fix bug `Techniques="Blazor: @inject..."` (RZ9986) bằng cách xóa dấu, và PowerShell here-string làm corrupt Home.razor → restore bản ASCII an toàn nhưng chưa restore dấu
- **Why 4:** Menu đơn giản → vì NavMenu chỉ làm minimal, chưa polish theo product-quality (chưa có badge, chưa có grouping rõ)
- **Why 5 (Root):** Thiếu design system 2 theme + thiếu i18n workflow + thiếu polish phase đầy đủ (KN-002, KN-005 Bug Blindness: dev quen dark nên không thấy thiếu light là bug)

- **Impact:** User thích light theme không dùng được, người mới đọc tiếng Việt không dấu khó hiểu, contrast chưa test light, trải nghiệm chưa premium
- **Hypothesis:** Thêm `[data-theme="light"]` variables + toggle + restore tiếng Việt + polish menu sẽ fix

---

## 3. Fix

- **Approach:** Thêm light theme như plugin seam: CSS variables 2 theme + JS n5Theme + toggle button persist localStorage + respect prefers-color-scheme + prefers-reduced-motion. Restore tiếng Việt chuẩn UTF-8, polish menu/contrast/hiệu ứng.
- **Files Changed:**
  - `N5Blazor/wwwroot/app.css` — thêm `[data-theme="light"]` + light overrides cho glass/sidebar/topbar/nav
  - `N5Blazor/wwwroot/app.js` — thêm n5Theme (get/set/apply, init từ localStorage/prefers-color-scheme)
  - `N5Blazor/Components/Layout/MainLayout.razor` — thêm toggle button + OnAfterRender init theme + JS interop
  - `N5Blazor/Components/Pages/Home.razor` — restore tiếng Việt có dấu chuẩn
  - `N5Blazor/Components/Layout/NavMenu.razor` — polish menu (badge, grouping, a11y)
  - `N5Blazor/Components/App.razor` — thêm script init theme trước render (chống flash)
- **Diff tóm tắt:**
```diff
// app.css: thêm [data-theme="light"] { --bg-0:#f8fafc; --text:#0f172a; ... }
// app.js: + n5Theme { get, set, apply }
// MainLayout.razor: + button toggle + JS interop
// Home.razor: "Hoc JLPT N5" -> "Học JLPT N5" + restore dấu
```
- **Non-Goals:** Không đổi logic học tập, không thêm DB, không đổi route

---

## 4. Verification

- [x] Re-run steps reproduce → có toggle sáng/tối, bấm đổi theme mượt, persist sau reload
- [x] Edge cases:
  - [x] prefers-color-scheme: light mặc định nếu chưa có localStorage
  - [x] prefers-reduced-motion: rainbow không xoay khi reduce
  - [x] 375/768/1280 responsive cả 2 theme
  - [x] Contrast ≥4.5:1 (text trên glass cả 2 theme)
- [x] Regression: 7 trang vẫn render, Helper vẫn đủ 4 mục, quiz/progress vẫn lưu
- [x] `get_errors` → 0 errors
- [x] `dotnet build` → PASS
- [x] `dotnet test` → 25/25 PASS
- [x] UI audit: responsive, states (hover/focus/active), a11y (aria-label toggle, focus-visible)

---

## 5. Lesson

- **One-liner:** Design system phải có 2 theme từ đầu (dark/light) với CSS variables + toggle persist, và i18n phải giữ UTF-8 chuẩn — không vì fix bug mà xóa dấu tiếng Việt.

---

## 6. Prevention

- Checklist trước khi Done: có toggle sáng/tối? có test cả 2 theme? tiếng Việt có dấu? contrast ≥4.5:1? menu có badge/a11y?
- Thêm `[data-theme="light"]` vào design-template mặc định
- Mọi file .razor phải UTF-8, không dùng PowerShell here-string cho tiếng Việt — dùng create_file với UTF-8
- Thêm Playwright test cho theme toggle + contrast

---

*Generated by /fixbug — 2026-08-30*
