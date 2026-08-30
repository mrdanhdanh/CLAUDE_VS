> 🤖 Auto-log bởi auto-learn.mjs — 2026-08-30T16:23:32.430Z
> **Error:** `MSB3027 MSB3021 Could not copy apphost.exe to N5Blazor.exe file locked by N5Blazor (28232) dotnet run still running on 5251`
> **File:** `N5Blazor/N5Blazor.csproj`
> **Title:** dotnet build fail do file lock N5Blazor.exe đang chạy

# Bug: dotnet build fail do file lock N5Blazor.exe đang chạy

## Meta

- **Slug:** `2026-08-30-dotnet-build-fail-do-file-lock-n5blazor-exe-ang-ch`
- **Ngày:** 2026-08-30
- **Severity:** major
- **Reporter:** YUNIE / auto-learn
- **Related KN:** `KN-008` (sẽ tạo) — liên quan KN-006 (N5 Blazor) + KN-007 (Auto-Learn)
- **Tags:** `build` `process` `dx` `dotnet`
- **Status:** fixed

---

## 1. Reproduce

### Steps
1. Mở terminal 1: `dotnet run --project N5Blazor` → app chạy trên http://localhost:5251 (PID 28232, LISTENING)
2. Mở terminal 2 (không tắt terminal 1): `dotnet build N5Blazor --nologo`
3. Quan sát build retry 10 lần rồi fail

### Expected vs Actual
- **Expected:** Build thành công (hoặc báo rõ "app đang chạy, hãy tắt trước khi build")
- **Actual:** Build FAILED sau 17s:
  ```
  warning MSB3026: Could not copy "...apphost.exe" to "bin/Debug/net8.0/N5Blazor.exe" — file locked by: "N5Blazor (28232)"
  error MSB3027: Could not copy ... Exceeded retry count of 10. Failed.
  error MSB3021: Unable to copy file ... The process cannot access the file ... because it is being used by another process.
  ```

### Evidence
```
Build FAILED.
    10 Warning(s)
    2 Error(s)
Time Elapsed 00:00:17.74
# dotnet test cũng fail tương tự
# netstat -ano | findstr 5251 → TCP 127.0.0.1:5251 LISTENING 28232
# Get-Process N5Blazor → Id 28232 CPU 6.8
```

### Environment
- Branch: main (commit 3a9571c)
- OS: Windows 11, .NET SDK 10.0.301, net8.0
- Launch: http://localhost:5251 (launchSettings.json profile http)

---

## 2. Root Cause (5 Whys)

- **File:Line:** `N5Blazor/bin/Debug/net8.0/N5Blazor.exe:1` (file lock) + `N5Blazor/N5Blazor.csproj:1` (build target)
- **Why 1:** Build không copy được `obj/Debug/net8.0/apphost.exe` → `bin/Debug/net8.0/N5Blazor.exe` vì file đang bị khóa
- **Why 2:** File bị khóa vì process `N5Blazor (28232)` vẫn đang chạy (từ `dotnet run` trước đó, giữ handle exe)
- **Why 3:** `dotnet run` không được tắt trước khi `dotnet build` — terminal cũ vẫn LISTENING trên 5251
- **Why 4:** Không có pre-build check / warning — dev quên tắt app, build cứ retry 10 lần vô ích (17s)
- **Why 5 (Root):** Thiếu quy trình **stop-before-build** + thiếu auto-log cho lỗi build (chưa dùng `auto-learn log` ngay khi build fail)

- **Impact:** Block toàn bộ build/test (cả N5Blazor và N5Blazor.Tests), tốn 17s mỗi lần, dễ nhầm là lỗi code
- **Hypothesis:** Không phải lỗi code — là process lock. Đã verify bằng `Stop-Process 28232` → build lại pass ngay

---

## 3. Fix

- **Approach:** Dừng process đang khóa file trước khi build — không sửa code, chỉ quản lý process
- **Files Changed:**
  - (không đổi code) — xử lý process: `Stop-Process -Id 28232 -Force`
  - (đề xuất) `docs/knowleged.md` → thêm KN-008 + checklist
- **Diff tóm tắt:**
```powershell
# before: dotnet build → MSB3027 fail (file locked)
Stop-Process -Id 28232 -Force; Start-Sleep 2
dotnet build N5Blazor --nologo  # → Build succeeded 0 Warning 0 Error
dotnet test N5Blazor.Tests --nologo  # → Passed 25/25
```
- **Non-Goals:** Không đổi launchSettings, không thêm MSBuild target tự kill (để tránh kill nhầm), chỉ document quy trình

---

## 4. Verification

- [x] Re-run steps reproduce → **Fixed** (Expected = Actual)
- [x] Edge cases:
  - [x] Kill xong build lại → pass
  - [x] dotnet test sau khi kill → 25 passed
  - [x] www/status.json vẫn valid, get_errors 0
- [x] Regression: N5Blazor.Tests 25/25 pass, www static ok
- [x] `get_errors` → 0 errors
- [x] `dotnet build` / `dotnet test` → PASS

**Kết quả:**
```
N5Blazor -> D:\CLAUDE_VS\N5Blazor\bin\Debug\net8.0\N5Blazor.dll
Build succeeded. 0 Warning(s) 0 Error(s) Time Elapsed 00:00:02.32
Passed! - Failed: 0, Passed: 25, Skipped: 0, Total: 25
status.json valid ✅
```

---

## 5. Lesson (1 câu)

> Trước khi `dotnet build/test`, luôn tắt `dotnet run` đang giữ file — nếu gặp MSB3027/MSB3021 thì `Stop-Process` PID đang LISTENING trên 5251 rồi build lại.

---

## 6. Prevention

- **Cách phòng tránh lần sau:**
  - [x] Trước khi build/test: kiểm tra `Get-Process N5Blazor` hoặc `netstat -ano | findstr 5251` — nếu còn thì `Stop-Process -Force`
  - [x] Khi build fail với MSB3027/MSB3021 → chạy ngay `node .github/harness/scripts/auto-learn.mjs log --error "MSB3027 ..." --file "N5Blazor/N5Blazor.csproj" --title "file lock"`
  - [x] Thêm checklist vào `docs/knowleged.md` Checklist phòng tránh chung (KN-008)
  - [x] Cân nhắc thêm script `prebuild: taskkill /F /IM N5Blazor.exe 2>nul` nếu hay quên (optional)
- **Cần cập nhật:**
  - [x] `docs/knowleged.md` → `KN-008` (Bảng tóm tắt + Chi tiết)
  - [ ] `product-quality.instructions.md` (không cần — là build process)
  - [ ] Test mới: không cần — đã có 25 tests pass

---

## References

- `docs/knowleged.md#KN-008`
- Commit fix: (process kill, không commit code)
- Log: MSB3027/MSB3021 apphost.exe → N5Blazor.exe locked by 28232

---
*Auto-log + fix bởi YUNIE / auto-learn — 2026-08-30*
