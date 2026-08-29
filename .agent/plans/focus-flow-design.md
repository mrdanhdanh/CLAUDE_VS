# Design: Focus Flow

## 1. Design System

### Palette — Calm Focus (Indigo + Mint + Amber)
| Token | Hex | Usage |
|-------|-----|-------|
| `--primary` | `#6366f1` | CTA, progress, active task |
| `--primary-600` | `#4f46e5` | hover |
| `--secondary` | `#06b6d4` | break mode, info |
| `--accent` | `#f59e0b` | streak, highlight, confetti |
| `--bg` | `#f8fafc` | page background |
| `--surface` | `#ffffff` | card |
| `--surface-2` | `#f1f5f9` | muted surface |
| `--text` | `#0f172a` | primary text |
| `--muted` | `#64748b` | secondary text |
| `--border` | `#e2e8f0` | border |
| `--success` | `#10b981` | done |
| `--danger` | `#ef4444` | reset/delete |

### Typography
- **Display:** `Plus Jakarta Sans` 700 — hero, timer digits
- **Sans:** `Inter` 400/500/600 — body, UI
- Scale: `xs 12 / sm 13 / base 15 / lg 18 / xl 22 / 2xl 28 / hero 56`
- Timer digits: `tabular-nums`, `font-variant-numeric: tabular-nums`

### Spacing / Radius / Shadow
```css
:root{
  --space-1:4px; --space-2:8px; --space-3:12px; --space-4:16px;
  --space-5:20px; --space-6:24px; --space-8:32px; --space-10:40px;
  --radius-sm:10px; --radius-md:14px; --radius-lg:18px; --radius-xl:22px; --radius-full:9999px;
  --shadow-sm:0 1px 2px rgba(15,23,42,.06);
  --shadow-md:0 4px 16px rgba(15,23,42,.08);
  --shadow-lg:0 12px 32px rgba(15,23,42,.12);
}
```

## 2. Wireframe

### Mobile 375px — single column, timer sticky top
```
[Header: ● Focus Flow | Today: 3🍅 75m | ⚙️]
[Timer Card: mode tabs (Focus/Short/Long) | 25:00 circular progress | Start/Pause Reset | focusing: "Task name"]
[Stats Row: 3 cards — Pomodoros | Focus | Done]
[Tasks: input + Add | list (checkbox, name, focus btn, delete) | empty state]
[History: 7-day bars]
[Footer]
```

### Tablet 768px — 2-col
```
[Header full width]
[Left: Timer Card (larger) | Right: Stats + History]
[Tasks full width below, 2-col grid for list on wide]
```

### Desktop 1280px — 3-col centered, max 1120
```
[Header: logo left, stats center, settings right]
[Grid: Timer (7col) | Side (5col: Stats + History)]
[Tasks: 2-col list, max-width 1120 centered]
```

## 3. Component Inventory

| Component | States | Spec |
|-----------|--------|------|
| **Mode Tabs** | default/active/hover/focus | pill, active: bg primary text white, hover: bg surface-2 |
| **Timer Circle** | idle/running/paused | SVG circle progress, stroke primary (focus) / secondary (break), 280px desktop 220 mobile |
| **Primary Button** | default/hover/active/disabled/loading | bg primary, hover: primary-600 + translateY(-1px) + shadow-md, active: scale .98, disabled: opacity .5 |
| **Ghost Button** | default/hover | border, hover bg surface-2 |
| **Task Row** | default/hover/focus/selected/done | hover: bg surface-2, selected: ring primary, done: opacity .6 + line-through |
| **Input** | default/focus/error/disabled | focus: outline 2px primary, error: border danger |
| **Stat Card** | default | surface, shadow-sm, hover shadow-md, number large display font |
| **Bar Chart** | — | 7 bars, height by value, rounded top, accent for today |
| **Toast** | enter/exit | slide-in 200ms, auto-dismiss 3s, success bg |
| **Empty State** | — | illustration (CSS), message, CTA |

## 4. UX States

| View | Loading | Empty | Error | Success |
|------|---------|-------|-------|---------|
| Tasks | skeleton 3 rows (shimmer) | "Chưa có task — thêm việc cần focus nào!" + icon | localStorage fail → toast error + Retry | add/done → toast + subtle confetti |
| Timer | — | — | — | hết giờ → sound + Notification + toast + auto switch mode |
| Stats | — | "Hoàn thành pomodoro đầu tiên để thấy thống kê" | — | update animate number count-up 300ms |
| History | — | 7 bars at 0 | — | bar grow animation 400ms |

## 5. Animation
- All transitions `180ms ease` (transform, opacity, background, shadow)
- Button hover: `translateY(-1px)` + shadow
- Progress circle: `stroke-dashoffset 1s linear`
- Toast: `translateY(8px) → 0` + opacity 200ms
- Task add: `fade + slide` 200ms
- Number count: `easeOut 300ms`

## 6. Accessibility
- Contrast: text #0f172a on #f8fafc = 16:1, primary #6366f1 on white = 4.6:1 (AA)
- Focus ring: `outline: 2px solid #6366f1; outline-offset: 2px` on all interactive
- Icon buttons: `aria-label` (Start, Pause, Reset, Delete, Focus)
- Keyboard: Space Start/Pause, R Reset, Tab order logical, Enter add task
- Semantic: header/nav/main/section, button not div, label for input
- Reduced motion: `@media (prefers-reduced-motion)` disable transforms

## 7. Visual Direction
- **Vibe:** Calm, focused, soft — không chói, không corporate. Bo tròn lớn (14-22px), shadow nhẹ, gradient nhẹ ở timer card (primary → secondary 135deg, opacity .08)
- **Delight:** Progress ring mượt, confetti dots khi xong pomodoro, bar chart grow, toast ấm
