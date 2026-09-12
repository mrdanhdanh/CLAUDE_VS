---
name: harness-web-ui
description: "Task-agnostic lessons 'Web UI & UX' chưng cất từ docs/knowleged.md (17 KN: KN-001, KN-002, KN-003, KN-004, KN-006, KN-011, KN-017, KN-028, KN-029, KN-030, KN-031, KN-032, KN-038, KN-040, KN-042, KN-045, KN-046) + .agent/bugs/. Use when task chạm ui, a11y, css, responsive, data, animation, spacing, i18n, theme, contrast — áp Cách phòng tránh trước khi code, tránh lặp bug cũ. DisCo-lite, regenerate bằng distill-agnostic.mjs."
user-invocable: false
---

# Harness Web UI & UX — Bài học task-agnostic (DisCo-lite)

> Chưng cất từ `docs/knowleged.md` + `.agent/bugs/` — **KHÔNG sửa tay**, regenerate bằng `node .github/harness/scripts/distill-agnostic.mjs`. Nguồn: DisCo arXiv:2609.02749v1 §3.2 (task-agnostic).

## When to Use

- Task chạm theme **Web UI & UX** (tags: ui, a11y, css, responsive, data, animation, spacing, i18n, theme, contrast, state, ux, button, diagram, archify, verify, canvas, bug-blindness, perf, font, script-blocking, pages, fetch, url, reduced-motion, edge, error-handling, docs, physics, content-drift, nav, fail-silent)
- Trước khi code/fix — áp **Cách phòng tránh** ngay để không lặp bug cũ
- Review/plan — check anti-patterns bên dưới

## Bài học (17 KN)

### KN-001 — Định dạng mẫu: Modal không đóng khi bấm ESC (minor)
- **Bài học:** Mọi overlay/modal phải có ESC + focus trap + aria
- **Bug report:** .agent/bugs/2026-08-29-modal-esc/bug.md
- **Cách phòng tránh:**
  - Checklist overlay: `ESC` + `click outside` + `focus trap` + `aria`.
  - Thêm vào `product-quality` audit.

### KN-002 — Trang STATUS www/ giao diện chưa hợp lý (major)
- **Bài học:** Dashboard phải có single source of truth (registry.json → status.json) và polish responsive/a11y ngay từ đầu
- **Bug report:** .agent/bugs/2026-08-29-status-ui/bug.md
- **Cách phòng tránh:**
  - Tạo script `generate-status.mjs` regenerate `status.json` từ `registry.json` (không viết tay).
  - Checklist trước khi commit `www/`: responsive 375/768/1280, `get_errors`, `npx serve www` test, `JSON.parse` validate.
  - Contract `status.json` shape document trong `docs/capabilities.md` và `app.js` luôn backward compat.
  - Thêm `skip-link` + `aria-label` cho mọi page mới.

### KN-003 — Rainbow border GlassUI không xoay (animated) ở một số browser (major)
- **Bài học:** Animate custom property: dùng gradient trực tiếp tại `::before`, detect `@property` bằng `CSS.registerProperty`, fallback class ở `<html>`
- **Bug report:** .agent/bugs/2026-08-29-rainbow-animated/bug.md
- **Cách phòng tránh:**
  - Detect `@property` = `typeof CSS.registerProperty === 'function'`, không `CSS.supports('syntax: ...')`.
  - Animate custom property: dùng giá trị trực tiếp tại property đích, không qua biến lồng `var()` chứa `var()`.
  - Fallback class ở `<html>` (root), không per-element (tránh bị UI reset `className`).
  - Verify animation bằng headless browser đo `--angle` trước/sau, không chỉ mắt thường.

### KN-004 — grid-2 thừa khoảng cách + rainbow border index.html không xoay khi hover (minor)
- **Bài học:** Wrapper `.grid-2` tự mang `margin:24px 0`, con `.section` đặt `margin:0`; animate `--angle` dùng `conic-gradient(from var(--angle), ...)` trực tiếp
- **Bug report:** .agent/bugs/2026-08-30-grid2-rainbow-hover/bug.md
- **Cách phòng tránh:**
  - Wrapper grid (`.grid-2`, `.grid-3`) luôn tự mang `margin`, con `.section` đặt `margin:0` để tránh doubling.
  - Animate custom property: luôn dùng giá trị trực tiếp tại property đích, không qua biến lồng `var()` chứa `var()` (KN-003).
  - Khi copy pattern rainbow từ `glassui` sang `www`, nhớ bê cả cách dùng gradient trực tiếp, không copy `--rainbow`.

