# PRD: WEB 011 Part 1 — Core Runtime

> Part 1 của THE ULTIMATE WEB UNIVERSE — Modular Browser OS. Xây Core Runtime + Module Manager + Shell tối thiểu để các Part sau cắm module vào không phải sửa core.

## 1. Vision
- **One-liner:** Core Runtime lazy-load, lifecycle đầy đủ, error-isolated — nền móng cho 50–100 module của WEB UNIVERSE.
- **Problem:** App lớn nếu load hết module lúc startup sẽ chậm, leak timer/worker, 1 module crash làm chết cả app, không có dependency/sleep/resource tracking.
- **Target User:** Dev / người chấm — mở trang thấy OS-like shell, bật/tắt module, thấy lazy-load + lifecycle + isolation hoạt động thật (không hard-code).
- **Persistence:** `localStorage: web-universe:workspace-v1 + web-universe:theme` + `IndexedDB: web-universe-db (workspaces, snapshots)` · **F5: giữ** (workspace, theme, module states) · **Scope: per-browser** (local, chưa sync server).

## 2. User Stories
| ID | As a ... | I want ... | So that ... | Priority |
|----|----------|------------|-------------|----------|
| US-01 | User | Mở trang thấy Top bar + Sidebar + Workspace + Status bar | Nhận ra đây là OS trong browser | P0 |
| US-02 | User | Xem catalog module (≥10) với trạng thái UNLOADED/LOADED/ACTIVE/SLEEPING | Biết module nào đang chạy | P0 |
| US-03 | User | Bật module → lazy-load (dynamic import) → mount vào workspace window | Trải nghiệm lazy-load thật | P0 |
| US-04 | User | Tắt / Pause / Sleep / Restart module → timer/worker/listener được cleanup | Không leak tài nguyên | P0 |
| US-05 | User | Mở 2–3 module cùng lúc dưới dạng window (drag/resize/min/max/close/z-index) | Dùng như desktop OS | P0 |
| US-06 | User | Gõ Ctrl+K mở Command Palette → search + Enter để bật module / toggle theme | Điều khiển bằng bàn phím | P0 |
| US-07 | User | Thấy Resource Monitor (FPS, DOM nodes, workers, timers, active/loaded) cập nhật realtime | Tin performance là đo thật | P0 |
| US-08 | User | Reload trang → workspace (module đang bật + vị trí window + theme) được khôi phục | Không mất trạng thái | P0 |
| US-09 | User | Khi 1 module throw error → chỉ module đó crash, app vẫn sống, có nút Restart/Remove | Tin error isolation | P0 |
| US-10 | User | Toggle Dark/Light theme, persist sau F5 | Dùng theme mình thích | P1 |
| US-11 | User | Xem dependency graph: tắt dependency đang được dùng → cảnh báo + chọn Cancel / Disable dependents | Hiểu dependency | P1 |
| US-12 | User | Export/Import workspace snapshot JSON (validate + version check) | Backup/restore | P1 |

## 3. Scope

