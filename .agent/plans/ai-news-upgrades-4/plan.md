# Plan — AI News Upgrades ×4

> Ladder: reuse-first (không rewrite), stdlib/native trước dep mới, 1 file 1 concern.
> Entangled with: cua-guard ↔ cua-safety · policy.json ↔ policy-check ↔ audit ↔ agent-governance · rag-loop ↔ router ↔ tool-registry ↔ mcp-server ↔ app.js ↔ index.html ↔ search.mjs ↔ README ↔ library-rag · designer ↔ polish ↔ design-template

- [ ] 1. cua-guard sandbox (Ladder 2: reuse — mở rộng file hiện có, Entangled: cua-safety.instructions.md)
- [ ] 2. governance rogue (Ladder 2: reuse — thêm rule + docs, Entangled: policy-check.mjs, audit.mjs)
- [ ] 3. library hybrid (Ladder 2: reuse — thêm functions + params, Entangled: toàn bộ www/library/)
- [ ] 4. designer world-class (Ladder 2: reuse — sửa docs, Entangled: polish.agent, design-template)
- [ ] 5. Verify: policy-check + audit verify + cua-guard smoke + library search smoke + get_errors
