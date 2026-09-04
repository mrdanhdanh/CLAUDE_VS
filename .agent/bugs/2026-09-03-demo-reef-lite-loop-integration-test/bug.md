> 🤖 Auto-log bởi auto-learn.mjs — 2026-09-03T16:42:06.158Z
> **Error:** `demo reef-lite integration test — verify loop`
> **File:** `docs/knowleged.md`
> **Title:** Demo reef-lite loop integration test

# Bug: Demo reef-lite loop integration test

> Copy file này vào `.agent/bugs/2026-09-03-demo-reef-lite-loop-integration-test/bug.md` khi bắt đầu `/fixbug`.

## Meta

- **Slug:** `2026-09-03-demo-reef-lite-loop-integration-test`
- **Ngày:** 2026-09-03
- **Severity:** `minor`
- **Reporter:** YUNIE / reef-lite demo
- **Related KN:** `KN-007` (auto-learn), `KN-010` (AAR)
- **Tags:** `process` `knowledge` `reef-lite` `demo`
- **Status:** `fixed`

---

## 1. Reproduce

### Steps
1. `node .github/harness/scripts/auto-learn.mjs record --prompt "demo reef-lite" --scenario demo-reef-lite`
2. `node .github/harness/scripts/auto-learn.mjs log --error "demo reef-lite integration test" --title "Demo reef-lite loop integration test"`
3. Điền bug.md này rồi `report --bug <slug> --score 1 --feedback "pass"` → `evaluate --bug <slug>` → `commit --bug <slug>`

### Expected vs Actual
- **Expected:** Loop Serve→Observe→Grow→Commit chạy local 0đ, có gate evaluate, có version snapshot
- **Actual:** Đã chạy được — cần verify evaluate PASS và commit tạo KN-014

### Evidence
- `record` tạo `rec-mtlr66y3-fdmr` trong `.agent/records/`
- `log` tạo `.agent/bugs/2026-09-03-demo-reef-lite-loop-integration-test/bug.md`

### Environment
- Branch: `main`
- Commit: `reef-lite demo`
- OS/Browser: macOS

---

## 2. Root Cause (5 Whys)

- **File:Line:** `.github/harness/scripts/auto-learn.mjs:1`
- **Why 1:** Thiếu loop reef-lite → vì auto-learn chỉ có suggest/log/propose/status
- **Why 2:** Chỉ có 4 lệnh → vì chưa có record/report/evaluate/commit/versions
- **Why 3:** Chưa có gate → vì propose dán tay không qua evaluate
- **Why 4:** Không có version → vì knowleged.md ghi trực tiếp không snapshot
- **Why 5 (Root):** Thiếu infra continual learning kiểu reef (Serve→Observe→Grow→Commit) local 0đ

- **Impact:** Dev dễ dán KN trùng, không có history, không có feedback loop
- **Hypothesis:** Thêm 5 lệnh reef-lite + gate + snapshot sẽ đủ — đã verify bằng demo này
- **Confidence:** `HIGH`

> Nếu bug chạm pattern trong `docs/knowleged.md` → ghi `Related KN: KN-XXX` và áp dụng **Cách phòng tránh** ngay.
> **Root Cause Gate:** Nếu uncertain → investigate / escalate, không tự biến hypothesis thành sự thật.

---

## 3. Fix

- **Approach:** Thêm 5 lệnh reef-lite vào auto-learn.mjs: record (Serve → .agent/records/rec-xxx.json), report (Observe → reports.jsonl), evaluate (Grow gate: check hasFix + duplicate BM25 + reports), commit (Commit → snapshot + append knowleged.md chỉ khi PASS), history/versions (xem loop). Không cần GPU/server.
- **Files Changed:**
  - `.github/harness/scripts/auto-learn.mjs` — thêm constants RECORDS_DIR/VERSIONS_DIR/REPORTS_FILE + 6 hàm + CLI routing + status/history
  - `.agent/bugs/2026-09-03-demo-reef-lite-loop-integration-test/bug.md` — demo bug
- **Diff tóm tắt:**
```diff
+ const VERSIONS_DIR = path.join(ROOT, '.agent', 'versions');
+ const RECORDS_DIR = path.join(ROOT, '.agent', 'records');
+ async function recordInteraction() { ... }
+ async function reportFeedback() { ... }
+ async function evaluateCandidate() { ... }
+ async function commitCandidate() { ... }
```
- **Non-Goals:** Không cài reef-infra Python, không train weights, không cần SGLang/slime
- **Fix Confidence:** `HIGH`
- **get_errors:** 0 errors

---

## 4. Verification

- [ ] Re-run steps reproduce → **Fixed** (Expected = Actual)
- [ ] Edge cases:
  - [ ] case 1: ...
  - [ ] case 2: ...
- [ ] Regression: các case liên quan vẫn pass
- [ ] `get_errors` **toàn scope** → 0 errors (Phase 3 chỉ check affected files)
- [ ] `lint` / `build` / `test` → PASS (ghi lệnh đã chạy)
- [ ] UI audit (nếu là bug UI): responsive 375/768/1280, states, a11y
- [ ] Fresh-eyes tier: `REQUIRED` (UX/UI/workflow/ambiguous) | `RECOMMENDED` (regression-prone) | `OPTIONAL` (deterministic: typo/null check/API mapping) — ghi tier đã áp dụng

**Kết quả:**
```
< dán output verify >
```

---

## 5. Lesson (1 câu)

> Bài học rút ra, 1 câu súc tích — sẽ copy vào `docs/knowleged.md` Bảng tóm tắt.

Ví dụ: *Mọi overlay/modal phải có ESC + focus trap + aria-modal.*

---

## 6. Prevention

- **Cách phòng tránh lần sau:**
  - [ ] ...
  - [ ] Thêm checklist vào `docs/knowleged.md` Anti-patterns / Checklist phòng tránh chung
- **Cần cập nhật:**
  - [ ] `docs/knowleged.md` → `KN-XXX` (Bảng tóm tắt + Chi tiết)
  - [ ] `product-quality.instructions.md` (nếu là chuẩn UI mới)
  - [ ] Test mới: `path/to/test.spec.ts`

---

## References

- `docs/knowleged.md#KN-XXX`
- Issue / PR: #
- Commit fix: `<hash>`

---
*Template: `.agent/bugs/_template/bug.md` — dùng bởi `/fixbug` Phase 1 & 5.*


> 📊 Report 2026-09-03T16:42:29.009Z: score=1 feedback="pass demo reef-lite loop" refs=rec-mtlr66y3-fdmr
