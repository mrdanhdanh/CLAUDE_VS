> 🤖 Auto-log bởi auto-learn.mjs — 2026-09-11T16:38:21.798Z
> **Error:** `Trang cosmos lệch nguồn: (1) vật lý sai - entanglement 'doi mot -> doi ca hai tuc thi' (no-signaling, Horodecki); (2) Born rule ghi 'theo bien do' thay vi |bien do|^2 (Tong QM); (3) dark energy = scope creep (stale) trong khi instruction v2 + scale.json dinh nghia = decollaboration`
> **File:** `www/cosmos/index.html`
> **Title:** cosmos page lech tai lieu (no-signaling + born rule + dark energy v2)

# Bug: cosmos page lech tai lieu (no-signaling + born rule + dark energy v2)

> Copy file này vào `.agent/bugs/2026-09-11-cosmos-page-lech-tai-lieu-no-signaling-born-rule-d/bug.md` khi bắt đầu `/fixbug`.
> ✅ Điền bởi YUNIE 2026-09-11 — verify content trang cosmos vs 12 tài liệu vũ trụ/lượng tử (library) + instruction v2 + scale.json.

## Meta

- **Slug:** `2026-09-11-cosmos-page-lech-tai-lieu-no-signaling-born-rule-d`
- **Ngày:** 2026-09-11
- **Severity:** `major`
- **Reporter:** YUNIE (user: "dựa trên tài liệu cosmos, kiểm tra lại nội dung trang")
- **Related KN:** `KN-038` (đã dán `knowleged.md` 2026-09-11)
- **Tags:** `ui` `data` `verify` `docs` `physics` `content-drift`
- **Status:** `fixed`

---

## 1. Reproduce

### Steps
1. Thêm 11 tài liệu vũ trụ + lượng tử vào library (12 với Cosmology — 3.467 chunks)
2. Mở `www/cosmos/index.html` + `www/cosmos/slides.html`
3. Đối chiếu từng luận điểm vật lý/metric trên trang với tài liệu qua MCP `search_library` (scripts/mcp-query.mjs)

### Expected vs Actual
- **Expected:** Claim vật lý khớp tài liệu (Tong/Horodecki/Zurek/Planck/Frieman/LIGO...); metric khớp instruction v2 + `scale.json` (D = decollaboration, G = scope control)
- **Actual:** 3 nhóm lệch:
  1. ❌ Entanglement: "đổi một → đổi cả hai **tức thì**" — sai vật lý (entanglement là tương quan, không truyền tín hiệu — no-signaling)
  2. ⚠️ Born rule: "collapse theo **biên độ**" — thiếu bình phương: xác suất = |biên độ|²
  3. ❌ Dark energy: "scope creep" (stale v1) — v2 = **decollaboration** (D = (1−dissentRatio)×10, KN-018)

### Evidence
- MCP citations:
```
Horodecki chunk #57: "non-message-bearing correlations" · #58: "nonsignaling effects"
Tong QM chunk #112: "the probability ... is given by the Born rule, Prob(λn) = |an|²"
scale.json: darkEnergy.advice = "...decollaboration... áp KN-018 cho mọi PRD mới"
```

### Environment
- Branch: `main`
- OS/Browser: Windows · VS Code (YUNIE mode)

---

## 2. Root Cause (5 Whys)

- **File:Line:** `www/cosmos/index.html:1436` (entanglement), `:1579` (Born rule), `:1725 + :3422` (dark energy); `www/cosmos/slides.html:415, 771, 817, 1020`
- **Why 1:** Nội dung viết trước khi có tài liệu gốc để đối chiếu (library mới ingest hôm nay)
- **Why 2:** Pop-sci shorthand ("đổi một → đổi cả hai") không tách bạch với vật lý thật
- **Why 3:** Metric dark energy được re-define v1→v2 (scope creep → decollaboration) nhưng chỉ cập nhật `scale.html` + instruction, không sweep toàn bộ nội dung đề cập
- **Why 4:** Không có quy trình grep khi đổi định nghĩa metric (single source of truth bị phân tán)
- **Why 5 (Root):** Thiếu gate "verify content vs source of truth" cho trang docs — Done được tuyên bố mà không đối chiếu library/instruction/scale.json

- **Impact:** 3 điểm nội dung sai/lệch trên trang triết lý chính (index + slides) — giảm độ tin cậy của cả bộ tài liệu cosmos
- **Hypothesis:** Pop-sci + metric drift — đã verify bằng MCP citations
- **Confidence:** `HIGH` (đã fix + grep sạch + get_errors 0)

