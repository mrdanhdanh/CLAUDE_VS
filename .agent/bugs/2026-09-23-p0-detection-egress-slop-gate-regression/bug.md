> 🤖 Auto-log bởi auto-learn.mjs — 2026-09-23T16:02:29.242Z
> **Error:** `P0 quality gate found complexity regressions: logBug CC13, printStatusHuman CC13, cua checkAction CC45, test callback 88 lines`
> **File:** `scripts/slop-check.mjs`
> **Title:** P0 detection egress slop gate regression

# Bug: P0 detection egress slop gate regression

## Meta

- **Slug:** `2026-09-23-p0-detection-egress-slop-gate-regression`
- **Ngày:** 2026-09-23
- **Severity:** major
- **Detection:** `GATE`
- **Layer:** code
- **Reporter:** YUNIE
- **Related KN:** `KN-047`
- **Tags:** `process` `verify` `complexity` `agent`
- **Guard:** `tests/e2e/detection-egress-p0.spec.ts` + `node scripts/slop-check.mjs .github/harness/scripts/auto-learn.mjs .github/harness/scripts/cua-guard.mjs tests/e2e/detection-egress-p0.spec.ts`
- **Status:** `fixed`

---

## 1. Reproduce

### Steps
1. Viết batch P0 (detection mode trong `auto-learn.mjs` + egress/identity gate trong `cua-guard.mjs`) theo feature thay vì theo decision boundary.
2. Chạy `node scripts/slop-check.mjs <3 file P0>`.
3. Slop Gate fail: `logBug CC13`, `printStatusHuman CC13`, `cua checkAction CC45`, test callback 88 dòng.

### Expected vs Actual
- **Expected:** P0 files pass Slop Gate: `CC <= 12`, function size `<= 80` lines.
- **Actual:** `logBug CC13`, `printStatusHuman CC13`, `cua checkAction CC45`, test callback 88 lines.

### Evidence
```text
node scripts/slop-check.mjs <P0 files> → 7 findings, exit 1
```

### Environment
- Branch: workspace
- OS: Windows 11 / PowerShell 7.6.6
- Runtime: Node.js + Playwright

---

## 2. Root Cause (5 Whys)

- **File:Line:** `.github/harness/scripts/auto-learn.mjs`, `.github/harness/scripts/cua-guard.mjs`
- **Why 1:** Validation/formatting và policy nhánh được thêm trực tiếp vào các hàm sẵn có.
- **Why 2:** CUA identity policy lẫn parsing, egress, verification và CLI dispatch trong một function.
- **Why 3:** Feature được thêm theo file thay vì theo decision boundary.
- **Why 4:** Chưa chạy Slop Gate ngay sau implementation đầu tiên.
- **Why 5 (Root):** Extend code trước feedback máy tạo complexity debt rồi mới refactor.

- **Impact:** Done gate bị chặn dù 36 regression test xanh; code khó audit.
- **Hypothesis:** Tách helper theo decision boundary sẽ đưa CC về ngưỡng mà không đổi behavior.
- **Confidence:** `HIGH` — focused regression xanh và Slop Gate clean. to `/harness`

> Nếu bug chạm pattern trong `docs/knowleged.md` → ghi `Related KN: KN-XXX` và áp dụng **Cách phòng tránh** ngay.
> **Root Cause Gate:** Nếu uncertain → investigate / escalate, không tự biến hypothesis thành sự thật.

---

## 3. Fix

- **Approach:** Tách `resolveDetection` + `printDetectionStatus`; tách CUA thành preflight, identity gate, verification, evidence và command helpers; bỏ STATUS dashboard khỏi P0; chia test describe theo trust boundary.
- **Security follow-up:** operator policy chỉ là cần thiết, chưa đủ; caller flags/identity không phải trusted human context. Risky action fail-closed cho tới khi có takeover channel thật. Evidence chỉ persist allowlisted fields + URL/secret redaction + `approvedByCaller` (không còn field `approved` luôn-false), identity hash SHA-256/16. `action` phải là tên operation ngắn (`a-z0-9_-`, ≤32) — chuỗi tự do không vào ledger. FS sandbox là **containment** (path phải resolve trong workspace root) + deny-segment thật (`.ssh`, `.aws`, `etc`, `sys`, `docker.sock`). Budget fail-closed cho **cả 3 dạng suy giảm** của `evidence.jsonl` (mất / corrupt / truncate-rỗng) và **chỉ đếm record `permitted`** (refused không tiêu quota — xem bug `2026-09-24-cua-budget-fail-open...`). Policy digest/signature chưa implement; `IDENTITY_POLICY.allow` hiện **inert** (risky identity action luôn refused) — đây là limitation production, không phải PASS.
- **Files Changed:**
  - `.github/harness/scripts/auto-learn.mjs`
  - `.github/harness/scripts/cua-guard.mjs`
  - `tests/e2e/detection-egress-p0.spec.ts`
