---
name: harness-process
description: "Task-agnostic lessons 'Process & Self-Improvement' chưng cất từ docs/knowleged.md (37 KN: KN-005, KN-007, KN-010, KN-014, KN-016, KN-018, KN-019, KN-023, KN-024, KN-025, KN-026, KN-027, KN-033, KN-034, KN-035, KN-036, KN-037, KN-039, KN-043, KN-044, KN-047, KN-053, KN-054, KN-056, KN-057, KN-060, KN-062, KN-064, KN-065, KN-066, KN-067, KN-068, KN-069, KN-075, KN-077, KN-078, KN-080) + .agent/bugs/. Use when task chạm process, quality, ux, perf, a11y, knowledge, automation, dx, self-improving, benchmark — áp Cách phòng tránh trước khi code, tránh lặp bug cũ. DisCo-lite, regenerate bằng distill-agnostic.mjs."
user-invocable: false
---

# Harness Process & Self-Improvement — Bài học task-agnostic (DisCo-lite)

> Chưng cất từ `docs/knowleged.md` + `.agent/bugs/` — **KHÔNG sửa tay**, regenerate bằng `node .github/harness/scripts/distill-agnostic.mjs`. Nguồn: DisCo arXiv:2609.02749v1 §3.2 (task-agnostic).

## When to Use

- Task chạm theme **Process & Self-Improvement** (tags: process, quality, ux, perf, a11y, knowledge, automation, dx, self-improving, benchmark, aar, mcp, testing, regex, windows, fs, collaboration, diversity, pilot-in-command, metrics, evidence, research, verification, calibration, psychology, taste, human-judgment, agent, self-evolving, procedural-graph, a-jit, memory, funnel, rl, consistency, self-distillation, scaffold, rsi, harness, failure-diagnosis, reasoning, uncertainty, architecture, playbook, evals, agentic-patterns, powershell, scripts, hooks, content, docs, verify, fresh-eyes, rag, grounding, slop, complexity, git, recovery, recurrence, guard, review, skills, eval, context-engineering, env, concurrency, exploration, replay, wise-loading, token-budget, fail-closed, gate, data, false-green, reproducibility)
- Trước khi code/fix — áp **Cách phòng tránh** ngay để không lặp bug cũ
- Review/plan — check anti-patterns bên dưới

## Bài học (37 KN)

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
  - **Bổ sung (Science persuasion, 2026-08-20):** bằng chứng thực nghiệm cho Why3 (RLHF ưu tiên câu thuyết phục hơn câu đúng): post-training để thuyết phục → persuasion **+51%** nhưng **giảm trung thực có hệ thống** (accuracy giảm ở đúng chỗ persuasion tăng); cơ chế thắng của chatbot = **fact-density** (claims kiểm chứng được / conversation — R²≈0.89) + tốc độ viết; ép về tốc độ+dài bằng người → lợi thế 0.0pp; Claude bịa chi tiết luật (Đức/Scotland) khi thuyết phục. → Luật YUNIE: **inform ≠ manipulate** — không dùng mật độ facts/nịnh để "thắng" user (mirror `yunie-personality` §15); model thuyết phục giỏi càng phải verify chặt (KN-019: tin vào fluency = bug). Nguồn: Science 20/08/2026 — mirror `www/ai-news/curated.json` (curated-science-persuasion-fact-density).

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
  - **Trạng thái wire (review 2026-09-18):** Evals Gate hiện **prompt-enforced** (verify.prompt + skill `evals-gate`) — `eval-gate.mjs` trong generate-status là **smoke syntax/MCP**, KHÔNG phải rubric/component/E2E evals → gate máy cho evals còn yếu (disclosure chủ đích — tránh tên gate tạo cảm giác "đã gated").
  - **Update 2026-09-22 (Harness 2.5 — update disclosure):** gate máy đã mạnh lên: `eval-gate --scope components` chạy registry `.github/harness/evals/components.json` (7 mắt xích, expectations đo thật) + `--scope grounding` (fact-grader: số/quote phải có trong sources — invented = fail, học Opus 5.5 22/09); `--scope all` gồm components (generate-status). Guard: `tests/e2e/eval-gate-components.spec.ts`. Lưu ý phát hiện cùng ngày: eval-gate **fail-silent trên Windows** (isMain `split('/')` — exit 0 không chạy gì; đã fix class 10 script + guard "phải in output") — xem bug `.agent/bugs/2026-09-22-eval-gate-fail-silent-tren-windows-ismain-backslas/`.

