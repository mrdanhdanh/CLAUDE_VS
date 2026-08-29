---
name: skill-registry
description: "Quản lý skill như plugin: cài/gỡ/bật/tắt skill từ GitHub, tháo lắp wise. Use when user wants to install skill from GitHub, manage skills, enable/disable skill, tháo lắp skill, sync skills, hoặc nói skill registry/plugin."
user-invocable: true
---

# Skill Registry — Tháo lắp Wise

Quản lý skill GitHub như plugin: cài, bật/tắt, gỡ, sync — và dùng **wise** (chỉ load khi cần).

## Khi nào dùng
- Cài skill từ GitHub: `owner/repo --path skills/foo`
- Bật/tắt skill để test hoặc tiết kiệm context
- Gỡ skill không dùng nữa
- Clone repo mới → sync lại tất cả skill

## Cách tháo lắp

### CLI (không cần cài thêm gì, Node 18+)

```bash
# Xem trợ giúp
node .github/skills/skill-registry/scripts/skill-manager.mjs help

# Liệt kê
node .github/skills/skill-registry/scripts/skill-manager.mjs list

# Cài từ GitHub (public repo)
node .github/skills/skill-registry/scripts/skill-manager.mjs install owner/repo --path skills/my-skill --ref main
# Ví dụ: install anthropics/skills --path skills/web-design

# Cài từ local (test offline)
node .github/skills/skill-registry/scripts/skill-manager.mjs install --local ./my-local-skill --name my-skill

# Tắt (không xóa) — skill biến mất khỏi slash "/"
node .github/skills/skill-registry/scripts/skill-manager.mjs disable my-skill

# Bật lại
node .github/skills/skill-registry/scripts/skill-manager.mjs enable my-skill

# Gỡ hẳn
node .github/skills/skill-registry/scripts/skill-manager.mjs uninstall my-skill

# Sync sau khi clone repo (cài lại tất cả từ registry.json)
node .github/skills/skill-registry/scripts/skill-manager.mjs sync
```

### Cơ chế tháo lắp
- **Disable** = move `.github/skills/<name>` → `.github/skills/.disabled/<name>` + `registry.json.enabled = false`. Không xóa file, bật lại 1 lệnh.
- **Enable** = move ngược lại.
- **Uninstall** = xóa folder + xóa khỏi registry.
- **Registry** là source of truth: `.github/skills/registry.json` (commit vào git để team sync).

### Wise usage (tiết kiệm context)
- Agent **chỉ load** `SKILL.md` khi `description` match task hiện tại (progressive loading).
- Đừng bật 20 skill cùng lúc nếu không cần — disable những cái ít dùng.
- Viết `description` giàu keyword để agent tự tìm đúng skill.
- Xem quy tắc chi tiết: `.github/instructions/skill-usage.instructions.md`

## Registry format
```json
{
  "version": 1,
  "skills": {
    "my-skill": {
      "source": "owner/repo",
      "path": "skills/my-skill",
      "ref": "main",
      "enabled": true,
      "description": "...",
      "installedAt": "2026-08-29T00:00:00Z"
    }
  }
}
```

## Env
- `GITHUB_TOKEN` (optional) để tránh rate limit khi cài nhiều skill.

## Tham chiếu
- CLI: `./scripts/skill-manager.mjs`
- Registry: `../registry.json`
- Quy tắc wise: `../../instructions/skill-usage.instructions.md`
