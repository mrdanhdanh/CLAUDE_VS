> 🤖 Auto-log bởi auto-learn.mjs — 2026-09-10T15:42:11.066Z
> **Error:** `Intro canvas: hạt Big Bang nổ từ góc trên-trái thay vì tâm — resize() được định nghĩa nhưng không gọi → w=h=cx=cy=0, canvas buffer mặc định 300x150 bị CSS kéo giãn`
> **File:** `www/cosmos/index.html`
> **Title:** intro-burst-tu-goc-do-quen-goi-resize

# Bug: intro-burst-tu-goc-do-quen-goi-resize

## Meta

- **Slug:** `2026-09-10-intro-burst-tu-goc-do-quen-goi-resize`
- **Ngày:** 2026-09-10
- **Severity:** `major`
- **Reporter:** YUNIE (self-caught qua screenshot evidence — KN-023)
- **Related KN:** `KN-028` (proposed)
- **Tags:** `ui` `animation` `canvas` `verify` `bug-blindness`
- **Status:** `fixed`

---

## 1. Reproduce

### Steps
1. Mở `www/cosmos/index.html` (có intro cinematic mới).
2. Chờ ~0.85–2s (stage Big Bang).
3. Quan sát vị trí particle burst.

### Expected vs Actual
- **Expected:** ~240 hạt nổ từ **tâm màn hình** (shockwave + lõi sáng tại tâm).
- **Actual:** Hạt nổ từ **góc trên-trái (0,0)**, tụ thành chùm ở góc; canvas bị kéo giãn (dots to/mờ bất thường) vì buffer 300×150 mặc định bị CSS scale lên 1280×720.

### Evidence
- Screenshot: `.agent/plans/cosmos-intro/verify/intro-1280-early.png` (bản cũ — burst ở góc)
- Bắt được nhờ bước **visual check screenshot** trong verify — 8/8 test behavior PASS nhưng không test nào assert vị trí burst.

### Environment
- Branch: `main` · OS/Browser: Windows / Chromium (Playwright)

---

## 2. Root Cause (5 Whys)

- **File:Line:** `www/cosmos/index.html` — trong IIFE intro, hàm `resize()` của canvas.
- **Why 1:** Hạt spawn tại (cx, cy) = (0,0) thay vì tâm.
- **Why 2:** `cx, cy` chưa bao giờ được gán — `resize()` không được gọi lần nào.
- **Why 3:** Code chỉ *định nghĩa* `resize` + `addEventListener('resize', resizeFn)`, **thiếu lời gọi `resize()` khởi tạo**.
- **Why 4:** Viết code theo thói quen "define → gán listener" mà bỏ quên invoke đầu tiên; không có test/assert nào đo kích thước canvas.
- **Why 5 (Root):** Thiếu *invariant được assert*: "canvas buffer phải khớp kích thước hiển thị" — invariant chỉ tồn tại trong đầu, không trong test → behavior test không thể bắt.

- **Impact:** 1 trang (`www/cosmos/index.html`), 100% lượt xem intro — hiệu ứng chính (Big Bang) sai vị trí, mất tính "hoành tráng".
- **Hypothesis:** Đã verify bằng probe assertion `canvas.width === canvas.clientWidth` (fail trước fix, pass sau fix).
- **Confidence:** `HIGH` (proven + regression pass + screenshot sau fix đúng tâm)

---

## 3. Fix

- **Approach:** Gọi `resize()` ngay sau khi đăng ký listener (khởi tạo kích thước thật), + guard `if(!w || !h) resize()` trong `burst()` (phòng khởi tạo trễ/viewport đổi), + thêm assertion chống tái phát vào spec.
- **Files Changed:**
  - `www/cosmos/index.html` — thêm `resize();` + guard trong `burst()`
  - `tests/e2e/cosmos-intro.spec.ts` — assert `canvas.width === clientWidth` + `canvas.height === clientHeight`
- **Diff tóm tắt:**
```diff
  resizeFn = resize;
  window.addEventListener('resize', resizeFn);
  resize();                                  // ← đo kích thước ngay (không thì cx,cy=0 → burst từ góc)
  function burst(){
    if(!w || !h) resize();                   // guard: nếu viewport đổi/khởi tạo trễ
    burstAt = performance.now();
```
- **Non-Goals:** Không refactor engine, không đổi timeline/design.
- **Fix Confidence:** `HIGH`
- **get_errors:** sạch (affected files + spec)

---

## 4. Verification

- **Reproduce again:** Screenshot `intro-1280-early.png` sau fix → burst từ tâm ✅
- **Regression:** `npx playwright test tests/e2e/cosmos-intro.spec.ts` → **8/8 pass** (cover / auto-reveal / skip nút / Esc / click / reduced-motion / 375 / 768)
- **Assert mới:** `canvas.width === clientWidth` & `canvas.height === clientHeight` pass (sẽ fail nếu quên resize).
- **Visual:** `intro-1280-title.png`, `intro-375.png`, `intro-768.png`, `intro-1280-revealed.png` đều đúng.

---

## 5. Learn

- **Bài học:** Canvas có buffer riêng vs kích thước hiển thị — **define listener xong phải gọi resize() ngay**; và mọi hiệu ứng dựa trên toạ độ **phải có assert về kích thước** trong test, nếu không behavior tests sẽ xanh giả (reward-hacking vô thức).
- **KN đề xuất:** `KN-028` — "Canvas setup phải invoke resize + assert geometry; visual evidence bắt bug mà behavior test bỏ lọt".
- **Anti-pattern:** Tin vào "define xong là xong" cho setup function; chỉ assert hành vi (visible/hidden) mà không assert geometry nội tại.
