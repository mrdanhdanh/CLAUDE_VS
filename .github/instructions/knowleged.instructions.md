---
description: "BẮT BUỘC đọc docs/knowleged.md trước mọi task — chứa bài học từ bug, anti-patterns, checklist phòng tránh. Use when any coding task, bug fix, feature, harness, implement, polish, verify, or before editing any file."
applyTo: "**"
---

# Knowledge — Bắt buộc đọc trước mọi task

> `docs/knowleged.md` là **bộ nhớ dài hạn** của dự án. Mọi agent, mọi prompt, mọi edit — đều PHẢI đọc nó trước khi làm.

## Khi nào áp dụng

- Mọi task: `/harness`, `/fixbug`, `/implement`, `/plan`, `/polish`, `/verify`, edit tay
- Trước khi code, trước khi plan, trước khi fix — không có ngoại lệ

## Quy tắc (BẮT BUỘC)

1. **Đọc trước:** `read_file docs/knowleged.md` ngay bước đầu tiên. Không đọc = không được code.
2. **Áp dụng:** Kiểm tra task hiện tại có chạm pattern đã từng lỗi không → áp dụng ngay **Cách phòng tránh** trong file.
3. **Không lặp lại:** Nếu bug cũ lặp lại do không đọc → coi là lỗi quy trình, phải fix quy trình.
4. **Sau khi fix bug:** `/fixbug` PHẢI cập nhật `docs/knowleged.md` (bảng tóm tắt + chi tiết KN-XXX) + `.agent/bugs/<slug>/bug.md`. Các luồng khác nếu phát hiện pattern mới cũng nên đề xuất cập nhật.
5. **Giữ format:** Thêm bài học theo template trong `docs/knowleged.md` (ID `KN-XXX` tăng dần, Severity `critical|major|minor`, Tags, 4 mục: Triệu chứng → Nguyên nhân gốc → Cách sửa → Cách phòng tránh).

## Checklist cho agent (tự kiểm trước khi code)

- [ ] Đã `read_file docs/knowleged.md`?
- [ ] Đã scan **Bảng tóm tắt** xem task có liên quan pattern cũ?
- [ ] Đã áp dụng **Checklist phòng tránh chung** cuối file?

## Ví dụ

```md
// Đầu mọi prompt/plan — BẮT BUỘC:
1. read_file docs/knowleged.md  // <— bước 0
2. grep_search / read_file code liên quan
3. ... tiếp tục task
```

## Liên kết

- Knowledge: `docs/knowleged.md`
- Bug storage: `.agent/bugs/<slug>/bug.md` + `.agent/bugs/_template/bug.md`
- Fix flow: `/fixbug` (`.github/prompts/fixbug.prompt.md`)

---
*Instruction: knowleged — enforce bởi Harness v2. Không disable nếu chưa có thay thế. Wise loading: applyTo ** nên luôn load.*
