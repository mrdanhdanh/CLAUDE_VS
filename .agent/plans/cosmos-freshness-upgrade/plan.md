# Plan — Cosmos Freshness & Gate Upgrade

| # | Todo | Trạng thái | Ladder | Entangled with |
|---|------|-----------|--------|----------------|
| 1 | cosmic-scale: Gravity G + budget + history D/G | ✅ | 7 | `www/cosmos/scale.html`, `www/cosmos/index.html` |
| 2 | `entangle.mjs` mới (0 deps) | ✅ | 7 | `package.json` |
| 3 | generate-status: mục `cosmos` | ✅ | 7 | `www/status.json` |
| 4 | npm scripts `cosmos:refresh/check` + `entangle` | ✅ | 6 | — |
| 5 | Docs align: instruction §8 + 2 SKILL.md + số chết | ✅ | 7 | `.claude/rules/**` (export) |
| 6 | Web: stale badge + Gravity card + Lab #11 + future cards + labels | ✅ | 4 (native CSS/JS) | `scale.html`, `index.html` |
| 7 | Regenerate + routine 8h + export-claude | ✅ | — | `scale.json`, `audit.json` |
| 8 | Verify (playwright + get_errors + budget gate) | ✅ | — | `tests/e2e/cosmos-freshness.spec.ts` |

## Verify checklist
- [x] get_errors: scripts sạch (chỉ lint inline-style có sẵn của index.html)
- [x] `scale.json` có `gravity` + history có D/G
- [x] playwright: fresh badge, D/G stats, Lab #11 tương tác, no pageerror (KN-032)
- [x] `--budget 10` pass (S=0 ≤ 10) · gate exit 1 khi vượt
- [x] audit mirror = audit thật (16 events)
