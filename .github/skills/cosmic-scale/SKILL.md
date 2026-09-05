---
name: cosmic-scale
description: "Cosmic Scale — đo entropy vũ trụ (tech debt), black-hole bottleneck, dark-matter map cho Harness. Use when cần đo sức khỏe hệ thống, tìm bottleneck, tính entropy, heat death, dark energy/scope creep, hoặc user nói entropy/scale/black hole/dark matter/vũ trụ học"
user-invocable: true
---

# Cosmic Scale — Skill

> **Đo vũ trụ bằng số.** Entropy S cho biết hệ đang trật tự hay hỗn loạn; black hole chỉ bottleneck không thoát; dark-matter map cho biết hidden complexity.

## When to Use
- Cần đo **sức khỏe hệ thống** trước khi code (entropy check)
- Tìm **bottleneck / black hole** (file lock, Pages env, audit failed)
- Tính **tech debt** như entropy vũ trụ
- Review **scope creep** như dark energy
- User nói: `entropy`, `scale`, `black hole`, `dark matter`, `heat death`, `vũ trụ học`, `đo hệ thống`

## Workflow

### 1. Đo (Measure)
```bash
node .github/harness/scripts/cosmic-scale.mjs
node .github/harness/scripts/cosmic-scale.mjs --json --out www/cosmos/scale.json
```
- Đọc `registry.json` vs filesystem → `mismatch` (drift)
- Đếm `drafts` (bug mở), `refused`/`failed` (audit 200 events gần nhất), `disabled`
- Tính `S = mismatch*10 + drafts*5 + refused*2 + disabled*1 + failed*5`
- Thang: `low <10` · `medium <25` · `high >=25`

### 2. Chẩn đoán (Diagnose)
- `S low` → vũ trụ ổn định, giữ nhịp audit + generate-status
- `S medium` → bơm năng lượng: fix mismatch/draft, chạy `generate-status.mjs`, polish dead-code
- `S high` → nguy cơ heat death: human takeover, fix mismatch + refused + failed trước khi code tiếp

### 3. Black Hole — Bottleneck
- **Known:** KN-008 (file lock MSB3027), KN-015 (2 workflows giành Pages env)
- **Dynamic:** `missing` (registry không có file), `audit failed` (200 events gần nhất)
- Qua event horizon → không cố fix loop, báo human

### 4. Dashboard
- `www/cosmos/scale.html` đọc `scale.json` (không sửa tay) — gauge entropy, list black holes, dark-matter map
- `www/cosmos.html` Lab #5 (Black Hole) + #6 (Schrödinger) demo trực quan

## Integration với Harness v2
- **Trước Implement:** chạy `cosmic-scale.mjs` — nếu `high` thì fix hệ trước
- **Verify:** ghi `S` vào plan/bug, kèm `generate-status.mjs` để đồng bộ
- **PRD:** có thể ghi `Entropy budget: S <10` như constraint

## References
- `.github/harness/scripts/cosmic-scale.mjs` — script đo (Node 18+, 0 deps)
- `www/cosmos/scale.html` — dashboard (đọc `scale.json`)
- `www/cosmos.html` — Lab Black Hole + Schrödinger
- `.github/skills/cosmic-quantum/SKILL.md` — triết lý 2 tầng + System Map 15
- `.github/instructions/cosmic-quantum.instructions.md` — rule 7 System Map + 8 New Theory
- `docs/knowleged.md` — KN-008, KN-014, KN-015 (bottleneck + Heisenbug)

---
*Skill: cosmic-scale — Đo vũ trụ bằng số. S = mismatch*10 + drafts*5 + refused*2 + disabled*1 + failed*5*
