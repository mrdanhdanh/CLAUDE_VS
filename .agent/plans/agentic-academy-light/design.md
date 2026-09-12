# Design — Light theme (Agentic Academy)

## Palette light (thal chiếu từ dark, giữ accent)

| Token | Dark (hiện tại) | Light (mới) | Ghi chú |
|-------|-----------------|-------------|---------|
| `--bg` | `#0b0b10` | `#f5f7fb` | nền chính |
| `--bg-soft` | `#12121a` | `#eef2f8` | |
| `--panel` | `rgba(255,255,255,.035)` | `rgba(15,23,42,.035)` | đảo cực |
| `--panel-2` | `.06` trắng | `rgba(15,23,42,.06)` | |
| `--line` | `.09` trắng | `rgba(15,23,42,.12)` | |
| `--line-2` | `.18` trắng | `rgba(15,23,42,.22)` | |
| `--ink` | `#f2f3f7` | `#0e1a26` | heading |
| `--body` | `#b9bdc9` | `#3c4a5c` | body — contrast ~8.9:1 |
| `--mute` | `#8b90a0` | `#5d6b7e` | ~5.2:1 |
| `--link` (mới) | `#00d992` | `#067a55` | link/eyebrow cần contrast ≥4.5 |
| `--card-grad` (mới) | trắng 4.5%→1.2% | `#fff → #f8fafc` | thay 6 chỗ literal |
| `--track` (mới) | trắng 9-18% | `rgba(15,23,42,.12)` | ring/bar/dots |
| `--shadow` | đen 45% | `rgba(15,23,42,.08)` | shadow nhẹ |
| accent k1-k7 | giữ nguyên | giữ nguyên | chip text dùng `color-mix(accent 55-60%, ink)` để đủ contrast |

**Nguyên tắc:** accent là hằng số thương hiệu — chỉ giảm bão hòa khi làm **text** (color-mix với ink), không đổi khi làm **nền/border**.

## Thành phần phải override riêng (hardcoded trong base)

- Header/deck-top/deck-bar: nền `rgba(11,11,16,…)` → `rgba(245,247,251,.85)`
- `code` inline, `.cover-num` (số mờ), `.hero-grid-bg` (lưới), orb opacity
- SVG diagram: `.dg text.*` (5 mức), `.box`, `.box.dead/.chip`, `.flow/.flow.arrow` — đảo sang mực đậm
- Chip trạng thái: `#7ef5c8` → `#047857`; `.file-table td:first-child`, `.crit li::before`, `.icon-btn[aria-pressed]`
- Toast (giữ nền tối cho tương phản — pattern phổ biến)
- `body.deck` radial gradient nền theo `var(--bg)`
- `.lesson-card:hover` shadow riêng cho light

## Cơ chế (KN-006)

- `data-theme` trên `<html>`; bootstrap inline trong `<head>` **trước stylesheet** (chống flash) → đọc localStorage, fallback `prefers-color-scheme`.
- `store.js`: `theme.current/set/toggle` + tự bind mọi `[data-theme-toggle]` + `paintThemeBtns()` (aria-pressed + icon ☀↔☾ + aria-label).
- Nút: `.icon-btn` id `themeBtn` (cả 2 trang cùng id, mỗi trang 1 nút).

## Test (spec 9-10)

9. Toggle + persist F5 + đồng bộ home↔deck; contrast dark ≥4.5; screenshot dark.
10. Không lưu → theo hệ thống (light khi emulate light); contrast light ≥4.5; screenshot light home + deck.
