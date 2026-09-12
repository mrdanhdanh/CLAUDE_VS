# Bug: Archify skill port — (A) EPERM rename trên Windows + (B) diagram tràn first-screen

> ♻️ **Retrofit 2026-09-12** — record chuẩn hóa từ `docs/knowleged.md` (KN-016 + KN-017); bug dir chưa được tạo tại thời điểm fix, audit 2026-09-12 phát hiện reference chết. Evidence hiện có: `.agent/plans/archify-demo/*.visual-check.json` (pass sau fix) + `harness-manager.mjs:safeRename()`.

## Meta

- **Slug:** `2026-09-06-archify-skill-port`
- **Ngày:** 2026-09-06
- **Severity:** `major`
- **Reporter:** YUNIE / fixbug
- **Related KN:** `KN-016` (EPERM rename) + `KN-017` (viewport ratio math)
- **Tags:** `process` `dx` `windows` `fs` `ui` `diagram` `archify` `responsive` `verify`
- **Status:** `fixed`

---

## Phần A — EPERM khi disable skill (KN-016)

### 1. Reproduce

**Steps:**
1. `node .github/harness/scripts/harness-manager.mjs disable skill archify`
2. → `❌ EPERM: operation not permitted, rename 'D:\CLAUDE_VS\.github\skills\archify' -> '...\.disabled\archify'` — dù ACL đầy đủ (Authenticated Users Modify), folder không readonly.
3. `Move-Item` PowerShell cùng 2 path → OK; Node `fs.rename` retry vẫn fail.

**Expected vs Actual:**
- **Expected:** disable/enable/preset apply pass trên Windows.
- **Actual:** `fs.rename` folder bị EPERM do process khác (VS Code file watcher / context indexer) giữ handle mức directory.

### 2. Root Cause (5 Whys)

- **File:Line:** `.github/harness/scripts/harness-manager.mjs` (`setEnabled`, `presetApply`)
- **Why 1:** `fs.rename` fail EPERM → OS từ chối rename folder.
- **Why 2:** OS từ chối → process khác giữ handle trên folder/file bên trong.
- **Why 3:** Handle không thấy qua `open()` → watcher giữ handle mức directory, không phải file đơn.
- **Why 4:** `harness-manager` chỉ có 1 đường rename → không fallback khi bị chặn.
- **Why 5 (Root):** Windows rename folder dễ vỡ khi có watcher — cần fallback copy+rm thay vì fail cứng.

### 3. Fix

- **Approach:** Thêm `safeRename(src, dst)`: thử `fs.rename`; bắt `EPERM|EXDEV|EBUSY` → `fs.cp(recursive, force)` + `fs.rm` (folder) hoặc `copyFile` + `rm` (file). Patch `setEnabled` + `presetApply`.
- **Files Changed:** `.github/harness/scripts/harness-manager.mjs` — verify 2026-09-12: `safeRename` tồn tại trong file.
- **Fix Confidence:** `HIGH` — disable/enable/preset apply pass sau fix.

---

## Phần B — Archify diagram tràn first-screen + text < 6px (KN-017)

### 1. Reproduce

**Steps:**
1. `deliver` diagram workflow/sequence (viewBox gần vuông hoặc quá dài).
2. `visual-check` → fail `viewer/viewport-overflow` (scrollHeight 1415–2004 > innerHeight 900–1320) hoặc `composition/desktop-readability` (projectedFontPx 4.8–5.9 < 6).
3. Sửa width → vỡ text; sửa height → tràn dọc — bế tắc 2 đầu.

**Expected vs Actual:**
- **Expected:** 9/9 showcase checks VÀ `visual-check` pass (containment + readability).
- **Actual:** showcase pass nhưng `visual-check` fail — viewBox chọn sai làm 2 ràng buộc loại trừ nhau.

### 2. Root Cause (5 Whys)

- **File:Line:** Archify IR candidate JSON (`viewBox` sizing) — demo tại `.agent/plans/archify-demo/`
- **Why 1:** Render tràn dọc → vì `height × scale > viewport height` trừ chrome (~586px @1440×900).
- **Why 2:** Scale nhỏ → vì `scale = availableDiagramWidth (~930px) / viewBoxWidth`.
- **Why 3:** viewBoxWidth 1400 → scale 0.66 → text 7.3px × 0.66 = 4.8px < 6px minimum.
- **Why 4:** viewBoxWidth 772 → scale 1.2 nhưng height 652 × 1.2 = 785px > 586px → tràn.
- **Why 5 (Root):** Thiếu **ratio math** — phải chọn width thỏa đồng thời `scale ≥ 0.822` (text ≥6px) VÀ `height × scale ≤ ~586px`.

### 3. Fix

- **Approach:** Sweet spot `width ∈ [1035, 1131]` cho height ~652; workflow `[1100, 652]`, sequence `[1050, 560]` (nén y theo tỉ lệ `560/720`, giữ min y 160, spread messages ≥28px). Sau mỗi lần đổi viewBox → rescale toàn bộ tọa độ y → `deliver` + `visual-check` lại.
- **Files Changed:** demo tại `.agent/plans/archify-demo/` — `harness-architecture.html` + `harness-sequence.html` + `harness-workflow.html` + artifacts `*.visual-check.*`.
- **Fix Confidence:** `HIGH` — verify 2026-09-12: `harness-sequence.visual-check.json` → `ok:true, status:pass`.

---

## 4. Verify (sau fix — cả 2 phần)

- [x] `harness-manager disable/enable/preset apply` pass (safeRename fallback).
- [x] `visual-check` pass cho 3 diagram (`.agent/plans/archify-demo/*.visual-check.json` → `ok:true`).
- [x] KN-016 + KN-017 ghi trong `docs/knowleged.md`.

## 5. Prevention (tóm tắt — chi tiết ở KN-016/017)

- Mọi script move file/folder trên Windows dùng wrapper rename có fallback, không gọi `fs.rename` trần.
- Diagram: ưu tiên viewBox dẹt (ratio ≥ 1.7:1) hoặc tính `maxHeight = 586 / (930/width)`; luôn `visual-check` sau `deliver` — 9/9 showcase checks KHÔNG bao gồm browser containment.
