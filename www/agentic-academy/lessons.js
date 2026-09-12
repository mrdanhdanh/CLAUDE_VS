/* Agentic Academy — lessons.js
 * 7 bài học × ~10-11 slide. Nguồn facts: corpus docs/ai-agentic-courses/full/ (200 files)
 * + docs IDE chính chủ verify 2026-09-12. Thêm bài mới = chỉ sửa file này (app + deck tự render).
 * Slide types: cover · bullets · diagram · steps · code · compare · outcome · sources
 */
(function () {
  'use strict';

  window.ACADEMY = {
    meta: {
      version: '1.1.0',
      updatedAt: '2026-09-12',
      factsVerifiedAt: '2026-09-12',
      note: 'Facts về file luật từng IDE được verify trực tiếp từ docs chính chủ ngày 2026-09-12 — IDE cập nhật thì kiểm tra lại bản bạn dùng.'
    },
    lessons: [
      /* ============================== K1 ============================== */
      {
        id: 'k1', num: 1, icon: '🧠', accent: '#00d992',
        title: 'Agentic AI là gì?',
        sub: 'Từ chatbot trả lời → agent hoàn thành mục tiêu',
        desc: 'Chatbot khác agent chỗ nào · 4 pattern nền tảng · khi nào KHÔNG nên dùng agent',
        duration: '15 phút', tags: ['Tư duy', 'Pattern'], need: 'Máy tính + 15 phút — chưa cần cài gì',
        slides: [
          { type: 'cover', goals: ['Phân biệt chatbot vs agent', '4 pattern nền tảng (Andrew Ng)', 'Biết khi nào KHÔNG nên dùng agent'] },
          { type: 'bullets', title: 'Trước khi bắt đầu — chuẩn bị 3 thứ', icon: '🧰', items: [
            '**1 folder project ("xưởng")** — dùng project có sẵn (càng nhỏ càng dễ) hoặc tạo mới: `mkdir my-agent-lab`. **Mọi bài sau thực hành trong folder này**',
            '**1 IDE agent** — cài ở Bài 2 (4 lựa chọn: Claude Code · VS Code Copilot · Codex · Antigravity). IDE có thể cần tài khoản (có bản free/thử) — **chọn 1 cái trước, không cần cả 4**',
            '**Node.js 18+** — chỉ cần nếu dùng CLI (Claude Code/Codex) hoặc server MCP qua `npx`: kiểm tra bằng `node -v`',
            'Chưa cài gì cũng không sao — Bài 1 chỉ cần đọc, ghi chú và chốt folder'
          ]},
          { type: 'bullets', title: 'Chatbot vs Agent — 3 khác biệt cốt lõi', icon: '🤖', items: [
            '**Việc bạn giao:** chatbot nhận *câu hỏi* — agent nhận *mục tiêu*. Bạn tả kết quả muốn có, không mô tả từng bước',
            '**Cách làm việc:** chatbot trả lời 1 lượt rồi hết (không nhớ gì giữa các lượt) — agent **lặp** (làm → xem kết quả → sửa) tới khi xong và **nhớ ngữ cảnh** giữa các bước',
            '**Quyền lực:** chatbot chỉ trả chữ — agent có **tool** (đọc/ghi file, chạy lệnh, gọi API…) và tự quyết bước tiếp theo'
          ]},
          { type: 'diagram', title: 'Vòng lặp agent', svg: 'agent-loop', caption: 'Ba pha lặp tới khi xong: quan sát → suy luận → hành động, kèm feedback từ kết quả tool' },
          { type: 'bullets', title: '4 pattern nền tảng (Andrew Ng)', icon: '🧩', items: [
            '🔍 **Reflection** — agent tự soi output, sửa trước khi trả',
            '🛠 **Tool Use** — gọi hàm/API/MCP để lấy sự thật ngoài model',
            '🗺 **Planning** — chia mục tiêu thành bước, theo dõi tiến độ',
            '👥 **Multi-Agent** — nhiều vai (planner / coder / reviewer) phối hợp',
            'Chỉ dùng cái task cần — thêm agent loop vào việc **vẽ được flowchart** là lãng phí'
          ]},
          { type: 'bullets', title: 'Cạm bẫy #1 — "agent" giả danh pipeline', icon: '⚠️', items: [
            'Phần lớn hệ thống được gọi là "agent" thực ra là **pipeline** — path đã biết trước',
            'Pipeline: rẻ, test được, ổn định → tự dưng dùng agent loop là **đắt và khó debug**',
            'Test nhanh: **vẽ được flowchart trước khi chạy?** → viết pipeline, đừng viết agent',
            'Chỉ giao quyền tự quyết cho agent khi thỏa **2 điều**: kết quả **dễ kiểm tra**, và việc kiểm tra **để lại bằng chứng** (log, test, diff…)'
          ]},
          { type: 'diagram', title: 'Quyết định: pipeline hay agent?', svg: 'when-agent', caption: 'Vẽ được flow → pipeline. Cần adapt + có cách kiểm tra rẻ → agent. Agency là cost phải justify' },
          { type: 'bullets', title: 'Cạm bẫy #2 — tin lời agent tự báo', icon: '🚫', items: [
            'Model được huấn luyện để **nghe hợp lý**, không phải để đúng — self-report không phải bằng chứng',
            'Model tự chấm điểm mình → thiên vị có hệ thống (self-preference)',
            'Chuẩn thật: **fresh evidence từ tool** — chạy test, mở file, đo số',
            'Đừng hỏi "chắc chưa?" — hãy bắt **chạy lệnh rồi dán kết quả**'
          ]},
          { type: 'compare', title: 'Cùng 1 việc — 3 cách chọn', cols: ['Việc', 'Cách đúng', 'Vì sao'], rows: [
            ['Trích 100 PDF theo form cố định', 'Pipeline', 'flowchart vẽ được, output verify rẻ'],
            ['Săn bug lạ trong codebase', 'Agent', 'path chưa biết, cần thử + quan sát'],
            ['Viết báo cáo phân tích thị trường', 'Hybrid', 'pipeline gom data + agent viết + human duyệt']
          ]},
          { type: 'steps', title: 'Thực hành ngay (15 phút)', steps: [
            { t: 'Bước 0 — Chốt folder "xưởng" (2 phút)', d: 'Tạo mới `mkdir my-agent-lab` hoặc dùng project có sẵn — **từ giờ mọi file của khóa học nằm trong folder này** (docs/, AGENTS.md, skills…)' },
            { t: 'Tạo `docs/agent-notes.md` trong folder đó', d: 'File nhật ký xuyên suốt khóa học — mọi bài sau đều ghi kết quả vào đây' },
            { t: 'Liệt kê 3 task bạn đang làm', d: 'Mỗi task 1 dòng: tên + "pipeline / agent / hybrid" + lý do 1 câu. Hybrid = pipeline gom dữ liệu + agent xử lý + người duyệt cuối' },
            { t: 'Viết agent-spec 5 dòng (vào chính file notes)', d: 'Mục tiêu · Tool được dùng · Điều kiện dừng · Bằng chứng verify · Ngân sách (= số bước tối đa trước khi dừng hỏi lại, vd 10 bước)' }
          ]},
          { type: 'outcome' },
          { type: 'sources' }
        ],
        outcome: {
          files: [
            { p: 'docs/agent-notes.md', why: 'Nhật ký học — tạo ở bài này, dùng tới bài 7' }
          ],
          criteria: [
            'Folder "xưởng" đã chốt + có file `docs/agent-notes.md` trong đó',
            'Phân loại 3 task + tự kiểm bằng "test flowchart": vẽ được flowchart → pipeline · cần adapt + verify rẻ → agent · xen kẽ → hybrid',
            'Agent-spec 5 dòng cho task bạn chọn (đủ 5 mục, mỗi mục 1 dòng)',
            'Viết được 2-3 câu trả lời: "khi nào KHÔNG nên dùng agent"'
          ]
        },
        sources: [
          { n: 'Anthropic — Building Effective Agents', u: 'https://www.anthropic.com/engineering/building-effective-agents', note: 'workflow vs agent, patterns' },
          { n: 'HF Agents Course — Unit 1', u: 'https://huggingface.co/learn/agents-course', note: 'ReAct: thoughts → actions → observations' },
          { n: 'Microsoft — AI Agents for Beginners (01-02)', u: 'https://github.com/microsoft/ai-agents-for-beginners', note: 'agentic concepts + design patterns' },
          { n: 'DeepLearning.AI — khóa Agentic AI (Andrew Ng)', u: 'https://www.deeplearning.ai/short-courses/', note: '4 design patterns' },
          { n: 'Sách nội bộ: books/Andrew-Ng-Agentic-AI-Playbook-2026-Distilled.md', u: '', note: 'pipeline-in-a-trench-coat (KN-022)' }
        ]
      },

      /* ============================== K2 ============================== */
      {
        id: 'k2', num: 2, icon: '🧰', accent: '#22d3ee',
        title: 'Chọn & setup IDE agent',
        sub: 'Claude Code · VS Code Copilot · Codex · Antigravity',
        desc: 'Claude Code, VS Code, Codex, Antigravity — bản đồ file luật từng IDE + cách cài',
        duration: '14 phút', tags: ['Công cụ', 'Setup'], need: 'Bài 1 — đã chọn folder "xưởng"',
        slides: [
          { type: 'cover', goals: ['Biết file luật của từng IDE', 'Cài + test 1 IDE (chỉ cần 1)', 'Hiểu kiến trúc multi-IDE: viết 1 lần, chạy nhiều tool'] },
          { type: 'bullets', title: 'Mỗi IDE một bộ luật riêng — tin tốt đang đến', icon: '🗺️', items: [
            'Mỗi IDE đọc **file cấu hình khác nhau** → viết lại nhiều lần là mất công',
            'Đang hội tụ về **AGENTS.md** — chuẩn mở, 60k+ repo dùng, bảo trợ bởi Agentic AI Foundation (Linux Foundation)',
            'Codex, Cursor, Windsurf, Copilot, Zed, Aider, opencode… đều đọc AGENTS.md',
            'Chiến lược thắng: **1 lõi AGENTS.md + adapter mỏng** cho từng IDE (Bài 3 sẽ làm) — bạn chỉ cần setup **1 IDE trước**, thêm sau cũng được'
          ]},
          { type: 'compare', title: 'Bảng tra nhanh — file & tính năng', cols: ['IDE', 'File luật chính', 'MCP', 'Mở rộng'], rows: [
            ['Claude Code', 'CLAUDE.md · .claude/rules/', '.mcp.json', '.claude/commands/, .claude/skills/'],
            ['VS Code Copilot', '.github/copilot-instructions.md (+ AGENTS.md, CLAUDE.md, .instructions.md)', '.vscode/mcp.json', '.github/prompts/, .github/agents/, .github/skills/'],
            ['Codex (OpenAI)', 'AGENTS.md — native', '~/.codex/config.toml', '~/.codex/prompts/ (xem docs bản bạn dùng)'],
            ['Antigravity (Google)', '.agents/rules/ · global ~/.gemini/GEMINI.md', '~/.gemini/config/mcp_config.json', '.agents/skills/<name>/SKILL.md']
          ]},
          { type: 'bullets', title: 'Claude Code — điểm mạnh', icon: '🟠', items: [
            'Rules: `CLAUDE.md` ở root; rule theo glob path đặt trong `.claude/rules/*.md`',
            'Mở rộng: `.claude/commands/*.md` (slash command) · skills `.claude/skills/<name>/SKILL.md`',
            'MCP: `.mcp.json` ở project root — server local + remote',
            'Hợp việc: refactor nhiều file, tự chạy lệnh dài, terminal-first'
          ]},
          { type: 'bullets', title: 'VS Code Copilot — điểm mạnh', icon: '🔵', items: [
            'Always-on: `.github/copilot-instructions.md` · file-based: `.github/instructions/*.instructions.md` + `applyTo` glob',
            'VS Code **đọc cả AGENTS.md và CLAUDE.md** → 1 chỗ viết, nhiều tool dùng',
            'MCP: `.vscode/mcp.json` · mở rộng: `.github/prompts/`, `.github/agents/`, `.github/skills/`',
            'Hợp việc: làm trong editor, review diff trực quan, làm cùng team'
          ]},
          { type: 'bullets', title: 'Codex & Antigravity — điểm mạnh', icon: '🟣', items: [
            'Codex: `AGENTS.md` **native** — repo chuẩn agent là chạy ngay; MCP + config ở `~/.codex/config.toml`',
            'Antigravity: Rules **4 chế độ** — Manual · Always On · Model Decision · Glob (`*.js`, `src/**/*.ts`)',
            'Antigravity Skills: `.agents/skills/<name>/SKILL.md` — progressive disclosure (Bài 4)',
            'Antigravity MCP: Settings → Customizations, hoặc sửa `~/.gemini/config/mcp_config.json`'
          ]},
          { type: 'diagram', title: 'Kiến trúc multi-IDE', svg: 'ide-matrix', caption: '1 lõi luật chung — nhiều adapter mỏng theo từng IDE. Viết 1 lần, chạy mọi nơi' },
          { type: 'steps', title: 'Cài & test 1 IDE (20 phút)', steps: [
            { t: 'Tải + cài (chọn 1)', d: 'Claude Code → code.claude.com · VS Code → code.visualstudio.com (+ Copilot) · Codex → developers.openai.com/codex · Antigravity → antigravity.google. IDE có thể cần tài khoản (có bản free/thử); CLI (Claude Code, Codex) cần Node.js 18+ — kiểm tra `node -v`' },
            { t: 'Mở folder "xưởng" bằng IDE', d: 'Chính là folder đã chốt ở Bài 1 — mọi thao tác của khóa học đều trên folder này' },
            { t: 'Hỏi 3 câu test', d: 'Gõ trong khung chat của IDE: ① "Quy tắc build của project là gì?" ② "Tạo commit message theo chuẩn của project" ③ "Đọc file README (hoặc file bất kỳ trong project), tóm tắt 3 ý"' },
            { t: 'Ghi kết quả + version vào docs/agent-notes.md', d: 'Câu nào sai/mơ hồ là bình thường — Bài 3 sẽ viết luật sửa đúng. Xem version: CLI `--version` · VS Code: Help → About · Antigravity: Settings' }
          ]},
          { type: 'outcome' },
          { type: 'sources' }
        ],
        outcome: {
          files: [
            { p: 'docs/agent-notes.md', why: 'Ghi: IDE đã cài + version + kết quả 3 câu test' }
          ],
          criteria: [
            '1 IDE mở được folder "xưởng" và chat được với agent',
            'Ghi vào notes: 3 câu test — câu nào sai/mơ hồ (đây là "đầu vào" để Bài 3 sửa)',
            'Viết 2 dòng vào notes: (1) IDE của bạn đọc file luật nào · (2) MCP config nằm ở path nào'
          ]
        },
        sources: [
          { n: 'Claude Code — docs chính chủ (cài đặt + rules)', u: 'https://code.claude.com/docs', note: 'CLAUDE.md, .claude/ — verify 2026-09-12' },
          { n: 'VS Code — Custom instructions (fetched 2026-09-12)', u: 'https://code.visualstudio.com/docs/agent-customization/custom-instructions', note: 'AGENTS.md + CLAUDE.md + .instructions.md + mcp.json' },
          { n: 'AGENTS.md — chuẩn mở', u: 'https://agents.md/', note: 'danh sách tool hỗ trợ, nested files, FAQ' },
          { n: 'Antigravity — Rules', u: 'https://antigravity.google/docs/rules-workflows', note: '.agents/rules, 4 chế độ, giới hạn 12.000 ký tự' },
          { n: 'Antigravity — Skills / MCP', u: 'https://antigravity.google/docs/skills/', note: '.agents/skills, progressive disclosure' },
          { n: 'OpenAI Codex — config docs', u: 'https://github.com/openai/codex/blob/main/docs/config.md', note: 'config.toml' },
          { n: 'Codelab: Getting Started with Antigravity', u: 'https://codelabs.developers.google.com/getting-started-google-antigravity', note: 'slash commands, MCP, skills (fetched 2026-09-12)' }
        ]
      },

      /* ============================== K3 ============================== */
      {
        id: 'k3', num: 3, icon: '📜', accent: '#a78bfa',
        title: 'AGENTS.md — bộ luật chung',
        sub: 'Viết 1 lần — Claude, Copilot, Codex, Antigravity đều đọc',
        desc: 'Tạo lõi AGENTS.md + adapter mỏng cho từng IDE + nghệ thuật viết rule sắc',
        duration: '15 phút', tags: ['Hệ thống', 'Files'], need: 'Bài 2 — 1 IDE agent mở được project',
        slides: [
          { type: 'cover', goals: ['Tạo lõi AGENTS.md hoàn chỉnh', '3 adapter mỏng cho 3 nhóm IDE', 'Viết rule sắc — không mơ hồ'] },
          { type: 'bullets', title: 'Vì sao là AGENTS.md?', icon: '🌍', items: [
            '"**README cho agent**": build/test/conventions — chỗ agent nhìn trước tiên',
            'Chuẩn mở, 60k+ repo dùng, bảo trợ bởi **Agentic AI Foundation** (Linux Foundation)',
            'Hỗ trợ: Codex, Cursor, Windsurf, Copilot, Zed, Aider, opencode, Augment…',
            'Monorepo: nhiều AGENTS.md lồng nhau — file **gần file đang sửa nhất** sẽ thắng'
          ]},
          { type: 'diagram', title: 'Hệ thống đích bạn sẽ xây', svg: 'file-tree', caption: '4 tầng: luật (AGENTS.md) · năng lực (skills) · tool (MCP) · ký ức (knowleged) — hoàn thiện ở Bài 7' },
          { type: 'steps', title: 'Bước 1 — Tạo AGENTS.md ở gốc project với 7 mục', steps: [
            { t: 'Overview', d: 'Project làm gì, stack chính, entry points — 3-5 dòng. File đặt ngang hàng README.md (gốc project)' },
            { t: 'Commands', d: 'Dev / test / build / lint — lệnh copy-paste được; agent sẽ tự chạy' },
            { t: 'Style & conventions', d: 'Thứ linter không bắt được: đặt tên, cấu trúc folder, pattern ưu tiên' },
            { t: 'Testing', d: 'Test ở đâu, chạy subset thế nào, "test FAIL → sửa production code, KHÔNG sửa test"' },
            { t: 'Security', d: 'Không đọc .env; không log token; không gọi API ngoài khi chưa hỏi' },
            { t: 'Git & PR', d: 'Format commit, nhánh, điều kiện merge' },
            { t: 'Ngôn ngữ', d: 'Ví dụ: "trả lời tiếng Việt, code + comment tiếng Anh"' }
          ]},
          { type: 'code', title: 'AGENTS.md — mẫu tối thiểu dùng được ngay', file: 'AGENTS.md', content:
'# AGENTS.md — <tên project>\n\n## Overview\nWeb app bán hàng: Next.js 15 + TypeScript + Tailwind.\nEntry: src/app. Package manager: npm.\n\n## Commands\n- Dev: `npm run dev`\n- Test: `npm test` · 1 file: `npx vitest run <file>`\n- Trước khi báo xong: `npm run lint && npm run build`\n\n## Style\n- Functional components + hooks; KHÔNG class component.\n- Import qua alias `@/`.\n- CSS: chỉ design tokens trong `src/styles/tokens.css`.\n\n## Testing\n- Test cạnh file: `*.test.ts`.\n- Test FAIL → sửa production code, KHÔNG được sửa test.\n\n## Security\n- Không đọc/ghi `.env*`. Không log token.\n- Không gọi API ngoài khi chưa được hỏi.\n\n## Git\n- Commit: `type(scope): mô tả` — feat/fix/docs/refactor.\n- Không commit khi lint/test đang fail.\n\n## Ngôn ngữ\n- Trả lời tiếng Việt; code + comment tiếng Anh.\n'
          },
          { type: 'steps', title: 'Bước 2 — Adapter mỏng (chỉ thêm cái bạn cần)', steps: [
            { t: 'VS Code — không cần adapter', d: 'VS Code đọc trực tiếp AGENTS.md (và CLAUDE.md) → lõi chạy ngay. Chỉ thêm `.github/copilot-instructions.md` nếu muốn rule riêng của editor' },
            { t: 'Claude Code → CLAUDE.md (1-5 dòng)', d: 'Nội dung: "@AGENTS.md — đọc và tuân thủ toàn bộ." Nếu bản Claude Code của bạn không hỗ trợ import: copy nguyên nội dung AGENTS.md vào CLAUDE.md (chắc chắn chạy)' },
            { t: 'Antigravity → .agents/rules/agentic.md', d: 'Tạo trong Customizations → Rules → "+ Workspace", chọn chế độ "Always On" — nội dung ngắn trỏ về @AGENTS.md. Rule riêng cho loại file thì chọn chế độ "Glob"' },
            { t: 'Kiểm tra bằng 3 câu test của Bài 2', d: 'Hỏi lại đúng 3 câu đó ở IDE chính — câu trả lời giờ phải theo luật AGENTS.md. Có IDE thứ 2 thì hỏi thêm và so (khuyến khích, không bắt buộc)' }
          ]},
          { type: 'code', title: '2 adapter mẫu', file: '.github/copilot-instructions.md + .agents/rules/agentic.md', content:
'# .github/copilot-instructions.md\n# VS Code — bổ sung cho AGENTS.md\n- Luôn show diff trước khi apply edit > 3 file.\n- Chạy `npm run lint` sau khi sửa xong.\n- Commit message: theo mục Git trong AGENTS.md.\n\n---\n\n# .agents/rules/agentic.md\n# Rule — Antigravity (Always On)\n- Lõi quy tắc: @AGENTS.md\n- Tạo file mới: theo cấu trúc trong AGENTS.md,\n  không thêm dependency khi chưa hỏi.\n- Verify trước khi báo xong: chạy đủ mục Commands.\n'
          },
          { type: 'bullets', title: 'Nghệ thuật viết luật (từ docs VS Code)', icon: '✍️', items: [
            'Ngắn, mỗi điều 1 câu — viết dài là mời agent diễn giải sai',
            'Giải thích **WHY** — có lý do, agent xử đúng cả case lạ chưa gặp',
            'Ví dụ đúng/sai cụ thể > rule trừu tượng',
            'Bỏ thứ linter/formatter đã tự lo — đừng lặp điều hiển nhiên',
            'Bắt đầu 5-10 rule sắc; luật mới chỉ thêm khi vừa **gặp lỗi thật**',
            'Mẹo: nhờ chính agent draft trước ("đọc project rồi đề xuất AGENTS.md") — bạn duyệt + sửa từng mục, nhanh hơn viết tay'
          ]},
          { type: 'compare', title: 'Luật mơ hồ vs luật sắc', cols: ['❌ Mơ hồ', '✅ Sắc'], rows: [
            ['"Viết code cho sạch"', '"Hàm ≤ 40 dòng; tên biến nói mục đích, không viết tắt"'],
            ['"Test kỹ vào"', '"Trước khi báo xong: `npm test` xanh + không còn console.log"'],
            ['"Cẩn thận bảo mật"', '"Không đọc .env*; không commit file > 1MB; không gọi API ngoài khi chưa hỏi"']
          ]},
          { type: 'outcome' },
          { type: 'sources' }
        ],
        outcome: {
          files: [
            { p: 'AGENTS.md', why: 'Lõi luật chung — 7 mục, ≤ 15 rule sắc' },
            { p: 'CLAUDE.md', why: 'Adapter Claude Code (1 dòng trỏ về lõi)' },
            { p: '.github/copilot-instructions.md', why: 'Adapter VS Code (rule riêng của editor)' },
            { p: '.agents/rules/agentic.md', why: 'Adapter Antigravity (Always On, trỏ @AGENTS.md)' }
          ],
          criteria: [
            '3 câu test của Bài 2 ở IDE chính: ≥ 2/3 câu giờ trả lời đúng theo luật (khác rõ so với trước khi có AGENTS.md)',
            'AGENTS.md có đủ 7 mục, phần Commands là lệnh chạy được thật (chưa có build thì ghi rõ "chưa có")',
            'Đếm rule: ≤ 15 điều — mỗi điều đọc lên trả lời được "đạt hay không đạt?"'
          ]
        },
        sources: [
          { n: 'agents.md — format + FAQ', u: 'https://agents.md/', note: 'closest-file-wins, nested AGENTS.md' },
          { n: 'VS Code — Tips viết instruction hiệu quả', u: 'https://code.visualstudio.com/docs/agent-customization/custom-instructions', note: 'ngắn, WHY, ví dụ, bỏ thứ linter lo' },
          { n: 'Antigravity — Rules (4 chế độ)', u: 'https://antigravity.google/docs/rules-workflows', note: 'Manual/Always On/Model/Glob, @ mentions' },
          { n: 'Microsoft — lesson about AGENTS-style instructions', u: 'https://github.com/microsoft/ai-agents-for-beginners', note: 'repo thực chiến đọc được ngay' }
        ]
      },

      /* ============================== K4 ============================== */
      {
        id: 'k4', num: 4, icon: '⚡', accent: '#fbbf24',
        title: 'Skills — đóng gói năng lực',
        sub: 'Một gói kiến thức nằm ngủ — được đánh thức đúng lúc',
        desc: 'SKILL.md + progressive disclosure + slash commands — mở rộng agent không phình context',
        duration: '13 phút', tags: ['Hệ thống', 'Mở rộng'], need: 'Bài 3 — project đã có AGENTS.md',
        slides: [
          { type: 'cover', goals: ['Hiểu progressive disclosure', 'Tạo SKILL.md đầu tiên', 'Skill chạy trên IDE của bạn — biết cách port sang IDE khác'] },
          { type: 'bullets', title: 'Vấn đề: nhồi hết vào luật là tự bắn chân', icon: '🧨', items: [
            'Nhét mọi rule/tool vào context → **tool bloat**: tốn tiền, chậm, agent bối rối (Antigravity docs)',
            'Skill = gói kiến thức **ngủ đông** — chỉ `description` (vài dòng) được nạp thường trực',
            'Khi request khớp description → body mới được load: **progressive disclosure**',
            'Kết quả: thêm 50 năng lực vẫn nhẹ — context chỉ chứa thứ đang cần'
          ]},
          { type: 'diagram', title: 'Progressive disclosure', svg: 'progressive', caption: 'description luôn hiện (rẻ) — body + scripts chỉ load khi task match (đắt nhưng đúng lúc)' },
          { type: 'bullets', title: 'Giải phẫu một skill', icon: '🔬', items: [
            '`SKILL.md` — bắt buộc: frontmatter `name` + `description` (mô tả **KHI NÀO dùng**)',
            'Body — hướng dẫn **CÁCH làm**: checklist, quy trình, ví dụ',
            '`scripts/` — code chạy được, khi skill cần tính toán/chạm file (optional)',
            '`references/` + `assets/` — tài liệu + hình ảnh (optional)'
          ]},
          { type: 'steps', title: 'Tạo skill đầu tiên: code-review (10 phút)', steps: [
            { t: 'Tạo thư mục — chọn đúng 1 theo IDE của bạn', d: 'VS Code: `.github/skills/code-review/` · Antigravity: `.agents/skills/code-review/` · Claude Code: `.claude/skills/code-review/` (trong folder "xưởng")' },
            { t: 'Viết SKILL.md', d: 'Copy mẫu bên dưới — description dùng từ ngữ bạn hay gõ (càng khớp thực tế càng dễ auto), body là checklist 4 bước' },
            { t: 'Test dương', d: 'Nhờ agent review 1 file dài trong project của bạn: "review file <tên file> giúp tôi" — nếu không auto, gọi đích danh: "Dùng skill code-review"' },
            { t: 'Chưa auto-trigger cũng chấp nhận được', d: 'Mục tiêu tối thiểu: skill chạy đúng khi gọi đích danh. Muốn auto: chỉnh description khớp từ ngữ bạn dùng rồi test lại' }
          ]},
          { type: 'code', title: 'SKILL.md — mẫu code-review', file: '.github/skills/code-review/SKILL.md (VS Code — Antigravity/Claude đổi prefix)', content:
'---\nname: code-review\ndescription: Review code changes for bugs, style issues, edge cases\n  and best practices. Use when reviewing PRs, checking code quality,\n  or right after finishing a feature.\n---\n\n# Code Review Skill\n\nKhi review code, theo đúng thứ tự:\n\n## Checklist\n1. **Correctness** — làm đúng việc? input/output khớp spec?\n2. **Edge cases** — rỗng/null/lỗi mạng đã xử lý? boundary?\n3. **Style** — theo convention trong AGENTS.md chưa?\n4. **Performance** — vòng lặp vô ích, query N+1, re-render thừa?\n\n## Cách feedback\n- Nói rõ **cần đổi gì** + **vì sao** + đề xuất thay thế.\n- Xếp mức: 🔴 chặn merge · 🟡 nên sửa · 🟢 gợi ý.\n'
          },
          { type: 'compare', title: 'Skill ≠ Rule ≠ Prompt', cols: ['Loại', 'Trả lời câu hỏi', 'Cơ chế load'], rows: [
            ['Rule (AGENTS.md)', 'LUÔN áp dụng gì?', 'Always-on — mọi request'],
            ['Skill (SKILL.md)', 'LÀM việc X thế nào?', 'Theo description — khi khớp task'],
            ['Prompt (/lệnh)', 'Chạy quy trình Y ngay', 'User gọi tay — 1 chạm']
          ]},
          { type: 'bullets', title: 'Prompt files — quy trình 1 chạm', icon: '🎛️', items: [
            'VS Code: `.github/prompts/<tên>.prompt.md` → gõ `/<tên>` trong chat',
            'Claude Code: `.claude/commands/<tên>.md` → `/tên`',
            'Antigravity: slash commands — tạo trong panel Customizations (xem codelab §3)',
            'Dùng cho quy trình lặp lại: `/review`, `/release-check`, `/new-component`'
          ]},
          { type: 'steps', title: 'Kiểm chứng skill hoạt động (5 phút)', steps: [
            { t: 'Không thấy UI báo "skill đang load"? Kiểm bằng HÀNH VI', d: 'Không phải IDE nào cũng hiển thị — cách chắc chắn: khi nhờ review, agent phải theo đúng checklist 4 bước của skill (nhìn được trong câu trả lời)' },
            { t: 'Test âm', d: 'Hỏi việc KHÔNG liên quan ("dịch câu này") — agent không được kéo checklist review ra; nếu vẫn kéo → description quá rộng, thêm điều kiện "Use when…" cụ thể hơn' },
            { t: 'Ghi kết quả vào notes', d: 'IDE của bạn: auto-trigger hay cần gọi đích danh — cả 2 đều OK, miễn biết cách gọi' }
          ]},
          { type: 'outcome' },
          { type: 'sources' }
        ],
        outcome: {
          files: [
            { p: '.github/skills/code-review/SKILL.md', why: 'VS Code — Antigravity đổi prefix `.agents/skills/…`, Claude Code `.claude/skills/…` (đúng 1 theo IDE của bạn)' },
            { p: '.github/prompts/<tên>.prompt.md', why: 'Prompt 1 chạm — Claude Code: `.claude/commands/<tên>.md`. Nội dung 5-7 dòng: mục tiêu + các bước + output mong muốn' }
          ],
          criteria: [
            'Skill auto-trigger được ở ≥ 1 IDE (hoặc gọi đích danh chạy đúng)',
            'Test âm pass: việc không liên quan → skill không load',
            'Prompt/command chạy được: gõ /tên-lệnh → agent thực hiện đúng quy trình'
          ]
        },
        sources: [
          { n: 'Antigravity — Skills (progressive disclosure)', u: 'https://antigravity.google/docs/skills/', note: '.agents/skills, anatomy: SKILL.md + scripts + references + assets' },
          { n: 'Codelab Antigravity §9 — Code Review Skill', u: 'https://codelabs.developers.google.com/getting-started-google-antigravity#8', note: 'ví dụ skill đầy đủ' },
          { n: 'VS Code — Use Agent Skills', u: 'https://code.visualstudio.com/docs/agent-customization/agent-skills', note: '.github/skills/' },
          { n: 'Claude Code — memory & rules', u: 'https://code.claude.com/docs/en/memory', note: '.claude/rules format (được VS Code đọc chung)' },
          { n: 'Anthropic — Agent Skills', u: 'https://github.com/anthropics/courses', note: 'nguồn gốc format SKILL.md (corpus đã tải)' }
        ]
      },

      /* ============================== K5 ============================== */
      {
        id: 'k5', num: 5, icon: '🔌', accent: '#fb7185',
        title: 'Tool Use & MCP',
        sub: 'Model không biết sự thật — tool mới biết',
        desc: 'Tool use, MCP server, least privilege — nối agent với thế giới thật, an toàn',
        duration: '14 phút', tags: ['Hệ thống', 'Tool'], need: 'Bài 3 · Node.js 18+ nếu dùng npx',
        slides: [
          { type: 'cover', goals: ['Hiểu tool use + MCP', 'Cấu hình 1 MCP server', 'An toàn khi cho agent quyền'] },
          { type: 'bullets', title: 'Vì sao agent cần tool?', icon: '🦾', items: [
            'Model không đọc được file mới nhất của bạn, không query DB của bạn, không biết giá hôm nay',
            'Tool = hàm có schema: agent đọc mô tả → **tự chọn** tool + tham số → nhận **kết quả thật**',
            'Vòng lặp tool use là xương sống của agent đáng tin: Act → quan sát kết quả → bước tiếp',
            '**MCP** (Model Context Protocol) = chuẩn mở: viết 1 tool — mọi IDE dùng được'
          ]},
          { type: 'diagram', title: 'Kiến trúc MCP', svg: 'mcp-flow', caption: 'Agent ↔ MCP server ↔ tools. Server là ranh giới an toàn: nó quyết định agent được chạm gì' },
          { type: 'compare', title: 'Khai báo MCP ở đâu?', cols: ['IDE', 'File cấu hình'], rows: [
            ['VS Code Copilot', '.vscode/mcp.json — section "servers"'],
            ['Claude Code', '.mcp.json ở project root'],
            ['Antigravity', 'Settings → Customizations → MCP · ~/.gemini/config/mcp_config.json'],
            ['Codex', '~/.codex/config.toml (xem docs Codex → MCP cho bản bạn dùng)']
          ]},
          { type: 'code', title: 'Thêm MCP server đầu tiên (mẫu VS Code)', file: '.vscode/mcp.json', content:
'{\n  "servers": {\n    "docs": {\n      "command": "npx",\n      "args": [\n        "-y",\n        "@modelcontextprotocol/server-filesystem",\n        "./docs"\n      ]\n    }\n  }\n}\n'
          },
          { type: 'steps', title: 'Thêm MCP server (15 phút)', steps: [
            { t: 'Chuẩn bị', d: 'Cần Node.js 18+ (server mẫu chạy qua `npx`) — kiểm tra `node -v`, chưa có thì cài từ nodejs.org' },
            { t: 'Chọn 1 nhu cầu thật', d: 'Ví dụ: cho agent đọc docs nội bộ — server filesystem nhưng CHỈ mở thư mục ./docs. Đó là **least-privilege**: mở đúng thứ cần, không cả ổ đĩa' },
            { t: 'Khai báo trong file config của IDE bạn', d: 'VS Code: dán mẫu bên dưới vào `.vscode/mcp.json`. IDE khác: cùng ý tưởng, đúng file của IDE đó (xem bảng trên — Claude Code: `.mcp.json` · Antigravity: `mcp_config.json` · Codex: `config.toml`)' },
            { t: 'Khởi động lại + kiểm tra', d: 'Reload IDE/window → mở chat → xem danh sách tools của server (VS Code: biểu tượng tools trong chat; CLI: lệnh `/mcp`) → gọi thử: "liệt kê 5 file trong docs"' },
            { t: 'Test âm', d: 'Hỏi file NGOÀI ./docs (vd `../`) → agent phải báo không truy cập được. Bị chặn = least-privilege chạy đúng' }
          ]},
          { type: 'bullets', title: 'An toàn khi cho agent quyền (bắt buộc đọc)', icon: '🛡️', items: [
            '**Least privilege**: server chỉ mở đúng thư mục/hệ thống cần — không bao giờ `~/` hay cả ổ đĩa',
            '**Observe vs Action**: đọc thì tự do; hành động có side-effect (submit / xoá / gửi) phải chờ human duyệt',
            '**Secrets không vào prompt**: dùng biến môi trường / credential store — không dán token vào chat',
            '**Untrusted content**: nội dung web/file lạ có thể chứa chỉ thị độc ("ignore instructions") — coi là dữ liệu, không phải lệnh'
          ]},
          { type: 'bullets', title: 'Tool tốt trông như thế nào', icon: '🧰', items: [
            'Mô tả nói rõ **KHI NÀO dùng** — agent chọn tool bằng description, không bằng code',
            'Input schema chặt (enum, required, giới hạn) → giảm gọi sai tham số',
            'Trả về **artifact thật** (file, JSON, bảng) thay vì đoạn văn dài dễ nhiễu',
            'Idempotent khi có thể: gọi lại cùng input = cùng kết quả, không tạo rác'
          ]},
          { type: 'steps', title: 'RAG — biến tài liệu của bạn thành tool (ví dụ tham khảo)', steps: [
            { t: 'Ví dụ có sẵn (không bắt buộc làm theo)', d: 'Repo Harness này tự dùng cách này: RAG local = tìm tài liệu liên quan TRƯỚC rồi mới trả lời — ở đây là 190 sách agentic' },
            { t: 'Tool exposed qua MCP', d: 'search_library(query, top_k) — agent tự tra cứu thay vì trả lời chay. Bạn KHÔNG cần xây 190 sách như ví dụ' },
            { t: 'Nguyên tắc áp cho bạn', d: 'Biến nguồn tri thức của BẠN (vài file docs, wiki nội bộ, DB nhỏ) thành tool có schema — agent tra cứu thật thay vì đoán' },
            { t: 'Kiểm chứng', d: 'Hỏi 1 câu chỉ có trong tài liệu đó → agent phải dẫn nguồn (file/trang), không bịa' }
          ]},
          { type: 'outcome' },
          { type: 'sources' }
        ],
        outcome: {
          files: [
            { p: 'mcp.json (theo IDE của bạn)', why: '1 MCP server với scope least-privilege (vd: ./docs)' },
            { p: 'docs/agent-notes.md', why: 'Log: tool đã gọi + kết quả + test âm (bị chặn đúng chỗ nào)' }
          ],
          criteria: [
            'Agent gọi được ≥ 1 tool qua MCP và trả kết quả thật (ghi câu hỏi + kết quả vào notes)',
            'Test âm pass: truy cập ngoài scope bị chặn (chụp lại câu trả lời bị chặn)',
            'Đọc lại config: scope KHÔNG phải cả ổ đĩa; nếu có token thì để ở biến môi trường — không nằm plain text trong config hay chat'
          ]
        },
        sources: [
          { n: 'Model Context Protocol — spec & servers', u: 'https://modelcontextprotocol.io/', note: 'chuẩn mở của Anthropic, 2024' },
          { n: 'Antigravity — MCP config', u: 'https://antigravity.google/docs/mcp/', note: '~/.gemini/config/mcp_config.json' },
          { n: 'Codelab Antigravity §6 — MCP Servers', u: 'https://codelabs.developers.google.com/getting-started-google-antigravity#5', note: 'one-click add + file format' },
          { n: 'Microsoft — AI Agents for Beginners (MCP lessons)', u: 'https://github.com/microsoft/ai-agents-for-beginners', note: 'MCP/A2A/NLWeb protocols' },
          { n: 'Anthropic courses — Tool Use', u: 'https://github.com/anthropics/courses', note: 'notebook tool use đầy đủ (corpus đã tải)' }
        ]
      },

      /* ============================== K6 ============================== */
      {
        id: 'k6', num: 6, icon: '🧪', accent: '#60a5fa',
        title: 'Verify & Evals',
        sub: 'Build xanh ≠ đạt — đo HOW WELL, không chỉ WHETHER',
        desc: 'Rubric trước · evals phân tầng · bắt agent dán bằng chứng trước khi báo xong',
        duration: '13 phút', tags: ['Chất lượng', 'Evals'], need: 'Bài 3 — dùng lại AGENTS.md để thêm rule',
        slides: [
          { type: 'cover', goals: ['Viết rubric (bảng tiêu chí) trước khi chấm', 'Phân tầng evals: component (từng bước) · E2E (cả scenario)', 'Bắt agent chứng minh bằng tool'] },
          { type: 'bullets', title: '"Xong" nghĩa là gì?', icon: '🎯', items: [
            'Build/test/lint xanh = **WHETHER** (chạy được) — chưa nói gì về **HOW WELL** (tốt đến đâu)',
            'Output mở (UI, bài viết, plan, hành động agent) không đo được bằng pass/fail',
            'Evals = thước đo chất lượng: **rubric viết trước** → component evals (chấm từng bước đúng chưa) → E2E evals (chấm cả scenario từ đầu đến cuối)',
            '"Trông ổn" không phải eval — model tự khen mình là thiên vị có hệ thống'
          ]},
          { type: 'bullets', title: 'Self-report ≠ bằng chứng', icon: '🗣️', items: [
            'Model tự tin nói "đã kiểm tra rồi" mà chưa từng chạy — chuyện bình thường, không phải lỗi hiếm',
            'Tự soi lại output (self-critique) không nâng độ chính xác — nhiều nghiên cứu cho thấy còn *giảm*',
            'Chuẩn vàng: **fresh evidence từ tool** — output lệnh, file diff, screenshot, số đo',
            'Trong AGENTS.md ghi thẳng: "trước khi báo xong, chạy X và dán kết quả"'
          ]},
          { type: 'diagram', title: 'Vòng eval', svg: 'eval-loop', caption: 'Rubric trước → component evals → E2E evals → error analysis → fix pattern (không fix instance)' },
          { type: 'steps', title: 'Viết rubric cho 1 task (10 phút)', steps: [
            { t: 'Chọn 1 output THẬT', d: 'Lấy chính kết quả một bài tập trước (file code-review ở Bài 4, kết quả gọi MCP ở Bài 5) — hoặc nhờ agent làm 1 việc nhỏ rồi chấm nó' },
            { t: 'Viết 5 tiêu chí NHÌN THẤY được', d: '"trang trả lời 3 câu hỏi trong 10 giây" · "0 lỗi console" · "375px không tràn ngang" · …' },
            { t: 'Chấm 0-2 từng tiêu chí', d: '0 = fail · 1 = một phần · 2 = đạt. Tổng < 7/10 → chưa xong, trả lại agent' },
            { t: 'Lưu vào docs/evals.md', d: 'Lần sau agent tự chấm theo — có mốc so sánh để phát hiện regression' }
          ]},
          { type: 'bullets', title: 'Error analysis — sửa pattern, không sửa vết', icon: '🔬', items: [
            'Gặp 1 lỗi → fix ngay. **Gặp 2 lỗi cùng loại → dừng lại, tìm pattern**',
            'Sửa từng ca lẻ = chữa triệu chứng: mỗi lần sửa một kiểu, "bug chị em" cùng loại vẫn còn nguyên',
            'Pattern lặp qua nhiều task = **thiếu sót của hệ thống** (thiếu rule / tool / test) → nâng cấp harness',
            'Ví dụ: agent hay quên chạy test → đừng nhắc từng lần — thêm rule verify vào AGENTS.md'
          ]},
          { type: 'compare', title: 'Claim rỗng vs claim có chứng cứ', cols: ['❌ Rỗng', '✅ Chứng cứ'], rows: [
            ['"Đã xong nhé, chạy ngon!"', '"`npm test` 12/12 pass · build OK · screenshot 375px ở verify/"'],
            ['"Tôi đã kiểm tra logic"', '"Chạy 3 case biên: rỗng / null / mạng lỗi — output từng case ở đây"'],
            ['"Chắc không ảnh hưởng chỗ khác"', '"grep thấy 8 chỗ gọi — chạy full suite: không hồi quy"']
          ]},
          { type: 'bullets', title: 'Vòng verify chuẩn — dán vào AGENTS.md', icon: '🔁', items: [
            '1) Chạy đúng lệnh verify của task (build / test / lint + eval đặc thù)',
            '2) FAIL → đọc lỗi → fix → chạy lại. **Tối đa 3 vòng** cho một loại lỗi',
            '3) Vẫn fail sau 3 vòng → **dừng, báo human** kèm log — không cố đấm ăn xôi',
            '4) Done = dán evidence vào câu trả lời: lệnh + kết quả + file thay đổi'
          ]},
          { type: 'outcome' },
          { type: 'sources' }
        ],
        outcome: {
          files: [
            { p: 'docs/evals.md', why: 'Rubric 5 tiêu chí cho output thật + cách chấm 0-2 — agent sẽ đọc file này khi nhận task' },
            { p: 'AGENTS.md (cập nhật)', why: 'Thêm 2 rule: "Done = dán evidence (lệnh + kết quả)" · "Khi nhận task: đọc docs/evals.md và tự chấm theo rubric"' }
          ],
          criteria: [
            'Rubric viết TRƯỚC khi chấm — có ≥ 5 tiêu chí nhìn thấy/đếm được',
            'Đã chấm 1 output thật và trả lại agent nếu < 7/10',
            'Test rule: hỏi "xong chưa?" khi chưa chạy verify → agent phải chạy lệnh (không trả lời suông). Nếu vẫn nói suông → rule chưa hiệu lực: kiểm tra lại vị trí AGENTS.md + IDE đọc đúng file (ôn Bài 3)'
          ]
        },
        sources: [
          { n: 'Sách nội bộ: books/Andrew-Ng-Agentic-AI-Playbook-2026-Distilled.md', u: '', note: 'Evals + error analysis — "single biggest predictor"' },
          { n: 'arXiv — LLMs Cannot Self-Correct Reasoning Yet (Huang et al.)', u: 'https://arxiv.org/abs/2310.01798', note: 'self-critique giảm accuracy' },
          { n: 'DeepLearning.AI — Evaluating AI Agents (Arize)', u: 'https://www.deeplearning.ai/short-courses/', note: 'khóa eval agentic' },
          { n: 'HF Agents Course — Bonus Unit 2: Observability & Evaluation', u: 'https://huggingface.co/learn/agents-course', note: 'eval trong thực chiến' },
          { n: 'Nội bộ: docs/knowleged.md (KN-023, KN-037)', u: '', note: 'fresh evidence ngoài model · Evals Gate' }
        ]
      },

      /* ============================== K7 ============================== */
      {
        id: 'k7', num: 7, icon: '🎓', accent: '#e879f9',
        title: 'Vòng lặp tự học + Tốt nghiệp',
        sub: 'Hệ thống tự tiến hoá — từ bug hôm nay thành luật ngày mai',
        desc: 'Bug → KN → luật sắc hơn, aggregate thay vì fix lẻ + checklist tốt nghiệp 8 mục',
        duration: '14 phút', tags: ['Bền vững', 'Hoàn thiện'], need: 'Bài 3–6 — đủ 4 tầng hệ thống',
        slides: [
          { type: 'cover', goals: ['Biến mỗi bug thành luật', 'Gom lỗi cùng loại — đừng fix từng vết', 'Chạy checklist tốt nghiệp'] },
          { type: 'bullets', title: 'Đừng để lỗi trôi', icon: '📓', items: [
            'Bug hôm nay = luật ngày mai — nếu được ghi lại **ngay lúc còn nóng**',
            'Mỗi bug 1 entry trong `docs/knowleged.md` (mã **KN-XXX** tăng dần): Triệu chứng → Nguyên nhân gốc → Cách sửa → **Cách phòng tránh**',
            'Vòng làm việc: agent gặp lỗi → tự log draft · fix xong → đề xuất KN · duyệt → dán vào file',
            'Bài học phải **áp dụng được**: ghi cách phòng tránh cụ thể (rule / lệnh / checklist), không "cẩn thận hơn nhé"'
          ]},
          { type: 'diagram', title: 'Vòng lặp tự học', svg: 'learning-loop', caption: 'Mỗi vòng bug → fix → learn làm luật sắc hơn — hệ thống tiến hoá từng commit, không phải từng năm' },
          { type: 'code', title: 'Mẫu một entry KN', file: 'docs/knowleged.md', content:
'### KN-042 — Agent quên chạy test trước khi báo xong\n- **Ngày:** 2026-09-12 · **Severity:** major · **Tags:** process, verify\n- **Triệu chứng:** Agent báo "đã xong" nhưng CI đỏ.\n- **Nguyên nhân gốc:** AGENTS.md thiếu rule verify;\n  agent tối ưu "trả lời nhanh" thay vì "trả lời đúng".\n- **Cách sửa:** Thêm mục Commands bắt buộc; yêu cầu dán output lệnh.\n- **Cách phòng tránh:** Trong AGENTS.md ghi rõ:\n  "Done = dán kết quả test." — rule mới chỉ thêm khi gặp lỗi thật.\n'
          },
          { type: 'bullets', title: 'Gom lỗi cùng loại — đừng fix từng vết', icon: '🧬', items: [
            'Sửa từng lỗi lẻ = dạy agent **thuộc đáp án**, không dạy phương pháp',
            'Lỗi lặp ở nhiều task khác nhau = tín hiệu **thiếu sót hệ thống** (rule / tool / test chưa đủ)',
            'Cách làm: gom lỗi cùng loại → sửa 1 lần ở tầng luật/skill/tool → verify bằng task **MỚI** chưa từng gặp',
            'Ghi lại cả phương án đã LOẠI + vì sao loại — để không thử lại đường cụt cũ'
          ]},
          { type: 'bullets', title: 'Tự cải thiện an toàn', icon: '⚖️', items: [
            'Học từ cái sai có gác cổng: phân tích failure → rút pattern → **thử trên task mới** → đo trước khi áp',
            'Đừng học từ câu trả lời "tự tin nhưng sai" — bắt chước nó là đường hỏng nhanh nhất',
            'Giữ **uncertainty**: agent nên nói "không chắc" khi không chắc — đừng phạt sự trung thực đó',
            'Đo bằng task lạ, không bằng task quen — "chạy lại được bài cũ" ≠ "đã giỏi hơn"'
          ]},
          { type: 'diagram', title: 'Hệ thống của bạn — hoàn chỉnh', svg: 'file-tree', svgMode: 'recap', caption: '4 tầng: luật · năng lực · tool · ký ức — cộng với evals ở Bài 6, đây là Agent Harness cá nhân' },
          { type: 'bullets', title: 'Checklist tốt nghiệp — 8 mục', icon: '✅', items: [
            '☐ AGENTS.md tồn tại · đủ 7 mục · ≤ 15 rule sắc',
            '☐ Lõi AGENTS.md hoạt động trong IDE chính (IDE thứ 2 = điểm cộng)',
            '☐ 1 skill auto-trigger + 1 slash command hoạt động',
            '☐ 1 MCP server least-privilege — test dương/âm đã pass',
            '☐ docs/evals.md có rubric + đã chấm 1 output thật',
            '☐ AGENTS.md có rule verify — agent dán evidence trước khi báo xong',
            '☐ docs/knowleged.md có ≥ 1 KN thật từ lỗi của chính bạn',
            '☐ Đã dùng hệ thống cho ≥ 1 task thật end-to-end'
          ]},
          { type: 'bullets', title: 'Bước tiếp — đi đường dài', icon: '🚀', items: [
            'Nhân bản sang project mới: copy `AGENTS.md` + folder luật của IDE bạn (`.github/` hoặc `.claude/` hoặc `.agents/`) — hệ thống đi theo bạn',
            'Học sâu: Hugging Face Agents Course (free, 4 units) · Microsoft 18 lessons · Berkeley MOOC — corpus đã tải trong repo này',
            'Tra cứu offline: RAG local 190 sách agentic — `docs/ai-agentic-courses/full/` (200 files) + `www/library/`',
            'Định kỳ (mỗi đợt làm việc vài tuần): đọc lại knowleged.md, gộp rule trùng, xoá rule chết — luật cũng cần refactor'
          ]},
          { type: 'outcome' },
          { type: 'sources' }
        ],
        outcome: {
          files: [
            { p: 'docs/knowleged.md', why: '≥ 1 KN thật từ lỗi của bạn — theo mẫu 5 mục' },
            { p: 'AGENTS.md (cập nhật lần cuối)', why: 'Thêm rule học từ lỗi: ghi KN khi bug lặp ≥ 2 lần cùng loại' }
          ],
          criteria: [
            'Chạy đủ checklist tốt nghiệp 8 mục — mục nào chưa đạt ghi rõ lý do',
            'Chạy trọn 1 vòng tự học: gặp lỗi thật → ghi KN-XXX → thêm/cập nhật 1 rule trong AGENTS.md → lần sau gặp tình huống tương tự, agent không lặp lại lỗi đó',
            'Đã dùng hệ thống cho 1 task thật: viết mô tả ngắn 5 dòng (mục tiêu · phạm vi · không làm gì · tiêu chí xong) → làm → verify có evidence'
          ]
        },
        sources: [
          { n: 'Nội bộ: docs/knowleged.md (mẫu KN-001…KN-040)', u: '', note: 'format Triệu chứng → Nguyên nhân → Cách sửa → Cách phòng tránh' },
          { n: 'arXiv — Ecdysis: aggregated failure diagnosis', u: 'https://arxiv.org/abs/2609.11677', note: 'cross-instance aggregate (KN-034)' },
          { n: 'arXiv — Negative Self-Distillation', u: 'https://arxiv.org/abs/2609.11699', note: 'học từ flawed traces có gate (KN-035)' },
          { n: 'Anthropic — Building Effective Agents', u: 'https://www.anthropic.com/engineering/building-effective-agents', note: 'simplicity first' },
          { n: 'HF Agents Course — Unit 4: Final project', u: 'https://huggingface.co/learn/agents-course', note: 'bài tập tổng hợp tự chọn' }
        ]
      }
    ]
  };
})();
