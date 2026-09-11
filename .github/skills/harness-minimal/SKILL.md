---
name: harness-minimal
description: "Task-agnostic lessons 'Minimal Code & YAGNI' chưng cất từ docs/knowleged.md (3 KN: KN-013, KN-020, KN-022) + .agent/bugs/. Use when task chạm process, minimal, ponytail, yagni, dx, verification, review, architecture, agent — áp Cách phòng tránh trước khi code, tránh lặp bug cũ. DisCo-lite, regenerate bằng distill-agnostic.mjs."
user-invocable: false
---

# Harness Minimal Code & YAGNI — Bài học task-agnostic (DisCo-lite)

> Chưng cất từ `docs/knowleged.md` + `.agent/bugs/` — **KHÔNG sửa tay**, regenerate bằng `node .github/harness/scripts/distill-agnostic.mjs`. Nguồn: DisCo arXiv:2609.02749v1 §3.2 (task-agnostic).

## When to Use

- Task chạm theme **Minimal Code & YAGNI** (tags: process, minimal, ponytail, yagni, dx, verification, review, architecture, agent)
- Trước khi code/fix — áp **Cách phòng tránh** ngay để không lặp bug cũ
- Review/plan — check anti-patterns bên dưới

## Bài học (3 KN)

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

## Anti-patterns (đừng lặp lại)

- - ❌ PRD không có YAGNI gate → dead code/component/css sống sót (KN-013).
- - ❌ Verify không grep dead-code + không ghi scoreboard → over-build lọt (KN-013).
- - ❌ Cắt validation/security/a11y/test để giảm LOC — lazy sai chỗ (KN-013).
- - ❌ Sửa instruction xong không refresh registry → description stale cache template cũ (KN-013).
- - ❌ Trust agent output vì "trông đúng" — không setup nào cho code đáng tin thiếu review (KN-020).
- - ❌ Theo hype setup mới (model/skill/MCP) mà không benchmark trên codebase thật (KN-020).
- - ❌ Nhồi phức tạp vì "AI giỏi mà" — AI loves overcomplicating things, job của mình là radically simplify (KN-020).
- - ❌ Gọi hệ thống là "agent" khi vẽ được flowchart trước khi chạy — pipeline giả danh, đắt và khó debug vô ích (KN-022).
- - ❌ Trao model quyền chọn control flow cho path vốn đã biết — trả token để model deliberates về route mình đã biết (KN-022).
- - ❌ Agency không có cheap check per-step — freedom không kiểm tra = nondeterminism không debug được (KN-022).
- - ❌ Multi-agent reconciliation kiểu "whoever spoke last wins" — phải deterministic rule + conflict để lại thành record (KN-022).
- - ❌ Chạy cả agentic loop / multi-agent cho task pipeline vẽ được flowchart — agency là cost phải justify (KN-037 + KN-022).

## Nguồn

- `docs/knowleged.md` — KN-013, KN-020, KN-022
- Chi tiết đầy đủ: `references/evidence.md` (progressive disclosure)
- Regenerate: `node .github/harness/scripts/distill-agnostic.mjs`
