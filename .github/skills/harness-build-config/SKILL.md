---
name: harness-build-config
description: "Task-agnostic lessons 'Build & Config' chưng cất từ docs/knowleged.md (2 KN: KN-008, KN-009) + .agent/bugs/. Use when task chạm build, process, dx, dotnet, config, api — áp Cách phòng tránh trước khi code, tránh lặp bug cũ. DisCo-lite, regenerate bằng distill-agnostic.mjs."
user-invocable: false
---

# Harness Build & Config — Bài học task-agnostic (DisCo-lite)

> Chưng cất từ `docs/knowleged.md` + `.agent/bugs/` — **KHÔNG sửa tay**, regenerate bằng `node .github/harness/scripts/distill-agnostic.mjs`. Nguồn: DisCo arXiv:2609.02749v1 §3.2 (task-agnostic).

## When to Use

- Task chạm theme **Build & Config** (tags: build, process, dx, dotnet, config, api)
- Trước khi code/fix — áp **Cách phòng tránh** ngay để không lặp bug cũ
- Review/plan — check anti-patterns bên dưới

## Bài học (2 KN)

### KN-008 — dotnet build fail MSB3027/MSB3021 do file lock — N5Blazor.exe đang chạy (major)
- **Bài học:** Trước khi build/test luôn tắt dotnet run đang giữ file — nếu gặp MSB3027 thì Stop-Process PID trên 5251 rồi build lại
- **Bug report:** .agent/bugs/2026-08-30-dotnet-build-fail-do-file-lock-n5blazor-exe-ang-ch/bug.md
- **Cách phòng tránh:**
  - Trước khi `dotnet build/test`: kiểm tra `Get-Process N5Blazor` hoặc `netstat -ano | findstr 5251` — nếu còn thì `Stop-Process -Force`.
  - Khi build fail với MSB3027/MSB3021 → chạy ngay `node .github/harness/scripts/auto-learn.mjs log --error "MSB3027 ..." --file "N5Blazor/N5Blazor.csproj" --title "file lock"` để lưu context.
  - Thêm checklist vào `docs/knowleged.md` (KN-008) và cân nhắc script prebuild `taskkill /F /IM N5Blazor.exe 2>nul` nếu hay quên.
  - Dùng `auto-learn suggest "file lock MSB3027"` trước khi debug build — sẽ ra KN này.

### KN-009 — Slot máy chủ AI không hoạt động (hardcode localhost dev tunnel trong app released) (critical)
- **Bài học:** Bỏ tunnel URL khỏi repo, server URL là runtime config: env `AI_SERVER_URL` / user-secrets
- **Bug report:** .agent/bugs/<slug>/bug.md
- **Cách phòng tránh:**
  - 3 tầng config: `appsettings.json` (default code, không secret) / `user-secrets` + env (máy dev) / Docker secret + CI (prod).
  - CI check cấm `localhost|http://` trong `appsettings*`.
  - Trước khi deploy, test bằng **release build ở máy khác** — fresh eyes (KN-005).

## Anti-patterns (đừng lặp lại)

- - ❌ Để `dotnet run` chạy rồi `dotnet build` ngay — file lock MSB3027/MSB3021, tốn 17s retry vô ích (KN-008).
- - ❌ Gặp MSB3027/MSB3021 mà tưởng lỗi code — không check `Get-Process` / `netstat 5251` (KN-008).
- - ❌ Build fail mà không `log` ngay — mất context PID/port (KN-008).

## Nguồn

- `docs/knowleged.md` — KN-008, KN-009
- Chi tiết đầy đủ: `references/evidence.md` (progressive disclosure)
- Regenerate: `node .github/harness/scripts/distill-agnostic.mjs`
