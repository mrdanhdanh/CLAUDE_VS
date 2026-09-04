# Design — DisCo Phase 3

## Kiến trúc (mount-beside, không sửa core)

```
docs/knowleged.md (13 KN) ─┐
.agent/bugs/*/bug.md ──────┴─→ distill-agnostic.mjs
                                   │ group theo theme (priority rules)
                                   ▼
              .github/skills/harness-{web-ui,process,build-config,governance,minimal}/
                ├─ SKILL.md            (frontmatter name/description keyword-rich)
                ├─ references/evidence.md (full KN details + bug links)
                └─ record.json         (router-compat: anchor/capabilities/checks/gaps/verdict)
                                   │
        harness-manager loadRegistry() → scanFs() bootstrap → registry.json (tự đăng ký)
                                   │
        skill-router.mjs (multi-source) ← .agent/skills/ + .github/skills/
                                   ▼
        mcp-server.mjs: search_skills / list_skills / get_skill (không đổi)
```

## Theme grouping — priority rules (first match wins)

| # | Theme | Tags match | KNs |
|---|-------|-----------|-----|
| 1 | governance | governance, tdd, safety, reward-hacking | KN-012 |
| 2 | minimal | minimal, ponytail, yagni | KN-013 |
| 3 | build-config | build, config, dotnet, api | KN-008, KN-009 |
| 4 | process | process, knowledge, automation, benchmark, aar, quality, dx, self-improving | KN-005, KN-007, KN-010 |
| 5 | web-ui | (fallback: ui, css, a11y, animation, theme, state, i18n, contrast, spacing, button, responsive, ux, perf, data) | KN-001..004, KN-006, KN-011 |

→ 5 skill: `harness-web-ui` (6), `harness-process` (3), `harness-build-config` (2), `harness-governance` (1), `harness-minimal` (1).

## SKILL.md format (distilled)

```md
---
name: harness-web-ui
description: "Task-agnostic lessons ... Use when building/fixing web UI, css, animation, theme, a11y, status dashboard, button state."
user-invocable: false
---
# Harness Web UI — Bài học task-agnostic (DisCo-lite)
> Chưng cất từ docs/knowleged.md + .agent/bugs/ — regenerate bằng distill-agnostic.mjs, KHÔNG sửa tay.
## When to Use / ## Bài học (per KN: title + severity + lesson 1 câu + phòng tránh bullets) / ## Anti-patterns / ## Nguồn
```

- Progressive disclosure: SKILL.md gọn (title + lesson + checklist), full text ở `references/evidence.md`.
- record.json: `{form:"task-agnostic", anchor:{knowleged:[...], bugs:[...]}, capabilities, checks, gaps:[], generatedAt, paper:"DisCo arXiv:2609.02749v1 §3.2"}`.
- Self-verify 4 checks (files-exist, frontmatter, record-complete, no-test-mutate-advice) → verdict `G-accepted`.

## skill-router.mjs — multi-source

- `SKILLS_DIR` giữ nguyên (backward compat, KN-002) → `.agent/skills`.
- Thêm `SKILLS_DIRS = [SKILLS_DIR, <root>/.github/skills]`.
- `readSkillDir(slug, base)`; `listSkills()` iterate cả 2, dedupe slug (`.agent/skills` ưu tiên); `getSkill` tìm across dirs; skip `.disabled/` (dot-prefix đã cover).

## Presets

- `full.json` + `lean-product.json`: thêm 5 skill `"harness-*": true`. Không đụng web-product/api-minimal (theo proposal gốc).

## States & verify
- `--dry`: in plan không ghi file. `--json`: machine-readable.
- Lỗi parse KN → warning + skip entry, không crash (tolerant như Phase 2).
