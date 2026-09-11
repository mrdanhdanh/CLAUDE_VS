# Design (mini) — Cosmos Slides Refresh

- **Layout:** Giữ nguyên khung clip (header + stage 16:9 ↔ 9:16 + controls). Chỉ đổi nội dung trong slide, không đổi cấu trúc điều khiển.
- **Slide 15 (Tương lai):** giữ `layout-split` (text trái + visual phải giữ làm closing brand). Trái: eyebrow "15 ·" + h2 (6 đề tài mới) + dòng shipped (`.shipped-line` xanh success) + list 6 đề tài 1 dòng (emoji + tên + chú thích + `.eta-chip` cyan) + 4-5 nút + dòng YUNIE. Phải: giữ visual 3 hành tinh nguyên trạng.
- **Tokens:** chỉ dùng CSS variables sẵn có (`--cosmos-cyan` cho ETA, `--cosmos-success` cho shipped). Thêm 2 class nhỏ (`.shipped-line`, `.eta-chip`) — không thêm component mới (Ladder nấc 4: native-first).
- **States:** slide chỉ có trạng thái active (clip tự chạy); hover `.mini-card` đã có sẵn; không thêm state mới.
- **Responsive:** 375 (portrait 9:16) list dọc vẫn đọc được (list 1 cột); 768/1280 giữ layout-split như hiện tại. Kiểm bằng e2e `responsive.spec.ts` sẵn có + screenshot evidence.
