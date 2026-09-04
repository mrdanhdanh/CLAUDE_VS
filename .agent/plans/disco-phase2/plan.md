# Plan — DisCo Phase 2: Skill Router qua MCP

## Todos
1. [x] Explore + PRD/Design/Plan mini (this folder)
2. [ ] Tạo `www/library/skill-router.mjs` (listSkills/getSkill/searchSkills)
3. [ ] Thêm 3 schemas vào `tool-registry.mjs` + 3 tools/handlers vào `mcp-server.mjs`
4. [ ] Verify: node --check + eval-gate + MCP smoke (cũ + mới) + demo end-to-end
5. [ ] Learn + Done (audit log + KN nếu có pattern)

## Steps — skill-router.mjs (todo 2)
- Reuse `tokenize` từ `./rag-loop.mjs` (browser-compatible, chạy Node OK)
- BM25-lite: tf/idf đơn giản trên skill docs (name x2 weight, description x1.5, body x1) — đủ cho <100 skills, không cần full K1/B
- Scan: `fs.readdirSync(SKILLS_DIR)` → mỗi dir đọc `SKILL.md` + `record.json` (try/catch từng file, lỗi → skip + ghi warning)
- Export: `listSkills, getSkill, searchSkills, SKILLS_DIR`

## Steps — tool-registry + mcp-server (todo 3)
- `tool-registry.mjs`: thêm 3 schema vào `TOOL_SCHEMAS` (approval `never_require`) — `top_k` đã có trong clamp list
- `mcp-server.mjs`: import skill-router; thêm 3 entry `TOOLS`; dispatch skill tools trước `loadData()`; version 1.3.0
- Giữ nguyên mọi handler cũ — không regress

## Steps — Verify (todo 4)
- `node --check` 3 file + `get_errors`
- `eval-gate.mjs --scope www/library` PASS
- MCP smoke: printf payload | node mcp-server.mjs — check `tools/list` có 8 tools, `search_skills`/`list_skills`/`get_skill` trả đúng
- Demo end-to-end: `--distill` sinh skill → `search_skills` tìm thấy → `get_skill` mở đúng → dọn demo
- Dead-code grep: exports mới phải có usage

## Risks
- Skill tools dispatch trước loadData → phải cẩn thận không break flow tool cũ (test lại search_library)
- record.json thiếu fields → listSkills phải tolerant (verdict `unknown`)

## Verify
- Tất cả gates pass + demo end-to-end sạch (dọn skill demo sau)
- `audit.mjs verify` chain OK
