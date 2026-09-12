# AI Agentic Courses — Khảo sát đa nền tảng (online)

> **Ngày khảo sát:** 2026-09-12 · **Người khảo sát:** YUNIE · **Cách thu thập:** fetch trực tiếp trang chính thức của từng bên.
> **Chi tiết nguồn miễn phí:** mỗi nguồn free = 1 file riêng trong `docs/ai-agentic-courses/` — xem mục "Thư mục chi tiết" ngay dưới.
> **📚 Corpus đầy đủ (verbatim, 200 files ~2.7MB):** `docs/ai-agentic-courses/full/` — nội dung gốc tải về máy cho RAG/offline · xem `full/README.md`.
> ⚠️ Giá/hạn có thể đổi theo region + promotion — check lại trước khi mua. Chỗ nào không fetch được sẽ ghi rõ.

## TL;DR — Chọn theo nhu cầu

| Nhu cầu | Gợi ý | Vì sao |
|---|---|---|
| Free, beginner → expert, có certificate | **Hugging Face Agents Course** | 4 units + 3 bonus, cert free, ~3–4h/tuần |
| Free, dev (.NET/Python/JS), cập nhật liên tục | **Microsoft "AI Agents for Beginners"** | 18 lessons, Microsoft Agent Framework + Foundry, 74.5k⭐, MIT |
| Free, lý thuyết sâu (nghiên cứu) | **Berkeley LLM Agents MOOC** (F24 + SP25) | Lecture từ Google DeepMind/Meta/OpenAI/Anthropic, cert theo tier |
| Free, thực chiến framework | **LangChain Academy** | Deep Agents, LangSmith, deployment; cert LCAC (riêng) |
| Structured + certificate, có tiếng | **DeepLearning.AI "Agentic AI" (Andrew Ng)** | 9h55m, 4 design patterns, PRO certificate |
| Career path dài, có mentor + review project | **Udacity "Agentic AI" Nanodegree** | 53h, 4.8★ (581 reviews), $249/tháng, credit MSc |
| Nhiều review nhất | **Coursera: Vanderbilt "AI Agent Developer" / IBM agentic** | 4.8★ (10K) / 4.6★ (1.1K) |
| Việt Nam, non-IT | **FUNiX "Brain Engineer"** | 3 khóa: IT + non-IT + theo chức danh |

---

## 📂 Thư mục chi tiết — `docs/ai-agentic-courses/`

Mỗi nguồn **miễn phí** có 1 file riêng: syllabus chi tiết + cách học + nguồn lưu lại (fetch 2026-09-12):

| # | File | Nguồn | Điểm chính |
|---|------|-------|------------|
| 1 | [huggingface-agents-course.md](./ai-agentic-courses/huggingface-agents-course.md) | Hugging Face | 4 units + 3 bonus; smolagents/LlamaIndex/LangGraph; cert free |
| 2 | [microsoft-ai-agents-for-beginners.md](./ai-agentic-courses/microsoft-ai-agents-for-beginners.md) | Microsoft | 18 lessons; MAF + Foundry; Study Guide + smoke tests; 50+ ngôn ngữ |
| 3 | [berkeley-llm-agents-mooc.md](./ai-agentic-courses/berkeley-llm-agents-mooc.md) | UC Berkeley | F24 + SP25 full syllabus 24 lectures; guest DeepMind/Meta/OpenAI/Anthropic |
| 4 | [langchain-academy.md](./ai-agentic-courses/langchain-academy.md) | LangChain | Deep Agents, LangSmith, monitoring/reliability — 8 khóa |
| 5 | [anthropic-academy.md](./ai-agentic-courses/anthropic-academy.md) | Anthropic | MCP (16 lectures), Claude Code, Agent Skills, Subagents + GitHub 5 khóa |
| 6 | [openai-academy.md](./ai-agentic-courses/openai-academy.md) | OpenAI | 4 track theo vai trò; API Builder Bootcamp (Agents/RAG/Production); Codex Bootcamp |
| 7 | [deeplearningai-short-courses.md](./ai-agentic-courses/deeplearningai-short-courses.md) | DeepLearning.AI | Agentic AI (Andrew Ng, 4 patterns) + 16 short courses agentic |
| 8 | [google-skills.md](./ai-agentic-courses/google-skills.md) | Google | Multi-Agent path (ADK+MCP+A2A, 6 activities) + GEAR no-cost subscription |
| 9 | [aws-skill-builder.md](./ai-agentic-courses/aws-skill-builder.md) | AWS | Bedrock Agents + RAG, SimuLearn AI Practitioner, prompt engineering 4h |

