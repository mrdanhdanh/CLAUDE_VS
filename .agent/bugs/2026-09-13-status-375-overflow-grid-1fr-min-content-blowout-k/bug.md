> 🤖 Auto-log bởi auto-learn.mjs — 2026-09-13T14:45:55.393Z
> **Error:** `STATUS 375px overflow 56px — grid track 1fr (minmax auto) + nowrap title flex: min-content blowout, title dai lam lo bug tiem an; #pagesCard inner grid cung thieu minmax(0,1fr) + bi .card overflow:hidden clip`
> **File:** `www/app.js, www/styles.css`
> **Title:** STATUS 375 overflow — grid 1fr min-content blowout khi title dai

# Bug: STATUS 375 overflow — grid 1fr min-content blowout khi title dai

> Copy file này vào `.agent/bugs/2026-09-13-status-375-overflow-grid-1fr-min-content-blowout-k/bug.md` khi bắt đầu `/fixbug`.

## Meta

- **Slug:** `2026-09-13-status-375-overflow-grid-1fr-min-content-blowout`
- **Ngày:** 2026-09-13
- **Severity:** `major` (trang chính STATUS vỡ ở mobile — 2 spec fail; phần bị clip còn âm thầm hơn)
- **Reporter:** YUNIE (phát hiện trong Verify của plan `executive-function`)
- **Related KN:** `KN-055`
- **Tags:** `ui` `css` `responsive` `grid` `verify`
- **Status:** `fixed`

---

## 1. Reproduce

### Steps
1. Thêm entry trang mới vào `www/status.json` với title dài: `Executive Function × Harness (KN-054)` (demo `executive-function`).
2. Serve `www/` → mở trang chủ ở viewport 375px.
3. Đo `document.documentElement.scrollWidth - clientWidth`.

### Expected vs Actual
- **Expected:** `≤ 2px` (invariant `responsive.spec.ts` + `status.spec.ts`).
- **Actual:** **56px overflow** — 2 spec fail (`no horizontal overflow at 375`); sau khi hết scroll, phát hiện thêm page-link bị **clip bên trong card** (element rộng 414px trong doc 375px — không gây scroll nhưng cắt chữ + tag).

### Evidence
```
diagnostic (playwright evaluate @375):
{ docW: 375, scrollW: 431, roots: [ section.section (width 415), section.section (pages) ] }
ẩn #pagesCard → scrollW 375  ⇒ thủ phạm là pages card
".page-link min-content" đo được: 379px (title 'Executive Function × Harness (KN-054)' + tag 'khám phá')
Test fail: tests/e2e/responsive.spec.ts:16 + tests/e2e/status.spec.ts:69 (received 56, expected ≤2)
```

### Environment
- Branch: `main` · OS/Browser: Windows · Chromium (Playwright) headless 375×800
- Serve: `npx serve www -l 3000`

---

## 2. Root Cause (5 Whys)

- **File:Line:** `www/styles.css:381-385` (`.grid-2` / `.grid-3`) + `www/app.js` (`pageEntryHtml` / `renderPages`)
- **Why 1:** Section "Tình trạng hệ thống" + "Trang đã triển khai" rộng 415px > viewport 375 → document scroll 431px.
- **Why 2:** 2 section là grid item của `.grid-2`; track `auto` (mobile single-col) tính theo **min-content của item** = 415px (379 title chain + padding).
- **Why 3:** min-content 379 của `.page-link` = icon + gap + **toàn bộ title (`white-space:nowrap`)** + gap + tag; text là **anonymous flex item** của div `display:flex` + nowrap → không co được, `text-overflow:ellipsis` trên flex container không áp dụng cho anonymous item.
- **Why 4:** `.grid-2 { grid-template-columns: 1fr 1fr }` — `1fr` = `minmax(auto, 1fr)` → min = min-content; track **không bao giờ co dưới content**. Title cũ dài nhất ("The Waymo Effect (KN-018)" + "slide") vừa khít 343px nên bug **ẩn suốt**.
- **Why 5 (Root):** Sizing chain 3 tầng thiếu phòng thủ content dài (grid thiếu `minmax(0,1fr)` · flex item thiếu `min-width:0` · inner grid của card thiếu `minmax(0,1fr)`) — cộng lớp 2: `.card{overflow:hidden}` biến overflow thành **clip im lặng**, mà invariant responsive hiện tại chỉ đo document scroll nên **mù với clip**.

