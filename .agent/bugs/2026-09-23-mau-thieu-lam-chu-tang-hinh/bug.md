> 🤖 Auto-log bởi auto-learn.mjs — 2026-09-23T16:14:58.209Z
> **Error:** `C.yellow undefined: gan fillStyle=undefined bi bo qua nen chu giu mau truoc do (mau panel) -> chu tang hinh tren nen toi`
> **File:** `www/space-bunny-free/index.html`
> **Title:** mau thieu lam chu tang hinh

> 🔁 **RADAR TÁI LẬP** — đối chiếu KN + bug cũ thấy nghi vấn:
> - 🔁 NGHI TÁI LẬP **[KN-063]** (score 46.4): Routing & Failover: select trước khi gọi · output đã commit = terminal · sticky > re-route mỗi turn — chuẩn hoá pattern + lưới cho chuỗi gtx→gtx2→mymemory
> - 🔁 NGHI TÁI LẬP **[KN-038]** (score 44.6): Trang cosmos lệch tài liệu: physics shorthand + metric drift
> - 🔁 NGHI TÁI LẬP **[KN-006]** (score 35.9): N5 Blazor thieu theme sang + tieng Viet mat dau + menu chua polish
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-23-space-bunny-mo-ta-sai`** (score 68.8): space-bunny-mo-ta-sai
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-14-routing-failover-chuan-hoa-pattern-khoa-luoi`** (score 50.3): Routing & Failover cho chain model/provider — chuẩn hoá pattern + khoá lưới chuỗ
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-12-dark-energy-high-gia-tien-gate`** (score 38.7): dark-energy-high-gia-tien-gate
> → Đọc **Cách phòng tránh** trong `docs/knowleged.md` TRƯỚC khi fix. Nếu là tái lập thật: ghi rõ "tái lập của KN-063" + **vì sao lưới cũ không bắt được** → nâng lưới (Guard) rồi mới fix.
# Bug: mau thieu lam chu tang hinh

## Meta

- **Slug:** `2026-09-23-mau-thieu-lam-chu-tang-hinh`
- **Ngày:** 2026-09-23
- **Severity:** `major`
- **Detection:** `UNKNOWN`
- **Layer:** `code` — defect nằm trong object token của chính file vẽ
- **Reporter:** YUNIE (user báo “nhìn mấy chỗ kì cục”)
- **Related KN:** `—` (chưa có KN cho canvas token; xem §6)
- **Tags:** `ui` `canvas` `data`
- **Guard:** `www/space-bunny-free/verify-frames.mjs` — quét tĩnh `C.<key>` vs token định nghĩa (fail exit 1) + chụp 5 khung ra PNG
- **Status:** `fixed`

---

## 1. Reproduce

### Steps
1. Mở `www/space-bunny-free/index.html` (canvas 1080×1920, beat 3 = t 14–28s).
2. Gọi `window.__spaceBunny.draw(20)` rồi chụp canvas.
3. Quan sát thẻ “CLAIMS”: nhãn thẻ và dòng `1M CONTEXT` không hiển thị.

### Expected vs Actual
- **Expected:** nhãn và `1M CONTEXT` màu vàng `#ffcc66` (theo design.md).
- **Actual:** cả hai tàng hình — trùng màu nền panel `#101827`; chỉ còn `MULTIMODAL` và các dòng caveat.

### Evidence
```
.agent/plans/space-bunny-tiktok/verify/frame-20s.png
(code hiện tại: text('1M CONTEXT',130,880,58,C.yellow,...) — C không có key yellow)
```

### Environment
- Branch: `main`
- OS/Browser: Windows 11 · Chromium (Playwright 1.62.1 headless)

---

## 2. Root Cause (5 Whys)

- **File:Line:** `www/space-bunny-free/index.html` — object `C` (thiếu `yellow`) + nhánh `idx===2`
- **Why 1:** Chữ không hiện → màu chữ trùng màu nền.
- **Why 2:** `ctx.fillStyle = undefined` bị spec bỏ qua (không throw), nên fillStyle giữ giá trị cũ.
- **Why 3:** Giá trị cũ là `C.panel` do `roundRect(...)` vừa fill nền panel ngay trước đó.
- **Why 4:** `C.yellow` không tồn tại trong object token — key được dùng nhưng chưa được thêm.
- **Why 5 (Root):** Đổi màu token bằng tay ở nhiều nơi, không có bước render-khô để bắt lỗi im lặng.

