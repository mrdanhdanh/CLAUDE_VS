# Evidence — harness-build-config (DisCo arXiv:2609.02749v1 §3.2 (task-agnostic))

> Substrate layer của skill — full text từ docs/knowleged.md. Sinh tự động 2026-09-26T10:56:29.812Z.

## Bug reports liên quan (7/68 bugs)

- `.agent/bugs/2026-08-30-ai-server-slot-hardcode-tunnel/bug.md` — Bug: Slot máy chủ AI không hoạt động — hardcode localhost dev tunnel trong app released
- `.agent/bugs/2026-08-30-dotnet-build-fail-do-file-lock-n5blazor-exe-ang-ch/bug.md` — Bug: dotnet build fail do file lock N5Blazor.exe đang chạy
- `.agent/bugs/2026-09-04-pages-deploy-conflict-2-workflows/bug.md` — Bug: pages deploy conflict 2 workflows
- `.agent/bugs/2026-09-12-yt-summary-youtube-block-va-dich-no-key/bug.md` — Bug: YT Summary — mọi lane trích transcript no-key bị chặn + dịch vi fail hàng loạt
- `.agent/bugs/2026-09-14-routing-failover-chuan-hoa-pattern-khoa-luoi/bug.md` — Bug: Routing & Failover cho chain model/provider — chuẩn hoá pattern + khoá lưới chuỗi gtx→gtx2→mymemory
- `.agent/bugs/2026-09-22-eval-gate-fail-silent-tren-windows-ismain-backslas/bug.md` — Bug: eval-gate fail-silent tren Windows (isMain backslash)
- `.agent/bugs/2026-09-24-ai-news-lot-tin-lon-do-recency-only-ranking/bug.md` — Bug: ai-news lọt tin lớn do recency-only ranking

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
- **Cách sửa:** Bỏ tunnel URL khỏi repo. Server URL là **runtime config**: env `AI_SERVER_URL` / user-secrets (`dotnet user-secrets set AI_SERVER_URL http://localhost:5050`); `Program.cs` chỉ đọc config, không chứa giá trị máy dev. **Cập nhật 2026-09-18 (review):** code hiện tại `N5Blazor/` sạch (`AI_SERVER_URL`/`localhost:5050` grep = 0) — feature AI-slot đã gỡ; lesson config-vs-build-time vẫn sống.
- **Cách phòng tránh:**
  - 3 tầng config: `appsettings.json` (default code, không secret) / `user-secrets` + env (máy dev) / Docker secret + CI (prod).
  - CI check cấm `localhost|http://` trong `appsettings*` — **chưa wire** (feature đã gỡ; thêm lại khi AI-slot tái lập).
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
- **Guard (review 2026-09-18):** `tests/e2e/workflows-guard.spec.ts` — đếm deployer `deploy-pages` = đúng 1 (pages.yml; chống tái diễn 2 workflow cùng env `github-pages`).
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

---

### KN-063 — Routing & Failover: select trước khi gọi · output đã commit = terminal · sticky > re-route mỗi turn — chuẩn hoá pattern + lưới cho chuỗi gtx→gtx2→mymemory

- **Ngày:** 2026-09-14
- **Bug report:** `.agent/bugs/2026-09-14-routing-failover-chuan-hoa-pattern-khoa-luoi/bug.md`
- **Severity:** major
- **Guard:** `tests/e2e/yt-summary-chain.spec.ts` — 7 invariant khoá chuỗi gtx→gtx2→mymemory + negative control (mutant source phải FAIL)
- **Triệu chứng:** (knowledge-gap) grep `docs/knowleged.md` = 0 match cho `failover|routing|RoutingChat|multi-model`; chuỗi failover thật (gtx→gtx2→mymemory + breaker theo host, sinh từ KN-041) không có test chain-level — đảo thứ tự chain / xoá breaker-per-host / bỏ fallback / bỏ timeout đều không làm suite đỏ.
- **Nguyên nhân gốc (5 Whys):** Chain xây trong lúc chữa cháy incident (Why1) → invariants không được externalize, không ai đọc được "phải giữ gì" (Why2) → không lưới = fault-tolerance mất âm thầm qua refactor — "suite xanh, tính năng chết" (Why3) → vocabulary chuẩn của SDK chính chủ (MEAI 10.9) chưa adopt — chain tương lai lại tự phát minh lại (Why4) → Root: tri thức vận hành không được externalize + không khoá bằng lưới máy (Why5).
- **Cách sửa:** (1) chuẩn hoá pattern thành KN-063 (vocabulary + adopt-list); (2) `tests/e2e/yt-summary-chain.spec.ts` — static invariant theo precedent readme-guard/hooks-integrity (CLI không import được, `main()` chạy lúc import — KN-014) + negative control bằng mutant source (test chính phép đo — KN-049/058); (3) tag `KN-063` vào curated.json.
- **Cách phòng tránh:**
  - Chain mới (nhiều provider/model): ≥3 điều kiện — thứ tự failover rõ ràng; breaker/lọc trạng thái theo **đơn vị lỗi** (host/provider — không global); fallback cuối giữ dữ liệu gốc (chain không được crash pipeline).
  - **Output đã commit = terminal:** chỉ reselect TRƯỚC khi commit (stream đã chảy ra caller thì hết cứu — "no mid-stream recovery"); mid-stream recovery cần thiết kế khác (buffer/checkpoint) — đừng giả định failover cứu.
  - **Sticky > re-route mỗi turn:** phiên dài chốt route 1 lần/session; re-route mỗi turn mất prompt cache + reasoning/continuation state bị strand giữa provider; pin chỉ sau khi response thành công (fail turn 1 không dính session).
  - **Route bằng đo, không bằng vibe:** log mọi attempt kể cả success (Duration/TimeToFirstUpdate) — dùng cho circuit-break/ranking (KN-019; mirror audit.jsonl).
  - **Fail-fast > hammer:** provider đã biết chết (breaker open / quota hết) → short-circuit, đừng gọi tiếp (KN-041 `memoQuotaTripped` là ví dụ).
  - **Lưới cho CLI không import được:** static invariant + negative control mutant; behavioral test để lại khi tách module (nợ ghi rõ — KN-060).