- **Impact:** Trang chủ STATUS (mọi user Pages) ở 375px: scroll ngang khi có title dài; và lớp bug thứ 2 — page-link bị clip phải ngay cả khi hết scroll. Bất kỳ title dài tương lai đều tái phát.
- **Hypothesis:** Grid/flex min-content sizing — verify bằng ẩn từng card (scrollW 431→375 khi ẩn `#pagesCard`) + đo min-content từng `.page-link` (379px xác nhận).
- **Confidence:** `HIGH` — root cause proven bằng đo trực tiếp + regression (roots: [] sau fix).

---

## 3. Fix

- **Approach:** Fix ở gốc sizing chain 3 tầng (không patch bằng cách rút ngắn title):
  1. **Grid track** — `.grid-2`/`.grid-3`: base `minmax(0,1fr)` + desktop `repeat(n, minmax(0,1fr))`.
  2. **Flex item co được** — `pageEntryHtml`/`renderPlans`: bọc title text vào `<span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">` (restore đúng ý đồ ellipsis ban đầu).
  3. **Inner grid** — `renderPages`: inner `display:grid` thêm `grid-template-columns:minmax(0,1fr)`.
- **Files Changed:**
  - `www/styles.css` — `.grid-2`/`.grid-3` dùng `minmax(0,1fr)` (2 dòng base + 2 dòng desktop).
  - `www/app.js` — title span fix (2 chỗ cùng pattern: pages + plans) + inner grid minmax.
- **Diff tóm tắt:**
```diff
- .grid-2{display:grid;gap:16px;margin:20px 0}
- @media(min-width:768px){.grid-2{grid-template-columns:1fr 1fr}}
- .grid-3{display:grid;gap:16px}
- @media(min-width:900px){.grid-3{grid-template-columns:repeat(3,1fr)}}
+ .grid-2{display:grid;gap:16px;margin:20px 0;grid-template-columns:minmax(0,1fr)}
+ @media(min-width:768px){.grid-2{grid-template-columns:repeat(2,minmax(0,1fr))}}
+ .grid-3{display:grid;gap:16px;grid-template-columns:minmax(0,1fr)}
+ @media(min-width:900px){.grid-3{grid-template-columns:repeat(3,minmax(0,1fr))}}
// app.js: ${icon} <span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${title}</span>
// app.js: <div style="display:grid;gap:8px;grid-template-columns:minmax(0,1fr)">${body}</div>
```
- **Non-Goals:** Không đổi title trang mới; không refactor grid khác (`.quick-grid`, `.stats`) — không nằm trong repro; không đổi `.card{overflow:hidden}` (giữ cho glass effect).
- **Fix Confidence:** `HIGH` — đo lại `roots: []`, scrollW = docW.
- **get_errors:** pass (không lỗi).

---

## 4. Verification

- **Reproduce lại:** diagnostic → `{ docW: 375, scrollW: 375, roots: [] }` (trước: scrollW 431).
- **Regression:** `responsive.spec.ts` + `status.spec.ts` (đã fail trước fix) → pass; + full suite pass (xem handoff).
- **Edge:** title dài hơn nữa → ellipsis cắt (span min-width:0), không phình; desktop 768/1280 hành vi không đổi (chỉ đổi min của track — chỉ tác dụng khi content vượt).
- **Fresh-eyes tier:** REQUIRED (UI bug) — đo bằng tool, không nhìn mắt.

---

## 5. Lesson (1 câu)

> Grid `1fr` (= `minmax(auto,1fr)`) + text nowrap là anonymous flex item → min-content blowout; title dài phơi bug ẩn, và `.card{overflow:hidden}` biến phần tràn thừa thành clip mà test scroll không thấy.

---

## 6. Prevention

- **Cách phòng tránh lần sau:**
  - [x] Grid track luôn `minmax(0,1fr)` cho container content động.
  - [x] Text nowrap + ellipsis phải nằm trên element co được (`min-width:0`) — không đặt ellipsis trên flex container có text trực tiếp.
  - [x] Verify responsive 2 lớp: document scroll **và** element-vs-container (clip trong `overflow:hidden`).
  - [x] Đã thêm vào `docs/knowleged.md` Anti-patterns (3 dòng KN-055).
- **Cần cập nhật:**
  - [x] `docs/knowleged.md` → `KN-055` (Bảng tóm tắt + Chi tiết + Anti-patterns)
  - [ ] (đề xuất) Bổ sung invariant clip-check vào `status-audit.spec.ts` trong lần chạm tới (bounded, không mở rộng scope lần này)

---

## References

- `docs/knowleged.md#KN-055`
- Plan: `.agent/plans/executive-function/` (phát hiện trong Verify)
- Screenshot fail: `test-results/status-*/test-failed-1.png`

---
*Bug doc: YUNIE · plan `executive-function` verify → fix → re-verify.*
