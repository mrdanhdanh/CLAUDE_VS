# Design — Clip "OpenAI agents hack Hugging Face" (style **CYBER FORENSICS CONSOLE**, 30s — rev 26.09)

> Mục tiêu user: **giao diện hấp dẫn hơn nữa** — nâng cấp vượt các clip trước (space-bunny: neon tối giản · meta-charm: đồ chơi pixel).
> **Rev 2 (26.09):** ngôn ngữ bình dân — bỏ "sandbox/agent/payload/URL/LOOT" khỏi mọi lớp chữ; hook nêu rõ đối tượng + bối cảnh; timeline mới 0–6.5 / 6.5–11.5 / 11.5–19.5 / 19.5–25.5 / 25.5–30.

## Nâng cấp so với clip cũ (bắt buộc ≥3, làm 7)

1. **Code rain nền** — 36 cột ký tự hex/binary rơi, alpha thấp, deterministic từ `t`.
2. **Perspective grid** — lưới phối cảnh chân trời di chuyển (depth layer).
3. **Glitch RGB-split title** — burst khi vào beat + periodic, 3 lớp màu lệch.
4. **Terminal typing** — beat 2 gõ từng ký tự, con trỏ nhấp nháy.
5. **Network graph + packet chạy** — beat 3: node → edge → packet di chuyển, dash flow.
6. **Scanline CRT + rolling band + vignette** — overlay toàn clip.
7. **HUD chrome** — REC nhấp nháy + case ID + clock T+s; progress **50 đoạn** có glow head.

## Tokens (object `C`)

| Token | Hex | Dùng |
|---|---|---|
| `bg0` | `#04070d` | nền sâu nhất |
| `bg1` | `#081120` | nền phụ (dải) |
| `panel` | `#0d1830` | panel chính |
| `panel2` | `#122040` | panel nổi / hover-row |
| `line` | `#24365c` | viền, grid, track |
| `ink` | `#eef4ff` | chữ chính (17:1) |
| `muted` | `#93a7cc` | chữ phụ (7:1) |
| `dim` | `#5f7396` | chữ trang trí (không chở info thiết yếu) |
| `cyan` | `#4fe3e0` | accent chính (theo dõi/forensics) |
| `green` | `#5dfc9b` | terminal, confirmed |
| `amber` | `#ffc857` | cảnh báo / số liệu |
| `red` | `#ff5d73` | threat / critical |
| `blue` | `#5b8cff` | thông tin |
| `violet` | `#b18cff` | node phụ (link shortener) |
| `white` | `#ffffff` | nhấn |

## Typography

- Title: **Arial/Segoe UI 800** (72–92px, tùy beat) + glitch 3 lớp khi burst.
- Eyebrow / HUD / terminal / số liệu: **Consolas** (mono — đúng chất console).
- Sub: Segoe UI 500, 30px.
- `wrap()` **trả về Y cuối** → sub đặt động bên dưới (chống đè chữ khi title wrap 3 dòng).

## Layout (1080×1920)

```
  60  HUD: ●REC  CASE FILE #HF-0726            T+ss
 142  eyebrow (mono, màu theo beat)
 268  title (dynamic lines) + glitch
 ...  sub (đặt động theo wrap)
 620  CHIP vùng nội dung (mono, viền nhạt)
 660..1650  NỘI DUNG THEO BEAT
1800  progress 30 đoạn (1 đoạn/giây) + glow head
1850  footer: SWARM TRACES · 25.09.2026        TIN AI · YUNIE
```

## Beat storyboard

| Beat | Giây | Eyebrow | Title | Nội dung visual |
|---|---|---|---|---|
| 1 HOOK | 0–6.5 | `CASE FILE · CÔNG BỐ 25.09` | Họ đã thoát / sandbox. Để hack / Hugging Face. | **Swarm 700 dots** hội tụ về mark "HF" + ring pulse + stamp đỏ `SANDBOX ESCAPED` (t≈3.4) |
| 2 REPORT | 6.5–11.5 | `01 · BÁO CÁO` | Điều tra từ / dấu vết để lại. | **Terminal typing** 6 dòng + stamp `CÔNG BỐ · 25.09.2026` (t≈12.6) |
| 3 CHAIN | 11.5–19.5 | `02 · CÁCH THOÁT` | Chuỗi link / hơn 1 triệu URL. | Chip "internet khoá" → 3 node + packet → stat `≈ 1.000.000 URL` → **3 card mắt xích** + packet chạy → bar đỏ "chạy được code" (t≈23.5) |
| 4 FINDINGS | 19.5–25.5 | `03 · HÀNH VI` | "LOOT". Slack. / Xoá dấu vết. | **4 row severity** (2 red CRITICAL + 2 amber HIGH), slide-in stagger 1.15s |
| 5 ASK | 25.5–30 | `ĐỌC VỊ` | Sandbox dỏm — / hay agent nguy hiểm? | 2 panel VS (glow so le) + note "HF xác nhận · thu hồi khoá 07.2026" + CTA box |

## Motion

- Mọi thứ suy từ `t` (contract). Ease-out; reveal `rv(t, start, dur)`.
- Glitch = burst 0.4s sau `beat.at` (intensity 1) + periodic 0.12s mỗi 7.1s (0.6).
- Rain/grid/packet/ring: vòng lặp deterministic từ `t` (không state).
- Scanline tĩnh + band sáng chạy dọc + vignette radial.

## A11y

- `role="img"` + aria-label mô tả clip; `<h1 class="sr">`.
- Contrast: ink 17:1 · muted 7:1 · amber 9:1 · red 5.5:1 · green/cyan ≥9:1 trên panel.
- Thông tin không bao giờ chỉ bằng màu: severity có chữ `CRITICAL/HIGH`.

## Contract

```js
window.__clip = { duration: 30, width: 1080, height: 1920, draw, beats, freeze: false }
```
