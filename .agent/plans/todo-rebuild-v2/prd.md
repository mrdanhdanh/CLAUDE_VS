# PRD: Todo Rebuild v2 — Giao diện đẹp + Đồng bộ đa máy không cần import/export

## 1. Vision
- **One-liner:** Rebuild trang `www/todo-manager/` thành TaskBoard premium glass v2 — CRUD mượt, dashboard, filter/sort, undo, và **đồng bộ đa máy không cần import/export** mà **không cần DB** (dùng file `tasks.json` trên GitHub qua Contents API); nếu cần DB thì dùng free tier nhỏ (Supabase/Firebase/kvdb).
- **Problem:** Bản hiện tại đã có localStorage + GitHub sync qua PAT, nhưng UX còn friction (phải tạo token thủ công), chưa có Sync Code cho người dùng phổ thông, và giao diện cần polish lại để đạt product-quality 375/768/1280.
- **Target User:** Chủ repo (muốn tasks.json là source of truth trên Pages) + người dùng phổ thông (muốn mở ở máy khác là thấy ngay, không import/export, không tự host DB).

## 2. User Stories
| ID | As a ... | I want ... | So that ... | Priority |
|----|----------|------------|-------------|----------|
| US-01 | user | tạo/sửa/xóa/đổi trạng thái task (title*, desc, priority, status, dueDate, tags) | quản lý công việc chi tiết | P0 |
| US-02 | user | xem dashboard 5 số (tổng/todo/doing/done/quá hạn) | nắm tổng quan | P0 |
| US-03 | user | tìm + lọc (search, status, priority, tag, quá hạn) + sắp xếp (mới nhất/cũ nhất/deadline/priority) | tìm nhanh, ưu tiên | P0 |
| US-04 | user | dữ liệu lưu localStorage, F5 không mất, mở lại vẫn còn | dùng offline nhanh | P0 |
| US-05 | user | mở ở máy khác là thấy cùng list, không cần import/export | đồng bộ đa máy | P0 |
| US-06 | user | không phải tự dựng DB; nếu cần DB thì free, nhỏ, setup 2 phút | không tốn chi phí | P0 |
| US-07 | user | undo xóa trong 5s | tránh xóa nhầm | P0 |
| US-08 | user | giao diện premium glass, responsive 375/768/1280, a11y, animation 150-300ms | dùng mọi thiết bị, đẹp | P0 |
| US-09 | user | chọn phương thức đồng bộ: GitHub (không DB) hoặc Sync Code (free JSON store) | linh hoạt | P1 |
| US-10 | user | export/import JSON thủ công khi cần backup | dự phòng | P1 |

## 3. Scope

### In Scope (P0 — phải có)
- [ ] Rebuild `www/todo-manager/index.html` — header, dashboard, toolbar (search+filters+sort), grid cards, modal, toast, sync bar
- [ ] Rebuild `www/todo-manager/styles.css` — design system CSS variables, glass, responsive, states, animation
- [ ] Rebuild `www/todo-manager/app.js` — single state `{tasks, filters, sortBy}`, CRUD, filter/sort, render, undo, validation, no-reload
- [ ] Persistence: `localStorage: todo-manager:v2` (instant) + `tasks.json` mặc định (fetch no-store)
- [ ] **Sync không DB (primary):** GitHub Contents API `PUT /repos/{owner}/{repo}/contents/{path}` — auto-push sau add/edit/delete (debounce 1.2s), manual “Lưu lên GitHub”, GET để lấy sha, xử lý 409 retry, 401/403/404 message rõ
- [ ] **Sync free nhỏ (fallback, không bắt buộc):** Sync Code qua free JSON store (kvdb.io / npoint.io / jsonbin.io) — user tạo mã 6 ký tự, tasks lưu tại `https://kvdb.io/<bucket>/<code>` hoặc Supabase row `workspace_id=code`; máy khác nhập cùng mã là thấy
- [ ] Nếu chọn DB free: hướng dẫn tạo Supabase free (500MB, 1 project) với 1 bảng `todos` hoặc dùng Firebase Firestore free — chỉ cần anon key, không cần backend
- [ ] Seed data khi lần đầu, tag filter auto, overdue logic, count badge
- [ ] Validation title required, tags normalize, dueDate rỗng → không tính overdue

### Nice to Have (P1)
- [ ] Supabase/Firebase adapter plug-and-play (chỉ cần dán URL + anon key)
- [ ] Hiển thị trạng thái sync (chưa kết nối/đang đẩy/đã lưu/lỗi) + lastSync timestamp
- [ ] Nút “Tạo Sync Code” + “Nhập mã” + QR share

