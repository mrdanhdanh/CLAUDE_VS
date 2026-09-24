> 🤖 Auto-log bởi auto-learn.mjs — 2026-09-24T15:19:17.829Z
> **Error:** `budget fail-open: evidence.jsonl truncated/emptied -> treated as fresh ledger, 20-action/15m budget resets to 0 (claimed fail-closed)`
> **File:** `.github/harness/scripts/cua-guard.mjs`
> **Title:** CUA budget fail-open khi evidence rong hoac truncate

> 🔁 **RADAR TÁI LẬP** — đối chiếu KN + bug cũ thấy nghi vấn:
> - 🔁 NGHI TÁI LẬP **[KN-069]** (score 145): Gate fail-open với arg rác: NaN-pass ẩn (exit 0) — gate phải validate MỌI input tại boundary
> - 🔁 NGHI TÁI LẬP **[KN-068]** (score 133.5): Instruction pool always-on phình không ngưỡng: kế toán + ratchet + gate (budget:check)
> - 🔁 NGHI TÁI LẬP **[KN-015]** (score 75): GitHub Pages deploy fail — 2 workflows cùng `github-pages` env + eval-gate Node 18 CJS
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-18-instruction-budget-gate-fail-open-voi-arg-khong-ph`** (score 164.4): instruction-budget gate fail-open voi arg khong phai so
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-16-instruction-budget-always-on-phinh-khong-nguong`** (score 107.4): ** instruction budget always-on phinh khong nguong
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-14-routing-failover-chuan-hoa-pattern-khoa-luoi`** (score 70.5): Routing & Failover cho chain model/provider — chuẩn hoá pattern + khoá lưới chuỗ
> → Đọc **Cách phòng tránh** trong `docs/knowleged.md` TRƯỚC khi fix. Nếu là tái lập thật: ghi rõ "tái lập của KN-069" + **vì sao lưới cũ không bắt được** → nâng lưới (Guard) rồi mới fix.
# Bug: CUA budget fail-open khi evidence rong hoac truncate

> Phát hiện bởi **OCR Review round 2** (Critic subagent, review-only) trên diff P0 — 2026-09-24. Fix trong cùng loop, trước khi batch P0 được coi là Done.

## Meta

- **Slug:** `2026-09-24-cua-budget-fail-open-khi-evidence-rong-hoac-trunca`
- **Ngày:** 2026-09-24
- **Severity:** `critical`
- **Detection:** `HUMAN`
- **Detection rule:** Một dòng metadata duy nhất, chỉ đúng một enum; không thêm suffix hoặc duplicate field.
- **Layer:** `code` — defect nằm ở readEvidence/checkBudgets trong `cua-guard.mjs`.
- **Reporter:** OCR Review round 2 (Critic subagent) → YUNIE fix
- **Related KN:** KN-069 (**tái lập — cùng lớp fail-open, khác boundary**), KN-047
- **Tags:** `process` `verify` `fail-open` `budget`
- **Guard:** `tests/e2e/detection-egress-p0.spec.ts` (4 test describe `CUA budget enforcement` — corrupt / removed / truncated / permitted-vs-refused accounting)
- **Status:** `fixed`

---

## 1. Reproduce

### Steps
1. `node .github/harness/scripts/cua-guard.mjs check --action read --url https://docs.example.com` (hoặc qua API `checkAction`) → ledger `.agent/cua/evidence.jsonl` được ghi 1 record.
2. Truncate ledger về 0 byte (xoá nội dung, giữ file) — dấu hiệu tamper.
3. Chạy lại cùng lệnh check.

### Expected vs Actual
- **Expected:** Refused `evidence unreadable or malformed` (fail-closed — đúng như comment trong `readEvidence` và disclosure trong bug doc P0).
- **Actual:** Permitted, budget reset về 0/20 — cơ chế 20 actions/15m bị vô hiệu bằng 1 thao tác truncate.

