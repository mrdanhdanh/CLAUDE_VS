---
name: harness-web-ui
description: "Task-agnostic lessons 'Web UI & UX' chưng cất từ docs/knowleged.md (22 KN: KN-001, KN-002, KN-003, KN-004, KN-006, KN-011, KN-017, KN-028, KN-029, KN-030, KN-031, KN-032, KN-038, KN-040, KN-042, KN-045, KN-046, KN-050, KN-055, KN-058, KN-073, KN-082) + .agent/bugs/. Use when task chạm ui, a11y, css, responsive, data, animation, spacing, i18n, theme, contrast — áp Cách phòng tránh trước khi code, tránh lặp bug cũ. DisCo-lite, regenerate bằng distill-agnostic.mjs."
user-invocable: false
---

# Harness Web UI & UX — Bài học task-agnostic (DisCo-lite)

> Chưng cất từ `docs/knowleged.md` + `.agent/bugs/` — **KHÔNG sửa tay**, regenerate bằng `node .github/harness/scripts/distill-agnostic.mjs`. Nguồn: DisCo arXiv:2609.02749v1 §3.2 (task-agnostic).

## When to Use

- Task chạm theme **Web UI & UX** (tags: ui, a11y, css, responsive, data, animation, spacing, i18n, theme, contrast, state, ux, button, diagram, archify, verify, canvas, bug-blindness, perf, font, script-blocking, pages, fetch, url, reduced-motion, edge, error-handling, docs, physics, content-drift, nav, fail-silent, grid, render, github, mermaid, race, cosmos, clip)
- Trước khi code/fix — áp **Cách phòng tránh** ngay để không lặp bug cũ
- Review/plan — check anti-patterns bên dưới

## Bài học (22 KN)

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
  - Instance đã gặp: **KN-004** (rainbow hover `www/index.html`) — cùng root cause, đọc kèm.

### KN-004 — grid-2 thừa khoảng cách + rainbow border index.html không xoay khi hover (minor)
- **Bài học:** Wrapper `.grid-2` tự mang `margin` (code hiện tại: `margin:20px 0`), con `.section` đặt `margin:0`; animate `--angle` dùng `conic-gradient(from var(--angle), ...)` trực tiếp
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
- **Bài học:** Third-party CSS luôn async (`media="print" onload`) + noscript; fail-safe mở nội dung khi engine fail; grace 1000ms chống click nhầm (nâng từ 600ms — xem KN-031); glyph chi tiết vẽ bằng CSS
- **Bug report:** .agent/bugs/2026-09-10-google-fonts-chan-script-intro-khong-hien/bug.md
- **Cách phòng tránh:**
  - Third-party CSS (fonts/CDN) **luôn async** hoặc self-host — không bao giờ để chặn first script của trang.
  - Overlay che nội dung phải có **fail-safe timer độc lập với engine** (engine fail → tự mở nội dung, không bao giờ kẹt màn đen).
  - Skip kiểu click-anywhere phải có **grace period (~1000ms — nâng từ 600ms sau KN-031)** chống click nhầm khi vừa mở.
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
  - **Amend 2026-09-24 (TÁI LẬP — bug `.agent/bugs/2026-09-23-registry-description-stale-sau-create-skill/`):** lưới L2 ban đầu chỉ khớp **một** mẫu placeholder `^(type)\s+<name>$`; nhưng `harness-manager create` lưu description **từ template**, và template skill dùng placeholder dạng **prose** (`Mô tả skill — Use when ... (keyword-rich để agent tự tìm)`) không chứa type/name ⇒ regex mù ⇒ `www/status.json` hiện câu template như mô tả thật. `disable`/`enable`/`sync` đều **không** refresh (chỉ `install <type> --local <path> --force` mới đọc lại frontmatter). **Bài học:** lưới phải nhận diện **họ** placeholder (type+name · prose `^Mô tả (skill|agent|instruction|prompt|hook|ngắn)` · biến `{{NAME}}` chưa resolve), không phải một mẫu chuỗi — đổi văn phong template là mẫu cũ mù ngay. L2 đã mở rộng thành mảng `patterns[]`; RED (1 failed) → GREEN (5 passed).

