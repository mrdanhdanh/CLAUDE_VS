# PRD — Quất 4 món + Playwright (Xaidr-lite + Engram-lite + Jern-lite + Flawd)

> Mini PRD — Idea: Tích hợp 4 pattern hữu dụng từ 30 ngày qua (Xaidr, Engram, Jern, Flawd) + dựng Playwright foundation cho www/ — theo minimal ladder, reuse-first.

## Vision
Harness v2 đã có governance (policy + audit hash-chain KN-012), auto-learn (BM25 KN-007), AAR benchmark (KN-010) nhưng thiếu: (1) scan tool_call trước khi chạy, (2) memory MCP có Wilson rank, (3) policy digest pin per-session, (4) mutation testing chống test yếu, (5) e2e Playwright cho www/. Quất 1 lần cho đủ.

## User Stories
- **P0 — Dev/YUNIE:** `npx playwright test` chạy e2e cho `www/` (STATUS + ai-news + responsive 375/768/1280 + đo --angle 500ms) — CI pass, không đo bằng mắt (KN-003/004).
- **P0 — Verify:** `npx flawd` hoặc `stryker` chạy mutation cho JS/TS — phát hiện test yếu, chống reward hacking (KN-012).
- **P1 — Governance:** `policy-check.mjs --tool shell --target "rm -rf /tmp"` bị chặn + phân loại `impact_class` (credential_access/infra_destruction) → `require_approval` (học Xaidr).
- **P1 — Memory:** `auto-learn.mjs suggest "rainbow border"` trả top-3 KN có Wilson score + `attest` sau fix để tăng rank (học Engram).
- **P1 — Audit:** Mỗi `audit log` ghi `policyDigest` (SHA-256 của policy.json) + meter `tokenCount`/`durationMs` per attempt (học Jern).

## Scope In (YAGNI gate — GIỮ)
- **Playwright foundation:** `playwright.config.ts` + `tests/e2e/*.spec.ts` (STATUS render, ai-news render, responsive, --angle) + `npm run test:e2e` + hook vào Verify.
- **Flawd-lite:** script `flawd` hoặc `stryker` config cho JS/TS, chạy local, không rời máy, report mutation score.
- **Xaidr-lite:** nâng `policy-check.mjs` thêm `scan_tool_call` + `impact_class`/`impact_tier` + `require_approval` effect.
- **Engram-lite:** nâng `auto-learn.mjs` thêm `attest` + Wilson score + MCP-like `search`/`get` (local, không Cloudflare).
- **Jern-lite:** `audit.mjs` thêm `policyDigest` + `meter` (token/cap), `policy-check.mjs --digest` để pin.

## Scope Out / Non-Goals (YAGNI gate — CẮT)
- CẮT Cloudflare D1/Vectorize/Nostr (Engram full) — chỉ local BM25 + Wilson.
- CẮT Python xaidr full (4 boundaries + nano ML) — chỉ JS policy-check nâng cấp.
- CẮT Jern Cloud isolated machine/gateway — chỉ digest pin + meter local.
- CẮT Flawd binary 5 ngôn ngữ — chỉ JS/TS cho www/ + scripts.
- CẮT UI mới — CLI + markdown report, không thêm trang www/ mới (trừ test report nếu cần).

## Metrics
- `npx playwright test` pass 100% (chromium), đo --angle thay đổi sau 500ms (KN-003).
- `policy-check --tool shell --target "cat ~/.ssh/id_rsa"` → blocked/approval_required với impact_class.
- `auto-learn suggest` trả Wilson score, `attest` tăng score.
- `audit log` có `policyDigest` + `audit verify` chain OK.
- `flawd`/`stryker` chạy được, report mutation score.

## Persistence · F5 · Scope
- Playwright: không persistence (test ephemeral).
- auto-learn: `docs/knowleged.md` + `.agent/bugs/` + `.agent/attestations.jsonl` (local, gitignore attestations).
- audit: `.agent/audit.jsonl` append-only + `.agent/policy.json` digest pin.
- Flawd: report `.agent/mutation-report.json` (gitignore).

## Nguồn
- Xaidr: `github.com/delphisecurity/xaidr` — 4 boundaries, impact_class, require_approval, <1ms.
- Engram: `github.com/aiengram/engram` — BM25+Vectorize→RRF→Wilson, Nostr, fail-closed publish.
- Jern: `jern.ai` — policy digest pin, isolated machine, metered cap, encrypted evidence.
- Flawd: `fixture.dev/flawd` — mutation testing 5 langs, local, code không rời máy.
- Nội bộ: KN-003/004 (--angle), KN-007 (auto-learn), KN-012 (governance), KN-013 (minimal ladder).

## Risks
- Playwright thiếu browser binary → mitigation: `npx playwright install chromium` + CI cache.
- Flawd chưa có npm package → fallback Stryker.
- Xaidr-lite over-block → mitigation: monitor mode trước, flag thay vì block cho ambiguous.
