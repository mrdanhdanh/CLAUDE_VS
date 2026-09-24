# Design — Space Bunny Free

## Direction
OpenCode-inspired terminal reel: nền gần đen, chữ monospace cho nhãn dữ liệu, headline to đậm, mỗi beat là một “thẻ” có viền màu theo mức độ tin cậy. Xanh lá = official, vàng = claim, xanh dương = ledger, cam = CTA. Bunny mascot là nhân vật social, không đóng vai bằng chứng kỹ năng.

## Tokens
- Canvas: `#070a12`; panel: `#101827`; panel phụ: `#162235`; ink: `#f5f7fb`; muted: `#a9b6ca`; line: `#293850`.
- Accent: `#55e6a5` (official/free), `#ffcc66` (claim chưa kiểm chứng độc lập), `#ff9b54` (cảnh báo/CTA), `#7aa2ff` (ledger/terminal), `#ef6bba` (mascot), `#c8f6f9` (nhãn phụ).
- Font: headline `Arial` bold; nhãn dữ liệu `Consolas`/monospace; 9:16 1080×1920, margin ngang 84 px.
- Vùng dọc: eyebrow y=142 · headline y=290 (size 96, riêng beat 03 dùng 84 để không tràn) · sub y=545 · nội dung 690–1630 · footer 1800/1850.

## Story beats
- 0–5s: bunny lớn giữa khung + 3 chip `1M CONTEXT` / `MULTIMODAL` / `FREE (LIMITED)` + dòng “provider ẩn danh · chưa có model card”.
- 5–14s: thẻ official (viền xanh lá): `FREE` + 3 dòng dữ liệu `MODEL ID` / `ENDPOINT` / `GO LIMIT`.
- 14–28s: thẻ claim (viền vàng): `1M CONTEXT` vàng, `MULTIMODAL`, dòng `RETENTION: 2 NGUỒN NÓI KHÁC NHAU`, 3 dòng caveat (nguồn 1M, mâu thuẫn retention, thiếu benchmark).
- 28–39s: research ledger 2×2: PAPER / MODEL CARD / PROVIDER / WEIGHTS — 3 ô “chưa thấy”, 1 ô “ẩn danh”; kết luận “chỉ tin phần tự test được”.
- 39–50s: 3 task card (fix bug / read repo / ship feature) + thẻ CTA “Bạn thử task nào?” và dòng `SPACE BUNNY · OPENCODE`.
- Mỗi beat: eyebrow đổi màu theo loại (official/claim/ledger/CTA), bunny chỉ xuất hiện ở beat 1, 3, 5 và luôn nằm ngoài vùng chữ.

## Motion
- 30 fps; 50 giây; canvas vẽ lại mỗi khung bằng `draw(t)` — mọi thứ suy ra từ `t`, không dùng state tích lũy.
- Beat vào bằng fade + trượt 24 px; task card ở beat 5 stagger 0.35 s.
- Bunny nhấp nhô nhẹ; vòng cung xanh chạy quanh đầu — không particle/scanline dày để tránh rối mắt.
- Reduced-motion: giữ fade nội dung, bỏ typing/zoom/parallax.
- Render: `window.__spaceBunny.freeze = true` trước khi capture để vòng rAF của trang không ghi lẫn vào luồng MediaRecorder; kiểm layout bằng `verify-frames.mjs` (5 PNG) trước khi render MP4.

## Audio
- Giọng: **Hải Đăng** (VieNeu-TTS v3 Turbo, 48 kHz, local) — thay giọng SAPI cũ.
- Lời cắt theo beat, chèn khoảng nghỉ để khớp hình (v3 Turbo không có tham số `speed`): mỗi đoạn bắt đầu sau mốc beat 0.4 s và kết thúc trong beat của nó.
- Đo được: B1 0–4 s · B2 5–13 s · B3 14–26 s · B4 28–36 s · B5 39–46 s — tổng 35.2 s có tiếng / 50 s.
- Chuẩn hoá: model có thể xuất đỉnh > 1.0 → script tự scale về 0.98 (không clip để khỏi méo).
- Guard: `verify-audio.mjs` soi track + đo peak/RMS, `render.mjs` tự gọi sau khi ghi file.
