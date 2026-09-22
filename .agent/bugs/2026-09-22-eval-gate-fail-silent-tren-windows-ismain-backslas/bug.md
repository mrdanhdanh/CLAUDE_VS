> 🤖 Auto-log bởi auto-learn.mjs — 2026-09-22T17:03:19.239Z
> **Error:** `node eval-gate.mjs --scope components -> exit 0 nhung KHONG co output; isMain=false vi process.argv[1] tren Windows la duong dan backslash tuyet doi (D:\...) -> split('/') khong cat duoc -> main() khong bao gio chay -> gate im lang no-op (fail-silent). Probe xac nhan: argv1='D:\\CLAUDE_VS\\tmp-probe.mjs', pop='D:\\CLAUDE_VS\\tmp-probe.mjs', isMain=false. 10 file dinh cung pattern (.split('/') khong co [\\\\/]); 5 file da Windows-safe truoc do (context/cua-guard/consistency-gap/experience-funnel/procedural-graph — KN-059 fix 10/09 chi fix 1 phan).`
> **File:** `.github/harness/scripts/eval-gate.mjs`
> **Title:** eval-gate fail-silent tren Windows (isMain backslash)

> 🔁 **RADAR TÁI LẬP** — đối chiếu KN + bug cũ thấy nghi vấn:
> - 🔁 NGHI TÁI LẬP **[KN-037]** (score 256.1): Evals Gap — "single biggest predictor" là evals discipline (Andrew Ng, Agentic AI Playbook 2026)
> - 🔁 NGHI TÁI LẬP **[KN-069]** (score 242.3): Gate fail-open với arg rác: NaN-pass ẩn (exit 0) — gate phải validate MỌI input tại boundary
> - 🔁 NGHI TÁI LẬP **[KN-015]** (score 202.2): GitHub Pages deploy fail — 2 workflows cùng `github-pages` env + eval-gate Node 18 CJS
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-18-instruction-budget-gate-fail-open-voi-arg-khong-ph`** (score 192.8): instruction-budget gate fail-open voi arg khong phai so
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-10-self-improving-upgrades`** (score 190.4): Triển khai 3 self-improving upgrades (KN-025/026/027) — procedural graph + funne
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-14-skill-kn-sua-khong-qua-eval-gate-bi-troi-am-tham`** (score 178.7): SkillOpt — thiếu validation gate cho skill/KN: edit trôi, rejected edits không t
> → Đọc **Cách phòng tránh** trong `docs/knowleged.md` TRƯỚC khi fix. Nếu là tái lập thật: ghi rõ "tái lập của KN-037" + **vì sao lưới cũ không bắt được** → nâng lưới (Guard) rồi mới fix.
# Bug: eval-gate fail-silent tren Windows (isMain backslash)

> Copy file này vào `.agent/bugs/2026-09-22-eval-gate-fail-silent-tren-windows-ismain-backslas/bug.md` khi bắt đầu `/fixbug`.

## Meta

- **Slug:** `2026-09-22-eval-gate-fail-silent-tren-windows-ismain-backslas`
- **Ngày:** 2026-09-22
- **Severity:** `major` (gate fail-silent — verifier integrity; CI Linux không dính, Windows local dính)
- **Layer:** `code` — defect ở isMain detection trong script, không phải spec/env
- **Reporter:** YUNIE — phát hiện khi dogfood `--scope components` lúc build mechanism 2.5
- **Related KN:** `KN-069` (cùng lớp: gate fail-open; cơ chế KHÁC — platform path separator, không phải arg validation) · `KN-015` (gate robustness Node 18/22)
- **Tags:** `build` `process` `verification` `windows` `gate`
- **Guard:** `tests/e2e/eval-gate-components.spec.ts` — test “components: registry pass + gate PHẢI in output (chống no-op im lặng)” + class-guard “không script nào còn `.split('/')`”
- **Status:** `fixed`

---

## 1. Reproduce

### Steps
1. Windows/PowerShell 7: `node .github/harness/scripts/eval-gate.mjs --scope components`
2. Quan sát: **không có output nào**; `$LASTEXITCODE` = 0
3. Probe nguyên nhân: script in `process.argv[1]` → `"D:\\CLAUDE_VS\\tmp-probe.mjs"` (đường dẫn backslash tuyệt đối)

### Expected vs Actual
- **Expected:** in `Eval gate [components]: ✅ PASS/❌ FAIL` + list component; exit theo kết quả
- **Actual:** im lặng, exit 0 — `main()` không hề chạy (fail-silent); `generate-status` đọc exit 0 → ghi `eval-gate: PASS` “rỗng”

### Evidence
```
# Trước fix
node eval-gate.mjs --scope components
(no output)  exit=0
argv1: "D:\\CLAUDE_VS\\tmp-probe.mjs"
pop:   "D:\\CLAUDE_VS\\tmp-probe.mjs"   <-- không có '/' để split
isMain: false

