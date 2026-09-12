---
name: harness-process
description: "Task-agnostic lessons 'Process & Self-Improvement' chưng cất từ docs/knowleged.md (20 KN: KN-005, KN-007, KN-010, KN-014, KN-016, KN-018, KN-019, KN-023, KN-024, KN-025, KN-026, KN-027, KN-033, KN-034, KN-035, KN-036, KN-037, KN-039, KN-043, KN-044) + .agent/bugs/. Use when task chạm process, quality, ux, perf, a11y, knowledge, automation, dx, self-improving, benchmark — áp Cách phòng tránh trước khi code, tránh lặp bug cũ. DisCo-lite, regenerate bằng distill-agnostic.mjs."
user-invocable: false
---

# Harness Process & Self-Improvement — Bài học task-agnostic (DisCo-lite)

> Chưng cất từ `docs/knowleged.md` + `.agent/bugs/` — **KHÔNG sửa tay**, regenerate bằng `node .github/harness/scripts/distill-agnostic.mjs`. Nguồn: DisCo arXiv:2609.02749v1 §3.2 (task-agnostic).

## When to Use

- Task chạm theme **Process & Self-Improvement** (tags: process, quality, ux, perf, a11y, knowledge, automation, dx, self-improving, benchmark, aar, mcp, testing, regex, windows, fs, collaboration, diversity, pilot-in-command, metrics, evidence, research, verification, calibration, psychology, taste, human-judgment, agent, self-evolving, procedural-graph, a-jit, memory, funnel, rl, consistency, self-distillation, scaffold, rsi, harness, failure-diagnosis, reasoning, uncertainty, architecture, playbook, evals, agentic-patterns, powershell, scripts, content, docs, verify, fresh-eyes, rag, grounding)
- Trước khi code/fix — áp **Cách phòng tránh** ngay để không lặp bug cũ
- Review/plan — check anti-patterns bên dưới

## Bài học (20 KN)

### KN-005 — Bug Blindness — mù bug do workaround vô thức + fan bias (major)
- **Bài học:** Chữa mù bug: fresh eyes, test như user mới, chỉ ra bug liên tục, không workaround vô thức, dogfooding có ý thức
- **Bug report:** .agent/bugs/2026-08-30-bug-blindness/bug.md
- **Cách phòng tránh:**
  - Trước khi ship: checklist "user mới có dùng được không nếu không biết workaround nào?" — nếu cần >1 bước không trực quan → là bug.
  - Ghi lại mọi habitual mitigation thành bug report thay vì để thành thói quen.
  - Thêm phase **Polish + Verify với fresh eyes** trong Harness — responsive 375/768/1280, empty/loading/error states, a11y, perf — không bỏ.
  - Dùng LLM / người ngoài làm "normal user" để reproduce, không chỉ dev tự test.
  - Văn hóa team: khuyến khích chỉ ra flaw, không fan bias — "yêu sản phẩm nhưng vẫn soi lỗi".

### KN-007 — Thiếu hệ thống tự học hỏi tự động — phải làm tay, dễ quên (major)
- **Bài học:** Mỗi task phải auto suggest KN (BM25-lite + IDF), mỗi lỗi auto log draft, mỗi fix auto propose KN — không để trôi
- **Bug report:** .github/harness/scripts/auto-learn.mjs
- **Cách phòng tránh:**
  - Trước khi code: luôn `suggest "<mô tả task>"` — nếu có KN liên quan → áp dụng Cách phòng tránh ngay.
  - Khi lỗi: luôn `log --error` ngay khi còn nóng — không để trôi.
  - Sau khi fix: luôn `propose --bug` → dán vào `knowleged.md` (Bảng + Chi tiết + Anti-patterns + Checklist) + cập nhật UpdatedAt.
  - Hooks tự nhắc: PostToolUse gợi ý suggest, Stop nhắc status/propose.
  - Verify: `node auto-learn.mjs status` + `suggest "test"` trước khi commit.

