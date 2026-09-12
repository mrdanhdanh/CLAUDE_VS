# Plan — CMB Anisotropy ship

> PRD: `prd.md` · Design: `design.md` · Evidence: `verify/` · Deploy: Pages workflow auto (www/ change)
> **Status: SHIPPED 2026-09-12** — TDD đầy đủ, suite 115/115, slop net-new 0.

## Todos ✅

- [x] 1. RED — spec `cosmos-cmb.spec.ts` (4 CLI + 3 UI) + sync `cosmos-future.spec.ts` (5→4 + counter) + `cosmos-slides.spec.ts` (4 chips + shipped-line CMB) → **9 failed đúng 9 test** (`verify/red-run.txt`), 2 test cũ còn lại vẫn xanh
  - Ladder nấc: 7 · Entangled with: `tests/e2e/cosmos-future.spec.ts`, `tests/e2e/cosmos-slides.spec.ts`, policy-check (test-mutate → actor verify)
- [x] 2. GREEN CLI — `auto-learn.mjs stats --heatmap [--json] [--out] [--now]` (7 helper: collectBugTagData/walkRefFiles/knDate/buildHeatmapGrid/buildColdSpots/buildZeroRef/statsHeatmap) → CLI 4/4 xanh; human output: 5 cold · 2 zero-ref · 101 tag × 2 tháng (`verify/cli-human.txt`)
  - Ladder nấc: 2 (reuse parseKNs) · Entangled with: `docs/knowleged.md`, `.agent/bugs/**`, `.agent/plans/**`
- [x] 3. GREEN UI — `scale.html#cmb` (giữa #hawking và #blackholes): CSS `.cmb-*` + header row + 12 row heat + note "+89 tag"; cold card (bh-item dynamic); zero card; `loadCmb()` + hook `#btnRefresh` → UI 3/3 xanh (`verify/cmb-section.png`, `cmb-375.png`, `cmb-full.png`)
  - Ladder nấc: 7 · Entangled with: `www/cosmos/heatmap.json`, `#btnRefresh`
- [x] 4. GREEN pages — `index.html` gỡ card CMB + counter "9 hướng cũ / còn 4"; `slides.html` shipped-line + CMB, 4 chips, h2/btn 4 → 3 spec 11/11 xanh, hết counter cũ (grep)
  - Ladder nấc: 6 · Entangled with: `www/cosmos/slides.html`, `www/cosmos/index.html`
- [x] 5. Mirror + refresh — `www/cosmos/heatmap.json` (13KB) + `cosmos:refresh` thêm bước; docs: SKILL §New Theory + system map + references, instruction §8, `.claude/rules/cosmic-quantum.md` mirror tay (không chạy export-claude — tránh sweep file session song song); mirrors graph/scale/hawking regenerated (heatmap.json KHÔNG bị flag dead filament)
  - Ladder nấc: 2 · Entangled with: `package.json`, `.github/skills/cosmic-quantum/SKILL.md`, `.github/instructions/cosmic-quantum.instructions.md`, `.claude/rules/cosmic-quantum.md`
- [x] 6. Verify — full suite lần 1: 114/115 (1 fail reveal 375px timeout 5s — isolated 3/3 xanh, trang còn ngắn hơn sau khi gỡ card → latency dưới tải 6 worker, KHÔNG phải regression) → bump 5s→8s cùng chuẩn với #1b (policy-check actor verify + comment lý do) → **lần 2: 115/115**; slop: before=after=13 findings (net-new 0, proof: diff insertion-only 142 dòng — logBug untouched, delta là parser artifact); evidence trong `verify/`
  - Entangled with: `scripts/slop-check.mjs`, playwright chromium
- [x] 7. Ship — audit log, commit explicit paths (KHÔNG đụng file session song song), push, deploy Pages, live verify
  - Entangled with: `.agent/scripts/audit.mjs`, `.github/workflows/pages.yml`

## Bằng chứng (verify/)

| File | Nội dung |
|------|----------|
| `recon.mjs` + `recon-output.txt` | Recon đầu: 48 KN · 29 bug · tag map · months · 3 zero-ref · top refs |
| `red-run.txt` | RED: 9 failed / 2 passed |
| `cli-human.txt` | Human output `stats --heatmap` (5 cold · 2 zero-ref) |
| `mirror-summary.txt` | Tóm tắt heatmap.json (counts + topRow + cold top3 + zeroRef) |
| `cmb-section.png` · `cmb-full.png` · `cmb-375.png` | Visual 1280 section, full page, 375 không tràn |
| `slop-check.txt` vs `slop-baseline.txt` | 13 = 13, cùng danh sách hàm → net-new 0 |
| `full-suite.txt` (114/115, 1 fail reveal) + `full-suite-2.txt` (115/115) | Honest artifact: cả 2 lần chạy |

## Guardrails (từ PRD/Design)

- KHÔNG stage: `README.md`, `docs/knowleged.md`, `www/status.json`, `www/cosmos/audit.json`, `.github/instructions/{agent-governance,auto-learn,cua-safety}*`, `.github/skills/harness-*`, `.claude/rules/{agent-governance,cua-safety}*`, `.claude/harness-export.json`, `.agent/scripts/policy-check.mjs`, `.agent/plans/rsi-singularity-lessons/` — **session song song**.
- Test edit: `policy-check --tool edit --target <spec> --actor verify` trước, audit sau (KN-012).
- `git add` explicit path từng file (không `git add -A`).

## Follow-up (debt ghi lại)

- `auto-learn.instructions.md` (session song song đang giữ) — khi họ commit xong: thêm 1 dòng `stats --heatmap` vào mục lệnh.
- KN-021 (governance RBAC) đã được tham chiếu lại bởi công việc RSI/red-team của session song song → zero-ref 3→2, tự nhiên hết nợ.
- 5 điểm lạnh hiện tại (`perf` `state` `chatbot` `demo` `reef-lite`) — ứng viên viết KN tiếp theo.

## Ship log (2026-09-12)

- **Commit:** `c1aaa44` (feature, 29 files) + `acdc65e` (screenshots, 38 png) — push `2a20911..acdc65e`
- **Deploy:** run `34696611064` success (Pages, sha acdc65e)
- **Live verify:** 18/18 PASS (`verify/live-verify.txt`) — scale.html#cmb · heatmap.json 48KN/101tag/5cold · index "9 hướng/4 đề tài" · slides shipped-line CMB
- **Audit:** chain verified sau ship
- **Chú ý:** không commit file session song song (RSI/red-team: policy.json, registry, cosmic-scale.mjs, status.json, audit.json, READMEs, knowleged.md, guard-redteam.spec.ts, cosmos-capability.spec.ts, test-results/cmb-out.json đã bị xoá khỏi tree)
