# Design: Todo Rebuild v2 — TaskBoard Premium Glass

## 1. Design System

### Palette
| Token | Hex | Usage |
|-------|-----|-------|
| `--primary` | `#6366f1` | CTA, active, focus ring, sync ok |
| `--primary-600` | `#4f46e5` | hover CTA |
| `--primary-700` | `#4338ca` | active CTA |
| `--primary-50` | `#eef2ff` | tint bg, badge |
| `--secondary` | `#06b6d4` | Doing, info |
| `--secondary-50` | `#ecfeff` | Doing tint |
| `--accent` | `#f59e0b` | High priority, warning |
| `--success` | `#10b981` | Done, success |
| `--success-50` | `#ecfdf5` | Done tint |
| `--danger` | `#ef4444` | Overdue, delete |
| `--danger-50` | `#fef2f2` | Overdue tint |
| `--bg` | `#f8fafc` | page bg |
| `--surface` | `#ffffff` | card |
| `--surface-2` | `#f1f5f9` | input, muted |
| `--text` | `#0f172a` | primary |
| `--text-2` | `#1e293b` | secondary heading |
| `--muted` | `#64748b` | secondary text |
| `--muted-2` | `#94a3b8` | placeholder |
| `--border` | `#e2e8f0` | border |
| `--border-strong` | `#cbd5e1` | hover border |

### Typography
- **Sans:** `Inter` 400/500/600/700/800 — body, UI, numbers
- **Display:** `Plus Jakarta Sans` 700/800 — heading, brand, dashboard numbers
- Scale: `xs 12 / sm 13 / base 15 / lg 18 / xl 22 / 2xl 28`
- Line-height: 1.6 body, 1.15 heading, letter-spacing -0.03em for display

### Spacing / Radius / Shadow
```css
:root {
  --space-1:4px; --space-2:8px; --space-3:12px; --space-4:16px; --space-5:20px; --space-6:24px; --space-8:32px; --space-10:40px;
  --radius-sm:10px; --radius-md:14px; --radius-lg:18px; --radius-xl:22px; --radius-2xl:28px; --radius-full:9999px;
  --shadow-sm:0 1px 2px rgba(15,23,42,.06), 0 1px 3px rgba(15,23,42,.04);
  --shadow-md:0 4px 16px rgba(15,23,42,.08), 0 2px 8px rgba(15,23,42,.06);
  --shadow-lg:0 12px 32px rgba(15,23,42,.12), 0 4px 16px rgba(15,23,42,.08);
  --shadow-glow:0 8px 24px rgba(99,102,241,.18);
  --glass-blur:16px;
}
```

### Glass & Effects
- Header: `backdrop-filter: saturate(180%) blur(16px)`, bg `rgba(248,250,252,.78)`, border `rgba(226,232,240,.8)`
- Cards: `linear-gradient(180deg, rgba(255,255,255,.96), rgba(255,255,255,.9))` + `backdrop-filter: blur(10px) saturate(150%)`, border `rgba(255,255,255,.7)`, inner highlight `inset 0 1px 0 rgba(255,255,255,.9)`
- Toolbar: same glass, radius 22px, shadow-md
- Rainbow accent: top 3px bar per dash card (primary→secondary, etc.)

## 2. Wireframe

### Mobile 375px
```
[Header: brand TaskBoard + badge BÀI 010 | + Thêm việc (icon only on <375)]
[Dashboard: 5 cards — 1 col (total full), gap 14px]
[Toolbar: search full-width | filters wrap (status, priority, tag, overdue) | sort + count | actions wrap (Xóa lọc, Seed, Lưu GitHub, GitHub, Xuất, Nhập) | sync bar full-width | hint]
[Task grid: 1 col stack, card padding 18px]
[Empty: icon + title + desc + CTA]
[Modal: bottom-sheet, rounded top 22px, max-height 90vh scroll, form 1 col]
[Sync Code bar: code pill + copy + QR]
[Toast: bottom center, max-width 92vw]
```

### Tablet 768px
```
[Header: brand | hint pill | actions]
[Dashboard: 3 cols (total spans 1, overdue spans 1)]
[Toolbar: search + filters 2 rows, sort right]
[Task grid: 2 cols]
[Modal: centered 560px, form 2 cols for priority/status/dueDate]
```

### Desktop 1280px
```
[Header: brand | hint | actions]
[Container 1160px centered]
[Dashboard: 5 cols equal]
[Toolbar: row1: search flex | filters | overdue toggle | row2: sort + count left, actions right]
[Task grid: 3 cols, card hover lift -3px + shadow-lg]
[Modal: centered 640px, 2-col form grid]
```

## 3. Component Inventory

