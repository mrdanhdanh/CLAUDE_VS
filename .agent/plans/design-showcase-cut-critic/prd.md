# PRD: design-showcase-cut-critic — Test Discover→Define→Deliver mới

> Test flow mới trích từ Anshu Chimala (Lenny's Newsletter 01/09/2026) trên `www/design-showcase/` — seed + taste + Cut + critic.

## 1. Vision
- **One-liner:** Showcase 74 styles phải thoát AI slop (gradient tím, text-trái-graphic-phải, glow thừa) → premium, Apple-native, ít = sang.
- **Problem:** Showcase hiện tại hero quá tải (4 meta pills + 4 CTAs + info-bar + status-bar), card nhiều chrome, chưa có citation awesome-design-md, chưa Cut, chưa critic.
- **Target User:** Dev/designer chọn vibe trước khi code — cần scan nhanh, copy slug/màu 1 click, cảm giác craft như Linear.

## 2. User Stories
| ID | As a ... | I want ... | So that ... | Priority |
|----|----------|------------|-------------|----------|
| US-01 | dev chọn vibe | thấy showcase gọn, không ngợp, focus vào grid 74 cards | chọn nhanh, không scroll mỏi | P0 |
| US-02 | designer | thấy palette/layout có gu (Linear dark minimal) không phải tím mặc định | tin tưởng copy token | P0 |
| US-03 | user mobile 375 | hero + filter không vỡ, card đọc được | dùng được trên phone | P0 |
| US-04 | a11y user | keyboard / focus ring / aria đầy đủ | dùng không chuột | P1 |

## 3. Scope

### In Scope (P0 — phải có)
- [ ] Discover: search `awesome-design-md` top 3, chọn Linear (score 12) làm vibe, ghi citation vào design.md
- [ ] Seed string `9f2427e44d211655cbb62cba91e717c1` → suy ra palette/layout, mỗi run độc nhất
- [ ] Taste: Linear dark minimal — near-black canvas, charcoal panels, hairline, lavender #5e6ad2 chỉ ở CTA/focus
- [ ] Cut 30% elements thừa: hero-info-bar, 2 meta pills thừa, 2 CTAs thừa, status-bar duplicate, card chrome thừa
- [ ] Critic loop fresh-context chấm /10, <9 fix max 2 vòng
- [ ] Responsive 375/768/1280 + a11y + animation 150-300ms

### Nice to Have (P1)
- [ ] Preview.html đồng bộ token Linear

### Non-Goals (Out of Scope)
- Image/Video gen (fal.ai, OpenAI key) — YAGNI
- Backend / API
- Thêm 74 styles mới

## 4. Success Metrics
- Hero height giảm ~30%, số CTAs 4→2, meta pills 4→2
- Lighthouse a11y ≥95, không vỡ 375/768/1280
- Critic ≥9/10 hoặc self-review 3 gaps fixed
- `get_errors` 0, `designs.json` vẫn 74

## 5. Edge Cases & Constraints
- file:// CORS → phải `npx serve www` để test
- Không đổi data shape `designs.json`
- Giữ `styles.css` tokens, không hardcode hex lẻ

## 6. Assumptions
- Linear vibe hợp showcase gallery (đã search top 1)
- Seed chỉ inspire, không reveal ra UI

## 7. Open Questions
- [x] Chọn Linear làm vibe chính? → Yes, score 12 cao nhất

---
*PRD mini — design-showcase-cut-critic · 2026-09-05 · YUNIE*
