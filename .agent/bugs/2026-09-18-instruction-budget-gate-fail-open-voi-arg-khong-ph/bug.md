> 🤖 Auto-log bởi auto-learn.mjs — 2026-09-18T13:15:08.291Z
> **Error:** `instruction-budget --budget abc -> parseInt('abc') = NaN -> 1399 > NaN = false -> status pass exit 0 (fail-open). Cung class: --top abc -> NaN (top rong), --budget thieu gia tri -> bi nuot im lang (flag ignored). Ky vong: exit 2 fail-closed theo doc cua chinh script.`
> **File:** `scripts/instruction-budget.mjs`
> **Title:** instruction-budget gate fail-open voi arg khong phai so

> 🔁 **RADAR TÁI LẬP** — đối chiếu KN + bug cũ thấy nghi vấn:
> - 🔁 NGHI TÁI LẬP **[KN-037]** (score 94.4): Evals Gap — "single biggest predictor" là evals discipline (Andrew Ng, Agentic AI Playbook 2026)
> - 🔁 NGHI TÁI LẬP **[KN-039]** (score 85.4): PS 5.1 không hỗ trợ `??` — lệnh PowerShell fail parse "Unexpected token"
> - 🔁 NGHI TÁI LẬP **[KN-059]** (score 81.5): Content ≠ Authority: adopt mechanism-half, không adopt doctrine-half
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-16-instruction-budget-always-on-phinh-khong-nguong`** (score 198.2): ** instruction budget always-on phinh khong nguong
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-03-agent-test-mutate-reward-hacking`** (score 70.6): Agent tự sửa test để pass (reward hacking)
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-14-routing-failover-chuan-hoa-pattern-khoa-luoi`** (score 68.9): Routing & Failover cho chain model/provider — chuẩn hoá pattern + khoá lưới chuỗ
> → Đọc **Cách phòng tránh** trong `docs/knowleged.md` TRƯỚC khi fix. Nếu là tái lập thật: ghi rõ "tái lập của KN-037" + **vì sao lưới cũ không bắt được** → nâng lưới (Guard) rồi mới fix.
# Bug: instruction-budget gate fail-open voi arg khong phai so

> Phát hiện qua OCR delegate review (skill `ocr-review`, dogfood đầu tiên) — 2026-09-18. Fix theo `/fixbug` bounded loop.

## Meta

- **Slug:** `2026-09-18-instruction-budget-gate-fail-open-voi-arg-khong-ph`
- **Ngày:** 2026-09-18
- **Severity:** `major`
- **Layer:** `code` — defect nằm ở chính gate script (parse/validate arg), không phải tầng đo hay fixture.
- **Reporter:** YUNIE (qua OCR delegate review — alibaba/open-code-review, dogfood lần đầu)
- **Related KN:** `KN-069` (paste 2026-09-18 — thứ tự: 16/09 giữ KN-068 → bài này KN-069; vụ ID fixed: `findNextKnId` claims-aware — KN-066 class)
- **Tags:** `process` `guard` `fail-closed` `gate`
- **Guard:** `tests/e2e/instruction-budget.spec.ts` — test `fail-closed arg: số rác/flag lạ không được NaN-pass oan` (5 assert: `--budget abc` · `--top abc` · `--budget` thiếu giá trị · `--top` thiếu giá trị · `--budget=9999` dạng = → exit 2)
- **Status: fixed** (dạng regex evaluate parse được — `**Status:**` bị `**` chèn giữa)

---

## 1. Reproduce

### Steps
1. `node scripts/instruction-budget.mjs --budget abc` → quan sát output + exit code.
2. Biến thể cùng root cause: `--top abc`; `--budget` (thiếu giá trị).
3. Control: `--budget 10` (phải fail), no-args (phải pass).

### Expected vs Actual
- **Expected:** arg số không hợp lệ → exit 2 (fail-closed — theo doc của chính script: `2 = fail-closed`).
- **Actual:** `--budget abc` → `parseInt('abc')` = NaN → `1399 > NaN` = false → status `pass` → **exit 0** + in "✅ Trong budget NaN dòng"; `--top abc` → top rỗng; `--budget` thiếu giá trị → flag bị nuốt im lặng (rơi về soft budget).

### Evidence
```
=== R1: --budget abc ===
✅ Trong budget NaN dòng (always-on 1399, headroom NaN).   exit=0   ← BUG (NaN-pass oan)
=== R2: --top abc ===
Top always-on: (rỗng)                                      exit=0
=== R3: --budget (thiếu giá trị) ===
✅ Trong ngân sách (soft 1400 dòng always-on).               exit=0   ← flag ignored
=== R4: control --budget 10 ===
⛔ Vượt budget 10 dòng (always-on 1399)                      exit=1   ← đúng
```

### Environment
- Branch: `main` · Commit: `ab2a875` (script chưa đổi từ 2026-09-16 — defect từ lúc tạo)
- OS: Windows 11 · Node v22.22.2 · `ocr v1.12.5` (phát hiện qua delegate review)

---

## 2. Root Cause (5 Whys)

- **File:Line:** `scripts/instruction-budget.mjs` (`parseArgs` — `parseInt` không validate)
- **Why 1:** `parseInt('abc', 10)` = NaN; `budget` mang NaN vào `buildReport`.
- **Why 2:** `over = 1399 > NaN` = false (mọi so sánh với NaN đều false) → status `pass` → exit 0.
- **Why 3:** `parseArgs` chỉ check `!= null` — không check finite/số hợp lệ; `--budget` thiếu giá trị rơi về `null` (như không truyền).
- **Why 4:** Gate viết với giả định "user luôn truyền số đúng" — input rác không được coi là đường đi (trust boundary CLI arg không validate).
- **Why 5 (Root):** Pattern "parse → dùng ngay, thiếu validate tại boundary" nằm trong **chính gate script**: tool fail-closed phải fail-closed với MỌI input (kể cả arg rác), không chỉ dir lỗi — spec cũ (16/09) khoá fail-closed cho dir nhưng để trống đường arg.

- **Impact:** Gate `--budget` bị vô hiệu khi arg sai kiểu (CI/gõ tay) — pass oan = lưới token-budget không chặn gì; `--top abc` in báo cáo rỗng. Nội bộ, không ảnh hưởng user ngoài — nhưng là guard asset của KN-068.
- **Hypothesis:** Thay `parseInt` bằng `Number()` + validate `Number.isFinite`, thiếu giá trị → exit 2. Đã verify: spec RED trước (1 failed) → GREEN sau (4 passed).
- **Confidence:** `HIGH` — reproduce fixed + regression pass (4/4) + edge (thiếu giá trị, `--top`, control hợp lệ).

> Nếu bug chạm pattern trong `docs/knowleged.md` → ghi `Related KN: KN-XXX` và áp dụng **Cách phòng tránh** ngay.
> **Root Cause Gate:** Nếu uncertain → investigate / escalate, không tự biến hypothesis thành sự thật.

---

## 3. Fix

- **Approach:** Sửa ở gốc: thêm validator `num()` trong `parseArgs` — `Number()` + `Number.isFinite` (chặt hơn `parseInt`: `'15abc'` cũng NaN → exit 2 thay vì parse nửa vời = 15); flag thiếu giá trị (`args.includes('--budget')` + value null) → exit 2. Không đổi semantics các arg hợp lệ.
- **Files Changed:**
  - `scripts/instruction-budget.mjs` — `parseArgs` thêm `num()` fail-closed + doc exit code cập nhật "... / arg số không hợp lệ".
  - `tests/e2e/instruction-budget.spec.ts` — guard test mới (3 assert) + header comment item 5.
- **Diff tóm tắt:**
```diff
-    top: parseInt(opt('--top', '8'), 10),
-    budget: budgetRaw != null ? parseInt(budgetRaw, 10) : null,
+    top: num(opt('--top', '8'), '--top'),
+    budget: args.includes('--budget') ? num(opt('--budget', null), '--budget') : null,
+  // num(): Number() + isFinite; invalid/thiếu → console.error + process.exit(2)
```
- **Non-Goals:** KHÔNG đổi ngưỡng ratchet 1400; KHÔNG thêm dạng `--budget=1500` (space-form là syntax chính thức); KHÔNG sửa test cũ (chỉ THÊM test mới — actor `verify`, policy gate hợp lệ).
- **Vòng 2 — OCR delegate review (subagent, cùng ngày):** reviewer tìm 2 minor **cùng class fail-open** → siết luôn trong loop: (#1) `--top` thiếu giá trị còn rơi im lặng về default 8 → giờ exit 2 nhất quán với `--budget`; (#2) dạng `--budget=1400` / typo `--budjet` bị nuốt → gate "tưởng bật mà tắt" → giờ arg lạ (`--*` ngoài whitelist) exit 2. 2 info chấp nhận không đổi: `Number()` siết hơn `parseInt` (reviewer xác nhận vô hại), value âm/0 fail theo hướng an toàn.
- **Fix Confidence:** `HIGH` — RED→GREEN 2 vòng (vòng 1: 1 failed→4 passed; vòng 2 sau review: 1 failed→4 passed), manual repro 11 case.
- **get_errors:** affected files 0 errors; full scope 0 errors (IDE diagnostics).

---

## 4. Verification

- [x] Re-run steps reproduce → **Fixed**: R1/R2/R3 đều exit 2 + stderr "⛔ fail-closed: <arg> không hợp lệ"; R4 control exit 1 giữ nguyên.
- [x] Edge cases:
  - [x] `--budget abc` → exit 2 (+ message nêu rõ tên arg + giá trị)
  - [x] `--top abc` → exit 2
  - [x] `--budget` thiếu giá trị → exit 2 (không còn nuốt im lặng)
  - [x] `--budget 1500` hợp lệ → exit 0 (headroom 101)
- [x] Regression: spec 4/4 passed (`npx playwright test tests/e2e/instruction-budget.spec.ts`); no-args + `--json` không đổi.
- [x] `get_errors` toàn scope → 0 errors.
- [x] Slop gate (KN-047): `node scripts/slop-check.mjs scripts/instruction-budget.mjs tests/e2e/instruction-budget.spec.ts` → ✅ Clean.
- [x] Fresh-eyes tier: `OPTIONAL` (deterministic — parse/validate logic, phủ bởi spec + manual 6 case).

**Kết quả:**
```
Vòng 1 — R1 --budget abc → exit 2 ✅ · R2 --top abc → exit 2 ✅ · R3 --budget thiếu giá trị → exit 2 ✅ · R4 control exit 1 ✅ · R5 no-args exit 0 ✅
Vòng 2 (sau OCR review) — M1 --budget=9999 → exit 2 ✅ · M2 --budjet (typo) → exit 2 ✅ · M3 --top thiếu giá trị → exit 2 ✅ · M4 control --budget 1400 → exit 0 ✅ · M5 no-args → exit 0 ✅
spec: 4 passed (guard test 5 assert) · slop-check: Clean · get_errors: 0
```

---

## 5. Lesson (1 câu)

> Gate script (fail-closed by design) phải validate MỌI input tại boundary — arg số sai kiểu không được parse thành NaN rồi so sánh im lặng false (NaN-pass): invalid → exit 2, không bao giờ pass oan.

---

## 6. Prevention

- **Cách phòng tránh lần sau:**
  - [x] Mọi numeric arg của gate script: `Number()` + `Number.isFinite` validate trong `parseArgs`, invalid → exit 2 (không `parseInt` nửa vời, không so sánh NaN).
  - [x] Flag gate thiếu giá trị = lỗi sử dụng → exit 2 (không fallback im lặng về default).
  - [x] Checklist vào `docs/knowleged.md` Anti-patterns (khi paste KN).
- **Guard (lưới chống tái lập — KN-056):**
  - [x] `- **Guard:**` đã điền ở Meta: `tests/e2e/instruction-budget.spec.ts` — test `fail-closed arg: ...` (5 assert, mở rộng ở vòng 2 sau review).
  - [x] **KHÔNG phải tái lập thật** của bug 16/09 dù RADAR score 198 — khác defect: cũ = "thiếu gate" (fixed bằng tạo script+spec); mới = "gate fail-open khi arg rác" (defect tiểm ẩn của chính guard asset). Lưới cũ không bắt được vì: spec 16/09 test fail-closed cho **dir** (rỗng/không tồn tại) nhưng không test đường **parse arg** → lỗ hổng coverage, giờ khoá bằng test mới.
- **Cần cập nhật:**
  - [x] `docs/knowleged.md` → KN mới (draft từ `propose` — chờ duyệt paste; Related KN đã ghi ở Meta)
  - [ ] `product-quality.instructions.md` — không áp dụng (không phải UI)
  - [x] Test mới: `tests/e2e/instruction-budget.spec.ts` (test thứ 4)

---

## References

- `docs/knowleged.md#KN-069` (pasted 2026-09-18) · bug liên quan: `2026-09-16-instruction-budget-always-on-phinh-khong-nguong` (KN-068)
- Nguồn phát hiện: OCR delegate review ([alibaba/open-code-review](https://github.com/alibaba/open-code-review)) — dogfood skill `ocr-review` lần đầu
- Commit fix: `<workspace — chưa commit>`

---
*Bug: `/fixbug` Phase 1 & 5 — filled 2026-09-18.*