### Evidence
```text
readEvidence: fs.readFileSync(p,'utf8').trim().split('\n').filter(Boolean)  → [] với file 0 byte
checkBudgets: actions=0 → over=false → mọi action tiếp tục được phép
```

### Environment
- Branch: `main` (workspace, chưa commit batch P0)
- OS: Windows 11 / pwsh 7.6.6 / Node 22

---

## 2. Root Cause (5 Whys)

- **File:Line:** `.github/harness/scripts/cua-guard.mjs` — `readEvidence()` (~140), `checkBudgets()` (~175)
- **Why 1:** `.trim().split('\n').filter(Boolean)` trên file 0 byte trả mảng rỗng — không phân biệt "ledger bị truncate" với "ledger mới".
- **Why 2:** Guard fail-closed được viết cho 2 dạng suy giảm (JSON malformed, file bị xoá) nhưng bỏ sót dạng thứ 3 (nội dung rỗng).
- **Why 3:** Test P0 cũng chỉ phủ đúng 2 dạng đó — code và lưới cùng một điểm mù.
- **Why 4:** Edge case được liệt kê theo **ví dụ** (2 case đã nghĩ tới) thay vì theo **lớp tương đương** (mọi dạng suy giảm dữ liệu tại boundary).
- **Why 5 (Root):** Boundary validation thiếu nguyên tắc "mọi dạng input suy giảm → fail-closed" — **tái lập lớp KN-069** (gate phải validate mọi input tại boundary) tại tầng data-store thay vì CLI arg.

- **Impact:** Budget 20 actions/15m reset bằng 1 thao tác truncate — vừa là bypass rate-limit, vừa là disclosure sai (tài liệu claim fail-closed).
- **Hypothesis:** empty text → `[]` → `over:false`. Đã verify bằng test đỏ trước fix.
- **Confidence:** `HIGH` — reproduce đỏ trước, xanh sau; 3 dạng suy giảm đều khoá.

> **Tái lập của KN-069 — vì sao lưới cũ không bắt được:** lưới KN-069 nằm ở boundary **CLI arg** của `instruction-budget.mjs` (`--budget abc` → NaN → exit 0). Lần này cùng lớp fail-open nhưng ở boundary **data-store** của `cua-guard.mjs` → lưới lớp chưa được nhân rộng sang module mới. Nâng lưới TRƯỚC khi fix: spec P0 khoá cả 3 dạng suy giảm + accounting.

---

## 3. Fix

- **Approach:** `readEvidence` trả `null` cho nội dung rỗng/whitespace (chỉ `[]` khi thư mục `.agent/cua/` không tồn tại = fresh install). Kèm 5 fix cùng round OCR review: budget **chỉ đếm record `decision: permitted`** (refused không tiêu budget → chống self-lock-out; wording "permitted actions"); wording `sensitive URL` đúng sự thật (match có thể đến từ path/query, không phải domain); `parseArgs` vào trong `try` (option sai in `❌ message` thay vì stack trace); creds line ghi rõ "validated only when caller declares --token-ttl"; bỏ nhánh dead trong `classifyAction`.
- **Files Changed:**
  - `.github/harness/scripts/cua-guard.mjs` — readEvidence + checkBudgets + budgetReason + verificationReasons + checkIdentityGate + classifyAction + printPolicy + main
  - `tests/e2e/detection-egress-p0.spec.ts` — +3 test budget (truncated / refused-accounting / permitted-accounting)
- **Diff tóm tắt:**
```diff
- for (const line of fs.readFileSync(evidencePath, 'utf8').trim().split('\n').filter(Boolean)) {
+ const text = fs.readFileSync(evidencePath, 'utf8');
+ if (!text.trim()) return null; // Emptied/truncated ledger = tampering evidence, not a fresh install.
+ for (const line of text.trim().split('\n').filter(Boolean)) {

- const recent = records.filter(e => new Date(e.ts).getTime() > cutoff);
+ const recent = records.filter(e => e.decision === 'permitted' && new Date(e.ts).getTime() > cutoff);
```
- **Non-Goals:** Không thêm env override đường dẫn evidence (sẽ mở bypass mới — trỏ ledger sang file tạm = reset budget); không đổi hành vi sensitive matching (pre-existing, hướng fail-closed — chỉ sửa wording); không isolate eval-gate khỏi ledger thật (sau fix accounting, eval chỉ ghi record refused — trung thực, không tiêu budget).
- **Fix Confidence:** `HIGH`
- **get_errors:** affected files 0 errors.

