# PRD — DisCo Phase 3: Task-Agnostic Distillation (library dùng chung)

> DisCo arXiv:2609.02749v1 §3.2 (task-agnostic form) — chưng cất kiến thức repo thành skill dùng cho MỌI task cùng domain, không gắn task cụ thể.

## Vấn đề
Phase 1/2 đã có: task-oriented distill (`--distill`) + router/MCP (`search_skills/list_skills/get_skill`) cho `.agent/skills/`. Nhưng kiến thức tích lũy (`docs/knowleged.md` 13 KN + `.agent/bugs/` 11 bugs) chưa được chưng cất thành library dùng chung — agent phải đọc lại nguyên file mỗi task.

## Mục tiêu
1. Script `distill-agnostic.mjs`: parse `docs/knowleged.md` (KN entries) + `.agent/bugs/` → group theo theme → sinh skill task-agnostic vào `.github/skills/harness-<theme>/` (SKILL.md + references/evidence.md + record.json router-compat).
2. `skill-router.mjs` đọc **multi-source**: `.agent/skills/` (task-oriented) + `.github/skills/` (task-agnostic + harness skills) → MCP tools phục vụ toàn bộ library.
3. Đăng ký qua `harness-manager` — **không cần lệnh mới**: `scanFs()` bootstrap tự đăng ký skill mới từ filesystem (reuse, KN-013 ladder nấc 2).
4. Presets `full` + `lean-product` bật 5 skill distilled.

## User stories
- Agent chạy task web UI → `search_skills("css animation theme")` ra `harness-web-ui` (6 KN) → mở đúng bài học, không lặp bug KN-003/004.
- Dev clone repo → chạy `harness-manager status` → 5 skill distilled tự xuất hiện trong registry (enabled).
- Dev muốn regenerate sau khi thêm KN mới → chạy lại `distill-agnostic.mjs` (idempotent).

## Scope
- IN: distill-agnostic.mjs (Node 18+, 0 deps, regex parse); skill-router multi-source; presets full/lean-product; regenerate `www/status.json` qua `generate-status.mjs`.
- OUT (YAGNI — CẮT): 2-level taxonomy (area/family); unify TOOLS/TOOL_SCHEMAS (KN-002, để sau); LLM summarization (regex đủ); lệnh `register` mới trong harness-manager (scanFs đã cover); distill toàn văn bug.md vào SKILL.md (chỉ title + link, full text ở evidence.md); UI mới.

## Persistence · F5 · Scope
- Skills generated: file thật trong `.github/skills/` (commit git) · F5: giữ · Scope: global (mọi máy clone).
- Registry: tự bootstrap qua `loadRegistry()` → `scanFs()` · status.json regenerate bằng script.

## Đo thành công
- `distill-agnostic.mjs` chạy → 5 skill (web-ui 6 KN, process 3, build-config 2, governance 1, minimal 1), verdict G-accepted.
- MCP `list_skills` total ≥ 5 distilled + harness skills; `search_skills("rainbow animation")` hit `harness-web-ui`.
- `harness-manager status` hiện 15 skills (10 cũ + 5 mới), eval-gate PASS, audit chain OK.
