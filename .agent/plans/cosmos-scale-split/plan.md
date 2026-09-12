# Plan — cosmos-scale-split

> Refactor thuần (behavior-preserving). Net diff mục tiêu ±~60 dòng, 1 file production. Entangled: `package.json` (3 npm scripts), `tests/e2e/cosmos-escape.spec.ts`, `www/cosmos/scale.json` (output — không đổi format).

- [x] **1. Baseline + policy** — ✅ exit codes baseline 0/0/0 · slop **RED = 2 findings** (main() 220 dòng / CC 109, exit 1) → `verify/slop-before.txt` · policy PERMITTED + audit `a38b2d`.
- [x] **2. Refactor** — ✅ **19 helper** + `main()` ~55 dòng (thực tế nhiều hơn PRD dự kiến 16: tách thêm `driftKind`/`orphanName`/`scanOrphanDir` vì slop-after lần 1 bắt `scanRegistry` CC 15 + `scanOrphans` CC 22) · dẹp dead IIFE policy (chứng minh equivalence).
- [x] **3. Verify equivalence** — ✅ run1: 2/3 IDENTICAL (`written` lệch do artifact harness — file cũ còn sót → history 2 điểm; lưu `verify/output-identical-run1-artifact.txt`) → fix capture() rm trước khi chạy → run2: **3/3 IDENTICAL** (JSON/human/written) + exit codes khớp · slop **GREEN = 0 findings (exit 0)**.
- [x] **4. Verify behavior** — ✅ `cosmos-escape.spec.ts` **8/8** + full suite **101/101** · `get_errors` clean.
- [x] **5. Docs + ship** — ✅ follow-up line ở `cosmos-escape-velocity/plan.md` updated · audit + commit + push; deploy Pages NOT triggered (không đổi `www/` — đúng chủ đích).

## Evals rubric (KN-037)

7 tiêu chí acceptance trong `prd.md` — pass hết mới Done. Trọng tâm: hash-diff 3 lớp + 0 slop findings + 8 spec CLI.

## Evidence & Verify notes

| File | Nội dung |
|------|----------|
| `verify/slop-before.txt` / `slop-after.txt` | RED (2 findings, exit 1) → GREEN (0 findings, exit 0) |
| `verify/output-identical.txt` | sha256/16 × 3 lớp (JSON/human/written) + exit codes — **3/3 ✅ IDENTICAL** |
| `verify/output-identical-run1-artifact.txt` | Run 1 — bằng chứng trung thực của artifact `written` (file cũ sót → history 2 điểm), trước khi fix precondition |
| `verify/*-before.*` + `*-after.*` + `exit-before.json` | Raw captures (audit trail của verify) |

## Ladder (minimal-ladder)

| Todo | Nấc | Ghi chú |
|------|-----|---------|
| 1 | 3 | Reuse `slop-check.mjs` có sẵn (không viết checker mới) |
| 2 | 2 | Pure restructure trong file có sẵn — không file/mód mới, không dep mới |
| 3 | 6 | Compare script tạm (~60 dòng, xoá sau) — đủ chứng minh, không dựng tool thường trú |
| 4 | 2 | Spec + suite có sẵn |
| 5 | 2 | Sửa 2 dòng trong plan có sẵn |
