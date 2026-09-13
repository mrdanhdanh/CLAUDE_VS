> 🤖 Auto-log bởi auto-learn.mjs — 2026-09-13T15:38:04Z
> **Error:** `The term 'luoi' is not recognized as the name of a cmdlet — Stop hook PowerShell subexpression error khi echo chua dau ngoac`
> **File:** `.github/hooks/hooks.json`
> **Title:** Stop hook loi: dau ngoac trong lenh echo bi PowerShell parse thanh subexpression

> 🔁 **RADAR TÁI LẬP** — [KN-039] score 93.5 + bug cũ `2026-09-11-ps-5-1-khong-ho-tro-trong-lenh-powershell` score 178.6 → **TÁI LẬP CLASS KN-039** (PowerShell command syntax trap), biến thể mới: `()` trong hooks.json (thay vì `??` trong terminal).
> **Vì sao lưới cũ không bắt được:** KN-039 phòng tránh nằm ở instruction §5d — văn xuôi, áp cho "lệnh agent GÕ trong terminal"; không ai coi `hooks.json` là "lệnh PowerShell" và **không có spec nào đọc hooks.json** → bề mặt thứ 2 của cùng lớp lỗi vô lưới. → Nâng lưới TRƯỚC (đúng KN-056): `tests/e2e/hooks-integrity.spec.ts`.

# Bug: Stop hook lỗi — dấu ngoặc trong echo bị PowerShell parse thành subexpression

## Meta

- **Slug:** `2026-09-13-stop-hook-loi-dau-ngoac-trong-lenh-echo-bi-powersh`
- **Ngày:** 2026-09-13
- **Severity:** minor
- **Reporter:** @user (báo lỗi Stop hook sau commit `1f227ee`)
- **Related KN:** `KN-039` (tái lập class — addendum 2026-09-13; không tạo KN mới vì cùng lớp lỗi)
- **Tags:** `process` `dx` `windows` `powershell` `hooks`
- **Guard:** `tests/e2e/hooks-integrity.spec.ts` (2 test: hooks.json metachar-free · .claude/settings.json không drift)
- **Status:** `fixed`

---

## 1. Reproduce

### Steps
1. Commit `1f227ee` cập nhật `.github/hooks/hooks.json` — thêm 2 câu vào lệnh `echo`: `... log (tự RADAR tái lập)` và `... GUARD (lưới chống tái lập: guards)`.
2. VS Code chạy Stop hook qua PowerShell (default profile).
3. PowerShell parse `(lưới chống tái lập: guards)` thành **subexpression** → tìm command tên `lưới` → CommandNotFoundException mỗi lần hook chạy.

### Expected vs Actual
- **Expected:** hook echo thông điệp nhắc nhở, exit 0, không side effect.
- **Actual:** `The term 'lu?i' is not recognized as the name of a cmdlet...` mỗi lần Stop hook kích hoạt.

### Evidence
```
lu?i : The term 'lu?i' is not recognized as the name of a cmdlet, function, script file, or operable program.
At line:1 char:122
+ ... arn.mjs status - v?a fix bug th? propose KN m?i + GUARD (lu?i ch?ng t ...
+                                                              ~~~~
    + CategoryInfo          : ObjectNotFound: (lu?i:String) [], CommandNotFoundException
```

### Environment
- Branch: `main` · Commit: `1f227ee` · OS: Windows · Shell: PowerShell (VS Code default profile)

---

## 2. Root Cause (5 Whys)

- **File:Line:** `.github/hooks/hooks.json` (2 commands) + bản export `.claude/settings.json`
- **Why 1:** PowerShell parse `(...)` trong lệnh thành subexpression — cố thực thi `lưới` như một command.
- **Why 2:** YUNIE thêm ngoặc khi viết hook message mà không chạy thử lệnh trong shell đích — tưởng `echo` là "an toàn".
- **Why 3:** `hooks.json` không nằm trong bất kỳ spec nào — sửa xong không ai verify.
- **Why 4:** Lệnh trong `hooks.json` là **code chạy qua shell** nhưng bị đối xử như text tài liệu.
- **Why 5 (Root):** **TÁI LẬP CLASS KN-039** (PowerShell command syntax trap) ở bề mặt thứ 2 — KN-039 chỉ phòng tránh bằng văn xuôi §5d cho "lệnh agent gõ terminal"; hooks.json chưa có lưới máy. Thiếu lưới → tái lập (đúng KN-056: "KN không lưới = wishlist").

