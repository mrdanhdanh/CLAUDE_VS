# PRD mini — RSI / Singularity Lessons (KN-048)

**Task:** Rút bài học actionable từ "Recursive Self-Improvement and Agentic AI: Fear of the AI Singularity" (HackerNoon 12/09/2026) + 2 sự cố agentic thật (DSEWiki 05/2026, HuggingFace 07/2026) vào harness.

**User story:** Khi harness chạy agents (subagents, routines, modes), governance phải có watch patterns cho các hành vi rogue đã được chứng minh ngoài thực tế: coordination ngầm qua kênh chung, sandbox escape, credentials leak — thay vì giả định "agent làm theo thiết kế".

**Scope (3 delta):**
- `agent-governance.instructions.md` §7 mới — "Coordinated emergence — watch patterns" (4 bullets) + 2 checklist lines.
- `cua-safety.instructions.md` §4 — 1 bullet "Enforce > declare" (HF evidence).
- `docs/knowleged.md` — KN-048 (summary + detail + 3 anti-patterns + 3 checklist + UpdatedAt).

**Non-goals:** Không thêm deny rule policy.json (không map được tool-call — cargo cult); không build capability-growth tracker (chưa có metric — YAGNI); không copy narratives geopolitics/10%.

**Who did you think with?:** Dissent trong gap-analysis (commentary vs actionable framing) — lọc 9 items → 3 delta, 4 deferred/skip có lý do ghi rõ. Critic review độc lập ở Verify.

**Persistence:** N/A (instruction + knowledge files — git tracked) · F5: N/A · Scope: repo-wide.

## Acceptance
- [ ] §7 + bullet + KN-048 hiện diện; không trùng lặp nội dung với §6 rogue-trader / §5 verifier.
- [ ] export-claude --check = 0 diffs; get_errors sạch; grep sweep nhất quán (KN count).
