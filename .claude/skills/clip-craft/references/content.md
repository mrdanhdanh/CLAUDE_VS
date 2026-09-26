# Content — Hook · cấu trúc · retention · script math · CTA & publish

> Quyết định sống còn nằm ở **3 giây đầu**: ~71% người xem quyết định ở/scroll trong 3 giây; video giữ 85%+ qua 3 giây đầu đạt ~2.8× views so với <60% (RGBA 06/2026).

## 1. Promise — 1 câu chốt trước khi viết

> "Sau clip này, **[người xem]** sẽ **[biết / làm được gì]** — trong **[thời lượng]**."

Không trả lời được → chưa bắt đầu viết. Promise này là thước đo mọi beat.

## 2. Hook — bộ ba 3 giây

| Thành phần | Câu hỏi kiểm | Ví dụ yếu → mạnh |
|---|---|---|
| **Curiosity** | Câu đầu có mở vòng lặp não muốn đóng? | "Hôm nay nói về AI" → "Điều 700 agent này làm mà chưa ai công bố" |
| **Self-relevance** | Người xem đích thấy "cho mình" trong 1 giây? | "Có một nghiên cứu mới" → "Nếu bạn đang dùng model miễn phí, cái này ảnh hưởng bạn" |
| **Promise** | Payoff nói rõ, đáng để xem hết? | "Cùng tìm hiểu nhé" → "Cuối clip bạn sẽ biết cách kiểm tra trước khi dùng" |

**Archetype** (mỗi clip viết ≥3, chọn 1, giữ 2 làm caption/A-B test):

| Archetype | Công thức | Ví dụ tiếng Việt |
|---|---|---|
| Contrarian | bác bỏ niềm tin phổ biến | "Sandbox dỏm — hay agent nguy hiểm?" |
| Mistake warning | cảnh báo lỗi đang mắc | "Nếu bạn dán prompt vào model ẩn danh, bạn đang mất dữ liệu" |
| List tease | N điều, con số cụ thể | "3 điều về vụ hack này mà báo chí bỏ qua" |
| Curiosity gap | thử X, kết quả bất ngờ | "Cho agent tự chạy 72 giờ — kết quả không ai ngờ" |
| In-media-res | mở ở khoảnh khắc kịch tính nhất | "Chuỗi link thứ 1 triệu vừa được chèn vào..." |

Luật: hook **10–14 từ** (nói vừa hết trong 3 giây) · có **visual hook** song song (frame 1 — xem layout.md §6) · **cấm throat-clearing** ("xin chào các bạn", "hôm nay mình sẽ...", logo sting).

## 3. Structure template (4 mẫu cho 30–60s)

| # | Template | Cấu trúc beat | Dùng cho |
|---|---|---|---|
| 1 | **Hồ sơ / Breakdown** | Hook (0–4) → Bối cảnh (4–12) → Cơ chế (12–28) → Phát hiện (28–40) → Kết + CTA (40–50) | tin/vụ việc (precedent: openai-hf-hack) |
| 2 | **Listicle** | Hook "N điều" (0–4) → item 1..N tăng dần độ hay (mỗi 6–10s) → recap + CTA | tips, tổng hợp |
| 3 | **Story / Timeline** | In-media-res (0–5) → bối cảnh → bước ngoặt → kết cục → bài học + CTA | kể chuyện, case study |
| 4 | **Myth vs Reality** | Myth (0–6) → "Nhưng..." → Reality + bằng chứng (→80%) → So-what + CTA | đính chính, quan điểm |

## 4. Retention engineering

- **Open loop**: mở ở hook, **đóng ở beat cuối** — đừng để người xem tự đoán kết.
- **Escalation**: mỗi beat ≥ giá trị beat trước; phát hiện mạnh nhất không đặt quá sớm.
- **Interrupt**: đổi visual mỗi 2–3s (layout/zoom/đảo panel) — beat >7s phẳng là bắt đầu rớt.
- **Payoff ở 70–80%** thời lượng; 20% cuối là kết + CTA + loop ending.
- **Loop ending**: câu cuối nối câu đầu (match cut) → rewatch.
- **Benchmark completion** (mục tiêu tối thiểu / viral):

