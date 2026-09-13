# Slop Audit — toàn repo (2026-09-13)

> Chạy bởi YUNIE sau khi trả nợ `www/ai-news/ai-news.js` (17→0). Tool: `node scripts/slop-check.mjs --scan` (KN-047).

## Tổng quan

- **296 findings** · **92 files** · dup **10** · size **73** · complexity **213**
- Ngưỡng: dup ≥8 dòng · fn >80 dòng · CC >12

## Top 30 files theo số findings

| # | Findings | File | Nhóm |
|---|----------|------|------|
| 1 | 18 | `.github/harness/scripts/harness-manager.mjs` | P1 core |
| 2 | 17 | `.github/harness/scripts/auto-learn.mjs` | P1 core |
| 3 | 13 | `www/app.js` (STATUS) | P1 core |
| 4 | 12 | `www/web-thuat-toan/app.js` | P2 (10/12 là dup doStep) |
| 5 | 11 | `www/web-universe/js/app.js` | P2 |
| 6 | 10 | `www/library/app.js` | P2 |
| 7 | 8 | `www/ai-news/fetch.mjs` | P3 dev |
| 8 | 8 | `.github/harness/scripts/auto-researcher.mjs` | P1 core |
| 9 | 6 | `www/web-universe/js/modules/storage-lab/index.js` | P2 lab |
| 10 | 6 | `scripts/yt-summary/build.mjs` | P3 dev |
| 11 | 5 | `www/design-showcase/app.js` | P2 |
| 12 | 5 | `www/web-universe/js/modules/file-lab/index.js` | P2 lab |
| 13 | 5 | `www/web-universe/js/modules/svg-lab/index.js` | P2 lab |
| 14 | 5 | `www/web-universe/js/modules/webgl-lab/index.js` | P2 lab |
| 15 | 5 | `www/yt-summary/app.js` | P2 |
| 16 | 5 | `www/yt-summary/pipeline.mjs` | P3 dev |
| 17 | 5 | `scripts/audit.mjs` | P3 dev |
| 18 | 4 | `www/web-universe/js/modules/data-lab/index.js` | P2 lab |
| 19 | 4 | `www/web-universe/js/modules/game-lab/index.js` | P2 lab |
| 20 | 4 | `www/web-universe/js/modules/markdown/index.js` | P2 lab |
| 21 | 4 | `www/web-universe/js/modules/speech-lab/index.js` | P2 lab |
| 22 | 4 | `scripts/library-ingest.mjs` | P3 dev |
| 23 | 4 | `.github/harness/scripts/entangle.mjs` | P1 core |
| 24 | 3 | `www/n5-blazor/site.js` | P2 |
| 25 | 3 | `www/web-universe/js/modules/dependency-graph/index.js` | P2 lab |
| 26 | 3 | `www/web-universe/js/modules/diff/index.js` | P2 lab |
| 27 | 3 | `www/web-universe/js/modules/plugin-lab/index.js` | P2 lab |
| 28 | 3 | `scripts/library-ingest-batch.mjs` | P3 dev |
| 29 | 3 | `.github/harness/scripts/plan-validate.mjs` | P1 core |
| 30 | 3 | `scripts/agent-registry.mjs` | P3 dev |

*+62 file còn lại, mỗi file 1-2 findings.* 

## Điểm nóng đáng chú ý

- `agentic-academy/*.js`: `lessons.js` 514 dòng IIFE · `slides.js` CC 104 · `diagrams.js` 226 dòng · `store.js` CC 30 → nặng nhất repo (anonymous IIFE chứa cả app).
- `fetch.mjs` (ai-news): lặp lại y hệt pattern vừa fix bên `ai-news.js` (fetch+map trộn, main CC 44).
- `web-thuat-toan/app.js`: 10/12 findings là **cùng 1 dup block** `var done=doStep(); if(done) finish();` — 1 helper là diệt hết.
- `auto-learn.mjs` 17 findings = residual đã biết (từ đợt auto-learn-split 22→18, watchdog/main CC40/45 đã tách, còn lại nhỏ hơn).

## Đề xuất batch (thứ tự ưu tiên)

| Batch | Nội dung | Findings | Rủi ro |
|-------|----------|----------|--------|
| **1** | Core harness: `harness-manager` + `auto-learn` + `auto-researcher` | ~43 | Cao — có tests pairwise + CLI verify |
| **2** | STATUS page `www/app.js` | 13 | Trung — có `status-audit.spec.ts` |
| **3** | `web-thuat-toan` dup block → 1 helper | 12→~2 | Thấp — 10 là 1 pattern |
| **4** | `fetch.mjs` + yt-summary build/pipeline | ~19 | Thấp — dev scripts |
| **5** | web-universe modules + agentic-academy | ~60+ | Thấp–TB — lab/demo, verify bằng e2e hiện có |

**Justify tạm (không fix ngay):** ~62 file với 1-2 findings mỗi file — nợ nền chấp nhận được, gộp vào batch khi có dịp sửa file đó vì lý do khác (boy-scout rule).
