# AAR Report — pairwise report check

> Generated: 2026-09-13T13:39:27.975Z by auto-researcher.mjs (AAR for Harness v2 + DisCo-lite Phase 1)
> Paper: Anthropic AAR 28/08/2026 — Automated Researchers Can Reliably Mitigate Alignment Failures + DisCo arXiv:2609.02749v1
> Warning shot: OpenAI HF incident 26/08/2026 — benchmark phải check HOW not just WHETHER

## 1. Suggest — knowleged.md (top 2)

- **[KN-050]** score 13.2 — AI-gen UI gãy 4 luật UX: div giả button + dialog không trap + nút bé + sameness + cognitive load (minor, ui a11y ux verify)
  - AI-gen UI gãy 4 luật UX: div giả button + dialog không trap + nút bé + sameness + cognitive load
  - snippet:  - **Ngày:** 2026-09-12 - **Bug report:** N/A — bài học từ "Where AI-Generated Design Breaks UX Laws" (HackerNoon 12/09/2026, Viacheslav Derzhaiev — h…
- **[KN-037]** score 13 — Evals Gap — "single biggest predictor" là evals discipline (Andrew Ng, Agentic AI Playbook 2026) (minor, process verification evals agentic-patterns)
  - Evals Gap — "single biggest predictor" là evals discipline (Andrew Ng, Agentic AI Playbook 2026)
  - snippet:  - **Ngày:** 2026-09-11 - **Bug report:** N/A — bài học từ Andrew Ng "Agentic AI" (DeepLearning.AI — bản free ~1h48m "complete playbook to become an A…

## 2. Library — BM25 (5078 chunks)

- **"Anthropic Courses — prompt_engineering_interactive_tutorial/AmazonBedrock/CONTRIBUTING"** · chunk #0 · page 1 · score 10.141
  > # Contributing Guidelines

Thank you for your interest in contributing to our project. Whether it's a bug report, new feature, correction, or additional
documentation, we greatly value feedback and contributions from our community.

Please read through this document before submitting any issues or p……
- **"Anthropic Courses — prompt_engineering_interactive_tutorial/AmazonBedrock/anthropic/10_2_Appendix_Tool_Use"** · chunk #9 · page 10 · score 8.729
  > general_explanation + system_prompt_tools_specific_tools
```

```python
multiplication_message = {
    "role": "user",
    "content": "Multiply 1,984,135 by 9,343,116"
}

stop_sequences = ["</function_calls>"]

# Get Claude's response
function_calling_response = get_completion([multiplication_messag……
- File: `D:\CLAUDE_VS\www\library\export.json`

## 3. Propose — 3 methods

### [A] Minimal fix — Áp Cách phòng tránh từ KN ⭐ **KEEP**
- **Source:** KN-050 · AI-gen UI gãy 4 luật UX: div giả button + dialog không trap + nút bé + sameness + cognitive load (score 13.2)
- **Mô tả:** Áp dụng **Cách phòng tránh** của KN-050: AI-gen UI gãy 4 luật UX: div giả button + dialog không trap + nút bé + sameness + cognitive load
- **Steps:** Đọc chi tiết KN-050 trong docs/knowleged.md → Áp Cách phòng tránh vào code → Verify bằng checklist của KN
- **Pros:** Nhanh, ít rủi ro, tránh lặp bug cũ | **Cons:** Có thể chưa đủ nếu task mới hoàn toàn
- **When:** Khi task chạm pattern đã từng lỗi

### [B] Polish + a11y — Theo product-quality 
- **Source:** product-quality.instructions.md + KN-002/KN-006
- **Mô tả:** Chất lượng product: build/test pass, error/empty/loading states, a11y, không hardcode
- **Steps:** Thêm states đầy đủ → A11y audit → Verify build/test
- **Pros:** Đẹp, bền, đúng chuẩn Harness | **Cons:** Tốn thêm 20-30% thời gian
- **When:** Khi task có UI hoặc cần polish

### [C] Library-inspired — Dùng kiến thức từ sách 
- **Source:** Anthropic Courses — prompt_engineering_interactive_tutorial/AmazonBedrock/CONTRIBUTING · chunk #0 · page 1 · score 10.141
- **Mô tả:** Theo "Anthropic Courses — prompt_engineering_interactive_tutorial/AmazonBedrock/CONTRIBUTING" (chunk #0): "# Contributing Guidelines

Thank you for your interest in contributing to our project. Whether it's a bug report, new fe…"
- **Steps:** Đọc chunk #0 trang 1 → Trích pattern vào design → Implement + citation
- **Pros:** Có grounding, không bịa | **Cons:** Cần verify snippet có liên quan thật
- **When:** Khi thư viện có kiến thức liên quan

## 4. Benchmark checklist

- [ ] dotnet build pass (không MSB3027 file lock — KN-008) **(required)**
- [ ] dotnet test pass **(required)**
- [ ] get_errors 0 **(required)**
- [ ] Grader check HOW not just WHETHER (học từ HF incident) **(required)**
- [ ] Không reward hacking — không hardcode để qua test **(required)**
- [ ] Có safe stop nếu task impossible (học từ HF)

> Học từ HF incident: benchmark phải check **HOW** (cách làm) không chỉ **WHETHER** (có pass không). Không reward hacking.

## 5. Recommendation

**KEEP Method A** — Minimal fix — Áp Cách phòng tránh từ KN

Reason: Áp dụng **Cách phòng tránh** của KN-050: AI-gen UI gãy 4 luật UX: div giả button + dialog không trap + nút bé + sameness

Next: Implement Method A todo-driven (tdd-gate) → benchmark → nếu fail thử method khác (max 3).

## 6. Distill — DisCo-lite (scope→ground→construct→verify)

Không chạy distill (thiếu flag `--distill`).

> DisCo arXiv:2609.02749v1 §3.2 — không skill nào được nhận nếu chưa verify. Gaps ghi vào record.json (R).

---
*Auto-Researcher — AAR for Harness v2 + DisCo-lite Phase 1. Process > Model. $4/h vs $150/h.*