### KN-046 — Cosmos: scroll-dot "Tương lai" chết (section thiếu `id`) — điều hướng fail-silent (major)
- **Bài học:** Thêm `id="future"` + comment lý do; invariant mới trong `cosmos-lab12-qec.spec.ts`: `missing targets = []` + click dot → section top < 300px; derive danh sách section từ DOM thay vì mảng hardcode
- **Bug report:** .agent/bugs/2026-09-12-cosmos-future-scroll-dot/bug.md
- **Cách phòng tránh:**
  - Điều hướng `data-target`/`href="#id"` + JS `if (el)` = **fail-silent**: luôn có test invariant "mọi target phải resolve" — test nội dung đích không thay thế được (KN-037).
  - Nav/observer **derive từ DOM** (`document.querySelectorAll('.scroll-dot')`) thay vì mảng id hardcode — 2 nguồn song song là nguồn drift (KN-038 class).
  - Checklist khi thêm section mới: `id` + entry nav + observer + anchor test (giống checklist thêm link trong `www/`, KN-045).
  - Control không làm gì và không báo gì = bug **major**, không phải "nhỏ" — cùng class KN-011 (nút chết sau Random).

### KN-050 — AI-gen UI gãy 4 luật UX: div giả button + dialog không trap + nút bé + sameness + cognitive load (major)
- **Bài học:** Prompt phải ghi tường minh a11y contract (button thật, focus trap, 44px, contrast) + dùng component đã verify (Radix/shadcn) + test Tab/Esc/screen-reader, không tin mắt
- **Bug report:** —
- **Cách phòng tránh:**
  - Không merge UI AI-gen khi chưa **Tab-walkthrough** (mọi control tới được + kích hoạt bằng Enter/Space) + **Esc đóng overlay** + focus trả về chỗ cũ.
  - Cấm `div+onClick` cho control — phải `<button>/<a>/<select>` thật; icon-only button bắt buộc accessible name.
  - Touch target **≥44×44px** + contrast ≥4.5:1 là requirement trong prompt/spec, không phải "nice-to-have".
  - Chống sameness: prompt ghi palette/typo/layout khác default (không indigo/Inter mặc định) — Von Restorff là feature, không phải bug.
  - Đo cognitive: task success + thời gian + perceived load trên scenario thật (E2E eval KN-037) — clutter là fail.

### KN-055 — Grid `1fr` + flex nowrap: min-content blowout ẩn — title dài lộ bug, overflow:hidden che clip (major)
- **Bài học:** Grid luôn `minmax(0,1fr)`; text nowrap bọc `<span style="min-width:0;overflow:hidden;text-overflow:ellipsis">`; verify **cả** document scroll **và** element-vs-container (clip)
- **Bug report:** .agent/bugs/2026-09-13-status-375-overflow-grid-1fr-min-content-blowout-k/bug.md
- **Cách phòng tránh:**
  - Grid track luôn `minmax(0,1fr)` — không bao giờ bare `1fr` cho container content động (track `1fr` = `minmax(auto,1fr)` → blowout).
  - Text `white-space:nowrap` + ellipsis: phải nằm trên element **có thể co** (`min-width:0` item) — không đặt ellipsis trên flex container chứa text trực tiếp (anonymous item không shrink, ellipsis không áp dụng).
  - Verify responsive 2 lớp: document scroll **và** element-vs-container (`el.getBoundingClientRect().right > container.clientWidth` trên descendant của `overflow:hidden` — scroll test mù với clip).
  - Content dài là **test input thật** — khi thêm title/entry mới vào data-driven UI, chạy lại invariant responsive trước khi claim done (title ngắn cũ "vừa khít" là điều kiện che bug, không phải bằng chứng an toàn — KN-028 bug blindness).

### KN-058 — GitHub viewscreen race: mermaid README lỗi "Cannot read properties of undefined (reading 'render')" — syntax đúng không cứu được race, front page dùng asset tĩnh (minor)
- **Bài học:** Front page dùng SVG tĩnh `<picture>` light/dark; regenerate với `{ htmlLabels:false, flowchart:{ htmlLabels:false } }` → pure SVG text, XML valid, decode OK; guard 5 test (cấm mermaid + tồn tại + XML validity/không foreignObject + img.decode + source giữ)
- **Bug report:** .agent/bugs/2026-09-13-github-viewscreen-race-readme-mermaid-khong-render/bug.md
- **Cách phòng tránh:**
  - Rich-display/render lỗi từ bên thứ ba (GitHub mermaid, embed, CMS): **repro bằng chính asset/bundle của họ TRƯỚC khi sửa** (download JS → chạy in-process, dispatch đúng protocol) — sửa mù theo triệu chứng chỉ tốn thời gian (KN-023).
  - **"Tồn tại" ≠ "render được"**: guard asset không dừng ở `fs.existsSync` — verify bằng **decode thật** (`img.decode()` + `naturalWidth>0`) và **DOMParser** cho SVG (bắt `parsererror`); negative control: chạy check trên bản cũ phải FAIL (test cả phép đo — KN-049).
  - **img `nw:0` + `decode FAIL` KHÔNG được dismiss là "cache/artifact"** — kiểm soát bằng control image trên cùng page (avatar GitHub load OK mà asset mình fail = asset lỗi thật, không phải môi trường).
  - SVG cho `<img>` phải là XML hợp lệ + không `foreignObject`: mermaid v11 cần `htmlLabels:false` ở **cả top-level lẫn `flowchart`**; `<br>` không đóng từ HTML label là dấu hiệu config chưa chuẩn.
  - Trang quan trọng (front page, README, landing): **không phụ thuộc renderer ngoài kiểm soát** — asset tĩnh (SVG/PNG, cả light/dark) là mặc định; mermaid chỉ để ở docs có thể chấp nhận rủi ro.
  - Tiêu chí đúng là "**render ở MỌI môi trường**", không phải "render ở máy mình" (KN-019); môi trường khác (fetch tool/browser khác/shard khác) là phép thử thật.
  - Error message JS generic (`Cannot read properties of undefined (reading 'X')`) từ app bên thứ ba: grep bundle của họ tìm call site `.X` để khoanh vùng, đừng đoán theo nguyên nhân "hợp lý".

