# Evidence — harness-build-config (DisCo arXiv:2609.02749v1 §3.2 (task-agnostic))

> Substrate layer của skill — full text từ docs/knowleged.md. Sinh tự động 2026-09-12T13:11:12.564Z.

## Bug reports liên quan (4/29 bugs)

- `.agent/bugs/2026-08-30-ai-server-slot-hardcode-tunnel/bug.md` — Bug: Slot máy chủ AI không hoạt động — hardcode localhost dev tunnel trong app released
- `.agent/bugs/2026-08-30-dotnet-build-fail-do-file-lock-n5blazor-exe-ang-ch/bug.md` — Bug: dotnet build fail do file lock N5Blazor.exe đang chạy
- `.agent/bugs/2026-09-04-pages-deploy-conflict-2-workflows/bug.md` — Bug: pages deploy conflict 2 workflows
- `.agent/bugs/2026-09-12-yt-summary-youtube-block-va-dich-no-key/bug.md` — Bug: YT Summary — mọi lane trích transcript no-key bị chặn + dịch vi fail hàng loạt

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
- **Bug report:** `.agent/bugs/2026-08-30-ai-server-slot-hardcode-tunnel/bug.md` (retrofit 2026-09-12 — bổ sung record còn thiếu)
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

---

### KN-015 — GitHub Pages deploy fail — 2 workflows cùng `github-pages` env + eval-gate Node 18 CJS

- **Ngày:** 2026-09-04
- **Bug report:** `.agent/bugs/2026-09-04-pages-deploy-conflict-2-workflows/bug.md`
- **Severity:** major
- **Triệu chứng:** (1) Push `www/**` trigger `pages.yml` deploy, đồng thời `ai-news.yml` cũng deploy `www/` với `environment: github-pages` → GitHub Pages chỉ cho 1 deployment → job thứ 2 cancel/fail. (2) Trên CI Node 18, `eval-gate --scope www/library` báo `❌ syntax: failed: www/library/app.js` dù local Node 22 PASS.
- **Nguyên nhân gốc (5 Whys):**
  - Why1: Deploy fail → vì 2 workflow cùng giành `github-pages` env + `deploy-pages@v4`.
  - Why2: Cùng giành → vì `ai-news.yml` copy 3 bước deploy từ `pages.yml` dù chỉ cần commit `ai-news.json`.
  - Why3: Copy deploy → vì muốn ai-news tự deploy sau commit, không nghĩ tới concurrency.
  - Why4: Eval FAIL chỉ trên CI → vì `node --check` trên Node 18 coi `.js` là CJS, gặp `import` là lỗi; Node 20+ tự nhận ESM nên pass.
  - Why5 (Root): Thiếu quy tắc: (a) chỉ 1 workflow được `deploy-pages` với `github-pages` env; (b) `eval-gate` phải robust qua Node version — ESM `.js` phải check qua temp `.mjs`.
- **Cách sửa:** (1) `ai-news.yml`: bỏ `pages: write`/`id-token: write`, bỏ `environment: github-pages`, bỏ 3 steps `Setup Pages`/`Upload artifact`/`Deploy`, chỉ `git push` và log `pages.yml will deploy`. (2) `eval-gate.mjs` `checkSyntax`: detect ESM `.js` (`/^\s*(import|export)\s/m`) thì copy sang temp `.mjs` rồi `node --check` temp, xóa temp sau. Kết quả: `eval-gate` PASS trên cả Node 18 và 22, Pages chỉ 1 deployer.
- **Cách phòng tránh:**
  - 1 repo = 1 deployer cho `github-pages` env — workflow data chỉ `contents: write`, không `pages`/`id-token`, không `environment: github-pages`.
  - `eval-gate` ESM `.js` → temp `.mjs` trước `node --check` để robust Node 18/22.
  - Khi thêm workflow mới đụng `www/`, check `grep -r "github-pages" .github/workflows/` trước khi merge.
- **Tags:** `build` `deploy` `ci` `workflow` `pages`
- **Người ghi:** YUNIE / fixbug

---

### KN-041 — YT Summary: mọi lane trích transcript no-key bị chặn + dịch vi fail hàng loạt

- **Ngày:** 2026-09-12
- **Bug report:** `.agent/bugs/2026-09-12-yt-summary-youtube-block-va-dich-no-key/bug.md`
- **Severity:** major
- **Triệu chứng:** Build không lấy được phụ đề qua bất kỳ lane server-side nào; khi build bằng file .vtt thì dịch fail 20/35 chunks và chạy chậm bất thường (gtx retry 14.5s/chunk).
- **Nguyên nhân gốc (5 Whys):**
  - Why1: YouTube chặn mọi request server-side không cookie từ IP này: watch-page **429**, yt-dlp **"Sign in to confirm you're not a bot"**, youtube-transcript-api **IpBlocked** (chính lib cảnh báo IP cloud).
  - Why2: Relay công khai đã chết: Invidious **0/6 sống**, Piped **403** — hướng "public instance miễn phí" không còn đáng tin (2026).
  - Why3: Translator no-key có giới hạn thật: gtx **throttle theo IP** + **không CORS**; MyMemory **quota ~5.000 ký tự/ngày/IP** (hết sau ~2 video, reset ~5h); cookies browser: Edge **DB locked** (browser đang mở), Chrome **DPAPI/ABE** (cần cookies.txt export).
  - Why4: clients5 (`clients5.google.com`) **vẫn sống** nhưng response shape khác gtx — `[["text","en"]]` (cặp string, không phải nested pairs) → parser cũ trả `''` → bị coi "empty response" → **trip circuit breaker dùng chung** cho cả 2 host → các chunk sau bỏ luôn clients5 dù nó sống.
  - Why5 (Root): Thiết kế dựa trên giả định "scrape/dịch free dễ" — **không đo trước**, không tách breaker theo host, không có lane guaranteed độc lập network.
- **Cách sửa:** Kiến trúc 3 lane — (1) **browser paste .vtt** xử lý tại chỗ + dịch MyMemory (CORS ✓) = guaranteed; (2) **CLI yt-dlp** + cookies.txt/cookies browser; (3) **CI best-effort** + secret `YT_COOKIES`. Translator chain `gtx → clients5 → mymemory`, breaker **theo host** (2→15 phút), parser đa hình (walk đệ quy), chunk 900 ký tự, fail-fast khi MyMemory hết quota (parse `responseDetails`). Cleaning thêm **sponsor-region detection** (marker → return marker, cap 90s). UI/help nói thật bằng chứng + chip provider + cảnh báo partial.
- **Cách phòng tránh:**
  - **Probe trước khi thiết kế** — mọi giả định network phải có log đo trong `.agent/plans/<task>/verify/` (không đoán — KN-023).
  - Circuit breaker **luôn key theo host**; parser API ngoài phải đa hình (nhiều shape) và phân biệt "empty response" vs "parse mismatch".
  - API free: ghi rõ quota/ngày + cách detect hết quota (fail-fast, ghi thời gian reset) — đừng retry mù.
  - Luôn có 1 lane **không phụ thuộc bên thứ ba** (file input) cho mọi pipeline cần network.
  - Ghi danh sách lane **đã đo chết** (Invidious/Piped/youtube-transcript-api/cookies-DPAPI) để không thử lại tốn thời gian.
- **Tags:** `api` `data` `ci` `network` `i18n`
- **Người ghi:** YUNIE / /harness
