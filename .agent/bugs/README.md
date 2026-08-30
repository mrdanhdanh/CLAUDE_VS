# Bugs — Lưu trữ bug & bài học

> Mỗi bug = 1 folder `.agent/bugs/YYYY-MM-DD-<slug>/bug.md` + cập nhật `docs/knowleged.md` (KN-XXX).
> Luồng `/fixbug` tự tạo và cập nhật. Không dùng `/harness` full pipeline cho bug.

## Quy ước

- **Slug:** `YYYY-MM-DD-<short-slug>` — vd: `2026-08-29-modal-esc`, `2026-08-30-api-timeout`
- **Template:** copy từ `_template/bug.md`
- **Knowledge:** sau khi fix, thêm `KN-XXX` vào `docs/knowleged.md` (Bảng tóm tắt + Chi tiết)

## Index

| Ngày | Slug | Severity | KN | Tóm tắt |
|------|------|----------|----|---------|
| 2026-08-29 | `_template` | — | — | Template chuẩn — không phải bug thật |
| 2026-08-29 | `2026-08-29-status-ui` | major | KN-002 | Trang STATUS www/ giao diện chưa hợp lý — registry sai, responsive vỡ, thiếu a11y |
| 2026-08-29 | `2026-08-29-rainbow-animated` | major | KN-003 | Rainbow border GlassUI không xoay ở một số browser |
| 2026-08-30 | `2026-08-30-grid2-rainbow-hover` | minor | KN-004 | grid-2 thừa khoảng cách + rainbow border www không xoay khi hover |
| 2026-08-30 | `2026-08-30-bug-blindness` | major | KN-005 | Bug Blindness — mù bug do workaround vô thức + fan bias (Dan Luu) |

## Cách tạo bug mới (thủ công nếu không dùng /fixbug)

```bash
# 1. Tạo folder
mkdir -p .agent/bugs/2026-08-29-my-bug

# 2. Copy template
cp .agent/bugs/_template/bug.md .agent/bugs/2026-08-29-my-bug/bug.md

# 3. Điền Reproduce + Root Cause → Fix → Verify → Learn

# 4. Cập nhật docs/knowleged.md (KN-XXX)
```

## Liên kết

- Knowledge dài hạn: `docs/knowleged.md` — **BẮT BUỘC đọc trước mọi task** (`.github/instructions/knowleged.instructions.md`)
- Prompt: `.github/prompts/fixbug.prompt.md` (`/fixbug`)
- Instruction: `.github/instructions/knowleged.instructions.md` (`applyTo: **`)

---
*Maintained by /fixbug + YUNIE — Harness v2*
