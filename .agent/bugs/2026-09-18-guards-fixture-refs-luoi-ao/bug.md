> 🤖 Auto-log bởi auto-learn.mjs — 2026-09-18T14:11:26.220Z
> **Error:** `guards coverage dem ref dang chuoi tran 'KN-XXX' trong fixture data cua dream.spec (row/block/toEqual + computeNextKnId data) la luoi — KN-001..005, KN-010, KN-067/069 hien dien gia trong coverage audit; bug loai KN-049: do nham tin hieu synthetic`
> **File:** `.github/harness/scripts/auto-learn.mjs`
> **Title:** guards audit tinh fixture refs la luoi (guard ao)

> 🔁 **RADAR TÁI LẬP** — đối chiếu KN + bug cũ thấy nghi vấn:
> - 🔁 NGHI TÁI LẬP **[KN-056]** (score 272.8): Vòng chống tái lập: KN không lưới = wishlist — log RADAR + Guard gate + `guards` audit
> - 🔁 NGHI TÁI LẬP **[KN-066]** (score 195.1): KN ID double-yield: đa phiên song song cùng nhận 1 ID — re-check trước paste + detector integrity sau paste
> - 🔁 NGHI TÁI LẬP **[KN-060]** (score 164): SkillOpt: sửa skill/KN không qua validation gate — edit trôi, rejected edits không thành negative feedback
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-13-kn-recurrence-no-guard`** (score 190.5): Bug tái lập dù đã có KN — không gì phát hiện "tái lập" + KN không có lưới (kèm p
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-12-cmb-shorthand-false-zeroref`** (score 182.4): CMB zeroRef false positive — detector bỏ qua shorthand + bug.md giữ link KN sai
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-14-skill-kn-sua-khong-qua-eval-gate-bi-troi-am-tham`** (score 166.4): SkillOpt — thiếu validation gate cho skill/KN: edit trôi, rejected edits không t
> → Đọc **Cách phòng tránh** trong `docs/knowleged.md` TRƯỚC khi fix. Nếu là tái lập thật: ghi rõ "tái lập của KN-056" + **vì sao lưới cũ không bắt được** → nâng lưới (Guard) rồi mới fix.
# Bug: guards audit tính fixture refs là lưới (guard ảo)

> Fix ngay trong session OCR-review (batch B #1). Draft tự log bởi `auto-learn log`; các mục dưới đã điền sau fix. **Related: KN-056 amend** (luật đếm + negative control).

## Meta

- **Slug:** `2026-09-18-guards-fixture-refs-luoi-ao`
- **Ngày:** 2026-09-18
- **Severity:** `major`
- **Layer:** `measure-verifier` (defect ở phép đo — guards audit; KN-064: sửa world trước)
- **Reporter:** YUNIE (OCR review toàn bộ KN — batch B #1)
- **Related KN:** `KN-056` (amend 2026-09-18) + lớp `KN-049` (đo nhầm tín hiệu synthetic)
- **Tags:** `process` `verification` `metrics` `guard`
- **Guard:** `tests/e2e/auto-learn-guard.spec.ts` — test "fixture refs KHÔNG tính là lưới" (3 assert)
- **Status:** `fixed`

---

## 1. Reproduce

### Steps
1. `node .github/harness/scripts/auto-learn.mjs guards --json` (trước fix) — đọc mapping `KN-001..005`.
2. Grep `tests/e2e/dream.spec.ts` — thấy `row('KN-001', ...)` / `block('KN-003', ...)` / `.toEqual(['KN-001','KN-002'])` — fixture DATA của corpus test, không phải citation.
3. So refs ở `kn-id-integrity.spec.ts:90-93` — `computeNextKnId(['KN-067'], ['KN-068'])` (id-arithmetic data).

### Expected vs Actual
- **Expected:** `guards` coverage chỉ tính **citation bài học** (comment/test khoá invariant/Guard line); fixture data không được tính.
- **Actual:** MỌI ref `/KN-\d{3}/` trong test files được đếm → fixture thành "lưới": KN-002/005 tưởng có lưới, KN-010/067/069 nhận attribution từ id-arithmetic data; priority nhiễu.

### Evidence
```
guards BEFORE: withGuard 44 / withoutGuard 24 / priority 22
  KN-001..005 :: dream.spec.ts (fixture row/block) — KN-002/005 CHỈ có nguồn này
  KN-010/067/069 :: kn-id-integrity.spec.ts (data `['KN-067']` — arithmetics)