| Component | States | Notes |
|-----------|--------|-------|
| Button primary | default/hover/focus/active/disabled/loading | gradient 135deg primary→600, hover -1px + glow, active scale .97 |
| Button ghost | default/hover/focus | white .9 + border, hover white + shadow-md |
| Button danger | default/hover | red, for delete |
| Button sm | — | padding 8x14, font .82rem |
| Dash card | default/hover | glass, top 3px bar, hover -3px, icon 36px, number 2rem display |
| Toolbar | default | glass, radius-xl, 2 rows + sync bar |
| Search | default/focus | pill 999px, icon, focus ring 4px primary/12% |
| Select / Input / Textarea | default/focus/error/disabled | radius 12px, focus ring, error red |
| Card task | default/hover/overdue/done | glass, hover -2px, overdue left red border + badge, done opacity .85 |
| Badge priority | low/med/high | dot + text, tint bg |
| Badge status | todo/doing/done | gray/cyan/green |
| Badge tag | default | pill surface-2 |
| Modal | open/closed | backdrop blur 8px, panel scale .96→1 200ms, Esc + focus trap |
| Toast | success/undo | slide-in bottom, progress bar 2.5s/5s, action button |
| Sync bar | ok/busy/error | pill status + sub code, border, shadow-sm |
| Sync Code pill | default | mono font, letter-spacing .08em, copy button |
| Empty state | — | icon 48px, title, desc, CTA (Xóa lọc or Thêm việc) |
| Skeleton | loading | pulse 3 cards |

## 4. UX States

| View | Loading | Empty | Error | Success |
|------|---------|-------|-------|---------|
| Dashboard | skeleton numbers | — | — | — |
| Task list | skeleton 3 cards | "Chưa có việc" or "Không có kết quả với bộ lọc" + CTA | "Lỗi tải" + Retry | toast 2.5s |
| Form | disable submit | — | inline error under title | toast + close modal |
| Delete | — | — | — | undo toast 5s with progress + Hoàn tác |
| Sync GitHub | busy spinner | — | error message + reopen modal | ok + lastSync timestamp |
| Sync Code | busy | — | error | ok + code pill |

## 5. UX Flows

**Add:** + Thêm việc → modal (focus title) → fill → validation → submit → addTask → saveData → render → scheduleGithubSync + scheduleKvdbSync → toast → close

**Edit:** ✎ → modal prefilled → submit → updateTask → save → render → sync

**Delete → Undo:** 🗑 → confirm → deleteTask → save → render → sync → undo toast 5s → Hoàn tác restores at index → sync

**Filter/Sort:** any change → state.filters/sortBy → filterTasks + sortTasks → renderTasks + dashboard (no reload)

**GitHub Sync:** ⚙ GitHub → modal (owner/repo/branch/path/token/autosync) → Kết nối → save config → pushTasksToGitHub (GET sha → PUT) → 409 retry once → show lastSync

**Sync Code (kvdb):** Tạo mã → generate 6-char → save to localStorage `todo-manager:syncCode` → kvdbPush → show pill + copy → máy khác: Nhập mã → kvdbPull → merge (replace local tasks) → save → render → toast

**Load:** init → loadData (localStorage v2) → if empty → fetch tasks.json no-store → if syncCode exists → kvdbPull (if newer) → render → refreshSyncStatus

## 6. Animation
- Card hover: `translateY(-2px)`, shadow-lg, 220ms ease
- Dash hover: `translateY(-3px)`, 220ms
- Button hover: `translateY(-1px)`, 180ms
- Modal: backdrop fade 150ms, panel scale .96→1 + opacity 0→1 200ms ease
- Toast: slide-in 200ms, progress width 100%→0% 2.5s/5s linear
- Focus ring: 2px primary + 4px glow

## 7. Accessibility
- Contrast ≥4.5:1 (text #0f172a on #fff, muted #64748b on #fff 4.6:1, primary #6366f1 on white 4.5:1 for large)
- Focus ring: `outline: 2px solid #6366f1; outline-offset: 2px` + `:focus-visible`
- Modal: `role="dialog" aria-modal="true" aria-labelledby`, focus trap, Esc closes, return focus
- Icon buttons: `aria-label`
- Keyboard: Tab order, Enter submit, Space toggle, Esc close both modals
- Semantic: header, main, section, article, button
- Skip link, aria-live for count + sync status, prefers-reduced-motion

## 8. Responsive Details
- Header sticky, backdrop blur, actions wrap at 480px
- Dashboard: 1 col mobile, 2 col 480px, 3 col 768px, 5 col 1024px
- Toolbar: flex wrap, gap 8-12px, search min 220px flex:1
- Cards: 1 col mobile, 2 col 680px, 3 col 1024px
- Modal: bottom-sheet <640px, centered desktop
- Touch targets ≥44px, btn min 38px
- Container 1160px, padding 20px → 16px → 14px

---
*Generated by Claude Harness v2 — Design Phase — todo-rebuild-v2*
