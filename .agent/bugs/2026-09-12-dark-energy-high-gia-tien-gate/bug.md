> 🤖 Auto-log bởi auto-learn.mjs — 2026-09-12T14:52:18.691Z
> **Error:** `Dark Energy D=7 HIGH gia do dem 49 plans tien-gate truoc KN-018`
> **File:** `.github/harness/scripts/cosmic-scale.mjs`
> **Title:** dark-energy-high-gia-tien-gate

# Bug: dark-energy-high-gia-tien-gate

> Copy file này vào `.agent/bugs/2026-09-12-dark-energy-high-gia-tien-gate/bug.md` khi bắt đầu `/fixbug`.

## Meta

- **Slug:** `2026-09-12-dark-energy-high-gia-tien-gate`
- **Ngày:** 2026-09-12
- **Severity:** `minor`
- **Reporter:** @user ("Dark Energy D HIGH, hay sua") / YUNIE
- **Related KN:** `KN-018`
- **Tags:** `process` `metrics` `verification`
- **Status:** `fixed`

---

## 1. Reproduce

### Steps
1. `node .github/harness/scripts/cosmic-scale.mjs --json` → `darkEnergy.D = 7 (high)`, advice "decollaboration dang no rong".
2. Dem plans: 72 dirs co prd.md, chi 22 co Dissent → dissentRatio 0.31.
3. Nhung 49/50 plans thieu Dissent co mtime < 2026-09-07 (ngay KN-018 ra doi) — gate chua ton tai khi chung sinh.

### Expected vs Actual
- **Expected:** D phan anh hanh vi hien tai (plans tu 2026-09-07: 22/23 co Dissent → D~0).
- **Actual:** D=7 high — trung phat qua khu khong the sua, alarm fatigue.

### Evidence
- `scale.json` truoc fix: `D=7, plansTotal=72, plansWithDissent=22`.
- Sau fix: `D=0, plansTotal=25, plansWithDissent=25, plansLegacy=49`.
- Spec `tests/e2e/cosmos-dark-energy.spec.ts` 5/5 + full suite 133/133.

### Environment
- Branch: `main`
- OS: Windows + pwsh 7

---

## 2. Root Cause (5 Whys)

- **File:Line:** `.github/harness/scripts/cosmic-scale.mjs: measurePlans()`
- **Why 1:** D HIGH gia → vi mau dem gom 49 plans sinh truoc khi gate ton tai (0/49 co Dissent la dung luat thoi do).
- **Why 2:** Mau gom tat ca → vi `measurePlans()` khong co khai niem cua so gate, dem moi prd.md tren FS.
- **Why 3:** Khong co cua so → vi khi ship D (2026-09-10) chua ai nghi toi hieu ung tien-gate; khong test nao khoa `plansTotal + plansLegacy = dirs co prd`.
- **Why 4:** Khong nghi toi → vi metric xa hoi de bi xem la informational, khong qua review nghiem nhu gate S.
- **Why 5 (Root):** Metric do hanh vi phai neo vao ngay luat co hieu luc — dem ca qua khu truoc luat la do sai mau, khong phai do cong thuc.

- **Impact:** Dashboard bao HIGH sai → mat niem tin vao Dissent gate; user phai hoi tay.
- **Hypothesis:** mtime prd.md = ngay sinh plan — da verify 5/5 mau git-birth khop mtime.
- **Confidence:** `HIGH` (D 7→0 do lai bang tool + spec 5/5 + full 133/133)

> Nếu bug chạm pattern trong `docs/knowleged.md` → ghi `Related KN: KN-XXX` và áp dụng **Cách phòng tránh** ngay.
> **Root Cause Gate:** Nếu uncertain → investigate / escalate, không tự biến hypothesis thành sự thật.

---

## 3. Fix

- **Approach:** Cua so gate (khong backfill qua khu): `measurePlans()` chi dem prd.md mtime >= 2026-09-07, tra ve `plansLegacy`; append Dissent that cho plan duy nhat trong cua so con thieu (web-011-part8); dashboard render row tien-gate.
- **Files Changed:**
  - `.github/harness/scripts/cosmic-scale.mjs` — `GATE_SINCE_MS` + loc mtime + `plansLegacy` trong darkEnergy/gravity
  - `.agent/plans/web-011-part8/prd.md` — append `Who did you think with?` (rival + assumption + Workbox)
  - `www/cosmos/scale.html` — row tien-gate o `#deParts`/`#gravityParts` (guard field thieu)
  - `www/cosmos/scale.json` — regenerate qua `npm run cosmos:refresh` (khong sua tay)
- **Non-Goals:** Khong backfill 49 PRD cu (bia Dissent cho qua khu); khong doi cong thuc D hay thang level; khong gate D nhu S.
- **Fix Confidence:** `HIGH`
- **get_errors:** 3 files affected → 0 errors.

---

## 4. Verification

- [x] Re-run steps reproduce → **Fixed** (D 7→0, 25/25 dissent, legacy 49)
- [x] Edge cases:
  - [x] scale.json cu thieu `plansLegacy` → dashboard khong render row (guard `!= null`), khong crash
  - [x] `plansTotal + plansLegacy` = so dirs co prd.md (khoa trong spec)
- [x] Regression: full suite 133/133 pass
- [x] `get_errors` **toan scope** → 0 errors (3 files affected)
- [x] `slop-check` mjs → clean; scale.html 5 findings pre-existing (baseline stash chung minh, render() chi +8 dong row)
- [x] UI audit: 375px khong tran + 0 pageerror (spec)
- [x] Fresh-eyes tier: `RECOMMENDED` (regression-prone: metric + dashboard) — verify actor doc lap tao spec moi

**Kết quả:**
```
D=0 25/25 legacy=49 · G=8 21/25 · S=9 low
spec cosmos-dark-energy 5/5 · full 133/133 · slop mjs clean · get_errors 0
```

---

## 5. Lesson (1 câu)

> Metric do hanh vi phai neo vao ngay luat co hieu luc — dem ca qua khu truoc luat la do sai mau, khong phai cong thuc sai.

---

## 6. Prevention

- **Cách phòng tránh lần sau:**
  - [ ] Metric moi ra doi cung gate/luat → ghi ngay `SINCE` (ngay hieu luc) + dem rieng legacy trong output
  - [ ] Spec khoa `total + legacy = tong dirs` de mau khong roi mat plan
  - [ ] Dashboard hien legacy minh bach thay vi giau mau
- **Cần cập nhật:**
  - [ ] `docs/knowleged.md` → addendum vao KN-018 (khong can KN moi: cung root decollaboration)
  - [ ] Test mới: `tests/e2e/cosmos-dark-energy.spec.ts` (verify actor da tao, 5/5)

---

## References

- `docs/knowleged.md#KN-XXX`
- Issue / PR: #
- Commit fix: `<hash>`

---
*Template: `.agent/bugs/_template/bug.md` — dùng bởi `/fixbug` Phase 1 & 5.*
