---
name: harness-build-config
description: "Task-agnostic lessons 'Build & Config' chưng cất từ docs/knowleged.md (7 KN: KN-008, KN-009, KN-015, KN-041, KN-063, KN-074, KN-076) + .agent/bugs/. Use when task chạm build, process, dx, dotnet, config, api, deploy, ci, workflow, pages — áp Cách phòng tránh trước khi code, tránh lặp bug cũ. DisCo-lite, regenerate bằng distill-agnostic.mjs."
user-invocable: false
---

# Harness Build & Config — Bài học task-agnostic (DisCo-lite)

> Chưng cất từ `docs/knowleged.md` + `.agent/bugs/` — **KHÔNG sửa tay**, regenerate bằng `node .github/harness/scripts/distill-agnostic.mjs`. Nguồn: DisCo arXiv:2609.02749v1 §3.2 (task-agnostic).

## When to Use

- Task chạm theme **Build & Config** (tags: build, process, dx, dotnet, config, api, deploy, ci, workflow, pages, data, network, i18n, architecture, failover, verify, verification, windows, gate)
- Trước khi code/fix — áp **Cách phòng tránh** ngay để không lặp bug cũ
- Review/plan — check anti-patterns bên dưới

## Bài học (7 KN)

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
- **Bug report:** .agent/bugs/2026-08-30-ai-server-slot-hardcode-tunnel/bug.md
- **Cách phòng tránh:**
  - 3 tầng config: `appsettings.json` (default code, không secret) / `user-secrets` + env (máy dev) / Docker secret + CI (prod).
  - CI check cấm `localhost|http://` trong `appsettings*` — **chưa wire** (feature đã gỡ; thêm lại khi AI-slot tái lập).
  - Trước khi deploy, test bằng **release build ở máy khác** — fresh eyes (KN-005).

### KN-015 — GitHub Pages deploy fail — 2 workflows cùng `github-pages` env + eval-gate Node 18 CJS (major)
- **Bài học:** Chỉ 1 workflow deploy Pages; workflow data chỉ commit; `eval-gate` check ESM `.js` qua temp `.mjs`
- **Bug report:** .agent/bugs/2026-09-04-pages-deploy-conflict-2-workflows/bug.md
- **Cách phòng tránh:**
  - 1 repo = 1 deployer cho `github-pages` env — workflow data chỉ `contents: write`, không `pages`/`id-token`, không `environment: github-pages`.
  - `eval-gate` ESM `.js` → temp `.mjs` trước `node --check` để robust Node 18/22.
  - Khi thêm workflow mới đụng `www/`, check `grep -r "github-pages" .github/workflows/` trước khi merge.

### KN-041 — YT Summary: mọi lane trích transcript no-key bị chặn + dịch vi fail hàng loạt (major)
- **Bài học:** 3 lane: browser paste .vtt (guaranteed) + CLI yt-dlp cookies.txt + CI best-effort (secret `YT_COOKIES`); translator chain gtx→clients5→mymemory với breaker **theo host** + parser đa hình (walk đệ quy) + fail-fast quota; sponsor-region detection (marker→return, cap 90s); UI ghi rõ provider + partial
- **Bug report:** .agent/bugs/2026-09-12-yt-summary-youtube-block-va-dich-no-key/bug.md
- **Cách phòng tránh:**
  - **Probe trước khi thiết kế** — mọi giả định network phải có log đo trong `.agent/plans/<task>/verify/` (không đoán — KN-023).
  - Circuit breaker **luôn key theo host**; parser API ngoài phải đa hình (nhiều shape) và phân biệt "empty response" vs "parse mismatch".
  - API free: ghi rõ quota/ngày + cách detect hết quota (fail-fast, ghi thời gian reset) — đừng retry mù.
  - Luôn có 1 lane **không phụ thuộc bên thứ ba** (file input) cho mọi pipeline cần network.
  - Ghi danh sách lane **đã đo chết** (Invidious/Piped/youtube-transcript-api/cookies-DPAPI) để không thử lại tốn thời gian.

### KN-063 — Routing & Failover: select trước khi gọi · output đã commit = terminal · sticky > re-route mỗi turn — chuẩn hoá pattern + lưới cho chuỗi gtx→gtx2→mymemory (major)
- **Bài học:** Chuẩn hoá pattern: select trước khi gọi · output đã commit = terminal · sticky > re-route mỗi turn · breaker theo host · telemetry mọi attempt — + guard `tests/e2e/yt-summary-chain.spec.ts` (invariant + negative control mutant)
- **Bug report:** .agent/bugs/2026-09-14-routing-failover-chuan-hoa-pattern-khoa-luoi/bug.md
- **Cách phòng tránh:**
  - Chain mới (nhiều provider/model): ≥3 điều kiện — thứ tự failover rõ ràng; breaker/lọc trạng thái theo **đơn vị lỗi** (host/provider — không global); fallback cuối giữ dữ liệu gốc (chain không được crash pipeline).
  - **Output đã commit = terminal:** chỉ reselect TRƯỚC khi commit (stream đã chảy ra caller thì hết cứu — "no mid-stream recovery"); mid-stream recovery cần thiết kế khác (buffer/checkpoint) — đừng giả định failover cứu.
  - **Sticky > re-route mỗi turn:** phiên dài chốt route 1 lần/session; re-route mỗi turn mất prompt cache + reasoning/continuation state bị strand giữa provider; pin chỉ sau khi response thành công (fail turn 1 không dính session).
  - **Route bằng đo, không bằng vibe:** log mọi attempt kể cả success (Duration/TimeToFirstUpdate) — dùng cho circuit-break/ranking (KN-019; mirror audit.jsonl).
  - **Fail-fast > hammer:** provider đã biết chết (breaker open / quota hết) → short-circuit, đừng gọi tiếp (KN-041 `memoQuotaTripped` là ví dụ).
  - **Lưới cho CLI không import được:** static invariant + negative control mutant; behavioral test để lại khi tách module (nợ ghi rõ — KN-060).

