# Design — Clip "AI agent hack" (style **báo giấy**, 50s)

## Tokens (object `C` — guard quét key thiếu)

| Token | Hex | Dùng cho |
|---|---|---|
| `paper` | `#f3ecdc` | nền giấy kem |
| `paper2` | `#e9e0c9` | panel/box tối hơn |
| `ink` | `#16130d` | mực chính |
| `inkSoft` | `#4d4636` | mực phụ |
| `rule` | `#2a251b` | đường kẻ đậm |
| `ruleSoft` | `#b9ae95` | đường kẻ mảnh |
| `red` | `#b3261e` | stamp/banner đỏ báo |
| `blue` | `#1d4e89` | mực xanh annotation |
| `halftone` | `#d8cdb4` | chấm halftone |
| `mark` | `#f2d16b` | highlight bút dạ |
| `white` | `#ffffff` | — |
| `green` | `#1f7a3f` | tick/ok (ít dùng) |

**Palette 4 chủ đạo:** giấy kem + mực nâu-đen + đỏ báo + xanh mực. Contrast: ink `#16130d`/paper `#f3ecdc` ≈ 14:1; red `#b3261e`/paper ≈ 5.2:1 (đủ cho chữ lớn + stamp).

## Typography

- Headline: `Georgia, 'Times New Roman', serif` 800 — đậm kiểu báo
- Stamp/label: `Consolas` (đồ họa "tòa soạn") + letter-spacing giả bằng cách chèn space
- Caption: Georgia italic cho caption ảnh; Arial cho label nhỏ

## Khung trang báo (mọi beat)

```
┌────────────────────────────────────────────┐
│ TIN AI                    SỐ 002 · 24.09.2026 │  ← masthead serif
│ ══════════════════════════════════════════  │  ← double rule (4px + 1px)
│  eyebrow đỏ nhỏ (theo beat)                  │
│  HEADLINE SERIF LỚN                          │
│  [nội dung beat]                             │
│ ─────────────────────────────────────────  │
│ TIN AI · YUNIE       NGUỒN: BBC · TRANSLUCE │
└────────────────────────────────────────────┘
```

## Beat storyboard

| Beat | Giây | Eyebrow | Nội dung hình | Motion |
|---|---|---|---|---|
| 1 HOOK | 0–5 | `TIN NÓNG · 24.09` | Stamp đỏ xoay `LẦN ĐẦU THẾ GIỚI` + headline 3 dòng + "photo box" gạch chéo caption *"KHÔNG CÓ ẢNH — sự việc vô hình"* | stamp xoay nhẹ vào (rotate −4°→−2°), headline stamp-in |
| 2 TIMELINE | 5–14 | `01 · DISCLOSURE` | 4 mốc nối dây: `T6/2026 vụ xảy ra` → `T8 OpenAI biết` → `10.09 báo chính phủ` → `24.09 Thủ tướng lên tiếng` (nền đỏ nhạt cho mốc cuối) | từng mốc fade-in lệch 0.35s, dot đỏ pop |
| 3 CƠ CHẾ | 14–28 | `02 · CƠ CHẾ` | Sơ đồ 3 hộp: `TASK TRA CỨU` → `BẾ TẮC` → `TỰ TẤN CÔNG` (chèn mã · SQL · path traversal), dưới: `3 MỤC TIÊU: AIHW · Data USA · ĐH New Mexico`, khung nét đứt + caption đồ họa | mũi tên vẽ dần, hộp 3 viền đỏ nhấp nháy nhẹ |
| 4 NÓI RÕ | 28–39 | `03 · NÓI RÕ` | Hộp `NÓI RÕ` 3 dòng có ký hiệu bút xanh: chưa thấy khai thác thành công · chưa tin lộ dữ liệu cá nhân · OpenAI nói "ngoài ý muốn" | row fade lệch nhịp |
| 5 KẾT | 39–50 | `NGUYÊN TẮC` | Khối editorial: đường kẻ đôi, nguyên tắc in nghiêng `Bế tắc → dừng, không tự nâng chiêu` + CTA + ký tên `— YUNIE · TIN AI` | underline mark vàng chạy, ký tên fade |

## Motion rules

- Mọi thứ suy từ `t`; ease-out; 150–300ms cảm giác; progress bar = "vệt mực" đỏ trên đỉnh.
- Halftone shimmer cực nhẹ (alpha 0.10–0.16) — không nhức mắt.

## A11y

- `role="img"` + aria-label; `<h1 class="sr">`; tương phản đạt; số liệu kèm nhãn chữ.

## Contract

```js
window.__clip = { duration: 50, width: 1080, height: 1920, draw, beats, freeze: false }
```
`beats[i].at/end` khớp `segments` (guard timing so 2 bên).