> Tiêu chí: **miễn phí học** (không cần cert) · nội dung chi tiết/đầy đủ · nguồn chính thức đã lưu trong từng file.

---

## 📚 Corpus đầy đủ — `docs/ai-agentic-courses/full/` (cho RAG + đọc offline)

Nội dung **verbatim (nguyên văn)** tải về máy — dùng làm tài liệu tham khảo/RAG **không cần fetch lại**:

| Nguồn | Repo / trang | License | Files | Dung lượng |
|---|---|---|---|---|
| Microsoft AI Agents for Beginners | `microsoft/ai-agents-for-beginners` | MIT | 23 | 389.3 KB |
| Hugging Face Agents Course | `huggingface/agents-course` | Apache-2.0 | 78 | 460.3 KB |
| Anthropic courses (GitHub) | `anthropics/courses` | xem LICENSE | 99 | 1882.7 KB |
| LangChain Academy (snapshot public) | academy.langchain.com | — | 1 | curriculum 8 khóa |
| AWS Skill Builder (snapshot public) | skillbuilder.aws | — | 1 | chi tiết 5 khóa |
| Google Skills (snapshot public) | skills.google | — | 1 | 2 paths + templates |
| **TỔNG corpus** | | | **200 files** | **~2.7 MB** |

- Tải bằng script re-runnable: `node scripts/fetch-agentic-courses.mjs` (`--force` tải lại · `--only <id>` · `--list`). Manifest từng file: `full/_manifest.json`.
- ✅ **Đã nạp vào thư viện RAG local** (2026-09-12): **190 sách · 1.611 chunks** bằng `scripts/library-ingest-batch.mjs` — idempotent · dedupe theo tên · backup tự động (`library-export-*-pre-batch.json`). Search thử: `node scripts/mcp-query.mjs --q "ReAct"` · trạng thái: `--status`.
- Chi tiết cấu trúc + cách nạp RAG: [`full/README.md`](./ai-agentic-courses/full/README.md). Script này tải **19 lesson README đầy đủ (Microsoft)** + **toàn bộ units/en Unit 0–4 + bonus (HF)** + **5 khóa notebook → md (Anthropic)**.

---

## 1. Miễn phí — open / free chất lượng cao

