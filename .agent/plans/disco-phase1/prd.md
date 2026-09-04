# PRD — DisCo Phase 1 task-oriented (DisCo-lite)

> Mini PRD — Idea: Thêm distillation task-oriented vào `auto-researcher.mjs` theo paper `arXiv:2609.02749v1` (Repo-To-Skill / DisCo).

## Vision
Biến `auto-researcher` từ search+propose thành creator-lite: task `τ` → gap analysis → sinh skill graph `G~` → verify → nhận `G` + record `R`. Không đổi backbone/harness, chỉ thêm operating context `K`.

## User Stories
- **P0 — Dev:** `node auto-researcher.mjs --task "xxx" --distill` → sinh `.agent/skills/<slug>/SKILL.md` + `record.json` → dùng ngay cho task sau.
- **P0 — YUNIE:** Researcher mode chỉ load top-k skill liên quan (progressive disclosure), không nhét cả library vào context.

## Scope In (YAGNI gate — GIỮ)
- Flag `--distill` trong `auto-researcher.mjs`: scope (task decompose + gap) → ground (KN + library hits) → construct (SKILL.md 3 lớp tối thiểu) → verify (syntax + policy + eval-gate smoke).
- Skill format: `SKILL.md` (interface) + `references/` (substrate, copy snippet) + `record.json` (construction record R: evidence, checks, gaps).
- Audit + policy gate cho mọi skill mới.

## Scope Out / Non-Goals (YAGNI gate — CẮT)
- CẮT task-agnostic library lớn (để Phase 3), CẮT taxonomy 20 areas/178 families (để Phase 2 router), CẮT LLM call bắt buộc (template-based), CẮT auto-register vào `registry.json` (manual review trước).
- CẮT UI mới — CLI + markdown report như AAR cũ.

## Metrics
- `--distill` sinh skill trong <5s, `node --check` pass, `policy-check` PERMITTED, `eval-gate --scope` liên quan pass.
- Skill mới có `record.json` đủ evidence + checks + gaps (không nhận skill thiếu verify — học DisCo §3.2).
- Researcher load skill qua `suggest`/`search` top-k, không full-scan.

## Nguồn
- Paper: `arXiv:2609.02749v1` — DisCo §3.2 (4-stage `z→scope Q→ground X→construct G~→verify (G,R)`), §3.1 (skill 3 lớp + graph), §3.3 (creator/researcher).
- Nội bộ: KN-010 (AAR propose 3/benchmark/keep best), KN-007 (auto-learn), KN-012 (deny-test-mutate + audit hash-chain).

## Risks
- Skill kém → retrieval-precision fail (paper §5.3: 2/20 regress) → mitigation: verify gate + fallback unguided + ghi gaps vào R.
- Reward hacking → mitigation: check HOW not WHETHER + `deny-test-mutate` + audit verify.
