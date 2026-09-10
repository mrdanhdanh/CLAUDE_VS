> 🤖 Auto-log bởi auto-learn.mjs — 2026-09-10
> **Error:** `View ở VS Code không thấy hiệu ứng intro: Google Fonts stylesheet render-blocking + script-blocking chặn toàn bộ inline script cuối body → engine intro không execute đến khi fonts load xong (10-20s trên mạng chậm VN) → overlay đứng hình, dễ click nhầm rồi skip`
> **File:** `www/cosmos/index.html`
> **Title:** google-fonts-chan-script-intro-khong-hien

# Bug: google-fonts-chan-script-intro-khong-hien

## Meta

- **Slug:** `2026-09-10-google-fonts-chan-script-intro-khong-hien`
- **Ngày:** 2026-09-10
- **Severity:** `major`
- **Reporter:** sếp (user report: "up lên github đi, ko biết sao mà view ở vscode ko thấy hiệu ứng")
- **Related KN:** `KN-029`
- **Tags:** `ui` `perf` `font` `script-blocking` `verify`
- **Status:** `fixed`

---

## 1. Reproduce

### Steps
1. Mở `www/cosmos/index.html` trong VS Code (Simple Browser / Live Preview) — hoặc bất kỳ máy nào có Google Fonts chậm.
2. Quan sát 10-20s đầu sau khi load.

### Expected vs Actual
- **Expected:** Intro chạy ngay: singularity → Big Bang → title stagger → reveal sau 5s.
- **Actual:** Overlay đứng hình — nền đen + chỉ thấy nút "Bỏ qua" + progress bar 0%, **không có chữ** (chars do JS inject). Engine intro không chạy cho tới khi Google Fonts load xong (10-20s trên mạng chậm). Nếu user click trong lúc chờ (rất dễ xảy ra) → skip tức thì → "không thấy hiệu ứng gì cả".

### Evidence
- Session trước: Playwright first-run (không stub fonts) mất 19-30s/test vì `load` event đợi fonts — cùng nguyên nhân.
- Sau fix: test "fonts CDN treo vĩnh viễn → engine vẫn chạy" + screenshot `.agent/plans/cosmos-intro/verify/intro-1280-hung-fonts.png` (intro chạy full dù font treo).

### Environment
- OS/Browser: Windows / VS Code preview + Chromium; mạng VN → fonts.googleapis.com 10-20s.

---

## 2. Root Cause (5 Whys)

- **File:Line:** `www/cosmos/index.html` — `<link href="https://fonts.googleapis.com/..." rel="stylesheet">` trong `<head>`.
- **Why 1:** Engine intro (inline `<script>` cuối body) không execute trong 10-20s đầu.
- **Why 2:** Mọi inline script SAU một stylesheet chưa load xong đều bị **block** (spec: "a style sheet that is blocking scripts") — không chỉ render bị block.
- **Why 3:** Google Fonts `<link>` là external stylesheet blocking bình thường (không async) → trên mạng chậm nó giữ toàn bộ script của trang làm con tin.
- **Why 4:** Overlay gate (`intro-on`) chạy được (script trong head, đứng TRƯỚC link) nên user thấy màn đen đứng hình thay vì trang bình thường → tệ hơn cả không có intro.
- **Why 5 (Root):** Third-party CSS (fonts CDN) được nhúng theo cách blocking — đường tải trang bị khóa vào 1 CDN bên ngoài, không có fail-safe.

- **Impact:** 100% lượt xem `www/cosmos/` trên mạng chậm — intro "chết", và mọi JS của trang (starfield, labs, reveal) cũng trễ theo.
- **Confidence:** `HIGH` (reproduced bằng Playwright route treo + fix verified bằng regression test 9/9)

---

## 3. Fix

- **Approach:** (1) Fonts async: `media="print" onload="this.media='all'"` + `<noscript>` fallback → không block render + không block script; (2) Fail-safe 9s ở head gate: engine không chạy → tự mở nội dung; (3) Grace period 600ms cho click-anywhere (chống click nhầm khi vừa mở); (4) Dấu "·" vẽ bằng CSS circle (fallback font render thành ô vuông); (5) `window.__introOn = true` đặt ở CUỐI IIFE — mọi lỗi sớm hơn đều được fail-safe cứu.
- **Files Changed:**
  - `www/cosmos/index.html` — fonts async + fail-safe + grace + CSS dot
  - `tests/e2e/cosmos-intro.spec.ts` — +test "fonts treo → engine vẫn chạy", click test qua grace period
- **Diff tóm tắt:**
```diff
- <link href="...css2?family=Inter..." rel="stylesheet">
+ <link href="...css2?family=Inter..." rel="stylesheet" media="print" onload="this.media='all'">
+ <noscript><link href="...css2?family=Inter..." rel="stylesheet"></noscript>
+ setTimeout(function(){if(!window.__introOn)d.classList.remove('intro-on');},9000);   // head fail-safe
+ intro.addEventListener('click', ()=>{ if(performance.now()-startedAt<600) return; finish(true); });
+ .intro-char.dot::before{ ...border-radius:50%... }   // dot vẽ bằng CSS
```
- **Non-Goals:** Không self-host fonts (cân nhắc lại sau), không sửa các trang khác (cùng pattern nhưng ngoài scope).
- **Fix Confidence:** `HIGH`

---

## 4. Verification

- **Reproduce again:** Test "fonts CDN treo vĩnh viễn → engine vẫn chạy ngay" PASS (route treo fonts, engine vẫn inject chars + .play trong 3s). Trước fix scenario này treo vĩnh viễn.
- **Regression:** `npx playwright test tests/e2e/cosmos-intro.spec.ts` → **9/9 pass** (12.1s — nhanh hơn hẳn trước đây 15-40s do hết đợi fonts).
- **Visual:** `intro-1280-hung-fonts.png` — intro full effect dù fonts treo, dot vàng tròn đẹp.
- **Fresh evidence:** screenshot từng stage + test timing giảm chứng minh script không còn chờ CDN.

---

## 5. Learn

- **Bài học:** `<link rel=stylesheet>` third-party là **script-blocking** chứ không chỉ render-blocking — nó bắt TOÀN BỘ inline script phía sau làm con tin. Trang có overlay che nội dung + phụ thuộc engine JS = combo nguy hiểm trên mạng chậm.
- **KN đề xuất:** `KN-029`.
- **Anti-pattern:** Overlay che nội dung không fail-safe; third-party CSS blocking; click-anywhere skip không grace period; glyph phụ thuộc font cho chi tiết thiết kế.
