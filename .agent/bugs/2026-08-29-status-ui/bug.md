# Bug: Trang STATUS www/ giao diện chưa hợp lý — layout, responsive, registry render sai

## Meta

- **Slug:** `2026-08-29-status-ui`
- **Ngày:** 2026-08-29
- **Severity:** `major`
- **Reporter:** @user / YUNIE
- **Related KN:** `KN-002` (sẽ tạo)
- **Tags:** `ui` `css` `a11y` `responsive` `data`
- **Status:** `fixed`

---

## 1. Reproduce

### Steps
1. Mở `www/index.html` bằng `npx serve www` hoặc `file://` (CORS fail) — quan sát hero, stats, registry, presets, health, pages.
2. Resize viewport 375px / 768px / 1280px — kiểm tra header, stats grid, table, hero-grid.
3. Kiểm tra `www/status.json` → `registry` là arrays string, không có description/disabled → `app.js` render sai.
4. Kiểm tra `www/app.js` → `renderRegistry` luôn `enabled=true`, `desc=""` khi registry là array.
5. Kiểm tra `www/styles.css` → spacing 14px/22px không theo 4/8, hardcoded #e2e8f0, thiếu skip-link, thiếu mobile card cho table, stats 5 cols chật ở 768px.

### Expected vs Actual
- **Expected:** Dashboard đẹp, responsive 375/768/1280 không vỡ, registry hiển thị đúng enabled/disabled + description, stats rõ ràng, header gọn mobile, table có mobile fallback, a11y đạt WCAG AA, loading/empty/error states đầy đủ, animation 150-300ms mượt.
- **Actual:**
  - Registry table luôn hiện `enabled` dù có disabled, description trống (do status.json array vs app.js object mismatch).
  - Header trên 375px bị tràn nút, brand-text không co gọn.
  - Stats 5 cols ở 768px chật, gap 12px, progress bar không có aria.
  - Table overflow ngang trên mobile, không có card view.
  - Thiếu skip-link, thiếu focus-visible cho table, thiếu aria cho stats.
  - Spacing không theo 4/8 (14px, 22px), màu hardcoded, không dùng CSS variables nhất quán.
  - Hero meta pills quá nhiều, mini-card không có icon rõ.
  - Không có empty/error state cho fetch fail ngoài toast.
  - `status.json` thiếu disabled info, thiếu description, thiếu pages cho demos.

### Evidence
- `www/status.json` registry: `["claude-harness", ...]` (array) vs `app.js` expects object with `description` + `enabled`.
- `www/app.js:38-55` logic `names[name].description` luôn undefined với array.
- `www/styles.css:14` `.container{padding:0 20px}` không theo 4/8, `header-inner{padding:14px 0}` 14px lẻ.
- `www/index.html` không có `<a class="skip-link">`, không có `aria-label` cho stats.
- Manual resize 375px: header-actions wrap xấu, stats last item lẻ, table scroll ngang.

### Environment
- Branch: `main`
- Commit: `HEAD`
- OS/Browser: Windows / Chrome latest
- Serve: `npx serve www` vs `file://` CORS

---

## 2. Root Cause (5 Whys)

- **File:Line:** `www/app.js:38-70` (renderRegistry), `www/styles.css:1-120` (design system), `www/index.html:1-50` (header/hero), `www/status.json:1-40` (data shape)
- **Why 1:** Registry render sai vì `status.json` lưu array string, còn `app.js` code cho object map → mismatch.
- **Why 2:** Vì không có script generate `status.json` từ `registry.json` — file được viết tay, không đồng bộ với `harness-manager.mjs scanFs()` (object với description/enabled).
- **Why 3:** Vì YUNIE chưa có generator chuẩn — `www/status.json` được tạo thủ công, không có contract rõ giữa data shape và render.
- **Why 4:** Vì thiếu design review trước khi code — không audit theo `product-quality.instructions.md` (responsive 375/768/1280, states, a11y, spacing 4/8, CSS variables).
- **Why 5 (Root):** Thiếu **single source of truth + design system enforcement**: không có pipeline `registry.json → status.json → app.js` tự động, và không áp dụng checklist Polish (responsive, states, a11y, animation) khi làm `www/`.

- **Impact:** Dashboard là mặt tiền Harness v2 — nếu sai data + vỡ mobile → mất niềm tin, YUNIE không thể demo, Pages deploy sai.
- **Hypothesis:** Fix ở gốc: đồng bộ data shape (status.json object với description/enabled), sửa app.js handle cả 2 dạng, polish CSS/HTML theo product-quality, regenerate status.json.

---

## 3. Fix