### KN-039 — PS 5.1 không hỗ trợ `??` — lệnh PowerShell fail parse "Unexpected token" (major)
- **Bài học:** Cấm cú pháp PS 7+ trong lệnh/script PS: `??` → `if (-not $x) { $x = 'default' }`, ternary → if/else; gặp `Unexpected token` → viết lại toàn lệnh rồi mới re-run · **2026-09-12:** local nâng pwsh **7.6.6** (user-space, no admin) + VS Code default terminal "PowerShell 7"; đo trên 7.6.6: `??`/`&&` OK, `$var?.prop` không brace **sai lặng** (dùng `${var}?.prop`) · **2026-09-13:** hook command phải metachar-free — cấm ngoặc/chấm phẩy/`&`/pipe/backtick trong echo (subexpression); lưới máy `hooks-integrity.spec.ts`
- **Bug report:** .agent/bugs/2026-09-11-ps-5-1-khong-ho-tro-trong-lenh-powershell/bug.md
- **Cách phòng tránh:**
  - Sinh lệnh PowerShell: **ad-hoc** — kiểm `$PSVersionTable` trước (Major ≥7: cú pháp hiện đại OK; session 5.1 → viết 5.1); **artifact commit repo** (.ps1/workflow/snippet docs) — giữ 5.1 floor: `??` → `if (-not ...)`, `?.` → `if ($a -and $a.b)`, ternary → if/else, `&&` → `;`.
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

