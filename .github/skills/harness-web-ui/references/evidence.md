# Evidence — harness-web-ui (DisCo arXiv:2609.02749v1 §3.2 (task-agnostic))

> Substrate layer của skill — full text từ docs/knowleged.md. Sinh tự động 2026-09-12T11:58:31.522Z.

## Bug reports liên quan (16/29 bugs)

- `.agent/bugs/2026-08-29-rainbow-animated/bug.md` — Bug: Rainbow border không xoay (animated)
- `.agent/bugs/2026-08-29-status-ui/bug.md` — Bug: Trang STATUS www/ giao diện chưa hợp lý — layout, responsive, registry render sai
- `.agent/bugs/2026-08-30-grid2-rainbow-hover/bug.md` — Bug — grid-2 spacing + rainbow border không xoay khi hover
- `.agent/bugs/2026-08-30-n5-ui-polish/bug.md` — 2026-08-30-n5-ui-polish
- `.agent/bugs/2026-08-31-random-step-btn-disabled/bug.md` — Bug: Random làm disable nút ▶ Bước tiếp theo (Bài 004 & 005)
- `.agent/bugs/2026-09-06-archify-skill-port/bug.md` — Bug: Archify skill port — (A) EPERM rename trên Windows + (B) diagram tràn first-screen
- `.agent/bugs/2026-09-10-edge-pc-khong-thay-hieu-ung-intro-reduced-motion/bug.md` — Bug: edge-pc-khong-thay-hieu-ung-intro-reduced-motion
- `.agent/bugs/2026-09-10-google-fonts-chan-script-intro-khong-hien/bug.md` — Bug: google-fonts-chan-script-intro-khong-hien
- `.agent/bugs/2026-09-10-intro-burst-tu-goc-do-quen-goi-resize/bug.md` — Bug: intro-burst-tu-goc-do-quen-goi-resize
- `.agent/bugs/2026-09-10-observatory-fetch-404-ngoai-www-va-relative-url/bug.md` — Bug: observatory-fetch-404-ngoai-www-va-relative-url
- `.agent/bugs/2026-09-10-raf-callback-error-khong-bi-try-catch-bat/bug.md` — Bug: raf-callback-error-khong-bi-try-catch-bat
- `.agent/bugs/2026-09-11-cosmos-page-lech-tai-lieu-no-signaling-born-rule-d/bug.md` — Bug: cosmos page lech tai lieu (no-signaling + born rule + dark energy v2)
- `.agent/bugs/2026-09-12-cosmos-future-scroll-dot/bug.md` — Bug: Cosmos — scroll-dot "Tương lai" chết (section thiếu `id="future"`)
- `.agent/bugs/2026-09-12-cosmos-reveal-hover-relative-url/bug.md` — Bug — Cosmos rework: reveal chết ở element > viewport + hover bị reveal đè + `./x` 404 khi URL không slash
- `.agent/bugs/2026-09-12-status-page-audit/bug.md` — Bug: STATUS page audit — footer link 404 + registry placeholder descriptions + aria-labelledby sai ID
- `.agent/bugs/2026-09-12-yt-summary-css-global-collision/bug.md` — Bug: YT Summary — CSS toàn cục đè trang mới (bảng bị ẩn/cắt, [hidden] vô hiệu, card nấp dưới header)

## Full KN details

### KN-001 — Định dạng mẫu: Modal không đóng khi bấm ESC

> ⚠️ **Mục mẫu định dạng** — không phải bug thật (không có `.agent/bugs/2026-08-29-modal-esc/`). Giữ để tham chiếu format + tương thích references. Bài học thật: KN-002+.

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

---

### KN-017 — Archify diagram tràn first-screen + text quá nhỏ — viewBox ratio math

- **Ngày:** 2026-09-06
- **Bug report:** `.agent/bugs/2026-09-06-archify-skill-port/bug.md` (phần viewport-overflow)
- **Severity:** major
- **Triệu chứng:** Diagram deliver pass 9/9 showcase checks nhưng `visual-check` fail `viewer/viewport-overflow` (scrollHeight 1415–2004 > innerHeight 900–1320) hoặc `composition/desktop-readability` (projectedFontPx 4.8–5.9 < 6). Sửa width thì vỡ text, sửa height thì tràn dọc — bế tắc 2 đầu.
- **Nguyên nhân gốc (5 Whys):**
  - Why1: Render tràn dọc → vì diagram height × scale > viewport height trừ chrome (~586px @1440×900).
  - Why2: Scale nhỏ → vì `scale = availableDiagramWidth (~930px) / viewBoxWidth`.
  - Why3: viewBoxWidth quá lớn (1400) → scale 0.66 → text context 7.3px × 0.66 = 4.8px < 6px minimum.
  - Why4: viewBoxWidth nhỏ (772) → scale 1.2 nhưng height 652 × 1.2 = 785px > 586px → tràn.
  - Why5 (Root): Thiếu **ratio math** — phải chọn viewBox width thỏa đồng thời 2 ràng buộc: `scale ≥ 0.822` (text ≥6px) VÀ `height × scale ≤ ~586px`.