- **Impact:** Mọi hook chứa metacharacter → spam lỗi đỏ mỗi lần chạy; nguy hiểm hơn nếu tương lai copy pattern vào hook — subexpression có thể thực thi lệnh thật.
- **Hypothesis:** verified — chạy nguyên văn 2 lệnh trong pwsh (trước fix: lỗi; sau fix: exit 0).
- **Confidence:** HIGH (proven + guard spec pass 2/2).

---

## 3. Fix

- **Approach:** Sửa ở nguồn `.github/hooks/hooks.json` — bỏ dấu ngoặc khỏi 2 lệnh echo (viết lại câu không cần ngoặc); `.claude/settings.json` regenerate qua `export-claude` (nguồn 1 chiều — không sửa tay bản export).
- **Files Changed:**
  - `.github/hooks/hooks.json` — 2 command: bỏ `()`, giữ nguyên nội dung nhắc
  - `.claude/settings.json` + `.claude/harness-export.json` — regenerate (export-claude)
  - `tests/e2e/hooks-integrity.spec.ts` — **lưới mới** (2 test, guard của KN-039 nhánh hooks)
- **Diff tóm tắt:**
```diff
- echo [Auto-Learn] ... gặp lỗi thì log (tự RADAR tái lập)
+ echo [Auto-Learn] ... gặp lỗi thì log ngay — log tự chạy RADAR tái lập
- echo [Auto-Learn] ... propose KN mới + GUARD (lưới chống tái lập: guards)
+ echo [Auto-Learn] ... propose KN mới và GUARD — xem lưới chống tái lập bằng lệnh guards
```
- **Non-Goals:** không đổi cơ chế hook; không thêm dependency; không viết hook-runner giả lập.
- **Fix Confidence:** HIGH
- **get_errors:** 0 errors (hooks.json valid JSON; spec TS clean).

---

## 4. Verification

- [x] Re-run nguyên văn 2 lệnh trong pwsh → exit 0, echo đủ nội dung (không còn CommandNotFoundException)
- [x] Spec mới `hooks-integrity.spec.ts`: trước regenerate 1 FAIL (.claude còn ngoặc — guard bắt drift thật) → sau regenerate 2/2 PASS
- [x] grep `[()]` trên `hooks.json` + `.claude/settings.json` → rỗng
- [x] `harness-manager export-claude` re-sync (nguồn 1 chiều)
- [x] Slop-check changed files: **Clean**
- [x] `guards` coverage: **KN-039 giờ có lưới** (`hooks-integrity.spec.ts`) — withGuard 27→29, priority 27→25
- [ ] Full suite regression (ghi kết quả dưới)

**Kết quả:**
```
hooks-integrity: 2 passed (RED trước regenerate .claude → GREEN)
slop-check: Clean · guards: KN-039 → tests/e2e/hooks-integrity.spec.ts
(pending — full suite)
```

---

## 5. Lesson (1 câu)

> Lệnh trong `hooks.json` CŨNG là lệnh PowerShell — metacharacter `( ) ; &` + backtick bị parse thành cú pháp (subexpression/pipe); mọi hook command phải metachar-free và có lưới máy (`hooks-integrity.spec.ts`), không trông vào văn xuôi.

---

## 6. Prevention

- **Cách phòng tránh lần sau:**
  - [ ] Viết lệnh hook: chỉ text thuần trong `echo` — cấm `( ) ; | &` + backtick; cần nhấn mạnh dùng `—` hoặc từ nối, không dùng ngoặc
  - [ ] Sửa `hooks.json` → bắt buộc chạy `hooks-integrity.spec.ts` + chạy thử 1 lệnh trong pwsh
  - [ ] Bản export `.claude/settings.json` regenerate qua CLI, không sửa tay (nguồn 1 chiều)
- **Guard (lưới chống tái lập — KN-056):**
  - [x] `- **Guard:**` điền ở Meta — `tests/e2e/hooks-integrity.spec.ts` (2 test)
  - [x] Tái lập class KN-039 → addendum KN-039 ghi "vì sao lưới cũ miss" (văn xuôi §5d không phủ hooks.json) + guard máy
- **Cần cập nhật:**
  - [x] `docs/knowleged.md` → KN-039 addendum (tái lập class)
  - [x] Test mới: `tests/e2e/hooks-integrity.spec.ts`

---

## References

- `docs/knowleged.md#KN-039` (tái lập class) · KN-056 (vòng chống tái lập) · KN-039 guard mới
- `tests/e2e/hooks-integrity.spec.ts`
- Commit gốc gây lỗi: `1f227ee` (hook message chứa ngoặc)
