# Plans

Thư mục chứa các plan do `/plan` hoặc Phase 2 của harness tạo ra.

Mỗi task là 1 thư mục: `.agent/plans/<slug>/` chứa 3 file:
- `prd.md` — Vision, User Stories, Scope, Metrics
- `design.md` — Design System, Wireframe, States
- `plan.md` — Architecture, File Changes, Risks, Todos

Ví dụ: `.agent/plans/focus-flow/prd.md`, `.agent/plans/todo-manager/plan.md`

> Cấu trúc cũ `*.agent/plans/<slug>/prd.md` đã gộp vào thư mục để tránh loạn.
