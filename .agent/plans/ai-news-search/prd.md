# PRD: AI News — Tìm kiếm theo từ khoá + Lọc thời gian

## 1. Vision
- **One-liner:** Thêm tìm kiếm AI News theo từ khoá + khoảng thời gian (1 tuần / 1 tháng / nhiều tháng / không giới hạn), vẫn giữ chuẩn “hot” như khi lấy tin mới.
- **Problem:** Hiện chỉ có “Cập nhật” lấy tin AI chung 30 ngày + lọc theo chuyên mục. User muốn tìm chủ đề cụ thể (vd “AI agents”, “Gemini”, “self-improving”) trong khoảng thời gian tuỳ chọn, nhưng vẫn chỉ thấy tin hot/đáng đọc.
- **Target User:** Người theo dõi AI News muốn đào sâu chủ đề, so sánh theo thời gian, không muốn lướt hết.

## 2. User Stories
| ID | As a ... | I want ... | So that ... | Priority |
|----|----------|------------|-------------|----------|
| US-01 | người đọc | nhập từ khoá và bấm Tìm | thấy tin liên quan tới chủ đề mình quan tâm | P0 |
| US-02 | người đọc | chọn khoảng thời gian: 7 ngày / 30 ngày / 90 ngày / 6 tháng / Không giới hạn | điều chỉnh độ rộng tìm kiếm | P0 |
| US-03 | người đọc | kết quả vẫn được đánh hot (points/comments/stars) như luồng “Cập nhật” | chỉ thấy tin hot, không rác | P0 |
| US-04 | người đọc | kết hợp tìm kiếm + lọc chuyên mục (chips) | thu hẹp nhanh | P0 |
| US-05 | người đọc | xoá tìm kiếm / quay về mặc định 1 click | không kẹt ở kết quả cũ | P0 |
| US-06 | người đọc | bấm Enter để tìm, thấy loading/empty/error rõ ràng | UX mượt | P0 |
| US-07 | dev/local | chạy `node fetch.mjs --topic "X" --days 7|30|90|180|0` | đồng bộ logic browser ↔ CLI | P1 |

## 3. Scope

### In Scope (P0)
- [x] Search bar: input từ khoá + select/chips thời gian + nút Tìm + nút Xoá
- [x] Time ranges: 7 ngày, 30 ngày, 90 ngày, 180 ngày (6 tháng), Không giới hạn
- [x] Live fetch trên trình duyệt: `HN Algolia` + `GitHub Search` với `query=keyword` và `since` theo range, merge/dedupe/sort như `handleLiveRefresh`
- [x] Giữ chuẩn hot: HN `points>100 || comments>50`, GitHub `stars>500`, sort `date desc → hot → score`
- [x] Kết hợp với filter chuyên mục hiện có, cập nhật `metaCount`, `hotGrid`/`allGrid`
- [x] States: loading, empty (không có kết quả), error (fetch fail → toast + giữ cache)
- [x] Keyboard: Enter để tìm, Esc để xoá, `/` vẫn focus filter (không xung đột)
- [x] Highlight từ khoá trong title/summary (mark)

### Nice to Have (P1)
- [ ] CLI `fetch.mjs --days <n>` (0 = không giới hạn)
- [ ] Lưu last search vào localStorage để reload vẫn giữ
- [ ] Debounce input 400ms (optional, không bắt buộc vì có nút Tìm)

### Non-Goals
- Không thêm backend, không thêm API key, không đổi nguồn (vẫn HN + GitHub free)
- Không phân trang phức tạp — giữ top 15 như hiện tại
- Không thay đổi cooldown 1h của nút Cập nhật (search có cooldown riêng nhẹ 30s)

## 4. Success Metrics
- Nhập “Gemini” + 7 ngày → thấy kết quả <2s, có hot badge, sort mới nhất lên đầu
- Đổi sang “Không giới hạn” → HN không filter `created_at_i`, GitHub bỏ `created:>`
- Xoá tìm kiếm → quay về `ai-news.json` ban đầu, counts đúng
- Mobile 375px không vỡ, a11y: input có label, chips có aria-pressed

## 5. Edge Cases
- Từ khoá rỗng → toast “Nhập từ khoá” + không fetch
- Từ khoá quá ngắn (1 ký tự) → vẫn cho fetch nhưng warn
- Không có kết quả → empty-state “Không tìm thấy tin nào cho ‘X’ trong Y ngày”
- Fetch fail (rate limit) → toast lỗi + giữ data cũ + không mất filter
- Unlimited (0) → bỏ `numericFilters` HN, bỏ `created:>` GitHub, vẫn sort hot
- Kết hợp filter chuyên mục sau khi search → lọc trên tập kết quả search, không fetch lại

## 6. Assumptions
- Mặc định range = 30 ngày (đồng bộ với luồng hiện tại)
- Mặc định keyword = “AI” khi bấm Cập nhật (không đổi)
- Search là live fetch (không lọc local trên ai-news.json) để đảm bảo hot + freshness
- Cooldown search riêng 30s (localStorage `ai-news-search-last`) để tránh spam Algolia/GitHub

## 7. Open Questions
- [x] Chốt: 5 mức thời gian như trên, label tiếng Việt
- [x] Chốt: highlight bằng `<mark>` với CSS variables