| Khóa | Bên | Nội dung chính | Thời lượng | Certificate | Link |
|---|---|---|---|---|---|
| 🤗 AI Agents Course | Hugging Face | Units 0–4: fundamentals (tools/thoughts/actions), frameworks (smolagents, LlamaIndex, LangGraph), use cases, final assignment + 3 bonus units (fine-tune function-calling, observability & eval, agents in games) | ~3–4h/tuần × 4–5 tuần | ✅ Free — 2 loại (fundamentals + completion) | https://huggingface.co/learn/agents-course |
| AI Agents for Beginners | Microsoft | 18 lessons: intro, agentic frameworks, design patterns (tool use, planning, multi-agent, metacognition), agentic RAG, trustworthy agents, protocols (MCP/A2A/NLWeb), context engineering, memory, computer-use, deploy, security, local agents. Code: Microsoft Agent Framework + Foundry Agent Service V2 | Self-paced | ❌ (GitHub, MIT) | https://github.com/microsoft/ai-agents-for-beginners |
| LLM Agents MOOC (F24) + Advanced LLM Agents (SP25) | UC Berkeley (Dawn Song, guest Google DeepMind/Meta/OpenAI/Anthropic) | F24: reasoning, planning, tool use, RAG, code gen, multimodal, safety, multi-agent. SP25: advanced reasoning, AI for math, code gen + verification, agentic safety | 12 lectures/mùa + quizzes + labs | ✅ Tier Trailblazer → Legendary (tuỳ coursework) | https://llmagents-learning.org/f24 · https://llmagents-learning.org/sp25 |
| LangChain Academy | LangChain | Quickstart / Foundation / Project: Introduction to Deep Agents, LangSmith Essentials, LangSmith Deployment, v.v.; chương trình cert LCAC (LangChain Certified Agent Engineer) | Self-paced | ✅ LCAC (chương trình riêng) | https://academy.langchain.com/ |
| Anthropic Academy | Anthropic | Claude 101, Claude Code 101 + In Action, Claude Platform 101, MCP Intro + Advanced, Introduction to Agent Skills, Subagents, Claude Cowork… (host Skilljar) | Self-paced, ngắn | ✅ Completion (Skilljar) | https://anthropic.skilljar.com/ |
| Anthropic courses (GitHub) | Anthropic | 5 khóa notebook: API fundamentals, prompt engineering, real-world prompting, prompt evaluations, **tool use** | Self-paced | ❌ | https://github.com/anthropics/courses |
| OpenAI Academy | OpenAI | Track "Build with AI" (Codex xuyên SDLC + OpenAI API), "Apply AI at Work" (directing work with agents), Builder Bootcamps on-demand (RAG, Realtime) | Events + self-paced | ❌ | https://academy.openai.com/ |
| Short courses (0.5–3h/khóa) | DeepLearning.AI + partners | Claude Code: A Highly Agentic Coding Assistant (Anthropic), MCP: Build Rich-Context AI Apps (Anthropic), Building toward Computer Use (Anthropic), Long-Term Agentic Memory (LangChain), Evaluating AI Agents (Arize), AI Agents for Image & Video (Google), Building Adaptive AI Agents (Oracle), Building AI Browser Agents (AGI Inc), Generative UI (CopilotKit), DSPy (Databricks), Agentic Knowledge Graph (Neo4j)… | 0.5–3h/khóa | Cert cần PRO | https://www.deeplearning.ai/short-courses/ |
| Google Skills (ex Cloud Skills Boost) | Google Cloud | Paths: **Build High-Performance Multi-Agent Systems** (#4459), **Govern & Secure Enterprise Agents** (#4461), **Professional Agentic Architect Certification** (#4525); chương trình GEAR (Gemini Enterprise Agent Ready) — subscription no-cost + 35 credits/tháng | Self-paced | ✅ Badges/certs | https://www.skills.google/paths |
| AWS Skill Builder | AWS | AI learning paths: foundations → **advanced agentic AI implementation** (Bedrock/SageMaker), 1,000+ khóa free, microcredentials (lab hands-on), Cloud Quest role (GenAI Architect) | Self-paced | ✅ Microcredentials + AWS cert exams | https://skillbuilder.aws/ |
| NVIDIA Academy | NVIDIA | **Generative AI & LLM learning path** + NVIDIA certification; có khóa free và trả phí ($50–$150 cho khóa infra); workshop/lab tại GTC | Self-paced + instructor-led | ✅ NVIDIA certification | https://www.nvidia.com/en-us/learn/learning-path/generative-ai-llm/ |

## 2. Nền tảng lớn — Coursera / Udacity / edX / Udemy

### 2.1 Coursera (query "agentic ai" — 476 trang kết quả, top hits)

| Khóa | Provider | Level | Thời lượng | Rating | Giá | Link |
|---|---|---|---|---|---|---|
| Building AI Agents and Agentic Workflows (Specialization) | IBM | Intermediate | 1–3 tháng | 4.6★ (312) | Free trial / audit · cert trả phí | https://www.coursera.org/specializations/building-ai-agents-and-agentic-workflows |
| IBM RAG and Agentic AI (Professional Certificate) | IBM | Advanced | 3–6 tháng | 4.6★ (1.1K) | Free trial | https://www.coursera.org/professional-certificates/ibm-rag-and-agentic-ai |
| AI Agent Developer (Specialization) | Vanderbilt University | Beginner | 3–6 tháng | 4.8★ (10K) | Free trial | https://www.coursera.org/specializations/ai-agents |
| Agentic AI and AI Agents for Leaders (Specialization) | Vanderbilt University | Beginner | 1–3 tháng | 4.8★ (10K) | Free trial | https://www.coursera.org/specializations/ai-agents-for-leaders |
| Agentic AI and AI Agents: A Primer for Leaders (Course) | Vanderbilt University | Beginner | 1–4 tuần | 4.7★ (1.6K) | Free trial | https://www.coursera.org/learn/agentic-ai |
| AI Agents with Vertex AI Reasoning Engine and Agent Builder | Google Cloud | Advanced | 3–6 tháng | 3.4★ (20) | Free trial | https://www.coursera.org/specializations/ai-agents-with-vertex-ai-reasoning-engine-and-agent-builder |
| Agentic AI with LangChain and LangGraph | IBM | Intermediate | 1–4 tuần | 4.6★ (114) | Free trial | https://www.coursera.org/learn/agentic-ai-with-langchain-and-langgraph |
| Gen AI Dev — Agentic AI Solutions and Tool Integrations | AWS | Advanced | Course | New | Free trial | https://www.coursera.org/learn/aws-generative-ai-developer-agentic-ai-solutions-and-tool-integrations |
| Agentic AI Engineering (Specialization) | Edureka | Intermediate | 3–6 tháng | 3.5★ (11) | Free trial | https://www.coursera.org/specializations/agentic-ai-engineering |

> Tại thời điểm khảo sát Coursera đang chạy promo Coursera Plus (40% off 3 tháng).

### 2.2 Udacity (subscription)

| Khóa | Loại | Level | Thời lượng | Rating | Giá | Ghi chú |
|---|---|---|---|---|---|---|
| **Agentic AI** (nd900) | Nanodegree | Intermediate | 53h (4 courses, 67 lessons, 4 projects) | 4.8★ (581) | **$249/tháng** (cancel anytime) | 4 project: multi-agent trip planner, agentic workflow, research agent (RAG + tool use), multi-agent sales system; **credit MSc AI**; updated 2026-07-29 |
| Agentic AI Fluency (cd14380) | Course | Fluency | 6h | 4.7★ | Subscription | Cho non-tech: reasoning, planning, tool use, đánh giá cơ hội |
| AI Engineering with Claude (nd7426) | Nanodegree | — | — | — | Subscription | Học qua Claude (flagship mới) |

Link: https://www.udacity.com/course/agentic-ai--nd900 · https://www.udacity.com/course/agentic-ai-fluency--cd14380

### 2.3 edX (28 kết quả "agentic ai")

| Khóa | Provider | Level | Thời lượng | Ghi chú |
|---|---|---|---|---|
| Agentic AI: Developing AI Agents | IBM | Intermediate | 3 tuần | Free audit · verified cert trả phí |
| Agentic AI: LangChain and LangGraph | IBM | Intermediate | 2 tuần | |
| Agentic AI with LangGraph, CrewAI, AG2, and BeeAI | IBM | Intermediate | 1 tuần | So sánh 4 framework |
| Applications of Agentic AI in Banking | State Bank of India | Introductory | 4 tuần | Case study ngành |
| Implementing Agentic AI: Building Your Organizational Playbook | MIT Sloan (exec ed) | Executive | 3 tuần | Cho leader/manager |
| Enterprise AI: Strategy, Implementation, and Integration | MIT Sloan (exec ed) | Executive | 5 tháng | Rộng hơn agent |

### 2.4 Udemy (giá thị trường VN tại thời điểm khảo sát)

| Khóa | Instructor | Thời lượng | Rating | Giá (VN) |
|---|---|---|---|---|
| AI Engineer Agentic Track: The Complete Agent & MCP Course | Ed Donner, Ligency | 21h | 4.7★ (47.5K) | ₫399K |
| LangChain — Agentic AI Engineering with LangChain & LangGraph | Eden Marco | 20h | 4.6★ (53.8K) | ₫1,649K |
| Complete Agentic AI Bootcamp With LangGraph and LangChain | Krish Naik | 45.5h | 4.5★ (6.3K) | ₫399K |
| Agentic AI Masters 2026: LangChain, LangGraph & CrewAI | Dr. Satyajit Pattnaik | 62h | 4.7★ (80) | ₫839K |
| The Agentic AI Engineering Masterclass 2026 | Prof. Ryan Ahmed | 13.5h | 4.5★ (7.7K) | ₫399K |
| Intro to AI Agents and Agentic AI | 365 Careers | 2h | 4.5★ (83.9K) | ₫399K |
| AI Engineer Core Track: LLM Engineering, RAG, QLoRA, Agents | Ed Donner | 33.5h | 4.7★ (41.3K) | ₫1,299K |
| Certified Master in Agentic AI (52-week program) | School of AI | 31h | 4.5★ (487) | ₫399K |

> Udemy sale liên tục — giá hiển thị có thể giảm thêm.

## 3. Vendor academies — học trực tiếp từ hãng

- **OpenAI Academy** — free; "Build with AI" + "Apply AI at Work" + Builder Bootcamps. https://academy.openai.com/
- **Anthropic Academy** — free; mạnh nhất về Claude Code / MCP / Agent Skills / Subagents. https://anthropic.skilljar.com/
- **DeepLearning.AI** — hub short course với Anthropic/Google/AWS/LangChain/Neo4j/Databricks…; flagship "Agentic AI" của Andrew Ng. https://www.deeplearning.ai/
- **Google Skills** — Multi-Agent Systems path, Govern & Secure Agents path, Professional Agentic Architect cert, GEAR program. https://www.skills.google/paths
- **Microsoft** — GitHub course 18 lessons + Microsoft Learn paths (MAF/Foundry). https://github.com/microsoft/ai-agents-for-beginners
- **AWS Skill Builder** — agentic AI learning paths + microcredentials. https://skillbuilder.aws/
- **NVIDIA Academy** — GenAI & LLM path + certification. https://www.nvidia.com/en-us/learn/learning-path/generative-ai-llm/
- **IBM** — platform riêng 5,500+ khóa, nhưng nội dung agentic chủ yếu phân phối qua Coursera/edX (đã liệt kê §2). https://www.ibm.com/training/

## 4. Đại học (free/low-cost)

- **UC Berkeley** — LLM Agents MOOC F24 + Advanced SP25 (miễn phí, certificate theo tier).
- **MIT Sloan** (qua edX) — "Implementing Agentic AI" (3 tuần) + "Enterprise AI" (5 tháng) — cho leader.
- **Vanderbilt** (qua Coursera) — "AI Agent Developer" 4.8★/10K reviews — track dài nhất với rating khủng.
- **University of Washington × NexusFlow** (qua DeepLearning.AI) — Post-training of LLMs (nền tảng custom model cho agent).

## 5. Cohort-based (Maven) — có deadline, mentor, thường đắt

Top cohort đang mở (tại thời điểm khảo sát):

| Khóa | Instructor | Thời lượng | Khai giảng |
|---|---|---|---|
| AI Evals For Engineers & PMs | Hamel Husain & Shreya Shankar | 6 tuần | Oct 10 |
| Mastering Agentic AI: Certification | Aishwarya Srinivasan & Arvind Narayanamurthy | 6 tuần | Oct 4 |
| Building Agentic AI Applications (Problem-First) | Aishwarya Naresh Reganti & Kiriti Badam | 5 tuần | Oct 17 |
| AI Engineering Buildcamp: From RAG to Agents | Alexey Grigorev | 9 tuần | Sep 21 |
| Agentic AI Engineering 2026 Edition | Hyperskill | 10 tuần | Sep 14 |
| AI Engineering Bootcamp: Claude Code, RAG, MCP | Dr. Aki Wijesundara | 5 tuần | Sep 22 |
| Build Production AI Agents for 10x–100x ROI | Dr. Ankur Narang et al. | 4 tuần | Sep 15 |
| Agentic AI for Claude Builders | James Gray | 5 tuần | Oct 5 |
| Microsoft Agent Engineering Certificate (Foundry/Copilot Studio) | Dr. Aki Wijesundara | 3 tuần | Sep 16 |
| Build Your Agentic Software Factory | Hugo Bowne-Anderson & Eleanor Berger | 10 ngày | Oct 13 |

Link gốc: https://maven.com/courses/ai/agentic-ai

## 6. Việt Nam

| Khóa | Bên | Đối tượng | Ghi chú |
|---|---|---|---|
| AI Agent Operation (Brain Engineer) — Lập trình & Vận hành AI Agent Tự động hóa | FUNiX | IT / có nền tảng | Lộ trình "Brain Engineer" |
| AI Agent Operation for non IT (Brain Engineer for non IT) | FUNiX | Người nghiệp vụ, non-IT | Xây dựng & vận hành không cần code |
| Tự Động Hóa Công Việc: AI Agent Theo Chức Danh | FUNiX | Mọi người đi làm | Automate theo job title |

- Link: https://funix.edu.vn/?s=AI+agent · Giá: liên hệ (form đăng ký tư vấn).
- ⚠️ Unica + Edumall bị chặn fetch (CSP/extract fail) — nếu cần khảo sát thêm nguồn VN, check tay sau.

---

## 7. Gợi ý lộ trình (3 track)

**Track A — Zero → first agent (2–4 tuần, $0):**
HF Agents Course (Units 0–2) → build 1 agent bằng smolagents → Microsoft course lessons 1–5 → LangChain Academy "Introduction to Deep Agents".

**Track B — Dev → production agent (1–2 tháng, $$):**
DeepLearning.AI "Agentic AI" (Andrew Ng) hoặc IBM "Building AI Agents and Agentic Workflows" (Coursera) → + MCP (Anthropic Academy) → + Evals (Arize short course / Maven AI Evals).

**Track C — Nghiên cứu / đi sâu (free):**
Berkeley F24 (watch hết) → SP25 (advanced) → đọc papers (workspace đã có `books/papers/` + notes arXiv).

**Track D — Việt Nam non-IT (1–2 tháng):**
FUNiX "Brain Engineer for non IT" → "Tự Động Hóa Công Việc Theo Chức Danh".

---

## 8. Dissent & lưu ý (đọc trước khi chọn)

- **Dissent:** danh sách này dễ tạo FOMO. Framing đối lập — **học dàn trải 5–6 khóa cùng lúc thường thất bại**; 1 khóa chính + 1 project thật + 1 nguồn reference (VD: HF course + Berkeley lectures) hiệu quả hơn thu thập chứng chỉ. Chọn theo **project muốn ship**, không theo danh tiếng khóa. *(Dissent Review gate — KN-018)*
- **Giá thay đổi liên tục:** Udemy sale hàng tuần; Coursera 40% off; edX promo ACTION2026 (15%, hết 16/09/2026); Udacity subscription — check lại trước khi mua.
- **Chứng chỉ "AI Agent" tràn lan, chất lượng không đều.** Tín hiệu đáng tin: syllabus công khai + project graded + review thật (VD: Coursera 4.8★/10K reviews, Udacity 4.8★/581).
- **Nguồn fetch fail cần verify tay:** Unica, Edumall (blocked); IBM Training (trang chung — khóa agentic nằm trên Coursera/edX); NVIDIA DLI chi tiết khóa agents (academy page hiện thiên hạ tầng).
- **Free vs cert:** đa số nền tảng cho **audit/học free** nhưng **cert trả phí** (Coursera, edX, DLAI PRO) — đừng nhầm "free" là "full".

## 9. Nguồn fetch (evidence) — 2026-09-12

**Lượt 1 — khảo sát tổng:**
```
✅ huggingface.co/learn/agents-course            ✅ github.com/microsoft/ai-agents-for-beginners
✅ academy.langchain.com                          ✅ llmagents-learning.org/f24 + /sp25
✅ github.com/anthropics/courses                  ✅ anthropic.skilljar.com
✅ academy.openai.com                             ✅ deeplearning.ai/short-courses (+ /courses/agentic-ai)
✅ coursera.org/courses?query=agentic+ai          ✅ udacity.com (catalog + nd900 + cd14380)
✅ edx.org/search?q=agentic ai                    ✅ udemy.com/courses/search?q=agentic ai
✅ maven.com/courses/ai/agentic-ai                ✅ skillbuilder.aws
✅ skills.google/paths                            ✅ nvidia.com/en-us/training/academy + learning-path/generative-ai-llm
✅ funix.edu.vn/?s=AI+agent                       ⚠️ unica.vn · edumall.vn (blocked) · ibm.com/training (generic)
```

**Lượt 2 — chi tiết nguồn free (→ file trong `docs/ai-agentic-courses/`):**
```
✅ hf.co/learn/agents-course/unit1 + unit2 + github.com/huggingface/agents-course
✅ github.com/microsoft/ai-agents-for-beginners/blob/main/STUDY_GUIDE.md
✅ academy.langchain.com/collections
✅ anthropic.skilljar.com/introduction-to-model-context-protocol
✅ academy.openai.com/public/clubs/builders-etkn1
✅ skills.google/paths/4459 (6 activities, GEAR)
✅ skillbuilder.aws/category/domain/generative-ai
⚠️ academy.openai.com/public/pages/courses → 404 (dùng Builders club thay thế)
```

**Lượt 3 — tải corpus đầy đủ (2026-09-12) → `docs/ai-agentic-courses/full/`:**
```
✅ github API: microsoft/ai-agents-for-beginners → 23 files (19 lesson README 00-18 + README + STUDY_GUIDE + AGENTS + LICENSE)
✅ github API: huggingface/agents-course → 78 files (units/en/**: unit0-unit4 + bonus-unit1/2/3 + communication)
✅ github API: anthropics/courses → 99 files (5 khóa: README + notebooks → md; bỏ outputs)
✅ pages: academy.langchain.com/courses (8 khóa) · skillbuilder.aws (5 khóa) · skills.google (paths 4459/4461 + templates)
Công cụ: scripts/fetch-agentic-courses.mjs (re-runnable, Node 18+, 0 deps) · Manifest: full/_manifest.json (giữ nguồn từng file)
```

---
*Generated by YUNIE — Harness v2. Khảo sát trực tiếp từ trang chính thức, không qua bên thứ 3. Cập nhật lại khi cần.*
