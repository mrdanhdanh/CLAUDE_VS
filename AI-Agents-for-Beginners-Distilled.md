# AI Agents for Beginners — Distilled (18 Lessons → 1 File)

> **Nguồn:** [microsoft/ai-agents-for-beginners](https://github.com/microsoft/ai-agents-for-beginners) · **License:** MIT · **Ngày gom:** 2026-08-31 · **Bản gốc:** 18 lessons + 00 setup (~320k chars) → **bản này ~35k chars, tập trung, RAG-ready**
> **Cách dùng:** Nhét file này vào `www/library/index.html` (kéo thả) → BM25 tìm <100ms. Mỗi `##` là 1 chunk, mỗi lesson có keywords để search trúng ngay.
> **Tiếng Việt TL;DR:** File này cô đọng toàn bộ khóa học AI Agents của Microsoft thành 1 MD duy nhất: định nghĩa agent, khi nào dùng, 6 design patterns cốt lõi (Tool Use, RAG, Planning, Multi-Agent, Metacognition), rồi production (observability, deploy, scaling), protocols (MCP/A2A/NLWeb), context & memory, framework (MAF), browser-use, local SLM, và bảo mật bằng receipt. Đọc 30 phút là nắm khung, search là ra ngay pattern cần.

---

## Mục lục

- [Bản đồ 18 Lessons](#bản-đồ-18-lessons)
- [00 — Setup (tóm tắt)](#00--setup)
- [Phần I: Nền tảng (01-03)](#phần-i-nền-tảng)
- [Phần II: Patterns cốt lõi (04-09)](#phần-ii-patterns-cốt-lõi)
- [Phần III: Production (10 + 16)](#phần-iii-production)
- [Phần IV: Protocols / Context / Memory (11-13)](#phần-iv-protocols--context--memory)
- [Phần V: Framework & Browser & Local (14,15,17)](#phần-v-framework--browser--local)
- [Phần VI: Security (18)](#phần-vi-security)
- [Checklist & Decision Tree](#checklist--decision-tree)
- [Glossary](#glossary)
- [Nguồn & License](#nguồn--license)

---

## Bản đồ 18 Lessons

| # | Lesson | 1 câu cốt lõi | Keywords |
|---|--------|---------------|----------|
| 00 | Course Setup | Chạy code bằng Microsoft Agent Framework + Foundry Agent Service V2 | Foundry, .env, az login, gpt-5-mini |
| 01 | Intro to AI Agents | Agent = LLM + tools + knowledge + memory để *làm việc*, không chỉ trả lời | Environment/Sensor/Actuator, 7 loại agent |
| 02 | Agentic Frameworks | Framework cho sẵn components để prototype nhanh, khác với AI framework thường | MAF vs Foundry Agent Service, modular, collaboration |
| 03 | Agentic Design Principles | Thiết kế xoay quanh con người: Space/Time/Core + Transparency/Control/Consistency | HAX Toolkit, human-centric |
| 04 | Tool Use | Cho LLM gọi function/tool qua schema → mở rộng khả năng | function calling, tool schema, Responses API |
| 05 | Agentic RAG | LLM tự lập kế hoạch, gọi tool, tự sửa query cho tới khi đủ tốt | maker-checker loop, iterative retrieval |
| 06 | Trustworthy Agents | System message framework + threat model + human-in-the-loop | safety, prompt injection, poisoning |
| 07 | Planning Design | Chia goal lớn thành subtasks, dùng structured output + event-driven | task decomposition, Pydantic, planner agent |
| 08 | Multi-Agent | Nhiều agent chuyên môn phối hợp, cần communication/coordination/visibility | group chat, hand-off, collaborative filtering |
| 09 | Metacognition | Agent tự soi lại cách nó suy nghĩ để tự sửa | self-reflection, planning, corrective RAG, code as tool |
| 10 | Agents in Production | Biến black-box thành glass-box: traces/spans, metrics, eval | OpenTelemetry, Langfuse, offline/online eval |
| 11 | Agentic Protocols | Chuẩn hóa kết nối: MCP (tool), A2A (agent-agent), NLWeb (web) | MCP client-server, Agent Card, embeddings |
| 12 | Context Engineering | Quản lý context window động: write/select/compress/isolate | poisoning, distraction, confusion, scratchpad |
| 13 | Agent Memory | Biến stateless thành stateful: working/short/long/persona/episodic | Mem0, Cognee, Azure AI Search, knowledge agent |
| 14 | Microsoft Agent Framework | Framework thống nhất: sequential/concurrent/group-chat/handoff/magnetic + workflows | ChatAgent, Threads, Middleware, Foundry |
| 15 | Browser-Use (CUA) | Agent điều khiển browser như người: vision + Playwright + CDP | agent vs actor, hybrid, safety guardrails |
| 16 | Deploying Scalable Agents | Từ notebook lên production: hosting, lifecycle, routing, caching | client-hosted vs hosted, model router |
| 17 | Local Agents | Chạy SLM (Qwen) on-device qua Foundry Local, không cần cloud | SLM trade-offs, Chroma RAG, local MCP, hybrid |
| 18 | Securing Agents | Receipt ký Ed25519 + JCS + hash chain để audit không thể sửa | canonical JSON, tamper-evident, chain |

---

## 00 — Setup

**Stack chính:** Microsoft Agent Framework (MAF) + Microsoft Foundry Agent Service V2 + Azure OpenAI (`gpt-5-mini` hiện tại, trước là `gpt-4.1-mini` đã deprecated 2026-10-14). Một số sample hỗ trợ MiniMax (OpenAI-compatible, 204K context).

**Chạy nhanh:**
```bash
git clone --filter=blob:none --sparse https://github.com/microsoft/ai-agents-for-beginners.git
cd ai-agents-for-beginners
git sparse-checkout set --no-cone '/*' '!translations' '!translated_images'
# .env cần: AZURE_AI_PROJECT_ENDPOINT, AZURE_AI_MODEL_DEPLOYMENT_NAME, AZURE_OPENAI_ENDPOINT
az login
pip install -r requirements.txt
```

**Cấu trúc mỗi lesson:** `README.md` (lý thuyết) + `code_samples/*.ipynb` (Python, MAF + Foundry) + `images/` + video YouTube. Test smoke ở `tests/lesson-*-smoke-tests.json`.

---

## Phần I: Nền tảng

### 01 — Intro to AI Agents and Use Cases

**Định nghĩa:** *AI Agents là hệ thống cho phép LLM thực sự làm việc — bằng cách cấp tools và knowledge để tác động lên thế giới, không chỉ sinh text.*

**3 thành phần mọi agent:** Environment (không gian làm việc) · Sensors (đọc trạng thái) · Actuators (hành động: book, gửi, hủy).

**7 loại agent (ví dụ travel):**
- Simple Reflex: rule cứng, không nhớ → forward email khiếu nại.
- Model-Based Reflex: có model thế giới → flag giá vé tăng đột biến.
- Goal-Based: có goal, tự tìm đường → book trọn bộ trip.
- Utility-Based: tối ưu trade-off → cân cost vs convenience.
- Learning: học từ feedback → điều chỉnh gợi ý sau survey.
- Hierarchical: agent cấp cao chia subtask cho sub-agents → cancel trip = cancel flight+hotel+car.
- Multi-Agent System: nhiều agent độc lập hợp tác/cạnh tranh.

**Khi nào dùng agent:** Open-ended (không code sẵn được steps) · Multi-step (cần tools qua nhiều turns) · Cần cải thiện theo thời gian. Ngược lại, task đơn giản 1 bước thì đừng dùng agent.

**Building blocks:** Tools/actions/behaviors + Agentic Patterns (chiến lược prompt/orchestration tái dùng) + Agentic Frameworks (MAF).

### 02 — Explore Agentic Frameworks

**Framework là gì:** Nền tảng có sẵn components/abstractions/tools để tạo/quản lý agent — giúp tập trung vào logic riêng, không build lại từ đầu.

**3 năng lực chính:** Collaboration/Coordination (nhiều agent cùng làm) · Task Automation/Management (multi-step, delegation) · Contextual Understanding/Adaptation (hiểu context, thích ứng real-time).

**Prototype nhanh bằng 3 cách:**
1. **Modular Components:** AI/Memory connectors, function calling, prompt templates. Ví dụ MAF `FoundryChatClient` + `@tool`:
```python
from agent_framework import tool
from agent_framework.foundry import FoundryChatClient
@tool(approval_mode="never_require")
def book_flight(date: str, location: str) -> str: return f"Booked to {location} on {date}"
provider = FoundryChatClient(project_endpoint=..., model=..., credential=...)
agent = provider.as_agent(name="travel_agent", instructions="Help book travel", tools=[book_flight])
await agent.run("Go to New York on Jan 1")
```
2. **Collaborative Tools:** Mỗi agent 1 role (retrieval vs analysis) rồi chạy nối tiếp.
3. **Real-Time Learning:** Feedback loop để agent tự điều chỉnh.

**MAF vs Foundry Agent Service:**
- **MAF:** SDK/framework chạy trong code bạn, linh hoạt, tự host, hỗ trợ workflows, middleware, observability (OpenTelemetry).
- **Foundry Agent Service:** Managed service trên Azure, host reasoning loop, lưu threads, RBAC, content safety, portal. Bạn chỉ cần thin client.
- Chọn MAF khi cần control vòng lặp, custom middleware; chọn Foundry khi cần durability/governance/ít ops.

### 03 — Agentic Design Principles (Human-Centric)

**Không phải kiến trúc cứng, mà là nguyên tắc UX để agent phục vụ con người:**

**Agent (Space) — môi trường:**
- Connecting, not collapsing: kết nối người-với-người/knowledge, không thay thế con người.
- Easily accessible yet occasionally invisible: chạy nền, chỉ nudge khi cần; hỗ trợ multimodal; chuyển foreground/background mượt; transparent về process.

**Agent (Time) — theo thời gian:**
- Past: phản chiếu lịch sử (state + context) để ra kết quả liên quan hơn.
- Now: nudging > notifying — đơn giản hóa flow, cue đúng lúc, theo context văn hóa/xã hội.
- Future: thích ứng device/platform/modality, học từ tương tác liên tục.

**Agent (Core) — lõi:**
- Embrace uncertainty but establish trust: chấp nhận uncertainty, nhưng trust/transparency là nền; user control on/off, status luôn visible.

**3 Guidelines khi implement:**
1. **Transparency:** báo rõ có AI, cách hoạt động, cách feedback/sửa.
2. **Control:** cho user customize system prompt, verbosity, style, xem/xóa data.
3. **Consistency:** UI/UX nhất quán cross-device, icon quen thuộc (📎 upload), giảm cognitive load.

**Ví dụ Travel Agent:** chào + sample prompts, cho chỉnh system prompt, icon chuẩn, feedback thumbs up/down.

---

## Phần II: Patterns cốt lõi

### 04 — Tool Use Design Pattern

**Ý tưởng:** Mở rộng LLM bằng cách cho nó gọi tools (function, API, calculator, DB) qua **model-generated function calls**.

**Use cases:** Dynamic retrieval (query API/DB) · Code execution · Workflow automation · Customer support (CRM) · Content generation/editing.

**6 building blocks:**
1. Function/Tool Schemas (name, description, params, output)
2. Function Execution Logic (planner/routing/conditional)
3. Message Handling (user ↔ LLM ↔ tool ↔ output)
4. Tool Integration Framework (kết nối tools)
5. Error Handling & Validation
6. State Management (context, history)

**Function Calling flow (Responses API `/openai/v1/`):**
```python
tools=[{"type":"function","name":"get_current_time","description":"Get time","parameters":{"type":"object","properties":{"location":{"type":"string"}},"required":["location"]}}]
messages=[{"role":"user","content":"Time in San Francisco?"}]
resp = client.responses.create(model=deployment, input=messages, tools=tools, tool_choice="auto", store=False)
messages += resp.output  # chứa function_call
# → LLM trả về: {"name":"get_current_time","arguments":{"location":"San Francisco"}}
# → bạn chạy hàm thật, rồi gửi kết quả lại cho LLM để ra câu trả lời cuối
```

**Trustworthy considerations:** Validate params, giới hạn quyền tool, log, human approval cho action nguy hiểm, test tool ngoài agent trước.

### 05 — Agentic RAG

**Khác RAG thường:** RAG thường = retrieve → read (1 lần). **Agentic RAG = vòng lặp LLM → tool → LLM → ...** cho tới khi đủ tốt. LLM tự quyết định refine query, đổi retrieval method, tích hợp nhiều tools (Azure AI Search, SQL, Bing Grounding).

**Vòng lặp maker-checker:**
1. User goal → LLM
2. LLM thấy thiếu info → chọn tool (vector search, SQL...)
3. Đánh giá kết quả → nếu chưa đủ → refine query / đổi tool
4. Lặp tới khi hài lòng → trả lời cuối
5. Memory & State giữ lịch sử để tránh lặp.

**Ví dụ product launch strategy:** tự quyết định: lấy market trend (Bing) → competitor data (AI Search) → sales metrics (SQL) → tổng hợp (Azure OpenAI) → tự đánh giá gap → retrieve tiếp nếu cần.

**Khi nào dùng:** Correctness-first (compliance, legal) · Complex DB (NL2SQL hay fail) · Extended workflows (thông tin mới xuất hiện liên tục).

**Governance:** Explainable reasoning (audit trail queries/sources), bias control (balanced retrieval), human oversight cho high-stakes. Dùng Azure AI Tracing/Content Safety.

### 06 — Building Trustworthy AI Agents

**System Message Framework (4 bước để scale):**
1. Meta system message (template cho LLM sinh system prompt): "You are expert at creating AI assistants..."
2. Basic prompt (role + tasks): "You are travel agent for Contoso..."
3. Đưa basic prompt qua meta prompt → ra system prompt chi tiết (Objective, Responsibilities, Tone, Interaction Instructions).
4. Iterate: chỉnh basic prompt, chạy lại, so sánh.

**Threats cần biết:**
- Task/Instruction manipulation (prompt injection)
- Access to Critical Systems (tool quyền cao)
- Resource/Service Overloading (DoS)
- Knowledge Base Poisoning (RAG bị đầu độc)
- Cascading Errors (lỗi lan chuỗi)

**Mitigations:** Least privilege cho tools, validate input/output, content safety, rate limiting, human-in-the-loop cho action nhạy cảm, audit logs, test adversarial.

**Human-in-the-Loop:** Agent đề xuất → pause → human approve/reject → resume. Bắt buộc cho refund, xóa account, v.v.

### 07 — Planning Design

**Goal rõ ràng là gốc:** "Generate 3-day itinerary" → cần refine thành flight+hotel+car+personalization.

**Task Decomposition:** Chia goal lớn thành subtasks nhỏ, mỗi subtask giao cho agent chuyên môn. Ví dụ: FlightBooking, HotelBooking, CarRental, ActivitiesBooking, DestinationInfo.

**Structured Output (quan trọng cho multi-agent):** Bắt LLM trả JSON theo schema (Pydantic) để downstream parse được:
```python
class TravelSubTask(BaseModel): task_details: str; assigned_agent: AgentEnum
class TravelPlan(BaseModel): main_task: str; subtasks: List[TravelSubTask]; is_greeting: bool
# system_prompt liệt kê available agents + yêu cầu JSON
response = client.create_response(input=user_msg, instructions=system_prompt)
plan = json.loads(response.output_text)  # → router điều phối
```

**Planning Agent + Multi-Agent Orchestration:** Semantic Router nhận request → planner sinh TravelPlan → dispatcher giao subtasks → downstream agents chạy → coordinator tổng hợp.

**Iterative Planning:** Đánh giá kết quả subtask, đo performance, iterate. Event-driven để handle unexpected inputs.

### 08 — Multi-Agent Design Pattern

**Khi nào dùng:** Large workloads (chia để parallel) · Complex tasks (mỗi agent chuyên 1 khía cạnh) · Diverse expertise (healthcare: diagnostics vs treatment vs monitoring).

**Ưu điểm vs single agent:** Specialization (không confused) · Scalability (thêm agent dễ hơn nhồi 1 agent) · Fault Tolerance (1 fail, còn lại chạy).

**6 Building Blocks:**
- Agent Communication (protocol, share preferences/constraints)
- Coordination Mechanisms (đảm bảo preferences/constraints thỏa)
- Agent Architecture (cách ra quyết định, học)
- Visibility (logging, monitoring, visualization, metrics)
- Multi-Agent Patterns (centralized/decentralized/hybrid)
- Human in the loop (khi nào hỏi người)

**Visibility:** Log mỗi action (agent, action, time, outcome) + graph flow + metrics (time, throughput, accuracy). Dashboard hiển thị status mỗi agent.

**3 Patterns chính:**
- **Group chat:** nhiều agent chat qua messaging protocol (centralized hoặc decentralized). Dùng cho team collaboration, support.
- **Hand-off:** agent bàn giao task theo rule. Dùng cho workflow, customer support.
- **Collaborative filtering:** nhiều expert cùng recommend (industry + technical + fundamental) → tổng hợp.

**Ví dụ Refund:** Tách thành agents chuyên cho refund process + general agents tái dùng.

### 09 — Metacognition (Thinking about Thinking)

**Định nghĩa:** Agent tự đánh giá và điều chỉnh hành vi dựa trên self-awareness và past experiences. Không chỉ sửa output, mà sửa *cách suy nghĩ*.

**Ví dụ:** "I prioritized cheaper flights because... I might be missing direct flights, let me re-check." → nhận ra over-rely vào preference cũ → đổi strategy.

**4 lợi ích:** Self-Reflection · Adaptability · Error Correction · Resource Management.

**Components của agent:** Persona (tính cách) + Tools (capabilities) + Skills (knowledge) = expertise unit.

**Travel Agent metacognitive loop:**
1. Gather preferences → 2. Retrieve (flights/hotels/attractions) → 3. Generate itinerary → 4. Adjust based on feedback (lưu experience_data, adjust_preferences) → 5. Present → 6. Collect feedback → 7. Final confirm → 8. Book → 9. Ongoing support.

**3 kỹ thuật chính trong lesson:**
1. **Planning in Agents:** Định nghĩa Current Task, Steps, Resources, Experience. 9 bước travel planning chi tiết (gather → retrieve → generate → present → feedback → adjust → confirm → book → support).
2. **Corrective RAG:** RAG tự sửa khi retrieval kém (rewrite query, đổi source).
3. **Generating Code as Tool:** Agent sinh code để giải task, rồi chạy code đó (ví dụ phân tích data).

**Code mẫu:**
```python
class Travel_Agent:
    def __init__(self): self.user_preferences={}; self.experience_data=[]
    def adjust_based_on_feedback(self, feedback):
        self.experience_data.append(feedback)
        self.user_preferences = adjust_preferences(self.user_preferences, feedback)
```

---

## Phần III: Production

### 10 — AI Agents in Production: Observability & Evaluation

**Traces & Spans:** Trace = 1 task trọn vẹn (user query), Span = 1 bước (LLM call, retrieval). Không observability = black box; có = glass box.

**Vì sao cần ở production:** Debugging/root-cause · Latency/Cost management · Trust/Safety/Compliance (audit trail, detect prompt injection/PII) · Continuous improvement loop.

**Metrics cốt lõi:** Latency (p50/p95) · Cost (per run, per token) · Request Errors (API/tool fail) · User Feedback (explicit 👍/⭐ + implicit rephrase/retry) · Accuracy (ground truth) · Automated eval (LLM-as-judge, RAGAS, LLM Guard).

**Instrument với OpenTelemetry (MAF native):**
```python
from agent_framework.observability import get_tracer, get_meter
tracer = get_tracer()
with tracer.start_as_current_span("agent_run"):
    pass  # agent execution auto-traced
# Manual với Langfuse:
from langfuse import get_client; langfuse = get_client(); span = langfuse.start_span(name="my-span"); span.end()
```

**Evaluation 2 loại:**
- **Offline:** test dataset có ground truth, chạy trong CI/CD, repeatable, cần update dataset liên tục. Dùng smoke test nhỏ + eval set lớn.
- **Online:** monitor live traffic, success rate, satisfaction, drift, A/B/shadow test. Khó lấy label, dựa vào feedback.
- **Loop:** evaluate offline → deploy → monitor online → collect failures → add to offline dataset → refine → repeat.

**Common Issues & Fix:**
- Not consistent → refine prompt, chia subtasks multi-agent
- Loops → clear termination condition, dùng model reasoning mạnh hơn
- Tool calls kém → test tool ngoài agent, refine params/naming
- Multi-agent inconsistent → refine prompts distinct, dùng routing/controller agent

**Managing Costs:** Dùng SLM cho task đơn giản · Router model (phân loại complexity) · Cache responses (câu hỏi lặp). Đánh giá để chứng minh SLM đủ tốt thay vì mặc định dùng model lớn.

### 16 — Deploying Scalable Agents (Foundry)

**Prototype vs Production (80% là ops quanh model):**

| Concern | Prototype | Production |
|---------|-----------|------------|
| Hosting | notebook | hosted service, versioned |
| Identity | az login token | managed identity, RBAC scoped |
| State | in-memory | externalized (thread store) |
| Failure | traceback | retries, fallbacks, alerts |
| Cost | few cents | tracked, routed, cached, budgeted |
| Quality | eyeball | auto-evaluated before release |
| Trust | you approve | policy + human-in-the-loop |

**3 Deployment Patterns:**
1. **Client-Hosted:** agent trong app process, bạn gọi model trực tiếp, tự lo scaling/state. Dùng khi cần control loop, custom middleware.
2. **Hosted Agents (Foundry Agent Service):** agent là resource trên Foundry, Foundry host loop, lưu threads, enforce safety/RBAC. App là thin client. Dùng khi cần durability/governance.
3. **Agent Workflows:** graph nhiều agents + tools + control flow (sequential, branching, approval nodes, durable checkpoints). Dùng cho task đa agent hoặc cần approval giữa chừng.

**Lifecycle (vòng lặp release):** Create → Version → Evaluate offline (gate) → Deploy hosted (nếu pass) → Observe online → Collect failures → Improve → Create ... + Retire old version. **Offline eval là gate, không phải afterthought.**

**Scaling (4 kỹ thuật):**
- Stateless handling: persist threads ngoài process → scale horizontal, không sticky session.
- Model routing: simple → SLM (gpt-5-nano), complex → LLM (gpt-5-mini). Foundry Model Router hoặc DIY classifier.
- Response caching: cache câu hỏi lặp ("reset password?") → không gọi model.
- Concurrency & backpressure: bound concurrency, retry exponential backoff, fail gracefully.

**Observability:** MAF emit OpenTelemetry → export tới Foundry hoặc OTel backend. Thêm attributes như `customer.tier`, `routed.model` để query.

**Cost levers:** Right-size model (chứng minh SLM pass gate) → Route by complexity → Cache aggressively.

**Enterprise:** Governance (RBAC, least privilege, audit) · Human-in-the-loop (approval-required tools) · MCP in production (coi MCP server là untrusted boundary: pin version, scoped identity, validate output, không lộ secret).

---

## Phần IV: Protocols / Context / Memory

### 11 — Agentic Protocols (MCP, A2A, NLWeb)

**MCP — Model Context Protocol (universal adaptor cho tools/data):**
- **Kiến trúc:** Host (app LLM như VSCode) → Client (1-1 connection) → Server (lightweight, expose capabilities).
- **3 primitives:** Tools (actions, có schema) · Resources (read-only data: file, DB record) · Prompts (templates cho workflow phức tạp).
- **Lợi ích:** Dynamic Tool Discovery (không hardcode API) · Interop cross-LLM · Standardized Security (auth thống nhất).
- **Flow ví dụ book flight:** Client connect airline MCP server → discovery ("search flights", "book flights") → user "search Portland→Honolulu" → LLM chọn tool + params → server gọi internal API → trả JSON → assistant present → user chọn → gọi "book flight".

**A2A — Agent-to-Agent (agent nói chuyện với agent khác org/stack):**
- **Components:** Agent Card (name, description, skills, endpoint, version, capabilities) · Agent Executor (pass chat context, dùng LLM riêng để parse + dùng tools) · Artifact (kết quả + description + context, xong thì close connection) · Event Queue (handle updates, tránh close sớm khi task lâu).
- **Lợi ích:** Enhanced Collaboration cross-vendor · Model Selection Flexibility (mỗi agent chọn LLM riêng) · Built-in Auth.
- **Flow travel:** User → Travel Agent (A2A client) → reason cần Airline/Hotel/Car agents → A2A connect từng specialized agent → mỗi agent chạy LLM+tools (có thể là MCP servers) → Travel Agent tổng hợp → trả user.

**NLWeb — Natural Language Web (đưa NL interface lên mọi website):**
- **Components:** NLWeb App (core service xử lý NL) · NLWeb Protocol (rules, trả JSON Schema.org) · MCP Server endpoint (mỗi NLWeb cũng là MCP server, expose "ask") · Embedding Models (vector hóa content) · Vector DB (Qdrant, Snowflake, Milvus, Azure AI Search, Elasticsearch).
- **Ý tưởng:** Như HTML cho documents, NLWeb là foundation cho AI Web — website nào cũng query được bằng tự nhiên, và agent discover được.

### 12 — Context Engineering

**Khác Prompt Engineering:** Prompt = static instructions 1 lần. Context Engineering = quản lý *dynamic* info trong context window qua thời gian (add/remove/condense) để agent luôn có đúng info cho bước tiếp theo. Cần repeatable, reliable.

**5 loại context:** Instructions (rules, system message, few-shot, tool descriptions) · Knowledge (facts, DB, long-term memory, RAG) · Tools (definitions + feedback) · Conversation History (càng dài càng tốn window) · User Preferences (học theo thời gian).

**Planning Strategies:**
1. Define Clear Results: "Thế giới sẽ thế nào khi agent xong?"
2. Map the Context: "Agent cần info gì? Ở đâu?"
3. Create Context Pipelines: "Lấy bằng cách nào? RAG, MCP, tools?"

**Practical Strategies (quản lý context):**
1. **Agent Scratchpad:** ghi chú ngoài context window (file/runtime object) cho session hiện tại.
2. **Memories:** lưu cross-session (summaries, preferences).
3. **Compressing Context:** summarize/trim khi gần đầy window.
4. **Multi-Agent Systems:** mỗi agent có window riêng, share có kế hoạch.
5. **Sandbox Environments:** chạy code/xử lý doc lớn ngoài window, chỉ đọc kết quả.
6. **Runtime State Objects:** container cho subtask results, giữ context gọn theo subtask.

**Inspecting Context (debug):** Không cần log raw prompt, chỉ cần small records: counts, ids, hashes, policy labels. Hỏi: "Did agent load too much/wrong/missing context?" Track Selection (candidates vs selected, rule/score), Compression (range, token before/after), Isolation (subtask, bounded summary), Memory/RAG (doc ids, scores), Safety (hashes, redaction).

**Ví dụ "Book me a trip to Paris":** Prompt-only → "When to go?" Context-aware → check calendar + recall preferences (airline, budget, direct) + identify tools → "Hey [Name]! Free first week Oct, shall I look for direct flights on [Preferred Airline] within [Budget]?"

**Common Failures:**
- **Poisoning:** hallucination lọt vào context và bị reference lặp → pursue impossible goal. Fix: validation + quarantine (validate flight tồn tại qua API trước khi add vào context).
- **Distraction:** context quá lớn → model focus vào history thay vì training, lặp vô ích. Fix: summarization (condense recent relevant).
- **Confusion:** nhiều instructions mâu thuẫn → model không biết theo cái nào. Fix: isolate context per subtask, clear priority.
- **Clash:** context mới mâu thuẫn memory cũ. Fix: versioning, conflict resolution.

### 13 — Agent Memory

**Vì sao cần:** Không memory = stateless, mỗi lần chat lại từ đầu → frustrating. Memory cho phép Reflective, Interactive, Proactive/Reactive, Autonomous → reliable & capable.

**Các loại memory:**
- **Working Memory:** scratch paper cho task hiện tại, giữ key elements (requirements, decisions) dù history dài.
- **Short-Term Memory:** context của 1 conversation/session. Trong MAF: `AgentSession` via `agent.create_session()`, mất khi session end/restart.
- **Long-Term Memory:** persist cross-session (preferences, history). Ví dụ: "Ben likes coffee with mountain view, avoid advanced slopes due to injury".
- **Persona Memory:** giữ personality/role consistent (expert ski planner).
- **Workflow/Episodic Memory:** sequence steps của task phức tạp, gồm success/failure để học.
- **Entity Memory:** extract entities (people, places, events) → structured understanding.
- **Structured RAG:** extract dense structured info từ conversations/emails/images → precision/recall cao hơn chunking thường.

**Implementations:**
- **Mem0:** persistent memory layer, 2-phase pipeline: extraction (LLM summarize history → new memories) + update (add/modify/delete) → hybrid store (vector+graph+KV), hỗ trợ graph memory.
- **Cognee:** semantic memory → knowledge graph + embeddings, dual-store (vector + graph), hybrid retrieval (vector+graph+LLM), living memory, visualize graph. Notebook `13-agent-memory-cognee.ipynb`.
- **Azure AI Search:** backend cho structured RAG, superhuman precision/recall, lưu user travel memories, product catalogs.

**Self-Improving pattern (knowledge agent):**
1. Observe main conversation → 2. Identify valuable info → 3. Extract/summarize → 4. Store in vector DB → 5. Augment future queries (retrieve + append to prompt, như RAG).

**Optimizations:** Latency (dùng model rẻ/fast để check có nên store/retrieve không) · Cold storage cho ít dùng.

---

## Phần V: Framework / Browser / Local

### 14 — Microsoft Agent Framework (MAF)

**MAF là gì:** Unified framework của Microsoft cho mọi agentic use case: sequential, concurrent, group chat, handoff, magnetic (manager tạo/sửa task list, điều phối subagents). Thêm production features: Observability (OpenTelemetry), Security (Foundry RBAC, private data, content safety), Durability (pause/resume/recover), Control (human-in-the-loop).

**Interop:** Cloud-agnostic (container, on-prem, multi-cloud) · Provider-agnostic (Azure OpenAI, OpenAI Responses/ChatCompletion, MiniMax, A2A remote) · Open Standards (A2A, MCP) · Plugins/Connectors (Fabric, SharePoint, Pinecone, Qdrant).

**Key Concepts:**

**Agents — tạo & chạy:**
```python
agent = AzureOpenAIChatClient(credential=...).create_agent(instructions="...", name="TripRecommender")
# hoặc Foundry, OpenAI, MiniMax, A2A
agent = A2AAgent(name=card.name, description=..., agent_card=card, url="https://...")
result = await agent.run("Where to visit in Amsterdam?")
async for update in agent.run_stream("..."):
    print(update.text, end="")
# options: max_tokens, tools, model per run
```

**Tools:** định nghĩa khi tạo agent hoặc khi run:
```python
def get_attractions(location: Annotated[str, Field(description="...")]) -> str: return f"Top for {location}"
agent = ChatAgent(chat_client=OpenAIChatClient(), instructions="...", tools=[get_attractions])
await agent.run("Best in Seattle?", tools=[get_attractions])
```

**Agent Threads (multi-turn):**
```python
thread = agent.get_new_thread()
response = await agent.run("Hello", thread=thread)
serialized = await thread.serialize()  # lưu
resumed = await agent.deserialize_thread(serialized)  # khôi phục
```

**Middleware:**
- Function Middleware: chạy giữa agent và tool call (logging, validation)
```python
async def logging_function_middleware(context, next):
    print(f"Calling {context.function.name}")
    await next(context)
    print(f"{context.function.name} completed")
```
- Chat Middleware: giữa agent và LLM requests.

**Workflows:** Orchestration graph với explicit control flow, durable checkpoints, human approval nodes. Hỗ trợ `HandoffBuilder`, `WorkflowBuilder`, `ctx.request_info` + `@response_handler`.

### 15 — Browser-Use (Computer Use Agents — CUA)

**Khi nào dùng CUA:** Khi task phụ thuộc vào *what is visible in UI*, site không có API, hoặc layout thay đổi thường xuyên → API/selector cứng sẽ brittle. Nếu có stable API → ưu tiên API (nhanh, dễ test, dễ secure).

**Stack:** Browser-Use (AI navigation) + Playwright + Chrome DevTools Protocol (CDP) + Azure OpenAI (vision) + Pydantic (structured extraction).

**Architecture (hybrid):**
1. Chrome start với CDP → Playwright + Browser-Use share session.
2. Browser-Use agent handle open-ended navigation (mở Airbnb, dismiss pop-ups, search Stockholm).
3. Inspect page với Pydantic schema → extract titles, prices, ratings, URLs.
4. Python logic so sánh → highlight cheapest.

**Agent vs Actor:**

| Scenario | Agent | Actor |
|----------|-------|-------|
| Dynamic layouts | Yes (adapt) | No (brittle) |
| Known structure | No (slower) | Yes (fast, precise) |
| Finding elements | Yes (NL) | No (exact selector) |
| Timing control | No | Yes |
| Complex workflows | Yes | No |

**Best Practices:** Start agent cho exploration → switch to direct control khi predictable → structured output → delays sau UI changes → screenshots để debug → expect site changes, fallback cho pop-ups → blend agent+actor.

**Safety Guardrails (bắt buộc trước khi production):**
1. Scope browsing env (dedicated profile/sandbox, limit domains)
2. Separate observation vs action (search/read trước, approval trước khi submit/book/purchase/delete)
3. Keep secrets out of prompts/traces (không để password/payment/cookies)
4. Treat page content as untrusted (ignore instructions từ page bảo đổi goal/reveal data)
5. Deterministic checks trước risky steps (verify URL, price, recipient)
6. Budgets & stop conditions (bound actions/retries/tabs/minutes)
7. Record evidence (action summaries, timestamps, URLs, element descriptions, screenshot refs) — không lưu sensitive content.

**Real-World:** Travel booking, price monitoring, e-commerce comparison, UI testing, monitoring, form filling. **Project Opal (Frontier)** là ví dụ enterprise CUA trên Windows 365 Cloud PC, async, human Take Control/Return Control, Skills tái dùng.

### 17 — Creating Local AI Agents (Foundry Local + Qwen)

**Vì sao local:** Privacy (data không rời máy) · Cost (không per-token) · Offline (plane, secure facility, outage). Đánh đổi: SLM vài B params vs frontier hàng trăm B → yếu hơn ở reasoning multi-hop và world knowledge.

**Chiến lược thắng:** *Let SLM orchestrate, tools do heavy lifting.* SLM không cần biết codebase, chỉ cần biết khi nào gọi `read_file`/`search_docs`.

**Foundry Local:** Runtime download/serve models on-device, expose **OpenAI-compatible HTTP endpoint** (`http://localhost:PORT/v1`). Tự chọn build tối ưu cho CPU/CUDA/NPU. Code agent giữ nguyên, chỉ đổi `base_url`.

**Setup:**
```bash
winget install Microsoft.FoundryLocal  # Windows
foundry model run qwen2.5-7b-instruct
foundry service status
```
```python
from foundry_local import FoundryLocalManager
from openai import OpenAI
manager = FoundryLocalManager("qwen2.5-7b-instruct")
client = OpenAI(base_url=manager.endpoint, api_key=manager.api_key)
```

**Qwen Function Calling:** Nhiều SLM chat được nhưng tool calls unreliable. Qwen được train cho function calling → emit well-formed tool calls → biến local chat thành local *agent*.

**Local RAG (Chroma):** Embed docs → local vectors → local retrieval → local SLM. Pipeline: docs → local embedding → Chroma (on-disk) → query embed → top-k → Qwen → grounded answer. Same Agentic RAG pattern, chỉ là mọi thứ local.

**Local MCP Servers:** MCP là transport, không phải cloud. Chạy MCP server local qua `stdio`, expose tools (filesystem, git, DB) offline. Scope permissions (project dir, không phải home).

**Hybrid Patterns:**

| Situation | Where |
|-----------|-------|
| Sensitive/offline | Local SLM |
| Simple bounded | Local SLM |
| Hard multi-hop, non-sensitive | Cloud model |
| Outage | Local (graceful degradation) |

Giống model routing ở Lesson 16, nhưng một "model" là máy bạn.

**Lab:** Build local engineering assistant: tool calling + file ops (list/read sandboxed) + code analysis + local RAG (Chroma) + MCP (graceful skip nếu không có).

---

## Phần VI: Security

### 18 — Securing AI Agents with Cryptographic Receipts

**Problem:** Agent xử lý 50k bookings, auditor hỏi "How do I know logs were not edited?" Logs thường (app logs, cloud logging, DB logs) đều cần trust vào someone. Với regulated workloads (finance, healthcare, EU AI Act) thì không đủ.

**Receipt là gì:** JSON object ghi lại agent đã làm gì, được **ký Ed25519**, có thể verify offline chỉ bằng public key.

**Flow:**
```
Agent tool call → Build payload → Canonicalize JSON (JCS RFC 8785) → Ed25519 sign → Receipt with signature → Auditor verifies offline → valid? → tamper-evident proof : rejected
```

**Receipt mẫu:**
```json
{
  "type": "agent.tool_call.v1",
  "agent_id": "contoso-travel-bot",
  "tool_name": "lookup_flights",
  "tool_args_hash": "sha256:a3f9c1...",
  "result_hash": "sha256:7b2e1d...",
  "policy_id": "contoso-travel-policy-v3",
  "timestamp": "2026-04-25T14:30:00Z",
  "sequence": 47,
  "previous_receipt_hash": "sha256:9d4e6a...",
  "signature": {"alg": "EdDSA", "sig": "c5af83...", "public_key": "8f3b2c..."}
}
```

**3 properties:**
1. **Signature:** Ed25519 private key ký, public key verify offline. Sửa 1 field → signature invalid.
2. **Canonical encoding:** JCS (RFC 8785) đảm bảo byte-identical dù serializer khác nhau. Không canonical → signature khác nhau cho cùng content.
3. **Hash chaining:** `previous_receipt_hash` link receipt trước → xóa/reorder 1 receipt → break mọi receipt sau.

**Guarantees:** Attribution (key này ký content này) · Integrity (không đổi từ khi ký) · Ordering (receipt này sau receipt kia).

**Produce (Python, ~30 dòng):**
```python
import hashlib, base64, json
from nacl import signing
from jcs import canonicalize
def b64url_nopad(d: bytes) -> str: return base64.urlsafe_b64encode(d).decode().rstrip("=")
def sha256_canonical(obj) -> str: return f"sha256:{hashlib.sha256(canonicalize(obj)).hexdigest()}"
signing_key = signing.SigningKey.generate(); verify_key = signing_key.verify_key
payload = {"type":"agent.tool_call.v1","agent_id":"contoso-travel-bot","tool_name":"lookup_flights",
           "tool_args_hash":sha256_canonical({"origin":"SYD","destination":"LAX"}),
           "result_hash":sha256_canonical([{"flight":"QF11","price":1850}]),
           "policy_id":"contoso-travel-policy-v3","timestamp":"2026-04-25T14:30:00Z","sequence":0,"previous_receipt_hash":None}
canonical_bytes = canonicalize(payload)
sig = signing_key.sign(canonical_bytes).signature
receipt = {**payload, "signature":{"alg":"EdDSA","sig":b64url_nopad(sig),"public_key":b64url_nopad(bytes(verify_key))}}
```

**Verify:**
```python
import base64
from nacl import signing
from nacl.exceptions import BadSignatureError
from jcs import canonicalize
def b64url_decode(s: str) -> bytes: return base64.urlsafe_b64decode(s + "=" * ((4 - len(s)%4)%4))
def verify_receipt(receipt: dict) -> bool:
    sig_obj = receipt.get("signature")
    if not sig_obj or sig_obj.get("alg") != "EdDSA": return False
    payload = {k:v for k,v in receipt.items() if k != "signature"}
    try:
        vk = signing.VerifyKey(b64url_decode(sig_obj["public_key"]))
        vk.verify(canonicalize(payload), b64url_decode(sig_obj["sig"]))
        return True
    except BadSignatureError: return False
# Sửa 1 byte tool_args_hash → verify fail → tamper-evident
```

**Chaining:** Mỗi receipt chứa hash của receipt trước → tạo chain. Auditor verify từng signature + check chain continuity.

**What receipts prove vs not:**
- Prove: attribution, integrity, ordering.
- Not prove: correctness of action, soundness of policy (agent có thể ký 1 action sai nhưng receipt vẫn valid — receipt chỉ chứng minh *đã làm*, không chứng minh *làm đúng*).

---

## Checklist & Decision Tree

### Khi nào dùng gì?

```
User request
  ├─ Đơn giản 1 bước, có API ổn định? → Function call thường, không cần agent
  ├─ Cần reasoning + tools qua nhiều bước? → Agent (Tool Use + Planning)
  ├─ Cần search knowledge base + tự sửa query? → Agentic RAG
  ├─ Task lớn/phức tạp/cần expertise khác nhau? → Multi-Agent (group chat / hand-off)
  ├─ Cần tự cải thiện theo feedback? → Metacognition + Memory
  ├─ Cần quan sát/eval trước khi ship? → Observability (OTel) + Offline/Online eval
  ├─ Cần kết nối tools/agents/websites chuẩn hóa? → MCP / A2A / NLWeb
  ├─ Context window đầy/loạn? → Context Engineering (scratchpad, compress, isolate)
  ├─ Cần nhớ cross-session? → Memory (Mem0/Cognee/Azure AI Search)
  ├─ Deploy production? → Foundry Hosted vs Client-Hosted vs Workflow + Routing/Caching
  ├─ Cần browser automation? → Browser-Use hybrid (agent cho dynamic, actor cho precise)
  ├─ Cần privacy/offline/cost 0? → Local SLM (Qwen + Foundry Local + Chroma)
  └─ Cần audit không thể sửa? → Cryptographic Receipts (Ed25519 + JCS + chain)
```

### Checklist trước khi ship agent

- [ ] System prompt có framework (meta → basic → iterate) và đã test adversarial?
- [ ] Tools có schema rõ, least privilege, validation, human approval cho risky actions?
- [ ] Planning có structured output (Pydantic) và termination condition?
- [ ] Multi-agent có logging/visualization/metrics và pattern rõ (group chat/hand-off)?
- [ ] Observability: OTel traces, metrics (latency/cost/errors/feedback/accuracy), dashboard?
- [ ] Evaluation: offline dataset + online monitoring + loop feed failures back?
- [ ] Context: scratchpad/memory/compression/sandbox đã thiết kế, có inspect records?
- [ ] Memory: working/short/long đã phân biệt, có knowledge agent và cold storage?
- [ ] Protocols: MCP pin version, A2A auth, NLWeb embeddings đã chọn?
- [ ] Deployment: stateless, routing, caching, concurrency, RBAC, human-in-the-loop?
- [ ] Browser: scoped env, observation vs action, secrets out, untrusted content handling?
- [ ] Local: SLM trade-offs đã đánh giá, hybrid fallback đã có?
- [ ] Security: receipts ký + verify + chain, auditor chỉ cần public key?

---

## Glossary

- **Agent:** System cho LLM làm việc qua tools/knowledge/memory.
- **MAF:** Microsoft Agent Framework — SDK unified cho agents.
- **Foundry Agent Service:** Managed service host agent, threads, safety, RBAC.
- **Tool Use:** Pattern cho LLM gọi function qua schema.
- **Agentic RAG:** Vòng lặp LLM tự plan/retrieve/refine tới khi đủ tốt.
- **Planning:** Chia goal thành subtasks, dùng structured output.
- **Multi-Agent:** Nhiều agent chuyên môn phối hợp.
- **Metacognition:** Agent tự soi cách suy nghĩ để tự sửa.
- **Observability:** Traces/spans/metrics để thấy agent đang làm gì.
- **MCP:** Model Context Protocol — chuẩn kết nối tools/data.
- **A2A:** Agent-to-Agent — chuẩn agent nói chuyện với agent.
- **NLWeb:** Natural Language Web — NL interface cho mọi website.
- **Context Engineering:** Quản lý dynamic context trong window.
- **Memory:** Working/Short/Long/Persona/Episodic/Entity/Structured RAG.
- **CUA:** Computer Use Agent — agent điều khiển browser như người.
- **SLM:** Small Language Model — model nhỏ chạy local.
- **Receipt:** JSON ký Ed25519 + JCS + hash chain để audit tamper-evident.

---

## Nguồn & License

- **Gốc:** https://github.com/microsoft/ai-agents-for-beginners — 18 lessons, mỗi lesson có README + notebooks + video. Đã loại bỏ `translations/` và `translated_images/` khi clone (sparse checkout).
- **License gốc:** MIT (xem `LICENSE` trong repo). File distilled này là **derivative tóm tắt**, giữ nguyên attribution, không thay đổi license gốc. Dùng cho học tập/RAG nội bộ.
- **Cập nhật:** Model references đã migrate từ `gpt-4.1-mini` → `gpt-5-mini` (và `gpt-5-nano` cho routing) theo CHANGELOG mới nhất.
- **Gợi ý RAG:** Search keywords ở bảng Bản đồ để nhảy đúng lesson. Mỗi `##`/`###` là 1 chunk (~600 tokens). Overlap 100 tokens khi ingest.

> **Tip Library:** Sau khi nhét file này vào Library, thử search: `tool use function calling`, `agentic rag maker checker`, `mcp a2a nlweb`, `context poisoning`, `mem0 cognee`, `foundry local qwen`, `ed25519 receipt chain` — sẽ ra ngay chunk liên quan với citation `AI-Agents-for-Beginners-Distilled.md · chunk # · score`.

---

*— Distilled by YUNIE (Your Unified Navigator for Intelligent Execution) · 2026-08-31 · Process > Model · Hiểu hệ thống. Làm thay bạn. Trực 24/7.*
