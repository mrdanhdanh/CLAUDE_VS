# Plan (mini) — Cosmos · Lab #12 QEC + Roadmap Sync

| # | Todo | Status | Ladder | Entangled with |
|---|------|--------|--------|----------------|
| 1 | TDD: spec `cosmos-lab12-qec.spec.ts` (RED) | ✅ RED 7 fail → GREEN 7 pass | 4 (native e2e) | `tests/e2e/cosmos-lab12-qec.spec.ts` |
| 2 | Implement Lab #12 (HTML + CSS `.qec-*` + JS IIFE) | ✅ reuse class/pattern 11 lab cũ | 2 (reuse) | `www/cosmos/index.html` |
| 3 | Fix `id="future"` + copy 11→12 thí nghiệm | ✅ + comment nêu lý do | 6 | `index.html` (scroll-dot JS, observer) |
| 4 | Sync roadmap index (QEC → đã ship + Light Echo) | ✅ giữ 6 card / 6 eta | 6 | `index.html#future-grid` |
| 5 | Sync slides 15 (shipped 5 mục + Light Echo + S=5·D=8·G=4) | ✅ | 6 | `www/cosmos/slides.html` |
| 6 | Sync STATUS copy "4 lab tương tác" → 12 lab | ✅ (câu + nút) | 6 | `www/index.html` |
| 7 | Update spec counts/topics (actor `verify`) | ✅ policy PERMITTED · Implement REFUSED (gate đúng) | — | `cosmos-rework.spec.ts` (11→12 · poll 5→8s), `cosmos-future.spec.ts`/`cosmos-slides.spec.ts` (QEC→Light Echo) |
| 8 | Refresh data `npm run cosmos:refresh` | ✅ S=5 · D=8 · G=4 · KN=46 · audit mirror 50 events | 4 | `scale.json`, `status.json`, `audit.json` |
| 9 | Verify: full suite + 375/768/1280 + get_errors + screenshots | ✅ **81/81 pass** · 5 evidence shots | — | `.agent/plans/cosmos-lab12-qec/verify/` |
| 10 | Learn: bug scroll-dot → KN-046 + maintenance chain + audit log | ✅ KN 45→46 · bugs 28→29 · distill-agnostic regenerated | — | `docs/knowleged.md`, `.agent/bugs/2026-09-12-cosmos-future-scroll-dot/` |

## Evals rubric (viết TRƯỚC khi implement — KN-037) → kết quả
| Tiêu chí | Kết quả |
|----------|---------|
| 12 lab card, card QEC có badge + 3 tile | ✅ |
| inject → measure (FAIL + `file:line`) → fix → GREEN + fidelity 100% | ✅ |
| fix khi chưa đo → bị chặn ("đo syndrome trước") | ✅ |
| "sửa test cho pass" → ⛔ REFUSED (deny-test-mutate) | ✅ |
| 3 workaround → 🌑 Event horizon → takeover, inject disabled, Reset mở lại | ✅ |
| measure khi không có lỗi → "0 syndrome" (không bịa) | ✅ |
| 9/9 scroll-dot resolve + click "Tương lai" tới `#future` | ✅ |
| 375: card visible, không tràn ngang | ✅ |
| no pageerror / console error mọi tương tác (KN-032) | ✅ |
| Full suite không regression | ✅ 81/81 |

## Ghi chú governance (test edits)
- 3 spec cũ sửa với `--actor verify` (policy-check PERMITTED); `--actor Implement` → `deny-test-mutate` **REFUSED** (gate hoạt động đúng — bằng chứng trong terminal).
- Lý do từng thay đổi: count 11→12 (lab mới theo thiết kế) · topic QEC→Light Echo (QEC đã ship) · poll 5000→8000ms (trang dài thêm ~450px — timing bound, **không** nới invariant "0 reveal kẹt ẩn").
- Không thêm dependency · không pin `model:` · không đổi layout/palette 11 lab cũ.
