# Plan mini — video-clip AI b-roll

| # | Todo | Verify |
|---|------|--------|
| 1 | Tạo `references/ai-broll-sources.md` (7 phần, nhãn provenance, date-stamp 26/09/2026) | đọc lại — mọi claim có nguồn/nhãn, không khuyến khích né nhãn AI của nền tảng |
| 2 | Sửa `SKILL.md`: section "B-roll AI" + dòng References + dòng checklist (≤10 dòng thêm) | `git diff --stat`; không restate nội dung reference |
| 3 | Verify: link chéo đúng path, `IDE diagnostics` 2 file, grep `references/` trong skill | link resolve, không lỗi |

**Rủi ro đã biết:**
- Số liệu free tier (credits/video) mau cũ → date-stamp + "re-verify trước khi trả tiền" (đã ghi trong doc).
- Mechanics tích hợp `<video>` vào canvas **chưa test** trong pipeline → gắn nhãn `[hypothesis]` + note "verify ở clip đầu tiên dùng" (không claim đã chạy).