### Non-Goals (Out of Scope)
- Backend tự host, Docker, server riêng
- Auth phức tạp (OAuth, login/password) — chỉ PAT hoặc Sync Code
- Framework (React/Vue) — giữ vanilla HTML/CSS/JS
- Drag & drop Kanban, realtime WebSocket

## 4. Success Metrics
- CRUD không reload, state → render đúng, dashboard khớp
- F5 giữ data (localStorage), mở ở máy khác sau khi “Lưu lên GitHub” hoặc “Sync Code” thì thấy cùng list (không import/export)
- Không cần DB vẫn đồng bộ được (GitHub file); nếu dùng DB thì free tier <1GB, setup <5 phút
- Responsive 375/768/1280 không vỡ, a11y contrast ≥4.5:1, keyboard Esc/Tab
- `get_errors` 0, `tasks.json` valid JSON, Pages deploy ok

## 5. Persistence · F5 · Scope (BẮT BUỘC cho www/ static)
- **Persistence:** `localStorage: todo-manager:v2` (TTL vĩnh viễn, per-browser) + `www/todo-manager/tasks.json` (repo file, global) via GitHub Contents API + optional `kvdb.io/<bucket>/<syncCode>` hoặc Supabase `todos` table (global per syncCode)
- **F5:** Giữ (localStorage + remote file) — reload không mất, chỉ mất nếu clear site data và chưa sync
- **Scope:** per-browser (localStorage) + global (tasks.json cho mọi visitor sau khi Pages deploy 1-2 phút; Sync Code cho mọi máy nhập cùng mã, instant)

## 6. So sánh phương án lưu trữ (để user chọn)
| Phương án | DB? | Chi phí | Setup | Đồng bộ đa máy | Phù hợp |
|-----------|-----|---------|-------|----------------|---------|
| **A. GitHub Contents API (khuyên dùng, không DB)** | Không — file `tasks.json` trong repo | 0đ (repo public) | 1 lần tạo PAT `repo → Contents read&write` | Có — push file, Pages deploy 1-2p, máy khác fetch | Chủ repo, muốn source of truth là repo |
| **B. Sync Code qua kvdb.io / npoint.io (không DB)** | Không — HTTP JSON store free | 0đ | 0 — bấm “Tạo mã” là xong | Có — instant, nhập mã ở máy khác | Người dùng phổ thông, không muốn tạo PAT |
| **C. Supabase free (DB nhỏ)** | Có — Postgres 500MB, 50k MAU | 0đ | 2 phút tạo project + dán anon key | Có — realtime, RLS per workspace_id | Cần DB thật, query, RLS |
| **D. Firebase Firestore free** | Có — 1GB, 50k reads/day | 0đ | 2 phút tạo project + dán config | Có — realtime | Cần realtime, offline SDK |
| **E. localStorage only** | Không | 0đ | 0 | Không — chỉ 1 máy | Demo offline |

> **Khuyến nghị:** Mặc định dùng **A** (đã có sẵn, không DB, 0đ). Thêm **B** như fallback 1-click cho user không muốn tạo PAT. **C/D** chỉ khi user muốn DB thật — hướng dẫn trong modal.

## 7. Edge Cases & Constraints
- PAT sai/hết hạn → 401, báo “Token sai/hết hạn” + mở lại modal
- 403 → thiếu quyền Contents write hoặc rate limit
- 404 → sai owner/repo/path/branch
- 409 conflict (sha cũ) → GET lại sha mới, retry 1 lần
- localStorage quota / JSON parse lỗi → fallback []
- dueDate rỗng → không tính overdue, sort để cuối
- Xóa liên tiếp → mỗi toast undo riêng, timeout riêng
- Pages là static — không thể ghi file trực tiếp từ browser nếu không qua API (đã dùng Contents API)
- CORS: GitHub API cho phép CORS với Authorization header; kvdb/npoint cho CORS

## 8. Assumptions
- Repo `mrdanhdanh/CLAUDE_VS`, branch `main`, path `www/todo-manager/tasks.json` (có thể đổi trong modal)
- Vanilla JS, không build step, fetch `tasks.json` với `cache: no-store`
- Token chỉ lưu ở localStorage trình duyệt, không commit

## 9. Open Questions
- [x] Giữ `tasks.json` làm default tasks cho visitor chưa sync? → Có, fetch làm seed nếu localStorage trống
- [x] Có cần backend proxy để giấu token? → Không, token per-user lưu local, không cần proxy cho static Pages

---
*Generated by Claude Harness v2 — PRD Phase — todo-rebuild-v2*
