# Bug: <Tiêu đề ngắn gọn>

> Copy file này vào `.agent/bugs/YYYY-MM-DD-<slug>/bug.md` khi bắt đầu `/fixbug`.

## Meta

- **Slug:** `YYYY-MM-DD-<slug>` (vd: `2026-08-29-modal-esc`)
- **Ngày:** YYYY-MM-DD
- **Severity:** `critical` | `major` | `minor`
- **Reporter:** @user / YUNIE
- **Related KN:** `KN-XXX` (điền sau khi cập nhật `docs/knowleged.md`, hoặc `—` nếu chưa có)
- **Tags:** `ui` `api` `state` `async` `css` `a11y` `perf` `build` `data` ...
- **Status:** `open` | `fixed` | `wontfix`

---

## 1. Reproduce

### Steps
1. ...
2. ...
3. ...

### Expected vs Actual
- **Expected:** ...
- **Actual:** ...

### Evidence
- Log / screenshot / test fail / video:
```
< dán log hoặc link ảnh >
```

### Environment
- Branch: `main`
- Commit: `<hash>`
- OS/Browser: ...

---

## 2. Root Cause (5 Whys)

- **File:Line:** `path/to/file.ts:123`
- **Why 1:** ...
- **Why 2:** ...
- **Why 3:** ...
- **Why 4:** ...
- **Why 5 (Root):** ...

- **Impact:** Ảnh hưởng tới đâu, bao nhiêu user/case?
- **Hypothesis:** Giả thuyết ban đầu (nếu có) + đã verify chưa?

> Nếu bug chạm pattern trong `docs/knowleged.md` → ghi `Related KN: KN-XXX` và áp dụng **Cách phòng tránh** ngay.

---

## 3. Fix

- **Approach:** Sửa ở gốc như thế nào (không patch triệu chứng)?
- **Files Changed:**
  - `path/to/file.ts` — mô tả thay đổi
- **Diff tóm tắt:**
```diff
// before
// after
```
- **Non-Goals:** Việc gì KHÔNG làm trong lần fix này (tránh scope creep)?

---

## 4. Verification

- [ ] Re-run steps reproduce → **Fixed** (Expected = Actual)
- [ ] Edge cases:
  - [ ] case 1: ...
  - [ ] case 2: ...
- [ ] Regression: các case liên quan vẫn pass
- [ ] `get_errors` → 0 errors
- [ ] `lint` / `build` / `test` → PASS (ghi lệnh đã chạy)
- [ ] UI audit (nếu là bug UI): responsive 375/768/1280, states, a11y

**Kết quả:**
```
< dán output verify >
```

---

## 5. Lesson (1 câu)

> Bài học rút ra, 1 câu súc tích — sẽ copy vào `docs/knowleged.md` Bảng tóm tắt.

Ví dụ: *Mọi overlay/modal phải có ESC + focus trap + aria-modal.*

---

## 6. Prevention

- **Cách phòng tránh lần sau:**
  - [ ] ...
  - [ ] Thêm checklist vào `docs/knowleged.md` Anti-patterns / Checklist phòng tránh chung
- **Cần cập nhật:**
  - [ ] `docs/knowleged.md` → `KN-XXX` (Bảng tóm tắt + Chi tiết)
  - [ ] `product-quality.instructions.md` (nếu là chuẩn UI mới)
  - [ ] Test mới: `path/to/test.spec.ts`

---

## References

- `docs/knowleged.md#KN-XXX`
- Issue / PR: #
- Commit fix: `<hash>`

---
*Template: `.agent/bugs/_template/bug.md` — dùng bởi `/fixbug` Phase 1 & 5.*
