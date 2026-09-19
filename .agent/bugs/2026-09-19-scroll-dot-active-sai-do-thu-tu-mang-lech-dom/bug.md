> 🤖 Auto-log bởi auto-learn.mjs — 2026-09-19T06:29:06.924Z
> **Error:** `active-dot sáng sai: đang đọc #map/#calendar nhưng dot #lab sáng — sections array xếp map/calendar trước lab trong khi DOM xếp lab trước; logic last-wins phụ thuộc thứ tự mảng`
> **File:** `www/cosmos/index.html`
> **Title:** scroll-dot active sai do thứ tự mảng lệch DOM

> 🔁 **RADAR TÁI LẬP** — đối chiếu KN + bug cũ thấy nghi vấn:
> - 🔁 NGHI TÁI LẬP **[KN-046]** (score 159.6): Cosmos: scroll-dot "Tương lai" chết (section thiếu `id`) — điều hướng fail-silent
> - 🔁 NGHI TÁI LẬP **[KN-008]** (score 142.9): dotnet build fail MSB3027/MSB3021 do file lock — N5Blazor.exe đang chạy
> - 🔁 NGHI TÁI LẬP **[KN-037]** (score 102.9): Evals Gap — "single biggest predictor" là evals discipline (Andrew Ng, Agentic AI Playbook 2026)
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-12-cosmos-future-scroll-dot`** (score 198.7): Cosmos — scroll-dot "Tương lai" chết (section thiếu `id="future"`)
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-08-30-dotnet-build-fail-do-file-lock-n5blazor-exe-ang-ch`** (score 114.3): dotnet build fail do file lock N5Blazor.exe đang chạy
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-12-cosmos-reveal-hover-relative-url`** (score 72.3): 2026-09-12-cosmos-reveal-hover-relative-url
> → Đọc **Cách phòng tránh** trong `docs/knowleged.md` TRƯỚC khi fix. Nếu là tái lập thật: ghi rõ "tái lập của KN-046" + **vì sao lưới cũ không bắt được** → nâng lưới (Guard) rồi mới fix.
# Bug: scroll-dot active sai do thứ tự mảng lệch DOM

> Phát hiện bởi YUNIE khi review toàn diện trang cosmos theo yêu cầu user ("kiểm tra lại nội dung, source code") — không phải từ test fail.

## Meta

- **Slug:** `2026-09-19-scroll-dot-active-sai-do-thu-tu-mang-lech-dom`
- **Ngày:** 2026-09-19
- **Severity:** `minor` (điều hướng vẫn click được — chỉ indicator sáng sai; nhưng là điều hướng fail-**misleading**, cùng họ KN-046)
- **Layer:** `code`
- **Reporter:** YUNIE
- **Related KN:** `KN-046` — biến thể: cùng component scroll-dots, KHÁC failure mode (KN-046 = dot chết do thiếu `id`; case này = target resolve đủ nhưng active-state sai)
- **Tags:** `ui` `cosmos` `nav` `state`
- **Guard:** `tests/e2e/cosmos-lab12-qec.spec.ts` — test "scroll-dot active-state" (shipped 2026-09-19, sếp duyệt `intent=takeover`; mutation-proof: fail trên code cũ đúng `Expected "map" → Received "lab"`, pass sau fix)
- **Status:** `fixed` — production code đã fix + verify 0/9 sai; guard đã ship + mutation-proof; **KN-073 đã paste** vào `docs/knowleged.md` (2026-09-19, sau duyệt + evaluate PASS)

---

## 1. Reproduce

### Steps
1. Mở `www/cosmos/index.html` (1280×900), bỏ qua intro (Esc)
2. Scroll tới giữa section `#map` (Bản đồ thiên hà) — xem dot nào sáng ở nav phải
3. Scroll tới giữa section `#calendar` (Lịch vũ trụ) — xem dot nào sáng ở nav phải

### Expected vs Actual
- **Expected:** đang đọc section nào → dot `data-target` của section đó sáng
- **Actual:** `#map` → dot `#lab` sáng; `#calendar` → dot `#lab` sáng — **2/9 section sai** (đo bằng browser thật)

### Evidence
- Log / screenshot / test fail / video:
```
< dán log — đo TRƯỚC fix (scroll instant, giữa section):
  #hero ✅  #phil ✅  #pipeline ✅  #lab ✅  #map → active=lab ❌  #calendar → active=lab ❌
  #observatory ✅  #integration ✅  #future ✅ — Tổng sai: 2/9 >
```