---

## 4. Verification

- [x] Reproduce fixed: truncate ledger → refused `evidence unreadable or malformed` (test mới, RED trước fix).
- [x] Edge cases:
  - [x] corrupt `{not json}` → refused (test cũ, vẫn xanh)
  - [x] file bị xoá (dir còn) → refused (test cũ, vẫn xanh)
  - [x] file rỗng/whitespace → refused (test MỚI — lỗ fail-open)
  - [x] 20 record `refused` → observe vẫn permitted (không self lock-out)
  - [x] 20 record `permitted` → refused `budget exceeded: 20 permitted actions`
- [x] Regression: spec P0 **29 passed**; focused trio (P0 + guard-redteam + eval-gate-components) **51+ passed**; slop-check 3 file clean; eval-gate 8/8; audit chain OK; budget 544/1100.
- [x] `get_errors` toàn scope: 0 errors trên 3 file P0.
- [x] Fresh-eyes tier: `RECOMMENDED` (fail-open class, regression-prone) — áp dụng OCR Review round 2 (subagent độc lập, review-only), chính là nguồn tìm ra bug này.

---

## 5. Lesson (1 câu)

> Fail-closed phải phủ **MỌI dạng suy giảm** của dữ liệu (mất / hỏng / rỗng) — liệt kê theo lớp tương đương, không theo ví dụ; và budget chỉ tính hành động **đã permitted** (refused không được tự khoá hệ thống).

---

## 6. Prevention

- **Cách phòng tránh lần sau:**
  - [x] Mọi guard đọc dữ liệu bền (ledger/budget/policy) phải trả **fail-closed cho cả 3 dạng**: absent-trong-khi-dir-còn, corrupt, empty/truncate — và test cả 3.
  - [x] Accounting/rate-limit chỉ đếm hành động **đã xảy ra** (permitted); attempt bị refused không tiêu quota.
  - [x] Message/log phải khớp cơ chế thật (sensitive match đến từ URL → nói "sensitive URL", không nói "sensitive domain").
- **Guard (lưới chống tái lập — KN-056):**
  - [x] `tests/e2e/detection-egress-p0.spec.ts` — describe `CUA budget enforcement` (4 test khoá 3 dạng suy giảm + accounting).
  - [x] Tái lập của KN-069: đã ghi rõ + lý do lưới cũ không bắt (boundary khác) + nâng lưới TRƯỚC khi fix.
- **Cần cập nhật:**
  - [x] `docs/knowleged.md` → **không tạo KN mới** (KN-069 đã phủ lớp; đây là recurrence tại boundary mới — bằng chứng nên nhân rộng lưới lớp, không tạo ID trùng lớp).
  - [ ] `product-quality.instructions.md` — không áp dụng.
  - [x] Test mới: `tests/e2e/detection-egress-p0.spec.ts` (+3 test).

---

## References

- `docs/knowleged.md#kn-069` — Gate fail-open với arg rác (lớp cha; đây là recurrence tại boundary data-store).
- `docs/knowleged.md#kn-056` — Bug tái lập → nâng lưới trước khi fix.
- Plan P0: `.agent/plans/detection-egress-p0/` · Bug batch: `.agent/bugs/2026-09-23-p0-detection-egress-slop-gate-regression/`.
- Nguồn: OCR Review round 2 (Critic subagent, review-only) — 2026-09-24.

---
*Template: `.agent/bugs/_template/bug.md` — dùng bởi `/fixbug` Phase 1 & 5.*
