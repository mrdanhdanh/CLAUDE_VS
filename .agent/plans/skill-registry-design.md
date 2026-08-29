# Design: Skill Registry

## 1. Design System
- CLI style: minimal, màu ANSI (green ok, yellow warn, red error), table monospace
- Docs: markdown, tiếng Việt + thuật ngữ Anh, có code block copy-paste
- Không cần UI web — tập trung DX

## 2. Wireframe (Conceptual)

### Registry File
```json
{
  "version": 1,
  "skills": {
    "my-skill": {
      "source": "owner/repo",
      "path": "skills/my-skill",
      "ref": "main",
      "enabled": true,
      "description": "Mô tả ngắn từ SKILL.md",
      "installedAt": "2026-08-29T00:00:00Z",
      "commit": "abc123"
    }
  }
}
```

### Folder Layout
```
.github/skills/
  registry.json
  skill-registry/          # meta-skill (luôn enabled)
    SKILL.md
    scripts/skill-manager.mjs  # hoặc .github/skills/skill-registry/scripts/
  claude-harness/          # existing
  .disabled/               # disabled skills moved here
    some-skill/
  scripts/
    skill-manager.mjs      # CLI chính (symlink hoặc copy)
```

Quyết định: CLI đặt tại `.github/skills/skill-registry/scripts/skill-manager.mjs` + wrapper `.github/skills/scripts/skill-manager.mjs` để chạy ngắn `node .github/skills/scripts/skill-manager.mjs`.

### CLI Commands
```
skill-manager install <owner/repo> [--path skills/foo] [--ref main] [--force]
skill-manager list
skill-manager enable <name>
skill-manager disable <name>
skill-manager uninstall <name>
skill-manager sync
skill-manager help
```

## 3. Component Inventory

| Component | States | Notes |
|-----------|--------|-------|
| registry.json | missing/corrupt/valid | auto-create, backup .bak |
| skill-manager.mjs | install/list/enable/disable/uninstall/sync | fetch raw GitHub + git fallback |
| SKILL.md (skill-registry) | — | progressive loading, description keyword-rich |
| skill-usage.instructions.md | — | applyTo **, quy tắc wise |
| Disabled folder | exists/not | move, not delete |

## 4. UX States

| View | Loading | Empty | Error | Success |
|------|---------|-------|-------|---------|
| list | — | "Chưa có skill nào — install thử" | registry corrupt → warn + recreate | table + count enabled/disabled |
| install | fetching… | — | already exists / network fail | "Installed foo (enabled)" + path |
| enable/disable | — | not found | already enabled/disabled | moved + registry updated |
| sync | syncing… | nothing to sync | network fail per skill | "Synced 3 skills" |

## 5. Animation / Feedback
- CLI: spinner text "Fetching…" (đơn giản, không lib), checkmark ✓
- Toast không cần — CLI in ra stdout

## 6. Accessibility / DX
- Help luôn có, ví dụ copy-paste
- Error message gợi ý lệnh tiếp theo
- Không yêu cầu git, fallback fetch

## 7. Visual Direction
- Giữ minimal, không màu mè — dev tool
