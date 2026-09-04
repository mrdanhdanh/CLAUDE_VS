# Evidence — harness-web-ui (DisCo arXiv:2609.02749v1 §3.2 (task-agnostic))

> Substrate layer của skill — full text từ docs/knowleged.md. Sinh tự động 2026-09-04T09:13:35.830Z.

## Bug reports liên quan (5/11 bugs)

- `.agent/bugs/2026-08-29-rainbow-animated/bug.md` — Bug: Rainbow border không xoay (animated)
- `.agent/bugs/2026-08-29-status-ui/bug.md` — Bug: Trang STATUS www/ giao diện chưa hợp lý — layout, responsive, registry render sai
- `.agent/bugs/2026-08-30-grid2-rainbow-hover/bug.md` — Bug — grid-2 spacing + rainbow border không xoay khi hover
- `.agent/bugs/2026-08-30-n5-ui-polish/bug.md` — 2026-08-30-n5-ui-polish
- `.agent/bugs/2026-08-31-random-step-btn-disabled/bug.md` — Bug: Random làm disable nút ▶ Bước tiếp theo (Bài 004 & 005)

## Full KN details

### KN-001 — Ví dụ: Modal không đóng khi bấm ESC

- **Ngày:** 2026-08-29
- **Bug report:** `.agent/bugs/2026-08-29-modal-esc/bug.md`
- **Severity:** minor
- **Triệu chứng:** Modal mở nhưng bấm ESC không đóng, tab focus thoát ra ngoài.
- **Nguyên nhân gốc:** Chỉ xử lý `click` overlay, quên `keydown` ESC và `focus-trap`.
- **Cách sửa:** Thêm `keydown` listener + `focus-trap` + `aria-modal="true"`.
- **Cách phòng tránh:**
  - Checklist overlay: `ESC` + `click outside` + `focus trap` + `aria`.
  - Thêm vào `product-quality` audit.
- **Tags:** `ui` `a11y`
- **Người ghi:** YUNIE / harness

---

### KN-002 — Trang STATUS www/ giao diện chưa hợp lý

- **Ngày:** 2026-08-29
- **Bug report:** `.agent/bugs/2026-08-29-status-ui/bug.md`
- **Severity:** major
- **Triệu chứng:** Registry luôn hiện `enabled` dù có disabled, description trống; header tràn ở 375px; stats 5 cols chật ở 768px; table overflow ngang mobile không có card fallback; thiếu skip-link, aria, focus-visible; spacing 14px/22px không theo 4/8; `status.json` lưu array string lệch với `app.js` expect object.
- **Nguyên nhân gốc:** Thiếu single source of truth — `status.json` viết tay dạng array string, `app.js` code cho object `{name:{enabled,description}}` → mismatch. Không audit theo `product-quality.instructions.md` (responsive 375/768/1280, states, a11y, spacing 4/8, CSS variables). Không có generator `registry.json → status.json`.
- **Cách sửa:** Đồng bộ `status.json` sang object với `enabled`+`description` (đầy đủ 5 skills, 5 instructions, 7 agents, 7 prompts, 1 hook); `app.js` thêm `normalizeRegistry()` handle cả array và object + search/filter + a11y + error/empty states + `escapeHtml` + keyboard `/` focus; `styles.css` polish spacing 4/8, CSS variables, responsive (stats 2→3→5 cols, table→cards mobile, header co gọn), animation 150-300ms; `index.html` thêm skip-link, semantic, registry controls, aria, responsive header.
- **Cách phòng tránh:**
  - Tạo script `generate-status.mjs` regenerate `status.json` từ `registry.json` (không viết tay).
  - Checklist trước khi commit `www/`: responsive 375/768/1280, `get_errors`, `npx serve www` test, `JSON.parse` validate.
  - Contract `status.json` shape document trong `docs/capabilities.md` và `app.js` luôn backward compat.
  - Thêm `skip-link` + `aria-label` cho mọi page mới.
- **Tags:** `ui` `css` `a11y` `responsive` `data`
- **Người ghi:** YUNIE / fixbug

---

### KN-003 — Rainbow border GlassUI không xoay (animated) ở một số browser

