> 🤖 Auto-log bởi auto-learn.mjs — 2026-09-26T07:59:19.893Z
> **Error:** `Georgia thieu glyph VN (U+1EA5 1EB1 1EDB 1ED1...) - canvas headless Chromium roi fallback, dau vo metrics 'bang' -> 'ba ng', 'Som', 'bo'`
> **File:** `www/rogue-agent/index.html`
> **Title:** font Georgia vo dau tieng Viet trong canvas clip

> 🔁 **RADAR TÁI LẬP** — đối chiếu KN + bug cũ thấy nghi vấn:
> - 🔁 NGHI TÁI LẬP **[KN-028]** (score 94.5): Canvas quên invoke `resize()` → burst sai gốc + behavior test xanh giả
> - 🔁 NGHI TÁI LẬP **[KN-006]** (score 93.6): N5 Blazor thieu theme sang + tieng Viet mat dau + menu chua polish
> - 🔁 NGHI TÁI LẬP **[KN-029]** (score 78.6): Google Fonts script-blocking làm intro "không hiện" trên mạng chậm
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-10-google-fonts-chan-script-intro-khong-hien`** (score 90.7): google-fonts-chan-script-intro-khong-hien
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-12-dark-energy-high-gia-tien-gate`** (score 76.1): dark-energy-high-gia-tien-gate
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-23-mau-thieu-lam-chu-tang-hinh`** (score 71.9): mau thieu lam chu tang hinh
> → Đọc **Cách phòng tránh** trong `docs/knowleged.md` TRƯỚC khi fix. Nếu là tái lập thật: ghi rõ "tái lập của KN-028" + **vì sao lưới cũ không bắt được** → nâng lưới (Guard) rồi mới fix.
# Bug: Font Georgia vỡ dấu tiếng Việt trong canvas clip (TIN AI)

## Meta

- **Slug:** `2026-09-26-font-georgia-vo-dau-tieng-viet-trong-canvas-clip`
- **Ngày:** 2026-09-26
- **Severity:** `major` (artifact #2 đã commit hiển thị chữ sai; mọi clip canvas dùng font thiếu coverage đều dính)
- **Detection:** `unknown`
- **Detection rule:** Phát hiện bằng mắt ở bước xem ảnh khung (verify-frames) khi build clip #3 — không có máy báo.
- **Layer:** `measure-verifier` — guard chỉ quét token C + chụp ảnh cho NGƯỜI xem; không có assert máy nào cho glyph rendering; font chọn theo thói quen, không verify coverage.
- **Reporter:** YUNIE (phát hiện khi build clip #3; ảnh hưởng #2)
- **Related KN:** `KN-082` (chính) · `KN-006` (tiếng Việt mất dấu) · `KN-028` (bug canvas mà behavior-test không thấy) · RADAR: KN-029/KN-058 (lớp “asset/render — verify bằng mắt”)
- **Tags:** `ui` `canvas` `font` `clip` `verify` `i18n`
- **Guard:** `tests/e2e/clip-font-guard.spec.ts` (lưới máy: blacklist font mọi clip page + negative control) + template `verify-frames.mjs` quét font const fail-closed + `references/font-test.mjs` (đo coverage)
- **Status:** `fixed` — clip #3 (từ đầu) + clip #2 `rogue-agent` (re-verify frames + re-render MP4, 26.09)

---

## 1. Reproduce

### Steps
1. Mở `www/rogue-agent/verify/frame-08s.png` (bản đã commit `80bd509`).
2. Nhìn dòng “Agent xâm nhập portal thống kê y tế Úc” → hiển thị **“thô ng kê”** (dấu vỡ).
3. So với `www/agent-vuot-rao/verify/frame-09s.png` (Times New Roman, cùng môi trường) → sạch.

### Expected vs Actual
- **Expected:** Mọi glyph tiếng Việt render liền mạch, metrics đều (“thống kê”, “bằng”, “Sớm”).
- **Actual:** Glyph họ ấ/ằ/ớ/ố (Georgia thiếu) rơi xuống font fallback → tách dấu + advance sai: “thô ng kê”, “bằ ng”, “Sớ m”, “bố ˙”.

### Evidence
- `www/rogue-agent/verify/frame-08s.png` — BUG (Georgia)
- `www/agent-vuot-rao/verify/frame-09s.png` — SẠCH (Times New Roman, cùng chuỗi)
- `www/rogue-agent/verify/frame-08s.png` — BUG cũ (Georgia) — ảnh mới sau fix đè cùng tên
- `.github/skills/video-clip/references/font-test.png` — so 5 serif: Georgia vỡ; Times New Roman / Cambria / Palatino / Segoe UI sạch; 4 mono (Consolas/Courier New/Cascadia Mono/Segoe UI) sạch
- Codepoints file (loại trừ NFD): “bằng” = `62 1eb1 6e 67` (NFC ✓) — lỗi ở render, không ở encoding

### Environment
- Branch: `main` · Commit: `09baa05` (+ working tree clip #3)
- OS/Browser: Windows + Playwright headless Chromium (cùng môi trường render mọi clip)

---

## 2. Root Cause (5 Whys)

- **File:Line:** `www/rogue-agent/index.html:24` (`const SERIF = 'Georgia'`) — pattern lặp ở mọi clip
- **Why 1:** Chuỗi hiển thị “thô ng kê” → vì glyph VN vẽ qua font fallback với metrics khác font chính.
- **Why 2:** Vì sao fallback → Georgia (bản trên máy này) thiếu glyph VN họ ấ/ằ/ớ/ố (đo bằng `_font-test`) — nhưng CÓ glyph khác (ệ/ậ/ợ) nên lỗi rải rác, dễ đọc lướt bỏ qua.
- **Why 3:** Vì sao ship được → guard `verify-frames` chỉ (a) quét token `C`, (b) chụp ảnh **để người xem** — không assert điều kiện nào cho chất lượng chữ.
- **Why 4:** Vì sao không assert → pipeline coi “chữ đúng” là mắt-người-only; tin ảnh evidence mà không có tiêu chí máy (cùng lớp KN-028/KN-058).
- **Why 5 (Root):** **Chọn font theo thói quen (“Georgia = serif báo giấy đẹp”) mà không verify glyph coverage của chuỗi tiếng Việt trên môi trường render thật** — asset pipeline thiếu bước “đo coverage glyph set” cho ngôn ngữ đích.

- **Impact:** Clip #2 (đã commit) + mọi clip dùng Georgia. Clip #3 bắt được khi build (đã fix TRƯỚC render). Clip #1 (`openai-hf-hack`) cần rà cùng font.
- **Hypothesis:** Georgia thiếu VN glyph → fallback metrics lệch. Verify bằng 5-font test trên chính máy render. ✓ CONFIRMED
- **Confidence:** `HIGH` — đo được (font-test PNG) + fix render lại frames sạch + so cặp ảnh trước/sau.

---

## 3. Fix

- **Approach:** Đổi `SERIF` → `Times New Roman` (phủ đủ VN, giữ style báo giấy) tại clip #3; giữ MONO `Consolas` (đã sạch). Không patch triệu chứng (không né dấu/normalize text).
- **Files Changed:**
  - `www/agent-vuot-rao/index.html` — `SERIF`: Georgia → Times New Roman (+comment lý do)
  - `.agent/plans/agent-vuot-rao-tiktok/design.md` — ghi chú font + lý do
  - `.agent/plans/agent-vuot-rao-tiktok/publish.md` — revision log
- **Diff tóm tắt:**
```diff
-const SERIF = 'Georgia';
+// Georgia thiếu glyph VN (đo 26.09: ằ/ấ/ớ/ố rơi fallback → vỡ metrics)
+const SERIF = 'Times New Roman';
```
- **Non-Goals:** Không sửa template/skill render chung đợt này; không re-render clip #2 (chờ user quyết — có thể đã đăng); không đổi MONO.
- **Fix Confidence:** `HIGH`
- **get_errors:** 0 lỗi trên file sửa.

---

## 4. Verification

- [x] Re-run reproduce → **Fixed**: frame-09s mới sạch dấu (so frame cũ cùng vị trí)
- [x] Edge cases:
  - [x] italic (sub “Sớm hơn 2 tháng...”) sạch ở TNR
  - [x] mono uppercase (CHẶN / BỊ CHẶN / NGUYÊN TẮC) sạch ở Consolas
- [x] Regression: `verify-frames` pass (10/10 token dùng) + render MP4 mới OK
- [x] Guard chạy lại toàn bộ: timing TTS pass (8/8 segment) · `verify-audio` WAV + MP4 pass
- [x] Fresh-eyes tier: `REQUIRED` — đã xem 5/5 khung ảnh bằng mắt (không đoán)

**Kết quả:**
```
verify-frames: ok · tokens 10 dùng / 12 định nghĩa · 5 frames sạch dấu
render: agent-vuot-rao-48s.mp4 · 48s · 30fps · verify-audio MP4 ✅ (peak 0.70 · mp4a)
```

---

## 5. Lesson (1 câu)

> Clip canvas: font phải phủ đủ glyph tiếng Việt trên MÁY RENDER THẬT (Georgia thiếu ằ/ấ/ớ/ố → fallback vỡ dấu im lặng, không throw) — đo bằng font-test trước khi build, đừng tin mắt trên ảnh nhỏ.

---

## 6. Prevention

- **Cách phòng tránh lần sau:**
  - [x] Clip mới: dùng font đã verify coverage (Times New Roman / Cambria / Segoe UI / Consolas) hoặc chạy `node .github/skills/video-clip/references/font-test.mjs` trước
  - [x] Thêm row “font VN coverage” vào Traps của skill `video-clip`
  - [x] `verify-frames` template quét blacklist font (Georgia) → fail-closed (KN-082)
- **Guard (lưới chống tái lập — KN-056):**
  - [x] `.github/skills/video-clip/references/font-test.{html,mjs,png}` — harness đo coverage
  - [x] Wire lưới máy: `tests/e2e/clip-font-guard.spec.ts` (2/2 pass) + template verify-frames
- **Cần cập nhật:**
  - [x] `docs/knowleged.md` → KN-082
  - [x] Skill `video-clip` Traps table + References
  - [x] Clip #2 (`rogue-agent`) re-verify frames + re-render MP4

---

## References

- `docs/knowleged.md` KN-082 / KN-006 / KN-028 (lớp liên quan)
- Commit base: `09baa05` · Clip fix: `www/agent-vuot-rao/` + re-render `www/rogue-agent/`
- Evidence: `.github/skills/video-clip/references/font-test.png` · frame `www/rogue-agent/verify/frame-08s.png` (sau fix) · ảnh trước fix trong git history

---
*Bug được điền bởi YUNIE trong quá trình build clip #3 (TIN AI · SỐ 003) — 26.09.2026.*
