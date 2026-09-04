# Plan — DisCo Phase 3 (todo-driven)

| # | Task | File | Test |
|---|------|------|------|
| 1 | Viết distill-agnostic.mjs (parse KN+bugs → group theme → generate 5 skill + self-verify) | `.github/harness/scripts/distill-agnostic.mjs` | `node --check` + chạy `--dry` rồi thật |
| 2 | skill-router multi-source | `www/library/skill-router.mjs` | `node --check` + MCP smoke |
| 3 | Presets full/lean-product thêm 5 skill | `.github/harness/presets/{full,lean-product}.json` | `harness-manager preset list` + JSON.parse |
| 4 | Verify: chạy distiller → harness-manager status (auto-register) → MCP smoke (list/search/get) → eval-gate → generate-status | — | bằng chứng terminal |
| 5 | Audit log + audit verify + Done | — | chain OK |

## Rủi ro & phòng tránh
- Parse KN sai format → tolerant skip + warning (KN-007 style robust split).
- Slug collision `.agent` vs `.github` → first-dir-wins, ghi `source` trong output.
- Registry lệch → KHÔNG sửa tay, để scanFs bootstrap; verify bằng `harness-manager status`.
- Test immutable (KN-012): không đụng `*.test.*`; verify bằng evidence thật (fresh eyes KN-005).
