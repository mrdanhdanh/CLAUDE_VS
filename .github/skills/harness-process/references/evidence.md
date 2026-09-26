# Evidence — harness-process (DisCo arXiv:2609.02749v1 §3.2 (task-agnostic))

> Substrate layer của skill — full text từ docs/knowleged.md. Sinh tự động 2026-09-26T07:20:33.352Z.

## Bug reports liên quan (17/67 bugs)

- `.agent/bugs/2026-08-30-bug-blindness/bug.md` — Bug: Bug Blindness — mù bug do workaround vô thức + fan bias
- `.agent/bugs/2026-09-03-rag-export-missing-grounding-chet/bug.md` — Bug: RAG export missing grounding chet
- `.agent/bugs/2026-09-04-import-mcp-stdio-server-trong-smoke-test-gay-treo-/bug.md` — Bug: Import MCP stdio server trong smoke test gay treo + verify order + regex m flag
- `.agent/bugs/2026-09-06-archify-skill-port/bug.md` — Bug: Archify skill port — (A) EPERM rename trên Windows + (B) diagram tràn first-screen
- `.agent/bugs/2026-09-11-ps-5-1-khong-ho-tro-trong-lenh-powershell/bug.md` — Bug: PS 5.1 khong ho tro ?? trong lenh PowerShell
- `.agent/bugs/2026-09-12-academy-content-not-actionable/bug.md` — Bug — Content 7 bài Agentic Academy "đúng chữ nhưng không chạy được"
- `.agent/bugs/2026-09-13-git-checkout-head-revert-nham-refactor-chua-commit/bug.md` — Bug: git checkout HEAD -- revert nhầm refactor chưa commit của auto-learn.mjs
- `.agent/bugs/2026-09-13-kn-recurrence-no-guard/bug.md` — Bug: Bug tái lập dù đã có KN — không gì phát hiện "tái lập" + KN không có lưới (kèm phép đo severity hỏng 0/55)
- `.agent/bugs/2026-09-14-echoverse-co-evolution-check-do-doc-2-lan-world-fi/bug.md` — Bug: Echoverse — co-evolution: check đỏ đọc 2 lần theo tầng (code · test · env · đo), sửa 'world' trước; guard phải sâu + held-out
- `.agent/bugs/2026-09-14-kn-id-double-yield-da-phien-cung-1-id/bug.md` — Bug: KN ID double-yield — 3 phiên song song cùng nhận 1 ID, thiếu detector integrity
- `.agent/bugs/2026-09-14-orchard-verify-train-trong-harness-that-stand-in-m/bug.md` — Bug: Orchard verify-train trong harness that - stand-in mismatch
- `.agent/bugs/2026-09-15-dream-rsi-history-la-simulator-dream-policy-zero-c/bug.md` — Bug: Dream-RSI: replay history = simulator zero-cost — dream policy thay vì chạy lại (draft)
- `.agent/bugs/2026-09-16-instruction-budget-always-on-phinh-khong-nguong/bug.md` — Bug/Lesson: instruction budget always-on phình không ngưỡng
- `.agent/bugs/2026-09-18-instruction-budget-gate-fail-open-voi-arg-khong-ph/bug.md` — Bug: instruction-budget gate fail-open voi arg khong phai so
- `.agent/bugs/2026-09-23-space-bunny-mo-ta-sai/bug.md` — Bug: space-bunny-mo-ta-sai
- `.agent/bugs/2026-09-25-power-sweep-false-green-liveness-khong-phai-health/bug.md` — Bug: power sweep false green — liveness không phải health
- `.agent/bugs/2026-09-25-setup-doctor-windows-port-probe-noise/bug.md` — Bug: setup-doctor Windows port probe noise

## Full KN details

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

---

### KN-007 — Thiếu hệ thống tự học hỏi tự động — phải làm tay, dễ quên

- **Ngày:** 2026-08-30
- **Bug report:** N/A — feature (không phải bug): hệ thống auto-learn — `.github/harness/scripts/auto-learn.mjs` + instruction + agent (không có bug dir)
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
- **Guard (review 2026-09-18):** `tests/e2e/auto-learn-guard.spec.ts` — suggest smoke (query quen thuộc → trả KN liên quan) + dogfood pipeline log/propose/guards/evaluate.
- **Tags:** `process` `knowledge` `automation` `dx`
- **Người ghi:** YUNIE / auto-learn

---

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
  - Tạo demo page `www/aar/index.html` so sánh AAR vs Harness v2.
  - Chi phí: $0 (local scripts) thay vì $4/hour (AAR API inference).
- **Cách phòng tránh:**
  - Khi có nhiều cách fix/solve (≥2): luôn áp dụng AAR pattern — propose 3 → benchmark → keep best.
  - 3-fix limit vẫn áp dụng (học từ systematic-debugging): nếu cả 3 cách fail → STOP, question architecture.
  - Check **HOW** (cách làm) không chỉ **WHETHER** (pass/fail) — tránh reward hacking.
  - Log benchmark results vào `.agent/plans/aar-harness/report-<slug>.md` (qua `auto-researcher.mjs --report`).
  - `auto-researcher.mjs --task "xxx" --report` để chạy full AAR loop.
- **Tags:** `process` `self-improving` `benchmark` `aar` `automation`
- **Người ghi:** YUNIE / auto-researcher

---

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

---

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

---

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

---

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

---

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
  - **Bổ sung (Science persuasion, 2026-08-20):** bằng chứng thực nghiệm cho Why3 (RLHF ưu tiên câu thuyết phục hơn câu đúng): post-training để thuyết phục → persuasion **+51%** nhưng **giảm trung thực có hệ thống** (accuracy giảm ở đúng chỗ persuasion tăng); cơ chế thắng của chatbot = **fact-density** (claims kiểm chứng được / conversation — R²≈0.89) + tốc độ viết; ép về tốc độ+dài bằng người → lợi thế 0.0pp; Claude bịa chi tiết luật (Đức/Scotland) khi thuyết phục. → Luật YUNIE: **inform ≠ manipulate** — không dùng mật độ facts/nịnh để "thắng" user (mirror `yunie-personality` §15); model thuyết phục giỏi càng phải verify chặt (KN-019: tin vào fluency = bug). Nguồn: Science 20/08/2026 — mirror `www/ai-news/curated.json` (curated-science-persuasion-fact-density).
- **Tags:** `process` `research` `verification` `calibration`
- **Người ghi:** YUNIE / auto-learn

---

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

---

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
- **Guard (review 2026-09-18):** `tests/e2e/self-evolving-tools.spec.ts` — smoke + fail-closed (`--refine` dry exit 0, `--guide` thiếu node → exit 2). **Disclosure: không phải behavioral lock đầy đủ** — tool còn chạy đúng usage contract, không lock chất lượng thuật toán.
- **Tags:** `process` `agent` `self-evolving` `procedural-graph` `a-jit`
- **Người ghi:** YUNIE / auto-learn

---

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
- **Guard (review 2026-09-18):** `tests/e2e/self-evolving-tools.spec.ts` — smoke + fail-closed (`evidence` outcome rác → exit 2, unknown command → exit 2). **Disclosure: không phải behavioral lock đầy đủ** (không assert chất lượng distill/consolidate).
- **Tags:** `process` `self-evolving` `memory` `evidence` `funnel`
- **Người ghi:** YUNIE / auto-learn

---

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
- **Guard (review 2026-09-18):** `tests/e2e/self-evolving-tools.spec.ts` — smoke stateless (`--solid` → cluster + pseudo-reference; không ghi `.agent/`). **Disclosure: không phải behavioral lock đầy đủ** (chưa đo gap thật qua --check).
- **Tags:** `process` `rl` `consistency` `self-distillation` `verification` `scaffold`
- **Người ghi:** YUNIE / auto-learn

---

### KN-033 — Recursive Self-Improvement — Roadmap 5 tầng autonomy + Research RSI (2609.11873v1, 2609.10702v1)

- **Ngày:** 2026-09-11
- **Bug report:** N/A — bài học rút từ 2 papers arXiv (chi tiết: `www/library/export.json` arxiv-2609.11873v1 + 2609.10702v1, nguồn `books/papers/`)
- **Severity:** major
- **Triệu chứng:** Hệ "self-improving" chỉ cải thiện capability ở instance hiện tại, không cải thiện chính quá trình cải thiện; không biết mình đang ở tầng autonomy nào; "học được" đo bằng performance quen thuộc — recovering familiar performance nhưng unseen inputs vẫn không dùng được computation đã học.
- **Nguyên nhân gốc (5 Whys):**
  - Why1: RSI bị hiểu hẹp — chỉ "improve capability", thiếu nửa sau: improve the **process** of future improvement.
  - Why2: Thiếu khung đo tầng: improvement-execution → improvement-strategy → experience-acquisition → environment-adaptation → recursive meta-improvement (5 mức).
  - Why3: LLM hiện tại "headroom closed" (HCI) — không tự tạo bước nhảy năng lực từ bên trong.
  - Why4: Generalization test kém: controlled tasks cho thấy recover familiar performance ≠ unseen inputs dùng được learned computations.
  - Why5 (Root): Thiếu principle-guided loop — experience phải tổ chức theo contextual dependencies cần cho prediction; tách riêng design (visible information / supervision / preservation) và test (learning / generalization / retention).
- **Cách sửa:** Áp khung RSI: xác định tầng autonomy hiện tại → nâng dần; scenario-specific (software engineering ≠ scientific discovery ≠ embodied intelligence — tốc độ khác nhau); Research RSI — principle discovery → principle-guided improvement; continuation seeds từ cùng parent outperform ordinary continuation (42.02 → 42.25 qua 2 generations).
- **Cách phòng tránh:**
  - Tự đánh giá "self-improving" theo 5 tầng autonomy — đang ở tầng nào, tầng sau là gì.
  - Không đòi meta-improvement khi mới ở execution autonomy (bỏ bước → ảo giác năng lực).
  - Claim "học được" phải test riêng 3 thứ: learning / generalization / retention — không dùng performance quen thuộc.
  - Cải thiện phải lưu vào process (knowleged/skills/harness), không chỉ fix instance — nửa giá trị RSI là process improvement.
  - Scenario-specific: không copy timetable/approach giữa các domain khác tốc độ.
- **Tags:** `process` `research` `rsi` `self-improving`
- **Người ghi:** YUNIE / auto-learn

---

### KN-034 — Ecdysis — Failure diagnosis: model-specific vs harness-level, aggregate cross-task (2609.11677v1)

- **Ngày:** 2026-09-11
- **Bug report:** N/A — bài học rút từ 1 paper arXiv (chi tiết: `www/library/export.json` arxiv-2609.11677v1, nguồn `books/papers/`)
- **Severity:** major
- **Triệu chứng:** Harness evolution bằng iterative search trên từng failure riêng lẻ → time overhead lớn (repeated agent executions + code modifications) + overfit observed tasks/specific failure patterns → degrade generalization to unseen tasks; sửa mãi một failure mà root là systemic vẫn tái diễn.
- **Nguyên nhân gốc (5 Whys):**
  - Why1: Sửa theo instance → mỗi fix chỉ cover task đã thấy.
  - Why2: Vì không phân biệt failure là model-specific deficiency hay systematic harness deficiency.
  - Why3: Không phân biệt → vì thiếu principled failure diagnosis.
  - Why4: Fix đơn lẻ sinh "unnecessary model-specific accommodation" — thay vì repair harness cấp hệ thống.
  - Why5 (Root): Thiếu batch-level cross-instance failure aggregation: recurring cross-task failure patterns mới là tín hiệu harness-level thật.
- **Cách sửa:** Gom failure evidence từ nhiều task instance cùng lúc → phân tích aggregated → tìm recurring cross-task pattern (harness deficiency) vs one-off (model-specific); multi-role diagnosis (Failure-Driven Collaborative Refinement) → refine harness modification spec lặp tới khi ổn. Kết quả paper: 1.84x speedup harness training + 18.56% reasoning accuracy.
- **Cách phòng tránh:**
  - Failure lặp ≥2 task → aggregate cross-task TRƯỚC khi sửa — tìm pattern chung thay vì fix từng case.
  - Phân loại rõ trước khi fix: model-specific (prompt/context) hay harness-level (process/script/gate thiếu)?
  - Fix harness-level = thêm gate/check/step vào process — không chỉ hạ prompt riêng lẻ.
  - Verify fix trên UNSEEN tasks — không chỉ re-test task đã fail (kháng overfit).
  - Đo cả chi phí (speedup) lẫn chất lượng (accuracy) — không đánh đổi mù.
- **Tags:** `process` `harness` `failure-diagnosis` `self-evolving`
- **Người ghi:** YUNIE / auto-learn

---

### KN-035 — Negative Self-Distillation — học bằng tránh flaws, giữ uncertainty (2609.11699v1)

- **Ngày:** 2026-09-11
- **Bug report:** N/A — bài học rút từ 1 paper arXiv (chi tiết: `www/library/export.json` arxiv-2609.11699v1, nguồn `books/papers/`)
- **Severity:** major
- **Triệu chứng:** Self-improvement kiểu "imitate solution đúng" (có privileged info) → model tự tin giả tạo, suppress uncertainty, phạt exploratory + self-corrective behavior → complex reasoning giảm; học từ example đúng làm mất khả năng nghi ngờ đúng chỗ.
- **Nguyên nhân gốc (5 Whys):**
  - Why1: Student bị ép imitate trace "artificially confident" → distribution méo.
  - Why2: Confidence giả từ privileged-info conditioning → suppress expressions of uncertainty.
  - Why3: Penalize exploratory/self-corrective behaviors — chính thứ cần để giải bài khó.
  - Why4: Unlearning naive phạt mọi flawed token → confound với linguistic tokens → hỏng năng lực ngôn ngữ nền.
  - Why5 (Root): Thiếu cơ chế học âm có gate — diverge khỏi flawed reasoning + chỉ nhắm reasoning-critical tokens.