- **Cách sửa:** Tính sweet spot: `width ∈ [1035, 1131]` cho height ~652 (workflow: `[1100, 652]` pass cả 2) và `[1050, 560]` cho sequence (nén y theo tỉ lệ `560/720`, giữ min y 160, spread messages ≥28px, nâng cụm cuối tránh legend). Sau mỗi lần đổi viewBox: rescale toàn bộ `y` (messages/activations/segments) theo tỉ lệ, rồi `deliver` + `visual-check` lại.
- **Cách phòng tránh:**
  - Workflow/sequence: ưu tiên viewBox **dẹt** (ratio ≥ 1.7:1) — architecture 1255×424 pass ngay lần đầu.
  - Công thức nhanh: `maxHeight = 586 / (930/width)` → chọn `width = maxHeight × ratio mong muốn`, kiểm tra `930/width ≥ 0.822`.
  - Đổi viewBox → nhớ rescale toàn bộ tọa độ y, không chỉ meta.
  - Luôn chạy `visual-check` (cần `ARCHIFY_CHROME` trỏ Edge/Chrome) sau `deliver` — 9/9 showcase checks KHÔNG bao gồm browser containment.
  - Đọc `supportedFixes` của validator — nó luôn chỉ đúng đường (bỏ fromSide/toSide, dùng labelAt gợi ý, route preset conflict → thả auto).
- **Tags:** `ui` `diagram` `archify` `responsive` `verify`
- **Người ghi:** YUNIE / fixbug

---

### KN-028 — Canvas quên invoke `resize()` → burst sai gốc + behavior test xanh giả

- **Ngày:** 2026-09-10
- **Bug report:** `.agent/bugs/2026-09-10-intro-burst-tu-goc-do-quen-goi-resize/bug.md`
- **Severity:** major
- **Triệu chứng:** Intro cinematic COSMOS — 240 hạt Big Bang nổ từ **góc trên-trái (0,0)** thay vì tâm màn hình; canvas bị kéo giãn (hạt to/mờ bất thường: buffer 300×150 mặc định bị CSS scale lên 1280×720). Trong khi đó **8/8 Playwright test PASS** (cover/skip/reveal đều đúng) → xanh giả, suýt ship bug.
- **Nguyên nhân gốc (5 Whys):**
  - Why1: Hạt spawn tại `(cx,cy)=(0,0)` — vì `cx,cy` chưa bao giờ được gán.
  - Why2: `cx,cy` chỉ gán trong `resize()` — vì `resize()` chưa bao giờ chạy lần nào.
  - Why3: Code chỉ **define** `resize()` + `addEventListener('resize', resizeFn)` — **thiếu invoke `resize()` khởi tạo**.
  - Why4: Không test nào assert invariant "canvas buffer == kích thước hiển thị" → behavior test không thể bắt.
  - Why5 (Root): Invariant hình học chỉ tồn tại trong đầu người viết, không trong test — chỉ **visual evidence (screenshot)** bắt được.
- **Cách sửa:** Thêm `resize();` ngay sau đăng ký listener + guard `if(!w||!h) resize()` trong `burst()` (chống khởi tạo trễ/viewport đổi); thêm assert `canvas.width===clientWidth && canvas.height===clientHeight` vào spec; screenshot từng stage làm evidence (`.agent/plans/cosmos-intro/verify/`).
- **Cách phòng tránh:**
  - Pattern "define setup → addEventListener" **phải kèm invoke ngay** — define không phải là chạy.
  - Mọi effect dùng toạ độ/kích thước (canvas, parallax, viewBox) phải có **assert invariant hình học** trong test — không chỉ assert visible/hidden (KN-023: verification ngoài model).
  - Animation phải có **visual evidence từng stage** (screenshot) trước khi claim Done — behavior test xanh ≠ hiệu ứng đúng (KN-005 Bug Blindness).
  - Playwright test với external render-blocking (Google Fonts CSS) phải **stub route** để deterministic — nếu không, `load` event trễ 10-20s làm timeline chạy xong trước khi test assert → flaky giả.
