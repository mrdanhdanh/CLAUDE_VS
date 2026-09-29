> 🤖 Auto-log bởi auto-learn.mjs — 2026-09-27T15:10:11.690Z
> **Error:** `Voiceover 50s: 7 doan dat theo beat grid de lai 6 khoang lang ~2.2s giua beat (do RMS 20ms: 42% im lang, voiced 29.1s/50s) - nguoi nghe phan hoi 'lung cung'`
> **File:** `www/Clip/age-of-giants/voiceover-segments.json`
> **Title:** VO xep theo beat grid - gap 2s gay cam giac lung cung

# Bug: VO xếp theo beat grid — khe hở 2s gây cảm giác "lưng cứng"

## Meta

- **Slug:** `2026-09-27-vo-xep-theo-beat-grid-gap-2s-gay-cam-giac-lung-cun`
- **Ngày:** 2026-09-27 (tái lập & nâng lưới: 2026-09-30)
- **Severity:** `major`
- **Detection:** `manual` (2026-09-27, người nghe) → `machine` (2026-09-30, `verify-vo-gaps.mjs`)
- **Detection rule:** `gap-internal-max > 2s` hoặc `voiced-ratio < 0.65` trên WAV voiceover / MP4.
- **Layer:** `measure-verifier` — lỗi ở tầng ĐO: `verify-audio.mjs` chỉ hỏi "có tiếng không", không hỏi "tiếng có đều không"; `verify-frames`/timing guard đều mù với im lặng.
- **Reporter:** @user → YUNIE
- **Related KN:** KN-083 (guard perf cùng họ "fail im lặng") — mục KN riêng chờ `propose`.
- **Tags:** `ui` `audio` `clip` `verify` `tts`
- **Guard:** `www/Clip/<slug>/verify-vo-gaps.mjs` (nguồn: `.github/skills/video-clip/templates/verify-vo-gaps.mjs`)
- **Status:** `fixed`

---

## 1. Reproduce

### Steps
1. Viết `voiceover-segments.json` với `at` = mốc beat + 0.3s, lời ngắn (khoảng 2 từ/giây).
2. Sinh WAV: `tts-vieneu.py --segments ... --out voiceover-<voice>-<N>s.wav`.
3. Đo: đếm khung RMS < 0.01 (cửa sổ 60ms) → tính khe hở giữa các đoạn.

### Expected vs Actual
- **Expected:** ≥65% thời lượng có tiếng; không khe hở nội bộ nào > 2s.
- **Actual (clip `openai-astra` 52s, rev 1):** có tiếng 27.0s/52s = **52%**; khe hở nội bộ tới **5.9s** (giữa beat 3 và beat 4).

### Evidence
```
Clip openai-astra rev1: voiced=27.0s/52s (52%); gaps: 2.3s · 2.74s · 5.9s · 2.94s · 5.4s
Clip meta-muse  rev1: voiced=23.4s/45s (52%)
Clip sonnet-55  rev1: voiced=24.0s/45s (53%)
→ cả 3 clip đều "lưng cứng" dù `verify-audio` PASS (peak 0.9x), timing guard PASS (không tràn beat)
```

### Environment
- Branch: `main` · OS: Windows · TTS: VieNeu v3 Turbo (48 kHz, CPU) · Guard: `verify-audio.mjs` + timing guard (đều PASS)

---

## 2. Root Cause (5 Whys)

- **File:Line:** `www/Clip/<slug>/voiceover-segments.json` (`at` = beat + 0.3s) + thiếu guard đo mật độ
- **Why 1:** Người xem nghe 5–6 giây im lặng giữa clip → cảm giác "lưng cứng".
- **Why 2:** Lời mỗi beat chỉ chiếm ~50% cửa sổ beat; phần còn lại là im lặng.
- **Why 3:** `at`/`end` được đặt theo **lưới beat** (mốc hình), không theo **độ dài lời thật** — TTS đọc nhanh hơn ước lượng, và mỗi đoạn còn ~0.3–0.5s đuôi im lặng.
- **Why 4:** Không ai đo mật độ lời: `verify-audio` chỉ kiểm "có tiếng", timing guard chỉ kiểm "tràn beat" ⇒ im lặng là vùng mù của cả 2 guard.
- **Why 5 (Root):** Thiếu **máy đo** cho thuộc tính "đều tiếng" ⇒ lỗi chỉ bắt được bằng tai người, mỗi clip mới lặp lại từ đầu (không có lưới).