### KN-010 — AAR pattern từ Anthropic — propose 3 methods, benchmark, keep best (major)
- **Bài học:** Áp dụng AAR pattern: propose 3 → implement → benchmark → keep best → log KN. 3-fix limit vẫn áp dụng. Check HOW not WHETHER
- **Bug report:** —
- **Cách phòng tránh:**
  - Khi có nhiều cách fix/solve (≥2): luôn áp dụng AAR pattern — propose 3 → benchmark → keep best.
  - 3-fix limit vẫn áp dụng (học từ systematic-debugging): nếu cả 3 cách fail → STOP, question architecture.
  - Check **HOW** (cách làm) không chỉ **WHETHER** (pass/fail) — tránh reward hacking.
  - Log benchmark results vào `.agent/plans/aar-harness/report-<slug>.md` (qua `auto-researcher.mjs --report`).
  - `auto-researcher.mjs --task "xxx" --report` để chạy full AAR loop.

### KN-014 — Smoke test treo khi import MCP stdio server + verify order + regex m flag (minor)
- **Bài học:** Cấm import module khởi động server trong smoke one-liner; self-verify chạy sau khi mọi file đã ghi; regex `^`/`$` multi-line luôn thêm flag `m`
- **Bug report:** .agent/bugs/2026-09-04-import-mcp-stdio-server-trong-smoke-test-gay-treo-/bug.md
- **Cách phòng tránh:**
  - KHÔNG import module khởi động server (stdio/HTTP) trong smoke test one-liner — server chờ input vĩnh viễn → treo terminal.
  - Smoke MCP: gọi qua functions nội bộ (router) hoặc spawn process với stdin đóng + timeout.
  - Self-verify phải chạy SAU khi mọi file đã ghi — nếu check phụ thuộc file sinh sau, ghi tạm (pre-checks) trước rồi verify final.
  - Regex `^`/`$` cho nội dung multi-line luôn thêm flag `m`.
  - Lệnh shell có ngoặc unquoted trong zsh → quote hoặc heredoc (tránh lỗi "unknown sort specifier").

### KN-016 — harness-manager disable fail EPERM trên Windows (fs.rename folder bị chặn) (major)
- **Bài học:** Wrap rename bằng `safeRename()`: thử `fs.rename`, bắt EPERM/EXDEV/EBUSY → fallback `fs.cp` + `fs.rm`
- **Bug report:** .agent/bugs/2026-09-06-archify-skill-port/bug.md
- **Cách phòng tránh:**
  - Mọi script move file/folder trên Windows dùng wrapper rename có fallback, không gọi `fs.rename` trần.
  - Gặp EPERM rename: thử PowerShell `Move-Item` để xác nhận OS cho phép → nếu OK thì chắc chắn là fallback thiếu, không phải permission.
  - Không đoán "chắc chạy được" — test disable/enable thật sau khi thêm skill mới.

### KN-018 — Waymo effect / Decollaboration — AI tiện quá khiến human ngừng nghĩ chung (major)
- **Bài học:** Dissent Review gate ở Clarify/Verify: mỗi PRD phải có 1 framing đối lập không prompt trước; trả lời "Who did you think with?"; human giữ pilot-in-command
- **Bug report:** —
- **Cách phòng tránh:**
  - Mọi PRD/Design phải trả lời "Who did you think with?" nghiêm túc như "What did you publish?".
  - Human giữ pilot-in-command: agent là crew (analyst/critic/planner), human quyết question + path + conclusions.
  - Outsource writing ≠ skip thinking — viết PRD/design là forcing function, không delegate toàn bộ.
  - Coi collaboration là infrastructure: fund workshop/visit/co-location/unstructured time, không cắt khi budget căng.
  - Khi output rẻ đi, thứ quý đảo ngược: thinking together là scarce resource — bảo vệ nó.

### KN-019 — Perceived vs Measured Productivity — claim tốc độ phải đo, không nhận vibes (major)
- **Bài học:** Mọi claim tốc độ/ROI phải đo bằng metrics (session logs, diff stat, token cost, rework count) — không nhận vibes
- **Bug report:** —
- **Cách phòng tránh:**
  - Trước khi claim "nhanh hơn/tốt hơn": hỏi "đo bằng gì?" — không metrics thì nói rõ confidence LOW.
  - Ghi scoreboard diff stat mỗi Verify (đã có trong minimal-ladder).
  - Nhớ gap perceived vs measured là có hệ thống — chính dev trong study cũng sai sau khi được đo.