- **Cách sửa:** NSD pattern: model tự sinh negative condition (vd "careless reasoner") → push distribution away khỏi negative teacher; dynamic gating tự nhận diện + isolate reasoning-critical tokens → gradient chỉ đánh behavioral flaws, giữ linguistic priors; không cần ground-truth/external evaluator; outperform OPSD + label-free self-bootstrapping RL baselines.
- **Cách phòng tránh:**
  - Khi dạy (prompt/few-shot/reflect): đừng imitate "trace trông hoàn hảo" — giữ chỗ cho uncertainty + exploration.
  - Ví dụ âm (failure case) giá trị cao — nhưng phải chỉ đích danh flaw (flaw-targeted), không phủ nhận toàn bộ output.
  - Không suppress "tôi không chắc" — uncertainty đúng chỗ là capability, không phải lỗi.
  - Học từ lỗi: tách "lỗi hành vi reasoning" khỏi "phần ngôn ngữ/diễn đạt đúng" — chỉ sửa phần lỗi (paper: gate token; người: gate scope).
  - Ưu tiên học từ flaws tự sinh (self-generated negatives) hơn phụ thuộc reference đúng hoàn hảo.
- **Tags:** `process` `self-distillation` `reasoning` `uncertainty`
- **Người ghi:** YUNIE / auto-learn

---

### KN-036 — Auto-RecSys + Cognitive Digital Twin — cognitive-procedural separation + dual-loop evolution (2609.10922v1, 2609.09625v1)

- **Ngày:** 2026-09-11
- **Bug report:** N/A — bài học rút từ 2 papers arXiv (chi tiết: `www/library/export.json` arxiv-2609.10922v1 + 2609.09625v1, nguồn `books/papers/`)
- **Severity:** major
- **Triệu chứng:** Long-horizon autonomous research: feedback loop dài (training vài ngày) → serial iteration bất khả thi; system phức tạp + fragile infra → execution fail không recoverable; LLM tự do sinh cả reasoning lẫn operation → fail operational correctness; experience không tích lũy nếu playbook chỉ giữ success.
- **Nguyên nhân gốc (5 Whys):**
  - Why1: Serial exploration → vì không có distributed asynchronous execution (parallel experiments).
  - Why2: State mất khi failure/session → vì không có centralized cross-server memory persistent + recoverable.
  - Why3: LLM tự do sinh cả reasoning lẫn operation → vì KHÔNG tách cognitive (NL skill files) khỏi procedural (deterministic scripts enforce correctness).
  - Why4: Experience không tích lũy → vì thiếu dual-loop: Execution Evolution (playbook ghi cả failed attempts + crystallize successes) + Idea Evolution (outcomes inform ideation).
  - Why5 (Root): Feedback chưa đóng vòng lên chính representation: CDT — operational feedback phải refine cognitive experience VÀ update relationships/annotations → task sau evolve theo operation.
- **Cách sửa:** Áp 3 harness designs: (1) parallel/async hóa chỗ được, (2) memory persistent + recoverable xuyên failure, (3) cognitive-procedural separation — skill file (NL) hướng dẫn reasoning, script deterministic enforce operational correctness (đúng kiến trúc Harness v2: skills = HOW, scripts = checks). Dual-loop: playbooks ghi failed + success; outcomes nuôi ideation. CDT: mỗi vòng operation update cả knowledge lẫn representation.
- **Cách phòng tránh:**
  - Reasoning (LLM) và correctness (script deterministic) phải tách path — đừng để LLM tự enforce operational invariants.
  - Playbook phải ghi cả FAILED attempts, không chỉ successful pipelines — failed attempts là nửa knowledge.
  - Memory persistent + recoverable xuyên session/failure — không để state chỉ nằm trong 1 run.
  - Long loop → tìm cách parallel + async hóa thay vì chờ serial.
  - Feedback loop phải đóng lên CẢ 2: experience refinement + representation update (quan hệ/annotation) — không chỉ append experience.
- **Tags:** `process` `harness` `architecture` `self-evolving` `playbook`
- **Người ghi:** YUNIE / auto-learn

---

### KN-037 — Evals Gap — "single biggest predictor" là evals discipline (Andrew Ng, Agentic AI Playbook 2026)

- **Ngày:** 2026-09-11
- **Bug report:** N/A — bài học từ Andrew Ng "Agentic AI" (DeepLearning.AI — bản free ~1h48m "complete playbook to become an AI agentic engineer", viral 2026): `books/Andrew-Ng-Agentic-AI-Playbook-2026-Distilled.md` (đã nạp `www/library/export.json`)
- **Severity:** major
- **Triệu chứng:** Verify xanh toàn bộ (build/test/lint pass + visual check) nhưng output agent vẫn kém — plan decompose sai, tool gọi sai chỗ, report vô dụng; không ai phát hiện vì không có thước đo chất lượng open-ended. Cùng loại lỗi tái diễn qua nhiều task vì fix từng instance không error analysis (lặp KN-034).
- **Nguyên nhân gốc (5 Whys):**
  - Why1: Verify hiện tại đo WHETHER (chạy được: pass/fail binary) — không đo HOW WELL (chất lượng kết quả).
  - Why2: Agent output là open-ended qua multi-step process → không đo được bằng build/lint/test như classification accuracy.
  - Why3: Thiếu framework evals 2 tầng: component-level (từng bước đúng chưa?) + end-to-end (goal đạt chưa?).
  - Why4: Thiếu error analysis — failures không được aggregate thành pattern → sửa triệu chứng từng instance (KN-034).
  - Why5 (Root): Pipeline không có Evals Gate — verification dừng ở "technical pass", không tiến tới "quality pass". Ng: *"The single biggest predictor of whether someone executes well with AI agents is their ability to drive a disciplined process for evals and error analysis."*
- **Cách sửa:** Thêm **Evals Gate** (skill `evals-gate`) vào Verify: (1) rubric tiêu chí cụ thể viết TRƯỚC khi đo; (2) component evals — mỗi bước pipeline tự verify phần mình; (3) E2E evals — chạy scenario thật, đo goal achieved; (4) error analysis — ≥2 failures cùng loại → aggregate → fix pattern (KN-034); (5) đo latency/cost khi task nặng (KN-019). Kèm decision tree chọn pattern có chủ đích: Reflection (rubric + nguồn ngoài model — KN-023) · Tool Use · Planning · Multi-Agent — vẽ được flowchart → pipeline, đừng thêm agent loop (KN-022).
- **Cách phòng tránh:**
  - Trước Verify: viết rubric tiêu chí cụ thể — không đánh giá "trông ổn", không để model tự khen mình (KN-023).
  - Component evals: plan đúng chưa → implement đúng chưa → output đúng chưa — verify từng bước, không chỉ nhìn kết quả cuối.
  - E2E evals: chạy scenario thật từ đầu đến cuối, đo goal achieved — build xanh ≠ chất lượng.
  - Error analysis: failures cùng loại ≥2 → aggregate TRƯỚC khi fix (KN-034); fix pattern không fix instance.
  - Chọn pattern có chủ đích theo task, không mặc định thêm agentic loop (KN-022).
  - Claim "nhanh hơn/tốt hơn" phải kèm số đo — không vibes (KN-019).
  - **Trạng thái wire (review 2026-09-18):** Evals Gate hiện **prompt-enforced** (verify.prompt + skill `evals-gate`) — `eval-gate.mjs` trong generate-status là **smoke syntax/MCP**, KHÔNG phải rubric/component/E2E evals → gate máy cho evals còn yếu (disclosure chủ đích — tránh tên gate tạo cảm giác "đã gated").
  - **Update 2026-09-22 (Harness 2.5 — update disclosure):** gate máy đã mạnh lên: `eval-gate --scope components` chạy registry `.github/harness/evals/components.json` (7 mắt xích, expectations đo thật) + `--scope grounding` (fact-grader: số/quote phải có trong sources — invented = fail, học Opus 5.5 22/09); `--scope all` gồm components (generate-status). Guard: `tests/e2e/eval-gate-components.spec.ts`. Lưu ý phát hiện cùng ngày: eval-gate **fail-silent trên Windows** (isMain `split('/')` — exit 0 không chạy gì; đã fix class 10 script + guard "phải in output") — xem bug `.agent/bugs/2026-09-22-eval-gate-fail-silent-tren-windows-ismain-backslas/`.
- **Tags:** `process` `verification` `evals` `agentic-patterns`
- **Người ghi:** YUNIE / auto-learn

---

### KN-039 — PS 5.1 không hỗ trợ `??` — lệnh PowerShell fail parse "Unexpected token"

- **Ngày:** 2026-09-11
- **Bug report:** `.agent/bugs/2026-09-11-ps-5-1-khong-ho-tro-trong-lenh-powershell/bug.md`
- **Severity:** major
- **Triệu chứng:** Lệnh PowerShell fail ngay khi parse: `Unexpected token '??' in expression or statement` (kèm `Missing closing '}'`). Dính 2 lần trong 1 session: (1) verify URL `($code ?? 'NO-RESP')`; (2) kill port 3187 `($p.ProcessName ?? 'unknown')` — lệnh không chạy, phải viết lại + re-run.
- **Nguyên nhân gốc (5 Whys):**
  - Why1: Lệnh chứa `??` — null-coalescing, cú pháp PowerShell 7+.
  - Why2: Máy chạy Windows PowerShell 5.1 (`powershell`) — không hỗ trợ `??`, `?.`, `??=`, ternary `? :`.
  - Why3: Agent sinh lệnh theo thói quen JS/TS (`??` quen tay) — training data nghiêng cú pháp hiện đại.
  - Why4: Rule §5d chỉ cấm `&&`, chưa nêu `??`/`?.`/ternary → không có guardrail khi sinh lệnh.
  - Why5 (Root): Thiếu "PS 5.1 syntax contract" đầy đủ trong rule + chưa có KN → lặp lại cùng lỗi.
- **Cách sửa:** Rewrite ngay: `($x ?? 'default')` → `if (-not $x) { $x = 'default' }` (hoặc `$y = if ($x) { $x } else { 'default' }`); grep sweep `??` trong ngữ cảnh PowerShell → 0 sót; bổ sung rule §5d + KN-039.
- **Cách phòng tránh:**
  - Sinh lệnh PowerShell: **ad-hoc** — kiểm `$PSVersionTable` trước (Major ≥7: cú pháp hiện đại OK; session 5.1 → viết 5.1); **artifact commit repo** (.ps1/workflow/snippet docs) — giữ 5.1 floor: `??` → `if (-not ...)`, `?.` → `if ($a -and $a.b)`, ternary → if/else, `&&` → `;`.
  - `??` trong `.mjs`/Node vẫn hợp lệ — chỉ cấm trong LỆNH PowerShell / `.ps1`.
  - Gặp `Unexpected token '??'` → viết lại TOÀN lệnh rồi mới re-run, không lặp y nguyên (KN-023).
  - Trước Done: grep sweep lệnh mới sinh (plan/docs/session) xem còn cú pháp PS 7.
- **Tái lập class 2026-09-13 (hooks.json → subexpression):** Stop hook lỗi `The term 'lu?i' is not recognized...` — 2 lệnh echo trong `.github/hooks/hooks.json` chứa `()` (`... log (tự RADAR tái lập)` + `... GUARD (lưới chống tái lập: guards)`) → PowerShell parse thành **subexpression**, tìm command tên `lưới`. RADAR (KN-056) bắt đúng class: [KN-039] score 93.5 + bug cũ ps-5-1 score 178.6. **Vì sao lưới cũ miss:** §5d là văn xuôi cho "lệnh gõ terminal" — hooks.json là code chạy qua shell ở bề mặt khác, không spec nào đọc. **Fix:** bỏ ngoặc khỏi hook message + regenerate `.claude/settings.json` qua `export-claude`. **Guard (lưới máy):** `tests/e2e/hooks-integrity.spec.ts` — 2 test: hooks.json mọi command metachar-free + timeout dương · `.claude/settings.json` không drift. Bug: `.agent/bugs/2026-09-13-stop-hook-loi-dau-ngoac-trong-lenh-echo-bi-powersh/`.
- **Guard:** `tests/e2e/hooks-integrity.spec.ts`
- **Cập nhật 2026-09-12 (local pwsh 7.6.6):** cài pwsh **7.6.6** user-space — tải zip win-x64 từ GitHub release → extract `%LOCALAPPDATA%\Programs\PowerShell\7.6.6` (ZipFile + Unblock-File, không cần admin) + user PATH; VS Code user settings: `terminal.integrated.defaultProfile.windows` + `automationProfile.windows` = "PowerShell 7". **Đo trên 7.6.6:** `??` ✅ · `&&` ✅ · `?.` ⚠️ — `$var?.prop` (không brace) bị tokenizer nuốt `?` vào tên biến → kết quả sai lặng (`$s='abc'; $s?.Length` → 0, không phải 3); phải viết `${var}?.prop`. `.Length`/`.Count` trên `$null` → 0 (intrinsic) — dễ nhầm với giá trị thật. **Từ PS 5.1 gọi pwsh `-Command` chứa `"` → quote bị nuốt** (native arg mangling — đo được 2 lần) → dùng `-File` hoặc mở terminal pwsh trực tiếp. **Contract phân tầng (đồng bộ §5d `copilot-instructions.md`):** lệnh ad-hoc — kiểm `$PSVersionTable` trước (Major ≥7 → cú pháp hiện đại OK); artifact commit repo (.ps1/workflow/snippet docs) — giữ **5.1 floor** (portability).
- **Tags:** `process` `dx` `windows` `powershell` `scripts` `hooks`
- **Người ghi:** YUNIE / /fixbug

