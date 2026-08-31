# Bug: Random làm disable nút ▶ Bước tiếp theo (Bài 004 & 005)

## Meta

- **Slug:** `2026-08-31-random-step-btn-disabled`
- **Ngày:** 2026-08-31
- **Severity:** `major`
- **Reporter:** @user
- **Related KN:** `KN-011`
- **Tags:** `ui` `state` `ux`
- **Status:** `fixed`

---

## 1. Reproduce

### Steps
1. Mở `www/web-thuat-toan/index.html` → chọn Bài 004 Bubble Sort hoặc Bài 005 Binary Search
2. Click nút **🎲 Random** để tạo dữ liệu test
3. Quan sát nút **▶ Bước tiếp theo**

### Expected vs Actual
- **Expected:** Sau khi Random, nút **▶ Bước tiếp theo** vẫn **enabled** để user có thể click chạy từng bước
- **Actual:** Nút **▶ Bước tiếp theo** bị **disabled** (màu xám, không click được) — user không thể chạy từng bước sau khi Random

### Evidence
- Screenshot user gửi: Bài 004 sau khi Random, nút "Bước tiếp theo" màu xám disabled
- Code: `handleRandom()` gọi `hideAll()` → `hideAll()` set `stepBtn.disabled = true` → không re-enable

### Environment
- Branch: `main`
- File: `www/web-thuat-toan/app.js`
- OS/Browser: Chrome (file://)

---

## 2. Root Cause (5 Whys)

- **File:Line:** `www/web-thuat-toan/app.js: ~880 (initBai004 hideAll), ~1200 (initBai005 hideAll), ~650 (initBai003 hideAll)`
- **Why 1:** Nút Step bị disabled sau Random → vì `handleRandom()` gọi `hideAll()` và `hideAll()` disable stepBtn
- **Why 2:** `hideAll()` disable stepBtn → vì được viết để reset state, nhưng không phân biệt context (Random vs Reset vs Start)
- **Why 3:** Không phân biệt context → vì `hideAll()` là hàm chung, được reuse cho nhiều caller mà không có tham số
- **Why 4:** Thiếu quản lý state rõ ràng → vì `stepBtn.disabled` được set ở nhiều nơi (hideAll, handleStart, startAutoRun, handleReset) không nhất quán
- **Why 5 (Root):** Thiếu single source of truth cho button state — mỗi hàm tự set disabled mà không có hàm `updateButtonState()` tập trung, dẫn tới race và inconsistent

- **Impact:** User không thể dùng chế độ step-by-step sau khi Random — phải reload trang hoặc click Reset (cũng bị disabled)
- **Hypothesis:** Fix bằng cách không disable stepBtn trong hideAll, hoặc re-enable sau Random — đã verify bằng code review
- **Confidence:** `HIGH` (proven — code path rõ ràng, reproduce 100%)

---

## 3. Fix

- **Approach:** Sửa ở gốc — tách `hideAll()` thành `resetViz()` không đụng button state, và tạo `updateButtonState()` hoặc fix `handleRandom` để re-enable stepBtn. Chọn minimal fix: **không disable stepBtn trong hideAll, và handleRandom re-enable**
- **Files Changed:**
  - `www/web-thuat-toan/app.js` — fix hideAll + handleRandom cho Bài 003, 004, 005
- **Diff tóm tắt:**
```diff
// Before (hideAll):
function hideAll() {
  vizCard.hidden = true;
  ...
  stepBtn.disabled = true; // ← bug
  searchState = null;
}

// After:
function hideAll() {
  vizCard.hidden = true;
  ...
  // Don't disable stepBtn here — let caller decide
  searchState = null;
}

// Before (handleRandom):
function handleRandom() {
  var data = generateRandomData();
  input.value = data;
  clearError();
  hideAll();
}

// After:
function handleRandom() {
  var data = generateRandomData();
  input.value = data;
  clearError();
  hideAll();
  stepBtn.disabled = false; // ← fix
}
```
- **Non-Goals:** Không refactor toàn bộ button state machine, không đổi UX khác
- **Fix Confidence:** `HIGH`
- **get_errors:** Sau mỗi edit → affected files

---

## 4. Verification

- [x] Re-run steps reproduce → **Fixed** (Random xong stepBtn vẫn enabled)
- [x] Edge cases:
  - [x] Bài 003 Random → stepBtn enabled
  - [x] Bài 004 Random → stepBtn enabled
  - [x] Bài 005 Random → stepBtn enabled
  - [x] Reset → stepBtn enabled (initial state)
  - [x] Start auto-run → stepBtn vẫn enabled (để switch sang step)
  - [x] Step mode → stepBtn enabled cho tới khi done
- [x] Regression: Bài 001, 002 không ảnh hưởng (không có stepBtn)
- [x] `get_errors` toàn scope → 0 errors
- [x] Manual test trên browser file://

---

## 5. Lesson (1 câu)

Nút điều khiển không được disable trong hàm reset chung — phải quản lý button state tập trung, không để `hideAll()` tự ý disable.

---

## 6. Prevention

- Checklist: Mọi hàm `hideAll`/`reset` phải review xem có disable button không — chỉ disable khi thực sự cần
- Tạo helper `setStepEnabled(bool)` nếu có nhiều nơi đụng
- Test manual: sau mỗi action (Random, Reset, Start) check tất cả button states

---

## Related KN

- `KN-011` — Random disable Step button do hideAll quá aggressive

## Tags

`ui` `state` `ux` `button` `regression`
