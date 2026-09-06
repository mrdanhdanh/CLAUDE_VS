# Design mini — AI News Upgrades ×4

> Design vibe: linear.app dark minimal (search awesome-design-md khi làm UI mới — ở đây chỉ sửa logic + docs, không đổi visual).
> Tokens giữ nguyên (product-quality + www/styles.css + library/styles.css). Không thêm màu/font mới.

## 1. cua-guard (logic, không UI)
- Thêm `POLICY_DEFAULTS`: `egress: default-deny + allowlist`, `fs: workspace-only`, `creds: short-lived only`, `limits: cpu/mem/timeout/pids`.
- Evidence thêm `processTree`, `egress`, `policyVersion`. Giữ redact secrets.
- CLI thêm `policy` (in defaults) + `check` hỗ trợ `--egress --fs --token-ttl`.

## 2. Governance (docs + policy, không UI)
- `policy.json` thêm comment-law: law 1 file duy nhất, skills chỉ pointer.
- Thêm `deny-law-fork`: chặn edit `policy.json` trừ verify/takeover (mở rộng deny-test-mutate).
- Instruction thêm §6 Rogue-trader hardening: pin skills, journal append-only, wake ritual.

## 3. Library hybrid (logic + toggle nhỏ)
- `rag-loop.mjs`: thêm `hybridSearch()` — BM25 trước, rerank top-N bằng embedding optional (nếu provider sẵn, else fallback BM25 thuần).
- `router.mjs`: thêm `routeHybrid()` — query ngắn/đơn giản → BM25, query dài/phức tạp → hybrid (nếu bật).
- `tool-registry.mjs` + `mcp-server.mjs`: thêm param `mode: bm25|hybrid` (default bm25).
- `app.js` + `index.html`: toggle Hybrid (checkbox, persist localStorage), lazy-load embedding provider (CDN, cache IndexedDB).
- `README.md` + `search.mjs`: document mode + `--mode hybrid`.

## 4. Designer (docs, không UI)
- `designer.agent.md`: Discover BẮT BUỘC (search + seed + taste), Define (critic loop), Deliver (cut + anti-slop).
- `polish.agent.md`: thêm cut pass 30% + critic loop (đã có — verify đồng bộ).
- `design-template.md`: thêm citation + seed-derived + critic score + cut log.

## Wireframe
- Không đổi layout. Chỉ thêm 1 checkbox Hybrid trong search-meta (library) — reuse `.filter-pill` style.

## A11y / Perf
- Toggle có `aria-label`, keyboard focus. BM25 mặc định <100ms không đổi. Hybrid chỉ khi user bật.
