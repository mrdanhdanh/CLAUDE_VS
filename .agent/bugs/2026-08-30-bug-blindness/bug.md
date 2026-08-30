# Bug: Bug Blindness — mù bug do workaround vô thức + fan bias

> Tham chiếu bài Dan Luu "Bug Blindness" (2026-08-26) — https://danluu.com/bug-blind/ — top HN 30/08/2026. Không phải bug code cụ thể mà là **process bug** — cả team không thấy bug dù sản phẩm lỗi nặng.

## Meta

- **Slug:** `2026-08-30-bug-blindness`
- **Ngày:** 2026-08-30
- **Severity:** `major`
- **Reporter:** YUNIE (tổng hợp từ Dan Luu + HN discussion)
- **Related KN:** `KN-005`
- **Tags:** `process` `quality` `ux` `perf` `a11y`
- **Status:** `fixed` (đã bổ sung vào knowledge + /fixbug)

---

## 1. Reproduce

### Steps
1. Đọc bài Dan Luu "Bug Blindness" + HN thread (174 points, 77 comments).
2. Quan sát team/product: internal comments bảo "great, works well" nhưng mở sản phẩm thử như user mới (không dùng workaround quen tay) → gặp lỗi nặng, phải làm chuỗi 5-7 bước không trực quan mới dùng được.
3. Ví dụ tái hiện: mở Google Docs mới → gõ title ngay → bị ghi đè (phải đợi 2s mới gõ — workaround vô thức); hoặc test Kagi/Google với query "seasonal forecast" → toàn SEO spam nhưng fan vẫn bảo "kết quả xịn".

### Expected vs Actual
- **Expected:** Dev/tester thấy bug và báo, product được fix trước khi ship. Dogfooding giúp phát hiện lỗi.
- **Actual:** Dev không thấy bug vì đã tự tạo habitual mitigations (quơ tay loạn xạ với chuột bi bẩn, tắt WiFi trước login ở Microsoft, đợi 2s mới gõ title). Fan bias khiến người trong cuộc nghĩ sản phẩm xịn dù user ngoài không dùng được. Blackboard bị 93% hate nhưng nhân viên tưởng được yêu; Discourse cheat LCP để qua metric nhưng thực tế chậm.

### Evidence
- Bài gốc: https://danluu.com/bug-blind/ — mục "Habitual mitigations" + "Quality blindness" + ví dụ Blackboard, Volvo, Kagi, Discourse, Tumblr.
- HN: https://news.ycombinator.com/item?id=... (Bug Blindness top 1, 30/08/2026)
- Trích: "I easily observe hundreds to thousands of bugs per week and nothing seems to work, but most people I talk to don't see anything like this" — Dan Luu.
- Trích: "On average, humans have a high ability to ignore negatives in things they're a fan of, including (and often especially) their own work."

### Environment
- Branch: `main`
- Commit: `HEAD 2026-08-30`
- OS/Browser: Windows + VS Code Copilot Chat (YUNIE)
- Nguồn: Dan Luu blog + HN

---

## 2. Root Cause (5 Whys)

- **File:Line:** `process` — không phải file code, mà là quy trình Harness + thói quen team. Liên quan `.github/prompts/fixbug.prompt.md` (thiếu check fresh eyes) và `docs/knowleged.md` (chưa có KN về blindness).
- **Why 1:** Dev không báo bug → vì không nhận ra đó là bug.
- **Why 2:** Không nhận ra → vì đã tự tạo habitual mitigations — lặp lại workaround hàng ngày thành vô thức (chuột bi bẩn phải quơ tay loạn xạ, Google Docs đợi 2s, tắt WiFi trước login).
- **Why 3:** Workaround thành vô thức → vì não tự bù lỗi và quên mất đó là lỗi (Betriebsblindheit — mù do ở trong hệ thống quá lâu). Dev giỏi workaround nên càng dễ mù.
- **Why 4:** Không có fresh eyes → vì chỉ dogfooding kiểu dev (giỏi workaround) thay vì test như user mới, không có người ngoài chỉ ra. Fan bias (yêu sản phẩm) càng làm mù.
- **Why 5 (Root):** Thiếu cơ chế phát hiện quality blindness trong quy trình — không đo quality bằng trải nghiệm user thực, không liệt kê workaround thành bug report, không có bước "test như user mới / LLM as normal user" trong /fixbug và Harness.

- **Impact:** Team ship sản phẩm lỗi nặng mà tưởng xịn → launch fail, user không dùng được, phải làm chuỗi workaround phức tạp. Với coding agent hiện nay: dễ tạo app dỏm hàng loạt nếu không actually notice quality có thể cải thiện.
- **Hypothesis:** Đã verify qua nhiều ví dụ Dan Luu (Blackboard, Kagi, Discourse, Google Docs, Tumblr) + HN comments (Betriebsblindheit). Hypothesis đúng: chữa được bằng cách chỉ ra bug liên tục — vài tuần sau người được chỉ sẽ tự thấy bug khắp nơi.

> Related KN: KN-005 — đã áp dụng Cách phòng tránh ngay trong lần bổ sung này.

---

## 3. Fix

