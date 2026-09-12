# Design — YT Summary (`www/yt-summary/`)

## 0. Design vibe

Tái dùng hệ design có sẵn của `www/` (CSS variables, dark default, spacing 4/8, radius, shadow) — **không** thêm design system mới (minimal-ladder nấc 2: reuse).
Vibe chọn: **productivity tool / dark minimal** (bảng dữ liệu là nhân vật chính, không trang trí thừa), accent theo tông `www/` + accent đỏ YouTube cho nút trigger chính.

## 1. Tokens

```css
/* kế thừa từ www/styles.css, bổ sung cục bộ */
--yt-accent:      #ff2d55;   /* YouTube-ish, chỉ dùng cho CTA + timeline */
--yt-accent-2:    #7c3aed;   /* đồng bộ cosmos (indigo/violet) */
--yt-surface:     var(--surface, #111827);
--yt-border:      var(--border, #1f2937);
--yt-ok:          #10b981;   /* trạng thái done */
--yt-warn:        #f59e0b;   /* bị lược nhiều / quality thấp */
--yt-err:         #ef4444;
/* radius 8/12/16 · spacing 4/8/12/16/24/32 · font hệ thống sẵn có */
```
Contrast: text chính ≥ 7:1 trên nền dark; badge dùng nền `color-mix` + chữ đậm ≥ 4.5:1. **Không** dùng màu làm tín hiệu duy nhất (kèm icon + text).

## 2. Wireframe

```
┌───────────────────────────────────────────────────────────────┐
│ [skip-link]                                                   │
│ H1  🎬 YT Summary           chip: "extractive · no AI key"    │
│ sub: Dán link → transcript sạch + bảng tóm tắt theo phần      │
├───────────────────────────────────────────────────────────────┤
│ ▸ TRIGGER CARD                                                │
│  [ https://youtube.com/watch?v=…           ] [ ⚡ Phân tích ]  │
│  ├ Cách 1 (0 token): [ 📮 Gửi yêu cầu qua GitHub Issue ]      │
│  └ Cách 2 (nhanh):  [▸ Dán GitHub token]  (collapsible)       │
│      token input (password) + repo override + [Lưu] [Xoá]     │
│  state: idle → validating → queued/running → done/error        │
│  timeline: ①Gửi yêu cầu ②CI tải transcript ③Làm sạch ④Tóm tắt  │
├───────────────────────────────────────────────────────────────┤
│ ▸ RESULT (aria-live)                                          │
│  chips: ⏱ 42:10 · 🧩 9 phần · 🧹 lược 31% · 📝 5.8k từ · 🏷 24 │
│  ┌ SUMMARY TABLE (sticky header) ─────────────────────────┐   │
│  │ # │ ⏱        │ Phần          │ Tóm tắt      │ Từ khóa   │  │
│  │ 1 │ 00:00    │ Mở đầu        │ …            │ a · b · c │  │
│  │ ▸ click row → mở transcript của phần đó (accordion)    │   │
│  └────────────────────────────────────────────────────────┘   │
│  ▸ đoạn bị lược: "🗑 3 đoạn quảng cáo/outro (12:10–13:05)…"   │
├───────────────────────────────────────────────────────────────┤
│ ▸ TRANSCRIPT PANEL: filter theo phần + nút Copy (1 phần/tất cả)│
├───────────────────────────────────────────────────────────────┤
│ ▸ LIBRARY: video đã phân tích (list) — mở lại không cần CI     │
└───────────────────────────────────────────────────────────────┘
```

## 3. States (bắt buộc đủ)

| State | Hiển thị |
|-------|----------|
| `idle` | form trống, hint ví dụ link, library list |
| `invalid` | lỗi inline dưới input: "Link YouTube không hợp lệ" (không hiện toast rời) |
| `queued` (issue mode) | step ① active + nút mở issue + "quay lại sau, library sẽ tự cập nhật" |
| `running` (token mode) | steps ①→④ với spinner từng bước + nút Huỷ + đồng hồ đếm |
| `success` | bảng + chips + transcript |
| `empty` (library rỗng) | "Chưa có video nào — dán link đầu tiên 👇" |
| `error:no-transcript` | "Video này không có phụ đề (kể cả auto) → không tóm tắt được. Gợi ý: chọn video khác hoặc dán .vtt tay." |
| `error:network` | thông báo + nút Thử lại |
| `error:auth` | "Token thiếu quyền `Actions: write`" + link tạo token |

