# Design — clip "ĐỌC VỊ · ADS" · 1080×1920 · 50s

> Series identity kế thừa clip ĐỌC VỊ trước (đã chuyển vào `www/Clip/age-of-giants/`): cùng nền navy tối, cùng HUD/REC/progress, cùng cỡ chữ. Khác ở hệ visual (pipeline/data thay vì lửa/bóng người) + HUD `ĐỌC VỊ · ADS`.

## 1. Tokens (một object `C` duy nhất — guard verify-frames quét)

```
bg0 #04070d · bg1 #081120 · panel #0d1830 · panel2 #122040 · line #24365c
ink #eef4ff · muted #93a7cc · dim #5f7396 · white #ffffff
cyan #4fe3e0 (dòng dữ liệu) · amber #ffc857 (giá trị/tiền) · green #5dfc9b (chạy được — kể cả "chạy được giả")
red #ff5d73 (rủi ro/lỗi/cổng) · violet #b18cff (agent/harness) · pink #ff9ecb (người/quyết định)
```

**Semantic cố định:** xanh lá = "thành công/chạy được" (kể cả thành công GIẢ — đối chọi ô đỏ), đỏ = rủi ro, cyan = dữ liệu, amber = tiền/giá trị, violet = agent/harness, pink = con người.

`TONES` (màu eyebrow + highlight sub theo beat): `[red, cyan, amber, green, violet, red, pink]`.

## 2. Layout (kế thừa convention series — đã kiểm qua clip trước)

```
y  62     HUD: ● REC · 'ĐỌC VỊ · ADS' · 'T+XXs'            (trang trí)
y  250    thanh màu 22×6 + eyebrow (Consolas 26, TONES)
y  280–780  VÙNG VISUAL theo beat (scene vẽ trong đây)
y  800+   headline (Arial 800, size 78–84, line 1.06, max 810, cache)
y  1100+  sub (Segoe UI 500, 30, max 810, cache)
y  1420   đáy hộp subtitle (burned-in 44px Segoe 700, box 810×r22 rgba(4,7,13,.82), highlight TONES)
y  1474–1506 progress: tick giây + vạch beat + fill
y  1560   footer: 'HACKERNOON · 27.09.2026 · QUAN ĐIỂM' · 'CLIP · YUNIE'
────────  y 1660 = đáy an toàn — dưới đây không đặt gì thiết yếu
```

Font whitelist: Arial · Segoe UI · Consolas (KN-082 — KHÔNG Georgia).

## 3. Beats + scene (mọi thứ suy từ `t`)

Xem bảng beat trong `prd.md` §Beat sheet. Visual từng beat:

- **S0 · Nghịch lý (0–6.5):** query card 3 dòng gõ dần → mũi tên chảy xuống chip `RUNTIME` → hàng kết quả; **t≈2.8** dấu tick xanh "PASS" đóng xuống (scale-in) trong khi 1 ô kết quả nháy đỏ — interrupt chính. Quét sáng chạy qua card.
- **S1 · Người dùng đổi (6.5–13):** 2 card `SNOWFLAKE`/`DATABRICKS` → 2 mũi tên hội tụ về node `AGENT` (violet) **t≈8.5**; 4 chip CONTEXT · CAPABILITY · GOVERNANCE · EXECUTION hiện stagger 9–12; silhouette người mờ dần ở đáy.
- **S2 · Khan hiếm đổi (13–19.5):** 2 cột. Trái: SQL/DAG/CONFIG + tag giá "→ 0đ" rơi xuống, mờ đi. Phải: CONTEXT/KIỂM CHỨNG/GOVERNANCE/TRÁCH NHIỆM trồi lên + glow. Interrupt ~16.3: cột phải pulse viền.
- **S3 · Thang đúng (19.5–27):** 4 tầng thang từ trên xuống: NGHIỆP VỤ ĐÚNG (?) / DỮ LIỆU ĐÚNG / CHẠY ĐƯỢC / CÚ PHÁP. Tick hiện từ đáy lên 20.2→21.6; tầng đỉnh nháy "?" từ 22.3; 3 chip biến thể `TIỀN ĐƠN / ĐÃ THU / GHI NHẬN` bay vào 23.5–25.5 quanh dấu "?".
- **S4 · 5 tầng (27–34.5):** 5 slab: Ý ĐỊNH / ĐIỀU KHIỂN / NGỮ NGHĨA / **HARNESS** (viền dày) / RUNTIME. Chấm violet rơi từ đỉnh 29.5→32; đường thẳng đỏ nét đứt bị **✗** tại tầng harness; đường đúng rẽ qua harness (hiện 3 chip policy ✓ / validate ✓ / audit ✓ trên slab) rồi mới xuống runtime.
- **S5 · Cổng + rủi ro (34.5–42):** hàng 7 cổng (2 trụ + lanh tô) tick stagger 35.2→38 — nhãn nhỏ dưới 3 cổng: `Ý ĐỊNH` `KIỂM CHỨNG` `AUDIT`; dưới: thang 4 mức rủi ro `AUTO(green) → NOTIFY(cyan) → APPROVE(amber) → BLOCK(red)`; dòng chấm violet chảy qua, phần lớn qua AUTO, 2–3 chấm dừng ở APPROVE/BLOCK (interrupt ~39).
- **S6 · Đổi vai + loop (42–50):** chip `SQL WRITER` (mờ) → path cong → 3 card `CONTEXT` `SKILL` `POLICY` hiện stagger 43.5–46.5 → chữ ký `— designer`; figure nhỏ đi dọc path 43→47; **47.6: ô đỏ + tick xanh của S0 tái xuất** giữa dưới (loop ending), pulse nhẹ tới hết. Credit tác giả: "Ý tưởng: Nie Lifeng · HackerNoon 27.09.2026 · quan điểm" (y ~770, dim 22).

