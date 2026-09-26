# Upgrade Ideas — Clip dọc: bố cục · màu sắc · nội dung

> Audit 2 clip đã ship (`space-bunny-free`, `openai-hf-hack`) và **22 ý tưởng nâng cấp** theo chuẩn content creator chuyên nghiệp.
> Nguồn số liệu: safe zone 2026 (PostPlanify 01/2026 · RGBA 08/2026), hook/retention (RGBA 06/2026 — tổng hợp TTS Vibes · Retenssis · Hootsuite). Ngày audit: **26.09.2026**.
> Nhãn: `P1` = làm ngay clip tới · `P2` = nên làm trong 2-3 clip · `P3` = khi có series. Effort: S/M/L.

## 0. Audit nhanh 2 clip hiện có

| Hạng mục | space-bunny-free | openai-hf-hack | Kết luận |
|---|---|---|---|
| **Safe zone** (universal 900×1400: x 90–990, y 260–1660) | footer 1800/1850; content tới y≈1630; margin trái 84 | HUD y=60; eyebrow y=142; progress y=1800; footer y=1850; margin 60 | ❌ **Đuôi clip nằm trong vùng UI che** (TikTok che y>1600). Footer + progress **vô hình trên app**; eyebrow 142 bị che trên Reels (top dead 210) |
| **Frame 1** (cover, muted) | reveal chạy từ t=0 → khung đầu còn trống | glitch burst + reveal | ⚠️ Chưa phải cover hoàn chỉnh — feed autoplay muted cần chữ ngay khung đầu |
| **Phụ đề burned-in** | không có | không có | ❌ Người xem không mở tiếng mất toàn bộ nội dung |
| **Màu** | 6 accent + semantic rõ (green/amber/blue/orange) | 8 accent + semantic (cyan/red/amber/violet) | ✅ Semantic tốt — giữ; ⚠️ số accent đồng thời hơi nhiều, dễ loãng |
| **Nội dung** | hook ổn · ledger trung thực | hook mạnh ("Sandbox dỏm — hay agent nguy hiểm?") | ✅ — thiếu open loop đóng ở cuối + loop ending |
| **CTA** | câu hỏi 3 lựa chọn | VS panel + CTA box | ✅ Giữ format này |

**Chẩn đoán chung:** phần *kỹ thuật* (canvas, TTS, guard) đã tốt; phần *craft* chưa được chuẩn hoá → mỗi clip làm lại từ đầu và lỗi lặp (đuôi clip trong dead zone). 22 ý tưởng dưới đây lấp đúng khoảng đó.

---

## 1. Bố cục — 10 ý tưởng

| # | Ý tưởng | Vấn đề → Cách làm | Effort |
|---|---|---|---|
| L1 | **Safe-zone pass** (P1) | Footer/progress đang ở y 1800–1850 = bị TikTok/IG che. Chuyển: progress → y≈1596, footer → y≈1640, margin x 90–990. Mọi thứ *thiết yếu* nằm trong 900×1400 | S |
| L2 | **Frame 1 = cover** (P1) | Reveal từ t=0 để khung đầu trống. Sửa: vẽ trạng thái hook **hoàn chỉnh ở t=0** (reveal chạy từ t=-0.6s hoặc bỏ fade cho title), test ở 30% zoom + xem như thumbnail | S |
| L3 | **Phụ đề burned-in giữa khung** (P1) | Feed muted → không ai đọc được nội dung. Lấy text từ `voiceover-segments.json` (đã có timing), render 3–5 từ/dòng ở **middle-third** (y≈1250–1420), highlight từ khóa | M |
| L4 | **Dead zone thành "vùng chủ động"** (P1) | Đừng cố nhét gì vào đuôi — thiết kế đuôi là **nền tối sạch** để caption UI của app "nổi" trên đó; mọi thứ sống động dồn lên trên | S |
| L5 | **Branding vào safe zone** (P1) | "TIN AI · YUNIE" ở y 1850 = vô hình. Chuyển vào y≈1640 (trong safe) hoặc lên HUD đầu clip | S |
| L6 | **Z-pattern mỗi beat** (P2) | Mắt đi eyebrow → headline → visual → sub theo 1 đường, không nhảy 2 bên. Beat 3 (graph) hiện khá tốt — áp chuẩn cho mọi beat | S |
| L7 | **Progress bar có "chương"** (P2) | 50 đoạn phẳng → thêm vạch chia theo beat + tô đậm chương đang xem. Vẫn đặt trong safe (y≈1596) | S |
| L8 | **Pattern interrupt 2–3s** (P2) | Beat 3 dài 14s chỉ 1 bố cục → dễ rớt. Thêm ≥1 thay đổi lớn giữa beat (đảo panel, zoom, đổi trục) mỗi 2–3s | M |
| L9 | **Type scale tối thiểu** (P2) | Nhãn mono 22px đọc kém ở 375px. Chuẩn: nhãn ≥26 · sub 30–34 · headline 72–96 · tối đa 3 dòng headline | S |
| L10 | **Cover grid** (P3) | 3 mẫu cover (stack chữ / VS 2 panel / số liệu lớn) để grid profile có nhịp, không trùng một kiểu | M |