- **Tags:** `ui` `animation` `canvas` `verify` `bug-blindness`
- **Người ghi:** YUNIE / fixbug (self-caught qua screenshot evidence)

---

### KN-029 — Google Fonts script-blocking làm intro "không hiện" trên mạng chậm

- **Ngày:** 2026-09-10
- **Bug report:** `.agent/bugs/2026-09-10-google-fonts-chan-script-intro-khong-hien/bug.md`
- **Severity:** major
- **Triệu chứng:** User báo "view ở VS Code không thấy hiệu ứng intro". Thực tế: 10-20s đầu overlay đứng hình (nền đen + nút skip + progress 0%, không chữ vì chars do JS inject); hoặc user click sớm → skip tức thì → không cảm nhận được gì.
- **Nguyên nhân gốc (5 Whys):**
  - Why1: Engine intro (inline script cuối body) không execute trong 10-20s đầu.
  - Why2: Inline script đứng SAU một stylesheet chưa load xong bị **block execution** (spec: "a style sheet that is blocking scripts") — third-party CSS block SCRIPT, không chỉ render.
  - Why3: `<link>` Google Fonts là stylesheet blocking thường (không async) → mạng chậm VN giữ toàn bộ JS của trang làm con tin.
  - Why4: Gate `intro-on` (script trong head, chạy được) che nội dung ngay → user thấy màn đen đứng hình thay vì fallback bình thường → tệ hơn không có intro.
  - Why5 (Root): Third-party CSS nhúng kiểu blocking + overlay che nội dung không fail-safe — đường loading bị khóa vào 1 CDN ngoài.
- **Cách sửa:** (1) Fonts async `media="print" onload="this.media='all'"` + `<noscript>`; (2) fail-safe 9s ở head gate (engine không chạy → tự mở nội dung); (3) grace period 600ms cho click-anywhere; (4) dấu "·" vẽ bằng CSS circle (fallback font render ô vuông); (5) `window.__introOn=true` đặt cuối IIFE.
- **Cách phòng tránh:**
  - Third-party CSS (fonts/CDN) **luôn async** hoặc self-host — không bao giờ để chặn first script của trang.
  - Overlay che nội dung phải có **fail-safe timer độc lập với engine** (engine fail → tự mở nội dung, không bao giờ kẹt màn đen).
  - Skip kiểu click-anywhere phải có **grace period (~600ms)** chống click nhầm khi vừa mở.
  - Chi tiết thiết kế (dot, divider) không phụ thuộc glyph font — vẽ bằng CSS để deterministic.
  - Regression test: route treo fonts CDN → assert engine vẫn chạy ngay (`cosmos-intro.spec.ts`).
- **Tags:** `ui` `perf` `font` `script-blocking` `verify`
- **Người ghi:** YUNIE / fixbug (user report → repro bằng Playwright route treo)

---

### KN-030 — Fetch ra ngoài deploy root + relative URL không slash cuối → 404 trên Pages

- **Ngày:** 2026-09-10
- **Bug report:** `.agent/bugs/2026-09-10-observatory-fetch-404-ngoai-www-va-relative-url/bug.md`
- **Severity:** major
- **Triệu chứng:** Console trên trang Pages: `GET https://mrdanhdanh.github.io/.agent/audit.jsonl 404`. Observator "Event Horizon" luôn hiện demo (`✅ Chain OK — demo`) thay vì chuỗi audit thật; card "Nón ánh sáng" bấm 404. Trên local `npx serve` thì cả audit lẫn scale đều `fetch fail` (URL bị redirect `/cosmos/index.html → /cosmos` mất slash cuối).
- **Nguyên nhân gốc (5 Whys):**
  - Why1: Fetch 404 → không có data thật, rơi về demo fallback.
  - Why2 (Pages): `.agent/` ngoài `www/` — Pages chỉ deploy `www/`; `../../` leo lên host root → `/.agent/audit.jsonl` không tồn tại.
  - Why3 (local): `fetch('./x')` phân giải theo document URL — `/cosmos` (không slash cuối) coi segment cuối là file → `'./x'` → `/x`.
  - Why4: Code giả định URL luôn có `/` cuối hoặc `.html` + `.agent/` truy cập được từ web root.
  - Why5 (Root): Trang static không được giả định vị trí file ngoài deploy root hay hình dạng URL — tài nguyên phải nằm trong `www/` và URL phân giải phải robust mọi dạng path.
