# Plan: Harness Registry

## Context
- PRD: `.agent/plans/custom-registry-prd.md`
- Design: `.agent/plans/custom-registry-design.md`
- Stack: Node 18+ ESM, no deps

## Requirements
- Unified registry v2, CLI harness-manager, presets, templates, meta-skill, instructions

## Architecture
- **Registry v2** `.github/harness/registry.json` — keys: skills, instructions, agents, prompts, hooks. Mỗi entry: source, file/path, enabled, description, installedAt. Auto-scan fs nếu registry missing để bootstrap.
- **harness-manager.mjs** — single file, functions: loadRegistry, saveRegistry, scanFs, list, status, enable/disable (move file/folder), install (fetch GitHub raw/api), create (from template), preset apply/save/list, sync, help. Dùng `fs.rename` cho tháo lắp.
- **Backward compat:** sau mỗi save, đồng bộ `.github/skills/registry.json` (chỉ skills).
- **Presets:** JSON trong `.github/harness/presets/`, apply = loop qua registry và enable/disable theo preset map.
- **Templates:** 4 files markdown/json trong `.github/harness/templates/`.

## File Changes
| File | Action | Description |
|------|--------|-------------|
| `.github/harness/registry.json` | create | v2 bootstrap từ scan fs |
| `.github/harness/presets/*.json` | create | full, web-product, api-minimal |
| `.github/harness/templates/*` | create | instruction, agent, prompt, skill |
| `.github/harness/scripts/harness-manager.mjs` | create | CLI chính |
| `.github/skills/custom-registry/SKILL.md` | create | meta-skill |
| `.github/instructions/custom-registry.instructions.md` | create | wise rules |
| `.github/skills/skill-registry/scripts/skill-manager.mjs` | edit | thêm note wrapper |
| `.github/copilot-instructions.md` | edit | thêm § Harness Registry |
| `.agent/plans/custom-registry-*` | done | trace |

## Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Registry v2 vs v1 drift | sync skills registry sau mỗi save |
| Move file đang mở trong VS Code | fs.rename atomic, VS Code tự refresh |
| Preset apply thiếu file | warn + skip, không fail |
| GitHub rate limit | GITHUB_TOKEN, báo lỗi rõ |

## Verification Steps
- [ ] `harness-manager help` + `list` + `status`
- [ ] `disable instruction product-quality` → file move, list thấy disabled
- [ ] `enable instruction product-quality` → move lại
- [ ] `preset list` + `preset apply api-minimal` + `preset apply web-product`
- [ ] `create instruction my-test` → file mới + registry
- [ ] `uninstall instruction my-test` → xóa
- [ ] `get_errors` pass

## Todos
1. Tạo harness registry + presets + templates
2. Implement harness-manager.mjs
3. Tạo custom-registry skill + instructions + cập nhật docs
4. Verify demo tháo lắp
