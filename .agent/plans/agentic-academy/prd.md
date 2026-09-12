# PRD — Agentic Academy (`www/agentic-academy/`)

> Cosmic-Quantum: **Macro** — `www/agentic-academy` là "trường học" trong vũ trụ `www/`: 7 thiên hà bài học quanh 1 lõi tiến độ · **Micro** — collapse từ superposition 3 phương án UI (vanilla deck vs Reveal.js vs video) → **slide-deck vanilla 0-dep** · **Entanglement** — `lessons.js ↔ slides.js ↔ app.js ↔ store.js ↔ index.html ↔ slides.html ↔ styles.css ↔ www/index.html (Demos card) ↔ www/status.json`

## 1. Bối cảnh & Vấn đề

- Đã có **corpus 200 files (~2.7MB)** tại `docs/ai-agentic-courses/full/` + **RAG 190 sách/1.611 chunks** (`www/library/export.json`) — nhưng **chưa có đường học có cấu trúc** cho người mới bắt đầu.
- Người dùng yêu cầu: 1 trang **học + thử AI Agentic**; bài học dạng **slide fullscreen**; hướng dẫn **xây 1 hệ thống thật** áp dụng cho **nhiều IDE** (Claude Code, VS Code, Codex, Antigravity, …); mỗi bài phải có **kết quả mong muốn** (files tạo ra, nội dung, tiêu chí hoàn thành); đánh dấu **Đã học / Chưa học** lưu local, cập nhật trang chủ.

## 2. User Stories

| # | Story | Kết quả |
|---|-------|---------|
| US1 | Mở trang chủ, trong ~10s biết: học gì · bao nhiêu bài · bắt đầu ở đâu | Hero + CTA "Bắt đầu học" + 7 lesson cards |
| US2 | Vào 1 bài → xem dạng slide, **ấn 1 nút fullscreen** là học, điều hướng bằng phím | Deck viewer: F/⛶, ←→/Space/Home/End, dots, counter |
| US3 | Mỗi bài có slide "Kết quả": **files nào tạo ra · nội dung gì · tiêu chí hoàn thành** | Outcome block: bảng files + checklist criteria |
| US4 | Học xong → nhấn "Đã học"; **F5 vẫn giữ**; trang chủ cập nhật n/N | localStorage + sync 2 trang |
| US5 | Hướng dẫn áp dụng được cho Claude Code / VS Code / Codex / Antigravity (và hơn thế) | Rules/MCP/Skills map theo từng IDE, có citation |
| US6 | Xem lại / thu hồi trạng thái | Toggle ở card + nút "Đặt lại tiến độ" (confirm) |

## 3. Scope

**In:** 7 bài học dạng slide (~80 slides) · homepage có progress · localStorage · diagrams động (SVG/CSS 0-dep) · hướng dẫn multi-IDE từng bước · outcome + criteria mỗi bài · sources có citation.

**CẮT — YAGNI gate (minimal-ladder):**
- ❌ Quiz/scoring, tài khoản, server sync — localStorage đủ (user chốt "lưu tại local")
- ❌ Video, i18n EN — tiếng Việt + text 0-dep, skim/search được
- ❌ Reveal.js/Slidev — vanilla engine tái dùng pattern cosmos (ladder nấc 4-5, 0 dep)
- ❌ Light theme toggle — dark-only theo vibe VoltAgent (ghi rõ trong UI footer)
- ❌ PDF export, notes per slide — không có trong yêu cầu

**Không cắt:** a11y (keyboard/contrast/aria), reduced-motion, responsive 375/768/1280, no-pageerror, citation nguồn.

## 3b. Persistence (BẮT BUỘC — static Pages)

- **Persistence:** `localStorage["agentic-academy:progress:v1"]` = `{v:1, done:{k1:true,…}, updatedAt}` · **F5: giữ** · **Scope: per-browser** (GitHub Pages tĩnh — không sync giữa thiết bị; ghi chú ngay ở footer + trang chủ).
- Reset: nút "Đặt lại tiến độ" + `confirm()` → xoá key → render lại 0/7.

## 4. Nội dung — 7 bài học (hệ thống đích: "Agent Harness cá nhân")

| # | Bài | Accent | Outcome chính (files · tiêu chí) |
|---|-----|--------|----------------------------------|
| K1 | Agentic AI là gì? | `#00d992` | `docs/agent-notes.md` · phân loại 3 task + agent-spec 5 dòng |
| K2 | Chọn & setup IDE agent | `#22d3ee` | 1 IDE chạy được · biết file luật từng IDE (bảng verified) |
| K3 | AGENTS.md — bộ luật chung | `#a78bfa` | `AGENTS.md` + `CLAUDE.md` + `.github/copilot-instructions.md` + `.agents/rules/` · 2 IDE vượt 3 câu test |
| K4 | Skills — đóng gói năng lực | `#fbbf24` | `…/skills/<name>/SKILL.md` + 1 prompt file · auto-trigger ≥1 IDE |
| K5 | Tool Use & MCP | `#fb7185` | `mcp.json` (1 IDE) · agent gọi 1 tool thành công, log kết quả |
| K6 | Verify & Evals | `#60a5fa` | `docs/evals.md` (rubric) + rule verify trong AGENTS.md · agent không claim done thiếu evidence |
| K7 | Vòng lặp tự học (Graduation) | `#e879f9` | `docs/knowleged.md` + AGENTS.md rule học từ lỗi · 1 KN entry · graduation checklist 8 mục |

