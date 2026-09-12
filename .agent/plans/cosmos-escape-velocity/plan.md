# Plan — cosmos-escape-velocity

> Nguồn: roadmap card #2 (`cosmic-scale.mjs --trend N`). Pipeline rút gọn. Diff production mục tiêu ≤ ~200 LOC.

- [x] **1. RED** — `tests/e2e/cosmos-escape.spec.ts` (8 test: 5 CLI + 3 UI): 8/8 fail đúng lý do (flag chưa tồn tại → exit 0; section #escape chưa có). Entangled with: policy-check (actor verify, KN-012), playwright.config.
- [x] **2. GREEN CLI** — `cosmic-scale.mjs`: parse `--trend N`; history refactor (đọc từ `--out` || `www/cosmos/scale.json`); `result.trend`; human output đà; gate exit 1 + usage docstring. 5/5 CLI test xanh. Entangled with: scale.json (history), tests CLI.
- [x] **3. GREEN UI** — `scale.html`: section `#escape` + `renderEscape(j)` + gọi trong `render()`/catch + fix double `loadHawking()` (double fetch). 3/3 UI test xanh. Entangled with: `#timeline` (vị trí), `.web-chip` (reuse), `#evFresh`.
- [x] **4. Sync specs + trang** — `cosmos-future.spec.ts` (5 card, bỏ Escape Velocity, eta 5) · `cosmos-slides.spec.ts` (5 chip + shipped có Escape Velocity) · `index.html#future` (gỡ card, "8 hướng cũ", "còn 5 đề tài") · `slides.html#slide-15` (shipped-line + 5 chip + snapshot D=7). 12/12 spec sync xanh.
- [x] **5. Data + npm** — `package.json` thêm `cosmos:gate` = `--trend 3 --budget 10`; chạy `cosmos:refresh` → `scale.json` có `trend` (commit — KN-030). `npm run cosmos:gate` exit 0 (S=7 ≤ 10, đà 0/3).
- [x] **6. Docs** — `cosmic-quantum.instructions.md` §8 (+`--trend`) · `.github/skills/cosmic-scale/SKILL.md` (§1 --trend · §3c · §4) · `README.md` (counts 47 KN/29 bugs/69 plans/15 demos/3 routines + feature + fix drift cũ) · `export-claude` → `.claude/` (2 updated, --check khớp).
- [x] **7. Verify** — full suite **101/101** · regression scale.html specs 16/16 · slop-check: **net-new 0** (baseline HEAD = 28 findings, current = 28 — xem `verify/slop-baseline.txt` vs `verify/slop-check.txt`) · evidence screenshots + `trend-demo.txt` (4 scenario CLI) · `cosmos:gate` pass.
- [ ] **8. Ship** — commit + push + Pages deploy + live verify (`scale.html#escape` 200 + content).

## Evidence & Verify notes

| File | Nội dung |
|------|----------|
| `verify/escape-section.png` | Section #escape render từ scale.json thật (desktop) |
| `verify/escape-gate-mock.png` | State gate=true (mock route) — ⛔ dynamic |
| `verify/escape-375.png` | Mobile 375 — không tràn ngang |
| `verify/trend-demo.txt` | 4 scenario CLI: gate nổ (exit 1) · đà 3<4 (exit 0) · đà gãy (exit 0) · không flag (exit 0) |
| `verify/slop-check.txt` + `slop-baseline.txt` | 28 findings hiện tại = 28 baseline HEAD → không có finding mới từ diff này |

**Slop justification (KN-047):** `main()` 189→220 dòng (CC 92→109) — đã >80 từ trước (single-file 0-dep script, cấu trúc cố định); `render()`/index.html/slides.html scripts là pre-existing (baseline chứng minh). `renderEscape()` ban đầu CC 30 → refactor tách `freshBadge`/`arrowOf`/`gateCardHtml`/`escapeFail`/`renderEvStreak`/`renderEvWindow` → **hết finding**. Follow-up (ngoài diff): tách `main()` — đăng ký như hạng mục CMB/refactor sau.

**Evals rubric (KN-037):** 8/8 tiêu chí acceptance trong PRD pass (5 CLI + 3 UI) — bao gồm edge: thiếu history, exit code đúng, mock gate state, 375px.

## Ladder per todo (minimal-ladder)

| Todo | Nấc | Ghi chú |
|------|-----|---------|
| 1 | 7 | Test là hàng mới — không tái dùng được; viết tối thiểu 8 case |
| 2 | 2+6 | Reuse `history` + `args` parse sẵn có; logic streak = 6 dòng |
| 3 | 2 | Reuse CSS/class/pattern của #web/#hawking; không thêm CSS mới |
| 4 | 2 | Sửa chữ trong file có sẵn |
| 5 | 6 | 1 dòng package.json + chạy refresh |
| 6 | 2 | Thêm câu vào docs có sẵn |
| 7 | 2 | Suite + script có sẵn |

## Entanglement (đo bằng `entangle.mjs --file`)

- `cosmic-scale.mjs` → reverse: package.json, tests (escape/web/freshness), skills cosmic-scale, instructions cosmic-quantum, `www/cosmos/scale.json` sinh ra bởi nó.
- `scale.html` → reverse: nhiều spec (web/hawking/freshness) + entangle graph hub — sửa phải chạy full suite.
- Verify **cả cụm**: full suite (không chỉ spec mới) vì 3 spec cũ assert trên chính 2 file này.
