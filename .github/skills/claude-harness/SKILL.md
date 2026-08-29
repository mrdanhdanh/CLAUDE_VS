---
name: claude-harness
description: "Claude Harness v2 product-driven pipeline Idea -> Explore -> Clarify -> PRD -> Design -> Plan -> Implement -> Polish -> Verify. Use when building product from small idea, need beautiful UI/UX, model-agnostic workflow, or user says harness/product/idea/giao dien dep."
argument-hint: "Mô tả ý tưởng (1 câu cũng được) cần biến thành sản phẩm"
user-invocable: true
---

# Claude Harness v2 — Idea → Product

> **Process > Model.** Dù GPT/Claude/Gemini đều chạy cùng pipeline. Một ý tưởng nhỏ → sản phẩm hoàn chỉnh, giao diện đẹp.

## When to Use
- User đưa 1 ý tưởng nhỏ ("làm app quản lý chi tiêu", "web pomodoro", "landing page")
- Cần giao diện đẹp, UX mượt, responsive
- Muốn quy trình chuẩn như Claude Code Extension nhưng chạy trong VS Code Copilot Chat
- Bất kỳ task code nào muốn chất lượng product, không phải code rời rạc

## Pipeline (BẮT BUỘC — không bỏ bước)

```
Idea → Explore → Clarify → PRD → Design → Plan → Implement → Polish → Verify → Done
```

### Phase 1: EXPLORE (Read-Only)
- Delegate `Explore` subagent (quick/medium/thorough)
- Đọc workspace root, README, package.json, config
- `grep_search` tìm pattern liên quan
- Output: stack, file liên quan, pattern hiện có

### Phase 2: CLARIFY
- Nếu ý tưởng mơ hồ → `vscode_askQuestions` (tối đa 3 câu, có options)
- Chốt giả định, ghi vào PRD
- Không đoán — hỏi hoặc ghi assumption rõ ràng

### Phase 3: PRD
- Tạo `.agent/plans/<task>/prd.md` từ template `./templates/prd-template.md`
- Nội dung: Vision, User Stories, Scope (In/Out), Non-Goals, Success Metrics, Edge Cases
- Với ý tưởng nhỏ: PRD mini 5-10 dòng vẫn phải có

### Phase 4: DESIGN
- Delegate `Designer` agent hoặc tự làm
- Tạo `.agent/plans/<task>/design.md` từ template `./templates/design-template.md`
- Nội dung: Design System (palette 3-5 màu, typography, spacing, radius, shadow), Wireframe (mobile/tablet/desktop), Component States, UX Flows (loading/empty/error)
- Quy tắc: Không code khi chưa có Design

### Phase 5: PLAN
- Tạo `.agent/plans/<task>/plan.md` + `manage_todo_list` (3-7 từ/todo, 5-10 todos)
- Liệt kê File Changes (create/edit/delete), Risks, Verification Steps
- Hỏi user confirm nếu task phức tạp

### Phase 6: IMPLEMENT (Todo-Driven)
- 1 todo `in-progress` tại 1 thời điểm
- `read_file` chunk lớn → `replace_string_in_file` / `multi_replace_string_in_file`
- Sau mỗi edit: `get_errors` → fix ngay → mới `completed`
- Không in code block chờ copy — tự tạo file

### Phase 7: POLISH (BẮT BUỘC — không bỏ)
- Delegate `Polish` agent hoặc tự làm
- Checklist:
  - [ ] Responsive 375/768/1280 không vỡ
  - [ ] Hover/focus/active/disabled states
  - [ ] Loading / Empty / Error states
  - [ ] Animation 150-300ms, không giật
  - [ ] Contrast, keyboard, aria-label
  - [ ] Không inline style bừa bãi, dùng CSS variables
- Nếu giao diện xấu → chưa xong

### Phase 8: VERIFY
- `get_errors` + `run_in_terminal` (lint/build/test)
- Visual check: mở browser, check responsive
- Loop fix đến khi PASS (max 3 lần/check)
- Cập nhật `/memories/repo/` nếu có pattern mới
- Chỉ khi PASS mới `task_complete`

## Product Quality Standard
Mọi sản phẩm web PHẢI đạt chuẩn trong `.github/instructions/product-quality.instructions.md`:
- Visual: palette, typography, spacing 4/8px, radius, shadow
- UX: loading/empty/error, toast, animation
- Code: CSS variables/Tailwind, không hardcode text, không layout shift

## Templates
- PRD: `./templates/prd-template.md`
- Design: `./templates/design-template.md`
- Plan: `./templates/plan-template.md`

## Agents
- `Explore` — read-only codebase
- `Plan` — architecture & todos
- `Designer` — design system & wireframe
- `Implement` — todo-driven code
- `Polish` — responsive & UX polish
- `Verify` — build/test/lint loop

## Prompts
- `/harness` — full pipeline
- `/product` — Idea → PRD → Design → Plan (rút gọn cho ý tưởng nhỏ)
- `/plan` — chỉ plan
- `/implement` — chỉ implement
- `/polish` — chỉ polish
- `/verify` — chỉ verify

## Rules
- Không nhảy Idea → Code
- Không bỏ Polish
- `manage_todo_list` bắt buộc cho task >2 bước
- `vscode_askQuestions` khi mơ hồ
- Ghi nhớ pattern vào `/memories/repo/`
