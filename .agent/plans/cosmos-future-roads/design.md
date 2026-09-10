# Design (mini) — Future Roads

- **Layout:** giữ `.future-grid` hiện có (auto-fit cards, dark surface, radius-lg). 6 card, không card nào có tag ✅ Done.
- **Card anatomy:** `h4` (emoji + tên metaphor vũ trụ + mô tả ngắn) → `p` (đề tài + artefact cụ thể) → `span.eta` ("→ Qx xxxx · …").
- **Tông màu:** mặc định (viền mờ) — bỏ hết viền xanh "done-card"; nhấn bằng emoji, không cần palette mới.
- **A11y:** heading order giữ nguyên (h2 section → h4 card), text contrast theo token có sẵn, không inline color mới ngoài `.eta` mặc định.
- **Responsive:** kế thừa `.future-grid` sẵn có (375/768/1280 đã pass trước đó — không đổi CSS).
