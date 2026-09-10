# PRD — Cosmos Freshness & Gate Upgrade (P1→P3)

- **Ngày:** 2026-09-11 · **Actor:** YUNIE · **Nguồn:** audit toàn bộ hệ cosmology + user chọn phương án C.
- **Cosmic-Quantum:** Macro `www/cosmos` là vũ trụ con — data phải tươi · Micro đo bằng tool trước khi claim Done · Entanglement `scale.json ↔ generate-status ↔ scale.html ↔ cosmos/index.html`.

## Vấn đề (từ audit 2026-09-11)

| # | Vấn đề |
|---|--------|
| F1/F2 | `scale.json` + `audit.json` mirror cũ 3 ngày; không ai nhắc |
| F3 | Không có automation refresh (workflow/routine) |
| F4/F5 | Dark Energy có 2 định nghĩa đá nhau (scope creep vs decollaboration); số chết trong SKILL.md (15 KN / ~40 plans) |
| F6/F7 | `status.json` thiếu mục cosmos; history không lưu D |
| F8/F9 | Label slides 12→15 sai; observatory không hiện "Đo lúc" |

## Scope

**P1 — Freshness:** regenerate data · stale badge (scale.html + observatory) · `npm run cosmos:refresh` · routine 8h · `status.json` có mục `cosmos`.

**P2 — Consistency:** Gravity G = cutRatio×10 (scope control, YAGNI) trong `cosmic-scale.mjs` · chốt DE = decollaboration · fix instruction §8 + 2 SKILL.md + số chết · label slides.

**P3 — Ship future cards:** `--budget N` (exit 1 khi S vượt — Heat Death gate) · `entangle.mjs` (forward/reverse refs) · Lab #11 Dark Energy vs Gravity · future cards → Done.

## Non-goals
- Không thêm dependency; backward compat (gravity optional ở reader).
- Không sửa `.claude/rules` tay — regenerate qua `export-claude`.

## Dissent (KN-018) — Who did you think with?
- **Framing đối lập:** entropy S là **proxy scan file**, không phải chất lượng thật — dashboard xanh có thể là comfort food (KN-024: taste + verification nằm NGOÀI model). Vì vậy gate `--budget` chỉ chặn khi S VƯỢT ngưỡng, không tự "xác nhận tốt"; G thêm như đối trọng định lượng thứ hai.
- **Rival đã cân nhắc:** đo Gravity bằng diff-stat mỗi Verify (chính xác hơn nhưng đắt + không retroactive) → chọn scan heuristic `CẮT/YAGNI` trong prd.md, ghi rõ là heuristic.
