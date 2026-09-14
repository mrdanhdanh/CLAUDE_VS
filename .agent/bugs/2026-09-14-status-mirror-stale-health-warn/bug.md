> 🤖 Auto-log bởi auto-learn.mjs — 2026-09-14T16:45:47.695Z
> **Error:** `Full suite 197/198: status-sections.spec.ts health card FAIL - www/status.json mirror stale (generate luc drafts=1 -> health=warn; thuc te drafts=0 -> health phai ok, app.js chi render 'He thong on dinh' khi status==='ok'). Nguyen nhan: mirrors regenerate thu cong, khong ai regen sau khi cac bug draft duoc finalize (drafts 1->0). Fix: node generate-status.mjs --regen + verify`
> **File:** `www/status.json`
> **Title:** status.json mirror stale - health warn, suite do

> 🔁 **RADAR TÁI LẬP** — đối chiếu KN + bug cũ thấy nghi vấn:
> - 🔁 NGHI TÁI LẬP **[KN-002]** (score 183.9): Trang STATUS www/ giao diện chưa hợp lý
> - 🔁 NGHI TÁI LẬP **[KN-045]** (score 147.4): STATUS audit: link footer 404 trên Pages + registry placeholder descriptions + aria-labelledby tab sai ID
> - 🔁 NGHI TÁI LẬP **[KN-039]** (score 139): PS 5.1 không hỗ trợ `??` — lệnh PowerShell fail parse "Unexpected token"
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-08-29-status-ui`** (score 148.5): Trang STATUS www/ giao diện chưa hợp lý — layout, responsive, registry render sa
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-13-status-375-overflow-grid-1fr-min-content-blowout-k`** (score 146.4): STATUS 375 overflow — grid 1fr min-content blowout khi title dai
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-13-stop-hook-loi-dau-ngoac-trong-lenh-echo-bi-powersh`** (score 139.2): Stop hook lỗi — dấu ngoặc trong echo bị PowerShell parse thành subexpression
> → Đọc **Cách phòng tránh** trong `docs/knowleged.md` TRƯỚC khi fix. Nếu là tái lập thật: ghi rõ "tái lập của KN-002" + **vì sao lưới cũ không bắt được** → nâng lưới (Guard) rồi mới fix.
# Bug: status.json mirror stale — health=warn trong khi thực tế drafts=0 (suite đỏ)

> RADAR nghi **KN-002** (183.9) — **cùng hệ** (mirror phải regenerate — không viết tay/sửa tay), **không phải bài học mới** → không tạo KN (consolidation — KN-062). Version này = lần trượt "regen sau state change".

## Meta

- **Slug:** `2026-09-14-status-mirror-stale-health-warn`
- **Ngày:** 2026-09-14
- **Severity:** minor
- **Layer:** env-fixture (generated mirror — không phải code logic)
- **Reporter:** YUNIE / full-suite run ("check lại hết")
- **Related KN:** KN-002 (single source of truth — regenerate, không sửa tay) · KN-049 (đo phải chính — drafts đếm đúng nhưng mirror cũ)
- **Tags:** `data` `dx` `verify`
- **Guard:** `tests/e2e/status-sections.spec.ts` (health card — spec hiện có bắt đúng) + `status-audit.spec.ts`
- **Status:** fixed

---

## 1. Reproduce

### Steps
1. Lúc `www/status.json` được generate (commit `185f536`, ~16:35): `drafts = 1` (còn 1 bug draft chưa finalize) → health `status: 'warn'`.
2. Sau đó các bug draft được finalize (drafts 1→0) nhưng mirror **không được regen**.
3. Chạy full suite: `status-sections.spec.ts` → `#healthCard` không chứa 'Hệ thống ổn định' (app.js chỉ render câu đó khi `h.status==='ok'`) → FAIL (197 passed / 1 failed).

### Expected vs Actual
- **Expected:** Mirror phản ánh state thật — `drafts=0` → `health.status='ok'` → health card render 'Hệ thống ổn định'.
- **Actual:** Mirror stale (`1 drafts`, `warn`) trong khi `auto-learn status --json` thật = `drafts: 0`.

### Evidence
- Log / screenshot / test fail / video:
```
- Full suite: 1 failed — status-sections.spec.ts:52 'health card: status text + nút copy JSON'
- node auto-learn status --json → { drafts: 0, bugsTotal: 46 }
- www/status.json (truoc regen): health.status = 'warn'; checks: 'auto-learn: 65 KN, 46 bugs, 1 drafts'
- Sau `node .github/harness/scripts/generate-status.mjs`: health.status = 'ok'; '0 drafts'; 14/14 spec STATUS pass
```

### Environment
- Branch: `main`
- Commit: `eb8fe05` (trước fix)
- OS/Browser: Windows / chromium

---

## 2. Root Cause (5 Whys)

