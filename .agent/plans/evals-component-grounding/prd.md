# PRD — Component-level evals + Grounding fact-grader (mini)

> Task: nâng `eval-gate.mjs` từ smoke-check → gate máy thật cho 2 hướng rút từ tin 17–22/09:
> (1) **component-level evals** (arXiv 2609.20804 → KN-072: đo từng mắt xích, failures khoanh vùng);
> (2) **grounding fact-grader** (Opus 5.5 22/09: "check every figure and quote — invented = fail").

## Vấn đề (đã disclose trong KN-037, review 2026-09-18)
- `eval-gate.mjs` trong generate-status = **smoke syntax/MCP** — KHÔNG phải rubric/component/E2E evals.
- Evals Gate hiện **prompt-enforced** (verify.prompt + skill) → "gate máy cho evals còn yếu" (disclosure chủ đích).

## User stories
- US1 (Verify phase): chạy 1 lệnh → thấy **từng component** (policy/audit/quarantine/cua/slop/budget) pass–fail riêng → failures khoanh vùng, không debug cả chuỗi.
- US2 (Verify open-ended): content có số/quote → chặn **số bịa / quote bịa** trước khi claim Done, bằng so khớp deterministic với sources (offline, 0 dep).

## YAGNI — CẮT trước GIỮ (minimal-ladder)
- CẮT: recoverable-elision machinery mới (KN-072 đo: model hiếm dùng + 0 gain) · CẮT: LLM-as-judge (self-preference KN-023) · CẮT: fetch web verify (offline-only).
- GIỮ: registry JSON (data) + runner deterministic (logic) + fixture guards.

## Dissent Review
- Alternative A: nhúng registry vào code eval-gate → loại (khó diff/review, sửa gate phải sửa code).
- Alternative B: chỉ viết spec fixtures, không có component thật → loại (giữ nguyên "smoke").
- Alternative C: LLM grader như Opus 5.5 → loại (0-dep + offline; và tự chấm = KN-023).
- Chọn: **JSON registry + deterministic runner** — verify bằng command, fail-loudly, sống ngoài tầm sửa của agent đang được chấm (KN-047/056).

## Persistence · F5 · Scope
N/A — không phải trang `www/`; artifact = file repo (`registry` + `eval-gate` + spec).

## Non-goals
- Không thay rubric do người viết (grader chỉ đo số/quote, không đo "hay").
- Không auto-fix; không chạy grounding trong generate-status (cần `--content/--sources` cụ thể).
