# Design: Todo Manager — Bài 010

## 1. Design System

### Palette
| Token | Hex | Usage |
|-------|-----|-------|
| `--primary` | `#6366f1` | CTA, active, focus ring, progress |
| `--primary-600` | `#4f46e5` | hover CTA |
| `--primary-50` | `#eef2ff` | bg tint, badge |
| `--secondary` | `#06b6d4` | Doing, info |
| `--accent` | `#f59e0b` | High priority, warning |
| `--success` | `#10b981` | Done, success toast |
| `--danger` | `#ef4444` | Overdue, delete |
| `--bg` | `#f8fafc` | page bg |
| `--surface` | `#ffffff` | card |
| `--surface-2` | `#f1f5f9` | input bg, muted card |
| `--text` | `#0f172a` | primary text |
| `--muted` | `#64748b` | secondary |
| `--border` | `#e2e8f0` | border |
| `--priority-low` | `#10b981` | low badge |
| `--priority-med` | `#f59e0b` | medium badge |
| `--priority-high` | `#ef4444` | high badge |

### Typography
- **Sans:** `Inter` 400/500/600/700 — body, UI
- **Display:** `Plus Jakarta Sans` 700/800 — heading, brand, dashboard numbers
- Scale: `xs 12 / sm 13 / base 15 / lg 18 / xl 22 / 2xl 28 / 3xl 32`
- Line-height: 1.5 body, 1.2 heading

### Spacing / Radius / Shadow
```css
:root {
  --space-1:4px; --space-2:8px; --space-3:12px; --space-4:16px; --space-5:20px; --space-6:24px; --space-8:32px; --space-10:40px;
  --radius-sm:10px; --radius-md:14px; --radius-lg:18px; --radius-xl:22px; --radius-full:9999px;
  --shadow-sm:0 1px 2px rgba(15,23,42,.06);
  --shadow-md:0 4px 16px rgba(15,23,42,.08);
  --shadow-lg:0 12px 32px rgba(15,23,42,.12);
}
```

### Iconography
- Emoji + inline SVG minimal (no external icon lib): ✎ sửa, 🗑 xóa, ⇄ đổi trạng thái, 🔍 search, 🏷 tag, 📅 deadline, ⚠ quá hạn
- Priority dot: ● low/medium/high color

## 2. Wireframe

### Mobile 375px
```
[Header: brand "TaskBoard" | stats mini | + Thêm việc]
[Dashboard: 5 cards 2-col grid (total full-width) ]
[Toolbar: search full-width | filter row wrap (status, priority, tag, overdue toggle) | sort select]
[Task list: single column cards stack]
[Empty: illustration + "Chưa có công việc" + CTA]
[Modal bottom-sheet: form fields stacked]
[Undo toast: bottom center, progress bar 5s]
```

### Tablet 768px
```
[Header: brand | dashboard mini | + Thêm việc]
[Dashboard: 5 cards in 3-col (total + overdue span)]
[Toolbar: search + filters in 2 rows, sort right]
[Task list: 2-col card grid]
[Modal: centered 560px]
```

### Desktop 1280px
```
[Header: brand | nav | + Thêm việc primary]
[Container 1120px centered]
[Dashboard: 5 cards in 5-col equal]
[Toolbar: single row: search (flex) | filters (status/priority/tag/overdue) | sort | count]
[Task list: 3-col card grid (or 2-col if many details) — card hover lift]
[Modal: centered 640px, 2-col form grid for priority/status/dueDate]
```

## 3. Component Inventory

| Component | States | Notes |
|-----------|--------|-------|
| Button primary | default/hover/focus/active/disabled/loading | bg primary, hover -1px + shadow-md, active scale .98 |
| Button ghost | default/hover/focus | border, hover bg surface-2 |
| Button danger | default/hover | red, for delete |
| Card task | default/hover/overdue/done | hover shadow-lg + translateY(-2px), overdue left border red, done opacity .85 + strikethrough title |
| Badge priority | low/med/high | dot + text, bg tint |
| Badge status | todo/doing/done | todo gray, doing cyan, done green |
| Badge tag | default | pill, bg surface-2, border |
| Input / Textarea / Select | default/focus/error/disabled | focus ring 2px primary, error red border + message |
| Dashboard stat card | default | number large display font, label muted, icon top-right |
| Toolbar | default | sticky below header on mobile |
| Modal | open/closed | backdrop blur, scale-in 200ms, Esc to close |
| Toast undo | visible/progress | slide-in bottom, progress bar shrinks 5s, Hoàn tác button |
| Empty state | — | icon 48px, message, CTA |
| Skeleton | loading | pulse 3 cards |

## 4. UX States

| View | Loading | Empty | Error | Success |
|------|---------|-------|-------|---------|
| Dashboard | skeleton numbers | — | — | — |
| Task list | skeleton 3 cards | "Chưa có công việc phù hợp — Thử đổi bộ lọc hoặc Thêm việc" + CTA | "Lỗi tải dữ liệu" + Retry (localStorage parse fail) | toast "Đã thêm/cập nhật" 2.5s |
| Form | disable submit + spinner | — | inline error under field (title required) | toast + close modal |
| Delete | — | — | — | undo toast 5s with progress |

## 5. UX Flows

**Add:** Click + Thêm việc → modal open (focus title) → fill → validation inline → submit → addTask() → saveData() → render → toast → close modal

**Edit:** Click ✎ on card → modal prefilled → submit → updateTask() → save → render → toast

**Delete → Undo:** Click 🗑 → deleteTask() removes from state.tasks, push to undoStack, save, render, show toast "Đã xóa 'X' — Hoàn tác" with 5s progress → if Hoàn tác → restore at original index → save/render → dismiss toast; else after 5s → permanent, toast auto-dismiss

**Filter/Sort:** Any filter change → state.filters/sortBy update → filterTasks() + sortTasks() → renderTasks() + renderDashboard() (no reload)

**Overdue:** Computed: dueDate < today 00:00 && status !== 'done' → card red left border + ⚠ badge, dashboard overdue count, filter overdueOnly

## 6. Animation
- Card hover: `transform: translateY(-2px); box-shadow: shadow-lg; transition: 200ms ease`
- Modal: `backdrop fade 150ms, content scale .96→1 + opacity 0→1 200ms ease`
- Toast: `slide-in from bottom 200ms, progress width 100%→0% 5s linear`
- Button hover: `translateY(-1px)` 150ms
- Filter change: list fade 150ms (optional)

## 7. Accessibility
- Contrast ≥4.5:1 (text #0f172a on #fff, muted #64748b on #fff 4.6:1)
- Focus ring: `outline: 2px solid #6366f1; outline-offset: 2px`
- Modal: `role="dialog" aria-modal="true" aria-labelledby`, focus trap, Esc closes, return focus to trigger
- Icon buttons: `aria-label="Sửa công việc"` etc.
- Keyboard: Tab order logical, Enter submit, Space toggle status
- Semantic: header, main, section, button (not div)
- Skip link

## 8. Responsive Details
- Header sticky, backdrop blur
- Dashboard grid: 1 col mobile (total full), 2 col 480px, 3 col 768px, 5 col 1024px
- Toolbar: flex wrap, gap 8px, search flex:1 min 200px
- Cards: grid 1 col mobile, 2 col 768px, 3 col 1024px
- Modal: bottom-sheet on <640px (rounded top, max-height 90vh scroll), centered on desktop
- Touch targets ≥44px

---
*Generated by Claude Harness v2 — Design Phase — Bài 010*
