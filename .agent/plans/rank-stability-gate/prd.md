# PRD mini — rank-stability gate (KN-080 → machine-enforced)

**Ngày:** 2026-09-27 · **Task:** biến eval-hygiene advisory (KN-080) thành máy chấm được.

## Problem
KN-080 adopt paper arXiv:2609.30074 nhưng Guard = **advisory checklist** — "rank stability chưa có máy chấm".
Hệ quả: benchmark 1 campaign vẫn có thể tuyên "best" mà không gì FAIL (spec-vs-wish — KN-047; KN không lưới = wishlist — KN-056).

## User story
Khi so sánh ≥2 phương án (AAR 3 methods, model comparison, component evals):
chạy **1 lệnh** trên file raw runs → biết (a) rank nào vững, (b) headline có phụ thuộc quy tắc tổng hợp không,
(c) claim "best" có được evidence hỗ trợ không — fail-loudly, không cần đọc prose.

## Scope (GIỮ)
- `check`: đọc results.json (raw per-run) → seeded prompt-cluster bootstrap (retention/pTop1/CI diff)
  + sensitivity 3 quy tắc (mean/median/winrate) + shelf-life (age vs 70d) + truth optional + claim gate.
- Fail-closed exit 2 (input/args — KN-069), claim gate exit 1 (KN-080), report-only exit 0.
- `selftest`: 6 case có **negative control chạy thật** (KN-078) — clear/tie/stale/malformed/single-run/bad-args.
- Wire: components.json (auto vào `eval-gate --scope all` ∈ power sweep) + skill §6 + KN-080 Guard line + e2e spec.

## Non-goals (CẮT — YAGNI)
- ❌ Không chạy benchmark, không thu thập raw runs (agent/AAR phải persist — KN-080c).
- ❌ Không LLM, không network, 0 dep; không UI/page (không thuộc `www/`).
- ❌ Không thay rubric/grounding grader — bổ sung, không thay (reproducible ≠ accurate giữ 2 lớp).

## Persistence
`Persistence: .agent/benchmarks/<task>/results.json (raw per-run, commit) + stdout/--json · F5: n/a (file-based) · Scope: repo`

## Who did you think with?
Dissent Review: *(a)* "checklist đủ rồi, gate mới = whack-a-mole" → phản biện bằng số của chính paper:
72% cell không perfect, top chỉ 68% giữ hạng — checklist không fail-loudly, máy-check là cách duy nhất bắt được;
*(b)* "gate chặn oan benchmark 1 run/cell" → giữ `--warn` escape cho advisory + default min-runs=2 (đúng paper —
identical calls không tái lập thì 1 run/cell không đo được noise), không hạ chuẩn mặc định.
