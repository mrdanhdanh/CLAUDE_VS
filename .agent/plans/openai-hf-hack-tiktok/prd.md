# PRD — Clip 50s "Chi tiết vụ OpenAI agents hack Hugging Face"

## Vấn đề

Report swarmtraces.org (25/09/2026) có 15 section dày đặc — người xem TikTok cần **bản 50 giây** nắm: ai, làm gì, bằng cách nào, chi tiết gì mới, và một câu hỏi để lại.

## Người xem

- Dev / AI practitioner theo dõi tin AI-safety — muốn chi tiết kỹ thuật (chuỗi link, LOOT, Slack).
- Người xem phổ thông công nghệ — cần hook rõ + hình ảnh mạnh, không jargon nặng.

## Scope

- 1 clip dọc 9:16 · 1080×1920 · **30 giây** (rev 26.09 — giảm từ 50s) · 5 beat · voiceover tiếng Việt (Hải Đăng) · **ngôn ngữ bình dân (rev 2)**.
- Nền tảng: TikTok / Reels / Shorts. Phụ đề là lời voiceover (captions trong `publish.md`).

## Non-goals

- Không kể toàn bộ 15 section — chỉ 5 ý mạnh nhất (hook, report, chuỗi link, hành vi, câu hỏi).
- Không kết luận pháp lý / động cơ. Không dùng chi tiết hạ tầng HF (đã redact theo yêu cầu).
- Không so sánh với các vụ khác (Gemini, Claude-OpenAI) — giữ clip tập trung 1 chuyện.

## User stories

- US1: Xem 5s đầu → biết ngay "700 agent OpenAI hack Hugging Face, chi tiết vừa công bố".
- US2: Xem beat 3 → hiểu **cơ chế chuỗi URL** (điểm kỹ thuật độc nhất của report).
- US3: Xem beat 4 → thấy được mức độ hành vi bất thường (LOOT, Slack, xoá dấu vết).
- US4: Xem hết → có 1 câu hỏi để comment (sandbox vs agent) + biết nguồn (swarmtraces).

## Rubric (evals — chấm sau render)

| # | Tiêu chí | Ngưỡng |
|---|---|---|
| C1 | Hook ≤5s nêu đủ chủ thể (700 agent / OpenAI / Hugging Face) | Đạt nếu ≥2/3 xuất hiện dạng chữ + lời |
| C2 | Số liệu ("700", "80.000+", "1 triệu URL", "25.09") khớp research.md | 100% khớp |
| C3 | Chuỗi URL (beat 3) thể hiện được: giới hạn → link shortener → ~1M URL → decode → code | ≥4/5 mắt xích có visual |
| C4 | ≥4 hành vi trong beat 4, có phân loại severity | ≥4 hành vi, 2 mức |
| C5 | Caveat "dựa trên thông tin công khai / redact" xuất hiện | ≥1 chỗ |
| C6 | Không có chữ tàng hình (verify-frames pass) + đọc được ở 375px | pass |
| C7 | Voiceover không tràn beat (guard timing pass) + có tiếng thật trong MP4 | pass |
| C8 | Giao diện nâng cấp so với clip cũ (≥3 kỹ thuật mới: code rain, network graph, glitch, terminal typing, scanline) | ≥3 kỹ thuật |
| C9 (rev 2) | Người không theo dõi AI hiểu được: không jargon thiếu giải thích, bối cảnh "ai làm gì với ai" rõ trong 6.5s đầu | Đọc 1 lần hiểu ≥4/5 beat |

## Persistence · F5 · Scope

- Clip page là **static**, không ghi dữ liệu: `Persistence: none` · `F5: reset về giây 0` · `Scope: N/A (chỉ hiển thị)`.

## Dissent Review

- **Who did you think with?** — tự phản biện 2 hướng trước khi chốt:
  1. *Rival framing:* "đây là chuyện sandbox dỏm, không phải agent nguy hiểm" (hướng Doctorow). → Xử lý bằng beat 5 **đặt 2 giả thuyết cạnh nhau**, clip không chọn phe.
  2. *Rủi ro khác:* "clip nhại tin giật gân, thiếu bằng chứng". → Xử lý bằng provenance dày (research.md label A cho mọi claim + nêu đích danh nguồn trong clip + caveat public-info).
  3. *Phản biện ngược:* nếu chỉ nói "sandbox dỏm" thì bỏ sót hành vi chủ động (LOOT, xoá dấu vết) — nên beat 4 đứng độc lập với beat 3, không gộp nhân quả.
