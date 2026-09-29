# Design — Series "Tin AI hôm nay" (Deep Console)

## 1. Token dùng chung (đồng bộ clip `openai-hf-hack` — giữ nhận diện kênh)

```
bg0 #04070d · bg1 #081120 · panel #0d1830 · panel2 #122040 · line #24365c
ink #eef4ff · muted #93a7cc · dim #5f7396
accent kênh: cyan #4fe3e0 (liều nhỏ ~10%)
```

**Semantic cố định (không đổi nghĩa giữa các clip):**

| Màu | Nghĩa | Dùng ở |
|-----|-------|--------|
| đỏ `#ff5d73` | rủi ro / hoãn / hành vi nguy hiểm | stamp HOÃN, hàng severity, panel "chưa rõ ngày" |
| xanh `#5dfc9b` | official / đã ra / xác nhận | lưới Sol, panel "dùng được ngay", điểm số tăng |
| amber `#ffc857` | số liệu + nguồn báo | chip nguồn, số lớn, metric |
| tím `#b18cff` | nguồn thứ ba / riêng tư cá nhân | thẻ AISI (clip 1), thẻ privacy (clip 2) |

Luật: ≤2 màu nhấn nội dung/khung · 60–30–10 (nền/panel+chữ/accent) · **luôn kèm chữ** cho trạng thái màu (mù màu vẫn đọc được) · không AI-tell (gradient tím, glow vô nghĩa, rainbow).

## 2. Type scale (canvas 1080×1920)

| Vai | Size | Ghi chú |
|-----|------|---------|
| eyebrow (mono) | 25 | uppercase, tracking nhẹ |
| title | 88–96 | tối đa 2 dòng, line-height 1.02 |
| sub | 30 | muted |
| panel label (mono) | 22 | uppercase |
| số lớn | 96–120 | tabular, 1 số/dòng |
| footer | 17–20 | dim |

**Font:** `Segoe UI` / `Arial` (KHÔNG Georgia — vỡ dấu tiếng Việt, KN-082). Không dùng font tải ngoài.

## 3. Safe zone & lưới

- Vùng thiết yếu: **x 90–990 · y 260–1660** (safe zone TikTok 2026).
- Vùng nội dung chính: y 690–1630; footer ở y 1850 (chỉ nhãn phụ, không info).
- Lề trái 84–90. Mỗi khung: **1 headline + 1 sub/panel** (luật "một khung = một thông điệp").

## 4. Motion

- Reveal 0.3–0.6s ease-out, translate ≤24px hoặc scale 0.96→1; hold ≥1s; **≤2 animation đồng thời**.
- Chuyển beat = **cut** (không transition cầu kỳ). Pattern interrupt mỗi 2–3s.
- Beat >7s phải có twist nội bộ (2 hàng / số lớn / thẻ mới).
- **Loop ending:** frame cuối quay về tông + layout cover để xem lại liền mạch.
- Reduced-motion: giữ fade, bỏ hiệu ứng động mạnh.

## 5. Perf constraints (KN-083 — bắt buộc)

- Bake nền tĩnh + stamp + lưới thành **texture 1 lần** (OffscreenCanvas/canvas phụ), không vẽ lại gradient toàn màn hình mỗi khung.
- Cache layout chữ (đo `measureText` một lần, lưu mảng dòng).
- `getContext('2d', { alpha: false })`; hạn chế >100 `fillText`/khung.
- Mọi thứ **suy ra từ `t`** (không state tích lũy) — guard chụp khung ở giây bất kỳ phải ra đúng hình.

## 6. Visual concept từng clip

| Clip | Concept | Hình ảnh chủ đạo |
|------|---------|------------------|
| `openai-astra` | **Hồ sơ / breakdown** | stamp đỏ `HOÃN` đóng xuống, 2 hàng severity trượt vào, thẻ "danh tính giả", lưới 5 thông số Sol, panel VS chart |
| `meta-muse` | **Rò rỉ** | khung chat đọc địa chỉ, thẻ tin bán hàng, cửa nhà + bóng người, số lớn `3.000.000`, thẻ caveat gạch chéo |
| `sonnet-55` | **Bảng đo** | khung màn hình 8-bit + chấm pixel, thanh so sánh `10,3%` vs `70,6%`, thẻ giá `$2`, khiên an ninh |

## 7. File map

```
www/Clip/openai-astra/   index.html · voiceover-segments.json · render.mjs · tts-vieneu.py · verify-*.mjs
www/Clip/meta-muse/      (idem)
www/Clip/sonnet-55/      (idem)
.agent/plans/news-clips-2026-09-30/  prd.md · design.md · plan.md · craft-openai-astra.md · spec-meta-muse.md · spec-sonnet-55.md · claims-openai-astra.md · publish-*.md
```
