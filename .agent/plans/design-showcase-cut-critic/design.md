# Design: design-showcase-cut-critic

> Discover → Define → Deliver (Anshu Chimala 01/09/2026) · Test trên `www/design-showcase/`

## 0. Discover — Citation + Seed + Taste

### awesome-design-md search (BẮT BUỘC)
- **Query:** `linear dark minimal gallery showcase`
- **Command:** `node awesome-design-md/search.mjs "linear dark minimal gallery showcase" --top_k 3 --json`
- **Results:**
  1. `linear.app` · score 12 · `awesome-design-md/design-md/linear.app/DESIGN.md` — near-black #010102, light gray #f7f8f8, lavender #5e6ad2 single accent, charcoal panels #0f1011, hairline #23252a, Linear Display 500-700 negative tracking, dense technical craft
  2. `airtable` · score 5 · editorial white + near-black pill CTA
  3. `apple` · score 4 · museum gallery, Action Blue #0066cc
- **Chosen vibe:** `linear.app` (score 12, cao nhất) — restraint, hairline, lavender chỉ ở CTA/focus, không decor
- **Tokens copied:** palette primary/ink/canvas/surface/hairline, typography Linear Display/Text, radius pill, shadow subtle

### Seed string (Sakana AI SSOT)
- **Seed:** `9f2427e44d211655cbb62cba91e717c1` (crypto.randomBytes 16 hex)
- **Derived direction (không reveal ra UI):**
  - `9f` + `24` + `27` → spacing 24px rhythm, 9:16 card ratio hint, 27px hero title clamp
  - `e44d` + `2116` + `55` → muted indigo/lavender #5e6ad2 làm single accent, không gradient tím tràn lan
  - `cbb62cba` → warm neutral #f8fafc canvas, charcoal #0f1011 chỉ cho code/mono, không dark toàn trang
  - Repeating `11` `55` → restraint: lặp ít, mỗi element 1 việc, Cut 30%
  - `91e717c1` → hairline 1px #e2e8f0, radius 12px, shadow 0 1px 2px — subtle, không glow
- **Guarantee:** mỗi run seed khác → palette/layout/typo khác, không bao giờ ra gradient tím mặc định

### Taste injection (Ambitious prompt)
- **3 hướng đã cân:**
  1. Pixel-art game still — mỗi card là 1 sprite, vui nhưng nhiễu cho gallery 74
  2. Isometric 3D city — mỗi category là 1 khu phố, đẹp nhưng nặng, YAGNI
  3. **Linear dark minimal (CHỌN)** — near-black restraint, charcoal panels, hairline, lavender single accent, dense technical, negative tracking — hợp gallery showcase nhất, nhẹ, 0 dep
- **Sharpened brief:** "Showcase 74 styles như Linear docs: white canvas, hairline borders, charcoal chỉ ở code, lavender #5e6ad2 chỉ ở CTA/focus/badge, typography tight, hero gọn 2 pills + 2 CTAs, grid 1→2→3, card hairline + 4px top bar, không glow, không gradient tím, Cut 30% chrome thừa"

## 1. Design System

### Palette (Linear-inspired, light adaptation)
| Token | Hex | Usage |
|-------|-----|-------|
| `--color-primary` | `#5e6ad2` | CTA, link, focus, badge — single accent (Linear lavender) |
| `--color-primary-hover` | `#828fff` | hover CTA |
| `--color-primary-50` | `#eef0ff` | badge bg, subtle |
| `--color-ink` | `#0f172a` | text primary (slate-900) |
| `--color-ink-muted` | `#475569` | text secondary |
| `--color-ink-subtle` | `#94a3b8` | caption, slug |
| `--color-canvas` | `#ffffff` | page bg |
| `--color-surface` | `#f8fafc` | card subtle, status bar |
| `--color-surface-strong` | `#f1f5f9` | hover surface |
| `--color-hairline` | `#e2e8f0` | border 1px |
| `--color-hairline-strong` | `#cbd5e1` | border strong |
| `--color-charcoal` | `#0f1011` | code/mono only, không dùng cho card bg |

### Typography
- **Display:** `Plus Jakarta Sans` 700-800, tracking -0.02em (Linear Display fallback) — hero h1 28→32px, card title 15px 700
- **Sans:** `Inter` 400-600 — body 13-14px, kicker 11px 700 uppercase 0.06em
- **Mono:** `JetBrains Mono` 400-600 — slug 11px, palette hex 12px
- Scale: `xs 11 / sm 12 / base 13 / lg 14 / xl 15 / 2xl 28`

### Spacing / Radius / Shadow
```css
:root {
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px; --space-6: 24px; --space-8: 32px;
  --radius-sm: 8px; --radius-md: 12px; --radius-lg: 16px; --radius-full: 9999px;
  --shadow-sm: 0 1px 2px rgba(15,23,42,.06);
  --shadow-md: 0 4px 12px rgba(15,23,42,.08);
  --shadow-lg: 0 8px 24px rgba(15,23,42,.12);
  --hairline: 1px solid var(--color-hairline);
}
```

