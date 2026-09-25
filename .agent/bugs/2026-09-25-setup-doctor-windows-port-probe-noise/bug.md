> 🤖 Auto-log bởi auto-learn.mjs — 2026-09-25T12:31:30.909Z
> **Error:** `setup-doctor trên Windows phát The system cannot find the path specified khi dò port vì gọi lsof/ss; JSON vẫn PASS nhưng stderr bị nhiễu`
> **File:** `.github/harness/scripts/setup-doctor.mjs`
> **Title:** setup-doctor Windows port probe noise

> 🔁 **RADAR TÁI LẬP** — đối chiếu KN + bug cũ thấy nghi vấn:
> - 🔁 NGHI TÁI LẬP **[KN-074]** (score 101.3): Gate im lặng = gate chết: eval-gate fail-silent trên Windows (isMain backslash) + verifier đọc Status sai format template (2026-09-22)
> - 🔁 NGHI TÁI LẬP **[KN-016]** (score 88.8): harness-manager disable fail EPERM trên Windows (fs.rename folder bị chặn)
> - 🔁 NGHI TÁI LẬP **[KN-015]** (score 72.4): GitHub Pages deploy fail — 2 workflows cùng `github-pages` env + eval-gate Node 18 CJS
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-06-archify-skill-port`** (score 76.9): Archify skill port — (A) EPERM rename trên Windows + (B) diagram tràn first-scre
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-03-rag-export-missing-grounding-chet`** (score 63): RAG export missing grounding chet
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-22-eval-gate-fail-silent-tren-windows-ismain-backslas`** (score 62.3): eval-gate fail-silent tren Windows (isMain backslash)
> → Đọc **Cách phòng tránh** trong `docs/knowleged.md` TRƯỚC khi fix. Nếu là tái lập thật: ghi rõ "tái lập của KN-074" + **vì sao lưới cũ không bắt được** → nâng lưới (Guard) rồi mới fix.
# Bug: setup-doctor Windows port probe noise

> Copy file này vào `.agent/bugs/2026-09-25-setup-doctor-windows-port-probe-noise/bug.md` khi bắt đầu `/fixbug`.

## Meta

- **Slug:** `2026-09-25-setup-doctor-windows-port-probe-noise`
- **Ngày:** 2026-09-25
- **Severity:** `minor`
- **Detection:** `platform-specific-command`
- **Detection rule:** Một dòng metadata duy nhất, chỉ đúng một enum; không thêm suffix hoặc duplicate field.
- **Layer:** `code` — implementation Unix-only dùng trong một CLI cross-platform.
- **Reporter:** YUNIE
- **Related KN:** `KN-074` / `KN-016` (recurrence pattern: Windows portability)
- **Tags:** `process` `dx` `windows` `verify`
- **Guard:** `.github/harness/scripts/setup-doctor.mjs:83` + `--self-test` (free/listener/probe-failure) + component eval `setup-doctor-self-test`; Windows stdout/stderr không chứa `The system cannot find the path specified`
- **Status:** `fixed` — 2026-09-25 follow-up; structured unknown state + durable self-test/component eval pass

---

## 1. Reproduce

### Steps
1. Chạy `node .github/harness/scripts/setup-doctor.mjs --json` trên Windows.
2. Quan sát stderr trong lúc lệnh vẫn kết thúc với exit code 0.
3. Probe lại bằng PowerShell: capture combined output và kiểm tra chuỗi `The system cannot find the path specified`.

### Expected vs Actual
- **Expected:** JSON hợp lệ, không có command-not-found noise; `ports` dùng probe native của Windows.
- **Actual:** `setup-doctor` in 4 lần `The system cannot find the path specified`, nhưng vẫn báo `pass: true`; `portListening` không đo được port trên Windows. Sau pass đầu, independent Critic còn phát hiện probe lỗi/timeout cũng bị biến thành `free`, nên health vẫn có thể fail-open.

### Evidence
- Log / screenshot / test fail / video:
```text
$ node .github/harness/scripts/setup-doctor.mjs --json
The system cannot find the path specified.  # x4 trên stderr
{ "pass": true, ... }
$ node setup-doctor regression probe
RED: setup-doctor emits Windows command-not-found noise
exit 1
```

### Environment
- Branch: `main` (working tree clean before fix)
- Commit: working tree snapshot 2026-09-25
- OS/Browser: Windows; Node v22.22.2; PowerShell 7 session

---

## 2. Root Cause (5 Whys)

- **File:Line:** `.github/harness/scripts/setup-doctor.mjs:83`
- **Why 1:** Windows phát `The system cannot find the path specified` vì các executable probe không tồn tại.
- **Why 2:** `portListening()` hard-code `lsof` và `ss`, là công cụ kiểu Unix.
- **Why 3:** `checkPorts()` không chọn command theo `process.platform`; chạy trên Windows vẫn đi nhánh Unix.
- **Why 4:** `execSync()` báo lỗi qua stderr rồi bị `catch` bỏ qua, nên vừa gây noise vừa biến **mọi probe failure** thành `false` (= free) mà không có tín hiệu trong JSON.
- **Why 5 (Root):** Thiếu invariant cross-platform cho diagnostic CLI: exit 0 không đồng nghĩa output sạch, **probe failure phải là `unknown`**, và phải có self-test durable (KN-074).

- **Impact:** Mỗi lần YUNIE chạy setup doctor trên Windows đều có stderr giả, có thể làm người đọc tưởng health check hỏng hoặc bỏ qua cảnh báo thật; port `5251`/`12434` cũng không được xác nhận đáng tin cậy.
- **Hypothesis:** Một probe có structured state `{ok, states, error}` + self-test synthetic cho `free`, `listening`, `probe-failure` sẽ sửa fail-open mà không thêm dependency. Đã reproduce phần noise; RED self-test hiện tại (exit 0 nhưng thiếu marker) chứng minh guard còn thiếu.
- **Confidence:** `HIGH` (normal Windows paths + synthetic failure + component eval đều pass sau follow-up)

> Đây là tái lập pattern portability của KN-074/KN-016; lưới cũ chưa bao phủ `setup-doctor` vì chỉ kiểm tra các `isMain` script khác.
> **Root Cause Gate:** Đã xác định đủ bằng trace từ CLI → `checkPorts` → `portListening`; không cần giả thuyết thay thế.

---

## 3. Fix

- **Approach:** Thay boolean `portListening()` bằng structured probe: `ok=true` + per-port `listening|free`, hoặc `ok=false` + `error`; `checkPorts()` fail nếu `ok=false` (không được báo free). Dùng System32 `netstat.exe` khi có, argv-safe execution, timeout + 2 MiB buffer. Thêm `--self-test` 3 case (free/listener/probe-failure) + component eval durable; giữ native probe/noise fix đã có.
- **Files Changed:**
  - `.github/harness/scripts/setup-doctor.mjs` — structured cross-platform probe + self-test.
  - `.github/harness/evals/components.json` — wire self-test vào eval gate.
- **Diff tóm tắt:**
```diff
-import { execSync } from 'node:child_process';
+import { execFileSync } from 'node:child_process';
-lsof/ss hard-code
+platform-native command + deterministic parser
-`\\s${port}\\s+...`
+`:${port}\\s+...` (match Windows `127.0.0.1:<port>`)
```
- **Non-Goals:** Không thêm dependency, không đổi schema `status.json`, không sửa các CLI khác trong cùng đợt, không thay đổi semantics của `pass`/`warn`.
- **Fix Confidence:** `HIGH` — normal free/listening paths + synthetic probe-failure + component eval đều pass.
- **get_errors:** Affected files 0 errors; full workspace 0 errors.

---

## 4. Verification

- [x] Re-run steps reproduce → **Fixed** sau structured probe + self-test
- [x] Edge cases:
  - [x] Windows không có listener → không có command-not-found noise; `5251 free, 12434 free`
  - [x] Windows có listener thật trên 5251 → phát hiện `5251 LISTENING`
  - [x] Probe command lỗi/timeout (synthetic fixture) → `unknown` + `pass:false`, không báo free
- [x] Regression: `eval-gate --scope components --json` pass, gồm `component:setup-doctor-self-test`
- [x] `get_errors` affected + toàn scope → 0 errors
- [x] `node --check`, `slop-check`, `git diff --check` → PASS sau follow-up
- [x] UI audit: không áp dụng (CLI-only)
- [x] Fresh-eyes tier: `REQUIRED` (Critic đã tìm fail-open + guard gap; follow-up đã xử lý)

**Kết quả:**
```text
PASS: Windows free-port path is clean
PASS: Windows listening-port path detects 5251
setup-doctor self-test: 3 cases passed
component:setup-doctor-self-test → pass (KN-077)
node --check → pass
slop-check → Clean
get_errors → No errors found
```

---

## 5. Lesson (1 câu)

> **Mọi diagnostic CLI cross-platform phải chọn probe native theo OS, parse output thật, và kiểm tra cả negative lẫn positive path trước khi tin `PASS`.**

---

## 6. Prevention

- **Cách phòng tránh lần sau:**
  - [x] Không hard-code Unix probe (`lsof`, `ss`, `grep`) trong CLI chạy Windows; branch theo `process.platform`.
  - [x] Dùng `execFileSync` với argv array + `stdio` để lỗi executable không tồn tại không rò ra stderr.
  - [x] Phân biệt `listening`, `free`, `unknown`; probe failure không được được biến thành free.
  - [x] Test cả free-port (negative), listener thật (positive), và probe failure (unknown) trước khi tin `PASS`.
  - [x] Wire self-test vào component eval để lỗi không còn chỉ tồn tại trong bug report.
- **Guard (lưới chống tái lập — KN-056):**
  - [x] `- **Guard:**` ở Meta trỏ tới implementation + regression probe.
  - [x] Thêm `setup-doctor-self-test` vào `.github/harness/evals/components.json`; lưới cũ không kiểm tra CLI này.
- **Cần cập nhật:**
  - [x] `docs/knowleged.md` → KN mới (Bảng tóm tắt + Chi tiết)
  - [x] Không có UI nên không cập nhật `product-quality.instructions.md`
  - [x] Guard one-off đã chạy; chưa thêm test file mới để giữ bounded scope

---

## References

- `docs/knowleged.md#KN-077` (sau `auto-learn propose`)
- Issue / PR: local self-upgrade round 2026-09-25
- Commit fix: working tree (chưa commit)

---
*Template: `.agent/bugs/_template/bug.md` — dùng bởi `/fixbug` Phase 1 & 5.*
