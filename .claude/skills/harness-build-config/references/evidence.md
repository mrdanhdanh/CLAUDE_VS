# Evidence — harness-build-config (DisCo arXiv:2609.02749v1 §3.2 (task-agnostic))

> Substrate layer của skill — full text từ docs/knowleged.md. Sinh tự động 2026-09-04T09:13:35.828Z.

## Bug reports liên quan (1/11 bugs)

- `.agent/bugs/2026-08-30-dotnet-build-fail-do-file-lock-n5blazor-exe-ang-ch/bug.md` — Bug: dotnet build fail do file lock N5Blazor.exe đang chạy

## Full KN details

### KN-008 — dotnet build fail MSB3027/MSB3021 do file lock — N5Blazor.exe đang chạy

- **Ngày:** 2026-08-30
- **Bug report:** `.agent/bugs/2026-08-30-dotnet-build-fail-do-file-lock-n5blazor-exe-ang-ch/bug.md`
- **Severity:** major
- **Triệu chứng:** `dotnet build N5Blazor` và `dotnet test` đều fail sau 17s với 10 warnings + 2 errors:
  ```
  warning MSB3026: Could not copy "...apphost.exe" to "bin/Debug/net8.0/N5Blazor.exe" — file locked by: "N5Blazor (28232)"
  error MSB3027: Could not copy ... Exceeded retry count of 10. Failed.
  error MSB3021: Unable to copy file ... The process cannot access the file ... because it is being used by another process.
  ```
  Trong khi `dotnet run --project N5Blazor` vẫn đang chạy ở terminal khác (LISTENING 127.0.0.1:5251, PID 28232).
- **Nguyên nhân gốc (5 Whys):**
  - Why1: Build không copy được `apphost.exe` → `N5Blazor.exe` vì file đang bị khóa.
  - Why2: File bị khóa vì process `N5Blazor (28232)` vẫn giữ handle (từ `dotnet run` trước đó).
  - Why3: `dotnet run` không được tắt trước khi `dotnet build` — terminal cũ vẫn LISTENING trên 5251.
  - Why4: Không có pre-build check / warning — dev quên tắt app, build cứ retry 10 lần vô ích (17s).
  - Why5 (Root): Thiếu quy trình **stop-before-build** + thiếu auto-log cho lỗi build (chưa dùng `auto-learn log` ngay khi build fail).
- **Cách sửa:** Dừng process đang khóa file trước khi build — không sửa code, chỉ quản lý process:
  ```powershell
  Stop-Process -Id 28232 -Force; Start-Sleep 2
  dotnet build N5Blazor --nologo  # → Build succeeded 0 Warning 0 Error (2.32s)
  dotnet test N5Blazor.Tests --nologo  # → Passed 25/25
  ```
  Đã verify: build pass, test 25 passed, www/status.json valid, get_errors 0.
- **Cách phòng tránh:**
  - Trước khi `dotnet build/test`: kiểm tra `Get-Process N5Blazor` hoặc `netstat -ano | findstr 5251` — nếu còn thì `Stop-Process -Force`.
  - Khi build fail với MSB3027/MSB3021 → chạy ngay `node .github/harness/scripts/auto-learn.mjs log --error "MSB3027 ..." --file "N5Blazor/N5Blazor.csproj" --title "file lock"` để lưu context.
  - Thêm checklist vào `docs/knowleged.md` (KN-008) và cân nhắc script prebuild `taskkill /F /IM N5Blazor.exe 2>nul` nếu hay quên.
  - Dùng `auto-learn suggest "file lock MSB3027"` trước khi debug build — sẽ ra KN này.
- **Tags:** `build` `process` `dx` `dotnet`
- **Người ghi:** YUNIE / auto-learn

---

### KN-009 — Slot máy chủ AI không hoạt động (hardcode localhost dev tunnel trong app released)

- **Ngày:** 2026-08-30
- **Bug report:** _(chưa có `.agent/bugs/<slug>/bug.md` — ghi trực tiếp vào Bảng tóm tắt, cần bổ sung qua `auto-learn log`)_
- **Severity:** critical
- **Triệu chứng:** App deploy ra môi trường thật vẫn gọi `localhost:5050` — slot máy chủ AI không hoạt động. Dev chạy server local thì "chạy tốt" → bug chỉ lộ khi rời máy dev.
- **Nguyên nhân gốc:** Hardcode URL tunnel dev (`http://localhost:5050` / tunnel) vào `appsettings.json` + `Program.cs`. Build-time config gắn vào binary → publish sang máy khác là sai value vĩnh viễn.
- **Cách sửa:** Bỏ tunnel URL khỏi repo. Server URL là **runtime config**: env `AI_SERVER_URL` / user-secrets (`dotnet user-secrets set AI_SERVER_URL http://localhost:5050`); `Program.cs` chỉ đọc config, không chứa giá trị máy dev.
- **Cách phòng tránh:**
  - 3 tầng config: `appsettings.json` (default code, không secret) / `user-secrets` + env (máy dev) / Docker secret + CI (prod).
  - CI check cấm `localhost|http://` trong `appsettings*`.
  - Trước khi deploy, test bằng **release build ở máy khác** — fresh eyes (KN-005).
- **Tags:** `config` `api` `build` `dx`
- **Người ghi:** YUNIE / harness
