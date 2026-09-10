# PRD — Self-Improving Upgrades (KN-025/026/027)

> Who did you think with?: Critic agent (framing đối lập: "3 scripts mới có over-engineering không? Có thể gộp vào workflow.mjs/memory.mjs/reflect.mjs hiện có thay vì file mới?") — Quyết định: giữ 3 file riêng vì mỗi cái là 1 seam độc lập (plugin-seam), nhưng reuse tối đa helpers hiện có (evalWhen, memory tiers, reflect strategies). Human giữ pilot-in-command.
> Cosmic-Quantum: Macro Harness v2 self-evolving (procedural graph + funnel + FEEs) · Micro 3 scripts .mjs mới + patch 3 scripts cũ · Entanglement workflow.mjs ↔ memory.mjs ↔ reflect.mjs ↔ eval-gate.mjs ↔ generate-status.mjs ↔ knowleged.md
> Persistence: `.agent/procedural-graph.json` + `.agent/memory/*` + `.agent/consistency.json` (local, gitignored) · F5: mất working/short, giữ long (knowleged) + episodic · Scope: per-workspace

## Vision
Biến Harness từ pipeline tĩnh thành hệ thống tự tiến hóa: execution có structure explicit (KN-025), experience thành competence qua funnel 2 tốc độ (KN-026), environment giàu feedback + đo consistency (KN-027).

## User Stories
- P0: Là YUNIE, tôi chạy `procedural-graph.mjs` để formalize 8-phase thành triplets + guidance, không còn unconstrained generation.
- P0: Là agent, tôi distill trajectory → state → policy qua `experience-funnel.mjs`, có evidence gate.
- P0: Là Verify, tôi đo consistency gap + FEEs check qua `consistency-gap.mjs` trước khi claim Done.

## Scope In / Out
- In: 3 scripts mới + patch workflow/memory/reflect/eval-gate/generate-status + docs + STATUS.
- Out (CẮT — YAGNI): Không thêm UI www/, không thêm dependency, không sửa policy.json, không đụng test files (KN-012).

## Non-Goals
- Không thay pipeline 8-phase, chỉ thêm seam.
- Không auto-commit knowleged — human duyệt.

## Metrics
- `procedural-graph.mjs --check` PASS, `experience-funnel.mjs --status` OK, `consistency-gap.mjs --check` OK.
- eval-gate PASS, generate-status PASS, distill PASS.