### KN-023 — Model "giỏi ngọn, yếu gốc" — 6 papers chứng minh verification phải nằm ngoài model (major)
- **Bài học:** Verification phải nằm NGOÀI model: fresh evidence từ tool, Dissent từ framing đối lập, đo lại bằng tool không tin trí nhớ
- **Bug report:** docs/llm-weakness-research.md
- **Cách phòng tránh:**
  - Không hỏi model "chắc chưa?" — đo bằng tool (bài 2, 3: self-knowledge gap + calibration không generalize).
  - Không để model tự review/chấm bài của chính nó làm bằng chứng Done (bài 1, 4: self-correction fail + self-preference).
  - Không tin benchmark vendor — benchmark trên codebase thật (bài 3, 6: benchmark chính là vùng pattern quen).
  - Chi tiết 6 papers + trích dẫn nguyên văn: `docs/llm-weakness-research.md`.

### KN-024 — Prolific AI Psychosis — output rẻ làm mù khả năng đánh giá (major)
- **Bài học:** Nút thắt chuyển từ sản xuất sang đánh giá: giữ human judgment + verification ngoài model; đo value không đo LOC; taste là ceiling không tự động hóa được
- **Bug report:** docs/llm-weakness-research.md
- **Cách phòng tránh:**
  - Không thưởng/chấm theo output đếm được (LOC, số file, số task) — đo value thật (utility, rework count, user feedback).
  - Học nhận diện "counterfeit wins" — loss nhìn y win: luôn verify bằng tool trước khi tin (KN-019).
  - Nếu không hiểu code mình vừa merge → STOP, đó là dấu hiệu psychosis — đọc lại hoặc viết lại (KN-022: human phải hiểu hệ thống mình sở hữu).
  - Giữ sleep + life outside work — hyperfocus là triệu chứng, không phải feature.
  - Taste là human judgment: AI dự đoán trend được nhưng express feeling thì không (Emily Oberg: $400k/năm tiết kiệm nhưng phá brand visual) — không outsource phần cảm nhận.

### KN-025 — Procedural Graphs + A-JIT — Self-Evolving Execution Structures (2609.09153v1, 2609.10248v1) (major)
- **Bài học:** Procedural Graph tổ chức (procedure, relation, procedure) + guidance model bias next action + LLM refiner contrast failed/success để edit topology, giữ rejected edits
- **Bug report:** www/library/export.json
- **Cách phòng tránh:**
  - Mọi agent long-horizon phải có explicit procedural structure (graph/workflow), không để unconstrained generation tự quyết thứ tự.
  - Guidance bias không dictate — solver vẫn quyết, graph chỉ gợi ý.
  - Self-evolution loop phải có held-out validation + rejected memory, không commit bừa.
  - Harness 8-phase đã là procedural graph thô — cần formalize thành `procedural-graph.json` với (procedure, relation, procedure) triplets + guidance.
  - A-JIT: harness + traces phải quan sát usage để specialize, không ship static rồi bỏ.

### KN-026 — Experience Funnel + ADMET-EvO — State-Policy Alternating Loop & Evidence-Gated Evolution (2609.08919v1, 2609.10121v1) (major)
- **Bài học:** Alternating loop: distill trajectory → explicit textual state (fast) → identify useful behavior → consolidate vào policy via transition-aware distillation (slow) + evidence-gated carry forward
- **Bug report:** www/library/export.json
- **Cách phòng tránh:**
  - Mọi self-evolution phải có 2 tốc độ: fast state (text, editable) + slow policy (parametric, consolidated) — không chỉ 1.
  - Distill trajectory thành explicit state trước, validate nhanh, rồi mới consolidate vào policy — không consolidate trực tiếp từ raw trajectory.
  - Evidence-gated: mọi hypothesis phải falsifiable, test qua interventions, carry supported/rejected/inconclusive — không overfit internal validation.
  - Harness: knowleged.md là explicit state, instructions/skills là policy — cần funnel loop giữa chúng, không chỉ append.
  - Đo cumulative fitting time + task-normalized score, không chỉ per-task accuracy.