| Độ dài | Chấp nhận | Viral |
|---|---|---|
| <15s | 60–70% | 75%+ (85%+ first-3s) |
| 15–30s | 50–60% | 65%+ |
| 30–60s | 40–50% | 55%+ |
| 60s+ | ~30%+ | — |

- Chọn độ dài = **câu chuyện ngắn nhất trả đủ promise**. TikTok viral bar ~70% completion (2026).

## 5. Script math tiếng Việt

- Tốc độ đọc tự nhiên: **2.5–3 từ/giây** (rõ, không nuốt chữ).
- Tổng từ ≤ `duration × 2.5` · hook ≤14 từ · mỗi beat ≤ `(giây beat − 0.5) × 2.5` từ.
- Ví dụ 50s → ≤125–150 từ; voice 35s hiện tại ≈ 90–100 từ → còn room, đừng nhồi.
- Ghi budget vào `voiceover-segments.json`; guard timing (video-clip) so khớp 2 bên.

## 6. Evidence & claim (nói được nguồn mới nói)

- Ledger A/B/C/D (xem color.md §3): A official · B cross-checked · C community · D rumor.
- 2 nguồn nói khác nhau → **nói cả hai** ("một bên ghi X, một bên nói Y") — không chốt hộ, không làm tròn lên.
- Trên hình: nhãn chữ + màu (OFFICIAL / CLAIM / CHƯA KIỂM CHỨNG) — không dùng màu đơn độc.
- Không có nguồn → hạ cấp hoặc cắt; không hy sinh uy tín cho 1 câu hook.

## 7. CTA · caption · hashtag

- **CTA**: 1 cái duy nhất, cụ thể, trả lời được — "Bạn thử task nào: sửa bug, đọc repo, hay ship feature?" (kèm trong safe zone cuối clip + caption + ghim comment).
- **Caption**: dòng 1 = keyword chính + hook phụ (TikTok search index đọc mạnh nhất); 3–6 dòng ngắn; 1 câu hỏi cuối.
- **Hashtag: đúng 5** — 1 niche rộng · 2 sub-niche · 1 branded · 1 nội dung; **đổi set mỗi clip**; tránh `#fyp` (chiếm slot, không tạo tín hiệu phân loại — chi tiết: `publish.md` của space-bunny).
- **Cover pick**: khung đọc được ở 30% zoom khi muted.
- **Giờ đăng**: theo lịch kênh, đều đặn; không đăng 2 clip sát nhau cùng chủ đề.

## 8. Series identity

- Đánh số tập ("Hồ sơ AI #03") + HUD cố định + câu chốt thương hiệu cuối clip.
- Nhịp 2–3 clip/tuần; mỗi clip 1 promise; chủ đề theo series để nuôi thói quen theo dõi.
- Tái dùng: clip cũ → cắt short #2 từ phần hay nhất (phải có hook riêng, không cắt thô).

## Sai lầm thường gặp

- ❌ Throat-clearing, logo sting, "xin chào" trong 3 giây đầu
- ❌ Hook không promise / promise không trả được ở cuối
- ❌ Nhồi quá từ (vượt budget) → voice gấp, guard timing fail
- ❌ Claim không nhãn, chốt hộ khi 2 nguồn lệch
- ❌ Nhiều CTA hoặc CTA chung chung ("like & follow nhé")
- ❌ Caption không có keyword; hashtag trùng set mọi clip

## Checklist nội dung

- [ ] Promise 1 câu; hook 3 phương án (10–14 từ, đủ bộ ba)?
- [ ] Cấu trúc theo 1 trong 4 template; open loop đóng ở cuối?
- [ ] Mỗi beat ≥ trước; interrupt 2–3s; payoff 70–80%?
- [ ] Script trong budget từ (×2.5/giây)?
- [ ] Claim có nhãn A/B/C/D; 2 nguồn lệch → nói cả hai?
- [ ] 1 CTA cụ thể; caption keyword-first; 5 hashtag mới?
- [ ] Loop ending nối về đầu?

---
*Reference của skill clip-craft. Nguồn hook/retention: RGBA 06/2026 (link trong upgrade-ideas.md §5).*
