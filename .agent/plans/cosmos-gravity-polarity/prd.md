# PRD — Gravity G: HIGH đang tốt nhưng badge đỏ như báo động

> Ship 2026-09-12 — user yêu cầu ("Gravity G HIGH"). Pipeline `/harness` rút gọn.
> Cosmic-Quantum: Macro dashboard `scale.html` là đài quan sát — màu badge là tín hiệu · Micro 1 mapping polarity đảo ngược → collapse 1 · Entanglement `cosmic-scale.mjs` ↔ `scale.html` ↔ `index.html` observatory.

## Vấn đề

`G=8 (high)` + advice "Gravity mạnh — scope được kiểm soát tốt" là trạng thái TỐT, nhưng badge render class `gauge-level high` = đỏ (`#fca5a5`), cùng màu với Entropy HIGH (nguy cơ heat death) và Dark Energy HIGH (decollaboration). User nhìn đỏ tưởng hệ đang xấu. Ngược lại `G low` (scope phình, xấu) lại render xanh lá — đảo polarity hoàn toàn.

## Giải pháp (GIỮ)

Đảo polarity badge G ở 2 nơi (CSS class giữ nguyên, chỉ đổi mapping):
1. `scale.html#gravityParts`: `high→low(xanh) · medium→medium(vàng) · low→high(đỏ)`.
2. `index.html` observatory `deStats` Gravity tile: `G>=6→''(trắng, tốt) · G>=3→warn · else→hot` (hiện tại `G>=6→high/đỏ` là ngược).

Không đổi: công thức `G=cutRatio×10`, thang `low<3 · medium<6 · high>=6`, advice text, JSON shape.

## Non-goals (CẮT — YAGNI)

- ❌ Đổi công thức/thang/advice G — số đúng, chỉ màu sai.
- ❌ Đổi màu badge S/D/M — polarity của chúng đã đúng (cao=xấu).
- ❌ Thêm CSS class mới (`.good/.bad`) — reuse 3 class sẵn, chỉ đảo mapping.

## Acceptance (rubric viết TRƯỚC — KN-037)

| # | Tiêu chí | Đo bằng |
|---|----------|---------|
| 1 | `G=8` badge xanh (`gauge-level low`) ở `scale.html#gravityParts` | spec `cosmos-gravity-polarity` |
| 2 | `index.html` observatory tile Gravity không đỏ khi `G>=6` | spec (route-intercept `scale.json` G=8) |
| 3 | Badge D/S/M giữ nguyên polarity (D=0 xanh, S=9 xanh) | cùng spec |
| 4 | 375px không tràn + 0 pageerror | cùng spec |
| 5 | Full suite không regression | playwright full |
| 6 | Slop: file sửa không thêm findings mới (baseline 5 pre-existing ở `scale.html`) | `slop-check` diff |

## Persistence · F5 · Scope

`Persistence: www/cosmos/scale.json (commit, không đổi shape) · F5: giữ · Scope: global`.

## Who did you think with? (Dissent Review — KN-018)

- **Rival #1:** *"Đỏ cho HIGH là nhất quán toàn dashboard — user tự học G ngược."* Phản biện: màu là tín hiệu tiền-chú ý, user quét đỏ=nguy hiểm trước khi đọc chữ; bắt user nhớ "riêng G thì đỏ là tốt" là gánh nhận thức vô ích (KN-005 bug blindness — workaround vô thức).
- **Assumption có thể sai:** *"G HIGH luôn tốt."* Đúng trong ngữ cảnh hiện tại (G đo % PRD có CẮT/YAGNI — càng nhiều càng tốt). Nếu sau này G định nghĩa lại (ví dụ scope quá chặt) thì mapping phải review lại — ghi chú trong code comment.
- **Framing #3:** *đổi chữ thay vì đổi màu (ghi "GOOD/BAD" thay low/high).* Bác bỏ: chữ level đã có trong JSON contract + spec cũ assert `(low)`; đổi chữ vỡ contract, đổi màu thì không.
