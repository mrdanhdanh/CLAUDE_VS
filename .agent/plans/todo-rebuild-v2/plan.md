---
plan:
  main_task: "Todo Rebuild v2 — giao diện đẹp + đồng bộ đa máy không DB"
  is_greeting: false
  subtasks:
    - task_details: "Rebuild index.html — header, dashboard, toolbar, sync bar + Sync Code UI"
      assigned_agent: implement
    - task_details: "Rebuild styles.css — design system glass + responsive 375/768/1280"
      assigned_agent: implement
    - task_details: "Rebuild app.js — state, CRUD, filter/sort, GitHub + kvdb Sync Code"
      assigned_agent: implement
    - task_details: "Polish UI — states, animation, a11y, empty/loading"
      assigned_agent: polish
    - task_details: "Verify — get_errors, tasks.json, Pages, sync flow"
      assigned_agent: verify
---

## Context
- PRD: `.agent/plans/todo-rebuild-v2/prd.md`
- Design: `.agent/plans/todo-rebuild-v2/design.md`
- Stack: Vanilla HTML/CSS/JS, localStorage `todo-manager:v2`, `tasks.json` fetch, GitHub Contents API, kvdb.io Sync Code
- Existing: `www/todo-manager/` đã có GitHub sync via PAT, cần rebuild đẹp hơn + thêm Sync Code không DB

## Requirements
- Functional: CRUD, dashboard 5, search/filter 5 types, sort 4, localStorage, undo 5s, GitHub auto-push, Sync Code kvdb
- Non-functional: responsive 375/768/1280, glass premium, animation 150-300ms, a11y ≥4.5:1, no reload, tách hàm

## Architecture
- **State:** `state = { tasks, filters: {search,status,priority,tag,overdueOnly}, sortBy }` → `filterTasks()` → `sortTasks()` → `render()`
- **Persistence:** localStorage v2 (instant) + tasks.json (default) + GitHub Contents API (global) + kvdb.io/<bucket>/<code> (instant global per code)
- **Sync:** debounce 1.2s after mutation → push GitHub if connected + push kvdb if syncCode exists; manual buttons; 409 retry once
- **File structure:**
```
www/todo-manager/
  index.html — semantic, header, dashboard, toolbar, sync bar, sync-code bar, grid, modal, github modal, sync-code modal, toast
  styles.css — CSS vars, glass, responsive, states, animation
  app.js — IIFE, helpers, state, storage, GitHub, kvdb, CRUD, filter/sort, render, events, init
  tasks.json — {version, updatedAt, tasks: [...]}
```

## File Changes
| File | Action | Description |
|------|--------|-------------|
| `www/todo-manager/index.html` | edit | Rebuild header, dashboard, toolbar, thêm sync-code bar + modal, giữ a11y |
| `www/todo-manager/styles.css` | edit | Polish design system, glass, responsive, sync-code pill, states |
| `www/todo-manager/app.js` | edit | Thêm kvdb Sync Code (generate/pull/push), giữ GitHub, debounce, refresh status |
| `www/todo-manager/tasks.json` | edit | Giữ format, update updatedAt nếu cần |
| `.agent/plans/todo-rebuild-v2/prd.md` | created | PRD |
| `.agent/plans/todo-rebuild-v2/design.md` | created | Design |
| `.agent/plans/todo-rebuild-v2/plan.md` | created | This plan |

## Data Model
```js
task = { id, title, description, priority: 'low'|'medium'|'high', status: 'todo'|'doing'|'done', dueDate: 'YYYY-MM-DD'|'' , createdAt: ISO, tags: string[] }
state = { tasks: task[], filters: {search, status, priority, tag, overdueOnly}, sortBy: 'newest'|'oldest'|'dueDate'|'priority' }
githubConfig = { owner, repo, branch, path, token, autosync }
syncCode = "abc123" // 6 chars, stored localStorage todo-manager:syncCode:v1, remote kvdb.io/<bucket>/<code>
```

## Key Functions
- `loadData()` / `saveData()` — localStorage v2
- `getGithubConfig()` / `saveGithubConfig()` / `pushTasksToGitHub()` / `githubGetFile()` — Contents API
- `getSyncCode()` / `setSyncCode()` / `kvdbPush()` / `kvdbPull()` / `generateSyncCode()` — kvdb.io
- `addTask()` / `updateTask()` / `deleteTask()` / `cycleStatus()` → `afterMutation()` → save + render + schedule both syncs
- `filterTasks()` / `sortTasks()` / `render()` / `renderDashboard()` / `renderTagFilter()` / `renderTasks()`
- `openModal()` / `closeModal()` / `openGithubModal()` / `openSyncCodeModal()`

## Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| kvdb bucket chưa tạo → 404 | Dùng bucket cố định `todo-v2-demo` + handle 404 as empty, tạo khi push đầu tiên |
| GitHub 401/403/404 | Message rõ + mở modal, không crash |
| 409 conflict | GET fresh sha retry 1 lần |
| CORS kvdb | kvdb.io cho CORS, fallback báo lỗi |
| localStorage quota | try/catch, fallback [] |
| Token lộ | Chỉ lưu localStorage, không log, redacted |

## Verification Steps
- [ ] `get_errors` 0 cho 3 files
- [ ] `JSON.parse` tasks.json ok
- [ ] Mở `www/todo-manager/index.html` — CRUD không reload, dashboard khớp, filter/sort đúng
- [ ] F5 giữ data, undo 5s works
- [ ] GitHub: nhập PAT → auto-push sau add/edit/delete, manual Lưu, 409 retry
- [ ] Sync Code: Tạo mã → copy → máy khác Nhập mã → thấy cùng list (không import/export)
- [ ] Responsive 375/768/1280 không vỡ, a11y focus ring, Esc close modals
- [ ] `npx serve www` → http://localhost:3000/todo-manager/ works

## Todos (for manage_todo_list)
1. Rebuild index.html + sync-code UI
2. Polish styles.css glass + responsive
3. Implement app.js kvdb Sync Code + GitHub
4. Polish states + animation + a11y
5. Verify build + sync + Pages

---
*Generated by Claude Harness v2 — Plan Phase — todo-rebuild-v2*
