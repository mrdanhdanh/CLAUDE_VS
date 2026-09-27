# Publish — clip "ĐỌC VỊ · ADS" (Agentic Data Stack) · 50s

## File

- MP4: `www/Clip/agentic-data-stack/agentic-data-stack-50s.mp4` (13MB · 1080×1920 · 30fps · Hải Đăng)
- Voiceover WAV: `voiceover-hai-dang-50s.wav` · Voiceover segments: `voiceover-segments.json`
- Cover đề xuất: khung **t≈3.1s** (dấu "✓ CHẠY THÀNH CÔNG" + ô đỏ "1,28 tỷ") — đã verify đọc được khi muted.

## Caption (keyword-first — TikTok search đọc dòng 1 mạnh nhất)

```
AI viết SQL giờ rẻ gần như miễn phí — nhưng thứ đắt nhất lại là cái không ai viết hộ bạn: context, kiểm chứng, trách nhiệm.

Bài mới trên HackerNoon: người dùng của data platform đang đổi — từ con người sang agent. Cú lỗi nguy hiểm nhất không phải AI viết sai, mà là nó chạy SAI ngay trong production mà không ai chặn.

5 tầng agentic data stack + 7 cổng kiểm soát, gói trong 50 giây ⬇️

Team bạn bắt đầu từ đâu: context, skill, hay policy?
```

## Caption A/B (đổi dòng 1 — test 2 phiên bản)

- A/B #1 (curiosity gap): "AI viết SQL xong trong 5 giây. Nhưng không ai trả lời được câu hỏi này…"
- A/B #2 (in-media-res): "Doanh thu báo cáo lệch — nguyên nhân: một câu SQL chuẩn cú pháp." *(kịch bản giả định minh hoạ — không lên hình)*

## Hashtag — 3 set, mỗi set đúng 5 (đổi set mỗi clip, KHÔNG dùng #fyp)

- **Set A (default):** #DataEngineering #AgenticAI #HarnessEngineering #ModernDataStack #YUNIE
- **Set B (dev VN):** #DataEngineer #SQL #AIAgent #KienTrucDuLieu #YUNIE
- **Set C (platform/ops):** #DataPlatform #DataOps #AIGovernance #LapTrinh #YUNIE

## Giờ đăng / lịch

- Theo lịch kênh. **Không đăng sát clip ĐỌC VỊ khác cùng chủ đề HackerNoon trong cùng ngày** — cách ≥1 ngày.
- Reply comment ghim: CTA "Team bạn bắt đầu từ đâu: context, skill, hay policy?"

## Checklist trước khi đăng

- [x] `verify-frames.mjs` pass + đã xem 8+ ảnh từng beat (2 vòng — bắt 4 lỗi wrap + 1 lỗi con dấu che label)
- [x] `verify-perf.mjs` pass (command avg 4.88ms · interval p95 17.9ms ≈ 55fps)
- [x] `verify-audio.mjs` pass trên WAV **và** MP4 (peak 0.96 · rms 0.097)
- [x] Guard timing TTS pass (0 đoạn tràn — rev 2 sau khi trim 03/05)
- [x] Voiceover 48.96s ≤ 50s (im lặng đuôi an toàn)
- [x] Claim có nhãn: bài gốc là opinion + AI-assisted → footer "HACKERNOON · QUAN ĐIỂM" + credit tác giả trên hình
- [x] Không footage AI
- [x] `verify-mp4.mjs` spot-check 3 khung thật trong MP4 (không khung trống)
- [x] 1 CTA duy nhất, nằm trong safe zone + caption
- [ ] Xem lại toàn clip như người lạ (muted, 30% zoom) — để người duyệt lần cuối trước khi đăng

## Ghi chú sản xuất

- Layout convention kế thừa series (safe zone 900×1400, HUD/progress/subtitle như clip ĐỌC VỊ trước).
- `verify-mp4.mjs` là guard MỚI của clip này (chống khung đen chỉ lộ ra trong file MP4) — dùng lại được: `node verify-mp4.mjs --video=<file> --marks=...`
