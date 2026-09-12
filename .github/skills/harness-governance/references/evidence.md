# Evidence — harness-governance (DisCo arXiv:2609.02749v1 §3.2 (task-agnostic))

> Substrate layer của skill — full text từ docs/knowleged.md. Sinh tự động 2026-09-12T11:58:31.479Z.

## Bug reports liên quan (1/29 bugs)

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

---

### KN-021 — Governance rule-based cứng không scale — cần đo + RBAC linh hoạt

- **Ngày:** 2026-09-08
- **Bug report:** N/A — bài học rút từ "My Little AI Factory" (dominis.blog, component LEX) — bổ sung hướng evolve cho KN-012
- **Severity:** minor
- **Triệu chứng:** Rule engine gắn hook endpoint chặn được PII/secrets/network nhưng: (1) agent được reward để giải task — nếu delete file giúp xong task, nó tìm cách encode hành vi mà rule không bắt hết; (2) block-everything chặn luôn user hợp lệ cần elevated access.
- **Nguyên nhân gốc (5 Whys):**
  - Why1: Rule bị né → vì hành vi nguy hiểm có vô số cách encode, deny-list chỉ liệt kê được hữu hạn.
  - Why2: Block-all cũng fail → vì môi trường thật cần phân quyền theo role/người, không phải deny tuyệt đối.
  - Why3: Deny-list tĩnh không đủ → vì policy phải phản ánh ngữ cảnh (ai, khi nào, làm gì) chứ không chỉ pattern text.
  - Why4: Chưa đo vi phạm theo ngữ cảnh → vì thiếu telemetry per-role.
  - Why5 (Root): Governance tĩnh không tự học — cần gate đo được + RBAC linh hoạt, evolve dần theo vi phạm thực tế.
- **Cách sửa:** Giữ policy.json tĩnh làm lõi fail-closed (KN-012 — chưa thay vì chưa có bằng chứng cần thay), nhưng đo thêm: vi phạm per-actor trong audit stats; lộ trình evolve sang RBAC linh hoạt + self-learning gate khi số refused/false-positive tăng. Ref Grith (grith-ai/grith, 2026-09): mô hình 3 vùng risk-score (<3 allow · 3–8 queue chờ human duyệt · >8 deny) — vùng giữa chính là Take the Wheel, evolve từ binary deny/allow sang risk-score; thêm supervision-escape enforcement (chặn agent spawn tiến trình con không giám sát: docker/tmux) vào deny-list khi cần.
- **Cách phòng tránh:**
  - Đừng belief deny-list là đủ vĩnh viễn — đo refused rate + false positive định kỳ (cosmic-scale entropy).
  - Rule mới phải có evidence vi phạm thật, không thêm rule vì "sợ" (minimal-ladder cho policy).
  - Take the Wheel (human takeover) vẫn là fallback cuối — governance không thay human judgment.
- **Tags:** `process` `governance` `security` `rbac`
- **Người ghi:** YUNIE / auto-learn
