# PRD mini — Harness Radar 2026-09-30 (adopt 7 tin/nghiên cứu)

> Nguồn: YUNIE quét `www/ai-news/curated.json` (~40 tin) + feed 30/09, đối chiếu `docs/knowleged.md` → 7 món "giúp hệ thống" chưa adopt (0 mention). User: "làm hết".

## Vấn đề
Tri thức tốt nằm trong feed nhưng chưa vào hệ: không KN, không guard, không note workstream → "biết nhưng không làm" (KN-020/024 class).

## User stories
1. Maintainer: mỗi tin lớn phải biến thành **KN + guard/note cụ thể** trong ≤1 ngày, không chỉ nằm trong feed.
2. Agent: gate tiền (purchase/pay) phải hỏi đủ **4 câu (who · authorized-by · scope · limit)** + record trước khi chạy (t54).
3. Maintainer: content **tự sinh phản bác verifier** (danh tính giả, rebuttal, dìm review) = tape, không phải bằng chứng (AISI 28/09).

## Scope (GIỮ — 7 món, bounded)
| # | Món | Deliverable |
|---|-----|-------------|
| 1 | UK AISI (Astra fake identity dìm review) | `context.mjs` pattern rebuttal = tape + KN-084 + guard G6 + governance note |
| 2 | t54 (agent chuyển tiền thật) | `cua-guard.mjs` money precondition (`--authorized-by` + `--limit`) + KN-085 + guard C7 |
| 3 | AIHOT (hotspot + daily report, configurable) | `www/ai-news/report.mjs` (digest + ứng viên curated) + KN-089 + spec |
| 4 | Uno Platform (MCP split theo lifetime) | Addendum `harness-2.1-protocols/design.md` + KN-086 |
| 5 | Foundry Tool Search (only-load-relevant tools) | Addendum `harness-2.1-tool-use/design.md` + KN-087 |
| 6 | Cosmos DB agentic (schema sample · ask-before-spend · tools/skills) | KN-088 + governance checklist |
| 7 | Risk-Averse Agents (arXiv 2609.38093) | `llm-weakness-research.md` §2d + KN-090 (watchlist) |

## Non-goals (CẮT — YAGNI, minimal-ladder)
- ❌ Config sources cho `fetch.mjs` (AIHOT pattern): 6 nguồn ổn định, chưa cần — ghi KN là "skipped + why".
- ❌ Sửa `.agent/policy.json` (law 1 file — chỉ human takeover/verify).
- ❌ Auto-curate không người duyệt → chỉ **candidates** (người/agent quyết ghim).
- ❌ Bucket cap fetch.mjs — **đã có từ 24/09** (`CAP_PER_DAY=5` + spec), không làm lại.

## Persistence · F5 · Scope
Persistence: repo artifacts (KN/instruction/spec/script) · F5: không áp dụng (không phải trang static ghi dữ liệu) · Scope: repo-wide.

## Who did you think with? (Dissent — KN-018)
Phản biện chính: "7 món adopt hết có phải tham không?" — trả lời bằng phân tầng: 2 món thành **enforcement code + guard** (1,2), 1 món thành **tool + spec** (3), 3 món là **design-note** trong workstream đang chạy (4,5,6 — tránh xây khi workstream chưa tới), 1 món **watchlist** (7). Không món nào mở rộng ngoài deliverable. Rủi ro disclosure: pattern rebuttal là heuristic (defense-in-depth), không claim complete.