### Environment
- Branch: `main`
- OS/Browser: Windows · Chromium headless (Playwright)
- Script đo: `.agent/bugs/2026-09-19-scroll-dot-active-sai-do-thu-tu-mang-lech-dom/verify/verify-dots.mjs` (server `npx serve www -l 3000`)
- DOM order thật (offsetTop): hero 57 → phil 675 → pipeline 1252 → **lab 1965** → map 5361 → calendar 5970 → observatory 6459 → integration 7210 → future 7704

---

## 2. Root Cause (5 Whys)

- **File:Line:** `www/cosmos/index.html` (~line 3993 sections array + ~4045 logic active, trước fix)
- **Why 1:** Dot sáng sai vì `activeId` cuối cùng (last-wins) là `#lab` khi đang ở `#map`/`#calendar`?
- **Why 2:** Vì loop duyệt mảng `sections` theo thứ tự MẢNG `[hero, phil, pipeline, map, calendar, lab, ...]`; mỗi phần tử `offsetTop <= mid` thì ghi đè `activeId` — `#lab` đứng SAU `#map`/`#calendar` trong mảng và `lab.offsetTop (1965) <= mid` luôn đúng khi đã cuộn qua lab → ghi đè thành `lab`.
- **Why 3:** Vì logic giả định "mảng xếp theo thứ tự DOM" (phần tử sau = section dưới), nhưng thực tế mảng xếp `map, calendar` TRƯỚC `lab` còn DOM xếp `lab` TRƯỚC `map, calendar`.
- **Why 4:** Vì có 2 nguồn danh sách song song (dots DOM vs sections array trong JS) — section `lab` được mở rộng/di chuyển khi rework nhưng chỉ dots DOM được cập nhật theo thứ tự trang; đúng anti-pattern KN-046 đã cảnh báo.
- **Why 5 (Root):** **Logic order-dependent (last-wins) + 2 nguồn danh sách không nhất quán.** Fix ở gốc = (a) chọn section gần nhất phía trên bằng `max offsetTop ≤ mid` (bất biến thứ tự), (b) derive danh sách sections từ chính dots (1 nguồn duy nhất — theo đúng Cách phòng tránh KN-046), (c) reorder dots DOM = thứ tự trang.

- **Impact:** Nav dots (desktop ≥1100px) hiển thị sai vị trí hiện tại khi đọc 2/9 section; không vỡ chức năng click nhưng gây hiểu nhầm điều hướng.
- **Hypothesis:** Nghi "array thứ tự sai" → verify bằng mô phỏng tĩnh (`.agent/tmp/check-ids-dots.mjs`) rồi đo browser thật — **đã verify** (2/9 sai trước fix).
- **Confidence:** `HIGH` (proven: đo trước/sau + regression suite; sau fix 0/9 sai)

> Nếu bug chạm pattern trong `docs/knowleged.md` → ghi `Related KN: KN-XXX` và áp dụng **Cách phòng tránh** ngay.
> **Root Cause Gate:** Nếu uncertain → investigate / escalate, không tự biến hypothesis thành sự thật.

---

## 3. Fix

- **Approach:** Sửa ở gốc: logic độc lập thứ tự + 1 nguồn duy nhất (derive từ DOM — KN-046) + dots DOM theo thứ tự trang. Bounded — 1 file, không đổi click/CSS/aria.
- **Files Changed:**
  - `www/cosmos/index.html` — (1) reorder dots DOM `lab → map → calendar`; (2) `sections=dots.map(d=>getElementById(d.dataset.target)).filter(Boolean)`; (3) active logic `max offsetTop ≤ mid`; (4) thêm emoji `🌊` thiếu ở card Gravitational Waves
- **Diff tóm tắt:**
```diff
// before
// after
```
- **Non-Goals:** Không đổi hành vi click dot, aria-label, CSS nav; không gom rework sang section khác (emoji fix là 1-line riêng cùng file).
- **Fix Confidence:** `HIGH` (đo trước/sau bằng browser thật + regression suite 77 pass).
- **get_errors:** `www/cosmos/index.html` → 0 errors (checked).

---

## 4. Verification

- [x] Re-run steps reproduce → **Fixed** — đo sau fix: 9/9 section đúng dot (0 sai)
- [x] Edge cases:
  - [x] Đầu trang (scrollY=0) → hero · giữa section cao 3400px (lab) → lab
  - [x] Section sát nhau (map → calendar → observatory) → không nhảy sai
