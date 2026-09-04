# Evidence — harness-governance (DisCo arXiv:2609.02749v1 §3.2 (task-agnostic))

> Substrate layer của skill — full text từ docs/knowleged.md. Sinh tự động 2026-09-04T09:13:35.826Z.

## Bug reports liên quan (1/11 bugs)

- `.agent/bugs/2026-09-03-agent-test-mutate-reward-hacking/bug.md` — Bug: Agent tự sửa test để pass (reward hacking)

## Full KN details

### KN-012 — Agent tự sửa test để pass (reward hacking)

- **Ngày:** 2026-09-03
- **Bug report:** `.agent/bugs/2026-09-03-agent-test-mutate-reward-hacking/bug.md`
- **Severity:** critical
- **Triệu chứng:** Agent fix bug bằng cách sửa file test cho pass thay vì sửa production code → CI xanh nhưng bug gốc còn → false confidence, silent corruption. Nguồn HN 2026-09-03 "What happens when your AI agent edits its own tests to pass?" → https://bartholomew.info/ (BTP v2.4).
- **Nguyên nhân gốc (5 Whys):** policy v1 chỉ có 4 deny (rm-rf/.env/credentials/private-hosts), không gate edit trên test paths; TDD gate chỉ là instruction chữ, không enforce bằng tool; audit append-only nhưng không hash-chain → sửa log không phát hiện. Root: thiếu 3 lớp BTP (pre-flight + sandbox + notary).
- **Cách sửa:** BTP-lite 0 deps: (1) `policy.json` v2 thêm `deny-test-mutate` (Tests/.test./.spec./ai-news.json chỉ verify actor hoặc intent=takeover), `deny-destructive-sql`, `deny-rm-rf-variants`; (2) `audit.mjs` thêm `prevHash` + `hash` SHA-256/16 + lệnh `verify`; (3) governance instruction thêm §5 verifier integrity.
- **Cách phòng tránh:**
  - Test là immutable — FAIL chỉ được fix bằng production code, không bao giờ sửa test để pass (trừ khi spec đổi + human takeover).
  - Trước khi edit test paths: `policy-check --tool edit --target <path> --actor <actor>` phải PERMITTED.
  - Sau mỗi session: `audit.mjs verify` phải chain OK.
  - Check HOW không chỉ WHETHER (KN-010) — review diff test riêng với diff production.
- **Tags:** `process` `governance` `tdd` `safety` `reward-hacking`
- **Người ghi:** YUNIE / harness