- **Impact:** Mọi clip dùng TTS segments (toàn bộ kênh clip) — ảnh hưởng retention, không có exception nào báo.
- **Hypothesis:** "VO vào đúng mốc beat là chuẩn" — SAI; chuẩn là VO **phủ** timeline ở mức 75–85%.
- **Confidence:** `HIGH` (đo trước/sau trên 3 clip + guard mới chạy thật).

---

## 3. Fix

- **Approach:** (a) viết dày lời tới ~4 từ/giây tiếng Việt (đo thật từ log TTS), (b) cho VO vào sớm ~0.3s **trước** mốc cắt hình (audio lead-in) thay vì +0.3s sau, (c) thêm guard `verify-vo-gaps.mjs` để lần sau máy bắt.
- **Files Changed:**
  - `.github/skills/video-clip/templates/verify-vo-gaps.mjs` — guard mới (RMS 60ms, khe hở ≤2s, có tiếng ≥65%, end card báo riêng)
  - `.github/skills/video-clip/SKILL.md` — bảng Guard + lệnh kiểm + checklist + bảng Traps
  - `www/Clip/{openai-astra,meta-muse,sonnet-55}/voiceover-segments.json` — rev 2→9 (dày lời + lead-in)
- **Diff tóm tắt:**
```diff
- "at": 32.8, "text": "Thay vào đó, OpenAI ra Sol: gần bằng Astra…"      // 8.9s lời trong 11.2s cửa sổ
+ "at": 32.65, "text": "Thay vào đó, OpenAI ra mắt Sol đúng hôm DevDay: … ngữ cảnh hơn một triệu token, giá hai đô mỗi triệu token vào, và chạy nhanh gấp đôi."
+ node www\Clip\<slug>\verify-vo-gaps.mjs ...   // guard mới
```
- **Non-Goals:** không đổi giọng đọc, không đổi duration clip, không sửa `render.mjs`.
- **Fix Confidence:** `HIGH`.

---

## 4. Verification

- [x] Re-run reproduce → Fixed: clip 1 **80%** có tiếng (41.6s/52s), khe hở dài nhất **1.68s**
- [x] Edge cases: clip 2 (70% · 1.86s) · clip 3 (67% · 1.56s) — cả 3 `verify-vo-gaps` exit 0
- [x] Regression: `verify-audio` vẫn PASS (peak 0.92–0.98) · timing guard không tràn beat
- [x] Guard mới fail loud đúng lúc (đã bắt 5 vòng lỗi thật trong lúc làm 3 clip này: 2.04s · 2.16s · 2.22s · 64%)
- [x] Fresh-eyes tier: `REQUIRED` (UX/âm thanh)

**Kết quả:**
```
openai-astra: ✅ 35.94s/52s (69%) · khe hở dài nhất 1.68s · end card 2.52s
meta-muse:    ✅ 31.32s/45s (70%) · khe hở dài nhất 1.86s · end card 2.16s
sonnet-55:    ✅ 30.06s/45s (67%) · khe hở dài nhất 1.56s · end card 3.06s
```

---

## 5. Lesson (1 câu)

> Lời thoại phải **phủ** timeline (75–85% có tiếng, không khe hở > 2s) — "có tiếng" không đồng nghĩa "đủ tiếng"; đo bằng `verify-vo-gaps.mjs`.

---

## 6. Prevention

- **Cách phòng tránh lần sau:**
  - [x] Trong `voiceover-segments.json`: viết ~4 từ/giây; `at` = mốc beat − 0.3s (lead-in)
  - [x] Chạy `verify-vo-gaps.mjs` **trước** render (đã thêm vào checklist skill)
- **Guard (lưới chống tái lập — KN-056):**
  - [x] `www/Clip/<slug>/verify-vo-gaps.mjs` (template trong `.github/skills/video-clip/templates/`)
- **Cần cập nhật:**
  - [x] `.github/skills/video-clip/SKILL.md` (Guard + Traps + Checklist)
  - [ ] `docs/knowleged.md` → KN mới (chờ `auto-learn propose`)

---

## References

- `docs/knowleged.md` (KN-083 cùng họ "guard im lặng")
- Clips: `www/Clip/openai-astra` · `www/Clip/meta-muse` · `www/Clip/sonnet-55`