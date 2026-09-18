# Plan — Instruction Budget (2026-09-16)

1. [x] Recon: package.json / workflows / specs / mergeCurated — Ladder nấc 2 (reuse pattern slop-check + auto-learn-guard spec). Entangled with: `scripts/`, `tests/e2e/`, `package.json`, `curated.json`.
2. [x] `scripts/instruction-budget.mjs` — đo dòng/~token theo `applyTo`; gate `--budget` exit 1; fail-closed exit 2. Ladder nấc 7 (tối thiểu). Đo thật: always-on 1395 dòng / 17 files.
3. [x] `tests/e2e/instruction-budget.spec.ts` (guard KN-047) — 3/3 pass. Ratchet: `SOFT_BUDGET = 1400`.
4. [x] `package.json` → `budget:check` (gate 1400).
5. [x] §7 copilot-instructions: quy ước 🤖 + 3 pointer (angle.spec / hooks-integrity.spec / slop+evalu gate). Regen `CLAUDE.md` bằng `harness-manager export-claude`.
6. [x] Curated mirror 2 entry + KN-052 amend (đối trọng Nvidia 15/09) — consolidate, không tạo KN mới (dup-gate).
7. [x] Verify: budget:check + specs liên quan + slop-check + get_errors + full suite + status regen.
8. [x] Learn: log bug + RADAR (6 hit — toàn false positive BM25) + propose KN-068 (Guard Gate ✅) + evaluate dup-gate **FAIL — KN-037(16.4 ≥ 15)** → KHÔNG paste, giữ draft chờ human duyệt (luật: "chỉ propose, dev duyệt rồi dán"; precedent KN-060 cần sign-off khi bypass).
9. [x] 2026-09-18 (human duyệt "A"): **paste KN-068** (dup-gate disclosure như KN-060/062/064/065/067); kèm bài 18/09 (gate fail-open arg rác) → **KN-069**; fix vụ ID: `findNextKnId` claims-aware (double-yield KN-066 class — draft claim un-pasted không còn bị yield trùng) + guard `tests/e2e/kn-id-integrity.spec.ts` mở rộng (10/10).

## Evidence

- Before/after pool: 1395 dòng always-on trước; sau thay đổi giữ nguyên (B chỉ đổi nội dung dòng, không thêm).
- Gate: `node scripts/instruction-budget.mjs --budget 1400` → exit 0; `--budget 10` (fixture 63 dòng) → exit 1; dir rỗng → exit 2 (spec khoá).
- Guard mới: `tests/e2e/instruction-budget.spec.ts` (dogfood pattern auto-learn-guard) — 3/3 pass · batch 4 specs 18/18 pass · full suite 206 pass.
- Slop gate (KN-047): lần 1 bắt main() 84 dòng / CC 23 → refactor thành `parseArgs/readRows/buildReport/printReport` → clean exit 0, gate behavior không đổi (spec vẫn xanh).
- Flake note: full suite 7 fail cosmos (timing-sensitive) khi parallel — chạy `--workers=1` 23/23 pass → không regression.
- `export-claude --check` → khớp, không drift sau regen CLAUDE.md.
- Status: `generate-status.mjs` → health ok, plan `instruction-budget` xuất hiện trong `www/status.json`.
- Learn: bug `.agent/bugs/2026-09-16-instruction-budget-always-on-phinh-khong-nguong/` (đầy đủ 6 mục) · KN-068 draft sinh, **dup-gate FAIL (KN-037 16.4)** → chờ human quyết: paste as-is (disclosure heuristic thấp) hay GỘP vào KN-037/KN-047.