## 2. Wireframe

### Mobile 375px
```
[Header: Y mark | Showcase badge | STATUS btn]
[Hero: eyebrow | h1 20px | p 13px | 2 pills (74 + 10) | search full | sort full | 2 CTAs (Demo + Random) ]
[Filter: pills scroll-x | count tag]
[Grid: 1 col, gap 12px, card min-h 150px]
[Footer: 2 lines]
```

### Tablet 768px
```
[Header: brand | nav 4 btns]
[Hero: card padding 20px | h1 28px | search + sort row | 2 CTAs]
[Filter: pills + count]
[Grid: 2 cols, gap 16px]
```

### Desktop 1280px
```
[Header: brand | nav | actions, max 1280 centered]
[Hero: 2-col? No — single card centered, max 1280, search flex1 + sort auto]
[Grid: 3 cols, gap 16px, max 1280]
[Footer: centered]
```

## 3. Component Inventory

| Component | States | Notes |
|-----------|--------|-------|
| Button primary | default/hover/focus/active/disabled | bg #5e6ad2, hover #828fff, focus ring 2px #5e6ad2 offset 2px, active scale .98 |
| Button ghost | default/hover/focus | border hairline, hover bg #f8fafc |
| Search input | default/focus | border hairline, focus border #5e6ad2 + shadow 0 0 0 3px rgba(94,106,210,.15) |
| Filter pill | default/active/hover/focus | active bg #0f172a text white, hover bg #f1f5f9 |
| Card | default/hover/focus-within | border hairline, hover translateY(-2px) + shadow-md + border #cbd5e1, top bar 4px var(--card-accent) |
| Palette dot | default/hover | 16px circle, border 1.5px white + shadow, hover scale 1.15 |
| Modal | open/close | overlay rgba(15,23,42,.4), panel max 640px, handle, focus trap, ESC close |
| Toast | show/hide | slide-in 200ms, auto-dismiss 2.6s |
| Skeleton | loading | shimmer, reduced-motion none |
| Empty/Error | empty/error | dashed border, icon 48px, CTA |

## 4. UX States

| View | Loading | Empty | Error | Success |
|------|---------|-------|-------|---------|
| Grid 74 | 6 skeleton cards | "Không tìm thấy" + Xóa lọc | "Không tải được designs.json" + Thử lại + hint npx serve | toast "Đã copy slug/màu" 2.6s |
| Search | — | empty state | error state | — |
| Modal | — | — | — | copy toast |

## 5. Animation
- Transition: `150-300ms ease` (transform, opacity, border-color, box-shadow)
- Card hover: `transform: translateY(-2px)` + shadow, 200ms
- Toast: slide-in 200ms, auto-dismiss 2600ms
- Live dot: pulse 1.6s (prefers-reduced-motion none)
- Không width/height animation

## 6. Accessibility
- Contrast ≥4.5:1 (ink #0f172a on white, primary #5e6ad2 on white 4.6:1 for large, white on #5e6ad2 4.8:1)
- Focus ring: `outline: 2px solid #5e6ad2; outline-offset: 2px` cho mọi interactive
- Icon-only button: `aria-label`
- Keyboard: Tab order, Enter/Space, `/` focus search, ESC close modal
- Semantic: header/nav/main/section/button, role list/listitem, aria-live polite cho count
- Reduced motion: transition none, transform none, animation none

## 7. Cut Plan (Technique 6 — ít = premium)
- **Hero:** xóa `hero-info-bar` (3 spans duplicate), xóa 2 meta pills thừa (STATUS pill + JSON pill), xóa 2 CTAs thừa (Về STATUS + designs.json) → giữ 2 pills (74 + 10) + 2 CTAs (Demo + Random)
- **Status bar:** xóa duplicate — hero đã có count, status-bar chỉ giữ 1 dòng gọn hoặc ẩn nếu STATUS fail
- **Card:** giữ hairline + top bar 4px, bỏ shadow thừa, giữ 1 CTA chính + copy btn
- **Footer:** gọn 2 dòng, không lặp link

## 8. Critic Criteria (Technique 3 — fresh context)
- Critic chỉ nhận screenshot + intent "Linear dark minimal gallery, 74 cards, hairline, lavender single accent, dense technical"
- Chấm /10 so với Linear docs quality bar, penalize: gradient tím, text-trái-graphic-phải cookie-cutter, glow/container thừa, hero ngợp
- Nêu 3 gaps lớn nhất + score, <9/10 fix top gaps max 2 vòng, không nhét "phải 9/10" vào prompt critic

---
*Design — design-showcase-cut-critic · 2026-09-05 · YUNIE · Linear vibe · seed 9f24...*