- **Cách sửa:** (1) `generate-status.mjs` sinh mirror công khai `www/cosmos/audit.json` (50 events tail) — pattern giống `scale.json`; (2) helper toàn cục `dirBase(pathname)` xử lý đúng `/cosmos/`, `/cosmos`, `/cosmos/index.html`; (3) cả 4 fetch site dùng `dirBase(location.pathname)+'file.json'`; (4) card link → `./audit.json`; (5) spec `cosmos-observatory.spec.ts` assert badge "thật" + mirror 200 + không 404 `.agent`.
- **Cách phòng tránh:**
  - Trang static (Pages) **chỉ fetch trong `www/`** — tài nguyên ngoài (`.agent/`, `docs/`, root repo) phải **mirror vào** qua generator + commit.
  - Relative fetch phải qua helper `dirBase` — không giả định slash cuối. Test cả URL dạng `/path`, `/path/`, `/path/index.html`.
  - Spec phải assert **không có 404 nào** (bắt network response), không chỉ assert UI text — fallback demo che bug (xanh giả).
  - Test trên **≥2 host** (serve local + Pages) cho mọi trang có fetch.
- **Tags:** `data` `pages` `fetch` `url` `verify`
- **Người ghi:** YUNIE / fixbug (user console report → repro bằng server log + Playwright)

---

### KN-031 — Edge PC "không thấy hiệu ứng" do reduced-motion bị xử lý quá tay

- **Ngày:** 2026-09-10
- **Bug report:** `.agent/bugs/2026-09-10-edge-pc-khong-thay-hieu-ung-intro-reduced-motion/bug.md`
- **Severity:** major
- **Triệu chứng:** User: "trên điện thoại coi được, Edge PC không coi được hiệu ứng". Thực tế Edge PC: intro hiện chữ **static cái rụp** ~1.8s rồi mở — không fade/particle/chuyển động gì. Phone (animation bật): full Big Bang.
- **Nguyên nhân gốc (5 Whys):**
  - Why1: Edge PC rơi vào nhánh `prefers-reduced-motion` (Windows tắt "Animation effects").
  - Why2: Nhánh reduced cũ strip **mọi** animation/transition kể cả fade opacity vô hại → static pop-in.
  - Why3: Không phân biệt chuyển động nguy hiểm tiền đình (translate/scale/parallax) vs fade opacity an toàn — cắt tất cả.
  - Why4: Không test trên đúng môi trường user (Edge thật + reduced-motion) → không ai thấy bản reduced "trống".
  - Why5 (Root): Reduced-motion bị hiểu là "xóa sạch hiệu ứng" thay vì "giữ hiệu ứng an toàn + nói rõ lý do khi rút gọn".
- **Cách sửa:** Bản reduced "calm cinematic" chỉ opacity (fade stagger ~3.5s, dot pulse); hint nói rõ "Bật Animation effects trong Windows để xem đầy đủ" + `console.info`; defer start (t0 + .play + auto-finish) tới khi tab visible; grace click 1000ms; head fail-safe chuyển sang `window.__introEngine`; spec Edge thật (`channel:'msedge'`) + pixel poll.
- **Cách phòng tránh:**
  - Reduced-motion chỉ cắt **chuyển động** (translate/scale/parallax/spin) — fade opacity là an toàn, phải giữ để trải nghiệm còn "có nhịp".
  - Khi rút gọn trải nghiệm vì setting của user → **nói rõ lý do trong UI** (hint ngắn) — đừng để user tưởng sản phẩm lỗi.
  - Overlay/animation có timeline phải defer khi `document.hidden` — không chạy vô hình ở tab nền.
  - "Không thấy hiệu ứng" → đo trên **đúng môi trường user** (Edge thật qua `channel:'msedge'`, emulate reduced-motion), không chỉ chromium default.
  - Test animation bằng **poll state** (pixel/class), không wall-clock cố định (cold-start làm flaky).
- **Tags:** `ui` `a11y` `reduced-motion` `edge` `verify`
- **Người ghi:** YUNIE / fixbug (user report → repro trên Edge thật)

---

### KN-032 — rAF callback throw không bị try/catch bắt → animation chết im lặng

