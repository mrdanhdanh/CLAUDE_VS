# Plan — Instruction Budget Trim (2026-09-18)

**Goal:** Hạ thuế token always-on (đang 1399/1400 dòng — sát trần ratchet) bằng path-scope rule không cần load mọi session.
**Nguồn:** HackerNoon 16/09/2026 "How to Write a CLAUDE.md That Actually Helps Claude Code" — résumé không documentation; phải có động lực XÓA (ratchet).

## Path-scope (export đọc `fm.applyTo` — registry chỉ fallback)
| Rule | Trước | Sau | Vì sao | Dòng |
|------|-------|-----|--------|------|
| yunie-personality | ** | www/yunie-chat/**,.github/agents/** | Full spec = documentation cho chat; résumé đã nằm trong `yunie.agent.md` (modeInstructions) | 217 |
| platform-seam | ** | .agent/**,www/components/** | Chỉ dùng khi build platform capability (agents/MCP/components/routines) | 79 |
| cosmic-quantum | ** | .agent/plans/**,www/cosmos/**,www/cosmos.html | Dùng ở PRD/Plan + dashboard; skill `cosmic-quantum` vẫn on-demand | 75 |

→ always-on **1399 → 1028** dòng (−371, −27%); ratchet SOFT_BUDGET 1400 → 1100.

## Dissent đã cân nhắc (cố tình GIỮ always-on)
- awesome-design: phải fire ở Explore/Design TRƯỚC khi chạm html/css.
- library-rag: trigger theo task ("dùng sách X"), không có tín hiệu path ổn định.
- cua-safety: browser action có thể chạy ngoài `tests/`.
- custom-registry: YUNIE sys-task có thể bắt đầu không chạm `.github/`.
- agent-governance: spec pin cứng always-on (`tests/e2e/instruction-budget.spec.ts`).

## Changes
1. 3× `.github/instructions/*.instructions.md` — applyTo hẹp.
2. `harness-manager.mjs` `buildRules` — tách comma top-level (brace-aware) → YAML paths list (VS Code comma-list ↔ Claude Code paths list).
3. `scripts/instruction-budget.mjs` — SOFT_BUDGET 1100.
4. `package.json` — `budget:check --budget 1100`.

## Verify
- `npm run budget:check` exit 0 · `npx playwright test tests/e2e/instruction-budget.spec.ts` (guard) pass.
- `export-claude` → `export-claude --check` sạch · `get_errors` files đã sửa.

## OCR Review vòng 3 (18/09) — 7 findings, 0 critical/major
- Fix: `splitGlobs` bỏ phần tử rỗng + export + main-guard · gate arg `-budget`/positional fail-closed (+2 assert) · `check.mjs` FP refs 16→1 + `--out` utf8 · drift docs/status → `1028/1100`.
- Guard mới: `tests/e2e/harness-manager-export.spec.ts` (splitGlobs unit + export thật + CLI-alive).
- Regression: 22/22 spec liên quan GREEN · slop-check clean (changed files) · export-claude --check sạch.

## Rollback
Revert `applyTo: "**"` + SOFT_BUDGET 1400 (1 dòng/file) rồi re-run `export-claude`.
