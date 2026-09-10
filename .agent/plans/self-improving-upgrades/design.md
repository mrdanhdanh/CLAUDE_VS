# Design — Self-Improving Upgrades

## Design system
- CLI style hiện có: `node *.mjs <cmd> [--json]`, exit 0/1/2, no deps Node 18+, try/catch + process.exit.
- Storage: `.agent/procedural-graph.json` (graph triplets), `.agent/memory/*` (reuse tiers), `.agent/consistency.json` (gap records) — gitignored ephemeral, long-term vào knowleged.md.
- Output: human-readable + `--json` cho YUNIE/www.

## Wireframe (CLI)
```
procedural-graph.mjs --init --from-workflow harness-8phase
procedural-graph.mjs --check | --guide --node implement --history "explore,clarify"
procedural-graph.mjs --refine --failed "verify fail X" --success "verify pass Y" --dry
experience-funnel.mjs distill --trajectory runs/xxx.json --dry
experience-funnel.mjs consolidate --dry | --status
consistency-gap.mjs --check --runs 5 --json
consistency-gap.mjs --fee-check --env "SciWorld-like"
```

## States
- `--dry`: không ghi file, chỉ in plan.
- `--json`: machine-readable.
- Missing file → warn + fallback, không crash (best-effort như workflow.mjs).

## Risks
- Over-engineering → mitigate bằng minimal-ladder: reuse evalWhen/memory/reflect, không rewrite.
