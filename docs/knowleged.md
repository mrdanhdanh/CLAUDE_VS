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

*File này do `/fixbug` tự động cập nhật. Mọi luồng khác phải đọc để không lặp lại lỗi cũ.*
*UpdatedAt: 2026-09-04T09:50:00Z — Maintained by YUNIE / Harness v2 — KN-015 added (Pages 2 workflows + eval-gate Node 18 CJS) — KN-014 added (MCP stdio smoke hang + verify order + regex m flag — DisCo Phase 3) — KN-013 added (Ponytail ladder integration: minimal-ladder + lean-product) — Fix: Bảng tóm tắt reorder KN-005↔KN-006 + thêm KN-009 (đã có detail nhưng thiếu ở bảng) — Presets bổ sung auto-researcher (đồng bộ registry) — KN-011 added (Random disable Step button) — KN-010 added (AAR pattern) — KN-009 bổ sung detail section (slot máy chủ AI — hardcode config) — KN-008 added (dotnet build file lock MSB3027) — KN-007 added (Auto-Learn) — KN-006 added (N5 UI polish) — KN-005 added (Bug Blindness)*