### KN-027 — Feedback-Enriched Environments + Consistency Gap + SOLID — Self-Improvement Without Verified Answers (2609.08404v1, 2609.08832v1, 2609.09957v1) (major)
- **Bài học:** FEEs: chuyển từ action guidance sang observation enrichment + intra-group feedback consistency; Consistency Analyzer + Guideline Generator; SOLID: cluster objectives, majority artifact làm pseudo-reference, group-relative advantages
- **Bug report:** www/library/export.json
- **Cách phòng tránh:**
  - Long-horizon RL: ưu tiên environment-side adaptation (FEEs) trước khi nhồi agent-side SFT — enrich observation, không chỉ guide action.
  - Đo consistency gap (all-5 vs per-run) như metric chính cho production reliability, không chỉ per-run pass rate.
  - Mọi self-evolution phải có Consistency Analyzer + Guideline Generator → episodic memory, không chỉ retry.
  - Self-improvement không cần verified answers: dùng SOLID pattern — multiple rollouts → cluster → majority pseudo-reference → group-relative advantages.
  - Intra-group feedback consistency là boundary — nếu feedback trong group không consistent → optimization unstable, phải fix environment trước.

### KN-033 — Recursive Self-Improvement — Roadmap 5 tầng autonomy + Research RSI (2609.11873v1, 2609.10702v1) (major)
- **Bài học:** Đo RSI theo 5 tầng autonomy (execution → strategy → experience → environment → meta); scenario-specific; test riêng learning / generalization / retention
- **Bug report:** www/library/export.json
- **Cách phòng tránh:**
  - Tự đánh giá "self-improving" theo 5 tầng autonomy — đang ở tầng nào, tầng sau là gì.
  - Không đòi meta-improvement khi mới ở execution autonomy (bỏ bước → ảo giác năng lực).
  - Claim "học được" phải test riêng 3 thứ: learning / generalization / retention — không dùng performance quen thuộc.
  - Cải thiện phải lưu vào process (knowleged/skills/harness), không chỉ fix instance — nửa giá trị RSI là process improvement.
  - Scenario-specific: không copy timetable/approach giữa các domain khác tốc độ.

### KN-034 — Ecdysis — Failure diagnosis: model-specific vs harness-level, aggregate cross-task (2609.11677v1) (major)
- **Bài học:** Aggregate cross-instance failures → recurring cross-task pattern = harness deficiency; multi-role diagnosis; verify trên unseen tasks (1.84x speedup, +18.56% accuracy)
- **Bug report:** www/library/export.json
- **Cách phòng tránh:**
  - Failure lặp ≥2 task → aggregate cross-task TRƯỚC khi sửa — tìm pattern chung thay vì fix từng case.
  - Phân loại rõ trước khi fix: model-specific (prompt/context) hay harness-level (process/script/gate thiếu)?
  - Fix harness-level = thêm gate/check/step vào process — không chỉ hạ prompt riêng lẻ.
  - Verify fix trên UNSEEN tasks — không chỉ re-test task đã fail (kháng overfit).
  - Đo cả chi phí (speedup) lẫn chất lượng (accuracy) — không đánh đổi mù.

### KN-035 — Negative Self-Distillation — học bằng tránh flaws, giữ uncertainty (2609.11699v1) (major)
- **Bài học:** Học bằng diverge khỏi flawed reasoning tự sinh (negative teacher) + dynamic gating chỉ đánh reasoning-critical tokens; giữ uncertainty + exploration
- **Bug report:** www/library/export.json
- **Cách phòng tránh:**
  - Khi dạy (prompt/few-shot/reflect): đừng imitate "trace trông hoàn hảo" — giữ chỗ cho uncertainty + exploration.
  - Ví dụ âm (failure case) giá trị cao — nhưng phải chỉ đích danh flaw (flaw-targeted), không phủ nhận toàn bộ output.
  - Không suppress "tôi không chắc" — uncertainty đúng chỗ là capability, không phải lỗi.
  - Học từ lỗi: tách "lỗi hành vi reasoning" khỏi "phần ngôn ngữ/diễn đạt đúng" — chỉ sửa phần lỗi (paper: gate token; người: gate scope).
  - Ưu tiên học từ flaws tự sinh (self-generated negatives) hơn phụ thuộc reference đúng hoàn hảo.

