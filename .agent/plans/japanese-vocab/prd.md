# PRD — Nihongo N5 Trainer (`www/japanese/`)

- **Task:** Trang học từ vựng tiếng Nhật thụ động (passive listening) + kiểm tra + từ điển quản trị + skill sinh câu hỏi lưu trong site.
- **Ngày:** 2026-09-28 · **Owner:** YUNIE · **Pipeline:** `/harness` (8 phase)
- **Slug:** `japanese` → `https://<pages>/japanese/`

## 1. Vấn đề & Mục tiêu

Người học N5 cần chế độ **học thụ động**: bật play rồi nghe lặp (kanji → cách đọc → nghĩa), không cần tương tác liên tục. Hiện chưa có trang nào: `www/n5-blazor/` là flashcard chủ động, không có play-loop, không có ngân hàng câu hỏi, không có quản trị từ vựng theo bài.

**Mục tiêu:** 1 mini-app static 3 trang, dùng được trên PC + mobile, dữ liệu tự quản (import/export JSON), không phụ thuộc backend.

## 2. Người dùng & User stories

- **US1 (Học thụ động):** Chọn nhiều bài (trộn) → Play → mỗi từ: hiện lên → 1s → đọc JP tốc độ thường → đọc JP tốc độ chậm → đọc nghĩa tiếng Việt → 1s → từ tiếp theo. Có Pause/Stop, nghe lại thủ công tốc độ Thường/Nhanh, toggle "Mẫu câu". Phát luôn xáo trộn thứ tự phiên mới, không lặp từ trong phiên.
- **US2 (Kiểm tra):** Làm đề N5 với câu hỏi chính thức (import từ đề thi các năm, **không chế biến**), đáp án **xáo trộn**. Chấm điểm ngay + tổng kết + xem lại câu sai.
- **US3 (Từ điển):** Quản lý bài học (tạo/xóa/sửa) + quản lý nội dung từng bài: bảng JSON (thêm/xóa dòng, sort, search, import, export). ID dòng duy nhất, xóa là **không hồi lại**.
- **US4 (Thư viện câu hỏi):** Câu hỏi **sinh từ từ vựng từng bài**; bộ **skill** (nguồn lấy, cách chọn câu, format, checklist) lưu ngay trong site → máy nào mở cũng dùng được, không phụ thuộc phiên chat.

## 3. Phạm vi

**In:** `www/japanese/` với `index.html` (Học), `quiz.html` (Kiểm tra + Ngân hàng + Skill), `dictionary.html` (Từ điển); seed 3 bài mẫu (~37 từ có mẫu câu); `data/questions.json` (schema + câu `sample` demo); skill bundle `skills/question-skill/` (SKILL.md + schema.json); generator in-site `js/qgen.js` (deterministic); README; e2e tests.

**Out (non-goals):** tài khoản/server/sync online; SRS/Anki algorithm; file audio thật (dùng Web Speech API); PWA/service worker; OCR; dịch tự động.

**YAGNI cắt (ghi trước):** không drag-drop sắp xếp; không undo xóa dòng (yêu cầu user: không hồi lại); không multi-user; không lịch sử làm bài dài hạn; không theme toggle phức tạp (1 nút, 2 theme, persist); không export PDF.

## 4. Persistence (BẮT BUỘC)

- **Persistence:** `localStorage['nihongo:db:v1']` (lessons + words + questions), seed lần đầu từ `data/seed-lessons.json` + `data/questions.json`; UI state (`nihongo:ui:v1`) nhớ bài đã chọn + toggles.
- **F5:** giữ (localStorage).
- **Scope:** per-browser. Chia sẻ đa máy = Export JSON (full backup) → thay `data/seed-*.json` → commit → push (Pages).
- **Xóa:** xóa dòng/bài là vĩnh viễn trong store; ID không tái sử dụng.

## 5. Acceptance criteria

1. Play đúng trình tự thời gian (1s → JP thường 0.95 → JP chậm 0.6 → VI → 1s → next); Pause chỉ hiện khi Playing, Play hiện khi Paused/Idle; Stop reset về từ đầu.
2. Nút "Thường"/"Nhanh" đọc từ hiện tại bằng giọng Nhật (khi không ở trạng thái playing).
3. Toggle "Mẫu câu": hiện/ẩn câu mẫu trong card **và** thêm bước đọc mẫu câu (JP → VI) khi bật.
4. Chọn nhiều bài → mỗi lần **Phát** tạo thứ tự ngẫu nhiên mới; từ trùng giữa các bài (cùng kanji/kana) chỉ phát 1 lần trong phiên; progress `i/n`.
5. Quiz: options xáo trộn (mapping đúng), câu hỏi xáo trộn, chấm ngay, tổng kết điểm, lọc theo nguồn/năm/loại.
6. Từ điển: CRUD bài + dòng, search, sort, import (gộp/thay thế), export (bài + full), xác nhận trước xóa; ID duy nhất.
7. Generator: sinh câu từ từ vựng (4 loại), idempotent theo ID, xóa câu sinh theo bài.
8. Responsive 375/768/1280 không vỡ; a11y: keyboard, contrast ≥4.5:1, aria-label; dark/light auto + toggle.
9. Skill bundle đọc được độc lập (SKILL.md + schema.json + README) — không phụ thuộc máy thực thi.

## 6. Dissent Review (KN-018 — bắt buộc)

- **Who did you think with?:** Self-critique kiểu Critic + 2 framing đối lập:
  1. *"Passive listening kém hiệu quả hơn active recall/Anki — sao không làm SRS?"* → Đúng về retention: passive một mình yếu. **Giữ passive vì user yêu cầu tường minh** (nghe khi làm việc khác, hands-free); bù active bằng **trang Quiz** + generator. SRS để sau nếu user đòi (YAGNI).
  2. *"Web Speech API giọng không đều giữa máy — sao không dùng file audio (Forvo/TTS thu sẵn)?"* → Đúng về chất lượng giọng. **Rejected:** cần thu/license hàng nghìn từ, không offline, nặng repo. Chọn Web Speech API + hiển thị trạng thái voice (JA/VI) để user biết máy mình có giọng; cài voice là 1 lần trên OS.
- **Assumption nguy hiểm nhất:** đề chính thức N5 có bản quyền (Japan Foundation/JEES) → **không tự bịa/tự sinh câu "chính thức"**; xây cơ chế import + seed `sample` dán nhãn rõ + tài liệu hóa nguồn trong skill. (KN-075: không claim thực thể chưa xác minh.)

## 7. Rủi ro

| Rủi ro | Giảm thiểu |
|--------|-----------|
| Máy thiếu voice ja/vi | Hiện badge voice JA/VI; toast hướng dẫn cài voice; vẫn chạy (fallback rate/lang) |
| Pause trên vài browser TTS lỗi | Không dựa `speechSynthesis.pause()` — player pause bằng cancel + replay bước hiện tại (deterministic) |
| URL không slash cuối → fetch 404 | Dùng `dirBase()` (KN-030) cho mọi fetch nội bộ |
| Cache cũ sau deploy | Seed có version; store có version key |
| Mất dữ liệu khi user xóa | Export backup 1 nút + confirm rõ "không hồi lại" |
