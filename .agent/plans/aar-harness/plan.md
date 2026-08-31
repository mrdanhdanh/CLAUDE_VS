# Plan — AAR for Harness (auto-researcher)

## Todos
1. [x] Explore: đọc auto-learn + library + harness (done)
2. [x] Demo Tier 1: suggest + library search (done)
3. [x] PRD/Design/Plan mini (this file)
4. [ ] Implement skill + script auto-researcher.mjs
5. [ ] Register skill + generate status + verify

## Steps — Implement (todo 4)
- Tạo `.github/skills/auto-researcher/SKILL.md` từ template
- Tạo `.github/harness/scripts/auto-researcher.mjs`:
  - Reuse tokenize/IDF từ auto-learn.mjs (copy, không import để no deps)
  - Reuse BM25 từ mcp-server.mjs (K1=1.2, B=0.75)
  - CLI: `--task "xxx" --top 3 --report` → sinh markdown report
  - Benchmark stub: check `dotnet build` + `get_errors` (gọi được thì gọi, không thì checklist)
  - Propose 3 methods: template-based (A: KN phòng tránh, B: product-quality, C: library-inspired)
- Test: `node auto-researcher.mjs --task "rainbow border không xoay" --top 3`

## Steps — Register (todo 5)
- `node harness-manager.mjs status` → verify
- Regenerate `www/status.json` via `generate-status.mjs` (nếu có) hoặc manual
- `get_errors` + `node -e "JSON.parse(...status.json)"`

## Risks
- export.json missing → handle gracefully (báo user Xuất)
- knowleged.md parse fail → fallback empty

## Verify
- `node .github/harness/scripts/auto-researcher.mjs --task "test" --top 3` → report sinh
- `node .github/harness/scripts/auto-learn.mjs status` → KN 9
- `node www/library/search.mjs --status` → 6 books 303 chunks
