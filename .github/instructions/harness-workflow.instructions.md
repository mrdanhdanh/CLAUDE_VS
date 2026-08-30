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
| **Fix bug / regression / hotfix** | Gọn **6 execution + Done (7 phases)**: `Read Knowledge → Reproduce → Root Cause → Fix → Verify → Learn → Done` | `/fixbug` |

> **Không dùng `/harness` cho bug** — sẽ tạo PRD/Design thừa. Dùng `/fixbug` để gọn, tập trung root cause + Learn. `/fixbug` là **bounded repair loop**, không phải `/harness` thu nhỏ — có scope control + confidence gate + escalation.

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

## Pipeline /fixbug (Bug — gọn nhẹ, bounded repair loop)

| Phase | Mục tiêu | Output | Bỏ được? |
|-------|----------|--------|----------|
| **0. Read Knowledge** | Đọc bài học cũ, tránh lặp lại | Đã đọc `docs/knowleged.md` | ❌ |
| **1. Reproduce** | Tái hiện bug có bằng chứng | Steps + Expected/Actual + evidence | ❌ |
| **2. Locate & Root Cause** | file:line + 5 Whys | Root cause + file:line + giả thuyết | ❌ |
| **3. Fix** | Sửa ở gốc, todo-driven (bounded) | Code + `get_errors` affected files | ❌ |
| **4. Verify** | Không regression | Re-test + edge + regression + build/lint (full scope) | ❌ |
| **5. Learn** | Biến bug thành knowledge | `.agent/bugs/<slug>/bug.md` + `docs/knowleged.md` KN-XXX | ❌ |
| **6. Done** | Đóng vòng, báo cáo | Tóm tắt + KN + files changed | ❌ |

- Storage: `.agent/bugs/YYYY-MM-DD-<slug>/bug.md` (copy từ `_template/bug.md`)
- Knowledge: `docs/knowleged.md` — Bảng tóm tắt + Chi tiết KN-XXX + Anti-patterns
- Không bỏ **Reproduce** và **Learn** — fix xong không ghi knowledge = chưa xong.
- **Bounded repair loop:** `0 Knowledge Gate → 1 Reproduce Gate (FAIL→ask/stop) → 2 Root Cause Gate (uncertain→investigate/escalate) → 3 Minimal Fix (scope control) → 4 Verification Gate (reproduce+regression+build) → 5 Learning Gate → DONE (confidence ≥ MEDIUM mới close)`.
- **Gate chi tiết:** xem `.github/prompts/fixbug.prompt.md` (Fix Confidence HIGH/MEDIUM/LOW, Fresh-eyes tiered, get_errors phân tầng, Explore tiết kiệm).

## Tool Priority

- Task >2 bước → `manage_todo_list` bắt buộc (3-7 từ/todo)
- Hiểu codebase → `runSubagent` (Explore) — với `/fixbug` chỉ delegate nếu bug rộng, bug nhỏ dùng `grep_search`/`read_file` trực tiếp (tiết kiệm)
- Ý tưởng mơ hồ → `vscode_askQuestions` (max 3 câu, có options)
- PRD/Design/Plan → `.agent/plans/` + templates `../skills/claude-harness/templates/`
- Bug → `.agent/bugs/` + template `_template/bug.md` — bounded repair loop, scope control, confidence gate
- Multi-file edit → `multi_replace_string_in_file`
- Sau edit → `get_errors` **affected files** (Phase 3 Fix); toàn scope ở Verify (Phase 4)
- Polish → audit theo `product-quality.instructions.md` — với `/fixbug` chỉ audit nhanh nếu bug là UI
- Verify → `run_in_terminal` (sync), loop fix max 3 lần/check — Fresh-eyes tiered: REQUIRED (UX/UI/workflow), RECOMMENDED (regression-prone), OPTIONAL (deterministic)

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
