# Design - Detection + Egress P0

## Detection

- Source of truth: metadata `Detection` trong từng `bug.md`.
- Enum: `GATE | THREW | HUMAN | OPERATOR | LATER`.
- `unknown` là chưa phân loại, không được đưa vào mẫu số automated share.
- Status in: total, classified, counts, automated `(GATE+THREW)`, share `%` hoặc `n/a`.

## CUA identity gate

CLI mới:

- `--identity <account-or-principal>`
- `--unattended`

Operator policy:

- Source of truth: `.github/harness/cua-identity-policy.json`.
- Tuple format: `identity|operation|domain` trong `allow`.
- Caller không thể tự cấp tuple bằng CLI/env; file mặc định `allow: []`.

Policy:

- Risky/identity-bearing operations: `submit/book/purchase/delete/pay/send/post/create-account/login/email`.
- Observe vẫn giữ hành vi cũ.
- Unattended risky: luôn refused với `human takeover required`.
- Interactive risky: cần `identity`, explicit approve, verify URL/detail và tuple allowlist.
- Account creation/login bị từ chối vĩnh viễn trong unattended mode.
- Evidence chỉ persist allowlisted fields: `ts, action, operation, identityHash, approvedByCaller, decision, reasonCode, origin, policyVersion, egress` — không URL đầy đủ/query, không element, không fsPath; identity hash SHA-256/16; `action` phải khớp `^[a-z][a-z0-9_-]{0,31}$`.
- FS sandbox = containment: path phải resolve trong workspace root (`..`/absolute/drive khác → refused), cộng deny-segment (`.ssh`, `.aws`, `etc`, `sys`, `docker.sock`).
- Budget fail-closed cho **cả 3 dạng suy giảm** của `evidence.jsonl`: file mất (khi dir còn), corrupt (JSON/ts không hợp lệ), rỗng/truncate (0 byte/whitespace) → refused, KHÔNG reset về 0; chỉ `[]` khi thư mục không tồn tại (fresh install).
- Budget **chỉ đếm record `decision: permitted`** cho cả actions và tabs — attempt bị refused không tiêu quota (chống self-lock-out khi retry/eval).
- `IDENTITY_POLICY.allow` hiện **inert**: risky identity action luôn refused cho tới khi có trusted takeover channel (P1) — policy in ra cũng ghi rõ `declared — enforced by executor` cho limits/telemetry.

## Test matrix

- Detection parse: valid, duplicate, invalid, missing, near-miss option (`--Detection`, `--detectoin`).
- Evidence: key set cố định, identity hashed, caller-flag approval ghi là untrusted, action name bị chặn khi không hợp lệ.
- FS: ngoài workspace (absolute + relative escape), deny-segment, alias `fs`.
- Budget: evidence hỏng / bị xoá → fail-closed.
- CUA: observe không cần identity; interactive risky không identity bị chặn; unattended risky bị chặn; tuple mismatch bị chặn; caller không tự cấp quyền.
- Component eval: một lệnh CLI fail-closed thực tế.