- **Ngày:** 2026-08-30
- **Bug report:** `.agent/bugs/2026-08-29-rainbow-animated/bug.md`
- **Severity:** major
- **Triệu chứng:** Viền cầu vồng (`conic-gradient`) đứng yên, không xoay, dù nội dung mô tả "xoay 3s (HOT)". Một số browser/môi trường thấy tĩnh hoàn toàn.
- **Nguyên nhân gốc:** (1) Detection `@property` sai — `CSS.supports('syntax: "<angle>"')` luôn `false` → code luôn ép JS fallback, tắt animation CSS gốc; (2) `::before` đọc `--angle` qua biến `--rainbow` định nghĩa tại `:root` (`var(--angle)` lồng) → một số engine không re-resolve → tĩnh 0deg; (3) fallback gắn `.js-fallback` per-element bị `updatePlayground()` reset `className` → mất driver ở playground.
- **Cách sửa:** `::before` dùng `conic-gradient(from var(--angle,0deg), ...)` trực tiếp; detect `@property` bằng `CSS.registerProperty`; fallback gắn `.js-rainbow` ở `<html>` + rAF set `--angle`. Verify bằng Playwright (chromium/firefox/webkit, cả native + fallback mode) → `--angle` thay đổi rõ ràng.
- **Cách phòng tránh:**
  - Detect `@property` = `typeof CSS.registerProperty === 'function'`, không `CSS.supports('syntax: ...')`.
  - Animate custom property: dùng giá trị trực tiếp tại property đích, không qua biến lồng `var()` chứa `var()`.
  - Fallback class ở `<html>` (root), không per-element (tránh bị UI reset `className`).
  - Verify animation bằng headless browser đo `--angle` trước/sau, không chỉ mắt thường.
- **Tags:** `ui` `css` `animation`
- **Người ghi:** YUNIE / fixbug

---

### KN-004 — grid-2 thừa khoảng cách + rainbow border index.html không xoay khi hover

- **Ngày:** 2026-08-30
- **Bug report:** `.agent/bugs/2026-08-30-grid2-rainbow-hover/bug.md`
- **Severity:** minor
- **Triệu chứng:** (1) Hai khối `<div class="grid-2">` (Presets+Plans, Health+Pages) cách phần trên ~48px thay vì 24px → lệch nhịp. (2) Viền cầu vồng hiện khi hover nhưng đứng yên, không xoay.
- **Nguyên nhân gốc:** (1) `.grid-2` không có `margin`, trong khi `.section` con có `margin:24px 0`; vì grid item không collapse margin → cộng dồn 24+24=48px. (2) `::before`/`::after` dùng `background:var(--rainbow)` mà `--rainbow` là `conic-gradient(from var(--angle), ...)` định nghĩa tại `:root` → lặp lại anti-pattern KN-003, `--angle` thay đổi không re-resolve ở một số engine → tĩnh 0deg.
- **Cách sửa:** `.grid-2{margin:24px 0}` + `.grid-2 > .section{margin:0}` (nhịp 24px đồng nhất); thay `background:var(--rainbow)` → `background:conic-gradient(from var(--angle,0deg), #ff3b30, #ff9500, #ffcc02, #34c759, #007aff, #af52de, #ff3b30)` trực tiếp tại `::before`/`::after` trong `www/styles.css`.
- **Cách phòng tránh:**
  - Wrapper grid (`.grid-2`, `.grid-3`) luôn tự mang `margin`, con `.section` đặt `margin:0` để tránh doubling.
  - Animate custom property: luôn dùng giá trị trực tiếp tại property đích, không qua biến lồng `var()` chứa `var()` (KN-003).
  - Khi copy pattern rainbow từ `glassui` sang `www`, nhớ bê cả cách dùng gradient trực tiếp, không copy `--rainbow`.
- **Tags:** `ui` `css` `animation` `spacing`
- **Người ghi:** YUNIE / fixbug

---

### KN-006 — N5 Blazor thieu theme sang + tieng Viet mat dau + menu chua polish