### KN-047 — Slop accumulation: code pass hết test vẫn mục dần khi agent extend (Slop Gate) (major)
- **Bài học:** Slop Gate: `scripts/slop-check.mjs` (dup ≥8 dòng · fn >80 dòng · CC >12, 0-dep · gate exit 1, fail-closed 0-file exit 2) chạy changed files ở Verify + wire verify.prompt/evals-gate/minimal-ladder/harness-workflow; ~200 LOC reviewable; loop-it rerun; spec-vs-wish
- **Bug report:** .agent/plans/harness-slop-gate/gap-analysis.md
- **Cách phòng tránh:**
  - Done = **command** fail-loudly từ ngoài workspace, không phải model tự chấm ("✅ All tests passing!" không đếm) — KN-047 + KN-023.
  - Chạy `node scripts/slop-check.mjs <changed files>` trước Done; code pass mọi behavior test vẫn có thể mục dần.
  - Checklist item phải **testable** — "Supports CSV" là wish, không phải spec (comma trong quoted field? bad row?) — sửa luật KN-020.
  - Diff reviewable ~≤200 LOC (không tính generated) — vượt → chia bounded task.
  - Checks pass rồi có gì đổi → **rerun** (yesterday's green không áp dụng).
  - Mutation testing phải **chạy test thật** — proxy `node --check` = smoke detector hết pin; đừng tin "survived" của `mutation.mjs` lite (task riêng).
  - Property tests (vary inputs) là technique đáng dùng khi có parser/validator — không cần lib trong 0-dep.

### KN-053 — `git checkout HEAD -- <file>` revert nhầm refactor chưa commit — recover bằng VS Code Local History (major)
- **Bài học:** CẤM checkout/reset khi file uncommitted (check git status/diff TRƯỚC, fail-closed); commit từng file khi refactor xong (bounded); recover bằng VS Code Local History (verify markers entry trước restore); restore bằng byte-level copy, không `git show \
- **Bug report:** .agent/bugs/2026-09-13-git-checkout-head-revert-nham-refactor-chua-commit/bug.md
- **Cách phòng tránh:**
  - **CẤM `git checkout HEAD -- <file>` / `git reset --hard` khi file có uncommitted changes** — pre-check bắt buộc: `git status --short <file>` + `git diff --stat <file>` phải trống trước khi chạy (fail-closed).
  - Tạo orig byte-exact đúng quy trình: (1) copy refactored → keep-file; (2) checkout; (3) copy làm `.orig`; (4) copy keep-file về — hoặc đơn giản hơn: Copy-Item working tree trước khi edit (đầu session).
  - **Commit từng file khi refactor xong** (bounded task) thay vì dồn cuối session — file chưa commit = vùng nguy hiểm của mọi thao tác phá hoại.
  - VS Code Local History là safety net đáng tin: nhớ đường dẫn + luôn verify markers entry trước khi restore (entry có thể là bản dở dang).
  - Restore file bằng byte-level copy (`Copy-Item`/`git checkout` + copy) — KHÔNG dùng PowerShell string-piping (`git show | Out-File`) vì mangle encoding/EOL → test ra kết quả SAI giả (gặp trong cùng session).

### KN-054 — ADHD/Executive Function: harness là khung xương ngoài của não — externalize, đừng "cố gắng hơn" (minor)
- **Bài học:** Externalize mọi thứ (bộ nhớ/thời gian/luật/động lực): instruction `executive-function` (6 EF ↔ cơ chế thật) + output rules ADHD-friendly (kết luận trước, 1 next step, chunk, micro-win) + trang www + focus guard
- **Bug report:** .agent/plans/executive-function/
- **Cách phòng tránh:**
  - Gặp behavior lạ (loop/quên/né/wall-of-text) → tra bảng EF failure modes TRƯỚC khi coi là bug mới.
  - Không "cố gắng hơn": retry nguyên strategy = hyperfocus loop; đổi hypothesis/tool rồi đo lại (KN-023).
  - Mọi task >2 bước có visible progress; decision quan trọng ghi ra file (plans/knowleged) — không giữ trong đầu.
  - Output cho người: kết luận trước + 1 next step + chunk + micro-win; không tường chữ (đồng bộ yunie-personality §7/§17/§18).
  - Externalize là tài sản thiết kế, không phải crutch — ai đề xuất cắt todo/limit/plan "cho nhanh" thì trả lời bằng mô hình EF (đối trọng `minimal-ladder`: cắt waste, không cắt khung xương).

### KN-056 — Vòng chống tái lập: KN không lưới = wishlist — log RADAR + Guard gate + `guards` audit (major)
- **Bài học:** Vòng chống tái lập: log tự RADAR (BM25 25/18) + propose GUARD GATE (`--strict` exit 1) + `guards` coverage audit; tái lập thật → nâng lưới TRƯỚC, fix SAU; fix regex severity `[^\w]*`
- **Bug report:** .agent/bugs/2026-09-13-kn-recurrence-no-guard/bug.md
- **Cách phòng tránh:**
  - Bug major/critical: **Guard bắt buộc** — test mới / invariant mới / `- **Guard:** <path>`; thiếu = chưa Done (`propose --strict` là gate).
  - RADAR báo nghi tái lập → đọc Cách phòng tránh TRƯỚC; xác nhận tái lập thật → ghi "tái lập của KN-XXX — vì sao lưới cũ không bắt được" → **nâng lưới TRƯỚC, fix SAU** (fix lại y nguyên = sửa lần 3 chắc chắn xảy ra).
  - Định kỳ chạy `guards` — trả nợ lưới cho major/critical dần.
  - Phép đo là hạ tầng: metric/priority build trên parser hỏng = sai âm thầm — test cả phép đo (priority ≥10), không chỉ đo data.
  - **Amend 2026-09-18 (OCR review — guard ảo):** `guards` bỏ ref dạng **chuỗi trần** `'KN-XXX'` (fixture DATA — dream.spec row/block, kn-id-integrity id-arithmetic) — đếm là lưới = guard ảo (KN-049 class: đo nhầm tín hiệu; bug `.agent/bugs/2026-09-18-guards-fixture-refs-luoi-ao/`). Thêm **negative control** trong spec; sau khi đo sạch bồi 6 net thật (KN-002 parity · KN-011 · KN-042 · KN-043 · KN-045 · KN-055).
  - **Amend 2026-09-18 (integrate — phương bắc Bend):** "LAWS.bend = AGENTS.md backed by proof" — law khai báo + proof checker nhanh cho agent (0.38s cho 3,200 instantiations vs Lean 6s / Rocq 19s) → merge bug = theorem bất khả thi (mirror `curated-bend-proof-agent-language`). Chưa adopt (young, backend-only — dissent giữ nguyên) nhưng là đích của "rule máy giữ được": law file được máy enforce, không phải văn xuôi.

### KN-057 — Ranh giới vibe coding vs engineering ở review/verify chain, không ở label — "keep holding the wheel" (minor)
- **Bài học:** Neo ranh giới vào review/verify chain, không vào label: vibe-only OK cho prototype/demo; hệ thống nhạy cảm bắt buộc review + verify; "hiểu mới merge"; "AI viết" không phải thẻ miễn trách nhiệm — keep holding the wheel
- **Bug report:** —
- **Cách phòng tránh:**
  - Trước khi gọi output AI là "engineering/sản phẩm sẵn sàng": hỏi **"verify chain ở đâu?"** — review + reproduce + test + audit; thiếu → chỉ là prototype (label không thay bằng chứng — KN-019).
  - Sản phẩm chạm dữ liệu nhạy cảm (tiền/y tế/cá nhân): cấm prompt-and-ship end-to-end — full pipeline + review từng phần (KN-037 + KN-047 + KN-018).
  - Không dùng "AI viết" làm câu trả lời khi sự cố — accountability thuộc người/process đã cho ship (KN-051 + agent-governance §7 "disclosure bắt buộc").
  - Feature AI viết 100% vẫn phải qua câu "mình hiểu không? đọc lại giải thích được không?" trước merge (KN-024).
  - Claim kèm incentive phải tách mechanism vs claim (KN-052): con số "2-4 tuần học basics" trong bài là claim không đo được — lấy cơ chế (hiểu trước khi tin output), không lấy con số làm chuẩn.

### KN-060 — SkillOpt: sửa skill/KN không qua validation gate — edit trôi, rejected edits không thành negative feedback (major)
- **Bài học:** Edit = hypothesis + evidence trước/sau (KN-037); bounded add/delete/replace, không rewrite (KN-047); rejected edits → Anti-patterns (negative feedback); best-version = git + guard; slow/meta update định kỳ (CMB heatmap + Hawking); skill model-agnostic (transfer Codex→Claude Code +59.7)
- **Bug report:** —
- **Cách phòng tránh:**
  - Trước khi sửa skill/KN/instruction: ghi 1 dòng kỳ vọng "tốt hơn ở đâu, đo bằng gì" — không đo được thì edit phải nhỏ hơn nữa (KN-060 + KN-037).
  - Edit bounded: add/delete/replace nhỏ; rewrite toàn file = nghi vấn — tách thành nhiều edit có lý do (KN-060 + KN-047).
  - Edit bị loại/backtrack → ghi vào Anti-patterns, đừng xoá — cùng một edit lỗi không được đề xuất lại (KN-060).
  - Skill giữ model-agnostic (không pin model) — portability là tài sản (SkillOpt: skill train ở Codex thả vào Claude Code +59.7 điểm).
  - Định kỳ gộp/vệ sinh tri thức (CMB heatmap + Hawking) thay vì chỉ thêm (KN-060 + KN-024).
  - Guard line của KN mới phải nằm trong **2500 ký tự đầu** của detail (`kn-parse.mjs` cap `detail = block.slice(0,2500)` cho scoring) — đặt ngay sau Severity; nếu không, `guards` không detect dù lưới tồn tại (gặp thật 14/09: index 2857 → "missing").

### KN-062 — Memora: tách "lưu gì" khỏi "lấy thế nào" — gộp thay vì phân mảnh, retrieval có stop condition (major)
- **Bài học:** Giữ hình dạng Memora: row tóm tắt = abstraction scan-được, Chi tiết = value, tags = cue anchors (suggest cộng ×2); GỘP hiểu biết mới vào KN cũ (dup-gate `evaluate --dir` + hint GỘP, bypass có disclosure); defer qua Hawking; MemLoop = CMB cold spots
- **Bug report:** —
- **Cách phòng tránh:**
  - Trước khi tạo KN mới: kiểm dup-gate (`evaluate`/RADAR) — trùng ≥ threshold → GỘP (amend) KN cũ thay vì fragment; bypass false-positive phải disclosure (KN-062).
  - Row "Bài học (1 câu)" giữ vai primary abstraction — không nhồi detail; tags chọn theo *đường truy cập* (cue anchors) không viết cho có (KN-062).
  - Draft non → defer (Hawking) thay vì commit sớm; KN 0 tham chiếu lâu = cold spot → gộp/viết lại (CMB heatmap) (KN-062 + KN-049).
  - Detector cố tình bắt rộng (substring matching) — false-positive là chuyện thường: người quyết định gộp/tách + ghi disclosure (KN-062 + KN-052 class).

### KN-064 — Echoverse co-evolution: check đỏ đọc 2 lần theo tầng (world-first) — defect không thành bài học; guard tiến hoá (held-out · diversity > volume) (major)
- **Bài học:** Check đỏ đọc 2 lần (quy tầng → sửa world trước → chỉ failure sống sót mới thành lesson); guard tiến hoá cùng capability
- **Bug report:** .agent/bugs/2026-09-14-echoverse-co-evolution-check-do-doc-2-lan-world-fi/bug.md
- **Cách phòng tránh:**
  - Trước khi fix check đỏ → trả lời tầng lỗi (code · test-spec · env-fixture · measure-verifier · task-spec); không trả lời được → điều tra, không fix (Root Cause Gate).
  - Nghi fixture/spec/đo hỏng → sửa world TRƯỚC + re-run; chỉ failure sống sót cả stack mới viết KN/anti-pattern/bug lesson.
  - **Ranh giới KN-012:** world-first KHÔNG được dùng để nới spec/xoá assertion — spec/test vẫn immutable (deny-test-mutate; amend chỉ bởi verify actor). Cấm hạ expectation để đỏ thành xanh.
  - Guard mới: assert outcome/state (không appearance) + held-out form hoặc negative control (KN-049) — shallow guard phản tác dụng, không phải "an toàn hơn".
  - `Layer:` là gợi ý nghi vấn, không phải luật — attribution cuối = judgment người.
  - Số liệu nguồn self-measured → chỉ corroboration; evidence chính = bug corpus local.

### KN-065 — Orchard: verify/train phải chạy TRONG harness thật — stand-in đơn giản hoá tạo mismatch vô hình (major)
- **Bài học:** Check/học chạy trong harness thật khi có thể (shell/browser/serve/IDE thật); stand-in = smoke dán nhãn "not proof"; đổi env → re-run; portability xuyên runtime là tài sản
- **Bug report:** .agent/bugs/2026-09-14-orchard-verify-train-trong-harness-that-stand-in-m/bug.md
- **Cách phòng tránh:**
  - Verify trong môi trường đích khi có thể: shell thật (KN-039) · browser thật kể cả channel hiếm (KN-031) · serve/deploy thật (KN-030/KN-045) · IDE/folder thật (KN-043) · viewscreen/iframe thật (KN-058).
  - Stand-in buộc dùng → dán nhãn "not proof" (như `mutation.mjs` "lite — đừng tin survived", KN-047).
  - Đổi môi trường/dependency/model-router → "đáng một lần eval" dù code không đổi (KN-047 yesterday's green; Foundry curated: router đổi pool).
  - Không port hạ tầng training vào harness file-based — adopt rule (vocabulary), không adopt framework (minimal ladder).
  - Portability xuyên harness/runtime là tài sản (KN-060) — check chạy trên chromium + msedge, local + CI.

### KN-066 — KN ID double-yield: đa phiên song song cùng nhận 1 ID — re-check trước paste + detector integrity sau paste (major)
- **Bài học:** Spec `kn-id-integrity.spec.ts`: dup 2 danh sách + orphan + order + negative control (assert động); protocol re-check ID trước/sau paste; gap 061 không cấp lại; **đã wire:** `status` cảnh báo trùng ID (`idIntegrity` — `checkKnIntegrity` shared `kn-parse.mjs`)
- **Bug report:** .agent/bugs/2026-09-14-kn-id-double-yield-da-phien-cung-1-id/bug.md
- **Cách phòng tránh:**
  - **Trước paste:** `findNextKnId` + grep `### KN-0XX` + `| KN-0XX |` — ngay trước khi ghi (cửa sổ race chính là propose→paste).
  - **Sau paste (trước commit):** chạy `npx playwright test tests/e2e/kn-id-integrity.spec.ts` — đỏ → renumber + update toàn bộ self-refs rồi mới commit.
  - **Phát hiện muộn:** bên phát hiện sau LÀ bên yield (14/09 yield 2 vòng + 1 vòng live) + ghi disclosure trong commit/note; update note điều phối của phiên khác nếu họ đã "dự kiến" số đó.
  - **Gap không tái sử dụng:** 061 bỏ trống có chủ đích — tránh ambiguity "061 là bài nào"; ID tiếp theo luôn max+1.
  - **Multi-session:** coi mọi file giữa các phiên là concurrent — trước mutate kiểm `git status`/diff (KN-053); commit pathspec-limited khi index chung bẩn (đừng `git add` tràn — sweep 99ca722).

### KN-067 — Dream-RSI: replay history = simulator zero-cost — dream policy thay vì chạy lại; π₀-in-set + đừng nhồi semantic priors (major)
- **Bài học:** Replay history trước khi trả giá re-run (dream/evaluate/fixtures/audit); π₀ luôn trong candidate set (winner never worse — AAR là instance); không nhồi semantic priors vào exploration; history phải replayable (KN-066); dogfood `dream.mjs` v0 recall@3 100% (34/34)
- **Bug report:** .agent/bugs/2026-09-15-dream-rsi-history-la-simulator-dream-policy-zero-c/bug.md
- **Cách phòng tránh:**
  - Thay đổi process/skill/guard → replay history trước (dream/evaluate/fixtures/audit verify), rollout thật chỉ cho winner.
  - Mọi vòng improvement: π₀ (bản hiện tại) PHẢI nằm trong candidate set — winner never worse; thiếu baseline = thiết kế sai.
  - Cấm nhồi "insight cấp cao" vào prompt của long-horizon/parallel exploration như prior cứng — strong priors over-constrain; đo trước khi tin (KN-018 + KN-035).
  - History muốn replay được phải GHI ĐÚNG: audit hash-chain · versions snapshot · bug.md đầy đủ · integrity spec (KN-066) — replay chỉ exact trên history nguyên vẹn.
  - Compute adaptive: tiến bộ → siết budget (bounded/3-fix), plateau → escalate/bung — mirror policy học được của Dream-RSI (110→50 attempts, widening khớp cú nhảy score kế tiếp).
  - Kích hoạt thủ công: `node .github/harness/scripts/dream.mjs score --file <candidate>` hoặc `run --candidate a --candidate b` — deploy winner = MANUAL (dream không ghi file nào).

### KN-068 — Instruction pool always-on phình không ngưỡng: kế toán + ratchet + gate (budget:check) (major)
- **Bài học:** Kế toán `instruction-budget.mjs` theo applyTo (dòng/~token); ratchet 1400 + gate `budget:check`; §7 quy ước 🤖 = máy giữ (trỏ check, không restate); thêm always-on → path-scope hoặc gộp trước
- **Bug report:** .agent/bugs/2026-09-16-instruction-budget-always-on-phinh-khong-nguong/bug.md
- **Cách phòng tránh:**
  - Thêm file/dòng always-on mới → chạy `npm run budget:check` trước Done; vượt ratchet hiện hành (1100 từ 18/09) → path-scope (`applyTo` hẹp hơn) hoặc gộp.
  - Anti-pattern mới: nếu máy giữ được → thêm guard + trỏ check; không thì ghi rõ lý do không-guard-được (§7 quy ước 🤖).

### KN-069 — Gate fail-open với arg rác: NaN-pass ẩn (exit 0) — gate phải validate MỌI input tại boundary (major)
- **Bài học:** Validator `Number()`+`Number.isFinite` → exit 2; flag có mặt ⇒ phải có giá trị hữu hạn; whitelist arg lạ → exit 2; guard 5 assert test cả đường ARG
- **Bug report:** .agent/bugs/2026-09-18-instruction-budget-gate-fail-open-voi-arg-khong-ph/bug.md
- **Cách phòng tránh:**
  - Gate/script numeric arg: `Number()` + `Number.isFinite` + flag-có-mặt-phải-có-giá-trị + whitelist arg lạ — mọi input rác → exit 2.
  - Thêm gate mới: test cả đường ARG (không chỉ dir/file) ở chế độ fail-closed — coverage gap của guard asset chính là lỗ fail-open lần này.
  - Coi tool fail-closed như trust boundary: validate mọi input trước khi dùng, không tin "user luôn đúng".

### KN-075 — Viết nội dung về thực thể có tên mà không xác minh danh tính trước (Space Bunny bị mô tả thành "sản phẩm AI tự nghĩ") (major)
- **Bài học:** Research phase bắt buộc + `research.md` evidence ledger nhãn A/B/C/D; mỗi claim phải truy được về 1 dòng ledger (không truy được → cắt hoặc ghi “chưa xác minh”); thông số cần ≥2 nguồn độc lập; nguồn mâu thuẫn → nêu mâu thuẫn, không chọn phe
- **Bug report:** .agent/bugs/2026-09-23-space-bunny-mo-ta-sai/bug.md
- **Cách phòng tránh:**
  - Viết nội dung về **thực thể có tên** → tra nguồn gốc TRƯỚC, lập evidence ledger; **một câu mô tả ngắn của user không phải là grounding**.
  - Phân biệt 2 loại “Explore”: đọc **codebase** (repo) vs xác minh **thực thể ngoài repo** (sản phẩm/model/công ty/người) — cái sau cần nguồn ngoài, không suy từ tên.
  - Claim về thông số (context/size/benchmark) phải có **≥2 nguồn độc lập** hoặc ghi rõ “chưa xác minh”; thấy nguồn mâu thuẫn → giữ cả hai, không chọn phe có lợi cho kịch bản.
  - Nếu user đã cung cấp danh tính trong câu lệnh, vẫn phải kiểm: tên đúng nhưng **bản chất** (model? sản phẩm? dịch vụ? công ty?) có thể vẫn sai.

### KN-077 — Setup doctor Windows port probe bị nhiễu và đo sai (minor)
- **Bài học:** Structured native probe (`netstat`/`lsof`/`ss`) + `listening
- **Bug report:** .agent/bugs/2026-09-25-setup-doctor-windows-port-probe-noise/bug.md
- **Cách phòng tránh:**
  - Mọi CLI cross-platform phải chọn probe native theo OS; không hard-code Unix-only commands.
  - Dùng `execFileSync` + `stdio` để command không tồn tại không rò stderr; không nuốt lỗi mà mất tín hiệu.
  - Phân biệt `listening`, `free`, `unknown`; probe failure phải fail-closed, không được báo free.
  - Test **free port** (negative), **listener thật** (positive), và **probe failure** (unknown) trước khi tin `PASS`; wire self-test vào component eval.
  - Đây là recurrence của portability/fail-silent pattern; guard cũ chưa bao phủ `setup-doctor` nên phải thêm probe vào checklist.

### KN-078 — Power sweep false green — liveness không phải health (major)
- **Bài học:** Mọi link health phải có assert điều kiện (forbid drift/threshold/freshness) + negative control chạy thật; aggregator mới phải tự chạy full-suite trước khi tin
- **Bug report:** .agent/bugs/2026-09-25-power-sweep-false-green-liveness-khong-phai-health/bug.md
- **Cách phòng tránh:**
  - Mỗi link health phải có **assert điều kiện** (forbid/threshold/freshness), không chỉ marker-in-output.
  - Trước khi gọi một gate là “fail-closed”, chạy **negative control thật** cho từng link (giả lập trạng thái xấu → phải ĐỎ).
  - Aggregator/gate mới phải tự chạy **full-suite + runtime thật** một lần trước khi tin (KN-065) — và phải có 1 link tự bảo vệ (self-test nằm trong component evals).
  - Marker văn bản dùng để chứng minh “đã chạy”; điều kiện dùng để chứng minh “khỏe” — không trộn hai loại.
  - Chạy `node .github/harness/scripts/auto-learn.mjs suggest "gate fail-closed marker false green"` trước khi viết gate/aggregator mới.

### KN-080 — Eval/benchmark kết luận quá tự tin so với evidence (self-audit rank stability) (major)
- **Bài học:** Benchmark/so sánh phải report rank stability + sensitivity (≥2 cách tổng hợp) + provenance raw per-run + ngày đo (shelf-life: deprecate → re-run); top-2 trong noise → chọn bản đơn giản hơn, không tuyên "best" từ 1 campaign
- **Bug report:** —
- **Cách phòng tránh:**
  - Trước khi tuyên "best/better": hỏi "delta có lớn hơn noise không?" — top-2 xấp xỉ → chọn bản đơn giản hơn (minimal-ladder tiebreak) hoặc giữ π₀ (KN-067), không tuyên best từ 1 campaign.
  - Mọi báo cáo eval/benchmark ghi `Measured: YYYY-MM-DD` + raw runs + độ bất định; kết luận vững ở vùng nào của bảng (đáy > top).
  - Chạy sensitivity (mean/median/majority) — kết luận đổi theo quy tắc thì ghi rõ phụ thuộc, không trưng bảng như chân lý.
  - Eval có shelf-life: model/endpoint/API deprecate → kết quả hết hạn, re-run trước khi tái dùng (10 tuần giết 4/8 endpoint).
  - Reproducible ≠ correct: tái lập + ground truth độc lập (rubric/grounding) là 2 lớp khác nhau.

## Anti-patterns (đừng lặp lại)

- - ❌ Tuyên "best/better" từ 1 campaign small-sample mà không report rank stability + sensitivity + ngày đo — self-audit 2609.30074: chỉ đáy bảng vững (top 68%, middle 27–48%), 2 quy tắc merge hợp lý đổi 4/8 hàng; top-2 trong noise → chọn bản đơn giản hơn, không tuyên best (KN-080 + KN-037 + KN-019).
- - ❌ Gọi một aggregator/health-check là “fail-closed” khi link của nó chỉ assert liveness (exit 0 + in header) — phải có assert điều kiện (forbid drift/floor/freshness) + negative control chạy thật cho TỪNG link; marker “đã chạy” không chứng minh “khỏe” (KN-078 + KN-074).
- - ❌ Diagnostic CLI cross-platform hard-code `lsof`/`ss`/`grep`, biến probe failure thành `free`, rồi coi exit 0 là health thật — phải branch native probe, trả `unknown` fail-closed, test free + listener + probe-failure (KN-077 + KN-074).
- - ❌ Gate/script tự nhận pass mà không chứng minh ĐÃ CHẠY — isMain sai platform (argv[1] backslash Windows) → exit 0 không output, verifier đọc exit code → “PASS” rỗng nhiều tháng; verifier đọc trạng thái bằng regex giả định format khác template thật (`Status:` vs `**Status:**`) → isFixed/isOpen luôn false. Gate phải fail-loud + lưới “phải in output”; `isMain` dùng `split(/[\\/]/)`; regex test với chính format template sinh ra (KN-074 + KN-069 + KN-015 + KN-047).
- - ❌ Xây machinery "thêm" vì nghe hợp lý (recoverable elision, planner đắt, tool surface lớn) mà không đo component-level — arXiv 2609.20804: recoverable content model hiếm dùng + 0 gain; bash-only đủ cho model bash-giỏi; elision rule-based trước summarization (KN-072 + KN-037 + KN-047).
- - ❌ Thêm file/dòng instruction `applyTo: "**"` mà không chạy `npm run budget:check` — pool always-on là thuế token thường trú; thêm rẻ, xóa không ai nhớ; anti-pattern mới phải phân loại "máy giữ được không" (máy giữ → guard + trỏ check, không restate) (KN-068).
- - ❌ Gate/script validate input lỏng: `parseInt` arg rồi so sánh (NaN luôn false → "pass" oan + exit 0), flag thiếu giá trị nuốt im lặng, arg lạ/dạng `=` không chặn — gate fail-closed phải exit 2 với MỌI input rác; test cả đường ARG chứ không chỉ dir/file (KN-069).
- - ❌ Chạy lại từ đầu để đánh giá thay đổi process/KN/guard khi history đã ghi sẵn outcome — replay trước (dream/evaluate/fixtures/audit verify — 0 execution), rollout thật chỉ cho winner; vòng improvement thiếu π₀ (bản hiện tại) trong candidate set = không có bảo chứng "winner never worse" (KN-067 + KN-060).
- - ❌ Đọc mọi check đỏ là "code sai" — quy tầng trước (code · test-spec · env-fixture · measure-verifier · task-spec); defect ở world sửa TRƯỚC, chỉ failure sống sót mới thành bài học (KN-064 + KN-034 + KN-049).
- - ❌ Viết KN/anti-pattern/bug lesson từ failure do fixture/spec/đo hỏng — "world-first" KHÔNG được hạ expectation để đỏ thành xanh (deny-test-mutate giữ nguyên) (KN-064 + KN-012).
- - ❌ Thấy hiểu biết mới về chủ đề đã có KN mà tạo KN mới ngay — fragment thành chuỗi partial duplicates, summary phình, `suggest` trả mảnh lệch cho cùng câu hỏi; kiểm dup-gate (`evaluate`) trước, GỘP (amend) khi trùng (KN-062).
- - ❌ Tự động hoá "merge candidate" giữa các KN bằng similarity thuần (BM25 tên+tags) rồi gộp/xoá theo điểm — đo thật 14/09 (EvoLib adopt): cặp khác chủ đề vẫn 70–96 điểm (KN-054↔KN-037 86.6 · KN-040↔KN-030 96.1), không phân tách được khỏi cặp liên quan thật (KN-026↔KN-036 80.6) → không dùng làm căn cứ; consolidation giữ human-in-loop: dup-gate lúc nạp + 0-ref policy + git trace (KN-062 + KN-049 + KN-026; chi tiết `.agent/plans/evolib-adopt/proposal.md`).
- - ❌ Nhồi detail vào dòng Bảng tóm tắt / viết tags cho có — abstraction phải scan-được; tags là cue anchors (đường truy cập phụ cho cùng một entry, `suggest` cộng ×2) (KN-062).
- - ❌ Commit tri thức non ngay khi mới log thay vì để chín — Deferred Memory: Hawking escalate/evaporate trước khi vào Bảng tóm tắt (KN-062).
- - ❌ Xây chain failover trong lúc chữa cháy rồi để nguyên dạng implementation detail — không externalize invariants + không lưới = fault-tolerance mất âm thầm qua refactor, suite vẫn xanh (KN-063 + KN-056).
- - ❌ Paste KN mà không re-check ID ngay trước khi ghi — 14/09: 3 phiên cùng nhận KN-061 → double-yield KN-062 → renumber 061→062→063; tái diễn live khi build guard (KN-064/065 bị lấy trong lúc viết — số cuối nhảy tới KN-066); protocol: trước paste `findNextKnId` + grep `#

## Nguồn

- `docs/knowleged.md` — KN-005, KN-007, KN-010, KN-014, KN-016, KN-018, KN-019, KN-023, KN-024, KN-025, KN-026, KN-027, KN-033, KN-034, KN-035, KN-036, KN-037, KN-039, KN-043, KN-044, KN-047, KN-053, KN-054, KN-056, KN-057, KN-060, KN-062, KN-064, KN-065, KN-066, KN-067, KN-068, KN-069, KN-075, KN-077, KN-078, KN-080
- Chi tiết đầy đủ: `references/evidence.md` (progressive disclosure)
- Regenerate: `node .github/harness/scripts/distill-agnostic.mjs`
