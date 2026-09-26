# AI B-roll Sources — chọn tool, free tier, pattern ghép segment

> Dùng khi clip cần **footage ngoài canvas** (cảnh thật, người, b-roll) thay vì chỉ vẽ bằng code.
> Nguồn: last30days run **26/09/2026**, window 27/08→26/09 (Reddit 17 · YouTube 7 · HN 14) — raw: `~/Documents/Last30Days/ai-video-generation-tools-raw.md`.
> ⚠️ Số liệu giá/credits là **ảnh chụp 09/2026** do cộng đồng test — **re-verify trước khi trả tiền**. Nhãn: `[community-claim]` · `[official]` · `[hypothesis]`.

## 1. Khi nào dùng AI footage vs canvas thuần

| Tình huống | Chọn |
|---|---|
| Chữ / số liệu / UI / diagram là nhân vật chính | **Canvas thuần** (pipeline hiện tại) — footage chỉ làm nền mờ nếu cần |
| Cần cảnh "thật" (thiên nhiên, thành phố, người, sản phẩm) mà canvas không fake nổi | **AI footage** cho 1–2 beat b-roll, giữ text ở layer canvas |
| Beat cần độ chính xác (claim, số liệu, so sánh) | **Canvas** — không để AI vẽ chữ/số (sai âm thầm, mất uy tín) |
| Clip về người thật / người nổi tiếng | **Không làm nếu chưa có phép** — xem §6 |

## 2. Tool + free tier (chụp 09/2026)

| Tool | Loại | Free tier | Ghi chú |
|---|---|---|---|
| **Seedance 2.5** (ByteDance) | Qua tool trung gian | — | Tên được cộng đồng chọn nhiều nhất tháng này; ổn định nhất ở text-to-video `[community-claim]` |
| **Wan 2.x** (Alibaba) | Local (ComfyUI) | Free (GPU ≥16GB VRAM) | Dựng clip dài bằng segment 2s — xem §4 `[community-claim]` |
| **FramePack** (qua Pinokio) | Local, image-to-video | Free | 1–120s, **không audio**, dễ cài nhất cho i2v `[community-claim]` |
| **Google: Veo 3.1 / Omni Flash** | Web | ~10 video/tháng mỗi account, không lưu vĩnh viễn | Veo 3.1 cho clip dài, Omni Flash cho clip ngắn `[community-claim]` |
| **Kling** (kling.ai) | Web | 66 credits khi đăng nhập; 5s/720p = 45 credits | ≈1 video free để test `[community-claim]` |
| **Hailuo** (haloai.video) | Web | Credits refresh hằng ngày; cap 6s/720p + watermark | Test nhanh trước khi trả tiền `[community-claim]` |
| **Pruna** | Web | Claim: free 20s/1080p có audio, không cần đăng ký | Chưa kiểm chứng độc lập `[community-claim]` |
| **DomoAI** | Web | — | Giữ nét asset gốc khi stylize `[community-claim]` |

> Nhiều video "best free tool" trên YouTube là **affiliate** (Higgsfield…) — đọc kỹ trước khi tin. Clip ngắn: free tier đều giới hạn giây + watermark.

## 3. Checklist free tier — test trước khi trả tiền

- [ ] Xác định đúng 1–2 beat cần footage (không phải cả clip) → giảm số lần generate.
- [ ] Chạy **cùng 1 prompt + 1 ảnh tham chiếu** trên ≥2 free tier — so chất lượng thật, không so quảng cáo.
- [ ] Ghi lại giới hạn: số giây / độ phân giải / watermark / có audio không.
- [ ] Chỉ trả tiền khi prompt đã đạt trên free tier — không trả tiền để đi tìm prompt.
- [ ] Máy có GPU ≥16GB VRAM → cân nhắc local (Wan / FramePack) trước khi mua subscription.

## 4. Pattern "segment ngắn + ghép" (cách cộng đồng làm clip dài)

1. **Đừng generate clip dài 1 phát** — model giữ ổn định ~2–10s; dài hơn tự cắt lỗi. `[community-claim]` r/comfyui 17/09: dựng animation 11s từ segment **2 giây** (Wan 2.2) trên RTX 5060 Ti 16GB — "mục tiêu không còn là video hoàn hảo trong 1 lần generate".
2. **Mỗi segment = 1 hành động** — prompt 1 chuyển động duy nhất/segment.
3. **Ghép là phần khó nhất** (r/comfyui: "AI video stuck at 10s"): đổi tiêu cự/ánh sáng giữa 2 segment → optical flow gãy. Giữ cùng góc máy + cùng ánh sáng + cắt ở điểm chuyển động chậm.
4. **Ghép ở đâu:** editor ngoài (CapCut/DaVinci) hoặc để beat canvas phủ text lên trên — pipeline này **không stitch video** (non-goal).

## 5. Tích hợp vào pipeline canvas `[hypothesis — chưa test]`

- Thêm `<video muted loop playsinline>` ẩn; trong `draw(t)` dùng `ctx.drawImage(videoEl, …)` với math cover-fit (như ảnh). `render.mjs` capture **real-time** (rAF + MediaRecorder) → video chạy theo thời gian thực, khớp tự nhiên; set `video.loop = true` nếu video ngắn hơn beat.
- **Caveat guard:** `draw(t)` mất tính "suy ra mọi thứ từ `t`" — `verify-frames.mjs` chụp ở giây t **không seek được video** (async). Chữ/số liệu vẫn đúng; frame video có thể lệch → giữ mọi thông tin quan trọng ở layer canvas, PNG chỉ verify layer đó.
- **Caveat audio:** luôn `muted` — audio clip là TTS theo beat, không trộn.
- **Caveat timing:** chọn segment ≤ độ dài beat (pattern §4 vốn đã là segment ngắn) — không kéo dài bằng CSS/JS.
- Verify ở clip đầu tiên dùng: chạy `verify-frames` + xem MP4 thật. Nếu lệch nhiều → hướng nâng cấp tương lai: chuyển video thành chuỗi ảnh (chưa làm — YAGNI).

## 6. Nền tảng + đạo đức

- **IG tự gắn nhãn "AI Info" lên Reels và làm tụt reach** `[community-claim]` r/SocialMediaMarketing 22/09 — detection nhạy với cả nội dung không thuần AI. Kế hoạch: coi nhãn AI là bình thường (minh bạch), để giá trị nằm ở nội dung; **KHÔNG strip metadata để né nhãn**.
- **Người thật:** không dựng clip AI về người thật / người nổi tiếng khi chưa có phép — HN 22/09 (96pts): con gái Robin Williams kêu gọi fan "Have Some Shame".
- **Cơ hội:** brand vẫn thuê editor AI video (skincare €80/video) · Upwork ~4.8k job "AI-generated video" `[community-claim]`.

## 7. Nguồn

- Run: last30days v3.25.0 · 26/09/2026 — raw `~/Documents/Last30Days/ai-video-generation-tools-raw.md` (Reddit 17 · YouTube 7 · HN 14 · Jobs 5).
- YouTube đáng xem: Youri van Hofwegen — "Best FREE AI Video Generators 2026 (Backed By Data)" (167K views, 13/09) · "I Tried Google's FREE AI Video Generators" (16/09) · Malva AI (23–25/09).
- **Date-stamp: 26/09/2026** — giá/credits đổi vài tuần/lần → re-verify trước khi dùng cho clip quan trọng.

---
*Reference: video-clip · sinh từ research run 26/09/2026 · nhãn provenance theo KN-075.*