### In Scope (P0 — phải có cho Part 1)
- [x] App Runtime: init config → Module Manager → State → Event Bus → Resource → Window → Permission → Error Manager
- [x] Module Manager API: `register/load/enable/disable/pause/resume/sleep/unload/restart/get/list` + dependency check + lifecycle hooks
- [x] Lifecycle đầy đủ: REGISTER → LOAD → MOUNT → ACTIVE → PAUSE → SLEEP → UNMOUNT → DESTROY (Manager hỗ trợ đủ, module có thể implement subset)
- [x] Module metadata: `id, name, version, category, description, dependencies, permissions, lazy`
- [x] Event Bus: `on/off/emit/once` + cleanup khi destroy
- [x] State Manager: Global/UI/Module/Workspace/Runtime split, persist localStorage + IndexedDB
- [x] Logger: DEBUG/INFO/WARN/ERROR + Dev Mode toggle
- [x] Window Manager: drag, resize, minimize, maximize, close, bring-to-front, z-index, snap, remember position
- [x] Resource Manager: FPS (rAF), DOM nodes, workers, timers, canvas count, active/loaded, estimate CPU (telemetry nội bộ, ghi rõ estimate)
- [x] Error Isolation: try/catch per module, error boundary UI, Restart/Remove, app không chết
- [x] Shell UI: Top bar (search, CPU/FPS/RAM estimate, settings), Sidebar (Home/Modules/Favorites/Labs...), Workspace (window/card system), Status bar (active/loaded/workers/FPS/online), Search, Command Palette (Ctrl+K), Notification, Modal/Dialog, Context menu, Keyboard shortcuts
- [x] Theme Engine: Dark/Light via CSS variables + early init chống flash + persist
- [x] Responsive: Desktop (sidebar+workspace), Tablet (collapsible), Mobile (drawer + full-screen module)
- [x] A11y: semantic, keyboard nav, focus-visible, aria, dialog accessible, reduced-motion
- [x] PWA stub: `manifest.webmanifest` + offline indicator (chưa full SW cache — để Part 6)
- [x] 3 demo modules lazy-load thật: `text-editor`, `canvas-lab`, `json-tool` (mỗi module là ES module riêng, dynamic import)
- [x] Workspace persistence: save/load workspace (modules, positions, theme) → localStorage + IndexedDB, restore sau reload
- [x] Snapshot export/import JSON + validate

### Nice to Have (P1 — làm nếu còn thời gian trong Part 1)
- [x] Dependency graph UI
- [x] Permission Center UI (mock)
- [x] Benchmark screen (startup time, lazy vs eager)
- [ ] Full Service Worker cache (để Part 6)

### Non-Goals (Out of Scope — để Part 2–7)
- Không làm đủ 50–100 module (Part 1 chỉ 3 demo + catalog 12)
- Không làm WebGL/WebGPU/Audio/Video/Camera/File/Storage/Network/Worker/PWA full (để Part 3–6)
- Không làm plugin auto-discovery từ folder (để Part 6)
- Không backend, không auth

## 4. Success Metrics
- M1: Startup chỉ load core (~<100KB JS), module chưa dùng chưa fetch (Network tab chứng minh)
- M2: Bật module → 1 network request `js/modules/<id>/index.js` mới xuất hiện (lazy-load thật)
- M3: Tắt module → timer/worker/listener của module đó dừng (Resource Monitor giảm)
- M4: 1 module throw → chỉ card đó hiện ❌, các module khác vẫn chạy
- M5: Reload → workspace khôi phục 100% (modules + positions + theme)
- M6: Lighthouse a11y ≥90, responsive 375/768/1280 không vỡ
- M7: FPS ≥55 với 3 modules active

## 5. Edge Cases & Constraints
- EC1: Module id không tồn tại → toast error, không crash
- EC2: Enable module thiếu dependency → cảnh báo + auto-enable dependency hoặc block
- EC3: Disable dependency đang được dùng → modal cảnh báo + 2 lựa chọn
- EC4: Import snapshot sai version / JSON invalid → reject + toast, không thực thi code
- EC5: Browser không hỗ trợ API (WebGPU, etc.) → hiển thị ✗ Not supported, không giả lập
- EC6: Offline → core + local modules vẫn chạy, network-dependent hiện 🔴
- EC7: Rapid enable/disable → debounce + state machine guard (không double-mount)
- Constraint: ES Modules only, `const/let`, không global bừa bãi, cleanup timers/listeners/workers, không hard-code benchmark, không giả lập API

## 6. Dependencies
- Không thêm framework — vanilla JS + CSS variables
- Dùng `playwright` (đã có) để verify animation/lazy-load nếu cần

## 7. Open Questions → Assumptions
- Q: Đặt app ở đâu? A: `www/web-universe/` (www là Pages root, copy vào là deploy)
- Q: Module format? A: `js/modules/<id>/manifest.js + index.js + style.css` (ESM, export lifecycle hooks)
- Q: State lib? A: Vanilla pub/sub + localStorage/IndexedDB, không Redux

---
*Generated by YUNIE — Harness v2 PRD Phase — Part 1 Core Runtime*
