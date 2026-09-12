# Design — Agentic Academy

> Vibe: **VoltAgent-adapted dark tech** (score 6.0 — `awesome-design-md/design-md/voltagent/DESIGN.md`) — near-black canvas, 1 dominant accent + 7 lesson accents, "documentation dressed as marketing", precise grid of dark cards.

## 1. Design tokens (CSS variables, `:root`)

```
--bg:#0b0b10;        --bg-soft:#12121a;   --panel:rgba(255,255,255,.035);
--line:rgba(255,255,255,.09); --line-strong:rgba(255,255,255,.16);
--ink:#f2f3f7;       --body:#b9bdc9;      --mute:#8b90a0;
--primary:#00d992;   --on-primary:#04130d;
--grad: linear-gradient(120deg,#00d992,#22d3ee 45%,#a78bfa);
--warn:#fbbf24;      --danger:#fb7185;
Lesson accents: k1 #00d992 · k2 #22d3ee · k3 #a78bfa · k4 #fbbf24 · k5 #fb7185 · k6 #60a5fa · k7 #e879f9
radius: 6/10/14/999px · spacing 4/8 scale · shadow: 0 10px 40px rgba(0,0,0,.45)
font: ui-sans-serif, system-ui, "Segoe UI", Roboto… (KHÔNG webfont — KN-029)
mono: ui-monospace, "Cascadia Code", Consolas, monospace
```

Accent usage rule: chỉ ở border-top card · chip (bg accent 12-16% + text làm sáng) · glow nhẹ · diagram stroke. **Text chính luôn --ink/--body** (contrast ≥4.5:1 trên nền tối).

## 2. Cấu trúc file

```
www/agentic-academy/
  index.html      # Trang chủ
  slides.html     # Deck viewer (?lesson=kX #slide-N)
  styles.css      # Tokens + components + animations
  store.js        # Progress store + dirBase + toast + helpers (shared)
  lessons.js      # 7 bài × ~11-12 slide (data thuần) + outcome + sources
  diagrams.js     # 8 animated SVG builders (0-dep)
  app.js          # Homepage render
  slides.js       # Deck engine (render, nav, fullscreen, hash, mark, swipe)
```

## 3. Wireframe

### 3.1 Homepage (`index.html`)
```
┌ nav: ACADEMY · progress mini "0/7" · [Cosmos ↗] ┐
│ HERO: eyebrow "AGENTIC AI · HỌC + THỰC THI"
│  H1 "Học AI Agentic. Xây hệ thống thật. Chạy trên mọi IDE."   [orb animation]
│  CTAs: [Bắt đầu học →] [Học tiếp ▸]   stats: 7 bài · ~80 slides · 0đ
├ "Hệ thống bạn sẽ xây" — animated file-tree + 6 capability chips
├ LESSON GRID (7 cards): num · icon · title · 1-line · tags · duration · chip Đã/Chưa · hover lift
├ PROGRESS PANEL: ring n/7 + 7 rows tick + [Đặt lại tiến độ]
└ FOOTER: nguồn & license · "tiến độ lưu localStorage trình duyệt này" · YUNIE bởi
```

### 3.2 Deck viewer (`slides.html?lesson=k1#slide-3`)
```
┌ deck-top: [← Trang chủ] {num. title} · {counter 3/12} · [⛶ Fullscreen] [✓ Đã học]
│  .stage ── 1 slide active (fade+slide 260ms), content stagger 40ms
│   slide types: cover · bullets · diagram · steps · code · compare · outcome · sources
└ deck-bar: [◀] progressbar (role=progressbar) [▶] · dots N · hint keys
```
- Keyboard: `← → ↑ ↓ Space PageUp/Down Home End` nav · `F / ⛶` fullscreen · `Esc` thoát · `M` mark.
- Click nửa phải/trái stage = next/prev; touch swipe; hash `#slide-N` sync; `?lesson=` chọn bài.
- Fullscreen: `requestFullscreen()` + fallback class `body.immersive` (ẩn chrome, KN-032-safe: wrap try/catch, fail → toast, không throw).
- Last slide (outcome): nút "Đánh dấu đã học ✓" primary + "Bài tiếp theo →" (nếu có).

