# Plan — Clip "Thời của người khổng lồ" (42s · 7 beat · rev2 retime)

> Craft đã chốt ở `prd.md` + `design.md` (style **FIRE & LATTICE**). Plan này là lớp kỹ thuật — Implement chạy theo pipeline `video-clip` 7 phase.
> **Contract bắt buộc:** trang clip expose `window.__clip = { duration: 42, width: 1080, height: 1920, draw, beats, freeze: false }`; `draw(t)` **suy ra mọi thứ từ `t`** — không state tích lũy, không `if (lastT < t)`, không biến đếm ngoài closure; random dùng PRNG seed cố định.

## Todos (7)

1. **Scaffold** `www/Clip/age-of-giants/` — copy `tts-vieneu.py`, `render.mjs`, `verify-audio.mjs`, `verify-frames.mjs` từ `.github/skills/video-clip/templates/` + copy `voiceover-segments.draft.json` → `voiceover-segments.json`.
2. **Canvas page** `www/Clip/age-of-giants/index.html` — style FIRE & LATTICE, 7 beat đúng `design.md` §1 (kèm `sub` + `size`, title ngắt dòng bằng `\n`), token đúng §3, lưới đúng §4, 7 motif + 7 interrupt đúng §5, `SUBS[]` đúng §9; font **Arial/Segoe UI/Consolas** (cấm Georgia — KN-082); **bake** nền + overlay tĩnh thành texture 1 lần, cache strip/layout chữ, `getContext('2d', { alpha: false })` (KN-083). **Reference implementation đã đo perf:** `www/Clip/lang-ai-era/index.html` (cấu trúc 7 beat tương tự) — copy mẫu `TOKENS / beats / SUBS / layoutLines cache` rồi đổi nội dung.
3. **Khớp lời ↔ beat** — `SUBS[]` phải **đúng text** trong `voiceover-segments.json` (tách dòng được, thêm `hi` để highlight); sửa lời thì giữ **pacing rule rev2**: gap giữa các đoạn ≤0.6s · tổng clip ≤42s · beat hình suy từ mốc lời (xem `design.md` §2).
4. **Guard layout** — `verify-frames.mjs` ở các mốc beat + mốc interrupt, **mở ảnh xem như người lạ muted**: `--marks=2.1,4.5,6.5,8.5,12.5,15,18,20,24.5,26.5,30,31.5,36,38.5,41.5`.
5. **Guard perf** — `verify-perf.mjs`: command **avg ≤20ms** + nhịp rAF **interval p95 ≤33ms** quét toàn timeline; in worst frames kèm `t` (ngưỡng KN-083).
6. **TTS + guard timing** — VieNeu `--voice "Hải Đăng" --segments` → WAV; `tts-vieneu.py` tự **exit 1 nếu tràn beat**; sau đó `verify-audio.mjs` trên WAV (im lặng = fail).
7. **Render + publish** — `render.mjs --voice-wav` (tự chạy `verify-audio` trên MP4, `freeze=true` khi capture) → MP4; chốt `publish.md` + chấm rubric C1–C8 + Evals mini (đọc lại 7 khung như người lạ).

## Files

- `www/Clip/age-of-giants/index.html` — trang clip (contract `window.__clip`)
- `www/Clip/age-of-giants/voiceover-segments.json` — 7 đoạn khớp beat (nguồn: `.agent/plans/age-of-giants-tiktok/voiceover-segments.draft.json`)
- `www/Clip/age-of-giants/{tts-vieneu.py, render.mjs, verify-audio.mjs, verify-frames.mjs}` — copy nguyên từ template
- Output: `voiceover-hai-dang-42s.wav` + `age-of-giants-42s.mp4`

## Lệnh

