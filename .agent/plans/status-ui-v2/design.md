# Design: Status UI v2 — YUNIE STATUS

> Harness v2 — Phase Design | Stack: vanilla HTML/CSS/JS · CSS variables · Google Fonts · SVG Lucide · No framework
> Tham chiếu: `ui-ux-pro-max` (Real-Time Operations + Minimalism & Swiss Style), `product-quality.instructions.md`, `docs/knowleged.md` KN-002

## 1. Design System

### 1.1 Palette — Light, Indigo primary, operational green/red
| Token | Hex | Usage |
|-------|-----|-------|
| `--color-primary` | `#6366f1` | CTA chính, link, active, focus ring |
| `--color-primary-600` | `#4f46e5` | Hover primary |
| `--color-primary-50` | `#eef2ff` | Nền nhạt, hero gradient |
| `--color-secondary` | `#0ea5e9` | Bổ trợ, info, progress |
| `--color-accent` | `#f59e0b` | Nhấn, badge, cảnh báo |
| `--color-success` | `#16a34a` | OK, enabled, live dot |
| `--color-success-bg` | `#dcfce7` | Nền success |
| `--color-success-border` | `#bbf7d0` | Viền success |
| `--color-success-text` | `#166534` | Chữ success |
| `--color-warning` | `#f59e0b` | WARN |
| `--color-warning-bg` | `#fef3c7` | Nền warn |
| `--color-danger` | `#dc2626` | FAIL, destructive |
| `--color-danger-bg` | `#fee2e2` | Nền danger |
| `--color-neutral-900` | `#0f172a` | Chữ chính |
| `--color-neutral-700` | `#334155` | Chữ phụ |
| `--color-neutral-500` | `#64748b` | Muted |
| `--color-neutral-400` | `#94a3b8` | Placeholder, icon |
| `--color-neutral-300` | `#cbd5e1` | Border nhạt |
| `--color-neutral-200` | `#e2e8f0` | Border |
| `--color-neutral-100` | `#f8fafc` | Nền trang |
| `--color-neutral-50` | `#f1f5f9` | Nền card phụ |
| `--color-surface` | `#ffffff` | Card, surface |

- Không hardcode hex trong component — chỉ dùng CSS variables.
- Contrast: text trên surface ≥ 4.5:1 (slate-900 trên white = 15:1, slate-500 trên white = 4.6:1).

### 1.2 Typography
- **Sans (UI/body):** `Inter` 400/500/600/700/800 — fallback `system-ui, -apple-system, Segoe UI, Roboto`
- **Display (heading):** `Plus Jakarta Sans` 700/800 — fallback `Inter`
- **Mono (code/kbd):** `JetBrains Mono` 400/500/600 — fallback `ui-monospace, SFMono-Regular, Menlo`
- Scale: `xs 12 / sm 13 / base 14 / lg 16 / xl 20 / 2xl 24 / 3xl 30` — body 14, h1 30 (desktop) / 24 (mobile), h2 18, h3 14
- Line-height: body 1.6, heading 1.15–1.3
- Google Fonts import: `Inter + Plus Jakarta Sans + JetBrains Mono` với `display=swap`

### 1.3 Spacing / Radius / Shadow (4/8 system)
```css
:root {
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px; --space-6: 24px; --space-8: 32px; --space-10: 40px; --space-12: 48px;
  --radius-sm: 8px; --radius-md: 12px; --radius-lg: 16px; --radius-xl: 20px; --radius-full: 9999px;
  --shadow-sm: 0 1px 2px rgba(15,23,42,.06), 0 1px 3px rgba(15,23,42,.08);
  --shadow-md: 0 4px 12px rgba(15,23,42,.08), 0 2px 6px rgba(15,23,42,.06);
  --shadow-lg: 0 12px 32px rgba(15,23,42,.12), 0 4px 12px rgba(15,23,42,.08);
  --header-h: 56px;
}
```

### 1.4 Iconography
- **Không dùng emoji làm icon** — dùng SVG inline Lucide (stroke 1.8, 16–20px) cho: stats, registry type, health, pages, pipeline, search, refresh, external link.
- Một bộ stroke-width nhất quán, corner radius 2px.

## 2. Wireframe

