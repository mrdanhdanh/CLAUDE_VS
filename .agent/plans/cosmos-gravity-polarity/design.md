# Design — Gravity polarity (mini)

> Vibe giữ nguyên (cosmos dark). Không thêm class, không đổi layout — chỉ đảo mapping class sẵn.

## Mapping mới

| G level (JSON, không đổi) | Ý nghĩa | Badge `scale.html` | Tile `index.html` observatory |
|---|---|---|---|
| `high` (≥6) | Tốt — scope kiểm soát tốt | `gauge-level low` (xanh `#6ee7b7`) | `de-stat` thường (trắng, không `warn`/`hot`) |
| `medium` (3–5) | Trung bình | `gauge-level medium` (vàng) | `warn` (vàng) |
| `low` (<3) | Xấu — scope phình | `gauge-level high` (đỏ `#fca5a5`) | `hot` (đỏ) |

## Code change

- `scale.html` (~dòng 512): `gBadge.className='gauge-level '+(gr.level==='high'?'low':gr.level==='low'?'high':'medium')` + comment lý do polarity đảo (G cao=tốt, ngược S/D/M).
- `index.html` `renderScale` (~dòng 3913): Gravity tile class `${Gv==null?'':Gv>=6?'':Gv>=3?'warn':'hot'}` + text level giữ nguyên chữ (`high/medium/low` trong `<small>` không đổi — chỉ màu đổi).
- Fallback `G=null` (chưa đo): giữ `G=—` như cũ ở cả 2 nơi.

## States / a11y / responsive

- Không thêm element tương tác → không thêm states. Contrast xanh/đỏ trên nền tối đã đạt ở badge hiện tại (reuse).
- 375px: không đổi layout (chỉ đổi class) — verify bằng spec viewport 375.
