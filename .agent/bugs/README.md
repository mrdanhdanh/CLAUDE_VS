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
| _Thêm dòng mới sau mỗi bug_ | | | | |

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
