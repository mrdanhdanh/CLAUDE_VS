# Plan — Agentic Academy (implement todo-driven)

> Pipeline `/harness` · TDD gate: spec RED trước → GREEN sau · Evals gate: rubric PRD §5 · evidence `.agent/plans/agentic-academy/verify/`

## Todos

| # | Todo | Ladder nấc | Entangled with | Verify |
|---|------|-----------|----------------|--------|
| 1 | ✅ Explore knowledge + pattern cosmos | 2 (reuse) | knowleged.md, www/cosmos/* | KN scan + engine grep |
| 2 | ✅ Verify rules file từng IDE | — | docs (web) | 4 fetch nguồn chính chủ |
| 3 | ✅ Ghi PRD + Design + Plan | 7 | .agent/plans/agentic-academy/* | 3 file tồn tại |
| 4 | Viết Playwright spec (RED) | 6 | tests/e2e/agentic-academy.spec.ts | `npx playwright test` FAIL có chủ đích |
| 5 | Build `store.js` + `lessons.js` + `diagrams.js` | 7 | store↔lessons↔diagrams | get_errors sạch |
| 6 | Build `index.html` + `slides.html` + `app.js` + `slides.js` + `styles.css` | 7 | 7 files chéo | get_errors sạch |
| 7 | Polish responsive + animation + a11y | 4 (native CSS) | styles.css | 375/768/1280 overflow=0, reduced-motion OK |
| 8 | Verify GREEN + visual | — | spec + screenshots | 8/8 test pass + full suite không hồi quy |
| 9 | status.json + audit + report | — | www/index.html, status.json, audit.jsonl | generate-status + audit verify |

## Chi tiết kỹ thuật (đọc kỹ trước khi code)

### store.js (lõi chung — sửa là văng cả 2 trang)
```js
const KEY = 'agentic-academy:progress:v1';
load() → {done:{}} (JSON.parse guard try/catch, sai shape → reset 0)
save(state) · toggle(id) · isDone(id) · count() · reset()
dirBase(pathname)  // KN-040: URL không '/' cuối
fixRelLinks(root)  // rewrite a[href^="./"] qua dirBase
toast(msg)         // pattern cosmos
```

### lessons.js — data contract (app + deck đọc chung)
```js
window.ACADEMY = { meta:{version,updatedAt}, lessons:[{
  id:'k1', num:1, icon:'🧠', accent:'#00d992', title:'…', sub:'…', desc:'…',
  duration:'12 phút', tags:['Tư duy','Pattern'],
  slides:[ {type:'cover'|'bullets'|'diagram'|'steps'|'code'|'compare'|'outcome'|'sources', …} ],
  outcome:{ files:[{p,why}], criteria:[…] },  // đổ vào slide type outcome
  sources:[{n,u,note}]                        // đổ vào slide type sources
}]}
```
7 bài — nội dung theo PRD §4; mỗi bài 11-12 slides; facts IDE chỉ lấy từ PRD §4 (đã verify 2026-09-12, kèm URL).

### Spec contract (selectors — không đổi khi implement)
- Home: `#heroTitle`, `.lesson-card[data-lesson]` ×7, `.status-chip`, `#progressBar[aria-valuenow]`, `#progressText`, `#continueBtn`, `#resetBtn`, `#sysTree`
- Deck: `#deckTitle`, `.slide` ×N, `.slide.active`, `#slideCounter`, `#deckProgress[aria-valuenow]`, `#fsBtn`, `#markBtn[aria-pressed]`, `#nextBtn`, `#prevBtn`
- localStorage key `agentic-academy:progress:v1`

### Test plan (8 — RED trước)
1. home: hero + 7 cards + 0/7 + no pageerror + no 4xx/5xx
2. home→card k1→slides?lesson=k1 → deck title khớp
3. deck: N slides, counter 1/N, ArrowRight→2/N, End→last .slide có `.outcome`
4. mark: #markBtn → aria-pressed true; về home → chip "Đã học", 1/7; reload → giữ
5. reset: dialog accept → 0/7, localStorage sạch
6. robust: `/agentic-academy/slides.html?lesson=k3` deep-link OK + home link đúng; URL không slash → dirBase không 404 (soft: navigate `/agentic-academy` → theo redirect serve → OK)
7. responsive: 375 → không overflow ngang (home + deck) + click fullscreen không pageerror (native có thể fail headless → fallback class `.immersive` phải bật)
8. reduced-motion: emulate reduce → nội dung hiện, no pageerror

### Polish checklist
- [ ] 375/768/1280: không vỡ, không overflow ngang
- [ ] hover/focus/active/disabled + focus-visible ring
- [ ] toast aria-live; skip-link; landmarks
- [ ] reduced-motion: fade giữ, motion tắt
- [ ] animation ≤300ms UI, diagram loop mượt (transform/opacity)
- [ ] grep dead-code: mọi builder diagram + class dùng thật
- [ ] diff stat ghi vào verify/

### Evidence (verify/)
- `agentic-academy.spec` output (8/8)
- full suite `npx playwright test` (không hồi quy 46 cũ)
- screenshots: home-375/768/1280, deck-k1 slide 1, outcome slide, mark flow
- scoreboard diff stat

## Lệnh
```bash
npx playwright test tests/e2e/agentic-academy.spec.ts        # RED → GREEN
npx playwright test                                          # full suite
node .github/harness/scripts/generate-status.mjs             # status.json (nếu script scan www pages)
node .agent/scripts/audit.mjs log --tool shell --target "academy build+verify" --decision permitted --rule allow-all
```

---
*Plan bởi YUNIE · 2026-09-12 · mọi todo đều có Entangled with (cosmic-quantum §3)*
