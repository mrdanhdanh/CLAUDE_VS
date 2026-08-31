# Design: 10 Bài Thuật Toán — Visualizer

> Design system + wireframe cho single-page app

## 1. Design System

### Palette
| Token | Hex | Usage |
|-------|-----|-------|
| `--color-primary` | `#6366f1` | CTA, link, active |
| `--color-primary-hover` | `#4f46e5` | Button hover |
| `--color-primary-light` | `#eef2ff` | Focus ring, badge bg |
| `--color-success` | `#10b981` | Success, found, sorted |
| `--color-success-light` | `#d1fae5` | Success bg |
| `--color-error` | `#ef4444` | Error, skip, swapping |
| `--color-error-light` | `#fee2e2` | Error bg |
| `--color-neutral-900` | `#0f172a` | Text primary |
| `--color-neutral-700` | `#334155` | Text secondary |
| `--color-neutral-500` | `#64748b` | Hint, disabled |
| `--color-neutral-300` | `#cbd5e1` | Border |
| `--color-neutral-100` | `#f1f5f9` | Background |
| `--color-surface` | `#ffffff` | Card, surface |

### Typography
- **Sans:** `Inter` / system-ui — body, UI
- **Display:** `Plus Jakarta Sans` — heading
- Scale: `xs 12 / sm 14 / base 16 / lg 18 / xl 20 / 2xl 24`

### Spacing / Radius / Shadow
```css
:root {
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px; --space-5: 20px; --space-6: 24px; --space-8: 32px; --space-10: 40px; --space-12: 48px;
  --radius-sm: 8px; --radius-md: 12px; --radius-lg: 16px; --radius-full: 9999px;
  --shadow-sm: 0 1px 2px rgba(0,0,0,.06);
  --shadow-md: 0 4px 12px rgba(0,0,0,.08);
  --shadow-lg: 0 8px 24px rgba(0,0,0,.12);
}
```

## 2. Wireframe

### Mobile 375px
```
[Sidebar: nav buttons stacked]
[Main: single card]
[Input field]
[Buttons: primary + secondary]
[Array visualization: cells wrap]
[Result card]
[Steps card]
```

### Tablet 768px
```
[Sidebar: 280px fixed] [Main: flex-1]
[Input + buttons inline]
[Array viz: cells wrap]
[Stats row: 4 cols]
```

### Desktop 1280px
```
[Sidebar: 280px fixed] [Main: max-width 720px]
[Same as tablet, more spacing]
```

## 3. Component Inventory

| Component | States | Notes |
|-----------|--------|-------|
| Button primary | default/hover/focus/active/disabled | hover: translateY(-1px) + shadow |
| Button secondary | default/hover/focus/active | border style |
| Button step | default/hover/focus/active/disabled | green style |
| Card | default | shadow-md, radius-lg |
| Input | default/focus/error/disabled | focus: primary ring |
| Array cell | default/current/max/done/found/skip/swapping/sorted/highlight-all/left-pointer/right-pointer/pair-found/window-active/window-best/stack-push/stack-pop/maze-wall/maze-path/maze-visited/maze-current/dp-current/dp-best | animation 200ms |
| Speed slider | default/active | range input |
| Nav item | default/hover/active/disabled | left accent |
| Skip link | default/focus | accessibility |
| Empty state | illustration + message | placeholder |
| Comparison bars | linear (orange-red) / binary/two-pointers (green-cyan) | width transition 0.6s |
| Pair list | found pair highlight | green bg |

## 4. UX States

| View | Loading | Empty | Error | Success |
|------|---------|-------|-------|---------|
| Array viz | — | hidden | — | show cells |
| Result | — | hidden | — | show value |
| Steps | — | hidden | — | show list |
| Input | — | — | red border + message | — |

## 5. Animation
- Transition: `150-300ms ease` (transform, opacity)
- Hover: `transform: translateY(-1px)` + shadow
- Array cell highlight: `transform: scale(1.1)` + box-shadow
- Step slide-in: `translateX(-8px)` → `translateX(0)`
- Swap pulse: `scale(1)` → `scale(1.25)` → `scale(1.15)`
- Highlight all pulse: `scale(1)` → `scale(1.25)` → `scale(1.15)`
- Pair found: `scale(1.15)` + green glow
- Comparison bars: `width 0.6s ease`

## 5b. Bài 006 — Two Pointers Design

