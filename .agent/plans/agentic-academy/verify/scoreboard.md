# Verify — Agentic Academy (evidence + scoreboard)

> Ngày: 2026-09-12 · Người verify: YUNIE · Pipeline: /harness (Explore → … → Verify)

## 1. E2E evals (Playwright — tdd-gate RED → GREEN)

| Bước | Kết quả |
|------|---------|
| RED (spec viết trước, pages chưa có) | **8/8 failed** — đúng chủ đích |
| GREEN sau implement | **8/8 passed** (`tests/e2e/agentic-academy.spec.ts`) |
| Full suite (không hồi quy) | **68/68 passed** (`full-run.txt`) |

Test phủ: home (hero/7 cards/0-7/no-error/no-4xx + opacity sau animation) · card→deck · counter/Arrow/End/outcome + opacity ·
mark + F5 persist + sync home · reset + confirm · deep-link k3 + URL không slash · 375 no-overflow + fullscreen fallback immersive · reduced-motion.

## 2. Rubric (viết TRƯỚC ở PRD §5 — KN-037)

| # | Tiêu chí | Kết quả | Bằng chứng |
|---|----------|---------|-----------|
| 1 | Homepage 10s-test | ✅ | screenshot `home-1280.png` — hero + CTA + 7 cards |
| 2 | 7/7 bài có outcome slide (files · nội dung · tiêu chí) | ✅ | `deck-k1-outcome.png` + data `lessons.js` |
| 3 | Slide UX: fullscreen 1 nút, keyboard, counter | ✅ | spec test 3/7 + `deck-k1-cover.png`, `deck-k1-diagram.png` |
| 4 | Progress: persist, sync, reset | ✅ | spec test 4/5 (localStorage + F5) |
| 5 | Multi-IDE facts có citation | ✅ | mỗi bài có slide Nguồn; facts verify 2026-09-12 (VS Code docs, agents.md, antigravity.google, codex repo) |
| 6 | Robustness: 0 pageerror, 0 4xx, URL không slash, 375 không overflow | ✅ | spec test 1/6/7 (badResponses + overflow đo bằng scrollWidth) |
| 7 | a11y + reduced-motion giữ nội dung | ✅ | spec test 8 (opacity > 0.9 khi reduce) + skip-link/aria/contrast |

## 3. Bugs phát hiện & fix trong Verify (honest log — KN-005/KN-028)

| # | Bug | Phát hiện bởi | Fix |
|---|-----|---------------|-----|
| 1 | **Cards/slide-content vô hình sau animation** — base `opacity:0` + `fill-mode:backwards` → hết animation quay về 0. Test behavior xanh vì Playwright coi opacity:0 là "visible" | **screenshot** (test bỏ lọt!) — đã thêm assertion `opacity > 0.95` vào spec để khóa hồi quy | bỏ `opacity:0` khỏi base; reveal chỉ dựa animation (fail-safe: animation chết → nội dung vẫn hiện) + `.slide:not(.active)` tắt stagger |
| 2 | serve clean-URLs redirect `slides.html?lesson=k3` → drop query → luôn hiện bài 1 | spec test 2/6 | `www/serve.json`: `cleanUrls:false` (kèm rewrites/threshold để không phá trang cũ) |
| 3 | URL `/agentic-academy` (không slash) + rewrite → `./store.js` resolve thành `/store.js` → **404 asset** | spec test 6 (badResponses) | `trailingSlash:true` → redirect thêm slash (như GitHub Pages) + rewrites source không-slash |

## 4. Dead-code + scoreboard (minimal-ladder)

- 8/8 diagram builder có dùng thật (`agent-loop` K1, `when-agent` K1, `ide-matrix` K2, `file-tree` K3+K7+home, `progressive` K4, `mcp-flow` K5, `eval-loop` K6, `learning-loop` K7) — grep khớp.
- Không thêm dependency nào; không webfont (KN-029); không framework.

| File | Dòng | Bytes |
|------|------|-------|
| index.html | 149 | 8.3 KB |
| slides.html | 50 | 2.5 KB |
| styles.css | 485 | 30.2 KB |
| lessons.js | 510 | 45.7 KB |
| slides.js | 309 | 16.2 KB |
| diagrams.js | 230 | 13.4 KB |
| app.js | 142 | 6.1 KB |
| store.js | 100 | 3.4 KB |
| spec | ~190 | — |
| **Tổng** | **~2.165** | **~127 KB** |

