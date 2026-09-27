# Plan — clip "ĐỌC VỊ · ADS" (50s)

## Bối cảnh

- Clip mới theo series ĐỌC VỊ (HackerNoon) từ bài "Rebuilding Data Engineering with Harness Engineering" (Nie Lifeng, 27.09.2026).
- www vừa được tổ chức lại: **mọi clip nằm trong `www/Clip/<slug>/`** (age-of-giants, rogue-agent… đã move vào đó). Clip mới → `www/Clip/agentic-data-stack/`.

## Các bước

1. [x] Research + evidence ledger → `research.md`
2. [x] Promise/hook/beat/CTA/rubric → `prd.md`
3. [x] Tokens/layout/scene/voice/sub/motion → `design.md`
4. [x] Scaffold `www/Clip/agentic-data-stack/` (copy 6 template từ `.github/skills/video-clip/templates/`)
5. [x] Viết `index.html` (contract `window.__clip`, 7 scene, HUD/progress/sub như convention series)
6. [x] Viết `voiceover-segments.json` (7 đoạn, ~157 âm tiết — rev 2 sau khi guard bắt tràn đoạn 03)
7. [x] Guard layout: `node verify-frames.mjs --marks=...` → **XEM ảnh từng beat** (2 vòng — bắt 4 lỗi wrap + 1 lỗi stamp che label)
8. [x] Guard perf: `node verify-perf.mjs` (command avg 4.88ms · p95 interval 17.9ms ≈ 55fps)
9. [x] Voiceover: TTS pass guard timing (lần 1 fail đoạn 03 → trim → lần 2 pass)
10. [x] Render: `agentic-data-stack-50s.mp4` (13MB) + verify-audio tự chạy (WAV + MP4 OK)
11. [x] Publish pack → `publish.md` (+ guard mới `verify-mp4.mjs` spot-check khung thật trong MP4)
12. [ ] Cập nhật registry/status nếu cần + báo cáo

## Lệnh (PowerShell, cwd = D:\CLAUDE_VS)

```powershell
# scaffold
New-Item -ItemType Directory -Force www\Clip\agentic-data-stack | Out-Null
Copy-Item .github\skills\video-clip\templates\* www\Clip\agentic-data-stack\ -Force

# guards
node www\Clip\agentic-data-stack\verify-frames.mjs --marks=3.1,8.5,16,24,31,39,47.6
node www\Clip\agentic-data-stack\verify-perf.mjs

# voice (mỗi giọng 1 tiến trình riêng)
$env:HF_HOME='D:\hf-cache'; $env:PYTHONIOENCODING='utf-8'
D:\CLAUDE_VS\.venv-tts\Scripts\python.exe www\Clip\agentic-data-stack\tts-vieneu.py --segments www\Clip\agentic-data-stack\voiceover-segments.json --out www\Clip\agentic-data-stack\voiceover-hai-dang-50s.wav

# render
node www\Clip\agentic-data-stack\render.mjs --voice-wav=www\Clip\agentic-data-stack\voiceover-hai-dang-50s.wav --out=www\Clip\agentic-data-stack\agentic-data-stack-50s.mp4
```

## Rủi ro đã biết

- Voice tràn beat (guard exit 1) → trim lời đoạn tràn, đếm lại âm tiết, chạy lại TTS.
- TTS lần đầu chậm (RTF ~0.5, nạp model ~17s) — bình thường.
- KN-083: nếu verify-perf fail → bake thêm texture, cache thêm strip.
