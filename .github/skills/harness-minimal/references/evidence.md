# Evidence — harness-minimal (DisCo arXiv:2609.02749v1 §3.2 (task-agnostic))

> Substrate layer của skill — full text từ docs/knowleged.md. Sinh tự động 2026-09-11T15:42:43.670Z.

## Bug reports liên quan (1/19 bugs)

- `.agent/bugs/2026-09-03-n5blazor-ladder-trial-dead-code/bug.md` — Bug: N5Blazor ladder trial dead code

## Full KN details

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

---

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

---

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
