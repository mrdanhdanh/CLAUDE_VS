# PRD mini — AI b-roll sources cho `video-clip`

- **Mục tiêu:** pipeline `video-clip` có nơi tra đúng khi clip cần **footage AI** (b-roll ngoài canvas): tool nào, free tier nào test được trước khi trả tiền, pattern dựng clip dài từ segment ngắn, và rủi ro nền tảng (nhãn AI) để không phải sửa lại 2 vòng.
- **User story:** Là `clip-director`/người dựng clip, khi một beat cần hình thật (cảnh, người, không vẽ nổi bằng canvas), tôi mở 1 tài liệu duy nhất để chọn tool theo ngân sách + biết trước guard nào phải giữ.
- **Scope:** 1 reference doc mới trong skill `video-clip` + pointer ngắn trong `SKILL.md` + 1 dòng checklist.
- **Non-goals (YAGNI — cắt trước giữ sau):** ✂ KHÔNG viết code tích hợp tự động tải/ghép video vào template; ✂ KHÔNG thêm dependency hay engine stitch; ✂ KHÔNG thêm bảng giá chi tiết (mau cũ — chỉ ghi free tier + date-stamp).
- **Persistence · F5 · Scope:** N/A — tài liệu trong repo (không phải trang www/, không có state).
- **Evidence:** last30days run 2026-09-26 (window 27/08→26/09; Reddit 17 · YouTube 7 · HN 14) — raw: `~/Documents/Last30Days/ai-video-generation-tools-raw.md`.
- **Who did you think with? (Dissent Review — KN-018):** Framing đối lập: *"chỉ để research note trong `.agent/plans/`, đừng đưa vào skill — skill sẽ phình + số liệu mau cũ"*. Phản biện: nơi được đọc **đúng lúc cần** là skill (wise loading theo description); câu hỏi "dùng tool nào" sẽ lặp lại mỗi clip → để trong `references/` (KHÔNG nhét vào SKILL.md) giữ SKILL.md lean, kèm date-stamp + nhãn `[community-claim]` + câu "re-verify trước khi trả tiền". Chốt: references + pointer.
