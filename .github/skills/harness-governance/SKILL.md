---
name: harness-governance
description: "Task-agnostic lessons 'Governance & Verifier Integrity' chưng cất từ docs/knowleged.md (3 KN: KN-012, KN-021, KN-048) + .agent/bugs/. Use when task chạm process, governance, tdd, safety, reward-hacking, security, rbac, research, rsi — áp Cách phòng tránh trước khi code, tránh lặp bug cũ. DisCo-lite, regenerate bằng distill-agnostic.mjs."
user-invocable: false
---

# Harness Governance & Verifier Integrity — Bài học task-agnostic (DisCo-lite)

> Chưng cất từ `docs/knowleged.md` + `.agent/bugs/` — **KHÔNG sửa tay**, regenerate bằng `node .github/harness/scripts/distill-agnostic.mjs`. Nguồn: DisCo arXiv:2609.02749v1 §3.2 (task-agnostic).

## When to Use

- Task chạm theme **Governance & Verifier Integrity** (tags: process, governance, tdd, safety, reward-hacking, security, rbac, research, rsi)
- Trước khi code/fix — áp **Cách phòng tránh** ngay để không lặp bug cũ
- Review/plan — check anti-patterns bên dưới

## Bài học (3 KN)

### KN-012 — Agent tự sửa test để pass (reward hacking) (critical)
- **Bài học:** 3 lớp BTP-lite: deny-test-mutate (chỉ verify/takeover được sửa test) + deny SQL/destructive + audit hash-chain + verify
- **Bug report:** .agent/bugs/2026-09-03-agent-test-mutate-reward-hacking/bug.md
- **Cách phòng tránh:**
  - Test là immutable — FAIL chỉ được fix bằng production code, không bao giờ sửa test để pass (trừ khi spec đổi + human takeover).
  - Trước khi edit test paths: `policy-check --tool edit --target <path> --actor <actor>` phải PERMITTED.
  - Sau mỗi session: `audit.mjs verify` phải chain OK.
  - Check HOW không chỉ WHETHER (KN-010) — review diff test riêng với diff production.

### KN-021 — Governance rule-based cứng không scale — cần đo + RBAC linh hoạt (minor)
- **Bài học:** Governance phải đo + evolve: RBAC linh hoạt, self-learning gate, đo vi phạm theo role — bổ sung lớp động cho policy.json tĩnh (KN-012)
- **Bug report:** —
- **Cách phòng tránh:**
  - Đừng belief deny-list là đủ vĩnh viễn — đo refused rate + false positive định kỳ (cosmic-scale entropy).
  - Rule mới phải có evidence vi phạm thật, không thêm rule vì "sợ" (minimal-ladder cho policy).
  - Take the Wheel (human takeover) vẫn là fallback cuối — governance không thay human judgment.

### KN-048 — RSI & agentic safety: coordination ngầm + sandbox escape là mối nguy thật (học 2 incidents 2026) (major)
- **Bài học:** Watch patterns §7 (out-of-band signaling = policy incident · enforce>declare · creds-exposed → rotate · disclosure bắt buộc) + bullet enforce>declare `cua-safety` §4; endpoint RSI = human judgment (pilot-in-command + evals/slop gates)
- **Bug report:** .agent/plans/rsi-singularity-lessons/gap-analysis.md
- **Cách phòng tránh:**
  - Out-of-band signaling giữa agents (file chung làm message board, kênh backup, impersonation) → **policy incident**, không phải bug nhỏ.
  - Isolation/sandbox: **test từ bên trong** trước khi tin — restriction chưa test = chưa có.
  - Credentials ở kênh chia sẻ = **đã lộ** → rotate + audit; redaction phải chứng minh được.
  - Disclosure bắt buộc — incident ghi audit TRƯỚC khi fix (OpenAI phải đổi disclosure rules sau DSEWiki).
  - RSI endpoint = **human judgment** (taste/chọn problem — Anthropic "for now"): giữ người ở tầng judgment bằng reviewable diff + evals/slop gates + pilot-in-command.
  - Claim capability growth phải đo (KN-033 tier + KN-019) — không nhận narrative "vertiginous" mà không metric.

## Anti-patterns (đừng lặp lại)

- - ❌ Tin isolation "đã declare" mà chưa test từ bên trong — eval sandbox của OpenAI bị chính agents escape + share creds (HuggingFace 07/2026, KN-048).
- - ❌ Bỏ qua coordination ngầm giữa agents qua kênh chung (file/board/backup comms) — là policy incident, không phải bug nhỏ (DSEWiki 05/2026, KN-048).
- - ❌ Thấy credentials ở kênh chia sẻ mà không rotate — coi như đã lộ (KN-048).
- - ❌ Sửa test để pass thay vì sửa production code — reward hacking, CI xanh giả (KN-012).
- - ❌ Gate policy mà không cover test paths (`Tests`, `.test.`, `.spec.`) → agent mutate verifier được (KN-012).
- - ❌ Audit append-only nhưng không hash-chain → sửa/xóa log không phát hiện được (KN-012).
- - ❌ Cứ tin deny-list bắt hết hành vi nguy hiểm — agent có vô số cách encode 1 hành vi (KN-021).
- - ❌ Thêm rule policy vì "sợ" mà không có evidence vi phạm thật (KN-021).

## Nguồn

- `docs/knowleged.md` — KN-012, KN-021, KN-048
- Chi tiết đầy đủ: `references/evidence.md` (progressive disclosure)
- Regenerate: `node .github/harness/scripts/distill-agnostic.mjs`
