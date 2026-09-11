# Design — COSMOS · QUANTUM Rework (mini)

Design vibe: giữ nguyên `cosmic dark` hiện có (đã đạt visual check). Chỉ polish cục bộ.

## Tokens (không đổi)
- Palette/semantic tokens giữ nguyên (`--cosmos-*`).
- Điểm chạm có token: `--header-h:56px` (cho scroll-margin), `--radius-*`, transition 150–300ms.

## Thay đổi cụ thể
| Vùng | Trước | Sau | Lý do |
|------|-------|-----|-------|
| Reveal (JS) | `threshold:0.12` | `threshold:0` + `rootMargin:'0px 0px -60px 0px'` + scroll-sweep fail-safe | Element > 6500px không bao giờ đạt 12% |
| Card parallax | `el.style.transform=translate3d(0,y,0)` | `el.style.translate='0 Ypx'` (compose với `transform` hover) | Hover lift sống lại, reveal transform không bị đè |
| `.card` hover | `translateY(-3px)` | giữ nguyên + hoạt động lại | — |
| Section anchors | — | `scroll-margin-top: calc(var(--header-h) + 12px)` cho mọi `section[id]` | Không bị header che |
| `.lab-card` | stretch, void đáy | flex column: `lab-body{flex:1;display:flex}`, `lab-demo{flex:1;min-height}` | Void biến thành demo area có chủ đích |
| `.super-card` (stack) | ±36px, không tách tầng | ±44px, rotate ∓7°, back cards `filter:blur(.6px)` + opacity .88, hover clear | 2 card sau đọc như "background" thay vì chữ bị cắt |
| `de-stats` "Điểm đo" | `9` trần | `9<small> điểm</small>` | Nhãn rõ nghĩa |
| Map links (2) | `../../docs/...`, `../../.agent/...` | `https://github.com/mrdanhdanh/CLAUDE_VS/blob/main/...` | Pages không deploy ngoài www/ |

## States coverage (không đổi): hover/focus/active/disabled, loading/empty/error — đã có sẵn.

## A11y
- Reveal fail-safe đảm bảo nội dung không kẹt ẩn (kể cả JS lỗi giữa chừng).
- Không thêm animation mới ngoài scope reduced-motion (blur tĩnh OK).
- Contrast giữ nguyên ≥4.5:1.