- **Ngày:** 2026-09-10
- **Bug report:** `.agent/bugs/2026-09-10-raf-callback-error-khong-bi-try-catch-bat/bug.md`
- **Severity:** major
- **Triệu chứng:** Intro v2 rewrite xong — chạy tới ~0.85s rồi **đứng im** (frame đóng băng, không crash trang, không message cho user). Edge spec fail qua assertion "no pageerror": `[pageerror] T is not defined`.
- **Nguyên nhân gốc (5 Whys):**
  - Why1: `T` (`Math.sin(T*2.2)` trong galactic nucleus glow) chưa khai báo khi rewrite v2.
  - Why2: Throw xảy ra trong **rAF callback** — chạy async, KHÔNG nằm trong `try{...}catch(e){}` bao quanh phần setup engine (try/catch chỉ bắt lỗi đồng bộ lúc đăng ký).
  - Why3: Throw trước `raf = requestAnimationFrame(frame)` → loop không schedule lại → chết im lặng.
  - Why4: Rewrite lớn không chạy assertion "no-console-error" trên browser thật ngay sau khi viết.
  - Why5 (Root): Thiếu nguyên tắc: engine rAF phải được gate bằng browser test assert no-pageerror — vì lỗi async không bị try/catch đồng bộ bắt và thất bại kiểu "đứng hình" rất khó thấy bằng mắt.
- **Cách sửa:** Khai báo `const T = t/1000;` (fix ở nguồn, không bọc try/catch toàn frame để khỏi che lỗi thật); giữ assertion no-pageerror trong `cosmos-intro-edge.spec.ts` làm lưới an toàn thường trực.
- **Cách phòng tránh:**
  - Mọi engine rAF (canvas/animation): browser test PHẢI assert **no pageerror/console error** — chạy ngay sau rewrite lớn.
  - Freeze animation = nghi lỗi async (rAF/setTimeout) trước khi nghi logic vật lý.
  - Rewrite lớn: rà các biến dùng-xong-chưa-khai-báo (đặc biệt sau khi tách/ghép hàm) — syntax check của IDE không bắt được ReferenceError.
- **Tags:** `ui` `canvas` `animation` `verify` `error-handling`
- **Người ghi:** YUNIE / fixbug (Edge spec tự bắt trong session)

---

### KN-038 — Trang cosmos lệch tài liệu: physics shorthand + metric drift

- **Ngày:** 2026-09-11
- **Bug report:** `.agent/bugs/2026-09-11-cosmos-page-lech-tai-lieu-no-signaling-born-rule-d/bug.md`
- **Severity:** major
- **Triệu chứng:** 3 nhóm nội dung lệch trên `www/cosmos/index.html` + `slides.html`: (1) entanglement "đổi một → đổi cả hai **tức thì**" — sai vật lý (no-signaling); (2) Born rule "collapse theo **biên độ**" — thiếu bình phương (xác suất = |biên độ|²); (3) dark energy = "scope creep" (stale v1) trong khi v2 = **decollaboration** (KN-018, D = (1−dissentRatio)×10). Trong khi `scale.html` đã đúng v2 → drift giữa các bề mặt cùng chủ đề.
- **Nguyên nhân gốc (5 Whys):**
  - Why1: Nội dung viết trước khi có tài liệu gốc để đối chiếu (library 12 tài liệu vũ trụ/lượng tử mới ingest 2026-09-11).
  - Why2: Pop-sci shorthand không tách bạch "ẩn dụ vs vật lý thật" (entanglement ≠ truyền tin tức thời — no-signaling).
  - Why3: Metric dark energy re-define v1→v2 (scope creep → decollaboration) nhưng chỉ cập nhật `scale.html` + instruction — không sweep `index.html`/`slides.html`.
  - Why4: Không có quy trình grep khi đổi định nghĩa metric — single source of truth bị phân tán đa bề mặt.
  - Why5 (Root): Thiếu gate "verify content vs source of truth" cho trang docs — Done tuyên bố mà không đối chiếu library/instruction/scale.json.