- **File:Line:** `www/status.json` (generated — `.github/harness/scripts/generate-status.mjs:334` `status: learnStats.drafts > 0 ? 'warn' : 'ok'`)
- **Why 1:** Mirror generate lúc `drafts=1`; sau khi drafts→0 không ai regen.
- **Why 2:** Không lịch/bước tự động nào regen sau khi bug status đổi — regen là thao tác thủ công (`cosmos:refresh` / routine tuần).
- **Why 3:** Suite chỉ đỏ khi ai đó chạy full suite → phát hiện muộn (giữa 2 lần regen).
- **Why 4:** Health check dựa trên SỐ LIỆU TẠI THỜI ĐIỂM GENERATE — dữ liệu vào đúng (drafts=0) nhưng ảnh chụp cũ.
- **Why 5 (Root):** Generated mirror là dẫn xuất — phải regen theo state change (KN-002); có spec bắt (status-sections) nhưng trigger regen chưa tự động.

- **Impact:** 1 spec đỏ trong full suite (health card) — không ảnh hưởng chức năng, ảnh hưởng độ tin suite.
- **Hypothesis:** Regen mirror → health ok → spec xanh; confirmed.
- **Confidence:** `HIGH` (RAW: drafts 0 vs mirror 1; sau regen 14/14 pass)

> Nếu bug chạm pattern trong `docs/knowleged.md` → ghi `Related KN: KN-XXX` và áp dụng **Cách phòng tránh** ngay.
> **Root Cause Gate:** Nếu uncertain → investigate / escalate, không tự biến hypothesis thành sự thật.

---

## 3. Fix

- **Approach:** Regen mirror bằng đúng tool chuẩn (`generate-status.mjs` — không sửa tay, KN-002). Ghi nhận trigger regen chưa tự động = hướng mở (routine tuần đã có `cosmos:refresh`).
- **Files Changed:**
  - `www/status.json` — regen (health warn → ok, drafts 1 → 0)
  - `www/cosmos/audit.json` — regen kèm (generate-status side-output)
- **Diff tóm tắt:**
```diff
// before
- health.status: 'warn' · 'auto-learn: 65 KN, 46 bugs, 1 drafts'
// after
+ health.status: 'ok' · 'auto-learn: 65 KN, 46 bugs, 0 drafts'
```
- **Non-Goals:** Không sửa generate-status; không thêm auto-regen hook (hướng mở — routine tuần đã cover; thêm nữa = YAGNI khi spec đã bắt).
- **Fix Confidence:** `HIGH` — spec đỏ → regen → xanh, không đổi logic.
- **get_errors:** Sau mỗi edit → affected files; full scope ở Phase 4 Verify.

---

## 4. Verification

- [x] Re-run steps reproduce → Fixed: `health.status='ok'`, status-sections pass
- [x] Edge cases:
  - [x] case 1: status.spec.ts + status-audit.spec.ts → pass (14/14 tổng 3 spec)
  - [x] case 2: full suite sau fix → all pass
- [x] Regression: các spec STATUS liên quan pass
- [x] `get_errors` **toàn scope** → 0 errors
- [x] `slop-check` — N/A (mirror generated, không tính)
- [x] UI audit: N/A (dữ liệu — spec render là lưới)
- [x] Fresh-eyes tier: `OPTIONAL` (deterministic: mirror regen)

**Kết quả:**
```
- status-sections + status + status-audit: 14 passed
- health sau regen: ok · drafts 0
```

---

## 5. Lesson (1 câu)

> Bài học rút ra, 1 câu súc tích — sẽ copy vào `docs/knowleged.md` Bảng tóm tắt.

Generated mirror không tự cập nhật theo state — regen sau mỗi lần state change (bug status/drafts) hoặc suite sẽ đỏ giữa 2 lần regen (họ KN-002, không tạo KN mới).

---

## 6. Prevention

- **Cách phòng tránh lần sau:**
  - [x] Sau khi finalize bug draft / đổi state → regen mirror (`node .github/harness/scripts/generate-status.mjs` hoặc `npm run cosmos:refresh`)
  - [x] Full suite là lưới phát hiện (status-sections) — chạy trước commit lớn
- **Guard (lưới chống tái lập — KN-056):**
  - [x] Guard = spec hiện có `status-sections.spec.ts` (không cần thêm — đã bắt đúng lần này)
  - [x] RADAR nghi KN-002 → **cùng hệ, không tái lập mới** → không tạo KN (consolidation)
- **Cần cập nhật:**
  - [x] `docs/knowleged.md` → **không** (không có bài học mới — họ KN-002)
  - [ ] `product-quality.instructions.md` — không cần
  - [x] Test mới: không (spec hiện có đã bắt)

---

## References

- `docs/knowleged.md#KN-002` (cùng hệ — mirror regenerate)
- Bug discover: full suite run 14/09 ("check lại hết" — KN-066 session)
- Commit fix: `77fd494` (regen www/status.json + www/cosmos/audit.json; verify full suite 198/198)

---
*Template: `.agent/bugs/_template/bug.md` — dùng bởi `/fixbug` Phase 1 & 5.*
