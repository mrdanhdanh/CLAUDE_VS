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
- [x] full suite 146/146
- [x] commit `1a107ae`

---

# Batch 2 — `www/app.js` (STATUS page) — slop 13 → 0 ✅

## Cách sửa (giữ nguyên HTML output byte-for-byte)
- `normalizeRegistry` CC29 → `normItem` + `pushArrayItems` + `pushObjectItems`.
- `renderRegistryTable` CC13 → `registryEmptyRow/State` + `registryStatusTag` + `registryRowHtml/registryCardHtml`.
- `renderHealth` CC16 → `healthChecksHtml` + `healthStatusText` + `bindCopyStatusJson`.
- `renderHero` CC14 → `heroHealthHtml`.
- `renderPages` CC14 → `pageIcons14` + `pageEntryHtml`.
- `bindPipeline` CC16 → `bindPipelineTabs` + `wirePipelineButtons` (gỡ overlay double-bind).
- `renderYunie` 118/CC53 → 9 helpers (`yunieDefaultLetters`, `yunieLetterCardsHtml`, `renderYunieHeader/Letters/Aliases`, `setYunieIntro` + `bindYunie*`).
- `renderGovernance` 128/CC56 → `renderGovTag/AuditCard/PolicyCard/CredCard/Tail` + `govTailRow/CardHtml` + `govDecisionCls/DecTag`.
- `renderPlatform` 113/CC35 → `platVendorRows/GrantRows` + `renderPlatAgents/Mcp/Comp/Routine`.
- keydown anon CC16 → `handleGlobalKeydown` + `focusSearchIfIdle` + `isTypingInInput`.

## Safety net MỚI
- `tests/e2e/status-sections.spec.ts` — 5 test: governance 3 cards + tail rows/cards đồng bộ · platform 4 cards · yunie letters/aliases/intro tabs (phát hiện: aliases+intros nằm trong `<details>` đóng mặc định — phải mở trước khi assert) · health card + copy button · search filter.
- Audit spec cũ (L1-L4) + status spec + responsive vẫn xanh.

## Verify
- [x] get_errors: sạch · [x] slop-check: 13 → 0 (Clean)
- [x] 17/17 specs STATUS cũ + 5/5 spec mới
- [x] full suite 151/151
- [x] commit `eec7e37`

---

# Batch 1 — core harness (CHƯA LÀM — handoff)

**3 file · 44 findings — lớn nhất & rủi ro nhất của audit:**
- `harness-manager.mjs` 19 findings: `main` CC72/96 dòng · `install` CC53/93 · `exportClaude` CC50/134 · `installLocal` CC42/86 · `scanFs` CC39/110 · `presetApply` CC29 · `mergeHooksIntoSettings` CC25 · `list` CC25 · `sync` CC20 · `create` CC19 · `setEnabled` CC17 · `fetchSkillFiles` CC16 · `loadRegistry` CC14 + 1 dup block (135↔186).
- `auto-learn.mjs` 17 findings (watchdog/main/evaluateCandidate + residual sau split 22→18).
- `auto-researcher.mjs` 8 findings: `main` 162/CC51 + 7 CC 13-20 (parseKNs/scoreKN/searchBM25/gapAnalysis/verifySkill/parseArgs).

**Lý do tách:** đây là CLI core của toàn hệ thống (mọi agent gọi) — refactor phải làm nguyên khối với full context budget + verify bằng CLI thật từng lệnh (`status`/`list`/`preset`/`export-claude`) + pairwise so sánh trước/sau (pattern đã dùng ở auto-learn-split: 13/13 IDENTICAL). Không chia nhỏ sâu hơn để tránh nửa đường đứt gãy.

**Ưu tiên đề xuất khi làm:** auto-researcher (8, ít rủi ro nhất) → auto-learn (17) → harness-manager (19, cuối cùng vì critical nhất).