guards AFTER (filter): withGuard 47 (LOST đúng 8 pair fixture/data · GAINED 6 net mới + KN-002 parity)
```

### Environment
- Branch: `main` (working tree)
- OS: Windows 11 · Node 18+ (CLI, không cần browser)

---

## 2. Root Cause (5 Whys)

- **File:Line:** `.github/harness/scripts/auto-learn.mjs` → `collectGuardMap()` (scan regex `/KN-\d{3}/g` trên mọi spec/test)
- **Why 1:** Fixture hiện diện như lưới vì scan bắt mọi match text — không phân biệt citation vs data.
- **Why 2:** Không phân biệt vì detector chỉ có 1 luật "có chuỗi KN-XXX là có ref" — chưa có luật hình thức cho dạng ref.
- **Why 3:** Chưa có luật vì coverage audit viết khi test files chủ yếu cite qua comment; fixture-style refs (`'KN-XXX'` chuỗi trần) chưa tồn tại lúc đó (dream.spec/kn-id-integrity thêm sau).
- **Why 4:** Không ai bắt vì `guards` không có negative control — dogfood spec chỉ assert "bắt được guard đã biết", không assert "KHÔNG bắt fixture".
- **Why 5 (Root):** Phép đo thiếu lớp "ref này là citation hay fixture data" ở phía test-side (mirror KN-049 đã làm cho audit-side).

- **Impact:** 2 KN tưởng có lưới (002/005 — sai an toàn); 3 KN nhận attribution ảo (010/067/069); bảng priority 22 mục bị nhiễu, che 5 KN thiếu lưới thật (011/042/043/045/055).
- **Hypothesis:** Ref dạng chuỗi trần `'KN-XXX'` (quote cùng ký tự 2 bên) = fixture data → filter. Đã verify bằng diff trước/sau (LOST/GAINED đúng dự kiến).
- **Confidence:** `HIGH` (proven: diff 44→47 + negative control test mới + 6 spec PASS)

> Nếu bug chạm pattern trong `docs/knowleged.md` → ghi `Related KN: KN-XXX` và áp dụng **Cách phòng tránh** ngay.
> **Root Cause Gate:** Nếu uncertain → investigate / escalate, không tự biến hypothesis thành sự thật.

---

## 3. Fix

- **Approach:** Sửa ở gốc phép đo: `collectGuardMap` bỏ ref chuỗi trần (fixture data, tách helper `isBareQuotedRef` giữ CC ≤12); dogfood thêm negative control; bồi các net thật bị thiếu lộ ra sau khi phép đo sạch.
- **Files Changed:**
  - `.github/harness/scripts/auto-learn.mjs` — filter + docstring + `policy.detection`
  - `tests/e2e/auto-learn-guard.spec.ts` — test "fixture refs KHÔNG tính là lưới" (KN-001/003 negative control)
  - `tests/e2e/web-thuat-toan.spec.ts` — net KN-011 (Random → stepBtn enabled + step advance)
  - `tests/e2e/yt-summary.spec.ts` · `agentic-academy.spec.ts` · `status-audit.spec.ts` — cite KN-042/043/045 + L5 parity (KN-002)
  - `tests/e2e/responsive.spec.ts` — invariant element-vs-container (KN-055)
  - `docs/knowleged.md` — KN-056 amend (luật đếm)
- **Diff tóm tắt:**
```diff
- for (const m of text.matchAll(/KN-\d{3}/g)) add(m[0], rel);
+ const unquoted = [...text.matchAll(/KN-\d{3}/g)].filter((m) => !isBareQuotedRef(text, m.index, m[0].length));
+ for (const m of unquoted) add(m[0], rel);
```
- **Non-Goals:** Không đổi range/shorthand expansion; không đụng Guard-line detection; không refactor gì thêm (slop-check bắt CC 13 → tách helper, giữ nguyên hành vi).
- **Fix Confidence:** `HIGH`
- **get_errors:** không có linter cho .mjs — thay bằng `node --check` + slop-check (Clean).

---

## 4. Verification

- [x] Re-run reproduce → **Fixed**: guards withGuard 44→47, LOST 8 = đúng danh sách fixture (dream.spec ×5 + kn-id-integrity ×3), GAINED 7 = 6 net mới + KN-002 parity
- [x] Edge cases:
  - [x] KN-003 giữ lưới thật (angle.spec) + mất fixture dream.spec
  - [x] id-arithmetic data (`['KN-067']`) không còn tính; KN-067 giữ Guard line riêng (dream.spec + kn-id-integrity declared)
- [x] Regression: 6 spec chạm → 43 passed + 1 fail ban đầu (assert sai pattern bài 004 — sửa thành invariant "li tăng") → re-run 6/6 PASS
- [x] `node --check` + slop-check `auto-learn.mjs` → Clean (CC 13→12 sau tách helper)
- [x] Fresh-eyes tier: `OPTIONAL` (deterministic CLI) — kết hợp OCR review 3 subagent ở tầng session

**Kết quả:**
```
guards BEFORE → AFTER: withGuard 44 → 47 · withoutGuard 24 → 21 · priority 22 → 19
playwright (angle/responsive/web-thuat-toan/auto-learn-guard/kn-id-integrity/status-audit): 44 passed (sau fix assert: web-thuat-toan 6/6)
```

---

## 5. Lesson (1 câu)

> Phép đo "có lưới hay không" phải phân biệt **citation bài học** với **fixture data** — ref dạng chuỗi trần `'KN-XXX'` không phải lưới (guard ảo, cùng lớp KN-049).

## 6. Prevention

- **Cách phòng tránh lần sau:**
  - [x] `guards` bỏ ref chuỗi trần; `policy.detection` ghi rõ luật đếm
  - [x] Negative control trong dogfood spec: assert "KHÔNG bắt fixture" bên cạnh "bắt guard đã biết"
- **Guard (lưới chống tái lập — KN-056):**
  - [x] `tests/e2e/auto-learn-guard.spec.ts` — test "fixture refs KHÔNG tính là lưới"
  - [x] RADAR: nghi tái lập KN-056/066/060 (cùng họ đo lường/knowledge) — adjudicated: **liên quan, không tái lập** (KN-056 đã bắt đúng class; instance mới = fixture-side)
- **Cần cập nhật:**
  - [x] `docs/knowleged.md` → KN-056 amend (luật đếm + negative control + 6 net mới)

---

## References

- `docs/knowleged.md` — KN-056 (amend 2026-09-18) · KN-049 (lớp lỗi)
- Bug gốc review: OCR-review toàn bộ KN (session 2026-09-18) — findings bảng batch B #1
- Commit fix: working tree (session 2026-09-18)

---
*Template: `.agent/bugs/_template/bug.md` — dùng bởi `/fixbug` Phase 1 & 5.*
