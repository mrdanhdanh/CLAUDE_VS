> 🤖 Auto-log bởi auto-learn.mjs — 2026-09-22T17:28:01.381Z
> **Error:** `Trang /cosmos-3d/ tra ve 404 tren local serve du thu muc ton tai; chi /ai-news/ chay vi co rewrite trong www/serve.json. URL dang thu muc (/path/) 404 tren serve v8+ khi khong co rewrite`
> **File:** `www/serve.json`
> **Title:** Local serve 404 cho thu muc moi - can rewrite trong serve.json

> 🔁 **RADAR TÁI LẬP** — đối chiếu KN + bug cũ thấy nghi vấn:
> - 🔁 NGHI TÁI LẬP **[KN-030]** (score 167): Fetch ra ngoài deploy root + relative URL không slash cuối → 404 trên Pages
> - 🔁 NGHI TÁI LẬP **[KN-014]** (score 141.6): Smoke test treo khi import MCP stdio server + verify order + regex m flag
> - 🔁 NGHI TÁI LẬP **[KN-040]** (score 108.4): Cosmos rework: reveal chết ở element cao hơn viewport + hover bị reveal đè + `./x` 404 khi URL không slash
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-10-observatory-fetch-404-ngoai-www-va-relative-url`** (score 208.5): observatory-fetch-404-ngoai-www-va-relative-url
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-04-import-mcp-stdio-server-trong-smoke-test-gay-treo-`** (score 151.5): Import MCP stdio server trong smoke test gay treo + verify order + regex m flag
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-08-30-ai-server-slot-hardcode-tunnel`** (score 102.9): Slot máy chủ AI không hoạt động — hardcode localhost dev tunnel trong app releas
> → Đọc **Cách phòng tránh** trong `docs/knowleged.md` TRƯỚC khi fix. Nếu là tái lập thật: ghi rõ "tái lập của KN-030" + **vì sao lưới cũ không bắt được** → nâng lưới (Guard) rồi mới fix.
# Bug: Local serve 404 cho thu muc moi - can rewrite trong serve.json

> Copy file này vào `.agent/bugs/2026-09-22-local-serve-404-cho-thu-muc-moi-can-rewrite-trong-/bug.md` khi bắt đầu `/fixbug`.

## Meta

- **Slug:** `2026-09-22-local-serve-404-cho-thu-muc-moi-can-rewrite-trong-`
- **Ngày:** 2026-09-22
- **Severity:** `major`
- **Layer:** `env-fixture` — defect nằm ở cấu hình server local (`www/serve.json`), không phải code trang.
- **Reporter:** YUNIE
- **Related KN:** `KN-030` (tái lập — amend KN-030, không tạo KN mới)
- **Tags:** `build` `config` `dx` `pages`
- **Guard:** `tests/e2e/cosmos-3d.spec.ts` (test "không 404 cho các dạng URL của trang" — 3 dạng URL)
- **Status:** `fixed`

---

## 1. Reproduce

### Steps
1. Tạo thư mục trang mới `www/cosmos-3d/` có `index.html` (mở bằng `file://` vẫn OK).
2. Chạy `npx serve www -l 3111 --no-clipboard --no-port-switching`.
3. `curl http://localhost:3111/cosmos-3d/` → 404 · `/cosmos-3d` → 301 → 404 · `/cosmos-3d/index.html` → 200.
4. So sánh: `/ai-news/` → 200 (thư mục cũ có rewrite trong `serve.json`).

### Expected vs Actual
- **Expected:** `/cosmos-3d/` phục vụ `www/cosmos-3d/index.html` (giống GitHub Pages: directory URL → index.html).
- **Actual:** 404 ở local. Trong Playwright, triệu chứng không phải 404 rõ ràng mà là **treo ở `waitForFunction(__COSMOS3D.ready)`** rồi timeout 30s → dễ chẩn đoán sai là "lỗi engine three.js".

