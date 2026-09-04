# Design: Design Showcase 72 — 74 phong cách web

> Harness v2 — Phase Design | Stack: vanilla HTML/CSS/JS · CSS variables · reuse www/styles.css tokens · No framework
> Tham chiếu: `ui-ux-pro-max` (Minimalism & Swiss Style + Real-Time Ops), `product-quality.instructions.md`, `docs/knowleged.md` KN-002/003/004

## 1. Design System — Reuse YUNIE STATUS + Showcase riêng

### 1.1 Palette — Reuse từ www/styles.css (không hardcode mới)
| Token | Hex | Usage |
|-------|-----|-------|
| `--color-primary` | `#6366f1` | CTA, link, active pill, focus ring |
| `--color-primary-600` | `#4f46e5` | Hover primary |
| `--color-primary-50` | `#eef2ff` | Hero gradient, active pill bg |
| `--color-secondary` | `#0ea5e9` | Info, progress |
| `--color-accent` | `#f59e0b` | Badge warm |
| `--color-success` | `#16a34a` | Live dot |
| `--color-neutral-900` | `#0f172a` | Text chính |
| `--color-neutral-700` | `#334155` | Text phụ |
| `--color-neutral-500` | `#64748b` | Muted |
| `--color-neutral-200` | `#e2e8f0` | Border |
| `--color-surface` | `#ffffff` | Card |
| `--glass-*` | `rgba(...)` | Header glass (reuse) |
| `--rainbow` | `conic-gradient(...)` | Accent border (optional) |

- Card top bar dùng `design.colors.primary` động (inline style) — không tạo token mới.
- Contrast: text trên surface ≥4.5:1 (slate-900/white 15:1, slate-500/white 4.6:1).

### 1.2 Typography — Reuse
- **Sans:** `Inter` 400/500/600/700/800
- **Display:** `Plus Jakarta Sans` 700/800
- **Mono:** `JetBrains Mono` 400/500/600
- Scale: `xs 12 / sm 13 / base 14 / lg 16 / xl 20 / 2xl 24 / 3xl 30` — hero h1 30 (desktop)/24 (mobile), card title 15, desc 13
- Google Fonts: `Inter + Plus Jakarta Sans + JetBrains Mono` display=swap (reuse link từ STATUS)

### 1.3 Spacing / Radius / Shadow (4/8)
```css
--space-1:4px; --space-2:8px; --space-3:12px; --space-4:16px; --space-6:24px; --space-8:32px;
--radius-sm:8px; --radius-md:12px; --radius-lg:16px; --radius-xl:20px; --radius-full:9999px;
--shadow-sm: 0 1px 2px rgba(15,23,42,.06), 0 1px 3px rgba(15,23,42,.08);
--shadow-md: 0 4px 12px rgba(15,23,42,.08), 0 2px 6px rgba(15,23,42,.06);
--shadow-lg: 0 12px 32px rgba(15,23,42,.12), 0 4px 12px rgba(15,23,42,.08);
```

### 1.4 Iconography
- SVG inline Lucide stroke 1.8, 14-16px — search, filter, copy, external, close, chevron, palette, category.
- Không emoji làm icon.

### 1.5 Category Colors (pill accent — subtle, không lấn primary)
- Dùng neutral pill + dot màu primary của category representative (không hardcode 10 màu mới — dot lấy từ design đầu tiên của category).

## 2. Wireframe

### Mobile 375px
```
[Header: Y mark | YUNIE STATUS + subtitle | actions: STATUS | Showcase (active) | status.json | GitHub]
[Hero: card full-width]
  - Eyebrow: YUNIE · 74 Phong cách
  - H1: 74 phong cách web đã học
  - Desc: Từ awesome-design-md — 10 categories — sếp nói 72, mình show đủ 74
  - Meta pills: 74 styles · 10 categories · 74 DESIGN.md · Live STATUS counts
  - Search: input full-width + sort select
  - Actions: Xem STATUS | Lọc ngẫu nhiên
[STATUS bar: counts skills/instructions/agents + link về STATUS]
[Filter bar: pills horizontal scroll (All + 10 cats) + count "Hiển thị 74/74"]
[Grid: 1 col]
  [Card: top color bar (4px) | category badge + slug | name | desc 2 lines | palette dots 4-5 | actions: DESIGN.md | Preview]
[Footer]
```

### Tablet 768px
```
[Header: same, actions không collapse]
[Hero: 2 cols — text left, stats right]
[Filter bar: pills wrap]
[Grid: 2 cols]
```

