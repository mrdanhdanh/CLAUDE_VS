---
name: harness-minimal
description: "Task-agnostic lessons 'Minimal Code & YAGNI' chưng cất từ docs/knowleged.md (4 KN: KN-013, KN-020, KN-022, KN-072) + .agent/bugs/. Use when task chạm process, minimal, ponytail, yagni, dx, verification, review, architecture, agent, harness — áp Cách phòng tránh trước khi code, tránh lặp bug cũ. DisCo-lite, regenerate bằng distill-agnostic.mjs."
user-invocable: false
---

# Harness Minimal Code & YAGNI — Bài học task-agnostic (DisCo-lite)

> Chưng cất từ `docs/knowleged.md` + `.agent/bugs/` — **KHÔNG sửa tay**, regenerate bằng `node .github/harness/scripts/distill-agnostic.mjs`. Nguồn: DisCo arXiv:2609.02749v1 §3.2 (task-agnostic).

## When to Use

- Task chạm theme **Minimal Code & YAGNI** (tags: process, minimal, ponytail, yagni, dx, verification, review, architecture, agent, harness, evals, context-engineering)
- Trước khi code/fix — áp **Cách phòng tránh** ngay để không lặp bug cũ
- Review/plan — check anti-patterns bên dưới

## Bài học (4 KN)

### KN-013 — Tích hợp Ponytail ladder vào Harness v2 (minimal-ladder + lean-product) (minor)
- **Bài học:** Thêm instruction `minimal-ladder` (7 nấc + YAGNI + native-first + dead-code grep) + preset `lean-product` + bật ladder ở full/web-product/api-minimal; trial artifacts giữ ở `.agent/bugs/` + `.agent/plans/n5-blazor-ladder/`
- **Bug report:** .agent/bugs/2026-09-03-n5blazor-ladder-trial-dead-code/bug.md
- **Cách phòng tránh:**
  - Mọi task Implement/Fix: chạy ladder sau khi đọc code, dừng ở nấc đầu tiên đúng.
  - PRD luôn có dòng CẮT (YAGNI) trước dòng GIỮ.
  - Verify luôn grep tên component/css mới + ghi diff stat vào bug/plan.
  - Không cắt validation/security/a11y/test để giảm LOC (lazy, not negligent).
  - Khi `create` instruction xong rồi sửa description: chạy `install --local --force` để refresh registry (tránh stale cache).

### KN-020 — Generate easy, trust hard — output agent phải qua review/benchmark gate (major)
- **Bài học:** Mọi output agent phải qua review/benchmark gate (continuous benchmarking = foundation của self-evolving agents); radically simplify thay vì thêm phức tạp
- **Bug report:** —
- **Cách phòng tránh:**
  - Không bao giờ trust agent output vì "trông đúng" — phải có test/measure (KN-012: check HOW not WHETHER).
  - Continuous benchmarking là foundation của self-evolving agents — benchmark định kỳ, keep best.
  - Radically simplify: mỗi task thêm phức tạp → hỏi YAGNI gate (KN-013).

### KN-022 — Pipeline in a trench coat — agency là cost phải justify (major)
- **Bài học:** Vẽ được flowchart trước khi chạy → build pipeline; agency chỉ đáng trả khi (1) outcome rẻ để verify VÀ (2) verification để lại dấu vết bền vững
- **Bug report:** —
- **Cách phòng tránh:**
  - Trước khi build "agent": hỏi "vẽ được flowchart không?" — vẽ được thì pipeline.
  - Agency phải justify: outcome rẻ verify + check để lại record (audit.jsonl, bug.md) — "trench coat fine as long as the person inside checks the pockets".
  - Multi-agent reconciliation phải deterministic (rule mình sở hữu), không "whoever spoke last wins" — conflict để lại thành record cho human, không ép consensus giả.
  - Boring pipeline là senior move: hệ thống sống qua Wednesday gần như luôn boring hơn hệ thống thắng demo.

### KN-072 — Harness design cần bằng chứng component-level (arXiv 2609.20804, 17/09): elision trước summarization · recoverable machinery = model hiếm dùng · planning = cost saver cho model mạnh (major)
- **Bài học:** Eval component-level (vary 1 thành phần, ≥2 budget); không xây recoverable machinery khi chưa có bằng chứng dùng; tool surface model-aware
- **Bug report:** www/ai-news/curated.json
- **Cách phòng tránh:**
  - Thêm/sửa context strategy: rule-based elision/truncate TRƯỚC, chỉ cân nhắc LLM summarization khi có nhu cầu thật; machinery "recoverable" chỉ xây khi có bằng chứng dùng (mặc định: không).
  - Đánh giá component mới: giữ phần còn lại cố định, vary 1 component, đo ở ≥2 context budget (budget hẹp là nơi giá trị lộ ra).
  - Không suy "model giỏi → cần nhiều tool hơn" — chiều ngược đúng với bash-capable models (bash-only đủ + rẻ hơn).
  - Con số từ paper là của setup paper (4 models, 2 benchmarks) — adopt cơ chế/nguyên tắc, re-verify trên harness mình trước khi dùng số làm quyết định (KN-065).

## Anti-patterns (đừng lặp lại)

- - ❌ Xây machinery "thêm" vì nghe hợp lý (recoverable elision, planner đắt, tool surface lớn) mà không đo component-level — arXiv 2609.20804: recoverable content model hiếm dùng + 0 gain; bash-only đủ cho model bash-giỏi; elision rule-based trước summarization (KN-072 + KN-037 + KN-047).

## Nguồn

- `docs/knowleged.md` — KN-013, KN-020, KN-022, KN-072
- Chi tiết đầy đủ: `references/evidence.md` (progressive disclosure)
- Regenerate: `node .github/harness/scripts/distill-agnostic.mjs`
