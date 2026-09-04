# Harness 2.1 — Upgrade Plan (Agentic Patterns)

> **Version:** 2.1-draft · **Ngày:** 2026-09-04 · **Tác giả:** YUNIE (Your Unified Navigator for Intelligent Execution)
> **Nguồn chính:** `AI-Agents-for-Beginners-Distilled.md` (microsoft/ai-agents-for-beginners, MIT, 2026-08-31) — 18 lessons + 00 setup (~320k chars → ~35k chars distilled, 25 chunks, BM25 <100ms) — đã import vào `www/library/export.json` (`id: ai-agents-for-beginners-distilled-md-mtlr9anf-qfnt`, 25 chunks, enabled ✅)
> **Baseline:** Harness v2 (`.github/copilot-instructions.md`, `docs/harness-flow.md`, `docs/capabilities.md`, `docs/knowleged.md` 13 KNs)
> **Trạng thái:** Draft — chưa implement, chờ duyệt roadmap P0/P1/P2

---

## Mục lục

1. [Tổng quan](#1-tổng-quan)
2. [Baseline Harness 2.0 — đã có gì](#2-baseline-harness-20--đã-có-gì)
3. [Gap Analysis — 18 Lessons vs Harness 2.0](#3-gap-analysis--18-lessons-vs-harness-20)
4. [Vision Harness 2.1](#4-vision-harness-21)
5. [6 Trụ cột nâng cấp (chi tiết)](#5-6-trụ-cột-nâng-cấp-chi-tiết)
6. [Roadmap P0/P1/P2](#6-roadmap-p0p1p2)
7. [File Changes (dự kiến)](#7-file-changes-dự-kiến)
8. [Rủi ro & Mitigations](#8-rủi-ro--mitigations)
9. [Verification Checklist](#9-verification-checklist)
10. [Tham chiếu & Citations](#10-tham-chiếu--citations)

---

## 1. Tổng quan

Harness v2 hiện là **harness cho human** — pipeline 8 phase `Idea → Explore → Clarify → PRD → Design → Plan → Implement → Polish → Verify` (model-agnostic, todo-driven, product-quality). Chất lượng đến từ **process**, không phụ thuộc model.

`AI-Agents-for-Beginners-Distilled` định nghĩa **agent = LLM + tools + knowledge + memory để *làm việc*, không chỉ trả lời** (Lesson 01). Harness 2.1 nâng Harness v2 từ **quy trình cho người** lên **hệ thống agentic tự làm việc** — giữ nguyên pipeline, bổ sung 6 patterns cốt lõi (Tool Use, Agentic RAG, Planning, Multi-Agent, Metacognition, Protocols/Context/Memory/Security) + production (observability, deploy, scaling).

> Theo `AI-Agents-for-Beginners-Distilled.md` (chunk #00, page 1, score 6.144):
> > "18 lessons + 00 setup (~320k chars) → bản này ~35k chars, tập trung, RAG-ready"

**Nguyên tắc 2.1:**
- **Không phá pipeline cũ** — 8 phase + `/fixbug` bounded loop giữ nguyên, chỉ thêm seam/plugin.
- **Everything is a Plugin** (Cordis) — mỗi trụ cột là 1 plugin mount bên cạnh, patch bằng `cordis.patch.yml` / `registry.json`.
- **Reuse-first, native-first** (minimal-ladder) — dùng stdlib/Web API/dependency đã cài trước khi thêm mới.
- **Verify bằng evidence** — không nói suông, đo bằng `get_errors` + `search_library` + Playwright/`--angle` + `audit verify`.

---

## 2. Baseline Harness 2.0 — đã có gì

| Nhóm | Đã có (Harness 2.0) | File/Tool |
|------|---------------------|-----------|
| **Pipeline** | 8 phase bắt buộc + rút gọn cho task nhỏ (không bỏ Polish) | `copilot-instructions.md`, `harness-flow.md` |
| **Fixbug** | Bounded repair loop 6+1 phases, gates (Reproduce/Root Cause/Confidence/Fresh-eyes) | `fixbug.prompt.md`, `harness-workflow.instructions.md` |
| **Registry** | `registry.json` v2 source of truth, `harness-manager.mjs` (list/status/enable/disable/install/create/preset/sync), presets `full/web-product/api-minimal` | `.github/harness/` |
| **Skills** | 10 skills: `claude-harness`, `custom-registry`, `skill-registry`, `glass-rainbow-effects`, `ui-design-system`, `ui-ux-pro-max`, `tdd-gate`, `systematic-debugging`, `auto-researcher` (AAR), `last30days` | `.github/skills/` |
| **Instructions** | 7 rules: `harness-workflow`, `product-quality`, `skill-usage`, `custom-registry`, `knowleged`, `plugin-seam`, `locale-i18n` | `.github/instructions/` |
| **Agents** | 7 agents: Explore, Plan, Designer, Implement, Polish, Verify, YUNIE (user-invocable) | `.github/agents/` |
| **Prompts** | 6 prompts: harness, product, plan, implement, polish, verify | `.github/prompts/` |
| **Governance** | `policy.json` (7 deny + 2 allow), `audit.jsonl` hash-chain SHA-256/16, `credentials.enc.json` AES-256-GCM, `policy-check.mjs`/`audit.mjs`/`credentials.mjs` | `.agent/` |
| **Knowledge** | `knowleged.md` 13 KNs + `auto-learn.mjs` (suggest/log/propose/status, BM25-lite) + `learn` agent + hooks | `docs/knowleged.md`, `.github/harness/scripts/` |
| **Library RAG** | `www/library/mcp-server.mjs` (4 tools: `search_library`, `list_books`, `get_book`, `get_status`), BM25 <100ms, `export.json` (gitignore) | `www/library/` |
| **STATUS** | `www/` là root GitHub Pages, `status.json` generate từ `registry.json`, workflow `pages.yml` | `www/`, `.github/workflows/` |
| **Quality** | Design system (palette 3-5, typography, spacing 4/8, radius, shadow), responsive 375/768/1280, states, animation 150-300ms, a11y ≥4.5:1 | `product-quality.instructions.md` |

**Điểm mạnh 2.0:** Process chặt, governance fail-closed, RAG local 0đ, YUNIE trực 24/7, polish bắt buộc.

**Điểm yếu 2.0 (so với 18 lessons):** Chưa phải **agent tự làm việc** — thiếu Tool Use schema/approval, RAG 1-shot, planning không structured, multi-agent tuần tự, chưa có traces/eval, MCP mới cho library, memory chỉ có `knowleged.md`, chưa có CUA/local SLM, receipt chưa ký Ed25519.

---

## 3. Gap Analysis — 18 Lessons vs Harness 2.0

| # | Lesson | 1 câu cốt lõi (từ sách) | Harness 2.0 | Gap | Mức độ |
|---|--------|--------------------------|-------------|-----|--------|
| 00 | Course Setup | Chạy code bằng MAF + Foundry Agent Service V2, `gpt-5-mini` | Chưa dùng MAF/Foundry, chạy local Node | Thiếu stack MAF/Foundry, chưa có `.env` chuẩn | P2 |
| 01 | Intro to AI Agents | Agent = LLM + tools + knowledge + memory; 3 thành phần Environment/Sensor/Actuator; 7 loại agent | Có 6 subagents pipeline, chưa phân loại 7 loại | Thiếu taxonomy 7 loại + khi nào dùng agent (open-ended/multi-step) | P1 |
| 02 | Agentic Frameworks | Framework cho sẵn components để prototype nhanh; MAF vs Foundry | Có registry/plugin-seam, chưa có MAF SDK | Chưa có abstraction `ChatAgent`/`Threads`/`Middleware` | P2 |
| 03 | Design Principles | Space/Time/Core + Transparency/Control/Consistency (HAX Toolkit) | Có `product-quality` + `yunie-personality` human-centric | Thiếu checklist Space/Time/Core explicit trong Design phase | P1 |
| 04 | Tool Use | Cho LLM gọi function qua schema → mở rộng khả năng; 6 building blocks | `harness-manager` gọi tool tay, chưa có LLM function calling | **Thiếu schema validation, approval_mode, error handling, state management** | **P0** |
| 05 | Agentic RAG | LLM tự lập kế hoạch, gọi tool, tự sửa query tới khi đủ tốt (maker-checker loop) | `search_library` 1-shot BM25, chưa loop | **Thiếu iterative retrieval + gap evaluation + refine query** | **P0** |
| 06 | Trustworthy Agents | System message framework 4 bước + threat model + human-in-the-loop | Có `policy.json` deny, chưa có system message framework | Thiếu meta system message + threat mitigations (poisoning, injection) | P1 |
| 07 | Planning Design | Chia goal lớn thành subtasks, structured output (Pydantic) + event-driven | Plan là markdown, chưa có JSON schema | **Thiếu `TravelPlan {subtasks: [{task_details, assigned_agent}]}` + router** | **P0** |
| 08 | Multi-Agent | Nhiều agent chuyên môn phối hợp (group chat, hand-off, collaborative filtering) | Agents chạy tuần tự, chưa chat với nhau | **Thiếu group chat/hand-off thực sự + visibility dashboard** | P1 |
| 09 | Metacognition | Agent tự soi lại cách suy nghĩ để tự sửa | Chưa có self-reflection loop | Thiếu `experience_data` + `adjust_preferences` + corrective RAG | P1 |
| 10 | Production | Traces/spans, metrics, offline/online eval, OpenTelemetry | Có `audit.jsonl` + `get_errors`, chưa có traces | **Thiếu OpenTelemetry traces/spans + LLM-as-judge eval** | P1 |
| 11 | Protocols | MCP (tool), A2A (agent-agent), NLWeb (web) | Có MCP cho library (4 tools), chưa có A2A/NLWeb | Thiếu A2A Agent Card + NLWeb embeddings + MCP pin version/auth | P1 |
| 12 | Context Engineering | Quản lý context window động: write/select/compress/isolate; failures: poisoning/distraction/confusion/clash | Chưa có context pipeline | Thiếu scratchpad/compress/isolate + chống poisoning | P1 |
| 13 | Memory | Biến stateless thành stateful: working/short/long/persona/episodic; Mem0/Cognee/Azure AI Search | Chỉ có `knowleged.md` + `.agent/bugs/` | Thiếu memory phân tầng + Mem0/Cognee + structured RAG | P1 |
| 14 | MAF | Unified framework: sequential/concurrent/group-chat/handoff/magnetic + workflows | Chưa có MAF | Thiếu `ChatAgent`/`Threads`/`Middleware`/`Workflows` | P2 |
| 15 | Browser-Use (CUA) | Agent điều khiển browser như người: vision + Playwright + CDP; hybrid agent vs actor | Chưa có CUA | Thiếu Browser-Use + safety guardrails (scope, secrets, budgets) | P2 |
| 16 | Deploying Scalable | Hosting, lifecycle, routing, caching, concurrency, RBAC | `www/` static Pages, chưa có routing/caching | Thiếu model router (SLM vs LLM) + caching + concurrency | P1 |
| 17 | Local Agents | Chạy SLM (Qwen) on-device qua Foundry Local, hybrid fallback | Chưa có local SLM | Thiếu Foundry Local + Chroma RAG + local MCP | P2 |
| 18 | Securing Agents | Receipt ký Ed25519 + JCS + hash chain để audit không thể sửa | Có `audit.jsonl` SHA-256/16 hash-chain, chưa ký | **Thiếu Ed25519 + JCS canonical JSON + verify bằng public key** | **P0** |

> Theo `AI-Agents-for-Beginners-Distilled.md` (chunk #01, page 2, score 12.393):
> > "Agent = LLM + tools + knowledge + memory để *làm việc*, không chỉ trả lời | Environment/Sensor/Actuator, 7 loại agent"

---

## 4. Vision Harness 2.1

**Slogan:** *Process > Model, nhưng Agent tự làm việc.*

Harness 2.1 giữ nguyên **8 phase + /fixbug loop + governance + YUNIE**, bổ sung **6 trụ cột agentic** như plugin — mỗi trụ cột có Service Definition / Provider / Consumer (plugin-seam), `ctx.effect` + patch layer, event đúng domain.

```
Harness 2.0 (human-driven)  →  Harness 2.1 (agentic, vẫn human-in-the-loop)
Idea → Explore → Clarify → PRD → Design → Plan → Implement → Polish → Verify
         ↑         ↑        ↑      ↑       ↑        ↑         ↑       ↑
       RAG-loop  Context  Memory  Tool   Router  Multi-Agent  CUA   Traces
       (05)      (12)     (13)    (04)   (07)    (08+09)     (15)  (10+18)
```

**Persistence · F5 · Scope (cho www/):** Mọi trụ cột liên quan `www/` phải ghi rõ `Persistence: <localStorage key | repo path | API> · F5: <giữ/mất> · Scope: <per-browser/global>` ngay từ PRD (KN-002).

---

## 5. 6 Trụ cột nâng cấp (chi tiết)

### 5.1 Trụ cột 1 — Agentic RAG Loop (Lesson 05) — P0

**Vấn đề hiện tại:** `search_library({query, top_k:5})` chỉ 1-shot. Nếu query kém hoặc thiếu context, trả về 0 hits hoặc hits kém → LLM bịa hoặc bỏ qua. Không có vòng lặp tự sửa.

**Mục tiêu 2.1:** LLM tự đánh giá gap → refine query → retrieve tiếp tới khi đủ tốt (maker-checker), như Lesson 05.

> Theo `AI-Agents-for-Beginners-Distilled.md` (chunk #07, page 8, score 0.996):
> > "Agentic RAG = vòng lặp LLM → tool → LLM → ... cho tới khi đủ tốt. LLM tự quyết định refine query, đổi retrieval method"

**Thiết kế:**
- **Service:** `RagService` — `search(query) → {hits, gap, nextQuery?}`
- **Loop:** `maker (LLM) → checker (gap evaluator) → refine → retrieve` (max 3 vòng, tránh loop vô hạn — như `systematic-debugging` 3-fix limit).
- **Gap evaluator:** LLM-as-judge hoặc heuristic (score < threshold, hits < 2, hoặc LLM tự nói "thiếu").
- **Tích hợp:** `Explore` phase + `auto-researcher` skill (đã có propose 3 methods → benchmark → keep best) + `auto-learn suggest`.
- **Governance:** Mỗi vòng ghi `audit.jsonl` (tool: `search_library`, decision: permitted, rule: allow).

**Files:**
- `www/library/mcp-server.mjs` — thêm `search_library_iterative` (optional) hoặc giữ `search_library` + wrapper `www/library/rag-loop.mjs`
- `.github/skills/auto-researcher/SKILL.md` — bổ sung maker-checker steps
- `.github/harness/scripts/auto-learn.mjs` — `suggest` gọi RAG loop thay vì 1-shot

**Acceptance:**
- [ ] `search_library({query: "mcp a2a nlweb"})` 1-shot có thể 0 hits, nhưng RAG loop tự refine thành `mcp tool a2a agent card` → có hits score >0
- [ ] Max 3 vòng, mỗi vòng log audit
- [ ] Không regression: `get_status` + `list_books` vẫn pass

---

### 5.2 Trụ cột 2 — Tool Use Hardening (Lesson 04) — P0

**Vấn đề:** Tools hiện là CLI `harness-manager` gọi tay, không có schema, không có `approval_mode`, không validate params, không log structured.

**Mục tiêu:** Chuẩn hóa Tool Use như Lesson 04: 6 building blocks.

> Theo `AI-Agents-for-Beginners-Distilled.md` (chunk #04, page 5):
> > "6 building blocks: Function/Tool Schemas, Execution Logic, Message Handling, Integration Framework, Error Handling, State Management"

**Thiết kế:**
- **Schemas:** Mỗi tool có `name, description, parameters (JSON Schema), output` — như `mcp-server.mjs` TOOLS đã có, mở rộng cho `harness-manager` tools.
- **Approval:** `approval_mode: "never_require" | "always_require" | "on_write"` — tool nguy hiểm (edit, shell rm) phải `always_require` + `policy-check`.
- **Validation:** Validate params trước khi chạy, giới hạn quyền (least privilege), log structured.
- **State:** `AgentSession` giữ history tool calls để tránh lặp.

**Files:**
- `.agent/scripts/policy-check.mjs` — thêm rule cho tool approval
- `www/library/mcp-server.mjs` — mẫu schema chuẩn, áp dụng cho các tool mới
- `.github/skills/tdd-gate/SKILL.md` — test tool ngoài agent trước khi dùng (Lesson 04 trustworthy)

**Acceptance:**
- [ ] Mọi tool mới có JSON Schema + `approval_mode`
- [ ] `policy-check --tool edit --target "*.Tests.*"` vẫn deny (KN-012)
- [ ] Tool fail có error handling + retry, không crash harness

---

### 5.3 Trụ cột 3 — Planning Structured Output + Router (Lesson 07) — P0

**Vấn đề:** `Plan` hiện là markdown tự do, `Implement` phải parse tay → dễ lỗi, không route được subtask cho agent chuyên môn.

**Mục tiêu:** Bắt LLM trả JSON theo schema (Pydantic/Zod) để downstream parse được, như Lesson 07.

> Theo `AI-Agents-for-Beginners-Distilled.md` (chunk #07, page 8):
> > "Structured Output (quan trọng cho multi-agent): Bắt LLM trả JSON theo schema (Pydantic) để downstream parse được"

**Thiết kế:**
```python
class TravelSubTask(BaseModel): task_details: str; assigned_agent: AgentEnum  # explore|plan|design|implement|polish|verify|yunie
class TravelPlan(BaseModel): main_task: str; subtasks: List[TravelSubTask]; is_greeting: bool
```
- **JS tương đương:** Zod schema `planSchema` trong `.github/harness/scripts/plan-validate.mjs`
- **Router:** Semantic Router nhận request → planner sinh `TravelPlan` → dispatcher giao subtasks → coordinator tổng hợp.
- **Event-driven:** Handle unexpected inputs, iterative planning (đánh giá subtask, iterate).

**Files:**
- `.github/harness/scripts/plan-validate.mjs` (mới) — validate `plan.md` frontmatter JSON
- `.github/agents/plan.agent.md` — thêm instruction trả structured output
- `.agent/plans/<slug>/plan.md` template — thêm frontmatter `subtasks: [{task_details, assigned_agent}]`

**Acceptance:**
- [ ] `plan.md` có frontmatter JSON valid, `plan-validate.mjs` pass
- [ ] Router điều phối đúng agent (ví dụ: `assigned_agent: implement` → delegate Implement)
- [ ] Không phá plan cũ — backward compat (nếu không có frontmatter thì fallback markdown)

---

### 5.4 Trụ cột 4 — Multi-Agent Orchestration + Metacognition (Lessons 08+09) — P1

**Vấn đề:** 6 subagents chạy tuần tự `Explore → Plan → ... → Verify`, không chat với nhau, không tự soi lại.

**Mục tiêu:** Cho agents phối hợp thực sự (group chat, hand-off) + tự soi (metacognition).

> Theo `AI-Agents-for-Beginners-Distilled.md` (chunk #08, page 9):
> > "6 Building Blocks: Agent Communication, Coordination, Visibility, Patterns (centralized/decentralized/hybrid), Human in the loop"

> Theo `AI-Agents-for-Beginners-Distilled.md` (chunk #09, page 9):
> > "Metacognition: Agent tự đánh giá và điều chỉnh hành vi dựa trên self-awareness và past experiences"

**Thiết kế:**
- **Patterns:**
  - **Group chat:** nhiều agent chat qua messaging protocol (dùng cho team collaboration) — áp dụng cho `Explore + Plan + Designer` cùng brainstorm PRD.
  - **Hand-off:** agent bàn giao task theo rule (ví dụ: `Implement` xong → hand-off `Polish` nếu là UI).
  - **Collaborative filtering:** nhiều expert cùng recommend → tổng hợp (dùng cho Design palette).
- **Visibility:** Log mỗi action (agent, action, time, outcome) + graph flow + metrics (time, throughput, accuracy) — dashboard `www/status.json` thêm `agents` timeline.
- **Metacognition loop:** `experience_data: []` + `adjust_preferences()` — sau mỗi Verify fail, agent tự hỏi "I prioritized X because... I might be missing Y, let me re-check" → đổi strategy, không lặp nguyên output cũ (anti-pattern trong `copilot-instructions.md`).
- **Human-in-the-loop:** Khi confidence LOW → pause → human approve/reject → resume (như Lesson 06).

**Files:**
- `.github/agents/*.agent.md` — thêm `communication` + `visibility` contract
- `www/status.json` — thêm `agents: [{id, phase, durationMs, outcome}]`
- `.github/harness/scripts/agent-registry.mjs` — validate hand-off

**Acceptance:**
- [ ] 2 agents có thể group chat (ví dụ: Designer + Implement cùng chọn palette)
- [ ] Hand-off có rule explicit, không hardcode
- [ ] Metacognition: sau 1 Verify fail, agent đổi strategy (không lặp output cũ)

---

### 5.5 Trụ cột 5 — Observability & Eval + Deploy Scalable (Lessons 10+16) — P1

**Vấn đề:** Chỉ có `audit.jsonl` + `get_errors`, chưa có traces/spans, chưa có offline/online eval, deploy `www/` chỉ static.

> Theo `AI-Agents-for-Beginners-Distilled.md` (chunk #10, page 10):
> > "Trace = 1 task trọn vẹn, Span = 1 bước (LLM call, retrieval). Không observability = black box; có = glass box"

**Thiết kế:**
- **Traces & Spans:** Mỗi `harness` run là 1 trace, mỗi phase là 1 span (dùng OpenTelemetry hoặc `audit.jsonl` mở rộng thêm `traceId`/`spanId`/`parentSpanId`).
- **Metrics:** Latency (p50/p95), Cost (per run), Request Errors, User Feedback (👍/⭐), Accuracy (ground truth).
- **Eval:**
  - **Offline:** test dataset có ground truth, chạy trong CI/CD, repeatable (dùng `N5Blazor.Tests` + `ai-news.json` làm mẫu).
  - **Online:** monitor live traffic, success rate, drift, A/B/shadow test.
  - **Loop:** evaluate offline → deploy → monitor online → collect failures → add to offline dataset → refine → repeat.
- **Deploy scalable (Lesson 16):**
  - Stateless handling: persist threads ngoài process (cho `www/library` IndexedDB đã có).
  - Model routing: simple → SLM (`gpt-5-nano`), complex → LLM (`gpt-5-mini`) — Foundry Model Router hoặc DIY classifier.
  - Response caching: cache câu hỏi lặp.
  - Concurrency & backpressure: bound concurrency, retry exponential backoff.

**Files:**
- `.agent/audit.jsonl` — thêm `traceId`, `spanId`, `durationMs` (đã có `durationMs`)
- `.github/workflows/pages.yml` — thêm offline eval gate trước deploy (nếu fail thì không deploy)
- `www/status.json` — thêm `health: {latency, errors, eval}`

**Acceptance:**
- [ ] Mỗi harness run có `traceId` duy nhất, mỗi phase là 1 span
- [ ] Offline eval pass mới cho deploy `www/`
- [ ] Metrics hiển thị trên `www/status.json`

---

### 5.6 Trụ cột 6 — Protocols / Context / Memory / Security + Browser/Local (Lessons 11-13,18,15,17) — P1/P2

#### 6a. Protocols — MCP/A2A/NLWeb (Lesson 11) — P1

**Hiện tại:** MCP chỉ cho library (4 tools), chưa có A2A/NLWeb, chưa pin version/auth.

**Nâng cấp:**
- **MCP:** Pin version, scoped identity, validate output, không lộ secret (Lesson 16 enterprise). Thêm MCP server cho `knowleged.md` + `harness-manager`.
- **A2A:** Agent Card (name, description, skills, endpoint, version, capabilities) + Agent Executor + Artifact + Event Queue — để `YUNIE` có thể gọi agent ngoài (LangGraph/Mastra/CrewAI) qua `agents.yaml` (đã có `platform-seam`).
- **NLWeb:** Embedding Models + Vector DB (Qdrant/Azure AI Search) — để `www/` search được bằng NL, mỗi NLWeb cũng là MCP server expose `ask`.

**Files:** `.agent/mcp/catalog.json`, `grants.json`, `agents.yaml`, `www/library/mcp-server.mjs`

#### 6b. Context Engineering (Lesson 12) — P1

**Hiện tại:** Chưa có context pipeline, dễ bị poisoning/distraction/confusion/clash.

**Nâng cấp:**
- **Strategies:** Agent Scratchpad (file/runtime object), Memories (cross-session), Compressing Context (summarize/trim), Multi-Agent (mỗi agent window riêng), Sandbox Environments, Runtime State Objects.
- **Inspecting Context:** Chỉ log small records: counts, ids, hashes, policy labels — không log raw prompt. Hỏi: "Did agent load too much/wrong/missing context?"
- **Failures & Fix:**
  - Poisoning → validation + quarantine (validate flight tồn tại qua API trước khi add vào context)
  - Distraction → summarization
  - Confusion → isolate context per subtask
  - Clash → versioning, conflict resolution

**Files:** `.github/instructions/context-engineering.instructions.md` (mới), `www/library/search.mjs` thêm compress

#### 6c. Memory (Lesson 13) — P1

**Hiện tại:** Chỉ có `knowleged.md` (long-term) + `.agent/bugs/` (episodic), chưa phân tầng.

**Nâng cấp:**
- **Types:** Working Memory (scratch paper), Short-Term (AgentSession via `agent.create_session()`), Long-Term (preferences), Persona Memory (role), Workflow/Episodic (sequence + success/failure), Entity Memory, Structured RAG.
- **Implementations:** Mem0 (2-phase: extraction + update, hybrid store), Cognee (knowledge graph + embeddings, dual-store), Azure AI Search (structured RAG, superhuman precision/recall).
- **Self-Improving pattern:** Observe → Identify → Extract → Store in vector DB → Augment future queries (như RAG).

**Files:** `docs/knowleged.md` tách thành `working/short/long`, `.agent/memory/` (mới), `www/library/` thêm Mem0/Cognee adapter

#### 6d. Security — Receipts (Lesson 18) — P0

**Hiện tại:** `audit.jsonl` có `prevHash` + `hash` SHA-256/16, chưa ký Ed25519, chưa JCS.

**Nâng cấp:**
> Theo `AI-Agents-for-Beginners-Distilled.md` (chunk #18, page 18):
> > "Receipt ký Ed25519 + JCS + hash chain để audit không thể sửa | canonical JSON, tamper-evident, chain"

- **Receipt:** `canonicalize(payload)` bằng JCS (RFC 8785) → ký Ed25519 → `sig` + `public_key` → verify bằng public key, sửa 1 byte → verify fail (tamper-evident).
- **Chaining:** Mỗi receipt chứa hash của receipt trước → chain continuity.
- **What receipts prove vs not:** Prove attribution/integrity/ordering, NOT correctness of action.

**Files:** `.agent/scripts/audit.mjs` — thêm `sign`/`verify` bằng `tweetnacl` hoặc `node:crypto` Ed25519, `.agent/credentials.enc.json` lưu keypair

#### 6e. Browser-Use CUA + Local SLM (Lessons 15+17) — P2

**CUA (Lesson 15):** Khi nào dùng CUA (site không có API, layout động) vs Actor (stable API). Stack: Browser-Use + Playwright + CDP + vision + Pydantic. Safety guardrails 7 bước (scope, separate observation vs action, secrets out, untrusted content, deterministic checks, budgets, record evidence).

**Local SLM (Lesson 17):** Chạy Qwen on-device qua Foundry Local, không cần cloud. Trade-offs, Chroma RAG, local MCP, hybrid fallback (SLM fail → cloud LLM).

**Files:** `www/components/` thêm CUA demo, `foundry-local/` (mới, P2)

---

## 6. Roadmap P0/P1/P2

| Priority | Trụ cột | Lessons | Effort | Giá trị | Khi nào |
|----------|---------|---------|--------|---------|---------|
| **P0** | Agentic RAG Loop | 05 | S (1-2 ngày) | Cao — RAG hiện 1-shot, dễ miss | Sprint 1 |
| **P0** | Tool Use Hardening | 04 | S | Cao — governance + reliability | Sprint 1 |
| **P0** | Planning Structured Output | 07 | S | Cao — unblock multi-agent | Sprint 1 |
| **P0** | Receipt Ed25519 + JCS | 18 | M (2-3 ngày) | Cao — audit tamper-evident | Sprint 1 |
| **P1** | Multi-Agent + Metacognition | 08+09 | M | Trung — collaboration + self-correct | Sprint 2 |
| **P1** | Observability + Eval | 10 | M | Trung — glass box + gate | Sprint 2 |
| **P1** | Protocols (A2A/NLWeb) | 11 | M | Trung — interop | Sprint 2 |
| **P1** | Context Engineering | 12 | S | Trung — chống poisoning | Sprint 2 |
| **P1** | Memory phân tầng | 13 | M | Trung — stateful | Sprint 2 |
| **P1** | Deploy Scalable | 16 | M | Trung — routing/caching | Sprint 3 |
| **P2** | MAF Workflows | 14 | L | Thấp — cần MAF SDK | Backlog |
| **P2** | Browser-Use CUA | 15 | L | Thấp — cần Playwright+vision | Backlog |
| **P2** | Local SLM | 17 | L | Thấp — cần Foundry Local | Backlog |
| **P2** | Course Setup (Foundry) | 00 | S | Thấp — env setup | Backlog |

**Sprint 1 (P0) — 4 trụ cột, ~1 tuần:** RAG loop + Tool hardening + Planning JSON + Receipt Ed25519 → Harness 2.1-alpha
**Sprint 2 (P1) — 6 trụ cột, ~2 tuần:** Multi-Agent + Observability + Protocols + Context + Memory + Deploy → Harness 2.1-beta
**Sprint 3 (P2) — backlog:** MAF + CUA + Local SLM → Harness 2.2

---

## 7. File Changes (dự kiến)

| File | Thay đổi | Trụ cột |
|------|----------|---------|
| `www/library/mcp-server.mjs` | Thêm `search_library_iterative` hoặc wrapper `rag-loop.mjs` | 5.1 |
| `www/library/rag-loop.mjs` | **Mới** — maker-checker loop (max 3 vòng) | 5.1 |
| `.github/skills/auto-researcher/SKILL.md` | Bổ sung maker-checker steps | 5.1 |
| `.github/harness/scripts/auto-learn.mjs` | `suggest` gọi RAG loop | 5.1 |
| `.agent/scripts/policy-check.mjs` | Thêm rule tool approval | 5.2 |
| `.github/skills/tdd-gate/SKILL.md` | Test tool ngoài agent trước | 5.2 |
| `.github/harness/scripts/plan-validate.mjs` | **Mới** — Zod validate plan frontmatter | 5.3 |
| `.github/agents/plan.agent.md` | Thêm structured output instruction | 5.3 |
| `.agent/plans/_template/plan.md` | Thêm frontmatter `subtasks` | 5.3 |
| `.github/agents/*.agent.md` | Thêm communication/visibility contract | 5.4 |
| `www/status.json` | Thêm `agents` timeline + `health` metrics | 5.4, 5.5 |
| `.agent/audit.jsonl` | Thêm `traceId`/`spanId`/`sig`/`public_key` | 5.5, 5.6d |
| `.agent/scripts/audit.mjs` | Thêm Ed25519 + JCS sign/verify | 5.6d |
| `.github/workflows/pages.yml` | Thêm offline eval gate | 5.5 |
| `.agent/mcp/catalog.json` + `grants.json` | Thêm MCP servers cho knowleged/harness | 5.6a |
| `.github/instructions/context-engineering.instructions.md` | **Mới** — context pipeline | 5.6b |
| `.agent/memory/` | **Mới** — working/short/long/persona/episodic | 5.6c |
| `docs/knowleged.md` | Tách working/short/long (giữ backward compat) | 5.6c |
| `www/components/` | Thêm CUA demo (P2) | 5.6e |
| `foundry-local/` | **Mới** — Foundry Local + Qwen (P2) | 5.6e |

**Không đụng:** `copilot-instructions.md` pipeline 8 phase, `harness-flow.md` flowchart, `registry.json` v2 (chỉ thêm entries).

---

## 8. Rủi ro & Mitigations

| Rủi ro | Mitigation |
|--------|------------|
| RAG loop vô hạn | Max 3 vòng + timeout, như `systematic-debugging` 3-fix limit |
| Tool approval làm chậm | `never_require` cho read, `always_require` chỉ cho write/destructive |
| Planning JSON phá plan cũ | Backward compat — nếu không có frontmatter thì fallback markdown |
| Receipt Ed25519 cần key management | Lưu keypair trong `credentials.enc.json` (AES-256-GCM, never logged) |
| Multi-Agent chat phức tạp | Bắt đầu với hand-off đơn giản (Implement → Polish), chưa group chat full |
| Context compress mất info | Chỉ compress khi gần đầy window, giữ hashes để verify |
| Memory phân tầng tốn storage | Cold storage cho ít dùng, dùng model rẻ để check có nên store không |

---

## 9. Verification Checklist

- [ ] `search_library` RAG loop: query kém → tự refine → có hits (max 3 vòng, audit log đủ)
- [ ] Tool Use: mọi tool mới có JSON Schema + approval_mode, `policy-check` pass
- [ ] Planning: `plan-validate.mjs` pass, router điều phối đúng agent
- [ ] Receipt: `audit.mjs verify` pass với Ed25519 + JCS, sửa 1 byte → fail
- [ ] Multi-Agent: hand-off Implement → Polish hoạt động, visibility log đủ
- [ ] Observability: mỗi harness run có `traceId`, `www/status.json` hiển thị metrics
- [ ] Protocols: MCP pin version, A2A Agent Card valid, NLWeb search được
- [ ] Context: scratchpad + compress hoạt động, không poisoning
- [ ] Memory: working/short/long phân tầng, retrieve đúng
- [ ] `get_errors` toàn workspace pass, `harness-manager status` pass, `www/status.json` valid JSON

---

## 10. Tham chiếu & Citations

- **Sách chính:** `AI-Agents-for-Beginners-Distilled.md` (25 chunks, 44,381 bytes, 693 dòng) — `www/library/export.json` `id: ai-agents-for-beginners-distilled-md-mtlr9anf-qfnt`
  - Chunk #00 (page 1, score 6.144): Tổng quan 18 lessons → 35k chars RAG-ready
  - Chunk #01 (page 2, score 12.393): Bản đồ 18 lessons + keywords
  - Chunk #04 (page 5, score 7.146): Setup + MAF vs Foundry
  - Chunk #07 (page 8, score 0.996): Agentic RAG + Trustworthy
  - Chunk #10+ (Production, Protocols, Context, Memory, MAF, CUA, Local, Security) — xem `AI-Agents-for-Beginners-Distilled.md` full
- **Harness v2:** `docs/harness-flow.md`, `docs/capabilities.md`, `docs/knowleged.md` (13 KNs), `.github/copilot-instructions.md`
- **Governance:** `.agent/policy.json`, `.agent/audit.jsonl`, `.agent/credentials.enc.json` (KN-012)
- **Library RAG:** `www/library/mcp-server.mjs` (4 tools), `www/library/app.js` (BM25)
- **YUNIE:** `.github/agents/yunie.agent.md` — System Chatbot, trực `www/` 24/7

---

*Harness 2.1 — Process > Model, nhưng Agent tự làm việc. YUNIE soạn 2026-09-04, chờ sếp duyệt P0 để implement Sprint 1.* ✨
