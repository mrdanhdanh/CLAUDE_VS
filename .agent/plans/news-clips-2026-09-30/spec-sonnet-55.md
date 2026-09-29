# Spec — Clip `sonnet-55` (45s · 9:16) — "Model chơi xong Pokémon Red chỉ bằng màn hình"

> Dùng cùng token + luật layout/motion trong `design.md`. Font Segoe UI/Arial. Contract `window.__clip`.
> Beat mốc: **0 · 5 · 12 · 21 · 30 · 38 · hết 45** (khớp `voiceover-segments.json`).

## Hook portfolio (chọn A — đang dùng trong VO)

| # | Archetype | Hook | Vì sao |
|---|-----------|------|--------|
| **A** | Wow + cụ thể | "Có model vừa chơi xong Pokémon Red — chỉ bằng cách nhìn màn hình." | Hình ảnh + thành tích dễ hiểu, không cần biết AI |
| B | Self-relevance | "Bạn đang trả tiền cho model cũ? Bản mới nhanh hơn ba mươi phần trăm." | Tốt nhưng cần người xem đã dùng API |
| C | Số liệu | "Điểm lập trình nhảy từ mười phẩy ba lên bảy mươi phẩy sáu phần trăm." | Số gây sốc, giữ làm caption A/B |

## Beat sheet + chữ trên hình

| # | at–end | VO (tóm) | Chữ trên hình | Màu nhấn |
|---|--------|----------|---------------|----------|
| 1 | 0–5 | "Có model vừa chơi xong Pokémon Red — chỉ bằng cách nhìn màn hình." | eyebrow `TIN AI · SẢN PHẨM · 28.09.2026` · title `Model này vừa chơi xong\nPOKÉMON RED` · sub `chỉ bằng cách nhìn màn hình — không bàn phím` · khung màn hình 8-bit (lưới pixel + chấm đỏ) + chip xanh `✓ BEAT GAME FROM SCREENSHOTS` | xanh |
| 2 | 5–12 | "Đó là Claude Sonnet 5.5, ra mắt hôm hai tám tháng Chín, nhanh hơn bản cũ ba mươi phần trăm." | eyebrow `RA MẮT 28.09` · title `Claude\nSonnet 5.5` · panel thông số: `NHANH HƠN +30%` (gauge/thanh) + chip `ANTHROPIC` | cyan + amber |
| 3 | 12–21 | "Theo Anthropic, điểm lập trình tự động tăng từ mười phẩy ba lên bảy mươi phẩy sáu phần trăm." | eyebrow `ĐIỂM LẬP TRÌNH TỰ ĐỘNG · TERMINAL-BENCH 4.0` · 2 thanh so sánh: `SONNET 5 — 10,3%` (xám, ngắn) vs `SONNET 5.5 — 70,6%` (xanh, dài) — thanh dài trượt ra t≈15 · note dim `số do Anthropic công bố` | xanh + dim |
| 4 | 21–30 | "Giá vẫn hai đô một triệu chữ vào — nhưng mỗi việc rẻ hơn tới ba mươi phần trăm." | eyebrow `GIÁ` · số lớn amber `$2` + label `/ 1 TRIỆU CHỮ VÀO` · hàng xanh `MỖI VIỆC RẺ HƠN TỚI 30%` + note dim `vì dùng ít chữ hơn cho cùng việc` | amber + xanh |
| 5 | 30–38 | "Đây là bản Sonnet đầu tiên có hàng rào an ninh mạng. Bản nhỏ Haiku sẽ ra trong vài tuần." | eyebrow `AN TOÀN & LỘ TRÌNH` · hình khiên đơn giản + `LẦN ĐẦU: HÀNG RÀO AN NINH MẠNG Ở DÒNG SONNET` · chip dim `TỚI TỪ OPUS 5.5` · dòng roadmap (t≈35.5): `HAIKU 5.5 — VÀI TUẦN TỚI` | cyan + xanh |
| 6 | 38–45 | "Bạn đang dùng Sonnet để code? Đổi hay ở lại?" | eyebrow `CÒN BẠN?` · title `Đổi hay ở lại?` · 2 panel VS: xanh `ĐỔI — nhanh hơn, rẻ hơn` / dim `Ở LẠI — quen tay, ổn định` · CTA `Bạn đang dùng model nào để code? 👇` · footer `anthropic.com/claude-sonnet-5-5` + frame cuối về tông cover (loop) | xanh + cyan |

## Claim ledger

| Claim | Nhãn | Nguồn |
|-------|------|-------|
| Terminal-Bench 4.0: 70,6% (Sonnet 5: 10,3%), dưới Opus 5.5 ~2 điểm ở GDPval-AA | **A** | https://www.anthropic.com/claude-sonnet-5-5 (verify trực tiếp 30.09) |
| Nhanh hơn 30%+, rẻ hơn tới 30%/task, giữ giá $2/$10 mỗi 1M token | **A** | idem |
| Model Sonnet đầu tiên thắng Pokémon Red chỉ bằng screenshot | **A** | idem ("first Sonnet model to beat Pokémon Red working only from screenshots") |
| Sonnet đầu tiên có cyber safeguard; Haiku 5.5 "trong vài tuần" | **A** | idem |
| Phản ứng cộng đồng (HN 857 điểm / 590 comment; "ra model như Netflix") | **B** | Hacker News thread (Algolia API) |

> Lưu ý trung thực: 10,3% → 70,6% là số **do Anthropic công bố** cho 2 phiên bản khác nhau của cùng bài test — trên hình phải có note "số do Anthropic công bố" (đã có ở beat 3).

## Motion & cắt chữ

- Interrupt: lưới pixel (0) → cut (5) → gauge +30% (7) → cut (12) → thanh 10,3% (13.5) → thanh 70,6% (15) → cut (21) → số $2 (23) → cut (30) → khiên (32) → roadmap (35.5) → cut (38) → panel VS (40) → CTA (42).
- Nếu timing guard fail: cắt "Theo Anthropic," (beat 3) → "Bản nhỏ Haiku sẽ ra trong vài tuần." (beat 5).
