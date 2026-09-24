> 🤖 Auto-log bởi auto-learn.mjs — 2026-09-23T16:26:25.868Z
> **Error:** `MediaRecorder xuat MP4 co track mp4a nhung peak=0 rms=0: createMediaElementSource voi new Audio('file://...') tren trang file:// bi coi la cross-origin nen graph WebAudio nhan toan so 0 du element dang phat (currentTime=1.32, ctx.state=running)`
> **File:** `www/space-bunny-free/render.mjs`
> **Title:** clip im tieng du co audio track

> 🔁 **RADAR TÁI LẬP** — đối chiếu KN + bug cũ thấy nghi vấn:
> - 🔁 NGHI TÁI LẬP **[KN-053]** (score 65.4): `git checkout HEAD -- <file>` revert nhầm refactor chưa commit — recover bằng VS Code Local History
> - 🔁 NGHI TÁI LẬP **[KN-025]** (score 58.7): Procedural Graphs + A-JIT — Self-Evolving Execution Structures (2609.09153v1, 2609.10248v1)
> - 🔁 NGHI TÁI LẬP **[KN-066]** (score 56.6): KN ID double-yield: đa phiên song song cùng nhận 1 ID — re-check trước paste + detector integrity sau paste
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-23-space-bunny-mo-ta-sai`** (score 69.2): space-bunny-mo-ta-sai
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-23-mau-thieu-lam-chu-tang-hinh`** (score 55.8): mau thieu lam chu tang hinh
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-08-31-random-step-btn-disabled`** (score 50.5): Random làm disable nút ▶ Bước tiếp theo (Bài 004 & 005)
> → Đọc **Cách phòng tránh** trong `docs/knowleged.md` TRƯỚC khi fix. Nếu là tái lập thật: ghi rõ "tái lập của KN-053" + **vì sao lưới cũ không bắt được** → nâng lưới (Guard) rồi mới fix.
# Bug: clip im tieng du co audio track

## Meta

- **Slug:** `2026-09-23-clip-im-tieng-du-co-audio-track`
- **Ngày:** 2026-09-23
- **Severity:** `major`
- **Detection:** `UNKNOWN`
- **Layer:** `code` — pipeline nạp tiếng của renderer
- **Reporter:** user (“sao tôi không nghe gì hết”)
- **Related KN:** `—` (chưa có KN cho WebAudio + file://; xem §6)
- **Tags:** `ui` `async` `media`
- **Guard:** `www/space-bunny-free/verify-audio.mjs` — soi box `soun`/`mp4a` + `decodeAudioData` đo peak/RMS, exit 1 nếu im lặng
- **Status:** `fixed`

---

## 1. Reproduce

### Steps
1. `node www/space-bunny-free/render.mjs --out=...mp4` → chạy xong, in `"audio": true`.
2. `node www/space-bunny-free/verify-audio.mjs <file>`
3. Mở file bằng bất kỳ player nào → không có tiếng.

### Expected vs Actual
- **Expected:** voiceover tiếng Việt 48 s trong MP4.
- **Actual:** file có track audio (`soun` + `mp4a`) nhưng **peak = 0, rms = 0** — im lặng toàn phần; `"audio": true` chỉ là cờ “đã cố gắng”, không phải bằng chứng.

### Evidence
```
{"hasAudioTrack": true, "formats": ["mp4a", "avc1"], "decodedAudio": {"peak": 0, "rms": 0}, "verdict": "⛔ SILENT / NO AUDIO"}   ← trước fix
{"mediaElement": {"peak": 0, "state": "running", "currentTime": 1.32},
 "bufferSource": {"peak": 0.9627, "duration": 48.19}}                                                                             ← A/B test
```

### Environment
- Branch: `main`
- OS/Browser: Windows 11 · Chromium headless (Playwright 1.62.1), trang `file://`

---

## 2. Root Cause (5 Whys)

- **File:Line:** `www/space-bunny-free/render.mjs` — `new Audio(wavUrl)` + `audioCtx.createMediaElementSource(audio)`
- **Why 1:** File MP4 im tiếng dù recorder có track audio.
- **Why 2:** Nguồn tiếng trong graph WebAudio phát ra toàn số 0.
- **Why 3:** `createMediaElementSource` trả 0 khi resource của element bị coi là cross-origin (không CORS) — luật “bẩn” giống canvas, không có exception.
- **Why 4:** Trang chạy bằng `file://`; Chromium coi `file://` là opaque/cross-origin → element **vẫn phát bình thường** (`currentTime=1.32`, `ctx.state=running`) nhưng graph chỉ nhận im lặng → bug “im lặng” không có triệu chứng nào ngoài tai nghe.
- **Why 5 (Root):** Chọn đường nạp tiếng dựa trên “element phát là được” mà không có phép đo nào kiểm chứng tiếng đã đi vào file; cờ `audio: true` chỉ ghi ý định.

