> 🤖 Auto-log bởi auto-learn.mjs — 2026-09-10T16:23:51.171Z
> **Error:** `Edge PC khong thay hieu ung intro (phone thay duoc): Windows Animation effects tat -> prefers-reduced-motion=reduce -> ban rut gon cu (opacity:1 important + animation:none) hien static 1.8s roi mo - user tuong 'khong co hieu ung'. Dung Edge that (playwright channel msedge) do duoc: default=full effect 317k pixels, reduced=static. Fix: ban reduced co nhip fade opacity-only + hint giai thich + defer start khi tab an + grace 1000ms`
> **File:** `www/cosmos/index.html`
> **Title:** edge-pc-khong-thay-hieu-ung-intro-reduced-motion

# Bug: edge-pc-khong-thay-hieu-ung-intro-reduced-motion

## Meta

- **Slug:** `2026-09-10-edge-pc-khong-thay-hieu-ung-intro-reduced-motion`
- **Ngày:** 2026-09-10
- **Severity:** `major`
- **Reporter:** sếp ("ở trên điện thoại tôi có thể coi được, nhưng trên Edge PC thì tôi không coi được hiệu ứng")
- **Related KN:** `KN-031`
- **Tags:** `ui` `a11y` `reduced-motion` `edge` `verify`
- **Status:** `fixed`

---

## 1. Reproduce

### Steps
1. PC Windows có **Settings → Accessibility → Visual effects → Animation effects = OFF** (phổ biến trên máy "debloat"/tiết kiệm pin).
2. Mở `www/cosmos/index.html` trên Edge PC → intro chỉ hiện chữ **static cái rụp** ~1.8s rồi mở — không fade, không particle, không gì chuyển động.
3. Cùng URL trên điện thoại (animation bật) → full hiệu ứng Big Bang.

### Expected vs Actual
- **Expected:** Intro cinematic đầy đủ, hoặc tối thiểu trải nghiệm có nhịp rõ ràng.
- **Actual:** Bản reduced-motion cũ (`opacity:1 !important; animation:none` cho mọi phần tử) render **static hoàn toàn** — user mô tả đúng: "không coi được hiệu ứng". Cộng 2 issue tiềm ẩn: (a) intro chạy khi tab ở background → user switch về thì đã hết; (b) grace 600ms quá ngắn — click focus cửa sổ trên PC có thể vô tình skip.

### Evidence
- Playwright `channel: 'msedge'` (Edge thật):
  - Default Edge: `painted pixels = 317,456` — intro full ✅
  - Edge + `reducedMotion:'reduce'`: `edge-reduced-1s.png` (trước fix) = static text, tự mở sau ~2.3s.

### Environment
- Windows 10/11 + Microsoft Edge; cùng URL chạy tốt trên mobile.

---

## 2. Root Cause (5 Whys)

- **File:Line:** `www/cosmos/index.html` — nhánh `prefers-reduced-motion` (CSS + JS `TOTAL = 1800`).
- **Why 1:** Trên Edge PC intro gần như không có hiệu ứng.
- **Why 2:** Windows tắt "Animation effects" → Edge báo `prefers-reduced-motion: reduce`.
- **Why 3:** Nhánh reduced cũ strip **mọi** animation/transition (kể cả fade opacity vô hại) → static pop-in.
- **Why 4:** Không phân biệt "chuyển động nguy hiểm cho tiền đình" (translate/scale/parallax) với "fade opacity an toàn" — cắt tất cả = mất hết trải nghiệm.
- **Why 5 (Root):** Không test trên **đúng môi trường user** (Edge thật + reduced-motion) → bản reduced "trông như không có hiệu ứng"; user không được thông báo vì sao.

- **Impact:** 100% user có reduced-motion (rất phổ biến trên PC) thấy intro "trống" — tưởng trang lỗi.
- **Confidence:** `HIGH` (reproduced on real Edge; fix verified 11/11 tests + screenshots).

---

## 3. Fix