### Mobile 375px
```
[Header: Y mark | YUNIE STATUS + subtitle | (hamburger) actions: refresh, pipeline, menu]
[Hero: card full-width]
  - Eyebrow: YUNIE · Harness v2
  - H1: Hệ thống Harness v2 đang hoạt động
  - Desc: 2 dòng, kbd www/
  - Meta pills: 2x2 grid
  - Actions: Kiểm tra hệ thống (primary) + Xem quy trình (ghost) — full width stacked
[Hero side: 3 mini-cards stacked]
[Stats: 2 cols grid]
[Registry: card]
  - Controls: search full-width + filter pills wrap (horizontal scroll)
  - Cards list (table hidden)
[Presets: card stacked]
[Plans: card stacked]
[Health: card]
[Pages: card]
[How-to: 3 cards stacked]
[Footer centered]
[Pipeline Modal: bottom sheet 92vh, handle, scroll]
```

### Tablet 768px
```
[Header: brand | actions row (refresh, pipeline, status.json, GitHub)]
[Hero: 1 col (hero-card) + side 3 cards stacked below — or 2-col if ≥900px]
[Stats: 3 cols]
[Registry: table visible, cards hidden — search + pills in one row]
[Grid-2: Presets | Plans]
[Grid-2: Health | Pages]
[How-to: 3 cols]
[Modal: centered 640px, max-h 85vh]
```

### Desktop 1280px
```
[Header: brand | nav actions]
[Hero: 2-col (1.15fr hero-card | 0.85fr side)]
[Stats: 5 cols]
[Registry: table full]
[Grid-2: Presets | Plans]
[Grid-2: Health | Pages]
[How-to: 3 cols]
[Container max 1120 centered, padding 24]
[Modal: centered 720px, 2-col pipeline stepper]
```

## 3. Component Inventory

| Component | States | Notes |
|-----------|--------|-------|
| Button primary | default/hover (translateY -1px + shadow-md)/focus (outline 2px primary)/active (scale .98)/disabled (opacity .5) | 150ms ease, cursor-pointer |
| Button ghost | default/hover (border darker + bg neutral-50)/focus/active/disabled | border 1px neutral-200 |
| Badge live | dot pulse 1.6s, bg success-bg, border success-border | animation respects reduced-motion |
| Stat card | default/hover (translateY -1px + shadow-md)/focus-within (outline) | icon 32px rounded 10px, progress 6px |
| Registry search | default/focus (border primary + ring 3px rgba 99,102,241,.15)/placeholder muted | 44px min height for touch |
| Filter pill | default/hover/active (bg primary white text)/focus-visible | 150ms, aria-pressed |
| Table row | default/hover (bg neutral-50)/focus | sticky header |
| Reg card (mobile) | default/hover | border, shadow-sm → md |
| Preset/Plan item | default/hover (bg neutral-50 + radius) | padding 12, border-bottom |
| Page link | default/hover (translateY -1px + shadow-sm)/focus-visible | border, radius 10 |
| Modal overlay | closed/open (opacity 0→1, 200ms) | backdrop rgba(15,23,42,.5), blur 4px |
| Modal panel | closed (scale .98 + translateY 8px) → open (scale 1 + translateY 0) 200ms ease | desktop centered, mobile bottom sheet |
| Toast | hidden → show (slideIn 200ms), auto-dismiss 3s, close button | bg neutral-900, max 360px |
| Skeleton | shimmer 1.2s linear | respects reduced-motion → static |
| Empty | dashed border, centered, CTA | illustration SVG + message + button |
| Error | bg danger-bg, border danger-border, text danger-text | role alert, Retry button |

## 4. UX States

| View | Loading | Empty | Error | Success |
|------|---------|-------|-------|---------|
| Stats | 5 skeletons 72px | — | error card full-width + Retry | — |
| Registry | 3 skeleton rows | “Chưa có dữ liệu registry — chạy harness-manager status” | “Không tải được status.json — mở npx serve www” + Mở status.json + Thử lại | filter count update, toast “Đã làm mới” |
| Presets | skeleton 3 rows | “Chưa có preset — tạo bằng preset save <name>” | — | — |
| Plans | skeleton 3 rows | “Chưa có kế hoạch — chạy /harness để tạo” | — | — |
| Health | skeleton 2 rows | “Chưa có lần kiểm tra” | health FAIL badge + errors count | toast “Đã sao chép status.json” |
| Pages | skeleton 2 rows | “Chưa có trang nào — thêm tệp vào www/” | — | — |
| Pipeline modal | — | — | — | open 200ms, close ESC/overlay/Đóng |

