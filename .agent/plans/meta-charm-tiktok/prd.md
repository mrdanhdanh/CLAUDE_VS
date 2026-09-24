# PRD — Clip #3 "Meta Muse Charm" (50s dọc 9:16, **style đồ chơi/pixel-LCD**)

**Slug:** `meta-charm` · **Deliverable:** `www/meta-charm/meta-charm-50s.mp4` + storyboard + publish pack
**Persistence:** file trong repo `www/meta-charm/` (commit + Pages tĩnh) · **F5:** giữ · **Scope:** public qua GitHub Pages

## User stories

1. Người lướt TikTok: thấy "Meta làm Tamagotchi AI" trong 3s đầu → dừng lại vì tò mò.
2. Người quan tâm gadget: nhớ được 3 điểm thân xác (màn hình avatar Jolly · vân tay tap-to-talk · móc khóa).
3. Người kỹ tính: biết ngay **chưa bán, chưa giá, hẹn tháng 12** — không bị hype lừa.
4. YUNIE: chạy lại pipeline không chỉnh tay.

## Khác biệt 3 clip (yêu cầu: style khác)

| | Clip 1 claude-art | Clip 2 rogue-agent | **Clip 3 meta-charm** |
|---|---|---|---|
| Nền | Navy + glow | Giấy kem + halftone | **Pastel gradient + confetti pixel** |
| Font | Sans + mono | Serif Georgia | **Chunky Trebuchet 900 + pixel mono** |
| Motif | Helix DNA | Masthead + stamp đỏ | **Thiết bị đồ chơi + màn LCD + thú pixel** |
| Giọng | Hải Đăng (nam Bắc) | Mai Anh (nữ Bắc) | **Thùy Dung (nữ Nam)** |

## Scope

- ✅ 50s, 5 beat, voice Thùy Dung
- ✅ Nguồn trên frame: `NGUỒN: TECHRUNCH · META CONNECT — 23.09.2026`

## Non-goals

- ❌ Không kể vụ Amazon block Muse (đã có trong curated #2 — tránh trùng)
- ❌ Không kể vụ ban nhạc Muse mất handle (vui nhưng lạc đề)
- ❌ Không nhạc nền

## YAGNI gate

| Cắt | Vì sao |
|---|---|
| Vẽ thiết bị y như thật | Không có ảnh chính thức dùng được → vẽ "phiên bản đồ chơi" stylized (đúng style + tránh sai hình dáng) |
| Beat về Muse 0-day (Ars) | Ngoài scope "đồ chơi mới" |
| So sánh Friend/Rabbit chi tiết | 1 nhắc trong caveat là đủ |

## Dissent Review (KN-018)

**Who did you think with?:** Khung đối lập đã cân nhắc — *"làm clip hype 'Zuck lại làm gadget mới' cho vui"*. Giữ khung *"AI trong túi bạn + đầy đủ caveat"* vì: (1) hype không educate được gì (KN-024 — đừng thưởng output rẻ), (2) disclosure "chưa bán/chưa giá/cliché" là thứ phân biệt tin thật với quảng cáo hộ. Đánh đổi: bớt "sốc" — bù bằng style đồ chơi + câu hỏi cuối dễ tương tác.

## Rubric evals (viết TRƯỚC — KN-037)

| # | Tiêu chí | Cách đo |
|---|---|---|
| C1 | Mọi claim trong VO truy về dòng A ledger | Đối chiếu từng câu |
| C2 | Caveat ≥2 giới hạn thật (chưa bán + chưa giá) | Đọc segments |
| C3 | Chủ thể ≤3s đầu | Beat 1 + VO from 0.2s |
| C4 | 5 beats khớp 5 segments, không tràn beat | TTS guard exit 0 |
| C5 | Không chữ tàng hình/tràn khung; **style khác rõ** (pastel/pixel/toy) | verify-frames exit 0 + xem ảnh |
| C6 | Voiceover ≤50s | verify-audio WAV |
| C7 | Không claim "làm việc thay bạn"/giá/"là Tamagotchi thật" | Đọc VO vs anti-claim |
| C8 | Publish pack: caption + 3 set hashtag ×5 | publish.md |
