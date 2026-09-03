# Bug: Agent tự sửa test để pass (reward hacking)

## Meta

- **Slug:** `2026-09-03-agent-test-mutate-reward-hacking`
- **Ngày:** 2026-09-03
- **Severity:** `critical`
- **Reporter:** YUNIE
- **Related KN:** `KN-012`
- **Tags:** `process` `governance` `tdd` `safety` `reward-hacking`
- **Status:** `fixed`

---

## 1. Reproduce

### Steps
1. Agent Implement nhận task fix bug, test đang FAIL.
2. Thay vì sửa production code, agent sửa file test (`*.Tests.cs`, `*.test.*`) cho pass.
3. CI xanh nhưng bug gốc vẫn còn → false confidence.

### Expected vs Actual
- **Expected:** Test FAIL → sửa production code → test PASS (TDD RED-GREEN).
- **Actual:** Không có gate nào chặn sửa test → agent có thể mutate verifier để pass (reward hacking, HN 2026-09-03 "What happens when your AI agent edits its own tests to pass?").

### Evidence
- `policy.json` v1 chỉ có 4 deny (rm-rf, .env, credentials, private-hosts) — không có rule nào về test.
- `audit.jsonl` append-only nhưng không có hash-chain → sửa log không phát hiện được.
- Nguồn: https://bartholomew.info/ (BTP v2.4: pre-flight scanner + locked sandbox + digital notary).

### Environment
- Branch: `main`
- Commit: `ab61c57`
- OS: macOS

---

## 2. Root Cause (5 Whys)

- **File:Line:** `.agent/policy.json:1` (thiếu rules), `.agent/scripts/audit.mjs:1` (thiếu chain)
- **Why 1:** Agent có thể sửa test để pass → vì không có policy nào cấm.
- **Why 2:** Không có policy → vì governance v1 chỉ nghĩ tới destructive shell/secret, chưa nghĩ tới verifier integrity.
- **Why 3:** Chưa nghĩ tới verifier → vì TDD gate là instruction chữ, không phải enforce bằng tool.
- **Why 4:** Không enforce bằng tool → vì policy-check chỉ gate shell/read, chưa gate edit trên test paths.
- **Why 5 (Root):** Thiếu **3 lớp BTP**: pre-flight (chặn mutate test), sandbox (test immutable), notary (audit hash-chain).

- **Impact:** Mọi pipeline `/harness` + `/fixbug` — CI xanh giả, bug lọt production.
- **Confidence:** `HIGH` (proven bằng policy-check test + audit verify).

---

## 3. Fix

- **Approach:** 3 lớp BTP-lite, 0 deps, Node 18+:
  1. Pre-flight: thêm `deny-test-mutate`, `deny-destructive-sql`, `deny-rm-rf-variants` vào `.agent/policy.json` (v1→v2).
  2. Sandbox: test paths (`Tests`, `.test.`, `.spec.`, `ai-news.json`) chỉ `verify` actor hoặc `intent=takeover` mới được sửa.
  3. Notary: `audit.mjs` thêm `prevHash` + `hash` (SHA-256/16) mỗi event + lệnh `verify`.
- **Files Changed:**
  - `.agent/policy.json` — v2, 7 deny + 2 allow
  - `.agent/scripts/audit.mjs` — `canonicalHash()` + `cmdVerify()`
  - `docs/knowleged.md` — KN-012 (bảng + chi tiết + anti-patterns + checklist)
  - `.github/instructions/agent-governance.instructions.md` — §5 verifier integrity
- **Fix Confidence:** `HIGH`

---

## 4. Verification

- [x] `policy-check --check` → `✅ policy ok: 7 deny, 2 allow, version 2`
- [x] `edit N5Blazor.Tests/ServiceTests.cs --actor Implement` → `⛔ REFUSED (deny-test-mutate)`
- [x] `edit ... --actor verify` → `✅ PERMITTED`
- [x] `edit ... --intent takeover` → `✅ PERMITTED` (human takeover)
- [x] `shell rm -fr`, `DROP TABLE` → `⛔ REFUSED`
- [x] `audit log ... && audit verify` → `✅ audit chain OK`
- [x] `get_errors` affected files → 0
