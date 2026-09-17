# PRD (mini) — Instruction Budget

> Task: 2026-09-16 · Nguồn: HackerNoon "How to Write a CLAUDE.md That Actually Helps Claude Code" (Xi Yang, 16/09/2026) — curated mirror.

## Vấn đề

Pool instruction `applyTo: "**"` load MỌI session = thuế token thường trú. Đo thật 16/09: **17/19 file always-on = 1395 dòng (~25k tokens)**; root `CLAUDE.md` 121 dòng thì đạt chuẩn <200, nhưng pool không có ngân sách/không có gì chặn phình (đúng pattern "Never section = graveyard" bài báo cảnh báo).

## Scope (làm)

1. Script `scripts/instruction-budget.mjs` — đo dòng/~tokens theo `applyTo`, gate `--budget`, fail-closed exit 2.
2. Guard spec `tests/e2e/instruction-budget.spec.ts` + npm `budget:check` (ratchet 1400 dòng always-on).
3. §7 Anti-Patterns: quy ước 🤖 = máy đã giữ (trỏ check) — audit 21 mục, 3 mục có guard thật được trỏ.

## Non-goals (CẮT — YAGNI)

- KHÔNG tự ý đổi `applyTo` của 17 file (thay đổi semantics load — cần eval riêng, để human quyết).
- KHÔNG thêm gate vào CI workflow (chưa có workflow cho gates; npm script + spec là đủ lớp).
- KHÔNG flip toàn bộ 21 anti-pattern sang positive rule (churn lớn, bounded edit theo KN-060).

## Acceptance

- `npm run budget:check` exit 0 khi pool ≤ 1400 dòng; exit 1 khi vượt; spec 3/3 pass.
- Không regression: specs liên quan (ai-news-curated, kn-id-integrity) vẫn xanh.
- Pool always-on sau thay đổi ≤ 1400 (không tăng — quy ước là 1 dòng).

Persistence · F5 · Scope: N/A — không phải trang static `www/`.
