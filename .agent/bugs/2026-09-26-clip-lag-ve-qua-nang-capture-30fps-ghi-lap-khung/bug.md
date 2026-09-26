> 🤖 Auto-log bởi auto-learn.mjs — 2026-09-26T11:26:55.318Z
> **Error:** `Clip 35s giat/lag: MediaRecorder 30fps ghi lap khung vi draw(t) qua cham (do: frame interval p95 47.7ms = 22.9fps, stall 1111ms). Khong throw, khong loi console, MP4 van ra binh thuong.`
> **File:** `www/lang-ai-era/index.html`
> **Title:** clip lag ve qua nang - capture 30fps ghi lap khung

> 🔁 **RADAR TÁI LẬP** — đối chiếu KN + bug cũ thấy nghi vấn:
> - 🔁 NGHI TÁI LẬP **[KN-082]** (score 123.6): Font thiếu coverage tiếng Việt vỡ dấu im lặng trong canvas clip (Georgia)
> - 🔁 NGHI TÁI LẬP **[KN-037]** (score 79.9): Evals Gap — "single biggest predictor" là evals discipline (Andrew Ng, Agentic AI Playbook 2026)
> - 🔁 NGHI TÁI LẬP **[KN-039]** (score 67.4): PS 5.1 không hỗ trợ `??` — lệnh PowerShell fail parse "Unexpected token"
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-26-font-georgia-vo-dau-tieng-viet-trong-canvas-clip`** (score 96.5): Font Georgia vỡ dấu tiếng Việt trong canvas clip (TIN AI)
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-26-clip-jargon-noi-bo-khong-hieu`** (score 91.6): clip jargon noi bo khong hieu
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-23-clip-im-tieng-du-co-audio-track`** (score 69.2): clip im tieng du co audio track
> → Đọc **Cách phòng tránh** trong `docs/knowleged.md` TRƯỚC khi fix. Nếu là tái lập thật: ghi rõ "tái lập của KN-082" + **vì sao lưới cũ không bắt được** → nâng lưới (Guard) rồi mới fix.
# Bug: Clip lag do vẽ quá nặng — capture 30fps ghi lặp khung (im lặng, không throw)

## Meta

- **Slug:** `2026-09-26-clip-lag-ve-qua-nang-capture-30fps-ghi-lap-khung`
- **Ngày:** 2026-09-26
- **Severity:** `major`
- **Detection:** `user-report`
- **Detection rule:** Một dòng metadata duy nhất, chỉ đúng một enum; không thêm suffix hoặc duplicate field.
- **Layer:** `measure-verifier` — defect sâu nhất: pipeline clip không có phép đo perf nào (guard chỉ quét token + chụp ảnh tĩnh), và gate đầu tiên đo sai execution model. (Code vẽ nặng là triệu chứng gần.)
- **Reporter:** @user (xem clip → "hiệu ứng có vẻ hơi bị lag") / YUNIE
- **Related KN:** `KN-083` (mới) · KN-082 · KN-028 · KN-037 · KN-074
- **Tags:** `ui` `perf` `canvas` `clip` `verify` `guard`
- **Guard:** `tests/e2e/clip-perf-guard.spec.ts` + `www/lang-ai-era/verify-perf.mjs` + `.github/skills/video-clip/templates/verify-perf.mjs`
- **Status:** `fixed`

---

## 1. Reproduce

### Steps
1. Mở `www/lang-ai-era/index.html` (bản 35s rev 1) — `window.__clip.duration = 35`, render MP4 bằng `node render.mjs --voice-wav=voiceover-hai-dang-35s.wav`.
2. Xem MP4: hiệu ứng giật, khung lặp — user phát hiện ngay khi xem ("hiệu ứng có vẻ hơi bị lag").
3. Đo khách quan: `node www/lang-ai-era/verify-perf.mjs` (guard mới, chạy trên bản trang tương ứng) — hoặc tái hiện baseline bằng cách đo bản rev 1.

### Expected vs Actual
- **Expected:** nhịp khung đủ cho capture 30fps — interval p95 ≤ 33.3ms (draw + encoder còn dư đầu).
- **Actual:** interval p95 **47.7ms ≈ 22.9fps**, stall đơn lẻ tới **1111ms**; chi phí vẽ 29.6ms/khung (avg). MP4 vẫn ghi ra bình thường — không throw, không console error.

### Evidence
- Log / screenshot / test fail / video:
```
=== OLD 35s (baseline) ===
{ "command": { "avg": 29.58, "p50": 0.7, "p95": 1.7, "max": 1112.8 },
  "interval": { "avg": 43.68, "p50": 34.7, "p95": 47.7, "max": 1111.4, "fps": 22.89 } }
⛔ perf FAIL — command avg 29.58ms > 20ms · frame interval p95 47.7ms > 33ms