- **Impact:** Mọi clip render ra đều im tiếng — không xuất bản được.
- **Hypothesis:** Taint từ `file://` → kiểm bằng A/B: cùng file WAV, đo peak qua analyser cho 2 đường nạp.
- **Confidence:** `HIGH` (A/B tách biệt biến, guard fail trước fix + pass sau fix)

> Tái lập hay không: RADAR gợi ý 6 KN/bug cũ nhưng **không khớp** (KN-053 là git checkout, KN-066 là KN ID, còn lại là UI/logic khác). Đây là bug mới.

---

## 3. Fix

- **Approach:** Bỏ hẳn media element — đọc WAV ở Node → base64 → `decodeAudioData` → `createBufferSource` nối thẳng vào `MediaStreamAudioDestinationNode`; thêm guard âm thanh chạy tự động sau khi render, fail exit 1.
- **Files Changed:**
  - `www/space-bunny-free/render.mjs` — thay đường nạp tiếng; `voice.start()` đúng lúc `recorder.start()`; gọi guard sau khi ghi file.
  - `www/space-bunny-free/verify-audio.mjs` — mới: soi box + đo peak/RMS, có `--diagnose` A/B và `--codecs`.
- **Diff tóm tắt:**
```diff
-const audio = new Audio(wavUrl);
-const source = audioCtx.createMediaElementSource(audio);
-source.connect(dest);
-await audio.play();
+const decoded = await audioCtx.decodeAudioData(bytes.buffer);
+voice = audioCtx.createBufferSource();
+voice.buffer = decoded;
+voice.connect(dest);
+voice.start();
```
- **Non-Goals:** Không cài ffmpeg, không đổi container/codec, không đổi giọng đọc.
- **Fix Confidence:** `HIGH`
- **get_errors:** 0 errors trên `render.mjs` + `verify-audio.mjs`.

---

## 4. Verification

- [x] Re-run reproduce → **Fixed**: `{"peak": 0.975, "rms": 0.1033, "duration": 48.13, "verdict": "✅ AUDIO OK"}`
- [x] Edge cases:
  - [x] Track vẫn là `mp4a` + `avc1` (player phổ thông đọc được, không phải Opus-in-MP4)
  - [x] Audio 48.13 s nằm trong video 50 s → không bị cắt
- [x] Regression: video vẫn 50 s/30 fps, 6,132,805 bytes, `ftypisom`
- [x] `get_errors` toàn scope file đã sửa → 0 errors
- [x] Fresh-eyes tier: `REQUIRED` (media/UX) — đo bằng `verify-audio.mjs`, không nghe bằng cảm giác

**Kết quả:**
```
{"mime":"video/mp4;codecs=avc1.42E01E,mp4a.40.2","bytes":6132805,"duration":50,"fps":30,"audio":true}
{"hasAudioTrack":true,"formats":["avc1","mp4a"],"decodedAudio":{"duration":48.13,"peak":0.975,"rms":0.1033},"verdict":"✅ AUDIO OK"}
```

---

## 5. Lesson (1 câu)

> Trên trang `file://`, `createMediaElementSource` trả im lặng (0) dù element vẫn “chạy” — cờ `audio: true` chỉ là ý định; muốn biết clip có tiếng thì phải **decode track trong file ra và đo peak/RMS**.

---

## 6. Prevention

- **Cách phòng tránh lần sau:**
  - [x] Không dùng media element để đưa tiếng vào WebAudio capture — dùng `decodeAudioData` + `BufferSource` (cùng origin, không bị taint).
  - [x] Guard `verify-audio.mjs` chạy **trong** `render.mjs` sau khi ghi file → im lặng là fail, không ship.
  - [ ] Thêm checklist vào `docs/knowleged.md` Anti-patterns / Checklist phòng tránh chung
- **Guard (lưới chống tái lập — KN-056):**
  - [x] `- **Guard:**` đã điền ở Meta → `www/space-bunny-free/verify-audio.mjs` (exit 1 khi im lặng; đã chứng minh FAIL trên file lỗi và PASS trên file sửa)
  - [x] Không phải tái lập (RADAR không khớp KN/bug nào)
- **Cần cập nhật:**
  - [ ] `docs/knowleged.md` → `KN-XXX` — đề xuất qua `propose --bug 2026-09-23-clip-im-tieng-du-co-audio-track`
  - [x] Test mới: `www/space-bunny-free/verify-audio.mjs`

---

## References

- `www/space-bunny-free/render.mjs` · `verify-audio.mjs` · `voiceover.wav`
- `.agent/plans/space-bunny-tiktok/plan.md`
- Issue / PR: #
- Commit fix: `<pending>`

---
*Template: `.agent/bugs/_template/bug.md` — dùng bởi `/fixbug` Phase 1 & 5.*
