> 🤖 Auto-log bởi auto-learn.mjs — 2026-09-12T15:13:28.482Z
> **Error:** `Gravity G HIGH tot nhung badge do nhu bao dong - polarity nguoc S/D/M`
> **File:** `www/cosmos/scale.html`
> **Title:** gravity-badge-polarity-nguoc

# Bug: gravity-badge-polarity-nguoc

> Copy file này vào `.agent/bugs/2026-09-12-gravity-badge-polarity-nguoc/bug.md` khi bắt đầu `/fixbug`.

## Meta

- **Slug:** `2026-09-12-gravity-badge-polarity-nguoc`
- **Ngày:** 2026-09-12
- **Severity:** `minor`
- **Reporter:** @user ("Gravity G HIGH") / YUNIE
- **Related KN:** `KN-005` (bug blindness) + `KN-013` (minimal-ladder/YAGNI)
- **Tags:** `ui` `metrics` `a11y` `verify`
- **Status:** `fixed`

---

## 1. Reproduce

### Steps
1. `node .github/harness/scripts/cosmic-scale.mjs --json` → `gravity.G=8 (high)`, advice "Gravity mạnh — scope được kiểm soát tốt" (trạng thái TỐT).
2. Mở `www/cosmos/scale.html#de` → badge `G=8 (high)` class `gauge-level high` = đỏ `#fca5a5`, cùng màu Entropy HIGH (heat death) và D HIGH (decollaboration).
3. Mở `www/cosmos/index.html` observatory → tile Gravity không phân biệt tốt/xấu bằng màu.

### Expected vs Actual
- **Expected:** G HIGH (tốt) → xanh; G low (scope phình, xấu) → đỏ.
- **Actual:** G HIGH → đỏ như báo động; G low → xanh như an toàn — đảo polarity hoàn toàn.

### Evidence
- `scale.json`: `G=8 high · cutRatio 0.84 · 21/25 plans` (số đúng, chỉ màu sai).
- Spec `tests/e2e/cosmos-gravity-polarity.spec.ts` 5/5 + full suite 138/138.
- Evidence: `.agent/plans/cosmos-gravity-polarity/verify/` (3 PNG).

### Environment
- Branch: `main`
- OS: Windows + pwsh · Browser: Playwright chromium

---

## 2. Root Cause (5 Whys)

- **File:Line:** `www/cosmos/scale.html` (gBadge mapping) + `www/cosmos/index.html` (observatory tile)
- **Why 1:** Badge G đỏ khi tốt → vì class mapping copy y nguyên thang S/D/M (`high→high`) mà không đảo polarity.
- **Why 2:** Copy y nguyên → vì khi ship G, thang `low<3 · medium<6 · high>=6` được reuse cùng CSS `gauge-level`, không ai ghi chú G ngược nghĩa (cao=tốt).
- **Why 3:** Không ghi chú → vì metric xã hội bị xem là informational, không qua review polarity như gate S.
- **Why 4:** Không review → vì màu bị xem là "trang trí", không phải tín hiệu tiền-chú ý.
- **Why 5 (Root):** Màu badge là tín hiệu, không phải trang trí — metric "cao=tốt" dùng chung palette "cao=xấu" mà không đảo mapping.

- **Impact:** User quét đỏ tưởng hệ xấu dù G=8 là tốt nhất từ trước tới nay; Dissent gate vừa sửa xong mất uy tín oan.
- **Hypothesis:** Không có — đo trực tiếp bằng DOM class, không đoán.
- **Confidence:** `HIGH` (DOM assert + full 138/138)

> Nếu bug chạm pattern trong `docs/knowleged.md` → ghi `Related KN: KN-XXX` và áp dụng **Cách phòng tránh** ngay.
> **Root Cause Gate:** Nếu uncertain → investigate / escalate, không tự biến hypothesis thành sự thật.

---

## 3. Fix

- **Approach:** Đảo mapping class (không đổi công thức/thang/advice/JSON): `scale.html` gBadge `high→low(xanh) · low→high(đỏ)`; `index.html` tile `G>=6→trắng · >=3→warn · else→hot`. Chữ level trong badge giữ nguyên (`G=8 (high)`).
- **Files Changed:**
  - `www/cosmos/scale.html` — gBadge mapping + comment polarity
  - `www/cosmos/index.html` — observatory Gravity tile class
- **Non-Goals:** Không đổi công thức/thang/advice G; không đổi màu S/D/M; không thêm CSS class mới.
- **Fix Confidence:** `HIGH`
- **get_errors:** 2 files → 0 errors.

---

## 4. Verification

- [x] Re-run steps reproduce → **Fixed** (G=8 badge xanh `gauge-level low`; tile observatory trắng)
- [x] Edge cases:
  - [x] D=0 vẫn xanh + S=9 vẫn xanh — polarity D/S không đổi
  - [x] S=30 mock vẫn đỏ `hot` — S giữ polarity cao=xấu
  - [x] G=null (chưa đo) → `G=—` như cũ
- [x] Regression: full suite 138/138 pass
- [x] `get_errors` 2 files → 0 errors
- [x] `slop-check`: không thêm findings mới (baseline stash chứng minh; `index.html` findings pre-existing)
- [x] UI audit: 375px không tràn + 0 pageerror (spec)
- [x] Fresh-eyes tier: `RECOMMENDED` — verify actor độc lập tạo spec mới

**Kết quả:**
```
spec cosmos-gravity-polarity 5/5 · full 138/138 · get_errors 0
G=8 (high) → badge low (xanh) · tile trắng · S=30 mock vẫn hot
```

---

## 5. Lesson (1 câu)

> Màu badge là tín hiệu, không phải trang trí — metric "cao=tốt" dùng chung palette "cao=xấu" mà không đảo mapping sẽ báo động giả.

---

## 6. Prevention

- **Cách phòng tránh lần sau:**
  - [ ] Metric mới có polarity ngược (cao=tốt) → ghi `POLARITY: inverted` ngay trong PRD + comment tại chỗ mapping
  - [ ] Spec assert màu theo ngữ nghĩa (tốt=xanh, xấu=đỏ), không assert theo chữ level
- **Cần cập nhật:**
  - [ ] `docs/knowleged.md` → addendum KN-013 hoặc KN-005 (không cần KN mới)
  - [ ] Test mới: `tests/e2e/cosmos-gravity-polarity.spec.ts` (verify actor đã tạo, 5/5)

---

## References

- `docs/knowleged.md#KN-XXX`
- Issue / PR: #
- Commit fix: `<hash>`

---
*Template: `.agent/bugs/_template/bug.md` — dùng bởi `/fixbug` Phase 1 & 5.*