=== NEW 50s (optimized) — sau fix ===
{ "command": { "avg": 10.06 }, "interval": { "p95": 18.6, "fps": 59.57 } }
✅ perf OK — command avg 10.06ms · interval p95 18.6ms (≈59.57fps sustained)
```

### Environment
- Branch: `main`
- Commit: chưa commit (working tree)
- OS/Browser: Windows 11 · Node 22 · Chromium headless (Playwright) · render realtime MediaRecorder (không ffmpeg)

---

## 2. Root Cause (5 Whys)

- **File:Line:** `www/lang-ai-era/index.html` (rev 1) — `bgLayers()` / `overlays()` / `drawHud()` bên trong `draw(t)`.
- **Why 1:** Clip giật vì MediaRecorder capture realtime trong khi `draw(t)` không vẽ kịp nhịp → khung bị ghi lặp.
- **Why 2:** `draw(t)` tốn 29.6ms/khung (vượt ngân sách khi cộng encoder): mỗi khung vẽ lại (a) 2 radial gradient toàn màn hình (glow + vignette), (b) ghost glyph 300px, (c) ~500 `fillText` cho mưa ký tự (36 cột × ~14 ký tự), (d) 50 `roundRect` cho progress bar.
- **Why 3:** Vì sao ship được → không có phép đo **nhịp khung** nào trước render; `verify-frames` chỉ quét token + chụp ảnh tĩnh (nhìn không thấy lag); MP4 vẫn ra "bình thường" — cùng lớp im lặng của KN-082/KN-028 ("guard chỉ chụp, không assert").
- **Why 4:** Vì sao phép đo đầu tiên vẫn "PASS" sai → gate v1 của `verify-perf` dùng **p95 của vòng vẽ back-to-back** (3.2ms) — backpressure CPU/GPU của Chromium tự giãn nhịp giữa các call liên tiếp nên p95 "đẹp"; stall thật (max 2360ms) bị p95 che; metric không khớp execution model thật (rAF-paced).
- **Why 5 (Root):** **Thiếu guard đo chi phí vẽ theo ĐÚNG execution model của render realtime** — ngân sách khung (33.3ms) không ai đo cả trước lẫn sau khi ship; "hiệu ứng đẹp" verify bằng mắt trên ảnh tĩnh, "độ mượt" để user phát hiện.

- **Impact:** Mọi clip canvas render realtime của pipeline; riêng clip #3 (`lang-ai-era`) ở 22.9fps + stall >1s — giật thấy rõ; phát hiện trước khi publish (chưa lên Pages).
- **Hypothesis:** Ban đầu nghi "máy render yếu/encoder" → SAI; đo mới thấy draw chiếm 29.6ms + 4 stall ở mốc scene transition (t≈1.2/9.8/18/26.4).
- **Confidence:** `HIGH` (proven + regression pass — guard e2e 3/3 + đo lại ≈59.6fps trên 2 vòng)

> **RADAR:** không phải tái lập nguyên văn — cùng LỚP với KN-082/KN-028 ("canvas bug sống im lặng vì lưới không assert") nhưng instance mới (perf, không phải font). Lưới cũ không bắt được vì chưa từng có phép đo nào cho nhịp khung.
> **Root Cause Gate:** Đã verify bằng số đo 2 chiều (before/after) — không phải hypothesis.

---

## 3. Fix

- **Approach:** Giữ nguyên "độ giàu" hiệu ứng, cắt chi phí **vẽ lại thứ không đổi**:
  (1) bake nền + glow + ghost glyphs, vignette, dải sáng thành texture 1 lần;
  (2) mưa ký tự → strip cache theo tick 6Hz (36 `drawImage` thay ~500 `fillText`);
  (3) cache layout chữ (title/sub/subtitle — measure + gộp run màu 1 lần);
  (4) canvas `alpha:false`; (5) progress = 3 hình (track+fill+head) thay 50 segment;
  (6) guard mới `verify-perf.mjs` + (7) lưới e2e `clip-perf-guard.spec.ts`.
- **Files Changed:**
  - `www/lang-ai-era/index.html` — rev 2 (7 beat/50s + perf fix; đo lại ≈59.6fps)
  - `www/lang-ai-era/verify-perf.mjs` — guard mới (command avg + rAF interval p95 + worst frames + fail-closed)
  - `.github/skills/video-clip/templates/verify-perf.mjs` — template cho mọi clip sau
  - `.github/skills/video-clip/SKILL.md` — bảng guard 3→4 + trap "vẽ lại gradient/fillText mỗi khung" + checklist
  - `tests/e2e/clip-perf-guard.spec.ts` — lưới e2e (static + negative control + regression)
- **Diff tóm tắt:**
```diff
- function bgLayers(t) { ctx.fillStyle = C.bg0; /* + radial gradient toàn màn hình */ for (rain) ctx.fillText(glyph(...)); }
+ function bgLayers(t) { ctx.drawImage(bgCache, 0, 0); drawRain(t); }   // bgCache bake 1 lần; rain = 36 drawImage strip
- for (let i = 0; i < 50; i++) roundRect(...)                             // progress từng đoạn
+ roundRect(track); roundRect(fill); roundRect(head);                     // 3 hình
- const ctx = canvas.getContext('2d');
+ const ctx = canvas.getContext('2d', { alpha: false });
```
- **Non-Goals:** Không tối ưu encoder/bitrate; không chuyển sang ffmpeg; không đo lại các clip cũ (openai-hf-hack, rogue-agent, meta-charm, space-bunny) — đo khi có dịp sửa.
- **Fix Confidence:** `HIGH` — số đo 2 vòng + render thật + lưới e2e xanh.
- **get_errors:** n/a (page HTML tĩnh) — thay bằng guard chạy thật (frames + perf + audio + e2e).

---

## 4. Verification

- [x] Re-run steps reproduce → **Fixed** (verify-perf: 22.9fps → 59.6fps; ngưỡng 33ms)
- [x] Edge cases:
  - [x] đo 2 vòng liên tiếp: avg 10.06 → 8.21ms · interval p95 18.6 → 21.2ms (không flake)
  - [x] render lại MP4 50s + verify-audio WAV/MP4 (peak 0.867/0.866)
  - [x] xem 15 ảnh frames đủ 7 beat (bắt thêm 4 lỗi layout — bảng dưới)
- [x] Regression: `verify-frames` 16/16 token · guard timing TTS không tràn · clip 50s render OK
- [x] `lint` / `build` / `test` → `npx playwright test tests/e2e/clip-perf-guard.spec.ts` → **3/3 PASS** (12.6s)
- [x] Fresh-eyes tier: `OPTIONAL` (deterministic — số đo + e2e)

**Kết quả:**
```
✓ static: template + gate markers (27ms)
✓ negative control: trang 30ms/khung PHẢI fail → exit 1 + "perf FAIL"   (6.1s)
✓ regression: lang-ai-era pass → "perf OK"                              (7.7s)
3 passed (12.6s)

