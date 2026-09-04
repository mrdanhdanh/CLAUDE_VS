# PRD: WEB 011 Part 6 — FINAL BOSS (Game + Data + Viz + Security + API Explorer + DevTools + Utilities)

> Part 6 — Final Boss của THE ULTIMATE WEB UNIVERSE — hoàn thiện 7 labs còn lại để chạm 50+ features, đạt Level 6 ULTIMATE.

## 1. Vision
- **One-liner:** Final Boss — Game Engine + Data Lab + Visualization + Security + API Explorer + DevTools + Utilities — tất cả modular, lazy-load, capability-aware, đạt 50+ mini-features.
- **Problem:** Part 1-5 đã có 18 modules (Core + Text + Graphics + Media/File/Storage/Network + Concurrency/Device/Audio/PWA); thiếu Game (§15), Data (§16), Viz (§17), Security (§18), API Explorer (§19), DevTools (§20), Utilities (§21) — chưa đủ 50+ features, chưa đạt Level 6.
- **Target User:** Dev / người chấm — mở từng lab, thấy game chơi được, data table với virtual scroll, chart realtime, security demo, API explorer, devtools hoạt động thật.
- **Persistence:** `localStorage: web-universe:game-lab, web-universe:data-lab, web-universe:viz-lab, web-universe:security-lab, web-universe:api-explorer, web-universe:devtools, web-universe:utilities` · **F5: giữ** · **Scope: per-browser**.

## 2. User Stories
| ID | As a ... | I want ... | So that ... | Priority |
|----|----------|------------|-------------|----------|
| US-01 | User | Mở Game Lab → chọn Snake/Pong/Particles → chơi bằng keyboard, thấy score, pause/restart | Chơi game | P0 |
| US-02 | User | Mở Data Lab → load CSV/JSON, thấy table với sort/filter/search/group/aggregation/pagination/virtual scroll, generate dataset lớn, benchmark | Quản lý data | P0 |
| US-03 | User | Mở Viz Lab → chọn bar/line/pie/scatter/histogram/heatmap/realtime → thấy chart render bằng Canvas/SVG, realtime pipeline Worker→Chart | Xem visualization | P0 |
| US-04 | User | Mở Security Lab → xem XSS/escaping/sanitization/CSP/CORS/iframe sandbox/same-origin/cookie/storage/permission demos (educational) | Học security | P0 |
| US-05 | User | Mở API Explorer → thấy list Web APIs với ✓/⚠/✗, permission, demo, description | Biết browser APIs | P0 |
| US-06 | User | Mở DevTools → dùng JSON formatter, base64, URL encode, timestamp, UUID, color converter, regex tester, text transformer, hash, query parser | Dùng dev tools | P0 |
| US-07 | User | Mở Utilities → calculator, stopwatch, timer, clock, countdown, random, password gen, unit converter, text stats, color tools | Dùng utilities | P0 |
| US-08 | User | Thấy tổng 50+ features đếm được, benchmark real timing | Tin đạt Level 6 | P0 |
| US-09 | User | Gõ Ctrl+K → tìm "game/data/viz/security/api/devtools" → Enter mở | Mở nhanh | P0 |

## 3. Scope

### In Scope (P0 — phải có)
- [x] **Game Lab:** engine (input, game loop rAF, collision, sprite, particles, score, state) + Snake + Pong + Particle sandbox — engine tách khỏi game
- [x] **Data Lab:** CSV/JSON parser, table, sorting, filtering, search, grouping, aggregation, pagination, virtual scrolling (windowed render), dataset generator (1k/10k/100k), benchmark (normal vs virtualized)
- [x] **Viz Lab:** bar, line, pie, scatter, histogram, heatmap, realtime chart — Canvas/SVG, Worker→Data Stream→Aggregator→Chart pipeline for realtime
- [x] **Security Lab:** XSS concept, escaping, sanitization, CSP, CORS, iframe sandbox, same-origin, cookie flags, storage isolation, permissions — educational only, no exploit tools
- [x] **API Explorer:** auto-detect 20+ Web APIs (Canvas, Clipboard, WebSocket, IndexedDB, Worker, Notifications, Geolocation, Bluetooth, WebGPU, etc.) — support/permission/demo/description/error
- [x] **DevTools:** JSON formatter/validator, base64, URL encode, timestamp, UUID, color converter/picker, regex tester, text transformer, hash demo (SHA via SubtleCrypto), query-string parser, CSV converter, number base converter
- [x] **Utilities:** calculator, stopwatch, timer, clock, countdown, random generator, password generator (demo), unit converter, text statistics, color tools
- [x] Catalog: 7 new modules, lazy-load, total 25 modules, 50+ features
- [x] Persist + responsive + a11y + theme

### Nice to Have (P1)
- [x] Game: high score persist
- [x] Data: export CSV/JSON
- [x] Viz: export chart as PNG
- [x] Security: live sanitization demo

### Non-Goals (Out of Scope)
- Không làm full Plugin Architecture auto-discovery (đã có module system, Part 6 chỉ cần demo)
- Không làm backend cho data — chỉ client-side
- Không làm exploit tools — chỉ educational

## 4. Success Metrics
- M1: Game Lab → Snake/Pong chơi được, score, pause/restart, không leak rAF
- M2: Data Lab → table sort/filter/search, virtual scroll với 10k rows mượt, benchmark real timing
- M3: Viz Lab → 7 chart types render, realtime chart cập nhật
- M4: Security Lab → 10 demos educational, không exploit
- M5: API Explorer → 20+ APIs detected, status correct, no fake
- M6: DevTools → 12+ tools hoạt động
- M7: Utilities → 10+ tools hoạt động
- M8: Total 50+ features, lazy-load, F5 persist, responsive

## 5. Edge Cases & Constraints
- EC1: Game rAF leak → cancel on pause/unmount
- EC2: Data large dataset → virtual scroll, not render all DOM
- EC3: Viz canvas resize → handle DPR, resize observer
- EC4: Security — no real XSS execution, only demo
- EC5: API not supported → ✗, not fake
- Constraint: Vanilla JS, no chart lib, no game engine lib, cleanup on unmount

## 6. Dependencies
- Không thêm npm dep — vanilla + Canvas/SVG + Web APIs
- Dùng Core Runtime Part 1

## 7. Open Questions → Assumptions
- Q: Chart lib? A: Vanilla Canvas/SVG — tự vẽ
- Q: Game engine? A: Vanilla — rAF loop, input, collision minimal
- Q: Data virtual scroll? A: Windowed render — only visible rows

---
*Generated by YUNIE — Harness v2 PRD Phase — Part 6 Final Boss*
