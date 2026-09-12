# Plan — yt-summary

**Cosmic-Quantum:** Macro *www/yt-summary là 1 thiên hà trong vũ trụ www/ (data tĩnh + CI ngoài)* · Micro *superposition 2 luồng trigger (issue/PAT) → collapse theo token có/không* · Entanglement *www/index.html ↔ www/status.json ↔ .github/workflows/pages.yml ↔ tests/e2e*

## Todos (todo-driven, 1 in-progress tại 1 thời điểm)

| # | Việc | Ladder nấc | Entangled with |
|---|------|-----------|----------------|
| 1 | Explore pattern `ai-news` + `dirBase` | 2 (reuse) | — |
| 2 | Ghi PRD/Design/Plan | 1 | `.agent/plans/yt-summary/` |
| 3 | `scripts/yt-summary/build.mjs` (parse/clean/segment/summarize) | 3 (stdlib) | workflow |
| 4 | `.github/workflows/yt-summary.yml` (dispatch + issues) | 2 (copy ai-news.yml) | `pages.yml`, `data/*.json` |
| 5 | `www/yt-summary/{index.html,app.js,styles.css}` | 2 (reuse www tokens) | `www/index.html`, `status.json` |
| 6 | Sinh `data/*.json` mẫu **thật** bằng chính build.mjs trên fixture | 1 | page render |
| 7 | Test: `tests/e2e/yt-summary-build.spec.ts` (RED trước) + `yt-summary.spec.ts` | 7 | — |
| 8 | Nav: `www/index.html` quick-card + `status.json` pages.entries | 2 | `generate-status.mjs` |
| 9 | Verify: playwright all, 375/768/1280, a11y, URL không slash (KN-030/KN-040) | 7 | — |

## Ràng buộc nhớ khi code (từ knowleged.md)

- **KN-002:** validate `JSON.parse` + serve 200 trước khi coi xong.
- **KN-012:** `*.spec.ts` là **immutable** — chỉ actor `verify` được tạo/sửa; FAIL thì sửa production code.
- **KN-029:** không nhét `<link rel=stylesheet>` third-party vào head (script-blocking) → dùng font hệ thống.
- **KN-030/KN-040:** `dirBase()` cho fetch, `fixRelLinks()` cho `href` — test cả `/yt-summary` không slash.
- **KN-031:** `prefers-reduced-motion` → giữ fade, bỏ translate; test Edge nếu cần.
- **KN-032:** test phải assert **không pageerror/console error**.
- **KN-037:** Evals Gate — rubric viết trước khi Verify.
- **§3b:** Persistence/F5/Scope đã ghi ở PRD §7.

## Evals Gate — rubric (viết TRƯỚC khi verify)

| # | Tiêu chí | Cách đo | Đạt khi | Kết quả đo |
|---|----------|---------|---------|-----------|
| R1 | Bảng tóm tắt đọc hiểu được, không rác | Đọc 3 segment từ fixture, kiểm câu không cắt cụt, không lặp | ≥ 2/3 dòng đọc hiểu ngay | ✅ 5/5 dòng (vd S1 "Hôm nay chúng ta sẽ nói về cơ sở dữ liệu vectơ…", S4 "chuyển sang các mối quan tâm về sản xuất…") |
| R2 | Lược bỏ thật sự | So `cleanedPct` + list `droppedSegments` với transcript gốc trong fixture | Sponsor/music/subscribe bị bỏ ≥ 90%; nội dung chính giữ | ✅ 21% lược · vùng sponsor 1:16–1:39 + outro 3:59–4:11 + intro 0:00–0:11; anchors HNSW/nearest neighbor/quantization còn nguyên |
| R3 | Điều hướng thời gian | Click row → transcript đúng khoảng thời gian | 100% khớp | ✅ test `toggle vi ↔ bản gốc + accordion` — detail mở đúng phần (aria-expanded + 1 detail visible) |
| R4 | Trang nói thật về giới hạn | Có nhãn "extractive · không dùng AI key" ở first screen | Có, và không chỉ ở footer | ✅ hero-meta: "Tóm tắt **extractive**" + "Dịch vi: gtx / MyMemory — **không API key**" (assert trong spec) |
| R5 | UX states | 5 state render đúng, không nhấp nháy, aria-live hoạt động | 5/5 | ✅ idle/invalid (toast test)/running (timeline steps)/success/partial-warning (chip + notice); error-no-transcript → build exit 3 + message |
| R6 | Mobile 375 | Không tràn ngang, tap target ≥ 44px, table → card | 0 overflow | ✅ 0 overflow + bảng fit container (`scrollWidth≤clientWidth`) + card layout (verify sau fix KN-042) |

**Error analysis (KN-034):** 3 failures cùng loại phát hiện qua visual check — đều thuộc **1 pattern**: "class/element toàn cục đè trang mới" (`.table-wrap` hidden, `table{min-width:560px}`, `[hidden]` bị `display:block` đè) → fix pattern (namespace + invariant test), không fix từng instance. 1 pattern thứ 2: "parser API ngoài giả định 1 shape" + "circuit breaker chung" → fix pattern (parser đa hình + breaker theo host) — xem KN-041.

**TDD trace:** `tests/e2e/yt-summary-build.spec.ts` (7 test pipeline: parse/clean/segment/summarize/buildDoc/chunk/id) + `tests/e2e/yt-summary.spec.ts` (8 test trang) — RED trước (7 fail đầu tiên: expected failures khi chưa có UI/trang) → GREEN 14/14; full suite 68/68.

## Deliverables (done)

| File | Vai trò |
|------|---------|
| `www/yt-summary/pipeline.mjs` | module thuần dùng chung node+browser (0 dep) |
| `scripts/yt-summary/build.mjs` | CLI: 3 lane extraction → clean/segment/summarize → dịch vi (gtx→clients5→mymemory) |
| `.github/workflows/yt-summary.yml` | dispatch + issues → build → commit → comment |
| `www/yt-summary/{index.html,app.js,styles.css}` | UI 2 mode + bảng + transcript + library |
| `www/yt-summary/data/{index,demo-vector-db}.json` | seed data thật (từ fixture qua chính pipeline) |
| `www/yt-summary/fixtures/demo.vtt` | fixture auto-caption đầy đủ rác |
| `tests/e2e/yt-summary{,-build}.spec.ts` | 7 + 8 test |
| `.agent/plans/yt-summary/verify/*` | probe scripts + logs + screenshots (evidence) |
