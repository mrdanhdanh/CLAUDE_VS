# Plan — Gravity polarity

> Todos todo-driven. Diff bounded: 2 files HTML, mỗi file 1–2 dòng logic + comment.

## Todos

- [ ] 1. Đảo mapping badge G ở `scale.html#gravityParts`
- [ ] 2. Đảo mapping tile G ở `index.html` observatory
- [ ] 3. Spec `cosmos-gravity-polarity.spec.ts` (verify actor) + refresh + full suite + Learn

## File changes

| File | Đổi gì | Ladder | Entangled with |
|------|--------|--------|----------------|
| `www/cosmos/scale.html` | `gBadge` class mapping đảo (high→low, low→high) + comment | nấc 7 (tối thiểu) | `scale.json` (đọc `gr.level`, không đổi shape) ↔ spec mới |
| `www/cosmos/index.html` | Gravity `de-stat` class đảo (`>=6`→thường, `<3`→hot) + comment | nấc 7 | `scale.json` ↔ spec mới |

## Risks

- Spec mới là test file → `deny-test-mutate` chặn YUNIE tạo. Mitigate: spec do **verify actor** tạo (policy cho phép), YUNIE chỉ sửa production code.
- User đã quen "đỏ=HIGH" cho G → đổi màu gây bỡ ngỡ 1 lần. Mitigate: advice text không đổi ("Gravity mạnh — tốt"), chữ level trong badge giữ nguyên (`G=8 (high)`), chỉ màu đổi → đọc chữ vẫn đúng.