## 5. Screenshots (thư mục này)

`home-1280.png` · `home-375.png` · `home-1of7.png` · `deck-k1-cover.png` · `deck-k1-diagram.png` · `deck-k1-outcome.png` · `deck-k5-375.png` · `full-run.txt`

## 6. Known limitations (không giấu)

- localStorage per-browser — không sync thiết bị (đã ghi rõ trong UI footer + progress panel).
- Emoji trong headless chromium render khối màu (thiếu font emoji) — trên trình duyệt thật (Windows/mac) hiển thị đúng.
- Facts IDE verify 2026-09-12 — IDE cập nhật bản mới thì slide Nguồn có ghi chú kiểm tra lại.

---

## 7. BỔ SUNG — Light theme (2026-09-12, theo yêu cầu user)

Task riêng: `.agent/plans/agentic-academy-light/` (prd · design · plan) · Spec: test 9-10.

| Bước | Kết quả |
|------|---------|
| RED | 2/2 fail (chưa có `#themeBtn`) |
| GREEN | **2/2 pass** — toggle + persist F5 + đồng bộ home↔deck + contrast WCAG |
| Full suite | **70/70 passed** (`verify-full.txt`, lần 2; lần 1 có 1 flake `cosmos-rework #2` khi chạy song song — isolated 7/7 pass, không liên quan) |

**Rubric light (PRD-light §tiêu chí):**
1. ✅ Toggle tức thì 2 trang + F5 giữ — test 9
2. ✅ Theo `prefers-color-scheme` khi chưa chọn + early init trong `<head>` trước stylesheet (chống flash — KN-006) — test 10
3. ✅ Contrast **≥ 4.5:1 cả 2 theme** — đo bằng công thức WCAG trong test (`bodyContrast()`), không nhìn mắt (KN-023): light `--body #3c4a5c` trên `#f5f7fb` ≈ 8.9:1
4. ✅ 0 pageerror / 0 4xx — test 9-10
5. ✅ Screenshots: `home-light-1280.png`, `deck-k1-light.png`, `home-dark-1280.png`, `deck-k1-dark.png`

**Refactor kèm theo:** 13 literal `rgba(255,255,255,…)` lặp → 3 token (`--link`, `--card-grad`, `--track`); block `[data-theme="light"]` override tường minh cho diagram SVG (giữ accent cho `.box.core/.ok/.go/.warn/.flow.arc` — base specificity thấp hơn nên phải restore), chips, toast, code, cover-num.

**Files đổi:** `styles.css` (+~60 dòng light block) · `store.js` (+theme module, export `Academy.theme`) · `index.html`/`slides.html` (+early-init script + nút `#themeBtn`) · spec (+2 test, +helper contrast).

**Không làm (YAGNI):** theme cho các trang khác trong `www/`; auto-đổi khi hệ thống đổi giữa chừng (chỉ đọc lúc load — ghi rõ trong design).

---

## 8. BỔ SUNG — Content review 7 bài (fresh-eyes, 2026-09-12)

Task riêng: `.agent/plans/agentic-academy-light/` không đổi · Report đầy đủ: **`content-review.md`** (cùng thư mục này).

- Phương pháp: rubric 6 tiêu chí (viết trước) → tự đọc + **Critic agent độc lập** → hội tụ findings → sửa → khóa test.
- **6 blocker + 10 major đã sửa** trong `lessons.js` (+ `slides.js` chip "Cần trước" + homepage prep chips).
- Test mới khóa hành vi: chip "🧩 Cần trước" trên cover (test 6) + chip chuẩn bị homepage (test 1).
- **Spec 10/10 pass** · **Full suite 70/70 pass** (`full-run-content-fix.txt`) · grep đối chứng: 0 sót nội dung lỗi cũ.
- Defer có lý do (không giấu): Bài 0 riêng, đảo K2 lên trước K1, quiz/answer key, free-compute path — chi tiết trong `content-review.md §3`.