### Evidence
- Log / screenshot / test fail / video:
```
GET /cosmos-3d/           → 404
GET /cosmos-3d            → 301 (→ /cosmos-3d/ → 404)
GET /cosmos-3d/index.html → 200
GET /ai-news/             → 200   ← có rewrite trong serve.json
GET /cosmos/              → 404   ← thư mục cũ cũng chưa từng được rewrite
[debug] [http] 404 http://localhost:3111/cosmos-3d/  +  STATE {"ready": false, "fallbackShown": true}
```

### Environment
- Branch: `main`
- Commit: (working tree, chưa commit)
- OS/Browser: Windows 11 · Chromium (Playwright) · serve-handler (npx serve)

---

## 2. Root Cause (5 Whys)

- **File:Line:** `www/serve.json:5` (mảng `rewrites`)
- **Why 1:** `/cosmos-3d/` 404 dù thư mục + `index.html` tồn tại.
- **Why 2:** `serve` với `cleanUrls:false` + `directoryListing:false` không tự phục vụ `dir/index.html` cho URL dạng thư mục — chỉ phục vụ path map tới file thật hoặc **rewrite tường minh**.
- **Why 3:** `serve.json` chỉ liệt kê rewrite cho các thư mục tồn tại lúc nó được viết (`/`, `/agentic-academy`, `/ai-news`, `/glassui`) → thư mục mới **im lặng** không được phục vụ.
- **Why 4:** Convention test hiện tại dùng URL tường minh (`/cosmos/scale.html`) nên chưa ai chạm dạng URL thư mục ở local; helper `dirBase()` trong trang 2D chỉ vá phía **fetch**, che luôn phía **page URL**.
- **Why 5 (Root):** `rewrites` là **registry thủ công phải cập nhật mỗi khi thêm thư mục trang mới**, nhưng không có lưới nào khẳng định "mọi `www/<dir>/index.html` đều reachable qua `/<dir>/` ở local".

- **Impact:** Chỉ local dev/CI (Playwright webServer) — GitHub Pages không bị (Pages tự phục vụ dir index). Tác hại thật: test fail **sai chỗ** (timeout engine thay vì 404) → chẩn đoán sai hướng, tốn ~15 phút debug.
- **Hypothesis:** Ban đầu đoán "three.js/module lỗi" — **SAI**; chỉ khi gắn response listener mới thấy 404 ở chính page URL.
- **Confidence:** `HIGH` (proven: probe 5 URL + fix → 3/3 dạng URL pass + regression 88 spec cũ xanh)

> **Vì sao lưới cũ (KN-030) không bắt được:** guard cũ assert **response của fetch** (`scale.json`, `graph.json`) và **relative URL không slash cuối trong trang** — đều là đường dẫn *nội bộ trang đã tồn tại*. Ca này là **thư mục trang mới + URL dạng thư mục** (page URL, không phải fetch) — vùng chưa có lưới.

> Nếu bug chạm pattern trong `docs/knowleged.md` → ghi `Related KN: KN-XXX` và áp dụng **Cách phòng tránh** ngay.
> **Root Cause Gate:** Nếu uncertain → investigate / escalate, không tự biến hypothesis thành sự thật.

---

## 3. Fix

- **Approach:** Sửa ở gốc như thế nào (không patch triệu chứng)? Bounded — không refactor lan rộng.
- **Files Changed:**
  - `path/to/file.ts` — mô tả thay đổi
- **Diff tóm tắt:**
- **Approach:** Thêm rewrite tường minh cho thư mục mới **và** thư mục cũ còn thiếu (`/cosmos`), rồi khoá bằng guard test 3 dạng URL. Không sửa engine.
- **Files Changed:**
  - `www/serve.json` — thêm `{"source":"/cosmos-3d","destination":"/cosmos-3d/index.html"}` + `{"source":"/cosmos","destination":"/cosmos/index.html"}`
  - `tests/e2e/cosmos-3d.spec.ts` — test "không 404 cho các dạng URL của trang (KN-030)" chạy cả 3 dạng
