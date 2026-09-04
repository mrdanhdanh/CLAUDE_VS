# PRD: Design Showcase 72 — Trang thể hiện 74 phong cách web

> Harness v2 — Phase PRD | Task: Tạo trang showcase toàn bộ style đã học (awesome-design-md) + kết nối STATUS | 2026-09-04

## 1. Vision
- **One-liner:** Một trang duy nhất tại `www/design-showcase/` trưng bày toàn bộ **74 DESIGN.md** đã học (sếp nói 72, thực tế 74) — mỗi style là một card sống động với palette, mô tả, category, link DESIGN.md/preview.html — kết nối trực tiếp với `www/status.json` (STATUS) để thấy hệ thống đang bật gì.
- **Problem:** 74 DESIGN.md nằm rải rác trong `awesome-design-md/design-md/<slug>/DESIGN.md` + `index.json` — chưa có nơi nào nhìn một phát thấy hết, so sánh vibe, chọn style cho task mới. Dev phải `search.mjs` thủ công, không trực quan, không share được lên Pages.
- **Target User:** Dev dùng Harness (primary) cần chọn vibe trước khi code; người mới onboarding muốn xem thư viện design; reviewer kiểm tra Pages deploy.

## 2. User Stories
| ID | As a ... | I want ... | So that ... | Priority |
|----|----------|------------|-------------|----------|
| US-01 | Dev | Mở `/design-showcase/` thấy ngay 74 cards, mỗi card có tên, slug, category, primary color, mô tả ngắn | Không phải grep/search.mjs thủ công | P0 |
| US-02 | Dev | Lọc theo category (AI & LLM, Fintech, Media...) + search theo tên/màu/vibe + sort A-Z | Nhanh tìm style phù hợp task | P0 |
| US-03 | Dev | Bấm card xem chi tiết: full palette dots, description đầy đủ, link DESIGN.md + preview.html | Quyết định có dùng style đó không | P0 |
| US-04 | Dev | Thấy header kết nối STATUS: counts skills/instructions/agents + link về `www/index.html` + live badge | Biết hệ thống đang bật gì, nhảy qua STATUS 1 click | P0 |
| US-05 | Mobile user | Xem ở 375px không vỡ: grid 1 col → 2 cols (768) → 3 cols (1280), filter pills scroll ngang, card không tràn | Check trên điện thoại | P0 |
| US-06 | Keyboard/a11y user | Tab qua search/filter/cards, focus ring rõ, modal đóng ESC, skip-link, aria-label | Dùng không cần chuột | P0 |
| US-07 | Dev | Copy slug / màu primary 1 click, toast feedback | Dán vào PRD/Design nhanh | P1 |
| US-08 | Dev | Thấy empty/loading/error states rõ (fetch fail, search 0 kết quả) | Biết phải làm gì | P1 |

## 3. Scope

### In Scope (P0 — phải có)
- [ ] Trang `www/design-showcase/index.html` — header (reuse YUNIE STATUS header + nav link STATUS ↔ Showcase), hero (title + stats 74 + categories + search), filter bar (category pills + search + sort + count), grid 74 cards, detail modal/drawer, footer
- [ ] `www/design-showcase/styles.css` — reuse tokens từ `www/styles.css` (palette indigo, spacing 4/8, radius, shadow, glass, rainbow) + grid/card/modal riêng; responsive 375/768/1280; states hover/focus/active; animation 150-300ms; a11y contrast ≥4.5:1
- [ ] `www/design-showcase/app.js` — fetch `designs.json` (copy từ `awesome-design-md/index.json`) + fetch `../status.json` để render STATUS bar; render grid, filter/search/sort, modal (ESC + focus trap + body lock), copy, toast, keyboard `/` focus search
- [ ] `www/design-showcase/designs.json` — copy `awesome-design-md/index.json` vào www để Pages deploy được (www là root)
- [ ] Kết nối STATUS: fetch `../status.json` hiển thị counts + link về `../index.html`; cập nhật `www/status.json` via `generate-status.mjs` để liệt kê demo mới
- [ ] Cập nhật `www/index.html` thêm link/card dẫn tới Showcase (section Demos hoặc nav)
- [ ] Empty/loading/error/toast states đầy đủ

### Nice to Have (P1 — nếu còn thời gian)
- [ ] Preview iframe cho `preview.html` trong modal (nếu file tồn tại local)
- [ ] Dark mode toggle (prefers-color-scheme)
- [ ] Share URL với query `?q=linear&cat=Productivity`

### Non-Goals (Out of Scope)
- Không sửa `awesome-design-md/index.json` gốc, không sửa `registry.json`
- Không backend/API, không đổi workflow Pages (chỉ thêm file vào www)
- Không i18n đa ngôn ngữ (tiếng Việt chuẩn)

## 4. Success Metrics
- Visual: 375/768/1280 không vỡ, không horizontal scroll, grid 1→2→3 cols mượt
- Data: 74 cards render đủ, filter/search ra đúng, modal mở/đóng 200ms
- STATUS: fetch `../status.json` thành công, hiển thị counts, link về STATUS hoạt động
- A11y: contrast ≥4.5:1, Tab/ESC/Enter hoạt động, skip-link, aria-label cho icon-only, modal focus trap
- UX: 4 states đủ (loading skeleton, empty với CTA, error với Retry, success toast 3s)
- Build: `get_errors` 0, `JSON.parse(designs.json)` pass, `npx serve www` mở `/design-showcase/` 200

## 5. Edge Cases & Constraints
- `designs.json` fetch fail (file:// CORS) → error card với hướng dẫn `npx serve www`
- `status.json` fetch fail → STATUS bar hiện "—" + link vẫn hoạt động
- Search 0 kết quả → empty "Không tìm thấy — thử từ khóa khác" + nút Xóa lọc
- Modal mở khi focus input → focus trap không cướp focus khi đóng, trả focus về card đã bấm
- Reduced motion → tắt animation shimmer/slide
- Constraint: vanilla HTML/CSS/JS, không framework, reuse `www/styles.css` tokens, font Inter + Plus Jakarta Sans + JetBrains Mono

## 6. Persistence · F5 · Scope
- `Persistence: static JSON (www/design-showcase/designs.json copy từ awesome-design-md/index.json) + live fetch ../status.json · F5: giữ (static) · Scope: global (mọi browser thấy giống nhau, Pages deploy)`
- Không lưu user state lên server; filter/search chỉ in-memory (có thể thêm URL query P1)

## 7. Assumptions
- Giữ stack vanilla HTML/CSS/JS, CSS variables, reuse header/styles từ STATUS
- 74 designs là source of truth (index.json count), sếp nói 72 nhưng show đủ 74 cho chuẩn — ghi chú rõ trong hero
- Category map lấy từ `search.mjs` CATEGORY_MAP (10 categories)
- Pages root là `www/` — mọi file trong `www/design-showcase/` tự deploy

## 8. Open Questions
- [x] 72 hay 74? → 74 thực tế, hero ghi "74 phong cách (sếp nói 72, mình show đủ)"
- [x] Kết nối STATUS thế nào? → fetch `../status.json` + header nav 2 chiều + update status.json demos
- [x] Dùng style nào cho showcase? → Reuse YUNIE STATUS design system (indigo primary, glass, Swiss minimal) để đồng bộ

---
*Generated by YUNIE — Harness v2 — PRD Phase — design-showcase-72 — 2026-09-04*
