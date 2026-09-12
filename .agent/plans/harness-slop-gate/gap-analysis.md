# Gap Analysis — "The Slop Should Not Be Tolerated" × CLAUDE HARNESS v2

**Ngày:** 2026-09-12 · **Task:** `harness-slop-gate`
**Nguồn:** HackerNoon (Rox dT — tác giả LoopGate, *vested interest disclosed*) · SlopCodeBench arXiv 2603.24755v2 · METR study (16 dev, 246 tasks) · Anthropic "effective harnesses for long-running agents" · Patamia/FinVolution không liên quan.
**Phương pháp:** trích 14 khuyến nghị actionable từ bài → đối chiếu với hiện trạng harness (grep + read file:line) → verdict từng item → chỉ fix delta thật (minimal-ladder).

## Findings độc lập đứng sau bài báo (không phải ý kiến tác giả)

| Bằng chứng | Số liệu | Ý nghĩa cho harness |
|---|---|---|
| SlopCodeBench (05/2026) | 15 agents · 36 problems · 196 checkpoints — **3/4 runs** phình complexity + redundant khi extend code | Code pass test vẫn mục dần theo iteration → cần đo slop bằng máy |
| METR early-2025 | 16 dev · 246 tasks: chậm hơn **19%** nhưng tự ước lượng nhanh hơn **20%** | Đối chiếu KN-019 (perceived vs measured) — harness đã có KN |
| Anthropic write-up | "premature victory declaration", "fake-done features"; cùng agent review 3 lần → 3 kết quả | Model-graded done = vibe — harness đã có KN-023 |

## Bảng audit 14 items

| # | Khuyến nghị (bài) | Hiện trạng harness (evidence) | Verdict | Hành động |
|---|-------------------|------------------------------|---------|-----------|
| 1 | Run checks sau **mỗi** attempt; agent "done" ≠ pass | `verify.prompt.md`: "Không gọi task_complete khi chưa PASS" + fix-loop max 3 | ⚠️ MỘT PHẦN (prompt-enforced) | Chưa machine-enforce tự động; nằm trong backlog #9 |
| 2 | Checks **mandatory**, không markdown nhắc nhở | hooks `PostToolUse/Stop` CHỈ echo nhắc nhở (Critic F2); CI chỉ có eval-gate scope `www/library` | ⚠️ MỘT PHẦN (hooks = reminder, chưa phải check) | Wire test/slop vào CI gate — backlog |
| 3 | Diff **reviewable (~200 LOC)** | `minimal-ladder`: chỉ "ghi diff stat" — không có ngưỡng | ⚠️ MỘT PHẦN | Thêm heuristic ≤~200 LOC + chia bounded (minimal-ladder + harness-workflow) |
| 4 | **Check slop** (duplication/complexity) | Không có gì (grep toàn repo: 0) | ❌ THIẾU | **Build `scripts/slop-check.mjs`** (0-dep) + wire Verify |
| 5 | Fast checks + deep checks tách (pre-merge) | CI e2e + `npm run test:e2e`; chưa cần split thêm | ✅ ĐỦ DÙNG | Skip (YAGNI) |
| 6 | **Stop the reruns** (max attempts/time) | "loop fix max 3 lần/check" (harness-workflow) | ✅ ĐÃ CÓ | — |
| 7 | Standard độc lập (repo tests + conventions trước) | deny-test-mutate + KN-012 | ✅ ĐÃ CÓ | — |
| 8 | **Don't trust, do verify** (different pass) | Critic agent + Dissent Review gate (KN-018) + KN-023 | ✅ ĐÃ CÓ | — |
| 9 | **Lock checks out of workspace** | `.agent/policy.json` deny-test-mutate/deny-law-fork — chặn test files + policy.json; script verifier (`scripts/slop-check.mjs`) CHƯA được bảo vệ (Critic F2) | ⚠️ MỘT PHẦN | Backlog `policy-verifier-paths` |
| 10 | Fail loudly | verify "BLOCKED + chi tiết"; audit.jsonl | ✅ ĐÃ CÓ | — |
| 11 | **Property tests** (permutations) | Không có | ❌ THIẾU | Ghi technique vào KN-047 (không thêm lib — 0-dep) |
| 12 | **Watch the tests** (mutation testing) | `scripts/mutation.mjs` TỒN TẠI… | ⚠️ **THEATER** | 🚨 Phát hiện khi audit: script chỉ chạy `node --check` proxy — mutant syntax-ok = "survived" **mà không chạy test nào** → không bắt được test yếu. Ghi cảnh báo vào KN-047; fix thật = chạy test/mutant (chậm/đắt → task riêng, xem "Gap còn lại") |
| 13 | **Loop it** — đổi gì sau green → rerun | "verification-before-completion (fresh evidence, không dùng kết quả cũ)" — có tinh thần, chưa explicit | ⚠️ MỘT PHẦN | Thêm 1 dòng vào verify.prompt (Slop Gate block) |
| 14 | **Spec vs wish** — checklist item phải testable | Chưa luật hóa (KN-020 có tinh thần "verify output") | ❌ THIẾU | Thêm vào harness-workflow Slop Gate block + evals-gate |