### KN-006 — N5 Blazor thieu theme sang + tieng Viet mat dau + menu chua polish (major)
- **Bài học:** Design system phai co 2 theme tu dau (CSS variables + toggle persist + early init) va i18n giu UTF-8 chuan
- **Bug report:** .agent/bugs/2026-08-30-n5-ui-polish/bug.md
- **Cách phòng tránh:**
  - Design system mac dinh co 2 theme (dark/light) voi CSS variables + toggle persist + early init trong <head>.
  - Moi file .razor phai UTF-8, khong dung PowerShell here-string cho tieng Viet — dung create_file voi UTF-8.
  - Checklist truoc khi Done: co toggle sang/toi? co test ca 2 theme? tieng Viet co dau? contrast >=4.5:1? menu co badge/a11y?
  - Them Playwright test cho theme toggle + contrast.

### KN-011 — Random làm disable nút ▶ Bước tiếp theo (Bài 004 & 005) (major)
- **Bài học:** Không disable stepBtn trong hàm reset chung — quản lý button state tập trung, re-enable sau Random
- **Bug report:** .agent/bugs/2026-08-31-random-step-btn-disabled/bug.md
- **Cách phòng tránh:**
  - Checklist: Mọi hàm `hideAll`/`reset` phải review xem có disable button không — chỉ disable khi thực sự cần
  - Tạo helper `setStepEnabled(bool)` nếu có nhiều nơi đụng
  - Test manual: sau mỗi action (Random, Reset, Start) check tất cả button states

### KN-017 — Archify diagram tràn first-screen + text quá nhỏ — viewBox ratio math (major)
- **Bài học:** Chọn viewBox width trong sweet spot [1035, 1131] để đồng thời thỏa `scale ≥ 0.822` và `height×scale ≤ ~586px`; luôn chạy `visual-check` sau `deliver`
- **Bug report:** .agent/bugs/2026-09-06-archify-skill-port/bug.md
- **Cách phòng tránh:**
  - Workflow/sequence: ưu tiên viewBox **dẹt** (ratio ≥ 1.7:1) — architecture 1255×424 pass ngay lần đầu.
  - Công thức nhanh: `maxHeight = 586 / (930/width)` → chọn `width = maxHeight × ratio mong muốn`, kiểm tra `930/width ≥ 0.822`.
  - Đổi viewBox → nhớ rescale toàn bộ tọa độ y, không chỉ meta.
  - Luôn chạy `visual-check` (cần `ARCHIFY_CHROME` trỏ Edge/Chrome) sau `deliver` — 9/9 showcase checks KHÔNG bao gồm browser containment.
  - Đọc `supportedFixes` của validator — nó luôn chỉ đúng đường (bỏ fromSide/toSide, dùng labelAt gợi ý, route preset conflict → thả auto).

### KN-028 — Canvas quên invoke `resize()` → burst sai gốc + behavior test xanh giả (major)
- **Bài học:** Define setup xong phải invoke ngay; assert invariant hình học (`canvas.width===clientWidth`) trong test; visual evidence bắt bug mà behavior test bỏ lọt
- **Bug report:** .agent/bugs/2026-09-10-intro-burst-tu-goc-do-quen-goi-resize/bug.md
- **Cách phòng tránh:**
  - Pattern "define setup → addEventListener" **phải kèm invoke ngay** — define không phải là chạy.
  - Mọi effect dùng toạ độ/kích thước (canvas, parallax, viewBox) phải có **assert invariant hình học** trong test — không chỉ assert visible/hidden (KN-023: verification ngoài model).
  - Animation phải có **visual evidence từng stage** (screenshot) trước khi claim Done — behavior test xanh ≠ hiệu ứng đúng (KN-005 Bug Blindness).
  - Playwright test với external render-blocking (Google Fonts CSS) phải **stub route** để deterministic — nếu không, `load` event trễ 10-20s làm timeline chạy xong trước khi test assert → flaky giả.

