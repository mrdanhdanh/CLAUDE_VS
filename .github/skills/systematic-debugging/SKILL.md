---
name: systematic-debugging
description: "Systematic debugging 4-phase — root cause first, no guessing. Use when bug, test failure, build failure, unexpected behavior, before proposing fixes. Enforces evidence gathering, pattern analysis, single hypothesis, TDD fix, 3-fix limit. Inspired by obra/superpowers systematic-debugging."
user-invocable: true
---

# Systematic Debugging — 4 Phase cho Harness v2

> **Process > Model.** ALWAYS find root cause before attempting fixes. Symptom fixes are failure. Adapted từ `obra/superpowers:systematic-debugging` cho Harness v2 + `/fixbug` bounded loop + `auto-learn`.

## Iron Law

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

Chưa xong Phase 1 thì **cấm** propose fix. Vi phạm letter = vi phạm spirit.

## When to Use

**Mọi technical issue:**
- Test failures, bug production, unexpected behavior
- Build failures (`dotnet build` MSB3027, `get_errors`), performance, integration

**Đặc biệt dùng khi:**
- Đang gấp (emergency → guessing càng tốn thời gian)
- "Chỉ cần quick fix" có vẻ obvious
- Đã thử 1-2 fix mà không được
- Không hiểu fully issue

**Đừng skip khi:** issue có vẻ simple, đang hurry, sếp bảo fix NOW — systematic nhanh hơn thrashing.

## Tích hợp Harness v2

| Harness | Phase | Systematic Debugging |
|---------|-------|----------------------|
| `/fixbug` | **0 Read Knowledge** | `auto-learn suggest "<keywords>"` + đọc `docs/knowleged.md` — check KN liên quan trước khi investigate |
| `/fixbug` | **1 Reproduce** | Phase 1 (Root Cause Investigation) — reproduce consistently + gather evidence |
| `/fixbug` | **2 Root Cause** | Phase 1+2+3 — 5 Whys + Pattern Analysis + Hypothesis |
| `/fixbug` | **3 Fix** | Phase 4 — TDD fix (dùng `tdd-gate`), single fix, scope control |
| `/fixbug` | **4 Verify** | Phase 4 Verify + `verification-before-completion` gate (fresh evidence) |
| `/fixbug` | **5 Learn** | `auto-learn propose --bug <slug>` → `docs/knowleged.md` KN-XXX |
| `/harness` | **Verify** | Khi phát hiện bug trong Verify → chạy systematic-debugging thay vì đoán |

**Auto-learn hooks:**
```bash
node .github/harness/scripts/auto-learn.mjs suggest "từ khóa bug" --top 3  # Phase 0
node .github/harness/scripts/auto-learn.mjs log --error "message" --file "path" --title "slug"  # khi get_errors fail
node .github/harness/scripts/auto-learn.mjs propose --bug <slug>  # Phase 5 Learn
```

## The Four Phases (BẮT BUỘC tuần tự)

### Phase 1: Root Cause Investigation — BEFORE bất kỳ fix nào

1. **Read Error Messages Carefully**
   - Đừng skip warning/error — thường chứa exact solution
   - Đọc full stack trace, line numbers, error codes
   - `get_errors` affected files → ghi lại message chính xác

2. **Reproduce Consistently**
   - Trigger được reliably? Steps 1-2-3?
   - Happens every time? Nếu không reproduce → gather more data, đừng guess
   - Reproduce như **user mới** (KN-005 Bug Blindness) — không dùng workaround quen tay
   - Tạo `.agent/bugs/YYYY-MM-DD-<slug>/bug.md` từ `_template/bug.md` + log evidence

3. **Check Recent Changes**
   - `git diff`, `git log --oneline -5`, deps mới, config, env diff
   - Hỏi: "What changed that could cause this?"

4. **Gather Evidence in Multi-Component Systems**

   Khi hệ thống có nhiều layer (CI → build → signing, API → service → DB, Blazor → Service → Storage):

   **BEFORE propose fixes, add diagnostic instrumentation at EACH boundary:**
   ```
   For EACH component boundary:
     - Log what data enters component
     - Log what data exits component
     - Verify environment/config propagation
     - Check state at each layer
   Run once to gather evidence showing WHERE it breaks
   THEN analyze evidence to identify failing component
   THEN investigate that specific component
   ```

   **Ví dụ N5Blazor (dotnet file lock KN-008):**
   ```powershell
   # Layer 1: Process
   Get-Process -Name N5Blazor -ErrorAction SilentlyContinue | Format-Table Id,Path
   # Layer 2: Port
   netstat -ano | Select-String "5251"
   # Layer 3: Build
   dotnet build N5Blazor --nologo 2>&1 | Select-String "MSB3027|MSB3021"
   # → Reveals: dotnet run PID 28232 giữ handle → build fail
   ```

