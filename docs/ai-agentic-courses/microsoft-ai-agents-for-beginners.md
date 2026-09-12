# Microsoft — AI Agents for Beginners (FREE, GitHub)

> **Nguồn:** https://github.com/microsoft/ai-agents-for-beginners · **Study Guide:** https://github.com/microsoft/ai-agents-for-beginners/blob/main/STUDY_GUIDE.md
> **📚 Corpus đầy đủ (verbatim):** [`full/microsoft-ai-agents-for-beginners/`](./full/microsoft-ai-agents-for-beginners/) — 19 lesson README nguyên văn + STUDY_GUIDE + AGENTS.md đã tải về máy
> **Fetch ngày:** 2026-09-12 · **Chi phí:** Miễn phí hoàn toàn (MIT license)
> **Chứng chỉ:** Không có cert chính thức — nhưng có smoke test + badge nội bộ
> **Đối tượng:** Developer mới bắt đầu với agents (Python) · **Ngôn ngữ:** English + **50+ bản dịch tự động**

## 1. Tổng quan

18 lessons "everything you need to know to start building AI Agents" từ Microsoft. Repo: **74.5k ⭐**, 24.6k forks, 102 contributors, MIT license. Mỗi lesson = README + video ngắn + Python code samples (Microsoft Agent Framework + Microsoft Foundry Agent Service V2).

## 2. Danh sách 18 lessons (chi tiết 1 dòng mỗi lesson)

| # | Lesson | Học gì | Thêm vào demo gì |
|---|--------|--------|------------------|
| 00 | Course Setup | Azure/Foundry setup, env | — |
| 01 | Intro to AI Agents | Agent khác chatbot ở đâu | Giải thích demo idea như agent |
| 02 | Agentic Frameworks | Framework quản model/tools/state/workflow | Xác định phần nào framework lo |
| 03 | Agentic Design Patterns | Pattern thiết kế hành vi agent | Vẽ user journey trước khi code |
| 04 | Tool Use | Agent gọi tool lấy data / hành động | Định nghĩa 1 tool cho demo |
| 05 | Agentic RAG | Retrieval grounding câu trả lời | Chọn knowledge source để search |
| 06 | Building Trustworthy Agents | Guardrails, oversight, hành vi an toàn | Thêm 1 rule "hỏi user trước khi…" |
| 07 | Planning Design | Chia mục tiêu lớn thành bước nhỏ | Viết plan 3 bước cho demo |
| 08 | Multi-Agent Design | Khi nào tách việc cho nhiều agent | 1 agent hay nhiều? |
| 09 | Metacognition | Agent tự review + cải thiện output | Thêm self-check trước khi trả lời |
| 10 | AI Agents in Production | Demo → production: monitor quality/cost/latency/failures | Liệt kê thứ cần monitor |
| 11 | Agentic Protocols | MCP, A2A, NLWeb | Chỗ nào protocol giúp integration |
| 12 | Context Engineering | Chọn/lọc/isolate/manage context | Cái gì vào prompt, cái gì để ngoài |
| 13 | Agent Memory | Lưu thông tin qua nhiều lượt | Chọn 1 preference an toàn để nhớ |
| 14 | Microsoft Agent Framework | Building blocks MAF + host LangChain/LangGraph agents trên Foundry | Map demo steps → framework concepts |
| 15 | Computer Use Agents (CUA) | Agent điều khiển browser/UI (VD: Microsoft Project Opal) | Task browser nào vẫn cần user confirm |
| 16 | Deploying Scalable Agents | Prototype → production scalable trên Foundry (hosted agents, model routing, caching, evaluation gates, smoke tests) | Concerns còn thiếu của demo |
| 17 | Creating Local AI Agents | Local-first với Foundry Local + Qwen (local tools, local RAG, local MCP) | Phần nào giữ private/chạy local |
| 18 | Securing AI Agents | Auditable + tamper-evident actions | Action nào cần log/receipt |

## 3. Providers (cách chạy code — chọn 1)

| Provider | Ghi chú |
|----------|---------|
| **Microsoft Foundry / Azure OpenAI (Responses API)** | Path chính; keyless Entra ID qua `az login` (`FoundryChatClient` / `OpenAIChatClient`) |
| **Foundry Local** | Chạy on-device, không cloud, không API key — offline/cost-free |
| **MiniMax** | OpenAI-compatible, context lớn (204K) — drop-in alternative |
| ~~GitHub Models~~ | Deprecated (retire July 2026) — không dùng nữa |

## 4. Learning paths (Study Guide)

| Muốn | Bắt đầu | Sau đó |
|------|---------|--------|
| Hiểu agent là gì | 01, 02, 03 | 04–06 |
| Agent dùng tools | 04 | 05, 07, 14 |
| Agent RAG | 05 | 04, 06, 12 |
| Multi-step workflows | 07 | 08, 09, 14 |
| Multi-agent systems | 08 | 07, 09, 11 |
| Production | 06, 10 | 12, 13, 16, 18 |
| Deploy/scale trên Foundry | 10, 16 | 06, 13, 18 |
| Local/offline-first | 17 | 04, 05, 11 |
| Protocols + browser automation | 11, 15 | 10, 18 |

> Mẹo từ STUDY_GUIDE: người mới **đừng bỏ Lessons 01–06** — đây là vocabulary cho phần còn lại.

## 5. Study Guide có sẵn (free trong repo)

- **Demo xuyên khóa:** "course helper agent" (tìm lesson → tóm tắt → gợi ý practice task) — mỗi lesson tự hỏi "agent thêm được gì mới?".
- **15-minute review routine** sau mỗi lesson (5 bước: tóm tắt → capability mới → thêm vào demo → risk → 1 test question).
- **Quick self-check** 7 câu + **Capstone exercise** (build agent điều hướng repo này).
- **Smoke tests** sẵn cho lessons 01, 04, 05, 16 (GitHub Action "AI Smoke Test").

## 6. Điểm mạnh / Lưu ý

- ✅ Free 100%, không cần cert, nội dung sâu nhất trong các khóa free (18 lessons, production-grade topics: security, deploy, CUA, memory).
- ✅ 50+ ngôn ngữ — hữu ích nếu thoải mái hơn với tiếng Việt (dịch tự động).
- ⚠️ Code mẫu gắn Azure/Foundry — nhưng có Foundry Local + MiniMax để tránh chi phí cloud.
- ⚠️ Là GitHub course — không có video dài, chủ yếu đọc + chạy notebook.

## 7. Nguồn (lưu lại)

- Repo chính: https://github.com/microsoft/ai-agents-for-beginners
- Study Guide: https://github.com/microsoft/ai-agents-for-beginners/blob/main/STUDY_GUIDE.md
- Course Setup: https://github.com/microsoft/ai-agents-for-beginners/blob/main/00-course-setup/README.md
- Smoke tests: https://github.com/microsoft/ai-agents-for-beginners/blob/main/tests/README.md
- Discord (Microsoft Foundry): https://discord.com/invite/ATgtXmAS5D

---
*Ghi bởi YUNIE — fetch trực tiếp 2026-09-12 (repo + STUDY_GUIDE.md).*
