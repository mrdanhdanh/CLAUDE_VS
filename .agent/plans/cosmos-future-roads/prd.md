# PRD (mini) — Future Roads Refresh

- **Ngày:** 2026-09-11 · **Actor:** YUNIE · **Nguồn:** user yêu cầu "đề tài này còn đào sâu được gì — bỏ cái đã xong, thêm cái mới".
- **Vấn đề:** Section `Khai thác tương lai` (www/cosmos/index.html) đang trộn 4 card ✅ Done (đã ship) với 1 card chưa làm → danh sách mất tính "tương lai".
- **Giải pháp:** Gỡ TOÀN BỘ card Done; thay bằng 6 đề tài MỚI chưa làm, mỗi đề tài đo được (script/lab/gate cụ thể) + ETA quý.
- **Non-goals:** Không sửa observatory card "Vũ trụ học cho Scale" (là lịch sử shipped, không phải danh sách đề tài); không thêm JS mới (cards tĩnh).
- **Cosmic-Quantum:** Macro `www/cosmos` — danh sách đề tài là "bản đồ vùng trời chưa khảo sát" · Micro đo bằng Playwright trước khi claim Done · Entangled with: `www/cosmos/index.html`, `tests/e2e/cosmos-future.spec.ts`.
- **Who did you think with? (Dissent — KN-018):** Framing đối lập: *"6 đề tài mới có thể là scope creep — vũ trụ đề tài phình trong khi Wormhole còn chưa làm"*. Xử lý: mỗi đề tài phải map 1 artefact cụ thể đã tồn tại một phần (entangle v1, auto-learn, context.mjs, TDD gate…) — không đề tài nào là "xây mới từ số 0"; và đây là road-map, không phải commitment.