## 4. Voiceover (Hải Đăng) + budget

Nguồn: `../www/Clip/agentic-data-stack/voiceover-segments.json` (7 đoạn · ≈161 âm tiết · trần 174).
Guard: tts-vieneu.py exit 1 nếu đoạn tràn `end` — margin ≥12%/đoạn.

## 5. Subtitles (burned-in — đúng lời voice, tối đa 2 dòng, highlight từ khóa)

| at–end | text | hi |
|---|---|---|
| 0.4–3.2 | Cú lỗi nguy hiểm nhất — không phải AI viết sai. | nguy hiểm nhất |
| 3.3–6.5 | Mà là nó chạy sai — ngay trong production. | chạy sai |
| 6.9–9.8 | Người dùng mới của data platform | data platform |
| 9.9–13 | không còn là con người — mà là agent. | agent |
| 13.4–16.3 | AI viết SQL, DAG, config gần như miễn phí. | miễn phí |
| 16.4–19.5 | Nên thứ khan hiếm đổi: context, kiểm chứng, trách nhiệm. | khan hiếm |
| 19.9–22.6 | SQL chạy được chưa chắc đúng nghiệp vụ. | chưa chắc đúng |
| 22.7–25.2 | Doanh thu: tiền đơn, ghi nhận, hay tiền thật thu? | tiền đơn / ghi nhận / thật thu |
| 25.3–27 | Chỉ context doanh nghiệp trả lời được. | context |
| 27.4–30.1 | Bài báo xếp lại năm tầng: | năm tầng |
| 30.2–32.1 | ý định, điều khiển, ngữ nghĩa, harness, runtime. | harness* |
| 32.2–34.5 | Agent không gọi thẳng công cụ — mọi thứ qua harness. | qua harness |
| 34.9–37.5 | Người không duyệt từng bước — chỉ chặn ở mức rủi ro cao. | rủi ro cao |
| 37.6–42 | Người định goal. Agent thực thi. Harness kiểm soát. | goal / thực thi / kiểm soát |
| 42.4–45.2 | Kỹ sư dữ liệu không mất việc — chỉ đổi vai: | không mất việc |
| 45.3–47.3 | thiết kế context, skill, policy. | context / skill / policy |
| 47.4–50 | Còn cú lỗi im lặng kia — chỉ harness chặn được. | harness chặn được |

## 6. Motion

- Reveal 0.3–0.6s ease; translate ≤24px; stagger 0.3–0.4s.
- Interrupt mỗi 2–3s (S0: 2.8 stamp · S1: 8.5 node + 9–12 chips · S2: 16.3 pulse · S3: 22.3 "?" + chips · S4: 29.5→32 descent + 32→34 chips · S5: 39 dừng chấm · S6: 47.6 loop).
- Beat 0 KHÔNG fade-in (t=0 = cover); các beat sau fade 0.55s in / 0.5s out.
- Loop ending: ô đỏ + tick xanh tái xuất (match cut về S0).

## 7. Performance (KN-083)

- `alpha:false`; bake `bgCache` (nền + glow + lưới mờ), `fxCache` (vignette), `bandCache` (dải sáng trôi).
- Cache layout headline/sub/subs 1 lần; không `measureText` cho chuỗi tĩnh mỗi khung.
- Đo bằng `verify-perf.mjs` sau khi dựng: command avg ≤20ms · rAF p95 ≤33ms.

## 8. Publish (chi tiết ở publish.md)

Caption keyword-first + 3 set hashtag (mỗi set 5) + cover đề xuất khung t≈3.1s (tick xanh + ô đỏ).