verify-perf (clip thật): command avg 8.21ms · interval p95 21.2ms (≈58.62fps sustained)
```

### Phụ — 4 lỗi layout bắt được khi XEM ảnh frames (cùng đợt rev 2)

| Lỗi | Nguyên nhân | Fix |
|---|---|---|
| Card title 32px wrap 2 dòng đè sub | `measureText('TRUY VẤN CODE', 32px)` = 295px > maxW 248px | hạ 26px/1 dòng (đo lại 240px) |
| Bar label đè caption | label đặt TRÊN đỉnh bar (y 794) trùng caption (y 806) | đưa label vào trong bar |
| Dots hiện sớm ở phase A | thiếu gate alpha (dots thuộc phase B nhưng luôn vẽ) | gate `dotsA = rv(t, 11.9, …)` |
| Chip "Erlang VM" tràn safe zone phải | 1019px > 990 (safe x ≤ 990) | rút text + x 580 → 981px |

---

## 5. Lesson (1 câu)

> Clip canvas render realtime: **đo `verify-perf` trước khi render** — draw ≤20ms avg và nhịp khung p95 ≤33ms theo đúng execution model rAF; "lag" không throw, ảnh tĩnh không thấy, chỉ số đo mới thấy.

---

## 6. Prevention

- **Cách phòng tránh lần sau:**
  - [x] Trước render (hoặc sau khi thêm hiệu ứng): `node <clip>/verify-perf.mjs` — fail nếu command avg > 20ms hoặc interval p95 > 33ms.
  - [x] Bake thứ không đổi thành texture 1 lần (nền/gradient/overlay); chuỗi động lặp → cache strip theo tick; layout chữ → cache measure 1 lần; `alpha:false` khi nền đục.
  - [x] Gate phải khớp execution model thật (rAF-paced): **không** lấy p95 vòng back-to-back làm ngưỡng (backpressure che stall) — dùng avg + interval p95 + in worst frames kèm `t`.
  - [x] Thêm checklist vào `docs/knowleged.md` Anti-patterns / Checklist phòng tránh chung
- **Guard (lưới chống tái lập — KN-056):**
  - [x] `- **Guard:**` đã điền — `tests/e2e/clip-perf-guard.spec.ts` (static + negative control + regression) + 2 bản `verify-perf.mjs`
  - [x] Không phải tái lập nguyên văn (lớp KN-082/KN-028 mở rộng sang perf) — lưới nâng TRƯỚC khi publish bản 50s
- **Cần cập nhật:**
  - [x] `docs/knowleged.md` → `KN-083` (Bảng tóm tắt + Chi tiết + Anti-patterns + Checklist)
  - [ ] `product-quality.instructions.md` — không cần (chuẩn clip nằm ở skill `video-clip`/`clip-craft`)
  - [x] Test mới: `tests/e2e/clip-perf-guard.spec.ts`

---

## References

- `docs/knowleged.md#kn-083`
- Issue / PR: —
- Commit fix: chưa commit (working tree)

---
*Template: `.agent/bugs/_template/bug.md` — dùng bởi `/fixbug` Phase 1 & 5.*
