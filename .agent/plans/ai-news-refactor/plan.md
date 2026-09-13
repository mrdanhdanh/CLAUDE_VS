# Plan — ai-news.js refactor (KN-047 debt paydown)

**Task:** Giảm 17 slop findings pre-existing trong `www/ai-news/ai-news.js` về 0 — pure refactor bảo toàn hành vi.

## Baseline (đo bằng tool)
- `slop-check`: 17 findings — 5 dup (11/9/18/16/9 dòng ×2) + CC cao: handleSearch 58 · init 54 · handleLiveRefresh 42 · fetchLiveHackerNoon 39 · handleResetSearch 25 · fetchLiveReddit 23 · fetchLiveHN 18 · fetchLiveDevTo 18 · renderLast30DaysBadge 13 · size: handleSearch 111 · init 114 · handleLiveRefresh 91 dòng.

## Root pattern (5 Whys gọn)
1. Fetch functions trộn transport + map → tách `getJson()` + `map*Item()` mappers.
2. Live/Search copy-paste cùng block (Promise.all + merge + sort + top15 + filter-counts + reset-filter + build data + badge) → tách `fetchLiveMerged()`, `syncFilterCounts()`, `resetFilterToAll()`, `buildLiveData()`, `applyDataToUI()`, `refreshBadge()`.
3. `init()` làm 6 việc → tách `restoreLiveCache()` / `wireRefreshButton()` / `wireSearch()` / `wireKeyboard()` / `showLoadError()`.

## Ràng buộc
- **Pure refactor** — không đổi hành vi, không đổi DOM order, không đổi thứ tự side-effect.
- Verify: playwright 7/7 (ai-news + curated) trước & sau + slop-check before/after + so diff số findings.
- Diff > 200 LOC (refactor cơ học, 1 file) — justify theo KN-047: 1 bounded task, không thêm feature.

## Persistence
Không đổi: localStorage `ai-news-live` (24h) · `ai-news-search-last` (30s cooldown) · `ai-news-last-update` (1h cooldown).

## Todos
1. [ ] Baseline capture (slop before + playwright 7/7 đã có)
2. [ ] Tách fetch layer: getJson + 5 mappers + 5 fetch functions + hnoon helpers
3. [ ] Tách shared blocks: dedupeByTitle/dedupeByUrl/mergeLiveArticles/normalizeArticles/buildLiveData/fetchLiveMerged
4. [ ] Tách DOM helpers: syncHeroMeta/syncFilterCounts/resetFilterToAll/refreshBadge/persistLive/persistSearchTime/applyDataToUI
5. [ ] Refactor handleLiveRefresh + handleSearch + handleResetSearch
6. [ ] Refactor renderLast30DaysBadge + init (wire* + showLoadError)
7. [ ] Verify: slop-check 0 findings + playwright 7/7 + get_errors
