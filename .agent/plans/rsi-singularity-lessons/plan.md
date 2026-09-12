# Plan — RSI / Singularity Lessons (KN-048)

1. [x] Explore: policy.json v3 (9 deny + 2 allow) + KN-033 + governance §6 + agents.yaml + cua-safety §4
2. [x] Gap analysis 9 items (`gap-analysis.md`) — 3 delta, 4 deferred/skip, dissent ghi trước
3. [x] PRD/Design/Plan mini (files này)
4. [x] Apply delta 1: `agent-governance.instructions.md` §7 + 2 checklist lines
5. [x] Apply delta 2: `cua-safety.instructions.md` §4 bullet "Enforce > declare"
6. [x] Apply delta 3: `knowleged.md` KN-048 (table + detail + anti-patterns + checklist + UpdatedAt 13:03:19Z)
7. [x] Sweep: README 47→48 KN (3 + 1 chỗ 37→48), auto-learn "(6 KN)"→"(48 KN)" + example; status.json REGENERATE (không sửa tay)
8. [x] Regen `.claude/` (export-claude --check 0 diffs) + `get_errors` sạch
9. [x] **Critic review độc lập → verdict FIX (F1–F5) → đã xử lý:**
   - **F1:** bullet "enforce > declare" ở §7 rút thành pointer → canonical `cua-safety` §4 (hết copy 2 bản)
   - **F2 [major]:** red-team thật — probe bắt **2 bypass thật** (`rm -rf  /` double-space + `RM -RF /` case) → engine fix whitespace-canonicalization trong `policy-check.mjs` + `tests/e2e/guard-redteam.spec.ts` (**7 passed + 1 fixme** cho case-variant — law hardening backlog, deny-law-fork: human/verify apply)
   - **F3:** README:384 "37 KN"→48 + auto-learn instructions "(6 KN)"→48 (2 chỗ)
   - **F4:** `distill-agnostic.mjs` regen (process +KN-047→21, governance +KN-048→3, web-ui giữ 17) + refresh 3 registry descriptions (script `verify/refresh-desc.mjs`, KN-045 pattern) + regen status
   - **F5:** KN-048 + §7 thêm URL nguồn + hedge "theo nguồn thứ cấp" cho claims nặng ký
10. [x] Full e2e suite: **107 passed** + 1 flaky (`cosmos-rework #1b` — pass 7/7 khi re-run riêng, pre-existing flake dưới tải song song KHÔNG liên quan diff này) + 1 skipped (fixme)

**Backlog resolved (2026-09-12, human takeover `danh`):** (a) law v4 — case-normalize mọi deny rule ✅ applied (guard-redteam un-fixme 8/8) · (b) capability metric ✅ implemented minimal — `scale.json.capability` {kn, skills, e2eSpecs, e2eTests, guards} + delta vs mốc history (không weight — tránh vanity KN-024).

**Slop justification (KN-047):** `.agent/scripts/policy-check.mjs` — `classifyImpact()` CC 37 / `check()` CC 17→19 / `main()` CC 19 đều **>12 từ baseline** (đo `git show HEAD` → 3 findings pre-existing; canonicalize +1 nhánh `||` trên check — không tạo finding mới). File là engine law 0-dep cấu trúc cố định — refactor `check()`/`classifyImpact()` là task riêng (backlog). Runtime files khác: slop-check **clean** (guard-redteam tách describe Law v4 để giữ ≤80 dòng).

**Nguồn:** HackerNoon "Recursive Self-Improvement and Agentic AI: Fear of the AI Singularity" (Giovanni Coletta, 12/09/2026) · Anthropic "When AI builds itself" (06/2026) · DSEWiki incident (05/2026) · HuggingFace incident (07/2026).
