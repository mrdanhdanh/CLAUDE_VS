# Design — Quất 4 món + Playwright

## Design System (reuse www/ tokens)
- **Palette:** reuse `www/styles.css` CSS variables (`--color-primary`, `--bg`, `--text`, `--border`, `--radius`, `--shadow`) — không thêm màu mới.
- **Typography:** `Inter` + `JetBrains Mono` (đã có trong www/), không thêm font.
- **Spacing:** 4/8px, radius 8-12px, shadow như STATUS.
- **Motion:** 150-300ms transform/opacity, `prefers-reduced-motion` respect (KN-003).

## Architecture — 5 seams (plugin, không sửa core)

### 1. Playwright foundation (P0)
- **File:** `playwright.config.ts` (root) — `testDir: tests/e2e`, `webServer: npx serve www -l 3000`, `use: {baseURL: http://localhost:3000}`, `projects: [chromium]`, `timeout: 30s`.
- **Tests:** `tests/e2e/status.spec.ts` (STATUS render + registry counts), `tests/e2e/ai-news.spec.ts` (ai-news.json render + filter), `tests/e2e/responsive.spec.ts` (375/768/1280 no overflow), `tests/e2e/angle.spec.ts` (đo --angle trước/sau 500ms, KN-003).
- **Scripts:** `package.json` thêm `"test:e2e": "playwright test"`, `"test:e2e:ui": "playwright test --ui"`.
- **CI:** `pages.yml` thêm job `e2e` trước `deploy` (optional, không block nếu chưa có browser).

### 2. Flawd-lite (P0)
- **File:** `scripts/mutation.mjs` (Node 18+, no deps) — simple mutation for JS/TS: operators `===→!==`, `&&→||`, `+→-`, `true→false`, `>→>=` etc. Run against `www/app.js` + `www/ai-news/ai-news.js` + `tests/e2e` as test suite. Report `mutationScore = killed/total`.
- **Fallback:** nếu `flawd` binary có sẵn thì dùng, không thì dùng script này. Output `.agent/mutation-report.json` (gitignore).
- **Scoreboard:** `killed/total` + `survived` list để fix test yếu.

### 3. Xaidr-lite — policy-check nâng cấp (P1)
- **File:** `.agent/scripts/policy-check.mjs` — thêm:
  - `impact_class` detection: `credential_access` (cat ~/.ssh, .env, id_rsa), `destructive_filesystem` (rm -rf, mkfs, dd), `infra_destruction` (terraform destroy, kubectl delete ns), `execute` (bash -c, python -c), `exfiltrate` (curl|wget + evil).
  - `impact_tier`: `critical` (credential_access, destructive), `high` (infra_destruction, exfiltrate), `medium` (execute), `low` (read).
  - Effect `require_approval` (halt, không phải block) — policy rule có `effect: require_approval` → decision `approval_required`.
  - CLI: `policy-check.mjs --tool shell --target "cat ~/.ssh/id_rsa" --json` trả `impact_class`, `impact_tier`, `action`.
  - `policy-check.mjs --digest` in SHA-256 của `policy.json` để pin.

### 4. Engram-lite — auto-learn MCP (P1)
- **File:** `.github/harness/scripts/auto-learn.mjs` — thêm:
  - `attest --bug <slug> --result pass|fail` — ghi `.agent/attestations.jsonl` `{bug, result, ts, actor}`, tính Wilson score per KN (upvotes = attest pass, down = fail).
  - `suggest` trả thêm `wilson` score (lower bound 95%) + `attestations` count.
  - `search` alias cho `suggest` (MCP-like), `get --bug <slug>` để lấy chi tiết.
  - Không cần Cloudflare/Nostr — local BM25 + Wilson đủ.

### 5. Jern-lite — digest pin + meter (P1)
- **File:** `.agent/scripts/audit.mjs` — thêm:
  - `policyDigest` field: SHA-256 hex của `.agent/policy.json` (16 chars) ghi vào mỗi event.
  - `meter` fields: `durationMs` (đã có), `tokenCount` (optional, từ --tokens), `cap` check.
  - `audit.mjs digest` — in digest hiện tại.
  - `audit.mjs verify` check digest consistency (warn nếu digest đổi giữa session).
- **File:** `.agent/scripts/policy-check.mjs` — thêm `--digest` flag.

## Wireframe (không thêm trang mới)
- Không thêm trang www/ mới — chỉ CLI + test report. Nếu cần report UI thì reuse `www/status.json` thêm `mutation` field.

## States
- Playwright: `loading` (webServer starting), `pass`/`fail` (test result), `empty` (no tests).
- Mutation: `killed`/`survived`/`timeout` per mutant.
- Policy: `permitted`/`refused`/`approval_required` (3 states, học Xaidr).
- Attest: `pass`/`fail` → Wilson score.

## Responsive & A11y
- Không thêm UI mới nên không cần responsive mới. Test responsive cho www/ hiện có (375/768/1280).
- CLI có `--help` + `--json` cho a11y.

## Tokens (không hardcode)
- Dùng CSS variables đã có, không thêm hex lẻ.
- CLI dùng `chalk`? Không — no deps, plain text.

## Verification
- Playwright: `npx playwright test` pass, đo --angle thay đổi.
- Mutation: `node scripts/mutation.mjs` ra report, score >0.
- Policy: `node .agent/scripts/policy-check.mjs --tool shell --target "cat ~/.ssh/id_rsa" --json` → approval_required + credential_access.
- Attest: `node auto-learn.mjs attest --bug xxx --result pass` → Wilson tăng.
- Audit: `node audit.mjs log ...` có policyDigest, `audit verify` OK.
