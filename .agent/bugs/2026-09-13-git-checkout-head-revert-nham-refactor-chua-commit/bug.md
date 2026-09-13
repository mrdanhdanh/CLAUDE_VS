> 🤖 Auto-log bởi auto-learn.mjs — 2026-09-13T13:40:21.610Z
> **Error:** `git checkout HEAD -- auto-learn.mjs reverted UNCOMMITTED refactor (only AR was saved to keep-file first)`
> **File:** `.github/harness/scripts/auto-learn.mjs`
> **Title:** git checkout HEAD revert nham refactor chua commit - recover bang VSCode local history

# Bug: git checkout HEAD -- revert nhầm refactor chưa commit của auto-learn.mjs

## Meta

- **Slug:** `2026-09-13-git-checkout-head-revert-nham-refactor-chua-commit`
- **Ngày:** 2026-09-13
- **Severity:** `major`
- **Reporter:** YUNIE (Batch 1 refactor session)
- **Related KN:** `KN-053`
- **Tags:** `process` `dx` `git` `recovery`
- **Status:** `fixed`

---

## 1. Reproduce

### Steps
1. Refactor xong `auto-learn.mjs` (~12 edits, **chưa commit**) trong session Batch 1.
2. Chạy `git checkout HEAD -- auto-researcher.mjs auto-learn.mjs` để tạo bản orig byte-exact cho pairwise (chỉ AR được save vào keep-file trước).
3. Grep markers (`kn-parse`, `printStatusHuman`) trong `auto-learn.mjs` → trống.

### Expected vs Actual
- **Expected:** checkout chỉ ảnh hưởng file đã commit / file được intention revert.
- **Actual:** refactor chưa commit của `auto-learn.mjs` bị ghi đè âm thầm về bản HEAD; exit 0, không warning.

### Evidence
- Grep markers sau checkout: `kn-parse` / `printStatusHuman` / `readRecentReports` đều KHÔNG match (mất hết).
- VS Code Local History entry `Ippz.mjs` (20:35:29) chứa bản đầy đủ: `kn-parse` import + 6× `parseKNs(KNOWLEGED)` + không còn `function tokenize`.

### Environment
- Branch: `main` · Commit thời điểm lỗi: `staged-but-uncommitted` (vùng nguy hiểm)
- OS: Windows · Tool: PowerShell 7

---

## 2. Root Cause (5 Whys)

- **File:Line:** `.github/harness/scripts/auto-learn.mjs` (working tree, uncommitted)
- **Why 1:** `git checkout HEAD -- <file>` ghi đè working tree không hỏi, kể cả uncommitted changes (hành vi thiết kế của git).
- **Why 2:** Dùng nó làm bước "restore orig byte-exact" cho pairwise nhưng chỉ save 1/2 file vào keep-file trước.
- **Why 3:** Part 1 đã dùng đúng quy trình (Copy-Item working tree TRƯỚC khi edit → .orig); part 2 tự phá vì tưởng refactor "đã clean" không cần.
- **Why 4:** Session dài + nhiều state (orig/keep/refactored) không checklist → thao tác phá hoại chạy muscle memory.
- **Why 5 (Root):** Destructive command (checkout/reset) không có gate invariant "file này có uncommitted work không?" — thiếu pre-check trước thao tác phá hoại.

- **Impact:** Suýt mất ~12 edits (~30 phút refactor) của file core CLI; may recover được 100% qua VS Code Local History.
- **Hypothesis:** N/A — nguyên nhân xác định ngay từ git design; recovery verify bằng markers.
- **Confidence:** `HIGH` (recovered exact state + re-verify 57/57 pairwise + 21/21 specs pass)

> Nếu bug chạm pattern trong `docs/knowleged.md` → ghi `Related KN: KN-XXX` và áp dụng **Cách phòng tránh** ngay.
> **Root Cause Gate:** Nếu uncertain → investigate / escalate, không tự biến hypothesis thành sự thật.

---

## 3. Fix

- **Approach:** Recover từ VS Code Local History, KHÔNG viết lại từ đầu (tránh mất fidelity) — verify markers entry trước khi copy.
- **Files Changed:**
  - `.github/harness/scripts/auto-learn.mjs` — restore từ history entry `Ippz.mjs` (byte copy)
- **Diff tóm tắt:** N/A (restore nguyên trạng bản refactored; không sửa code mới)
- **Non-Goals:** Không viết lại refactor từ đầu; không đổi behavior; không thêm test mới (đã có pairwise + specs).
- **Fix Confidence:** `HIGH` — điều kiện verify rõ (markers + pairwise + specs).
- **get_errors:** `No errors found` sau restore.

---

## 4. Verification

- [x] Re-run steps reproduce → **Fixed** (markers `kn-parse` + `printStatusHuman` + 6× `parseKNs(KNOWLEGED)` đều match)
- [x] Edge cases:
  - [x] case 1: pairwise AR 6/6 IDENTICAL (gồm distill ghi 3 file + report write)
  - [x] case 2: pairwise AL 28/28 IDENTICAL + log/record write paths
- [x] Regression: 3 specs phụ thuộc (cosmos-cmb, cosmos-hawking, slop-check) → **21/21 pass**
- [x] `get_errors` **toàn scope** → 0 errors
- [x] slop-check → **Clean** (0 findings)
- [x] Fresh-eyes tier: `REQUIRED` — verify bằng byte-level comparisons + full spec suite

**Kết quả:**
```
pairwise auto-researcher: ALL IDENTICAL — 6/6
pairwise auto-learn:      ALL IDENTICAL — 28/28
specs phụ thuộc:          21 passed
slop-check:               ✅ Clean — không phát hiện slop
```

---

## 5. Lesson (1 câu)

> KHÔNG `git checkout HEAD -- <file>` khi file có refactor chưa commit — pre-check `git status`/`git diff` trước; file nghi mất thì check VS Code Local History (verify markers) trước khi viết lại.

---

## 6. Prevention

- **Cách phòng tránh lần sau:**
  - [x] CẤM checkout/reset khi file uncommitted (pre-check bắt buộc, fail-closed)
  - [x] Commit từng file khi refactor xong — không dồn cuối session
  - [x] Restore byte-level copy, không `git show | Out-File`
  - [x] Thêm checklist vào `docs/knowleged.md` Anti-patterns / Checklist phòng tránh chung
- **Cần cập nhật:**
  - [x] `docs/knowleged.md` → `KN-053` (Bảng tóm tắt + Chi tiết + Anti-patterns + Checklist)
  - [ ] `product-quality.instructions.md` (nếu là chuẩn UI mới) — N/A
  - [ ] Test mới — N/A (pairwise + specs hiện có đủ)

---

## References

- `docs/knowleged.md#KN-XXX`
- Issue / PR: #
- Commit fix: `<hash>`

---
*Template: `.agent/bugs/_template/bug.md` — dùng bởi `/fixbug` Phase 1 & 5.*