### KN-036 — Auto-RecSys + Cognitive Digital Twin — cognitive-procedural separation + dual-loop evolution (2609.10922v1, 2609.09625v1) (major)
- **Bài học:** Tách cognitive (skill file NL) ↔ procedural (script deterministic enforce); dual-loop: Execution Evolution (ghi failed + crystallize success) + Idea Evolution; feedback đóng vòng lên cả representation
- **Bug report:** www/library/export.json
- **Cách phòng tránh:**
  - Reasoning (LLM) và correctness (script deterministic) phải tách path — đừng để LLM tự enforce operational invariants.
  - Playbook phải ghi cả FAILED attempts, không chỉ successful pipelines — failed attempts là nửa knowledge.
  - Memory persistent + recoverable xuyên session/failure — không để state chỉ nằm trong 1 run.
  - Long loop → tìm cách parallel + async hóa thay vì chờ serial.
  - Feedback loop phải đóng lên CẢ 2: experience refinement + representation update (quan hệ/annotation) — không chỉ append experience.

### KN-037 — Evals Gap — "single biggest predictor" là evals discipline (Andrew Ng, Agentic AI Playbook 2026) (major)
- **Bài học:** Thêm Evals Gate vào Verify: rubric trước → component evals (từng bước) → E2E evals (goal achieved) → error analysis (aggregate cross-task) — "single biggest predictor" theo Ng
- **Bug report:** books/Andrew-Ng-Agentic-AI-Playbook-2026-Distilled.md
- **Cách phòng tránh:**
  - Trước Verify: viết rubric tiêu chí cụ thể — không đánh giá "trông ổn", không để model tự khen mình (KN-023).
  - Component evals: plan đúng chưa → implement đúng chưa → output đúng chưa — verify từng bước, không chỉ nhìn kết quả cuối.
  - E2E evals: chạy scenario thật từ đầu đến cuối, đo goal achieved — build xanh ≠ chất lượng.
  - Error analysis: failures cùng loại ≥2 → aggregate TRƯỚC khi fix (KN-034); fix pattern không fix instance.
  - Chọn pattern có chủ đích theo task, không mặc định thêm agentic loop (KN-022).
  - Claim "nhanh hơn/tốt hơn" phải kèm số đo — không vibes (KN-019).

### KN-039 — PS 5.1 không hỗ trợ `??` — lệnh PowerShell fail parse "Unexpected token" (major)
- **Bài học:** Cấm cú pháp PS 7+ trong lệnh/script PS: `??` → `if (-not $x) { $x = 'default' }`, ternary → if/else; gặp `Unexpected token` → viết lại toàn lệnh rồi mới re-run · **2026-09-12:** local nâng pwsh **7.6.6** (user-space, no admin) + VS Code default terminal "PowerShell 7"; đo trên 7.6.6: `??`/`&&` OK, `$var?.prop` không brace **sai lặng** (dùng `${var}?.prop`)
- **Bug report:** .agent/bugs/2026-09-11-ps-5-1-khong-ho-tro-trong-lenh-powershell/bug.md
- **Cách phòng tránh:**
  - Sinh lệnh PowerShell: chỉ cú pháp 5.1 — `??` → `if (-not ...)`, `?.` → `if ($a -and $a.b)`, ternary → if/else, `&&` → `;`.
  - `??` trong `.mjs`/Node vẫn hợp lệ — chỉ cấm trong LỆNH PowerShell / `.ps1`.
  - Gặp `Unexpected token '??'` → viết lại TOÀN lệnh rồi mới re-run, không lặp y nguyên (KN-023).
  - Trước Done: grep sweep lệnh mới sinh (plan/docs/session) xem còn cú pháp PS 7.