- [x] Regression: `npx playwright test cosmos` → **77 passed, 1 failed** — fail duy nhất `cosmos-dark-energy.spec.ts:61` = test pin cứng `D=0` vs data thật `D=1` (**data drift — không liên quan fix này**, kết quả giống hệt trước fix)
- [x] Follow-up 2026-09-19 (sếp duyệt): `cosmos-dark-energy.spec.ts` chuyển **data-driven** (assert `#deParts` khớp `scale.json` hiện tại thay vì pin `D=0`; invariant `D ≤ 1` vẫn do test CLI giữ) + guard active-dot added → `npx playwright test cosmos` = **79 passed (79/79, 0 failed)**
- [x] `get_errors` toàn scope → 0 errors
- [x] Runtime: 0 console error · 0 pageerror · 0 request ≥400 (index.html)
- [x] UI audit: không đổi CSS; dots vẫn 9 nút, aria-label giữ nguyên, KN-046 test cũ vẫn pass
- [x] Fresh-eyes tier: `RECOMMENDED` (regression-prone — nav logic chạm scroll)

**Kết quả:**
```
=== Đo SAU fix (browser thật, scroll instant) ===
  #hero ✅ #phil ✅ #pipeline ✅ #lab ✅ #map ✅ #calendar ✅ #observatory ✅ #integration ✅ #future ✅
Tổng sai: 0/9   (trước fix: 2/9)
npx playwright test cosmos → 79 passed, 0 failed (sau khi dark-energy test chuyển data-driven + guard added — 2026-09-19)
```

---

## 5. Lesson (1 câu)

> Bài học rút ra, 1 câu súc tích — sẽ copy vào `docs/knowleged.md` Bảng tóm tắt.

> Điều hướng có 2 loại test: "target resolve" và "active-state đúng theo vị trí scroll" — chỉ test loại 1 (KN-046) vẫn lọt lỗi sáng sai; logic tính toán ngầm định theo thứ tự duyệt là bug chờ ngày lệch, phải derive 1 nguồn hoặc tính bất biến thứ tự (max/min thay last-wins).

---

## 6. Prevention

- **Cách phòng tránh lần sau:**
  - [x] Derive danh sách nav từ DOM (1 nguồn) — đã áp dụng trong fix, đúng KN-046
  - [x] Logic "phần tử thắng" không dùng last-wins theo thứ tự duyệt — dùng tiêu chí so sánh tường minh (max offsetTop)
  - [x] Đã thêm vào Anti-patterns + Checklist `docs/knowleged.md` (2026-09-19): last-wins nav logic + test thiếu active-state (KN-073)
- **Guard (lưới chống tái lập — KN-056):**
  - [x] ✅ ĐÃ THÊM (2026-09-19, sếp duyệt — `intent=takeover`, audit `7018f1`/`d7224a`): test "scroll-dot active-state — đang đọc section nào thì dot đó sáng" trong `tests/e2e/cosmos-lab12-qec.spec.ts` — scroll tới giữa cả 9 section, assert `.scroll-dot.active` khớp từng section
  - [x] **Mutation-proof:** `git stash` index.html (về code bug) → guard FAIL đúng `dot active khi đang đọc #map — Expected "map" Received "lab"` → `git stash pop` → guard PASS (test thật sự bắt bug, không phải test trang trí)
  - [x] **Vì sao lưới cũ không bắt được:** test KN-046 chỉ assert (1) mọi dot target resolve trong DOM, (2) click dot → scroll tới đích — KHÔNG có assertion nào về active-state, nên highlight sai vẫn xanh 77 test
- **Cần cập nhật:**
  - [x] ✅ Đã paste `docs/knowleged.md` — **KN-073** (bảng tóm tắt + chi tiết + Anti-patterns + Checklist) ngày 2026-09-19 sau duyệt (evaluate PASS; dup-advisory KN-046 50.8 adjudicated giữ riêng — khác failure mode, cross-link)

---

## References

- `docs/knowleged.md` → **KN-073** (đã paste 2026-09-19) + KN-046 (biến thể liên quan)
- Bug cũ liên quan: `.agent/bugs/2026-09-12-cosmos-future-scroll-dot/`
- Fix: `www/cosmos/index.html` (working tree, chưa commit)

---
*Template: `.agent/bugs/_template/bug.md` — dùng bởi `/fixbug` Phase 1 & 5.*
