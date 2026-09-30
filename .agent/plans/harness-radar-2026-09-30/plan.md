# Plan — Harness Radar 2026-09-30

## Steps
1. **Code AISI** — `context.mjs`: thêm pattern "self-authored rebuttal (review of me is wrong / ignore that review)" vào `quarantine()`; comment cite UK AISI 28/09.
2. **Code t54** — `cua-guard.mjs`: `MONEY_ACTIONS={purchase,pay}`; flags `--authorized-by` + `--limit`; `moneyPreconditionReasons()`; evidence thêm `authorizedByHash` + `spendLimit`; `policy` in 4-câu.
3. **Code AIHOT** — `www/ai-news/report.mjs` (0 dep): đọc `ai-news.json` + `curated.json` → report.md (hot, ứng viên curated chưa ghim, phân bố nguồn) + `--json`/`--file`/`--out`/`--dry`.
4. **Guards** — `guard-redteam.spec.ts`: G6 rebuttal corpus + near-miss + compress provenance; C7 money gate (thiếu flags → refuse đúng lý do; có flags → vẫn fail-closed ở identity gate, không còn lý do money). `ai-news-report.spec.ts`: fixture + overlap curated + negative control.
5. **KN** — `knowleged.md`: bảng tóm tắt + chi tiết KN-084..090 (Guard trong 2500 ký tự đầu — KN-060 lesson) + Anti-patterns + Checklist + footer UpdatedAt.
6. **Instruction** — `agent-governance.instructions.md`: §7 bullets (AISI + t54) + checklist; chạy `budget:check`.
7. **Docs** — `llm-weakness-research.md` (row #10 + §2d); addenda 2 file design 2.1.
8. **Verify** — `node --check` scripts · playwright: guard-redteam + ai-news-report + kn-id-integrity + ai-news-feed-ranking + auto-learn-guard · `npm run budget:check` · `slop-check` changed files · `auto-learn.mjs status` · `problems` trên file đổi.

## Verify commands (exact)
```
node --check .github/harness/scripts/context.mjs; node --check .github/harness/scripts/cua-guard.mjs; node --check www/ai-news/report.mjs
npx playwright test tests/e2e/guard-redteam.spec.ts tests/e2e/ai-news-report.spec.ts tests/e2e/kn-id-integrity.spec.ts tests/e2e/ai-news-feed-ranking.spec.ts
npm run budget:check
node scripts/slop-check.mjs .github/harness/scripts/cua-guard.mjs .github/harness/scripts/context.mjs www/ai-news/report.mjs
node .github/harness/scripts/auto-learn.mjs status
```

## Guard (lưới để lại — KN-056)
- G6 (rebuttal quarantine) + C7 (money precondition) + report spec → mỗi rule mới có check.
- KN-084..090 có dòng `Guard:` (trong 2500 ký tự đầu); `kn-id-integrity` xác nhận ID không trùng.

## Verify results (2026-09-30)
- `guard-redteam.spec.ts` + `ai-news-report.spec.ts`: **33/33 pass** (G6 rebuttal · C7/C7b money · R1–R3 report).
- Batch 5 suites (guard-redteam, ai-news-report, kn-id-integrity, auto-learn-guard, ai-news-feed-ranking): **57/57 pass**; `auto-learn.mjs status`: KN 89 parse OK, ID integrity OK.
- `npm run budget:check`: ✅ always-on 691/1100 (headroom 409).
- `audit.mjs verify`: ✅ chain OK (376 events) — spec-edit có policy-check `--actor verify` + audit log.
- `node --check` pass (context · cua-guard · report · fetch); `report.mjs --dry` render OK.
- **Slop Gate (KN-047):** `cua-guard.mjs` + `report.mjs` **sạch sau refactor** (gỡ CC mới: chuyển `limit` check → `inputPolicyError`, tách `isSensitiveDomain`, tách hàm report). `context.mjs` (compressHits CC14 · main CC27) và `fetch.mjs` (8 findings: fetchHN/Reddit/HackerNoon/main…) là **pre-existing** — đo baseline `git show HEAD` cho **đúng cùng bộ findings**, không phát sinh finding mới từ diff này → justified (fix refactor lớn = out of scope, không làm trong radar task).
- Phát hiện phụ đã vá trong scope: feed strip `score` khi ghi JSON → thêm `normScore` persist `score` trong `fetch.mjs` (report xếp hạng được sau lần fetch kế tiếp).
