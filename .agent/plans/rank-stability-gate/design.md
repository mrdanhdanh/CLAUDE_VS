# Design mini — rank-stability gate

## Input schema (canonical — raw per-run, không aggregate)
```json
{
  "measuredAt": "YYYY-MM-DD",
  "claim": "best",                       // optional — có claim → gate strict
  "models": ["m1", "m2"],
  "cells": [ { "prompt": "p1", "model": "m1", "runs": [0.9, 0.85], "truth": 0.9 } ]
}
```
Validity (fail-closed → exit 2): measuredAt hợp lệ & không tương lai; ≥2 models unique; cells ≥1;
mỗi cell đủ prompt/model/runs (finite, ≥ min-runs=2); **balanced coverage** (mỗi prompt có đủ mọi model);
truth: all-or-none (nhất quán).

## Thuật toán
- **Sensitivity:** 3 quy tắc — mean / median / winrate (per-prompt win, tie chia đều). Top1 mỗi rule;
  top1 khác nhau → `sensitivity=true`.
- **Rank stability:** mulberry32(seed=42) → B=400 prompt-cluster resample (paper: joint cluster over prompts);
  mỗi replicate rank theo mean → `retention` (freq giữ point-rank), `pTop1`, `modalRank/Freq`;
  CI diff top1−top2 = percentile p5/p95 → `withinNoise = p5 ≤ 0`; `pBeat2`.
- **Shelf-life:** age = today − measuredAt > max-age-days (70 = mốc 10 tuần của paper) → `stale`.
- **Truth (reproducible ≠ accurate):** có truth → rank theo |run−truth| (MAE) so rank theo score → `rankMatch`.

## Verdict
- exit 2: input/args sai (whitelist flag, NaN → KN-069).
- exit 1: có claim + ≥1 fault: pTop1 < threshold(0.8) · withinNoise · stale · sensitivity · truth rank mismatch.
- exit 0: report-only, hoặc claim supported; `--warn` hạ fault claim → warn (structural vẫn exit 2).

## Output
Human lines (rules/retention/top1/truth disclosure) + `--json` đầy đủ field.
Marker selftest: `SELFTEST OK` (6 case, có negative control chạy thật — KN-078).

## Wiring
components.json entry `rank-stability-selftest` → tự vào `eval-gate --scope all` (power sweep link `evals`).
Guard spec `tests/e2e/rank-stability-guard.spec.ts`: CLI pass/fail/exit2 + wiring assert (skill §6 + KN-080 Guard line).
Guard line KN-080 đổi advisory → enforced (con trỏ check, không restate — KN-068 §7).
