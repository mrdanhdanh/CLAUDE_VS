# Design — DisCo Phase 1 task-oriented (DisCo-lite)

## Architecture (reuse-first, native-first)
```
--task τ
  → 1. Scope: task decompose (keyword split) + gap analysis (KN score==0 / lib score<threshold → gap)
  → 2. Ground: KN hits (auto-learn tokenize/IDF) + library hits (BM25 K1=1.2/B=0.75, reuse searchBM25)
  → 3. Construct: .agent/skills/<slug>/SKILL.md + references/evidence.md + record.json (R)
  → 4. Verify: node --check + policy-check + eval-gate smoke → G (accepted) hoặc G~ + gaps
Researcher: suggest/search top-k → load SKILL.md on-demand (progressive disclosure)
```

## Skill format (DisCo §3.1 tối thiểu)
- `SKILL.md`: frontmatter `name/description` (keyword-rich cho wise loading) + When to Use + Workflow (SOP từ KN phòng tránh + lib snippet) + Gaps.
- `references/evidence.md`: copy snippet KN + lib (substrate, không đọc lại nguồn).
- `record.json`: `{anchor, capabilities Q, evidence X, checks, gaps R, generatedAt, generatedBy}`.

## CLI
- `node auto-researcher.mjs --task "xxx" --distill [--top 3] [--json]` → sinh skill + report.
- Giữ nguyên `--report` AAR cũ (propose 3 + benchmark checklist) — `--distill` thêm creator-lite.

## States
- **Empty:** không gap → báo "đủ KN, không cần distill" (YAGNI).
- **Error:** export.json missing → báo Xuất; knowleged parse fail → fallback empty + ghi gap.
- **Success:** skill + record.json + report `report-<slug>.md` có section Distill.

## Quality gates (không cắt)
- `node --check` script sau edit; `policy-check --tool write --target <skill-path>` PERMITTED; `audit.mjs log` + `verify` chain OK.
- `deny-test-mutate`: skill không được chứa hướng dẫn sửa test để pass (KN-012).
- Benchmark HOW not WHETHER (KN-010); responsive/a11y chỉ khi task UI.

## File Changes
- `.github/harness/scripts/auto-researcher.mjs` (sửa: thêm distill pipeline, giữ AAR cũ).
- `.agent/skills/<slug>/` (mới khi --distill, git-tracked để reuse).
- `.agent/plans/disco-phase1/prd.md|design.md|plan.md` (mới, this folder).
