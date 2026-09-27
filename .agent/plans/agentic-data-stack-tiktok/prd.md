# PRD — Clip "ĐỌC VỊ · ADS" (Agentic Data Stack) · 50 giây · 9:16

## Promise (1 câu)

> Sau clip này, **dev/data engineer VN** sẽ **biết vì sao "AI viết SQL chạy được" vẫn chưa đủ** — và **5 tầng + risk-tier + 7 cổng** mà nền tảng dữ liệu phải dựng quanh agent — trong **50 giây**.

## Người xem / vì sao dừng ở 3s

- Đích: dev, data engineer, platform engineer (TikTok/Reels/Shorts VN).
- Self-relevance: ai cũng đang để AI viết SQL/DAG/pipeline.
- Curiosity: nghịch lý "chạy sai mà vẫn thành công" (green tick + ô đỏ) — đọc được ngay khi muted (frame 1 = cover hoàn chỉnh).

## Hook portfolio (3 archetype — chọn 1, giữ 2 làm caption A/B)

| # | Archetype | Hook | Quyết định |
|---|---|---|---|
| 1 | Mistake warning + paradox | "Cú lỗi nguy hiểm nhất không phải AI viết sai — mà là nó chạy sai, ngay trong production." (20 âm tiết, ~6s) | ✅ CHỌN — nghịch lý mạnh nhất của bài; có visual đối chọi (tick xanh + ô đỏ) |
| 2 | Curiosity gap | "AI viết SQL xong trong 5 giây. Nhưng không ai trả lời được câu hỏi này…" | giữ làm caption A/B |
| 3 | In-media-res | "Doanh thu báo cáo sai 2%. Nguyên nhân: một câu SQL chuẩn cú pháp." | giữ làm caption A/B (số "2%" là hư cấu minh hoạ — CHỈ dùng trong caption A/B test dạng giả định, không lên hình) |

## Beat sheet (7 beat · 50s · template "Hồ sơ/Breakdown")

| # | at–end | Ý chính | Visual | Voice budget (âm tiết) |
|---|---|---|---|---|
| 0 | 0–6.5 | Nghịch lý: chạy sai mà vẫn thành công | Query → runtime → kết quả có ô đỏ + tick xanh "PASS" đóng dấu | 20 |
| 1 | 6.5–13 | User của data platform đổi: người → agent | 2 platform card → mũi tên hội tụ về node AGENT + 4 chip | 17 |
| 2 | 13–19.5 | Thứ khan hiếm đổi | Cột trái SQL/DAG/CONFIG rơi giá → 0; cột phải CONTEXT/KIỂM CHỨNG/GOVERNANCE/TRÁCH NHIỆM sáng lên | 22 |
| 3 | 19.5–27 | "SQL chạy được ≠ đúng nghiệp vụ" | Thang 4 mức đúng; mức cuối "?" + 3 biến thể doanh thu | 25 |
| 4 | 27–34.5 | 5 tầng Agentic Data Stack | 5 slab; agent đi qua HARNESS (đường thẳng bị ✗) | 26 |
| 5 | 34.5–42 | 7 cổng + risk tier, không duyệt từng bước | 7 cổng tick dần + thang 4 mức rủi ro + dòng task chảy | 23 |
| 6 | 42–50 | Đổi vai + loop về hook | Path SQL WRITER → CONTEXT/SKILL/POLICY; ô đỏ + tick xanh tái xuất | 28 |

**Tổng ≈ 161 âm tiết ≤ trần 174** (công thức ≥12% margin, 4.2 âm tiết/giây — như clip trước đã pass).

## CTA (1 cái duy nhất)

"Team bạn bắt đầu từ đâu: context, skill, hay policy?" — trả lời được bằng 1 từ; nằm trong sub beat 6 (safe zone) + caption + ghim comment.

## Non-goals

- Không dạy implement harness; không so sánh vendor (Snowflake/Databricks chỉ nêu hướng).
- Không claim số liệu (bài gốc không có benchmark).
- Không lặp lại nội dung clip AOG (fire/AI-power) — clip này là bản "cơ chế & quy trình".

## Persistence · F5 · Scope

MP4 tĩnh trong `www/Clip/agentic-data-stack/` — không state, không API. F5 = không đổi gì. Scope: file public khi push Pages.

## Who did you think with?

- Dissent 1 (đã cân nhắc): "50s có nhồi không?" → **cắt 7 gates khỏi voice** (chỉ để trên hình dạng 7 cổng tick), voice giữ 5 tầng + risk tier. Framing đối lập "làm clip 30s chỉ 1 ý: chạy được ≠ đúng nghiệp vụ" bị loại vì bỏ hết giá trị khác — nhưng hướng cắt của nó được dùng để trim.
- Dissent 2 (đã cân nhắc): biến clip thành "giới thiệu harness nhà mình" (self-promo) → loại; clip giữ vai *đọc bài* (series ĐỌC VỊ), không bán giải pháp.

## Rubric (evals — chấm trước khi Done)

- C1: t=0 là cover hoàn chỉnh, đọc được ở 30% zoom khi muted (không fade từ đen).
- C2: 100% text thiết yếu trong hộp 900×1400; không gì ở y>1660 hay x>990.
- C3: subtitle 44px, khớp voice ≥95% từ; highlight đúng từ khóa.
- C4: 7 beat khớp 7 segment voice; guard timing của tts-vieneu pass (0 tràn).
- C5: visual mỗi beat thay đổi ≥1 lần/3s (interrupt); không beat nào đứng yên.
- C6: loop ending: khung cuối nối khung đầu (ô đỏ + tick xanh tái xuất).
- C7: verify-perf pass (command avg ≤20ms; rAF p95 ≤33ms).
- C8: verify-audio pass trên WAV + MP4 (peak > 0, có tiếng thật).
- C9: nhãn nguồn hiện trên hình (footer QUAN ĐIỂM + credit tác giả ở beat 6).
- C10: 1 CTA duy nhất, trả lời được; caption keyword-first; 5 hashtag.
