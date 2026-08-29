---
name: custom-registry
description: "Tháo lắp toàn bộ customizations: skill/instruction/rule/agent/prompt/hook như plugin, preset theo dự án, scaffold mới. Use when user wants to manage rules, tháo lắp rule/instruction/agent/prompt/hook, preset, tạo mới customization, custom dễ dàng, hoặc nói harness registry/custom registry."
user-invocable: true
---

# Custom Registry — Tháo lắp toàn bộ (Wise)

Quản lý **mọi** customization của Harness v2 như plugin: bật/tắt không xóa, cài từ GitHub/local, preset theo dự án, scaffold mới từ template.

## Khi nào dùng
- Rule/instruction khác nhau theo dự án → bật/tắt nhanh
- Muốn preset `web-product` (đẹp) vs `api-minimal` (gọn)
- Tạo rule/agent/prompt mới mà không copy tay
- Cài rule từ GitHub như cài skill

## CLI chính

```bash
# Dùng harness-manager (Node 18+, không deps)
node .github/harness/scripts/harness-manager.mjs help
node .github/harness/scripts/harness-manager.mjs list
node .github/harness/scripts/harness-manager.mjs status
```

### Tháo lắp (không xóa)

```bash
# Tắt rule product-quality cho dự án API
node .github/harness/scripts/harness-manager.mjs disable instruction product-quality

# Bật lại
node .github/harness/scripts/harness-manager.mjs enable instruction product-quality

# Tương tự cho mọi loại
node .github/harness/scripts/harness-manager.mjs disable agent designer
node .github/harness/scripts/harness-manager.mjs disable prompt product
node .github/harness/scripts/harness-manager.mjs disable hook hooks
node .github/harness/scripts/harness-manager.mjs disable skill claude-harness
```

Cơ chế: move file/folder `→ .disabled/` + `registry.json.enabled=false`. Không xóa, bật lại 1 lệnh.

### Cài từ GitHub / local

```bash
# Cài instruction từ GitHub
node .github/harness/scripts/harness-manager.mjs install instruction owner/repo --path instructions/nextjs.instructions.md --ref main

# Cài agent/prompt/hook/skill tương tự
node .github/harness/scripts/harness-manager.mjs install agent owner/repo --path agents/my-agent.agent.md
node .github/harness/scripts/harness-manager.mjs install skill owner/repo --path skills/my-skill

# Cài local (test offline)
node .github/harness/scripts/harness-manager.mjs install instruction --local ./my-rule.instructions.md --name my-rule
```

### Tạo mới từ template (custom dễ dàng)

```bash
node .github/harness/scripts/harness-manager.mjs create instruction my-rule
node .github/harness/scripts/harness-manager.mjs create agent my-agent
node .github/harness/scripts/harness-manager.mjs create prompt my-prompt
node .github/harness/scripts/harness-manager.mjs create skill my-skill
node .github/harness/scripts/harness-manager.mjs create hook my-hook
# → file mới từ .github/harness/templates/, đã đăng ký vào registry, sửa description/applyTo là xong
```

### Preset — 1 lệnh cho cả dự án

```bash
node .github/harness/scripts/harness-manager.mjs preset list
node .github/harness/scripts/harness-manager.mjs preset apply web-product   # web cần đẹp
node .github/harness/scripts/harness-manager.mjs preset apply api-minimal   # API gọn nhẹ
node .github/harness/scripts/harness-manager.mjs preset apply full          # bật tất cả

# Lưu bộ đang bật thành preset mới
node .github/harness/scripts/harness-manager.mjs preset save my-preset
```

Presets sẵn:
- `full` — bật tất cả
- `web-product` — bật product-quality + designer/polish (cho web)
- `api-minimal` — tắt product-quality/designer/polish (cho API/script)

### Gỡ & Sync

```bash
node .github/harness/scripts/harness-manager.mjs uninstall instruction my-rule
node .github/harness/scripts/harness-manager.mjs sync   # sau khi clone repo, cài lại tất cả từ GitHub
```

## Registry & Preset

- Registry: `.github/harness/registry.json` (v2, commit vào git) — đồng bộ `.github/skills/registry.json` cho skills
- Presets: `.github/harness/presets/*.json` — JSON đơn giản, sửa tay được
- Templates: `.github/harness/templates/` — instruction.md, agent.md, prompt.md, skill-SKILL.md
- Disabled: mỗi type có `.disabled/` riêng (instructions/.disabled/, agents/.disabled/, ...)

## Wise usage

- Agent chỉ load khi `description`/`applyTo` match task — đừng bật 20 thứ cùng lúc, dùng preset
- Viết `description` giàu keyword: `Use when building Next.js app, need ...`
- `applyTo` cho instruction: `"**"` (global) vs `"**/*.{ts,tsx}"` (chỉ TS) vs `"src/api/**"` (chỉ API)
- Chi tiết: `.github/instructions/custom-registry.instructions.md`

## Tương thích

- `skill-registry` vẫn dùng được cho `skill` — nó là wrapper. Dùng `harness-manager` cho mọi loại.
- `GITHUB_TOKEN` env optional để tránh rate limit.

## Tham chiếu

- CLI: `../harness/scripts/harness-manager.mjs`
- Registry: `../harness/registry.json`
- Presets: `../harness/presets/`
- Templates: `../harness/templates/`
- Quy tắc: `../../instructions/custom-registry.instructions.md`