5. **Trace Data Flow (khi error deep trong call stack)**

   - Bad value originate ở đâu? Ai gọi với bad value?
   - Keep tracing up until source — fix at **source**, not symptom
   - Xem `root-cause-tracing` technique bên dưới

### Phase 2: Pattern Analysis — Find pattern before fixing

1. **Find Working Examples** — locate similar working code trong cùng codebase. What works that's similar to what's broken?
2. **Compare Against References** — nếu implement pattern, đọc reference **COMPLETELY** (không skim). Hiểu fully trước khi apply.
3. **Identify Differences** — list mọi difference dù nhỏ. Đừng assume "that can't matter".
4. **Understand Dependencies** — cần components gì? settings, config, env? assumptions?

### Phase 3: Hypothesis and Testing — Scientific method

1. **Form Single Hypothesis** — State rõ: "I think X is root cause because Y". Viết ra, specific không vague.
2. **Test Minimally** — SMALLEST possible change để test hypothesis. One variable at a time. Đừng fix multiple things at once.
3. **Verify Before Continuing** — Did it work? Yes → Phase 4. No → form NEW hypothesis. DON'T add more fixes on top.
4. **When You Don't Know** — Nói "I don't understand X". Đừng pretend. Ask for help, research more.

### Phase 4: Implementation — Fix root cause, not symptom (TDD + Verification)

1. **Create Failing Test Case** — simplest reproduction, automated test nếu có framework, one-off script nếu không. **MUST have before fixing.** Dùng `tdd-gate` skill (RED → verify fail).

2. **Implement Single Fix**
   - Address root cause identified — ONE change at a time
   - No "while I'm here" improvements, no bundled refactoring
   - Scope control: nếu phát hiện refactor lớn → ghi vào `Non-Goals` trong `bug.md`, không mở rộng `/fixbug` bounded loop

3. **Verify Fix — verification-before-completion gate (BẮT BUỘC fresh evidence)**

   ```
   BEFORE claiming any status:
   1. IDENTIFY: What command proves this claim?
   2. RUN: Execute FULL command (fresh, complete)
   3. READ: Full output, check exit code, count failures
   4. VERIFY: Does output confirm claim? If NO → state actual status
   5. ONLY THEN: Make claim
   Skip any step = lying, not verifying
   ```

   ```bash
   dotnet test N5Blazor.Tests --nologo          # 0 failures?
   dotnet build N5Blazor --nologo              # exit 0?
   # Re-run reproduce steps → Fixed?
   # Edge cases + regression → pass?
   ```

   - Test passes now? No other tests broken? Issue actually resolved?
   - Dùng `get_errors` full scope (Phase 4) — khác Phase 3 chỉ check affected files

4. **If Fix Doesn't Work — STOP, count**
   - If < 3: Return to Phase 1, re-analyze với new information
   - If ≥ 3: **STOP and question architecture** (step 5) — DON'T attempt Fix #4 without discussion

5. **AAR-Style Fix Benchmark (nếu nhiều cách fix)**
   > Học từ Anthropic AAR paper (28/08/2026): propose 3 methods → benchmark → keep best
   
   Khi có nhiều cách fix khả thi (≥2), đừng chọn ngẫu hiên:
   ```
   1. Liệt kê 3 phương pháp fix (A, B, C)
   2. Implement từng cái (minimal change, scope control)
   3. Benchmark mỗi cái: build + test + get_errors + edge cases
   4. So sánh scores → Keep best, discard rest
   5. Log benchmark vào .agent/benchmarks/<slug>-benchmark.md
   ```
   
   **Benchmark checklist:**
   - `dotnet build` pass (không MSB3027 — KN-008)
   - `dotnet test` pass
   - `get_errors` 0
   - Edge cases pass
   - Không regression (chạy lại test suite)
   - Đo **HOW** (cách làm) không chỉ **WHETHER** (pass/fail)
   
   **3-fix limit vẫn áp dụng:** Nếu cả 3 cách đều fail → STOP, question architecture (step 5)

