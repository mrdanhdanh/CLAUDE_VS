# Layout — Safe zone · lưới dọc · type scale · motion

> Số liệu 2026 từ 2 nguồn độc lập (lệch nhau → dùng nguồn bảo thủ hơn): PostPlanify 01/2026 · RGBA 08/2026. Re-verify trước clip quan trọng.

## 1. Safe zone 2026

**Nguyên tắc:** upload 1080×1920, nhưng **thiết kế theo hộp 900×1400 giữa khung** → 1 file chạy mọi nền tảng.

| Nền tảng | Safe (giữa) | Top che | Bottom che | Phải che | Trái |
|---|---|---|---|---|---|
| TikTok | 900×1492 | 108 (profile) | 320 (caption; ads 370) | 120 (action rail) | 60 |
| Instagram Reels | 996×1400 | 210 | 310 | 84 | ~60 |
| YouTube Shorts | 984×1500 | 120 (mở mô tả: 360) | 300 | 96 | ~60 |
| Facebook Reels | 1080×1520 | 100 | 300 | 60 | ~60 |

> ⚠️ RGBA (bảo thủ hơn): TikTok bottom ~400 · Reels bottom ~420–500 · Shorts 350–400; universal box vẫn là **900×1400**.
> Biến số khác: caption dài 250–350px · device notch 30–50px · quảng cáo +50–80px · UI đổi 3–5 lần/năm.

**Hệ quả thực dụng (đã từng sai):** footer/progress ở y 1800–1852 = **vô hình trên app**; eyebrow y 142 bị che trên Reels. Branding + thông tin phải nằm trong hộp an toàn.

## 2. Lưới dọc chuẩn (1080×1920)

```
  y 60–108   HUD decor: REC · case id · clock        (trang trí — có thể bị che)
  y 260–330  EYEBROW / kicker (mono, màu theo beat)  ← bắt đầu vùng thiết yếu
  y 340–640  HEADLINE (2–3 dòng, 72–96px)
  y ~700     SUB (đặt động theo wrap(), tối đa 2 dòng)
  y 660–1540 VÙNG NỘI DUNG theo beat (visual chính)
  y 1200–1450 SUBTITLE overlay (burned-in, scrim riêng) — đè lên nội dung
  y 1596      PROGRESS bar (8px, có vạch chia beat)
  y ~1640     FOOTER: brand + date
  ───────────  y 1660 = đáy hộp an toàn — DƯỚI ĐÂY KHÔNG ĐẶT GÌ THIẾT YẾU  ───────────
  x 90–990    = hộp an toàn ngang (margin trái 90, phải 90)
```

- Không bao giờ đặt text/CTA/logo ở **tam giác chết**: đáy y>1660 · phải x>990 · mép trái x<90.
- Đuôi clip (y>1660) thiết kế là **nền tối sạch** — caption UI của app nổi lên trên đó.

## 3. Type scale (đọc được ở 375px + brightness 30%)

| Vai | Font | Size | Weight | Tối đa |
|---|---|---|---|---|
| HUD/labels (trang trí) | Consolas | 22–24 | 700 | 1 dòng |
| Eyebrow / kicker | Consolas | 26–28 | 700 | 1 dòng |
| Headline | Arial / Segoe UI | 72–96 | 800 | 3 dòng |
| Sub | Segoe UI | 30–34 | 500–600 | 2 dòng |
| Data/mono body | Consolas | 26–30 | 600 | — |
| **Subtitle (burned-in)** | Segoe UI | **44–52** | 700 | 2 dòng · 3–5 từ/dòng |
| CTA | Segoe UI | 36–44 | 700 | 2 dòng |
| Footer/brand | Consolas | 24 | 700 | 1 dòng |

Quy tắc: headline 1.06–1.15 line-height · câu ngắn > chữ nhỏ · all-caps chỉ dùng cho eyebrow/nhãn (tiếng Việt nhiều dấu, all-caps dài khó đọc).

## 4. Text trên nền động (bắt buộc)

- Chữ quan trọng **không bao giờ** đặt trực tiếp trên nền animation → dùng 1 trong 3: **panel** (đặc), **scrim** (rgba đen 0.55–0.75), **chip**.
- Đo contrast với **nền hiệu dụng** (nền + hiệu ứng tại khung xấu nhất), không phải nền tĩnh.
- Subtitle cần scrim riêng + highlight từ khóa — không tin vào "chữ trắng là đủ".
- Test: 30% brightness · 375px · zoom 30% (nhìn như thumbnail).

## 5. Motion rhythm

| Quy tắc | Giá trị |
|---|---|
| Reveal | 0.3–0.6s ease-out; translate ≤24px hoặc scale 0.96→1 |
| Hold trước element kế | ≥1s |
| Pattern interrupt | mỗi **2–3s** đổi lớn (layout/zoom/panel); không khung nào đứng >3s |
| Animation đồng thời | ≤2; stagger list 0.3–0.4s |
| Transition | cut > hiệu ứng cầu kỳ; nếu dùng thì ≤0.3s |
| Độ dài beat | 3–10s; beat >7s phải có twist giữa beat |
| Loop ending | câu/khung cuối nối về mở đầu (match cut) → tăng rewatch |
| Reduced-motion | giữ fade, bỏ typing/zoom/parallax |

## 6. Cover frame (3 mẫu + test)

| Mẫu | Cấu trúc | Dùng khi |
|---|---|---|
| **Stack** | eyebrow + headline + 1 dòng promise | tin tức / breakdown |
| **VS** | 2 panel đối đầu + dấu ? | so sánh / tranh luận |
| **Số liệu** | 1 con số lớn + nhãn nhỏ | listicle / stat shock |

Test: ở t=0 phải là cover **hoàn chỉnh** (reveal bắt đầu từ t<0 hoặc ≤0.2s) — không fade từ đen, không logo sting. Nhìn 1 giây ở 30% zoom: đọc được? muốn dừng lại?

## 7. Sai lầm thường gặp

- ❌ Caption/CTA/logo ở y>1660 hoặc x>990 → bị UI che (đã từng xảy ra 2 clip)
- ❌ Fade-in từ đen ở đầu clip → mất 3 giây vàng
- ❌ Headline quá 3 dòng / sub quá 2 dòng
- ❌ >2 animation đồng thời hoặc interrupt quá dày → rối
- ❌ Chữ trên nền động không scrim khiến khung xấu nhất không đọc được
- ❌ Quên test muted + 30% zoom

## Checklist layout

- [ ] Mọi thứ thiết yếu trong 900×1400; tam giác chết trống
- [ ] Đuôi clip là nền tối sạch (cho caption UI)
- [ ] Type scale đúng bảng §3; subtitle 44–52px
- [ ] Text trên nền động có panel/scrim; đo nền hiệu dụng
- [ ] Interrupt 2–3s; beat ≤7s phẳng
- [ ] t=0 là cover hoàn chỉnh; test 30% zoom + muted

---
*Reference của skill clip-craft. Nguồn: PostPlanify 01/2026 · RGBA 08/2026 (link trong upgrade-ideas.md §5).*
