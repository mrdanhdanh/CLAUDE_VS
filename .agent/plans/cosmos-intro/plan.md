# Plan — COSMOS Intro Cinematic

> File duy nhất: `www/cosmos/index.html` (single-file convention). 4 edits: head gate script · CSS · HTML · JS.

## Todos
1. [ ] CSS intro (`.intro*` ~130 dòng) chèn trước `</style>` — overlay, core, flash, char stagger, skip, progress, hint, exit, reduced-motion. `Ladder nấc: 4 (native CSS animation)` · Entangled: không (scope nội bộ block)
2. [ ] Head inline script sau `</style>`: `document.documentElement.classList.add('intro-on')` — set trước first paint (no flash, no-JS = no intro). Entangled: CSS selector `html.intro-on`
3. [ ] HTML overlay ngay sau `<body>`: canvas + flash + core + content(title/sub/tagline) + skip button + progress + hint. `Ladder nấc: 7` (markup tối thiểu)
4. [ ] JS engine cuối `<script>`: timeline, canvas burst (240 hạt + shockwave), skip (button/Esc/click), focus + inert, cleanup rAF/timer, reduced-motion branch, failsafe auto-finish schedule-first. Entangled: `.intro` CSS classes (`play`/`done`/`fast`)
5. [ ] Playwright spec `tests/e2e/cosmos-intro.spec.ts`: cover kín viewport · auto-reveal · skip click/Esc · reduced-motion · 375 responsive + screenshot evidence → `.agent/plans/cosmos-intro/verify/`
6. [ ] Chạy `npx playwright test tests/e2e/cosmos-intro.spec.ts`, `get_errors`, visual check 3 viewport; fix loop ≤3

## Rủi ro & phòng
- **Overlay kẹt nếu JS lỗi** → schedule fail-safe finish ĐẦU TIÊN, try/catch riêng cho canvas.
- **Flash nội dung** → gate class trên `<html>` từ `<head>` (trước body paint).
- **rAF leak** → `cancelAnimationFrame` trong `finish()`; stop loop khi hết hạt.
- **Mất chữ tiếng Việt** → file UTF-8, không dùng escape; copy nguyên dấu (KN-006).
- **Reduced-motion** → media query CSS + nhánh JS TOTAL ngắn, không canvas.
- Verify theo KN-003: đo bằng tool (Playwright + elementFromPoint), không nhìn mắt.

## Verify commands
```powershell
npx playwright test tests/e2e/cosmos-intro.spec.ts --reporter=list
node -e "..."  # (không cần) — đã có spec
```

---

## V4 todos (2026-09-11) — đạo diễn lại motion, không thêm particle — ✅ DONE (12/12 verify + 17/17 regression)
1. [x] Docs V4 (prd/design/plan) + RED script `verify/v4-verify.mjs` → RED 4/11 fail (thiếu hooks) → GREEN 12/12
2. [x] CSS: white cut/flash/core mới · char solidify 2.78s (stagger .014) · `.intro-firstlight` (3.04s) · title squeeze 2.55s · reduced-motion giữ nguyên (hide firstlight)
3. [x] HTML: thêm `<div class="intro-firstlight">` trong `.intro-content`
4. [x] JS BOOM/MATTER: pre-stars 34% + contraction (0.70–0.845) + white cut 90ms; waves glow ×5; star warp 52 + flash; debris reaction (impulse ×2); storm 1.05s
5. [x] JS GRAVITY: buildSpiral density field (bulge 12% + 2 major grand-design + 2 minor + dust ~14%, R_EDGE, PA −.35) + heroAt boost + sparks ra halo (.36–.58 mDim)
6. [x] JS INTELLIGENCE: crystal edge/inner classification (≤300 edge + ≤200 inner) + 3-stage timing + collapse flash band
7. [x] JS FIRST LIGHT: flAt envelope + nucleus ✦ sparkle + galDim ×(1−.42fl)
8. [x] JS CAMERA: spring camVel (k .020, damp .86^dt) + `__introDbg` getters + `freeze(ts)/unfreeze()` cho evidence
9. [x] JS QUANTUM: cloud 88 hạt noise → collapse 3.72 (2 hàng 44 điểm cyan) + qProg
10. [x] GREEN: 12/12 verify (2 pass: metrics + evidence frozen 12 stage) + rubric 2.0/4.6 đạt + suite cũ 11/11 (chromium+msedge) + 6/6 cosmos specs + docs updated

### Kết quả đo (verify run 2026-09-11)
- cam: kick **1.0273** @1.25s → settle **1.0256** @2.0s → push **1.0463** @4.6s (Δ 3.5→4.6 = **+0.028**)
- qProg: **0** @3.5s → **1** @4.6s · cloud **88** hạt · 0 pageerror (metrics + 12 evidence pages)
- Frames duyệt rubric: `v4-0800` (singularity swell) · `v4-1700/2000` (galaxy silhouette ✓) · `v4-2500` (crystal outline bằng hạt ✓) · `v4-2700` (fill) · `v4-2950` (solidify wave + cut line) · `v4-3100` (first light aftermath) · `v4-3500` (noise) · `v4-4600` (hero 5/5) · `v4-4900` (ordered rows)
- **Deviation có chủ đích:** chữ solidify dạng sóng trái→phải 2.78→3.2s (spec ghi "2.82 chữ hoàn chỉnh" — bất khả vì fill particles LÀ chữ tới 2.80; sóng là bản khả thi trung thực của "white collapse → chữ đặc"). First Light lùi 3.04s để quét qua chữ đã đặc phần lớn.

### Rủi ro & phòng
- **Chữ solidify nhanh mất nhịp** → giữ stagger .014s + canvas collapse flash phủ dải chữ.
- **Silhouette màu nhạt** → dust field α ≤ .24, major α ≥ .66; rubric screenshot 2.0s trước khi chốt.
- **rAF throw (KN-032)** → verify script assert no-pageerror ngay đầu suite.
- **Reduced-motion regression (KN-031)** → không đụng nhánh reduced; firstlight bị hide trong media query.
