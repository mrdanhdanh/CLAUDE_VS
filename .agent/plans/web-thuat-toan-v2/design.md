# Design v2: 10 Bài Thuật Toán — Nâng Cấp

## 1. Design System v2

### Palette (giữ + bổ sung)
| Token | Hex | Usage |
|-------|-----|-------|
| `--color-primary` | `#6366f1` | CTA, active, link |
| `--color-primary-hover` | `#4f46e5` | Hover |
| `--color-primary-light` | `#eef2ff` | Badge, focus ring |
| `--color-success` | `#10b981` | Found, best, sorted |
| `--color-success-light` | `#d1fae5` | Success bg |
| `--color-warning` | `#f59e0b` | Pivot, current, window |
| `--color-warning-light` | `#fef3c7` | Warning bg |
| `--color-error` | `#ef4444` | Error, eliminated |
| `--color-error-light` | `#fee2e2` | Error bg |
| `--color-info` | `#0ea5e9` | Info, heap, stack |
| `--color-neutral-900` | `#0f172a` | Text primary |
| `--color-neutral-700` | `#334155` | Text secondary |
| `--color-neutral-500` | `#64748b` | Hint |
| `--color-neutral-300` | `#cbd5e1` | Border |
| `--color-neutral-100` | `#f1f5f9` | Bg |
| `--color-surface` | `#ffffff` | Card |

### Typography
- Sans: `Inter` — body/UI
- Display: `Plus Jakarta Sans` — heading
- Mono: `JetBrains Mono` / `Fira Code` — pseudocode, code
- Scale: xs 12 / sm 14 / base 16 / lg 18 / xl 20 / 2xl 24 / 3xl 30

### Spacing / Radius / Shadow
```css
--space-1:4px --space-2:8px --space-3:12px --space-4:16px --space-6:24px --space-8:32px --space-10:40px
--radius-sm:8px --radius-md:12px --radius-lg:16px --radius-full:9999px
--shadow-sm:0 1px 2px rgba(0,0,0,.06) --shadow-md:0 4px 12px rgba(0,0,0,.08) --shadow-lg:0 8px 24px rgba(0,0,0,.12)
```

## 2. Layout

### Shell (giữ sidebar + main, polish)
- Sidebar 280px fixed, logo + nav 10 items (badge + title + stars + complexity)
- Main max-width 780px, padding 32/24
- Mobile 375: sidebar → top horizontal scroll nav, main full width
- Tablet 768: sidebar 240px, main flex-1
- Desktop 1280: sidebar 280px, main 780px centered

### Bài Section Structure (mới — thống nhất 10 bài)
```
[Header: badge + title + complexity pill + 1-line desc]
[Card: Đề bài — mô tả ngắn + ví dụ minh họa (3 preset pills)]
[Card: Pseudocode — mono block, highlight dòng hiện tại]
[Card: Input — field + validation + preset buttons + controls]
[Card: Visualization — array/grid/table/stack/heap/chart]
[Card: Stats — comparisons/ops/steps]
[Card: Result — value + explanation]
[Card: Steps — ordered list]
[Card: Comparison — brute vs optimal bar chart]
```

## 3. Component Inventory v2

| Component | States | Notes |
|-----------|--------|-------|
| Nav item | default/hover/active | left accent, complexity pill |
| Complexity pill | easy/medium/hard | color-coded |
| Preset pill | default/hover/active | small, inline |
| Pseudocode block | default/highlight-line | mono, line highlight yellow |
| Array cell | default/current/best/window/pivot/sorted/eliminated | scale + shadow |
| DP table cell | default/current/best/computed | border, bg |
| Stack viz | push/pop/top | vertical, animation |
| Heap viz | heap node | tree or list |
| Grid cell | wall/weight/start/end/visited/path/current | color + weight label |
| Bar chart | bar + best highlight | width transition |
| Water bars | bar + water fill | blue fill animation |
| Comparison bars | brute (red) / optimal (green) | width 0.6s |

## 4. UX States
- Loading: skeleton or spinner
- Empty: hidden viz/result/steps
- Error: red border + message
- Success: green result card + steps

## 5. Animation
- Cell highlight: scale 1.1 + shadow 200ms
- Swap: scale 1.25 pulse
- Water fill: height transition 400ms
- Pseudocode highlight: bg transition 150ms
- Bar width: 0.6s ease
- Toast: slideIn 200ms

## 6. Accessibility
- Contrast ≥4.5:1
- Focus ring 2px primary
- aria-label for icon buttons
- Keyboard: Tab, Enter to run
- Skip link

---
*Design v2 — Web Thuật Toán Nâng Cấp*
