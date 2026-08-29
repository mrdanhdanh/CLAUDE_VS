# Design: Harness Registry

## 1. Design System
- CLI: ANSI color, table monospace, giống skill-manager để quen tay
- Preset: JSON declarative, dễ đọc, dễ sửa tay
- Template: markdown với frontmatter chuẩn VS Code

## 2. Wireframe

### Registry v2
```json
{
  "version": 2,
  "skills": { "claude-harness": { "source": "local", "enabled": true, ... } },
  "instructions": { "harness-workflow": { "source": "local", "file": "harness-workflow.instructions.md", "enabled": true, "applyTo": "**" } },
  "agents": { "designer": { "source": "local", "file": "designer.agent.md", "enabled": true } },
  "prompts": { "product": { "source": "local", "file": "product.prompt.md", "enabled": true } },
  "hooks": { "hooks": { "source": "local", "file": "hooks.json", "enabled": true } }
}
```

### Folder Layout
```
.github/
  harness/
    registry.json          # v2 unified
    presets/
      full.json
      web-product.json
      api-minimal.json
    templates/
      instruction.md
      agent.md
      prompt.md
      skill-SKILL.md
    scripts/
      harness-manager.mjs  # CLI chính
  skills/
    registry.json          # v1 compat (sync từ harness registry)
    .disabled/
    skill-registry/
    custom-registry/       # meta-skill mới
  instructions/
    .disabled/
  agents/
    .disabled/
  prompts/
    .disabled/
  hooks/
    .disabled/
```

### CLI
```
harness-manager list [--type skill|instruction|agent|prompt|hook]
harness-manager status
harness-manager enable <type> <name>   # type: skill|instruction|agent|prompt|hook
harness-manager disable <type> <name>
harness-manager uninstall <type> <name>
harness-manager install <type> <owner/repo> [--path path/to/file] [--ref main] [--name custom] [--force]
harness-manager install <type> --local <path> [--name custom] [--force]
harness-manager create <type> <name> [--preset <preset>] [--from <template>]
harness-manager preset list
harness-manager preset apply <name>
harness-manager preset save <name>
harness-manager sync
harness-manager help
```

### Preset JSON
```json
{
  "name": "web-product",
  "description": "Full product-driven cho dự án web",
  "skills": { "claude-harness": true, "skill-registry": true, "custom-registry": true },
  "instructions": { "harness-workflow": true, "product-quality": true, "skill-usage": true, "custom-registry": true },
  "agents": { "designer": true, "polish": true, "explore": true, "plan": true, "implement": true, "verify": true },
  "prompts": { "harness": true, "product": true, "polish": true, "plan": true, "implement": true, "verify": true },
  "hooks": { "hooks": true }
}
```

## 3. Component Inventory

| Component | States | Notes |
|-----------|--------|-------|
| harness/registry.json | missing/corrupt/valid | auto-scan fs nếu missing |
| harness-manager.mjs | all commands | no deps, fetch raw GitHub |
| presets/*.json | 3 sẵn + custom | apply = enable/disable theo preset |
| templates/* | 4 files | scaffold create |
| custom-registry SKILL.md | — | progressive loading |
| custom-registry.instructions.md | — | wise rules |

## 4. UX States

| View | Empty | Error | Success |
|------|-------|-------|---------|
| list | "Chưa có ..." | registry corrupt → backup | table per type |
| enable/disable | not found | already enabled | moved + registry |
| preset apply | preset not found | file missing → warn | "Applied web-product (12 enabled, 3 disabled)" |
| create | — | already exists | file created + registry |

## 5. Feedback
- CLI in màu, checkmark, gợi ý lệnh tiếp theo
- Preset apply in diff: +enabled -disabled

## 6. DX
- `status` cho overview 1 dòng per type
- `create` tự sinh frontmatter chuẩn, description placeholder cần sửa
- Help luôn có ví dụ copy-paste
