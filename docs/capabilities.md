# Capabilities — Toàn bộ khả năng của hệ thống

> Harness v2 + Registry tháo lắp wise — VS Code Copilot Chat. Mọi customization đều là plugin.

---

## Mục lục

1. [Harness v2 Pipeline](#1-harness-v2-pipeline)
2. [Skills](#2-skills)
3. [Instructions (Rules)](#3-instructions-rules)
4. [Agents](#4-agents)
5. [Prompts (Slash Commands)](#5-prompts-slash-commands)
6. [Hooks](#6-hooks)
7. [Harness Registry — Tháo lắp](#7-harness-registry--tháo-lắp)
8. [Presets](#8-presets)
9. [Templates & Scaffold](#9-templates--scaffold)
10. [Product Quality Standard](#10-product-quality-standard)
11. [Memory & Trace](#11-memory--trace)
12. [YUNIE + STATUS (www/ → GitHub Pages)](#12-yunie--status-www--github-pages)
13. [Demo — Focus Flow](#13-demo--focus-flow)
13. [Ma trận khả năng](#13-ma-trận-khả-năng)
14. [Lệnh tổng hợp](#14-lệnh-tổng-hợp)

---

## 1. Harness v2 Pipeline

**Triết lý:** `Process > Model` — dù GPT/Claude/Gemini đều chạy cùng pipeline, chất lượng đến từ quy trình.

**Pipeline 8 phase bắt buộc:**

```
Idea → Explore → Clarify → PRD → Design → Plan → Implement → Polish → Verify → Done
```

| Phase | Mục tiêu | Output | Subagent | Bỏ được? |
|-------|----------|--------|----------|----------|
| Explore | Hiểu codebase + context | Tóm tắt stack, file liên quan, pattern | Explore | ❌ |
| Clarify | Làm rõ mơ hồ | Câu hỏi + giả định chốt | — (vscode_askQuestions) | Rút gọn nếu rõ |
| PRD | Biến ý tưởng thành spec | `.agent/plans/<slug>/prd.md` | Plan | ❌ (mini 5 dòng cũng phải có) |
| Design | Định nghĩa giao diện đẹp | `.agent/plans/<slug>/design.md` | Designer | ❌ |
| Plan | Chia nhỏ để code | `.agent/plans/<slug>/plan.md` + todos | Plan | ❌ |
| Implement | Code todo-driven | Files code | Implement | ❌ |
| Polish | Làm đẹp + UX | Responsive, states, animation, a11y | Polish | ❌ |
| Verify | Đảm bảo chất lượng | build/test/lint pass + visual check | Verify | ❌ |

- **Todo-driven:** Mọi task >2 bước phải `manage_todo_list` (5-10 todos, 3-7 từ/todo), 1 `in-progress` tại 1 thời điểm, `get_errors` sau mỗi edit.
- **Rút gọn cho task nhỏ (1-2 file):** Explore(quick) → Clarify(1 câu) → PRD mini → Design mini → Plan(3 todos) → Implement → Polish → Verify. Không bỏ Polish.
- **Verify loop:** Fail → fix → re-run, max 3 lần/check. Chỉ `task_complete` khi PASS.

Chi tiết: `.github/copilot-instructions.md` · `.github/skills/claude-harness/SKILL.md` · `docs/harness-flow.md`

---

## 2. Skills

Skills là workflow on-demand, agent chỉ load khi `description` match task (progressive loading).

| Skill | Mô tả | Khi nào dùng | Slash |
|-------|-------|--------------|-------|
| `claude-harness` | Harness v2 Idea→Product pipeline | Mọi task code, ý tưởng nhỏ → product, cần UI đẹp | `/claude-harness` |
| `skill-registry` | Tháo lắp skill như plugin | Cài/gỡ/bật/tắt skill từ GitHub | `/skill-registry` |
| `custom-registry` | Tháo lắp toàn bộ (skill/instruction/agent/prompt/hook) + preset + scaffold | Quản lý rule, preset, tạo mới customization | `/custom-registry` |

- **Vị trí:** `.github/skills/<name>/SKILL.md` (folder phải khớp `name` trong frontmatter)
- **Tháo lắp:** `harness-manager disable skill <name>` → move sang `.github/skills/.disabled/<name>`
- **Cài từ GitHub:** `harness-manager install skill owner/repo --path skills/foo --ref main`
- **Tạo mới:** `harness-manager create skill my-skill` (từ template)

---

## 3. Instructions (Rules)

Instructions là rule luôn-on hoặc theo `applyTo` glob, agent tự load khi file đang edit match pattern.

| Instruction | `applyTo` | Mô tả |
|-------------|-----------|-------|
| `harness-workflow` | `**` | Enforce Harness v2 pipeline cho mọi coding task |
| `product-quality` | `**/*.{html,css,tsx,jsx,vue,js,ts}` | Chuẩn UI/UX: design system, responsive, states, animation, a11y + **locale-owned + token invariant** (DeepSeek) |
| `skill-usage` | `**` | Wise skill usage — chỉ load khi description match |
| `custom-registry` | `**` | Tháo lắp toàn bộ customizations như plugin |
| `knowleged` | `**` | BẮT BUỘC đọc `docs/knowleged.md` trước mọi task — bài học bug, anti-patterns |
| `plugin-seam` | `**` | **Everything is a Plugin** — capability seam (Definition/Provider/Consumer), `ctx.effect`, patch layers, events (DeepSeek Cordis) |
| `locale-i18n` | `**/*.{html,css,tsx,jsx,vue,js,ts}` | **Locale-owned copy** — no hardcoded text, typed dictionaries, `t()` helper (DeepSeek) |

- **Vị trí:** `.github/instructions/*.instructions.md`
- **Frontmatter:** `description` (bắt buộc, keyword-rich) + `applyTo` (glob, tránh `**` nếu không global)
- **Tháo lắp:** `harness-manager disable instruction product-quality` → move sang `.github/instructions/.disabled/`
- **Tạo mới:** `harness-manager create instruction my-rule` → sửa `description`/`applyTo` là xong
- **Cài từ GitHub:** `harness-manager install instruction owner/repo --path instructions/nextjs.instructions.md`

---

## 4. Agents

Agents là subagent chuyên vai, delegate để isolate context và restrict tools.

| Agent | Mô tả | Tools | Khi nào delegate |
|-------|-------|-------|------------------|
| `Explore` | Read-only codebase exploration | read, search, web, todo | Cần hiểu project trước khi code |
| `Plan` | Architecture + task breakdown | read, search, todo, web | Cần thiết kế plan, chia todos |
| `Designer` | Design system, wireframe, states | read, search, web, todo | Cần giao diện đẹp trước khi code |
| `Implement` | Todo-driven code changes | read, edit, search, execute, todo | Thực thi plan todos |
| `Polish` | Responsive, states, animation, a11y | read, edit, search, execute | Sau implement, trước verify |
| `Verify` | Build/test/lint + fix loop | read, search, execute, edit, todo | Validate trước khi done |
| `YUNIE` | **System chatbot** — hiểu toàn bộ Harness, thực thi task hệ thống, kiểm tra tình trạng, cập nhật `www/` STATUS + GitHub Pages | read, edit, search, execute, todo, web, agent | Khi user nói `yunie`, `chatbot`, `status`, `kiểm tra hệ thống`, `www`, `github pages` |

- **Vị trí:** `.github/agents/*.agent.md` (hiện 7: Explore, Plan, Designer, Implement, Polish, Verify, **YUNIE**)
- **Frontmatter:** `description` (khi nào delegate, keyword-rich `Use when ...`) + `tools` (minimal) + `user-invocable` (`false` cho subagent, `true` cho YUNIE để gọi trực tiếp) — **không pin `model:`** (model-agnostic, xem `copilot-instructions.md`)
- **Tháo lắp:** `harness-manager disable agent designer` → move sang `.github/agents/.disabled/`
- **Tạo mới:** `harness-manager create agent my-agent`
- **YUNIE đặc biệt:** `user-invocable: true`, hiểu toàn bộ hệ thống (`registry.json`, `presets`, `plans`, `www/status.json`), tự regenerate `www/status.json` sau mỗi thay đổi hệ thống. Gọi: `@YUNIE kiểm tra hệ thống` hoặc delegate như subagent.

---

## 5. Prompts (Slash Commands)

Prompts là task template 1 lần, gõ `/` trong chat để chạy.

| Prompt | Mô tả | Input |
|--------|-------|-------|
| `/harness` | Full Harness v2 pipeline 8 phase | `task` — mô tả task/ý tưởng (1 câu cũng được) |
| `/product` | Idea→Product rút gọn cho ý tưởng nhỏ | `idea` — 1 câu ý tưởng (vd: "web pomodoro") |
| `/plan` | Chỉ tạo PRD + Design + Plan (chưa code) | `task` |
| `/implement` | Chỉ implement plan đã duyệt (todo-driven) | `task` (tên plan) |
| `/polish` | Chỉ polish UI/UX theo product-quality | `target` (view/component, để trống = toàn bộ) |
| `/verify` | Chỉ verify build/test/lint + visual | `checks` (để trống = auto-detect) |

- **Vị trí:** `.github/prompts/*.prompt.md`
- **Frontmatter:** `description` + `agent` + `tools` + `argument-hint` — **không pin `model:`** (model-agnostic)
- **Tháo lắp:** `harness-manager disable prompt product` → move sang `.github/prompts/.disabled/`
- **Tạo mới:** `harness-manager create prompt my-prompt`

---

## 6. Hooks

Hooks là deterministic shell commands chạy ở lifecycle events (enforce, không phải guidance).

| Hook file | Events | Mô tả |
|-----------|--------|-------|
| `hooks.json` | `PostToolUse`, `Stop` | Echo check `get_errors` sau edit, ensure verify trước done |

- **Vị trí:** `.github/hooks/*.json`
- **Format:** `{ "hooks": { "PreToolUse": [{ "type": "command", "command": "...", "timeout": 10 }] } }`
- **Events:** `SessionStart`, `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `PreCompact`, `SubagentStart`, `SubagentStop`, `Stop`
- **Tháo lắp:** `harness-manager disable hook hooks` → move sang `.github/hooks/.disabled/` (folder tự tạo khi disable lần đầu — hiện chưa có `.disabled/`)
- **Tạo mới:** `harness-manager create hook my-hook`

---

## 7. Harness Registry — Tháo lắp

**Registry v2:** `.github/harness/registry.json` — source of truth cho mọi loại (commit vào git). Đồng bộ `.github/skills/registry.json` v1 cho skills.

**CLI chính:** `node .github/harness/scripts/harness-manager.mjs` (Node 18+, không deps, `GITHUB_TOKEN` optional)

| Lệnh | Mô tả | Ví dụ |
|------|-------|-------|
| `list [--type <type>]` | Liệt kê per type | `list --type instruction` |
| `status` | Tóm tắt enabled/disabled per type | `status` |
| `enable <type> <name>` | Bật (move .disabled → enabled) | `enable instruction product-quality` |
| `disable <type> <name>` | Tắt (move enabled → .disabled) — không xóa | `disable agent designer` |
| `uninstall <type> <name>` | Gỡ hẳn (xóa file + registry) | `uninstall prompt my-prompt` |
| `install <type> <owner/repo> [--path ...] [--ref main] [--name ...] [--force]` | Cài từ GitHub | `install instruction owner/repo --path instructions/nextjs.instructions.md` |
| `install <type> --local <path> [--name ...] [--force]` | Cài từ local (test offline) | `install skill --local ./my-skill` |
| `create <type> <name>` | Scaffold mới từ template | `create instruction my-rule` |
| `preset list` | Liệt kê presets | `preset list` |
| `preset apply <name>` | Áp preset (bật/tắt theo preset) | `preset apply web-product` |
| `preset save <name>` | Lưu bộ đang bật thành preset mới | `preset save my-preset` |
| `sync` | Cài lại tất cả từ GitHub sau khi clone | `sync` |
| `help` | Trợ giúp | `help` |

**Types:** `skill | instruction | agent | prompt | hook`

**Cơ chế:**
- `disable` = `fs.rename` file/folder → `.disabled/` + `registry.enabled=false` (không xóa)
- `enable` = move ngược lại
- `uninstall` = `fs.rm` + xóa khỏi registry
- `install` = `fetch` GitHub API/raw (fallback) → ghi file → cập nhật registry
- `create` = copy từ `.github/harness/templates/` → ghi file → cập nhật registry

**Tương thích:** `skill-registry` (`skill-manager.mjs`) vẫn dùng được cho `skill` — là wrapper. Dùng `harness-manager` cho mọi loại.

Chi tiết: `.github/skills/custom-registry/SKILL.md` (`/custom-registry`) · `.github/instructions/custom-registry.instructions.md` · `.github/harness/README.md`

---

## 8. Presets

Presets là bộ bật/tắt cho từng loại dự án — 1 lệnh áp đúng bộ.

| Preset | File | Dùng khi | Bật | Tắt |
|--------|------|----------|-----|-----|
| `full` | `presets/full.json` | Muốn tất cả | tất cả (7 agents gồm YUNIE, 7 instructions gồm `plugin-seam`+`locale-i18n`) | — |
| `web-product` | `presets/web-product.json` | Web cần giao diện đẹp | tất cả (giống `full`, gồm `plugin-seam`+`locale-i18n`) | — |
| `api-minimal` | `presets/api-minimal.json` | API/script gọn nhẹ | harness core + YUNIE | `product-quality`, `plugin-seam`, `locale-i18n`, `designer`, `polish`, `product`/`polish` prompts |

> **Lưu ý:** `web-product`/`full` bật tất cả gồm 2 instructions mới học từ DeepSeek (`plugin-seam`, `locale-i18n`). `api-minimal` tắt cả 3 instructions web (`product-quality`, `plugin-seam`, `locale-i18n`) + `designer`/`polish` để gọn cho API/script, nhưng **vẫn bật YUNIE**.

```bash
node .github/harness/scripts/harness-manager.mjs preset apply web-product
node .github/harness/scripts/harness-manager.mjs preset apply api-minimal
node .github/harness/scripts/harness-manager.mjs preset save my-preset  # lưu bộ hiện tại
```

- **Format:** JSON `{ name, description, skills: {name: bool}, instructions: {...}, agents: {...}, prompts: {...}, hooks: {...} }`
- **Sửa tay được:** Mở `.github/harness/presets/*.json` sửa trực tiếp.
- **Apply:** Loop qua registry, `enable`/`disable` theo preset, warn nếu thiếu file, báo `X enabled, Y disabled, Z skipped`.

---

## 9. Templates & Scaffold

Templates để `create` nhanh, không copy tay.

| Template | File | Tạo ra |
|----------|------|--------|
| `instruction.md` | `templates/instruction.md` | `.github/instructions/<name>.instructions.md` |
| `agent.md` | `templates/agent.md` | `.github/agents/<name>.agent.md` |
| `prompt.md` | `templates/prompt.md` | `.github/prompts/<name>.prompt.md` |
| `skill-SKILL.md` | `templates/skill-SKILL.md` | `.github/skills/<name>/SKILL.md` |
| `hook` (inline) | — | `.github/hooks/<name>.json` |

```bash
node .github/harness/scripts/harness-manager.mjs create instruction my-rule
# → file mới đã có frontmatter chuẩn, sửa description/applyTo là xong
```

- **Placeholder:** `{{NAME}}`, `{{TITLE}}` được thay khi scaffold.
- **Sau create:** Sửa `description` (keyword-rich, `Use when ...`) và `applyTo`/`tools` cho đúng, rồi dùng ngay.

---

## 10. Product Quality Standard

Áp dụng cho mọi web UI — nếu chưa đạt thì chưa xong, phải qua Polish.

**Design System (CSS variables):**
- Palette 3-5 màu (primary, secondary, accent, neutral, surface)
- Typography 1-2 font (Inter + Plus Jakarta Sans), scale xs→2xl
- Spacing 4/8px, radius 8-22px, shadow sm/md/lg

**Layout & Responsive:**
- Breakpoints 375 / 768 / 1280 — không vỡ
- Grid/Flex, container max 1120-1280, image có size/aspect-ratio

**Component States:**
- `default` / `hover` (translateY -1px + shadow) / `focus` (outline 2px primary) / `active` (scale .98) / `disabled` (opacity .5) / `loading` (spinner/skeleton)

**UX States:**
- `loading` (skeleton/spinner) / `empty` (illustration + message + CTA) / `error` (message + Retry) / `success` (toast 3s + confetti)

**Animation:**
- 150-300ms ease, chỉ `transform`/`opacity` (GPU), không giật

**Accessibility:**
- Contrast ≥4.5:1, keyboard (Tab, Space, R, Enter), `aria-label` cho icon button, semantic HTML

**Code:**
- Không inline style bừa bãi — dùng CSS variables / Tailwind / module
- **Locale-owned copy** — không hardcode text, mọi copy qua `t()` / `locales/vi.ts` (xem `locale-i18n.instructions.md`)
- **Token invariant** — `UI-visible ⟺ token` (như `Model-visible ⟺ logged` của DeepSeek): mọi giá trị nhìn thấy phải qua token
- Không layout shift

**DeepSeek Invariants (mới):**
- `UI-visible ⟺ token` + `Seam = 3 vai` + `Patchable` — xem `product-quality.instructions.md` §8-9 và `plugin-seam.instructions.md`

Chi tiết: `.github/instructions/product-quality.instructions.md` · `.github/instructions/plugin-seam.instructions.md` · `.github/instructions/locale-i18n.instructions.md` · Checklist trong `docs/harness-flow.md`

---

## 11. Memory & Trace

| Nơi | Dùng để |
|-----|---------|
| `.agent/plans/<slug>/prd.md` | PRD trace |
| `.agent/plans/<slug>/design.md` | Design trace |
| `.agent/plans/<slug>/plan.md` | Plan + todos trace |
| `/memories/` | User memory (cross-workspace) |
| `/memories/repo/` | Repo memory (pattern, conventions) |
| `/memories/session/` | Session memory (task hiện tại) |
| `.github/harness/registry.json` | Registry trace (commit vào git) |
| `.github/harness/presets/*.json` | Preset trace |
| `www/status.json` | **STATUS trace** — YUNIE generate, dashboard đọc (counts, registry, health, pages) |
| `www/index.html` | STATUS dashboard — fetch `status.json`, responsive 375/768/1280 |

- **Sau Verify PASS:** Ghi pattern quan trọng vào `/memories/repo/`.
- **Trước khi bắt đầu task mới:** Đọc `/memories/` + `/memories/repo/`.

---

## 12. YUNIE + STATUS (www/ → GitHub Pages)

**YUNIE** là system chatbot — hiểu toàn bộ Harness, làm task hệ thống, kiểm tra tình trạng, cập nhật STATUS.

| Thành phần | Đường dẫn | Mô tả |
|------------|-----------|-------|
| Agent | `.github/agents/yunie.agent.md` | `user-invocable: true`, tools `read,edit,search,execute,todo,web,agent` |
| STATUS site | `www/index.html` + `styles.css` + `app.js` | Dashboard fetch `status.json`, design system Indigo/Sky/Amber, responsive 375/768/1280 |
| Data | `www/status.json` | Source of truth: `generatedAt`, `counts`, `registry`, `presets`, `plans`, `health`, `pages` |
| Deploy | `.github/workflows/pages.yml` | Upload `www/` → GitHub Pages (trigger `push` `www/**` + `workflow_dispatch`) |

**Thêm trang mới:** chỉ cần copy file vào `www/` (vd: `www/docs.html`) — workflow deploy toàn bộ `www/`, không cần sửa workflow. YUNIE sẽ thêm entry vào `status.json → pages.entries` khi được gọi `yunie cập nhật status`.

**Gọi YUNIE:** `@YUNIE kiểm tra hệ thống` / `yunie cập nhật status` / `yunie preset apply api-minimal` — YUNIE tự đọc `registry.json`, chạy `status`/`list`, `get_errors`, regenerate `status.json`.

---

## 12b. Demo — Focus Flow

Ý tưởng 1 câu → product hoàn chỉnh qua Harness v2:

- **PRD:** `.agent/plans/focus-flow/prd.md` — 6 User Stories P0/P1, Scope In/Out, Metrics, Edge Cases
- **Design:** `.agent/plans/focus-flow/design.md` — Palette Indigo/Mint/Amber, wireframe 375/768/1280, states
- **Plan:** `.agent/plans/focus-flow/plan.md` — Architecture vanilla HTML/CSS/JS, 7 todos
- **Code:** `focus-flow/index.html` + `styles.css` + `app.js` — timer drift-free, task CRUD, stats, localStorage, sound, Notification, keyboard
- **Polish:** responsive không vỡ, states đầy đủ, toast/confetti, a11y
- **Verify:** `get_errors` pass, visual check browser

Mở: `focus-flow/index.html` (file://) — không cần build.

## 12c. Demo — Library RAG Local (Thư viện tháo lắp)

Thư viện **local 0đ, offline 100%** — cho cả người và AI, tháo lắp như plugin:

- **PRD:** `.agent/plans/library-rag/prd.md` — 7 US P0 (upload PDF/DOCX/TXT/MD, tháo/gắn, đã đọc, tìm <100ms, API + MCP)
- **Design:** `.agent/plans/library-rag/design.md` — Palette Indigo/Sky/Amber, wireframe 375/768/1280, BM25 k1=1.2 b=0.75, registry shape, API + MCP
- **Plan:** `.agent/plans/library-rag/plan.md` — 8 todos, file map `www/library/`
- **Code:** `www/library/index.html` + `styles.css` + `app.js` — parser pdf.js/mammoth, chunk 2400/overlap 400, BM25, IndexedDB, highlight + citation, filter, progress, export/import
- **API cho AI:** `window.LibrarySearch.search(q, {top_k})` + `fetch` + MCP `search_library` (stdio, đọc `export.json`)
- **MCP:** `www/library/mcp-server.mjs` — tools `search_library`, `list_books`, `get_book`, `get_status`
- **Polish:** responsive 375/768/1280, states, animation 150-300ms, a11y (skip-link, aria, focus-visible, ESC + focus trap modal), toast
- **Verify:** `get_errors` pass, `status.json` valid, demo book sẵn

Mở: `www/library/index.html` — kéo thả PDF/DOCX/TXT/MD, gõ `/` để tìm, bấm **Xuất** để tạo `export.json` cho MCP.

---

## 13. Ma trận khả năng

| Khả năng | Skill | Instruction | Agent | Prompt | Hook | Registry | Preset | Template |
|----------|:-----:|:-----------:|:-----:|:------:|:----:|:--------:|:------:|:--------:|
| Tháo lắp (enable/disable) | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — |
| Cài từ GitHub | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — |
| Cài từ local | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — |
| Tạo mới (scaffold) | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | ✅ |
| Preset apply/save | — | — | — | — | — | ✅ | ✅ | — |
| Wise loading (chỉ load khi match) | ✅ | ✅ | ✅ | ✅ | — | — | — | — |
| Slash command | ✅ | — | — | ✅ | — | — | — | — |
| Subagent delegate | — | — | ✅ | — | — | — | — | — |
| Deterministic enforce | — | — | — | — | ✅ | — | — | — |
| Trace (.agent/plans) | ✅ | — | ✅ | ✅ | — | ✅ | ✅ | — |

---

## 14. Lệnh tổng hợp

### Harness

```bash
# Trong chat
/harness <task>          # full pipeline
/product <idea>          # Idea→Product rút gọn
/plan <task>             # chỉ plan
/implement               # chỉ implement
/polish [target]         # chỉ polish
/verify                  # chỉ verify
/skill-registry          # hướng dẫn skill registry
/custom-registry         # hướng dẫn custom registry
```

### Registry CLI

```bash
node .github/harness/scripts/harness-manager.mjs help
node .github/harness/scripts/harness-manager.mjs status
node .github/harness/scripts/harness-manager.mjs list [--type skill|instruction|agent|prompt|hook]
node .github/harness/scripts/harness-manager.mjs enable <type> <name>
node .github/harness/scripts/harness-manager.mjs disable <type> <name>
node .github/harness/scripts/harness-manager.mjs uninstall <type> <name>
node .github/harness/scripts/harness-manager.mjs install <type> owner/repo --path path/to/file --ref main [--name custom] [--force]
node .github/harness/scripts/harness-manager.mjs install <type> --local ./path [--name custom] [--force]
node .github/harness/scripts/harness-manager.mjs create <type> <name>
node .github/harness/scripts/harness-manager.mjs preset list
node .github/harness/scripts/harness-manager.mjs preset apply <name>
node .github/harness/scripts/harness-manager.mjs preset save <name>
node .github/harness/scripts/harness-manager.mjs sync
```

### Skill Registry (wrapper, chỉ skill)

```bash
node .github/skills/skill-registry/scripts/skill-manager.mjs list
node .github/skills/skill-registry/scripts/skill-manager.mjs install owner/repo --path skills/foo
node .github/skills/skill-registry/scripts/skill-manager.mjs disable <name>
node .github/skills/skill-registry/scripts/skill-manager.mjs enable <name>
node .github/skills/skill-registry/scripts/skill-manager.mjs sync
```

---

*Hệ thống: Harness v2 (Process > Model) + Registry tháo lắp wise + Preset + Template + YUNIE chatbot + www/ STATUS → GitHub Pages. Mọi thứ đều là plugin.*
