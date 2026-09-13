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

---

## KẾT QUẢ (2026-09-13): 17 → 0
- Playwright 7/7 (ai-news + curated) + full suite 141/141 (trước batch 3) · dogfood bắt chính `mergeCurated` CC13 → fix.
- Commit `cf31556`.

---

# Batch 3 — `www/web-thuat-toan/app.js` (từ slop audit toàn repo)

## Baseline: 12 findings (10 dup + 2 anon metrics)

## Cách sửa
- `makeAutoController(cfg)` — 1 controller dùng chung cho 10 demos: `toggle()` / `stop()` / `advance()` / `play(initial, delay)`.
  - `stop()` trong 1 closure duy nhất → fix luôn lớp desync tiềm ẩn giữa hideAll (reset) và trạng thái auto.
- `randomArr(n, max)` — shared helper.
- 10 IIFE: decl → `var ctl=...`, reset → `ctl.stop()`, handleAuto → `ctl.toggle()`, handleStep tail → `ctl.advance()`, handleRun loop → `ctl.play(...)` (001 giữ for-loop vì dùng getSpeed per-step).

## KẾT QUẢ: 12 → 2 findings (dup 10 → 0)
- 2 findings còn lại = **scanner artifact (justified)**: outer wrapper IIFE `(function(){...})()` chứa 10 demo IIFE → scanner đo gộp thành 1 function 1448 dòng / CC 383.
  - Đã thử gỡ wrapper → scanner đo RIÊNG từng IIFE → nổ 21 findings → revert. Giữ wrapper = config tốt nhất.
  - Fix thật (tách 10 module) = out of scope bounded task này.

## Safety net MỚI (trang trước đây không có e2e)
- `tests/e2e/web-thuat-toan.spec.ts` — 5 test: step init→advance · auto toggle · **desync guard** (auto→reset→1-click restart) · 010 parity · 375 overflow.
- Phát hiện khi viết test: (1) CSS `#001-...` invalid (id bắt đầu bằng số) → phải dùng `[id="..."]`; (2) serve local không rewrite `/web-thuat-toan/` (serve.json) → dùng explicit `index.html` như cosmos specs.

## Verify
- [x] get_errors: sạch
- [x] slop-check: 12 → 2 (dup 0)
- [x] spec mới 5/5 pass
- [ ] full suite
- [ ] commit
