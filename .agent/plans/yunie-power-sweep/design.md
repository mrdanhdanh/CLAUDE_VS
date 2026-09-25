# Design mini — Power Sweep (CLI output contract)

## Interface
```
node .github/harness/scripts/power-check.mjs [--json] [--self-test]
Exit: 0 = all pass · 1 = ≥1 check failed/missing marker · 2 = invalid args / internal
```

## Check registry (data-driven, 1 dòng/check)
| id | script | expect | marker (proof-it-ran) | ref |
|----|--------|--------|----------------------|-----|
| registry | harness-manager.mjs status | 0 | `Harness Status` | KN-002 |
| doctor | setup-doctor.mjs --json | 0 | `"pass": true` | KN-077 |
| audit | .agent/scripts/audit.mjs verify | 0 | `audit chain OK` | KN-048 |
| policy | .agent/scripts/policy-check.mjs --check | 0 | `policy ok` | KN-012 |
| budget | scripts/instruction-budget.mjs --budget 1100 | 0 | `Trong budget 1100` | KN-068 |
| knowledge | auto-learn.mjs status | 0 | `KN ID integrity OK` | KN-066/074 |
| guards | auto-learn.mjs guards | 0 | `GUARD COVERAGE` | KN-056 |
| evals | eval-gate.mjs --scope components --json | 0 | `"pass": true` | KN-037 |
| status-mirror | (local fn, không spawn) | — | status.json parse + `health.status === "ok"` + counts>0 | KN-002/030 |

## Output
- Human: `⚡ POWER SWEEP — N/N checks` + `✅/❌ id (ms) detail` + summary + exit.
- JSON: `{ pass, ranAt, checks:[{id, pass, ms, detail}] }`.
- Fail-closed: thiếu marker → detail `no marker — gate ran? (KN-074)`.

## RED/GREEN guard
- RED trước: `power-check.mjs` chưa tồn tại → self-test command fail.
- GREEN: `--self-test` chạy `runChecks()` với runner inject — 3 case: pass, missing-marker phải FAIL, exit lệch phải FAIL.
- Durable: wire `power-check-self-test` vào `.github/harness/evals/components.json` (eval-gate sẽ chạy mỗi lần).

## Rủi ro & đối sách
- Spawn chậm (9 process) → mỗi check timeout 60s, marker ngắn; tổng < 60s.
- Trùng lặp với eval-gate ở 1 mắt xích (evals) → chấp nhận: power là lớp aggregate, không copy logic (chỉ gọi lại).
- Windows path/quote → spawn bằng `execFileSync(process.execPath, [script, ...args])`, không qua shell.
