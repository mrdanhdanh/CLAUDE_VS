# Plan — dream-simulator

> Kích hoạt thủ công: `node .github/harness/scripts/dream.mjs score --file <candidate.md>` · `npm run dream`

- [ ] T1 `dream.mjs`: args + help + constants (Ladder nấc 7 — CLI mới tối thiểu) · Entangled: `kn-parse.mjs`
- [ ] T2 `dream.mjs`: battery (integrity gate + recall@K + guards) (nấc 2 — reuse scoring) · Entangled: `kn-parse.mjs` (parity `suggest`)
- [ ] T3 `dream.mjs`: `run` + π0-in-set + `--json` · Entangled: output schema ↔ spec
- [ ] T4 `package.json`: npm script `dream` · Entangled: none
- [ ] T5 `tests/e2e/dream.spec.ts`: 5 test hermetic (deterministic · tốt/xấu · π0-in-set+no-write · gate dup · fail-closed) · Entangled: `dream.mjs` CLI surface
- [ ] T6 Verify: real run trên `docs/knowleged.md` + playwright + slop-check + `get_errors`

Non-goals (ghi rõ): auto-write · generator · LLM judge · replay cho bề mặt chưa có history-link.
