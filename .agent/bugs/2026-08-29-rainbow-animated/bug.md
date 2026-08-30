# Bug: Rainbow border không xoay (animated)

## Meta

- **Slug:** `2026-08-29-rainbow-animated`
- **Ngày:** 2026-08-29
- **Severity:** `major`
- **Reporter:** @user
- **Related KN:** `KN-003`
- **Tags:** `ui` `css` `a11y` `animation`
- **Status:** `resolved` (verified bằng Playwright chromium/firefox/webkit)

---

## 1. Reproduce

### Steps
1. Mở `www/glassui/index.html` (hoặc `npx serve www` → `/glassui/`)
2. Scroll tới section **2 — Rainbow Border** → card **Animated — xoay 3s (HOT)**
3. Quan sát viền cầu vồng

### Expected vs Actual
- **Expected:** Viền `conic-gradient` xoay liên tục 3s/ vòng (`@property --angle` + `animation: rotate-angle 3s linear infinite`), mô tả ghi "xoay 3s (HOT)", hero preview và combo cũng xoay.
- **Actual:** Viền đứng yên, không xoay. `getComputedStyle(el, '::before').animationName === 'none'`, `animationDuration === '0s'`. Cả `.rainbow-animated` và `.glass-rainbow.animated` đều `animation: none`.

### Evidence
- Playwright evaluate trên `www/glassui/index.html`:
```
{
  elClass: "rainbow-animated preview-rainbow",
  elAngle: "0deg",
  beforeAnimation: "none",
  beforeAnimationDuration: "0s",
  beforeAnimationPlayState: "running",
  beforeBackground: "conic-gradient(rgb(255, 59, 48), ...)",
  prefersReduced: true,
  supportsProperty: false,
  supportsRegister: true,
  glassRainbow: { anim: "none", dur: "0s" }
}
```
- `prefers-reduced-motion: reduce` đang bật (OS/browser), và `CSS.supports('syntax: "<angle>"') === false` → `@property` không hỗ trợ → CSS animation không chạy, JS fallback cũng không chạy.

### Environment
- Branch: `main`
- OS/Browser: Windows / Chromium (Playwright), `prefers-reduced-motion: reduce` = true
- File: `www/glassui/styles.css`, `www/glassui/app.js`

---

## 2. Root Cause (5 Whys)

- **File:Line:** `www/glassui/styles.css` (`.rainbow-border::before` / `.rainbow-animated::before` / `.glass-rainbow::before` dùng `background:var(--rainbow)`), `www/glassui/app.js` (`initRainbowFallback` — detect `@property` sai).
- **Why 1:** Viền đứng yên (không xoay) dù mô tả "xoay 3s".
- **Why 2:** `::before` đọc `--angle` gián tiếp qua biến `--rainbow` định nghĩa tại `:root` (`conic-gradient(from var(--angle), ...)`). Khi `--angle` thay đổi, một số engine không re-resolve `var(--angle)` nằm trong custom property lồng → `::before` giữ giá trị tĩnh 0deg.
- **Why 3:** Detection `@property` sai: `CSS.supports('syntax: "<angle>"')` luôn `false` (`syntax` không phải property) → code luôn vào nhánh JS fallback, tắt animation gốc (`animation:none !important` qua `.js-fallback`) và phụ thuộc hoàn toàn vào JS set `--angle`.
- **Why 4:** JS fallback gắn `.js-fallback` lên từng element, nhưng `updatePlayground()` reset `playCard.className=''` → gỡ `.js-fallback` khỏi playground card. Ở browser không hỗ trợ `@property`, card này bị tắt animation gốc mà không có JS driver → đứng yên.
- **Why 5 (Root):** Cơ chế animation mong manh: (a) detect `@property` sai ép dùng JS fallback thay vì animation CSS gốc tin cậy; (b) `::before` dùng `var(--rainbow)` lồng → `--angle` không re-resolve ở một số browser; (c) fallback gắn class per-element bị reset bởi logic UI. Kết quả: ở một số môi trường browser, viền đứng yên hoàn toàn.

- **Impact:** Rainbow animated (section 2, hero preview, combo, playground) đứng yên ở một số browser → sai mô tả "xoay 3s", user báo bug.
- **Hypothesis (đã xác thực bằng Playwright):** Fix ở gốc: (1) `::before` dùng gradient trực tiếp `conic-gradient(from var(--angle), ...)` (không qua `--rainbow`); (2) detect `@property` bằng `CSS.registerProperty`; (3) fallback gắn `.js-rainbow` ở `<html>` (không bị reset).

---

## 3. Fix

