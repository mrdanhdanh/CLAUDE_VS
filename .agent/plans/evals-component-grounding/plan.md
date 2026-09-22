# Plan — evals-component-grounding

> Bounded: 5 file + 1 spec; ước tính ~250 LOC mới (registry 60 · eval-gate +150 · spec ~120).

## Todos
1. [x] Đo exit codes thật 7 components (evidence 2026-09-22, session log).
2. [x] Plan docs mini (prd/design/plan).
3. [x] Governance: policy-check + audit cho nhóm file (spec dùng actor `verify` — deny-test-mutate thiết kế).
4. [x] Tạo `.github/harness/evals/components.json` (7 entries, expectations đo thật).
5. [x] Nâng `eval-gate.mjs`: `checkComponents()` + `checkGrounding()` + exports + scope wiring (+ refactor CC ≤12 pass Slop Gate).
6. [x] Update: skill `evals-gate` (+§component mechanism, +§grounding) · `generate-status` (2.5 changelog + label) · `package.json` script · README 2.5.
7. [x] Guard spec `tests/e2e/eval-gate-components.spec.ts` + chạy Playwright → 5/5 pass (fresh evidence).
8. [x] E2E: `eval-gate --scope all` PASS · `generate-status` regen (health ok, drafts 0) · demo grounding PASS/FAIL/fail-closed · knowleged amend (KN-037) · audit chain.

## Phát sinh (trong session — cùng lớp verifier)
- **Bug thật #1:** eval-gate **fail-silent trên Windows** (isMain `split('/')` → exit 0 không chạy gì) — fix class 10 script + checkMcp cross-platform; bug doc `.agent/bugs/2026-09-22-eval-gate-fail-silent...`; guard: spec “phải in output” + class-check.
- **Bug thật #2** (stub 19/09 treo): `auto-learn` đọc Status bold sai (`checkBugReadiness` + `markBugFixed`) — fix regex `\*{0,2}` + guard test trong `auto-learn-guard.spec.ts`; bug doc 19/09 đã fill + close.
- **Health:** drafts 0 → `www/status.json` health `ok`; suite status 15/15 pass.

## Evidence commands
- `node .github/harness/scripts/eval-gate.mjs --scope components --json`
- `node .github/harness/scripts/eval-gate.mjs --scope grounding --content <f> --sources <g>`
- `npx playwright test tests/e2e/eval-gate-components.spec.ts` → 5 passed
- `node .github/harness/scripts/generate-status.mjs` → JSON valid, health ok
- `node scripts/slop-check.mjs .github/harness/scripts/eval-gate.mjs tests/e2e/eval-gate-components.spec.ts` → clean

## Rollback
Git revert từng file; registry là data → xóa file, runner fail-closed theo scope (chỉ components bị ảnh hưởng).
