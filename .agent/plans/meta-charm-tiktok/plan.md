# Plan — Clip #3 "Meta Muse Charm" (đồ chơi/pixel-LCD)

## Todos

1. ✅ Research ledger (TechCrunch A + HN metric; anti-claim: "presumably" bị loại)
2. ✅ PRD + Design (rubric C1–C8, style khác 3/3 clip, Dissent Review)
3. ⬜ Scaffold `www/meta-charm/` + viết `index.html` (toy/LCD) + segments (Thùy Dung)
4. ⬜ `verify-frames.mjs` + **xem 5 ảnh**
5. ⬜ TTS Thùy Dung + guard timing
6. ⬜ Render MP4 + audio guard
7. ⬜ Publish pack
8. ⬜ Eval rubric + commit + push + verify Pages

## Commands

```powershell
New-Item -ItemType Directory -Force www\meta-charm | Out-Null
Copy-Item .github\skills\video-clip\templates\* www\meta-charm\ -Force
# sửa index.html + voiceover-segments.json (voice: "Thùy Dung")

node www\meta-charm\verify-frames.mjs

$env:HF_HOME='D:\hf-cache'; $env:PYTHONIOENCODING='utf-8'
D:\CLAUDE_VS\.venv-tts\Scripts\python.exe www\meta-charm\tts-vieneu.py --segments www\meta-charm\voiceover-segments.json --out www\meta-charm\voiceover-thuy-dung-50s.wav

node www\meta-charm\render.mjs --voice-wav=www\meta-charm\voiceover-thuy-dung-50s.wav --out=www\meta-charm\meta-charm-50s.mp4
```

## Gates

| Gate | Pass khi |
|---|---|
| Layout | verify-frames exit 0 + 5 ảnh được xem (pixel rõ, không tràn) |
| Audio | verify-audio exit 0 trên WAV + MP4 |
| Timing | TTS guard không tràn beat (giọng Nam chưa test — chừa margin) |
| Rubric | C1–C8 (ghi bên dưới) |

## Rủi ro & đối sách

- Thùy Dung (giọng Nam) chưa từng chạy → nếu tràn beat: rút lời (≤3 lần như luật).
- Pixel art bằng rects — dễ lệch; dùng UNIT 18 + mọi tọa độ snap theo unit.

## Eval results (2026-09-24 — sau Verify)

| # | Kết quả | Bằng chứng |
|---|---|---|
| C1 | ✅ PASS | Mọi claim VO truy về ledger A: Muse Charm/Meta Connect (TechCrunch), "Jolly"/vân tay (quote Zuck), "chưa bán, hẹn tháng 12" (quote qua TC), "vượt ChatGPT thời kỳ đầu" (TC headline 21/09) |
| C2 | ✅ PASS | Beat 4: "chưa bán — mới demo, hẹn tháng 12, chưa có giá" + "cliché từ thời Friend" (TechCrunch nhận xét) |
| C3 | ✅ PASS | Beat 1 headline "Meta vừa làm 'bùa AI' kiểu Tamagotchi" + VO từ 0.2s (2.72s); máy + thú pixel hiện từ đầu |
| C4 | ✅ PASS | TTS guard **exit 0 ngay lần đầu** — 5 segments khớp 5 beats, Thùy Dung không tràn beat nào |
| C5 | ✅ PASS | verify-frames exit 0 (16/18 token) + **đã xem 5 ảnh** + 1 re-check sau fix; **style khác rõ 3/3 clip**: pastel/pixel/toy vs navy và báo giấy |
| C6 | ✅ PASS | verify-audio: WAV 50.0s peak 0.752 · MP4 49.95s peak 0.749 (cả 2 AUDIO OK) |
| C7 | ✅ PASS | Không "làm việc thay bạn" (loại claim "presumably" của TC) · không giá · không "là Tamagotchi thật" (dùng "kiểu") |
| C8 | ✅ PASS | publish.md: caption + 3 set × 5 hashtag + checklist + ghi chú uy tín |

**Kết luận:** **8/8 PASS** — 2 clip liên tiếp tuyệt đối. Guard auto đều exit 0. Giọng mới (Thùy Dung) pass timing ngay lần đầu.

**Fix trong Verify (từ xem ảnh):**
1. Khoen móc khóa (cy 604, r 54) đè lên sub (y 558) → hạ khoen xuống cy 620 r 56 (tâm đúng mép vỏ, nửa dưới được vỏ gắn lại) + nâng sub lên y 540 + rút sub beat 3 về 1 dòng.
2. Beat không chip (1/5) để nửa dưới máy trống ~400px → thêm decor tim pixel bay + chữ khắc "· MUSE CHARM ·".
3. Battery icon dùng `clearRect` sẽ khoét thủng LCD → đổi sang strokeRect + fill.
4. Signal bar thiếu `fillStyle` (vô hình) → thêm `ctx.fillStyle = C.lcdDark`.

