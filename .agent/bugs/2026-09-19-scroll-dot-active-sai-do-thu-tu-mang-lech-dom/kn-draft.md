> ✅ ĐÃ PASTE vào `docs/knowleged.md` — KN-073 (2026-09-19, sau duyệt + evaluate PASS). File này giữ làm bản ghi duyệt; KHÔNG paste lại.

📋 Đề xuất KN mới từ bug 2026-09-19-scroll-dot-active-sai-do-thu-tu-mang-lech-dom:

— Bảng tóm tắt (dán vào ## Bảng tóm tắt):
| KN-073 | 2026-09-19 | Cosmos scroll-dot active sáng nhầm section (đọc #map/#calendar → dot #lab) | Logic last-wins theo thứ tự mảng sections lệch DOM order + 2 nguồn danh sách song song (JS array vs dots DOM) | Điều hướng active phải bất biến thứ tự (argmax `offsetTop ≤ mid`) + derive danh sách từ DOM (KN-046) — và test phải assert active-state, không chỉ target-resolve | `ui` `cosmos` `nav` `state` |

— Chi tiết (dán vào ## Chi tiết bài học, trước <!-- Thêm bài học mới -->):

### KN-073 — scroll-dot active sai do thứ tự mảng lệch DOM

- **Ngày:** 2026-09-19
- **Bug report:** `.agent/bugs/2026-09-19-scroll-dot-active-sai-do-thu-tu-mang-lech-dom/bug.md`
- **Severity:** minor
- **Guard:** `tests/e2e/cosmos-lab12-qec.spec.ts` — test "scroll-dot active-state" (scroll giữa 9 section → dot active khớp; mutation-proof: fail trên code cũ `Expected "map" Received "lab"` → pass sau fix)
- **Layer:** code
- **Triệu chứng:** scroll-dot active sai do thứ tự mảng lệch DOM — xem bug.md Reproduce
- **Nguyên nhân gốc:** ** **Logic order-dependent (last-wins) + 2 nguồn danh sách không nhất quán.** Fix ở gốc = (a) chọn section gần nhất phía trên bằng `max offsetTop ≤ mid` (bất biến thứ tự), (b) derive danh sách section
- **Cách sửa:** ** Sửa ở gốc: logic độc lập thứ tự + 1 nguồn duy nhất (derive từ DOM — KN-046) + dots DOM theo thứ tự trang. Bounded — 1 file, không đổi click/CSS/aria.
- **Cách phòng tránh:**
  - Không dùng last-wins theo thứ tự duyệt khi chọn phần tử đang active — dùng tiêu chí so sánh tường minh (argmax/min theo vị trí)
  - Derive danh sách đích nav/observer từ DOM (1 nguồn — KN-046), không hardcode 2 danh sách song song
  - Test điều hướng phải assert cả active-state (không chỉ target-resolve + click)
  - Chạy `node .github/harness/scripts/auto-learn.mjs suggest "<từ khóa>"` trước khi code tương tự
- **Tags:** ui cosmos nav state
- **Người ghi:** YUNIE / auto-learn propose


— Anti-pattern (thêm vào ## Anti-patterns tích lũy nếu phù hợp):
- ❌ Điều hướng active kiểu last-wins theo thứ tự duyệt mảng (mảng lệch DOM = sáng nhầm section) — dùng argmax `offsetTop ≤ mid` (bất biến thứ tự) (KN-073)
- ❌ 2 danh sách id song song (JS array hardcode vs dots DOM) — derive 1 nguồn từ DOM (KN-046/KN-073)
- ❌ Test điều hướng chỉ assert target-resolve/click mà không assert active-state — 77 test xanh vẫn lọt (KN-073)

✅ Sau khi dán, chạy: node .github/harness/scripts/auto-learn.mjs status
   và commit docs/knowleged.md + .agent/bugs/2026-09-19-scroll-dot-active-sai-do-thu-tu-mang-lech-dom/bug.md

🔬 Reef-lite: để có gate evaluate trước khi commit:
   node .github/harness/scripts/auto-learn.mjs evaluate --bug 2026-09-19-scroll-dot-active-sai-do-thu-tu-mang-lech-dom
   node .github/harness/scripts/auto-learn.mjs commit --bug 2026-09-19-scroll-dot-active-sai-do-thu-tu-mang-lech-dom  # chỉ commit khi evaluate PASS
