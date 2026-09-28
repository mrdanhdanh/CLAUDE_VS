# Plan — Nihongo N5 Trainer (`www/japanese/`)

> Bounded steps. Verification: Playwright e2e (`tests/e2e/japanese.spec.ts`) + slop-check + responsive check.

## Bước (todo-driven)

1. **Foundation** — `styles.css` (tokens 2 theme, components, responsive) + `js/core.js` (dirBase, Store localStorage+seed, TTS wrapper, i18n `t()`, toast, dialog helpers, header/footer render, download/import utils).
2. **Seed data** — `data/seed-lessons.json` (3 bài × ~12 từ + mẫu câu N5) + `data/questions.json` (8-10 câu `sample`, schema chuẩn).
3. **Trang Học** — `index.html` + `js/learn.js`: chọn nhiều bài, shuffle, Player (state machine idle/playing/paused + steps 1s→JP→JP chậm→VI→1s), Pause/Stop, Thường/Nhanh, Mẫu câu toggle, progress, voice badge, keyboard.
4. **Trang Từ điển** — `dictionary.html` + `js/dict.js`: CRUD bài, table + search + sort + add/delete row, modal editor mẫu câu, import (gộp/thay thế), export (bài/full), khôi phục mẫu, confirm xóa.
5. **Trang Kiểm tra + Ngân hàng + Skill** — `quiz.html` + `js/quiz.js` + `js/qgen.js`: quiz engine (shuffle options + câu hỏi, chấm điểm, tổng kết), bank import/export/list, generator 4 loại câu deterministic, tab skill.
6. **Skill bundle** — `skills/question-skill/SKILL.md` + `schema.json` + `README.md` (nguồn chính thức JLPT, quy tắc chọn câu, format, checklist, quy trình agent offline).
7. **Polish** — states đủ, dark/light, reduced-motion, contrast, 44px, empty/error states.
8. **Verify** — e2e: playback sequence (TTS stub), pause/resume/stop, mẫu câu, dict CRUD + export, quiz shuffle + score, generator idempotent, 375px no-overflow, no console error/404. Chạy `npx playwright test tests/e2e/japanese.spec.ts` + `slop-check` changed files.
9. **STATUS sync** — thêm `pageMeta.japanese` vào `generate-status.mjs` → regenerate `www/status.json` → verify JSON.parse. Report.

## Test seams (nhỏ, khai báo rõ)

- `window.__NIHONGO_TEST__ = { leadMs, gapMs }` — rút ngắn wait trong e2e (prod default 1000ms).
- TTS stub qua `addInitScript` (ghi lại `{text, lang, rate}` + fire onend) — không mock logic player.
- `window.__JPQuizState()` — trả câu hỏi hiện tại (text options + đáp án đúng) để test click đúng.

## Rủi ro kỹ thuật đã xử lý sẵn trong plan

- Pause không dựa `speechSynthesis.pause()` (lỗi trên vài browser) → cancel + replay step hiện tại khi resume.
- Fetch seed qua `dirBase()` (KN-030) — test cả URL `/japanese/` lẫn `/japanese/index.html`.
- Bảng mobile: namespace class + wrapper scroll (KN-042) — không dùng tên class trùng `www/styles.css`.
- TTS headless: stub trong test; production fallback khi `speechSynthesis` không có → chỉ hiện chữ + toast.

## Definition of Done

Bug-free theo e2e, đủ acceptance criteria PRD §5, docs (PRD/Design/Plan + README + SKILL) committed, STATUS regenerate, Guard = `tests/e2e/japanese.spec.ts` (KN-056).
