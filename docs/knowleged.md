# Knowledge — Bài học từ Bug (BẮT BUỘC ĐỌC)

> ⚠️ **QUY TẮC HARNESS:** Mọi agent / prompt / task — dù là `/harness`, `/fixbug`, `/implement`, `/plan`, `/polish`, `/verify` hay edit tay — **PHẢI đọc file này TRƯỚC KHI làm bất kỳ việc gì**. Không đọc = không được code.
> File này là **bộ nhớ dài hạn** của dự án: mọi bug đã sửa phải rút ra 1 bài học và ghi vào đây.

## Cách dùng

1. **Trước khi code:** đọc toàn bộ file này (hoặc ít nhất bảng tóm tắt + các mục liên quan đến task hiện tại).
2. **Sau khi fix bug:** thêm 1 dòng vào **Bảng tóm tắt** + 1 mục chi tiết ở **Chi tiết bài học** + cập nhật `updatedAt`.
3. **Khi review / plan:** kiểm tra xem task mới có chạm vào pattern đã từng lỗi không — nếu có, áp dụng **Cách phòng tránh**.

## Quy ước ghi bài học

- `ID` dạng `KN-001`, tăng dần.
- `Severity`: `critical` | `major` | `minor`.
- `Tags`: `ui` `api` `state` `async` `css` `a11y` `perf` `build` `data` ...
- Mỗi bài học phải có: **Triệu chứng → Nguyên nhân gốc → Cách sửa → Cách phòng tránh**.

---

## Bảng tóm tắt (Summary)

| ID | Ngày | Bug | Nguyên nhân gốc | Bài học (1 câu) | Tags |
|----|------|-----|-----------------|-----------------|------|
| KN-001 | 2026-08-29 | *Ví dụ: Modal không đóng khi bấm ESC* | Thiếu listener `keydown` + focus trap | Mọi overlay/modal phải có ESC + focus trap + aria | `ui` `a11y` |
| KN-002 | 2026-08-29 | Trang STATUS www/ giao diện chưa hợp lý — registry sai, responsive vỡ, thiếu a11y | status.json array vs app.js object mismatch + không audit product-quality | Dashboard phải có single source of truth (registry.json → status.json) và polish responsive/a11y ngay từ đầu | `ui` `css` `a11y` `responsive` `data` |
| KN-003 | 2026-08-30 | Rainbow border GlassUI không xoay (animated) ở một số browser | Detect `@property` sai (`CSS.supports('syntax')`) + `::before` dùng `var(--rainbow)` lồng không re-resolve `--angle` + fallback per-element bị UI reset | Animate custom property: dùng gradient trực tiếp tại `::before`, detect `@property` bằng `CSS.registerProperty`, fallback class ở `<html>` | `ui` `css` `animation` |
| KN-004 | 2026-08-30 | `www/` grid-2 thừa khoảng cách + rainbow border index.html không xoay khi hover | `.grid-2` không có `margin` + `.section` con là grid item không collapse → margin kép 48px; `::before`/`::after` dùng `var(--rainbow)` lồng (lặp KN-003) → `--angle` không re-resolve | Wrapper `.grid-2` tự mang `margin:24px 0`, con `.section` đặt `margin:0`; animate `--angle` dùng `conic-gradient(from var(--angle), ...)` trực tiếp | `ui` `css` `animation` `spacing` |
| KN-005 | 2026-08-30 | Bug Blindness — dev không thấy bug do workaround vô thức + fan bias (Dan Luu) | Habitual mitigations (tự bù lỗi không nhận ra) + quality blindness + fan bias → dev nghĩ sản phẩm xịn dù user không dùng được | Chữa mù bug: fresh eyes, test như user mới, chỉ ra bug liên tục, không workaround vô thức, dogfooding có ý thức | `process` `quality` `ux` `perf` `a11y` |
| KN-006 | 2026-08-30 | N5 Blazor thieu theme sang, tieng Viet mat dau, menu chua polish, contrast chua test light | Chi co dark variables, khong co [data-theme="light"] + fix encoding xoa dau + NavMenu minimal | Design system phai co 2 theme tu dau (CSS variables + toggle persist + early init) va i18n giu UTF-8 chuan | `ui` `css` `a11y` `i18n` `theme` `contrast` |
| KN-007 | 2026-08-30 | Thiếu hệ thống tự học hỏi tự động — phải suggest/log/propose tay, dễ quên, lặp bug cũ | Không có script BM25-lite, không có instruction enforce, không có hooks reminder → dev quên check KN trước khi code, quên log khi lỗi, quên propose sau fix | Mỗi task phải auto suggest KN (BM25-lite + IDF), mỗi lỗi auto log draft, mỗi fix auto propose KN — không để trôi | `process` `knowledge` `automation` `dx` |
| KN-008 | 2026-08-30 | dotnet build fail MSB3027/MSB3021 do file lock — N5Blazor.exe đang chạy (dotnet run chưa tắt) | dotnet run giữ handle N5Blazor.exe (PID 28232, LISTENING 5251) → build không copy được apphost.exe → retry 10 lần (17s) rồi fail | Trước khi build/test luôn tắt dotnet run đang giữ file — nếu gặp MSB3027 thì Stop-Process PID trên 5251 rồi build lại | `build` `process` `dx` `dotnet` |
| KN-009 | 2026-08-30 | Slot máy chủ AI không hoạt động (hardcode localhost dev tunnel trong app released) | Hardcode URL tunnel dev (`http://localhost:5050`) vào `appsettings.json` + `Program.cs` → publish sang máy khác sai value | Bỏ tunnel URL khỏi repo, server URL là runtime config: env `AI_SERVER_URL` / user-secrets | `config` `api` `build` `dx` |
| KN-010 | 2026-08-31 | AAR pattern từ Anthropic — propose 3 methods, benchmark, keep best, $4/h vs $150/h human | Thiếu benchmark loop chặt chẽ — fix ngẫu hiên thay vì so sánh có hệ thống → không biến nào tốt nhất, reward hacking khi chỉ check WHETHER không check HOW | Áp dụng AAR pattern: propose 3 → implement → benchmark → keep best → log KN. 3-fix limit vẫn áp dụng. Check HOW not WHETHER | `process` `self-improving` `benchmark` `aar` `automation` |
| KN-011 | 2026-08-31 | Random làm disable nút ▶ Bước tiếp theo (Bài 004 & 005) | `hideAll()` disable `stepBtn` rồi `handleRandom()` không re-enable → user không thể step sau Random | Không disable stepBtn trong hàm reset chung — quản lý button state tập trung, re-enable sau Random | `ui` `state` `ux` `button` |
| KN-012 | 2026-09-03 | Agent tự sửa test để pass (reward hacking) — CI xanh giả | Governance v1 chỉ chặn shell/secret, không gate edit trên test paths + audit không có hash-chain → agent mutate verifier được | 3 lớp BTP-lite: deny-test-mutate (chỉ verify/takeover được sửa test) + deny SQL/destructive + audit hash-chain + verify | `process` `governance` `tdd` `safety` `reward-hacking` |
| KN-013 | 2026-09-03 | Tích hợp Ponytail ladder vào Harness — thiếu YAGNI gate, dead code sống sót, N5Blazor trial bị revert | Harness thiên mở rộng (8 phase, UI đẹp) nhưng không có ladder thu gọn; trial N5Blazor xóa GlassCard/RainbowCard/bootstrap + fix Kana toggle nhưng bị revert vì thiếu .NET 8 SDK để verify | Thêm instruction `minimal-ladder` (7 nấc + YAGNI + native-first + dead-code grep) + preset `lean-product` + bật ladder ở full/web-product/api-minimal; trial artifacts giữ ở `.agent/bugs/` + `.agent/plans/n5-blazor-ladder/` | `process` `minimal` `ponytail` `yagni` `dx` |
| KN-014 | 2026-09-04 | Smoke test treo vĩnh viễn khi import MCP stdio server + self-verify 1/4 checks + regex frontmatter không match | Import module có side-effect khởi động server stdio → chờ stdin vĩnh viễn; verify chạy trước khi record.json được ghi; regex `^` thiếu flag `m` | Cấm import module khởi động server trong smoke one-liner; self-verify chạy sau khi mọi file đã ghi; regex `^`/`$` multi-line luôn thêm flag `m` | `process` `dx` `mcp` `testing` `regex` |
| KN-015 | 2026-09-04 | GitHub Pages deploy fail — 2 workflows cùng `github-pages` env + eval-gate FAIL Node 18 do `node --check` CJS | `ai-news.yml` copy 3 bước deploy từ `pages.yml` → xung đột `github-pages` env; `node --check` trên Node 18 coi `.js` là CJS nên `import` fail | Chỉ 1 workflow deploy Pages; workflow data chỉ commit; `eval-gate` check ESM `.js` qua temp `.mjs` | `build` `deploy` `ci` `workflow` `pages` |
| KN-016 | 2026-09-06 | `harness-manager disable skill` fail EPERM trên Windows — rename folder bị chặn dù ACL đầy đủ | `fs.rename` folder bị process khác (VS Code file watcher) giữ handle → EPERM; PowerShell `Move-Item` cùng lúc lại OK | Wrap rename bằng `safeRename()`: thử `fs.rename`, bắt EPERM/EXDEV/EBUSY → fallback `fs.cp` + `fs.rm` | `process` `dx` `windows` `fs` |
| KN-017 | 2026-09-06 | Archify diagram fail `viewer/viewport-overflow` + `composition/desktop-readability` — viewBox gần vuông render tràn first-screen | Diagram panel ~930px @1440 → `scale = 930/viewBoxWidth`; viewBox 772×652 gần vuông → height×scale > 586px tràn dọc; width 1400 → scale 0.66 < 0.822 text < 6px | Chọn viewBox width trong sweet spot [1035, 1131] để đồng thời thỏa `scale ≥ 0.822` và `height×scale ≤ ~586px`; luôn chạy `visual-check` sau `deliver` | `ui` `diagram` `archify` `responsive` `verify` |
| KN-018 | 2026-09-07 | Waymo effect / Decollaboration — AI tiện quá khiến human ngừng nghĩ chung, diversity của ý tưởng thu hẹp | LLM bỏ friction của collaborator (không agenda, không tranh author order, available 2am) → decollaboration là lựa chọn hợp lý trong hệ thưởng velocity; outsource writing = skip thinking (Bjork desirable difficulties) | Dissent Review gate ở Clarify/Verify: mỗi PRD phải có 1 framing đối lập không prompt trước; trả lời "Who did you think with?"; human giữ pilot-in-command | `process` `collaboration` `diversity` `pilot-in-command` |
| KN-019 | 2026-09-08 | Perceived vs Measured Productivity — dev kỳ vọng AI nhanh hơn 24% nhưng đo được chậm hơn 19% (METR) mà vẫn tin là nhanh hơn | Productivity đánh bằng cảm nhận (vibes) không đo bằng evidence → gap giữa perceived và measured không bao giờ bị phát hiện | Mọi claim tốc độ/ROI phải đo bằng metrics (session logs, diff stat, token cost, rework count) — không nhận vibes | `process` `metrics` `benchmark` `evidence` |
| KN-020 | 2026-09-08 | Generate easy, trust hard — agent đẻ code nhanh nhưng không thể tin nếu không review kỹ | Model được reward để giải task, không để cho code đúng → output luôn cần verification; "AI loves overcomplicating things" | Mọi output agent phải qua review/benchmark gate (continuous benchmarking = foundation của self-evolving agents); radically simplify thay vì thêm phức tạp | `process` `verification` `review` `minimal` |
| KN-021 | 2026-09-08 | Governance rule-based cứng không scale — agent tìm lỗ để né rule, block-everything chặn cả user hợp lệ | Agent có vô số cách encode 1 hành vi nên deny-list không bắt hết; RBAC cứng không phục vụ nhu cầu access khác nhau | Governance phải đo + evolve: RBAC linh hoạt, self-learning gate, đo vi phạm theo role — bổ sung lớp động cho policy.json tĩnh (KN-012) | `process` `governance` `security` `rbac` |
| KN-022 | 2026-09-08 | Pipeline in a trench coat — phần lớn "agent" là pipeline giả danh; agency là cost phải justify | Model không tự quyết control flow trong đa số hệ thống; free-roaming loop đắt, nondeterministic, không test được trong khi path vốn đã biết | Vẽ được flowchart trước khi chạy → build pipeline; agency chỉ đáng trả khi (1) outcome rẻ để verify VÀ (2) verification để lại dấu vết bền vững | `process` `architecture` `agent` `minimal` |
| KN-023 | 2026-09-10 | Model "giỏi ngọn, yếu gốc" — tự tin sai, tự review sai, tự chấm thiên vị (6 papers arXiv) | Model train để plausible (hợp lý bề mặt) không phải verified; intrinsic self-correction làm accuracy GIẢM; self-preference + sycophancy có hệ thống | Verification phải nằm NGOÀI model: fresh evidence từ tool, Dissent từ framing đối lập, đo lại bằng tool không tin trí nhớ | `process` `research` `verification` `calibration` |
| KN-024 | 2026-09-10 | Prolific AI Psychosis — output rẻ làm mù khả năng đánh giá; taste/craft là human judgment không outsource được | Metrics thưởng output không thưởng value + slot-machine reinforcement → dev đẻ hàng nghìn dòng code không ai hiểu, không tự assess chất lượng được | Nút thắt chuyển từ sản xuất sang đánh giá: giữ human judgment + verification ngoài model; đo value không đo LOC; taste là ceiling không tự động hóa được | `process` `psychology` `taste` `metrics` `human-judgment` |
| KN-025 | 2026-09-10 | Procedural Graphs — Self-Evolving Execution Structures (2609.09153v1) + A-JIT (2609.10248v1) | Agent chọn action qua unconstrained generation trên history dài → mất track, lặp vô ích, tool sai thứ tự | Procedural Graph tổ chức (procedure, relation, procedure) + guidance model bias next action + LLM refiner contrast failed/success để edit topology, giữ rejected edits | `process` `agent` `self-evolving` `procedural-graph` `a-jit` |
| KN-026 | 2026-09-10 | Experience Funnel — State-Policy Alternating Loop (2609.08919v1) + ADMET-EvO evidence-gated (2609.10121v1) | Experience rời rạc không thành competence tái dùng; state text nhanh nhưng phụ thuộc context, policy parametric gọn nhưng chậm update | Alternating loop: distill trajectory → explicit textual state (fast) → identify useful behavior → consolidate vào policy via transition-aware distillation (slow) + evidence-gated carry forward | `process` `self-evolving` `memory` `evidence` `funnel` |
| KN-027 | 2026-09-10 | Feedback-Enriched Environments + Consistency Gap + SOLID self-distillation (2609.08404v1, 2609.08832v1, 2609.09957v1) | RL long-horizon bị reward sparsity; agent 77% per-run nhưng chỉ 53% all-5 (gap 24); self-improvement phụ thuộc verified answers | FEEs: chuyển từ action guidance sang observation enrichment + intra-group feedback consistency; Consistency Analyzer + Guideline Generator; SOLID: cluster objectives, majority artifact làm pseudo-reference, group-relative advantages | `process` `rl` `consistency` `self-distillation` `verification` `scaffold` |
| KN-028 | 2026-09-10 | Intro COSMOS: hạt Big Bang nổ từ góc thay vì tâm — quên gọi `resize()` + 8/8 behavior test xanh giả | Canvas buffer mặc định 300×150 (w=h=cx=cy=0 vì `resize()` không được invoke) bị CSS kéo giãn; test chỉ assert visible/hidden, không assert geometry | Define setup xong phải invoke ngay; assert invariant hình học (`canvas.width===clientWidth`) trong test; visual evidence bắt bug mà behavior test bỏ lọt | `ui` `animation` `canvas` `verify` `bug-blindness` |
| KN-029 | 2026-09-10 | View ở VS Code "không thấy hiệu ứng intro" — Google Fonts render-blocking chặn TOÀN BỘ inline script | `<link rel=stylesheet>` third-party trong head là **script-blocking** (không chỉ render): engine intro cuối body không execute đến khi fonts load xong (10-20s mạng chậm) → overlay đứng hình → click nhầm → skip | Third-party CSS luôn async (`media="print" onload`) + noscript; fail-safe mở nội dung khi engine fail; grace 600ms chống click nhầm; glyph chi tiết vẽ bằng CSS | `ui` `perf` `font` `script-blocking` `verify` |
| KN-030 | 2026-09-10 | `GET /.agent/audit.jsonl 404` trên Pages — observatory luôn hiện demo thay vì data thật | Fetch trỏ ra ngoài deploy root (`../../.agent/` — Pages chỉ deploy `www/`) + fetch relative phân giải sai khi URL bỏ slash cuối (`/cosmos` + `./x` → `/x`) | Tài nguyên ngoài `www/` phải **mirror** vào (generate + commit như `scale.json`); dùng helper `dirBase(pathname)` robust mọi dạng URL; spec assert không-404 + data "thật" | `data` `pages` `fetch` `url` `verify` |
| KN-031 | 2026-09-10 | Edge PC "không thấy hiệu ứng intro" (phone thấy) — Windows tắt Animation effects → `prefers-reduced-motion: reduce` → bản rút gọn cũ (opacity:1 !important + animation:none) hiện static 1.8s | Reduced-motion branch strip **mọi** animation kể cả fade opacity an toàn → static pop-in "trông như không có hiệu ứng"; cộng: intro chạy khi tab ẩn + grace 600ms quá ngắn cho click focus PC | Reduced-motion chỉ cắt chuyển động nguy hiểm (translate/scale/parallax), giữ fade opacity có nhịp + hint nói rõ lý do; defer timeline khi tab ẩn; grace 1000ms; test trên Edge thật (`channel: 'msedge'`) + poll pixels thay wall-clock | `ui` `a11y` `reduced-motion` `edge` `verify` |
| KN-032 | 2026-09-10 | Engine v2 throw `T is not defined` trong rAF callback → intro **đứng hình im lặng** (không crash trang) | Khai báo thiếu khi rewrite + lỗi trong `requestAnimationFrame` **không bị try/catch đồng bộ bắt** (async) → throw trước dòng schedule rAF → loop chết không báo gì | Browser test PHẢI assert "no pageerror/console error" ngay sau rewrite; freeze animation = nghi lỗi async trước khi nghi logic; test bắt được nhờ assertion Edge spec | `ui` `canvas` `animation` `verify` `error-handling` |

