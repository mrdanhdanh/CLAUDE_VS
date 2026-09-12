# Plan — Light theme (implementation)

| # | Todo | Entangled with | Verify |
|---|------|----------------|--------|
| 1 | Test 9-10 (RED) | tests/e2e/agentic-academy.spec.ts | `npx playwright test -g "theme"` fail |
| 2 | Refactor token: `--link/--card-grad/--track` (+ thay 13 literal) | styles.css | grep literal = 0 |
| 3 | Block `[data-theme="light"]` | styles.css | get_errors sạch |
| 4 | theme module store.js + bootstrap `<head>` + nút cả 2 trang | store.js, index.html, slides.html | get_errors sạch |
| 5 | GREEN + full suite + screenshot 2 theme | spec + evidence | 78/78 (68 cũ + 10) |
| 6 | Audit + scoreboard | audit.jsonl | chain OK |

## Lệnh
```bash
npx playwright test tests/e2e/agentic-academy.spec.ts -g "theme"   # RED → GREEN
npx playwright test                                                # full suite
node .agent/scripts/audit.mjs log --tool file --target "light theme" --decision permitted --rule allow-all
```
