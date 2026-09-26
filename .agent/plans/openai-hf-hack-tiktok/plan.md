# Plan — Clip "OpenAI agents hack Hugging Face" (50s)

## Todos

1. ✅ Research (swarmtraces.org + cross-check ai-news) → `research.md`
2. ✅ PRD + rubric + dissent → `prd.md`
3. ✅ Design + danh sách nâng cấp UI (7 kỹ thuật mới) → `design.md`
4. ⬜ Scaffold `www/openai-hf-hack/` (copy 4 script từ skill template)
5. ⬜ Viết `index.html` — cyber forensics console (contract `window.__clip`)
6. ⬜ Viết `voiceover-segments.json` (5 đoạn khớp beat)
7. ⬜ Guard layout: `verify-frames.mjs --marks=2,4.5,8,12.8,16,20,25,33,41,47` → xem ảnh
8. ⬜ TTS VieNeu (Hải Đăng) → WAV → `verify-audio.mjs`
9. ⬜ Render `render.mjs --voice-wav` → MP4 → guard audio tự chạy
10. ⬜ Rubric C1–C8 + Evals mini + `publish.md` + báo cáo

## Files

- `www/openai-hf-hack/index.html` — trang clip (mới hoàn toàn)
- `www/openai-hf-hack/voiceover-segments.json` — lời theo beat
- `www/openai-hf-hack/{tts-vieneu.py, render.mjs, verify-audio.mjs, verify-frames.mjs}` — copy nguyên từ `.github/skills/video-clip/templates/`
- Output: `voiceover-hai-dang-50s.wav` + `openai-hf-hack-50s.mp4`

## Lệnh

```powershell
# Guard layout (trước khi TTS)
node www/openai-hf-hack/verify-frames.mjs --marks=2,4.5,8,12.8,16,20,25,33,41,47

# Voiceover
$env:HF_HOME='D:\hf-cache'; $env:PYTHONIOENCODING='utf-8'
D:\CLAUDE_VS\.venv-tts\Scripts\python.exe www/openai-hf-hack/tts-vieneu.py --voice "Hải Đăng" --segments www/openai-hf-hack/voiceover-segments.json --out www/openai-hf-hack/voiceover-hai-dang-50s.wav

# Render (tự chạy guard audio)
node www/openai-hf-hack/render.mjs --voice-wav=www/openai-hf-hack/voiceover-hai-dang-50s.wav --out=www/openai-hf-hack/openai-hf-hack-50s.mp4
```

## Rủi ro & đối sách

| Rủi ro | Đối sách |
|---|---|
| Lời VO tràn beat (guard exit 1) | Viết ~15% dưới budget; tràn → rút gọn text, chạy lại |
| Chữ đè nhau khi title wrap 3 dòng | `wrap()` trả Y cuối, sub đặt động |
| Token thiếu → chữ tàng hình | Guard quét `C.<key>`; chỉ dùng key đã định nghĩa |
| Nhầm số liệu | Đối chiếu research.md trước khi gõ chữ vào beats |