### KN-043 — Content "đúng chữ nhưng không chạy": path thiếu prefix IDE + thiếu neo ngữ cảnh + khái niệm bị chấm nhưng chưa dạy (major)
- **Bài học:** Content review fresh-eyes + Critic agent độc lập: rubric 6 tiêu chí viết trước → sửa 6 blocker + 10 major (slide "Trước khi bắt đầu" + chip "Cần trước" mọi bài, path prefix đúng IDE, link tải 4 IDE + Node.js, gloss thuật ngữ, tiêu chí đo được) → khóa bằng test (10/10 + full suite 70/70)
- **Bug report:** .agent/bugs/2026-09-12-academy-content-not-actionable/bug.md
- **Cách phòng tránh:**
  - Mọi hướng dẫn (docs/tutorial/slide) phải trả lời đủ **4 câu**: **Cần trước gì · Làm ở ĐÂU · Làm bằng GÌ · KIỂM bằng gì** — thiếu 1 câu = blocker.
  - Path trong hướng dẫn phải **copy-chạy được**: prefix đầy đủ theo IDE — viết xong **grep lại từng path** trong bài trước khi ship.
  - Khái niệm xuất hiện trong tiêu chí/outcome phải được **dạy trước đó hoặc gloss tại chỗ**.
  - Yêu cầu xuyên bài (số IDE, prereq, path) phải **nhất quán** — grep chéo trước khi ship.
  - Tiêu chí hoàn thành phải **đo được** (hành động + đối tượng + kết quả quan sát), không "đương nhiên đạt".
  - Nội dung dạy người mới phải qua **fresh-eyes reader / Critic agent độc lập** TRƯỚC khi ship — như code review (KN-005 áp cho docs).

### KN-044 — RAG grounding chết khi `export.json` thiếu — nút Xuất sai tên + không seed fallback (major)
- **Bài học:** Export đúng tên `export.json` (MCP-ready) + `seed.json` fallback chain trong `search.mjs`/`mcp-server.mjs` — RAG luôn có grounding tối thiểu
- **Bug report:** .agent/bugs/2026-09-03-rag-export-missing-grounding-chet/bug.md
- **Cách phòng tránh:**
  - Grounding phải có **seed tối thiểu trong repo** — RAG không bao giờ "chết trắng" khi thiếu export (degraded, không fail-closed im lặng).
  - Tên file export = tên consumer đọc (single contract) — đổi một đầu phải grep đầu kia; verify bằng `search --status` + MCP sau khi đổi.
  - File gitignore (`export.json`) → mọi consumer phải có fallback chain + báo rõ trạng thái seed/thiếu.
  - **Retrofit note:** bug fixed 2026-09-03 (HIGH confidence) nhưng lesson bị rơi — bug.md ghi "Related KN: KN-013" trong khi KN-013 là chủ đề khác (Ponytail ladder). Audit 2026-09-12 phát hiện thiếu → bổ sung KN-044.

## Anti-patterns (đừng lặp lại)