### KN-029 — Google Fonts script-blocking làm intro "không hiện" trên mạng chậm (major)
- **Bài học:** Third-party CSS luôn async (`media="print" onload`) + noscript; fail-safe mở nội dung khi engine fail; grace 600ms chống click nhầm; glyph chi tiết vẽ bằng CSS
- **Bug report:** .agent/bugs/2026-09-10-google-fonts-chan-script-intro-khong-hien/bug.md
- **Cách phòng tránh:**
  - Third-party CSS (fonts/CDN) **luôn async** hoặc self-host — không bao giờ để chặn first script của trang.
  - Overlay che nội dung phải có **fail-safe timer độc lập với engine** (engine fail → tự mở nội dung, không bao giờ kẹt màn đen).
  - Skip kiểu click-anywhere phải có **grace period (~600ms)** chống click nhầm khi vừa mở.
  - Chi tiết thiết kế (dot, divider) không phụ thuộc glyph font — vẽ bằng CSS để deterministic.
  - Regression test: route treo fonts CDN → assert engine vẫn chạy ngay (`cosmos-intro.spec.ts`).

### KN-030 — Fetch ra ngoài deploy root + relative URL không slash cuối → 404 trên Pages (major)
- **Bài học:** Tài nguyên ngoài `www/` phải **mirror** vào (generate + commit như `scale.json`); dùng helper `dirBase(pathname)` robust mọi dạng URL; spec assert không-404 + data "thật"
- **Bug report:** .agent/bugs/2026-09-10-observatory-fetch-404-ngoai-www-va-relative-url/bug.md
- **Cách phòng tránh:**
  - Trang static (Pages) **chỉ fetch trong `www/`** — tài nguyên ngoài (`.agent/`, `docs/`, root repo) phải **mirror vào** qua generator + commit.
  - Relative fetch phải qua helper `dirBase` — không giả định slash cuối. Test cả URL dạng `/path`, `/path/`, `/path/index.html`.
  - Spec phải assert **không có 404 nào** (bắt network response), không chỉ assert UI text — fallback demo che bug (xanh giả).
  - Test trên **≥2 host** (serve local + Pages) cho mọi trang có fetch.

### KN-031 — Edge PC "không thấy hiệu ứng" do reduced-motion bị xử lý quá tay (major)
- **Bài học:** Reduced-motion chỉ cắt chuyển động nguy hiểm (translate/scale/parallax), giữ fade opacity có nhịp + hint nói rõ lý do; defer timeline khi tab ẩn; grace 1000ms; test trên Edge thật (`channel: 'msedge'`) + poll pixels thay wall-clock
- **Bug report:** .agent/bugs/2026-09-10-edge-pc-khong-thay-hieu-ung-intro-reduced-motion/bug.md
- **Cách phòng tránh:**
  - Reduced-motion chỉ cắt **chuyển động** (translate/scale/parallax/spin) — fade opacity là an toàn, phải giữ để trải nghiệm còn "có nhịp".
  - Khi rút gọn trải nghiệm vì setting của user → **nói rõ lý do trong UI** (hint ngắn) — đừng để user tưởng sản phẩm lỗi.
  - Overlay/animation có timeline phải defer khi `document.hidden` — không chạy vô hình ở tab nền.
  - "Không thấy hiệu ứng" → đo trên **đúng môi trường user** (Edge thật qua `channel:'msedge'`, emulate reduced-motion), không chỉ chromium default.
  - Test animation bằng **poll state** (pixel/class), không wall-clock cố định (cold-start làm flaky).

### KN-032 — rAF callback throw không bị try/catch bắt → animation chết im lặng (major)
- **Bài học:** Browser test PHẢI assert "no pageerror/console error" ngay sau rewrite; freeze animation = nghi lỗi async trước khi nghi logic; test bắt được nhờ assertion Edge spec
- **Bug report:** .agent/bugs/2026-09-10-raf-callback-error-khong-bi-try-catch-bat/bug.md
- **Cách phòng tránh:**
  - Mọi engine rAF (canvas/animation): browser test PHẢI assert **no pageerror/console error** — chạy ngay sau rewrite lớn.
  - Freeze animation = nghi lỗi async (rAF/setTimeout) trước khi nghi logic vật lý.
  - Rewrite lớn: rà các biến dùng-xong-chưa-khai-báo (đặc biệt sau khi tách/ghép hàm) — syntax check của IDE không bắt được ReferenceError.

