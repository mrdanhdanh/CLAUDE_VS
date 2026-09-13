# Plan — ai-news curated mirror (KN-051 + KN-052)

**Task:** Đưa 2 bài 12/09 (Axios "CEOs call for slowdown" + Pluralistic "LLMs are real, AI is fake") lên `www/ai-news/`.

## Ràng buộc (từ Explore)
- `ai-news.json` = auto-fetch (`fetch.mjs` full-replace `articles`) + policy `deny-test-mutate` → **CẤM edit tay**.
- Cosmos timeline = entropy chart từ `scale.json` (generated, dashboard chỉ đọc) → không phải chỗ đăng news.
- Luồng render: `init → loadNews() → cache localStorage (nếu mới hơn) → renderCategoryFilters + renderNews` — không re-sort ⇒ prepend có hiệu lực.

## Quyết định (Ladder nấc 7 — minimum that works)
- File mới `curated.json` (người quản — fetch.mjs không bao giờ ghi đè) + `mergeCurated()` trong `ai-news.js`, gọi từ `loadNews()` + cache path.
- Curated **pinned top**; dedupe theo title-40 (giống fetch.mjs); **fail-open** khi curated lỗi/thiếu (news vẫn render).
- Không sửa `fetch.mjs` (YAGNI — fetch không cần biết curated).
- Entangled with: `www/ai-news/ai-news.js` ← `www/ai-news/curated.json` (new) ← `tests/e2e/ai-news-curated.spec.ts` (new).

## Kèm đợt này (task B)
- `agent-governance.instructions.md` §7: bullet mới "tín hiệu từ actor có incentive — tách mechanism vs claim/timeline" (KN-052) + `harness-manager export-claude` sync `.claude/rules/`.

## Persistence
`curated.json` commit vào repo (static) · F5: giữ (server file) · Scope: mọi browser (global).

## Todos
1. [ ] `curated.json` — 2 entries (category safety, hot, link gốc)
2. [ ] `mergeCurated()` + wire `loadNews` + cache path
3. [ ] Spec `ai-news-curated.spec.ts` (pinned top · link đúng · chip count)
4. [ ] Run playwright (spec cũ + spec mới)
5. [ ] §7 instruction + export-claude + grep verify
