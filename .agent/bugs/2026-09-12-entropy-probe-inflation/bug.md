# Bug: Entropy S tăng giả mỗi lần chạy e2e suite — red-team probes bị đếm như nợ thật

## Meta

- **Slug:** `2026-09-12-entropy-probe-inflation`
- **Ngày:** 2026-09-12
- **Severity:** `major`
- **Reporter:** @user ("Entropy đang cao quá") / YUNIE
- **Related KN:** `KN-049`
- **Tags:** `process` `metrics` `verification` `governance`
- **Status:** `fixed`

---

## 1. Reproduce

### Steps
1. Chạy e2e suite nhiều lần trong ngày (mỗi lần `guard-redteam.spec.ts` log 1 event refused — probe redaction/enforcement: `rule=redteam-test`, `actor=redteam-spec`)
2. `node .github/harness/scripts/cosmic-scale.mjs`
3. Xem history trong `www/cosmos/scale.json`

### Expected vs Actual
- **Expected:** Entropy chỉ đo nợ thật (mismatch / drafts / friction refusals / failed) — chạy verify KHÔNG làm tăng metric sức khỏe.
- **Actual:** S = 23 (medium) dù mismatch=0, drafts=0, disabled=0; `--trend 3` gate ⛔ chặn feature mới.

### Evidence
```
🌌 Entropy S=23 (medium) — mismatch 0 · drafts 0 · refused 9 · disabled 0 · failed 1
🚀 escape velocity: đà S tăng 3/3 lần liên tiếp — GATE ⛔

history: 7, 7, 7, 7, 11, 21, 23   (tăng vọt đúng lúc guard-redteam.spec.ts chạy nhiều lần)

refused breakdown (audit.jsonl): 7× redteam-test (actor=redteam-spec, probe tự bắn)
                                 + 1× deny-test-mutate (YUNIE — friction thật)
                                 + 1× deny-law-fork (YUNIE — friction thật)
```

### Environment
- Branch: `main`
- Commit: `2a20911` (screenshots) → `fdcc872..acdc65e`
- OS: Windows

---

## 2. Root Cause (5 Whys)

- **File:Line:** `.github/harness/scripts/cosmic-scale.mjs` — `scanAudit()` (và mọi nơi hiển thị `entropy.parts.refused`)
- **Why 1:** S tăng vì `refused` tăng theo thời gian.
- **Why 2:** `refused` tăng vì mỗi suite run, `guard-redteam.spec.ts` log 1 audit event `decision=refused` (test redaction — "redaction phải chứng minh được, không tự nhận", KN-048).
- **Why 3:** Event đó là tín hiệu **synthetic do chính test harness sinh ra** để tự chứng minh guard hoạt động — không phải friction của tổ chức.
- **Why 4:** `scanAudit()` đếm MỌI `decision=refused` trong 200 events cuối, không phân biệt nguồn tín hiệu (synthetic probe vs friction thật).
- **Why 5 (Root):** Metric nợ thiếu phân lớp "ai sinh tín hiệu này?" → hệ thống tự bơm nợ vào chính nó mỗi lần verify → **perverse incentive** (xoá guard test = S giảm) + **alarm fatigue** (escape gate nổ giả → ai cũng học cách ignore → metric chết).

- **Impact:** Escape Velocity gate (`npm run cosmos:gate`) + heat death budget dùng ở PRD constraint / Verify / CI sẽ false-block feature; dashboard entropy hiển thị sai nợ thật.
- **Hypothesis:** Probe refusals bị tính vào S — verified bằng breakdown 7 probe / 2 friction + history tăng đúng nhịp suite run.
- **Confidence:** `HIGH` (reproduce: S 23→9 sau fix; regression spec khoá 2 chiều; live proof: suite run thêm probe mà S không nhích)

---

## 3. Fix