### KN-038 — Trang cosmos lệch tài liệu: physics shorthand + metric drift (major)
- **Bài học:** Science metaphor verify 2 lớp (vật lý thật qua library MCP + metric semantics qua instruction/scale.json); re-define metric phải grep sweep `www/`+`docs/`+`.github/`; claim dễ hiểu nhầm → label "ẩn dụ vs vật lý thật"
- **Bug report:** .agent/bugs/2026-09-11-cosmos-page-lech-tai-lieu-no-signaling-born-rule-d/bug.md
- **Cách phòng tránh:**
  - Trang dùng science metaphor: verify 2 lớp — **vật lý thật** (library MCP citations) + **metric semantics** (instruction + `scale.json`).
  - Re-define metric → grep sweep `www/` + `docs/` + `.github/` tìm mọi tham chiếu cũ TRƯỚC khi Done.
  - Claim dễ gây hiểu nhầm ("tức thì", "truyền tin", "nhân quả") → ghi rõ "ẩn dụ vs vật lý thật" (no-signaling).
  - Đối chiếu chéo các bề mặt cùng chủ đề (`scale.html` đúng v2 vs `index.html`/`slides.html` lệch) → phát hiện drift sớm.

### KN-040 — Cosmos rework: reveal chết ở element cao hơn viewport + hover bị reveal đè + `./x` 404 khi URL không slash (critical)
- **Bài học:** Reveal: IO `threshold:0` + `revealSweep()` fail-safe (rAF scroll + load + visibilitychange; tab throttle vẫn reveal); tách kênh property — reveal dùng `translate`, hover dùng `transform`; `fixRelLinks()` rewrite `a[href^="./"]` qua `dirBase(location.pathname)` (cả link tĩnh + link render động); lab card flex column + `lab-body`/`lab-demo` flex:1. 36 test cũ xanh vẫn lọt cả 4 → thêm `cosmos-rework.spec.ts` (7 test)
- **Bug report:** .agent/bugs/2026-09-12-cosmos-reveal-hover-relative-url/bug.md
- **Cách phòng tránh:**
  - Reveal-on-scroll: **không dùng threshold > 0**; luôn có sweep fail-safe ngoài scroll (load + visibilitychange) — nội dung không bao giờ kẹt ẩn.
  - Một element một kênh: reveal/animation dùng `translate`/`opacity`, hover dùng `transform` — tránh cùng property thì specificity quyết định ngầm.
  - Static site: mọi tài nguyên tương đối (link + fetch) phải resolve qua `dirBase()` — test bằng URL **không slash cuối** (vì `serve`/proxy có thể redirect bỏ `index.html`).
  - Element bị grid stretch → container `flex:1` để nội dung fill, không để void đáy.
  - Test tương tác phải assert **trạng thái cuối sau scroll toàn trang ở 375** + hover computed transform + link resolve — không chỉ screenshot màn đầu.

### KN-042 — YT Summary mobile: CSS toàn cục đè trang mới (bảng ẩn/cắt, `[hidden]` vô hiệu, card dưới header) (major)
- **Bài học:** Namespace class trang (`.yts-table-wrap`) + `.yt-table{min-width:0}`; mobile thêm `tr[hidden]{display:none}`; `scroll-margin-top:72px` cho section; test invariant: `table.scrollWidth≤clientWidth`, `.seg-row` visible+height>20, `.seg-detail:not([hidden])`=0, card `y≥48`
- **Bug report:** .agent/bugs/2026-09-12-yt-summary-css-global-collision/bug.md
- **Cách phòng tránh:**
  - Trang mới dùng chung `www/styles.css`: **namespace mọi class** (`.<page>-*`); trước khi đặt tên, grep stylesheet toàn cục xem tên đó có rule `display:none` / `min-width` / ẩn mobile không.
  - Rule `display:block` cho `tr/td` (table→card) **bắt buộc** kèm `[hidden]{display:none}`.
  - Site có fixed header → mọi anchor/scrollIntoView cần `scroll-margin-top` ≥ header height.
  - Test mobile phải assert **trong-container** (`table.scrollWidth ≤ clientWidth`) — `documentElement` overflow không bắt được tràn bên trong scroll container.

