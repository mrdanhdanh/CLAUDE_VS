# Plan — Space Bunny Free TikTok Clip

## Tasks
1. Tạo timeline khoảng 50s, facts/provenance và voiceover.
2. Tạo renderer canvas 1080×1920 theo visual terminal OpenCode.
3. Ghép voice WAV local vào MediaStream; xuất MP4.
4. Chạy kiểm tra nội dung, frame, MIME, audio và no console error.
5. Đóng gói `clip.mp4`, `voiceover.txt`, PRD/design/plan.

## Research ledger
- **Primary:** OpenCode Go/Zen docs, official model endpoint, official OpenCode GitHub commit/PR.
- **Secondary:** OpenCode X announcement (accessed through indexed snippets), LM Market Cap and Benchable aggregator pages.
- **Absent:** official provider, weights, model card, paper, reproducible task-level benchmark, raw usage rows.
- **Conflict:** OpenCode và OpenRouter đều ghi 1M context (khớp), nhưng retention thì ngược nhau (0 ngày vs “có thể lưu”). Clip giữ đúng mâu thuẫn, không chọn phe.

## TTS engine (chọn ngày 2026-09-23)

**Chọn: VieNeu-TTS** (`pnnbao97/VieNeu-TTS`, Apache-2.0, 2.6k⭐) — TTS tiếng Việt local, 48 kHz, 25 giọng dựng sẵn (Bắc/Trung/Nam), torch-free trên CPU.

| Phương án | Kết luận |
|---|---|
| **VieNeu-TTS v3 Turbo** | ✅ Chọn — local, offline sau lần tải đầu, giọng tự nhiên có ngữ điệu, có emotion cue `[cười]` |
| `edge-tts` (12k⭐) | ⚪ Dự phòng — giọng neural Microsoft (`vi-VN-HoaiMyNeural`) rất tốt nhưng cần mạng + là dịch vụ bên thứ ba |
| Microsoft An (SAPI) | ⛔ Thay thế — giọng cũ, đều, ít ngữ điệu |
| F5-TTS / VietVoice / ZeroTTS | ⚪ Không chọn — cần GPU nặng hơn hoặc chất lượng/vận hành kém hơn |

**Cài đặt & ràng buộc (đã đo trên máy này):**
- Venv: `D:\CLAUDE_VS\.venv-tts` (ổ C: gần đầy nên mọi thứ đặt trên D:).
- `HF_HOME=D:\hf-cache` — model tải về nằm trên D:, không đụng C:.
- Lệnh: `D:\CLAUDE_VS\.venv-tts\Scripts\python.exe www\space-bunny-free\tts-vieneu.py --voice "Mai Anh" --text-file www\space-bunny-free\voiceover.txt --out www\space-bunny-free\voiceover.wav`
- ⚠️ **v3 Turbo không có tham số `speed`** (chỉ v3 Nano có) → không kéo dài giọng đọc được; phải cắt lời theo beat + chèn khoảng nghỉ để khớp hình.
- ⚠️ **Sinh nhiều giọng trong 1 tiến trình sẽ hết RAM** (ONNX arena không nhả giữa các lần) → chạy mỗi giọng một tiến trình.
- Tốc độ CPU: RTF ~1.0–1.4 (48 s audio ≈ 40–50 s máy, đã tính ~17 s nạp model).

## Contracts
- `render.mjs --out=<path>`: tạo file video. `--voice-wav=<wav>`: dùng voiceover có sẵn (bỏ qua TTS SAPI).
- `tts-vieneu.py --voice <tên> --text-file <txt> --out <wav>`: sinh voiceover; `--list` để xem 25 giọng.
- `tts-vieneu.py --segments <json> --out <wav>`: ghép lời theo beat vào timeline, chỗ trống là im lặng; exit 1 nếu đoạn nào tràn beat/timeline.
- Không gọi API mạng; assets là local/system (VieNeu chạy offline sau lần tải model đầu).

## Audio timing (chốt 2026-09-24)
- Giọng chọn: **Hải Đăng** — 25 giọng dựng sẵn của VieNeu đã được so sánh trong `www/space-bunny-free/voice-compare.html`.
- v3 Turbo **không có tham số `speed`** → không kéo dài giọng đọc; giải pháp: cắt lời theo beat + chèn khoảng nghỉ.
- Kết quả đo (RMS theo giây): B1 0–4 s · B2 5–13 s · B3 14–26 s · B4 28–36 s · B5 39–46 s; tổng 35.2 s có tiếng / 50 s; đuôi lặng 1–4 s mỗi beat để thở.
- Đỉnh vượt biên độ: model xuất peak 1.017 → script tự scale về 0.98 (không clip).
- Nếu MP4 recorder không khả dụng, fallback WebM và báo rõ.
- Không upload, không publish, không claim tự đăng.
- Guard nội dung: phải có `space-bunny-free`, `free`, `1M context` kèm provenance + mâu thuẫn retention; không được có claim paper/benchmark đã kiểm chứng.
- Guard layout: `www/space-bunny-free/verify-frames.mjs` chụp 5 beat ra PNG để tự kiểm trước khi render.
- Guard âm thanh: `www/space-bunny-free/verify-audio.mjs` soi box `soun`/`mp4a` + đo peak/RMS của track trong file MP4 (exit 1 nếu im lặng); `render.mjs` tự gọi guard này sau khi ghi file.

## Verify
- Node syntax check.
- Content RED/GREEN assertion cho identity + provenance.
- Renderer smoke: output tồn tại, >10KB, probe MP4/WebM.
- Playwright frame assertions: canvas 1080×1920; ~50s; no pageerror.
- Mini eval rubric C1–C7 ghi trong `verify.md`.
