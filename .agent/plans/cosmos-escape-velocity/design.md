# Design — Escape Velocity (scale.html#escape)

## Vibe & Design system

Kế thừa **scale.html hiện có** (cosmic dark, không thêm palette/font):

- CSS variables sẵn: `--cosmos-*`, `.gauge-level low/medium/high`, `.fresh ok/warn/bad`, `.part`, `.bh-item known/dynamic`, `.web-chip` (chips, dùng chung — comment ghi rõ lý do, KN-042: class này local trong scale.html, không đụng `www/styles.css`).
- Không thêm component dependency — native + CSS hiện có (Ladder nấc 2: reuse).

## Layout (desktop ≥1024)

`section#escape` đặt **ngay sau `#timeline`** (cùng chủ đề S), trước `#web`:

```
┌─ section-head ──────────────────────────────────────────────┐
│ small: Escape Velocity                                      │
│ h2: 🚀 Vận tốc thoát nợ — gate theo đà                     │
│ p#evAdvice (aria-live): "Đà S: tăng X/N lần liên tiếp — …"  │
│ span#evFresh: 🟢 tươi · 2h                                   │
└──────────────────────────────────────────────────────────────┘
┌─ grid-3 ──────────────┬──────────────────┬──────────────────┐
│ 📈 Đà hiện tại        │ 🧾 Cửa sổ đo     │ ⛔ Khi gate nổ   │
│ .parts 3 rows:        │ chips S cũ→mới:  │ .bh-item         │
│  Đà tăng liên tiếp |X │ S=5 ↑ S=6 ↑ S=7  │  ⛔/✅ + hướng   │
│  Ngưỡng (--trend) |N  │ S=7 =            │  dẫn trả nợ      │
│  Trạng thái |GATE/…   │                  │                  │
│ badge gauge-level     │                  │                  │
└───────────────────────┴──────────────────┴──────────────────┘
code-block#evCode: --trend 3 (đà) vs --budget (mức) · npm run cosmos:gate
```

## States (đủ theo product-quality)

| State | Hiển thị |
|-------|----------|
| loading | "Đang tải scale.json…" + fresh "⏳ đang đo tuổi…" |
| error (fetch fail) | advice lỗi + fresh "⛔ không có data" + 3 vùng `.web-empty` "— chưa có scale.json —" |
| no-trend (scale.json cũ) | advice "chưa có trend — npm run cosmos:refresh" + 3 empty |
| window < 2 điểm | "— cần ≥2 điểm đo —" |
| gate đóng | advice "⛔ GATE: trả nợ…", badge `gauge-level high`, bh-item `dynamic` icon ⛔ |
| gate mở, đà >0 | badge `medium`, bh-item `known` icon ✅ |
| stale | #evFresh 🟡/🔴 theo tuổi scale.json (copy pattern #webFresh) |

## Responsive

- 375: `grid-3` → 1 cột (CSS sẵn có); chips wrap; code-block `overflow-x:auto` sẵn có. Invariant test: `scrollWidth - clientWidth ≤ 1`.
- `section[id]{scroll-margin-top:80px}` đã có (KN-040).

## A11y

- `aria-labelledby="ev-title"`; `#evAdvice` `aria-live="polite"`; rows `role="list"`/`listitem`.
- Trạng thái không chỉ bằng màu: text luôn ghi "GATE"/"chưa đạt".
- Contrast: dùng màu text hiện có (đã pass audit trước).

## CLI design (cosmic-scale.mjs)

- `--trend N` (N ≥ 2, default 3 khi flag không kèm số): gate bật — exit 1 khi `increases ≥ N`.
- History đọc từ `--out` nếu có, else `www/cosmos/scale.json` (explicit, không fallback ngầm).
- `result.trend = {increases, needed, gate, window: [{t,S}]}` — luôn ghi, kể cả không có flag.
- Semantics: `increases` = chuỗi tăng **nghiêm ngặt liền kề kết thúc ở điểm hiện tại**; đi ngang/giảm = reset.