### KN-045 — STATUS audit: link footer 404 trên Pages + registry placeholder descriptions + aria-labelledby tab sai ID (major)
- **Bài học:** Footer trỏ `github.com/mrdanhdanh/CLAUDE_VS#readme`; refresh 9 description registry từ frontmatter + regenerate; tab buttons thêm `id`+`aria-controls`, panel trỏ `tabbtn-*`; khóa bằng `tests/e2e/status-audit.spec.ts` (4 invariant: link/placeholder/ARIA/tab)
- **Bug report:** .agent/bugs/2026-09-12-status-page-audit/bug.md
- **Cách phòng tránh:**
  - Link trong `www/` **không được trỏ ra ngoài deploy root** (`../`) — chỉ link nội bộ hoặc URL tuyệt đối (GitHub/Pages); verify bằng browser fetch all-links, không nhìn mắt (KN-005/KN-030).
  - Nguồn hiển thị (registry/status) là **hợp đồng với user** — placeholder `${type} ${name}` không bao giờ được render ra UI; frontmatter đổi → refresh registry description + regenerate (test L2 chặn pattern).
  - Mọi ARIA ref (`aria-labelledby/controls/describedby`) phải trỏ ID tồn tại — test scan toàn DOM (L3); tab dùng pattern button `id` + `aria-controls` ↔ panel `aria-labelledby`.
  - Audit page định kỳ gồm 4 invariant: link resolve · data quality · ARIA refs · console errors.

### KN-046 — Cosmos: scroll-dot "Tương lai" chết (section thiếu `id`) — điều hướng fail-silent (major)
- **Bài học:** Thêm `id="future"` + comment lý do; invariant mới trong `cosmos-lab12-qec.spec.ts`: `missing targets = []` + click dot → section top < 300px; derive danh sách section từ DOM thay vì mảng hardcode
- **Bug report:** .agent/bugs/2026-09-12-cosmos-future-scroll-dot/bug.md
- **Cách phòng tránh:**
  - Điều hướng `data-target`/`href="#id"` + JS `if (el)` = **fail-silent**: luôn có test invariant "mọi target phải resolve" — test nội dung đích không thay thế được (KN-037).
  - Nav/observer **derive từ DOM** (`document.querySelectorAll('.scroll-dot')`) thay vì mảng id hardcode — 2 nguồn song song là nguồn drift (KN-038 class).
  - Checklist khi thêm section mới: `id` + entry nav + observer + anchor test (giống checklist thêm link trong `www/`, KN-045).
  - Control không làm gì và không báo gì = bug **major**, không phải "nhỏ" — cùng class KN-011 (nút chết sau Random).

## Anti-patterns (đừng lặp lại)