## 4. Slide type spec (data-driven)

| type | data | render |
|------|------|--------|
| cover | title, sub, goals[], meta | số bài watermark + goals chips |
| bullets | title, icon, items[] (mini-md: `code`, **bold**) | list stagger |
| diagram | title, svg:builderId, caption | animated SVG, glow theo accent |
| steps | title, steps[{t,d}] | numbered cards, connector line |
| code | title, file, lang, content | mac header + mono block, copy note |
| compare | title, cols[], rows[][] | table → mobile stack |
| outcome | files[{p,why}], criteria[], cta | bảng files + checklist `.crit` |
| sources | items[{n,u,note}] | list link ngoài + ngày verify |

Mini-md formatter: escape HTML trước → `code` → **bold** → *italic* → né XSS.

## 5. 8 animated diagrams (SVG + CSS, 0-dep)

1. `agent-loop` — vòng Observe→Think→Act xoay, pulse nodes
2. `when-agent` — flowchart: "vẽ được flowchart? → pipeline / cần adapt? → agent"
3. `ide-matrix` — 1 project lõi ↔ 4 IDE adapters, dây nối vẽ dần (stroke-dashoffset)
4. `file-tree` (2 chế độ: build / recap) — cây file stream-in từng dòng
5. `progressive` — description nhỏ load trước vs body lớn chỉ khi match
6. `mcp-flow` — Agent ↔ MCP server ↔ tools; gói tin chạy
7. `eval-loop` — Rubric→Component→E2E→ErrorAnalysis→Fix cycle
8. `learning-loop` — Bug→…→Learn→Rules spiral, node sáng dần

Animation: CSS keyframes (dash/轨迹/pulse/stagger), transform+opacity only; **reduced-motion giữ fade, tắt path/parallax**; mọi animation ≤ loop 6-12s, không layout shift.

## 6. States (mọi component)

- Buttons: default/hover (lift 1px + border sáng)/focus-visible (ring 2px accent)/active/disabled.
- Cards: hover glow + border accent; `[data-status="da-hoc"]` → chip xanh ✓ + border-left accent.
- Loading/empty/error: homepage không fetch gì (data từ lessons.js) → không cần skeleton; slides.js guard `!lesson` → màn "Không tìm thấy bài" + link về.
- Toast (mark/reset/fullscreen fallback) — pattern cosmos, aria-live polite.

## 7. Responsive

- 375: nav gọn (progress mini), hero 1 cột, cards 1 cột, compare → stack label:value, code scroll ngang, deck top co lại (ẩn chữ, giữ icon), stage padding 16px, diagram scale theo `width:100%;height:auto` (viewBox ratio ~16:7 giống KN-017).
- 768: cards 2 cột; 1280: 3 cột + progress panel 2 cột.
- Overflow audit: `document.scrollWidth <= innerWidth+1` ở cả 3 breakpoint (test).

## 8. A11y

- skip-link; landmarks (header/main/footer/nav); heading hierarchy 1 H1.
- Deck: `role=region aria-label="{n} trên {N}"` mỗi slide (theo pattern cosmos-slides đã test), `aria-hidden` cho slide không active; counter `aria-live=polite`; buttons aria-label/pressed.
- Focus ring rõ; Esc không trap sai; contrast: body ≥4.5:1 (--body #b9bdc9 trên #0b0b10 ≈ 8.9:1 ✓), chip accent dùng text pha sáng.
- Reduced-motion: media query `animation: none` cho path/dash; giữ `opacity` fade.

## 9. Entanglement

`app.js ↔ store.js ↔ indexes` · `slides.js ↔ lessons.js ↔ diagrams.js ↔ store.js` · đổi `store.js` key → cập nhật cả 2 trang + test · thêm bài mới = chỉ `lessons.js` (app + deck tự render) · `www/index.html` thêm card Demos trỏ vào academy · `status.json` regenerate cuối.

---
*Design bởi YUNIE · token gốc VoltAgent · không webfont (KN-029) · reveal pattern KN-040 (dirBase + revealSweep IO threshold 0)*