- **Diff tóm tắt:**
```diff
   "rewrites": [
     { "source": "/", "destination": "/index.html" },
     ...
+    { "source": "/cosmos-3d", "destination": "/cosmos-3d/index.html" },
+    { "source": "/cosmos", "destination": "/cosmos/index.html" }
   ]
```
- **Non-Goals:** Không sửa mọi thư mục khác (chỉ 2 thư mục đang chạm); không đổi convention test sang URL thư mục; không tự động sinh rewrites (YAGNI — guard test đủ bắt).
- **Fix Confidence:** `HIGH`
- **get_errors:** 0 errors (affected files + full scope).

---

## 4. Verification

- [x] Re-run steps reproduce → **Fixed** (Expected = Actual)
- [x] Edge cases:
  - [x] case 1: `/cosmos-3d/index.html` (URL tường minh) → 200, engine ready
  - [x] case 2: `/cosmos-3d` (không slash → 301) → phục vụ đúng trang, không 404
  - [x] case 3: `/cosmos-3d/` (có slash) → 200
- [x] Regression: `npx playwright test "tests/e2e/cosmos"` → 88 passed (fail `cosmos-freshness` có sẵn do mirror cũ 4 ngày → đã `npm run cosmos:refresh`, xanh lại)
- [x] `get_errors` **toàn scope** → 0 errors
- [x] `lint` / `build` / `test` → PASS: `npx playwright test tests/e2e/cosmos-3d.spec.ts` → 10 passed · `node scripts/slop-check.mjs` → Clean
- [ ] UI audit: không áp dụng (bug cấu hình server)
- [x] Fresh-eyes tier: `OPTIONAL` (deterministic: URL → HTTP status mapping)

**Kết quả:**
```
GET /cosmos-3d/index.html → 200 · GET /cosmos-3d/ → 200 · GET /cosmos-3d → 200 (rewrite)
playwright: 10 passed (cosmos-3d) · 88 passed (cosmos suite)
```

---

## 5. Lesson (1 câu)

> **Thư mục trang mới trong `www/` phải thêm rewrite vào `www/serve.json`** — local serve không tự phục vụ `dir/index.html`, và 404 sẽ giả dạng "engine treo" trong test.

*(Tái lập của KN-030 — bổ sung bullet vào KN-030, không tạo KN mới.)*

---

## 6. Prevention

- **Cách phòng tránh lần sau:**
  - [x] Tạo page mới `www/<dir>/index.html` → thêm rewrite `"/<dir>" → "/<dir>/index.html"` vào `www/serve.json`
  - [x] Spec mới phải assert **no response ≥400** cho cả 3 dạng URL (`/dir/index.html`, `/dir/`, `/dir`) — đừng để 404 giả dạng "engine treo"
  - [ ] Thêm checklist vào `docs/knowleged.md` Anti-patterns / Checklist phòng tránh chung
- **Guard (lưới chống tái lập — KN-056):**
  - [x] Đã điền `- **Guard:**` ở Meta
  - [x] Là **TÁI LẬP**: ghi rõ "tái lập của KN-030" + vì sao lưới cũ không bắt được (guard cũ chỉ assert fetch + relative URL trong trang đã tồn tại, không assert page URL của thư mục mới) + nâng lưới TRƯỚC khi fix
- **Cần cập nhật:**
  - [ ] `docs/knowleged.md` → **amend KN-030** (thêm bullet serve.json rewrite + 3 dạng URL) — chờ dev duyệt
  - [ ] Test mới: `tests/e2e/cosmos-3d.spec.ts` (đã có)

---

## References

- `docs/knowleged.md#KN-XXX`
- Issue / PR: #
- Commit fix: `<hash>`

---
*Template: `.agent/bugs/_template/bug.md` — dùng bởi `/fixbug` Phase 1 & 5.*