### KN-073 — scroll-dot active sai do thứ tự mảng lệch DOM (minor)
- **Bài học:** Điều hướng active phải bất biến thứ tự (argmax `offsetTop ≤ mid`) + derive danh sách từ DOM (KN-046) — và test phải assert active-state, không chỉ target-resolve
- **Bug report:** .agent/bugs/2026-09-19-scroll-dot-active-sai-do-thu-tu-mang-lech-dom/bug.md
- **Cách phòng tránh:**
  - Không chọn phần tử active kiểu last-wins theo thứ tự duyệt — dùng tiêu chí so sánh tường minh (argmax/min theo vị trí).
  - Danh sách đích nav/observer derive từ DOM (1 nguồn — KN-046), không hardcode 2 danh sách song song.
  - Test điều hướng phải assert active-state, không chỉ target-resolve + click — 77 test xanh từng lọt lỗi này.
  - Chạy `node .github/harness/scripts/auto-learn.mjs suggest "<từ khóa>"` trước khi code tương tự.

### KN-082 — Font thiếu coverage tiếng Việt vỡ dấu im lặng trong canvas clip (Georgia) (major)
- **Bài học:** Asset render: font phải coverage-verified (Georgia vào blacklist) + đo bằng `font-test` trước khi build + lưới máy quét mọi clip page + re-verify ảnh sau đổi font
- **Bug report:** .agent/bugs/2026-09-26-font-georgia-vo-dau-tieng-viet-trong-canvas-clip/bug.md
- **Cách phòng tránh:**
  - Trước khi build clip dùng font mới: chạy `node .github/skills/video-clip/references/font-test.mjs` — không tin font nào chưa đo.
  - Font cho text tiếng Việt trong canvas: **blacklist Georgia** (thiếu glyph); thêm font mới phải kèm phép đo trước khi whitelist.
  - Ảnh khung phải XEM bằng mắt ở zoom đủ lớn (bug này không throw — chỉ mắt hoặc lưới máy bắt được — KN-028 class).

## Anti-patterns (đừng lặp lại)

- - ❌ Chọn font cho asset render (canvas/clip) theo thói quen mà không đo coverage ngôn ngữ đích trên MÁY RENDER — Georgia thiếu glyph VN (ằ/ấ/ớ/ố) → vỡ dấu im lặng ("thô ng kê"), không throw, guard ảnh không tự bắt; đo bằng `references/font-test.mjs` trước khi build + blacklist scan `clip-font-guard.spec.ts` (KN-082 + KN-006 + KN-028).
- - ❌ Tự động hoá "merge candidate" giữa các KN bằng similarity thuần (BM25 tên+tags) rồi gộp/xoá theo điểm — đo thật 14/09 (EvoLib adopt): cặp khác chủ đề vẫn 70–96 điểm (KN-054↔KN-037 86.6 · KN-040↔KN-030 96.1), không phân tách được khỏi cặp liên quan thật (KN-026↔KN-036 80.6) → không dùng làm căn cứ; consolidation giữ human-in-loop: dup-gate lúc nạp + 0-ref policy + git trace (KN-062 + KN-049 + KN-026; chi tiết `.agent/plans/evolib-adopt/proposal.md`).

## Nguồn

- `docs/knowleged.md` — KN-001, KN-002, KN-003, KN-004, KN-006, KN-011, KN-017, KN-028, KN-029, KN-030, KN-031, KN-032, KN-038, KN-040, KN-042, KN-045, KN-046, KN-050, KN-055, KN-058, KN-073, KN-082
- Chi tiết đầy đủ: `references/evidence.md` (progressive disclosure)
- Regenerate: `node .github/harness/scripts/distill-agnostic.mjs`