`aria-live="polite"` cho vùng status; `role="status"` cho timeline.

## 4. Responsive

- **375px:** table → **card list** (mỗi phần 1 card: header # + ⏱ + tên, body tóm tắt, footer chips keyword); trigger card stack; tap target ≥ 44px.
- **768px:** stats 2 cột; table giữ nhưng ẩn cột Từ khóa (đưa xuống dưới tóm tắt).
- **1280px:** table đầy đủ 5 cột; transcript panel max-width 1100px; không tràn ngang.

## 5. Interaction & motion

- Animation 150–300ms, chỉ `transform`/`opacity` (không animate layout).
- Row hover: nền nhẹ; mở accordion: height auto với `grid-template-rows` hoặc max-height + opacity.
- **Tách kênh property** (KN-040): reveal dùng `translate`, hover dùng `transform` — không đè nhau.
- `prefers-reduced-motion: reduce` → giữ fade opacity, bỏ translate/scale (KN-031).
- Copy button → toast "Đã copy transcript phần 3" + đổi icon 1.5s.

## 6. A11y

- `skip-link`, landmarks (`header/main/footer`), `h1` duy nhất.
- Table: `<caption>` ẩn (sr-only), `<th scope="col">`; card mobile giữ cùng ngữ nghĩa qua `aria-labelledby`.
- Accordion: `<button aria-expanded aria-controls>` — không dùng `div` click.
- Keyboard: Enter submit form; `/` focus ô link (đồng bộ pattern `www/app.js`).
- Timeline steps: `aria-current="step"` cho bước đang chạy; màu + icon + text (không chỉ màu).
- Contrast ≥ 4.5:1 cho mọi text; focus-visible ring rõ trên nền tối.

## 7. Data contract (page ↔ CI)

`www/yt-summary/data/index.json`
```json
{ "generatedAt": "ISO", "updatedBy": "yt-summary build.mjs",
  "videos": [ { "id": "abc123", "title": "...", "channel": "...", "durationSec": 2530,
                "addedAt": "ISO", "segments": 9, "cleanedPct": 31, "words": 5800,
                "lang": "vi-orig", "quality": "ok" } ] }
```

`www/yt-summary/data/<id>.json`
```json
{ "id": "abc123", "url": "https://youtu.be/abc123", "title": "...", "channel": "...",
  "durationSec": 2530, "lang": "en", "source": "yt-dlp-auto-caption|manual-vtt",
  "generatedAt": "ISO", "generator": "yt-summary/build.mjs v1",
  "stats": { "cuesRaw": 1820, "cuesClean": 1247, "droppedCues": 573, "cleanedPct": 31,
             "words": 5800, "segments": 9, "readingMin": 39 },
  "segments": [ { "i": 1, "start": 0, "end": 132, "title": "Mở đầu",
                  "summary": "…", "bullets": ["…","…"],
                  "keywords": ["a","b","c"], "dropped": false } ],
  "droppedSegments": [ { "start": 730, "end": 795, "reason": "sponsor" } ],
  "transcript": "…toàn bộ đã làm sạch…"
}
```

**Note (KN-030):** mọi fetch trong page dùng `dirBase(location.pathname)`; mọi `href` nội bộ qua `fixRelLinks()` — hoạt động với `/yt-summary`, `/yt-summary/`, `/yt-summary/index.html`.

## 8. Deliverables

| File | Vai trò |
|------|---------|
| `scripts/yt-summary/build.mjs` | pipeline: fetch → clean → segment → summarize → write JSON (no deps, Node 20) |
| `.github/workflows/yt-summary.yml` | `workflow_dispatch` (+`issues`) → build → commit → comment |
| `www/yt-summary/index.html` | markup + states + inline CSS tokens |
| `www/yt-summary/app.js` | trigger (issue/PAT) + poll + render |
| `www/yt-summary/styles.css` | tokens, table→card responsive, states |
| `www/yt-summary/data/index.json` | danh sách video |
| `scripts/yt-summary/fixtures/sample.vtt` | fixture test (pipeline) |
| `tests/e2e/yt-summary.spec.ts` | e2e: render, states, responsive, a11y, URL không slash |
| `tests/e2e/yt-summary-build.spec.ts` | test pipeline thuần (clean/segment/summary) trên fixture |
