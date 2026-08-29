# PRD: Focus Flow — Pomodoro + Task + Stats

## 1. Vision
- **One-liner:** Focus Flow giúp làm việc tập trung bằng Pomodoro kết hợp quản lý task và thống kê trực quan — 1 trang, không cần đăng nhập, dùng ngay.
- **Problem:** Người dùng khó tập trung, pomodoro rời rạc với todo, thiếu động lực khi không thấy tiến độ.
- **Target User:** Học sinh, dev, freelancer cần tập trung 25' và theo dõi hiệu suất.

## 2. User Stories
| ID | As a ... | I want ... | So that ... | Priority |
|----|----------|------------|-------------|----------|
| US-01 | người dùng | bấm Start/Pause/Reset pomodoro 25/5/15' | tập trung theo nhịp | P0 |
| US-02 | người dùng | thêm/xóa/đánh dấu xong task, gán task đang focus | biết đang làm gì | P0 |
| US-03 | người dùng | xem thống kê hôm nay (số pomodoro, phút focus, task xong) | có động lực | P0 |
| US-04 | người dùng | đổi thời lượng pomodoro, bật/tắt âm báo, nhận thông báo khi hết giờ | cá nhân hóa | P1 |
| US-05 | người dùng | xem lịch sử 7 ngày gần nhất (bar chart mini) | theo dõi thói quen | P1 |
| US-06 | người dùng | dùng được trên mobile, có empty/loading/error states đẹp | trải nghiệm mượt | P0 |

## 3. Scope

### In Scope (P0)
- [x] Timer 25/5/15 với Start/Pause/Reset, vòng tròn progress, âm báo
- [x] Task list: thêm, xóa, check done, chọn task đang focus, lưu localStorage
- [x] Stats hôm nay: pomodoros, focus minutes, tasks done
- [x] Responsive 375/768/1280, design system, states đầy đủ
- [x] Keyboard: Space Start/Pause, R Reset

### Nice to Have (P1)
- [ ] Settings: custom durations, sound toggle
- [ ] 7-day mini bar chart (CSS only, không lib)
- [ ] Notification API khi hết giờ

### Non-Goals
- Không đăng nhập, không backend, không sync cloud
- Không nhiều user, không team

## 4. Success Metrics
- Hoàn thành 1 pomodoro → stats tăng ngay, có confetti/toast
- Thêm 3 task → list mượt, không reload
- Mobile 375px không vỡ, Lighthouse a11y ≥ 90

## 5. Edge Cases
- Timer chạy khi tab ẩn → dùng timestamp diff, không drift
- localStorage đầy/quota → fallback memory + toast
- Hết giờ khi đang ở tab khác → Notification + sound + đổi title

## 6. Assumptions
- Mặc định 25/5/15, cho phép đổi trong Settings
- Lưu hết vào localStorage (`focus-flow:v1`)
- 1 pomodoro = 25' focus (dù custom duration thì vẫn tính theo phút thực)

## 7. Open Questions
- [x] Chốt: dùng vanilla HTML/CSS/JS (không build) để demo nhanh, đẹp, dễ verify
