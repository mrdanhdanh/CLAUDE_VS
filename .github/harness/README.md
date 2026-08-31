# Harness Registry — Tháo lắp toàn bộ

Quản lý **mọi** customization của VS Code Copilot như plugin: `skill | instruction | agent | prompt | hook`.

## Nhanh

```bash
# Xem đang có gì
node .github/harness/scripts/harness-manager.mjs status
node .github/harness/scripts/harness-manager.mjs list

# Tháo lắp (không xóa)
node .github/harness/scripts/harness-manager.mjs disable instruction product-quality
node .github/harness/scripts/harness-manager.mjs enable instruction product-quality

# Preset theo dự án
node .github/harness/scripts/harness-manager.mjs preset apply web-product   # web cần đẹp
node .github/harness/scripts/harness-manager.mjs preset apply api-minimal   # API gọn
node .github/harness/scripts/harness-manager.mjs preset apply full          # bật tất cả

# Tạo mới từ template (custom dễ dàng)
node .github/harness/scripts/harness-manager.mjs create instruction my-rule
node .github/harness/scripts/harness-manager.mjs create agent my-agent
node .github/harness/scripts/harness-manager.mjs create prompt my-prompt
node .github/harness/scripts/harness-manager.mjs create skill my-skill

# Cài từ GitHub
node .github/harness/scripts/harness-manager.mjs install instruction owner/repo --path instructions/nextjs.instructions.md
node .github/harness/scripts/harness-manager.mjs install skill owner/repo --path skills/my-skill

# Lưu preset hiện tại
node .github/harness/scripts/harness-manager.mjs preset save my-preset

# Sau khi clone repo
node .github/harness/scripts/harness-manager.mjs sync

# Sinh assets cho Claude Code (.claude/ + CLAUDE.md) — một chiều .github → .claude
node .github/harness/scripts/harness-manager.mjs export-claude
node .github/harness/scripts/harness-manager.mjs export-claude --check   # dry-run, exit 1 nếu lệch (CI)
```

## Cấu trúc

```
.github/harness/
  registry.json          # v2 unified — source of truth (commit vào git)
  presets/               # full.json, web-product.json, api-minimal.json
  templates/             # instruction.md, agent.md, prompt.md, skill-SKILL.md
  scripts/harness-manager.mjs
  README.md

.github/skills/registry.json  # v1 compat (auto-sync từ harness registry)
.github/*/ .disabled/         # nơi chứa đồ đã disable (không load)

.claude/ + CLAUDE.md          # GENERATED bởi export-claude — DO NOT EDIT (có marker từng file)
.claude/harness-export.json   # manifest file đã sinh + hook commands (phục vụ orphan cleanup)
```

## Presets sẵn

| Preset | Dùng khi | Bật | Tắt |
|--------|----------|-----|-----|
| `full` | Muốn tất cả | tất cả | — |
| `web-product` | Web cần giao diện đẹp | product-quality, designer, polish | — |
| `api-minimal` | API/script gọn nhẹ | harness core | product-quality, designer, polish |

Tự tạo preset: `preset save <name>` → file `.github/harness/presets/<name>.json` (sửa tay được).

## Wise usage

- Agent chỉ load khi `description`/`applyTo` match task — đừng bật 20 thứ cùng lúc.
- `applyTo` cho instruction: `"**"` (global), `"**/*.{ts,tsx}"` (chỉ TS), `"src/api/**"` (chỉ API).
- Skill ở `.disabled/` không hiện trong slash `/`.

## Thêm gì nữa?

- **Hook:** `create hook my-hook` → `.github/hooks/my-hook.json` (PostToolUse, PreToolUse, ...)
- **Skill cũ:** `skill-registry` vẫn dùng được cho skill, nhưng nên dùng `harness-manager` cho mọi loại.
- **GITHUB_TOKEN:** set env để tránh rate limit khi cài nhiều từ GitHub.

Chi tiết: `.github/skills/custom-registry/SKILL.md` (gõ `/custom-registry`) + `.github/instructions/custom-registry.instructions.md`
