> 🤖 Auto-log bởi auto-learn.mjs — 2026-09-19T06:44:39.335Z
> **Error:** `checkBugReadiness regex Status:\s*fixed khong khop dong bold **Status:** (co backtick) -> evaluate luon in isFixed=false du bug da fix; isOpen tuong tu voi Status open bold`
> **File:** `.github/harness/scripts/auto-learn.mjs`
> **Title:** evaluate isFixed khong doc duoc Status bold

> 🔁 **RADAR TÁI LẬP** — đối chiếu KN + bug cũ thấy nghi vấn:
> - 🔁 NGHI TÁI LẬP **[KN-007]** (score 70.6): Thiếu hệ thống tự học hỏi tự động — phải làm tay, dễ quên
> - 🔁 NGHI TÁI LẬP **[KN-002]** (score 68.4): Trang STATUS www/ giao diện chưa hợp lý
> - 🔁 NGHI TÁI LẬP **[KN-015]** (score 68.4): GitHub Pages deploy fail — 2 workflows cùng `github-pages` env + eval-gate Node 18 CJS
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-14-status-mirror-stale-health-warn`** (score 69.5): status.json mirror stale — health=warn trong khi thực tế drafts=0 (suite đỏ)
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-18-instruction-budget-gate-fail-open-voi-arg-khong-ph`** (score 59.3): instruction-budget gate fail-open voi arg khong phai so
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-13-git-checkout-head-revert-nham-refactor-chua-commit`** (score 57.9): git checkout HEAD -- revert nhầm refactor chưa commit của auto-learn.mjs
> → Đọc **Cách phòng tránh** trong `docs/knowleged.md` TRƯỚC khi fix. Nếu là tái lập thật: ghi rõ "tái lập của KN-007" + **vì sao lưới cũ không bắt được** → nâng lưới (Guard) rồi mới fix.
# Bug: evaluate isFixed khong doc duoc Status bold

> Copy file này vào `.agent/bugs/2026-09-19-evaluate-isfixed-khong-doc-duoc-status-bold/bug.md` khi bắt đầu `/fixbug`.

## Meta

- **Slug:** `2026-09-19-evaluate-isfixed-khong-doc-duoc-status-bold`
- **Ngày:** 2026-09-19 (stub auto-log) → xử lý 2026-09-22 bởi YUNIE
- **Severity:** `major` (curator evaluate/commit gate đọc sai trạng thái bug)
- **Layer:** `code` — regex trong auto-learn.mjs, không phải fixture
- **Reporter:** auto-learn radar (stub) → YUNIE
- **Related KN:** `KN-056` (guard gate) · `KN-069` (boundary validation — verifier phải đọc đúng thế giới thực)
- **Tags:** `process` `automation` `gate`
- **Guard:** `tests/e2e/auto-learn-guard.spec.ts` — test “evaluate: đọc Status bold + backtick”
- **Status:** `fixed`

---

## 1. Reproduce

### Steps
1. Viết fixture bug.md theo ĐÚNG format template: dòng `- **Status:** \`fixed\`` + section Fix đã điền
2. `node .github/harness/scripts/auto-learn.mjs evaluate --bug <fixture> --dir <tmp> --json`
3. Trước fix: `checks.isFixed=false` **và** `checks.isOpen=false` dù file rõ ràng fixed

### Expected vs Actual
- **Expected:** `isFixed=true` khi dòng trạng thái bold + backtick, giá trị fixed; tương tự cho open
- **Actual:** cả hai false — regex `Status:\s*\`?fixed\`?` không khớp vì có `**` (bold) xen giữa `Status:` và backtick

### Evidence
```
Trước fix: /Status:\s*`?fixed`?/i.test('- **Status:** `fixed`')  === false
Sau fix:   /Status:\*{0,2}\s*`?fixed`?/i.test('- **Status:** `fixed`') === true
```

### Environment
- Branch: `main` · Node local · stub auto-log 19/09 (drafts treo 3 ngày) → xử lý cùng session 22/09 (health=warn do drafts treo)

---

## 2. Root Cause (5 Whys)

