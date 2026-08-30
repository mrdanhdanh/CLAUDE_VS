# Plan: Auto-Learn

## 1. Architecture
- Script: `.github/harness/scripts/auto-learn.mjs` (no deps, Node 18+)
- Instruction: `.github/instructions/auto-learn.instructions.md`
- Agent: `.github/agents/learn.agent.md`
- Hooks: update `.github/hooks/hooks.json`
- Registry: auto via harness-manager create

## 2. File Changes
| File | Action | Mô tả |
|------|--------|-------|
| `.github/harness/scripts/auto-learn.mjs` | create | CLI suggest/log/propose/status |
| `.github/instructions/auto-learn.instructions.md` | create | enforce auto-learn |
| `.github/agents/learn.agent.md` | create | delegate learn |
| `.github/hooks/hooks.json` | edit | thêm PostToolUse/Stop reminders |
| `docs/knowleged.md` | edit (verify) | cập nhật nếu cần |
| `www/status.json` | regenerate | thêm learn stats (optional) |

## 3. Todos
1. Tạo auto-learn.mjs (parse + suggest + log + propose + status)
2. Tạo instruction auto-learn
3. Tạo agent learn
4. Cập nhật hooks.json
5. Test CLI + verify + cập nhật registry/status

## 4. Risks
- Parse knowleged.md sai format → test với file thật
- Hooks quá ồn → chỉ echo ngắn gọn
- Registry sync → dùng harness-manager create

## 5. Verify
- `node auto-learn.mjs status` → KN 6, bugs 5
- `node auto-learn.mjs suggest "rainbow"` → KN-003/004
- `node auto-learn.mjs suggest "theme sang"` → KN-006
- `node auto-learn.mjs log --error "test"` → tạo bug draft
- `node auto-learn.mjs propose --bug <slug>` → KN draft
- `get_errors` pass
