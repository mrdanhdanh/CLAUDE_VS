# PRD — Clip "Claude tự tìm ra enzyme mới" (50s dọc 9:16)

**Slug:** `claude-art-tiktok` · **Deliverable:** `www/claude-art/claude-art-50s.mp4` + storyboard page + publish pack
**Persistence:** file trong repo `www/claude-art/` (commit + Pages tĩnh) · **F5:** giữ (file tĩnh) · **Scope:** public qua GitHub Pages

## User stories

1. Người xem lướt TikTok/Reels: hiểu trong **3 giây đầu** đây là chuyện "AI tự làm khoa học" và muốn xem tiếp.
2. Người xem quan tâm AI: nhớ được **con số cụ thể** (950 agents · 21h · 210M token · 200k→3.5k→20).
3. Người xem kỹ tính: thấy clip **không hype** — có caveat rõ ràng (chức năng chưa biết, Anthropic tự công bố, lab do người làm) → tăng trust.
4. YUNIE (operator): chạy lại được pipeline (research → canvas → guard → voice → render) không cần chỉnh tay.

## Scope

- ✅ 50s, 5 beat, voiceover tiếng Việt (VieNeu, giọng Hải Đăng — nam Bắc tự nhiên)
- ✅ Canvas storyboard + MP4 + publish pack (caption + 3 set hashtag)
- ✅ Nguồn trên frame (label "NGUỒN: ANTHROPIC · 23/09/2026")

## Non-goals

- ❌ Không làm clip về vụ OpenAI/Úc "rogue agent" (đã là clip #2 candidate — làm sau nếu user muốn)
- ❌ Không phân tích kỹ thuật sinh học (cơ chế CRISPR, RT) — chỉ mức "hiểu được"
- ❌ Không dùng nhạc nền / không dùng giọng tiếng Anh

## YAGNI gate (cắt gì trước)

| Cắt | Vì sao |
|---|---|
| Nhạc nền | 3 guard không cover nhạc; voice-only là pattern đã chạy (space-bunny) |
| Beat thứ 6 (so sánh với AlphaFold...) | Không có trong ledger → không bịa |
| Chi tiết kỹ thuật (tên protein, locus) | > ngưỡng "hiểu được" của người xem phổ thông |
| Mascot mới | Template có sẵn → reuse (ladder nấc 2) |

## Rubric evals (viết TRƯỚC khi làm — KN-037)

| # | Tiêu chí | Cách đo |
|---|---|---|
| C1 | Mọi số liệu trong voiceover truy được về dòng **A** của ledger | Đối chiếu từng câu ↔ research.md |
| C2 | Caveat beat nêu ≥2 giới hạn thật (chức năng chưa biết + self-reported/lab do người) | Đọc segments |
| C3 | Chủ thể xuất hiện ≤3 giây đầu | Beat 1 + waveform text |
| C4 | 5 beats khớp 5 segments (không tràn) | Guard timing `tts-vieneu.py --segments` exit 0 |
| C5 | Không chữ nào tàng hình / tràn khung | `verify-frames.mjs` exit 0 + **xem ảnh từng beat** |
| C6 | Voiceover ≤ 50s | `verify-audio.mjs` trên WAV |
| C7 | Tiếng Việt tự nhiên; ≤2 thuật ngữ Anh/câu; "CRISPR" có neo nghĩa | Đọc lại segments |
| C8 | Publish pack đủ caption + 3 set hashtag × 5 tag | `publish.md` |

**Kết quả eval:** ghi trong `plan.md` sau Verify (PASS/FAIL từng tiêu chí) — không tự chấm bằng cảm giác.
