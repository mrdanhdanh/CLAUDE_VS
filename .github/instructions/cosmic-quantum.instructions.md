---
description: "Cosmic-Quantum Thinking — triết lý vũ trụ + lượng tử cho Harness. Use when designing system philosophy, harness theory, product vision, need cosmic/quantum metaphors, scale thinking, entanglement, superposition, uncertainty, or user says vũ trụ/lượng tử/cosmos/quantum/triết lý/lý thuyết/hệ thống/scale"
applyTo: "**"
---

# Cosmic-Quantum Thinking — Rule

> **Process là định luật, verify là quan sát.** Mọi task đều có 2 tầng: Macro (vũ trụ — hệ thống) và Micro (lượng tử — thực thi).

## Khi nào áp dụng
- Thiết kế triết lý, product vision, harness theory, kiến trúc hệ thống
- Task nhắc tới: vũ trụ, lượng tử, cosmos, quantum, triết lý, lý thuyết, scale, entanglement, superposition
- Cần quyết định kiến trúc 2 tầng (macro/micro) hoặc storytelling khoa học
- Mọi PRD/Design/Plan muốn gắn tư duy cosmic-quantum

## Quy tắc (BẮT BUỘC khi áp dụng)

### 1. Tư duy 2 tầng — Macro + Micro
- **Macro (Vũ trụ):** Hỏi "Hệ thống này scale như vũ trụ thế nào? www/ là vũ trụ, mỗi plan/skill là thiên hà — có cấu trúc không? Quy luật (pipeline) có rõ không?"
- **Micro (Lượng tử):** Hỏi "Trạng thái này đã sụp đổ chưa? Đã đo chưa? Entanglement với file nào?"
- Mọi PRD phải có dòng: `Cosmic-Quantum: Macro <scale> · Micro <state> · Entanglement <files>`

### 2. Không đoán — phải đo (Bất định Heisenberg)
- Như đo lượng tử: không `get_errors` / `build` / `audit verify` = không biết trạng thái.
- Trước khi claim Done: phải có fresh evidence (build pass, test pass, đo --angle nếu có animation).

### 3. Entanglement — một đổi, toàn hệ đổi
- Sửa 1 file → liệt kê `Entangled with: <files>` trong Plan todo.
- Sau edit: `get_errors` affected files, không chỉ file vừa sửa.

### 4. Superposition → Collapse (Clarify)
- Trước Clarify: liệt kê 3-5 khả thi (superposition).
- Clarify: chốt 1 bằng `vscode_askQuestions` hoặc ghi assumption rõ — đó là sụp đổ hàm sóng.

### 5. Tunneling — Minimal Ladder
- Áp dụng ladder 7 nấc (YAGNI → reuse → stdlib → native → dep đã cài → 1 dòng → tối thiểu) để tìm đường ngắn nhất qua rào cản.

### 6. Tích hợp Harness v2
- **PRD:** `Cosmic-Quantum: Macro ... · Micro ... · Entanglement ...`
- **Design:** Chọn vibe `cosmic dark` (nebula/starfield) hoặc `quantum light` (glass/superposition) — search `awesome-design-md/search.mjs` nếu cần.
- **Plan:** Mỗi todo ghi `Ladder nấc: <1-7>` + `Entangled with:`
- **Verify:** Checklist thêm `Đã đo chưa? Entanglement có vỡ không?`

## Ví dụ

```md
# PRD — Cosmic Todo
Cosmic-Quantum: Macro www/cosmos là vũ trụ con trong www/ · Micro superposition 3 layout → collapse 1 · Entanglement www/cosmos.html ↔ www/status.json ↔ registry.json

# Plan todo
- [ ] Build cosmos hero (Ladder nấc 4: native CSS starfield, Entangled with: www/styles.css)
```

## Liên kết
- Skill: `.github/skills/cosmic-quantum/SKILL.md` (triết lý đầy đủ + workflow 4 bước)
- Demo: `www/cosmos.html` (visual vũ trụ + lượng tử)
- Pipeline: `docs/harness-flow.md` (8 phase = vũ trụ hình thành)
- Design: `awesome-design-md/` (74 DESIGN.md cho vibe cosmic/quantum)

---
*Instruction: cosmic-quantum — Triết lý 2 tầng cho Harness v2. Process là định luật, verify là quan sát.*
