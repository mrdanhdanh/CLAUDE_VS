# Design: AI News — Tìm kiếm theo từ khoá + Lọc thời gian

## 1. Design System (kế thừa www/styles.css)
- **Palette:** primary #6366f1, accent #f59e0b, success #16a34a, neutral 900/700/500/300/200/100, surface #fff, bg #f8fafc
- **Typography:** Inter 400/500/600/700/800, Plus Jakarta Sans 700/800 (hero), JetBrains Mono (kbd), 13-15px body, 11px meta
- **Spacing:** 4/8px scale (--space-1..12), radius 8/12/16/20/full, shadow sm/md/lg
- **Glass:** hero-card đã có glass, search sẽ dùng surface card + border, không thêm glass mới để tránh nặng
- **Motion:** 150-300ms ease, transform/opacity only

## 2. Layout — Wireframe

### Desktop 1280
```
[Header: Y | STATUS | Cập nhật | JSON]
[Hero: 2 cols — left card + right mini-cards]
[Search Card: full width, 1 row]
  ┌─────────────────────────────────────────────────────────┐
  │ 🔍 [ input: "Nhập từ khoá: AI agents, Gemini, ..." ] [Tìm] [Xoá] │
  │ Thời gian: [7 ngày] [30 ngày*] [3 tháng] [6 tháng] [Không giới hạn]  ·  Gợi ý: AI agents · Gemini · self-improving │
  │ Kết quả: "12 bài cho 'Gemini' trong 30 ngày · 3 hot" (khi có search) │
  └─────────────────────────────────────────────────────────┘
[Filter chips: Tất cả | 🧠 Self... | 🏢 Big Tech ...]
[Hot grid: 2-3 cols]
[All grid: 2-3 cols]
```

### Tablet 768
- Search card: input + buttons wrap, time chips wrap 2 rows, gap 8px
- Grids: 2 cols

### Mobile 375
- Search card: input full width, buttons full width stacked or inline 2 cols, time chips scroll horizontal or wrap
- Grids: 1 col
- Header: brand + 2 buttons (STATUS hidden text, only icon)

## 3. Component — Search Card

### Structure
```html
<section class="section search-section" aria-label="Tìm kiếm tin AI">
  <div class="search-card">
    <div class="search-row">
      <label class="search-input-wrap" for="searchInput">
        <svg search icon>...</svg>
        <input id="searchInput" type="search" placeholder="Nhập từ khoá: AI agents, Gemini, self-improving..." autocomplete="off" />
        <button id="btnClearSearch" aria-label="Xoá tìm kiếm" hidden>✕</button>
      </label>
      <button id="btnSearch" class="btn btn-primary">Tìm</button>
      <button id="btnResetSearch" class="btn btn-ghost">Xoá</button>
    </div>
    <div class="search-meta">
      <div class="time-chips" role="group" aria-label="Khoảng thời gian">
        <span class="time-label">Thời gian:</span>
        <button data-days="7" class="time-chip">7 ngày</button>
        <button data-days="30" class="time-chip active">30 ngày</button>
        <button data-days="90" class="time-chip">3 tháng</button>
        <button data-days="180" class="time-chip">6 tháng</button>
        <button data-days="0" class="time-chip">Không giới hạn</button>
      </div>
      <div class="search-hints" aria-label="Gợi ý từ khoá">
        Gợi ý: <button class="hint-chip" data-hint="AI agents">AI agents</button> · <button class="hint-chip" data-hint="Gemini">Gemini</button> · <button class="hint-chip" data-hint="self-improving">self-improving</button>
      </div>
    </div>
    <div id="searchStatus" class="search-status" aria-live="polite" hidden></div>
  </div>
</section>
```

### States
- **Default:** input border #e5e7eb, placeholder muted
- **Focus:** border primary, ring 2px rgba(99,102,241,.15)
- **Hover chip:** border primary, color primary
- **Active chip:** bg primary, color white
- **Disabled (cooldown):** btn opacity .6, pointer-events none, title shows remaining
- **Loading:** btnSearch shows spinner, grids show skeleton/empty-state "Đang tìm..."
- **Empty:** "Không tìm thấy tin nào cho 'X' trong Y ngày — thử từ khoá khác hoặc chọn Không giới hạn"
- **Error:** toast + keep old data + searchStatus shows error

### Highlight
- `<mark class="hl">keyword</mark>` — bg #fef3c7, color #92400e, border-radius 3px, padding 0 2px

## 4. Interaction
- Enter trong input → trigger search
- Esc trong input → clear + reset
- Click time-chip → set active + if already searched → auto re-search with new range (optional, but we do: update active only, user bấm Tìm lại — simpler, avoid spam)
- Click hint-chip → fill input + trigger search
- Click Xoá → clear input, reset days=30, clear searchStatus, restore ai-news.json data (reload or cache), reset filter to all
- Search + category filter: search results are base set, category chips filter on top (client-side)

## 5. Responsive Rules
- 375: .search-row flex-wrap, input min-width 0 flex 1 1 100%, buttons 1 1 auto, time-chips overflow-x auto with scrollbar hidden
- 768: input flex 1, buttons inline
- 1280: single row

## 6. A11y
- label for input, aria-label for buttons, role group for time-chips with aria-pressed
- Focus-visible ring 2px primary
- Contrast ≥4.5:1 (text #0f172a on #fff, primary #6366f1 on white for active chip)
- Keyboard: Tab through input → Tìm → Xoá → time chips → hint chips → filter chips

## 7. Visual Polish
- Card: bg var(--color-surface), border 1px var(--color-neutral-200), radius 16px, padding 16px, shadow sm
- Input: height 40px, radius 999px, padding 0 16px 0 40px (icon left), border 1px
- Chips: radius 999px, padding 6px 12px, font 13px 500, transition 150ms
- Status: font 13px, color muted, margin-top 8px
