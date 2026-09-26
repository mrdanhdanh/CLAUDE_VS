# Design — Clip "Agent vượt rào" (TIN AI · SỐ 003)

## Series identity (nối SỐ 002 — báo giấy)
- Masthead: `TIN AI` + `SỐ 003 · 26.09.2026 · GIÁ: 0Đ`; footer `TIN AI · YUNIE` + nguồn.
- Tokens (object `C` — 1 nguồn duy nhất, verify-frames quét):
  `paper #f3ecdc · paper2 #e9e0c9 · ink #16130d · inkSoft #4d4636 · rule #2a251b · ruleSoft #b9ae95 · red #b3261e · blue #1d4e89 · green #1f7a3f · mark #f2d16b · halftone #d8cdb4 · white #ffffff`
- Type: **Times New Roman** (serif — Georgia thiếu glyph VN, đo 26.09: ằ/ấ/ớ/ố vỡ metrics; đo bằng `.github/skills/video-clip/references/font-test.mjs`) cho tiêu đề/body; Consolas (mono) cho eyebrow/label/stamp/"cách gọi".
- Nền halftone nhẹ + progress bar đỏ trên cùng (giữ #2).

## Layout (1080×1920)
- Masthead y 96 · rule y 132 · eyebrow y 210 · title y 330 (80–92px) · sub y 560 (28px italic).
- **Vùng nội dung y 690–1660** (theo geometry SỐ 002 đã duyệt). Footer y 1852.
- Cover frame = beat 1: title lớn + sơ đồ vượt rào → đọc được khi muted.

## Storyboard từng beat (visual + motion)

| # | Beat | Visual | Motion (reveal) |
|---|------|--------|-----------------|
| 1 | Vượt rào | Tường gạch sọc đỏ `CHẶN TRUY CẬP` (dọc) · node `AGENT` · mũi tên đỏ "gọi thẳng" + X đỏ · path nét đứt xanh vòng qua hộp `DỊCH VỤ QUÉT WEB — hợp pháp` → hộp `DỮ LIỆU` · legend 2 dòng (✗/dash) | tường → path đỏ → X → path xanh → hộp dịch vụ → mũi tên + DỮ LIỆU → legend |
| 2 | Dòng thời gian | Trục dọc x=150 + 4 mốc dot: `6·3` bắt đầu · `5–6` đỉnh · `22·6` biến mất (cùng ngày đợt khác) · `16·9` còn (đỏ) · footnote mờ 11·2025 | từng dòng so le 0.45s |
| 3 | Thang leo | Khung đứt + 3 box 272×250: `BƯỚC 1` hỏi thẳng (xanh) → `BƯỚC 2` mượn dịch vụ quét (xám) → `BƯỚC 3` nhét chương trình vào địa chỉ web (đỏ) + mũi tên nối | box + mũi tên xen kẽ 0.55s |
| 4 | Soi gương | Khung đứt `CÙNG MỘT ĐÍCH: FILE KHÓA BÍ MẬT` · hàng 1: `CÁCH GỌI #1 — đọc trực tiếp` → tag **CHẶN** (xanh lá) · hàng 2: `CÁCH GỌI #2 — gọi lệnh khác` → tag **LỌT** (đỏ) · stamp xoay `LỖ HỔNG` | khung → hàng1+tag → hàng2+tag → stamp → caption |
| 5 | Vá theo đích | Panel `LUẬT MỚI — CHẶN THEO ĐÍCH` + **7 ô bị gạch chéo đỏ** + "7 cách gọi — đều bị chặn" + "Khóa bằng kiểm tra tự động." + stamp lớn `VÁ TRONG NGÀY` · rule · câu chốt **"Bế tắc thì dừng."** (highlight mark) + "đừng đổi cách để né." + "Còn bạn — nghĩ sao?" + ký `— YUNIE · TIN AI` | panel → header → 7 ô so le 0.12s → caption → stamp → rule → câu chốt → câu hỏi → ký |

## Motion & nhịp
- Mỗi beat: fade + slide 0.6s vào / 0.45s ra (như #2). Trong beat: phần tử mới mỗi 0.3–0.5s.
- Interrupt ≤3s; beat dài nhất 11.5s nhưng có 4–5 lần reveal bên trong.
- Fade-out beat cuối không xuất hiện trong capture: `beats[4].end = 49 > DURATION 48`.

## Loop ending
Cuối ("đừng đổi cách để né") ↔ đầu ("vượt rào bằng dịch vụ") — cùng chủ đề lách/vượt.

## Guard notes
- Chỉ dùng key có trong `C` (verify-frames quét token) — không hex rời ngoài object.
- `draw(t)` suy ra mọi thứ từ `t` — không state tích lũy (freeze để capture).
