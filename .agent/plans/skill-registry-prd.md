# PRD: Skill Registry — Tháo lắp Wise

## 1. Vision
- **One-liner:** Một registry cho phép cài/gỡ/bật/tắt skill từ GitHub như plugin, và agent chỉ load skill khi thực sự cần (wise) — không nhồi context.
- **Problem:** Skill GitHub nằm rải rác, cài thủ công dễ lỗi, bật hết thì tốn token và nhiễu, tắt thì quên. Thiếu cơ chế tháo lắp nhanh và quy tắc dùng wise.
- **Target User:** Dev dùng VS Code Copilot Chat với Harness v2, có 5-20 skill từ GitHub muốn quản lý như extension.

## 2. User Stories
| ID | As a ... | I want ... | So that ... | Priority |
|----|----------|------------|-------------|----------|
| US-01 | dev | `skill-manager install owner/repo --path skills/foo` | cài skill từ GitHub vào `.github/skills/foo` | P0 |
| US-02 | dev | `skill-manager list` thấy enabled/disabled, source, version | biết đang có gì | P0 |
| US-03 | dev | `skill-manager disable foo` / `enable foo` không xóa file | tháo lắp nhanh để test | P0 |
| US-04 | dev | `skill-manager uninstall foo` xóa sạch + cập nhật registry | gỡ hẳn khi không cần | P0 |
| US-05 | agent | chỉ auto-load skill khi `description` match task (wise) | không tốn context | P0 |
| US-06 | dev | `skill-manager sync` cài lại từ registry sau khi clone repo | onboard máy mới 1 lệnh | P1 |
| US-07 | dev | gõ `/skill-registry` để xem hướng dẫn tháo lắp | tự phục vụ | P1 |

## 3. Scope

### In Scope (P0)
- `registry.json` tại `.github/skills/registry.json` — source of truth: name, source (github url + path + ref), enabled, description, installedAt, version
- `scripts/skill-manager.mjs` — CLI Node (không deps) với commands: install, list, enable, disable, uninstall, sync, help
- Cơ chế disable: move folder `.github/skills/<name>` ↔ `.github/skills/.disabled/<name>` + cập nhật registry.enabled
- Meta-skill `.github/skills/skill-registry/SKILL.md` — hướng dẫn wise usage + tháo lắp
- Instruction `.github/instructions/skill-usage.instructions.md` — quy tắc agent dùng skill wise (progressive loading, description match)
- Cập nhật `copilot-instructions.md` để nhắc registry

### Nice to Have (P1)
- `sync` + `update` (pull latest từ GitHub)
- Hỗ trợ skill là single `SKILL.md` hoặc folder
- Validate SKILL.md frontmatter (name khớp folder, description tồn tại)

### Non-Goals
- Không làm marketplace, không publish skill
- Không tự động crawl GitHub search
- Không UI web — chỉ CLI + markdown

## 4. Success Metrics
- Cài 1 skill từ GitHub < 10s, list/enable/disable < 1s
- Disable xong skill không còn xuất hiện trong slash `/` (do folder đã move)
- Agent chỉ load skill khi description match — test bằng task không liên quan không load
- Clone repo mới → `node scripts/skill-manager.mjs sync` khôi phục đủ skill

## 5. Edge Cases
- Skill đã tồn tại → báo lỗi, gợi ý --force
- GitHub rate limit / offline → báo rõ, không crash
- SKILL.md thiếu name/description → warn nhưng vẫn cài, ghi vào registry
- Folder `.disabled` chưa tồn tại → tự tạo
- Registry.json corrupt → backup + tạo mới

## 6. Assumptions
- Môi trường có Node 18+ (fetch built-in) và git optional (ưu tiên git clone, fallback fetch raw)
- Skill GitHub là public, không cần auth (có thể thêm token sau)
- Skill tuân thủ chuẩn VS Code: folder chứa `SKILL.md` với frontmatter `name`, `description`

## 7. Open Questions
- [x] Chốt: dùng Node ESM script, không thêm deps, chạy `node scripts/skill-manager.mjs <cmd>`
