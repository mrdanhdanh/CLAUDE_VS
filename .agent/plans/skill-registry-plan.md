# Plan: Skill Registry

## Context
- PRD: `.agent/plans/skill-registry-prd.md`
- Design: `.agent/plans/skill-registry-design.md`
- Stack: Node 18+ ESM, no deps, fetch + fs, VS Code skills convention

## Requirements
- Functional: registry.json + CLI install/list/enable/disable/uninstall/sync + meta-skill + instructions
- Non-functional: <1s cho list/enable/disable, không crash khi offline, progressive loading

## Architecture
- **registry.json** tại `.github/skills/registry.json` — version 1, map name → meta
- **skill-manager.mjs** — ESM, exports functions + CLI main, dùng `fetch` raw GitHub (`raw.githubusercontent.com/owner/repo/ref/path/SKILL.md` + list files via GitHub API `api.github.com/repos/owner/repo/contents/path?ref=ref`), fallback `git clone --depth 1 --filter=blob:none --sparse` nếu có git
- **Disable:** `fs.rename` giữa `.github/skills/<name>` và `.github/skills/.disabled/<name>`
- **Wise usage:** instruction `skill-usage.instructions.md` với `applyTo: "**"` nhưng nội dung nhấn mạnh chỉ load khi description match

## File Changes
| File | Action | Description |
|------|--------|-------------|
| `.github/skills/registry.json` | create | registry rỗng version 1 |
| `.github/skills/skill-registry/SKILL.md` | create | meta-skill hướng dẫn tháo lắp |
| `.github/skills/skill-registry/scripts/skill-manager.mjs` | create | CLI chính |
| `.github/skills/scripts/skill-manager.mjs` | create | wrapper re-export để chạy ngắn |
| `.github/instructions/skill-usage.instructions.md` | create | quy tắc wise |
| `.github/copilot-instructions.md` | edit | thêm đoạn Skill Registry |
| `.agent/plans/skill-registry-*` | done | trace |

## Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| GitHub API rate limit | fallback raw fetch, báo lỗi rõ, gợi ý thử lại |
| Skill là single file vs folder | detect: nếu path ends with .md thì cài file, else folder |
| Registry corrupt | try/catch, backup .bak, tạo mới |
| Windows path | dùng `path.posix` cho GitHub, `path` cho fs |

## Verification Steps
- [ ] `node .github/skills/skill-registry/scripts/skill-manager.mjs help` in ra help
- [ ] `node ... list` với registry rỗng → empty state
- [ ] Cài 1 skill mẫu từ GitHub (tạo mock local để test offline) → list thấy enabled
- [ ] disable → folder move sang .disabled, list thấy disabled
- [ ] enable → move lại, list thấy enabled
- [ ] uninstall → xóa folder + registry
- [ ] `get_errors` pass

## Todos
1. Tạo registry.json + skill-registry SKILL.md
2. Implement skill-manager.mjs (core + CLI)
3. Tạo wrapper + skill-usage instructions
4. Cập nhật copilot-instructions + verify demo