```powershell
# 1. Guard layout (trước khi TTS — bắt token thiếu/chữ tàng hình + tràn safe zone)
node www/Clip/age-of-giants/verify-frames.mjs --marks=2.1,4.5,6.5,8.5,12.5,15,18,20,24.5,26.5,30,31.5,36,38.5,41.5

# 2. Guard perf (sau khi đổi hiệu ứng; clip mới nên chạy sớm)
node www/Clip/age-of-giants/verify-perf.mjs

# 3. Voiceover (guard timing tự chạy — tràn beat là exit 1)
$env:HF_HOME='D:\hf-cache'; $env:PYTHONIOENCODING='utf-8'
D:\CLAUDE_VS\.venv-tts\Scripts\python.exe www/Clip/age-of-giants/tts-vieneu.py --voice "Hải Đăng" --segments www/Clip/age-of-giants/voiceover-segments.json --out www/Clip/age-of-giants/voiceover-hai-dang-42s.wav
node www/Clip/age-of-giants/verify-audio.mjs www/Clip/age-of-giants/voiceover-hai-dang-42s.wav   # duration ≈ 42s, peak > 0

# 4. Render (tự chạy guard audio trên MP4)
node www/Clip/age-of-giants/render.mjs --voice-wav=www/Clip/age-of-giants/voiceover-hai-dang-42s.wav --out=www/Clip/age-of-giants/age-of-giants-42s.mp4
```

## Rủi ro & đối sách (từ bug đã trả giá)

| Rủi ro | Đối sách |
|---|---|
| Lời VO tràn beat (guard exit 1) | Budget đã ở margin 13–22% (`design.md` §2) — tràn thì **rút lời**, không kéo dài beat |
| Chữ dấu vỡ im lặng (font thiếu glyph) | Chỉ dùng Arial/Segoe UI/Consolas; đo `video-clip/references/font-test.mjs` trên máy render trước khi build (KN-082) |
| Clip giật/lặp khung (draw quá nặng) | Bake gradient/overlay tĩnh thành texture, cache strip + layout chữ, `alpha:false`; đo bằng `verify-perf` (KN-083) |
| Chữ tàng hình (`C.<key>` undefined không throw) | Một object token `C` duy nhất + `verify-frames` quét token trước khi chụp |
| Chữ đè nhau khi title wrap 3 dòng | `wrap()` **trả về Y cuối** → sub đặt động bên dưới |
| MP4 có track audio nhưng im ru | `decodeAudioData` + `BufferSource` (không `new Audio('file://…')`); `render.mjs` tự guard audio |
| Vòng rAF của trang chạy song song capture | `window.__clip.freeze = true` trước khi capture |
| Nội dung bị hiểu là "tin khoa học" | Nhãn `quan điểm cá nhân` trên B1 + end card + caption; Malraux ghi "(câu được trích phổ biến)" |
| Chữ lọt ra ngoài dải y 750–1400 / x 90–900 | Guard mắt: mở ảnh từng mốc, đo bằng mắt + assert trong verify-frames nếu có thể |

## Ràng buộc không được vi phạm

- **rev2: 42s** · 7 beat · beat cuối kết thúc **đúng 42**; `beats[]` trong `index.html` khớp `voiceover-segments.json` (rev2).
- Lời VO: **163 âm tiết**, các đoạn xếp liên tục (gap ~0.5s) — không nhồi thêm.
- Không claim khoa học/số liệu; không doom; kết mở tích cực.

## Kết quả — DONE (2026-09-27, YUNIE)

### rev1 — 50s (21:37) — ⚠️ thay bởi rev2

- ✅ Render `age-of-giants-50s.mp4` (15.2 MB) + guards pass — nhưng **42% im lặng** (6 khoảng lặng ~2.2s giữa beat) → nghe "lủng củng".
- 📌 Perf: `verify-perf` báo `max` ~1.4s tại t≈36s — **artifact của vòng đo back-to-back** (GC theo khối lượng alloc, chu kỳ ~143 draw khi vẽ liên tục 1 task). Mô phỏng đúng vòng render thật (rAF-paced, 2993 frame): **0 frame chậm**, gap p95 18.4ms, 59.8fps. Gate (avg + interval p95) là gate đúng.

### rev2 — 42s (22:00) — ✅ BẢN CHỐT

