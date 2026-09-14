> 🤖 Auto-log bởi auto-learn.mjs — 2026-09-14T16:26:20.827Z
> **Error:** `KN ID double-yield: 3 phien song song cung nhan 1 ID (KN-061 Routing/Memora/Echoverse) - 2 phien cung yield (cung nhan KN-062) - cascading renumber 061->062->063; file co luc chua 2 khoi cung ID ma khong may nao bat; findNextKnId read-then-write khong collision-check + khong detector integrity sau paste`
> **File:** `docs/knowleged.md`
> **Title:** KN ID double-yield - da phien cung nhan 1 ID, thieu detector

> 🔁 **RADAR TÁI LẬP** — đối chiếu KN + bug cũ thấy nghi vấn:
> - 🔁 NGHI TÁI LẬP **[KN-060]** (score 177.6): SkillOpt: sửa skill/KN không qua validation gate — edit trôi, rejected edits không thành negative feedback
> - 🔁 NGHI TÁI LẬP **[KN-062]** (score 130.5): Memora: tách "lưu gì" khỏi "lấy thế nào" — gộp thay vì phân mảnh, retrieval có stop condition
> - 🔁 NGHI TÁI LẬP **[KN-046]** (score 130.4): Cosmos: scroll-dot "Tương lai" chết (section thiếu `id`) — điều hướng fail-silent
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-12-cmb-shorthand-false-zeroref`** (score 171.4): CMB zeroRef false positive — detector bỏ qua shorthand + bug.md giữ link KN sai
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-14-memora-memory-tach-luu-gi-khoi-lay-the-nao`** (score 159.9): Memora — memory: tách lưu gì khỏi lấy thế nào — fragment thay vì gộp, thiếu stop
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-14-skill-kn-sua-khong-qua-eval-gate-bi-troi-am-tham`** (score 154.8): SkillOpt — thiếu validation gate cho skill/KN: edit trôi, rejected edits không t
> → Đọc **Cách phòng tránh** trong `docs/knowleged.md` TRƯỚC khi fix. Nếu là tái lập thật: ghi rõ "tái lập của KN-060" + **vì sao lưới cũ không bắt được** → nâng lưới (Guard) rồi mới fix.
# Bug: KN ID double-yield — 3 phiên song song cùng nhận 1 ID, thiếu detector integrity

> Incident thật 14/09 (không phải article-lesson). RADAR nghi KN-060/KN-062 — **liên quan, không tái lập** (khác chủ đề: edit gate/memory shape vs ID allocation). Retrofit: KN-063 re-ID 061→063 xong TRƯỚC khi guard này tồn tại; số cuối = **KN-066** (064/065 bị 2 phiên khác lấy live trong lúc build guard — xem Reproduce bước 4).

## Meta

- **Slug:** `2026-09-14-kn-id-double-yield-da-phien-cung-1-id`
- **Ngày:** 2026-09-14
- **Severity:** major
- **Layer:** process (cấp phát ID + thiếu detector integrity — không phải lỗi code)
- **Reporter:** YUNIE / incident (phiên Routing)
- **Related KN:** KN-066 (chính) · KN-056 (guard family) · KN-053 (file concurrent) · KN-062/KN-063 (2 KN nằm trong vụ collide)
- **Tags:** `process` `knowledge` `dx` `concurrency`
- **Guard:** `tests/e2e/kn-id-integrity.spec.ts` — dup 2 danh sách + orphan + order + 5 negative control (assert động)
- **Status:** fixed

---

## 1. Reproduce

### Steps
1. 3 phiên song song chạy `findNextKnId` (auto-learn.mjs) trên cùng trạng thái `knowleged.md` (max khi đó = KN-060) → cả 3 cùng nhận **KN-061**.
2. Mỗi phiên paste độc lập, không re-check ngay trước khi ghi → 2 phiên cùng yield: Routing 061→062, Memora 061→062 → **double-yield — cả hai cùng KN-062**.
3. Routing yield tiếp → KN-063; cascading renumber + sửa refs nhiều vòng; file có lúc chứa 2 khối `### KN-061` rồi 2 khối `### KN-062` — **không test nào FAIL** (parser không dedupe → status/suggest/guards đếm lệch im lặng).
4. **Tái diễn live khi build guard (cùng ngày):** spec đang viết thì Echoverse lấy KN-064 + Orchard lấy KN-065 → số cuối phải nhảy 061→062→063→**066**; spec ban đầu hardcode "063" trong negative control → đỏ giả → sửa thành assert động (bằng chứng race đang diễn ra).

