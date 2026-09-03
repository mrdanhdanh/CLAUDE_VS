# PRD v2: 10 Bài Thuật Toán — Nâng Cấp Toàn Diện

> Nâng cấp từ 10 bài cơ bản → 10 bài trung cấp/nâng cao, khó hơn, diễn giải đẹp hơn, ví dụ chất lượng

## 1. Vision
- **One-liner:** Visualizer 10 thuật toán từ cơ bản → nâng cao, mỗi bài là 1 pattern phỏng vấn thực tế, diễn giải trực quan + so sánh độ phức tạp
- **Problem:** 10 bài cũ quá dễ (tìm max, đếm, linear search, bubble sort) — không đủ thử thách, thiếu chiều sâu, ví dụ đơn điệu
- **Target User:** Sinh viên đã qua cơ bản, người luyện phỏng vấn, dev muốn ôn pattern

## 2. Triết lý nâng cấp
- **Khó hơn:** Mỗi bài cũ → bài mới giữ cùng pattern nhưng problem khó hơn (ví dụ: tìm max → Kadane max subarray)
- **Diễn giải đẹp hơn:** Mỗi bài có: đề bài + ví dụ minh họa + pseudocode highlight + complexity badge + animation mượt + so sánh brute vs optimal
- **Ví dụ chất lượng:** Mỗi bài có 3 preset ví dụ (dễ/trung bình/khó) + random có ý nghĩa + edge case

## 3. Mapping 10 Bài: Cũ → Mới

| # | Cũ (dễ) | Mới (khó hơn) | Pattern | Độ khó | Lý do nâng cấp |
|---|---------|---------------|---------|--------|----------------|
| 001 | Tìm số lớn nhất O(n) | **Kadane — Maximum Subarray** | DP / Greedy | ⭐⭐⭐ | Từ tìm 1 số → tìm đoạn con có tổng lớn nhất, phải hiểu DP, ví dụ âm/dương lẫn lộn |
| 002 | Đếm số lần xuất hiện O(n) | **Top K Frequent Elements** | HashMap + Heap | ⭐⭐⭐⭐ | Từ đếm 1 số → thống kê tần suất + heap, trực quan bucket/heap |
| 003 | Linear Search O(n) | **Search in Rotated Sorted Array** | Binary Search biến thể | ⭐⭐⭐⭐ | Từ duyệt tuyến tính → binary trên mảng xoay, phải xử lý 2 nửa |
| 004 | Bubble Sort O(n²) | **QuickSort — Partition Visualizer** | Divide & Conquer | ⭐⭐⭐⭐⭐ | Từ O(n²) đơn giản → QuickSort với pivot, partition, recursion tree |
| 005 | Binary Search O(log n) | **Bounds — First/Last Occurrence** | Binary Search nâng cao | ⭐⭐⭐⭐ | Từ tìm 1 vị trí → tìm biên trái/phải, xử lý duplicate, lower/upper bound |
| 006 | Two Pointers — Two Sum | **Container With Most Water** | Two Pointers nâng cao | ⭐⭐⭐⭐ | Từ two sum đơn giản → container, diện tích, trực quan cột nước |
| 007 | Sliding Window — Max Sum K | **Longest Substring Without Repeating** | Sliding Window + HashSet | ⭐⭐⭐⭐⭐ | Từ window cố định K → window biến đổi + hash set, khó hơn nhiều |
| 008 | Stack — Kiểm tra ngoặc | **Next Greater Element — Monotonic Stack** | Monotonic Stack | ⭐⭐⭐⭐⭐ | Từ push/pop ngoặc → stack đơn điệu, NGE, histogram |
| 009 | BFS Maze | **Dijkstra — Weighted Grid** | Dijkstra + Priority Queue | ⭐⭐⭐⭐⭐ | Từ BFS unweighted → Dijkstra weighted, priority queue, so sánh BFS vs Dijkstra |
| 010 | DP Leo cầu thang | **0/1 Knapsack** | 2D DP | ⭐⭐⭐⭐⭐ | Từ 1D DP đơn giản → 2D DP knapsack, bảng DP, truy vết |

## 4. User Stories

| ID | As a ... | I want ... | So that ... | P |
|----|----------|------------|-------------|---|
| US-01 | Người học | Đọc đề bài + ví dụ minh họa rõ ràng | Hiểu problem trước khi chạy | P0 |
| US-02 | Người học | Xem pseudocode highlight theo bước | Liên kết code ↔ visualization | P0 |
| US-03 | Người học | Chạy từng bước + tự động + điều chỉnh tốc độ | Kiểm soát nhịp học | P0 |
| US-04 | Người học | Xem complexity badge + so sánh brute vs optimal | Hiểu tại sao optimal tốt hơn | P0 |
| US-05 | Người học | Chọn preset ví dụ (dễ/trung bình/khó) | Thử nhanh không cần nhập tay | P1 |
| US-06 | Người học | Xem animation mượt, highlight trực quan | Theo dõi dễ dàng | P0 |
| US-07 | Người học | Xem bảng DP / heap / stack trực quan | Hiểu cấu trúc dữ liệu phụ trợ | P0 |

## 5. Scope

### In Scope (P0)
- [ ] 10 bài mới với đề bài + ví dụ + pseudocode + complexity
- [ ] Mỗi bài: input validation, random meaningful, 3 presets
- [ ] Visualization: array/cell highlight, pointer, DP table, heap/stack, grid, chart
- [ ] Controls: Chạy, Từng bước, Tự động, Đặt lại, Tốc độ
- [ ] Steps log + result card + stats (comparisons, ops)
- [ ] Responsive 375/768/1280, a11y, animation 150-300ms
- [ ] So sánh brute vs optimal cho mỗi bài (bar chart hoặc số liệu)

### Nice to Have (P1)
- [ ] Recursion tree cho QuickSort
- [ ] Water fill animation cho Container
- [ ] Heatmap cho Knapsack DP table

### Non-Goals
- Không backend, không lưu DB, không auth
- Không cần code editor chạy thật — chỉ visualizer

## 6. Success Metrics
- 10 bài mới hoạt động đúng với test case chuẩn
- Mỗi bài có ≥3 preset ví dụ chất lượng
- Animation mượt, không giật, highlight rõ ràng
- Responsive không vỡ 3 breakpoint
- Pseudocode highlight đồng bộ với bước

## 7. Edge Cases
- Input rỗng / 1 số / không hợp lệ → báo lỗi rõ ràng
- Mảng xoay không xoay (đã sorted) → vẫn chạy đúng
- QuickSort pivot trùng → xử lý duplicate
- Knapsack capacity 0 / item weight > capacity
- Dijkstra không có đường → báo "Không tìm thấy"

## 8. Assumptions
- User đã hiểu cơ bản array, loop, function
- Chạy trên browser modern (ES6+)
- Tiếng Việt cho UI, code/pseudocode tiếng Anh

---
*PRD v2 — Web Thuật Toán Nâng Cấp*
