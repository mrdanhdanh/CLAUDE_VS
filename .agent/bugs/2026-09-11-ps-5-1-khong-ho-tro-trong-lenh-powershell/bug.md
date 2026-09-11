> 🤖 Auto-log bởi auto-learn.mjs — 2026-09-11T17:02:05.160Z
> **Error:** `Unexpected token '??' in expression or statement - Windows PowerShell 5.1 khong ho tro nullish coalescing. Lan 1: URL verify ( ?? 'NO-RESP'). Lan 2: port kill (.ProcessName ?? 'unknown'). Ca 2 deu phai viet lai bang if (-not ...)`
> **File:** `.github/copilot-instructions.md`
> **Title:** PS 5.1 khong ho tro ?? trong lenh PowerShell

# Bug: PS 5.1 khong ho tro ?? trong lenh PowerShell

> Copy file này vào `.agent/bugs/2026-09-11-ps-5-1-khong-ho-tro-trong-lenh-powershell/bug.md` khi bắt đầu `/fixbug`.

## Meta

- **Slug:** `2026-09-11-ps-5-1-khong-ho-tro-trong-lenh-powershell`
- **Ngày:** 2026-09-11
- **Severity:** `major`
- **Reporter:** @user (báo "Lại dính `??` — PS 5.1 không hỗ trợ") / YUNIE
- **Related KN:** `KN-039`
- **Tags:** `process` `dx` `windows` `powershell` `scripts`
- **Status:** `fixed`

---

## 1. Reproduce

### Steps
1. Trong session a67f5959 (verify cosmos + nạp thư viện), agent sinh lệnh PowerShell: (a) loop verify URL tài liệu với `Write-Output ("{0} => {1} | {2} | {3}" -f $_, ($code ?? 'NO-RESP'), ($len ?? 'n/a'), ($ct ?? 'n/a'))`; (b) kill port 3187 với `($p.ProcessName ?? 'unknown')`.
2. Chạy lệnh trong terminal `powershell` (Windows PowerShell 5.1).
3. Quan sát: lệnh fail ngay khi parse, không thực thi.

### Expected vs Actual
- **Expected:** Lệnh chạy, in giá trị mặc định khi null (giống Node/JS `??`).
- **Actual:** `Unexpected token '??' in expression or statement` (+ `Missing closing '}' in statement block`) — PowerShell 5.1 không hỗ trợ `??`; lệnh phải viết lại + re-run.

### Evidence
- Terminal output (session a67f5959): `At line:1 char:294 + ... Port 3187 held by PID " + $procId + " (" + ($p.ProcessName ?? 'unknow ... ~~ Unexpected token '??' in expression or statement.`
- Lần 1 (URL verify): `Unexpected token ')'` tại cùng vị trí `($code ?? 'NO-RESP')`.

### Environment
- Branch: `main`
- OS: Windows · shell: **Windows PowerShell 5.1** (`powershell`, không phải `pwsh`)
- Ngữ cảnh: lần 1 — verify URL tài liệu; lần 2 — kill port 3187 (EADDRINUSE của v4-verify)

---

## 2. Root Cause (5 Whys)

- **File:Line:** không phải codebase — lệnh PowerShell sinh tại runtime (session a67f5959); rule tại `.github/copilot-instructions.md` §5d
- **Why 1:** Lệnh chứa `??` — null-coalescing operator chỉ tồn tại từ PowerShell 7+.
- **Why 2:** Máy chạy Windows PowerShell 5.1 — không hỗ trợ `??`, `?.`, `??=`, ternary `? :`.
- **Why 3:** Agent sinh lệnh theo thói quen JS/TS — training data nghiêng cú pháp hiện đại, `??` quen tay.
- **Why 4:** Rule §5d (Windows Script Contract) chỉ cấm `&&`, chưa nêu `??`/`?.`/ternary → không có guardrail cụ thể cho agent.
- **Why 5 (Root):** Thiếu "PS 5.1 syntax contract" đầy đủ trong rule + chưa có KN → cùng lỗi dính 2 lần trong 1 session (lý do user báo "lại dính").

- **Impact:** Lệnh verify/governance fail parse → mất thời gian viết lại + re-run; nếu là lệnh thao tác (kill process, deploy) có thể để lại trạng thái nửa vời.
- **Hypothesis:** `??` là cú pháp PS 7 — đã verify bằng error message `Unexpected token '??'` + bản viết lại kiểu `if (-not ...)` chạy pass.
- **Confidence:** `HIGH` (proven — reproduce bằng chính error message, fixed version chạy exit 0)

