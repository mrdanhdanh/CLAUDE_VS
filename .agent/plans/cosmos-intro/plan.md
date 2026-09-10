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
