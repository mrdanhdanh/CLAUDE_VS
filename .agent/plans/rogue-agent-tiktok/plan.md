# Plan — Clip #2 "AI agent hack" (style báo giấy)

## Todos

1. ✅ Research ledger (`research.md`, BBC + Transluce A-grade)
2. ✅ PRD + Design (rubric C1–C8 + style báo giấy khác clip 1 + Dissent Review)
3. ⬜ Scaffold `www/rogue-agent/` (copy template) + viết `index.html` style báo
4. ⬜ `verify-frames.mjs` + **xem 5 ảnh**
5. ⬜ TTS **Mai Anh** + guard timing
6. ⬜ Render MP4 + audio guard
7. ⬜ Publish pack
8. ⬜ Eval rubric + commit + push + verify Pages

## Commands

```powershell
New-Item -ItemType Directory -Force www\rogue-agent | Out-Null
Copy-Item .github\skills\video-clip\templates\* www\rogue-agent\ -Force
# sửa index.html + voiceover-segments.json (voice: "Mai Anh")

node www\rogue-agent\verify-frames.mjs

$env:HF_HOME='D:\hf-cache'; $env:PYTHONIOENCODING='utf-8'
D:\CLAUDE_VS\.venv-tts\Scripts\python.exe www\rogue-agent\tts-vieneu.py --segments www\rogue-agent\voiceover-segments.json --out www\rogue-agent\voiceover-mai-anh-50s.wav

node www\rogue-agent\render.mjs --voice-wav=www\rogue-agent\voiceover-mai-anh-50s.wav --out=www\rogue-agent\rogue-agent-50s.mp4
```

## Gates

| Gate | Pass khi |
|---|---|
| Layout | verify-frames exit 0 + 5 ảnh được xem (chữ rõ, style sáng/serif rõ rệt) |
| Audio | verify-audio exit 0 trên WAV + MP4 |
| Timing | TTS guard không tràn beat (voice mới → chừa margin ≥0.5s) |
| Rubric | C1–C8 PASS (ghi bên dưới) |

## Giọng mới (rủi ro)

Mai Anh chưa từng dùng theo beat — tốc độ chưa biết. Nếu tràn beat: rút ngắn lời (không đổi giọng trừ khi thất bại 3 lần).

## Eval results (2026-09-24 — sau Verify)

| # | Kết quả | Bằng chứng |
|---|---|---|
| C1 | ✅ PASS | Mọi claim VO truy về dòng A ledger: T6 vụ/ T8 biết/ 10.9 báo (BBC), Transluce cơ chế + 3 mục tiêu (Transluce), "ngoài ý muốn" (OpenAI statement qua BBC) |
| C2 | ✅ PASS | Beat 4 = hộp "NÓI RÕ" 3 giới hạn: chưa thấy khai thác thành công · chưa tin lộ dữ liệu cá nhân · OpenAI "hành động ngoài ý muốn" |
| C3 | ✅ PASS | Beat 1 headline "AI agent tự hack website chính phủ" + VO từ 0.2s (2.64s) |
| C4 | ✅ PASS | TTS guard **exit 0 ngay lần đầu** — 5 segments khớp 5 beats, Mai Anh không tràn beat nào |
| C5 | ✅ PASS | verify-frames exit 0 (10/12 token) + **đã xem 6 ảnh** (02/08/20/33/45s + re-check 45s); **style khác rõ clip 1**: giấy kem + serif + đỏ báo vs navy + sans + teal |
| C6 | ✅ PASS | verify-audio: WAV 50.0s peak 0.656 · MP4 49.95s peak 0.656 (cả 2 AUDIO OK) |
| C7 | ✅ PASS | Không có câu blame ngoài nguồn; dùng đúng từ nguồn ("quá lâu" — PM; "ngoài ý muốn" — OpenAI); không "hack thành công" |
| C8 | ✅ PASS | publish.md: caption + 3 set × 5 hashtag + checklist + ghi chú uy tín |

**Kết luận:** **8/8 PASS** — lần này không có disclosure nào (khác clip 1). Guard tự động đều exit 0. Giọng mới (Mai Anh) pass timing ngay lần đầu — rủi ro đã nêu trong plan không xảy ra.

**Fix trong Verify:** beat 5 title trùng chữ với khối editorial ("Bế tắc thì dừng" xuất hiện 2 lần) → đổi title thành "Luật của hệ thống mình." — phát hiện khi xem ảnh 45s, re-check sau fix.