- - ❌ Điều hướng `data-target`/`href="#id"` mà JS bọc `if (el)`/`.filter(Boolean)` → control chết im lặng khi section thiếu `id`; phải có invariant "mọi target resolve" (KN-046).
- - ❌ Danh sách id cho nav/observer hardcode trong JS tách rời DOM — thêm section là có thể tạo dot chết; derive từ DOM (KN-046).
- - ❌ Test chỉ assert **nội dung đích** (card/text/count) mà không assert **điều hướng tới đích** — 36 test xanh vẫn lọt dot chết (KN-046 + KN-037).
- - ❌ Để `<link rel=stylesheet>` third-party (Google Fonts) blocking trong head — nó chặn luôn EXECUTION của mọi inline script phía sau, app "chết đứng" trên mạng chậm (KN-029).
- - ❌ Overlay che nội dung không có fail-safe timer độc lập engine → engine fail là kẹt màn đen vĩnh viễn (KN-029).
- - ❌ Click-anywhere-skip không grace period → user click nhầm lúc mới mở là mất intro (KN-029).
- - ❌ Fetch tài nguyên NGOÀI deploy root (`../../.agent/...` khi Pages chỉ có `www/`) → 404, fallback demo che bug (KN-030).
- - ❌ Fetch relative không tính URL bỏ slash cuối (`/cosmos` + `./x` → `/x` 404) — phải qua helper `dirBase` (KN-030).
- - ❌ Test chỉ assert UI text khi có fallback demo → "demo" vẫn xanh giả; phải assert network không-404 + badge "thật" (KN-030).
- - ❌ Reduced-motion = `opacity:1 !important; animation:none !important` cho toàn bộ overlay → static pop-in, user tưởng "trang không có hiệu ứng" (KN-031).
- - ❌ Rút gọn trải nghiệm vì setting của user mà không nói lý do trong UI (KN-031).
- - ❌ Timeline intro chạy khi tab ở background → user switch về là đã hết (KN-031).
- - ❌ Test animation bằng wall-clock cố định (Edge cold-start → flaky); phải poll state + test trên Edge thật khi user dùng Edge (KN-031).
- - ❌ Throw trong rAF callback tưởng được try/catch ngoài bắt — lỗi async → engine đứng hình im lặng; browser test thiếu assert no-pageerror là mù (KN-032).
- - ❌ Viết `status.json` tay không qua generator → data shape lệch với render (KN-002).
- - ❌ Không test responsive 375/768/1280 trước khi commit `www/` (KN-002).
- - ❌ Hardcode màu/spacing không dùng CSS variables (KN-002).
- - ❌ Detect `@property` bằng `CSS.supports('syntax: ...')` (luôn false) → ép JS fallback sai (KN-003).
- - ❌ Animate custom property qua biến lồng `var()` chứa `var()` → một số engine không re-resolve (KN-003).
- - ❌ Gắn fallback class per-element rồi để UI reset `className` → mất animation (KN-003).
- - ❌ Chỉ làm dark theme, không có light theme + toggle persist + early init (KN-006).
- - ❌ Fix bug encoding bằng cách xóa dấu tiếng Việt — phải giữ UTF-8 chuẩn (KN-006).
- - ❌ Dùng PowerShell here-string cho file UTF-8 tiếng Việt → corrupt (KN-006).
- - ❌ NavMenu minimal không có badge/grouping/aria-label (KN-006).
- - ❌ Define setup function (resize/init) xong tưởng đã chạy — quên invoke khởi tạo → canvas buffer 300×150 bị CSS kéo giãn, hạt nổ từ góc (KN-028).
- - ❌ Behavior test xanh (visible/hidden) mà không assert geometry invariant → hiệu ứng sai vị trí vẫn PASS (KN-028).
- - ❌ Để Playwright phụ thuộc external render-blocking (fonts CDN) → `load` trễ làm test flaky giả (KN-028).
- - ❌ `hideAll()` disable button rồi caller không re-enable → Random xong không step được (KN-011).
- - ❌ Chọn viewBox gần vuông (772×652) cho diagram — render tràn first-screen; ưu tiên ratio dẹt ≥1.7:1 (KN-017).
- - ❌ Đổi viewBox width mà không tính scale text — width 1400 → scale 0.66 → text < 6px fail readability (KN-017).
- - ❌ Đổi viewBox mà không rescale tọa độ y (messages/activations/segments) — messages rơi ngoài readable timeline (KN-017).
- - ❌ Tin 9/9 showcase checks là đủ — nó không bao gồm browser containment; phải chạy `visual-check` với `ARCHIFY_CHROME` (KN-017).
- - ❌ Re-define metric (D/G/S) mà không grep sweep `www/`+`docs/`+`.github/` — content drift giữa trang và source of truth (KN-038).
- - ❌ Science shorthand không tách bạch vật lý thật vs ẩn dụ — "đổi một → đổi cả hai tức thì" ngụ ý truyền tin FTL, sai no-signaling (KN-038).
- - ❌ Link trong `www/` trỏ ra ngoài deploy root (`../README.md`) — chỉ "chạy" khi serve từ repo root, lên Pages là 404 (KN-045).
- - ❌ Render description raw từ registry mà không kiểm placeholder (`hook hooks`, `agent designer`, `prompt harness`) — mặt tiền trông như trang lỗi (KN-045).
- - ❌ `aria-labelledby`/`aria-controls` copy value `data-tab` thay vì ID phần tử tồn tại — screen reader đọc sai ngữ cảnh (KN-045).

## Nguồn

- `docs/knowleged.md` — KN-001, KN-002, KN-003, KN-004, KN-006, KN-011, KN-017, KN-028, KN-029, KN-030, KN-031, KN-032, KN-038, KN-040, KN-042, KN-045, KN-046
- Chi tiết đầy đủ: `references/evidence.md` (progressive disclosure)
- Regenerate: `node .github/harness/scripts/distill-agnostic.mjs`
