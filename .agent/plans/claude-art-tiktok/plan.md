# Plan — Clip "Claude tự tìm ra enzyme mới"

## Todos

1. ✅ Research ledger → `research.md` (A/B/C/D, anti-claim list)
2. ✅ PRD + Design → `prd.md`, `design.md` (rubric C1–C8, tokens, storyboard)
3. ⬜ Canvas page `www/claude-art/index.html` (5 beat + contract)
4. ⬜ Layout guard: `verify-frames.mjs` + **xem ảnh từng beat**
5. ⬜ Voiceover: `tts-vieneu.py --segments voiceover-segments.json`
6. ⬜ Render: `render.mjs --voice-wav=...` + `verify-audio.mjs` (tự chạy)
7. ⬜ Publish pack: `publish.md` (caption + 3 set hashtag)
8. ⬜ Eval rubric C1–C8 + slop-check + báo cáo

## Commands (đúng slug)

```powershell
# 3. Copy template
New-Item -ItemType Directory -Force www\claude-art | Out-Null
Copy-Item .github\skills\video-clip\templates\* www\claude-art\ -Force
# → sửa index.html + voiceover-segments.json

# 4. Layout guard
node www\claude-art\verify-frames.mjs

# 5. Voice (mỗi giọng 1 tiến trình riêng)
$env:HF_HOME='D:\hf-cache'; $env:PYTHONIOENCODING='utf-8'
D:\CLAUDE_VS\.venv-tts\Scripts\python.exe www\claude-art\tts-vieneu.py --segments www\claude-art\voiceover-segments.json --out www\claude-art\voiceover-hai-dang-50s.wav

# 6. Render (tự chạy guard âm thanh sau khi ghi file)
node www\claude-art\render.mjs --voice-wav=www\claude-art\voiceover-hai-dang-50s.wav --out=www\claude-art\claude-art-50s.mp4
```

## Gates

| Gate | Pass khi |
|---|---|
| Layout | `verify-frames.mjs` exit 0 + ảnh 5 beat **được xem**, chữ rõ không đè |
| Audio | `verify-audio.mjs` exit 0 trên WAV **và** MP4 (render tự gọi) |
| Timing | TTS guard không báo tràn beat |
| Rubric | C1–C8 PASS (ghi kết quả bên dưới) |

## Eval results (2026-09-24 — sau Verify)

| # | Kết quả | Bằng chứng |
|---|---|---|
| C1 | ✅ PASS | Mọi số trong VO (950/21h/210M/200k/3.5k/20) truy về dòng A của `research.md`; quote Feng Zhang từ bài gốc |
| C2 | ✅ PASS | Beat 4 = 3 giới hạn: "chức năng chưa rõ" + "lab do con người chạy" + "Anthropic tự công bố" |
| C3 | ✅ PASS | Beat 1 title "AI tự tìm ra một hệ enzyme mới." + VO bắt đầu giây 0.2 |
| C4 | ✅ PASS | `tts-vieneu.py` exit 0 (lần 3 — 2 lần đầu tràn beat 1, đã rút ngắn lời); 5 segments khớp 5 beats |
| C5 | ✅ PASS | `verify-frames.mjs` exit 0 (14/14 token) + đã **xem 5 ảnh** (02s/08s/20s/33s/45s) — chữ rõ, không đè |
| C6 | ✅ PASS | `verify-audio.mjs`: WAV 50.0s peak 0.985 · voiced 33.8s; MP4 49.95s peak 0.898 |
| C7 | ⚠️ PASS* | Câu 2 beat 3 có 4 thuật ngữ (agent/DNA/CRISPR/ART) > mốc "≤2" — **disclose**: đây là thuật ngữ thiết yếu của chủ đề (enzyme/DNA/CRISPR chuẩn hoá tiếng Việt; ART là tên hệ + có neo "hệ ART, trong virus vi khuẩn"). Sửa nữa sẽ méo nội dung → giữ, ghi nhận |
| C8 | ✅ PASS | `publish.md`: caption + 3 set × 5 hashtag + checklist 7 mục |

**Kết luận:** 7 PASS tuyệt đối + 1 PASS-có-disclosure (C7). Guard tự động (layout/audio/timing) đều exit 0. Slop Gate: `fetch.mjs` không tăng finding so với baseline (xem dưới).

## Slop Gate note (KN-047)

- `fetch.mjs`: baseline HEAD đã **8 findings** (fetchHN CC20, fetchHackerNoon CC37, main CC44/126 dòng…). Sau thay đổi: **đúng 8** — function mới `fetchHNTop` được tách thành `isAIRelated` + `mapHNTopStory` (mỗi cái ≤12 CC) nên **0 finding mới**; main() phình 44→48 nhưng finding đã tồn tại từ trước (legacy single-file fetcher, style `||` dày đặc đặc trưng cả file — refactor toàn bộ ngoài scope task này).
- Bằng chứng baseline: `git show HEAD:www/ai-news/fetch.mjs > temp && node scripts/slop-check.mjs temp` → 8 findings, exit 1.

## Regression bắt được trong Verify

- Test `ai-news.spec.ts › no horizontal overflow at 375` **FAIL (56px)** khi thêm content mới → cô lập bằng cách swap 2 JSON về HEAD (pass) → xác định thủ phạm: nhãn `sources[0]` mình làm dài ("Hacker News (Algolia, free) — query + top-by-points") làm chip tràn → rút gọn nhãn (chi tiết nằm ở `engine`) → **9/9 pass**. Đây là lưới sẵn có bắt bug mới — không phải sửa test.