- **Approach:** Tách lớp ĐO, không xoá dữ liệu — audit/evidence giữ nguyên append-only.
- **Files Changed:**
  - `.github/harness/scripts/cosmic-scale.mjs` — `scanAudit(source)` tách `refused` (friction thật → S) vs `refusedProbes` (`rule=redteam-test` HOẶC `actor=redteam-spec` — bằng chứng enforcement, không tính S); thêm `--audit <file>` (deterministic test, không đọc audit thật — tránh race hash-chain); `printHuman` + `entropy.parts.refusedProbes`.
  - `www/cosmos/scale.html` — row "🧪 red-team probes (không tính)" (helper `appendProbeRow`) + chú thích semantics trong code-block.
  - `tests/e2e/cosmos-audit-probe.spec.ts` (mới, actor=verify) — khoá 2 chiều: probe không đổi S (2 nhánh rule/actor) · refusal thật vẫn +2 · audit thật có `parts.refusedProbes`.
  - Sweep docs: `.github/instructions/cosmic-quantum.instructions.md` §8 + `.github/skills/cosmic-quantum|cosmic-scale/SKILL.md` + regen `.claude/`.
- **Diff tóm tắt:**
```diff
- if (e.decision === 'refused') refused++;
+ const isProbe = e.rule === 'redteam-test' || e.actor === 'redteam-spec';
+ if (e.decision === 'refused') { if (isProbe) refusedProbes++; else refused++; }
```
- **Non-Goals:** Refactor `render()/drawTimeline()/renderWeb()/renderHawking()` trong `scale.html` (5 slop findings pre-existing — baseline HEAD y hệt, change net-neutral CC 83=83; ghi nhận residual debt cho plan split sau, theo precedent `cosmos-scale-split`). Không sửa `guard-redteam.spec.ts` (test là immutable — chỉ sửa production code). Không xoá event khỏi audit.
- **Fix Confidence:** `HIGH`
- **get_errors:** 0 errors trên 3 file changed (cosmic-scale.mjs, spec mới, scale.html).

---

## 4. Verification

- [x] Re-run steps reproduce → **Fixed** (S 23→9, `--trend` gate reset 0/3)
- [x] Edge cases:
  - [x] probe theo rule (`redteam-test`) → không đếm
  - [x] probe theo actor (`redteam-spec`) → không đếm
  - [x] refusal thật (rule khác, actor khác) → vẫn đếm ×2 (không "rửa sạch")
  - [x] audit file rỗng / thiếu → không crash (test "thiếu history" + crafted empty audit)
- [x] Regression: full suite **121/121 pass** (gồm guard-redteam 8, cosmos-escape 8, cosmos-capability 2)
- [x] `get_errors` affected files → 0 errors
- [x] `slop-check` changed files → 5 findings **pre-existing** (baseline `git show HEAD` y hệt; change net-neutral)
- [x] UI: scale.html render row probes đúng (verify qua spec cosmos-escape render + đo tay)
- [x] Fresh-eyes tier: `RECOMMENDED` (metric semantics — có spec khoá cả 2 chiều thay fresh eyes)

**Kết quả:**
```
npx playwright test → 121 passed (2.0m)
cosmic-scale → S=9 (low) · refused 2 · probes 8 (không tính) · trend 0/3
npm run cosmos:refresh → scale.json + audit.json + status.json + mirrors regenerated
```

---

## 5. Lesson (1 câu)

> Metric "nợ" không bao giờ được đếm tín hiệu synthetic do chính test harness sinh ra — phải tách lớp đo (probe = bằng chứng enforcement, không phải debt), nếu không mỗi lần chạy verify là tự bơm nợ vào mình.

---

## 6. Prevention

- **Cách phòng tránh lần sau:**
  - [x] Trước khi thêm nguồn vào metric: hỏi "ai sinh tín hiệu này?" — synthetic (test/probe tự chứng minh) → hiển thị riêng, không tính debt.
  - [x] Gate tự động phải có test khoá cả 2 chiều: không đếm nhầm synthetic + không rửa sạch friction thật.
  - [x] "Sửa metric" chỉ được tách lớp ĐO — cấm xoá dữ liệu/bằng chứng (audit append-only).
  - [x] Thêm vào `docs/knowleged.md` Anti-patterns + Checklist.
- **Cần cập nhật:**
  - [x] `docs/knowleged.md` → `KN-049` (Bảng tóm tắt + Chi tiết + Anti-patterns + Checklist)
  - [x] Test mới: `tests/e2e/cosmos-audit-probe.spec.ts`
  - [x] `cosmic-quantum.instructions.md` §8 + 2 SKILL.md + `.claude/` regen

---

## References

- `docs/knowleged.md#KN-049`
- Commit fix: `<điền sau commit>`
- Liên quan: KN-047 (Slop Gate — spec là command, không vibe), KN-048 (enforce > declare — guards phải test được), KN-012 (audit immutable), KN-024 (vanity metrics)
