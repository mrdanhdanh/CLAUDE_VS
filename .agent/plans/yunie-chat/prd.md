# PRD — YUNIE Chat (www/yunie-chat/)

**Cosmic-Quantum:** Macro `www/yunie-chat/` là thiên hà con trong vũ trụ `www/` · Micro superposition 2 kiến trúc (direct-call vs proxy) → collapse direct-call · Entanglement `www/status.json` ↔ `www/index.html` (nav) ↔ `.github/harness/registry.json`

**Design vibe:** claude (score 2.0) — warm cream canvas + coral primary, editorial, ấm áp hợp persona Barista YUNIE. Path: `awesome-design-md/design-md/claude/DESIGN.md`

## Vấn đề
User muốn chat với YUNIE (persona Harness v2) trực tiếp trên web, model gọi qua **OpenCode Zen API**.

## User stories
1. Mở trang → thấy giao diện chat YUNIE, chào hỏi sẵn.
2. Dán OpenCode API key 1 lần → lưu `localStorage`, không commit.
3. Chọn model (mặc định `big-pickle` free, có dropdown GLM/DeepSeek/Kimi...).
4. Gõ tin nhắn → stream phản hồi theo persona YUNIE (tiếng Việt, ấm áp, có emoji vừa phải).
5. Lỗi (thiếu key, sai key, CORS, rate limit) → hiện thông báo rõ + hướng dẫn fix, không treo.

## Scope
- Trang static `www/yunie-chat/index.html` + `styles.css` + `app.js` (0 deps, vanilla JS).
- Gọi thẳng `https://opencode.ai/zen/v1/chat/completions` (OpenAI-compatible), streaming SSE.
- System prompt YUNIE nhúng trong app.js (rút gọn từ yunie-personality).
- Lịch sử chat giữ trong phiên (memory in-page), nút New chat.

## Non-goals (CẮT — YAGNI)
- ❌ Không làm server proxy (chỉ thêm nếu CORS chặn — verify sẽ đo).
- ❌ Không lưu lịch sử chat vào localStorage (phiên đủ dùng, tránh phình).
- ❌ Không login/account, không multi-session, không RAG library (task sau).

## Persistence (Pages static — chốt từ PRD)
`Persistence: localStorage key "yunie-chat-key" (API key only, TTL vô hạn, nút Xóa key) · F5: key giữ, lịch sử chat mất · Scope: per-browser`

## Nguồn từ thư viện
Không dùng sách — persona lấy từ `.github/instructions/yunie-personality.instructions.md` (repo, không phải library export).

## Who did you think with?
Dissent Review: framing đối lập "direct-call lộ key + CORS risk" — cân nhắc proxy Node local, chốt direct-call vì personal use + YAGNI (KN-013); nếu verify thấy CORS chặn → escalate thêm proxy.

## Verify gate
- `get_errors` www/yunie-chat/* sạch.
- Đo CORS bằng curl preflight thật (không đoán — KN-019).
- Responsive 375/768/1280, a11y contrast ≥4.5:1, keyboard, aria-live.
- `status.json` regenerate + JSON.parse pass.
