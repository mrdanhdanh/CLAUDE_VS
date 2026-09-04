> 🤖 Auto-log bởi auto-learn.mjs — 2026-09-04T09:29:09.637Z
> **Error:** `GitHub Pages deploy fail - 2 workflows cùng environment github-pages`
> **File:** `.github/workflows/ai-news.yml`
> **Title:** pages deploy conflict 2 workflows

# Bug: pages deploy conflict 2 workflows

## Meta

- **Slug:** `2026-09-04-pages-deploy-conflict-2-workflows`
- **Ngày:** 2026-09-04
- **Severity:** `major`
- **Reporter:** YUNIE
- **Related KN:** `KN-015`
- **Tags:** `build` `deploy` `ci` `workflow` `pages`
- **Status:** `fixed`

---

## 1. Reproduce

### Steps
1. Push lên `main` có thay đổi `www/**` → trigger `pages.yml` (eval + deploy).
2. Đồng thời `ai-news.yml` (schedule/manual) cũng commit `www/ai-news/ai-news.json` và tự deploy `www/` với `environment: github-pages`.
3. Cả 2 workflow cùng `environment: github-pages` + `deploy-pages@v4` → GitHub Pages chỉ cho 1 deployment tại 1 thời điểm → job thứ 2 bị cancel/fail.
4. Trên CI Node 18, `eval-gate --scope www/library` fail thêm: `❌ syntax: failed: www/library/app.js` dù local Node 22 pass.

### Expected vs Actual
- **Expected:** `pages.yml` là deployer duy nhất, `ai-news.yml` chỉ commit data; `eval-gate` PASS trên cả Node 18 và 22.
- **Actual:** Deploy fail do xung đột environment; `eval-gate` FAIL trên Node 18 vì `node --check` coi `.js` là CJS nên `import` báo lỗi.

### Evidence
- GitHub Actions log: `Eval gate [www/library]: ❌ FAIL` / `❌ syntax: failed: www/library/app.js` / `✅ mcp-smoke: search + iterative + status OK`
- Local `node --check www/library/app.js` PASS (Node 22) nhưng CI Node 18 FAIL.
- `ai-news.yml` và `pages.yml` đều có `environment: github-pages` + `deploy-pages`.

### Environment
- Branch: `main`
- Commit: `fd682b3` (trước fix), `b85fba5` (eval-gate fix)
- CI: `ubuntu-latest`, Node 18 (pages.yml eval job) vs local Node 22

---

## 2. Root Cause (5 Whys)

- **File:Line:** `.github/workflows/ai-news.yml:15-25` · `.github/harness/scripts/eval-gate.mjs:checkSyntax`
- **Why 1:** Deploy fail → vì 2 workflow cùng giành `github-pages` environment.
- **Why 2:** Cùng giành → vì `ai-news.yml` copy 3 bước deploy từ `pages.yml` (configure-pages/upload/deploy) dù chỉ cần commit JSON.
- **Why 3:** Copy deploy → vì ban đầu muốn ai-news tự deploy sau khi commit, không nghĩ tới concurrency với `pages.yml`.
- **Why 4:** Eval FAIL chỉ trên CI → vì `node --check` trên Node 18 coi `.js` là CJS, gặp `import` là lỗi; Node 20+ tự nhận ESM nên pass.
- **Why 5 (Root):** Thiếu quy tắc: (a) chỉ 1 workflow được `deploy-pages` với `github-pages` env; workflow data chỉ commit; (b) `eval-gate` phải robust qua Node version — ESM `.js` phải check qua temp `.mjs`.

- **Impact:** Pages không deploy được, STATUS stale, CI đỏ.
- **Hypothesis:** Tách deploy + fix eval-gate sẽ xanh — đã verify.
- **Confidence:** `HIGH` (proven + re-run PASS)

---

## 3. Fix

- **Approach:** Tách trách nhiệm: `pages.yml` là sole deployer; `ai-news.yml` chỉ fetch+commit.
- **Files Changed:**
  - `.github/workflows/ai-news.yml` — bỏ `pages: write`/`id-token: write`, bỏ `environment: github-pages`, bỏ 3 steps `Setup Pages`/`Upload artifact`/`Deploy`, chỉ `git push` và log `pages.yml will deploy`.
  - `.github/harness/scripts/eval-gate.mjs` — `checkSyntax` detect ESM `.js` (`/^\s*(import|export)\s/m`) thì copy sang temp `.mjs` rồi `node --check` temp, xóa temp sau.
- **Diff tóm tắt:**
```diff
# ai-news.yml
-permissions: pages: write, id-token: write
-environment: github-pages
-- Setup Pages / Upload / Deploy

# eval-gate.mjs
+ if (isESM) { tmp=.mjs; node --check tmp } else node --check f
```
- **Non-Goals:** Không đổi logic fetch ai-news, không đổi pages.yml.
- **Fix Confidence:** `HIGH`
- **get_errors:** 0 errors (workflows)

---

## 4. Verification

- [x] Re-run `node .github/harness/scripts/eval-gate.mjs --scope www/library` → **PASS** (syntax 4 files + mcp-smoke)
- [x] Re-run `node .github/harness/scripts/eval-gate.mjs --scope all` → PASS
- [x] `get_errors` workflows → 0
- [x] `node .github/harness/scripts/generate-status.mjs` → JSON valid, counts 15/15/8/7/1
- [x] Push `fd682b3` + `b85fba5` → CI eval PASS (sau fix)
- [ ] Fresh-eyes tier: `OPTIONAL` (deterministic: workflow perms + Node version)

**Kết quả:**
```
Eval gate [www/library]: ✅ PASS
  ✅ syntax: 4 files checked
  ✅ mcp-smoke: search + iterative + status OK
```

---

## 5. Lesson (1 câu)

> Chỉ một workflow được deploy GitHub Pages (`github-pages` env + `deploy-pages`); workflow data chỉ commit, để `pages.yml` deploy; `eval-gate` phải check ESM `.js` qua temp `.mjs` để robust Node 18/22.

---

## 6. Prevention

- **Cách phòng tránh lần sau:**
  - [x] Quy tắc: 1 repo = 1 deployer cho `github-pages` env.
  - [x] Workflow chỉ ghi data → `contents: write` only, không `pages`/`id-token`, không `environment: github-pages`.
  - [x] `eval-gate` ESM `.js` → temp `.mjs` trước `node --check`.
  - [ ] Thêm checklist vào `docs/knowleged.md` KN-015
- **Cần cập nhật:**
  - [x] `docs/knowleged.md` → `KN-015` (Bảng tóm tắt + Chi tiết)
  - [ ] Test mới: CI matrix Node 18 + 22 cho eval-gate

---

## References

- `.github/workflows/pages.yml` (sole deployer)
- `.github/workflows/ai-news.yml` (fixed)
- `.github/harness/scripts/eval-gate.mjs`
- Commit fix: `fd682b3`, `b85fba5`

---
*Template: `.agent/bugs/_template/bug.md` — dùng bởi `/fixbug` Phase 1 & 5.*