- - ❌ Test chỉ assert **nội dung đích** (card/text/count) mà không assert **điều hướng tới đích** — 36 test xanh vẫn lọt dot chết (KN-046 + KN-037).
- - ❌ Sửa từng failure riêng lẻ mà không aggregate cross-task → model-specific accommodation mù, overfit, degrade generalization (KN-034).
- - ❌ Bắt chước trace "confidently wrong" khi self-improve/dạy → suppress uncertainty + exploratory behavior; phải học từ flaws có gate (KN-035).
- - ❌ Trộn reasoning (LLM tự do) với operational correctness trong cùng 1 path → fail lặng; tách skill file NL + deterministic script (KN-036).
- - ❌ Đo "đã học được" bằng performance quen thuộc — recover familiar ≠ generalize unseen inputs (KN-033).
- - ❌ Chọn fix ngẫu hiên khi có nhiều cách → áp dụng AAR pattern: propose 3 → benchmark → keep best (KN-010).
- - ❌ Check WHETHER (pass/fail) mà không check HOW (cách làm) → reward hacking (KN-010).
- - ❌ Tự workaround bug thành thói quen vô thức rồi quên đó là bug — habitual mitigations (KN-005).
- - ❌ Fan bias: yêu sản phẩm nên auto mù nhược điểm, bảo "xịn mà" dù user không dùng được (KN-005).
- - ❌ Chỉ dev tự dogfooding (giỏi workaround) thay vì test như user mới / fresh eyes (KN-005).
- - ❌ Nghĩ "dễ mà, chỉ cần làm [chuỗi 7 bước phức tạp]" — user thường bó tay (KN-005).
- - ❌ Code mà không `suggest` KN liên quan trước — dễ lặp bug cũ (KN-007).
- - ❌ Gặp lỗi mà không `log` ngay — để trôi, mất context (KN-007).
- - ❌ Fix xong mà không `propose` KN mới — bài học không được lưu (KN-007).
- - ❌ Tự ghi `knowleged.md` tay không qua propose — sai format, thiếu ID (KN-007).
- - ❌ Import module khởi động server (stdio/HTTP) trong smoke test one-liner — server chờ stdin vĩnh viễn, terminal treo (KN-014).
- - ❌ Self-verify chạy trước khi file cần check được ghi — check phụ thuộc file sinh sau phải ghi tạm (pre-checks) rồi verify final (KN-014).
- - ❌ Regex `^`/`$` trên nội dung multi-line thiếu flag `m` — chỉ match đầu/cuối string, không match đầu dòng (KN-014).
- - ❌ Gọi `fs.rename` folder trần trên Windows — watcher giữ handle → EPERM; dùng wrapper có fallback cp+rm (KN-016).
- - ❌ Gặp EPERM rename mà kết luận "permission sai" — test PowerShell `Move-Item` trước để phân biệt watcher-lock vs ACL (KN-016).
- - ❌ Redirect mọi conversation sang chatbot vì tiện — decollaboration diễn ra "never by decision, always by convenience" (KN-018).
- - ❌ Để AI viết PRD/design 1 phát xong, không có framing đối lập — outsource writing = skip thinking (KN-018).
- - ❌ Thưởng velocity mà không đo diversity — individual productivity tăng nhưng ideas thu hẹp (KN-018).
- - ❌ Cắt workshop/travel/co-location khi budget căng — đó chính là hạ tầng của serendipity (KN-018).
- - ❌ Đánh giá AI productivity bằng cảm nhận ("nhanh hơn hẳn!") không có metrics — METR: kỳ vọng +24%, thực tế −19% (KN-019).
- - ❌ Claim "setup này xịn" mà không đo — trải nghiệm trôi chảy ≠ tiến độ thật (KN-019).
- - ❌ Tin self-report "mình đã check rồi" làm bằng chứng Done — intrinsic self-correction làm accuracy GIẢM, không tăng (KN-023, Huang ICLR 2024).
- - ❌ Hỏi model "chắc chưa?" thay vì đo bằng tool — self-knowledge thua xa human, calibration không generalize sang task mới (KN-023, Yin ACL 2023 + Kadavath 2022).
- - ❌ Để model tự chấm/review output của chính nó — self-preference có hệ thống, tương quan tuyến tính với self-recognition (KN-023, Panickssery 2024).
- - ❌ Lặp nguyên output cũ khi user nói "vẫn lỗi" để chiều lòng — sycophancy do RLHF, phải đổi strategy + đo lại (KN-023, Sharma 2023).
- - ❌ Tin benchmark vendor làm bằng chứng năng lực — benchmark chính là vùng pattern quen; đổi số/thêm mệnh đề nhiễu là sụt tới 65% (KN-023, GSM-Symbolic ICLR 2025).
- - ❌ Chấm năng suất theo output đếm được (LOC, số file, số task) — prolific AI psychosis: hàng nghìn dòng code không utility, metrics thưởng output không thưởng value (KN-024, Jeff Clark MD).
- - ❌ Tin "loss nhìn y win" — slot-machine reinforcement: output tự tin + rẻ khiến counterfeit wins không bị reject (KN-024).
- - ❌ Merge code mà không hiểu nó hoạt động — "couldn't understand my own project" là dấu hiệu psychosis, phải STOP đọc lại/viết lại (KN-024).
- - ❌ Outsource taste/craft cho AI — "taste is felt, not learned"; AI tiết kiệm $400k/năm nhưng phá brand visual (KN-024, Emily Oberg).
- - ❌ Cắt sleep/life outside work để chạy theo AI hype — hyperfocus là triệu chứng psychosis, không phải feature (KN-024).
- - ❌ Agent long-horizon không có procedural structure explicit — unconstrained generation tự quyết thứ tự → lạc, lặp vô ích (KN-025).
- - ❌ Guidance dictate thay vì bias — graph ép solver làm theo, mất khả năng quyết của solver (KN-025).
- - ❌ Self-evolution commit bừa không qua held-out validation + không giữ rejected edits → lặp lại lỗi cũ (KN-025).
- - ❌ Chỉ dùng 1 tốc độ (chỉ state hoặc chỉ policy) — không có alternating loop fast state + slow policy (KN-026).
- - ❌ Consolidate trực tiếp từ raw trajectory vào policy — không distill qua explicit textual state trước (KN-026).
- - ❌ Hypothesis không falsifiable, không test qua interventions, không carry supported/rejected/inconclusive → overfit internal validation (KN-026).
- - ❌ RL long-horizon chỉ nhồi agent-side SFT — không thử environment-side adaptation (FEEs) trước (KN-027).
- - ❌ Chỉ đo per-run pass rate, không đo consistency gap all-5 vs per-run → tưởng reliable nhưng production flip (KN-027).
- - ❌ Self-improvement phụ thuộc verified answers/external evaluator — không dùng SOLID majority pseudo-reference (KN-027).
- - ❌ Bỏ qua intra-group feedback consistency — feedback trong group không consistent mà vẫn optimize → unstable (KN-027).
- - ❌ Verify xong build/test/lint là claim Done cho output open-ended — "chạy được" ≠ "tốt đến đâu"; phải có evals: rubric + component/E2E + bằng chứng đo (KN-037).
- - ❌ Đánh giá output agent bằng "trông ổn" không rubric — critique thiếu tiêu chí = model tự khen mình (KN-037 + KN-023).
- - ❌ Chạy cả agentic loop / multi-agent cho task pipeline vẽ được flowchart — agency là cost phải justify (KN-037 + KN-022).
- - ❌ Sinh lệnh PowerShell bằng cú pháp PS 7+ (`??`, `?.`, `??=`, ternary `? :`) — Windows PowerShell 5.1 fail parse `Unexpected token '??'`, lệnh không chạy (KN-039).
- - ❌ Gặp lỗi parse PS mà re-run y nguyên hoặc vá nửa vời — viết lại TOÀN lệnh theo cú pháp 5.1 rồi mới chạy (KN-039 + KN-023).
- - ❌ Hướng dẫn path/nơi lưu thiếu prefix theo IDE (`skills/…` thay vì `.github/skills/…`) — copy đúng chữ vẫn không chạy; path trong docs phải copy-chạy được + grep lại sau khi viết (KN-043).
- - ❌ Dạy quy trình dùng thuật ngữ chỉ xuất hiện ở tiêu chí/outcome (component/E2E evals, "PRD mini") mà chưa từng định nghĩa — người đọc không tự chấm được (KN-043).
- - ❌ Yêu cầu xuyên bài không nhất quán (bài 2 đòi 1 IDE, bài 3 đòi 2 IDE) hoặc marketing copy mâu thuẫn thực tế ("vào bài nào cũng được" khi các bài có phụ thuộc) (KN-043).
- - ❌ Tiêu chí hoàn thành "rỗng nghĩa" — đương nhiên đạt nếu làm đúng bước trước, không phân biệt được người đã làm với người chưa (KN-043).
- - ❌ RAG/grounding phụ thuộc file gitignore (`export.json`) mà không có seed/fallback — fresh clone là grounding chết, chatbot bịa (KN-044).
- - ❌ Tên file export lệch tên consumer đọc (`library-export-*.json` vs `export.json`) — xuất xong vẫn không ai đọc được (KN-044).

## Nguồn

- `docs/knowleged.md` — KN-005, KN-007, KN-010, KN-014, KN-016, KN-018, KN-019, KN-023, KN-024, KN-025, KN-026, KN-027, KN-033, KN-034, KN-035, KN-036, KN-037, KN-039, KN-043, KN-044
- Chi tiết đầy đủ: `references/evidence.md` (progressive disclosure)
- Regenerate: `node .github/harness/scripts/distill-agnostic.mjs`
