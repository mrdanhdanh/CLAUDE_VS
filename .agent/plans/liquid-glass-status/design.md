# Design: Liquid Glass Status — Rainbow Hover

> Spec giao diện cho task liquid glass + rainbow border động khi hover

## 1. Design System — Tokens mới

### Giữ nguyên palette hiện tại, thêm glass + rainbow

```css
:root {
  /* — existing — */
  --color-primary:#6366f1; --color-secondary:#0ea5e9; --color-accent:#f59e0b;
  --color-neutral-900:#0f172a; --color-surface:#ffffff;
  /* — NEW: Liquid Glass — */
  --glass-blur: 16px;
  --glass-blur-sm: 12px;
  --glass-saturate: 180%;
  --glass-fill: rgba(255,255,255,0.68);
  --glass-fill-strong: rgba(255,255,255,0.78);
  --glass-fill-subtle: rgba(255,255,255,0.52);
  --glass-rim: rgba(255,255,255,0.55);
  --glass-rim-strong: rgba(255,255,255,0.75);
  --glass-highlight: rgba(255,255,255,0.65);
  --glass-shadow: rgba(15,23,42,0.08);
  --glass-shadow-lg: rgba(15,23,42,0.12);
  --glass-tint: transparent;
  /* — NEW: Rainbow — */
  --rainbow: conic-gradient(from var(--angle, 0deg), #ff3b30, #ff9500, #ffcc02, #34c759, #007aff, #af52de, #ff3b30);
  --border-w: 1.5px;
  --radius-glass: var(--radius-lg);
}
@property --angle { syntax:"<angle>"; initial-value:0deg; inherits:false; }
```

### Body background — mesh để glass có gì sample
```css
body {
  background:
    radial-gradient(900px 500px at 10% -10%, rgba(99,102,241,0.18), transparent 60%),
    radial-gradient(700px 400px at 90% 0%, rgba(14,165,233,0.14), transparent 60%),
    radial-gradient(600px 400px at 50% 100%, rgba(245,158,11,0.08), transparent 60%),
    linear-gradient(180deg, #eef2ff 0%, #f8fafc 320px, #f8fafc 100%);
  background-attachment: fixed;
}
```

## 2. Wireframe — giữ layout, chỉ đổi material

### Mobile 375px / Tablet 768px / Desktop 1280px
- Layout grid giữ nguyên (hero-grid 1.15fr/.85fr, stats 2→3→5, grid-2, grid-3)
- Chỉ đổi: mỗi card từ `background:white` → `glass` (blur + saturate + rim + highlight + shadow)
- Header: từ `rgba(255,255,255,.86)` → glass strong (blur 16px, fill 0.72, rim)

### Glass recipe (áp cho mọi card)
```css
.glass-card {
  background: linear-gradient(var(--glass-tint), var(--glass-tint)), var(--glass-fill);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  border: 1px solid var(--glass-rim);
  box-shadow:
    inset 0 1px 0 var(--glass-highlight),
    inset 0 -1px 0 rgba(255,255,255,0.08),
    0 8px 24px var(--glass-shadow),
    0 2px 8px rgba(15,23,42,0.06);
}
@supports not (backdrop-filter: blur(1px)) {
  .glass-card { background: rgba(255,255,255,0.92); }
}
```

## 3. Component Inventory — Glass + Rainbow Hover

| Component | Glass? | Rainbow hover? | Notes |
|-----------|--------|----------------|-------|
| `.header` | ✅ strong (blur 16, fill 0.72) | ❌ (nav layer, không viền) | sticky, border-bottom rim |
| `.hero-card` | ✅ | ✅ | tint primary 6% subtle |
| `.mini-card` | ✅ | ✅ |  |
| `.stat` | ✅ | ✅ | keep progress bar |
| `.card` (registry, preset, plans, health, pages) | ✅ | ✅ | outer card glass, inner items giữ white subtle |
| `.yunie-hero` | ✅ strong | ✅ | mesh gradient overlay giữ lại |
| `.yunie-letter-card` | ✅ | ✅ | top accent line → rainbow on hover |
| `.reg-card` | ✅ | ✅ | mobile cards |
| `.page-link` | ✅ subtle | ✅ |  |
| `.howto-card` | ✅ | ✅ |  |
| `.modal-panel` | ✅ strong (blur 20) | ✅ | backdrop blur 8px |
| `.preset-item`, `.plan-item` | inner, không glass riêng | — | hover bg rgba white 0.5 |

### Rainbow hover — kỹ thuật
```css
/* Base: card có position:relative, border-radius, overflow visible */
.glass-hover-rainbow {
  position: relative;
  border-radius: var(--radius-lg);
  /* glass styles */
}
.glass-hover-rainbow::before {
  content:""; position:absolute; inset:0;
  border-radius: inherit; padding: var(--border-w);
  background: var(--rainbow);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude;
  opacity:0; transition: opacity .25s ease;
  animation: rainbow-rotate 3s linear infinite;
  animation-play-state: paused;
  pointer-events:none;
}
.glass-hover-rainbow:hover::before,
.glass-hover-rainbow:focus-within::before {
  opacity:1; animation-play-state: running;
}
@keyframes rainbow-rotate { to { --angle: 360deg; } }
```
- Hover cũng trigger `focus-within` cho keyboard a11y
- `inset:0` + `padding: var(--border-w)` → chỉ hiện viền, không che content
- `pointer-events:none` → không chặn click
- Transition opacity 250ms ease, không layout shift

### Variants
- `.hero-card` + `.yunie-hero`: `--border-w: 1.8px` (nổi hơn)
- `.stat`: `--border-w: 1.5px`, radius 16px
- `.mini-card`, `.reg-card`, `.page-link`: `--border-w: 1.5px`

## 4. UX States

| View | Loading | Empty | Error | Success |
|------|---------|-------|-------|---------|
| Registry | skeleton glass (shimmer trên glass) | empty dashed glass | error-card glass tint red | toast glass |
| Stats | skeleton | — | — | — |
| Hover | rainbow xoay | — | — | — |
| Focus | rainbow + outline 2px primary offset 2px | — | — | — |

- Skeleton trên glass: `background: linear-gradient(90deg, rgba(226,232,240,0.8) ...)`
- Toast: glass dark `rgba(15,23,42,0.88)` + blur 12px

## 5. Animation
- Glass hover lift: `transform: translateY(-2px)` + shadow-lg, 200ms ease (giữ)
- Rainbow rotate: 3s linear infinite, chỉ khi hover (paused → running)
- Opacity fade: 250ms ease
- Reduced motion: tắt rotate, chỉ fade opacity

## 6. Accessibility
- Contrast: glass fill 0.68 trên mesh nhạt → text #0f172a vẫn ≥7:1 (test)
- Focus: `outline: 2px solid var(--color-primary); outline-offset:2px` + rainbow
- `prefers-reduced-motion: reduce` → `animation: none`, opacity instant
- `prefers-reduced-transparency: reduce` → `--glass-fill: rgba(255,255,255,0.92)`, blur 6px
- `backdrop-filter` fallback: solid white 0.92
- Keyboard: Tab vào card → `:focus-within` hiện rainbow

## 7. Visual References
- Apple Liquid Glass (iOS 26): blur 12-20px, saturate 180%, rim highlight, shadow soft
- Rainbow: 7 màu Apple, conic-gradient, xoay mượt via @property
- Glass + rainbow combo: premium, không chói, chỉ viền

---
*Generated by Harness v2 — Design Phase — liquid-glass-status*
