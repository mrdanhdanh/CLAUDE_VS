---
description: "Enforce Claude Harness v2 product-driven pipeline for all coding tasks — and /fixbug for bugs. BẮT BUỘC đọc docs/knowleged.md trước mọi task."
applyTo: "**"
---

# Harness v2 — Auto-Enforce (Product-Driven, Model-Agnostic)

Mọi coding task PHẢI tuân thủ pipeline phù hợp. **BẮT BUỘC đọc `docs/knowleged.md` trước mọi task** (xem `.github/instructions/knowleged.instructions.md`).

> **Process > Model.** Chất lượng đến từ quy trình, không phụ thuộc model.

## 0. Knowledge First (BẮT BUỘC — trước mọi pipeline)

```bash
read_file docs/knowleged.md  # <— bước 0, không bỏ
```

- Scan **Bảng tóm tắt** + **Anti-patterns** + **Checklist phòng tránh chung**.
- Nếu task chạm pattern đã từng lỗi → áp dụng ngay **Cách phòng tránh**.
- Sau khi fix bug → cập nhật `docs/knowleged.md` (KN-XXX) + `.agent/bugs/<slug>/bug.md`.

## Chọn pipeline

| Tình huống | Pipeline | Prompt |
|------------|----------|--------|
| **Feature / product mới** (ý tưởng → sản phẩm) | Full 8 phase: `Explore → Clarify → PRD → Design → Plan → Implement → Polish → Verify` | `/harness` |
| **Fix bug / regression / hotfix** | Gọn 6 phase: `Read Knowledge → Reproduce → Root Cause → Fix → Verify → Learn` | `/fixbug` |

> **Không dùng `/harness` cho bug** — sẽ tạo PRD/Design thừa. Dùng `/fixbug` để gọn, tập trung root cause + Learn.

## Pipeline /harness (Feature)

| Phase | Output | Bỏ được? |
|-------|--------|----------|
| **Explore** | Tóm tắt codebase, pattern | ❌ |
| **Clarify** | Câu hỏi + giả định chốt | Rút gọn nếu rõ |
| **PRD** | `.agent/plans/<task>/prd.md` | ❌ (mini 5 dòng cũng phải có) |
| **Design** | `.agent/plans/<task>/design.md` (palette, wireframe, states) | ❌ |
| **Plan** | `.agent/plans/<task>/plan.md` + `manage_todo_list` | ❌ |
| **Implement** | Code todo-driven, `get_errors` sau mỗi edit | ❌ |
| **Polish** | Responsive 375/768/1280, states, animation, a11y | ❌ — giao diện xấu = chưa xong |
| **Verify** | build/test/lint pass + visual check | ❌ |

Với task nhỏ (1-2 file): rút gọn Explore(quick) → Clarify(1 câu) → PRD mini → Design mini → Plan(3 todos) → Implement → Polish → Verify. **Không bỏ Polish.**

## Pipeline /fixbug (Bug — gọn nhẹ)

| Phase | Output | Bỏ được? |
|-------|--------|----------|
| **0. Read Knowledge** | Đã đọc `docs/knowleged.md` | ❌ |
| **1. Reproduce** | Steps + Expected/Actual + evidence | ❌ |
| **2. Locate & Root Cause** | file:line + 5 Whys | ❌ |
| **3. Fix** | Code todo-driven (3-5 todos) | ❌ |
| **4. Verify** | Re-test + edge + regression + build/lint | ❌ |
| **5. Learn** | `.agent/bugs/<slug>/bug.md` + `docs/knowleged.md` KN-XXX | ❌ |

- Storage: `.agent/bugs/YYYY-MM-DD-<slug>/bug.md` (copy từ `_template/bug.md`)
- Knowledge: `docs/knowleged.md` — Bảng tóm tắt + Chi tiết KN-XXX + Anti-patterns
- Không bỏ **Reproduce** và **Learn** — fix xong không ghi knowledge = chưa xong.

## Tool Priority

- Task >2 bước → `manage_todo_list` bắt buộc (3-7 từ/todo)
- Hiểu codebase → `runSubagent` (Explore)
- Ý tưởng mơ hồ → `vscode_askQuestions` (max 3 câu, có options)
- PRD/Design/Plan → `.agent/plans/` + templates `../skills/claude-harness/templates/`
- Bug → `.agent/bugs/` + template `_template/bug.md`
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

- Đọc `docs/knowleged.md` + `/memories/` và `/memories/repo/` trước khi bắt đầu
- Ghi pattern quan trọng sau Verify pass
- PRD/Design/Plan lưu tại `.agent/plans/` để trace
- Bug lưu tại `.agent/bugs/` + knowledge tại `docs/knowleged.md`
