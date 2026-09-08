# PRD — Cosmic Scale: Dark Matter + Entropy Timeline

Cosmic-Quantum: Macro www/cosmos là vũ trụ con, scale.json là quasar đo · Micro superposition 2 hướng (thêm metric M vs chỉ chart to) → collapse: thêm M vì hidden complexity chưa đo được · Entanglement .github/harness/scripts/cosmic-scale.mjs ↔ www/cosmos/scale.html ↔ www/cosmos/scale.json ↔ .github/skills/cosmic-scale/SKILL.md

## Vấn đề
- Entropy S (tech debt) + Black Hole (bottleneck) + Dark Energy (decollaboration) đã đo.
- **Dark Matter (hidden complexity)** — file orphan không registry, .disabled sleeping galaxies — chưa đo.
- **Entropy theo thời gian** chỉ là sparkline 64px — chưa phải dashboard.

## Scope
1. `cosmic-scale.mjs`: đo `darkMatter` — M = orphan×2 + disabled×1; orphan = file/folder trong type dirs nhưng không có trong registry.json. History lưu kèm M.
2. `scale.html`: section **Dark Matter** (map hidden complexity) + section **Entropy theo thời gian** (chart lớn, trục, delta, trend).

## Non-goals (CẮT — YAGNI)
- Không thêm dep chart lib — canvas thuần (ladder nấc 4: native).
- Không đổi công thức S (đã ổn định, KN đã ghi).
- Không sửa scale.json tay — chỉ script sinh.

## Persistence
Persistence: scale.json do script regenerate (commit repo) · F5: giữ (file tĩnh) · Scope: global (Pages).

## Nguồn
- Skill: `.github/skills/cosmic-scale/SKILL.md`
- KN liên quan: KN-002 (status.json single source), KN-013 (minimal), KN-018 (dissent)

Who did you think with?: Dissent framing đối lập — "chỉ cần chart to hơn, không cần metric M" (YAGNI, KN-013) — đã cân nhắc, chốt thêm M vì orphan files hiện vô hình hoàn toàn; M nhẹ (chỉ đếm file, 0 deps).
