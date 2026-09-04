# PRD — DisCo Phase 2: Skill Router qua MCP (researcher mode)

> Mini PRD — Idea: Expose skill library (Phase 1) qua MCP layer để researcher mode chỉ load top-k skill (progressive disclosure, DisCo §3.3/§4.2).

## Vision
Agent không nhét cả skill library vào context — gọi `search_skills` → nhận top-k skill liên quan → `get_skill` mở đúng skill cần. Router thu hẹp request trước khi mở graph (như AREX-Skill router: area → family → repo graph).

## User Stories
- **P0 — AI/researcher:** Gọi MCP `search_skills({query, top_k})` → top-k skill theo BM25 → chỉ mở SKILL.md của skill khớp.
- **P0 — AI:** Gọi `list_skills()` → tổng quan library (slug, capabilities, verdict, gaps).
- **P0 — AI:** Gọi `get_skill({slug})` → SKILL.md + record.json (R) để biết checks/gaps trước khi dùng.

## Scope In (YAGNI — GIỮ)
- Module mới `www/library/skill-router.mjs` (Node-only, 0 deps): `listSkills`, `getSkill`, `searchSkills` (BM25-lite reuse `tokenize` từ `rag-loop.mjs`).
- 3 MCP tools mới: `search_skills`, `list_skills`, `get_skill` — schema trong `tool-registry.mjs` + dispatch trong `mcp-server.mjs`.
- Skill tools KHÔNG phụ thuộc `export.json` (dispatch trước check missing).

## Scope Out (YAGNI — CẮT)
- CẮT taxonomy 2 cấp (area/family) — skills hiện ít, BM25 đủ; để Phase 3 khi library lớn.
- CẮT unify TOOLS/TOOL_SCHEMAS (2 nguồn đã tồn tại từ trước — refactor riêng, không nhồi Phase 2).
- CẮT UI mới, CẮT auto-register skill vào `registry.json`.

## Metrics
- MCP smoke: 3 tool mới trả kết quả đúng, tool cũ không regress (eval-gate PASS).
- `search_skills` <100ms với <100 skills; trả citation đủ (slug, score, verdict).
- Contract backward-compat: tools cũ + response shape không đổi (KN-002).

## Nguồn
- Paper: `arXiv:2609.02749v1` §3.3 (researcher mode + progressive disclosure), §4.2 (router generation and use).
- Nội bộ: KN-002 (single source of truth + backward compat), KN-007 (auto-learn), Phase 1 `.agent/skills/<slug>/` format.

## Risks
- Skill rỗng/thiếu record.json → tool phải trả lỗi rõ, không crash.
- MCP smoke trong eval-gate chỉ check tool cũ → thêm smoke cho tool mới ở Verify.
