# PRD - Detection + Egress P0

- **Goal:** đo được tỷ lệ lỗi bị hệ thống bắt trước con người và chặn agent tự tạo identity hoặc hành động ngoài allowlist.
- **Users:** YUNIE, Maintainer của `CLAUDE_VS`; agent unattended chạy trong workspace.
- **Scope:** bug detection classification + CUA identity/operation/domain gate.
- **Non-goals:** không cài Agent Exchange/BotGauge/Namera; không thêm stateful mailbox; không sửa model routing.
- **Acceptance:**
  1. Mỗi bug có đúng một mode hợp lệ; legacy không ghi mode được tính `unknown`, không giả thành automated.
  2. `auto-learn status` báo counts + `automatedShare = (GATE + THREW) / classified`.
  3. Risky CUA action cần identity; unattended risky action luôn refused.
  4. Operator policy xác nhận tuple `identity + operation + domain`; caller flags không phải trusted human context.
  5. Tới khi có takeover channel thật, mọi risky supervised action vẫn fail-closed; evidence chỉ persist field an toàn.
  6. Disclosure: policy hiện là local versioned snapshot, chưa có digest/signature; không được gọi là tamper-proof production control.
- **Dissent review:** phương án cài full AX/BotGauge bị cắt vì thêm runtime, egress và khó kiểm soát; chỉ chép 2 primitive có test trực tiếp.
- **Who did you think with?** `Critic` framing: đừng biến “incident tracking” thành form văn thương và đừng biến egress thành allowlist dễ bypass.
- **Persistence:** code/evidence chạy trong repo; `.agent/cua/evidence.jsonl` gitignored. Không có static-site persistence mới.
