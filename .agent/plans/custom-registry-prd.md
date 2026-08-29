# PRD: Harness Registry — Tháo lắp toàn bộ Customizations

## 1. Vision
- **One-liner:** Một registry thống nhất để tháo lắp **mọi** customization của VS Code Copilot (Skill, Instruction/Rule, Agent, Prompt, Hook) như plugin — bật/tắt không xóa, cài từ GitHub/local, preset theo dự án.
- **Problem:** Hiện chỉ Skill tháo lắp được. Rule/Instruction thì cứng trong `.github/instructions/`, Agent/Prompt/Hook cũng vậy. Mỗi dự án cần bộ rule khác nhau (web cần product-quality, API không cần), nhưng không có cách bật/tắt nhanh, không có preset, không cài từ GitHub.
- **Target User:** Dev dùng Harness v2 trên nhiều dự án, muốn `preset web-product` là có đủ rule đẹp, `preset api-minimal` là gọn nhẹ, và tự tạo rule mới 1 lệnh.

## 2. User Stories
| ID | As a ... | I want ... | So that ... | Priority |
|----|----------|------------|-------------|----------|
| US-01 | dev | `harness-manager list` thấy tất cả skills/instructions/agents/prompts/hooks + enabled/disabled | biết đang có gì | P0 |
| US-02 | dev | `disable instruction product-quality` / `enable instruction product-quality` | tháo lắp rule theo dự án | P0 |
| US-03 | dev | `disable agent designer` / `enable prompt product` | tháo lắp agent/prompt/hook tương tự | P0 |
| US-04 | dev | `install instruction owner/repo --path rules/nextjs.md` | cài rule từ GitHub | P0 |
| US-05 | dev | `create instruction my-rule --preset nextjs` | scaffold rule mới từ template | P0 |
| US-06 | dev | `preset list` / `preset apply web-product` | 1 lệnh bật đúng bộ cho dự án | P0 |
| US-07 | dev | `preset save my-preset` lưu bộ đang bật thành preset mới | custom dễ dàng | P1 |
| US-08 | agent | chỉ load instruction/skill khi `applyTo`/`description` match (wise) | không nhiễu context | P0 |
| US-09 | dev | `sync` khôi phục tất cả sau khi clone repo | onboard 1 lệnh | P1 |

## 3. Scope

### In Scope (P0)
- **Unified Registry** `.github/harness/registry.json` (version 2) — track skills + instructions + agents + prompts + hooks. Giữ `.github/skills/registry.json` đồng bộ để backward compat.
- **CLI** `.github/harness/scripts/harness-manager.mjs` (Node 18+, no deps) — commands: `list`, `enable <type> <name>`, `disable <type> <name>`, `install <type> <source>`, `uninstall <type> <name>`, `create <type> <name>`, `preset list|apply|save`, `sync`, `status`, `help`. Type = `skill|instruction|agent|prompt|hook|all`.
- **Tháo lắp:** move file/folder giữa `<dir>/<name>` ↔ `<dir>/.disabled/<name>` + cập nhật registry.enabled. Với instruction/agent/prompt là file đơn, hook là file json.
- **Presets** `.github/harness/presets/*.json` — 3 preset sẵn: `full` (tất cả), `web-product` (harness + product-quality + designer/polish), `api-minimal` (chỉ harness-workflow, không product-quality).
- **Templates** `.github/harness/templates/` — template cho instruction, agent, prompt, skill.
- **Meta-skill** `.github/skills/custom-registry/SKILL.md` — hướng dẫn tháo lắp toàn bộ.
- **Instruction** `.github/instructions/custom-registry.instructions.md` — quy tắc wise cho mọi loại.
- **Cập nhật** `copilot-instructions.md` + `skill-registry` để trỏ sang harness-manager.

### Nice to Have (P1)
- `preset save <name>` — export bộ đang bật
- `status` — tóm tắt nhanh enabled/disabled per type
- Hỗ trợ `install` từ GitHub cho mọi type (fetch raw)

### Non-Goals
- Không làm marketplace UI
- Không tự động phát hiện stack để auto-apply preset (chỉ gợi ý)
- Không quản lý `copilot-instructions.md` như plugin (giữ làm global)

## 4. Success Metrics
- `list` <1s, `enable/disable` <1s, `preset apply` <2s
- Disable `product-quality` → file move sang `.disabled`, `list` thấy disabled, agent không load rule đó
- `preset apply api-minimal` → đúng bộ enabled như preset định nghĩa
- `create instruction my-rule` → file mới từ template, registry cập nhật, `list` thấy
- Clone repo mới → `harness-manager sync` khôi phục đủ

## 5. Edge Cases
- File không tồn tại → báo lỗi + gợi ý `list`
- Đã enabled/disabled → báo ℹ️ không lỗi
- Registry corrupt → backup .bak + tạo mới
- Preset apply khi thiếu file → warn + skip
- Windows path — dùng path.posix cho GitHub, path cho fs

## 6. Assumptions
- Node 18+ có fetch
- Mỗi type có folder chuẩn: `instructions/*.instructions.md`, `agents/*.agent.md`, `prompts/*.prompt.md`, `hooks/*.json`, `skills/*/SKILL.md`
- Preset là JSON đơn giản, không cần versioning phức tạp

## 7. Open Questions
- [x] Chốt: harness-manager là CLI chính, skill-manager giữ lại như wrapper cho `skill` type để backward compat