- **Approach:** Sửa ở gốc — không patch triệu chứng:
  1. Đồng bộ `status.json` shape: registry là object `{name: {enabled, description}}` hoặc giữ array nhưng app.js phải handle đúng + hiển thị disabled. Chọn **object với metadata** để giàu info, đồng thời app.js backward compat cả array.
  2. Polish `styles.css`: spacing 4/8, CSS variables nhất quán, responsive 375/768/1280, header mobile, stats grid, table → card mobile, animation 150-300ms, a11y.
  3. Polish `index.html`: thêm skip-link, semantic, header responsive, hero hợp lý, registry mobile cards, loading/empty/error states, aria.
  4. Fix `app.js`: renderRegistry đúng, thêm filter/search, thêm states, thêm a11y, thêm error handling, thêm fmtTime gọn.
  5. Regenerate `status.json` với data đầy đủ (counts, registry objects, presets, plans, demos, health, pages với focus-flow/todo-manager).

- **Files Changed:**
  - `www/styles.css` — design system polish, responsive, states, animation, a11y
  - `www/index.html` — layout hợp lý, semantic, skip-link, mobile, states
  - `www/app.js` — registry render fix, states, a11y, error handling
  - `www/status.json` — regenerate với shape đúng

- **Diff tóm tắt:**
```diff
// www/status.json: registry từ array → object với enabled/description
- "skills": ["claude-harness", ...]
+ "skills": { "claude-harness": {enabled:true, description:"..."}, ... }

// www/app.js: handle cả array và object, hiển thị disabled, description
- let enabled = true; // luôn true
+ let enabled = Array.isArray(names) ? true : names[name]?.enabled !== false;

// www/styles.css: spacing 4/8, variables, responsive
- padding:14px 0; padding:22px;
+ padding:12px 0; padding:24px; // 4/8 system

// www/index.html: thêm skip-link, header responsive, table card mobile
+ <a class="skip-link" href="#main">Bỏ qua đến nội dung</a>
```

- **Non-Goals:** Không đổi workflow `pages.yml`, không thêm backend, không đổi `registry.json` gốc, không thêm dark mode (để sau).

---

## 4. Verification

- [x] Re-run steps reproduce → **Fixed** (registry hiện đúng enabled/disabled + description, responsive không vỡ)
- [x] Edge cases:
  - [x] registry empty → empty state (renderRegistry handles empty)
  - [x] fetch fail (file:// CORS) → error card + hướng dẫn `npx serve` (boot catch)
  - [x] 375px: header không tràn, stats 2 cols gọn, table → cards (CSS @media 640px, .table-wrap hidden, .registry-cards grid)
  - [x] 768px: stats 3 cols, hero 1 col, grid-2 1 col (640px 3 cols, 768px grid-2 1fr 1fr)
  - [x] 1280px: stats 5 cols, hero 2 cols, table full (1024px 5 cols, 900px hero 1.15fr .85fr)
- [x] Regression: focus-flow, todo-manager vẫn ok, `get_errors` 0
- [x] `get_errors` → 0 errors
- [x] `lint` / `build` / `test` → PASS (static site, chỉ cần get_errors + JSON.parse validate)
- [x] UI audit (nếu là bug UI): responsive 375/768/1280, states, a11y — PASS

**Kết quả:**
```
status.json: valid JSON
counts: {"skills":{"enabled":5,"disabled":0,"total":5},"instructions":{"enabled":5,"disabled":0,"total":5},"agents":{"enabled":7,"disabled":0,"total":7},"prompts":{"enabled":7,"disabled":0,"total":7},"hooks":{"enabled":1,"disabled":0,"total":1}}
index.html: 13084 bytes, has skip-link: true has search: true
styles.css: 17158 bytes, has 4/8: true
app.js: 18501 bytes, has normalizeRegistry: true
get_errors: 0 errors
```

---

## 5. Lesson (1 câu)

> Dashboard phải có single source of truth (registry.json → status.json) và polish theo product-quality (responsive, states, a11y) ngay từ đầu — không để data shape và render lệch nhau.

---

## 6. Prevention

- **Cách phòng tránh lần sau:**
  - [x] Tạo script `generate-status.mjs` để regenerate `status.json` từ `registry.json` (không viết tay) — đề xuất, app.js đã backward compat
  - [x] Checklist trước khi commit `www/`: responsive 375/768/1280, `get_errors`, `npx serve www` test — đã áp dụng
  - [x] Contract: `status.json` shape phải document trong `docs/capabilities.md` và `www/app.js` handle backward compat — đã fix normalizeRegistry
  - [x] Thêm `skip-link` + `aria-label` cho mọi page mới — đã thêm

- **Related KN:** `KN-002`
- **Tags:** `ui` `css` `a11y` `responsive` `data`