### Desktop 1280px
```
[Header: max-width 1120, padding 24]
[Hero: card + side stats]
[Grid: 3 cols]
[Modal: centered 640px, backdrop blur]
```

## 3. Components & States

### Card
- **Default:** surface white, border neutral-200, radius 16, shadow-sm, top bar 4px primary color, padding 16
- **Hover:** shadow-md, translateY -2px, border primary-50, transition 200ms
- **Focus:** outline 2px primary, outline-offset 2px
- **Active:** scale 0.98
- **Content:** category badge (xs 11px, neutral-100, dot), slug mono 12px, name 15px 600, desc 13px 2-line clamp, palette dots 16px circle + border, actions 13px link + icon

### Filter Pills
- **Default:** bg white, border neutral-200, text 13px 500, padding 6px 12px, radius full
- **Active:** bg primary, text white, border primary, shadow-sm
- **Hover:** bg neutral-50
- **Focus:** outline primary

### Search Input
- **Default:** bg white, border neutral-200, radius 12, padding 10px 14px + icon left, placeholder muted
- **Focus:** border primary, shadow 0 0 0 3px rgba(99,102,241,.12)
- **States:** clear button (X) khi có query, keyboard "/" focus

### Modal / Drawer
- **Desktop:** centered, max-width 640, max-height 85vh, radius 20, shadow-lg, backdrop rgba(15,23,42,.45) + blur 8px, animation slide-up 200ms
- **Mobile ≤640px:** bottom sheet, radius 20 20 0 0, max-height 90vh
- **Header:** title + close button (ghost, 32px)
- **Body:** scroll, palette grid, description, colors table, links
- **Close:** ESC, click overlay, close button, focus trap, body scroll lock, return focus to trigger

### STATUS Bar
- **Layout:** flex wrap, gap 8, bg primary-50, border primary-100, radius 12, padding 10px 14px
- **Content:** Live dot (pulse) + "STATUS: 15 skills · 16 instructions · 8 agents" + link "Mở STATUS →"
- **Error:** muted text "STATUS chưa tải — mở status.json"

### Empty / Loading / Error
- **Loading:** skeleton cards 6x (shimmer 1.2s)
- **Empty:** icon + "Không tìm thấy" + "Thử từ khóa khác" + button Xóa lọc
- **Error:** icon + "Không tải được designs.json" + "Chạy npx serve www" + Retry button

## 4. Responsive Rules
- Breakpoints: 375 (mobile), 768 (tablet), 1120 (desktop container)
- Grid: 1 col (<768), 2 cols (768-1023), 3 cols (≥1024)
- Header: actions collapse to icons <640px (text hidden, icon only)
- Filter pills: horizontal scroll snap on mobile, wrap on desktop
- Modal: bottom sheet on mobile, centered on desktop
- No horizontal scroll: container padding 16 (mobile) / 24 (desktop), grid gap 16

## 5. Animation (150-300ms, transform/opacity only)
- Card hover: `transform translateY(-2px) + shadow` 200ms ease
- Pill active: `background + color` 150ms ease
- Modal: `opacity 0→1 + translateY(8px→0)` 200ms ease, backdrop `opacity` 200ms
- Skeleton: shimmer `background-position` 1.2s linear infinite
- Reduced motion: `@media (prefers-reduced-motion: reduce)` tắt hết

## 6. A11y Checklist
- [ ] Contrast ≥4.5:1 (text), ≥3:1 (large text, icons)
- [ ] Focus-visible ring 2px primary, offset 2px
- [ ] Skip-link to #main
- [ ] Header nav aria-label, pills role="tablist" + aria-selected
- [ ] Search aria-label, clear button aria-label
- [ ] Cards article + aria-label, keyboard Enter/Space mở modal
- [ ] Modal aria-modal="true", role="dialog", aria-labelledby, focus trap, ESC close
- [ ] Toast aria-live="polite"
- [ ] No keyboard trap, logical tab order

## 7. File Map
```
www/design-showcase/
  index.html   — header (reuse STATUS) + hero + STATUS bar + filter + grid + modal + footer
  styles.css   — @import ../styles.css tokens + showcase grid/card/modal/filter/skeleton
  app.js       — fetch designs.json + status.json, render, filter/search/sort, modal, copy, toast
  designs.json — copy awesome-design-md/index.json (74 designs)
```

## 8. Design Tokens Extract (for handoff)
- Reuse 100% tokens từ `www/styles.css` — không tạo palette mới
- Showcase chỉ thêm: `--card-top-h:4px`, `--dot-size:16px`, `--grid-gap:16px`

---
*Generated by YUNIE — Harness v2 — Design Phase — design-showcase-72 — 2026-09-04*
