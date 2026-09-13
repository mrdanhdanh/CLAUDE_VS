# Plan mini — AI News dịch summary VI

## Todos
- [x] 1. Explore: fetch.mjs → ai-news.json → ai-news.js (render) + đo CORS/chất lượng 2 endpoint (evidence: curl 2026-09-13)
- [x] 2. Implement module dịch trong `ai-news.js` (cache + queue + breaker + parser đa hình, re-dùng pattern `scripts/yt-summary/build.mjs`)
- [x] 3. `createCard()`: ưu tiên VI, `data-vi`, `title` bản gốc, enqueue; `viApply` cập nhật mọi card trùng id
- [x] 4. CSS: chip 🇻🇳 cho `.news-summary[data-vi="1"]`
- [x] 5. E2E guard (KN-056): test mock `clients5` → assert swap VI + data-vi; giữ nguyên spec cũ (KN-012)
- [x] 6. Verify: playwright ai-news*.spec (9/9 pass) + slop-check clean + smoke thật (VI đầu tiên sau 723ms) + audit chain OK

## Kết quả verify
- `tests/e2e/ai-news-vi.spec.ts` (mới) + 2 spec cũ: **9/9 pass**
- Slop Gate: **clean** (sau refactor tách `summaryParts`/`viProcessOne`/`viWalkJson`)
- Smoke thật (server thật, không mock): bản dịch VI đầu tiên sau **723ms**; 7 VI / 9.7s đúng nhịp gap 1.5s; curated không bị dịch lại; tooltip bản gốc OK
- Audit chain: 146 chained OK · policy: www edit ✅ · spec guard ghi vai `verify` (deny-test-mutate KN-012)

## Entangled with (entangle.mjs)
- `www/ai-news/ai-news.js` ↔ `ai-news.css` ↔ `tests/e2e/ai-news.spec.ts` ↔ `ai-news.json`/`curated.json` (shape `summary`, `summaryVi`)
- Không chạm `fetch.mjs` (dữ liệu giữ nguyên) → không ảnh hưởng workflow daily.

## Ladder
- Nấc 2 (reuse): parser polymorphic + breaker copy nguyên pattern đã kiểm chứng ở `scripts/yt-summary/build.mjs` — không viết mới từ số 0.
- Nấc 4 (native): `fetch` + `AbortSignal.timeout` + `Intl` không cần lib. Không cài dep.
- Nấc 7: ~110 LOC JS + 5 LOC CSS — trong ngân sách ≤200/diff.