### Layout
```
[Input: mảng + Target]
[Buttons: Tìm cặp | Random | Bước tiếp theo | Chạy tự động | Đặt lại]
[Array viz: cells với L/R pointers]
[Stats: left | right | sum | comparisons]
[Pairs found: list các cặp]
[Steps: log từng bước]
[Comparison: Two Pointers vs Brute Force bars]
```

### Pointer States
- `left-pointer`: blue bg/border (left)
- `right-pointer`: purple bg/border (right)
- `pair-found`: green bg/border + scale(1.15)
- `eliminated`: gray, opacity 0.4 (đã loại bỏ)

## 5c. Bài 007 — Sliding Window Design

### Layout
```
[Input: mảng + K]
[Mode: radio max/min/avg]
[Buttons: Tìm tổng | Random | Bước tiếp theo | Chạy tự động | Đặt lại]
[Array viz: cells với window highlight]
[Stats: left | right | windowSum | maxSum | comparisons]
[Chart: bar chart các window values]
[Steps: log từng bước]
```

### Window States
- `window-active`: yellow bg/border (cửa sổ hiện tại)
- `window-best`: green bg/border + scale(1.1) (cửa sổ tốt nhất)
- `window-outside`: gray, opacity 0.5 (ngoài cửa sổ)

### Chart
- Bar chart: mỗi bar là 1 window value
- Highlight bar tốt nhất (max/min)
- Responsive: scroll nếu nhiều windows

## 5d. Bài 008 — Stack Design

### Layout
```
[Input: chuỗi ngoặc]
[Buttons: Kiểm tra | Random | Bước tiếp theo | Chạy tự động | Đặt lại]
[String viz: từng ký tự với highlight]
[Stack viz: vertical stack với TOP pointer]
[Stats: stack size | current char | position]
[Steps: log push/pop]
```

### Stack States
- `stack-push`: green bg/border + slideIn animation
- `stack-pop`: red bg/border + slideOut animation
- `stack-top`: yellow bg/border (đỉnh stack)
- `char-current`: yellow highlight (ký tự đang xét)
- `char-valid`: green (đã xử lý đúng)
- `char-error`: red (vị trí lỗi)

### Stack Visualizer
- Vertical stack: TOP ở trên, bottom ở dưới
- Mỗi phần tử là 1 ô với border
- Animation push: slideIn từ trên
- Animation pop: slideOut lên trên
- Empty state: "Stack rỗng"

## 5e. Bài 009 — BFS Maze Design

### Layout
```
[Controls: Tạo mê cung | Tìm đường | Bước tiếp theo | Đặt lại]
[Mode: BFS / DFS radio]
[Grid: 5x5 to 10x10, click to edit]
[Legend: S (green) | E (red) | Wall (black) | Visited (yellow) | Path (green)]
[Stats: visited count | path length | BFS steps]
[Steps: log BFS exploration]
```

### Grid States
- `maze-start`: green bg (S)
- `maze-end`: red bg (E)
- `maze-wall`: black bg (tường)
- `maze-empty`: white bg (ô trống)
- `maze-visited`: yellow bg (đã duyệt)
- `maze-current`: orange bg + scale (đang xét)
- `maze-path`: green bg + scale (đường đi)

### Interaction
- Click ô: cycle Empty → Wall → Start → End
- Drag: vẽ tường liên tục
- Grid size: 5x5, 7x7, 10x10 selector

## 5f. Bài 010 — DP Leo cầu thang Design

### Layout
```
[Input: N + cost array (optional)]
[Buttons: Tính toán | Random | Bước tiếp theo | Chạy tự động | Đặt lại]
[Staircase viz: bậc thang với số cách]
[DP table: hàng bậc, hàng số cách]
[Stats: dp[i] | comparisons]
[Steps: log dp[i] = dp[i-1] + dp[i-2]]
[Cost mode: chi phí tối ưu]
```

### DP States
- `dp-current`: yellow bg/border (đang tính)
- `dp-best`: green bg/border (kết quả)
- `dp-done`: gray (đã tính)

### Staircase
- Vertical staircase: mỗi bậc là 1 ô
- Highlight bậc hiện tại
- Số cách hiển thị trên bậc

## 6. Accessibility
- Contrast ≥ 4.5:1
- Focus ring: `outline: 3px solid var(--color-primary); outline-offset: 2px`
- Skip-link: `position: absolute; top: -100%` → `top: 16px` on focus
- ARIA: `aria-label`, `aria-live="polite"`, `aria-invalid`, `aria-current="page"`
- Keyboard: Tab order, Enter/Space, Escape
- Reduced motion: `prefers-reduced-motion: reduce`

---
*Generated by Claude Harness v2 — Design Phase*
