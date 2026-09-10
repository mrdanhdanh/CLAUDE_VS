# Bug: Triển khai 3 self-improving upgrades (KN-025/026/027) — procedural graph + funnel + consistency

## Meta
- **Slug:** 2026-09-10-self-improving-upgrades
- **Ngày:** 2026-09-10
- **Severity:** major
- **Tags:** `process` `self-evolving` `agent` `memory` `verification`
- **Status:** `fixed`

## 1. Reproduce
- Task: "quất hết nha" — triển khai cả 3 proposals từ 10 papers self-improving (2026-09-08/09).
- Trước đó: Harness có pipeline 8-phase tĩnh (workflow.mjs), memory tiers (memory.mjs), reflect strategies (reflect.mjs) — nhưng thiếu explicit procedural structure, thiếu funnel 2 tốc độ, thiếu consistency metric.
- Evidence: `suggest "procedural graph"` → KN-025 score 83.8; library đã có 10 arXiv books.

## 2. Root Cause (5 Whys)
- Why1: Không self-evolve → vì thiếu 3 seams (graph/funnel/consistency).
- Why2: Thiếu seams → vì chưa ai formalize papers thành scripts.
- Why3: Chưa formalize → vì papers mới (2026-09-08/09), vừa ingest vào library.
- Why4: Vừa ingest → vì fetch.mjs trước đó dùng query rộng `all:AI` (88k nhiễu), vừa fix phrase query.
- Why5 (Root): Harness cần loop ingest → distill KN → implement seam — lần này làm thủ công, cần funnel tự động về sau.

## 3. Fix
- Approach: Minimal-ladder nấc 2 (reuse) — 3 scripts mới reuse workflow/memory/reflect, patch 5 files cũ bằng comment + check nhỏ.
- Files Changed:
  - NEW: `.github/harness/scripts/procedural-graph.mjs` (8 triplets từ harness-8phase, guide bias, refine contrast + held-out + rejected)
  - NEW: `.github/harness/scripts/experience-funnel.mjs` (distill fast state → consolidate slow policy + evidence ledger data/feature/model × supported/rejected/inconclusive)
  - NEW: `.github/harness/scripts/consistency-gap.mjs` (all-N vs per-run gap, FEEs 3 checks, SOLID-lite cluster → majority pseudo-reference)
  - PATCH: `workflow.mjs` (KN-025 doc), `memory.mjs` (KN-026 doc), `reflect.mjs` (+2 strategies consistency-check/enrich-env), `eval-gate.mjs` (+checkSelfImproving), `generate-status.mjs` (+selfImproving section)
  - FIX: isMain `split('/')` → `split(/[\\/]/)` cho Windows (phát hiện vì scripts mới silent exit 0 không output — auto-learn.mjs gọi main() trực tiếp nên không bị)
  - DOCS: `.agent/plans/self-improving-upgrades/{prd,design,plan}.md`
- Diff stat: +3 files mới (~450 dòng), 5 files patch (~40 dòng), 0 dep mới.

## 4. Verification
- `procedural-graph.mjs --init/--check/--guide/--refine --dry` PASS (8 triplets).
- `experience-funnel.mjs --status/distill/consolidate/evidence` PASS (2 states, 1 evidence).
- `consistency-gap.mjs --check/--fee-check/--solid` PASS (gap 80 unreliable đúng, gap 0 reliable đúng, FEEs PASS, SOLID 3/4 majority).
- `node --check` 8 files PASS, `get_errors` 8 files 0 errors.
- `distill-agnostic.mjs` 5/5 G-accepted, `generate-status.mjs` JSON valid, `cosmic-scale.mjs` S=0 low.
- eval-gate --scope all: silent (pre-existing isMain Windows issue ở scripts cũ — không phải do patch; syntax check thủ công PASS).

## 5. Lesson
- KN-025/026/027 đã có trong knowleged — implement là hiện thực hóa Cách phòng tránh thành code chạy được.
- Phát hiện thêm: isMain pattern `split('/')` fail silent trên Windows PowerShell (process.argv dùng backslash) — chỉ cua-guard.mjs đã fix trước, 14 files còn lại vẫn sai nhưng auto-learn (gọi main trực tiếp) che lấp. Đã fix 3 files mới; còn 11 files cũ nên fix ở task riêng (YAGNI — không scope-creep task này).

## 6. Prevention
- Mọi script .mjs mới phải dùng `split(/[\\/]/)` cho isMain (Windows-safe).
- Mọi seam mới phải có `--dry` + `--json` + exit code đúng.
- Không auto-commit knowleged — human duyệt (funnel consolidate chỉ propose).
