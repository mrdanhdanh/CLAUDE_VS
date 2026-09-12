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
node .github/harness/scripts/cosmic-scale.mjs --budget 10   # Heat Death gate — exit 1 khi S vượt ngân sách (theo MỨC)
node .github/harness/scripts/cosmic-scale.mjs --trend 3    # Escape Velocity gate — exit 1 khi S tăng liên tiếp ≥3 lần đo (theo ĐÀ)
npm run cosmos:gate                                          # cả hai gate (--trend 3 --budget 10) — chạy trước khi thêm feature
npm run cosmos:refresh                                       # refresh graph.json + scale.json + hawking.json + status.json + mirror audit
```
- Đọc `registry.json` vs filesystem → `mismatch` (drift)
- Đếm `drafts` (bug mở), `refused`/`failed` (audit 200 events gần nhất), `disabled`
- Tính `S = mismatch*10 + drafts*5 + refused*2 + disabled*1 + failed*5`
- Thang: `low <10` · `medium <25` · `high >=25`
- Đo theo đà: `scale.json.trend = {increases, needed, gate, window}` — ghi MỌI lần đo (kể cả không `--trend`); `increases` = chuỗi tăng nghiêm ngặt liền kề kết thúc ở điểm hiện tại (1 điểm ngang/giảm = reset) · `history` tối đa 30 điểm
- Đo kèm: `D = (1 − dissentRatio) × 10` (decollaboration, KN-018) · `G = cutRatio × 10` (scope control — % plans có dòng CẮT/YAGNI) · `M = orphan×2 + disabled×1` (hidden complexity)
- Trước khi sửa file lớn: `node .github/harness/scripts/entangle.mjs --file <path>` — forward/reverse refs để biết entanglement
- Cosmic Web (toàn repo): `node .github/harness/scripts/entangle.mjs --graph [--out www/cosmos/graph.json]` — hub (≥10 refs ⇒ sửa là test rộng) · cluster (git co-change ≥3 ⇒ gộp 1 plan) · dead filament (0 ref ⇒ grep rồi xoá)

### 2. Chẩn đoán (Diagnose)
- `S low` → vũ trụ ổn định, giữ nhịp audit + generate-status
- `S medium` → bơm năng lượng: fix mismatch/draft, chạy `generate-status.mjs`, polish dead-code
- `S high` → nguy cơ heat death: human takeover, fix mismatch + refused + failed trước khi code tiếp
- `trend.gate = true` → chặn thêm feature: trả nợ (mismatch/draft/refused) tới khi đà gãy — verify bằng `npm run cosmos:gate`

### 3. Black Hole — Bottleneck
- **Known:** KN-008 (file lock MSB3027), KN-015 (2 workflows giành Pages env)
- **Dynamic:** `missing` (registry không có file), `audit failed` (200 events gần nhất)
- Qua event horizon → không cố fix loop, báo human

### 3b. Hawking Radiation — Nợ bay hơi (`scale.html#hawking`)
- `node .github/harness/scripts/auto-learn.mjs watchdog` — draft open ≥30d → **escalate** (journal + nhắc) · ≥90d → **evaporate** (note `hawking.md` + `Status → evaporated`, gợi ý propose KN)
- **Human sign-off:** áp dụng phải chạy `watchdog --apply --sign "<tên người>"` — thiếu sign / sign bằng danh tính agent (YUNIE/agent/bot/copilot/verify/ci…) → **REFUSED exit 2** + dry-run, không ghi gì. Journal ghi `signedBy`.
- Journal `.agent/hawking.jsonl` append-only, idempotent (chỉ ghi khi action đổi) · mirror `www/cosmos/hawking.json`
- Entropy S tự giảm vì chỉ đếm `Status: open` — nợ phân rã thay vì tích tụ tới heat death

### 3c. Escape Velocity — Gate theo đà (`scale.html#escape`)
- `node .github/harness/scripts/cosmic-scale.mjs --trend 3` — exit 1 khi `S` **tăng liên tiếp ≥3 lần đo** (mỗi bước ΔS≥1); 1 điểm đi ngang/giảm là đà gãy
- Khác `--budget` (chặn theo **mức** S): trend chặn theo **đà** — nợ mới nhú đã bị chặn trước khi kịp vượt ngưỡng
- **Không tự chạy trong `cosmos:refresh`** (routine daily sẽ fail-giả khi đà lên đúng lúc) — dùng tường minh trước khi thêm feature: `npm run cosmos:gate`
- Data-driven: `scale.json.trend` → section `#escape` hiển thị đà hiện tại + cửa sổ đo (chips ↑↓=) + trạng thái gate (⛔/✅)

### 4. Dashboard
- `www/cosmos/scale.html` đọc `scale.json` + `graph.json` + `hawking.json` (không sửa tay) — gauge entropy, list black holes, dark-matter map, **Cosmic Web** (hub/cluster/dead filament), **Escape Velocity** (đà S + gate state)
- `www/cosmos/index.html` Lab #5 (Black Hole) + #6 (Schrödinger) demo trực quan

## Integration với Harness v2
- **Trước Implement:** chạy `cosmic-scale.mjs` — nếu `high` thì fix hệ trước; gate chuẩn: `npm run cosmos:gate` (`--trend 3 --budget 10`, exit 1) dùng ở PRD constraint / trước feature / CI
- **Verify:** ghi `S` (kèm D/G/M) vào plan/bug, chạy `npm run cosmos:refresh` để đồng bộ dashboard + STATUS
- **PRD:** có thể ghi `Entropy budget: S <10` như constraint

## References
- `.github/harness/scripts/cosmic-scale.mjs` — đo S/D/G/M + `--budget`/`--trend` gate (Node 18+, 0 deps)
- `.github/harness/scripts/entangle.mjs` — entanglement graph: `--file` (forward/reverse refs) · `--graph` (Cosmic Web: hub/cluster/dead filament → graph.json)
- `www/cosmos/scale.html` — dashboard (đọc `scale.json` + `graph.json` + `hawking.json`)
- `www/cosmos/index.html` — Lab Black Hole + Schrödinger + Dark Energy vs Gravity
- `.github/skills/cosmic-quantum/SKILL.md` — triết lý 2 tầng + System Map 15
- `.github/instructions/cosmic-quantum.instructions.md` — rule 7 System Map + 8 New Theory
- `docs/knowleged.md` — KN-008, KN-014, KN-015 (bottleneck + Heisenbug)

---
*Skill: cosmic-scale — Đo vũ trụ bằng số. S = mismatch*10 + drafts*5 + refused*2 + disabled*1 + failed*5 · D = (1−dissentRatio)×10 · G = cutRatio×10*