6. **If 3+ Fixes Failed: Question Architecture**

   Pattern indicating architectural problem:
   - Mỗi fix reveals new shared state/coupling/problem ở different place
   - Fixes require "massive refactoring" để implement
   - Mỗi fix creates new symptoms elsewhere

   **STOP and question fundamentals:**
   - Is this pattern fundamentally sound?
   - Are we "sticking with it through sheer inertia"?
   - Should we refactor architecture vs continue fixing symptoms?
   - Discuss với human partner trước khi attempt more fixes — đây là wrong architecture, không phải failed hypothesis

## Red Flags — STOP and Follow Process

Nếu catch yourself thinking:
- "Quick fix for now, investigate later"
- "Just try changing X and see if it works"
- "Add multiple changes, run tests"
- "Skip the test, I'll manually verify"
- "It's probably X, let me fix that"
- "I don't fully understand but this might work"
- "Pattern says X but I'll adapt it differently"
- "Here are main problems: [lists fixes without investigation]"
- Proposing solutions before tracing data flow
- **"One more fix attempt" (when already tried 2+)**
- **Each fix reveals new problem in different place**

**ALL = STOP. Return to Phase 1. If 3+ failed → question architecture.**

**Human signals you're doing it wrong:**
- "Is that not happening?" — You assumed without verifying
- "Will it show us...?" — You should have added evidence gathering
- "Stop guessing" — Proposing fixes without understanding
- "Ultra-think this" — Question fundamentals, not just symptoms

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "Issue is simple, don't need process" | Simple issues have root causes too. Process is fast for simple bugs. |
| "Emergency, no time for process" | Systematic is FASTER than guess-and-check thrashing. |
| "Just try this first, then investigate" | First fix sets pattern. Do it right from start. |
| "I'll write test after confirming fix" | Untested fixes don't stick. Test first proves it. |
| "Multiple fixes at once saves time" | Can't isolate what worked. Causes new bugs. |
| "Reference too long, I'll adapt" | Partial understanding guarantees bugs. Read completely. |
| "I see problem, let me fix it" | Seeing symptoms ≠ understanding root cause. |
| "One more fix attempt" (after 2+ failures) | 3+ failures = architectural problem. Question pattern. |

## Quick Reference

| Phase | Key Activities | Success Criteria |
|-------|---------------|------------------|
| **1. Root Cause** | Read errors, reproduce, check changes, gather evidence, trace data flow | Understand WHAT and WHY |
| **2. Pattern** | Find working examples, compare references, identify differences | Identify differences |
| **3. Hypothesis** | Form theory, test minimally, verify | Confirmed or new hypothesis |
| **4. Implementation** | Create test (tdd-gate), single fix, verify (fresh evidence) | Bug resolved, tests pass |

## When Process Reveals "No Root Cause"

Nếu investigation reveals issue truly environmental, timing-dependent, or external:
1. You've completed process
2. Document what you investigated
3. Implement appropriate handling (retry, timeout, error message)
4. Add monitoring/logging for future investigation

**But:** 95% "no root cause" cases là incomplete investigation.

## Supporting Techniques

- **root-cause-tracing** — Trace bugs backward through call stack to find original trigger. Hỏi: Where does bad value originate? What called this with bad value? Keep tracing up.
- **defense-in-depth** — Sau khi find root cause, add validation at multiple layers (input validation, service guard, UI feedback) để prevent recurrence.
- **condition-based-waiting** — Replace arbitrary timeouts (`Start-Sleep 2`) với condition polling (`Wait-Until { Test-Path ... } -Timeout 10`). Dùng cho `www/` animation verify, Blazor async.

## References

- Gốc: `obra/superpowers` `skills/systematic-debugging/SKILL.md` + `root-cause-tracing.md` + `defense-in-depth.md` + `condition-based-waiting.md`
- Harness: `.github/prompts/fixbug.prompt.md` (bounded loop), `docs/knowleged.md` (KN-XXX), `.github/harness/scripts/auto-learn.mjs` (suggest/log/propose), `.github/skills/tdd-gate/SKILL.md` (Phase 4.1), `docs/harness-flow.md`
- Lệnh: `get_errors` (affected → full scope), `dotnet build/test --nologo`, `git diff/log`, `run_in_terminal` sync

---
*Skill: systematic-debugging — Harness v2 systematic debugging. Inspired by obra/superpowers, adapted cho /fixbug + auto-learn + dotnet/JS.*
