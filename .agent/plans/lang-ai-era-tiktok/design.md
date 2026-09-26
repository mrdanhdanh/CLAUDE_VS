# Design — Clip "Cha đẻ Elixir: AI viết code — ngôn ngữ cho ai?" (50s · **SYNTAX ATLAS** · rev 2)

> Series: **TIN AI · YUNIE** (HUD REC + footer giữ nguyên = series identity).
> Nâng cấp so với clip trước (`openai-hf-hack`, cyber-forensics): **subtitle burned-in · safe-zone fix · morph field · fragmentation · token boxes · SQL/trace panel · syntax rain đa ngôn ngữ · beat ticks**.

## Nâng cấp so với clip cũ (≥3 — làm 8)

1. **Subtitle burned-in** — lời voiceover hiện dưới cùng (scrim riêng) → xem được khi **muted**; đổi câu = pattern interrupt tự nhiên.
2. **Safe-zone FIX** — progress + footer kéo lên **y 1546/1592** (clip trước để 1800–1852 = vô hình trên app, đúng lỗi craft đã ghi).
3. **Morph field** — `DÀNH CHO: [LẬP TRÌNH VIÊN]` bị gạch đỏ → gõ lại `[AI AGENT]` + caret (beat 1).
4. **Fragmentation constellation** — 1 hub "thư viện chung" + 40 vệ tinh → vỡ thành 27 hub riêng (beat 2).
5. **Token boxes** — code `user?.address?.city` tan thành các box token (beat 3).
6. **SQL panel + trace stream** — mini-visual trong 2 card đề xuất (beat 4).
7. **Syntax rain đa ngôn ngữ** — cột glyph trộn (`fn def λ |> { } </>`) thay code rain nhị phân.
8. **Beat ticks** — progress bar có vạch chia beat + nhãn số beat.

## Tokens (object `C`)

| Token | Hex | Dùng |
|---|---|---|
| `bg0` | `#06070f` | nền sâu nhất |
| `bg1` | `#0b0f1f` | nền phụ / stamp |
| `panel` | `#111735` | panel chính |
| `panel2` | `#161d42` | panel nổi / chip |
| `line` | `#28315e` | viền, grid, track |
| `ink` | `#eef0ff` | chữ chính (16:1 trên panel) |
| `muted` | `#9aa3cf` | chữ phụ (7:1) |
| `dim` | `#666f99` | chữ trang trí (không chở info thiết yếu) |
| `violet` | `#b18cff` | accent chính (ngôn ngữ/thiết kế) |
| `cyan` | `#5fd4ff` | accent phụ (agent/tooling) |
| `green` | `#5dfc9b` | xác nhận / "rẻ hơn" |
| `amber` | `#ffc857` | cảnh báo / tension |
| `red` | `#ff6b81` | gạch bỏ / rủi ro |
| `pink` | `#ff8ad4` | hub phân mảnh (beat 2) |
| `blue` | `#6f8dff` | thông tin |
| `white` | `#ffffff` | nhấn |