> Nếu bug chạm pattern trong `docs/knowleged.md` → ghi `Related KN: KN-XXX` và áp dụng **Cách phòng tránh** ngay.
> **Root Cause Gate:** Nếu uncertain → investigate / escalate, không tự biến hypothesis thành sự thật.

---

## 3. Fix

- **Approach:** 2 tầng: (1) rewrite lệnh ngay khi gặp (đã làm tại chỗ trong session a67f5959); (2) sửa gốc = bổ sung "PS 5.1 syntax contract" vào rule + KN để agent không sinh lại cú pháp PS 7.
- **Files Changed:**
  - `.github/copilot-instructions.md` — §5d cấm cú pháp PS 7+ (`??`, `?.`, `??=`, ternary, `&&` chain) trong lệnh/script PowerShell + mapping cách viết 5.1; §7 thêm anti-pattern
  - `docs/knowleged.md` — KN-039 (bảng + chi tiết + anti-patterns + checklist) + UpdatedAt
  - `CLAUDE.md` + `.claude/**` — regenerate qua `harness-manager export-claude`
- **Diff tóm tắt:**
```diff
- ($code ?? 'NO-RESP')                       # PS 7+ → parse fail
+ if (-not $code) { $code = 'NO-RESP' }      # PS 5.1 OK
- ($p.ProcessName ?? 'unknown')
+ $name = if ($p.ProcessName) { $p.ProcessName } else { 'unknown' }
```
- **Non-Goals:** Không thêm lint script riêng (YAGNI — rule + KN đủ leverage); không sửa `.mjs` (Node hỗ trợ `??` hợp lệ).
- **Fix Confidence:** `HIGH` — root cause rõ (PS 5.1 thiếu operator), fix tầng rule verify được bằng grep + export.
- **get_errors:** 0 errors sau edit (check affected files).

---

## 4. Verification

- [x] Re-run steps reproduce → **Fixed**: bản viết lại không `??` chạy exit 0 (port 3187 killed OK — lệnh trong terminal hiện tại)
- [x] Edge cases:
  - [x] `?` đơn trong chuỗi (không phải `??`) → OK
  - [x] `??` trong `.mjs`/Node → vẫn hợp lệ (chỉ cấm trong lệnh PS)
- [x] Regression: docs/rule-only change — không đụng runtime code
- [x] `get_errors` **toàn scope** → 0 errors
- [x] `lint` / `build` / `test`: docs-only → grep sweep `??` trong md/ps1 (0 sót ngoài Node-context) + `auto-learn status` + `export-claude` PASS
- [x] Fresh-eyes tier: `OPTIONAL` (deterministic — syntax contract + docs)

**Kết quả:**
```
✅ grep '\?\?' trong **/*.ps1 = 0 files · md = chỉ JS/Node context (plugin-seam, archify changelog)
✅ export-claude → CLAUDE.md regen từ copilot-instructions (có §5d mới)
✅ auto-learn status: KN 39 · bug 22
```

---

## 5. Lesson (1 câu)

> Lệnh PowerShell trên máy này chỉ được dùng cú pháp PS 5.1 — cấm `??`/`?.`/`??=`/ternary/`&&` (PS 7+): thay bằng `if (-not $x) { $x = 'default' }`; gặp `Unexpected token` → viết lại toàn lệnh rồi mới re-run.

---

## 6. Prevention

- **Cách phòng tránh lần sau:**
  - [x] Sinh lệnh PS: chỉ cú pháp 5.1 (`??` → `if (-not ...)`, `?.` → `if ($a -and $a.b)`, ternary → if/else, `&&` → `;`)
  - [x] Gặp lỗi parse → viết lại TOÀN lệnh, không re-run y nguyên (KN-023)
  - [x] Thêm anti-pattern + checklist vào `docs/knowleged.md` (KN-039)
  - [x] Bổ sung rule §5d `copilot-instructions.md` + regen `CLAUDE.md`/`.claude`
  - [x] 2026-09-12 root fix môi trường: cài pwsh 7.6.6 user-space (no admin, zip + Unblock-File + user PATH) + VS Code default/automation terminal "PowerShell 7" — rule §5d chuyển 2 tầng (ad-hoc pwsh 7 · artifact repo 5.1 floor)
- **Cần cập nhật:**
  - [x] `docs/knowleged.md` → `KN-039` (Bảng tóm tắt + Chi tiết + Anti-patterns + Checklist)
  - [ ] `product-quality.instructions.md` — không cần (không phải chuẩn UI)
  - [ ] Test mới — không cần (deterministic rule, script test = YAGNI)

---

## References

- `docs/knowleged.md#KN-XXX`
- Issue / PR: #
- Commit fix: `<hash>`

---
*Template: `.agent/bugs/_template/bug.md` — dùng bởi `/fixbug` Phase 1 & 5.*
