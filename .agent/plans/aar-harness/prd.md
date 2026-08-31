# PRD — AAR for Harness (auto-researcher)

> Mini PRD — Idea: Áp dụng Automated Alignment Researcher (Anthropic 28/08/2026) vào Harness v2 để tự động search → propose → benchmark → keep best.

## Vision
Biến Harness v2 thành hệ thống tự cải tiến như AAR: mỗi task đều được search literature (knowleged.md + library), propose 3 cách, benchmark chặt, giữ cái tốt nhất — rẻ ($4/h) và nhanh (30 phút/vòng) như paper.

## User Stories
- **P0 — Dev giao task:** Gõ `node auto-researcher.mjs --task "làm feature X"` → script tự suggest KN + search library + propose 3 methods + benchmark + report → dev chọn best để implement.
- **P0 — YUNIE auto:** Khi user nói "áp AAR" hoặc `/harness` với flag AAR, YUNIE tự chạy Tier 1 (suggest + library) trước khi viết PRD.
- **P1 — Loop 30 phút:** Mỗi method được implement thử trong sandbox, chạy `dotnet build/test + get_errors + a11y` → score → keep best, discard rest.

## Scope In
- Skill `auto-researcher` (SKILL.md) mô tả workflow AAR cho Harness
- Script `auto-researcher.mjs` (Node 18+, no deps): suggest + library search + propose 3 + benchmark + report
- PRD/Design/Plan mini tại `.agent/plans/aar-harness/`
- Registry entry + `www/status.json` regenerate

## Scope Out (Non-Goals)
- Không tự động train model LLM (chỉ benchmark code như AAR train 30 phút)
- Không recursive self-improvement Tier 3 (tự sửa chính nó) — cần sandbox cô lập, để tương lai
- Không gọi LLM API bắt buộc — propose template-based, có thể nối LLM sau

## Metrics
- `suggest` trả về ≥1 KN liên quan nếu có (BM25 score >0)
- `library search` trả về hits trong <100ms (BM25 local)
- Benchmark: `build pass + test pass + get_errors 0` mới keep
- Report markdown sinh trong <5s

## Nguồn từ thư viện & paper
- Anthropic AAR paper 28/08/2026: "Automated Researchers Can Reliably Mitigate Alignment Failures" — Chen Yueh-Han — search→propose→train 30m→keep effective
- OpenAI HF incident 26/08/2026: warning shot — benchmark phải check HOW not just WHETHER, cần isolation + CoT monitoring + safe stop
- Harness v2: Explore→Clarify→PRD→Design→Plan→Implement→Polish→Verify (đã 70% AAR)

## Risks
- Benchmark dở → reward hacking (học từ HF) → mitigation: checklist knowleged + a11y + responsive
- Library chưa có sách liên quan → fallback: chỉ dùng knowleged.md
