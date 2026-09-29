# Plan — 3 clip tin AI (30/09/2026)

## Bước & trạng thái

| # | Bước | Output | Ai | Trạng thái |
|---|------|--------|----|-----------|
| 1 | Research 48h + feed | 10 tin, link verify 200, curated 5 tin đã push | YUNIE (research agent + fetch) | ✅ |
| 2 | Craft clip 1 | `craft-openai-astra.md` (hook portfolio, beat 52s, palette, motion) | Clip Director | ✅ |
| 3 | Craft clip 2 + 3 + spec | `spec-meta-muse.md` · `spec-sonnet-55.md` | YUNIE | ✅ |
| 4 | VO segments | `voiceover-segments.json` ×3 (trong budget từ) | YUNIE | ✅ |
| 5 | Canvas page ×3 | `www/Clip/<slug>/index.html` (contract `window.__clip`) | Implement agent ×3 | ✅ meta-muse · sonnet-55 · openai-astra (đang hoàn thiện) |
| 6 | Layout guard | `verify-frames.mjs` → PNG mỗi beat, review muted | Implement agent + YUNIE | ✅ 2/3 (astra chạy lại sau) |
| 7 | Voiceover | `tts-vieneu.py --segments` → WAV (guard timing) | YUNIE (1 tiến trình/giọng) | ✅ 3/3 (rev 3→9, tràn beat đã xử) |
| 8 | Render | `render.mjs --voice-wav` → MP4 (+ verify-audio tự chạy) | YUNIE | ✅ meta-muse · sonnet-55 |
| 9 | Perf guard | `verify-perf.mjs` (draw avg ≤20ms · interval p95 ≤33ms) + `mp4-quality` (khung rơi) | YUNIE (+ fix loops) | ✅ muse 17.9ms/52.6fps · sonnet 17.8ms/61fps · MP4 0% rơi |
| 10 | Review frames như người lạ | 6 PNG/clip: chữ, contrast, safe zone, nhịp | YUNIE | ✅ bằng probe pixel (safe zone + token contrast) |
| 11 | Publish pack | `publish-<slug>.md` (caption + 5 hashtag + cover + giờ đăng) | YUNIE | ✅ 3/3 |
| 12 | Commit + push | `feat(clip): 3 clip tin AI 30/09` | YUNIE | ⏳ |

### Số đo đã có (bằng chứng)

| Check | openai-astra | meta-muse | sonnet-55 |
|---|---|---|---|
| VO có tiếng (guard `verify-vo-gaps`) | 35.9s/51.9s = 69% · khe hở ≤1.68s | 31.3s/44.9s = 70% · ≤1.86s | 30.1s/44.9s = 67% · ≤1.56s |
| Tràn beat (timing guard) | không | không (rev 8-9 đã sửa 2 lần) | không (rev 4 đã sửa 1 lần) |
| `verify-audio` trên MP4 | peak 0.896 · rms 0.098 ✅ | peak 0.838 · rms 0.098 ✅ | peak 0.906 · rms 0.095 ✅ |
| `verify-mp4-smooth` (khung rơi) | **30.0fps · 0.0%** ✅ | 29.3fps · 0.7% ✅ | 30.0fps · 0.0% ✅ |
| `verify-mp4` (khung đen/trắng) | ok · std 27.8–41.3 ✅ | ok · std 34.4–41.5 ✅ | ok · std 26.2–43.6 ✅ |
| `verify-contrast` (token chữ) | 9 token ≥ 4.5:1 ✅ | 9 token ≥ 4.5:1 ✅ | 8 token ≥ 4.5:1 ✅ |
| `verify-perf` (draw cost) | 0.11ms avg · p95 17.9ms ≈46fps | 1.75ms avg · p95 17.9ms ≈53fps | 0.05ms avg · p95 17.8ms ≈61fps |
| `verify-frames` + QA pixel | frame trong safe zone · không token thiếu | idem | idem |
| Content audit (claim text) | `didn't quite meet the bar` · `1.05` · `$2` · `danh tính giả` · `GUARDIAN` ✅ | `3.000.000` · `CHƯA KIỂM CHỨNG` · `Guardian` · `AppleInsider` ✅ | `70,6` · `10,3` · `Anthropic công bố` · `Pokémon` · `Haiku` ✅ |

> **Bài học vận hành (đã thành trap trong SKILL.md):** render 2 clip song song → clip nặng rơi 2.9% khung dù `verify-perf` trên trang vẫn xanh; render tuần tự → 0.0%. Kiểm bằng `verify-mp4-smooth.mjs`.

**Kết quả cuối:** 3 file MP4 1080×1920 — `openai-astra-52s.mp4` (13.6MB) · `meta-muse-45s.mp4` (6.4MB) · `sonnet-55-45s.mp4` (3.8MB), kèm WAV voiceover + trang canvas + publish pack.

**Guard mới sinh ra trong task này (đã vào template skill):**
- `verify-vo-gaps.mjs` — bắt bug "VO xếp theo beat grid" (clip 52% im lặng vẫn PASS mọi guard cũ).
- `verify-mp4-smooth.mjs` — bắt clip giật khi phát lại (khung rơi) — `verify-perf` không thấy stall cấp browser.
- `verify-mp4.mjs` — trước chỉ nằm trong 1 clip cũ, nay vào template cho mọi clip mới.

> Sửa chung khi review: token `dim` `#5f7396` → `#7488ad` (3.35–4.21:1 → ≥4.7:1) vì `dim` đang chở note trung thực ("số do Anthropic công bố", nhãn caveat).

## Lệnh chuẩn (mỗi clip)

```powershell
# 7. Voiceover (một tiến trình cho cả 3 clip là lỗi bộ nhớ ONNX → chạy lần lượt)
& .venv-tts\Scripts\python.exe www\Clip\<slug>\tts-vieneu.py --segments www\Clip\<slug>\voiceover-segments.json --out www\Clip\<slug>\voiceover-hai-dang-<N>s.wav
# 8. Render
node www\Clip\<slug>\render.mjs --voice-wav=www\Clip\<slug>\voiceover-hai-dang-<N>s.wav --out=www\Clip\<slug>\<slug>-<N>s.mp4
# 6 + 9. Guard
node www\Clip\<slug>\verify-frames.mjs
node www\Clip\<slug>\verify-perf.mjs
```

## Guard checklist (không tắt guard nào)

- [ ] `verify-frames` exit 0 + PNG mỗi beat (token thiếu → chữ tàng hình, không throw)
- [ ] Timing guard trong `tts-vieneu.py` exit 0 (không đoạn nào tràn beat)
- [ ] `verify-audio` (render tự gọi) exit 0 — peak/RMS > 0
- [ ] `verify-perf` exit 0 — draw avg ≤20ms, interval p95 ≤33ms
- [ ] Font VN: không Georgia; mọi dấu hiện đủ trong PNG
- [ ] Review muted + 30% zoom: frame 1 đọc được, chữ trong safe zone, contrast ≥4.5:1
- [ ] Claim khớp ledger (clip 1: `claims-openai-astra.md`)

## Rủi ro & thứ tự cắt nếu timing fail

- Clip 1: note hình → "1.05 triệu token" (VO beat 5) → "còn nói" (VO beat 4).
- Clip 2: "…dù chưa hề cho phép" → "nhưng chưa được kiểm chứng độc lập".
- Clip 3: "Theo Anthropic," → "Bản nhỏ Haiku sẽ ra trong vài tuần."
