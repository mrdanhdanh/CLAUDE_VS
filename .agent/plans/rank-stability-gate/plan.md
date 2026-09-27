# Plan mini — rank-stability gate

1. [x] **Explore** — eval-gate.mjs scopes (components/grounding), components.json schema, spec style (spawnSync/tmpdir), isMain idiom (KN-074), suggest KN (080/074/069/010).
2. [x] **Implement** `.github/harness/scripts/rank-stability.mjs` — check + selftest, 0 dep, fail-closed (KN-069). *(slop 2 vòng: tách buildOpts/validateMeta/cellError — CC ≤12)*
3. [x] **Guard test** `tests/e2e/rank-stability-guard.spec.ts` — 7 test ×anh: pass · claim-fail · stale · report/warn · exit-2 class · wiring (tách 2 describe vì Slop fn ≤80).
4. [x] **Wire** — components.json entry (selftest, tự vào power sweep) + evals-gate §6 + auto-researcher Step 4 + KN-080 Guard line ENFORCED + distill/export mirrors.
5. [x] **Verify** — selftest exit 0 · spec 7/7 · eval-gate components 11/11 (entry mới) · slop clean · power 10/10 ALL GREEN · mirrors fresh <1h · guards audit có KN-080.

Budget: ~350 LOC script + ~120 LOC spec (≤200 LOC/diff mỗi lần — 2 bound: script trước, spec+wire sau).
Escalation: nếu selftest flaky (seed không cố định hành vi) → dừng, đổi fixture distribution, không nới threshold.
