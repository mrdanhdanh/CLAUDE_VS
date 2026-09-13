# Design mini — Summary tiếng Việt (AI News)

## Hành vi
```
Card render → summary nào đã có VI (cache | summaryVi) → hiện VI ngay
            → chưa có & là tiếng Anh        → hiện EN ngay, xếp hàng dịch nền
Queue (1 req/lần, gap 1.5s) → dịch → lưu cache → swap text tại chỗ (mọi card trùng id)
Fail/hết quota → giữ EN, 1 toast báo, dừng queue (fail-open)
```

## States của summary
| State | Hiển thị | Dấu hiệu |
|-------|----------|----------|
| Chưa dịch | EN gốc | `lang="en"` (a11y) |
| Đã dịch | VI | chip `🇻🇳` (CSS ::before) + `title="Bản gốc: …"` |
| Tiếng Việt sẵn (curated) | VI | không xử lý (heuristic dấu tiếng Việt) |
| Fail | EN gốc | không dấu hiệu, không retry storm |

## Tokens / UI
- Không thêm màu/font mới — chỉ rule nhỏ trong `ai-news.css`, reuse `.news-summary`.
- Chip = text pseudo-element, không ảnh hưởng layout (inline).
- Không animation mới → không đụng reduced-motion.

## A11y
- `lang="en"` cho summary chưa dịch; gỡ khi thành VI (trang đã `lang="vi"`).
- Tooltip bản gốc để đối chiếu (Grice Quality — không giấu bản gốc).
