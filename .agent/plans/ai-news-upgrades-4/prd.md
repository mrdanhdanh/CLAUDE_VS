# PRD mini — AI News Upgrades ×4

> Nguồn: `www/ai-news/ai-news.json` (2026-09-05, 15 bài) + fetch live 3 URLs.
> KN liên quan: KN-012 (governance/reward-hacking), KN-010 (AAR), KN-013 (minimal/YAGNI), KN-007 (auto-learn), KN-005 (fresh eyes).
> Cosmic-Quantum: Macro www/ + .github/harness + .agent là vũ trụ Harness · Micro 4 upgrades độc lập → collapse theo thứ tự 1→4 · Entanglement cua-guard ↔ cua-safety ↔ policy.json ↔ audit ↔ library (rag-loop/router/tool-registry/mcp-server/app.js/index.html) ↔ designer.agent ↔ polish.agent ↔ design-template

## CẮT (YAGNI — KN-013)
- Không thêm dep mới (giữ 0 deps, Node 18+).
- Không đụng `export.json`/`books/` trực tiếp (library-rag cấm — chỉ qua MCP).
- Không sửa test để pass (KN-012).
- Không ESM check kiểu cũ (KN-015 — dùng temp .mjs nếu cần).

## GIỮ (4 upgrades, thứ tự)
1. **Sandbox guide → cua-guard**: boundary+policy+lifecycle, default-deny egress allowlist, workspace-only FS, short-lived token, resource limits, telemetry process-tree. Files: `.github/harness/scripts/cua-guard.mjs` + `.github/instructions/cua-safety.instructions.md`.
2. **Rogue trader → governance**: law 1 file, pin skills nhạy cảm (propose-only), journal append-only + git version, tách intent/execution, wake ritual (live exchange last). Files: `.agent/policy.json` (+scripts đã có) + `.github/instructions/agent-governance.instructions.md`.
3. **Transformers.js → library hybrid**: giữ BM25 chính, thêm reranker embedding optional (lazy-load, toggle, offline-first). Files: `www/library/rag-loop.mjs` + `router.mjs` + `tool-registry.mjs` + `mcp-server.mjs` + `app.js` + `index.html` + `README.md` + `search.mjs`.
4. **World-class designer → designer**: search BẮT BUỘC + seed SSOT + critic loop + cut pass + anti-slop. Files: `.github/agents/designer.agent.md` + `.github/agents/polish.agent.md` + `.github/skills/claude-harness/templates/design-template.md`.

## Persistence · F5 · Scope
- `cua-guard/policy/library`: file repo, F5 giữ (file), scope global (mọi agent).
- `www/library` hybrid toggle: `localStorage library:hybrid` (per-browser), F5 giữ, scope per-browser. Mặc định OFF (BM25 thuần <100ms).

## Verify
- `node .agent/scripts/policy-check.mjs --check` + `node .agent/scripts/audit.mjs verify`.
- `node .github/harness/scripts/cua-guard.mjs check/decide` smoke.
- `node www/library/search.mjs --status` + MCP stdio smoke qua functions (KN-014 — không import server trực tiếp).
- `get_errors` affected files.