- **Tags:** `process` `api` `architecture` `failover` `verify`
- **Nguồn (ngoài model — KN-023):** "Routing and Failover for Microsoft.Extensions.AI" — .NET Blog 12/08/2026, Joshua Yue (MEAI 10.9: RoutingChatClient · SemanticRoutingChatClient · FailoverChatClient · OrderedFailoverChatClient — đều `[Experimental]` MEAI001; 2 limitation tự thừa nhận: no cascading/ensemble/hedging + telemetry-vs-retry tách chưa sạch) · mirror `www/ai-news/curated.json`
- **Người ghi:** YUNIE / article-lesson (RADAR nghi KN-041 score 228 — liên quan, **không tái lập**: KN-041 fix incident, KN-063 (re-ID 061→062→063 — double-yield concurrent: Memora giữ KN-062) chuẩn hoá pattern + nâng lưới chain-level; bug draft qua `log` → `propose` guard gate PASS → hand-craft)

---

### KN-074 — Gate im lặng = gate chết: eval-gate fail-silent trên Windows (isMain backslash) + verifier đọc Status sai format template (2026-09-22)

- **Ngày:** 2026-09-22
- **Bug report:** `.agent/bugs/2026-09-22-eval-gate-fail-silent-tren-windows-ismain-backslas/bug.md` + `.agent/bugs/2026-09-19-evaluate-isfixed-khong-doc-duoc-status-bold/bug.md` (2 bug, cùng lớp “verifier ngầm không đáng tin”: một cái KHÔNG CHẠY, một cái CHẠY nhưng ĐỌC SAI)
- **Severity:** major
- **Guard:** `tests/e2e/eval-gate-components.spec.ts` — test “components: registry pass + gate PHẢI in output (chống no-op im lặng)” + class-guard “không script harness nào còn `process.argv[1].split('/')`”; `tests/e2e/auto-learn-guard.spec.ts` — test “evaluate: đọc Status bold + backtick (`**Status:** \`fixed\`/\`open\`)”. Vì sao lưới cũ không bắt: chưa test nào assert “gate đã in output”; chưa test nào khoá cặp write(template bold)/read(regex).
- **Layer:** code — isMain detection + regex đọc trạng thái; không phải spec/env.
- **Liên quan:** KN-069 (cùng lớp “gate fail-open” — khác cơ chế: platform path separator + format mismatch, không phải arg validation) · KN-015 (gate robustness Node 18/22) · KN-047 (exit condition phải là command, không phải vibe) · KN-012 (verifier integrity).
- **Triệu chứng:** (1) Windows/pwsh 7: `node eval-gate.mjs --scope components` → **không output nào** + `$LASTEXITCODE=0`; `generate-status` (stdio:'ignore') đọc exit 0 → ghi `eval-gate: PASS` — gate “xanh” trong khi **không chạy check nào** nhiều tháng (chỉ Linux CI chạy thật). Probe: `argv[1] = "D:\\CLAUDE_VS\\…"`, `split('/').pop()` = full path → `isMain=false`. (2) `evaluate --bug <fixture>` với `- **Status:** \`fixed\`` → `checks.isFixed=false` **và** `isOpen=false`; `markBugFixed` no-op âm thầm với file bold.
- **Nguyên nhân gốc (5 Whys):**
  - Why1: Gate không chạy? `isMain` false vì `split('/')` không cắt được backslash của `argv[1]` trên Windows.
  - Why2: Verifier khác (generate-status) vẫn báo PASS? Nó chỉ đọc exit code — **exit condition cho phép “im lặng = pass”** (không đòi bằng chứng đã chạy).
  - Why3: Vì sao nhiều tháng không ai thấy? CI Linux xanh (argv[1] dùng `/`); local Windows ít chạy; `stdio:'ignore'` nuốt output rỗng; `parseInt`-style bug KN-069 cùng họ.
  - Why4: Vì sao lặp pattern ở 10 file? Đợt vá 10/09 (KN-059) chỉ vá 5 file **đang chạm** — không truy quét cùng class (grep `argv[1].split` giờ thấy 15 file).
  - Why5 (Root): **Gate thiếu lưới “phải chứng minh nó ĐÃ CHẠY”** (fail-loud, round-trip evidence) + **verifier regex không được test với chính format template sinh ra** (write path ≠ read path) — verifier tin ngầm vào 2 giả định không được kiểm: “đã chạy” và “format như mình nghĩ”.
- **Cách sửa:** (1) `isMain` Windows-safe `split(/[\\/]/)` cho **cả class** 10 script (agent-card, deploy-check, eval-gate, handoff, local, memory, reflect, setup-doctor, trace, workflow); (2) `checkMcp` cross-platform — `execSync('node www/library/mcp-server.mjs', { input: payload })` thay pipe `printf`/`grep` (cmd.exe không có) vì sau fix `--scope all` sẽ thật sự chạy trên Windows; (3) `checkBugReadiness`/`markBugFixed` regex `Status:\*{0,2}\s*` + giữ wrapper khi replace; (4) lưới: spec “gate phải in output” + class-grep + test Status bold. Đo sau fix: `--scope all` 13/13 checks chạy thật · auto-learn-guard 12/12 pass · health drafts 0 → `ok`.
- **Cách phòng tránh:**
  - Gate/script CLI: exit 0 **không đủ** — phải có bằng chứng đã chạy (in report/round-trip marker) + lưới test “phải in output”; cấm pattern `catch {}`/`stdio:'ignore'` nuốt output mà không assert.
  - `isMain` trong mọi script Node: dùng `split(/[\\/]/)` (Windows-safe) — grep class trước khi đóng bug, không chỉ vá file đang chạm.
  - Verifier đọc trạng thái/format: regex phải test với **chính format template sinh ra** (write path = read path); mọi cặp write/read format cần 1 test khoá 2 chiều.
  - Bug stub auto-log treo (không nội dung) phải được đóng/xử lý — drafts treo làm `health=warn` mờ nghĩa (từ 19/09 → 22/09 không ai truy ra regex).
  - Chạy `node .github/harness/scripts/auto-learn.mjs suggest "gate fail-silent isMain status regex"` trước khi code tương tự.
- **Tags:** `build` `process` `verification` `windows` `gate`
- **Người ghi:** YUNIE / /fixbug + dogfood (phát hiện khi build mechanism 2.5 — component-evals + grounding fact-grader; human duyệt paste 23/09; guard gate PASS 2 spec; RADAR nghi KN-069/015/037 — adjudicated không trùng, cơ chế khác + cross-link)

---

### KN-076 — Feed ai-news lọt tin lớn do recency-only ranking + nguồn phụ thuộc keyword

- **Ngày:** 2026-09-24
- **Bug report:** `.agent/bugs/2026-09-24-ai-news-lot-tin-lon-do-recency-only-ranking/bug.md`
- **Severity:** major
- **Guard:** `tests/e2e/ai-news-feed-ranking.spec.ts` (cap 5 tin/ngày + sourceUrl hợp lệ)
- **Layer:** code (logic chọn tin trong `www/ai-news/fetch.mjs`)
- **Triệu chứng:** feed công khai mất story **718 điểm / 724 comments** (“Claude discovers a novel enzyme system”, top HN 23–24/09) — không throw, không test đỏ, chỉ lộ khi tra tay HN Algolia.
- **Nguyên nhân gốc:** Feed thiếu (a) nguồn **top-by-points độc lập với keyword** — title “Claude discovers…” không chứa chữ “AI” nên query theo từ khóa không bao giờ bắt; và (b) cơ chế chống **“một ngày lũ tin đè hết slot”** — sort date-desc thuần để ~18 tin 09-24 (2–4 điểm) chiếm hết 15 slot, tin lớn ngày 09-23 bị đẩy ra ngoài.
- **Cách sửa:** Thêm `fetchHNTop` (HN Algolia `points>150` + lọc AI-relevance bằng regex word-boundary, không phụ thuộc title) trong `fetch.mjs`; chọn 15 slot bằng **cap 5 tin/ngày** trên danh sách đã sort (trong ngày: hot → score) → mọi ngày đều có đại diện, tin lớn ngày cũ không bị lũ tin mới đè.
- **Cách phòng tránh:**
  - Mọi feed/ranking theo thời gian phải hỏi: “ngày cao điểm có đè hết slot không?” → cap theo bucket (ngày/nguồn) hoặc trộn nguồn trước khi cắt top-N.
  - Nguồn tin phải có ≥1 kênh **không phụ thuộc keyword** (top-by-points / top-trending) — keyword query là điều kiện đủ để bỏ lỡ tin lớn nhất.
  - Feed/UI render từ dữ liệu chọn sẵn (top-N) — nhãn hiển thị (`sources[]`) phải ngắn (chip không wrap vỡ 375px: bug cùng ngày `2026-09-24-chip-sources-dai-lam-tran-375px`).
- **Tags:** `data` `api` `verification`
- **Người ghi:** YUNIE / /fixbug + reef-lite commit (user duyệt 24/09; evaluate PASS — advisory trùng KN-063 33.7 đã adjudicate: khác class routing/failover vs feed-ranking)