- **Approach:** Sửa ở gốc — không patch triệu chứng. (1) `::before` dùng gradient conic trực tiếp thay vì biến `--rainbow` lồng → `--angle` luôn resolve tại `::before`. (2) Detect `@property` đúng (`CSS.registerProperty`) → dùng animation CSS gốc khi được hỗ trợ (tin cậy nhất). (3) Fallback gắn class `.js-rainbow` ở `<html>` (không bị `updatePlayground` reset) thay vì per-element `.js-fallback`.
- **Files Changed:**
  - `www/glassui/styles.css` — `.rainbow-border::before`, `.rainbow-animated::before`, `.glass-rainbow::before`, `.rainbow-glow::before` đổi `background:var(--rainbow)` → `background:conic-gradient(from var(--angle,0deg), #ff3b30, #ff9500, #ffcc02, #34c759, #007aff, #af52de, #ff3b30)`. Xoá 2 rule `.js-fallback` chết, giữ rule `.js-rainbow` ở root.
  - `www/glassui/app.js` — `initRainbowFallback`: detect `CSS.registerProperty`; nếu hỗ trợ → `return` (native chạy); nếu không → thêm `.js-rainbow` vào `<html>` + rAF set `--angle`. Bỏ hàm `startJS`/`.js-fallback` per-element.
- **Diff tóm tắt:**
```diff
// styles.css — before: transitive var (fragile)
.rainbow-animated::before{ background:var(--rainbow); }
// after: direct gradient, --angle resolves at ::before
.rainbow-animated::before{ background:conic-gradient(from var(--angle,0deg), #ff3b30, #ff9500, #ffcc02, #34c759, #007aff, #af52de, #ff3b30); }

// app.js — before: bogus detection forces JS fallback always
const supportsProperty = CSS.supports('syntax: "<angle>"'); // luôn false
// after: detect @property correctly
const supportsAtProperty = (typeof CSS !== 'undefined' && typeof CSS.registerProperty === 'function');
if(supportsAtProperty) return; // native animation runs
 document.documentElement.classList.add('js-rainbow'); // fallback (root class)
```
- **Non-Goals:** Không đổi design tokens, không thêm lib, không sửa glass, không đổi `prefers-reduced-motion` (đã đúng từ fix trước: giảm tốc 6s, không tắt hẳn).

---

## 4. Verification (Playwright chromium/firefox/webkit)

- [x] Re-run steps reproduce → **Fixed** (viền xoay 3s, hover-only xoay khi hover, combo xoay 4s)
- [x] Edge cases:
  - [x] `prefers-reduced-motion: reduce` bật → rainbow vẫn xoay (native 6s / fallback min 6s), không tắt hẳn
  - [x] Browser không hỗ trợ `@property` (ép `CSS.registerProperty=undefined`) → `.js-rainbow` ở `<html>`, JS rAF set `--angle` xoay mượt (firefox: `--angle` 198→273deg)
  - [x] `prefers-reduced-motion: no-preference` → xoay tự động (native `rotate-angle`)
  - [x] Playground speed slider đổi `--angle-speed` → JS/canvas cập nhật tốc độ realtime (playground card nằm trong map, không bị reset className)
- [x] Regression: glass, glow, static border (`.rainbow-border` = "Tĩnh"), `rainbow-hover` (hover-only) vẫn đúng
- [x] `get_errors` → 0 errors (app.js, styles.css)

**Kết quả (trích):**
```
chromium NATIVE : .rainbow-animated[0] --angle 111.996 -> 183.996deg  OK
firefox  NATIVE : .rainbow-animated[0] --angle 229.999 -> 302.608deg  OK
webkit   NATIVE : .rainbow-animated[0] --angle 51.96   -> 116.28deg    OK
firefox  FALLBACK(registerProperty disabled): htmlClass=js-rainbow, .rainbow-animated[0] --angle 198.439 -> 273.422deg  OK
chromium/webkit FALLBACK: vẫn xoay (CSS @property at-rule vẫn đăng ký --angle dù JS API bị xoá)
ALL ANIMATED (hover-only excluded) trên cả 3 browser, cả 2 mode
```

---

## 5. Lesson (1 câu)

> Hiệu ứng dựa vào `@property` phải có JS fallback `requestAnimationFrame` set `--angle`, và `prefers-reduced-motion` không được `!important` tắt hẳn animation — phải pause + cho phép hover/toggle.

---

## 6. Prevention

- **Cách phòng tránh lần sau:**
  - [ ] Detect `@property` bằng `typeof CSS.registerProperty === 'function'` (KHÔNG dùng `CSS.supports('syntax: "<angle>"')` — luôn false vì `syntax` không phải property).
  - [ ] Khi animate custom property, dùng giá trị trực tiếp tại property đích (`background: conic-gradient(from var(--angle), ...)`), KHÔNG qua biến lồng `var(--rainbow)` chứa `var(--angle)` — một số engine không re-resolve `var()` lồng.
  - [ ] Fallback class nên gắn ở `<html>` (root), không per-element — tránh bị logic UI reset `className` (vd `updatePlayground` làm mất animation).
  - [ ] `prefers-reduced-motion` chỉ giảm tốc (6s) / `paused`, không `animation:none !important` cho hiệu ứng chính.
  - [ ] Verify animation bằng headless browser (Playwright) đo `--angle` trước/sau 600ms — đừng chỉ nhìn mắt thường.
  - [ ] Thêm vào `product-quality` checklist: "Animated border có xoay (native + fallback) khi reduced motion bật và khi @property không hỗ trợ?"

- **Related KN:** `KN-003`
- **Tags:** `ui` `css` `a11y` `animation`
