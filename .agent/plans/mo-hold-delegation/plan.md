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
