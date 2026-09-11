# Plan (mini) — Cosmos Slides Refresh

| # | Todo | Status | Ladder | Entangled with |
|---|------|--------|--------|----------------|
| 1 | Refresh scale.json + status.json (`npm run cosmos:refresh`) | ✅ D=8, S=0, G=3, KN=40 | 4 (native script) | `www/cosmos/scale.json`, `www/status.json`, `www/cosmos/audit.json` |
| 2 | TDD: viết spec cosmos-slides (RED) | ✅ RED confirmed (8/15 aria + eyebrow 08 + slide 15 cũ) | 4 (native e2e) | `tests/e2e/cosmos-slides.spec.ts` |
| 3 | Sửa slides.html: numbering (7 aria) + time 01:30 (×2) + slide 11 eyebrow + slide 10 D=8 + slide 15 (ship line + 6 đề tài + `.eta-chip`/`.shipped-line`) | ✅ + trim overflow 37→0px | 6 (1 block HTML + 2 class CSS) | `www/cosmos/slides.html` |
| 4 | Verify GREEN + get_errors + screenshot | ✅ 3/3 slides · 46/46 full suite · no pageerror | — | `.agent/plans/cosmos-slides-refresh/verify/` |
| 5 | Audit log + báo cáo | ✅ | — | — |

## Verify checklist
- [x] TDD RED → GREEN: `.slide` count 15 · aria "N trên 15" ×15 · `#timeLabel` + `#stageTime` = "/ 01:30"
- [x] Slide 11 eyebrow "11 · Lab — Superposition & Entanglement" (hết "08 ·")
- [x] Slide 15: đủ 6 đề tài (Cosmic Web · Hawking · CMB · LIGO · Quantum Error Correction · Wormhole), có "Đã ship", hết "Multiverse picker"
- [x] Slide 10: D=8 khớp `scale.json` vừa đo
- [x] Không pageerror (KN-032) · screenshot evidence slide 1 + slide 15
- [x] Overflow slide 15 = 0px (đo Playwright `scrollHeight − clientHeight`) — không còn nút bị controls che
- [x] `get_errors`: slides.html + spec sạch