**Mỗi bài gồm:** cover (goals) → nội dung (bullets/diagram/code/steps/compare) → **outcome slide** (files + criteria) → **sources slide** (citation).

**Facts multi-IDE đã verify 2026-09-12 (citation trong bài):**
- VS Code: `.github/copilot-instructions.md`, `AGENTS.md`, `CLAUDE.md`, `.instructions.md` (applyTo), `.vscode/mcp.json` — docs vscode.com
- AGENTS.md: chuẩn mở (Agentic AI Foundation / Linux Foundation), dùng bởi Codex, Cursor, Windsurf, Copilot, Zed, Aider, opencode — agents.md
- Antigravity: rules `.agents/rules/` (legacy `.agent/rules`) + `~/.gemini/GEMINI.md`; skills `.agents/skills/`; MCP `~/.gemini/config/mcp_config.json`; 4 chế độ rule (Manual/Always/Model/Glob) — antigravity.google/docs + codelab
- Codex: `AGENTS.md` native + `~/.codex/config.toml` (MCP) — raw github openai/codex
- Claude Code: `CLAUDE.md` + `.claude/rules` + `.claude/commands` + `.mcp.json` — VS Code docs (Claude format) + workspace thực tế

## 5. Success criteria — Evals rubric (viết TRƯỚC — KN-037)

1. **Homepage 10s-test:** hero nói rõ học gì/bao nhiêu bài/bắt đầu đâu; CTA hoạt động.
2. **Outcome-driven:** 7/7 bài có slide "Kết quả" đủ 3 phần (files · nội dung · tiêu chí).
3. **Slide UX:** fullscreen 1 nút; keyboard đủ (←→ Space F Esc Home End); counter + progress đúng; transition 150-300ms không giật.
4. **Progress:** mark/undo persist qua F5; sync 2 trang; reset hoạt động; hiển thị n/N.
5. **Multi-IDE:** bảng facts khớp nguồn đã verify; mỗi bài có nguồn citation.
6. **Robustness:** 0 pageerror; 0 response ≥400; URL không slash vẫn không 404 (dirBase, KN-040); 0 overflow ngang @375px (home + slides).
7. **a11y & motion:** focus-visible; contrast ≥4.5:1; reduced-motion giữ fade + nội dung đầy đủ (KN-031).

**E2E evals:** `tests/e2e/agentic-academy.spec.ts` (8 test — RED trước, GREEN sau).

## 6. Dissent Review (KN-018)

- **Who did you think with?** — Critic-framing tự nêu + rival work khảo sát (Reveal.js/Slidev; video YouTube đã tổng hợp ở `docs/ai-agentic-courses.md`; NotebookLM "learning path").
- **Framing đối lập 1:** "Sao không dùng Reveal.js/Slidev cho nhanh, có speaker notes/transition sẵn?" → Ladder nấc 4-5: engine cosmos đã chứng minh đủ (fullscreen/keyboard/hash/overflow checks); thêm dep = thêm rủi ro Pages + không cần multi-file decks.
- **Framing đối lập 2:** "Sao không nhúng video khóa học có sẵn thay vì tự viết nội dung?" → Video không skim/search/không outcome-driven; corpus đã grounding 200 files; giữ slide text + link nguồn để học sâu.
- **Assumption có thể SAI:** "user học tuần tự 7 bài" → thực tế có thể nhảy vào K3 (rules) hoặc K5 (MCP) trước → **mọi bài vào được độc lập**, "lộ trình" chỉ là gợi ý.
- **Rủi ro nội dung:** fact IDE drifts theo phiên bản → mỗi bài có sources + ghi "kiểm tra bản IDE của bạn"; facts được verify bằng fetch ngày 2026-09-12.

## 7. Nguồn (đã có trong máy, không cần fetch thêm khi học)

- Corpus: `docs/ai-agentic-courses/full/` (200 files · Microsoft 18 lessons, HF 4 units, Anthropic 5 khóa…) + `docs/ai-agentic-courses.md`
- Sách distilled: `books/AI-Agents-for-Beginners-Distilled.md`, `books/Andrew-Ng-Agentic-AI-Playbook-2026-Distilled.md`
- Docs IDE: vscode.com/docs (custom instructions), agents.md, antigravity.google/docs (rules/skills/mcp), raw github openai/codex
- RAG: `www/library/` (190 sách agentic đã nạp — tra cứu sâu bằng `node scripts/mcp-query.mjs --q "…"`)

---
*PRD mini→full bởi YUNIE /harness · 2026-09-12 · Dissent + Evals gate đã ghi*
