# Color — Role system · semantic · contrast nền động · palette formula

> Màu không phải trang trí — màu là **ngôn ngữ**. Mỗi màu một vai, vai cố định qua mọi clip → kênh có nhận diện.

## 1. Role system (thứ tự quan trọng)

| Vai | Token điển hình | Ví dụ (Deep Console) | Quy tắc |
|---|---|---|---|
| Nền sâu | `bg0` | `#04070d` | tối nhất; 60% diện tích |
| Nền phụ | `bg1` | `#081120` | dải/panel chìm |
| Surface | `panel` / `panel2` | `#0d1830` / `#122040` | thẻ, row, chip |
| Line | `line` | `#24365c` | viền, grid, track |
| Chữ | `ink` / `muted` / `dim` | `#eef4ff` / `#93a7cc` / `#5f7396` | chính / phụ / trang trí (dim không chở info) |
| Accent kênh | `accent` | `cyan #4fe3e0` | 1 màu nhận diện — cố định cho kênh |
| Semantic | success/warn/danger/info | green / amber / red / blue | nghĩa cố định (bảng §3) |
| Phụ | `violet` | `#b18cff` | tối đa 1 màu phụ, một mục đích |

Phân bố **60-30-10**: 60% nền · 30% panel + chữ · 10% accent. Vượt 10% accent = loãng.

## 2. Contrast trên video (khác web — nền động)

- Text thiết yếu ≥ **4.5:1** với **nền hiệu dụng** = nền + hiệu ứng tại khung xấu nhất (code rain, grid, glow), không phải nền tĩnh.
- Không đạt → thêm **scrim** (rgba đen 0.55–0.75) hoặc panel đặc trước chữ. Không đổi màu chữ thành màu khó đọc hơn.
- Không truyền tin **chỉ bằng màu** — kèm chữ (CRITICAL/HIGH) hoặc icon.
- Ví dụ đã đo thật (clip openai-hf-hack): ink 17:1 · muted 7:1 · amber 9:1 · red 5.5:1 — ghi tỉ lệ vào `design.md` mỗi clip.
- Cặp màu tránh: đỏ tươi `#ff0000` trên đen tuyền (rung mắt — dùng `#ff5d73`) · vàng trên trắng · xanh navy đậm trên đen.
- Test: brightness 30% · xem ở 375px · người không biết trước nội dung.

## 3. Semantic language (chuẩn hoá toàn kênh)

| Nhãn | Nghĩa | Màu |
|---|---|---|
| **A · OFFICIAL** | nguồn gốc, docs chính thức | green `#5dfc9b` |
| **B · CROSS-CHECKED** | 2+ nền tảng xác nhận (chưa benchmark độc lập) | blue `#5b8cff` / cyan |
| **C · COMMUNITY** | cộng đồng/aggregator | amber `#ffc857` |
| **D · RUMOR** | tin ngầm, chưa kiểm chứng | violet `#b18cff` |
| **CRITICAL / cảnh báo** | rủi ro | red `#ff5d73` |
| **CTA** | hành động | accent kênh hoặc orange |
| **Đối tượng phụ** | node/mascot | 1 màu riêng duy nhất |

- Mã màu theo **loại beat**: hook = accent mạnh · số liệu = amber · xác nhận = green · quy trình = blue/cyan · đối tượng phụ = violet.
- Giữ nguyên nghĩa qua mọi clip — người xem quen là đọc được không cần chú thích.

## 4. 3 công thức palette (chọn theo loại nội dung)

| # | Tên | Nền | Accent chính | Semantic | Dùng cho |
|---|---|---|---|---|---|
| 1 | **Deep Console** | `#04070d` / `#081120` | cyan `#4fe3e0` | green/amber/red/blue/violet | AI · security · forensics · tin kỹ thuật (precedent: openai-hf-hack) |
| 2 | **Terminal Mint** | `#070a12` / `#101827` | green `#55e6a5` | amber/blue/red + pink mascot | tool · repo · model free · review sản phẩm (precedent: space-bunny) |
| 3 | **Editorial Warm** | `#0f0d0a` / `#1a1613` | amber `#ffb454` | green/red/blue dịu | đọc vị · quan điểm · kể chuyện |
| + | **Neon Pop** (khi giải trí) | gần đen | 2 accent bão hoà | — | trend · meme · giải trí |

Quy tắc chọn: 1 accent kênh cố định + semantic cố định; **chỉ đổi nền family khi đổi series**.

## 5. Series identity

- **Bất biến:** nền + typography + HUD + accent kênh + footer brand.
- **Biến thiên:** accent chủ đề theo tập (ví dụ hồ sơ đỏ ↔ điều tra cyan) — vẫn trong palette.
- Cover dùng accent mạnh nhất; **frame cuối về tông cover** (loop).
- Grid profile: luân phiên 3 mẫu cover (stack/VS/số liệu) — không trùng một kiểu.
- Danh sách đen AI-tell: gradient tím mặc định · glow hồng vô nghĩa · rainbow >3 hue · pastel nhạt trên nền tối (bùn).

## 6. Sai lầm thường gặp

- ❌ >2 accent khác nghĩa trong 1 khung → loãng, mắt không biết nhìn đâu
- ❌ Màu chỉ để đẹp, không có nghĩa cố định → người xem không học được hệ
- ❌ Đo contrast trên nền tĩnh rồi thả chữ lên nền động
- ❌ Đổi nghĩa màu giữa các clip (hôm nay đỏ = nguy hiểm, mai đỏ = CTA)
- ❌ Dùng màu làm kênh thông tin duy nhất (mù màu ~8% nam giới)

## Checklist màu

- [ ] Đúng 1 accent kênh + bộ semantic cố định; tỉ lệ 60-30-10?
- [ ] ≤2 accent đồng thời trong khung?
- [ ] Contrast đo với nền hiệu dụng ≥4.5:1; tỉ lệ ghi vào design.md?
- [ ] Nền động có scrim/panel cho chữ?
- [ ] Không có AI-tell (purple gradient, rainbow, glow vô nghĩa)?
- [ ] Frame cuối về tông cover?

---
*Reference của skill clip-craft. Ví dụ số dựa trên 2 clip thật trong repo.*