- **Cách sửa:** Sửa tại nguồn theo tài liệu gốc (Horodecki chunk #57-58 "non-message-bearing correlations"; Tong QM chunk #112 Born rule xác suất = |an|²); label rõ "ẩn dụ vs vật lý thật"; align metric v2 (D = decollaboration · G = scope control); 15 edits / 2 files + grep sweep xác nhận 0 cụm cũ còn sót (index) + sweep tiếp slides đợt 2 (4 chỗ: "tức thì" ×2, tag stale lab 2027, audit mirror).
- **Cách phòng tránh:**
  - Trang dùng science metaphor: verify 2 lớp — **vật lý thật** (library MCP citations) + **metric semantics** (instruction + `scale.json`).
  - Re-define metric → grep sweep `www/` + `docs/` + `.github/` tìm mọi tham chiếu cũ TRƯỚC khi Done.
  - Claim dễ gây hiểu nhầm ("tức thì", "truyền tin", "nhân quả") → ghi rõ "ẩn dụ vs vật lý thật" (no-signaling).
  - Đối chiếu chéo các bề mặt cùng chủ đề (`scale.html` đúng v2 vs `index.html`/`slides.html` lệch) → phát hiện drift sớm.
- **Tags:** `ui` `data` `verify` `docs` `physics` `content-drift`
- **Người ghi:** YUNIE / /fixbug

---

### KN-040 — Cosmos rework: reveal chết ở element cao hơn viewport + hover bị reveal đè + `./x` 404 khi URL không slash

- **Ngày:** 2026-09-12
- **Bug report:** `.agent/bugs/2026-09-12-cosmos-reveal-hover-relative-url/bug.md`
- **Severity:** critical
- **Triệu chứng:** (1) Trên mobile 375px, **cả khu Lab (11 thí nghiệm, ~6.7k px) tàng hình vĩnh viễn** — chỉ hiện khi zoom/desktop; (2) hover lift `.card`/`.phase` không nhấc lên (computed `transform` = none/0); (3) click `./slides.html`, `./audit.json` khi URL là `/cosmos` (serve redirect bỏ `index.html`) → 404; (4) lab card ngắn thừa ~200px void đáy do grid stretch.
- **Nguyên nhân gốc (5 Whys):**
  - Why1: `IntersectionObserver{threshold:0.12}` — element 6696px cần 803px hiển thị, viewport 780px → ratio tối đa 0.116 < 0.12 → **không bao giờ intersect đủ**.
  - Why2: `.reveal.in{transform:none}` đứng SAU `.card:hover{transform:translateY(-3px)}` trong stylesheet, cùng specificity (0-2-0) → thắng; parallax inline `style.transform` cũng đè hover.
  - Why3: `href="./x"` resolve theo document base — `/cosmos` (no trailing slash) → `/x` 404. Trước đó **chỉ fetch đã được cứu** bằng `dirBase()` (KN-030) — link attribute chưa được xử lý.
  - Why4: Threshold tỉ lệ thuận chiều cao element — bug class chung cho mọi trang reveal-on-scroll có element > viewport; 36/36 test cũ đều desktop-ish hoặc không scroll hết trang → không cover.
  - Why5 (Root): Verify chỉ đo "trang render được" (screenshot 1 màn, test happy-path) — **thiếu assertion trạng thái cuối sau scroll toàn trang ở mobile** + thiếu test tương tác hover/link trên URL dạng redirect.
- **Cách sửa:** Reveal: `threshold:0` + `revealSweep()` fail-safe (gọi trong rAF scroll + `load` + `visibilitychange` — chống cả tab ẩn/throttle); tách kênh CSS property — `.reveal` dùng `translate`, hover giữ `transform` (hết tranh chấp); bỏ parallax 8px vô hình trên `.card`; `fixRelLinks()` rewrite mọi `a[href^"./"]` qua `dirBase(location.pathname)` (link tĩnh lúc load + link render động trong map detail); lab card `display:flex;flex-direction:column` + `lab-body`/`lab-demo` `flex:1`; `section[id]{scroll-margin-top}` bù header + 18px dịch reveal; "Điểm đo" thêm đơn vị; stack polish (fan ±44px, blur/fade back cards).
- **Cách phòng tránh:**
  - Reveal-on-scroll: **không dùng threshold > 0**; luôn có sweep fail-safe ngoài scroll (load + visibilitychange) — nội dung không bao giờ kẹt ẩn.
  - Một element một kênh: reveal/animation dùng `translate`/`opacity`, hover dùng `transform` — tránh cùng property thì specificity quyết định ngầm.
  - Static site: mọi tài nguyên tương đối (link + fetch) phải resolve qua `dirBase()` — test bằng URL **không slash cuối** (vì `serve`/proxy có thể redirect bỏ `index.html`).
  - Element bị grid stretch → container `flex:1` để nội dung fill, không để void đáy.
  - Test tương tác phải assert **trạng thái cuối sau scroll toàn trang ở 375** + hover computed transform + link resolve — không chỉ screenshot màn đầu.
- **Tags:** `ui` `css` `animation` `responsive` `pages` `url` `verify`
- **Người ghi:** YUNIE / /harness (rework)

---

### KN-042 — YT Summary mobile: CSS toàn cục đè trang mới (bảng ẩn/cắt, `[hidden]` vô hiệu, card dưới header)

- **Ngày:** 2026-09-12
- **Bug report:** `.agent/bugs/2026-09-12-yt-summary-css-global-collision/bug.md`
- **Severity:** major
- **Triệu chứng:** 375px: text tóm tắt bị cắt ngang (bảng 560px trong khung 303px, không wrap theo khung); detail transcript luôn hiện dù chưa bấm; desktop: card nấp dưới header cố định sau `scrollIntoView`.
- **Nguyên nhân gốc:**
  - Tái dùng class toàn cục **`.table-wrap`** — `www/styles.css` có `@media (max-width:767px){ .table-wrap{display:none} }` (cho bảng registry STATUS) → bảng mới **ẩn hoàn toàn** ở mobile.
  - Element rule toàn cục `table{min-width:560px}` (để bảng STATUS scroll ngang) áp lên mọi `<table>` → card-layout mobile không co được; wrap tại 560 → bị container `overflow-x:auto` cắt.
  - Mobile rule `.yt-table tr{display:block}` **đè UA style `[hidden]{display:none}`** (specificity class > attribute selector của UA) → các row `[hidden]` vẫn hiển thị.
  - `scrollIntoView` + anchor không trừ **header cố định 56px** (thiếu `scroll-margin-top`).
- **Cách sửa:** Namespace class trang (`.yts-table-wrap`); `.yt-table{min-width:0}`; mobile thêm `tr[hidden]{display:none}`; `scroll-margin-top:72px` cho `.yts .section/.hero`; test invariant mới (bảng fit container, row visible + height>20, detail `[hidden]`=0 khi chưa bấm, card y≥48 sau scroll).
- **Cách phòng tránh:**
  - Trang mới dùng chung `www/styles.css`: **namespace mọi class** (`.<page>-*`); trước khi đặt tên, grep stylesheet toàn cục xem tên đó có rule `display:none` / `min-width` / ẩn mobile không.
  - Rule `display:block` cho `tr/td` (table→card) **bắt buộc** kèm `[hidden]{display:none}`.
  - Site có fixed header → mọi anchor/scrollIntoView cần `scroll-margin-top` ≥ header height.
  - Test mobile phải assert **trong-container** (`table.scrollWidth ≤ clientWidth`) — `documentElement` overflow không bắt được tràn bên trong scroll container.
- **Tags:** `ui` `css` `responsive` `a11y`
- **Người ghi:** YUNIE / /harness

---

### KN-045 — STATUS audit: link footer 404 trên Pages + registry placeholder descriptions + aria-labelledby tab sai ID

- **Ngày:** 2026-09-12
- **Bug report:** `.agent/bugs/2026-09-12-status-page-audit/bug.md`
- **Severity:** major
- **Triệu chứng:** Footer `README` → 404 (cả Pages lẫn `serve www`); bảng Registry hiển thị `hook hooks`, `agent designer`, `prompt harness`… cho 9 entry; DOM scan thấy `aria-labelledby="governance"/"platform"` trên 2 tab panel trỏ vào ID không tồn tại (screen reader đọc sai ngữ cảnh).
- **Nguyên nhân gốc:** (1) Link viết lúc dev serve từ repo root — `../README.md` thoát khỏi deploy root `www/` nên chỉ "chạy" ở môi trường dev (bug blindness KN-005 môi trường khác user); (2) `registry.json` giữ description placeholder sinh lúc cài (`${type} ${name}`) và không bao giờ refresh từ frontmatter khi frontmatter đổi; (3) tab panel copy value `data-tab` vào `aria-labelledby` trong khi button không có `id` tương ứng — thiếu invariant test scan ARIA refs toàn DOM.
- **Cách sửa:** Footer trỏ `https://github.com/mrdanhdanh/CLAUDE_VS#readme` (`target=_blank rel=noopener`); tab buttons thêm `id="tabbtn-*"` + `aria-controls`, panel trỏ `aria-labelledby="tabbtn-*"`; refresh 9 description trong `registry.json` từ frontmatter (agents designer/plan/polish · prompts harness/implement/plan/polish/product · hook hooks) + `generate-status.mjs`; hardening `renderPages()` — href chỉ prefix `./` khi không phải URL http(s); khóa bằng `tests/e2e/status-audit.spec.ts` (L1 fetch mọi link same-origin <400 · L2 no placeholder desc · L3 ARIA refs hợp lệ · L4 tab aria state) — RED 4 fail → GREEN 4 pass, full suite 74/74.
- **Cách phòng tránh:**
  - Link trong `www/` **không được trỏ ra ngoài deploy root** (`../`) — chỉ link nội bộ hoặc URL tuyệt đối (GitHub/Pages); verify bằng browser fetch all-links, không nhìn mắt (KN-005/KN-030).
  - Nguồn hiển thị (registry/status) là **hợp đồng với user** — placeholder `${type} ${name}` không bao giờ được render ra UI; frontmatter đổi → refresh registry description + regenerate (test L2 chặn pattern).
  - Mọi ARIA ref (`aria-labelledby/controls/describedby`) phải trỏ ID tồn tại — test scan toàn DOM (L3); tab dùng pattern button `id` + `aria-controls` ↔ panel `aria-labelledby`.
  - Audit page định kỳ gồm 4 invariant: link resolve · data quality · ARIA refs · console errors.
- **Tags:** `ui` `a11y` `data` `pages` `verify`
- **Người ghi:** YUNIE / fixbug

---

### KN-046 — Cosmos: scroll-dot "Tương lai" chết (section thiếu `id`) — điều hướng fail-silent

- **Ngày:** 2026-09-12
- **Bug report:** `.agent/bugs/2026-09-12-cosmos-future-scroll-dot/bug.md`
- **Severity:** major
- **Triệu chứng:** Bấm dot cuối cột phải (`aria-label="Tương lai"`) → không nhảy; cuộn hết trang → section cuối không bao giờ được highlight `.active` (9 dot, 8 section). Không pageerror, không console error — control chết hoàn toàn im lặng.
- **Nguyên nhân gốc:** Section `Khai thác tương lai` được thêm ở commit sau (125ffc5) mà **không kèm `id="future"`**, trong khi nav đã có `<button class="scroll-dot" data-target="future">`. JS xử lý cả 2 chiều đều fail-silent: `const el=getElementById(target); if(el)…` (không el = không làm gì) và `[…ids].map(getElementById).filter(Boolean)` (section thiếu id bị bỏ khỏi observer). Gốc sâu hơn: điều hướng dùng **2 nguồn song song** (`data-target` ở nav ↔ `id` ở DOM) + mảng id hardcode trong JS, và không test nào assert "mọi target resolve" — test cũ chỉ kiểm **nội dung đích** (`.future-card` count, text, ETA) nên 36 test xanh vẫn lọt (KN-037: đo WHETHER, không đo HOW WELL).
- **Cách sửa:** Thêm `id="future"` + comment nêu lý do (nav + observer đều `getElementById`); invariant mới trong `tests/e2e/cosmos-lab12-qec.spec.ts`: `.scroll-dot` = 9 và `data-target` → element **phải resolve hết** (`missing=[]`), click dot "Tương lai" → `#future` top < 300px (poll). Kèm sync copy nhân dịp ship Lab #12 (11→12 thí nghiệm, STATUS "4 lab" → 12, roadmap QEC → đã ship + Light Echo, slide 15).
- **Cách phòng tránh:**
  - Điều hướng `data-target`/`href="#id"` + JS `if (el)` = **fail-silent**: luôn có test invariant "mọi target phải resolve" — test nội dung đích không thay thế được (KN-037).
  - Nav/observer **derive từ DOM** (`document.querySelectorAll('.scroll-dot')`) thay vì mảng id hardcode — 2 nguồn song song là nguồn drift (KN-038 class).
  - Checklist khi thêm section mới: `id` + entry nav + observer + anchor test (giống checklist thêm link trong `www/`, KN-045).
  - Control không làm gì và không báo gì = bug **major**, không phải "nhỏ" — cùng class KN-011 (nút chết sau Random).
- **Tags:** `ui` `a11y` `nav` `verify` `fail-silent`
- **Người ghi:** YUNIE / upgrade Lab #12

<!-- Thêm bài học mới theo template dưới — copy block này -->

<!--
