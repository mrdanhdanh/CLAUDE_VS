# Plan mini — Mở HOLD delegation

| # | Bước | File | Gate |
|---|------|------|------|
| 1 | Engine: `--parent` + vars `parent`/`withinParent` + `evaluatePolicy` tách hàm | `.agent/scripts/policy-check.mjs` | permitted (allow-all) |
| 2 | Law v5: 3 deny rules subagent (đầu list) + version/description | `.agent/policy.json` | `--intent takeover` (human yêu cầu) |
| 3 | Guard D1–D4 (no-parent / chain / permitted / escalation) | `tests/e2e/guard-redteam.spec.ts` | `--actor verify` |
| 4 | Docs: §8 HOLD→ENFORCED + checklist + KN-059 Guard line + proposal Q2 resolved | 3 file | permitted |
| 5 | Verify: `--check`, probe tay, playwright guard spec, `get_errors`, audit verify | — | exit 0 |
| 6 | Sync: export-claude, generate-status, commit | `.claude/`, `www/status.json` | `--check` pass |

## Entangled with
- `tests/e2e/guard-redteam.spec.ts` (rule mới phải có check — KN-047)
- `.github/instructions/agent-governance.instructions.md` §8 + checklist + bản `.claude/rules` (export)
- `docs/knowleged.md` KN-059 (Guard line) + `docs/llm-weakness-research.md` §2c (evidence pointer đã có)
- `.agent/plans/mai-code-of-conduct-adopt/proposal.md` (open question #2)

## Rollback
- `git revert` commit; policy.json quay về v4 (9 deny) — engine vẫn backward-compat (vars mới optional).

## Done (2026-09-14)

- ✅ Tất cả bước pass: `--check` → **12 deny, 2 allow, v5** (digest `a4972205cc490263`) · guard spec **17/17 passed** (D1–D7) · audit chain **177/177** · `get_errors` 0 · `export-claude --check` khớp · `www/status.json` hiện policy v5.
- **Trace:** file landed trong commit `99ca722` — session song song chạy git sweep khi mình đang stage (đã disclosure ở `2657f51`; không rewrite history mid-session — 2 session đang chạy song song).
- Probe edge đã chạy: case-variant `SUBAGENT:*` bị chặn · `parent=verify` + child ≠ verify → `deny-test-mutate` (child hẹp hơn parent) · non-subagent regression OK.
