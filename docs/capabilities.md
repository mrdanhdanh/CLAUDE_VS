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
12. [Demo — Focus Flow](#12-demo--focus-flow)
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
| PRD | Biến ý tưởng thành spec | `.agent/plans/<slug>-prd.md` | Plan | ❌ (mini 5 dòng cũng phải có) |
| Design | Định nghĩa giao diện đẹp | `.agent/plans/<slug>-design.md` | Designer | ❌ |
| Plan | Chia nhỏ để code | `.agent/plans/<slug>-plan.md` + todos | Plan | ❌ |
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
| `product-quality` | `**/*.{html,css,tsx,jsx,vue,js,ts}` | Chuẩn UI/UX: design system, responsive, states, animation, a11y |
| `skill-usage` | `**` | Wise skill usage — chỉ load khi description match |
| `custom-registry` | `**` | Tháo lắp toàn bộ customizations như plugin |

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

- **Vị trí:** `.github/agents/*.agent.md`
- **Frontmatter:** `description` (khi nào delegate) + `tools` (minimal) + `model` + `user-invocable: false` (chỉ subagent)
- **Tháo lắp:** `harness-manager disable agent designer` → move sang `.github/agents/.disabled/`
- **Tạo mới:** `harness-manager create agent my-agent`

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
- **Frontmatter:** `description` + `agent` + `model` + `tools` + `argument-hint`
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
- **Tháo lắp:** `harness-manager disable hook hooks` → move sang `.github/hooks/.disabled/`
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
| `full` | `presets/full.json` | Muốn tất cả | tất cả | — |
| `web-product` | `presets/web-product.json` | Web cần giao diện đẹp | product-quality, designer, polish, product prompt | — |
| `api-minimal` | `presets/api-minimal.json` | API/script gọn nhẹ | harness core | product-quality, designer, polish, product/polish prompts |

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
- Không hardcode text — constants / i18n-ready
- Không layout shift

Chi tiết: `.github/instructions/product-quality.instructions.md` · Checklist trong `docs/harness-flow.md`

---

## 11. Memory & Trace

| Nơi | Dùng để |
|-----|---------|
| `.agent/plans/<slug>-prd.md` | PRD trace |
| `.agent/plans/<slug>-design.md` | Design trace |
| `.agent/plans/<slug>-plan.md` | Plan + todos trace |
| `/memories/` | User memory (cross-workspace) |
| `/memories/repo/` | Repo memory (pattern, conventions) |
| `/memories/session/` | Session memory (task hiện tại) |
| `.github/harness/registry.json` | Registry trace (commit vào git) |
| `.github/harness/presets/*.json` | Preset trace |

- **Sau Verify PASS:** Ghi pattern quan trọng vào `/memories/repo/`.
- **Trước khi bắt đầu task mới:** Đọc `/memories/` + `/memories/repo/`.

---

## 12. Demo — Focus Flow

Ý tưởng 1 câu → product hoàn chỉnh qua Harness v2:

- **PRD:** `.agent/plans/focus-flow-prd.md` — 6 User Stories P0/P1, Scope In/Out, Metrics, Edge Cases
- **Design:** `.agent/plans/focus-flow-design.md` — Palette Indigo/Mint/Amber, wireframe 375/768/1280, states
- **Plan:** `.agent/plans/focus-flow-plan.md` — Architecture vanilla HTML/CSS/JS, 7 todos
- **Code:** `focus-flow/index.html` + `styles.css` + `app.js` — timer drift-free, task CRUD, stats, localStorage, sound, Notification, keyboard
- **Polish:** responsive không vỡ, states đầy đủ, toast/confetti, a11y
- **Verify:** `get_errors` pass, visual check browser

Mở: `focus-flow/index.html` (file://) — không cần build.

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

*Hệ thống: Harness v2 (Process > Model) + Registry tháo lắp wise + Preset + Template. Mọi thứ đều là plugin.*
