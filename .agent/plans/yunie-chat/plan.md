# Plan — YUNIE Chat

Todos (Ladder nấc ghi per todo):

1. [x] PRD + Design + Plan mini (nấc 7 — file tối thiểu)
2. [x] Build `www/yunie-chat/index.html` + `styles.css` (nấc 4 — native HTML/CSS, 0 deps)
3. [x] Build `app.js`: Zen API client (fetch SSE stream) + YUNIE system prompt + key modal (nấc 7 — vanilla tối thiểu)
4. [x] Polish: responsive 375/768/1280, states (empty/loading/error/streaming), a11y (aria-live, focus, contrast)
5. [x] Verify: `get_errors`, curl CORS preflight thật, regenerate `status.json`, JSON.parse pass

## Kết quả Verify (2026-09-08)
- **CORS đo thật (KN-019):** Zen API KHÔNG trả `Access-Control-Allow-Origin` (OPTIONS → 404, POST 401 không ACAO) → gọi thẳng từ browser bị chặn → **thêm `proxy.mjs`** (nấc 7, ~100 dòng Node 0 deps, forward SSE nguyên vẹn, không lưu key).
- Proxy test end-to-end: GET / → 200, GET /app.js → 200, POST /v1/chat/completions (key giả) → 401 AuthError forward đúng từ Zen.
- `app.js` tự detect: chạy qua port 8787 → endpoint tương đối `/v1/chat/completions`; ngoài ra → URL trực tiếp + lỗi có hướng dẫn chạy proxy.
- `get_errors` 3 file www/yunie-chat/*: sạch. `node --check` proxy.mjs + syntax app.js: OK.
- `status.json` regenerate qua `generate-status.mjs` — `yunie-chat` vào plans + demos, JSON.parse OK.

## Cách chạy cho user
1. `node www/yunie-chat/proxy.mjs` → mở http://localhost:8787
2. Bấm ⚙️ API key → dán key từ opencode.ai/auth → Lưu.
3. Chat! Model mặc định Big Pickle (free).

Entangled with: `www/status.json` (regenerate), `www/index.html` (nếu thêm nav link — check trước khi sửa).

Anti-patterns áp dụng: KN-002 (status.json chỉ regenerate), KN-009 (không hardcode key/URL sai — URL là public API endpoint, key là runtime input), KN-019 (đo CORS bằng curl, không vibes), KN-020 (review output trước khi claim done).
