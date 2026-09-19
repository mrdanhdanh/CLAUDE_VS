> 🤖 Auto-log bởi auto-learn.mjs — 2026-09-19T06:44:39.335Z
> **Error:** `checkBugReadiness regex Status:\s*fixed khong khop dong bold **Status:** (co backtick) -> evaluate luon in isFixed=false du bug da fix; isOpen tuong tu voi Status open bold`
> **File:** `.github/harness/scripts/auto-learn.mjs`
> **Title:** evaluate isFixed khong doc duoc Status bold

> 🔁 **RADAR TÁI LẬP** — đối chiếu KN + bug cũ thấy nghi vấn:
> - 🔁 NGHI TÁI LẬP **[KN-007]** (score 70.6): Thiếu hệ thống tự học hỏi tự động — phải làm tay, dễ quên
> - 🔁 NGHI TÁI LẬP **[KN-002]** (score 68.4): Trang STATUS www/ giao diện chưa hợp lý
> - 🔁 NGHI TÁI LẬP **[KN-015]** (score 68.4): GitHub Pages deploy fail — 2 workflows cùng `github-pages` env + eval-gate Node 18 CJS
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-14-status-mirror-stale-health-warn`** (score 69.5): status.json mirror stale — health=warn trong khi thực tế drafts=0 (suite đỏ)
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-18-instruction-budget-gate-fail-open-voi-arg-khong-ph`** (score 59.3): instruction-budget gate fail-open voi arg khong phai so
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-13-git-checkout-head-revert-nham-refactor-chua-commit`** (score 57.9): git checkout HEAD -- revert nhầm refactor chưa commit của auto-learn.mjs
> → Đọc **Cách phòng tránh** trong `docs/knowleged.md` TRƯỚC khi fix. Nếu là tái lập thật: ghi rõ "tái lập của KN-007" + **vì sao lưới cũ không bắt được** → nâng lưới (Guard) rồi mới fix.
# Bug: evaluate isFixed khong doc duoc Status bold

> Copy file này vào `.agent/bugs/2026-09-19-evaluate-isfixed-khong-doc-duoc-status-bold/bug.md` khi bắt đầu `/fixbug`.

## Meta

- **Slug:** `2026-09-19-<slug>` (vd: `2026-08-29-modal-esc`)
- **Ngày:** YYYY-MM-DD
- **Severity:** `critical` | `major` | `minor`
- **Layer:** `—` (điền: `code` | `test-spec` | `env-fixture` | `measure-verifier` | `task-spec` | `process`) — tầng chứa defect (suspicion order, không phải luật). Check đỏ đọc 2 lần: defect ở test/env/đo → **sửa world TRƯỚC**; chỉ failure sống sót qua cả stack mới thành bài học.
- **Reporter:** @user / YUNIE
- **Related KN:** `KN-XXX` (điền sau khi cập nhật `docs/knowleged.md`, hoặc `—` nếu chưa có)
- **Tags:** `ui` `api` `state` `async` `css` `a11y` `perf` `build` `data` ...
- **Guard:** `tests/e2e/<spec>.spec.ts` | `—` — lưới chống tái lập (test/invariant khoá bug). **major/critical BẮT BUỘC** — `propose` gate FAIL nếu thiếu (KN-056).
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
- **Confidence:** `HIGH` (proven + regression pass) | `MEDIUM` (strongly supported + reproduction fixed) | `LOW` (symptom fixed, root uncertain) — nếu LOW → STOP, report uncertainty, ask/escalate to `/harness`

> Nếu bug chạm pattern trong `docs/knowleged.md` → ghi `Related KN: KN-XXX` và áp dụng **Cách phòng tránh** ngay.
> **Root Cause Gate:** Nếu uncertain → investigate / escalate, không tự biến hypothesis thành sự thật.

---

## 3. Fix

- **Approach:** Sửa ở gốc như thế nào (không patch triệu chứng)? Bounded — không refactor lan rộng.
- **Files Changed:**
  - `path/to/file.ts` — mô tả thay đổi
- **Diff tóm tắt:**
```diff
// before
// after
```
- **Non-Goals:** Việc gì KHÔNG làm trong lần fix này (tránh scope creep — bounded repair loop)?
- **Fix Confidence:** `HIGH` | `MEDIUM` | `LOW` — đánh giá trước khi sang Verify. Nếu LOW → STOP, report uncertainty, ask/escalate.
- **get_errors:** Sau mỗi edit → affected files; full scope ở Phase 4 Verify.

---

## 4. Verification

- [ ] Re-run steps reproduce → **Fixed** (Expected = Actual)
- [ ] Edge cases:
  - [ ] case 1: ...
  - [ ] case 2: ...
- [ ] Regression: các case liên quan vẫn pass
- [ ] `get_errors` **toàn scope** → 0 errors (Phase 3 chỉ check affected files)
- [ ] `lint` / `build` / `test` → PASS (ghi lệnh đã chạy)
- [ ] UI audit (nếu là bug UI): responsive 375/768/1280, states, a11y
- [ ] Fresh-eyes tier: `REQUIRED` (UX/UI/workflow/ambiguous) | `RECOMMENDED` (regression-prone) | `OPTIONAL` (deterministic: typo/null check/API mapping) — ghi tier đã áp dụng

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
- **Guard (lưới chống tái lập — KN-056):**
  - [ ] Điền `- **Guard:**` ở Meta (test/invariant khoá bug) — major/critical bắt buộc, nếu không `propose --strict` exit 1
  - [ ] Nếu là **TÁI LẬP** (RADAR ở đầu bug.md báo): ghi rõ "tái lập của KN-XXX" + **vì sao lưới cũ không bắt được** + nâng lưới TRƯỚC khi fix
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