## 5. Animation
- Transition mặc định: `150ms ease` cho hover, `200ms ease` cho modal/toast, `300ms ease` cho progress.
- Chỉ dùng `transform` và `opacity` (GPU) — không animate width/height.
- Hover: `translateY(-1px)` + shadow.
- Toast: `slideIn` 200ms, auto-dismiss 3000ms.
- Pulse dot: 1.6s infinite, tắt khi `prefers-reduced-motion: reduce`.
- Shimmer: 1.2s, tắt khi reduced-motion.

## 6. Accessibility
- Contrast ≥ 4.5:1 cho mọi text (kiểm bằng tool).
- Focus ring: `outline: 2px solid var(--color-primary); outline-offset: 2px` cho mọi interactive.
- Skip-link: top -40px → focus top 12px.
- Semantic: header/nav/main/section/footer, h1→h2→h3 hierarchy, table scope col.
- Icon-only button: `aria-label` (Làm mới, Đóng modal).
- Modal: `role="dialog" aria-modal="true" aria-labelledby`, focus trap (Tab/Shift+Tab loop), ESC đóng, click overlay đóng, body scroll lock, restore focus khi đóng.
- Keyboard: `/` focus search, ESC blur search, Tab order hợp lý, Enter/Space trigger.
- Reduced motion: `@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }`
- Touch target: ≥44×44px cho button, pill, search.

## 7. Wording — Rà soát câu chữ (tiếng Việt tự nhiên)

| Vị trí | Cũ | Mới | Lý do |
|--------|----|-----|-------|
| Header subtitle | Harness v2 · Process > Model | Harness v2 · Quy trình tạo nên chất lượng | Dịch nghĩa, dễ hiểu |
| Hero eyebrow | (không có) | YUNIE · Harness v2 | Thêm context |
| Hero H1 | Hệ thống Harness v2 — YUNIE đang trực | Hệ thống Harness v2 đang hoạt động | Tự nhiên, bớt “đang trực” |
| Hero desc | Chatbot hệ thống: hiểu toàn bộ Harness... Copy file mới vào www/ là tự lên Pages. | YUNIE hiểu toàn bộ hệ thống Harness, hỗ trợ thực thi tác vụ, kiểm tra trạng thái và cập nhật trang này. Mọi tệp trong thư mục www/ sẽ tự động triển khai lên GitHub Pages. | Rõ ràng, đúng chính tả, không cụt |
| Hero meta | ⏱ — · 🤖 YUNIE · 🔁 Idea → … → Done · 📦 — | Cập nhật · Vận hành bởi · Quy trình · Tình trạng | Nhãn rõ nghĩa |
| Hero actions | Kiểm tra hệ thống + Xem registry | Kiểm tra hệ thống + Xem quy trình | Thêm Pipeline CTA |
| Mini 1 title | 📂 www/ là root của Pages | Thư mục www/ là gốc của GitHub Pages | Tự nhiên |
| Mini 1 desc | Workflow .github/workflows/pages.yml upload toàn bộ www/. Thêm trang mới chỉ cần copy vào www/ — không cần sửa workflow. | Tệp workflow .github/workflows/pages.yml sẽ tự động triển khai toàn bộ nội dung trong www/. Chỉ cần thêm tệp mới vào www/ — không cần chỉnh workflow. | Đầy đủ chủ ngữ |
| Mini 2 title | 💬 Gọi YUNIE trong Copilot Chat | Gọi YUNIE ngay trong Copilot Chat | Tự nhiên |
| Mini 2 desc | Gõ @YUNIE kiểm tra hệ thống hoặc yunie cập nhật status... | Nhập @YUNIE kiểm tra hệ thống hoặc yunie cập nhật status. YUNIE sẽ đọc registry.json, chạy kiểm tra và tạo lại status.json. | Động từ chuẩn |
| Mini 3 title | Pipeline | Quy trình 8 bước | Rõ nghĩa |
| Stats label | Skills/Instructions... | Giữ nguyên (thuật ngữ) + tooltip tiếng Việt | Nhất quán thuật ngữ |
| Registry title | Registry — Tháo lắp wise | Registry — Quản lý thành phần | Dễ hiểu |
| Registry sub | Nguồn: .github/harness/registry.json · Đồng bộ skills/registry.json | Nguồn: .github/harness/registry.json · Đồng bộ với skills/registry.json | Thêm “với” |
| Registry search placeholder | Tìm skill, instruction, agent... | Tìm theo tên hoặc mô tả... | Rõ hơn |
| Filter pills | Tất cả · 🧩 Skill ... | Tất cả · Skill · Instruction · Agent · Prompt · Hook (kèm SVG) | Bỏ emoji, dùng SVG |
| Presets title | Presets | Bộ cấu hình | Dịch |
| Presets sub | 1 lệnh áp đúng bộ | Áp dụng nhanh theo nhu cầu | Tự nhiên |
| Plans title | Plans & Demos | Kế hoạch & Bản thử | Dịch |
| Health title | Health | Tình trạng hệ thống | Dịch |
| Pages title | Pages — www/ | Trang đã triển khai | Rõ nghĩa |
| Pages sub | Copy file vào www/ là tự deploy | Tự động triển khai khi thêm tệp vào www/ | Tự nhiên |
| How-to title | Thêm trang mới — không cần sửa workflow | Thêm trang mới chỉ với 3 bước | Ngắn gọn |
| How-to step 1 | Copy file | Tạo tệp mới | Tự nhiên |
| How-to step 2 | YUNIE cập nhật | Cập nhật trạng thái | Rõ |
| How-to step 3 | Push → Pages | Đẩy lên GitHub | Ngắn |
| Footer | Built by YUNIE · Harness v2 · ... Mở npx serve www để xem local — push lên GitHub để Pages deploy. file:// có thể bị CORS. | Phát triển bởi YUNIE · Harness v2 · ... Chạy npx serve www để xem trên máy — đẩy lên GitHub để tự động triển khai. Lưu ý: mở bằng file:// có thể bị lỗi CORS. | Tự nhiên, đủ dấu |