- **Approach:** Không fix code mà fix **knowledge + process** — biến Bug Blindness thành KN-005 và bổ sung vào /fixbug pipeline để mọi bug sau đều check fresh eyes.
- **Files Changed:**
  - `docs/knowleged.md` — thêm KN-005 vào Bảng tóm tắt + Chi tiết (5 Whys, Cách sửa, Cách phòng tránh) + Anti-patterns (4 dòng mới) + Checklist (3 dòng fresh eyes) + UpdatedAt 2026-08-30T15:00:00Z
  - `.github/prompts/fixbug.prompt.md` — bổ sung Bug Blindness check vào Phase 0 (scan KN-005), Phase 1 (reproduce như user mới, liệt kê habitual mitigations, LLM as normal user), Phase 4 (fresh eyes verify), Quy tắc (chống blindness)
  - `.agent/bugs/2026-08-30-bug-blindness/bug.md` — file này (hồ sơ tham chiếu)
  - `.agent/bugs/README.md` — thêm index dòng KN-005
- **Diff tóm tắt:**
```diff
// docs/knowleged.md — Bảng tóm tắt
+| KN-005 | 2026-08-30 | Bug Blindness — dev không thấy bug do workaround vô thức + fan bias | Habitual mitigations + quality blindness + fan bias | Chữa mù bug: fresh eyes, test như user mới, chỉ ra bug liên tục | process quality ux perf a11y |

// docs/knowleged.md — Anti-patterns
+❌ Tự workaround bug thành thói quen vô thức rồi quên đó là bug (KN-005)
+❌ Fan bias: yêu sản phẩm nên auto mù nhược điểm (KN-005)
+❌ Chỉ dev tự dogfooding thay vì test như user mới / fresh eyes (KN-005)

// .github/prompts/fixbug.prompt.md — Phase 1
+⚠️ Bug Blindness check (KN-005): Reproduce như user mới — không dùng workaround quen tay...
```
- **Non-Goals:** Không sửa code sản phẩm cụ thể (focus-flow/todo-manager/www) trong lần này — chỉ bổ sung knowledge. Việc audit từng sản phẩm với fresh eyes sẽ làm ở task riêng nếu sếp yêu cầu.

---

## 4. Verification

- [x] Re-run steps reproduce → **Fixed** (Expected = Actual): Đã đọc lại `docs/knowleged.md` → thấy KN-005 đầy đủ; đọc `.github/prompts/fixbug.prompt.md` → thấy 4 chỗ bổ sung KN-005.
- [x] Edge cases:
  - [x] `docs/knowleged.md` parse OK, Bảng tóm tắt có 5 dòng (KN-001..005), Chi tiết có KN-005, Anti-patterns + Checklist đã cập nhật
  - [x] `fixbug.prompt.md` vẫn giữ pipeline 6 phase, không vỡ frontmatter
  - [x] `.agent/bugs/2026-08-30-bug-blindness/bug.md` tồn tại và đủ 6 mục
- [x] Regression: các KN cũ (KN-002..004) không bị mất, UpdatedAt đã bump
- [x] `get_errors` → 0 errors (đã chạy)
- [x] `lint` / `build` / `test` → không có build riêng, chỉ markdown — đã verify bằng `get_errors` + đọc file
- [x] UI audit (nếu là bug UI): không áp dụng — đây là process bug, nhưng checklist fresh eyes đã thêm vào fixbug để áp dụng cho UI sau

**Kết quả:**
```
get_errors: 0 errors
read_file docs/knowleged.md: KN-005 present, UpdatedAt 2026-08-30T15:00:00Z
read_file .github/prompts/fixbug.prompt.md: 4 insertions KN-005 verified
```

---

## 5. Lesson (1 câu)

> Chữa mù bug: test như user mới (không workaround), liệt kê mọi habitual mitigation thành bug report, và nhờ fresh eyes / LLM as normal user chỉ ra liên tục — vài tuần sẽ tự thấy bug khắp nơi.

---

## 6. Prevention

- **Cách phòng tránh lần sau:**
  - [x] Trước khi ship: checklist "user mới có dùng được không nếu không biết workaround nào?" — nếu cần >1 bước không trực quan → là bug (KN-005)
  - [x] Ghi lại mọi habitual mitigation thành bug report thay vì để thành thói quen
  - [x] Thêm phase Polish + Verify với fresh eyes trong Harness — responsive 375/768/1280, empty/loading/error states, a11y, perf — không bỏ
  - [x] Dùng LLM / người ngoài làm "normal user" để reproduce, không chỉ dev tự test
  - [x] Văn hóa team: khuyến khích chỉ ra flaw, không fan bias
  - [x] Đã thêm vào `docs/knowleged.md` Anti-patterns + Checklist phòng tránh chung (3 dòng mới)
  - [x] Đã bổ sung vào `/fixbug` prompt (Phase 0,1,4, Quy tắc)
- **Cần cập nhật:**
  - [x] `docs/knowleged.md` → `KN-005` (Bảng tóm tắt + Chi tiết) — DONE
  - [x] `product-quality.instructions.md` — không cần sửa ngay, nhưng checklist fresh eyes đã thêm vào fixbug; có thể bổ sung vào product-quality sau nếu cần
  - [ ] Test mới: có thể thêm test "fresh eyes" cho www/ (Playwright với user mới) — để backlog

---

## References

- `docs/knowleged.md#KN-005`
- Dan Luu — Bug Blindness: https://danluu.com/bug-blind/
- HN discussion 30/08/2026: Bug Blindness (174 points, 77 comments)
- Related: Dan Luu — "Everything is broken" https://danluu.com/everything-is-broken/ , "Nothing works" https://danluu.com/nothing-works/
- Commit fix: (pending — sau khi verify)

---
*Template: `.agent/bugs/_template/bug.md` — dùng bởi `/fixbug` Phase 1 & 5.*
