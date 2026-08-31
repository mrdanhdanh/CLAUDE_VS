# PRD: 10 Bài Thuật Toán — Visualizer

> PRD cho single-page app mô phỏng thuật toán

## 1. Vision
- **One-liner:** Web tương tác giúp người dùng hiểu thuật toán qua mô phỏng trực quan
- **Problem:** Sinh viên học thuật toán khó hình dung quá trình thực thi
- **Target User:** Sinh viên, người mới học lập trình

## 2. User Stories
| ID | As a ... | I want ... | So that ... | Priority |
|----|----------|------------|-------------|----------|
| US-01 | Sinh viên | Nhập dãy số và xem kết quả | Kiểm tra thuật toán | P0 |
| US-02 | Sinh viên | Xem từng bước thuật toán | Hiểu logic | P0 |
| US-03 | Sinh viên | Xem animation highlight | Theo dõi trực quan | P0 |
| US-04 | Sinh viên | Chạy từng bước thủ công | Kiểm soát tốc độ học | P1 |
| US-05 | Sinh viên | Tạo test data tự động | Thử nghiệm nhanh | P1 |
| US-06 | Sinh viên | Xem số lần so sánh/hoán đổi | Đánh giá độ phức tạp | P1 |

## 3. Scope

### In Scope (P0 — phải có)
- [x] 10 bài thuật toán: Tìm max, Đếm, Linear Search, Bubble Sort, Binary Search, Two Pointers, Sliding Window, Stack, BFS Maze, DP Leo cầu thang
- [x] Animation highlight từng bước
- [x] Chạy từng bước (step-by-step)
- [x] Tạo test data tự động
- [x] Đếm số lần so sánh/hoán đổi
- [x] Responsive 375/768/1280
- [x] A11y: skip-link, aria, focus-visible

### Nice to Have (P1 — nếu còn thời gian)
- [x] Thanh tốc độ cho Bubble Sort
- [x] So sánh Linear vs Binary Search
- [x] So sánh Two Pointers vs Brute Force
- [x] Biểu đồ Sliding Window + chọn mode (max/min/avg)
- [x] Stack Visualizer với animation push/pop
- [x] Maze interactive + BFS/DFS toggle
- [x] DP với chi phí tối ưu (thử thách cuối)
- [ ] Xuất kết quả ra file

### Non-Goals (Out of Scope)
- Không cần backend
- Không lưu database
- Không user authentication

## 4. Success Metrics
- Metric 1: 10 bài thuật toán hoạt động đúng
- Metric 2: Animation mượt ở 60fps
- Metric 3: Responsive không vỡ ở 3 breakpoint
- Metric 4: Two Pointers O(n) vs Brute Force O(n²) so sánh trực quan
- Metric 5: Sliding Window O(n) với window highlight + chart
- Metric 6: Stack push/pop với animation + xác định vị trí lỗi
- Metric 7: BFS tìm đường ngắn nhất + DFS so sánh + interactive maze
- Metric 8: DP leo cầu thang với bảng dp + staircase viz + chi phí tối ưu

## 5. Edge Cases & Constraints
- Edge case 1: Input rỗng → báo lỗi
- Edge case 2: 1 số → yêu cầu ≥ 2
- Edge case 3: Số không hợp lệ → báo lỗi
- Edge case 4: Số âm, thập phân → chấp nhận
- Edge case 5: Mảng không sắp xếp → báo lỗi (Bài 005, 006)
- Edge case 6: Không có cặp nào → hiển thị "Không có cặp nào"
- Edge case 7: Trùng lặp → tìm theo vị trí, hiển thị rõ

## 5b. Bài 006 — Two Pointers (mới)

### User Stories
| ID | As a ... | I want ... | So that ... | Priority |
|----|----------|------------|-------------|----------|
| US-07 | Sinh viên | Nhập mảng + Target, tìm tất cả cặp | Hiểu Two Pointers | P0 |
| US-08 | Sinh viên | Xem left/right di chuyển | Hiểu logic O(n) | P0 |
| US-09 | Sinh viên | So sánh với Brute Force | Thấy khác biệt O(n) vs O(n²) | P1 |

### Scope Bài 006
- In: Two Pointers O(n), không nested for, hiển thị left/right/sum, step-by-step, auto-run, so sánh Brute Force
- Out: Không cần xử lý mảng chưa sắp xếp (báo lỗi)

### Constraints Bài 006
- Không dùng nested for, filter, reduce, find
- left từ đầu, right từ cuối
- sum < target → left++, sum > target → right--, sum === target → lưu cặp + left++/right--

## 5c. Bài 007 — Sliding Window (mới)