Contrast đo trên `panel` (#111735): ink ≈16:1 · muted ≈7:1 · violet ≈7:1 · cyan ≈9:1 · green ≈11:1 · amber ≈9:1 · red ≈6:1 — đều ≥4.5:1.

## Typography

- Title: **Arial 800**, 72–80px (size riêng từng beat), `wrap()` trả Y cuối → sub đặt động.
- Eyebrow / HUD / data / SQL / trace: **Consolas** 22–28px 700.
- Sub: Segoe UI 500–600, 30px.
- **Subtitle burned-in: Segoe UI 700, 44px**, tối đa 2 dòng, có scrim riêng.

## Layout (1080×1920) — mọi thứ thiết yếu trong hộp 900×1400 (y 260–1660)

```
  62   HUD decor: ●REC  HỒ SƠ #LG-0926        T+ss
 292   eyebrow (mono, màu theo beat)
 366   title (tối đa 3 dòng)
 ...   sub (đặt động theo wrap)
 772–1330  NỘI DUNG THEO BEAT
1330–1500  SUBTITLE burned-in (scrim, bottom-anchored 1500; 1 dòng=92px, 2 dòng=144px)
1546   progress 35 đoạn + beat ticks
1592   footer: DASHBIT.CO · 24.09.2026        TIN AI · YUNIE
1660+  đuôi tối sạch (UI caption của app nổi lên)
```

## Beat storyboard

| Beat | Giây | Eyebrow | Title (xấp xỉ) | Nội dung visual |
|---|---|---|---|---|
| 1 HOOK | 0–6.5 | `Ý KIẾN · 24.09.2026` | `Cha đẻ Elixir hỏi:` / `AI viết code thay người —` / `ngôn ngữ cho ai?` | Field `NGÔN NGỮ NÀY DÀNH CHO:` + `LẬP TRÌNH VIÊN` → gạch đỏ (t≈2.4) → type `AI AGENT` (t≈3.2) + caret; 3 chip teaser `01 CỘNG ĐỒNG · 02 CÚ PHÁP · 03 CÔNG CỤ` (open loop); source chip José Valim · dashbit.co |
| 2 CỘNG ĐỒNG | 6.5–13 | `01 · CỘNG ĐỒNG` | `Thư viện rẻ đi —` / `nhưng còn ai` / `xây chung?` | Constellation: hub trung tâm `1 THƯ VIỆN CHUNG` + 40 dot → t≈9.4 dots bay ra 27 hub nhỏ (3×9); 2 chip đối: `BUILD RẺ HƠN ✓` (green) / `CÙNG BUILD ÍT HƠN ?` (amber) |
| 3 CÚ PHÁP | 13–20 | `02 · CÚ PHÁP & TRÌNH BIÊN DỊCH` | `Cú pháp đẹp —` / `AI không quan tâm.` / `Nó thấy token.` | 2 pane: `NGƯỜI VIẾT` (`user?.address?.city` + ✔) vs `AI ĐỌC` (7 token box, stagger) + gloss `token = mảnh ký hiệu`; dưới: ladder `NGÔN NGỮ → MÃ TRUNG GIAN → MỌI MÁY` + stamp amber `"xây quanh giới hạn hôm nay"` |
| 4 BA ĐỀ XUẤT | 20–29 | `03 · BA ĐỀ XUẤT` | `Vậy nên tối ưu` / `cho cái gì?` | 3 cột card: ① `RÀNG BUỘC` (4 chip: đúng từ thiết kế · kiểm tra tĩnh · chặn lúc chạy · test & fuzz) ② `TRUY VẤN CODE` (SQL box 2 dòng + `symbol · call graph · luồng dữ liệu`) ③ `NHÌN LÚC CHẠY` (trace stream 3 dòng + `agent tự đo, tự chẩn đoán`) |
| 5 HỎI LẠI | 29–35 | `CÒN BẠN NGHĨ SAO?` | `Ngôn ngữ cho AI —` / `cộng đồng cho ai?` | 2 panel VS: `CỘNG ĐỒNG MỞ` (cùng xây · review chéo · chuẩn chung) vs `MỖI NGƯỜI MỘT BẢN` (1000 bản riêng · không ai review); caveat `bài ý kiến cá nhân · dashbit.co · 24.09.2026`; CTA box + `↓` |

## Subtitle (lời voice — burned-in)

| Cửa sổ | Text |
|---|---|
| 0.4–6.5 | Khi AI viết phần lớn code — ngôn ngữ lập trình nên thiết kế cho ai? |
| 6.9–12.9 | Thư viện và công cụ rẻ đi — nhưng còn ai cùng nhau xây chung? |
| 13.4–19.9 | Cú pháp đẹp, gọn gàng — AI không quan tâm: nó chỉ thấy các mảnh ký hiệu. |
| 20.4–24.5 | Ba đề xuất: ràng buộc chặt hơn; truy vấn code như cơ sở dữ liệu. |
| 24.8–28.9 | Và nhìn thẳng lúc chạy — thay vì ngồi debug từng dòng. |
| 29.4–34.8 | Còn bạn: AI viết code — cộng đồng lập trình giữ được gì? |

Render: `SUBS[]` trong index.html — phần tử thứ i hiện khi `t ∈ [at, at+hold)` (hold = tới hết beat), tự wrap 2 dòng 44px, highlight từ khóa (số liệu/khái niệm) bằng `cyan`.

## Motion

- Mọi thứ suy từ `t` (contract `window.__clip`). Ease-out; `rv(t, start, dur)`.
- Glitch RGB-split title: burst 0.4s đầu beat + periodic nhẹ 0.12s mỗi 7.3s.
- Syntax rain rơi 22px/frame-step deterministic; stagger list 0.3–0.4s; interrupt mỗi 2–3s (morph, fragmentation, token stagger, card reveal, subtitle change).
- Không beat nào phẳng >3s: beat 4 (9s) có 2 subtitle + 3 card stagger.

## A11y

- `role="img"` + aria-label 5 phần; `<h1 class="sr">`.
- Mọi info không chỉ bằng màu: chip có chữ (✓/?/VS), severity có nhãn.
- Subtitle 44px + scrim rgba(6,7,15,0.82).

## Rev 2 — 50s (26.09 · feedback: "nội dung hơi ngắn, hiệu ứng hơi lag")

- **7 beat** (was 5): tách 3 đề xuất thành beat riêng (ràng buộc · truy vấn code · nhìn lúc chạy) + thêm facet "ecosystem nhỏ đuổi kịp" (bars) + hàng 5 category chips + 4 lớp bảo đảm + cảnh báo locality + beat tips debug vs trace.
- **Subtitle**: 11 cửa sổ (câu dài tách 2 phần = pattern interrupt tự nhiên), vẫn 2 dòng max @42px.
- **Perf fix (đo bằng guard MỚI `verify-perf.mjs`):** bake nền + ghost glyphs + vignette + dải sáng thành texture; mưa ký tự cache thành strip theo tick 6Hz (36 drawImage thay ~500 fillText); layout chữ + subtitle cache 1 lần; canvas `alpha:false`; progress = 3 lệnh vẽ (track+fill+head) thay 50 đoạn.
  - interval p95 **47.7ms → 18.6ms** (22.9fps → ≈59.6fps) · stall tệ nhất **1111ms → 38.7ms** · command avg **29.6ms → 8.2ms**.
- **Lỗi bắt được khi xem frame (vòng 2):** bar label đè caption → đưa label vào trong bar; dots phase A lộ sớm → gate alpha `dotsA`; chip "Erlang VM" vượt safe zone phải (1019px) → rút text + x 580 (981px).
- Beat ticks nằm trong hộp an toàn: progress 1541–1554 · footer 1592.

## Contract

```js
window.__clip = { duration: 50, width: 1080, height: 1920, draw, beats, subs, freeze: false }
```
