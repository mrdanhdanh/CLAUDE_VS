---
description: "Enforce Claude Harness v2 product-driven pipeline for all coding tasks"
applyTo: "**"
---

# Harness v2 — Auto-Enforce (Product-Driven, Model-Agnostic)

Mọi coding task PHẢI tuân thủ pipeline **Idea → Explore → Clarify → PRD → Design → Plan → Implement → Polish → Verify → Done**.

> **Process > Model.** Chất lượng đến từ quy trình, không phụ thuộc model.

## Pipeline (BẮT BUỘC)

| Phase | Output | Bỏ được? |
|-------|--------|----------|
| **Explore** | Tóm tắt codebase, pattern | ❌ |
| **Clarify** | Câu hỏi + giả định chốt | Rút gọn nếu rõ |
| **PRD** | `.agent/plans/<task>-prd.md` | ❌ (mini 5 dòng cũng phải có) |
| **Design** | `.agent/plans/<task>-design.md` (palette, wireframe, states) | ❌ |
| **Plan** | `.agent/plans/<task>-plan.md` + `manage_todo_list` | ❌ |
| **Implement** | Code todo-driven, `get_errors` sau mỗi edit | ❌ |
| **Polish** | Responsive 375/768/1280, states, animation, a11y | ❌ — giao diện xấu = chưa xong |
| **Verify** | build/test/lint pass + visual check | ❌ |

Với task nhỏ (1-2 file): rút gọn Explore(quick) → Clarify(1 câu) → PRD mini → Design mini → Plan(3 todos) → Implement → Polish → Verify. **Không bỏ Polish.**

## Tool Priority

- Task >2 bước → `manage_todo_list` bắt buộc (3-7 từ/todo)
- Hiểu codebase → `runSubagent` (Explore)
- Ý tưởng mơ hồ → `vscode_askQuestions` (max 3 câu, có options)
- PRD/Design/Plan → `.agent/plans/` + templates `../skills/claude-harness/templates/`
- Multi-file edit → `multi_replace_string_in_file`
- Sau edit → `get_errors`
- Polish → audit theo `product-quality.instructions.md`
- Verify → `run_in_terminal` (sync), loop fix max 3 lần/check

## Product Quality (áp dụng cho mọi web UI)

- Design system: palette 3-5 màu, typography 1-2 font, spacing 4/8px, radius, shadow (CSS variables)
- Responsive 375/768/1280 không vỡ
- Đủ states: hover/focus/active/disabled/loading + loading/empty/error/success
- Animation 150-300ms (transform/opacity), không giật
- A11y: contrast ≥4.5:1, keyboard, aria-label

Chi tiết: `.github/instructions/product-quality.instructions.md`

## Memory

- Đọc `/memories/` và `/memories/repo/` trước khi bắt đầu
- Ghi pattern quan trọng sau Verify pass
- PRD/Design/Plan lưu tại `.agent/plans/` để trace
