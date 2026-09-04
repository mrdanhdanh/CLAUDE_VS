# Design — DisCo Phase 2: Skill Router qua MCP

## Architecture (reuse-first, mount beside — không patch core)
```
MCP tools/call
  ├─ validateParams (tool-registry.mjs — thêm 3 schema)
  ├─ [skill tools] → skill-router.mjs (Node-only, KHÔNG cần export.json)
  │    ├─ listSkills()   → scan .agent/skills/*/SKILL.md + record.json
  │    ├─ getSkill(slug) → SKILL.md + record.json + evidence.md
  │    └─ searchSkills(q)→ BM25-lite (reuse tokenize từ rag-loop.mjs) top-k
  └─ [library tools] → flow cũ (loadData → searchBM25/agenticSearch)
```

## Module `www/library/skill-router.mjs` (Node-only)
- `SKILLS_DIR` = `<ROOT>/.agent/skills` (ROOT resolve từ __dirname ../../..)
- `parseFrontmatter(txt)` → `{name, description}` (regex, giống harness-manager)
- `listSkills()` → `[{slug, name, description, capabilities, gaps, verdict, generatedAt, path}]`; thiếu record.json → verdict `unknown`, không crash
- `getSkill(slug, {include_content=false})` → `{slug, name, description, record, skillMd?, evidence?}`; không thấy → throw rõ
- `searchSkills(query, {top_k=5})` → BM25-lite trên `name + description + capabilities + SKILL.md body`, trả `[{slug, name, description, score, verdict, capabilities}]` (progressive disclosure — KHÔNG trả full content)

## Tool schemas (tool-registry.mjs — approval `never_require`)
- `search_skills`: `{query (required), top_k (1-20, default 5)}`
- `list_skills`: `{}`
- `get_skill`: `{slug (required, minLength 1), include_content (default false)}`

## MCP dispatch (mcp-server.mjs)
- Thêm 3 entry vào `TOOLS` (description MCP-rich, cùng pattern cũ)
- Dispatch skill tools NGAY SAU validate, TRƯỚC `loadData()` check (không phụ thuộc export.json)
- `pushHistory` như tool cũ; lỗi → `isError:true` + message rõ
- Version bump `1.2.0 → 1.3.0`

## States
- **Empty:** `.agent/skills/` rỗng → `list_skills` trả `{total:0, skills:[], hint:'--distill'}`; `search_skills` trả hits rỗng + hint
- **Error:** slug không tồn tại → throw `Không tìm thấy skill "<slug>"` + gợi ý list_skills
- **Success:** JSON shape ổn định, có `file` path cho trace

## Quality gates (không cắt)
- `node --check` cả 3 file; eval-gate `www/library` PASS (tool cũ không regress)
- MCP smoke tay: initialize + tools/list + 3 tools/call mới
- Redact output (reuse `redactOutput` pattern — skill content có thể chứa snippet)
- Không sửa test để pass (KN-012); audit log sau khi done

## File Changes
- `www/library/skill-router.mjs` (mới)
- `www/library/tool-registry.mjs` (sửa: +3 schemas)
- `www/library/mcp-server.mjs` (sửa: +3 TOOLS, +3 handlers, version 1.3.0)
- `.agent/plans/disco-phase2/prd.md|design.md|plan.md` (mới)
