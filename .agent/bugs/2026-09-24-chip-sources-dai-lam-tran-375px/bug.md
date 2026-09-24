# Bug: nhãn `sources[0]` dài làm trang ai-news tràn ngang 375px

## Meta

- **Slug:** `2026-09-24-chip-sources-dai-lam-tran-375px`
- **Ngày:** 2026-09-24
- **Severity:** `minor` (không mất chức năng; layout vỡ 56px ở mobile — bị lưới sẵn có bắt ngay)
- **Detection:** `test` (`ai-news.spec.ts › no horizontal overflow at 375` — lưới cũ bắt bug mới, không sửa test)
- **Layer:** `code` (metadata string trong `fetch.mjs` render ra chip `.tag`)
- **Reporter:** YUNIE (bị spec bắt trong Verify)
- **Related KN:** — (minor; guard đã tồn tại)
- **Tags:** `ui` `css` `responsive` `data`
- **Guard:** `tests/e2e/ai-news.spec.ts` (overflow ≤2px @375 — spec có sẵn, không cần viết mới)
- **Status:** `fixed`

---

## 1. Reproduce

### Steps
1. Sửa `fetch.mjs` → `last30days.sources[0] = 'Hacker News (Algolia, free) — query + top-by-points'`
2. `node www/ai-news/fetch.mjs --days 7` (regenerate ai-news.json)
3. `npx playwright test tests/e2e/ai-news.spec.ts -g overflow`

### Expected vs Actual
- **Expected:** `overflow ≤ 2px`
- **Actual:** `Received: 56` (FAIL)

### Evidence
```
expect(received).toBeLessThanOrEqual(expected)
Expected: <= 2
Received:    56
Offender (đo bằng getBoundingClientRect): SPAN.tag.tag-accent width=383, right=431 (@375)
text: "Hacker News (Algolia, free) — query + top-by-points + GitHub Search (f…"
```

### Environment
- Branch: `main` @ commit `d0e7e52`

---

## 2. Root Cause (5 Whys)

- **File:Line:** `www/ai-news/fetch.mjs` (mảng `sources` trong metadata) → `www/ai-news/ai-news.js` (join sources → chip)
- **Why 1:** Trang tràn 56px vì chip nguồn rộng 383px?
- **Why 2:** Chip render chuỗi `sources.join(' + ')` — dài hơn 375px thì thành element tràn.
- **Why 3:** Nhãn `sources[0]` mình đổi thành chuỗi dài 46 ký tự sau khi thêm tính năng mới.
- **Why 4:** Không có giới hạn/cảnh báo độ dài nhãn nguồn trong fetch.mjs.
- **Why 5 (Root):** Chi tiết kỹ thuật (query + top-by-points) bị nhét vào **nhãn hiển thị** thay vì vào trường `engine` (vốn để mô tả kỹ thuật) — thông tin đúng chỗ sai.

- **Impact:** Chỉ trang ai-news @375; đã bắt trước khi lên Pages nhờ spec sẵn có.
- **Confidence:** `HIGH` (cô lập bằng swap JSON về HEAD → pass; sửa → 9/9 pass)

---

## 3. Fix

- **Approach:** Trả nhãn `sources[0]` về gọn `'Hacker News (Algolia, free)'`; chi tiết "query + top-by-points" giữ trong trường `engine` (đúng semantic). Chọn fix **dữ liệu** thay vì fix CSS chip (không đụng shared CSS — tránh regression lan; kn: minimal).
- **Diff tóm tắt:**
```diff
- sources: ['Hacker News (Algolia, free) — query + top-by-points', ...]
+ sources: ['Hacker News (Algolia, free)', ...]   // chi tiết → trường engine
```
- **Non-Goals:** không thêm CSS truncate cho chip (task riêng nếu muốn guard phòng xa); không sửa spec.
- **Fix Confidence:** `HIGH`

---

## 4. Verification

- [x] Re-run: `9/9 pass` (3 spec ai-news: ai-news, curated, vi)
- [x] Regression: không spec nào khác chạm file này fail
- [x] Guard: spec sẵn có `ai-news.spec.ts:49` — **không sửa test** (lưới bắt bug mới = đúng thiết kế KN-012)
- Fresh-eyes tier: `OPTIONAL` (deterministic — overflow đo được)

**Kết quả:** `9 passed (12.7s)`

---

## 5. Lesson (1 câu)

> Chi tiết kỹ thuật không được nhét vào nhãn hiển thị — trường display giữ ngắn, chi tiết để trong trường mô tả; chip không wrap là bẫy 375px.

---

## 6. Prevention

- **Cách phòng tránh:**
  - [x] Nhãn hiển thị (sources/chips/tags) phải ngắn; metadata chi tiết → trường `engine`/`note`.
  - [ ] (tùy chọn) CSS `.tag` thêm `max-width + ellipsis` — để task riêng nếu gặp lại (lưới spec đã đủ bắt).
- **Guard:** `tests/e2e/ai-news.spec.ts:49` (có sẵn — bug mới bị bắt ngay trong Verify, không lọt).

---

## References

- Fix commit: `7ee12f5` (nhãn rút gọn)
- Related: bug `2026-09-24-ai-news-lot-tin-lon-do-recency-only-ranking` (cùng session, nguyên nhân gốc khác)