## 8. Pipeline Modal — Chi tiết

### Trigger
- Header: nút “Quy trình” (ghost, icon workflow) — visible ≥640px, icon-only <640px với aria-label
- Hero: nút “Xem quy trình” (ghost, icon) cạnh “Kiểm tra hệ thống”

### Layout
- Overlay: fixed inset 0, bg rgba(15,23,42,.5) + backdrop-blur 4px, z 40
- Panel: bg surface, border neutral-200, radius xl (20px) desktop / top radius 20px mobile bottom sheet, shadow-lg, max-w 720px, max-h 85vh (desktop) / 92vh (mobile), overflow auto
- Header: sticky top, bg surface, border-bottom, title “Quy trình Harness v2” + subtitle “8 bước từ ý tưởng đến sản phẩm hoàn chỉnh” + nút Đóng (X)
- Body: stepper vertical (desktop 2-col: left stepper, right detail) hoặc single col mobile
- Footer: note “Process > Model — Chất lượng đến từ quy trình” + nút “Đã hiểu”

### Stepper Content (8 phases)
1. **Explore** — Khám phá: hiểu codebase, đọc README/package.json, grep pattern — Output: tóm tắt stack — Tool: Explore subagent
2. **Clarify** — Làm rõ: hỏi khi mơ hồ (max 3 câu) — Output: giả định chốt — Tool: vscode_askQuestions
3. **PRD** — Đặc tả: vision, user stories P0/P1, scope, metrics — Output: .agent/plans/<slug>/prd.md — Tool: Plan agent
4. **Design** — Thiết kế: palette, typography, wireframe 375/768/1280, states — Output: .agent/plans/<slug>/design.md — Tool: Designer agent
5. **Plan** — Lập kế hoạch: chia todos, file changes, risks — Output: .agent/plans/<slug>/plan.md + todos — Tool: Plan agent
6. **Implement** — Thực thi: todo-driven, 1 in-progress, get_errors — Output: code — Tool: Implement agent
7. **Polish** — Hoàn thiện: responsive, states, animation, a11y — Output: UI đạt chuẩn — Tool: Polish agent
8. **Verify** — Kiểm định: build/test/lint + visual, loop fix max 3 — Output: PASS → Done — Tool: Verify agent
- Thêm: “Rút gọn cho task nhỏ” và “Verify loop” note
- Mỗi step: icon SVG, số thứ tự, tên, mô tả 1 dòng, output mono, tool tag

### Interaction
- Open: click trigger → overlay fade 200ms + panel scale/translate 200ms, focus vào nút Đóng, body overflow hidden
- Close: ESC / click overlay / nút Đóng / nút Đã hiểu → restore focus về trigger, body overflow auto
- Focus trap: Tab/Shift+Tab loop trong modal
- A11y: role dialog, aria-modal, aria-labelledby, aria-describedby

---
*Generated by Claude Harness v2 — Design Phase — status-ui-v2 — 2026-08-29*
