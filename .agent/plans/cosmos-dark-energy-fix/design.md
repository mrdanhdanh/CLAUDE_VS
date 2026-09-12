# Design — Dark Energy D fix (mini)

> Vibe: không đổi — dashboard `scale.html` giữ nguyên design system (cosmos dark). Chỉ thêm 1 dòng text + 1 field JSON.

## Design system (giữ nguyên)

- Palette/typography/spacing: không đổi — reuse `scale.html` hiện tại (ladder nấc 2: reuse).
- Badge `D=x (level)` giữ nguyên logic `0=low · ≤5=medium · >5=high` (JS đã có, không sửa).

## Thay đổi UI (1 dòng)

- `#deParts` thêm row cuối: `Tiền-gate (trước KN-018 2026-09-07) | 49 plans — không tính D/G`.
- Nguồn: `darkEnergy.plansLegacy` trong `scale.json` (mới). Fallback khi field thiếu (scale.json cũ): không render row (guard `!= null`).
- `index.html` observatory (`deStats`/`deHint`): không đổi — đọc `D`/`G` như cũ, giá trị tự đúng sau refresh.

## Data contract

```json
"darkEnergy": { "D": 0, "dissentRatio": 1, "plansTotal": 23, "plansWithDissent": 23, "plansLegacy": 49, "advice": "..." },
"gravity": { "G": 8, "level": "high", "cutRatio": 0.83, "plansTotal": 23, "plansWithCut": 19, "plansLegacy": 49, "advice": "..." }
```

- `plansTotal` = plans trong cửa sổ gate (mtime ≥ 2026-09-07). `plansLegacy` = plans bỏ qua. Tổng = 72 như cũ (kiểm chứng chéo).
- History entries cũ trong `scale.json` giữ nguyên (không rewrite lịch sử).

## States / a11y / responsive

- Không thêm interactive element → không thêm states. Row mới là `.part` như 3 rows cũ (contrast/aria kế thừa).
- 375px: rows stack sẵn (`.parts` grid 1 col) — không tràn (verify bằng spec 375px).
