# Plan — Slop Gate (KN-047)

1. [x] Gap analysis chi tiết (`gap-analysis.md`) + PRD/Design/Plan
2. [x] Build `scripts/slop-check.mjs` — dogfood bắt 2 bug + dedupe + boolean flags + Critic fixes (fail-closed, regex boundary, CC stripped)
3. [x] Wire: `verify.prompt.md` (step 3b) + `evals-gate/SKILL.md` (Slop dimension + checklist)
4. [x] Rule: `minimal-ladder` (~200 LOC) + `harness-workflow` (Slop Gate block + 2 table rows)
5. [x] `docs/knowleged.md`: KN-047 (table + detail + anti-patterns + checklist + UpdatedAt) + `package.json` slop:scan
6. [x] Test: fixture detection (dup + CC) ✓ · self-scan clean ✓ · 0-file fail-closed exit 2 ✓ · bad path exit 2 ✓ · scan audit exit 0 ✓
7. [x] Regen `.claude/` (export-claude --check 0 diffs) + `get_errors` sạch + e2e suite 93/93
8. [x] Critic review độc lập → verdict FIX → đã xử lý F1-F6 + relabel overclaim; backlog: ci-slop-gate, policy-verifier-paths, mutation-real

**Nguồn:** HackerNoon "The Slop Should Not Be Tolerated" (12/09/2026) · SlopCodeBench arXiv 2603.24755v2 · METR · Anthropic write-up.
