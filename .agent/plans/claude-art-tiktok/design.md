# Design — Clip "Claude tự tìm ra enzyme mới" (storyboard 50s)

## Tokens (một object `C` duy nhất trong index.html — guard quét key thiếu)

| Token | Hex | Dùng cho |
|---|---|---|
| `bg` | `#060b14` | nền (navy đậm) |
| `panel` | `#0e1a2a` | card/panel |
| `panel2` | `#142336` | panel phụ |
| `ink` | `#f2f7ff` | chữ chính |
| `muted` | `#9fb0c8` | chữ phụ |
| `teal` | `#5eead4` | sinh học / hook |
| `green` | `#4ade80` | số liệu chính |
| `purple` | `#a78bfa` | CRISPR / ART |
| `orange` | `#fb923c` | caveat |
| `blue` | `#60a5fa` | pipeline |
| `yellow` | `#fbbf24` | nhấn số |
| `pink` | `#f472b6` | chi tiết nhỏ |
| `line` | `#24364f` | divider |
| `white` | `#ffffff` | trắng |

**Palette 4 màu chủ đạo:** navy nền + teal (sinh học) + purple (CRISPR/ART) + orange (caveat). Đạt contrast ≥4.5:1 trên nền tối (ink `#f2f7ff` trên `#060b14` ≈ 15:1; muted `#9fb0c8` ≈ 7:1).

## Typography

- Tiêu đề: Arial/`Segoe UI` 800 (hệ thống, không tải font ngoài — tránh script-blocking KN-029)
- Số liệu & eyebrow: `Consolas`/monospace (tạo cảm giác "lab log")
- Cỡ: eyebrow 25 · title 84–96 · sub 30 · panel label 22

## Beat storyboard (5 beat · 50s)

| Beat | Giây | Eyebrow | Nội dung hình | Motion |
|---|---|---|---|---|
| 1 · HOOK | 0–5 | `SINH HỌC × AI` | DNA double helix vẽ bằng 2 sine + rungs, sáng dần; tiêu đề lớn | helix trôi + glow teal |
| 2 · CUỘC SĂN | 5–14 | `01 · CUỘC SĂN` | 3 stat cell: **950 agents** / **21 giờ** / **210M token** (số đếm nảy) | counter ease-out |
| 3 · PHÁT HIỆN | 14–28 | `02 · PHÁT HIỆN` | Funnel: 200.000 → 3.500 → 20 (3 thanh dài ngắn dần) + diagram ART: `[RT][gene][▮▮▮▮]` kiểu CRISPR | bar grow theo beat, diagram pulse |
| 4 · NÓI RÕ | 28–39 | `03 · NÓI RÕ` | 3 dòng caveat có icon: chức năng chưa rõ / lab do người / Anthropic tự công bố | row fade-in lệch nhịp |
| 5 · KẾT | 39–50 | `KẾT` | Quote Feng Zhang + CTA câu hỏi + nguồn | quote scale nhẹ |

**Nguồn cố định:** `NGUỒN: ANTHROPIC · 23/09/2026` góc phải dưới mọi khung (label D).

## Quy tắc motion

- 150–300ms cảm giác (ease-out cubic), không giật; mọi thứ **suy ra từ `t`** (không state tích lũy).
- `freeze` để render capture (contract `window.__clip`).
- Không animation vòng lặp vô hạn gây nhức mắt (glow nhẹ là đủ).

## A11y

- Canvas có `role="img"` + `aria-label`; thêm `<h1 class="sr">` cho screen reader.
- Tương phản chữ/nền đạt chuẩn; không dùng màu làm phương tiện duy nhất (số liệu luôn kèm nhãn chữ).

## Contract

```js
window.__clip = { duration: 50, width: 1080, height: 1920, draw, beats, freeze: false }
```
`beats[i].at/end` **khớp 1-1** `segments` trong `voiceover-segments.json` (guard timing so 2 bên).
