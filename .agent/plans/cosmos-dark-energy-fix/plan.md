# Plan — Dark Energy D fix

> Todos todo-driven (1 in-progress tại 1 thời điểm). Diff bounded: 3 files production + refresh `scale.json`.

## Todos

- [ ] 1. `measurePlans()` cửa sổ gate + `plansLegacy` (cosmic-scale.mjs)
- [ ] 2. Append Dissent vào `web-011-part8/prd.md`
- [ ] 3. `scale.html` render row tiền-gate
- [ ] 4. Refresh `scale.json` + slop-check + verify D/G
- [ ] 5. Spec `cosmos-dark-energy.spec.ts` (verify actor) + full suite + Learn

## File changes

| File | Đổi gì | Ladder | Entangled with |
|------|--------|--------|----------------|
| `.github/harness/scripts/cosmic-scale.mjs` | `measurePlans()`: lọc `mtime >= 2026-09-07`, return `plansLegacy`; `energyMetrics` passthrough; result `darkEnergy`/`gravity` thêm `plansLegacy` | nấc 7 (tối thiểu, ~10 dòng) | `scale.json` ↔ `scale.html#de` ↔ SKILL/instructions (mô tả D — chỉ thêm câu mẫu, không đổi công thức) |
| `.agent/plans/web-011-part8/prd.md` | append section `Who did you think with?` (Dissent thật) | nấc 7 | `cosmic-scale.mjs` (đếm lại sau append) |
| `www/cosmos/scale.html` | `#deParts` + `#gravityParts` thêm row tiền-gate (guard field thiếu) | nấc 2 (reuse `.part`) | `scale.json` (field mới) |
| `www/cosmos/scale.json` | regenerate qua `cosmos:refresh` (không sửa tay) | — | — |

## Risks

- mtime drift nếu ai đó touch prd cũ → plan cũ lọt vào mẫu làm D nhảy. Mitigate: plans là file commit, đã verify 5/5 git-birth khớp mtime; spec khóa `plansTotal + plansLegacy = dirs có prd`.
- Spec mới là test file → `deny-test-mutate` chặn YUNIE. Mitigate: spec do **verify actor** tạo (policy cho phép), YUNIE chỉ sửa production code.