## 2. Màu sắc — 8 ý tưởng

| # | Ý tưởng | Vấn đề → Cách làm | Effort |
|---|---|---|---|
| C1 | **Brand kit cố định** (P1) | Nền `#04070d` + ink + **1 primary accent theo kênh (cyan)**; semantic set cố định: green=official/confirm · amber=claim/số liệu · blue=ledger/quy trình · red=critical · violet=đối tượng phụ. Mọi clip dùng chung → nhận diện kênh | S |
| C2 | **≤2 accent đồng thời** (P1) | 8 accent trong 1 khung = loãng. Tối đa 2 accent khác nghĩa/khung; còn lại ink/muted | S |
| C3 | **Contrast nền động** (P1) | Chữ trên code-rain/grid: đo contrast với **nền hiệu dụng** (không phải nền tĩnh) — <4.5:1 thì thêm scrim/panel; test ở brightness 30% | S |
| C4 | **Cover color pop** (P2) | Frame 1 dùng accent mạnh nhất (đỏ/cyan) trên nền tối → nổi trong grid + khớp frame cuối (loop) | S |
| C5 | **Mã màu theo loại beat** (P2) | Chuẩn hoá: hook=đỏ · số liệu=amber · xác nhận=green · quy trình=cyan · đối tượng=violet — giữ nguyên qua mọi clip | S |
| C6 | **Tỉ lệ 60-30-10** (P2) | 60% nền · 30% panel/ink · 10% accent. Clip hiện tại khá ổn — đưa vào checklist để không phá khi thêm hiệu ứng | S |
| C7 | **Danh sách đen AI-tell** (P3) | Không gradient tím mặc định, không glow hồng vô nghĩa, không rainbow >3 hue — clip hiện tại sạch, giữ vậy | S |
| C8 | **Loop màu** (P3) | Frame cuối quay về tông cover (đỏ/cyan) → não nhận ra vòng lặp, tăng rewatch | S |

## 3. Nội dung — 10 ý tưởng