### Expected vs Actual
- **Expected:** ID cấp phát không trùng giữa các phiên; nếu trùng, có máy (test/check) phát hiện ngay sau paste; file integrity được khoá bởi spec.
- **Actual:** Không collision-check ở `findNextKnId`; không detector sau paste; phát hiện muộn bởi người → renumber + update refs churn 3 vòng.

### Evidence
- Log / screenshot / test fail / video:
```
- RADAR lúc log: KN-060 (177.6), KN-062 (130.5), bug cũ cmb-shorthand (171.4) — liên quan, không tái lập.
- Renumber notes: `.agent/bugs/2026-09-14-routing-failover.../bug.md` + `.agent/bugs/2026-09-14-memora.../bug.md` + `.agent/plans/echoverse-adopt/proposal.md` §0.
- Inventory 14/09 (node regex trên file thật): trước fix `detOrderBad: ["KN-063->KN-062"]`; sau khi 064/065 paste: `rows: 64 det: 64, dup: [], orphan: []` — chỉ còn order + bảng gãy blank.
- RED thật của spec mới: `baseline FAIL — chi tiết sai thứ tự: KN-063 → KN-062` (spec bắt đúng lỗi tồn tại trước khi fix).
```

### Environment
- Branch: `main`
- Commit: `3aa2a31` (trước fix)
- OS/Browser: Windows / Node (incident môi trường file-based — đa phiên song song)

---

## 2. Root Cause (5 Whys)

- **File:Line:** `.github/harness/scripts/auto-learn.mjs` (`findNextKnId` max+1 — read-then-write) + `docs/knowleged.md` (không spec nào assert integrity)
- **Why 1:** `findNextKnId` = read-then-write không collision-check.
- **Why 2:** Cửa sổ race propose→paste giữa các phiên không máy nào bắt (3 phiên đọc cùng state).
- **Why 3:** Không detector sau paste — integrity `knowleged.md` không thuộc spec nào.
- **Why 4:** Phát hiện muộn bởi người → renumber tay + sửa refs = churn 3 vòng + gap 061.
- **Why 5 (Root):** Quy trình cấp ID giả định single-writer trong khi thực tế multi-session concurrent; "re-check trước paste" mới là văn xuôi (anti-pattern), chưa có lưới.

- **Impact:** Toàn bộ tầng tri thức (65 KN) — trùng ID làm status/suggest/guards đếm lệch im lặng; renumber churn; ảnh hưởng mọi phiên đang chạy song song.
- **Hypothesis:** Spec integrity + protocol re-check; không đổi `findNextKnId` (bounded) — verify: spec RED→GREEN + tái diễn live được bắt bằng assert động.
- **Confidence:** `HIGH` (đo được: inventory trước/sau fix; RED→GREEN; tái diễn live xử lý trong cùng ngày)

> Nếu bug chạm pattern trong `docs/knowleged.md` → ghi `Related KN: KN-XXX` và áp dụng **Cách phòng tránh** ngay.
> **Root Cause Gate:** Nếu uncertain → investigate / escalate, không tự biến hypothesis thành sự thật.

---

## 3. Fix

- **Approach:** Đóng lỗ hổng ở tầng máy + protocol (không đụng `findNextKnId` — bounded):
  (1) spec mới `kn-id-integrity.spec.ts` khoá 4 invariant + 5 negative control (assert động);
  (2) sửa order chi tiết KN-062↔KN-063 khớp bảng + nối lại bảng gãy blank (064/065 paste sau);
  (3) protocol re-check ID trước paste / chạy spec sau paste; gap 061 không cấp lại.
- **Files Changed:**
  - `tests/e2e/kn-id-integrity.spec.ts` — MỚI: dup/orphan/order + negative control
  - `docs/knowleged.md` — KN-066 + swap order + nối bảng + anti-pattern + checklist + footer
  - `.agent/plans/echoverse-adopt/proposal.md` — note điều phối (untracked — chủ phiên Echoverse commit)
