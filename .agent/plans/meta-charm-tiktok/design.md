# Design — Clip #3 "Meta Muse Charm" (style **đồ chơi / pixel-LCD**, 50s)

## Tokens (object `C` — guard quét key thiếu)

| Token | Hex | Dùng cho |
|---|---|---|
| `bg1` | `#ffe3f1` | gradient trên (pastel hồng) |
| `bg2` | `#e3d9ff` | gradient dưới (pastel tím) |
| `soft1` | `#ffd1e6` | blob nền |
| `soft2` | `#cdeedd` | blob nền |
| `plum` | `#46254b` | mực chính |
| `plumSoft` | `#6b4a70` | mực phụ |
| `pink` | `#ff6fb5` | accent chính |
| `pinkDeep` | `#d63a8c` | nhấn đậm |
| `mint` | `#57c9b0` | accent 2 |
| `yellow` | `#ffd166` | accent 3 |
| `lcd` | `#b9c9a8` | màn hình LCD |
| `lcdMid` | `#94a886` | viền LCD |
| `lcdDark` | `#2f3a26` | pixel/text trên LCD |
| `shellA` | `#f7b8d0` | vỏ thiết bị |
| `shellB` | `#d98ab0` | viền vỏ |
| `silver` | `#c9c4d8` | khoen móc khóa |
| `white` | `#ffffff` | — |
| `ink` | `#1f1a24` | chip text |

**Palette 4 chủ đạo:** pastel hồng + tím + plum + pink đậm (accent mint/yellow cho chip). Contrast: plum `#46254b`/bg `#ffe3f1` ≈ 10:1; lcdDark `#2f3a26`/lcd `#b9c9a8` ≈ 7:1 — đủ.

## Typography

- Title: **Trebuchet MS 900** (chunky, thân thiện) + drop-shadow pixel (lệch 5px màu pink)
- Eyebrow: Consolas (chip pill đậm)
- LCD & chip: **Consolas** (giả pixel-terminal)
- Sub: Trebuchet MS 500

## Layout (1080×1920)

```
0..8      progress: 10 ô pixel (hồng = đã xem)
150       eyebrow chip
270..460  title (2 dòng)
550       sub
600       khoen móc khóa (vòng tròn)        ← nhô lên khỏi vỏ
620..1660 VỎ THIẾT BỊ (pastel hồng, viền đậm, radius 120)
  700..1200  MÀN LCD (xanh lá nhạt) — thú pixel "Jolly" sống ở đây
  1240..1590 3 CHIP (mint/yellow/pink) — nội dung theo beat
1852      footer: TIN AI · YUNIE | NGUỒN: TECHRUNCH · META CONNECT — 23.09.2026
```

## Thú pixel "Jolly" (vẽ bằng rects, UNIT=18)

- Thân blob 7×6 unit (3 hàng rect bo góc), 2 ăng-ten, mắt 1×1 (blink theo chu kỳ), má hồng, miệng, 2 chân.
- Bounce: `dy = sin(t*3)*7`. Tim pixel bay lên (beats 1/3/5). Tay vẫy ở beat 5.

## Beat storyboard

| Beat | Giây | Eyebrow | Title | LCD | 3 chip |
|---|---|---|---|---|---|
| 1 HOOK | 0–5 | ĐỒ CHƠI MỚI · META | Meta vừa làm 'bùa AI' / kiểu Tamagotchi. | Jolly to + "MUSE CHARM" + sparkle | — |
| 2 THIẾT BỊ | 5–14 | 01 · THIẾT BỊ | Muse Charm / là cái gì? | Jolly + icon screen/vân tay/ring | Màn hình nhỏ — avatar 'Jolly' · Chạm vân tay là nói — khỏi mở app · Cầm vừa tay · đeo móc khóa |
| 3 VÌ SAO | 14–28 | 02 · VÌ SAO | Meta muốn AI / luôn bên bạn. | Jolly + bong bóng "Chào!" + tim | Avatar + giọng nói real-time · Zuck: 'nhanh nhất để nói với Muse' · Muse vượt ChatGPT thời kỳ đầu (TechCrunch) |
| 4 NÓI RÕ | 28–39 | 03 · NÓI RÕ | Nhưng khoan — / chưa mua được. | "THÁNG 12?" + Jolly nhỏ + "!" | CHƯA BÁN — mới demo, hẹn tháng 12 · CHƯA CÔNG BỐ GIÁ · 'Bùa AI' đã thành cliché (Friend…) |
| 5 KẾT | 39–50 | CÂU HỎI | Bạn có đeo / bùa AI không? | Jolly vẫy tay + "ĐEO KHÔNG?" + tim | — |

## Motion

- Mọi thứ suy từ `t`; ease-out; progress = ô pixel; confetti xoay chậm; LCD cross-fade theo beat (in/out 0.6s).

## A11y

- `role="img"` + aria-label; `<h1 class="sr">`; tương phản đạt; số liệu/chip luôn kèm chữ.

## Contract

```js
window.__clip = { duration: 50, width: 1080, height: 1920, draw, beats, freeze: false }
```