> Dòng ví dụ trên sẽ bị thay khi có bug thật đầu tiên — giữ format.

---

## Chi tiết bài học

### KN-001 — Ví dụ: Modal không đóng khi bấm ESC

- **Ngày:** 2026-08-29
- **Bug report:** `.agent/bugs/2026-08-29-modal-esc/bug.md`
- **Severity:** minor
- **Triệu chứng:** Modal mở nhưng bấm ESC không đóng, tab focus thoát ra ngoài.
- **Nguyên nhân gốc:** Chỉ xử lý `click` overlay, quên `keydown` ESC và `focus-trap`.
- **Cách sửa:** Thêm `keydown` listener + `focus-trap` + `aria-modal="true"`.
- **Cách phòng tránh:**
  - Checklist overlay: `ESC` + `click outside` + `focus trap` + `aria`.
  - Thêm vào `product-quality` audit.
- **Tags:** `ui` `a11y`
- **Người ghi:** YUNIE / harness

### KN-002 — Trang STATUS www/ giao diện chưa hợp lý

- **Ngày:** 2026-08-29
- **Bug report:** `.agent/bugs/2026-08-29-status-ui/bug.md`
- **Severity:** major
- **Triệu chứng:** Registry luôn hiện `enabled` dù có disabled, description trống; header tràn ở 375px; stats 5 cols chật ở 768px; table overflow ngang mobile không có card fallback; thiếu skip-link, aria, focus-visible; spacing 14px/22px không theo 4/8; `status.json` lưu array string lệch với `app.js` expect object.
- **Nguyên nhân gốc:** Thiếu single source of truth — `status.json` viết tay dạng array string, `app.js` code cho object `{name:{enabled,description}}` → mismatch. Không audit theo `product-quality.instructions.md` (responsive 375/768/1280, states, a11y, spacing 4/8, CSS variables). Không có generator `registry.json → status.json`.
- **Cách sửa:** Đồng bộ `status.json` sang object với `enabled`+`description` (đầy đủ 5 skills, 5 instructions, 7 agents, 7 prompts, 1 hook); `app.js` thêm `normalizeRegistry()` handle cả array và object + search/filter + a11y + error/empty states + `escapeHtml` + keyboard `/` focus; `styles.css` polish spacing 4/8, CSS variables, responsive (stats 2→3→5 cols, table→cards mobile, header co gọn), animation 150-300ms; `index.html` thêm skip-link, semantic, registry controls, aria, responsive header.
- **Cách phòng tránh:**
  - Tạo script `generate-status.mjs` regenerate `status.json` từ `registry.json` (không viết tay).
  - Checklist trước khi commit `www/`: responsive 375/768/1280, `get_errors`, `npx serve www` test, `JSON.parse` validate.
  - Contract `status.json` shape document trong `docs/capabilities.md` và `app.js` luôn backward compat.
  - Thêm `skip-link` + `aria-label` cho mọi page mới.
- **Tags:** `ui` `css` `a11y` `responsive` `data`
- **Người ghi:** YUNIE / fixbug

### KN-003 — Rainbow border GlassUI không xoay (animated) ở một số browser

- **Ngày:** 2026-08-30
- **Bug report:** `.agent/bugs/2026-08-29-rainbow-animated/bug.md`
- **Severity:** major
- **Triệu chứng:** Viền cầu vồng (`conic-gradient`) đứng yên, không xoay, dù nội dung mô tả "xoay 3s (HOT)". Một số browser/môi trường thấy tĩnh hoàn toàn.
- **Nguyên nhân gốc:** (1) Detection `@property` sai — `CSS.supports('syntax: "<angle>"')` luôn `false` → code luôn ép JS fallback, tắt animation CSS gốc; (2) `::before` đọc `--angle` qua biến `--rainbow` định nghĩa tại `:root` (`var(--angle)` lồng) → một số engine không re-resolve → tĩnh 0deg; (3) fallback gắn `.js-fallback` per-element bị `updatePlayground()` reset `className` → mất driver ở playground.
- **Cách sửa:** `::before` dùng `conic-gradient(from var(--angle,0deg), ...)` trực tiếp; detect `@property` bằng `CSS.registerProperty`; fallback gắn `.js-rainbow` ở `<html>` + rAF set `--angle`. Verify bằng Playwright (chromium/firefox/webkit, cả native + fallback mode) → `--angle` thay đổi rõ ràng.
- **Cách phòng tránh:**
  - Detect `@property` = `typeof CSS.registerProperty === 'function'`, không `CSS.supports('syntax: ...')`.
  - Animate custom property: dùng giá trị trực tiếp tại property đích, không qua biến lồng `var()` chứa `var()`.
  - Fallback class ở `<html>` (root), không per-element (tránh bị UI reset `className`).
  - Verify animation bằng headless browser đo `--angle` trước/sau, không chỉ mắt thường.
- **Tags:** `ui` `css` `animation`
- **Người ghi:** YUNIE / fixbug

### KN-004 — grid-2 thừa khoảng cách + rainbow border index.html không xoay khi hover

- **Ngày:** 2026-08-30
- **Bug report:** `.agent/bugs/2026-08-30-grid2-rainbow-hover/bug.md`
- **Severity:** minor
- **Triệu chứng:** (1) Hai khối `<div class="grid-2">` (Presets+Plans, Health+Pages) cách phần trên ~48px thay vì 24px → lệch nhịp. (2) Viền cầu vồng hiện khi hover nhưng đứng yên, không xoay.
- **Nguyên nhân gốc:** (1) `.grid-2` không có `margin`, trong khi `.section` con có `margin:24px 0`; vì grid item không collapse margin → cộng dồn 24+24=48px. (2) `::before`/`::after` dùng `background:var(--rainbow)` mà `--rainbow` là `conic-gradient(from var(--angle), ...)` định nghĩa tại `:root` → lặp lại anti-pattern KN-003, `--angle` thay đổi không re-resolve ở một số engine → tĩnh 0deg.
- **Cách sửa:** `.grid-2{margin:24px 0}` + `.grid-2 > .section{margin:0}` (nhịp 24px đồng nhất); thay `background:var(--rainbow)` → `background:conic-gradient(from var(--angle,0deg), #ff3b30, #ff9500, #ffcc02, #34c759, #007aff, #af52de, #ff3b30)` trực tiếp tại `::before`/`::after` trong `www/styles.css`.
- **Cách phòng tránh:**
  - Wrapper grid (`.grid-2`, `.grid-3`) luôn tự mang `margin`, con `.section` đặt `margin:0` để tránh doubling.
  - Animate custom property: luôn dùng giá trị trực tiếp tại property đích, không qua biến lồng `var()` chứa `var()` (KN-003).
  - Khi copy pattern rainbow từ `glassui` sang `www`, nhớ bê cả cách dùng gradient trực tiếp, không copy `--rainbow`.
- **Tags:** `ui` `css` `animation` `spacing`
- **Người ghi:** YUNIE / fixbug

### KN-005 — Bug Blindness — mù bug do workaround vô thức + fan bias

