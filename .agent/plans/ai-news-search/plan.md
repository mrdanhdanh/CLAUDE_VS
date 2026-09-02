# Plan: AI News — Tìm kiếm theo từ khoá + Lọc thời gian

## 1. Todos
| # | Task | File | Est |
|---|------|------|-----|
| 1 | Thêm search section HTML (input + buttons + time chips + hints + status) | `www/ai-news/index.html` | 15m |
| 2 | Thêm CSS cho search-card, input, chips, hints, highlight, responsive | `www/ai-news/ai-news.css` | 20m |
| 3 | Thêm JS: state + fetchLiveHN/GitHub với days + handleSearch/Reset + highlight + cooldown 30s + tích hợp render | `www/ai-news/ai-news.js` | 40m |
| 4 | Thêm CLI --days cho fetch.mjs (0 = unlimited) | `www/ai-news/fetch.mjs` | 15m |
| 5 | Polish responsive 375/768/1280 + a11y + states | all | 15m |
| 6 | Verify: serve + manual test + get_errors | all | 15m |

## 2. File Changes
- `www/ai-news/index.html` — chèn `<section class="search-section">` giữa hero và filter-bar, giữ nguyên header/hero/filter/hot/all
- `www/ai-news/ai-news.css` — thêm ~120 dòng cho .search-card, .search-row, .search-input-wrap, .time-chips, .hint-chip, .search-status, mark.hl, responsive
- `www/ai-news/ai-news.js` — thêm search state + `fetchLiveHN(topic, days)` + `fetchLiveGitHub(days)` overload + `handleSearch()` + `handleResetSearch()` + `highlightKeyword()` + cooldown LS `ai-news-search-last` + update `createCard` để highlight + update `renderNews` để show searchStatus + wire events (Enter/Esc/click)
- `www/ai-news/fetch.mjs` — parse `--days <n>`, tính `since` theo days, bỏ filter khi 0, update description/meta

## 3. Risks & Mitigations
- **Rate limit HN/GitHub khi spam search** → cooldown 30s + toast remaining, giống nút Cập nhật
- **Unlimited làm HN trả quá nhiều** → vẫn hitsPerPage 20, không tăng, chỉ bỏ numericFilters
- **Xung đột filter chuyên mục** → search thay `data.articles`, filter chips lọc trên tập đó (client-side), không fetch lại
- **Highlight XSS** → escapeHtml trước rồi mới replace keyword bằng mark (dùng regex escape)
- **Mobile vỡ** → flex-wrap + overflow-x auto cho time-chips, test 375px

## 4. Verify Checklist
- [ ] Nhập "Gemini" + 7 ngày → loading → kết quả hot + highlight
- [ ] Đổi 30 ngày → Không giới hạn → kết quả khác (nhiều hơn)
- [ ] Kết hợp filter chuyên mục sau search → lọc đúng
- [ ] Xoá → quay về ai-news.json ban đầu
- [ ] Empty: từ khoá lạ → empty-state rõ ràng
- [ ] Cooldown 30s: bấm liên tục → toast đợi
- [ ] Responsive 375/768/1280 không vỡ, a11y label/aria-pressed
- [ ] `get_errors` 0, `node fetch.mjs --topic "AI agents" --days 7 --dry` chạy ok
