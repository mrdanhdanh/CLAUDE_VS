# PRD mini — Thời khóa biểu "AI Engineering from Scratch" + tracker tiến độ

> Ngày: 2026-09-15 · YUNIE · Task: học từ đầu toàn bộ curriculum `rohitg00/ai-engineering-from-scratch` (20 phases, MIT)
> **Đính chính:** repo tự ghi 523 bài, nhưng ROADMAP + thư mục trên đĩa (đối chiếu 15/09) = **521 bài thực** (P10 retire số 23–24, P19 retire 18–19).

## Mục tiêu
- 1 thời khóa biểu liệt kê **HẾT** 521 bài / 20 phases, kèm ~thời lượng từng bài + nhịp độ gợi ý.
- 1 cơ chế ghi nhận bền vững: sếp chỉ cần gõ **"học X"** (hoặc "học tiếp") trong chat → tiến độ được ghi lại.

## Deliverables
- `docs/learning-path/curriculum.json` — dữ liệu 521 bài (sync từ ROADMAP repo, parse fail-closed).
- `docs/learning-path/timetable.md` — thời khóa biểu (render tự động từ curriculum + progress).
- `docs/learning-path/progress.json` — tiến độ (`done[id] = ngày`, `paceHoursPerWeek`).
- `scripts/learn.mjs` — CLI 0-dep Node 18+: `sync · render · done · undo · next · status · pace`.

## Non-goals
- Không tự giảng nội dung từng bài (YUNIE giảng khi được yêu cầu — "học + giảng X").
- Không web UI (YAGNI — thêm sau nếu cần).

## Persistence
Persistence: file trong repo (`docs/learning-path/progress.json`, commit được) · F5: giữ · Scope: per-repo (mọi session YUNIE đọc chung).

## Success
- Sync ra đủ 20 phases / 521 bài · render có checkbox từng bài · `done`/`undo` roundtrip pass · `status` đúng số.

## Dissent Review
- **Who did you think with?:** tự phản biện — user muốn "liệt kê hết" → nguy cơ wall-of-text; giảm bằng: bảng tổng quan 20 dòng + chi tiết theo phase + checkbox để scan nhanh.
- Alternative đã cân nhắc: **web UI tracker** (đẹp hơn, nhưng +2 file mới — hoãn, minimal-ladder nấc 1: chưa chứng minh cần).
- Rủi ro chính: ROADMAP upstream đổi format → parser fail-closed (không ghi đè khi parse nghi vấn), giữ nguyên dữ liệu cũ.
