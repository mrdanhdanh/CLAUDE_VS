# Bug — Cosmos rework: reveal chết ở element > viewport + hover bị reveal đè + `./x` 404 khi URL không slash

- **Ngày:** 2026-09-12
- **Slug:** `2026-09-12-cosmos-reveal-hover-relative-url`
- **KN:** KN-040
- **Severity:** critical
- **Trang:** `www/cosmos/index.html` (+ `slides.html`, `scale.html` gián tiếp)
- **Reporter:** YUNIE (task "rework lại giao diện, kiểm tra các hiệu ứng, liên kết, xử lý")

## 1. Reproduce (evidence)

| # | Steps | Expected | Actual | Evidence |
|---|-------|----------|--------|----------|
| 1 | Mở `/cosmos/index.html` @375×780, scroll hết trang | Mọi section hiển thị | **Cả khu Lab (11 thí nghiệm, 6696px) tàng hình vĩnh viễn** | probe: `#lab maxRatio=0.116 < threshold 0.12`; `.reveal:not(.in)` còn `#lab` |
| 2 | Hover `.card` (Tầng Vũ Trụ) @1280 | Nhấc lên -3px | Không nhấc | `getComputedStyle(...).transform` = `none` (hover) |
| 3 | Mở URL `/cosmos` (serve redirect bỏ `index.html`), click "Slides" | Sang slides.html | 404 `/slides.html` | `new URL('./slides.html', 'http://localhost:3000/cosmos')` → `/slides.html` → 404 |
| 4 | Click map node "CMB" | Mở knowleged.md | 404 (`../../docs/...` ngoài www/) | diagnose: `brokenInternal[0].status = 404` |
| 5 | Lab card ngắn (Heisenberg) cạnh card cao | Cân đối | ~200px void đáy | đo: card stretch nhưng nội dung không fill |

## 2. Root cause (5 Whys)

- Why1: `IntersectionObserver{threshold:0.12}` — `#lab` cao 6696px, viewport 780px → ratio tối đa `780/6696 = 0.116` **luôn < 0.12** → không bao giờ đủ điều kiện reveal.
- Why2: `.reveal.in{transform:none}` (dòng ~800) đứng SAU `.card:hover{transform:translateY(-3px)}` (dòng ~250), **cùng specificity (0-2-0)** → hover thua; parallax inline `style.transform` cũng đè.
- Why3: `href="./x"` resolve theo document base; URL `/cosmos` (không slash — `serve` redirect `/cosmos/index.html → /cosmos`) → `./x` = `/x` → 404. KN-030 trước đó chỉ fix **fetch** (bằng `dirBase()`), chưa fix **link attribute**.
- Why4: Void đáy = grid stretch đặt chiều cao card = max trong hàng, nhưng `.lab-card`/`.lab-body` không flex fill.
- Why5 (Root): Verify cũ chỉ đo "render được ở màn đầu" — 36/36 test xanh vẫn lọt cả 4 bug vì **không có assertion trạng thái cuối sau scroll toàn trang ở mobile** + không test hover/link ở URL dạng redirect.

## 3. Fix

| # | Fix | File |
|---|-----|------|
| 1 | IO `threshold:0` + `revealSweep()` fail-safe (rAF scroll + `load` + `visibilitychange`) — chống cả tab ẩn/throttle | `www/cosmos/index.html` |
| 2 | Tách kênh property: `.reveal` dùng `translate`, hover giữ `transform`; bỏ parallax 8px vô hình trên `.card` (+ xóa dead var) | `www/cosmos/index.html` |
| 3 | `fixRelLinks()` — rewrite mọi `a[href^="./"]` qua `dirBase(location.pathname)`; áp cả link tĩnh (load) + link render động (map detail) | `www/cosmos/index.html` |
| 4 | Map link `../../docs/...`, `../../.agent/...` → GitHub blob URL (Pages không deploy ngoài `www/`) | `www/cosmos/index.html` |
| 5 | `.lab-card` flex column + `lab-body{flex:1;display:flex}` + `lab-demo{flex:1}` | `www/cosmos/index.html` |
| 6 | Anchors: `section[id]{scroll-margin-top:calc(header + 28px)}`; "Điểm đo" thêm đơn vị; stack fan ±44px + blur/fade back cards | `www/cosmos/index.html` |

## 4. Verify (fresh evidence)

- `cosmos-rework.spec.ts` — 7 test mới: reveal @375 + @1280, links (0 escape + internal 200), hover lift (`-3px`/`-2px`), lab card fill (gap ≤ 24px — đo được 1px), anchor dưới header, brand `--angle` xoay + click 30+ nút không lỗi.
- **Full suite: 43/43 pass** (36 cũ + 7 mới), 0 pageerror/console error.
- diagnose.mjs sau fix: `brokenInternal: []`, `pageErrors: []`.
- Screenshots: `.agent/plans/cosmos-rework/verify/final-375-lab-visible.png`, `final-1280-lab-fill.png`, `final-1280-card-hover.png`, `final-stack-zoom.png`.

## 5. Files changed

- `www/cosmos/index.html` — 12 edits (CSS: reveal/translate, scroll-margin, lab-card flex, super-card stack; JS: threshold, revealSweep, fixRelLinks, bỏ card parallax, map links, đơn vị)
- `tests/e2e/cosmos-rework.spec.ts` — mới, 7 test
- `docs/knowleged.md` — KN-040 (bảng + chi tiết + UpdatedAt)
- `.agent/plans/cosmos-rework/` — prd.md, design.md, plan.md, verify/* (evidence)

## 6. Mở rộng — bug class cần quét cho trang khác

- Reveal-on-scroll: `threshold > 0` ở bất kỳ element nào có thể cao hơn viewport → cùng bug. `scale.html`/`slides.html` không dùng IO → OK (đã grep).
- `a[href^="./"]` + URL không slash: đã fix cho `index.html` (trang duy nhất bị redirect dạng directory). `slides.html`/`scale.html` luôn có filename trong URL → không bị.
