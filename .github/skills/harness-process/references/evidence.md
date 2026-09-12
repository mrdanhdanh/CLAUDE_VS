# Evidence — harness-process (DisCo arXiv:2609.02749v1 §3.2 (task-agnostic))

> Substrate layer của skill — full text từ docs/knowleged.md. Sinh tự động 2026-09-12T07:15:53.986Z.

## Bug reports liên quan (6/28 bugs)

- `.agent/bugs/2026-08-30-bug-blindness/bug.md` — Bug: Bug Blindness — mù bug do workaround vô thức + fan bias
- `.agent/bugs/2026-09-03-rag-export-missing-grounding-chet/bug.md` — Bug: RAG export missing grounding chet
- `.agent/bugs/2026-09-04-import-mcp-stdio-server-trong-smoke-test-gay-treo-/bug.md` — Bug: Import MCP stdio server trong smoke test gay treo + verify order + regex m flag
- `.agent/bugs/2026-09-06-archify-skill-port/bug.md` — Bug: Archify skill port — (A) EPERM rename trên Windows + (B) diagram tràn first-screen
- `.agent/bugs/2026-09-11-ps-5-1-khong-ho-tro-trong-lenh-powershell/bug.md` — Bug: PS 5.1 khong ho tro ?? trong lenh PowerShell
- `.agent/bugs/2026-09-12-academy-content-not-actionable/bug.md` — Bug — Content 7 bài Agentic Academy "đúng chữ nhưng không chạy được"

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
  - Sinh lệnh PowerShell: chỉ cú pháp 5.1 — `??` → `if (-not ...)`, `?.` → `if ($a -and $a.b)`, ternary → if/else, `&&` → `;`.
  - `??` trong `.mjs`/Node vẫn hợp lệ — chỉ cấm trong LỆNH PowerShell / `.ps1`.
  - Gặp `Unexpected token '??'` → viết lại TOÀN lệnh rồi mới re-run, không lặp y nguyên (KN-023).
  - Trước Done: grep sweep lệnh mới sinh (plan/docs/session) xem còn cú pháp PS 7.
- **Cập nhật 2026-09-12 (root fix môi trường):** Cài pwsh **7.6.6** user-space — tải zip win-x64 từ GitHub release → extract `%LOCALAPPDATA%\Programs\PowerShell\7.6.6` (ZipFile + Unblock-File, không cần admin) + user PATH; VS Code user settings: `terminal.integrated.defaultProfile.windows` + `automationProfile.windows` = "PowerShell 7". **Đo trên 7.6.6:** `??` ✅ · `&&` ✅ · `?.` ⚠️ — `$var?.prop` (không brace) bị tokenizer nuốt `?` vào tên biến → kết quả sai lặng (`$s='abc'; $s?.Length` → 0, không phải 3); phải viết `${var}?.prop`. `.Length`/`.Count` trên `$null` → 0 (intrinsic) — dễ nhầm với giá trị thật. **Từ PS 5.1 gọi pwsh `-Command` chứa `"` → quote bị nuốt** (native arg mangling — đo được 2 lần) → dùng `-File` hoặc mở terminal pwsh trực tiếp. Contract 5.1 vẫn giữ cho artifact commit repo (portability floor).
- **Tags:** `process` `dx` `windows` `powershell` `scripts`
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