- **File:Line:** `.github/harness/scripts/auto-learn.mjs` — `checkBugReadiness()` (isFixed/isOpen) + `markBugFixed()`
- **Why 1:** evaluate in isFixed=false dù bug đã fixed? Regex không match dòng trạng thái.
- **Why 2:** Vì sao? Pattern `Status:\s*\`?fixed\`?` giả định backtick đứng ngay sau `Status: `; template repo dùng `- **Status:** \`fixed\`` (bold `**` xen giữa).
- **Why 3:** Vì sao lọt? Đường GHI status (người/agent điền tay theo template bold) khác đường ĐỌC (regex “tự nghĩ”) — không có test khoá cặp write/read.
- **Why 4:** Vì sao 3 ngày không phát hiện? Stub 19/09 treo trong drafts; drafts>0 làm health=warn nhưng không ai truy nguyên tới regex.
- **Why 5 (Root):** Verifier đọc format không theo template thật — “lưới rỗng”: tool dùng để đọc trạng thái chưa bao giờ được test với chính format template sinh ra.

- **Impact:** `evaluate`/commit gate đọc sai trạng thái → quyết định KN-worthy sai; `markBugFixed` no-op âm thầm với file bold (bug “đã fix” mà file vẫn open).
- **Hypothesis:** verified bằng fixture 2 chiều trong spec mới.
- **Confidence:** `HIGH`

> Cùng lớp KN-069 (boundary/verifier đọc sai thế giới thực) — không phải tái lập, cơ chế khác (format mismatch).

---

## 3. Fix

- **Approach:** Regex nhận cả `Status:` lẫn `Status:**` + backtick (`\*{0,2}\s*`); `markBugFixed` giữ nguyên wrapper khi replace (không phá bold, không no-op ngầm).
- **Files Changed:**
  - `.github/harness/scripts/auto-learn.mjs` — `checkBugReadiness` (isFixed/isOpen) + `markBugFixed`
  - `tests/e2e/auto-learn-guard.spec.ts` — 1 test mới (fixed/open bold)
- **Diff tóm tắt:**
```diff
- const isFixed = /Status:\s*`?fixed`?/i.test(bugText);
+ const isFixed = /Status:\*{0,2}\s*`?fixed`?/i.test(bugText);
- bugT = bugT.replace(/Status:\s*`?open`?/i, 'Status: `fixed`');
+ bugT = bugT.replace(/(Status:)(\*{0,2}\s*)`?open`?/i, (_, l, gap) => `${l}${gap}\`fixed\``);
```
- **Non-Goals:** không đổi format template bug.md; không đụng watchdog regex (đã bold-aware từ trước).
- **Fix Confidence:** `HIGH`
- **get_errors:** affected files 0 errors

---

## 4. Verification

- [x] Re-test: fixture bold (fixed) → `checks.isFixed=true`; fixture bold (open) → `checks.isOpen=true`, isFixed=false
- [x] Regression: `npx playwright test tests/e2e/auto-learn-guard.spec.ts` → toàn bộ pass (evaluate/propose/guards/log/suggest)
- [x] Fresh-eyes tier: `OPTIONAL` (deterministic regex)

**Kết quả:**
```
auto-learn-guard.spec.ts → pass (bao gồm test mới 'evaluate: đọc Status bold + backtick')
```

---

## 5. Lesson (1 câu)

> Verifier đọc format phải theo đúng template thật (`- **Status:** \`fixed\``) — regex “tự nghĩ” là lưới rỗng; mọi cặp write/read format cần 1 test khoá.

---

## 6. Prevention

- **Cách phòng tránh lần sau:**
  - [x] Test khoá cả 2 chiều: bold + backtick cho mọi regex đọc Status
  - [x] Stub draft cũ (không nội dung) phải được xử lý/đóng — drafts treo làm health=warn mờ nghĩa
- **Guard (lưới chống tái lập — KN-056):**
  - [x] `- **Guard:**` ở Meta — test mới trong `auto-learn-guard.spec.ts`
- **Cần cập nhật:**
  - [ ] `docs/knowleged.md` — gộp vào KN cùng lớp “verifier đọc sai format” (propose từ bug 22/09 kèm theo)

---

## References

- `docs/knowleged.md#KN-XXX`
- Issue / PR: #
- Commit fix: `<hash>`

---
*Template: `.agent/bugs/_template/bug.md` — dùng bởi `/fixbug` Phase 1 & 5.*