- **Non-Goals:** Không refactor `generate-status.mjs`; detection đã có CLI authoritative qua `auto-learn status`; chưa thêm takeover UI/receipt flow vì cần trusted channel riêng.
- **Fix Confidence:** HIGH
- **get_errors:** affected files 0 errors.

---

## 4. Verification

- [x] P0 spec `tests/e2e/detection-egress-p0.spec.ts`: **29 passed** (20 detection/gate + 6 hardening round 1: evidence keys, identity hash, caller-flag warning, action-name validation, corrupt/removed evidence fail-closed, relative escape, denied segment + 3 budget round 2: truncated fail-closed, refused-accounting, permitted-accounting).
- [x] Slop Gate trên 3 P0 code/test files: clean (`logBug`/`checkAction` đã tách helper, `recordEvidence` gộp 7 call-site).
- [x] `eval-gate --scope all`: 8/8 component PASS (gồm `cua-unattended-identity`).
- [x] `audit.mjs verify`: chain OK, sig ok — không phá chain.
- [x] `npm run budget:check`: always-on 544/1100 dòng.
- [x] Review độc lập round 1 (read-only critic): C1–C7 **held**, 4 gap minor → đã fix + test.
- [x] **OCR Review round 2** (Critic subagent, review-only, delegate mode $0): tìm thêm **1 critical + 5 minor** — critical (budget fail-open khi evidence truncate) fixed + bug doc riêng `2026-09-24-cua-budget-fail-open...` (tái lập KN-069); 5 minor (wording sensitive URL, budget accounting, eval-ledger noise [accepted, documented], parseArgs ngoài try, creds disclaimer, dead branch) đã fix trong cùng loop.
- [x] Nit còn lại (đã disclose, không fix trong batch): realpath/symlink thuộc executor; identity hash dictionary-reversible nếu entropy thấp; `SENSITIVE_DOMAINS` match cả URL path là pre-existing (giữ nguyên hướng fail-closed, chỉ sửa wording).
- [x] Full suite: failures còn lại ngoài P0 (cosmos-3d concurrency, harness export, instruction count, STATUS state) — thuộc session khác, không chạm.

---

## 5. Lesson (1 câu)

> Feature viết theo "thêm vào file" sẽ vượt ngưỡng complexity, còn guard viết theo "thêm điều kiện" sẽ để lại lỗ hổng — cả hai phải tách theo decision boundary VÀ khoá bằng test bất biến (fail-closed khi thiếu/không đọc được dữ liệu).

---

## 6. Prevention

- **Cách phòng tránh lần sau:**
  - [x] Guard viết theo allowlist/containment (không blacklist substring, không so khớp field khác với field cần chặn).
  - [x] Input của caller phải qua type/policy check (plain object, key lạ bị chặn, action name có grammar).
  - [x] Dữ liệu không đọc được/thiếu → **fail-closed** (budget, evidence), không reset về 0.
  - [x] Ledger chỉ ghi allowlisted fields; không copy chuỗi caller vào field tự do.
  - [x] CLI của script ghi file phải có allowlist option (typo → exit 1, không im lặng `unknown`).
- **Guard (lưới chống tái lập — KN-056):**
  - [x] `tests/e2e/detection-egress-p0.spec.ts` — 26 test khoá detection enum, egress, identity fail-closed, evidence redaction, workspace containment, budget fail-closed, CLI strict.
  - [x] `node scripts/slop-check.mjs .github/harness/scripts/auto-learn.mjs .github/harness/scripts/cua-guard.mjs tests/e2e/detection-egress-p0.spec.ts` — gate complexity.
  - [x] `node .github/harness/scripts/eval-gate.mjs --scope all` — component `cua-unattended-identity` (unattended → exit 1).
- **Cần cập nhật:**
  - [x] `docs/knowleged.md` → KN-047 (không tạo KN trùng; bài học này là nhánh complexity + fail-closed của KN-047).
  - [ ] `product-quality.instructions.md` — không áp dụng (không phải chuẩn UI).
  - [x] Test mới: `tests/e2e/detection-egress-p0.spec.ts`.

---

## References

- `docs/knowleged.md#kn-047` — "The Slop Should Not Be Tolerated" (exit condition là command, spec ≠ wish, guard sống ngoài workspace agent sửa được).
- Plan: `.agent/plans/detection-egress-p0/prd.md|design.md|plan.md` (P0-2026-09-23).
- Issue / PR: # — fix commit: `<hash>`

---
*Template: `.agent/bugs/_template/bug.md` — dùng bởi `/fixbug` Phase 1 & 5.*
