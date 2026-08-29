---
description: "Tháo lắp toàn bộ customizations (skill/instruction/agent/prompt/hook) như plugin — preset, scaffold, wise loading"
applyTo: "**"
---

# Custom Registry — Tháo lắp Wise (toàn bộ)

Mọi customization trong `.github/` đều tháo lắp được như plugin — không xóa, chỉ move sang `.disabled/`.

## Quy tắc cho agent

1. **Progressive loading:** Chỉ đọc `SKILL.md` / `*.instructions.md` / `*.agent.md` / `*.prompt.md` khi `description` hoặc `applyTo` match task. Đừng load tất cả.
2. **Tôn trọng disabled:** File ở `**/.disabled/` là disabled — không load, không gợi ý. Chỉ gợi ý `enable` nếu task thực sự cần.
3. **Preset trước:** Khi bắt đầu dự án mới, gợi ý `preset apply web-product` (web) hoặc `api-minimal` (API) thay vì bật tay từng cái.
4. **Không nhồi:** Đừng bật 20 thứ cùng lúc. Dùng `status` để xem đang bật gì.
5. **Scaffold:** Khi user muốn rule/agent/prompt mới, dùng `create` từ template thay vì viết tay từ đầu.

## Quy tắc cho dev

### Tháo lắp nhanh
```bash
node .github/harness/scripts/harness-manager.mjs status
node .github/harness/scripts/harness-manager.mjs list --type instruction
node .github/harness/scripts/harness-manager.mjs disable instruction product-quality
node .github/harness/scripts/harness-manager.mjs enable instruction product-quality
node .github/harness/scripts/harness-manager.mjs disable agent designer
```

### Preset theo dự án
```bash
node .github/harness/scripts/harness-manager.mjs preset list
node .github/harness/scripts/harness-manager.mjs preset apply web-product
node .github/harness/scripts/harness-manager.mjs preset apply api-minimal
node .github/harness/scripts/harness-manager.mjs preset save my-preset  # lưu bộ hiện tại
```

### Tạo mới (custom dễ dàng)
```bash
node .github/harness/scripts/harness-manager.mjs create instruction my-rule
node .github/harness/scripts/harness-manager.mjs create agent my-agent
node .github/harness/scripts/harness-manager.mjs create prompt my-prompt
node .github/harness/scripts/harness-manager.mjs create skill my-skill
# → sửa description/applyTo trong file mới là xong
```

### Cài từ GitHub
```bash
node .github/harness/scripts/harness-manager.mjs install instruction owner/repo --path instructions/nextjs.instructions.md
node .github/harness/scripts/harness-manager.mjs install skill owner/repo --path skills/my-skill
```

### Gỡ & Sync
```bash
node .github/harness/scripts/harness-manager.mjs uninstall instruction my-rule
node .github/harness/scripts/harness-manager.mjs sync  # sau khi clone repo
```

## Chi tiết
- Registry: `.github/harness/registry.json` (commit vào git)
- Presets: `.github/harness/presets/*.json` — sửa tay được
- Templates: `.github/harness/templates/` — 4 template sẵn
- Meta-skill: `.github/skills/custom-registry/SKILL.md` — gõ `/custom-registry` để xem
- Skill cũ: `.github/skills/skill-registry/` vẫn dùng cho skill, nhưng nên dùng `harness-manager` cho mọi loại
