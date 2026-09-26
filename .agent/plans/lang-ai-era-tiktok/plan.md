# Plan — Clip 50s "Cha đẻ Elixir: AI viết code — ngôn ngữ cho ai?" (rev 2)

**Slug:** `www/lang-ai-era/` · **Plan:** `.agent/plans/lang-ai-era-tiktok/` · **Voice:** Hải Đăng · **50s · 7 beat**

## Todos

1. ✅ Research + evidence ledger (label A; framing "ý kiến" theo KN-052)
2. ✅ PRD: hook portfolio (chọn H2) + beat sheet + script 80 từ + rubric C1–C9
3. ✅ Design: tokens SYNTAX ATLAS + 8 nâng cấp + layout safe-zone + storyboard
4. ✅ Scaffold `www/lang-ai-era/` (copy render/verify/tts từ `openai-hf-hack`)
5. ✅ Build `index.html`: beats 5 · subs 6 · tokens C · draw(t) deterministic
6. ✅ `verify-frames.mjs` → xem ảnh từng beat → fix 1 lỗi (card title 32px=295px > maxW 248 → wrap đè sub; fix: 26px 1 dòng, đo lại = 240px)
7. ✅ `voiceover-segments.json` → TTS Hải Đăng (18.4s voiced / 35s, không tràn beat)
8. ✅ `render.mjs --voice-wav` → MP4 7.0 MB → verify-audio pass (rev 1)
9. ✅ `publish.md` + STATUS regenerate (lang-ai-era vào pages.entries)
10. ✅ **Rev 2 (feedback: nội dung hơi ngắn + hiệu ứng lag):** lên 7 beat / 50s · perf fix (bake nền/ghost/vignette/band thành texture · mưa ký tự cache strip 6Hz · cache layout chữ + subtitle · canvas `alpha:false` · progress 3 lệnh vẽ) · **guard MỚI `verify-perf.mjs`**
11. ✅ Perf đo được: baseline interval p95 **47.7ms (22.9fps)** → sau fix **18.6ms (≈59.6fps)** · stall tệ nhất 1111ms → 38.7ms · command avg 29.6 → 8.2ms
12. ✅ `verify-frames` vòng 2 (15 ảnh, đủ 7 beat) → fix 3 lỗi nhìn thấy: bar label đè caption (đưa label vào trong bar) · dots phase A lộ sớm (gate alpha) · chip Erlang tràn safe zone phải (1019px → 981px)
13. ✅ TTS 50s (7 đoạn · 28.6s voiced · không tràn beat) → render MP4 23.4 MB → verify-audio pass cả WAV (peak 0.867) và MP4 (peak 0.866)
14. ✅ Docs rev 2 (design/prd/publish) + guard perf vào `templates/` + skill `video-clip`

## Guard checklist — KẾT QUẢ rev 2 (50s)

- [x] `verify-frames.mjs` pass — token 16/16 · đã xem 15 khung (7 beat + 2 vòng sau fix)
- [x] `verify-perf.mjs` (guard MỚI) pass — command avg 8.2ms · interval p95 21.2ms (≈58.6fps sustained)
- [x] Guard timing TTS — 7 segment khớp cửa sổ beat, không tràn (28.6s voiced / 50s)
- [x] `verify-audio.mjs` pass trên WAV **và** MP4 cuối (peak 0.867 / rms 0.082)
- [x] Mọi thứ thiết yếu y ≤ 1660 (progress 1541–1554 · footer 1592 · subtitle bottom 1500) · subtitle 42px · mọi chip trong hộp an toàn
- [x] Claim khớp research.md · nhãn "Ý KIẾN" + "nếu/khi" giữ nguyên (beat 1 eyebrow + beat 7 caveat)

## Kết quả (rev 2 — bản chính)

- **MP4:** `www/lang-ai-era/lang-ai-era-50s.mp4` (23,4 MB · 50s · 1080×1920 · 30fps · 7 beat)
- **WAV:** `voiceover-hai-dang-50s.wav` (4,8 MB)
- **Artifact rev 1:** `lang-ai-era-35s.mp4` + `voiceover-hai-dang-35s.wav` (giữ để so sánh)
- **Trang clip:** `www/lang-ai-era/index.html` = bản 50s · trong `www/status.json` pages.entries (23 trang)

## Lệnh chuẩn (rev 2)

```powershell
node www\lang-ai-era\verify-frames.mjs --marks=1,4.9,6,10.8,12.9,13.8,19.8,23.6,26.5,29.4,34.3,37.5,41.8,43.9,44.4,48.8
node www\lang-ai-era\verify-perf.mjs --frames=150          # guard mới: interval p95 ≤ 33ms
D:\CLAUDE_VS\.venv-tts\Scripts\python.exe www\lang-ai-era\tts-vieneu.py --segments www\lang-ai-era\voiceover-segments.json --out www\lang-ai-era\voiceover-hai-dang-50s.wav
node www\lang-ai-era\render.mjs --voice-wav=www\lang-ai-era\voiceover-hai-dang-50s.wav --out=www\lang-ai-era\lang-ai-era-50s.mp4
```