# Sau fix
Eval gate [components]: ✅ PASS
  ✅ component:policy-deny-first: ...  (7/7)
```

### Environment
- Branch: `main` · OS: Windows (pwsh 7, Node local) · CI Linux KHÔNG dính (argv[1] dùng `/`)
- 5 file đã được vá `[\\/]` từ 10/09 (KN-059 — context/cua-guard/consistency-gap/experience-funnel/procedural-graph); 10 file còn lại vẫn dính

---

## 2. Root Cause (5 Whys)

- **File:Line:** `.github/harness/scripts/eval-gate.mjs` (isMain) + 9 script cùng pattern trong `.github/harness/scripts/`
- **Why 1:** Không có output? `main()` không chạy vì `isMain=false`.
- **Why 2:** Vì sao false? `process.argv[1].split('/').pop()` — trên Windows `argv[1]` là `D:\...\eval-gate.mjs` (backslash) → `split('/')` không cắt → pop = full path → `import.meta.url.endsWith(fullPath)` = false.
- **Why 3:** Vì sao viết `split('/')`? Pattern copy từ môi trường POSIX; đợt vá 10/09 (KN-059) chỉ vá file đang chạm, **không truy quét cùng class** (grep `argv[1].split` giờ thấy 15 file, 5 đã vá).
- **Why 4:** Vì sao nhiều tháng không ai thấy? CI Linux xanh; local Windows ít chạy; exit 0 “trông đúng”; `generate-status` dùng `stdio:'ignore'` nuốt mất output rỗng.
- **Why 5 (Root):** Gate thiếu lưới **“phải chứng minh nó ĐÃ CHẠY”** — exit condition cho phép “im lặng = pass” (fail-silent; cùng lớp KN-069/KN-047: gate phải fail-loudly).

- **Impact:** 10 script harness fail-silent trên Windows (eval-gate, agent-card, deploy-check, handoff, local, memory, reflect, setup-doctor, trace, workflow); `generate-status` báo `eval-gate: PASS` trong khi gate không chạy check nào.
- **Hypothesis:** đã verify bằng probe (argv[1] backslash) + trước/sau fix.
- **Confidence:** `HIGH` (proven + regression qua spec mới; `--scope all` chạy thật 13 checks)

> Cùng lớp KN-069 (gate fail-open) nhưng KHÔNG phải tái lập — cơ chế khác (platform separator vs arg validation). Lưới cũ không bắt vì chưa test nào assert “gate phải in output”.

---

## 3. Fix

- **Approach:** Sửa ở gốc cho CẢ CLASS (không chỉ eval-gate): isMain Windows-safe `split(/[\\/]/)` cho 10 script; thêm lưới “gate phải in output”; làm `checkMcp` cross-platform (bỏ `printf`/`grep` — cmd.exe không có) vì sau fix `--scope all` sẽ thật sự chạy.
- **Files Changed:**
  - 10 × `.github/harness/scripts/*.mjs` — isMain `split(/[\\/]/)` (agent-card, deploy-check, eval-gate, handoff, local, memory, reflect, setup-doctor, trace, workflow)
  - `.github/harness/scripts/eval-gate.mjs` — checkMcp dùng `execSync(..., { input })` thay pipe printf/grep
  - `tests/e2e/eval-gate-components.spec.ts` — guard: output bắt buộc + class-check pattern `.split('/')`
- **Diff tóm tắt:**
```diff
- const isMain = ... import.meta.url.endsWith(process.argv[1].split('/').pop());
+ const isMain = ... import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop()); // Windows-safe
```
- **Non-Goals:** không refactor cấu trúc gate; không đụng script ngoài class này (grep xác nhận đã hết).
- **Fix Confidence:** `HIGH`
- **get_errors:** affected files 0 errors (spec + scripts)

---

## 4. Verification

- [x] Re-run reproduce → **Fixed** (gate in report thật, exit theo kết quả)
- [x] Edge cases:
  - [x] `--scope components` → 7/7 component pass + output
  - [x] `--scope all` → 13 checks pass (syntax 4+8 · mcp-smoke · plans ×2 · self-improving · components ×7)
  - [x] `--scope grounding` PASS/FAIL/fail-closed đều đúng
- [x] Regression: status/readme/hooks/slop batch + spec mới 5/5 pass
- [x] `slop-check` changed files → clean (sau refactor CC ≤12)
- [x] Fresh-eyes tier: `RECOMMENDED` (deterministic — path handling)

**Kết quả:**
```
Eval gate [all]: ✅ PASS — 13 checks
tests/e2e/eval-gate-components.spec.ts: 5 passed (6.0s)
slop-check: ✅ Clean
```

---

## References

- `docs/knowleged.md#KN-XXX`
- Issue / PR: #
- Commit fix: `<hash>`

---
*Template: `.agent/bugs/_template/bug.md` — dùng bởi `/fixbug` Phase 1 & 5.*
