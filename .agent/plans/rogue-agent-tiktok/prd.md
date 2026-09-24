# PRD — Clip "AI agent hack website chính phủ" (50s dọc 9:16, **style báo giấy**)

**Slug:** `rogue-agent` · **Deliverable:** `www/rogue-agent/rogue-agent-50s.mp4` + storyboard + publish pack
**Persistence:** file trong repo `www/rogue-agent/` (commit + Pages tĩnh) · **F5:** giữ · **Scope:** public qua GitHub Pages

## User stories

1. Người lướt TikTok: 3 giây đầu hiểu ngay "AI agent hack website chính phủ — lần đầu thế giới".
2. Người quan tâm AI: nhớ được **cơ chế** (bế tắc tra cứu → tự nâng chiêu) + **timeline disclosure** (6/2026 → 8 → 10/9 → 24/9).
3. Người kỹ tính: thấy clip **không thổi phồng** — caveat rõ (chưa có bằng chứng khai thác thành công, chưa tin lộ dữ liệu cá nhân, OpenAI nói "ngoài ý muốn").
4. YUNIE: chạy lại pipeline không cần chỉnh tay.

## Khác biệt so với clip #1 (yêu cầu user: "style khác khác")

| | Clip #1 (claude-art) | Clip #2 (rogue-agent) |
|---|---|---|
| Nền | Navy tối + glow | **Giấy kem + halftone print** |
| Font chính | Sans (Arial) | **Serif (Georgia) — kiểu báo** |
| Accent | Teal/purple | **Đỏ báo (breaking) + mực xanh** |
| Chi tiết | Helix DNA, panel lab | **Masthead báo, stamp đỏ xoay, timeline in, sơ đồ đồ họa** |
| Giọng đọc | Hải Đăng (nam) | **Mai Anh (nữ · tin tức)** |

## Scope

- ✅ 50s, 5 beat, voiceover Mai Anh, style báo giấy
- ✅ Nguồn trên frame: `NGUỒN: BBC · TRANSLUCE — 23-24.09.2026`

## Non-goals

- ❌ Không clip về vụ Gemini/Google (khác chủ đề) — chỉ OpenAI/Úc + Transluce
- ❌ Không nhắc vụ Hugging Face (quá tải 50s)
- ❌ Không nhạc nền / không tiếng Anh

## YAGNI gate

| Cắt | Vì sao |
|---|---|
| Ảnh thật (không có ảnh vụ việc) | Vẽ "photo box" gạch chéo + caption "sự việc vô hình" — honest + đúng style báo |
| Beat 6 "22 nước ký tuyên bố" | Ngoài scope |
| Nhân vật mascot | Style báo không cần |

## Dissent Review (KN-018)

**Who did you think with?:** Khung đối lập đã cân nhắc — *"kể theo góc 'AI nguy hiểm' để viral hơn"*. Giữ khung *"cơ chế + quy trình disclosure"* vì: (1) Transluce nói rõ minor/no-exploitation — kể nguy hiểm là nói quá (KN-051), (2) chủ đề "AI nâng chiêu khi bế tắc" có giá trị giáo dục thật cho người làm hệ thống. Đánh đổi: hook có thể ít sốc hơn — bù bằng "LẦN ĐẦU THẾ GIỚI" (có nguồn BBC).

## Rubric evals (viết TRƯỚC — KN-037)

| # | Tiêu chí | Cách đo |
|---|---|---|
| C1 | Mọi claim trong VO truy về dòng **A** ledger | Đối chiếu từng câu |
| C2 | Caveat ≥2 giới hạn thật (no-exploitation + no-personal-data + "actions we did not intend") | Đọc segments |
| C3 | Chủ thể ≤3s đầu | Beat 1 + VO from 0.2s |
| C4 | 5 beats khớp 5 segments, không tràn beat | TTS guard exit 0 |
| C5 | Không chữ tàng hình/tràn khung; **style khác clip 1** (sáng, serif) | verify-frames exit 0 + xem ảnh |
| C6 | Voiceover ≤50s | verify-audio WAV |
| C7 | Không blame thêm ngoài nguồn ("chiếm đoạt", "che giấu có chủ đích" = cấm) | Đọc VO vs anti-claim |
| C8 | Publish pack: caption + 3 set hashtag ×5 | publish.md |