## Delta thực sự đã áp dụng (5)

1. **`scripts/slop-check.mjs`** — duplication ≥8 dòng (cùng file hoặc cross-file) · function >80 dòng · CC >12 · skip generated/vendor · gate exit 1, fail-closed 0-file exit 2. (item 4)
2. **~200 LOC reviewable** heuristic + bounded-task split. (item 3)
3. **Loop-it rule** explicit. (item 13)
4. **Spec-vs-wish** rule. (item 14)
5. **KN-047** — gồm cảnh báo mutation-theater + property-test technique. (items 11, 12)

## Gap còn lại (KHÔNG sửa lần này — lý do rõ ràng)

| Gap | Lý do hoãn | Đề xuất tương lai |
|-----|-----------|-------------------|
| `mutation.mjs` chạy test thật per-mutant | Mỗi mutant = 1 lần spawn playwright (~10-20s) × 20 mutants = 5-7 phút — cần thiết kế chọn test đích + cache, là task riêng | Task `mutation-real`: `--run` flag chạy test file đích, giới hạn 5 mutants/run |
| Property-test framework | 0-dep constraint — không thêm lib | Viết property test dạng script thuần khi có parser/validator nào cần |
| CI fast/deep split | CI hiện tại chưa phải bottleneck | Khi CI >5 phút mới tách |
| Wire slop-check vào CI gate (diff-based) | CI hiện chỉ có eval-gate scope `www/library`; scan toàn repo có findings cũ (110 file) nên cần baseline diff để không fail CI oan | Task `ci-slop-gate` |
| Deny-rule bảo vệ script verifier (`slop-check.mjs`) trong `policy.json` | Sửa `policy.json` đi qua deny-law-fork — cần human/verify actor, là quyết định policy (không tự ý) | Task `policy-verifier-paths` |

## Dissent (KN-018 — ghi trước khi làm)

**Framing đối lập:** "Tác giả bài đang bán LoopGate (vested interest); 9/14 khuyến nghị harness ĐÃ CÓ — đọc bài rồi áp tất cả = cargo cult, thêm chữ không thêm giá trị."
**Phản biện giữ lại delta:** 2 bằng chứng độc lập (SlopCodeBench, METR) đứng sau phần slop/measurement; delta thật chỉ 5 mục, trong đó slop-check = 1 script 0-dep rẻ; phát hiện mutation-theater là giá trị từ việc đối chiếu (item 12). 3 khuyến nghị bị **từ chối áp** (CI split, property lib, lockout — đã có policy). → Dissent được tôn trọng, không copy nguyên bài.

**Ai nghĩ cùng:** Critic agent đã review độc lập (12/09/2026) — verdict **FIX**: F1 fail-open (0-file → exit 2 + tách semantics audit `slop:scan`) ✅ sửa; F2 overclaim (#1/#2/#9 relabel ⚠️ prompt-enforced + 2 mục backlog mới) ✅ sửa; F3 regex boundary ✅; F5 CC trên stripped lines ✅; F6 wording cross-file ✅; F4 doc class/nested ✅ (implementation remain backlog).
