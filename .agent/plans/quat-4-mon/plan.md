# Plan — Quất 4 món + Playwright

## Todos (10 steps, 1 in-progress at a time)

| # | Todo | Files | Est |
|---|------|-------|-----|
| 1 | Explore + knowleged (done) | docs/knowleged.md, policy.json, audit.mjs | 5m |
| 2 | PRD mini (done) | .agent/plans/quat-4-mon/prd.md | 5m |
| 3 | Design mini (done) | .agent/plans/quat-4-mon/design.md | 5m |
| 4 | Plan + scaffold | .agent/plans/quat-4-mon/plan.md | 5m |
| 5 | Playwright foundation | playwright.config.ts, tests/e2e/*.spec.ts, package.json scripts | 20m |
| 6 | Flawd-lite mutation | scripts/mutation.mjs, .gitignore | 15m |
| 7 | Xaidr-lite policy-check | .agent/scripts/policy-check.mjs, .agent/policy.json | 20m |
| 8 | Engram-lite auto-learn | .github/harness/scripts/auto-learn.mjs | 20m |
| 9 | Jern-lite audit digest | .agent/scripts/audit.mjs | 15m |
| 10 | Polish + Verify | playwright test, mutation, audit verify, generate-status | 15m |

## Execution Order
- 5 → 6 → 7 → 8 → 9 → 10 (sequential, each get_errors after edit)
- Minimal ladder: reuse existing scripts, no new deps, native first.

## Dependencies
- Playwright: needs `npx playwright install chromium` (CI cache)
- Flawd: fallback to local mutation.mjs if binary not found
- Xaidr-lite: no deps, pure JS
- Engram-lite: no deps, BM25 already exists
- Jern-lite: no deps, SHA-256 via node:crypto

## Verify Gates
- After each edit: `get_errors` affected files
- Final: `npx playwright test` + `node scripts/mutation.mjs` + `node .agent/scripts/policy-check.mjs --check` + `node .agent/scripts/audit.mjs verify` + `node .github/harness/scripts/generate-status.mjs` (if exists)

## Risks & Mitigations
- Playwright browser missing → `npx playwright install chromium --with-deps` + skip if not available
- Mutation slow → limit to 20 mutants, timeout 5s per mutant
- Policy over-block → monitor mode (flag) for ambiguous, block only for critical

## Rollback
- Each file edit is reversible via git diff
- No DB migration, no breaking change to existing CLI (additive only)
