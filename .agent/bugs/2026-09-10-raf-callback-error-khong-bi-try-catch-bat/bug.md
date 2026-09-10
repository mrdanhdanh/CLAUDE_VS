> 🤖 Auto-log bởi auto-learn.mjs — 2026-09-10T16:43:58.229Z
> **Error:** `Engine v2 throw 'T is not defined' trong rAF callback (thieu khai bao const T khi rewrite) - loi trong requestAnimationFrame khong bi try/catch ngoai bat (async) -> animation dung im im khong crash trang; Edge spec bat duoc qua assertion 'no pageerror'`
> **File:** `www/cosmos/index.html`
> **Title:** raf-callback-error-khong-bi-try-catch-bat

# Bug: raf-callback-error-khong-bi-try-catch-bat

## Meta

- **Slug:** `2026-09-10-raf-callback-error-khong-bi-try-catch-bat`
- **Ngày:** 2026-09-10
- **Severity:** `major`
- **Reporter:** YUNIE (Edge spec tự bắt trong lúc verify v2 cinematic)
- **Related KN:** `KN-032`
- **Tags:** `ui` `canvas` `animation` `verify` `error-handling`
- **Status:** `fixed`

---

## 1. Reproduce

### Steps
1. Triển khai engine v2 cinematic (rewrite lớn phần canvas của intro).
2. Mở `www/cosmos/index.html` trên Edge (playwright `channel:'msedge'`).
3. Quan sát: intro chạy tới ~0.85s rồi **đứng im** (frame cuối đóng băng), pageerror `T is not defined`.

### Expected vs Actual
- **Expected:** Big Bang → galaxy swirl chạy liên tục 60fps.
- **Actual:** Animation freeze im lặng ngay sau khi bangAt được set; assertion "Edge không được có lỗi console/pageerror" của `cosmos-intro-edge.spec.ts` fail → bắt được ngay.

### Evidence
- Test output: `[pageerror] T is not defined` (cosmos-intro-edge.spec.ts).
- Screenshot frozen frame: chỉ có stars + puffs, không có particles/nucleus (frame đầu sau bang bị throw giữa chừng).

### Environment
- Windows + Edge (Playwright msedge) + Chromium.

---

## 2. Root Cause (5 Whys)

- **File:Line:** `www/cosmos/index.html` — frame callback của intro canvas (IIFE)
- **Why 1:** `T` được dùng (`Math.sin(T*2.2)` trong galactic nucleus) nhưng **không được khai báo** khi rewrite engine v2.
- **Why 2:** Throw xảy ra trong **rAF callback** — chạy async, KHÔNG nằm trong `try{...}catch(e){}` bao quanh phần đăng ký engine (try/catch chỉ bắt lỗi đồng bộ lúc setup).
- **Why 3:** Throw trước dòng `raf = requestAnimationFrame(frame)` → loop không được schedule lại → chết im lặng, không crash trang, không hiện gì rõ ràng cho user.
- **Why 4:** Rewrite lớn (v1 → v2) không chạy "no-console-error" assertion trên browser thật ngay sau khi viết.
- **Why 5 (Root):** Thiếu thói quen: mọi engine chạy rAF phải coi "no pageerror/console error" trong browser test là gate bắt buộc — vì lỗi async không bị try/catch đồng bộ bắt và thất bại kiểu "đứng im" rất khó thấy bằng mắt.

- **Impact:** Intro đứng hình ở giây thứ 1 — mất toàn bộ trải nghiệm v2; may mắn bị spec bắt ngay trong session.
- **Confidence:** `HIGH` (reproduced + fixed + suite xanh 12/12 + screenshots xác nhận animation sống).

---

## 3. Fix

- **Approach:** Khai báo `const T = t/1000;` (nguồn gốc); giữ nguyên assertion "no pageerror" trong Edge spec làm lưới an toàn thường trực cho engine.
- **Files Changed:**
  - `www/cosmos/index.html` — +1 dòng `const T = t/1000;`
- **Diff tóm tắt:**
```diff
  const age = bangAt ? (now-bangAt)/1000 : 0;
+ const T = t/1000;                          // giây — pulse nhẹ cho nucleus/puffs
```
- **Non-Goals:** Không bọc try/catch toàn bộ frame (che lỗi thật); fix ở nguồn + để test làm lưới.
- **Fix Confidence:** `HIGH`
- **get_errors:** sạch (chỉ còn warning inline-style có sẵn của trang).

---

## 4. Verification

- [x] Re-run Edge spec → pass, `painted pixels = 160000` (center sample), không pageerror
- [x] Full suite: intro chromium + intro Edge + observatory → **12/12 pass**
- [x] Screenshots 3 mốc (burst/title/swirl) xác nhận animation chạy liên tục

**Kết quả:**
```
12 passed (25.7s)
[EDGE] prefers-reduced-motion = false · canvas 1280x720
```

---

## 5. Lesson (1 câu)

> Throw trong `requestAnimationFrame` callback không bị try/catch đồng bộ bắt — engine chết im lặng dạng "đứng hình"; browser test PHẢI assert không có pageerror/console error.

---

## 6. Prevention

- **Cách phòng tránh lần sau:**
  - [ ] Mọi engine rAF: chạy browser test với assertion "no pageerror" NGAY sau rewrite (đã có trong `cosmos-intro-edge.spec.ts`)
  - [ ] Khi rewrite lớn: diff check các biến dùng-xong-chưa-khai-báo (esbuild/tsc check JS inline nếu có thể)
  - [ ] Freeze animation = nghi lỗi async (rAF/timeout) trước khi nghi logic
- **Cần cập nhật:**
  - [x] `docs/knowleged.md` → `KN-032`
  - [x] Edge spec đã có assertion no-pageerror (từ KN-031)

---

## References

- `docs/knowleged.md#KN-032`
- Evidence: `.agent/plans/cosmos-intro/verify/edge-1280-*.png`
- Commit fix: `(điền sau khi push)`

---
*Điền bởi YUNIE / fixbug — 2026-09-10.*
