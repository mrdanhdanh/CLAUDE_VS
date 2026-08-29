# PRD: Status UI v2 — YUNIE STATUS Redesign

> Harness v2 — Phase PRD | Task: sửa lại UI trang status, dùng ui-ux-pro-max, rà soát câu chữ, thêm nút xem chi tiết Pipeline

## 1. Vision
- **One-liner:** Làm mới trang `www/index.html` (YUNIE STATUS) thành dashboard trạng thái hệ thống Harness v2 đẹp, rõ ràng, tiếng Việt tự nhiên, có thể xem chi tiết Pipeline 8 phase ngay trên trang.
- **Problem:** Giao diện hiện tại dùng emoji rời rạc, hierarchy chưa rõ, câu chữ lẫn lộn (“Tháo lắp wise”, “Copy file là tự lên Pages”), thiếu điểm nhấn Pipeline — người mới khó hiểu Harness vận hành thế nào. Cần chuẩn ui-ux-pro-max (a11y, responsive, states, animation).
- **Target User:** Dev dùng Harness v2 trong VS Code (primary), người mới onboarding (secondary), reviewer kiểm tra health/registry trên mobile.

## 2. User Stories
| ID | As a ... | I want ... | So that ... | Priority |
|----|----------|------------|-------------|----------|
| US-01 | Dev | Nhìn hero + stats là biết hệ thống OK/WARN/FAIL, số lượng registry enabled/total | Không phải mở status.json thủ công | P0 |
| US-02 | Dev | Tìm/lọc registry theo loại (skill/instruction/agent/prompt/hook) và từ khóa, thấy mô tả rõ ràng | Nhanh chóng kiểm tra cái gì đang bật/tắt | P0 |
| US-03 | Người mới | Bấm “Xem chi tiết Pipeline” và hiểu ngay 8 phase Idea→Done, mỗi phase làm gì, output gì | Onboard không cần đọc docs dài | P0 |
| US-04 | Dev mobile | Xem trang ở 375px không vỡ, bảng registry chuyển thành thẻ, header gọn | Kiểm tra status trên điện thoại | P0 |
| US-05 | Keyboard/a11y user | Tab qua header/hero/registry, focus ring rõ, modal đóng bằng ESC, skip-link hoạt động | Dùng được không cần chuột | P0 |
| US-06 | Dev | Thấy presets, plans, health, pages với empty/loading/error states rõ ràng | Biết phải làm gì khi chưa có dữ liệu | P1 |
| US-07 | Dev | Copy status.json, mở status.json, làm mới dữ liệu nhanh | Debug/verify tiện | P1 |

## 3. Scope

### In Scope (P0 — phải có)
- [ ] Redesign `www/index.html` — hero, stats, registry, presets, plans, health, pages, how-to, footer với copy tiếng Việt tự nhiên, nhất quán
- [ ] Redesign `www/styles.css` — design system tokens (palette, typography, spacing 4/8, radius, shadow), responsive 375/768/1280, states (hover/focus/active/disabled/loading), animation 150-300ms, a11y (contrast ≥4.5:1, focus-visible, reduced-motion)
- [ ] Cập nhật `www/app.js` — giữ contract `status.json` (object shape + backward compat array), thêm Pipeline modal logic (open/close, ESC, focus trap, aria-modal, body scroll lock), giữ search/filter registry, toast, keyboard `/` focus
- [ ] Thêm **nút “Xem chi tiết Pipeline”** (hero + header) mở modal/drawer hiển thị 8 phase: Explore → Clarify → PRD → Design → Plan → Implement → Polish → Verify → Done, mỗi phase có icon SVG, mục tiêu, output, tool, có rút gọn cho task nhỏ và verify loop
- [ ] Thay emoji bằng SVG icons (Lucide/Heroicons inline) cho stats, registry, health, pages
- [ ] Rà soát toàn bộ câu chữ: tự nhiên, đúng chính tả, thống nhất thuật ngữ (Registry, Preset, Plan, Health, Pages, Pipeline), không lạm dụng tiếng Anh
- [ ] Giữ `www/status.json` không đổi shape; chỉ đọc

### Nice to Have (P1 — nếu còn thời gian)
- [ ] Dark mode toggle (prefers-color-scheme)
- [ ] Pipeline stepper có progress highlight phase hiện tại (nếu có data)
- [ ] Copy lệnh harness-manager từ modal

### Non-Goals (Out of Scope)
- Không đổi `registry.json` hay generator `status.json`
- Không thêm backend/API, không đổi workflow `.github/workflows/pages.yml`
- Không i18n đa ngôn ngữ (chỉ tiếng Việt chuẩn)

## 4. Success Metrics
- Visual: 375/768/1280 không vỡ, không horizontal scroll, table → cards ở ≤768px
- A11y: contrast ≥4.5:1, keyboard Tab/ESC/Enter hoạt động, skip-link, aria-label cho icon-only, modal focus trap
- UX: 4 states đủ (loading skeleton, empty với CTA, error với Retry, success toast 3s)
- Copy: 100% tiếng Việt tự nhiên, không còn “Tháo lắp wise” khó hiểu, thuật ngữ nhất quán
- Pipeline: bấm nút → modal mở trong 200ms, đóng bằng ESC/click overlay/nút Đóng, không scroll background
- Build: `get_errors` 0, `JSON.parse(status.json)` pass, `npx serve www` không CORS

## 5. Edge Cases & Constraints
- `status.json` fetch fail (file:// CORS) → hiện error card với hướng dẫn `npx serve www`
- Registry rỗng → empty state “Chưa có dữ liệu registry — chạy harness-manager status”
- Search không ra kết quả → empty “Không tìm thấy — thử từ khóa khác”
- Modal mở khi đang focus input → focus trap không cướp focus input khi đóng
- Reduced motion → tắt animation pulse/shimmer/slide
- Constraint: vanilla HTML/CSS/JS, không framework, giữ file size < 100KB mỗi file, font Google Fonts có fallback

## 6. Assumptions
- Giữ stack hiện tại: vanilla HTML/CSS/JS, CSS variables, Inter + Plus Jakarta Sans + JetBrains Mono
- Giữ palette indigo làm primary (brand Harness), bổ sung success green cho health
- Người dùng đã quen `harness-manager` CLI — copy lệnh trong How-to giữ nguyên
- Pipeline 8 phase là cố định theo `docs/harness-flow.md`

## 7. Open Questions
- [x] Dùng ui-ux-pro-max style nào? → Minimalism & Swiss Style + Real-Time Operations Landing (đã search)
- [x] Palette? → Giữ indigo primary, success #16a34a, warning #f59e0b, danger #dc2626, neutral slate
- [x] Modal hay drawer? → Modal centered (desktop) + bottom sheet (mobile ≤640px) để tối ưu không gian

---
*Generated by Claude Harness v2 — PRD Phase — status-ui-v2 — 2026-08-29*