### KN-074 — Gate im lặng = gate chết: eval-gate fail-silent trên Windows (isMain backslash) + verifier đọc Status sai format template (2026-09-22) (major)
- **Bài học:** Fix class: `split(/[\\/]/)` cho 10 script + checkMcp cross-platform (bỏ printf/grep — cmd.exe không có) + regex `Status:\*{0,2}\s*` giữ wrapper khi replace; guard: spec “gate PHẢI in output” + class-grep `.split('/')` + test Status bold/backtick
- **Bug report:** .agent/bugs/2026-09-22-eval-gate-fail-silent-tren-windows-ismain-backslas/bug.md
- **Cách phòng tránh:**
  - Gate/script CLI: exit 0 **không đủ** — phải có bằng chứng đã chạy (in report/round-trip marker) + lưới test “phải in output”; cấm pattern `catch {}`/`stdio:'ignore'` nuốt output mà không assert.
  - `isMain` trong mọi script Node: dùng `split(/[\\/]/)` (Windows-safe) — grep class trước khi đóng bug, không chỉ vá file đang chạm.
  - Verifier đọc trạng thái/format: regex phải test với **chính format template sinh ra** (write path = read path); mọi cặp write/read format cần 1 test khoá 2 chiều.
  - Bug stub auto-log treo (không nội dung) phải được đóng/xử lý — drafts treo làm `health=warn` mờ nghĩa (từ 19/09 → 22/09 không ai truy ra regex).
  - Chạy `node .github/harness/scripts/auto-learn.mjs suggest "gate fail-silent isMain status regex"` trước khi code tương tự.

### KN-076 — Feed ai-news lọt tin lớn do recency-only ranking + nguồn phụ thuộc keyword (major)
- **Bài học:** Feed ranking theo thời gian phải có nguồn top-by-points độc lập keyword + cap slot theo bucket ngày; tin lớn phải sống sót qua “lũ” tin mới
- **Bug report:** .agent/bugs/2026-09-24-ai-news-lot-tin-lon-do-recency-only-ranking/bug.md
- **Cách phòng tránh:**
  - Mọi feed/ranking theo thời gian phải hỏi: “ngày cao điểm có đè hết slot không?” → cap theo bucket (ngày/nguồn) hoặc trộn nguồn trước khi cắt top-N.
  - Nguồn tin phải có ≥1 kênh **không phụ thuộc keyword** (top-by-points / top-trending) — keyword query là điều kiện đủ để bỏ lỡ tin lớn nhất.
  - Feed/UI render từ dữ liệu chọn sẵn (top-N) — nhãn hiển thị (`sources[]`) phải ngắn (chip không wrap vỡ 375px: bug cùng ngày `2026-09-24-chip-sources-dai-lam-tran-375px`).

## Anti-patterns (đừng lặp lại)

- - ❌ Gate/script tự nhận pass mà không chứng minh ĐÃ CHẠY — isMain sai platform (argv[1] backslash Windows) → exit 0 không output, verifier đọc exit code → “PASS” rỗng nhiều tháng; verifier đọc trạng thái bằng regex giả định format khác template thật (`Status:` vs `**Status:**`) → isFixed/isOpen luôn false. Gate phải fail-loud + lưới “phải in output”; `isMain` dùng `split(/[\\/]/)`; regex test với chính format template sinh ra (KN-074 + KN-069 + KN-015 + KN-047).
- - ❌ Xây chain failover trong lúc chữa cháy rồi để nguyên dạng implementation detail — không externalize invariants + không lưới = fault-tolerance mất âm thầm qua refactor, suite vẫn xanh (KN-063 + KN-056).
- - ❌ Re-route model/provider mỗi turn trong phiên multi-turn — mất prompt cache + reasoning/continuation state bị strand giữa provider; chốt route 1 lần (sticky) + pin sau response thành công (KN-063).
- - ❌ Giả định failover cứu được mid-stream — output đã commit = terminal; mid-stream recovery cần thiết kế khác (buffer/checkpoint) (KN-063).
- - ❌ Breaker/lọc trạng thái global cho nhiều host/provider — một provider chết kéo sập cả chain; key theo đơn vị lỗi (host/provider) (KN-063 + KN-041).

## Nguồn

- `docs/knowleged.md` — KN-008, KN-009, KN-015, KN-041, KN-063, KN-074, KN-076
- Chi tiết đầy đủ: `references/evidence.md` (progressive disclosure)
- Regenerate: `node .github/harness/scripts/distill-agnostic.mjs`
