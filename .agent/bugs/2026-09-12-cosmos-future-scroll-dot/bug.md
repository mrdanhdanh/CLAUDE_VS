# Bug: Cosmos — scroll-dot "Tương lai" chết (section thiếu `id="future"`)

> Copy từ `_template/bug.md` — upgrade 2026-09-12 (Lab #12 QEC). Bug tìm thấy khi đọc code phần nav (không phải user report).

## Meta

- **Slug:** `2026-09-12-cosmos-future-scroll-dot`
- **Ngày:** 2026-09-12
- **Severity:** `major`
- **Reporter:** YUNIE (audit khi thêm Lab #12 — đọc `data-target` vs `id` trong `index.html`)
- **Related KN:** `KN-046`
- **Tags:** `ui` `a11y` `verify` `nav` `fail-silent`
- **Status:** `fixed`

---

## 1. Reproduce

### Steps
1. Mở `http://localhost:3000/cosmos/index.html` ở viewport ≥1100px (scroll-dots hiện ở cột phải).
2. Bấm dot cuối — `aria-label="Tương lai"`.
3. So `data-target` của 9 dot với `id` thật trong DOM:
   `[...document.querySelectorAll('.scroll-dot')].map(d=>d.dataset.target).filter(id=>!document.getElementById(id))`
4. Cuộn xuống section cuối — xem dot nào được set `.active`.

### Expected vs Actual
- **Expected:** Bấm dot "Tương lai" → nhảy tới section `Khai thác tương lai`; khi đang ở section đó, dot cuối sáng `.active`.
- **Actual:** Bấm **không có gì xảy ra**; cuộn hết trang **không có dot nào active** ở nhóm cuối — 9 dot nhưng chỉ 8 section được track.

### Evidence
```
DOM: 9 .scroll-dot (hero…future) · section[id]: 8 (hero, phil, pipeline, map, calendar, lab, observatory, integration)
missing targets: ["future"]
JS: const el = document.getElementById(d.dataset.target); if (el) el.scrollIntoView(...)   // fail-silent
    const sections = [...9 ids].map(id => document.getElementById(id)).filter(Boolean);     // future bị bỏ
RED: tests/e2e/cosmos-lab12-qec.spec.ts — "scroll-dot 'Tương lai' — section phải có id='future'" fail (missing=["future"])
GREEN sau fix: pass · full suite (cosmos) pass
```

### Environment
- Branch: `main` · Windows / Chromium (Playwright 1.62) + `npx serve www`

---

## 2. Root Cause (5 Whys)

- **File:Line:** `www/cosmos/index.html` — `<section class="section reveal" aria-labelledby="future-title">` (thiếu `id`), JS `getElementById` tại khối "Scroll progress + Reveal + Dots"
- **Why 1:** Dot không nhảy — vì `getElementById('future')` trả `null`.
- **Why 2:** `null` — vì section "Khai thác tương lai" được thêm sau (commit 125ffc5) mà **không có `id="future"`** dù nav đã có `data-target="future"`.
- **Why 3:** Không ai phát hiện — vì cả 2 chỗ dùng `if (el)` và `.filter(Boolean)` → **fail-silent**, không throw, không pageerror (khác KN-032: lỗi async im lặng; đây là guard im lặng).
- **Why 4:** Test không bắt — vì spec cũ assert **nội dung section** (`.future-card` count, text, ETA) qua `aria-labelledby`, **không** assert "mọi điều hướng phải resolve" (36 test xanh vẫn lọt).
- **Why 5 (Root):** Điều hướng viết bằng **2 nguồn song song** (`data-target` trong nav + `id` trong DOM) và danh sách id hardcode trong JS, không có invariant nào buộc 2 nguồn khớp nhau → thêm section mới là có thể tạo control chết.

- **Impact:** 1/9 điều hướng nhanh chết vĩnh viễn + mất highlight section cuối; user tưởng trang hết nội dung. Cùng class với KN-011 (nút chết sau reset) — "control không làm gì và không nói gì".
- **Hypothesis:** ✅ verified trước khi sửa (DOM scan: `missing=["future"]`).
- **Confidence:** `HIGH` — RED → fix (`id="future"`) → GREEN + invariant mới (missing targets = ∅, click dot → section top < 300px).

---

## 3. Fix

- Thêm `id="future"` cho section + comment nêu lý do (nav + observer đều dùng `getElementById`).
- Thêm spec `tests/e2e/cosmos-lab12-qec.spec.ts`:
  - `.scroll-dot` = 9 và **mọi** `data-target` phải resolve trong DOM (`missing = []`).
  - Click dot "Tương lai" → `#future` vào viewport (`top < 300`).
- Sync nhân dịp này: copy "11 thí nghiệm" → "12 thí nghiệm" (Lab #12), roadmap (QEC đã ship → thay bằng Light Echo), slide 15, STATUS page "4 lab tương tác" → 12.

---

## 4. Verify

- [x] `missing targets` = ∅ (9/9 dot resolve) — assert trong spec mới.
- [x] Click dot "Tương lai" → `#future` top < 300px (poll, timeout 5s).
- [x] Không pageerror / console error sau mọi tương tác (KN-032).
- [x] Full cosmos suite xanh (lab #12 spec + rework/freshness/future/slides/intro/observatory).
- [x] 375px: lab card visible, không tràn ngang.

---

## 5. Lesson → `docs/knowleged.md` KN-046

- Điều hướng `data-target`/`href="#id"` + JS dùng `getElementById` bọc `if (el)` = **fail-silent** → thêm test invariant "mọi target resolve", không chỉ test nội dung đích.
- Danh sách id cho nav/observer nên **derive từ DOM** (`document.querySelectorAll('.scroll-dot')`) thay vì hardcode mảng id — 2 nguồn song song là nguồn drift.
- Thêm section mới → checklist: `id` + nav entry + observer + test invariant.
