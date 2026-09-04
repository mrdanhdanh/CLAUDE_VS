# PRD: WEB 011 Part 7 — ULTIMATE POLISH (Level 6)

> Part 7 — Final polish để đạt Level 6 ULTIMATE 10/10. Bổ sung Dependency Graph, Sleep System, Plugin Architecture, Theme Engine, Benchmark, Sandbox, Debug Mode, Testing, Final Boss Test.

## 1. Vision
- **One-liner:** ULTIMATE Polish — dependency graph, auto-sleep, plugin discovery, custom theme, real benchmark, sandbox, debug mode — tất cả để pass Final Boss Test 10/10.
- **Problem:** Part 1-6 đã có 25 modules / 50+ features nhưng thiếu §24-46: Sleep auto, Dependency Graph UI, Plugin Architecture, Theme custom, Benchmark real, Sandbox, Debug, Testing — chưa đủ Level 6.
- **Target User:** Người chấm Final Boss Test — chạy 10 tests (§53) và thấy tất cả pass.
- **Persistence:** `localStorage: web-universe:theme-custom, web-universe:plugin-registry, web-universe:benchmark` + existing · **F5: giữ** · **Scope: per-browser**.

## 2. User Stories
| ID | As a ... | I want ... | So that ... | Priority |
|----|----------|------------|-------------|----------|
| US-01 | User | Xem Dependency Graph — nodes + edges, click node highlight dependents/dependencies | Hiểu dependency | P0 |
| US-02 | User | Tắt dependency đang dùng → modal cảnh báo với 2 lựa chọn (Cancel / Disable dependents) | Không break app | P0 |
| US-03 | User | Module idle 30s → auto SLEEPING (pause rAF/timers), click → ACTIVE lại | Tiết kiệm CPU | P0 |
| US-04 | User | Mở Plugin Lab → paste manifest JSON → Validate → Register → Enable mà không sửa app.js | Thêm module động | P0 |
| US-05 | User | Mở Theme Lab → chỉnh colors/radius/spacing → Export/Import theme JSON → Reset | Custom theme | P0 |
| US-06 | User | Mở Benchmark Lab → thấy startup time, lazy vs eager, FPS với 10/30/50 modules — số liệu đo thật | Tin performance | P0 |
| US-07 | User | Mở Sandbox Lab → thấy iframe sandbox với các permission khác nhau, test postMessage | Hiểu sandbox | P0 |
| US-08 | User | Bật Debug Mode → thấy lifecycle logs, event monitor, worker monitor, network/storage inspector | Debug app | P0 |
| US-09 | User | Chạy Tests → thấy Module Manager / Storage / Workspace / Error isolation tests pass | Tin reliability | P0 |
| US-10 | User | Chạy Final Boss Test 10 tests → tất cả pass | Đạt 10/10 | P0 |

## 3. Scope

### In Scope (P0 — phải có cho Level 6)
- [x] **Dependency Graph:** SVG graph (nodes + edges), highlight on hover/click, show dependents/dependencies, integrate with disable warning (already in module-manager)
- [x] **Sleep System:** auto-sleep after 30s idle (no focus/interaction), pause rAF/timers, resume on focus/click, status SLEEPING, manual sleep/wake
- [x] **Plugin Architecture:** Plugin Lab — manifest JSON input → validate (id, name, version, dependencies) → register via moduleManager.register → dynamic import via Blob URL → enable
- [x] **Theme Engine:** Theme Lab — color pickers for primary/surface/text/border, radius/spacing sliders, live preview, export/import JSON, reset, persist
- [x] **Benchmark Lab:** measure startup (performance.now), lazy vs eager (count loaded), FPS with N modules, memory estimate, render results
- [x] **Sandbox Lab:** iframe sandbox demos (no sandbox / sandbox / allow-scripts / allow-same-origin), postMessage test, permission display
- [x] **Debug Mode:** toggle in Settings → show Debug Panel (lifecycle events, event bus log, resource monitor, worker count, network log, storage inspector)
- [x] **Testing:** add `www/web-universe/tests/` with tests for Module Manager, Storage, Workspace, Error isolation (vanilla, run in browser)
- [x] **Final Boss Test UI:** checklist for 10 tests with run buttons and pass/fail indicators
- [x] Catalog: 6 new modules (dependency-graph, plugin-lab, theme-lab, benchmark-lab, sandbox-lab, debug-lab) — total 31 modules
- [x] Responsive + a11y + theme

### Nice to Have (P1)
- [x] Dependency Graph: auto-layout (force-directed simple)
- [x] Plugin: example plugins list
- [x] Benchmark: chart for FPS

### Non-Goals
- Không làm backend cho plugin discovery — chỉ manual JSON
- Không làm full test runner — chỉ browser tests

## 4. Success Metrics
- M1: Dependency Graph renders, disable warning works
- M2: Module idle 30s → SLEEPING, resume on click
- M3: Plugin Lab → paste manifest → register → enable without reload
- M4: Theme Lab → change color → live update → export/import
- M5: Benchmark Lab → real timing, not hard-coded
- M6: Sandbox Lab → iframe sandbox demos work
- M7: Debug Mode → shows lifecycle/events
- M8: Tests → 4 suites pass
- M9: Final Boss 10 tests → all pass
- M10: Total 31 modules, 60+ features

## 5. Edge Cases & Constraints
- EC1: Plugin manifest invalid → validate error, not register
- EC2: Plugin dependency missing → error, not crash
- EC3: Sleep while playing game → pause game loop
- EC4: Theme invalid JSON → error, not apply
- EC5: Benchmark with many modules → limit to 30 for perf
- Constraint: Vanilla JS, no lib, cleanup on unmount, no fake data

## 6. Dependencies
- Không thêm npm dep — vanilla
- Dùng Core Runtime Part 1

## 7. Open Questions → Assumptions
- Q: Plugin discovery? A: Manual JSON paste, not folder scan (browser cannot scan folder without picker)
- Q: Sleep timeout? A: 30s idle, configurable
- Q: Benchmark eager? A: Simulate by counting total vs loaded

---
*Generated by YUNIE — Harness v2 PRD Phase — Part 7 ULTIMATE*