- **Approach:**
  1. **Bản reduced "calm cinematic":** chỉ opacity (an toàn tiền đình) — title chars fade stagger, underline/sub/tagline/hint fade nhịp ~3.5s; giữ dot pulse opacity-only.
  2. **Hint giải thích:** khi reduced bật, hint đổi thành "Chế độ giảm chuyển động đang bật → bản nhẹ · Bật Animation effects trong Windows để xem đầy đủ" + `console.info` diagnostic.
  3. **Defer start khi tab ẩn:** timeline (.play + canvas t0 + auto-finish) chỉ bắt đầu khi tab visible — không "chạy vô hình" ở tab nền.
  4. **Grace 600→1000ms:** chống click focus cửa sổ PC vô tình skip.
  5. **Head fail-safe đổi sang `window.__introEngine`:** engine sống → tự quản việc mở (hỗ trợ defer); script bị chặn → auto-mở sau 9s.
- **Files Changed:**
  - `www/cosmos/index.html` — CSS reduced mới + kickoff `start()` + visibility defer + hint + grace
  - `tests/e2e/cosmos-intro-edge.spec.ts` — spec mới trên Edge thật (default + reduced, pixel poll)
  - `tests/e2e/cosmos-intro.spec.ts` — cập nhật timing + assert hint
- **Diff tóm tắt:**
```diff
- const TOTAL = reduced ? 1800 : 5000;
+ const TOTAL = reduced ? 3500 : 5000;
- @media(prefers-reduced-motion:reduce){ ...opacity:1 !important; animation:none !important }
+ @media(...){ giữ opacity-only fades (introCalmFade), bỏ mọi transform/particle }
+ function start(){ ...t0 + fail-safe + .play... }  // defer tới khi tab visible
+ if(document.hidden) document.addEventListener('visibilitychange', onVisible); else start();
+ if(performance.now() - startedAt < 1000) return;   // grace 1000ms
```
- **Non-Goals:** Không bỏ reduced-motion support (a11y), không thêm replay button.
- **Fix Confidence:** `HIGH`
- **get_errors:** sạch (chỉ còn warning inline-style có sẵn của trang)

---

## 4. Verification

- **Reproduce again:** Edge thật + reduced — có chuỗi fade rõ nhịp + hint giải thích (`edge-reduced-1s.png`, `edge-reduced-2.4s.png`).
- **Edge default:** intro full — `painted pixels = 317,456`, 0 lỗi console.
- **Regression:** `npx playwright test cosmos-intro.spec.ts cosmos-intro-edge.spec.ts` → **11/11 pass**.
- **Assert mới:** hint chứa /giảm chuyển động/i khi reduced; pixel poll thay wall-clock (chống flaky cold-start Edge).

**Kết quả:**
```
11 passed (20.1s)
[EDGE] prefers-reduced-motion = false · canvas 1280x720 · painted pixels = 317456
[EDGE-reduced] intro tự mở ~3.9s từ lúc load (calm fade + hint)
```

---

## 5. Lesson (1 câu)

> Reduced-motion ≠ xóa sạch animation — chỉ cắt chuyển động nguy hiểm (translate/scale/parallax); fade opacity an toàn và giữ trải nghiệm. "Không thấy hiệu ứng" phải đo trên đúng môi trường user (Edge thật + reduced-motion).

---

## 6. Prevention

- **Cách phòng tránh lần sau:**
  - [ ] Bản reduced-motion vẫn phải "có nhịp" (opacity-only) + nói rõ lý do cho user nếu bản bị rút gọn
  - [ ] Timeline/animation của overlay phải defer khi `document.hidden` — không chạy vô hình
  - [ ] Test animation bằng poll (state-based), không wall-clock fixed; chạy trên cả Edge thật (`channel: 'msedge'`)
  - [ ] Thêm checklist vào `docs/knowleged.md` Anti-patterns / Checklist phòng tránh chung
- **Cần cập nhật:**
  - [x] `docs/knowleged.md` → `KN-031` (Bảng tóm tắt + Chi tiết)
  - [x] Test mới: `tests/e2e/cosmos-intro-edge.spec.ts`

---

## References

- `docs/knowleged.md#KN-031`
- Commit fix: `2057adc` (pushed 2026-09-10)
- Evidence: `.agent/plans/cosmos-intro/verify/edge-*.png`

---
*Điền bởi YUNIE / fixbug — 2026-09-10.*
