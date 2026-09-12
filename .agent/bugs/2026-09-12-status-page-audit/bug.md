# Bug: STATUS page audit — footer link 404 + registry placeholder descriptions + aria-labelledby sai ID

> Copy từ `_template/bug.md` — `/fixbug` 2026-09-12.

## Meta

- **Slug:** `2026-09-12-status-page-audit`
- **Ngày:** 2026-09-12
- **Severity:** `major`
- **Reporter:** @user (yêu cầu "kiểm tra thật kỹ trang STATUS có bug gì không") / YUNIE
- **Related KN:** `KN-045`
- **Tags:** `ui` `a11y` `data` `pages` `verify`
- **Status:** `fixed`

---

## 1. Reproduce

### Steps
1. `npx serve www -l 3000` → mở `http://localhost:3000/`
2. Fetch mọi link same-origin của trang (footer có `<a href="../README.md">README</a>`)
3. Xem bảng Registry — các entry `hooks/designer/plan/polish/harness/...`
4. Scan DOM: `document.querySelectorAll('[aria-labelledby]')` — so với tập ID tồn tại

### Expected vs Actual
- **Expected:** Mọi link nội bộ resolve `<400`; registry description là mô tả thật; mọi ARIA ref trỏ ID tồn tại.
- **Actual:** `/README.md` → **404**; registry hiển thị `hook hooks`, `agent designer`, `prompt harness`...; `#tab-governance`/`#tab-platform` có `aria-labelledby="governance"/"platform"` → **0 element**.

### Evidence
```
In-page fetch: [{"url":"/README.md","status":404}] + console 404
DOM scan: brokenLabelledby: ["tab-governance","tab-platform"]
Registry row: "Hook | hooks | hook hooks | đang bật"
RED run (tests/e2e/status-audit.spec.ts): 4 failed → GREEN sau fix: 4 passed
Full suite: 74 passed (70 cũ + 4 mới)
```

### Environment
- Branch: `main`
- OS/Browser: Windows / Chromium (Playwright 1.62) + serve tĩnh
- Deploy: GitHub Pages root = `www/`

---

## 2. Root Cause (5 Whys)

- **File:Line:** `www/index.html:509` (footer), `.github/harness/registry.json:326,347,354,398-426,442` (descriptions), `www/index.html` (tab panels)
- **Why 1:** Link 404 — vì `../README.md` trỏ ra ngoài root deploy.
- **Why 2:** Trỏ ra ngoài root — vì viết lúc dev serve từ repo root (repo README tồn tại trên đĩa) → "thấy chạy được".
- **Why 3:** Description rác — vì registry.json lưu placeholder sinh lúc cài (`${type} ${name}`), **không bao giờ refresh** từ frontmatter khi frontmatter đổi (loadRegistry giữ description cũ).
- **Why 4:** ARIA sai — vì panel copy value `data-tab` (`governance`) vào `aria-labelledby` trong khi button không có `id` tương ứng; thiếu test scan ARIA ref.
- **Why 5 (Root):** Verify trước đây chỉ chạy test hành vi (render/search/filter) — **không có invariants cho link toàn trang, data quality của nguồn hiển thị, và ARIA ref** → 3 lỗi lọt qua 13 test xanh (KN-037/KN-005: "chạy được" ≠ "tốt đến đâu").

- **Impact:** Trang STATUS là mặt tiền của hệ thống — link chết + description rác hiển thị công khai trên Pages; ARIA sai ảnh hưởng screen reader ở tab Governance/Platform.
- **Hypothesis:** ✅ verified bằng in-page fetch + DOM scan trước khi sửa.
- **Confidence:** `HIGH` — RED (4 fail) → fix → GREEN (4 pass) + full suite 74/74 không regression.

> Related KN cũ: KN-005 (bug blindness — link "chạy" ở dev vì serve khác môi trường), KN-030 (tài nguyên ngoài deploy root), KN-013 (registry description stale khi instruction/skill đổi).

---

## 3. Fix

- `www/index.html` footer: `../README.md` → `https://github.com/mrdanhdanh/CLAUDE_VS#readme` (`target="_blank" rel="noopener"`).
- `www/index.html` tabs: buttons thêm `id="tabbtn-governance|tabbtn-platform"` + `aria-controls="tab-*"`; panels `aria-labelledby="tabbtn-*"`.
- `.github/harness/registry.json`: refresh 9 description placeholder từ frontmatter — agents `designer/plan/polish`, prompts `harness/implement/plan/polish/product`, hook `hooks` (PostToolUse/Stop reminder).
- `www/app.js` `renderPages()`: href chỉ prefix `./` khi path không phải URL `http(s)` (hardening latent — entry http sẽ vỡ thành `./https://…`).
- Regenerate `www/status.json` bằng `generate-status.mjs`.
- **Test khóa:** `tests/e2e/status-audit.spec.ts` (L1 link resolve toàn trang, L2 no placeholder desc, L3 ARIA refs hợp lệ, L4 tab aria state).

## 4. Verify

- `npx playwright test tests/e2e/status-audit.spec.ts` → **4 passed** (RED trước đó 4 failed).
- Full suite `npx playwright test` → **74 passed** (70 cũ + 4 mới), không regression.
- `generate-status.mjs` → JSON valid; registry 54/54; learn 44 KN / 27 bugs (trước KN-045).
- Browser: 0 console error sau fix; footer link → GitHub repo.

## 5. Learn

- KN-045 — see `docs/knowleged.md`.
- Anti-patterns mới: link ra ngoài deploy root; hiển thị description raw không check placeholder; ARIA ref trỏ ID không tồn tại.
- Maintenance chain đã chạy: distill-agnostic → export-claude → generate-status → README counts.