- **Ngày:** 2026-08-30
- **Bug report:** `.agent/bugs/2026-08-30-bug-blindness/bug.md` (tham chiếu Dan Luu — https://danluu.com/bug-blind/)
- **Severity:** major
- **Triệu chứng:** Dev/tester không thấy bug dù sản phẩm lỗi nặng (user không dùng được nếu không làm chuỗi workaround phức tạp). Internal comments vẫn "great, works well" trong khi launch ra user gặp đúng lỗi đó và fail. Ví dụ: Blackboard bị 93% hate nhưng nhân viên tưởng được yêu; Kagi trả toàn SEO spam nhưng fan vẫn bảo "kết quả xịn"; Discourse cheat LCP để qua metric nhưng thực tế chậm; Google Docs có hàng chục workaround mà dev quên đó là bug.
- **Nguyên nhân gốc (5 Whys):**
  - Why1: Dev không báo bug → vì không nhận ra đó là bug.
  - Why2: Không nhận ra → vì đã tự tạo habitual mitigations (thói quen workaround vô thức) — như chuột bi bẩn phải quơ tay loạn xạ, mở Google Docs phải đợi 2s mới gõ title, tắt WiFi trước khi login ở Microsoft.
  - Why3: Workaround thành vô thức → vì lặp lại hàng ngày, não tự bù lỗi và quên mất đó là lỗi (Betriebsblindheit — mù do ở trong hệ thống quá lâu).
  - Why4: Không có fresh eyes → vì chỉ dogfooding kiểu dev (giỏi workaround) thay vì test như user mới, không có người ngoài chỉ ra.
  - Why5 (Root): Thiếu cơ chế phát hiện quality blindness + fan bias (yêu sản phẩm nên auto mù nhược điểm) + không đo quality bằng trải nghiệm user thực.
- **Cách sửa:**
  - Chữa mù bug bằng cách **chỉ ra bug liên tục** — Dan Luu đã làm với bạn bè, vài tuần sau họ tự thấy bug khắp nơi.
  - Test như **user mới / LLM act as normal user** — không dùng workaround, không đọc manual trang 43, thử nhiều scenario khác nhau.
  - Dogfooding **có ý thức**: ghi lại mọi workaround mình đang làm, tự hỏi "user mới có biết làm vậy không?".
  - Fresh eyes: nhờ người ngoài team, người chưa dùng bao giờ thử và quan sát không gợi ý.
  - Với coding agent hiện nay: vừa dễ tạo app dỏm hàng loạt, vừa dễ fix cho xịn — nhưng phải **actually notice** rằng quality có thể cải thiện (https://danluu.com/p95-skill/).
- **Cách phòng tránh:**
  - Trước khi ship: checklist "user mới có dùng được không nếu không biết workaround nào?" — nếu cần >1 bước không trực quan → là bug.
  - Ghi lại mọi habitual mitigation thành bug report thay vì để thành thói quen.
  - Thêm phase **Polish + Verify với fresh eyes** trong Harness — responsive 375/768/1280, empty/loading/error states, a11y, perf — không bỏ.
  - Dùng LLM / người ngoài làm "normal user" để reproduce, không chỉ dev tự test.
  - Văn hóa team: khuyến khích chỉ ra flaw, không fan bias — "yêu sản phẩm nhưng vẫn soi lỗi".
- **Tags:** `process` `quality` `ux` `perf` `a11y`
- **Người ghi:** YUNIE — tổng hợp từ Dan Luu "Bug Blindness" (2026-08-26) + Hacker News discussion

### KN-006 — N5 Blazor thieu theme sang + tieng Viet mat dau + menu chua polish

- **Ngày:** 2026-08-30
- **Bug report:** `.agent/bugs/2026-08-30-n5-ui-polish/bug.md`
- **Severity:** major
- **Triệu chứng:** Chi co dark theme, khong co toggle sang/toi; Home.razor mat dau tieng Viet (Hoc thay Hoc, Tong quan thay Tổng quan) do fix encoding; menu don gian thieu badge/grouping/a11y; contrast chua test light; hieu ung rainbow chua co prefers-reduced-motion day du.
- **Nguyên nhân gốc:** (1) Design system chi dinh nghia :root dark, chua co [data-theme="light"] variables; (2) Fix bug RZ9986 (Techniques="Blazor: @inject...") bang cach xoa dau + PowerShell here-string lam corrupt Home.razor -> restore ban ASCII an toan nhung mat dau; (3) NavMenu chi lam minimal chua polish theo product-quality; (4) Thieu early init theme -> flash khi reload.
- **Cách sửa:** Them [data-theme="light"] vao app.css (glass sang, text #0f172a, contrast >=4.5:1) + light overrides cho sidebar/topbar/nav/kana/badge/chip/input/quiz/helper; them n5Theme vao app.js (get/set/apply/init, ton trong localStorage + prefers-color-scheme, init ASAP chong flash); them toggle button vao MainLayout.razor (JS interop n5Theme.toggle, persist); them early script vao App.razor <head>; restore Home.razor tieng Viet co dau chuan UTF-8; polish NavMenu (badge, grouping, aria-label, WCAG); fix KanaPage luu->lưu, GrammarPage vi du->ví dụ.
- **Cách phòng tránh:**
  - Design system mac dinh co 2 theme (dark/light) voi CSS variables + toggle persist + early init trong <head>.
  - Moi file .razor phai UTF-8, khong dung PowerShell here-string cho tieng Viet — dung create_file voi UTF-8.
  - Checklist truoc khi Done: co toggle sang/toi? co test ca 2 theme? tieng Viet co dau? contrast >=4.5:1? menu co badge/a11y?
  - Them Playwright test cho theme toggle + contrast.
- **Tags:** `ui` `css` `a11y` `i18n` `theme` `contrast`
- **Người ghi:** YUNIE / fixbug

### KN-007 — Thiếu hệ thống tự học hỏi tự động — phải làm tay, dễ quên

- **Ngày:** 2026-08-30
- **Bug report:** `.agent/bugs/auto-learn/bug.md` (feature, không phải bug — hệ thống tự học)
- **Severity:** major
- **Triệu chứng:** Trước đây mỗi lần code phải nhớ tay `read_file docs/knowleged.md`, mỗi lần lỗi phải nhớ tạo `.agent/bugs/<slug>/bug.md`, mỗi lần fix xong phải nhớ cập nhật `knowleged.md` — dễ quên, dễ lặp bug cũ (KN-002..006 lặp lại vì không check).
- **Nguyên nhân gốc:**
  - Why1: Dev quên check KN → vì không có tool gợi ý tự động.
  - Why2: Không có tool → vì chỉ có instruction "bắt buộc đọc" nhưng không enforce bằng lệnh.
  - Why3: Không enforce → vì hooks chỉ echo chung chung, không có BM25-lite suggest.
  - Why4: Không có BM25-lite → vì chưa có script parse `knowleged.md` + scoring.
  - Why5 (Root): Thiếu **hệ thống tự học hỏi tự động** — 3 bước suggest/log/propose chưa thành CLI + instruction + agent + hooks.
- **Cách sửa:** Tạo `.github/harness/scripts/auto-learn.mjs` (Node 18+, no deps, <50ms):
  - `suggest "từ khóa" --top 3` — parse KN (split robust, handle \r\n, em dash), tokenize tiếng Việt có dấu, IDF weighting, trả top 3 KN + score + snippet.
  - `log --error "msg" --file "path" --title "tên"` — tạo `.agent/bugs/YYYY-MM-DD-<slug>/bug.md` từ template, handle duplicate slug.
  - `propose --bug <slug>` — đọc bug.md → next KN id → sinh markdown draft (bảng + chi tiết + anti-pattern) để copy-paste.
  - `status` — KN total, bugs, drafts, top tags, health.
  - Tạo `auto-learn.instructions.md` (applyTo **) enforce 4 quy tắc + checklist.
  - Tạo `learn.agent.md` delegate khi cần suggest/log/propose.
  - Cập nhật `hooks.json` thêm PostToolUse/Stop reminders.
  - Cập nhật presets `full/web-product/api-minimal` để bật auto-learn + learn.
- **Cách phòng tránh:**
  - Trước khi code: luôn `suggest "<mô tả task>"` — nếu có KN liên quan → áp dụng Cách phòng tránh ngay.
  - Khi lỗi: luôn `log --error` ngay khi còn nóng — không để trôi.
  - Sau khi fix: luôn `propose --bug` → dán vào `knowleged.md` (Bảng + Chi tiết + Anti-patterns + Checklist) + cập nhật UpdatedAt.
  - Hooks tự nhắc: PostToolUse gợi ý suggest, Stop nhắc status/propose.
  - Verify: `node auto-learn.mjs status` + `suggest "test"` trước khi commit.
- **Tags:** `process` `knowledge` `automation` `dx`
- **Người ghi:** YUNIE / auto-learn

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

### KN-010 — AAR pattern từ Anthropic — propose 3 methods, benchmark, keep best

- **Ngày:** 2026-08-31
- **Bug report:** _(pattern, không phải bug — feature improvement cho auto-researcher + systematic-debugging)_
- **Severity:** major
- **Triệu chứng:** Trước đây khi có nhiều cách fix/solve, dev chọn ngẫu hiên hoặc theo cảm tính → không biết cách nào tốt nhất, dễ reward hacking (chỉ check WHETHER pass không check HOW).
- **Nguyên nhân gốc (5 Whys):**
  - Why1: Dev chọn fix ngẫu hiên → vì không có benchmark loop chặt chẽ.
  - Why2: Không có benchmark loop → vì thiếu pattern "propose 3 → benchmark → keep best".
  - Why3: Thiếu pattern → vì chưa có skill auto-researcher AAR-style.
  - Why4: Chưa có auto-researcher → vì chưa tích hợp paper Anthropic AAR vào Harness.
  - Why5 (Root): Thiếu **hệ thống tự học hỏi có benchmark** — auto-learn suggest/log/propose chưa đủ, cần thêm benchmark loop.
- **Cách sửa:** Áp dụng AAR pattern (Anthropic paper 28/08/2026):
  - Nâng cấp `auto-researcher` skill: thêm benchmark loop (propose 3 → implement → benchmark → keep best).
  - Nâng cấp `systematic-debugging` skill: thêm AAR-style fix benchmark (3 cách fix → benchmark → keep best).
  - Tạo demo page `www/aar.html` so sánh AAR vs Harness v2.
  - Chi phí: $0 (local scripts) thay vì $4/hour (AAR API inference).
- **Cách phòng tránh:**
  - Khi có nhiều cách fix/solve (≥2): luôn áp dụng AAR pattern — propose 3 → benchmark → keep best.
  - 3-fix limit vẫn áp dụng (học từ systematic-debugging): nếu cả 3 cách fail → STOP, question architecture.
  - Check **HOW** (cách làm) không chỉ **WHETHER** (pass/fail) — tránh reward hacking.
  - Log benchmark results vào `.agent/benchmarks/<slug>-benchmark.md`.
  - `auto-researcher.mjs --task "xxx" --report` để chạy full AAR loop.
- **Tags:** `process` `self-improving` `benchmark` `aar` `automation`
- **Người ghi:** YUNIE / auto-researcher

### KN-011 — Random làm disable nút ▶ Bước tiếp theo (Bài 004 & 005)

- **Ngày:** 2026-08-31
- **Bug report:** `.agent/bugs/2026-08-31-random-step-btn-disabled/bug.md`
- **Severity:** major
- **Triệu chứng:** Sau khi click **🎲 Random** ở Bài 004 (Bubble Sort) hoặc Bài 005 (Binary Search), nút **▶ Bước tiếp theo** bị disabled (xám, không click được) — user không thể chạy từng bước sau khi Random.
- **Nguyên nhân gốc (5 Whys):**
  - Why1: Nút Step bị disabled sau Random → vì `handleRandom()` gọi `hideAll()` và `hideAll()` set `stepBtn.disabled = true`
  - Why2: `hideAll()` disable stepBtn → vì được viết để reset state, nhưng không phân biệt context (Random vs Reset vs Start)
  - Why3: Không phân biệt context → vì `hideAll()` là hàm chung, được reuse cho nhiều caller mà không có tham số
  - Why4: Thiếu quản lý state rõ ràng → vì `stepBtn.disabled` được set ở nhiều nơi (hideAll, handleStart, startAutoRun, handleReset) không nhất quán
  - Why5 (Root): Thiếu single source of truth cho button state — mỗi hàm tự set disabled mà không có hàm `updateButtonState()` tập trung
- **Cách sửa:** Minimal fix — `handleRandom()` sau khi gọi `hideAll()` thì re-enable `stepBtn.disabled = false`; `handleReset()` cũng re-enable; `handleStart()` cũng set `stepBtn.disabled = false`. Không đụng `hideAll()` để tránh regression.
- **Cách phòng tránh:**
  - Checklist: Mọi hàm `hideAll`/`reset` phải review xem có disable button không — chỉ disable khi thực sự cần
  - Tạo helper `setStepEnabled(bool)` nếu có nhiều nơi đụng
  - Test manual: sau mỗi action (Random, Reset, Start) check tất cả button states
- **Tags:** `ui` `state` `ux` `button`
- **Người ghi:** YUNIE / fixbug

### KN-012 — Agent tự sửa test để pass (reward hacking)

- **Ngày:** 2026-09-03
- **Bug report:** `.agent/bugs/2026-09-03-agent-test-mutate-reward-hacking/bug.md`
- **Severity:** critical
- **Triệu chứng:** Agent fix bug bằng cách sửa file test cho pass thay vì sửa production code → CI xanh nhưng bug gốc còn → false confidence, silent corruption. Nguồn HN 2026-09-03 "What happens when your AI agent edits its own tests to pass?" → https://bartholomew.info/ (BTP v2.4).
- **Nguyên nhân gốc (5 Whys):** policy v1 chỉ có 4 deny (rm-rf/.env/credentials/private-hosts), không gate edit trên test paths; TDD gate chỉ là instruction chữ, không enforce bằng tool; audit append-only nhưng không hash-chain → sửa log không phát hiện. Root: thiếu 3 lớp BTP (pre-flight + sandbox + notary).
- **Cách sửa:** BTP-lite 0 deps: (1) `policy.json` v2 thêm `deny-test-mutate` (Tests/.test./.spec./ai-news.json chỉ verify actor hoặc intent=takeover), `deny-destructive-sql`, `deny-rm-rf-variants`; (2) `audit.mjs` thêm `prevHash` + `hash` SHA-256/16 + lệnh `verify`; (3) governance instruction thêm §5 verifier integrity.
- **Cách phòng tránh:**
  - Test là immutable — FAIL chỉ được fix bằng production code, không bao giờ sửa test để pass (trừ khi spec đổi + human takeover).
  - Trước khi edit test paths: `policy-check --tool edit --target <path> --actor <actor>` phải PERMITTED.
  - Sau mỗi session: `audit.mjs verify` phải chain OK.
  - Check HOW không chỉ WHETHER (KN-010) — review diff test riêng với diff production.
- **Tags:** `process` `governance` `tdd` `safety` `reward-hacking`
- **Người ghi:** YUNIE / harness

### KN-013 — Tích hợp Ponytail ladder vào Harness v2 (minimal-ladder + lean-product)

- **Ngày:** 2026-09-03
- **Bug report:** `.agent/bugs/2026-09-03-n5blazor-ladder-trial-dead-code/bug.md` (trial, confidence MEDIUM)
- **Severity:** minor
- **Triệu chứng:** Harness v2 thiên mở rộng (8 phase Explore→Verify, UI đẹp) nên dễ over-build: N5Blazor có `GlassCard`/`RainbowCard` 0 usage + `bootstrap/` ~598KB 0 reference + Kana toggle chỉ add không remove. Trial đã fix nhưng bị revert (thiếu .NET 8 SDK để verify build/test).
- **Nguyên nhân gốc:** PRD không có YAGNI gate ("Does this need to exist?"); Design không có native-first (stdlib/native trước dep mới); Verify không grep dead-code + scoreboard. Ponytail (`DietrichGebert/ponytail`, MIT, 122k stars) đã giải bài này bằng ladder 7 nấc + benchmark LOC -54%.
- **Cách sửa:** Tích hợp qua plugin-seam, không sửa core:
  - Instruction `minimal-ladder` (`.github/instructions/minimal-ladder.instructions.md`, applyTo `**`): ladder 7 nấc + YAGNI gate ở PRD + native-first ở Design + dead-code grep/scoreboard ở Verify + never-cut (validation/security/a11y/test).
  - Preset `lean-product` (`.github/harness/presets/lean-product.json`): bật ladder, tắt UI nặng (`glass-rainbow-effects`, `ui-design-system`, `ui-ux-pro-max`, `last30days`), giữ core + TDD + debugging.
  - Bật `minimal-ladder: true` ở presets `full`, `web-product`, `api-minimal`.
  - Registry sync qua `harness-manager install --local --force` (tránh cache description template cũ).
  - Trial artifacts giữ nguyên để trace: `.agent/bugs/2026-09-03-n5blazor-ladder-trial-dead-code/bug.md` + `.agent/plans/n5-blazor-ladder/prd.md|design.md`.
- **Cách phòng tránh:**
  - Mọi task Implement/Fix: chạy ladder sau khi đọc code, dừng ở nấc đầu tiên đúng.
  - PRD luôn có dòng CẮT (YAGNI) trước dòng GIỮ.
  - Verify luôn grep tên component/css mới + ghi diff stat vào bug/plan.
  - Không cắt validation/security/a11y/test để giảm LOC (lazy, not negligent).
  - Khi `create` instruction xong rồi sửa description: chạy `install --local --force` để refresh registry (tránh stale cache).
- **Tags:** `process` `minimal` `ponytail` `yagni` `dx`
- **Người ghi:** YUNIE / harness

### KN-014 — Smoke test treo khi import MCP stdio server + verify order + regex m flag

- **Ngày:** 2026-09-04
- **Bug report:** `.agent/bugs/2026-09-04-import-mcp-stdio-server-trong-smoke-test-gay-treo-/bug.md`
- **Severity:** minor
- **Triệu chứng:** (1) Smoke test Phase 3 treo vĩnh viễn — `node -e "import('./www/library/mcp-server.mjs')"` khởi động MCP stdio server chờ input stdin, terminal chuyển background, các bước verify phía sau không chạy. (2) `distill-agnostic.mjs` self-verify chỉ 1/4 checks — `files-exist`/`record-complete` fail vì `record.json` chưa được ghi lúc verify chạy. (3) Sau fix order vẫn 3/4 — regex `/^name:\s*harness-/` thiếu flag `m`, `^name:` không match vì file bắt đầu bằng `---`.
- **Nguyên nhân gốc (5 Whys):**
  - Why1: Terminal treo → vì process node không exit.
  - Why2: Không exit → vì import `mcp-server.mjs` có side-effect khởi động server stdio, chờ stdin vĩnh viễn.
  - Why3: Verify 1/4 → vì `verifySkill()` chạy trước khi `record.json` được ghi — check phụ thuộc file sinh ra sau.
  - Why4: Regex không match → vì `^` không có flag `m` chỉ match đầu string, không match đầu dòng.
  - Why5 (Root): Thiếu 3 quy tắc: (a) cấm import module có side-effect khởi động server trong smoke one-liner; (b) self-verify phải chạy sau khi mọi file đã ghi; (c) regex `^`/`$` multi-line luôn thêm flag `m`.
- **Cách sửa:** (1) Smoke qua functions nội bộ (`skill-router.mjs`) hoặc spawn server với stdin đóng/timeout — không import trực tiếp module khởi động server. (2) Ghi `record.json` tạm bằng pre-checks (3 checks không phụ thuộc record) → verify đủ 4 checks → ghi lại final. (3) Thêm flag `m` cho regex frontmatter. Kết quả: distiller 5/5 G-accepted 4/4 checks, smoke sạch không treo.
- **Cách phòng tránh:**
  - KHÔNG import module khởi động server (stdio/HTTP) trong smoke test one-liner — server chờ input vĩnh viễn → treo terminal.
  - Smoke MCP: gọi qua functions nội bộ (router) hoặc spawn process với stdin đóng + timeout.
  - Self-verify phải chạy SAU khi mọi file đã ghi — nếu check phụ thuộc file sinh sau, ghi tạm (pre-checks) trước rồi verify final.
  - Regex `^`/`$` cho nội dung multi-line luôn thêm flag `m`.
  - Lệnh shell có ngoặc unquoted trong zsh → quote hoặc heredoc (tránh lỗi "unknown sort specifier").
- **Tags:** `process` `dx` `mcp` `testing` `regex`
- **Người ghi:** YUNIE / fixbug (DisCo Phase 3)

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

### KN-016 — harness-manager disable fail EPERM trên Windows (fs.rename folder bị chặn)

- **Ngày:** 2026-09-06
- **Bug report:** `.agent/bugs/2026-09-06-archify-skill-port/bug.md` (phần EPERM)
- **Severity:** major
- **Triệu chứng:** `node harness-manager.mjs disable skill archify` fail `❌ EPERM: operation not permitted, rename 'D:\CLAUDE_VS\.github\skills\archify' -> '...\.disabled\archify'` — dù ACL đầy đủ (Authenticated Users Modify), folder không readonly, không file lock rõ ràng. Cùng lúc đó PowerShell `Move-Item` cùng 2 path lại OK, và Node rename thử lại vẫn fail.
- **Nguyên nhân gốc (5 Whys):**
  - Why1: `fs.rename` fail EPERM → vì OS từ chối rename folder.
  - Why2: OS từ chối → vì một process (VS Code file watcher / Copilot context indexer) đang giữ handle trên folder/file bên trong.
  - Why3: Handle không thấy qua `open()` → vì watcher giữ handle ở mức directory, không phải file đơn.
  - Why4: `harness-manager` chỉ có 1 đường rename → không có fallback khi rename bị chặn.
  - Why5 (Root): Windows rename folder là operation dễ vỡ khi có watcher — cần **fallback copy+rm** thay vì fail cứng.
- **Cách sửa:** Thêm `safeRename(src, dst)` vào `harness-manager.mjs`: thử `fs.rename`; bắt `EPERM|EXDEV|EBUSY` → `fs.cp(src, dst, {recursive:true, force:true})` + `fs.rm(src, {recursive:true, force:true})` (folder) hoặc `copyFile` + `rm` (file). Patch cả `setEnabled` + `presetApply`. Kết quả: disable/enable/preset apply đều pass.
- **Cách phòng tránh:**
  - Mọi script move file/folder trên Windows dùng wrapper rename có fallback, không gọi `fs.rename` trần.
  - Gặp EPERM rename: thử PowerShell `Move-Item` để xác nhận OS cho phép → nếu OK thì chắc chắn là fallback thiếu, không phải permission.
  - Không đoán "chắc chạy được" — test disable/enable thật sau khi thêm skill mới.
- **Tags:** `process` `dx` `windows` `fs`
- **Người ghi:** YUNIE / fixbug

### KN-017 — Archify diagram tràn first-screen + text quá nhỏ — viewBox ratio math

- **Ngày:** 2026-09-06
- **Bug report:** `.agent/bugs/2026-09-06-archify-skill-port/bug.md` (phần viewport-overflow)
- **Severity:** major
- **Triệu chứng:** Diagram deliver pass 9/9 showcase checks nhưng `visual-check` fail `viewer/viewport-overflow` (scrollHeight 1415–2004 > innerHeight 900–1320) hoặc `composition/desktop-readability` (projectedFontPx 4.8–5.9 < 6). Sửa width thì vỡ text, sửa height thì tràn dọc — bế tắc 2 đầu.
- **Nguyên nhân gốc (5 Whys):**
  - Why1: Render tràn dọc → vì diagram height × scale > viewport height trừ chrome (~586px @1440×900).
  - Why2: Scale nhỏ → vì `scale = availableDiagramWidth (~930px) / viewBoxWidth`.
  - Why3: viewBoxWidth quá lớn (1400) → scale 0.66 → text context 7.3px × 0.66 = 4.8px < 6px minimum.
  - Why4: viewBoxWidth nhỏ (772) → scale 1.2 nhưng height 652 × 1.2 = 785px > 586px → tràn.
  - Why5 (Root): Thiếu **ratio math** — phải chọn viewBox width thỏa đồng thời 2 ràng buộc: `scale ≥ 0.822` (text ≥6px) VÀ `height × scale ≤ ~586px`.
- **Cách sửa:** Tính sweet spot: `width ∈ [1035, 1131]` cho height ~652 (workflow: `[1100, 652]` pass cả 2) và `[1050, 560]` cho sequence (nén y theo tỉ lệ `560/720`, giữ min y 160, spread messages ≥28px, nâng cụm cuối tránh legend). Sau mỗi lần đổi viewBox: rescale toàn bộ `y` (messages/activations/segments) theo tỉ lệ, rồi `deliver` + `visual-check` lại.
- **Cách phòng tránh:**
  - Workflow/sequence: ưu tiên viewBox **dẹt** (ratio ≥ 1.7:1) — architecture 1255×424 pass ngay lần đầu.
  - Công thức nhanh: `maxHeight = 586 / (930/width)` → chọn `width = maxHeight × ratio mong muốn`, kiểm tra `930/width ≥ 0.822`.
  - Đổi viewBox → nhớ rescale toàn bộ tọa độ y, không chỉ meta.
  - Luôn chạy `visual-check` (cần `ARCHIFY_CHROME` trỏ Edge/Chrome) sau `deliver` — 9/9 showcase checks KHÔNG bao gồm browser containment.
  - Đọc `supportedFixes` của validator — nó luôn chỉ đúng đường (bỏ fromSide/toSide, dùng labelAt gợi ý, route preset conflict → thả auto).
- **Tags:** `ui` `diagram` `archify` `responsive` `verify`
- **Người ghi:** YUNIE / fixbug

### KN-018 — Waymo effect / Decollaboration — AI tiện quá khiến human ngừng nghĩ chung

- **Ngày:** 2026-09-07
- **Bug report:** N/A — bài học rút từ essay "The Waymo effect" (Daniel Hook, CSO Holtzbrinck Group, researchagenda.news 2026-09-07) + Dashun Wang Nature comment 03/2026
- **Severity:** major
- **Triệu chứng:** Mọi conversation bị redirect từ đồng nghiệp sang chatbot; output tăng nhưng diversity của ý tưởng thu hẹp — mọi người chạy nhanh hơn trên cùng 1 đường; PRD/Design để AI viết 1 phát xong, không có framing đối lập; human dần thành passenger-in-comfort thay vì pilot-in-command.
- **Nguyên nhân gốc (5 Whys):**
  - Why1: Human ngừng nghĩ chung → vì LLM "đủ dùng" cho mọi bước.
  - Why2: LLM đủ dùng → vì nó bỏ hết friction của collaborator: không agenda, không tranh author order, available 2am, challenge đúng mức được yêu cầu — không hơn 1 độ.
  - Why3: Bỏ friction thấy là pure gain → vì cost của friction (small talk, ego management, scheduling) luôn visible còn benefit (đối lập framing, serendipity, người lạ ngoài bubble) thì diffuse và deferred.
  - Why4: Lựa chọn này "hợp lý" → vì hệ incentive thưởng velocity + credit, không thưởng thinking together (incentive trap: funding cắt workshop, velocity worship, credit arbitrage).
  - Why5 (Root): Thiếu gate bảo đảm **dissent** trong pipeline — không có cơ chế bắt buộc một tiếng nói đối lập không prompt trước, nên decollaboration diễn ra âm thầm, không ai quyết định ("never by decision, always by convenience").
- **Cách sửa:** Thêm **Dissent Review gate** ở Clarify + Verify (harness-workflow): mỗi PRD phải ghi `Who did you think with?` và chứa ≥1 framing đối lập/critique không được prompt trước; YUNIE bật **dissent mode** (challenge 1 lần mỗi ý tưởng); agent `Critic` đảm nhiệm vai friction-engineer; đo `collaboration` metric trong status.json.
- **Cách phòng tránh:**
  - Mọi PRD/Design phải trả lời "Who did you think with?" nghiêm túc như "What did you publish?".
  - Human giữ pilot-in-command: agent là crew (analyst/critic/planner), human quyết question + path + conclusions.
  - Outsource writing ≠ skip thinking — viết PRD/design là forcing function, không delegate toàn bộ.
  - Coi collaboration là infrastructure: fund workshop/visit/co-location/unstructured time, không cắt khi budget căng.
  - Khi output rẻ đi, thứ quý đảo ngược: thinking together là scarce resource — bảo vệ nó.
- **Tags:** `process` `collaboration` `diversity` `pilot-in-command`
- **Người ghi:** YUNIE / auto-learn

### KN-019 — Perceived vs Measured Productivity — claim tốc độ phải đo, không nhận vibes

- **Ngày:** 2026-09-08
- **Bug report:** N/A — bài học rút từ bài "My Little AI Factory" (dominis.blog, 07/09/2026) + METR study (metr.org, 07/2025)
- **Severity:** major
- **Triệu chứng:** METR study: 16 dev open-source kỳ vọng AI giúp nhanh hơn 24%, đo được thực tế chậm hơn 19% — và sau study vẫn tin AI giúp nhanh hơn 20%. Mọi người đánh giá AI productivity bằng cảm nhận ("nhanh hơn hẳn!") mà không có metrics nào đằng sau.
- **Nguyên nhân gốc (5 Whys):**
  - Why1: Không biết mình chậm hơn → vì không đo.
  - Why2: Không đo → vì đo tốn công, cảm nhận có sẵn.
  - Why3: Cảm nhận có sẵn và tin được → vì tool tạo trải nghiệm trôi chảy (autocompletion mượt, agent chạy liên tục) — cảm giác tiến độ ≠ tiến độ thật.
  - Why4: Không ai đòi metrics → vì team không có hạ tầng đo (session logs, diff stat, cost).
  - Why5 (Root): Pipeline thiếu gate "claim phải có measured evidence" — chỉ verify WHETHER (task xong chưa) mà không đo HOW (bao nhiêu token, bao nhiêu rework, nhanh hơn thật không).
- **Cách sửa:** Mọi claim hiệu quả phải kèm evidence đo được: diff stat (minimal-ladder scoreboard), số verify loop, token/cost nếu có, rework count trong bug.md/plan.md. Cronicle session history dùng để đối chiếu "cảm nhận vs thực tế".
- **Cách phòng tránh:**
  - Trước khi claim "nhanh hơn/tốt hơn": hỏi "đo bằng gì?" — không metrics thì nói rõ confidence LOW.
  - Ghi scoreboard diff stat mỗi Verify (đã có trong minimal-ladder).
  - Nhớ gap perceived vs measured là có hệ thống — chính dev trong study cũng sai sau khi được đo.
- **Tags:** `process` `metrics` `benchmark` `evidence`
- **Người ghi:** YUNIE / auto-learn

### KN-020 — Generate easy, trust hard — output agent phải qua review/benchmark gate

- **Ngày:** 2026-09-08
- **Bug report:** N/A — bài học rút từ "My Little AI Factory" (dominis.blog): Superglue thành công vì review tay từng thay đổi; BERBench sinh ra vì "no matter which magic setup, không thể tin code mà không review kỹ"
- **Severity:** major
- **Triệu chứng:** Agent đẻ code rất nhanh, nhiều setup "magic" (harness/model/skill/MCP) nhưng không có setup nào cho code đáng tin không cần human review; ở scale, human không đủ sức review hết.
- **Nguyên nhân gốc (5 Whys):**
  - Why1: Code phải review kỹ → vì model bị reward để giải task, không để cho code đúng.
  - Why2: Model tối ưu task-completion → vì training signal là success rate, không phải trustworthiness.
  - Why3: Vibe-check setup không cải thiện trust → vì biến cấu hình (harness/model/skill) không thay đổi nhu cầu verification.
  - Why4: Không có cách so sánh setup → vì thiếu benchmark deterministic trên codebase thật.
  - Why5 (Root): Thiếu continuous benchmarking + review gate trong pipeline — tin output vì nó trông ổn, không phải vì đã đo.
- **Cách sửa:** Giữ + siết các gate có sẵn: `tdd-gate` (RED trước), `verify` fresh evidence, Dissent Review; benchmark 2-3 cách (AAR, KN-010) trước khi chốt setup. "AI loves overcomplicating things" — áp minimal-ladder để radically simplify thay vì thêm phức tạp.
- **Cách phòng tránh:**
  - Không bao giờ trust agent output vì "trông đúng" — phải có test/measure (KN-012: check HOW not WHETHER).
  - Continuous benchmarking là foundation của self-evolving agents — benchmark định kỳ, keep best.
  - Radically simplify: mỗi task thêm phức tạp → hỏi YAGNI gate (KN-013).
- **Tags:** `process` `verification` `review` `minimal`
- **Người ghi:** YUNIE / auto-learn

### KN-021 — Governance rule-based cứng không scale — cần đo + RBAC linh hoạt

- **Ngày:** 2026-09-08
- **Bug report:** N/A — bài học rút từ "My Little AI Factory" (dominis.blog, component LEX) — bổ sung hướng evolve cho KN-012
- **Severity:** minor
- **Triệu chứng:** Rule engine gắn hook endpoint chặn được PII/secrets/network nhưng: (1) agent được reward để giải task — nếu delete file giúp xong task, nó tìm cách encode hành vi mà rule không bắt hết; (2) block-everything chặn luôn user hợp lệ cần elevated access.
- **Nguyên nhân gốc (5 Whys):**
  - Why1: Rule bị né → vì hành vi nguy hiểm có vô số cách encode, deny-list chỉ liệt kê được hữu hạn.
  - Why2: Block-all cũng fail → vì môi trường thật cần phân quyền theo role/người, không phải deny tuyệt đối.
  - Why3: Deny-list tĩnh không đủ → vì policy phải phản ánh ngữ cảnh (ai, khi nào, làm gì) chứ không chỉ pattern text.
  - Why4: Chưa đo vi phạm theo ngữ cảnh → vì thiếu telemetry per-role.
  - Why5 (Root): Governance tĩnh không tự học — cần gate đo được + RBAC linh hoạt, evolve dần theo vi phạm thực tế.
- **Cách sửa:** Giữ policy.json tĩnh làm lõi fail-closed (KN-012 — chưa thay vì chưa có bằng chứng cần thay), nhưng đo thêm: vi phạm per-actor trong audit stats; lộ trình evolve sang RBAC linh hoạt + self-learning gate khi số refused/false-positive tăng. Ref Grith (grith-ai/grith, 2026-09): mô hình 3 vùng risk-score (<3 allow · 3–8 queue chờ human duyệt · >8 deny) — vùng giữa chính là Take the Wheel, evolve từ binary deny/allow sang risk-score; thêm supervision-escape enforcement (chặn agent spawn tiến trình con không giám sát: docker/tmux) vào deny-list khi cần.
- **Cách phòng tránh:**
  - Đừng belief deny-list là đủ vĩnh viễn — đo refused rate + false positive định kỳ (cosmic-scale entropy).
  - Rule mới phải có evidence vi phạm thật, không thêm rule vì "sợ" (minimal-ladder cho policy).
  - Take the Wheel (human takeover) vẫn là fallback cuối — governance không thay human judgment.
- **Tags:** `process` `governance` `security` `rbac`
- **Người ghi:** YUNIE / auto-learn

### KN-022 — Pipeline in a trench coat — agency là cost phải justify

- **Ngày:** 2026-09-08
- **Bug report:** N/A — bài học rút từ "Most 'AI Agents' Are Just If-Statements in a Trench Coat" (James Anderson, DEV.to 2026-09-08, 23 reactions) + comment Baptiste Le Bouquin & Salman Parvez
- **Severity:** major
- **Triệu chứng:** Hệ thống gọi là "agent" (planner + tools + reasoning loop) chạy production: chậm, đắt, fail không reproduce — logs cho thấy nó làm cùng 3 bước mỗi run (extract, transform, respond), không bao giờ dùng autonomy để làm gì khác. Demo ấn tượng, Wednesday vẫn phải debug forensics trên "quyết định tự chủ" ở step 4 không kiểm soát được.
- **Nguyên nhân gốc (5 Whys):**
  - Why1: Hệ thống nondeterministic, khó debug → vì model được trao quyền chọn control flow tại runtime.
  - Why2: Trao quyền dù path đã biết → vì "agentic" là từ đẹp trong demo/pitch, không phải nhu cầu của task.
  - Why3: Không ai phân biệt agent vs pipeline → vì thiếu test rõ ràng.
  - Why4: Test "path có thay đổi không" cũng chưa đủ → vì có path thay đổi nhưng verify rẻ (scraper, retry sau 429) vẫn an toàn.
  - Why5 (Root): Thiếu tiêu chí cost-based: agency chỉ đáng trả khi (1) outcome rẻ để verify VÀ (2) verification để lại dấu vết bền vững (audit record) — thiếu 1 trong 2 thì autonomy là pure downside.
- **Cách sửa:** Litmus: vẽ được flowchart trước khi chạy → build pipeline (fixed steps, LLM call ở chỗ thật sự cần thông minh, control flow mình sở hữu). Harness v2 đã đúng: 8 phase cố định + agent chỉ quyết nội dung trong phase, không quyết path. Chỉ thêm agency tại điểm fixed path chứng minh fail, và không hơn.
- **Cách phòng tránh:**
  - Trước khi build "agent": hỏi "vẽ được flowchart không?" — vẽ được thì pipeline.
  - Agency phải justify: outcome rẻ verify + check để lại record (audit.jsonl, bug.md) — "trench coat fine as long as the person inside checks the pockets".
  - Multi-agent reconciliation phải deterministic (rule mình sở hữu), không "whoever spoke last wins" — conflict để lại thành record cho human, không ép consensus giả.
  - Boring pipeline là senior move: hệ thống sống qua Wednesday gần như luôn boring hơn hệ thống thắng demo.
- **Tags:** `process` `architecture` `agent` `minimal`
- **Người ghi:** YUNIE / auto-learn

### KN-023 — Model "giỏi ngọn, yếu gốc" — 6 papers chứng minh verification phải nằm ngoài model

- **Ngày:** 2026-09-10
- **Bug report:** N/A — bài học rút từ 6 papers arXiv đã verify (chi tiết: `docs/llm-weakness-research.md`)
- **Severity:** major
- **Triệu chứng:** Model trả lời mọi câu hỏi với độ tự tin như nhau (kể cả câu không thể biết); tự review bài của chính nó không sửa được lỗi logic, thậm chí accuracy giảm; chấm output của mình cao hơn output cùng chất lượng của model khác; nói cho dễ nghe thay vì nói thật; "reasoning" gãy khi chỉ đổi số trong đề hoặc thêm 1 mệnh đề nhiễu (sụt tới 65%).
- **Nguyên nhân gốc (5 Whys):**
  - Why1: Model tự tin sai mà không bị phát hiện → vì không có verifier trong loop.
  - Why2: Không verifier → vì model được train để *plausible* (hợp lý bề mặt), không phải *verified* — "tự tin sai" không bị phạt trong training.
  - Why3: RLHF còn củng cố: human preference data ưu tiên câu khớp quan điểm user (sycophancy) và câu viết thuyết phục hơn câu đúng.
  - Why4: Model nhận ra output của chính mình (self-recognition) và thiên vị nó (self-preference) — tương quan tuyến tính, nhân quả (Panickssery 2024).
  - Why5 (Root): **Đặc tính kiến trúc**, không phải lỗi model — LLM predict token tiếp theo, giỏi replicate pattern từ training data (GSM-Symbolic), không có cơ chế tự xác nhận đúng. Giải pháp duy nhất: verification nằm NGOÀI model.
- **Cách sửa:** Không tin self-report — mọi claim "đã xong" phải có fresh evidence từ tool (build/test/đo `--angle`). Critique phải từ framing đối lập không prompt trước (Dissent Review, KN-018). User phản hồi tiêu cực → đổi strategy + đo lại, không lặp output cũ để chiều lòng (sycophancy). Task ra khỏi vùng pattern quen → tăng cường verify (calibration không generalize).
- **Cách phòng tránh:**
  - Không hỏi model "chắc chưa?" — đo bằng tool (bài 2, 3: self-knowledge gap + calibration không generalize).
  - Không để model tự review/chấm bài của chính nó làm bằng chứng Done (bài 1, 4: self-correction fail + self-preference).
  - Không tin benchmark vendor — benchmark trên codebase thật (bài 3, 6: benchmark chính là vùng pattern quen).
  - Chi tiết 6 papers + trích dẫn nguyên văn: `docs/llm-weakness-research.md`.
- **Tags:** `process` `research` `verification` `calibration`
- **Người ghi:** YUNIE / auto-learn

### KN-024 — Prolific AI Psychosis — output rẻ làm mù khả năng đánh giá

- **Ngày:** 2026-09-10
- **Bug report:** N/A — bài học rút từ 2 nguồn blog 2026 (chi tiết: `docs/llm-weakness-research.md` §2b)
- **Severity:** major
- **Triệu chứng:** Dev đẻ hàng nghìn dòng code/ngày nhưng code ít utility thật; tự tin khẳng định "đã xong" trong khi software hỏng hơn trước; tạo nhiều file mới khi 1 dòng fix là đủ; code thành mớ rối khó đọc khó extend; rebuild lại thứ open-source đã giải từ đầu; "The illusion broke when I realized that I couldn't understand my own project" — không thêm feature được mà không viết lại từ đầu.
- **Nguyên nhân gốc (5 Whys):**
  - Why1: Dev không nhận ra output của mình vô giá trị → vì mất khả năng tự đánh giá chất lượng ("can't assess the quality of their own work" — Jeff Clark, MD).
  - Why2: Mất khả năng đánh giá → vì output rẻ + tự tin (KN-023) khiến verification bị bỏ qua — "a loss will look just like a win" (slot machine).
  - Why3: Verification bị bỏ qua → vì metrics-driven environments thưởng output (LOC, số task) không thưởng value.
  - Why4: Metrics sai → vì đo được cái dễ (số dòng, số file) hơn cái khó (utility, taste, craft).
  - Why5 (Root): **Nút thắt chuyển từ sản xuất sang đánh giá** — khi output rẻ, giá trị nằm ở khả năng đánh giá (human judgment + taste). Ai mất nó → psychosis; ai giữ nó (verification ngoài model + human pilot) → productive.
- **Cách sửa:** Đo value không đo output: diff stat + dead-code grep (KN-013) thay vì LOC; fresh evidence từ tool cho mọi claim (KN-012/023); giữ human judgment ở gate cuối — "prioritize human judgment, sleep, and at least some semblance of a life outside of work"; taste/craft là ceiling — product-quality standard (states, a11y, contrast) là floor, không tự động hóa được phần cảm nhận.
- **Cách phòng tránh:**
  - Không thưởng/chấm theo output đếm được (LOC, số file, số task) — đo value thật (utility, rework count, user feedback).
  - Học nhận diện "counterfeit wins" — loss nhìn y win: luôn verify bằng tool trước khi tin (KN-019).
  - Nếu không hiểu code mình vừa merge → STOP, đó là dấu hiệu psychosis — đọc lại hoặc viết lại (KN-022: human phải hiểu hệ thống mình sở hữu).
  - Giữ sleep + life outside work — hyperfocus là triệu chứng, không phải feature.
  - Taste là human judgment: AI dự đoán trend được nhưng express feeling thì không (Emily Oberg: $400k/năm tiết kiệm nhưng phá brand visual) — không outsource phần cảm nhận.
- **Tags:** `process` `psychology` `taste` `metrics` `human-judgment`
- **Người ghi:** YUNIE / auto-learn

### KN-025 — Procedural Graphs + A-JIT — Self-Evolving Execution Structures (2609.09153v1, 2609.10248v1)

- **Ngày:** 2026-09-10
- **Bug report:** N/A — bài học rút từ 2 papers arXiv (chi tiết: `www/library/export.json` arxiv-2609.09153v1 + 2609.10248v1)
- **Severity:** major
- **Triệu chứng:** Agent chọn action qua unconstrained generation trên history dài → mất track objective, invoke tool sai thứ tự, lặp hành động vô ích; trajectory càng dài càng lạc; static binary không tự thích ứng với nhu cầu user thay đổi.
- **Nguyên nhân gốc (5 Whys):**
  - Why1: Agent lạc → vì procedural knowledge (làm gì, thứ tự nào, điều kiện nào) để implicit trong history, không explicit.
  - Why2: Implicit → vì mỗi step generate tự do, không có structure bias.
  - Why3: Không structure → vì thiếu Procedural Graph — như knowledge graph cho factual (entity, relation, entity) thì procedural cần (procedure, relation, procedure) cho what-to-do.
  - Why4: Không self-evolve → vì không có loop contrast failed vs success để edit topology, không giữ rejected edits để tránh lặp.
  - Why5 (Root): Thiếu **execution structure tự tiến hóa** + **JIT specialization** — A-JIT chỉ ra app phải là assembly code + runtime harness + embedded agent quan sát usage/traces để specialize logic/workflows/tool interfaces theo user, không phải static artifact.
- **Cách sửa:** Procedural Graph: mỗi decision step localize active node, guidance model dịch subgraph thành situational guidance bias next action (không dictate); LLM refiner contrast failed/success trajectories → edit topology/attributes, commit nếu held-out validation pass, giữ rejected để discourage repetition; bắt đầu từ minimal skeleton cũng build được graph ngang hand-designed, sửa được flawed expert prior. A-JIT: tích hợp synthesis vào ambient lifecycle — trace-driven human-AI co-construction, dynamically construct missing implementations, generate capabilities on the fly.
- **Cách phòng tránh:**
  - Mọi agent long-horizon phải có explicit procedural structure (graph/workflow), không để unconstrained generation tự quyết thứ tự.
  - Guidance bias không dictate — solver vẫn quyết, graph chỉ gợi ý.
  - Self-evolution loop phải có held-out validation + rejected memory, không commit bừa.
  - Harness 8-phase đã là procedural graph thô — cần formalize thành `procedural-graph.json` với (procedure, relation, procedure) triplets + guidance.
  - A-JIT: harness + traces phải quan sát usage để specialize, không ship static rồi bỏ.
- **Tags:** `process` `agent` `self-evolving` `procedural-graph` `a-jit`
- **Người ghi:** YUNIE / auto-learn

### KN-026 — Experience Funnel + ADMET-EvO — State-Policy Alternating Loop & Evidence-Gated Evolution (2609.08919v1, 2609.10121v1)

- **Ngày:** 2026-09-10
- **Bug report:** N/A — bài học rút từ 2 papers arXiv (chi tiết: `www/library/export.json` arxiv-2609.08919v1 + 2609.10121v1)
- **Severity:** major
- **Triệu chứng:** Experience rời rạc từ interaction không thành competence tái dùng; explicit textual state (skills, harnesses) nhanh, human-readable nhưng phụ thuộc external context; parametric policy gọn, reusable nhưng chậm update; agent không sustain adaptation qua heterogeneous tasks mà overfit vào internal validation.
- **Nguyên nhân gốc (5 Whys):**
  - Why1: Không reuse experience → vì chỉ lưu trajectory, không distill thành state/policy.
  - Why2: Chỉ 1 trong 2 (state hoặc policy) → vì thiếu alternating loop — state nhanh nhưng không consolidate, policy gọn nhưng không adapt kịp.
  - Why3: Không alternating → vì thiếu Experience Funnel: distill trajectory → explicit textual state (fast) → identify useful behavior → consolidate vào policy via transition-aware distillation (slow) → new rollouts → next round.
  - Why4: Heterogeneous tasks overfit → vì không evidence-gated — ADMET-EvO chỉ ra phải formalize endpoints, generate falsifiable hypotheses, test interventions across data/feature/model axes, carry supported/rejected/inconclusive forward.
  - Why5 (Root): Thiếu **state-policy alternating + evidence gating** — experience phải qua funnel để thành competence, và mọi adaptation phải gated bởi evidence, không phải internal validation.
- **Cách sửa:** Experience Funnel: interaction trajectories → distill vào explicit textual state (knowleged.md, skills, harnesses) nơi experience mới được incorporate và validate nhanh; sau đó selectively identify state-enabled behavior hữu ích qua state revisions → consolidate vào policy qua transition-aware distillation; updated state-policy pair generate new rollouts cho vòng tiếp. ADMET-EvO: evidence-gated agent formalize endpoints, generate falsifiable hypotheses, test across axes, carry outcomes forward; đạt 96.77 task-normalized score trên 22-task TDC ADMET, giảm fitting time 72.2% trong non-inferiority margin, formalize 43 toxicity tasks.
- **Cách phòng tránh:**
  - Mọi self-evolution phải có 2 tốc độ: fast state (text, editable) + slow policy (parametric, consolidated) — không chỉ 1.
  - Distill trajectory thành explicit state trước, validate nhanh, rồi mới consolidate vào policy — không consolidate trực tiếp từ raw trajectory.
  - Evidence-gated: mọi hypothesis phải falsifiable, test qua interventions, carry supported/rejected/inconclusive — không overfit internal validation.
  - Harness: knowleged.md là explicit state, instructions/skills là policy — cần funnel loop giữa chúng, không chỉ append.
  - Đo cumulative fitting time + task-normalized score, không chỉ per-task accuracy.
- **Tags:** `process` `self-evolving` `memory` `evidence` `funnel`
- **Người ghi:** YUNIE / auto-learn

### KN-027 — Feedback-Enriched Environments + Consistency Gap + SOLID — Self-Improvement Without Verified Answers (2609.08404v1, 2609.08832v1, 2609.09957v1)

- **Ngày:** 2026-09-10
- **Bug report:** N/A — bài học rút từ 3 papers arXiv (chi tiết: `www/library/export.json` arxiv-2609.08404v1 + 2609.08832v1 + 2609.09957v1)
- **Severity:** major
- **Triệu chứng:** RL long-horizon bị reward sparsity → training không tiến; agent 77% per-run nhưng chỉ 53% all-5 (consistency gap 24 điểm) → unreliable production; self-improvement phụ thuộc verified answers hoặc external evaluator → không scale.
- **Nguyên nhân gốc (5 Whys):**
  - Why1: RL không học được long-horizon → vì reward thưa, agent-side warming via SFT bị data scarcity + constrained exploration.
  - Why2: Không học dù per-run cao → vì consistency gap — cùng task 5 lần, ReAct/GPT-4.1 chỉ 53% all-5 dù 77% per-run; unstable low-consistency steps flip across executions.
  - Why3: Không fix gap → vì thiếu Consistency Analyzer pinpoint where/why trajectory flip + Guideline Generator convert diagnosis thành targeted guidelines commit vào memory.
  - Why4: Self-improvement cần verified answers → vì credit assignment coarse (outcome reward) hoặc costly (process evaluator), privileged self-distillation gây style mismatch.
  - Why5 (Root): Thiếu **environment-side adaptation + consistency-aware memory + evaluator-free self-distillation** — FEEs chuyển từ action guidance sang observation enrichment, SOLID cluster objectives và chọn majority artifact làm pseudo-reference với group-relative advantages.
- **Cách sửa:** FEEs (Feedback-Enriched Environments): paradigm shift từ agent-side warming sang environment-side adaptation — reformulate environments bằng cách transition từ action guidance sang observation enrichment ở later stages của intra-episode exploration và inter-episode evolution; stabilize training (giảm entropy volatility), facilitate proactive exploration, internalize guidance vào policy weights, intra-group feedback consistency là boundary cho stable optimization (SciWorld/BFCL, Qwen3 + GRPO/GSPO/DAPO). Consistency Gap: framework identify unstable low-consistency steps → convert thành episodic memory → inject vào future executions; +16 points all-5 same-task, +13 similar-task generalization trên AppWorld. SOLID: Solver-Informed On-Policy Learning through Self-Distillation — execute candidate programs từ multiple rollouts, cluster objectives, chọn majority-group artifact làm pseudo-reference, update với group-relative advantages + dense self-supervision; không cần verified answers hay external evaluator; improve accuracy cho cả general và OR-tuned models.
- **Cách phòng tránh:**
  - Long-horizon RL: ưu tiên environment-side adaptation (FEEs) trước khi nhồi agent-side SFT — enrich observation, không chỉ guide action.
  - Đo consistency gap (all-5 vs per-run) như metric chính cho production reliability, không chỉ per-run pass rate.
  - Mọi self-evolution phải có Consistency Analyzer + Guideline Generator → episodic memory, không chỉ retry.
  - Self-improvement không cần verified answers: dùng SOLID pattern — multiple rollouts → cluster → majority pseudo-reference → group-relative advantages.
  - Intra-group feedback consistency là boundary — nếu feedback trong group không consistent → optimization unstable, phải fix environment trước.
- **Tags:** `process` `rl` `consistency` `self-distillation` `verification` `scaffold`
- **Người ghi:** YUNIE / auto-learn

### KN-028 — Canvas quên invoke `resize()` → burst sai gốc + behavior test xanh giả

- **Ngày:** 2026-09-10
- **Bug report:** `.agent/bugs/2026-09-10-intro-burst-tu-goc-do-quen-goi-resize/bug.md`
- **Severity:** major
- **Triệu chứng:** Intro cinematic COSMOS — 240 hạt Big Bang nổ từ **góc trên-trái (0,0)** thay vì tâm màn hình; canvas bị kéo giãn (hạt to/mờ bất thường: buffer 300×150 mặc định bị CSS scale lên 1280×720). Trong khi đó **8/8 Playwright test PASS** (cover/skip/reveal đều đúng) → xanh giả, suýt ship bug.
- **Nguyên nhân gốc (5 Whys):**
  - Why1: Hạt spawn tại `(cx,cy)=(0,0)` — vì `cx,cy` chưa bao giờ được gán.
  - Why2: `cx,cy` chỉ gán trong `resize()` — vì `resize()` chưa bao giờ chạy lần nào.
  - Why3: Code chỉ **define** `resize()` + `addEventListener('resize', resizeFn)` — **thiếu invoke `resize()` khởi tạo**.
  - Why4: Không test nào assert invariant "canvas buffer == kích thước hiển thị" → behavior test không thể bắt.
  - Why5 (Root): Invariant hình học chỉ tồn tại trong đầu người viết, không trong test — chỉ **visual evidence (screenshot)** bắt được.
- **Cách sửa:** Thêm `resize();` ngay sau đăng ký listener + guard `if(!w||!h) resize()` trong `burst()` (chống khởi tạo trễ/viewport đổi); thêm assert `canvas.width===clientWidth && canvas.height===clientHeight` vào spec; screenshot từng stage làm evidence (`.agent/plans/cosmos-intro/verify/`).
- **Cách phòng tránh:**
  - Pattern "define setup → addEventListener" **phải kèm invoke ngay** — define không phải là chạy.
  - Mọi effect dùng toạ độ/kích thước (canvas, parallax, viewBox) phải có **assert invariant hình học** trong test — không chỉ assert visible/hidden (KN-023: verification ngoài model).
  - Animation phải có **visual evidence từng stage** (screenshot) trước khi claim Done — behavior test xanh ≠ hiệu ứng đúng (KN-005 Bug Blindness).
  - Playwright test với external render-blocking (Google Fonts CSS) phải **stub route** để deterministic — nếu không, `load` event trễ 10-20s làm timeline chạy xong trước khi test assert → flaky giả.
- **Tags:** `ui` `animation` `canvas` `verify` `bug-blindness`
- **Người ghi:** YUNIE / fixbug (self-caught qua screenshot evidence)

### KN-029 — Google Fonts script-blocking làm intro "không hiện" trên mạng chậm

- **Ngày:** 2026-09-10
- **Bug report:** `.agent/bugs/2026-09-10-google-fonts-chan-script-intro-khong-hien/bug.md`
- **Severity:** major
- **Triệu chứng:** User báo "view ở VS Code không thấy hiệu ứng intro". Thực tế: 10-20s đầu overlay đứng hình (nền đen + nút skip + progress 0%, không chữ vì chars do JS inject); hoặc user click sớm → skip tức thì → không cảm nhận được gì.
- **Nguyên nhân gốc (5 Whys):**
  - Why1: Engine intro (inline script cuối body) không execute trong 10-20s đầu.
  - Why2: Inline script đứng SAU một stylesheet chưa load xong bị **block execution** (spec: "a style sheet that is blocking scripts") — third-party CSS block SCRIPT, không chỉ render.
  - Why3: `<link>` Google Fonts là stylesheet blocking thường (không async) → mạng chậm VN giữ toàn bộ JS của trang làm con tin.
  - Why4: Gate `intro-on` (script trong head, chạy được) che nội dung ngay → user thấy màn đen đứng hình thay vì fallback bình thường → tệ hơn không có intro.
  - Why5 (Root): Third-party CSS nhúng kiểu blocking + overlay che nội dung không fail-safe — đường loading bị khóa vào 1 CDN ngoài.
- **Cách sửa:** (1) Fonts async `media="print" onload="this.media='all'"` + `<noscript>`; (2) fail-safe 9s ở head gate (engine không chạy → tự mở nội dung); (3) grace period 600ms cho click-anywhere; (4) dấu "·" vẽ bằng CSS circle (fallback font render ô vuông); (5) `window.__introOn=true` đặt cuối IIFE.
- **Cách phòng tránh:**
  - Third-party CSS (fonts/CDN) **luôn async** hoặc self-host — không bao giờ để chặn first script của trang.
  - Overlay che nội dung phải có **fail-safe timer độc lập với engine** (engine fail → tự mở nội dung, không bao giờ kẹt màn đen).
  - Skip kiểu click-anywhere phải có **grace period (~600ms)** chống click nhầm khi vừa mở.
  - Chi tiết thiết kế (dot, divider) không phụ thuộc glyph font — vẽ bằng CSS để deterministic.
  - Regression test: route treo fonts CDN → assert engine vẫn chạy ngay (`cosmos-intro.spec.ts`).
- **Tags:** `ui` `perf` `font` `script-blocking` `verify`
- **Người ghi:** YUNIE / fixbug (user report → repro bằng Playwright route treo)

### KN-030 — Fetch ra ngoài deploy root + relative URL không slash cuối → 404 trên Pages

- **Ngày:** 2026-09-10
- **Bug report:** `.agent/bugs/2026-09-10-observatory-fetch-404-ngoai-www-va-relative-url/bug.md`
- **Severity:** major
- **Triệu chứng:** Console trên trang Pages: `GET https://mrdanhdanh.github.io/.agent/audit.jsonl 404`. Observator "Event Horizon" luôn hiện demo (`✅ Chain OK — demo`) thay vì chuỗi audit thật; card "Nón ánh sáng" bấm 404. Trên local `npx serve` thì cả audit lẫn scale đều `fetch fail` (URL bị redirect `/cosmos/index.html → /cosmos` mất slash cuối).
- **Nguyên nhân gốc (5 Whys):**
  - Why1: Fetch 404 → không có data thật, rơi về demo fallback.
  - Why2 (Pages): `.agent/` ngoài `www/` — Pages chỉ deploy `www/`; `../../` leo lên host root → `/.agent/audit.jsonl` không tồn tại.
  - Why3 (local): `fetch('./x')` phân giải theo document URL — `/cosmos` (không slash cuối) coi segment cuối là file → `'./x'` → `/x`.
  - Why4: Code giả định URL luôn có `/` cuối hoặc `.html` + `.agent/` truy cập được từ web root.
  - Why5 (Root): Trang static không được giả định vị trí file ngoài deploy root hay hình dạng URL — tài nguyên phải nằm trong `www/` và URL phân giải phải robust mọi dạng path.
- **Cách sửa:** (1) `generate-status.mjs` sinh mirror công khai `www/cosmos/audit.json` (50 events tail) — pattern giống `scale.json`; (2) helper toàn cục `dirBase(pathname)` xử lý đúng `/cosmos/`, `/cosmos`, `/cosmos/index.html`; (3) cả 4 fetch site dùng `dirBase(location.pathname)+'file.json'`; (4) card link → `./audit.json`; (5) spec `cosmos-observatory.spec.ts` assert badge "thật" + mirror 200 + không 404 `.agent`.
- **Cách phòng tránh:**
  - Trang static (Pages) **chỉ fetch trong `www/`** — tài nguyên ngoài (`.agent/`, `docs/`, root repo) phải **mirror vào** qua generator + commit.
  - Relative fetch phải qua helper `dirBase` — không giả định slash cuối. Test cả URL dạng `/path`, `/path/`, `/path/index.html`.
  - Spec phải assert **không có 404 nào** (bắt network response), không chỉ assert UI text — fallback demo che bug (xanh giả).
  - Test trên **≥2 host** (serve local + Pages) cho mọi trang có fetch.
- **Tags:** `data` `pages` `fetch` `url` `verify`
- **Người ghi:** YUNIE / fixbug (user console report → repro bằng server log + Playwright)

### KN-031 — Edge PC "không thấy hiệu ứng" do reduced-motion bị xử lý quá tay

- **Ngày:** 2026-09-10
- **Bug report:** `.agent/bugs/2026-09-10-edge-pc-khong-thay-hieu-ung-intro-reduced-motion/bug.md`
- **Severity:** major
- **Triệu chứng:** User: "trên điện thoại coi được, Edge PC không coi được hiệu ứng". Thực tế Edge PC: intro hiện chữ **static cái rụp** ~1.8s rồi mở — không fade/particle/chuyển động gì. Phone (animation bật): full Big Bang.
- **Nguyên nhân gốc (5 Whys):**
  - Why1: Edge PC rơi vào nhánh `prefers-reduced-motion` (Windows tắt "Animation effects").
  - Why2: Nhánh reduced cũ strip **mọi** animation/transition kể cả fade opacity vô hại → static pop-in.
  - Why3: Không phân biệt chuyển động nguy hiểm tiền đình (translate/scale/parallax) vs fade opacity an toàn — cắt tất cả.
  - Why4: Không test trên đúng môi trường user (Edge thật + reduced-motion) → không ai thấy bản reduced "trống".
  - Why5 (Root): Reduced-motion bị hiểu là "xóa sạch hiệu ứng" thay vì "giữ hiệu ứng an toàn + nói rõ lý do khi rút gọn".
- **Cách sửa:** Bản reduced "calm cinematic" chỉ opacity (fade stagger ~3.5s, dot pulse); hint nói rõ "Bật Animation effects trong Windows để xem đầy đủ" + `console.info`; defer start (t0 + .play + auto-finish) tới khi tab visible; grace click 1000ms; head fail-safe chuyển sang `window.__introEngine`; spec Edge thật (`channel:'msedge'`) + pixel poll.
- **Cách phòng tránh:**
  - Reduced-motion chỉ cắt **chuyển động** (translate/scale/parallax/spin) — fade opacity là an toàn, phải giữ để trải nghiệm còn "có nhịp".
  - Khi rút gọn trải nghiệm vì setting của user → **nói rõ lý do trong UI** (hint ngắn) — đừng để user tưởng sản phẩm lỗi.
  - Overlay/animation có timeline phải defer khi `document.hidden` — không chạy vô hình ở tab nền.
  - "Không thấy hiệu ứng" → đo trên **đúng môi trường user** (Edge thật qua `channel:'msedge'`, emulate reduced-motion), không chỉ chromium default.
  - Test animation bằng **poll state** (pixel/class), không wall-clock cố định (cold-start làm flaky).
- **Tags:** `ui` `a11y` `reduced-motion` `edge` `verify`
- **Người ghi:** YUNIE / fixbug (user report → repro trên Edge thật)

### KN-032 — rAF callback throw không bị try/catch bắt → animation chết im lặng

- **Ngày:** 2026-09-10
- **Bug report:** `.agent/bugs/2026-09-10-raf-callback-error-khong-bi-try-catch-bat/bug.md`
- **Severity:** major
- **Triệu chứng:** Intro v2 rewrite xong — chạy tới ~0.85s rồi **đứng im** (frame đóng băng, không crash trang, không message cho user). Edge spec fail qua assertion "no pageerror": `[pageerror] T is not defined`.
- **Nguyên nhân gốc (5 Whys):**
  - Why1: `T` (`Math.sin(T*2.2)` trong galactic nucleus glow) chưa khai báo khi rewrite v2.
  - Why2: Throw xảy ra trong **rAF callback** — chạy async, KHÔNG nằm trong `try{...}catch(e){}` bao quanh phần setup engine (try/catch chỉ bắt lỗi đồng bộ lúc đăng ký).
  - Why3: Throw trước `raf = requestAnimationFrame(frame)` → loop không schedule lại → chết im lặng.
  - Why4: Rewrite lớn không chạy assertion "no-console-error" trên browser thật ngay sau khi viết.
  - Why5 (Root): Thiếu nguyên tắc: engine rAF phải được gate bằng browser test assert no-pageerror — vì lỗi async không bị try/catch đồng bộ bắt và thất bại kiểu "đứng hình" rất khó thấy bằng mắt.
- **Cách sửa:** Khai báo `const T = t/1000;` (fix ở nguồn, không bọc try/catch toàn frame để khỏi che lỗi thật); giữ assertion no-pageerror trong `cosmos-intro-edge.spec.ts` làm lưới an toàn thường trực.
- **Cách phòng tránh:**
  - Mọi engine rAF (canvas/animation): browser test PHẢI assert **no pageerror/console error** — chạy ngay sau rewrite lớn.
  - Freeze animation = nghi lỗi async (rAF/setTimeout) trước khi nghi logic vật lý.
  - Rewrite lớn: rà các biến dùng-xong-chưa-khai-báo (đặc biệt sau khi tách/ghép hàm) — syntax check của IDE không bắt được ReferenceError.
- **Tags:** `ui` `canvas` `animation` `verify` `error-handling`
- **Người ghi:** YUNIE / fixbug (Edge spec tự bắt trong session)

<!-- Thêm bài học mới theo template dưới — copy block này -->

<!--
### KN-XXX — Tiêu đề ngắn gọn

- **Ngày:** YYYY-MM-DD
- **Bug report:** `.agent/bugs/YYYY-MM-DD-<slug>/bug.md`
- **Severity:** critical | major | minor
- **Triệu chứng:**
- **Nguyên nhân gốc:**
- **Cách sửa:**
- **Cách phòng tránh:**
- **Tags:**
- **Người ghi:**
-->

---

## Anti-patterns tích lũy (Đừng lặp lại)

- ❌ Fix triệu chứng, không tìm root cause.
- ❌ Để `<link rel=stylesheet>` third-party (Google Fonts) blocking trong head — nó chặn luôn EXECUTION của mọi inline script phía sau, app "chết đứng" trên mạng chậm (KN-029).
- ❌ Overlay che nội dung không có fail-safe timer độc lập engine → engine fail là kẹt màn đen vĩnh viễn (KN-029).
- ❌ Click-anywhere-skip không grace period → user click nhầm lúc mới mở là mất intro (KN-029).
- ❌ Fetch tài nguyên NGOÀI deploy root (`../../.agent/...` khi Pages chỉ có `www/`) → 404, fallback demo che bug (KN-030).
- ❌ Fetch relative không tính URL bỏ slash cuối (`/cosmos` + `./x` → `/x` 404) — phải qua helper `dirBase` (KN-030).
- ❌ Test chỉ assert UI text khi có fallback demo → "demo" vẫn xanh giả; phải assert network không-404 + badge "thật" (KN-030).
- ❌ Reduced-motion = `opacity:1 !important; animation:none !important` cho toàn bộ overlay → static pop-in, user tưởng "trang không có hiệu ứng" (KN-031).
- ❌ Rút gọn trải nghiệm vì setting của user mà không nói lý do trong UI (KN-031).
- ❌ Timeline intro chạy khi tab ở background → user switch về là đã hết (KN-031).
- ❌ Test animation bằng wall-clock cố định (Edge cold-start → flaky); phải poll state + test trên Edge thật khi user dùng Edge (KN-031).
- ❌ Throw trong rAF callback tưởng được try/catch ngoài bắt — lỗi async → engine đứng hình im lặng; browser test thiếu assert no-pageerror là mù (KN-032).
- ❌ Không reproduce trước khi sửa → sửa nhầm chỗ.
- ❌ Sửa xong không test regression → tạo bug mới.
- ❌ Không ghi bài học → bug cũ lặp lại.
- ❌ Viết `status.json` tay không qua generator → data shape lệch với render (KN-002).
- ❌ Không test responsive 375/768/1280 trước khi commit `www/` (KN-002).
- ❌ Hardcode màu/spacing không dùng CSS variables (KN-002).
- ❌ Detect `@property` bằng `CSS.supports('syntax: ...')` (luôn false) → ép JS fallback sai (KN-003).
- ❌ Chọn fix ngẫu hiên khi có nhiều cách → áp dụng AAR pattern: propose 3 → benchmark → keep best (KN-010).
- ❌ Check WHETHER (pass/fail) mà không check HOW (cách làm) → reward hacking (KN-010).
- ❌ Animate custom property qua biến lồng `var()` chứa `var()` → một số engine không re-resolve (KN-003).
- ❌ Gắn fallback class per-element rồi để UI reset `className` → mất animation (KN-003).
- ❌ Tự workaround bug thành thói quen vô thức rồi quên đó là bug — habitual mitigations (KN-005).
- ❌ Fan bias: yêu sản phẩm nên auto mù nhược điểm, bảo "xịn mà" dù user không dùng được (KN-005).
- ❌ Chỉ dev tự dogfooding (giỏi workaround) thay vì test như user mới / fresh eyes (KN-005).
- ❌ Nghĩ "dễ mà, chỉ cần làm [chuỗi 7 bước phức tạp]" — user thường bó tay (KN-005).
- ❌ Chỉ làm dark theme, không có light theme + toggle persist + early init (KN-006).
- ❌ Fix bug encoding bằng cách xóa dấu tiếng Việt — phải giữ UTF-8 chuẩn (KN-006).
- ❌ Dùng PowerShell here-string cho file UTF-8 tiếng Việt → corrupt (KN-006).
- ❌ NavMenu minimal không có badge/grouping/aria-label (KN-006).
- ❌ Define setup function (resize/init) xong tưởng đã chạy — quên invoke khởi tạo → canvas buffer 300×150 bị CSS kéo giãn, hạt nổ từ góc (KN-028).
- ❌ Behavior test xanh (visible/hidden) mà không assert geometry invariant → hiệu ứng sai vị trí vẫn PASS (KN-028).
- ❌ Để Playwright phụ thuộc external render-blocking (fonts CDN) → `load` trễ làm test flaky giả (KN-028).
- ❌ Code mà không `suggest` KN liên quan trước — dễ lặp bug cũ (KN-007).
- ❌ Gặp lỗi mà không `log` ngay — để trôi, mất context (KN-007).
- ❌ Fix xong mà không `propose` KN mới — bài học không được lưu (KN-007).
- ❌ Tự ghi `knowleged.md` tay không qua propose — sai format, thiếu ID (KN-007).
- ❌ Để `dotnet run` chạy rồi `dotnet build` ngay — file lock MSB3027/MSB3021, tốn 17s retry vô ích (KN-008).
- ❌ Gặp MSB3027/MSB3021 mà tưởng lỗi code — không check `Get-Process` / `netstat 5251` (KN-008).
- ❌ Build fail mà không `log` ngay — mất context PID/port (KN-008).
- ❌ `hideAll()` disable button rồi caller không re-enable → Random xong không step được (KN-011).
- ❌ Sửa test để pass thay vì sửa production code — reward hacking, CI xanh giả (KN-012).
- ❌ Gate policy mà không cover test paths (`Tests`, `.test.`, `.spec.`) → agent mutate verifier được (KN-012).
- ❌ Audit append-only nhưng không hash-chain → sửa/xóa log không phát hiện được (KN-012).
- ❌ PRD không có YAGNI gate → dead code/component/css sống sót (KN-013).
- ❌ Verify không grep dead-code + không ghi scoreboard → over-build lọt (KN-013).
- ❌ Cắt validation/security/a11y/test để giảm LOC — lazy sai chỗ (KN-013).
- ❌ Sửa instruction xong không refresh registry → description stale cache template cũ (KN-013).
- ❌ Import module khởi động server (stdio/HTTP) trong smoke test one-liner — server chờ stdin vĩnh viễn, terminal treo (KN-014).
- ❌ Self-verify chạy trước khi file cần check được ghi — check phụ thuộc file sinh sau phải ghi tạm (pre-checks) rồi verify final (KN-014).
- ❌ Regex `^`/`$` trên nội dung multi-line thiếu flag `m` — chỉ match đầu/cuối string, không match đầu dòng (KN-014).
- ❌ 2 workflows cùng `environment: github-pages` + `deploy-pages` — chỉ 1 deployer được giữ env này (KN-015).
- ❌ `node --check` ESM `.js` trên Node 18 fail do coi là CJS — phải check qua temp `.mjs` (KN-015).
- ❌ Gọi `fs.rename` folder trần trên Windows — watcher giữ handle → EPERM; dùng wrapper có fallback cp+rm (KN-016).
- ❌ Gặp EPERM rename mà kết luận "permission sai" — test PowerShell `Move-Item` trước để phân biệt watcher-lock vs ACL (KN-016).
- ❌ Chọn viewBox gần vuông (772×652) cho diagram — render tràn first-screen; ưu tiên ratio dẹt ≥1.7:1 (KN-017).
- ❌ Đổi viewBox width mà không tính scale text — width 1400 → scale 0.66 → text < 6px fail readability (KN-017).
- ❌ Đổi viewBox mà không rescale tọa độ y (messages/activations/segments) — messages rơi ngoài readable timeline (KN-017).
- ❌ Tin 9/9 showcase checks là đủ — nó không bao gồm browser containment; phải chạy `visual-check` với `ARCHIFY_CHROME` (KN-017).
- ❌ Redirect mọi conversation sang chatbot vì tiện — decollaboration diễn ra "never by decision, always by convenience" (KN-018).
- ❌ Để AI viết PRD/design 1 phát xong, không có framing đối lập — outsource writing = skip thinking (KN-018).
- ❌ Thưởng velocity mà không đo diversity — individual productivity tăng nhưng ideas thu hẹp (KN-018).
- ❌ Cắt workshop/travel/co-location khi budget căng — đó chính là hạ tầng của serendipity (KN-018).
- ❌ Đánh giá AI productivity bằng cảm nhận ("nhanh hơn hẳn!") không có metrics — METR: kỳ vọng +24%, thực tế −19% (KN-019).
- ❌ Claim "setup này xịn" mà không đo — trải nghiệm trôi chảy ≠ tiến độ thật (KN-019).
- ❌ Trust agent output vì "trông đúng" — không setup nào cho code đáng tin thiếu review (KN-020).
- ❌ Theo hype setup mới (model/skill/MCP) mà không benchmark trên codebase thật (KN-020).
- ❌ Nhồi phức tạp vì "AI giỏi mà" — AI loves overcomplicating things, job của mình là radically simplify (KN-020).
- ❌ Cứ tin deny-list bắt hết hành vi nguy hiểm — agent có vô số cách encode 1 hành vi (KN-021).
- ❌ Thêm rule policy vì "sợ" mà không có evidence vi phạm thật (KN-021).
- ❌ Gọi hệ thống là "agent" khi vẽ được flowchart trước khi chạy — pipeline giả danh, đắt và khó debug vô ích (KN-022).
- ❌ Trao model quyền chọn control flow cho path vốn đã biết — trả token để model deliberates về route mình đã biết (KN-022).
- ❌ Agency không có cheap check per-step — freedom không kiểm tra = nondeterminism không debug được (KN-022).
- ❌ Multi-agent reconciliation kiểu "whoever spoke last wins" — phải deterministic rule + conflict để lại thành record (KN-022).
- ❌ Tin self-report "mình đã check rồi" làm bằng chứng Done — intrinsic self-correction làm accuracy GIẢM, không tăng (KN-023, Huang ICLR 2024).
- ❌ Hỏi model "chắc chưa?" thay vì đo bằng tool — self-knowledge thua xa human, calibration không generalize sang task mới (KN-023, Yin ACL 2023 + Kadavath 2022).
- ❌ Để model tự chấm/review output của chính nó — self-preference có hệ thống, tương quan tuyến tính với self-recognition (KN-023, Panickssery 2024).
- ❌ Lặp nguyên output cũ khi user nói "vẫn lỗi" để chiều lòng — sycophancy do RLHF, phải đổi strategy + đo lại (KN-023, Sharma 2023).
- ❌ Tin benchmark vendor làm bằng chứng năng lực — benchmark chính là vùng pattern quen; đổi số/thêm mệnh đề nhiễu là sụt tới 65% (KN-023, GSM-Symbolic ICLR 2025).
- ❌ Chấm năng suất theo output đếm được (LOC, số file, số task) — prolific AI psychosis: hàng nghìn dòng code không utility, metrics thưởng output không thưởng value (KN-024, Jeff Clark MD).
- ❌ Tin "loss nhìn y win" — slot-machine reinforcement: output tự tin + rẻ khiến counterfeit wins không bị reject (KN-024).
- ❌ Merge code mà không hiểu nó hoạt động — "couldn't understand my own project" là dấu hiệu psychosis, phải STOP đọc lại/viết lại (KN-024).
- ❌ Outsource taste/craft cho AI — "taste is felt, not learned"; AI tiết kiệm $400k/năm nhưng phá brand visual (KN-024, Emily Oberg).
- ❌ Cắt sleep/life outside work để chạy theo AI hype — hyperfocus là triệu chứng psychosis, không phải feature (KN-024).
- ❌ Agent long-horizon không có procedural structure explicit — unconstrained generation tự quyết thứ tự → lạc, lặp vô ích (KN-025).
- ❌ Guidance dictate thay vì bias — graph ép solver làm theo, mất khả năng quyết của solver (KN-025).
- ❌ Self-evolution commit bừa không qua held-out validation + không giữ rejected edits → lặp lại lỗi cũ (KN-025).
- ❌ Chỉ dùng 1 tốc độ (chỉ state hoặc chỉ policy) — không có alternating loop fast state + slow policy (KN-026).
- ❌ Consolidate trực tiếp từ raw trajectory vào policy — không distill qua explicit textual state trước (KN-026).
- ❌ Hypothesis không falsifiable, không test qua interventions, không carry supported/rejected/inconclusive → overfit internal validation (KN-026).
- ❌ RL long-horizon chỉ nhồi agent-side SFT — không thử environment-side adaptation (FEEs) trước (KN-027).
- ❌ Chỉ đo per-run pass rate, không đo consistency gap all-5 vs per-run → tưởng reliable nhưng production flip (KN-027).
- ❌ Self-improvement phụ thuộc verified answers/external evaluator — không dùng SOLID majority pseudo-reference (KN-027).
- ❌ Bỏ qua intra-group feedback consistency — feedback trong group không consistent mà vẫn optimize → unstable (KN-027).

## Checklist phòng tránh chung

- [ ] Đã reproduce bug trước khi sửa?
- [ ] Đã tìm root cause (5 Whys)?
- [ ] Đã fix ở gốc, không chỉ patch UI?
- [ ] Đã test lại case cũ + case biên?
- [ ] Đã ghi `docs/knowleged.md` + `.agent/bugs/<slug>/bug.md`?
- [ ] Đã test như **user mới** (không dùng workaround, không đọc manual) — fresh eyes / LLM as normal user? (KN-005)
- [ ] Đã liệt kê mọi habitual mitigation mình đang làm và biến thành bug report? (KN-005)
- [ ] Đã nhờ người ngoài team thử không gợi ý? (KN-005)
- [ ] Đã có toggle sáng/tối với persist + early init chống flash? (KN-006)
- [ ] Đã test contrast ≥4.5:1 cả 2 theme (dark/light)? (KN-006)
- [ ] Đã giữ tiếng Việt có dấu chuẩn UTF-8 (không xóa dấu khi fix bug)? (KN-006)
- [ ] Đã polish menu với badge/grouping/aria-label? (KN-006)
- [ ] Đã `suggest "<từ khóa>"` và áp dụng KN liên quan trước khi code? (KN-007)
- [ ] PRD/Design đã ghi "Who did you think with?" + có ≥1 framing đối lập không prompt trước? (KN-018)
- [ ] Human vẫn là pilot-in-command — agent chỉ là crew, human quyết question + path + conclusions? (KN-018)
- [ ] Nếu gặp lỗi → đã `log --error` tạo bug draft ngay? (KN-007)
- [ ] Sau khi fix → đã `propose --bug` và đề xuất cập nhật `knowleged.md`? (KN-007)
- [ ] Đã `status` kiểm tra health (KN total, drafts)? (KN-007)
- [ ] Trước khi `dotnet build/test` đã tắt `dotnet run` đang giữ file chưa? (KN-008)
- [ ] Nếu gặp MSB3027/MSB3021 đã `Stop-Process` PID trên 5251 và `log` ngay chưa? (KN-008)
- [ ] Sau Random/Reset đã check tất cả button states (stepBtn enabled)? (KN-011)
- [ ] Test FAIL có sửa production code thay vì sửa test không? (KN-012)
- [ ] Trước khi edit test paths đã `policy-check` và được PERMITTED chưa? (KN-012)
- [ ] `audit.mjs verify` có chain OK không? (KN-012)
- [ ] PRD có dòng CẮT (YAGNI gate) không? (KN-013)
- [ ] Design có native-first (stdlib/native trước dep mới) không? (KN-013)
- [ ] Verify có grep dead-code + scoreboard diff stat không? (KN-013)
- [ ] Có cắt validation/security/a11y/test để giảm LOC không? Nếu có → STOP (KN-013)
- [ ] Smoke test có import module khởi động server (stdio/HTTP) không? Nếu có → đổi qua functions/spawn stdin đóng (KN-014)
- [ ] Self-verify đã chạy SAU khi mọi file được ghi (hoặc pre-checks + final)? (KN-014)
- [ ] Regex `^`/`$` trên nội dung multi-line đã có flag `m`? (KN-014)
- [ ] Chỉ 1 workflow có `environment: github-pages` + `deploy-pages`? Workflow data chỉ `contents: write`? (KN-015)
- [ ] `eval-gate` ESM `.js` đã check qua temp `.mjs` để robust Node 18/22? (KN-015)
- [ ] Claim "nhanh hơn/tốt hơn" đã có measured evidence (diff stat, loop count, cost) hay chỉ vibes? (KN-019)
- [ ] Output agent đã qua test/review gate trước khi trust, không tin vì "trông đúng"? (KN-020)
- [ ] Setup mới đã benchmark ≥2 cách (AAR) trước khi chốt, không theo hype? (KN-020)
- [ ] Rule/policy mới có evidence vi phạm thật, refused/false-positive có được đo không? (KN-021)
- [ ] Trước khi build "agent" đã hỏi "vẽ được flowchart không?" — vẽ được thì pipeline? (KN-022)
- [ ] Agency (nếu có) thỏa cả 2: outcome rẻ verify + verification để lại record bền vững? (KN-022)
- [ ] Claim "đã xong" có fresh evidence từ tool (build/test/đo), không phải self-report? (KN-023)
- [ ] Critique đến từ framing đối lập không prompt trước, không phải model tự review? (KN-023 + KN-018)
- [ ] User phản hồi tiêu cực → đã đổi strategy + đo lại bằng tool, không lặp output cũ? (KN-023)
- [ ] Task ra khỏi vùng pattern quen (code mới/domain lạ) → đã tăng cường verify? (KN-023)
- [ ] Đo năng suất bằng value thật (diff stat, rework, utility) chứ không phải LOC/số file? (KN-024)
- [ ] Đã reject "counterfeit wins" — output trông win nhưng chưa verify bằng tool? (KN-024)
- [ ] Hiểu code mình vừa merge không? Không hiểu → STOP, đọc lại/viết lại? (KN-024)
- [ ] Phần taste/craft (cảm nhận, thẩm mỹ) giữ human judgment ở gate cuối, không outsource? (KN-024)
- [ ] Agent long-horizon có explicit procedural structure (graph/workflow), không unconstrained generation? (KN-025)
- [ ] Self-evolution có held-out validation + rejected memory, không commit bừa? (KN-025)
- [ ] Self-evolution có 2 tốc độ: fast state (text) + slow policy (parametric) với alternating loop? (KN-026)
- [ ] Hypothesis falsifiable, test qua interventions, carry supported/rejected/inconclusive? (KN-026)
- [ ] Long-horizon RL đã thử environment-side adaptation (FEEs) trước khi nhồi agent-side SFT? (KN-027)
- [ ] Đã đo consistency gap (all-5 vs per-run) cho production reliability? (KN-027)
- [ ] Self-improvement không phụ thuộc verified answers — dùng SOLID majority pseudo-reference? (KN-027)
- [ ] Setup function (resize/init) đã được invoke ngay sau define, không chỉ addEventListener? (KN-028)
- [ ] Third-party CSS/fonts đã async (media=print onload / self-host) — không chặn script của trang? (KN-029)
- [ ] Overlay che nội dung đã có fail-safe tự mở khi engine fail (không kẹt màn đen)? (KN
- [ ] Bản reduced-motion vẫn "có nhịp" (opacity-only fades) + hint nói rõ lý do khi bị rút gọn? (KN-031)
- [ ] Timeline/overlay defer khi tab ẩn — không chạy vô hình? (KN-031)
- [ ] "Không thấy hiệu ứng" đã test trên đúng môi trường user (Edge thật/reduced-motion) + poll thay wall-clock? (KN-031)
- [ ] Engine rAF (canvas/animation) có browser test assert no-pageerror/console-error không? (KN-032)
- [ ] Animation freeze → đã nghi lỗi async (rAF) trước khi nghi logic? (KN-032)-029)
- [ ] Skip click-anywhere đã có grace period chống click nhầm? (KN-029)
- [ ] Mọi fetch trong `www/` chỉ trỏ tài nguyên TRONG `www/` (ngoài thì mirror vào)? (KN-030)
- [ ] Fetch dùng `dirBase` — test cả URL không slash cuối + `.html` + `/`? (KN-030)
- [ ] Spec assert network không-404 (không chỉ UI text — fallback demo che bug)? (KN-030)
- [ ] Hiệu ứng toạ độ (canvas/parallax) đã có assert geometry (buffer == display size)? (KN-028)
- [ ] Đã chụp screenshot từng stage animation làm visual evidence trước khi claim Done? (KN-028)
- [ ] Playwright đã stub7:20:00Z — Maintained by YUNIE / Harness v2 — KN-031 added (user report "Edge PC không thấy hiệu ứng, phone thấy": Windows tắt Animation effects → reduced-motion → bản rút gọn quá tay; fix calm fade + hint + defer tab ẩn + Edge-real spec)st deterministic? (KN-028)

*File này do `/fixbug` tự động cập nhật. Mọi luồng khác phải đọc để không lặp lại lỗi cũ.*
*UpdatedAt: 2026-09-10T16:55:00Z — Maintained by YUNIE / Harness v2 — KN-030 added (user console 404: fetch ngoài deploy root + relative URL không slash cuối — mirror www/cosmos/audit.json + dirBase helper; spec assert network no-404) — KN-029 added (Google Fonts script-blocking chặn toàn bộ inline script — async fonts + fail-safe + grace period) — KN-028 added (intro COSMOS cinematic: canvas quên invoke resize() → burst từ góc + 8/8 behavior test xanh giả — visual evidence bắt; verify screenshot từng stage + stub fonts cho test deterministic) — KN-025/026/027 added (10 papers self-improving 2026-09-08/09: Procedural Graphs + A-JIT, Experience Funnel + ADMET-EvO, FEEs + Consistency Gap + SOLID — chi tiết www/library/export.json 10 arXiv books) — KN-024 added (prolific AI psychosis — output rẻ làm mù khả năng đánh giá; taste/craft là human judgment — Jeff Clark MD + Emily Oberg, chi tiết docs/llm-weakness-research.md §2b) — KN-023 added (model "giỏi ngọn yếu gốc" — 6 papers arXiv: self-correction fail, self-knowledge gap, calibration không generalize, self-preference, sycophancy, pattern-matching reasoning — chi tiết docs/llm-weakness-research.md) — KN-022 added (pipeline in a trench coat — agency cost-based test, DEV.to James Anderson) + KN-021 bổ sung lộ trình Grith risk-score (allow/queue/deny + supervision-escape) — KN-019/020/021 added (bài học từ "My Little AI Factory" dominis.blog + METR study: measured > perceived, trust hard, governance evolve) — KN-015 added (Pages 2 workflows + eval-gate Node 18 CJS) — KN-014 added (MCP stdio smoke hang + verify order + regex m flag — DisCo Phase 3) — KN-013 added (Ponytail ladder integration: minimal-ladder + lean-product) — Fix: Bảng tóm tắt reorder KN-005↔KN-006 + thêm KN-009 (đã có detail nhưng thiếu ở bảng) — Presets bổ sung auto-researcher (đồng bộ registry) — KN-011 added (Random disable Step button) — KN-010 added (AAR pattern) — KN-009 bổ sung detail section (slot máy chủ AI — hardcode config) — KN-008 added (dotnet build file lock MSB3027) — KN-007 added (Auto-Learn) — KN-006 added (N5 UI polish) — KN-005 added (Bug Blindness)*
