# Plan — DisCo Phase 1 task-oriented (DisCo-lite)

## Todos
1. [x] Explore + PRD/Design/Plan mini (this folder)
2. [ ] Implement `--distill` trong auto-researcher.mjs (todo-driven, tdd-gate)
3. [ ] Demo distill 1 task thật + verify gates
4. [ ] Learn + Done (KN mới nếu có pattern)

## Steps — Implement (todo 2)
- Reuse `parseKNs/tokenize/computeIDF/scoreKN` + `loadLibrary/searchBM25` + `proposeMethods/benchmarkChecklist/slugify` hiện có (không rewrite).
- Thêm: `gapAnalysis(task, knHits, libHits)` → capabilities Q + gaps; `constructSkill(slug, task, Q, knHits, libHits)` → ghi `.agent/skills/<slug>/SKILL.md + references/evidence.md + record.json`; `verifySkill(dir)` → `node --check` (nếu có .mjs) + check SKILL.md frontmatter + record.json đủ fields.
- Thêm CLI `--distill`: chạy AAR cũ + distill pipeline; `--json` trả thêm `distill:{slug, path, record, verify}`.
- Thêm `toMarkdown` section `## 6. Distill` (skill path + verify + gaps).
- Sau edit: `node --check auto-researcher.mjs` + `policy-check` + `get_errors`.

## Steps — Demo + Verify (todo 3)
- Chạy: `node auto-researcher.mjs --task "rainbow border không xoay" --distill --top 3` → skill mẫu.
- Verify: `node --check` pass; `policy-check --tool write --target .agent/skills/...` PERMITTED; `eval-gate --scope` liên quan; `audit.mjs log + verify`.
- Dead-code grep: tên hàm mới phải có usage; diff stat ghi vào report.

## Risks
- Ghi nhầm test paths → `deny-test-mutate` chặn → chỉ ghi `.agent/skills/` + `.agent/plans/disco-phase1/`.
- Skill kém → ghi gaps vào R + fallback AAR cũ (không force keep).

## Verify
- `node auto-researcher.mjs --task "test" --distill --json` → JSON có distill + verify pass.
- `ls .agent/skills/<slug>/` có SKILL.md + references/evidence.md + record.json.
- `audit.mjs verify` chain OK.