- **Root cause "lủng củng":** budget 4.2 âm tiết/giây nhưng TTS đọc ~5.7 âm tiết/giây → mỗi đoạn lời ngắn hơn cửa sổ beat ~40% → dư dồn thành im lặng cuối beat.
- **Fix:** các đoạn lời xếp LIÊN TỤC (gap ~0.5s), tổng 42s; beat hình suy từ mốc lời (visual lead 0.45s). Đo lại WAV: gap 0.27–1.09s (chủ yếu 0.3–0.6s), voiced 72% (trước 60%).
- ✅ **Render:** `www/Clip/age-of-giants/age-of-giants-42s.mp4` — 12.6 MB · 42s · 30fps · avc1+mp4a
- ✅ **Guards:** verify-frames (frames mới 21:54–21:56) · verify-perf pass · verify-audio WAV 42s (peak 0.94) + MP4 (peak 0.94 · 41.94s)
- ✅ **Video content (one-off):** 4 mốc 3.1/16/30/40s đều có hình thật (111–157 màu) — không có bug "video đen"
- ✅ **Rubric C1–C8: 8/8** — C1 ✅ (3.1s muted đọc được) · C2 ✅ 7/7 beat · C3 ✅ 0 vi phạm safe zone · C4 ✅ VO 42s không tràn (guard `--segments`) · C5 ✅ nhãn nguồn + "quan điểm cá nhân" ≥2 chỗ · C6 ✅ 0 claim khoa học, Malraux có nhãn · C7 ✅ ember nối về lửa (frame 41.5s) · C8 ✅ 3 guard pass
- 📌 **Publish:** `publish.md` cập nhật sang 42s (cover backup 38.5s).

### rev2.1 — sub re-sync (22:10) — ✅

- **Đo WAV 42s (RMS 10ms):** 7/14 sub câu-2-trong-đoạn trễ 0.2–0.5s so với giọng (sub #2 trễ 0.49s — do rev2 ước lượng theo âm tiết, không đo).
- **Fix:** `at` = onset giọng − 0.1s (đo thật); chỉnh `end` sub trước cho khớp. Render lại MP4.
- ✅ Guards sau fix: verify-frames (15/15 token · khung 2.3/6.9/12.4/18.5/29.4/37.5s xác nhận sub hiện đúng) · verify-audio MP4 (peak 0.94 · 41.94s) · video content 4/4 mốc có hình.

## rev2 — Retime 42s (27/09 tối, sau feedback "nghe lủng củng")

- **Root cause (đo, không đoán):** bản 50s xếp lời theo beat grid → 6 khoảng lặng cấu trúc ~2.2s giữa beat; đo RMS 20ms trên WAV: **42% im lặng** (voiced 29.1s/50s) → staccato.
- **Fix:** lời xếp LIÊN TỤC (gap 0.5s), tổng **42s**; beat hình **suy từ mốc lời** (visual lead 0.45s); scene co giãn về khung gốc bằng `sc(i, oldAt, oldLen)` (một dòng/scene — không sửa số bên trong scene). Đo lại: max gap 1.08s; ~29% im lặng (phần lớn là nghỉ giữa câu ≤0.6s).
- ✅ **Render rev2:** `www/Clip/age-of-giants/age-of-giants-42s.mp4` — 13.2 MB · 42s · 30fps · avc1+mp4a · audio ✅ (peak 0.94)
- ✅ **Guards rev2:** frames (token 15/15 · đã xem 15 khung sau retime) · perf (avg 5.9ms · interval p95 17.8ms ≈ 60fps) · audio WAV + MP4 ✅
- ✅ **Rubric C1–C8 vẫn 8/8** — C1 cover dời 3.1s→**2.1s**; C4 VO 42s không tràn.
- ⚠️ **Ghi chú TTS (đã đo 2 lần chạy):** duration từng đoạn **dao động ±5–8%** giữa các lần chạy (vocoder sampling) — rerun TTS thì kiểm guard + gap từng cặp đoạn; muốn cố định → `compose_segments` cần layout động theo dur thật (đề xuất cải tiến cho skill `video-clip`, chưa thực hiện).