- **Impact:** Beat 3 mất headline `1M CONTEXT` — đúng phần thông tin user hỏi kiểm chứng; clip mất ~7 giây nội dung chính.
- **Hypothesis:** Thiếu key token → verify bằng ảnh chụp khung (frame-20s.png) trước/sau.
- **Confidence:** `HIGH` (reproduce bằng ảnh, fix xong ảnh đúng, không regression)

> Tái lập hay không: RADAR gợi ý 6 KN/bug cũ nhưng **không cái nào khớp** (đều là routing/theme/ledger). Đây là bug mới → cần KN mới (§6).

---

## 3. Fix

- **Approach:** Thêm key `yellow: '#ffcc66'` vào object token `C`; rà cả nhánh vẽ để không còn `C.*` chưa định nghĩa; thêm bước chụp khung để lần sau lỗi im lặng bị bắt bằng ảnh.
- **Files Changed:**
  - `www/space-bunny-free/index.html` — thêm token `yellow`; xoá `promptBox()` và `lerp()` chết; thêm `freeze` cho vòng rAF; cân lại layout 5 beat.
  - `www/space-bunny-free/render.mjs` — `freeze = true` trước khi capture.
  - `www/space-bunny-free/verify-frames.mjs` — mới, chụp 5 khung.
- **Diff tóm tắt:**
```diff
- pink: '#ef6bba', blue: '#7aa2ff', line: '#293850', white: '#ffffff'
+ pink: '#ef6bba', blue: '#7aa2ff', yellow: '#ffcc66', line: '#293850', white: '#ffffff'
```
- **Non-Goals:** Không đổi bố cục beat 1–2, không thêm font, không thêm thư viện.
- **Fix Confidence:** `HIGH`
- **get_errors:** 0 errors trên 3 file đã sửa.

---

## 4. Verification

- [x] Re-run steps reproduce → **Fixed** (`frame-20s.png`: `1M CONTEXT` vàng rõ)
- [x] Edge cases:
  - [x] beat 3 ở t=14 (mới vào) và t=27 (gần hết) — không tràn panel
  - [x] 5 khung đại diện t=2/8/20/33/45 — không còn chồng chữ
- [x] Regression: render MP4 50s vẫn ra file hợp lệ (5,445,048 bytes, `ftypisom`, `avc1.42E01E,mp4a.40.2`)
- [x] `get_errors` toàn scope file đã sửa → 0 errors
- [x] UI audit: ảnh chụp 540×960 cho cả 5 beat
- [x] Fresh-eyes tier: `REQUIRED` (UI) — kiểm bằng ảnh chụp, không bằng mắt thường

**Kết quả:**
```
{"out":"...space-bunny-free-50s.mp4","mime":"video/mp4;codecs=avc1.42E01E,mp4a.40.2","bytes":5445048,"duration":50,"fps":30,"audio":true}
wav rate 22050 duration 48.2s
```

---

## 5. Lesson (1 câu)

> Trên canvas, gán `fillStyle` bằng giá trị `undefined` **không báo lỗi** — nó lặng lẽ giữ màu trước đó, nên thiếu một key token = chữ tàng hình mà không có exception nào.

---

## 6. Prevention

- **Cách phòng tránh lần sau:**
  - [x] Dùng **một** object token duy nhất; guard `verify-frames.mjs` tự đối chiếu mọi `C.<key>` dùng trong file với key thực có trong `C` và fail nếu thiếu.
  - [x] Không tin “nhìn thấy ổn” — chụp khung ra PNG ở từng beat rồi mới render video.
  - [ ] Thêm checklist vào `docs/knowleged.md` Anti-patterns / Checklist phòng tránh chung
- **Guard (lưới chống tái lập — KN-056):**
  - [x] `- **Guard:**` đã điền ở Meta → `www/space-bunny-free/verify-frames.mjs` (chụp 5 beat) + ảnh `verify/frame-20s.png`
  - [x] Không phải tái lập (RADAR không khớp KN/bug nào)
- **Cần cập nhật:**
  - [ ] `docs/knowleged.md` → `KN-XXX` (Bảng tóm tắt + Chi tiết) — đề xuất qua `propose --bug 2026-09-23-mau-thieu-lam-chu-tang-hinh`
  - [ ] `product-quality.instructions.md` (nếu canvas render thành chuẩn chung)
  - [x] Test mới: `www/space-bunny-free/verify-frames.mjs`

---

## References

- `www/space-bunny-free/index.html` · `render.mjs` · `verify-frames.mjs`
- `.agent/plans/space-bunny-tiktok/{prd,design,plan,research}.md`
- Issue / PR: #
- Commit fix: `<pending>`

---
*Template: `.agent/bugs/_template/bug.md` — dùng bởi `/fixbug` Phase 1 & 5.*
