---
plan:
  main_task: "design-showcase-cut-critic — test Discover→Define→Deliver (seed + taste + Cut + critic)"
  is_greeting: false
  subtasks:
    - task_details: "Cut hero 30% — xóa info-bar + 2 pills + 2 CTAs thừa trong index.html"
      assigned_agent: implement
    - task_details: "Polish styles.css — Linear tokens + tighten hero + hairline restraint"
      assigned_agent: polish
    - task_details: "Critic loop fresh-context chấm /10 + fix gaps max 2 vòng"
      assigned_agent: polish
    - task_details: "Verify get_errors + responsive 375/768/1280 + export + STATUS"
      assigned_agent: verify
---

## Context
- PRD: `.agent/plans/design-showcase-cut-critic/prd.md`
- Design: `.agent/plans/design-showcase-cut-critic/design.md`
- Stack: vanilla HTML/CSS/JS, `www/styles.css` tokens, `www/design-showcase/` static Pages
- Discover: `linear.app` score 12, seed `9f2427e44d211655cbb62cba91e717c1`, taste Linear dark minimal

## Requirements
- Functional: hero gọn 30%, 2 pills + 2 CTAs, grid 1→2→3, search/filter/modal/toast giữ nguyên
- Non-functional: 0 dep mới, reuse `awesome-design-md`, native CSS, `get_errors` 0, a11y ≥95, 375/768/1280 không vỡ

## Architecture
- Files: `www/design-showcase/index.html` (Cut), `www/design-showcase/styles.css` (Linear tokens + tighten), `www/design-showcase/preview.html` (optional sync)
- Data: `designs.json` 74 không đổi
- Flow: Cut → Polish → Critic → Verify

## File Changes
| File | Action | Description |
|------|--------|-------------|
| `www/design-showcase/index.html` | edit | Xóa hero-info-bar, giảm meta 4→2 pills, hero-actions 4→2 CTAs, gọn status-bar |
| `www/design-showcase/styles.css` | edit | Override --color-primary #5e6ad2, tighten hero padding, hairline restraint, Cut chrome |
| `.agent/plans/design-showcase-cut-critic/plan.md` | create | This file |
| `www/status.json` | regenerate | via generate-status.mjs |

## Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Xóa nhầm CTA cần thiết | Giữ Demo + Random (P0), Về STATUS vẫn có ở header |
| Đổi primary ảnh hưởng global | Override scoped trong showcase styles.css, không sửa www/styles.css gốc |
| file:// CORS | Test bằng npx serve www |

## Verification Steps
- [ ] `get_errors` 0 cho 3 files
- [ ] Visual check 375/768/1280 (hero gọn, grid không vỡ)
- [ ] Critic ≥9/10 hoặc 3 gaps fixed
- [ ] `export-claude` + `generate-status.mjs` pass
- [ ] `designs.json` vẫn 74

## Todos (for manage_todo_list)
1. Cut hero 30% trong index.html
2. Polish styles.css Linear tokens
3. Critic loop + fix gaps
4. Verify + export + STATUS

---
*Plan — design-showcase-cut-critic · 2026-09-05 · YUNIE*
