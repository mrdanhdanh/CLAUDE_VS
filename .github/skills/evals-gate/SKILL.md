---
name: evals-gate
description: "Evals Gate — 'NO DONE WITHOUT EVALS': đo chất lượng output open-ended bằng rubric + component evals + E2E evals + error analysis, không chỉ build/test/lint. Use when verifying agent/product output, before claiming done, when quality can't be measured by pass/fail tests, need quality gate or rubric, or user says evals / đánh giá chất lượng / quality gate. Inspired by Andrew Ng — Agentic AI Playbook 2026 (KN-037)."
user-invocable: true
---

# Evals Gate — Đo chất lượng, không chỉ "chạy được" (Harness v2)

> **Process > Model.** Build/test/lint đo **WHETHER** (chạy được). Evals đo **HOW WELL** (tốt đến đâu).
> Andrew Ng (Agentic AI Playbook 2026): *"The single biggest predictor of whether someone executes well with AI agents is their ability to drive a disciplined process for evals and error analysis."*

## Iron Law

```
NO DONE WITHOUT EVALS FOR OPEN-ENDED OUTPUT
```

Build pass + test pass + visual OK **≠** Done. Output open-ended (UI, plan, report, agent action) phải có **tiêu chí đo + bằng chứng đo**.

## When to Use

**Bắt buộc:**
- `/harness` Verify phase — mọi output open-ended (UI/UX, docs, plan, agent workflow)
- `/fixbug` Verify — bug chất lượng mờ (không reproduce bằng test binary), UI/workflow
- Trước khi claim "xong / nhanh hơn / tốt hơn"

**Rút gọn (mini-evals):**
- Task 1-2 file deterministic (typo, config, API mapping) → 2-3 tiêu chí viết ra + 1 sample check — vẫn không bỏ hẳn.

**Không cần:** pure build/lint fix nơi kết quả đã binary (compile pass/fail).

## Evals Gate — 4 bước

### 1. Rubric TRƯỚC khi đo
Viết tiêu chí cụ thể trước khi đánh giá (chống "trông ổn"):
```md
Evals — <task>:
- C1: <tiêu chí 1 — đo được>  → PASS/FAIL + evidence
- C2: <tiêu chí 2>
- C3: <tiêu chí 3>
Goal E2E: <scenario thật> → expected <kết quả>
```
Ví dụ: "C1: mở mobile 375px không tràn; C2: search <100ms với 1000 chunks; E2E: user mới tạo task → F5 vẫn còn".

### 2. Component evals — đo từng bước
Mỗi bước pipeline tự verify phần mình trước khi chuyển bước sau:

| Bước | Câu hỏi eval |
|------|--------------|
| Plan | Decompose đúng chưa? Thiếu bước nào? |
| Implement | Từng function behavior đúng spec? |
| Tool/MCP call | Gọi đúng tool? Input/output schema đúng? |
| Output | Đúng format? Đúng nội dung? |

Lợi ích: failures khoanh vùng được — không phải debug cả chuỗi.

### 3. End-to-end evals — đo goal
- Chạy **scenario thật** từ đầu đến cuối như user mới (không workaround — KN-005).
- Đo **goal achieved** — không chỉ "không lỗi".
- UI → 375/768/1280 + states; workflow → happy path + 1 edge case.

### 4. Error analysis — aggregate TRƯỚC khi fix
- Gom failures cùng loại (≥2 instances) → tìm **recurring pattern** (KN-034).
- Phân loại: instance-specific (fix local) vs pattern-level (fix gốc — gate/skill/process).
- Fix pattern → verify trên **task chưa từng thấy**, không chỉ re-test case đã fail.

## Slop dimension — đừng chỉ check bugs (KN-047)
> "Code can pass every behavior test and still be miserable to maintain" — SlopCodeBench: 3/4 agent runs phình complexity + redundant khi extend.
- `node scripts/slop-check.mjs <files>` — duplication ≥8 dòng · function >80 dòng · CC >12 (0-dep, local; gate exit 1, fail-closed exit 2 khi 0 file).
- **Diff reviewable** ~≤200 LOC/task (không tính generated) — vượt → chia bounded task.
- **Spec ≠ wish:** item "done" phải chạy/check được — "Supports CSV" là wishlist, không đếm.

## Reflection đúng cách — rubric, không vibes (KN-023)
- Critique **phải có tiêu chí** — model tự review mình không rubric = tự khen (self-preference bias).
- Ưu tiên **nguồn ngoài model**: tool đo được, framing đối lập không prompt trước (KN-018), fresh evidence.
- "Trông ổn" / "có vẻ đúng" **không phải eval** — thiếu số đo là chưa verify.

## Chọn pattern có chủ đích (4 patterns — Andrew Ng Playbook 2026)
```
Prompt 1 phát đủ?           → không thêm loop (KN-022: vẽ được flowchart → pipeline)
Cần output chất lượng hơn?  → Reflection (rubric + iterate)
Cần hành động ra thế giới?  → Tool Use (MCP, scripts, API)
Task nhiều bước?            → Planning (plan.md + todos — đã có sẵn)
Task lớn chia được?         → Multi-Agent (subagents — Explore/Implement/Verify)
Cần tự cải thiện?           → Evals + vòng lặp (auto-learn KN-007)
```
Không dùng (các) pattern nào task không cần — agency là cost phải justify.

## Tích hợp Harness v2

| Pipeline | Phase | Áp dụng |
|----------|-------|---------|
| `/harness` | Verify | Rubric + component evals + E2E + error analysis — trước khi claim Done |
| `/fixbug` | Verify | Mini-evals nếu output open-ended; error analysis aggregate (KN-034) |
| Mọi lúc | Claim speed/ROI | Số đo thật (diff stat, loop count, cost) — không vibes (KN-019) |

## Checklist trước Done
- [ ] Rubric viết TRƯỚC khi đo (không "trông ổn")?
- [ ] Component evals — từng bước pipeline đã verified?
- [ ] E2E — scenario thật, goal achieved, không chỉ build xanh?
- [ ] Error analysis — failures cùng loại ≥2 đã aggregate trước khi fix?
- [ ] Critique có nguồn ngoài model (tool đo / framing đối lập)?
- [ ] Số đo kèm claim (nếu claim nhanh/tốt hơn)?
- [ ] Slop check (duplication/complexity) đã chạy trên changed files? (KN-047)

## Nguồn
- Andrew Ng — "Agentic AI" (DeepLearning.AI, Playbook 2026) — distilled: `books/Andrew-Ng-Agentic-AI-Playbook-2026-Distilled.md`
- Harness: KN-037 · liên quan: KN-018 (dissent), KN-019 (metrics), KN-022 (pipeline vs agency), KN-023 (verify ngoài model), KN-034 (error analysis), KN-047 (slop gate)

---
*Skill: evals-gate — enforce bởi Harness v2. KN-037 — "single biggest predictor" là evals discipline.*