---

### KN-043 — Content "đúng chữ nhưng không chạy": path thiếu prefix IDE + thiếu neo ngữ cảnh + khái niệm bị chấm nhưng chưa dạy

- **Ngày:** 2026-09-12
- **Bug report:** `.agent/bugs/2026-09-12-academy-content-not-actionable/bug.md` · Review đầy đủ: `.agent/plans/agentic-academy/verify/content-review.md`
- **Severity:** major
- **Triệu chứng:** Content review 7 bài Agentic Academy (rubric fresh-eyes + Critic agent độc lập) phát hiện 6 blocker + 10 major — người mới đọc hiểu ~60% "cần làm gì":
  1. "Tạo `docs/agent-notes.md`" — không nói tạo trong **project nào** (bài đầu tiên, điểm neo quan trọng nhất lại mơ hồ nhất).
  2. `skills/code-review/SKILL.md` — **thiếu prefix**; làm đúng chữ → folder `skills/` ở root → **không IDE nào đọc** → chính tiêu chí "auto-trigger" fail ngay.
  3. Bước "review the demo file" — **file không tồn tại** ở đâu trong khóa → bước thực hành bất khả thi.
  4. "Cài IDE bạn chọn" — không có link tải, không nói cần tài khoản/chi phí, không nói cần Node.js.
  5. "component/E2E evals", "PRD mini" — **bị chấm trong tiêu chí nhưng chưa từng được dạy**.
  6. Mâu thuẫn: K2 đòi 1 IDE, K3 criteria + K7 checklist đòi ≥ 2 IDE; homepage "vào bài nào cũng được" mâu thuẫn phụ thuộc thật.
  7. Tiêu chí "rỗng nghĩa": "không có secret trong config" — đương nhiên đạt vì bài vừa viết config không secret.
- **Nguyên nhân gốc (5 Whys):**
  - Why 1: Tác giả tự đọc lại không thấy bug → vì **curse of knowledge**: path `skills/` "hiển nhiên" nằm trong `.github/` với người viết, nhưng người copy chữ nguyên văn thì sai.
  - Why 2: Tự review không bắt được → vì self-review là thiên vị có hệ thống (KN-023) — cần fresh eyes / Critic **độc lập**.
  - Why 3: Không có công cụ kiểm cho người mới → vì tiêu chí viết là "đủ nội dung" chứ không phải "làm được" — thiếu checklist 4 câu (Cần trước gì · Làm ở đâu · Bằng gì · Kiểm thế nào).
  - Why 4 (Root): **Hướng dẫn viết từ góc nhìn người-đã-biết, không từ góc nhìn người-sẽ-làm**; path/khái niệm/yêu cầu xuyên bài không được verify chéo như code được verify.
- **Cách sửa:** Rubric 6 tiêu chí viết TRƯỚC → Critic agent đọc độc lập (context riêng) → hội tụ findings → sửa: slide "Trước khi bắt đầu — chuẩn bị 3 thứ" + Bước 0 chốt folder "xưởng" (Bài 1); chip **"🧩 Cần trước"** trên cover mọi bài (data `need`) + chip "Cần: 1 project" homepage; path prefix đúng IDE (`.github/skills/…` + biến thể `.agents/`/`.claude/`); link tải 4 IDE official + note tài khoản/free + Node.js 18+; gloss mọi thuật ngữ (state/hybrid/least-privilege/RAG/KN-XXX); chốt "1 IDE bắt buộc, IDE 2 = điểm cộng"; tiêu chí rỗng nghĩa → hành động đo được. Khóa bằng test (chip Cần trước + chip prep homepage): spec 10/10, full suite 70/70.
- **Cách phòng tránh:**
  - Mọi hướng dẫn (docs/tutorial/slide) phải trả lời đủ **4 câu**: **Cần trước gì · Làm ở ĐÂU · Làm bằng GÌ · KIỂM bằng gì** — thiếu 1 câu = blocker.
  - Path trong hướng dẫn phải **copy-chạy được**: prefix đầy đủ theo IDE — viết xong **grep lại từng path** trong bài trước khi ship.
  - Khái niệm xuất hiện trong tiêu chí/outcome phải được **dạy trước đó hoặc gloss tại chỗ**.
  - Yêu cầu xuyên bài (số IDE, prereq, path) phải **nhất quán** — grep chéo trước khi ship.
  - Tiêu chí hoàn thành phải **đo được** (hành động + đối tượng + kết quả quan sát), không "đương nhiên đạt".
  - Nội dung dạy người mới phải qua **fresh-eyes reader / Critic agent độc lập** TRƯỚC khi ship — như code review (KN-005 áp cho docs).
- **Tags:** `content` `docs` `verify` `fresh-eyes` `dx`
- **Người ghi:** YUNIE / /harness + Critic agent

---

### KN-044 — RAG grounding chết khi `export.json` thiếu — nút Xuất sai tên + không seed fallback

- **Ngày:** 2026-09-03
- **Bug report:** `.agent/bugs/2026-09-03-rag-export-missing-grounding-chet/bug.md`
- **Severity:** major
- **Triệu chứng:** `node www/library/search.mjs --status` → "Chưa có export.json"; MCP `search_library` → `isError:true`, thư viện 0 sách, 0 kết quả; chatbot hỏi kiến thức từ sách → không citation, phải bịa hoặc "Không tìm thấy".
- **Nguyên nhân gốc:** (1) `export.json` gitignore + chỉ sinh khi user bấm Xuất → fresh clone luôn thiếu; (2) nút Xuất tải `library-export-YYYY-MM-DD.json` ≠ tên MCP đọc (`export.json`) → xuất xong vẫn không khớp; (3) không có seed/fallback → RAG fail-closed thành rỗng thay vì degraded-grounding.
- **Cách sửa:** `doExport` trong `www/library/app.js` tải đúng tên `export.json` (MCP-ready) + lưu full vào localStorage; `search.mjs` + `mcp-server.mjs` thêm fallback `seed.json` (7 sách chatbot-quality, 18 chunks — Meena SSA / Conversation Design / Bot Framework / RAG / AAR / YUNIE playbook) + flag `_seed`; đồng bộ `yunie-personality` v2.1 (§12 RAG Grounding, §13–15).
- **Cách phòng tránh:**
  - Grounding phải có **seed tối thiểu trong repo** — RAG không bao giờ "chết trắng" khi thiếu export (degraded, không fail-closed im lặng).
  - Tên file export = tên consumer đọc (single contract) — đổi một đầu phải grep đầu kia; verify bằng `search --status` + MCP sau khi đổi.
  - File gitignore (`export.json`) → mọi consumer phải có fallback chain + báo rõ trạng thái seed/thiếu.
  - **Retrofit note:** bug fixed 2026-09-03 (HIGH confidence) nhưng lesson bị rơi — bug.md ghi "Related KN: KN-013" trong khi KN-013 là chủ đề khác (Ponytail ladder). Audit 2026-09-12 phát hiện thiếu → bổ sung KN-044.
- **Tags:** `process` `knowledge` `rag` `grounding`
- **Người ghi:** YUNIE / fixbug (retrofit qua audit 2026-09-12)

---

### KN-047 — Slop accumulation: code pass hết test vẫn mục dần khi agent extend (Slop Gate)

