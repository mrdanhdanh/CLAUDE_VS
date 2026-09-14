# PRD mini — Mở HOLD delegation (subagent ⊆ parent)

> Task: thực thi open question #2 của `.agent/plans/mai-code-of-conduct-adopt/proposal.md` — user yêu cầu "mở HOLD delegation" (14/09/2026).
> Knowledge gate: đã đọc `docs/knowleged.md` (KN-059 delegation HOLD + anti-pattern "at least same scope", KN-047 rule cần check, KN-048 red-team, KN-012 verifier integrity).

## Vấn đề
- §8 `agent-governance` đang HOLD: "subagent scope phải là ⊆ parent — chưa có enforcement surface (policy.json chưa có actor row cho subagent) → chưa viết rule".
- Không có cơ chế nào buộc subagent khai danh tính/delegation → không thể enforce attenuation (confused deputy).

## Giải pháp (minimal)
- **Convention actor:** request của subagent khai `--actor subagent:<name> --parent <parent-actor>` (self-declared — disclosure giới hạn).
- **Engine `policy-check.mjs`:** thêm `--parent`; compute `withinParent` (evaluate request dưới danh nghĩa parent — fail-closed); thêm vars `parent` + `withinParent` cho CEL-lite.
- **Law `policy.json` v5:** 3 deny rules mới (đặt đầu list — identity/chain trước behavior):
  - `deny-subagent-no-parent` — thiếu parent → refuse (fail-closed)
  - `deny-subagent-chain` — parent là subagent → refuse (no chained delegation, chống đệ quy)
  - `deny-subagent-escalation` — request không pass dưới parent → refuse (attenuation ⊆ parent, confused deputy)
- **Guard:** `tests/e2e/guard-redteam.spec.ts` D1–D4 (no-parent / chain / positive / escalation).

## YAGNI (cắt)
- KHÔNG thêm authenticated identity (thuộc platform — xem `docs/llm-weakness-research.md` §2c "never in agent code").
- KHÔNG thêm `--scope` thu hẹp tùy chọn (chưa có use case — child ⊆ parent là đủ).
- KHÔNG multi-level chain (1 tầng, fail-closed).

## Done = policy `--check` pass + guard D1–D4 pass + audit chain OK + docs sync.
