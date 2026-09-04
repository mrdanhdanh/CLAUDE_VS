# Evidence — harness-minimal (DisCo arXiv:2609.02749v1 §3.2 (task-agnostic))

> Substrate layer của skill — full text từ docs/knowleged.md. Sinh tự động 2026-09-04T09:13:35.827Z.

## Bug reports liên quan (1/11 bugs)

- `.agent/bugs/2026-09-03-n5blazor-ladder-trial-dead-code/bug.md` — Bug: N5Blazor ladder trial dead code

## Full KN details

### KN-013 — Tích hợp Ponytail ladder vào Harness v2 (minimal-ladder + lean-product)

- **Ngày:** 2026-09-03
- **Bug report:** `.agent/bugs/2026-09-03-n5blazor-ladder-trial-dead-code/bug.md` (trial, confidence MEDIUM)
- **Severity:** minor
- **Triệu chứng:** Harness v2 thiên mở rộng (8 phase Explore→Verify, UI đẹp) nên dễ over-build: N5Blazor có `GlassCard`/`RainbowCard` 0 usage + `bootstrap/` ~598KB 0 reference + Kana toggle chỉ add không remove. Trial đã fix nhưng bị revert (thiếu .NET 8 SDK để verify build/test).
- **Nguyên nhân gốc:** PRD không có YAGNI gate ("Does this need to exist?"); Design không có native-first (stdlib/native trước dep mới); Verify không grep dead-code + scoreboard. Ponytail (`DietrichGebert/ponytail`, MIT, 122k stars) đã giải bài này bằng ladder 7 nấc + benchmark LOC -54%.
- **Cách sửa:** Tích hợp qua plugin-seam, không sửa core:
  - Instruction `minimal-ladder` (`.github/instructions/minimal-ladder.instructions.md`, applyTo `**`): ladder 7 nấc + YAGNI gate ở PRD + native-first ở Design + dead-code grep/scoreboard ở Verify + never-cut (validation/security/a11y/test).
  - Preset `lean-product` (`.github/harness/presets/lean-product.json`): bật ladder, tắt UI nặng (`glass-rainbow-effects`, `ui-design-system`, `ui-ux-pro-max`, `last30days`), giữ core + TDD + debugging.
  - Bật `minimal-ladder: true` ở presets `full`, `web-product`, `api-minimal`.
  - Registry sync qua `harness-manager install --local --force` (tránh cache description template cũ).
  - Trial artifacts giữ nguyên để trace: `.agent/bugs/2026-09-03-n5blazor-ladder-trial-dead-code/bug.md` + `.agent/plans/n5-blazor-ladder/prd.md|design.md`.
- **Cách phòng tránh:**
  - Mọi task Implement/Fix: chạy ladder sau khi đọc code, dừng ở nấc đầu tiên đúng.
  - PRD luôn có dòng CẮT (YAGNI) trước dòng GIỮ.
  - Verify luôn grep tên component/css mới + ghi diff stat vào bug/plan.
  - Không cắt validation/security/a11y/test để giảm LOC (lazy, not negligent).
  - Khi `create` instruction xong rồi sửa description: chạy `install --local --force` để refresh registry (tránh stale cache).
- **Tags:** `process` `minimal` `ponytail` `yagni` `dx`
- **Người ghi:** YUNIE / harness

<!-- Thêm bài học mới theo template dưới — copy block này -->

<!--
