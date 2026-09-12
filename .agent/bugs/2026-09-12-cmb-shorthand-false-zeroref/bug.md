# Bug: CMB zeroRef false positive — detector bỏ qua shorthand + bug.md giữ link KN sai

## Meta

- **Slug:** `2026-09-12-cmb-shorthand-false-zeroref`
- **Ngày:** 2026-09-12
- **Severity:** `minor`
- **Reporter:** @user (card "👻 KN 0 tham chiếu" trên `scale.html#cmb`) / YUNIE
- **Related KN:** `KN-049` (mở rộng — cùng lớp lỗi "metric vs hiện thực"; KHÔNG tạo KN mới)
- **Tags:** `metrics` `process` `knowledge`
- **Status:** `fixed`

---

## 1. Reproduce

### Steps
1. Mở `www/cosmos/scale.html#cmb` → card "👻 KN 0 tham chiếu" hiện `KN-044` + `KN-035`
2. `node .github/harness/scripts/auto-learn.mjs stats --heatmap --json`

### Expected vs Actual
- **Expected:** KN được tham chiếu **thật** trong `.agent/bugs` + `.agent/plans` không bị tố 0 ref.
- **Actual:** Cả 2 đều **false positive** — không có KN nào thật sự mồ côi.

### Evidence
```
zeroRef: KN-044 (9 ngày [fresh]) · KN-035 (1 ngày [fresh])
CLI: "👻 KN 0 tham chiếu: 2"
Thực tế:
- KN-035 → plan self-improving-round2 viết "KN-033/034/035/036" + "grep KN-033→036" (shorthand)
- KN-044 → bug rag-export tồn tại nhưng ghi "Related KN: KN-013" (sai chủ đề — Ponytail ladder)
```

### Environment
- Branch: `main` · Commit: `c3b4f5e`
- OS: Windows

---

## 2. Root Cause (5 Whys)

- **File:Line:** `.github/harness/scripts/auto-learn.mjs` — `buildZeroRef()` (regex full-token `KN-\d{3}(?!\d)`) + `.agent/bugs/2026-09-03-rag-export-missing-grounding-chet/bug.md:20`
- **Why 1:** zeroRef báo 2 KN không ai dùng.
- **Why 2:** Detector không tìm thấy literal `KN-035`/`KN-044` trong ref scope.
- **Why 3:** KN-035 chỉ xuất hiện dạng **shorthand** (`KN-033/034/035/036`, range `KN-033→036`) — regex full-token bỏ sót id giữa; KN-044 bị bug.md trỏ nhầm sang KN-013.
- **Why 4:** Detector giả định văn bản viết full-token; retrofit KN-044 (2026-09-12) thêm KN nhưng chưa sửa link bug.md — chính retrofit note đã tự flag.
- **Why 5 (Root):** Cùng lớp lỗi KN-049 — **metric không khớp hiện thực**: phép ĐO sai tạo false positive → nếu tin theo "gộp hoặc xoá" sẽ xoá/gộp knowledge sống oan.

- **Impact:** Card CMB nhiễu + nguy cơ merge/delete knowledge còn giá trị; policy đúng (fresh <14d chờ) nhưng detector vẫn sai.
- **Confidence:** `HIGH` (reproduce: zeroRef 2→0 sau fix; 2 test khoá 2 chiều)

---

## 3. Fix

- **Approach:** Sửa phép ĐO + sửa link — KHÔNG gộp/xoá KN nào (không phải dead knowledge).
- **Files Changed:**
  - `.github/harness/scripts/auto-learn.mjs` — `expandKnRefs()`: expand slash-list (`KN-033/034/035`) + range (`KN-033→036`, `KN-001..004`, có/không prefix) trước khi match; guard: range ngược hoặc span >30 → giữ nguyên. Áp tại `statsHeatmap` trước `buildZeroRef`.
  - `.agent/bugs/2026-09-03-rag-export-missing-grounding-chet/bug.md` — `Related KN: KN-013` → `KN-044` (+2 checkbox tick).
  - `www/cosmos/scale.html` — card hint 2 tầng (fresh chờ tham chiếu · cũ gộp/xoá) + code-block ghi rõ shorthand được tính.
  - `tests/e2e/cosmos-cmb.spec.ts` — +2 test (describe `CMB zeroRef integrity`): shorthand không phải 0 ref · link KN-044 đúng + zeroRef sạch.
- **Non-Goals:** Không sửa slop-check parser (discovery riêng — xem §5); không tạo KN mới (mở rộng KN-049); không đụng `guard-redteam`/audit.
- **Fix Confidence:** `HIGH`
- **get_errors:** 0 errors (4 files).

---

## 4. Verification

- [x] Re-run steps reproduce → **Fixed**: `zeroRef 2 → 0` ("✅ mọi KN đều được tham chiếu trong bugs/plans")
- [x] Edge: guard range ngược / span>30 / "KN-047→21" (2-digit) không expand; refusal thật & invariant cũ giữ nguyên (8 test cũ vẫn xanh)
- [x] TDD: RED (2 failed) → GREEN (9/9) → full suite **123/123**
- [x] `get_errors` toàn scope changed files → 0
- [x] `slop-check` changed files: spec **Clean**; auto-learn.mjs **cùng finding set** với baseline CRLF (8 findings pre-existing) — chứng minh chênh số trước đó là artifact LF/CRLF + span-swallow (xem §5)
- [x] Fresh-eyes tier: `RECOMMENDED` (có spec khoá 2 chiều)

**Kết quả:**
```
zeroRef: 2 → 0 · counts: KN 49 · bugs 31 · refFiles 257
spec cosmos-cmb: 9/9 · full suite: 123/123 · heatmap.json mirror regen
```

---

## 5. Lesson (1 câu)

> Metric ref-detector phải match đúng cách viết thật của repo (shorthand `KN-033/034/035`, range `KN-001..004`) — nếu không, plan tham chiếu đúng vẫn bị tố "0 ref" và knowledge sống bị đe dọa gộp/xoá oan.

**Discovery phụ (residual — follow-up riêng):** `scripts/slop-check.mjs` brace-scanner không đóng được hàm lớn — `logBug()` span = [274 → EOF] trong mọi version (mọi hàm sau bị gán vào span nó); CC nhạy LF/CRLF (cùng code: parseKNs CC20@LF vs CC23@CRLF) → số function sau `logBug` là số ảo. Ghi nhận, chưa fix (ngoài scope).

---

## 6. Prevention

- **Cách phòng tránh lần sau:**
  - [x] Detector metric mới phải test với **chính data thật** (shorthand/range/format lạ) — KN-049.
  - [x] zeroRef ≠ mục tiêu tự thân: đọc policy fresh/cũ trước khi gộp/xoá; false positive → sửa phép đo, không đụng knowledge.
  - [x] Link chéo bug↔KN ghi 1 lần là chưa đủ — retrofit phải sửa cả 2 đầu.
- **Cần cập nhật:**
  - [x] `docs/knowleged.md` → mở rộng `KN-049` (addendum CMB) + anti-pattern + checklist (không tạo KN mới)
  - [x] Test: `tests/e2e/cosmos-cmb.spec.ts` (+2)

---

## References

- `docs/knowleged.md#KN-049`
- Commit fix: `<điền sau commit>`
- Fixed pattern: KN-049 (metric vs hiện thực) · KN-012 (link trace chính xác)