- **Ngày:** 2026-08-30
- **Bug report:** `.agent/bugs/2026-08-30-n5-ui-polish/bug.md`
- **Severity:** major
- **Triệu chứng:** Chi co dark theme, khong co toggle sang/toi; Home.razor mat dau tieng Viet (Hoc thay Hoc, Tong quan thay Tổng quan) do fix encoding; menu don gian thieu badge/grouping/a11y; contrast chua test light; hieu ung rainbow chua co prefers-reduced-motion day du.
- **Nguyên nhân gốc:** (1) Design system chi dinh nghia :root dark, chua co [data-theme="light"] variables; (2) Fix bug RZ9986 (Techniques="Blazor: @inject...") bang cach xoa dau + PowerShell here-string lam corrupt Home.razor -> restore ban ASCII an toan nhung mat dau; (3) NavMenu chi lam minimal chua polish theo product-quality; (4) Thieu early init theme -> flash khi reload.
- **Cách sửa:** Them [data-theme="light"] vao app.css (glass sang, text #0f172a, contrast >=4.5:1) + light overrides cho sidebar/topbar/nav/kana/badge/chip/input/quiz/helper; them n5Theme vao app.js (get/set/apply/init, ton trong localStorage + prefers-color-scheme, init ASAP chong flash); them toggle button vao MainLayout.razor (JS interop n5Theme.toggle, persist); them early script vao App.razor <head>; restore Home.razor tieng Viet co dau chuan UTF-8; polish NavMenu (badge, grouping, aria-label, WCAG); fix KanaPage luu->lưu, GrammarPage vi du->ví dụ.
- **Cách phòng tránh:**
  - Design system mac dinh co 2 theme (dark/light) voi CSS variables + toggle persist + early init trong <head>.
  - Moi file .razor phai UTF-8, khong dung PowerShell here-string cho tieng Viet — dung create_file voi UTF-8.
  - Checklist truoc khi Done: co toggle sang/toi? co test ca 2 theme? tieng Viet co dau? contrast >=4.5:1? menu co badge/a11y?
  - Them Playwright test cho theme toggle + contrast.
- **Tags:** `ui` `css` `a11y` `i18n` `theme` `contrast`
- **Người ghi:** YUNIE / fixbug

---

### KN-011 — Random làm disable nút ▶ Bước tiếp theo (Bài 004 & 005)

- **Ngày:** 2026-08-31
- **Bug report:** `.agent/bugs/2026-08-31-random-step-btn-disabled/bug.md`
- **Severity:** major
- **Triệu chứng:** Sau khi click **🎲 Random** ở Bài 004 (Bubble Sort) hoặc Bài 005 (Binary Search), nút **▶ Bước tiếp theo** bị disabled (xám, không click được) — user không thể chạy từng bước sau khi Random.
- **Nguyên nhân gốc (5 Whys):**
  - Why1: Nút Step bị disabled sau Random → vì `handleRandom()` gọi `hideAll()` và `hideAll()` set `stepBtn.disabled = true`
  - Why2: `hideAll()` disable stepBtn → vì được viết để reset state, nhưng không phân biệt context (Random vs Reset vs Start)
  - Why3: Không phân biệt context → vì `hideAll()` là hàm chung, được reuse cho nhiều caller mà không có tham số
  - Why4: Thiếu quản lý state rõ ràng → vì `stepBtn.disabled` được set ở nhiều nơi (hideAll, handleStart, startAutoRun, handleReset) không nhất quán
  - Why5 (Root): Thiếu single source of truth cho button state — mỗi hàm tự set disabled mà không có hàm `updateButtonState()` tập trung
- **Cách sửa:** Minimal fix — `handleRandom()` sau khi gọi `hideAll()` thì re-enable `stepBtn.disabled = false`; `handleReset()` cũng re-enable; `handleStart()` cũng set `stepBtn.disabled = false`. Không đụng `hideAll()` để tránh regression.
- **Cách phòng tránh:**
  - Checklist: Mọi hàm `hideAll`/`reset` phải review xem có disable button không — chỉ disable khi thực sự cần
  - Tạo helper `setStepEnabled(bool)` nếu có nhiều nơi đụng
  - Test manual: sau mỗi action (Random, Reset, Start) check tất cả button states
- **Tags:** `ui` `state` `ux` `button`
- **Người ghi:** YUNIE / fixbug
