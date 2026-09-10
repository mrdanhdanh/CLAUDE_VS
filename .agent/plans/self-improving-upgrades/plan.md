# Plan — Self-Improving Upgrades (KN-025/026/027)

- [ ] 025 procedural-graph.mjs mới (Ladder nấc 2: reuse evalWhen + workflow WORKFLOWS, Entangled with: workflow.mjs)
- [ ] 026 experience-funnel.mjs mới (Ladder nấc 2: reuse memory tiers + reflect, Entangled with: memory.mjs, reflect.mjs)
- [ ] 027 consistency-gap.mjs mới (Ladder nấc 7: minimum that works, Entangled with: eval-gate.mjs)
- [ ] Patch workflow/memory/reflect/eval-gate/generate-status để wire 3 seams
- [ ] Verify: eval-gate + distill + generate-status + cosmic-scale + get_errors
- [ ] Learn: bug.md + attest KN-025/026/027

## File Changes
- NEW: `.github/harness/scripts/procedural-graph.mjs`, `experience-funnel.mjs`, `consistency-gap.mjs`
- PATCH: `workflow.mjs` (guide hook), `memory.mjs` (funnel cmds), `reflect.mjs` (consistency strategies), `eval-gate.mjs` (3 checks), `generate-status.mjs` (self-improving section)
- DOCS: `.agent/plans/self-improving-upgrades/*`, `.agent/bugs/2026-09-10-self-improving-upgrades/bug.md`
