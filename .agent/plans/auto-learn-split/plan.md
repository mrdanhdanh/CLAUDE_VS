# Plan — auto-learn-split

> Refactor thuần (behavior-preserving). 1 file production: `.github/harness/scripts/auto-learn.mjs`. Entangled: `tests/e2e/cosmos-hawking.spec.ts` (khoá watchdog), `tests/e2e/cosmos-cmb.spec.ts` (khoá stats), `scripts/slop-check.mjs` (đo), `package.json` (không đổi).

- [x] **1. Baseline + policy** — ✅ `equiv-before.txt` (10 case stable) + `slop-before.json` (22 findings: watchdog 107/CC40 + main 87/CC45) · policy PERMITTED + audit `47cc1b`.
- [x] **2. Refactor watchdog** — ✅ 10 helper (`parseWatchdogOpts`/`readBugFile`/`judgeHawkingBug`/`scanHawkingBugs`/`hawkingCounts`/`refuseHawkingSignoff`/`readHawkingJournal`/`evaporateBug`/`applyHawkingEntry`/`applyHawking`/`writeWatchdogOutput`/`printWatchdogHuman`) — watchdog còn ~25 dòng, CC thấp; giữ nguyên nhánh quirk `asJson || outPath`.
- [x] **3. Refactor main** — ✅ `printHelp()` extract (giữ nguyên template verbatim) + `makeHandlers()` Map (chống prototype key) + `dispatch()` + guard clauses (`requireSuggestQuery`/`requireGetBug`) + main ~12 dòng.
- [x] **4. Verify equivalence** — ✅ run1 sequential: 9/10 (artifact: `slop-before.json` ghi vào `.agent/plans` giữa 2 run → `refFiles` 256→257, lưu `equiv-before/after.txt`) → **pairwise same-moment (orig git HEAD vs refactor): 13/13 IDENTICAL** (`equiv-diff.txt`) — stdout/stderr/exit code + file `--out` normalize timestamp.
- [x] **5. Verify behavior** — ✅ slop GONE đúng 4 findings mục tiêu (watchdog size/CC + main size/CC), NEW 0, dup 1/1 → `slop-after.json` · `cosmos-hawking` + `cosmos-cmb` **16/16** · full suite **128/128** · `get_errors` 0.
- [x] **6. Docs + ship** — ✅ plan updated · audit + commit + push; deploy Pages NOT triggered (không đổi `www/` — đúng chủ đích).

## Evals rubric (KN-037)

4 tiêu chí P0 trong `prd.md`. Trọng tâm: hash-diff 3 lớp (stdout/stderr/exit + written) + 2 hàm sạch slop + suite xanh.

## Evidence & Verify notes

| File | Nội dung |
|------|----------|
| `verify/equiv-diff.txt` | **Pairwise same-moment** (orig git HEAD vs refactor): **13/13 ✅ IDENTICAL** — help/watchdog×3/status/stats/suggest×2/guards×3/unknown + written×2 |
| `verify/equiv-before.txt` / `equiv-after.txt` | Sequential captures — run1 chỉ 9/10 vì artifact `slop-before.json` ghi vào `.agent/plans` giữa 2 run (refFiles 256→257). Ghi giữ làm bằng chứng trung thực (precedent `cosmos-scale-split` run1-artifact) |
| `verify/slop-before.json` / `slop-after.json` | 22 → 18 findings · GONE đúng 4 mục tiêu (`size watchdog 107` · `complexity watchdog 40` · `size main 87` · `complexity main 45`) · NEW **0** · dup 1/1 |

## Ladder (minimal-ladder)

| Todo | Nấc | Ghi chú |
|------|-----|---------|
| 1 | 3 | Reuse `slop-check.mjs` + capture script tạm (xoá sau) |
| 2-3 | 2 | Pure restructure trong file có sẵn — không module mới |
| 4 | 6 | Compare bằng temp script (~60 dòng) — chứng minh rồi xoá |
| 5 | 2 | Spec + suite có sẵn |
| 6 | 2 | Audit + commit theo flow có sẵn |