### User Stories
| ID | As a ... | I want ... | So that ... | Priority |
|----|----------|------------|-------------|----------|
| US-10 | Sinh viên | Nhập mảng + K, tìm tổng lớn nhất | Hiểu Sliding Window | P0 |
| US-11 | Sinh viên | Xem cửa sổ dịch chuyển | Hiểu O(n) vs O(n*K) | P0 |
| US-12 | Sinh viên | Chọn mode max/min/avg + xem chart | So sánh các cửa sổ | P1 |

### Scope Bài 007
- In: Sliding Window O(n), không tính lại toàn bộ, hiển thị window highlight, step-by-step, auto-run, chart, mode max/min/avg
- Out: Không cần xử lý K > n (báo lỗi)

### Constraints Bài 007
- K > 0, K ≤ n
- Không tính lại tổng toàn bộ cửa sổ — chỉ windowSum - arr[i-K] + arr[i]
- Không dùng reduce() cho toàn bộ bài toán
- Hiển thị left/right/windowSum/maxSum/comparisons

## 5d. Bài 008 — Stack (mới)

### User Stories
| ID | As a ... | I want ... | So that ... | Priority |
|----|----------|------------|-------------|----------|
| US-13 | Sinh viên | Nhập chuỗi ngoặc, kiểm tra hợp lệ | Hiểu Stack | P0 |
| US-14 | Sinh viên | Xem Stack push/pop trực quan | Hiểu LIFO | P0 |
| US-15 | Sinh viên | Xem vị trí lỗi | Debug chuỗi | P1 |

### Scope Bài 008
- In: Stack push/pop, kiểm tra (), [], {}, hiển thị Stack, step-by-step, auto-run, xác định vị trí lỗi, animation
- Out: Không cần xử lý ký tự khác (bỏ qua)

### Constraints Bài 008
- Bắt buộc Stack
- Chỉ xử lý (), [], {}
- Mở → push, đóng → pop + kiểm tra khớp
- Stack rỗng khi gặp đóng → lỗi
- Sau duyệt, Stack phải rỗng mới hợp lệ
- Hiển thị push/pop từng bước

## 5e. Bài 009 — BFS Maze (mới)

### User Stories
| ID | As a ... | I want ... | So that ... | Priority |
|----|----------|------------|-------------|----------|
| US-16 | Sinh viên | Xem mê cung Grid, tìm đường S→E | Hiểu BFS | P0 |
| US-17 | Sinh viên | Xem BFS khám phá từng ô | Hiểu Queue + visited | P0 |
| US-18 | Sinh viên | Tự vẽ mê cung, chọn BFS/DFS | So sánh thuật toán | P1 |

### Scope Bài 009
- In: Grid maze, BFS với Queue, visited, parent, đường ngắn nhất, step-by-step, auto-run, interactive (click vẽ tường/chọn S/E), BFS/DFS toggle
- Out: Không cần maze generation phức tạp (random đơn giản)

### Constraints Bài 009
- Bắt buộc BFS với Queue
- Mỗi ô chỉ duyệt 1 lần (visited)
- Chỉ đi 4 hướng, không xuyên tường
- Lưu parent, truy ngược dựng đường đi
- Hiển thị quá trình BFS
- Không có đường → "Không tìm thấy đường"

## 5f. Bài 010 — DP Leo cầu thang (mới)

### User Stories
| ID | As a ... | I want ... | So that ... | Priority |
|----|----------|------------|-------------|----------|
| US-19 | Sinh viên | Nhập N, xem số cách leo | Hiểu DP | P0 |
| US-20 | Sinh viên | Xem bảng dp + cầu thang | Hiểu dp[n]=dp[n-1]+dp[n-2] | P0 |
| US-21 | Sinh viên | Xem chi phí tối ưu | Hiểu DP với cost | P1 |

### Scope Bài 010
- In: DP leo cầu thang, bảng dp, staircase viz, step-by-step, auto-run, chi phí tối ưu (thử thách cuối)
- Out: Không cần liệt kê tất cả tổ hợp

### Constraints Bài 010
- Bắt buộc DP, không đệ quy brute force
- dp[0]=1, dp[1]=1, dp[n]=dp[n-1]+dp[n-2]
- Hiển thị từng dp[i]
- N từ 1→50
- Thử thách: chi phí tối ưu với cost array
- Edge case 5: Infinity → từ chối
- Constraint: Không dùng Math.max(), filter(), reduce(), sort(), indexOf()

## 6. Assumptions
- Giả định 1: User nhập số phân cách dấu phẩy
- Giả định 2: Chạy trên browser modern (ES6+)
- Giả định 3: Không cần IE11 support

## 7. Open Questions
- [ ] Có nên thêm dark mode?
- [ ] Có nên lưu lịch sử?

---
*Generated by Claude Harness v2 — PRD Phase*