| # | Ý tưởng | Vấn đề → Cách làm | Effort |
|---|---|---|---|
| N1 | **Hook portfolio** (P1) | Mỗi clip viết **3 hook** theo archetype (contrarian · mistake warning · list tease), chọn 1, giữ 2 làm caption/A/B. VD openai-hf: thêm "Điều 700 agent này làm mà chưa ai công bố" (curiosity gap) | S |
| N2 | **Subtitle = retention** (P1) | (Liên kết L3) muted viewer vẫn theo được — đo bằng completion chứ không cảm tính | M |
| N3 | **Open loop đóng cuối** (P1) | Beat 1 đặt câu hỏi (triad: Curiosity + Self-relevance + Promise), beat cuối **trả lời thẳng**. Hook ≤14 từ, 10–14 từ tốt nhất | S |
| N4 | **Escalation & độ dài beat** (P1) | Beat 2 (terminal 9s) hơi chậm — rút còn 6–7s hoặc thêm twist. Quy tắc: mỗi beat ≥ giá trị beat trước; beat không được "phẳng" >7s | S |
| N5 | **Retention benchmark** (P2) | <15s: 60–70% completion (viral 75%+); 15–30s: 50–60%; 30–60s: 40–50%; 60s+: ~30%. Clip 50s → mục tiêu ≥45–55%; first-3s giữ 85%+ ≈ 2.8× views. Ghi mục tiêu vào plan từ đầu | S |
| N6 | **Loop ending** (P2) | Câu cuối dẫn về câu đầu (match cut) → rewatch + vòng lặp. VD: "Sandbox dỏm — hay agent nguy hiểm?" → cuối "Vậy ai mới là thứ cần kiểm soát?" | S |
| N7 | **Script math tiếng Việt** (P2) | ~2.5–3 từ/giây. 50s → ≤150 từ; hook ≤14 từ; mỗi beat ≤ (số giây − 0.5) × 2.5 từ. Ghi budget thẳng vào `voiceover-segments.json` | S |
| N8 | **CTA cụ thể + ghim comment** (P2) | 1 CTA, 2–3 lựa chọn trả lời được (đã làm tốt ở space-bunny). Thêm: ghim comment lặp câu hỏi → kéo thảo luận | S |
| N9 | **Caption keyword-first** (P2) | Dòng đầu chứa keyword chính (TikTok search index đọc mạnh nhất), 5 hashtag (đã có trong `publish.md`) — chuẩn hoá thành template | S |
| N10 | **Series identity** (P3) | Đánh số "Hồ sơ AI #03" + HUD cố định + câu chốt thương hiệu cuối clip → thói quen theo dõi; nhịp đăng đều 2–3 clip/tuần | M |

---

## 4. Shortlist triển khai — 5 việc làm ngay (đã đóng gói vào skill/agent)

1. **Safe-zone pass + branding đúng chỗ** (L1, L4, L5) — nhanh nhất, sửa lỗi "vô hình" thật.
2. **Frame 1 = cover hoàn chỉnh** (L2, C4) — quyết định 3 giây đầu.
3. **Phụ đề burned-in từ segments** (L3, N2) — mở khoá toàn bộ tệp xem muted.
4. **Hook portfolio 3 phương án** (N1, N3) — hook là biến số testable rẻ nhất.
5. **Brand kit + semantic cố định** (C1, C5) — biến cái đang tốt thành hệ thống.

> 5 việc này nằm trong: skill `clip-craft` (references/layout.md · color.md · content.md) + agent `clip-director` (áp vào pipeline `video-clip`).

## 5. Nguồn

- Safe zone: [PostPlanify — Social Media Safe Zones 2026](https://postplanify.com/blog/social-media-safe-zones-2026-complete-guide) (01/2026) · [RGBA — Safe Zones Cheat Sheet](https://rgba.ai/blog/social-media-safe-zones) (08/2026)
- Hook & retention: [RGBA — The First 3 Seconds](https://rgba.ai/blog/the-first-3-seconds-why-videos-go-viral-or-die) (06/2026) — tổng hợp TTS Vibes · Retenssis · Hootsuite · Socialync
- Audit dựa trên: `.agent/plans/space-bunny-tiktok/design.md` · `.agent/plans/openai-hf-hack-tiktok/design.md` · `www/openai-hf-hack/index.html`

---
*Doc: upgrade-ideas — input cho skill `clip-craft` + agent `clip-director`. Số liệu nền tảng có thể đổi 3–5 lần/năm → re-verify trước khi dùng cho clip quan trọng.*
