# Plan - Detection + Egress P0

## T1 - RED tests
- **Test:** create `tests/e2e/detection-egress-p0.spec.ts`.
- Assert missing behavior, chạy Playwright và lưu output fail.

## T2 - Detection implementation
- **Production:** `.github/harness/scripts/auto-learn.mjs`, `.agent/bugs/_template/bug.md`.
- Extract mode strict, thống kê status + JSON.

## T3 - Egress implementation
- **Production:** `.github/harness/scripts/cua-guard.mjs`.
- Identity normalization, unattended refusal, exact policy tuple, trusted-human fail-closed, evidence allowlist/redaction.
- **P1 boundary:** chưa giả lập human approval bằng `--supervised`; takeover receipt/UI và policy digest/signature là task riêng sau P0.

## T4 - Component wiring
- **Config:** `.github/harness/evals/components.json`.
- Thêm CLI eval thật, không mock.

## T5 - Verify
- Focused Playwright, component evals, full suite, syntax/errors, slop, diff scoreboard.
- Full-suite concurrent failures được ghi riêng, không giả vờ pass.
- Independent review-only pass trước Done.

## Scoreboard target

- Diff reviewable `<= 200 LOC` nếu có thể; phần vượt phải chia batch.
- Không thêm package/dependency.
- Không chạm các file Cosmos đang có thay đổi chưa commit.
