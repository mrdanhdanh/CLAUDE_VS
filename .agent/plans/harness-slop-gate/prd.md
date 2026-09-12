# PRD mini — Slop Gate (KN-047)

**Task:** Áp 5 delta từ "The Slop Should Not Be Tolerated" (HackerNoon 12/09/2026) vào harness: máy check slop + 4 rule nhỏ.

**User story:** Khi YUNIE/agent extend code qua nhiều iteration, code có thể pass mọi test mà vẫn phình duplication/complexity (SlopCodeBench: 3/4 runs). Harness phải có **command** phát hiện slop trước khi Done — không dựa vào "model thấy ổn".

**Scope:**
- `scripts/slop-check.mjs` (mới, 0-dep): duplication ≥8 dòng (cross-file) · function >80 dòng · CC >12 · skip generated/vendor · gate mode exit 1.
- Wire: `verify.prompt.md` (Slop Gate step 3b) + `evals-gate/SKILL.md` (Slop dimension + checklist).
- Rule: ~200 LOC reviewable → `minimal-ladder` + `harness-workflow`.
- Rule: loop-it + spec-vs-wish → `harness-workflow` (+ verify.prompt).
- `docs/knowleged.md` KN-047 (summary + detail + anti-patterns + checklist + UpdatedAt).
- `package.json`: `slop:check` (audit mode).
- Regen `.claude/` qua export-claude.

**Non-goals:** Không fix mutation.mjs (task riêng — xem gap-analysis "Gap còn lại"); không thêm dependency; không property-test lib; không CI split.

**Who did you think with?:** Dissent trong gap-analysis (vested-interest framing) — 9/14 items đã có, chỉ áp 5 delta, từ chối 3. Critic review độc lập ở Verify.

**Persistence:** N/A (script + instruction files — git tracked) · F5: N/A · Scope: repo-wide.

## Acceptance
- [ ] slop-check: fixture có dup + CC cao → báo đúng + exit 1; self-scan clean; scan mode exit 0.
- [ ] 5 file rule/prompt updated; KN-047 đầy đủ 4 mục.
- [ ] export-claude --check = 0 diffs; get_errors sạch; e2e suite không regression.