- **Diff tóm tắt:**
```diff
// before
- không spec nào khoá integrity ID; det order sai (063 trước 062); bảng gãy blank
// after
- spec kn-id-integrity.spec.ts (6 test) + protocol; file sạch dup/orphan/order
```
- **Non-Goals:** Không sửa `findNextKnId`; không renumber lại ai; không wire status warning (auto-learn.mjs vừa có WIP session khác — ghi hướng mở trong KN-066).
- **Fix Confidence:** `HIGH` — guard fail-closed, đã chứng minh RED→GREEN + bắt tái diễn live.
- **get_errors:** Sau mỗi edit → affected files; full scope ở Phase 4 Verify.

---

## 4. Verification

- [x] Re-run steps reproduce → Fixed: inventory sau fix `dup: [] · orphan: [] · order: []`
- [x] Edge cases:
  - [x] case 1: mutant dup row/dup detail → FAIL đúng chỗ
  - [x] case 2: mutant orphan row/detail → FAIL; đảo order (điền gap 061) → FAIL với assert ĐỘNG (đã bắt được lúc 064/065 đang được paste — race thật)
- [x] Regression: `kn-id-integrity` 6/6 · `auto-learn-guard` (spec session khác) không hồi quy
- [x] `get_errors` **toàn scope** → 0 errors (Phase 3 chỉ check affected files)
- [x] `slop-check tests/e2e/kn-id-integrity.spec.ts` → ✅ Clean
- [x] UI audit (nếu là bug UI): N/A
- [x] Fresh-eyes tier: `RECOMMENDED` (process/knowledge — RADAR + guards + negative control là lớp kiểm bổ sung)

**Kết quả:**
```
- RED thật: baseline FAIL "chi tiết sai thứ tự: KN-063 → KN-062" (spec bắt đúng lỗi tồn tại TRƯỚC khi fix)
- GREEN: 6 passed
- guards: ✅ KN-066 → tests/e2e/kn-id-integrity.spec.ts
- status: KN: 65 · list …060, 062–066 · không trùng ID
- Commit: <điền ở commit kế tiếp>
```

---

## 5. Lesson (1 câu)

> Bài học rút ra, 1 câu súc tích — sẽ copy vào `docs/knowleged.md` Bảng tóm tắt.

ID cấp phát phải re-check ngay trước khi ghi (race propose→paste) và có detector máy chạy ngay sau paste (dup/orphan/order) — knowledge integrity không có lưới = double-yield tái diễn mỗi khi đa phiên song song.

---

## 6. Prevention

- **Cách phòng tránh lần sau:**
  - [x] Trước paste: `findNextKnId` + grep `### KN-0XX` / `| KN-0XX |` (ngay trước khi ghi)
  - [x] Sau paste: chạy `npx playwright test tests/e2e/kn-id-integrity.spec.ts` trước commit
  - [x] Anti-pattern + checklist đã cập nhật `docs/knowleged.md`
- **Guard (lưới chống tái lập — KN-056):**
  - [x] Meta Guard = `tests/e2e/kn-id-integrity.spec.ts`
  - [x] RADAR nghi KN-060/KN-062 → ghi rõ "liên quan, không tái lập" + vì sao lưới cũ không bắt được (không có spec nào chạm integrity file)
- **Cần cập nhật:**
  - [x] `docs/knowleged.md` → `KN-066` (Bảng tóm tắt + Chi tiết + Anti-patterns + Checklist + UpdatedAt)
  - [ ] `product-quality.instructions.md` — không cần (không phải chuẩn UI)
  - [x] Test mới: `tests/e2e/kn-id-integrity.spec.ts`

---

## References

- `docs/knowleged.md#KN-066`
- Trace: `.agent/bugs/2026-09-14-routing-failover.../` + `.agent/bugs/2026-09-14-memora.../` (renumber notes) + `.agent/plans/echoverse-adopt/proposal.md` §0
- Commit fix: `<điền ở commit kế tiếp>`

---
*Template: `.agent/bugs/_template/bug.md` — dùng bởi `/fixbug` Phase 1 & 5.*