- **Ngày:** 2026-09-12
- **Bug report:** Process gap (không phải bug đơn lẻ) — "The Slop Should Not Be Tolerated" (HackerNoon 12/09/2026, Rox dT) + SlopCodeBench (arXiv 2603.24755v2) + METR + Anthropic engineering write-up. Gap analysis: `.agent/plans/harness-slop-gate/gap-analysis.md`
- **Severity:** major
- **Triệu chứng (đo được, không cảm tính):** SlopCodeBench: 15 agents · 36 problems · 196 checkpoints — **3/4 runs** nhồi thêm complexity vào hàm đã phức tạp + tích redundant code khi extend; "prioritize quality" chỉ cải thiện code KHỞI ĐẦU, không ngăn thoái hóa. Anthropic: "premature victory declaration"/"fake-done features" — cùng agent review 3 lần ra 3 kết quả. METR: 16 dev/246 tasks — chậm hơn 19% nhưng tự tưởng nhanh hơn 20%.
- **Nguyên nhân gốc:** Exit condition "done" để model tự chấm (self-preference — KN-023); không có máy đo slop sau mỗi iteration (duplication/function size/complexity); checklist item không testable biến thành wishlist; checks không bị khóa + không rerun sau thay đổi. Audit repo: 9/14 khuyến nghị đã có (3-fix limit, deny-test-mutate, Critic...) nhưng **slop check ✗** + phát hiện `scripts/mutation.mjs` là **theater** (chỉ `node --check` proxy — mutant syntax-ok = "survived" mà không chạy test nào).
- **Cách sửa:** Build `scripts/slop-check.mjs` (0-dep: dup ≥8 dòng · function >80 dòng · CC >12; gate exit 1, 0-file exit 2 / scan audit exit 0) + wire `verify.prompt.md` (bước 3b) + `evals-gate` (Slop dimension) + `minimal-ladder` (~200 LOC) + `harness-workflow` (Slop Gate block + spec-vs-wish + loop-it). Dogfood bắt 2 bug ngay (group-by-hash đứt chuỗi extension; regex literal `\{` lệch brace counter) + dedupe same-file + boolean flags; scan audit repo bắt `library-ingest*.mjs` dup ~54 dòng (backlog). Critic review độc lập (FIX): fail-closed 0-file + tách semantics audit (`slop:scan`) + regex boundary + CC trên stripped lines + doc class/nested + relabel overclaim gap-analysis (#1/#2/#9 ⚠️ prompt-enforced).
- **Cách phòng tránh:**
  - Done = **command** fail-loudly từ ngoài workspace, không phải model tự chấm ("✅ All tests passing!" không đếm) — KN-047 + KN-023.
  - Chạy `node scripts/slop-check.mjs <changed files>` trước Done; code pass mọi behavior test vẫn có thể mục dần.
  - Checklist item phải **testable** — "Supports CSV" là wish, không phải spec (comma trong quoted field? bad row?) — sửa luật KN-020.
  - Diff reviewable ~≤200 LOC (không tính generated) — vượt → chia bounded task.
  - Checks pass rồi có gì đổi → **rerun** (yesterday's green không áp dụng).
  - Mutation testing phải **chạy test thật** — proxy `node --check` = smoke detector hết pin; đừng tin "survived" của `mutation.mjs` lite (task riêng).
  - Property tests (vary inputs) là technique đáng dùng khi có parser/validator — không cần lib trong 0-dep.
- **Tags:** `process` `verification` `slop` `complexity` `evals`
- **Người ghi:** YUNIE / Slop Gate upgrade

---

### KN-053 — `git checkout HEAD -- <file>` revert nhầm refactor chưa commit — recover bằng VS Code Local History

- **Ngày:** 2026-09-13
- **Bug report:** `.agent/bugs/2026-09-13-git-checkout-head-revert-nham-refactor-chua-commit/bug.md`
- **Severity:** major
- **Triệu chứng:** Cuối session Batch 1 (refactor 3 CLI core), chạy `git checkout HEAD -- auto-researcher.mjs auto-learn.mjs` để tạo bản orig byte-exact cho pairwise — nhưng auto-learn refactor **chưa commit** → bị revert âm thầm về bản HEAD cũ (exit 0, không warning). ~12 edits (~30 phút refactor) tưởng mất trắng; chỉ AR sống sót vì trước đó vô tình save vào keep-file.
- **Nguyên nhân gốc (5 Whys):** Why1: `git checkout HEAD -- <file>` ghi đè working tree không hỏi, kể cả uncommitted changes — đúng hành vi thiết kế của git. Why2: mình dùng nó làm bước "restore orig byte-exact" cho pairwise nhưng chỉ save 1/2 file vào keep-file trước. Why3: đầu session (part 1) đã dùng đúng quy trình — Copy-Item working tree TRƯỚC khi edit, rồi copy làm .orig; part 2 tự phá quy trình vì refactor đã clean nên tưởng không cần. Why4: session dài + state phức tạp (orig/keep/refactored files) không checklist — thao tác phá hoại chạy bằng muscle memory. Why5 (Root): destructive command (checkout/reset) không có gate invariant "file này có uncommitted work không?" — thiếu pre-check trước thao tác phá hoại.
- **Cách sửa:** VS Code Local History: `%APPDATA%\Code - Insiders\User\History\<hash>\entries.json` — tìm entry match path auto-learn.mjs, sort timestamp desc; entry cuối chứa bản refactored đầy đủ — verify markers TRƯỚC khi restore (`kn-parse` import + 6× `parseKNs(KNOWLEGED)` + không còn `function tokenize`) → Copy-Item về. Re-verify toàn bộ: pairwise 6/6 (AR) + 28/28 (AL) + write paths IDENTICAL + 21/21 dependent specs.
- **Cách phòng tránh:**
  - **CẤM `git checkout HEAD -- <file>` / `git reset --hard` khi file có uncommitted changes** — pre-check bắt buộc: `git status --short <file>` + `git diff --stat <file>` phải trống trước khi chạy (fail-closed).
  - Tạo orig byte-exact đúng quy trình: (1) copy refactored → keep-file; (2) checkout; (3) copy làm `.orig`; (4) copy keep-file về — hoặc đơn giản hơn: Copy-Item working tree trước khi edit (đầu session).
  - **Commit từng file khi refactor xong** (bounded task) thay vì dồn cuối session — file chưa commit = vùng nguy hiểm của mọi thao tác phá hoại.
  - VS Code Local History là safety net đáng tin: nhớ đường dẫn + luôn verify markers entry trước khi restore (entry có thể là bản dở dang).
  - Restore file bằng byte-level copy (`Copy-Item`/`git checkout` + copy) — KHÔNG dùng PowerShell string-piping (`git show | Out-File`) vì mangle encoding/EOL → test ra kết quả SAI giả (gặp trong cùng session).
- **Tags:** `process` `dx` `git` `recovery`
- **Người ghi:** YUNIE / incident 2026-09-13 (Batch 1 refactor — recovered, re-verified 57/57 pairwise)

---

### KN-054 — ADHD/Executive Function: harness là khung xương ngoài của não — externalize, đừng "cố gắng hơn"

- **Ngày:** 2026-09-13
- **Bug report:** N/A — bài học từ mô hình EF deficit của ADHD (Russell Barkley — mô hình nổi bật trong ADHD research; paraphrase, không copy) + DSM-5 (3 presentation types) + plan `.agent/plans/executive-function/`. Trang trực quan: `www/executive-function/`.
- **Severity:** minor
- **Triệu chứng:** Các failure mode của "bộ não hữu hạn" xuất hiện cả ở agent lẫn người: kẹt fix loop 1 hypothesis (hyperfocus), quên instruction giữa session dài, không time-sense (scope phình/trôi), né task khó, dội wall-of-text. Harness đã giải quyết rải rác (3-fix limit, todo, `context.mjs`, plans, evals...) nhưng không có mô hình chung → mỗi lần gặp lại xử như bug mới; output cho người chưa có luật thân thiện working memory.
- **Nguyên nhân gốc (5 Whys):** Why1: fix triệu chứng từng cái mà không đặt tên pattern → knowledge không tích lũy (cùng lớp KN-034 nhưng ở tầng tâm lý). Why2: thiếu mô hình chuẩn để phân loại — "loop" là persistence hay pathology? "quên" là lỗi agent hay lỗi thiết kế? Why3: ADHD research đã có mô hình trả lời — Barkley: vấn đề không phải thiếu chú ý mà thiếu **executive function** (ức chế · working memory · điều tiết cảm xúc · khởi động · lập kế hoạch · tự giám sát); giải pháp nền tảng là **externalize** (bộ nhớ/thời gian/luật/động lực ra môi trường), không phải "cố gắng hơn". Why4: AI agents có cùng hạn chế cấu trúc (context = working memory hữu hạn, không time-sense, distraction-prone) → cùng mô hình áp cho cả hai. Why5 (Root): harness chưa có tầng triết lý chung cho "bộ não hữu hạn" — các accommodation mạnh nhất (todo, 3-fix limit, plans, verify) chưa được nhận diện là một hệ thống externalize thống nhất nên không được bảo vệ/giảng giải như tài sản.
- **Cách sửa:** Đặt tên + hệ thống hóa: (1) instruction `executive-function` — nguyên lý externalize + bảng 6 EF ↔ cơ chế harness (mỗi mapping **phải trỏ cơ chế đã tồn tại**, không thêm cơ chế mới chỉ để map đẹp) + agent failure modes ↔ guardrail + output rules ADHD-friendly; (2) YUNIE personality §18 + focus guard trong `harness-workflow`; (3) trang `www/executive-function/` (mapping explorer + lab working memory) cho người; (4) KN này. Phân định rõ: persistence tốt = đổi hypothesis/đo lại (KN-023) ≠ hyperfocus loop = retry nguyên strategy (3-fix limit chặn).
- **Cách phòng tránh:**
  - Gặp behavior lạ (loop/quên/né/wall-of-text) → tra bảng EF failure modes TRƯỚC khi coi là bug mới.
  - Không "cố gắng hơn": retry nguyên strategy = hyperfocus loop; đổi hypothesis/tool rồi đo lại (KN-023).
  - Mọi task >2 bước có visible progress; decision quan trọng ghi ra file (plans/knowleged) — không giữ trong đầu.
  - Output cho người: kết luận trước + 1 next step + chunk + micro-win; không tường chữ (đồng bộ yunie-personality §7/§17/§18).
  - Externalize là tài sản thiết kế, không phải crutch — ai đề xuất cắt todo/limit/plan "cho nhanh" thì trả lời bằng mô hình EF (đối trọng `minimal-ladder`: cắt waste, không cắt khung xương).
- **Tags:** `process` `psychology` `ux` `agent` `knowledge`
- **Người ghi:** YUNIE / plan `.agent/plans/executive-function/` (2026-09-13)

---

### KN-056 — Vòng chống tái lập: KN không lưới = wishlist — log RADAR + Guard gate + `guards` audit

- **Ngày:** 2026-09-13
- **Bug report:** `.agent/bugs/2026-09-13-kn-recurrence-no-guard/bug.md`
- **Severity:** major
- **Triệu chứng:** User hỏi: "luôn có lúc vẫn tái lập bug dù có KN — làm sao hạn chế sửa đi sửa lại?" Đo được: (1) chỉ ~26/55 KN có lưới (test tham chiếu); (2) `log` tạo bug draft **im lặng** kể cả khi bug gần trùng KN/bug cũ (KN-004 là tái lập thật của KN-003 mà không gì cảnh báo); (3) không gate nào đòi lưới khi close bug; (4) phép đo phụ cũng hỏng: severity parse **0/55 major** (regex không khớp `**Severity:**` → mọi KN hiện `minor`).
- **Nguyên nhân gốc (5 Whys):** KN là văn xuôi để đọc, không phải cơ chế để enforce — bug quay lại vì (a) không ai phát hiện "tái lập" tại thời điểm log, (b) không gì FAIL khi thiếu lưới, (c) định nghĩa Done của bug không bao gồm Guard. Sâu hơn: "phụ thuộc ai đó tự nhớ đọc KN" là thiết kế sai (KN-054 externalize) + đo lường không đáng tin thì ưu tiên sai theo (KN-049 class: test cả phép đo, không chỉ data).
- **Cách sửa:** 3 mắt xích máy-enforce trong `auto-learn.mjs`: (1) **log RADAR** — BM25 đối chiếu text bug với toàn bộ KN + bug cũ (ngưỡng calibrate KN ≥25 / bug ≥18: liên quan thật ≥31, nhiễu ≤15) → in `🔁 RADAR TÁI LẬP` + inject block vào bug.md (flags `--dry-run`/`--no-scan`/`--dir`); (2) **Guard gate** — template bug.md thêm field `Guard:`; `propose` major/critical thiếu Guard → `⛔ GUARD GATE FAIL`, `--strict` exit 1, draft KN luôn có `- **Guard:**`; (3) **`guards` coverage audit** — quét `tests/**` tìm `KN-XXX` + `Guard:` line trong KN detail → human/`--json`/`--out`, ưu tiên major/critical chưa lưới. Kèm fix phép đo: regex severity/date `[^\w]*`/`[^\d]*` (kn-parse + extractBugMeta) → 46 major + 3 critical parse đúng.
- **Guard:** `tests/e2e/auto-learn-guard.spec.ts` (10 test — radar dry-run/inject · gateWarning/strict · guards JSON + priority ≥10 · + fixture-exclusion negative control (amend 2026-09-18) — chính spec này là lưới dogfood của KN-056)
- **Cách phòng tránh:**
  - Bug major/critical: **Guard bắt buộc** — test mới / invariant mới / `- **Guard:** <path>`; thiếu = chưa Done (`propose --strict` là gate).
  - RADAR báo nghi tái lập → đọc Cách phòng tránh TRƯỚC; xác nhận tái lập thật → ghi "tái lập của KN-XXX — vì sao lưới cũ không bắt được" → **nâng lưới TRƯỚC, fix SAU** (fix lại y nguyên = sửa lần 3 chắc chắn xảy ra).
  - Định kỳ chạy `guards` — trả nợ lưới cho major/critical dần.
  - Phép đo là hạ tầng: metric/priority build trên parser hỏng = sai âm thầm — test cả phép đo (priority ≥10), không chỉ đo data.
  - **Amend 2026-09-18 (OCR review — guard ảo):** `guards` bỏ ref dạng **chuỗi trần** `'KN-XXX'` (fixture DATA — dream.spec row/block, kn-id-integrity id-arithmetic) — đếm là lưới = guard ảo (KN-049 class: đo nhầm tín hiệu; bug `.agent/bugs/2026-09-18-guards-fixture-refs-luoi-ao/`). Thêm **negative control** trong spec; sau khi đo sạch bồi 6 net thật (KN-002 parity · KN-011 · KN-042 · KN-043 · KN-045 · KN-055).
  - **Amend 2026-09-18 (integrate — phương bắc Bend):** "LAWS.bend = AGENTS.md backed by proof" — law khai báo + proof checker nhanh cho agent (0.38s cho 3,200 instantiations vs Lean 6s / Rocq 19s) → merge bug = theorem bất khả thi (mirror `curated-bend-proof-agent-language`). Chưa adopt (young, backend-only — dissent giữ nguyên) nhưng là đích của "rule máy giữ được": law file được máy enforce, không phải văn xuôi.
- **Tags:** `process` `knowledge` `verification` `recurrence` `guard`
- **Người ghi:** YUNIE / user request (2026-09-13)

---

### KN-057 — Ranh giới vibe coding vs engineering ở review/verify chain, không ở label — "keep holding the wheel"

- **Ngày:** 2026-09-13
- **Bug report:** N/A — bài học từ "Vibe Coding Isn't the Problem. Calling It Engineering Is" (dev.to 13/09/2026, Giorgi Kobaidze — https://dev.to/georgekobaidze/vibe-coding-isnt-the-problem-calling-it-engineering-is-lm1). Liên quan: KN-019 (vibes vs measured), KN-020/024 (trust/taste), KN-037 + KN-047 (verify gates), KN-052 (tách claim vs mechanism).
- **Severity:** minor
- **Triệu chứng:** Thuật ngữ "engineering" bị dùng cho quy trình prompt-and-ship không review → tranh luận vòng vo (defensive vs gatekeeping) không ai chốt được ranh giới. Hệ quả ngành: hệ thống chạm tiền/y tế/dữ liệu cá nhân được ship mà chưa ai phân tích code; khi sự cố xảy ra thì "AI viết" thành thẻ miễn trách nhiệm — không ai chịu trách nhiệm.
- **Nguyên nhân gốc (5 Whys):** Why1: tranh luận bàn sai đối tượng — phe bảo vệ đang bảo vệ **creation**, phe công kích đang mô tả **engineering**; cả hai đúng về hai hoạt động khác nhau (engineering ⊂ creation — maintenance/debug/refactor mới là phần lớn công việc thật). Why2: 3 tầng bị gộp thành 1 — **Vibe Coding** (prompt, không edit, không review) ≠ **AI-Assisting** (AI viết hết, người đọc hết — cần đủ skill phân biệt code tốt/xấu) ≠ **AI-assisted** (người lái, AI hỗ trợ tốc độ + ý kiến + edge cases). Why3: phân biệt đúng nằm ở **ai review**, không phải **ai gõ** — và review tier chính là skill floor: quy trình không bao giờ review thì không bao giờ luyện được skill đó. Why4: label "engineering" bị dùng để mượn uy tín/accountability mà không mang nghĩa vụ kèm theo (review/verify/understanding). Why5 (Root): ranh giới bị neo vào **danh xưng** thay vì neo vào **bằng chứng verify** — label là ngữ nghĩa, verify chain (review + reproduce + test + audit) mới là thứ đo được.
- **Cách sửa (neo ranh giới vào verify chain):** (1) Vibe-only = không review — hợp lệ cho prototype/demo/vui (harness: task nhỏ rút gọn nhưng vẫn giữ PRD mini + Polish + Verify); hệ thống **nhạy cảm** (tiền/y tế/dữ liệu cá nhân) → bắt buộc review + verify chain đầy đủ — đúng những gì harness đã có: pilot-in-command + Dissent Review (KN-018, `fund-the-friction`), Verify gates (KN-037/047), reproduce-before-fix + audit chain. (2) Giữ skill floor: "hiểu mới merge" — hiểu code mình vừa merge là điều kiện, kể cả khi AI viết 100% (KN-024). (3) Accountability không chuyển được sang AI — trace về người/process đã cho ship (agent-governance §7 disclosure). (4) Mindset: interrogating the code > creating — kể cả 10 năm nghề, ngôn ngữ lạ vẫn đọc docs trước để hiểu output AI (tinh thần AAR KN-010); "We're not there yet. Keep holding the wheel." → harness đứng ở tầng AI-assisted/AI-assisting, không phải vibe.
- **Cách phòng tránh:**
  - Trước khi gọi output AI là "engineering/sản phẩm sẵn sàng": hỏi **"verify chain ở đâu?"** — review + reproduce + test + audit; thiếu → chỉ là prototype (label không thay bằng chứng — KN-019).
  - Sản phẩm chạm dữ liệu nhạy cảm (tiền/y tế/cá nhân): cấm prompt-and-ship end-to-end — full pipeline + review từng phần (KN-037 + KN-047 + KN-018).
  - Không dùng "AI viết" làm câu trả lời khi sự cố — accountability thuộc người/process đã cho ship (KN-051 + agent-governance §7 "disclosure bắt buộc").
  - Feature AI viết 100% vẫn phải qua câu "mình hiểu không? đọc lại giải thích được không?" trước merge (KN-024).
  - Claim kèm incentive phải tách mechanism vs claim (KN-052): con số "2-4 tuần học basics" trong bài là claim không đo được — lấy cơ chế (hiểu trước khi tin output), không lấy con số làm chuẩn.
- **Tags:** `process` `verify` `review` `pilot-in-command`
- **Người ghi:** YUNIE / user request (2026-09-13)

---

### KN-060 — SkillOpt: sửa skill/KN không qua validation gate — edit trôi, rejected edits không thành negative feedback

- **Ngày:** 2026-09-14
- **Bug report:** N/A — bài học từ "SkillOpt: Agent skills as trainable parameters" (Microsoft Research 30/06/2026 — https://www.microsoft.com/en-us/research/blog/skillopt-agent-skills-as-trainable-parameters/; paper + github.com/microsoft/SkillOpt). Liên quan: KN-037 (evals gate), KN-047 (slop gate), KN-056 (guard gate), KN-023 (tự review = self-preference), KN-007 (auto-learn).
- **Severity:** major
- **Guard:** `tests/e2e/auto-learn-guard.spec.ts` + GUARD GATE trong `.github/harness/scripts/auto-learn.mjs` (propose) — KN major/critical thiếu lưới → FAIL (KN-056). Eval-gate tự động per skill-edit = hướng mở, chưa claim là đã có (tách claim vs mechanism — KN-052).
- **Triệu chứng:** Skill/KN/instruction sửa one-shot bằng tay/prompt → file "tend to grow longer and drift"; một edit "trông hợp lý" có thể âm thầm giảm performance; edit xấu không được ghi nhớ → cùng kiểu edit lỗi được đề xuất lại; không gì FAIL khi bản sửa làm tệ đi.
- **Nguyên nhân gốc (5 Whys):** Why1: skill/KN là văn xuôi sửa không phép đo — thiếu step-size control, held-out validation, rejected-edit memory (SkillOpt mô tả chính failure mode này: "uncontrolled skill evolution"). Why2: không validation gate → model tự review mình = self-preference (KN-023), "trông hợp lý" thay cho đo. Why3: không rejected-edit memory → edit xấu không thành negative feedback. Why4: edit không bounded → rewrite lớn trộn good+bad, không truy vết phần nào gây hại (đối chiếu KN-047 ≤200 LOC). Why5 (Root): tầng tri thức bị đối xử như "tài liệu để đọc" thay vì "tham số đang được tối ưu" — cần *train* (bounded + validated + versioned), không chỉ *viết*.
- **Cách sửa:** Adopt cơ chế SkillOpt ở quy mô harness (file-based, 0 deps — không xây optimizer tự động): (1) mọi edit skill/KN = hypothesis + evidence trước/sau (rubric/eval tối thiểu — KN-037), chỉ nhận khi tốt hơn thật; (2) bounded add/delete/replace, không rewrite; (3) rejected edits → Anti-patterns (negative feedback), không xoá dấu vết; (4) best-version = git + guard (held-out validation thô); (5) slow/meta update định kỳ — gộp theo CMB heatmap/Hawking thay vì thêm vô hạn; (6) giữ skill model-agnostic 1 file nhiều IDE — portability là tài sản.
- **Cách phòng tránh:**
  - Trước khi sửa skill/KN/instruction: ghi 1 dòng kỳ vọng "tốt hơn ở đâu, đo bằng gì" — không đo được thì edit phải nhỏ hơn nữa (KN-060 + KN-037).
  - Edit bounded: add/delete/replace nhỏ; rewrite toàn file = nghi vấn — tách thành nhiều edit có lý do (KN-060 + KN-047).
  - Edit bị loại/backtrack → ghi vào Anti-patterns, đừng xoá — cùng một edit lỗi không được đề xuất lại (KN-060).
  - Skill giữ model-agnostic (không pin model) — portability là tài sản (SkillOpt: skill train ở Codex thả vào Claude Code +59.7 điểm).
  - Định kỳ gộp/vệ sinh tri thức (CMB heatmap + Hawking) thay vì chỉ thêm (KN-060 + KN-024).
  - Guard line của KN mới phải nằm trong **2500 ký tự đầu** của detail (`kn-parse.mjs` cap `detail = block.slice(0,2500)` cho scoring) — đặt ngay sau Severity; nếu không, `guards` không detect dù lưới tồn tại (gặp thật 14/09: index 2857 → "missing").
- **Dẫn chứng (ngoài model — KN-023):** best/tied 52/52 cells (6 benchmarks × 7 models × 3 execution modes); GPT-5.5 58.8→82.3 (+23.5); skill cuối ~920 tokens với chỉ 1–4 edits được nhận (OfficeQA +39.0 từ 1 accepted edit); model 4B + skill vượt baseline model lớn hơn.
- **Tags:** `process` `knowledge` `skills` `self-improving` `eval`
- **Người ghi:** YUNIE / article-lesson (SkillOpt MSR 30/06/2026; bug `.agent/bugs/2026-09-14-skill-kn-sua-khong-qua-eval-gate-bi-troi-am-tham/` — propose auto-gen KN-060; paste tay sau khi evaluate dup-gate flag KN-056 (36.8)/KN-037 (68.4) ở ngưỡng heuristic 15 — người duyệt "làm cả 2" (disclosure: bypass dup-gate có chủ đích — heuristic quá thấp cho mọi bài eval/gate); mirror `www/ai-news/curated.json`)

---

### KN-062 — Memora: tách "lưu gì" khỏi "lấy thế nào" — gộp thay vì phân mảnh, retrieval có stop condition

- **Ngày:** 2026-09-14
- **Bug report:** N/A — bài học từ "Memora: A Harmonic Memory Representation Balancing Abstraction and Specificity" (Microsoft Research 29/06/2026, ICML 2026 — https://www.microsoft.com/en-us/research/blog/memora-a-harmonic-memory-representation-balancing-abstraction-and-specificity/; code github.com/microsoft/Memora). Cặp đôi cùng feed với KN-060 (SkillOpt — cơ chế train); liên quan: KN-007 (auto-learn), KN-056 (recurrence/consolidation), KN-026 (memory), KN-049 (KB cold spots), KN-059 (mechanism-half).
- **Severity:** major
- **Guard:** `tests/e2e/auto-learn-guard.spec.ts` — mắt xích 4 (2 test mới: dup-gate `evaluate` — KN trùng → **advisory** + chỉ đích danh + hint GỘP, KHÔNG chặn (calibration 18/09); chủ đề mới → không flag) + cơ chế sẵn có: `evaluate` consolidation gate + Hawking (deferred commit) + CMB cold spots (`stats --heatmap`).
- **Triệu chứng:** Hiểu biết mới về chủ đề đã có KN được thêm thành KN mới → Bảng tóm tắt phình bằng chuỗi partial duplicates, `suggest` trả nhiều mảnh lệch cho cùng câu hỏi; dòng tóm tắt bị nhồi detail (abstraction nhiễu); draft tri thức non commit sớm rồi amend liên tục; retrieval nhồi top-k không stop condition.
- **Nguyên nhân gốc (5 Whys):** Why1: thiếu quy tắc "gộp > fragment" tại decision point thêm tri thức — dup-gate có nhưng 0 spec nào chạm (rule = wishlist). Why2: abstraction/value/anchor không phải hợp đồng — đúng shape là convention ngầm. Why3: không đo retrieval-failure (KN 0 tham chiếu) + không có gate cho tri thức chín. Why4: `evaluate` không testable hermetic (hardcode BUGS_DIR, thiếu `--dir`) → không ai viết lưới. Why5 (Root): đối xử knowledge base như "file để đọc thêm" thay vì **memory system có cấu trúc** — thiếu tách "what stored"/"how retrieved" (Memora) + policy consolidate/defer/stop.
- **Cách sửa:** Adopt mechanism-half ở quy mô harness (file-based, 0 deps — không xây vector store): (1) giữ hình dạng Memora của `knowleged.md` (đã đúng): row = primary abstraction scan-được, Chi tiết = value, tags = cue anchors (`suggest` cộng tags ×2 — chọn theo đường truy cập); (2) consolidation: hiểu biết mới về chủ đề cũ → GỘP/amend (như KN-039/KN-052 amend), chỉ tạo KN khi thật mới; `evaluate` dup-gate nhận `--dir` (testable hermetic) + reason có hint GỘP; bypass phải disclosure (như KN-060 — dup-gate bắt rộng theo thiết kế, threshold 15); (3) deferred memory: draft chín trước khi commit — Hawking escalate ≥30d / evaporate ≥90d; (4) retrieval bounded có stop (top-3 + context.mjs), MemLoop = học từ retrieval fail → CMB cold spots + RADAR lúc log; (5) group memory (cross-agent share giữ provenance/boundary) = HOLD tới khi có enforcement surface — không claim đã có (KN-059).
- **Cách phòng tránh:**
  - Trước khi tạo KN mới: kiểm dup-gate (`evaluate`/RADAR) — trùng ≥ threshold → GỘP (amend) KN cũ thay vì fragment; bypass false-positive phải disclosure (KN-062).
  - Row "Bài học (1 câu)" giữ vai primary abstraction — không nhồi detail; tags chọn theo *đường truy cập* (cue anchors) không viết cho có (KN-062).
  - Draft non → defer (Hawking) thay vì commit sớm; KN 0 tham chiếu lâu = cold spot → gộp/viết lại (CMB heatmap) (KN-062 + KN-049).
  - Detector cố tình bắt rộng (substring matching) — false-positive là chuyện thường: người quyết định gộp/tách + ghi disclosure (KN-062 + KN-052 class).
- **Calibrate dup-gate (review 2026-09-18 #14a):** đo toàn corpus — 68/68 KN có top1 ≥15; cặp dup thật (004→003: 37.2) THẤP HƠN cặp non-dup (030→015: 94.1) → score không phân tách → chuyển **advisory (screening, không chặn)**; adjudication ở người + disclosure khi bỏ qua (bằng chứng: `.agent/kn-review/dup-calibration.json`; giảm alarm-fatigue KN-049 class — 6/6 flag lịch sử đều adjudicate not-dup).
- **Dẫn chứng (ngoài model — KN-023):** LoCoMo 86.3% LLM-judge (dialogue ~600 turns) + LongMemEval 87.4% (115k-token context) — vượt RAG, Mem0, Nemori, Zep, LangMem và cả full-context; gap lớn nhất ở multi-hop; 344 entries/conversation (Mem0: 651); tối đa 98% ít token hơn full-context. Hướng mở: MemLoop / Deferred Memory / Group Memory.
- **Tags:** `process` `knowledge` `memory` `context-engineering` `rag`
- **Người ghi:** YUNIE / article-lesson (Memora MSR 29/06/2026; bug `.agent/bugs/2026-09-14-memora-memory-tach-luu-gi-khoi-lay-the-nao/` — evaluate dup-gate flag KN-043(48)/KN-060(36.3) ≥ 15 → verdict "không gộp — bài học mới" (disclosure: bypass có chủ đích, heuristic recall-heavy; như KN-060); mirror `www/ai-news/curated.json`)

---

### KN-064 — Echoverse co-evolution: check đỏ đọc 2 lần theo tầng (world-first) — defect không thành bài học; guard tiến hoá (held-out · diversity > volume)

- **Ngày:** 2026-09-14
- **Bug report:** `.agent/bugs/2026-09-14-echoverse-co-evolution-check-do-doc-2-lan-world-fi/bug.md`
- **Severity:** major
- **Guard:** `tests/e2e/auto-learn-guard.spec.ts` — behavioral wiring test (mắt xích 5): `propose` parse `Layer:` + soft-warn + `--json` trả `layer`/`layerWarning` + draft mang Layer line. **Wiring chỉ chứng minh parse/report — attribution ĐÚNG = human judgment, không hard gate.** Fill-rate audit sau ≥3 bug mới: ~0 → hạ claim.
- **Layer:** process (bài meta — taxonomy dogfood ngay trên bug.md này)
- **Triệu chứng:** Check đỏ bị đọc như tín hiệu một chiều về "code/agent" → fix sai tầng; bài học (KN/anti-pattern) viết từ failure do fixture/spec/đo hỏng = học chính defect; coverage chỉ tăng count → chững/slip (reported: thêm 3.4× trajectories cùng worlds — Online-Mind2Web 40.1%→37.2%); suite xanh nhưng hollow.
- **Nguyên nhân gốc (5 Whys):** Why1: zero không được quy tầng trước khi fix (KN-034 mới tách model-vs-harness 2 tầng; thiếu env/measure/task-spec). Why2: thiếu quy tắc "defect không được thành lesson" — failure do world hỏng lọt vào curriculum/bài học. Why3: thiếu world-first — sửa fixture/spec/đo TRƯỚC rồi re-run (Echoverse: "most defects belong to the world"; EchoStay control bug → completable 48%→78%; EchoChat verifier drift → gradable 34%→99% — reported). Why4: guard thiếu quality bar depth/held-out → shallow nuôi reflex sai (reported: shallow-train 80.0→75.0 vs deep →85.0; "learned a rule, not a layout" khi gain giữ trên form chưa từng sửa). Why5 (Root): thiếu co-evolution loop — environment/test/verifier phải tiến hoá cùng capability (KN-056 phủ phần nâng-lưới-khi-tái-lập; phần còn thiếu: diversity [cảnh mới ở vùng lạnh] > volume [instance cùng vùng]).
- **Cách sửa:** Adopt 4 delta (mechanism-half — KN-052/059), không restate KN-034/049/056/058: (1) `Layer:` trong bug.md (suspicion order: code · test-spec · env-fixture · measure-verifier · task-spec · process) + template + `fixbug.prompt.md` sync + `propose` parse/soft-warn + draft line; (2) world-first cho defect kiểm chứng được + boundary KN-012; (3) held-out form / negative control là điều kiện của guard mới; (4) mở rộng coverage bằng cảnh mới ở vùng lạnh (CMB) trước khi thêm instance cùng vùng.
- **Cách phòng tránh:**
  - Trước khi fix check đỏ → trả lời tầng lỗi (code · test-spec · env-fixture · measure-verifier · task-spec); không trả lời được → điều tra, không fix (Root Cause Gate).
  - Nghi fixture/spec/đo hỏng → sửa world TRƯỚC + re-run; chỉ failure sống sót cả stack mới viết KN/anti-pattern/bug lesson.
  - **Ranh giới KN-012:** world-first KHÔNG được dùng để nới spec/xoá assertion — spec/test vẫn immutable (deny-test-mutate; amend chỉ bởi verify actor). Cấm hạ expectation để đỏ thành xanh.
  - Guard mới: assert outcome/state (không appearance) + held-out form hoặc negative control (KN-049) — shallow guard phản tác dụng, không phải "an toàn hơn".
  - `Layer:` là gợi ý nghi vấn, không phải luật — attribution cuối = judgment người.
  - Số liệu nguồn self-measured → chỉ corroboration; evidence chính = bug corpus local.
- **Dẫn chứng (local-first):** local: severity regex 0/55 (KN-056), zeroRef shorthand FP (KN-049), slop scanner dòng/CRLF (KN-049), hooks PS parse (KN-039), spec pin data (2026-09-13). Corroboration: MSR Echoverse 30/07/2026 (12 worlds built — 10 domain + 2 capability; 4 released + grounded graders) — mọi số non-gating.
- **Phân định KN-065 (review 2026-09-18):** 064 = phía **test/guard** (check đỏ quy tầng, defect không thành lesson); 065 = phía **env đo** (verify/train trong runtime đích) — 2 mặt của cùng luật world-first, giữ tách.
- **Tags:** `process` `verify` `evals` `guard` `self-improving`
- **Người ghi:** YUNIE / article-lesson — Critic dissent gated 14/09 (ADOPT-WITH-CHANGES, 8/8 changes áp dụng); dup-gate flag KN-033(39.2) — adjudicated not-dup (RSI roadmap ≠ co-evolution/attribution), disclosure bypass có chủ đích (owner duyệt session); mirror `www/ai-news/curated.json` (entry MSR Echoverse)

---

### KN-065 — Orchard: verify/train phải chạy TRONG harness thật — stand-in đơn giản hoá tạo mismatch vô hình

- **Ngày:** 2026-09-14
- **Bug report:** `.agent/bugs/2026-09-14-orchard-verify-train-trong-harness-that-stand-in-m/bug.md`
- **Severity:** major
- **Guard:** `tests/e2e/hooks-integrity.spec.ts` + `tests/e2e/status-audit.spec.ts` + `tests/e2e/readme-guard.spec.ts` — lớp lưới "chạy trong runtime thật" (shell thật · serve www thật · decode thật); **declared:** cơ chế train-in-harness đầy đủ (proxy + container/rollout) ngoài scope file-based — direction, không claim.
- **Layer:** process (bài meta — verify methodology)
- **Triệu chứng:** Check/học chạy qua bản rút gọn (stand-in: nhìn code, render local, chạy tay, mock thuần) — xanh nhưng artifact gãy trong runtime thật: hooks bị shell thật parse lỗi (KN-039), README vỡ trên viewscreen thật (KN-058), reduced-motion khác trên Edge thật (KN-031), fetch 404 trên deploy root thật (KN-030), path chết trong IDE thật (KN-043).
- **Nguyên nhân gốc (5 Whys):** Why1: check thoả mãn cú pháp trên stand-in, không tái lập tương tác môi trường (multi-process/stateful). Why2: verify gate không định nghĩa "check phải chạy ở đâu" — không phân biệt proof vs smoke. Why3: kết quả stand-in được ghi thành "đã verify" → false confidence. Why4: env bị coi là chi tiết triển khai, không là phần của phép đo. Why5 (Root): harness thiếu meta-rule "đo trong môi trường đích" — lưới hiện có phủ từng bề mặt (đúng, theo KN-039/058/031/030/043) nhưng rule chưa externalize để áp cho bề mặt MỚI trước khi nó gãy.
- **Cách sửa:** Chuẩn hoá meta-rule + cite lưới hiện có (không port hạ tầng K8s/proxy — 0-dep, minimal ladder): (1) check chạy được trong runtime thật → chạy ở đó (shell/browser/serve/IDE/viewscreen thật); (2) stand-in = smoke → dán nhãn "not proof"; (3) đổi env/dependency/platform → re-run trong env mới; (4) giữ checks chạy được trên nhiều runtime (portability — KN-060).
- **Cách phòng tránh:**
  - Verify trong môi trường đích khi có thể: shell thật (KN-039) · browser thật kể cả channel hiếm (KN-031) · serve/deploy thật (KN-030/KN-045) · IDE/folder thật (KN-043) · viewscreen/iframe thật (KN-058).
  - Stand-in buộc dùng → dán nhãn "not proof" (như `mutation.mjs` "lite — đừng tin survived", KN-047).
  - Đổi môi trường/dependency/model-router → "đáng một lần eval" dù code không đổi (KN-047 yesterday's green; Foundry curated: router đổi pool).
  - Không port hạ tầng training vào harness file-based — adopt rule (vocabulary), không adopt framework (minimal ladder).
  - Portability xuyên harness/runtime là tài sản (KN-060) — check chạy trên chromium + msedge, local + CI.
- **Dẫn chứng (ngoài model — KN-023; local-first KN-052):** local: bug corpus lớp env (KN-039/058/031/030/043). Corroboration (MSR 03/08/2026, non-gating): Orchard-SWE 73.0% SWE-bench (35B-A3B ~3B active ≈ frontier 10–30×); generalization sang harness CHƯA THẤY khi train (Kimi-CLI): 45.0 + 20.1 Terminal-Bench vs OpenSWE-32B sụp 3.6/0.0; Orchard-Claw Codex 18.6%→51.5%; swap harness +14.3 (ZeroClaw); OpenForge RL proxy ghi inference calls — "switching the harness you train against is a change of command, not a change of image"; 32,536 rollout unresolved vẫn thành training data (credit-assignment).
- **Phân định KN-064 (review 2026-09-18):** 065 = phía **env đo** (stand-in vs runtime đích); 064 = phía **test/guard** (quy tầng lỗi) — cùng luật world-first, đọc cặp.
- **Tags:** `process` `verify` `harness` `evals` `env`
- **Người ghi:** YUNIE / article-lesson (Orchard MSR 03/08/2026 — arXiv:2605.15040, github.com/microsoft/Orchard MIT; RADAR nghi KN-037 (167.3)/KN-015 (156.4) — **liên quan, không tái lập**: các KN đó phủ từng bề mặt; KN-065 chuẩn hoá meta-rule "đo trong môi trường đích" + evidence generalization xuyên harness; mirror `www/ai-news/curated.json`)

---

### KN-066 — KN ID double-yield: đa phiên song song cùng nhận 1 ID — re-check trước paste + detector integrity sau paste

- **Ngày:** 2026-09-14
- **Bug report:** `.agent/bugs/2026-09-14-kn-id-double-yield-da-phien-cung-1-id/bug.md`
- **Severity:** major
- **Guard:** `tests/e2e/kn-id-integrity.spec.ts` — dup (2 danh sách) + orphan row↔detail + order, kèm 5 negative control mutant (assert động) + 2 CLI wiring test (`status --json` → `idIntegrity.ok` + human line)
- **Layer:** process (cấp phát ID + thiếu detector integrity)
- **Triệu chứng:** 3 phiên song song cùng cấp ID **KN-061** (Routing · Memora · Echoverse — cùng `findNextKnId` max+1 trên cùng trạng thái file); 2 phiên cùng yield → **double-yield** cùng nhận KN-062; cascading renumber 061→062→063; file có lúc chứa 2 khối cùng ID (parser không dedupe → status/suggest/guards đếm lệch im lặng); 061 thành gap trống. **Tái diễn live trong lúc build guard này:** KN-064/065 bị 2 phiên khác lấy khi spec đang viết — số cuối phải nhảy 061→062→063→**066**.
- **Nguyên nhân gốc (5 Whys):** `findNextKnId` = read-then-write (max+1) không collision-check (Why1) → cửa sổ race propose→paste giữa các phiên không máy nào bắt (Why2) → không detector sau paste: integrity của `knowleged.md` không thuộc spec nào (Why3) → phát hiện muộn bởi người, renumber tay + sửa refs = churn nhiều vòng (Why4) → Root: quy trình cấp ID giả định single-writer trong khi thực tế multi-session concurrent; "re-check trước paste" mới là văn xuôi (anti-pattern), chưa có lưới (Why5).
- **Cách sửa:** (1) spec `kn-id-integrity.spec.ts` khoá 4 invariant (dup bảng · dup chi tiết · orphan · order) + negative control mutant — assert **động** để robust khi file lớn thêm (KN-049/058); (2) sửa order chi tiết KN-063↔KN-062 cho khớp bảng + nối lại bảng bị gãy blank (064/065 paste sau); (3) protocol: ID = **max+1 tại paste** — gap không tái sử dụng; (4) **đã wire (cùng ngày):** `status` trả `idIntegrity` {ok, issues} (JSON) + in cảnh báo human khi lệch — dùng chung `checkKnIntegrity` từ `kn-parse.mjs` (1 nguồn: status + guard, không duplicate); spec +2 CLI wiring test — lộ 1 **pass giả** (chuỗi "KN ID integrity" trần trùng chữ trong dòng UpdatedAt) → siết assertion theo dòng status thật (test chính phép đo — KN-049).
- **Cách phòng tránh:**
  - **Trước paste:** `findNextKnId` + grep `### KN-0XX` + `| KN-0XX |` — ngay trước khi ghi (cửa sổ race chính là propose→paste).
  - **Sau paste (trước commit):** chạy `npx playwright test tests/e2e/kn-id-integrity.spec.ts` — đỏ → renumber + update toàn bộ self-refs rồi mới commit.
  - **Phát hiện muộn:** bên phát hiện sau LÀ bên yield (14/09 yield 2 vòng + 1 vòng live) + ghi disclosure trong commit/note; update note điều phối của phiên khác nếu họ đã "dự kiến" số đó.
  - **Gap không tái sử dụng:** 061 bỏ trống có chủ đích — tránh ambiguity "061 là bài nào"; ID tiếp theo luôn max+1.
  - **Multi-session:** coi mọi file giữa các phiên là concurrent — trước mutate kiểm `git status`/diff (KN-053); commit pathspec-limited khi index chung bẩn (đừng `git add` tràn — sweep 99ca722).
- **Tags:** `process` `knowledge` `dx` `concurrency`
- **Người ghi:** YUNIE / incident 14/09 (double-yield phiên Routing; bug `.agent/bugs/2026-09-14-kn-id-double-yield-da-phien-cung-1-id/`; retrofit: KN-063 re-ID 061→063 xong TRƯỚC khi có guard; số cuối KN-066 do 064/065 bị chiếm live trong lúc build)

---

### KN-067 — Dream-RSI: replay history = simulator zero-cost — dream policy thay vì chạy lại; π₀-in-set + đừng nhồi semantic priors

- **Ngày:** 2026-09-15
- **Bug report:** `.agent/bugs/2026-09-15-dream-rsi-history-la-simulator-dream-policy-zero-c/bug.md`
- **Severity:** major
- **Guard:** `tests/e2e/dream.spec.ts` — 5 invariant (deterministic · phân biệt tốt/xấu · π₀-in-set + no-write hash-bất-biến · integrity gate dup → score 0 · fail-closed exit 2) + lưới giữ history replayable: `kn-id-integrity.spec.ts` · `auto-learn-guard.spec.ts`. **Declared:** orchestration-layer đầy đủ (executor dream cho history coding-agent) ngoài scope file-based — direction, không claim (như KN-065).
- **Layer:** process (bài meta — RSI / exploration policy; không có defect code)
- **Triệu chứng:** Exploration policy (cách chọn việc-làm-tiếp) viết tay + đóng băng — không học từ history; muốn đánh giá một thay đổi process/skill/refactor → mặc định chạy lại từ đầu dù history (bug corpus, audit, versions, e2e fixtures) đã ghi sẵn outcome của phần lớn đường đi; RSI loop (hàng nghìn proposal–evaluation cycles) tiêu compute cho hướng đã fail.
- **Nguyên nhân gốc (5 Whys):** Why1: policy cố định không học từ experience; optimize online thì meta-feedback delayed + expensive (đánh giá 1 policy = xem nó dẫn cả một discovery run tới cuối). Why2: meta-policy space rộng — hầu hết candidate đều tệ, mỗi cái tốn full rollout để biết điều đó. Why3: history (cây discovery · bug corpus · audit chain) bị đọc như text để prompt hoặc data để train — chưa đọc như **simulator exact** (walk lại theo thứ tự khác, mọi outcome đã nằm trên đĩa). Why4: thiếu meta-rule "replay > re-execute" + chưa nhận diện π₀-in-candidate-set là nguyên lý monotonic. Why5 (Root): máy móc replay đã tồn tại cục bộ (evaluate BM25 · audit hash-chain · pairwise same-moment · e2e fixtures) nhưng chưa externalize thành họ nguyên lý áp cho bề mặt MỚI trước khi trả giá re-run.
- **Cách sửa:** Adopt mechanism-half (không port infra): (1) rule **"replay > re-execute — history đã trả tiền sẵn"** — đánh giá thay đổi bằng đi lại history (0 execution), rollout thật chỉ cho winner; (2) **π₀ trong candidate set ⇒ winner never worse** — chuẩn hoá cho mọi vòng improvement (AAR keep-best là instance); (3) **đừng nhồi semantic priors** vào long-horizon/parallel exploration (đo được: kém hơn replay — over-constrain + suppress diversity; khớp KN-018/KN-035); (4) **history phải replayable** — audit chain + versions snapshot + bug.md + integrity (KN-066) là điều kiện tiên quyết. **Dogfood cùng ngày:** `dream.mjs` v0 (score/run) — replay history thật, recall@3 100% (34/34); spec `dream.spec.ts` 5/5.
- **Cách phòng tránh:**
  - Thay đổi process/skill/guard → replay history trước (dream/evaluate/fixtures/audit verify), rollout thật chỉ cho winner.
  - Mọi vòng improvement: π₀ (bản hiện tại) PHẢI nằm trong candidate set — winner never worse; thiếu baseline = thiết kế sai.
  - Cấm nhồi "insight cấp cao" vào prompt của long-horizon/parallel exploration như prior cứng — strong priors over-constrain; đo trước khi tin (KN-018 + KN-035).
  - History muốn replay được phải GHI ĐÚNG: audit hash-chain · versions snapshot · bug.md đầy đủ · integrity spec (KN-066) — replay chỉ exact trên history nguyên vẹn.
  - Compute adaptive: tiến bộ → siết budget (bounded/3-fix), plateau → escalate/bung — mirror policy học được của Dream-RSI (110→50 attempts, widening khớp cú nhảy score kế tiếp).
  - Kích hoạt thủ công: `node .github/harness/scripts/dream.mjs score --file <candidate>` hoặc `run --candidate a --candidate b` — deploy winner = MANUAL (dream không ghi file nào).
- **Dẫn chứng (ngoài model — KN-023; corroboration non-gating — KN-052):** Dream-RSI "Recursive Self-Improvement through Evolving Worlds" (Tong Zheng et al. — Google + Google DeepMind + U Maryland + U Virginia, 14/09/2026; arXiv:2609.14858; dream-rsi.com; code github.com/zhengkid/Dream-RSI): discovery tree = replay simulator exact (không phải approximation); Lasso 162× ít agent calls hơn SimpleTES (317 vs 51,200) · 1.7× < fixed exploration; VGG16 2.43× ít generations · ConvDiv 2.09× điểm cao hơn cùng budget; π₀-in-set ⇒ "bars only go up"; "semantic guidance is worse than replay"; giới hạn tự nhận — dream chỉ ở nơi history đã đi ⇒ bắt buộc là LOOP (mỗi lap +1 world). Local: `dream.mjs` v0 dogfood — recall@3 100% (34/34, 65 KN — **self-report, không tái lập từ artifact commit** — review 18/09) + demo với snapshot versions thật (KN-065 pre-paste): integrity gate tự bắt order issue → score 0 → π₀ thắng.
- **Tags:** `process` `rsi` `self-improving` `exploration` `replay`
- **Người ghi:** YUNIE / article-lesson + build (dream-simulator — PRD `.agent/plans/dream-simulator/`; RADAR nghi KN-048/KN-066/KN-033 — **liên quan, không tái lập**; evaluate dup-gate flag KN-063 (43.8 ≥ 15) — heuristic recall-heavy, adjudicated **không trùng** (routing/failover ≠ replay-simulator), disclosure bypass có chủ đích — như KN-060/062/064/065)

---

### KN-068 — Instruction pool always-on phình không ngưỡng: kế toán + ratchet + gate (budget:check)

- **Ngày:** 2026-09-16 (paste 2026-09-18)
- **Bug report:** `.agent/bugs/2026-09-16-instruction-budget-always-on-phinh-khong-nguong/bug.md`
- **Severity:** major
- **Guard:** `tests/e2e/instruction-budget.spec.ts` + `npm run budget:check` (ratchet 1400 dòng always-on; **siết 1100 từ 18/09** — path-scope 3 rule, pool 1028)
- **Layer:** process — tầng tri thức/đo lường: không lệnh nào FAIL khi pool instruction phình.
- **Triệu chứng:** 17/19 file `applyTo: "**"` = 1395 dòng (~25k tokens) load MỌI session bất kể task (task UI trả thuế cho platform-seam, task backend trả thuế cho awesome-design); thêm file/dòng always-on mới không bị chặn bởi bất kỳ gate nào; pattern "Never section" hình thành (chỉ có động lực thêm, không có động lực xóa).
- **Nguyên nhân gốc (5 Whys):** Why1: mỗi capability mới thêm file riêng `applyTo: "**"`, không ai đo TỔNG. Why2: instruction chỉ có cơ chế write — không kế toán dòng/~token theo `applyTo`. Why3: thêm rẻ (1 file md), phát hiện phình đắt (đo tay) → incentive lệch. Why4: cùng họ KN-047 (exit = vibe) + KN-056 (rule không lưới) — nhưng áp ở tầng instruction pool chưa ai chạm. Why5 (Root): vùng always-on không có invariant đo được: chặn phình cần số đo + ngưỡng + lệnh FAIL — thiếu cả 3 → drift tự do.
- **Cách sửa:** Đo trước — gate sau — phân loại cuối (bounded, không đổi semantics `applyTo` của 17 file khi chưa có eval riêng): `scripts/instruction-budget.mjs` (0-dep, kế toán dòng/~token theo applyTo; gate `--budget` exit 1; fail-closed exit 2); ratchet freeze 1395→1400 + `npm run budget:check`; `tests/e2e/instruction-budget.spec.ts` khoá 4 invariant; §7 Anti-Patterns quy ước "🤖 = máy giữ (trỏ check, không restate)".
- **Cách phòng tránh:**
  - Thêm file/dòng always-on mới → chạy `npm run budget:check` trước Done; vượt ratchet hiện hành (1100 từ 18/09) → path-scope (`applyTo` hẹp hơn) hoặc gộp.
  - Anti-pattern mới: nếu máy giữ được → thêm guard + trỏ check; không thì ghi rõ lý do không-guard-được (§7 quy ước 🤖).
- **Dẫn chứng:** HackerNoon 16/09/2026 "How to Write a CLAUDE.md That Actually Helps Claude Code" (Xi Yang; mirror `www/ai-news/curated.json`) — "Never section chỉ có motivation to add, never to remove... graveyard of historical incidents"; đo tại chỗ: always-on 1395 dòng / 17 files trước fix.
- **Tags:** `process` `knowledge` `wise-loading` `token-budget` `guard`
- **Người ghi:** YUNIE / article-lesson + build (plan `.agent/plans/instruction-budget/`; evaluate dup-gate flag KN-037 (16.4 ≥ 15) — heuristic recall-heavy, adjudicated không trùng; disclosure bypass có chủ đích + human duyệt paste 18/09 — như KN-060/062/064/065/067)

---

### KN-069 — Gate fail-open với arg rác: NaN-pass ẩn (exit 0) — gate phải validate MỌI input tại boundary

- **Ngày:** 2026-09-18
- **Bug report:** `.agent/bugs/2026-09-18-instruction-budget-gate-fail-open-voi-arg-khong-ph/bug.md`
- **Severity:** major
- **Guard:** `tests/e2e/instruction-budget.spec.ts` — test `fail-closed arg` (7 assert: `--budget abc` · `--top abc` · `--budget` thiếu giá trị · `--top` thiếu giá trị · `--budget=9999` · `-budget` single-dash · positional `budget 1100` → exit 2)
- **Layer:** code — defect ở chính gate script (parse/validate arg), không phải tầng đo.
- **Triệu chứng:** `--budget abc` → `parseInt` = NaN → `1399 > NaN` = false → status pass → in "✅ Trong budget NaN dòng" + exit 0 (gate tưởng bật mà tắt); `--top abc` → top rỗng; `--budget` thiếu giá trị bị nuốt im lặng. Cùng class (OCR review vòng 2): `--budget=1400` dạng `=` và typo `--budjet` không được nhận diện → gate im lặng không bật; vòng 3: `-budget` single-dash + positional `budget 1100` vẫn lọt whitelist `--*` → gate im lặng không bật.
- **Nguyên nhân gốc (5 Whys):** Why1: `parseInt('abc')` = NaN mang vào so sánh. Why2: mọi so sánh với NaN = false → pass oan. Why3: `parseArgs` chỉ check `!= null` — không check finite; flag thiếu giá trị rơi về default. Why4: gate viết với giả định "user luôn truyền số đúng" — trust boundary CLI arg không validate. Why5 (Root): pattern "parse → dùng ngay" nằm trong CHÍNH gate fail-closed — tool phải fail-closed với MỌI input, không chỉ dir lỗi; spec cũ khoá dir nhưng hở đường arg (coverage gap của guard asset).
- **Cách sửa:** Validator `num()`: `Number()` + `Number.isFinite` (chặt hơn `parseInt` — `'15abc'` → exit 2 thay vì parse nửa vời = 15); flag CÓ MẶT ⇒ PHẢI có giá trị hữu hạn (hết nuốt im lặng); whitelist arg — mọi token không thuộc KNOWN flag/value đứng sau flag → exit 2 (vòng 2: `--*` lạ/dạng `=`; vòng 3: single-dash + positional). Không đổi semantics arg hợp lệ.
- **Cách phòng tránh:**
  - Gate/script numeric arg: `Number()` + `Number.isFinite` + flag-có-mặt-phải-có-giá-trị + whitelist arg lạ — mọi input rác → exit 2.
  - Thêm gate mới: test cả đường ARG (không chỉ dir/file) ở chế độ fail-closed — coverage gap của guard asset chính là lỗ fail-open lần này.
  - Coi tool fail-closed như trust boundary: validate mọi input trước khi dùng, không tin "user luôn đúng".
- **Dẫn chứng (ngoài model):** OCR delegate review — [alibaba/open-code-review](https://github.com/alibaba/open-code-review) (dogfood skill `ocr-review`, delegate mode $0) phát hiện bug gốc; vòng 2 — subagent review diff tìm tiếp 2 minor cùng class → siết trong loop; vòng 3 (18/09) — single-dash/positional + 2 assert mới; spec 4/4 + manual 11 case.
- **Tags:** `process` `guard` `fail-closed` `gate`
- **Người ghi:** YUNIE / /fixbug + OCR review (RADAR nghi bug 16/09 (198.2) — **không tái lập thật**: cũ = thiếu gate, mới = gate fail-open; lưới cũ không bắt vì spec cũ chỉ test dir-path, hở arg-path → nâng lưới bằng test mới; evaluate dup KN-037 23.9 — adjudicated không trùng, disclosure bypass như KN-060/062/064/065/067/068)

---

### KN-075 — Viết nội dung về thực thể có tên mà không xác minh danh tính trước (Space Bunny bị mô tả thành "sản phẩm AI tự nghĩ")

- **Ngày:** 2026-09-24
- **Bug report:** `.agent/bugs/2026-09-23-space-bunny-mo-ta-sai/bug.md`
- **Severity:** major
- **Guard:** `.github/skills/video-clip/SKILL.md` Phase 1 (Research bắt buộc + evidence ledger nhãn A/B/C/D) + `.agent/plans/space-bunny-tiktok/plan.md` content guard. ⚠️ **Lưới quy trình, không phải test tự động** — chưa có spec nào fail khi agent viết sai danh tính (ghi rõ giới hạn trong bug.md).
- **Layer:** process — thiếu bước xác minh thực thể ngoài codebase trước khi viết nội dung.
- **Liên quan:** KN-074 (cùng lớp “verifier tin ngầm vào giả định không được kiểm”) · KN-037 (evals — đo HOW WELL, không chỉ chạy được) · KN-056 (nâng lưới trước khi fix).
- **Triệu chứng:** User giao “làm nội dung về model Space Bunny Free, 40-60s”. Agent viết PRD + kịch bản + voiceover mô tả Space Bunny như **sản phẩm AI do mình hình dung** (tên riêng + tính năng), không tra nguồn nào. User phải sửa: “lộn rồi, Space Bunny là 1 cái model mới ra trên OpenCode, đang cho xài free”. Toàn bộ PRD/clip/voiceover phải viết lại; sau đó còn 2 vòng sửa nữa (context **1M** không phải 1.5M/2M; **retention mâu thuẫn** giữa OpenCode “0 ngày” và OpenRouter “có thể lưu”).
- **Nguyên nhân gốc (5 Whys):**
  - Why1: Nội dung sai danh tính thực thể.
  - Why2: Không có bước tra cứu nào trước khi viết — nhảy thẳng từ yêu cầu sang sản phẩm.
  - Why3: Câu yêu cầu 1 dòng của user (“model Space Bunny Free”) bị coi là **đủ ngữ cảnh** để viết, dù chỉ là mệnh đề không nguồn.
  - Why4: Pipeline có **Explore** (đọc codebase) nhưng **không có bước xác minh thực thể ngoài repo** (model/sản phẩm/công ty được nhắc tên).
  - Why5 (Root): Với nội dung nói về **thực thể có tên ở thế giới thật**, “Explore” bị hiểu là chỉ đọc repo — thiếu luật “tra nguồn gốc trước khi viết”; và **không có artifact nào bắt buộc chứng minh đã tra** (evidence ledger), nên sai danh tính không bị chặn ở đâu cả.
- **Cách sửa:** (1) Thêm **Research phase bắt buộc** (bước 1/7) vào `video-clip` skill cho mọi clip nói về sản phẩm/model — output `research.md` với **evidence ledger** gắn nhãn A (official primary) / B (official indexed) / C (aggregator) / D (rumor); (2) mỗi claim trong clip phải truy được về 1 dòng ledger, claim không truy được → cắt hoặc ghi “chưa xác minh”; (3) nguồn mâu thuẫn → **nêu mâu thuẫn**, không tự chọn phe (giữ trung thực); (4) viết lại toàn bộ nội dung theo nguồn (1M context xác nhận bằng 4 nguồn; `1.5M`/`2M` = 0 nguồn; retention nêu đúng mâu thuẫn).
- **Cách phòng tránh:**
  - Viết nội dung về **thực thể có tên** → tra nguồn gốc TRƯỚC, lập evidence ledger; **một câu mô tả ngắn của user không phải là grounding**.
  - Phân biệt 2 loại “Explore”: đọc **codebase** (repo) vs xác minh **thực thể ngoài repo** (sản phẩm/model/công ty/người) — cái sau cần nguồn ngoài, không suy từ tên.
  - Claim về thông số (context/size/benchmark) phải có **≥2 nguồn độc lập** hoặc ghi rõ “chưa xác minh”; thấy nguồn mâu thuẫn → giữ cả hai, không chọn phe có lợi cho kịch bản.
  - Nếu user đã cung cấp danh tính trong câu lệnh, vẫn phải kiểm: tên đúng nhưng **bản chất** (model? sản phẩm? dịch vụ? công ty?) có thể vẫn sai.
- **Tags:** `process` `content` `verify` `data`
- **Người ghi:** YUNIE / /fixbug (bug auto-log 23/09 từ user correction; đóng hồ sơ 24/09 — draft treo làm `health=warn` đúng như KN-074 đã cảnh báo)

---

### KN-077 — Setup doctor Windows port probe bị nhiễu và đo sai

- **Ngày:** 2026-09-25
- **Bug report:** `.agent/bugs/2026-09-25-setup-doctor-windows-port-probe-noise/bug.md`
- **Severity:** minor
- **Guard:** `.github/harness/scripts/setup-doctor.mjs:83` + `--self-test` (free/listener/probe-failure) + component eval `setup-doctor-self-test`
- **Layer:** `code` — implementation Unix-only dùng trong một CLI cross-platform.
- **Liên quan:** KN-074 (verifier/diagnostic phải fail-loud trên Windows) · KN-016 (Windows portability) · KN-039 (cú pháp/probe theo platform).
- **Triệu chứng:** `node .github/harness/scripts/setup-doctor.mjs --json` trên Windows in 4 lần `The system cannot find the path specified`, vẫn trả `pass: true`, và `ports` không có bằng chứng đáng tin.
- **Nguyên nhân gốc (5 Whys):**
  - Why1: Windows không tìm thấy executable probe → vì `lsof`/`ss` là công cụ kiểu Unix.
  - Why2: `portListening()` hard-code command Unix → vì không branch theo `process.platform`.
  - Why3: Không có platform contract cho diagnostic CLI → vì giả định môi trường dev giống nhau.
  - Why4: `execSync` + shell pipe (`2>/dev/null`, `grep`) phát stderr/catch lỗi → vì probe thiếu ranh giới argv và stderr.
  - Why5 (Root): Thiếu invariant “native probe + output sạch + positive/negative evidence”; exit 0 bị nhầm là health thật (KN-074).
- **Cách sửa:** Dùng `execFileSync` với argv array; Windows chạy System32 `netstat.exe` (khi có) + timeout/buffer, Unix giữ `ss`/`lsof`; parse `<address>:<port> ... LISTENING ... PID`; trả structured `ok + states` và `unknown + error` khi probe thất bại; `checkPorts` fail-closed. Thêm `--self-test` 3 case (free/listener/probe-failure) và wire `setup-doctor-self-test` vào component eval. Pass 1 loại noise, positive probe lộ matcher cũ giả định whitespace trước port, pass 2 dùng `:<port>`.
- **Cách phòng tránh:**
  - Mọi CLI cross-platform phải chọn probe native theo OS; không hard-code Unix-only commands.
  - Dùng `execFileSync` + `stdio` để command không tồn tại không rò stderr; không nuốt lỗi mà mất tín hiệu.
  - Phân biệt `listening`, `free`, `unknown`; probe failure phải fail-closed, không được báo free.
  - Test **free port** (negative), **listener thật** (positive), và **probe failure** (unknown) trước khi tin `PASS`; wire self-test vào component eval.
  - Đây là recurrence của portability/fail-silent pattern; guard cũ chưa bao phủ `setup-doctor` nên phải thêm probe vào checklist.
- **Tags:** `process` `dx` `windows` `verify`
- **Người ghi:** YUNIE / /fixbug (self-upgrade 2026-09-25; `eval-gate --scope all`, `get_errors`, `slop-check`, free/listener probes đều pass)

---

### KN-078 — Power sweep false green — liveness không phải health

- **Ngày:** 2026-09-25
- **Bug report:** `.agent/bugs/2026-09-25-power-sweep-false-green-liveness-khong-phai-health/bug.md`
- **Severity:** major
- **Guard:** `power-check --self-test` 7 case (missing marker / drift / exit lệch / arg exit 2 / mirror hỏng / scale missing + stale) + component eval `power-check-self-test` (chạy trong `eval-gate --scope all`)
- **Layer:** `code` — assertion của aggregator chỉ xác nhận liveness, không xác nhận health.
- **Liên quan:** KN-074 (gốc — gate phải chứng minh ĐÃ CHẠY; KN-078 là tầng kế tiếp: đã chạy ≠ khỏe) · KN-002 (mirror single-source) · KN-064 (đọc đỏ 2 lần) · KN-065 (đo trong runtime thật).
- **Triệu chứng:** `npm run power` báo `⚡ 9/9 ALL GREEN` cùng lúc full suite đỏ ở `cosmos-freshness.spec.ts` (badge `🟡 hơi cũ · 44h`). Critic đọc từng exit path: link `registry` chỉ in header (`Harness Status`), link `guards` chỉ in `GUARD COVERAGE` — cả hai in vô điều kiện, không bao giờ exit ≠ 0 → green dù registry drift hoặc guard coverage = 0.
- **Nguyên nhân gốc (5 Whys):**
  - Why1: Sweep báo green sai → vì 2 link chỉ assert “lệnh chạy xong”.
  - Why2: Chọn marker = header văn bản in vô điều kiện, không phải điều kiện sức khỏe.
  - Why3: Ngộ nhận “chạy được = khỏe”: copy pattern proof-it-ran (KN-074) mà quên nửa sau của nó.
  - Why4: Không có negative control theo từng link — self-test chỉ test `runCheck` hygiene.
  - Why5 (Root): **Aggregator tái lập đúng lớp bug nó sinh ra để chặn** — thiếu rule: mọi link health phải có 1 điều kiện ĐỎ được chứng minh.
- **Cách sửa:** `registry` → forbid `⚠️ mismatch`/`❌ missing` (dùng detector sẵn có); `guards` → parse `guards --json` + floor `withGuard ≥ 50`; `status-mirror` → freshness (mtime `registry.json` > `generatedAt` → đỏ) + đủ 5 counts; thêm link 10 `cosmos-freshness` (`scale.json` < 24h, khớp threshold badge `🟢 tươi`); `evals` mở rộng `--scope all`; self-test 6 → 7 case + 2 negative probe thực thi. Kết quả: sweep 10/10 · full suite 288/288 · mirror refresh <1h.
- **Cách phòng tránh:**
  - Mỗi link health phải có **assert điều kiện** (forbid/threshold/freshness), không chỉ marker-in-output.
  - Trước khi gọi một gate là “fail-closed”, chạy **negative control thật** cho từng link (giả lập trạng thái xấu → phải ĐỎ).
  - Aggregator/gate mới phải tự chạy **full-suite + runtime thật** một lần trước khi tin (KN-065) — và phải có 1 link tự bảo vệ (self-test nằm trong component evals).
  - Marker văn bản dùng để chứng minh “đã chạy”; điều kiện dùng để chứng minh “khỏe” — không trộn hai loại.
  - Chạy `node .github/harness/scripts/auto-learn.mjs suggest "gate fail-closed marker false green"` trước khi viết gate/aggregator mới.
- **Tags:** `process` `verification` `gate` `false-green`
- **Người ghi:** YUNIE / /fixbug (self-upgrade round 2 — full suite bắt được 1 real + Critic bắt 2 false-green; sau fix: sweep 10/10 · self-test 7 case · 288/288)

---

### KN-080 — Eval/benchmark kết luận quá tự tin so với evidence (self-audit rank stability)

- **Ngày:** 2026-09-26
- **Bug report:** N/A — bài học từ arXiv:2609.30074v1 (Dipankar Sarkar — 24/09/2026, self-audit LLM-inferred prompt structure)
- **Severity:** major
- **Guard:** Advisory (disclosure): discipline báo cáo trong skill `evals-gate` §6 + `auto-researcher` Step 4; phần máy-check được = grounding fact-grader (`eval-gate --scope grounding` chặn số/quote bịa). Rank-stability chưa có máy chấm — checklist-level.
- **Layer:** `process` — cách rút kết luận từ đo lường, không phải lỗi đo.
- **Liên quan:** KN-037 (Evals Gate) · KN-010 (AAR keep-best) · KN-019 (measured > perceived) · KN-023 (self-prefer bias) · KN-067 (π₀-in-set — top-2 noise → giữ bản đơn giản/hiện tại).
- **Triệu chứng:** Audit nội bộ 8 model variants (5 families, 8B–675B, caching disabled, 293 raw intermediate reps): identical calls KHÔNG reliably recover identical structure — mean node-set Jaccard 0.39–0.96, **72% prompt-model cells không bao giờ node-set-perfect**. Joint cluster bootstrap: chỉ **đáy** bảng vững (2 model kém ổn định nhất giữ hạng 99%/86%), middle 27–48%, top chỉ 68% — "identifies the worst model reliably but does NOT reliably identify the best". Hai quy tắc merge hợp lý (đều defensible) đổi **4/8 hàng + headline 7pp**. Reproducibility ≠ accuracy. **4/8 endpoint bị thu hồi trong 10 tuần** — study as specified không chạy lại được nữa.
- **Nguyên nhân gốc (5 Whys):**
  - Why1: Bảng xếp hạng trông chắc hơn evidence → vì small-sample (ít prompt, 1 campaign) + stochasticity LLM không được coi là noise floor.
  - Why2: Không thấy mức bất định → vì report rank order trần, không report stability/uncertainty.
  - Why3: Không thấy độ nhạy quy tắc → vì aggregation chọn ngầm (1 cách), không chạy sensitivity comparisons.
  - Why4: Không truy được về raw → vì chỉ giữ aggregates, raw per-run không persist.
  - Why5 (Root): **Kết luận eval được đối xử như output của phép đo deterministic, trong khi nó là ước lượng thống kê từ n samples + 1 quy tắc được chọn** — thiếu ngày đo + shelf-life thì hỏng thêm: endpoint chết là bảng thành artifact không tái lập.
- **Cách sửa:** Adopt trực tiếp 5 recommendations của paper vào discipline hiện có: (a) **rank stability** — báo cáo độ giữ hạng, không chỉ thứ hạng; (b) **sensitivity executed** — chạy ≥2 quy tắc tổng hợp hợp lý trước khi chốt kết luận; (c) **per-cell provenance + raw per-run** persist; (d) **measurement date + shelf-life** (deprecate → re-run); (e) **reproducible ≠ accurate** — vẫn đối chiếu ground truth. Wire: `evals-gate` SKILL §6 (report discipline) + `auto-researcher` Step 4 (top-2 trong noise → chọn bản đơn giản hơn, ghi "trong noise"; report kèm stability + ngày + raw).
- **Cách phòng tránh:**
  - Trước khi tuyên "best/better": hỏi "delta có lớn hơn noise không?" — top-2 xấp xỉ → chọn bản đơn giản hơn (minimal-ladder tiebreak) hoặc giữ π₀ (KN-067), không tuyên best từ 1 campaign.
  - Mọi báo cáo eval/benchmark ghi `Measured: YYYY-MM-DD` + raw runs + độ bất định; kết luận vững ở vùng nào của bảng (đáy > top).
  - Chạy sensitivity (mean/median/majority) — kết luận đổi theo quy tắc thì ghi rõ phụ thuộc, không trưng bảng như chân lý.
  - Eval có shelf-life: model/endpoint/API deprecate → kết quả hết hạn, re-run trước khi tái dùng (10 tuần giết 4/8 endpoint).
  - Reproducible ≠ correct: tái lập + ground truth độc lập (rubric/grounding) là 2 lớp khác nhau.
- **Tags:** `process` `evals` `benchmark` `verification` `reproducibility`
- **Người ghi:** YUNIE / phân tích paper + tích hợp (user yêu cầu 26/09)
