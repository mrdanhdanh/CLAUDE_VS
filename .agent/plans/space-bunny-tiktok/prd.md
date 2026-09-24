# PRD — Space Bunny Free TikTok Clip

## Product
Một clip TikTok dọc 9:16, khoảng 50 giây, giới thiệu **Space Bunny** — model ẩn danh mới xuất hiện trên **OpenCode**, hiện được mở miễn phí trong thời gian giới hạn. Clip không tự nhận model này mạnh hơn model khác; mục tiêu là biến thông tin “model mới + free” thành một lời mời test thật.

## Facts đã kiểm chứng
- OpenCode gọi nó là **Space Bunny Free**, model ID `space-bunny-free`; endpoint OpenAI-compatible: `https://opencode.ai/zen/v1/chat/completions` (Zen) và bản Go tương ứng.
- OpenCode mô tả là **anonymous/stealth model**, free trong thời gian giới hạn.
- Theo bảng quyền riêng tư của OpenCode Go: **không dùng dữ liệu để train**, **retention 0 ngày**. Đây là claim của OpenCode về provider, không phải audit độc lập.
- **Context = 1M** — đối chiếu chéo 4 nguồn: bài X của OpenCode, trang model OpenRouter `stealth/space-bunny-alpha` (CONTEXT **1.0M**), LM Market Cap (1,000K), Benchable (1M). Tìm `"1.5M context"` và `"2M context"` → **không có nguồn nào**. Vẫn không phải số đo độc lập vì metadata API của OpenCode không có field context.
- **Retention mâu thuẫn giữa 2 nền tảng:** OpenCode Go ghi “không dùng để train, retention 0 ngày”; OpenRouter ghi prompt/completion “may be retained by the provider” (không dùng để train). Clip nêu đúng mâu thuẫn này thay vì khẳng định “zero retention”.
- Cùng model ẩn danh này còn xuất hiện trên OpenRouter tên `space-bunny-alpha` (cùng ngày 23/09, cùng 1M, cùng multimodal) — **plausible nhưng chưa được xác nhận chính thức là cùng một model**, nên clip không khẳng định.
- OpenCode không công bố tên provider, model gốc, weights, model card, hay paper riêng cho Space Bunny.

## Audience & promise
- Audience: người dùng TikTok quan tâm AI, coding agent, OpenCode, model mới.
- Promise: “OpenCode đang mở một model ẩn danh mới, miễn phí trong thời gian giới hạn; hãy tự test.”
- CTA: “Bạn sẽ thử Space Bunny với task nào?”

## Evaluation rubric
- **C1 Hook (0–2):** 2 giây đầu nói đúng “model ẩn danh mới trên OpenCode”.
- **C2 Facts (0–2):** nêu model ID, free có thời hạn, provider chưa công khai.
- **C3 Context claim (0–2):** nêu “1M context” kèm provenance (OpenCode + OpenRouter + 2 aggregator), không hứa trải nghiệm thực tế ở 1M.
- **C4 Capability (0–2):** chỉ nêu multimodal **theo nhà cung cấp/aggregator**, kèm nhãn “chưa benchmark độc lập”.
- **C5 Research (0–1):** nói rõ chưa tìm thấy paper/model card/weights chính thức.
- **C6 Privacy (0–1):** nêu **mâu thuẫn** giữa OpenCode (0 ngày) và OpenRouter (có thể lưu), không kết luận thay người xem.
- **C7 CTA (0–1):** dùng task thật: fix bug, đọc repo, xây feature; không hứa kết quả.

## Cut / YAGNI
- Cắt: claim model “mạnh nhất”, benchmark score chưa có raw task, paper giả, provider suy đoán, link tài khoản, upload TikTok, nhạc.
- Giữ: facts có provenance, uncertainty labels, prompt thử, CTA.

## Dissent
Rival framing: hào nhoáng “model đỉnh, làm mọi thứ” có thể viral hơn, nhưng sai và không kiểm chứng. Chọn framing “anonymous + free + test thật”, để sự tò mò thay cho hype.

## Who did you think with?
Dissent framing đối lập: loại bỏ mọi claim kỹ năng chưa có nguồn; giữ facts chính thức và biến phần chưa xác minh thành nhãn uncertainty rõ ràng.