> Nếu bug chạm pattern trong `docs/knowleged.md` → ghi `Related KN: KN-XXX` và áp dụng **Cách phòng tránh** ngay.
> **Root Cause Gate:** Nếu uncertain → investigate / escalate, không tự biến hypothesis thành sự thật.

---

## 3. Fix

- **Approach:** Sửa tại nguồn text từng luận điểm theo tài liệu gốc; label rõ "ẩn dụ vs vật lý thật" cho chỗ dễ gây hiểu nhầm; metric align v2
- **Files Changed:**
  - `www/cosmos/index.html` — 8 edits: entanglement p + hint (no-signaling), Born rule |biên độ|², DG lab p/button/JS mode/toast (decollaboration), lab intro
  - `www/cosmos/slides.html` — 7 edits: slide 2 bullet, slide 10 h2 + card + 2 SVG labels, slide 11 entanglement, slide QD Born rule
- **Diff tóm tắt:**
```diff
- "đổi một → đổi cả hai tức thì, dù cách xa"
+ "đo một hạt → biết ngay kết quả hạt kia — tương quan no-signaling: không truyền tin tức thời"
- "collapse theo biên độ"
+ "collapse theo xác suất |biên độ|² (Born rule)"
- "Mỗi feature thêm vào là dark energy... (scope creep)"
+ "Feature không có Dissent Review là dark energy — decollaboration, D = (1−dissentRatio)×10 (KN-018)"
```
- **Non-Goals:** Không đổi demo behavior (drag-mirror là ẩn dụ hợp lệ sau label); không sửa `scale.html` (đã đúng v2); không đổi số liệu
- **Fix Confidence:** `HIGH`
- **get_errors:** 0 errors cả 2 files sau mỗi nhóm edit

---

## 4. Verification

- [x] Re-run steps reproduce → **Fixed** (grep sạch cụm cũ, cụm mới đúng vị trí)
- [x] Edge cases:
  - [x] case 1: grep "đổi một → đổi cả hai|collapse theo biên độ|Dark Energy — scope creep|scope phình (dark energy)" → 0 matches
  - [x] case 2: grep "no-signaling|Born rule|decollaboration" → 16 matches đúng (index + slides + scale)
- [x] Regression: `scale.html` vẫn nguyên (đã đúng v2); `scale.json` không đổi
- [x] `get_errors` **toàn scope** → 0 errors (index.html + slides.html)
- [x] `lint` / `build` / `test` → N/A (static HTML, không có build step)
- [ ] UI audit: không đổi layout/style (text-only edits)
- [x] Fresh-eyes tier: `OPTIONAL` (deterministic: text content + citations)

**Kết quả:**
```
✅ grep checks pass · ✅ get_errors 0 · ✅ MCP citations lưu trong bug.md
```

---

## 5. Lesson (1 câu)

> Trang triết lý dùng physics metaphor phải verify 2 lớp: vật lý thật (no-signaling, Born rule |biên độ|²) qua library + metric semantics (v2) qua instruction/scale.json — và khi re-define metric thì grep sweep toàn bộ nội dung đề cập.

Ví dụ: *Mọi overlay/modal phải có ESC + focus trap + aria-modal.*

---

## 6. Prevention

- **Cách phòng tránh lần sau:**
  - [x] Khi re-define metric → grep `www/` + `docs/` + `.github/` tìm mọi tham chiếu cũ
  - [x] Claim vật lý dễ gây hiểu nhầm → ghi rõ "ẩn dụ vs vật lý thật" (no-signaling)
  - [ ] Thêm checklist vào `docs/knowleged.md` Anti-patterns / Checklist phòng tránh chung
- **Cần cập nhật:**
  - [x] `docs/knowleged.md` → `KN-038` (Bảng tóm tắt + Chi tiết + Anti-patterns + Checklist) — đã dán 2026-09-11
  - [ ] `product-quality.instructions.md` (nếu là chuẩn UI mới)
  - [ ] Test mới: `path/to/test.spec.ts`

---

## References

- `docs/knowleged.md#KN-038` (proposed)
- Tài liệu gốc: Horodecki quant-ph/0702225 · Tong QM · Planck 1807.06209 · Frieman 0803.0982 · Baumann 0907.5424 · Zurek quant-ph/0306072 · LIGO 1602.03837 · Weinberg astro-ph/0005265 · Tong Cosmology/GR
- MCP client: `scripts/mcp-query.mjs` (query library qua đúng lớp MCP API)

---
*Template: `.agent/bugs/_template/bug.md` — dùng bởi `/fixbug` Phase 1 & 5.*
