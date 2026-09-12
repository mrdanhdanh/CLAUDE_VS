# PRD — Tách main() cosmic-scale (refactor follow-up)

> Follow-up đã đăng ký trong `.agent/plans/cosmos-escape-velocity/plan.md` (Slop justification): `main()` 220 dòng / CC 109 — pre-existing debt được Slop Gate (KN-047) ghi nhận. Refactor thuần, **behavior-preserving tuyệt đối**.
> Nguồn: user yêu cầu trực tiếp ("follow-up tách main() của cosmic-scale") — 2026-09-12.

## Vấn đề

`cosmic-scale.mjs` (280 dòng, 0-dep, single-file) lớn dần qua 6 lần ship (S → D/G → M → history → trend → gates). Toàn bộ logic nằm trong 1 hàm `main()`: **220 dòng, CC 109** (ngưỡng: 80 dòng / CC 12). Thêm metric mới = chui vào giữa hàm 220 dòng — review khó, diff khó, dễ vỡ khi sửa. Slop-check fail trên file này ở mọi lần Verify → mỗi verify sau đều phải "nuốt" 2 findings pre-existing.

## Giải pháp (GIỮ)

Tách `main()` thành 16 hàm nhỏ theo phase đo (mỗi hàm 1 mối quan tâm, ≤80 dòng, CC ≤12):
`parseArgs · scanRegistry · scanOrphans · scanBugDrafts · scanKnowledge · scanAudit · buildBlackHoles · measurePlans · energyMetrics · entropyOf · checkPolicy · readHistory · computeTrend · writeOutput · printHuman · runGates` — `main()` còn ~55 dòng orchestrate.

## Non-goals (CẮT — YAGNI)

- ❌ Tách file/module (multi-file) — giữ contract single-file 0-dep của 23 script harness; tách file đổi packaging, không đổi giá trị.
- ❌ Đổi CLI surface / output format / field order / exit codes — behavior-preserving tuyệt đối.
- ❌ Thêm dependency (commander/yargs) hay unit test framework — spec e2e CLI (8 test) đã là lớp test đúng mức (KN-022).
- ❌ Rename `TYPE_DEFS`/`pathsFor`/constants — không cần cho mục tiêu CC.
- ❌ Đụng `entangle.mjs` / `generate-status.mjs` (debt riêng, ngoài scope).

## Acceptance (rubric viết TRƯỚC — KN-037)

| # | Tiêu chí | Đo bằng |
|---|----------|---------|
| 1 | File `cosmic-scale.mjs` → **0 findings** slop-check (main() size+CC biến mất, không finding mới) | `node scripts/slop-check.mjs <file>` — before 2 findings (exit 1) → after 0 (exit 0) |
| 2 | JSON stdout **identical** trước/sau (normalize generatedAt/t — auditTotal loại trừ vì chính refactor này ghi audit) | sha256/16 normalized → `verify/output-identical.txt` |
| 3 | Human stdout **byte-identical** trước/sau (không timestamp) | sha256/16 raw |
| 4 | File ghi `--out` **identical** trước/sau | normalized sha256/16 |
| 5 | CLI behavior: **8/8** `cosmos-escape.spec.ts` (exit codes 2 cổng, trend shape, edge thiếu history) | playwright |
| 6 | Full suite **101/101** (không regression trang cosmos) | playwright |
| 7 | Diff bounded: 1 file, net ±~60 dòng, không đổi semantics | `git diff --stat` |

## Persistence · F5 · Scope

n/a — script CLI, không UI/state. `scale.json` format không đổi.

## Cosmic-Quantum

Macro: cosmic-scale là 1 thiên hà trong vũ trụ 23 scripts (`harness/scripts/`) · Micro: hàm sóng `main()` sụp đổ thành 16 hàm có tên — đo được bằng CC từng hàm · Entanglement: `package.json` (3 npm script gọi nó) ↔ `tests/e2e/cosmos-escape.spec.ts` ↔ `www/cosmos/scale.json` (output) ↔ SKILL.md (mô tả lệnh — không đổi).

## Who did you think with? (Dissent Review — KN-018)

- **Rival #1:** *"Để nguyên — script chạy đúng rồi, refactor là rủi ro vô ích."* Phản biện: debt đã đăng ký trong plan trước + Slop Gate vừa wire vào Verify (KN-047) định nghĩa exit condition là **command** (`slop-check` fail trên file này ở mọi lần verify) — không sửa thì mọi lần verify sau đều phải justify 2 findings; và user yêu cầu tường minh. Rủi ro thấp: pure restructuring, hành vi khóa bằng 3 lớp hash diff + 8 spec CLI + full suite.
- **Assumption có thể sai:** *"output identical ⇒ behavior-preserving."* Không đủ — output không phủ mọi side effect (file ghi, exit codes, thứ tự stderr). Xử lý: so cả file ghi `--out` (acceptance #4) + exit-code spec (acceptance #5) + graceful-error path giữ nguyên `main().catch` (fail-loud).
- **Rival #3:** *"Rewrite thành module có unit tests gọi trực tiếp từng hàm."* Bác bỏ: vượt scope, phá contract single-file, cần test harness mới — e2e CLI đã đúng mức (KN-022: chỉ thêm hạ tầng khi outcome rẻ verify VÀ để lại dấu vết bền vững; spec hiện có đủ).

## Nguồn

- Follow-up ghi tại `.agent/plans/cosmos-escape-velocity/plan.md` (§ Slop justification).
- KN-047 (Slop Gate), KN-013 (minimal-ladder — refactor không thêm dep), KN-022 (đừng over-engineer test), KN-037 (rubric trước).
