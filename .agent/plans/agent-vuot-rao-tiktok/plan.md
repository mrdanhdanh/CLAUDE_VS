# Plan — Clip 48s "Agent vượt rào bằng dịch vụ quét web" (TIN AI · SỐ 003)

**Slug:** `www/agent-vuot-rao/` · **Plan:** `.agent/plans/agent-vuot-rao-tiktok/` · **Voice:** Mai Anh · **48s**

## Todos
1. ✅ Research + evidence ledger (A/B/C) — ghi rõ khác biệt với SỐ 002
2. ✅ PRD: hook portfolio (chọn H1) + beat sheet + script + rubric C1–C9
3. ✅ Design: series báo giấy + storyboard 5 beat + motion
4. ✅ Scaffold `www/agent-vuot-rao/` (copy template video-clip)
5. ✅ Build `index.html` (beats 5 · draw(t) deterministic · contract `window.__clip`) — **sửa font Georgia→Times New Roman** (Georgia thiếu glyph VN)
6. ✅ `verify-frames.mjs` → đã XEM 5/5 khung (layout + dấu chuẩn sau fix font)
7. ✅ `voiceover-segments.json` (8 segment — pace v2) → TTS Mai Anh → guard timing pass
8. ✅ `render.mjs` → `agent-vuot-rao-48s.mp4` (48s · 30fps · 5.1MB) → verify-audio WAV + MP4 pass
9. ✅ `publish.md` + report

**Trạng thái:** DONE 26.09.2026 — MP4 sẵn sàng đăng: `www/agent-vuot-rao/agent-vuot-rao-48s.mp4`

## Guard checklist (không được tắt)
- [x] `verify-frames.mjs` pass + 5/5 ảnh đã xem (0.5/3/9/18/30/43s)
- [x] Guard timing TTS không tràn beat (8/8 segment nằm trong cửa sổ)
- [x] `verify-audio.mjs` pass trên WAV (peak 0.70) **và** MP4 (peak 0.70 · mp4a)
- [x] Voiceover 48s = duration clip · thiết yếu trong y 690–1660
- [x] Claim khớp research.md — "chưa thấy bằng chứng"; không thuật ngữ trần (C4)
- [x] Muted-read: title beat 1 tự đủ nghĩa (đã xem khung cover)

## Lệnh
```powershell
node www\agent-vuot-rao\verify-frames.mjs --marks=0.5,3,9,18,30,43
D:\CLAUDE_VS\.venv-tts\Scripts\python.exe www\agent-vuot-rao\tts-vieneu.py --segments www\agent-vuot-rao\voiceover-segments.json --out www\agent-vuot-rao\voiceover-mai-anh-48s.wav
node www\agent-vuot-rao\verify-audio.mjs www\agent-vuot-rao\voiceover-mai-anh-48s.wav
node www\agent-vuot-rao\render.mjs --voice-wav=www\agent-vuot-rao\voiceover-mai-anh-48s.wav --out=www\agent-vuot-rao\agent-vuot-rao-48s.mp4
```
