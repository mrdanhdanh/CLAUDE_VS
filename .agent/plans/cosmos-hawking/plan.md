# Plan (mini) — Hawking Radiation · Nợ bay hơi

| # | Todo | Status | Ladder | Entangled with |
|---|------|--------|--------|----------------|
| 1 | TDD: spec `cosmos-hawking.spec.ts` (RED) | ✅ RED 5 fail → GREEN 5 pass | 4 (native e2e) | `tests/e2e/cosmos-hawking.spec.ts` |
| 2 | Implement `auto-learn.mjs watchdog` | ✅ + fix bug scope `text` (bắt bởi test --apply) | 2 (reuse parseArgs + regex Status) | `auto-learn.mjs` |
| 3 | Gen `hawking.json` + chain `cosmos:refresh` + alias `npm run hawking` | ✅ chain 4 bước (graph→scale→hawking→status) | 6 | `package.json`, `www/cosmos/hawking.json` |
| 4 | Section `#hawking` trên `scale.html` | ✅ reuse `.bh-item`/`.fresh`/`.web-empty` + `loadHawking()` + refresh button | 2 (reuse) | `scale.html` |
| 5 | Routine nhắc tuần (card: "nhắc mỗi routine") | ✅ `914206` cron `0 9 * * 1` | 4 (CLI có sẵn) | `.agent/routines.json` |
| 6 | Roadmap: Hawking → shipped (7 hướng) · card mới 🚀 Escape Velocity | ✅ 6 card / 6 eta giữ nguyên | 6 | `index.html#future-grid` |
| 7 | Slides 15 sync + 2 spec cũ (verify actor + policy-check) | ✅ PERMITTED ×2 | — | `slides.html`, `cosmos-future.spec.ts`, `cosmos-slides.spec.ts` |
| 8 | Docs sync + export-claude + prd cosmic-web follow-up dissent | ✅ mirrors khớp · dissent được hành động hoá | — | `.github/instructions/auto-learn...`, `.github/skills/cosmic-scale/SKILL.md` |
| 9 | Verify: full suite + evidence + README counts + audit | ✅ **91/91 pass** · 2 shots · audit 64 chained | — | `.agent/plans/cosmos-hawking/verify/` |
| 10 | **Siết gate: human sign-off** (user duyệt "ok") — `--apply` cần `--sign`; agent tự ký = REFUSED; journal `signedBy`; routine + docs + UI cập nhật | ✅ RED 3 fail → GREEN 5/5 spec · demo 3 tình huống → `verify/gate-demo.txt` | 6 (gate trong script, no dep) | `auto-learn.mjs`, `cosmos-hawking.spec.ts`, `scale.html`, routine `3bf2c8`, `auto-learn.instructions.md`, `cosmic-scale/SKILL.md` |

## Evals rubric (viết TRƯỚC — KN-037) → kết quả
| Tiêu chí | Kết quả |
|----------|---------|
| Fixture 4 bug (254/42/2d open + fixed): counts `{4, open 3, fresh 1, escalate 1, evaporate 1, closed 1}`, sort desc | ✅ |
| `_template/` bỏ qua · boundary 30d=escalate · 89d=escalate · 90d=evaporate | ✅ |
| `--apply` lần 1: journal 2 entry · note `hawking.md` (có ngày + gợi ý propose) · `Status → evaporated`, không mất lịch sử | ✅ |
| `--apply` lần 2 idempotent: journal không thêm entry; open 3→2 | ✅ |
| `--out` ghi JSON hợp lệ · `--now` tất định | ✅ |
| `scale.html#hawking` render từ `hawking.json` thật (fetch 200, advice khớp counts, empty-state) | ✅ |
| 375 không tràn ngang · no pageerror | ✅ |
| Chain `cosmos:refresh` sinh đủ 4 file · full suite xanh | ✅ 91/91 |

## Bug bắt được trong implement (TDD bắt đúng)
- `ReferenceError: text is not defined` trong nhánh `--apply` (biến `text` scoped ở vòng lặp scan) → test `--apply` fail ngay lần chạy đầu → fix bằng đọc lại `bug.md` trong nhánh evaporate. Nếu không có test này, mutation sẽ crash giữa chừng (journal đã ghi nhưng Status không đổi — inconsistent state).

## Ghi chú governance
- `--apply` là **opt-in** — mặc định chỉ báo cáo (dissent framing #1: mutation bug.md phải fail-safe).
- Journal `.agent/hawking.jsonl` append-only + idempotent (chỉ ghi khi action đổi) — đúng rogue-trader hardening pattern.
- 2 spec edits qua `policy-check --actor verify` → PERMITTED; audit chain 64 chained, sig ok.
- Không dependency mới · không pin `model:` · `evaporated` không bị đếm là draft (đã verify `cosmic-scale.mjs:104`).
