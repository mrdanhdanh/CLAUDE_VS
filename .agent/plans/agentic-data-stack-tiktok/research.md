# Research — clip "ĐỌC VỊ · ADS" (Agentic Data Stack)

> Nguồn: **Nie Lifeng**, HackerNoon 27.09.2026 — https://hackernoon.com/rebuilding-data-engineering-with-harness-engineering-a-new-paradigm-for-the-agent-era
> Badge credibility của HackerNoon ghi trên bài: **Opinion piece / Thought Leadership + AI-assisted**.
> Truy cập: 27.09.2026 (fetch toàn văn).

## Evidence ledger (A/B/C/D)

| # | Claim dùng trong clip | Nhãn | Ghi chú |
|---|---|---|---|
| 1 | "Failure nguy hiểm nhất: agent tạo kết quả **sai** mà vẫn **chạy thành công** trong production" | C | Câu chữ của tác giả (§2) — luận điểm trung tâm, dùng làm hook |
| 2 | Snowflake & Databricks hội tụ về **Context · Capability · Governance · Execution**; user mới của platform là agent | C | Phân tích của tác giả — **không phải** tuyên bố chính thức của 2 công ty |
| 3 | SQL/DAG/config thành commodity → scarce = **Context · Verification · Governance · Controlled Execution · Accountability** | C | Luận đề của tác giả (§2) |
| 4 | 4 mức đúng: **Syntactic → Execution → Data → Business** | C | Framework của tác giả (§3) |
| 5 | Ví dụ Revenue: Order Amount / Paid / Recognized / Net — engine không phân biệt, chỉ enterprise context biết | C | Ví dụ của tác giả (§3) |
| 6 | **Five-Layer Agentic Data Stack**: L5 Intent · L4 Control Plane · L3 Semantic & Knowledge · L2 Harness · L1 Runtime | C | Framework của tác giả (§4) |
| 7 | **7 sign-off gates**: intent · context · plan · execution · validation · recovery · audit | C | Framework của tác giả (§3) |
| 8 | Risk tiers: low = auto · medium = notify · high = approve · critical = block/dual approval | C | Đề xuất của tác giả (§4) |
| 9 | Vai data engineer đổi: SQL Writer → … → **Agent Capability Designer** (context/skill/policy/evaluation designer) | C | Dự đoán của tác giả |

**Quy tắc áp dụng (clip-craft §6):** bài tự khai opinion + AI-assisted → không claim nào lên nhãn A/B; clip giữ nhãn nguồn trên hình: footer `HACKERNOON · 27.09.2026 · QUAN ĐIỂM`, các câu framework ghi rõ "theo tác giả/bài báo". **Không có số liệu đo lường nào được trích** (bài không nêu benchmark) → clip không bịa số.

## Ghi chú biên tập

- KHÔNG nói "Snowflake/Databricks đã ship xong" — chỉ "đang đổi hướng" (đúng câu bài).
- Giữ tiếng Anh có chủ đích cho thuật ngữ ngành quen dùng (agent, harness, context, policy, runtime, production, goal) — nhưng mỗi khái niệm lạ đều có giải thích tiếng Việt cùng khung (clip-craft luật 11).
- Dissent (fund-the-friction): bài là thought leadership 1 nguồn → clip **không** trình bày như sự thật đã kiểm chứng; mọi framework giới thiệu là "cách tác giả xếp lại", không phải chuẩn công nghiệp.
