# PRD — Clip Craft (skill + agent cho content creator chuyên nghiệp)

> Mini-PRD. Ngày: 2026-09-26 · Input: `.agent/plans/clip-craft/upgrade-ideas.md`

## Problem

Hai clip đã ship (`space-bunny-free`, `openai-hf-hack`) chứng minh pipeline kỹ thuật (`video-clip` skill) chạy tốt, nhưng **lớp craft không có nơi lưu trữ**: bố cục safe zone, hệ màu semantic, cấu trúc hook/beat, chuẩn publish — nằm rải rác trong từng `design.md` của mỗi clip. Hệ quả đo được: lỗi lặp (progress/footer ở y 1800–1852 = vùng UI che), không có phụ đề cho feed muted, hook viết một lần không có portfolio để test.

## Goal

Đóng gói kiến thức craft thành 2 artifact tái sử dụng:
1. **Skill `clip-craft`** — knowledge: layout (safe zone + lưới + type scale + motion rhythm) · color (role system + semantic + 3 công thức palette) · content (hook triad + 4 structure template + retention + script math + CTA/publish).
2. **Agent `clip-director`** — executor: chạy được quy trình creative (research → hook portfolio → beat sheet → visual brief → review frames → publish pack), viết output vào `.agent/plans/<slug>/`, handoff sang pipeline `video-clip`.

## User stories

- Là người làm clip: tôi mở `clip-craft` là có ngay số liệu safe zone + công thức hook + palette — không phải search lại.
- Là main agent: khi task chạm "làm clip / viết hook / bố cục / màu", tôi delegate `clip-director` để ra script/design/publish trước khi code canvas.
- Là người review: mỗi quyết định craft có nguồn + ngày, không phải "theo cảm giác".

## Scope

- ✅ Viết skill `clip-craft` (SKILL.md + 3 references) + agent `clip-director` + đăng ký registry + cross-link `video-clip`.
- ✅ Doc `upgrade-ideas.md` (đã xong) làm input/tham chiếu.
- ❌ Không re-render clip hiện có (đó là task sau, dùng chính skill này).
- ❌ Không thêm dependency, không đụng `www/` runtime, không sửa `video-clip` pipeline (chỉ thêm pointer).

## YAGNI — cái CẮT

- CẮT: auto-subtitle renderer script (L3) — chỉ ghi *cách làm* vào reference, implement khi có task clip thật.
- CẮT: generator/CLI mới cho clip-craft — skill + agent là đủ.
- CẮT: template cover PNG — mô tả spec, không vẽ asset.

## Rubric (C1–C5)

| # | Tiêu chí | Cách check |
|---|---|---|
| C1 | Safe zone có số liệu + nguồn + ngày | `grep "900×1400" references/layout.md` + link nguồn |
| C2 | Skill + agent load được qua registry | `harness-manager.mjs list --type skill/agent` → enabled |
| C3 | Description keyword-rich (wise loading) | Đọc frontmatter: có "clip/hook/storyboard/bố cục/màu sắc/content creator" |
| C4 | Actionable: mọi mục có bảng/checklist, không lý thuyết suông | Đọc references: ≥8 bảng, checklist cuối mỗi file |
| C5 | Nhất quán với pipeline hiện có | Cross-link 2 chiều `video-clip` ↔ `clip-craft` |

## Dissent Review

- **Who did you think with?** Tự phản biện 2 framing đối lập: (a) *"Gộp hết vào `video-clip` thay vì skill mới"* — phản bác: video-clip đã dài (~130 dòng HOW), thêm craft sẽ phình; wise-loading cần tách *khi nào load cái gì* (technique vs craft). (b) *"Số liệu safe zone sẽ lỗi thời"* — phản bác: nền tảng đổi 3–5 lần/năm → giữ + ghi ngày + rule "re-verify trước clip quan trọng", thay vì không viết gì.
- Human giữ quyết định: user chọn hướng "làm agent + skill bổ sung kiến thức đầy đủ" — doc này ghi lại đúng scope đó.

## Persistence

N/A — không có UI/trạng thái runtime; artifact là file trong repo (skill/agent/docs).
