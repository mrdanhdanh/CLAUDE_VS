# Plan — YUNIE Power Sweep

## Files
- Create `.github/harness/scripts/power-check.mjs` (~130 dòng)
- Edit `package.json` — script `"power"`
- Edit `.github/harness/evals/components.json` — entry `power-check-self-test`
- Edit `.github/agents/yunie.agent.md` — bước 0 của "Kiểm tra tình trạng"
- Edit `docs/capabilities.md` — 1 dòng lệnh tổng hợp

## Todos
1. RED: chứng minh `power-check.mjs` chưa có (self-test command fail) — evidence.
2. Implement `power-check.mjs`: registry data-driven + `runChecks(checks, runner)` injectable + `checkStatusMirror()` local + format human/JSON + arg whitelist (exit 2).
3. Wire `package.json` + `components.json`.
4. YUNIE agent §2: `npm run power` là bước 0; sync `.claude/agents/yunie.md` qua export-claude (kiểm diff, revert file ngoài scope nếu có).
5. Verify: `--self-test`, `npm run power` (thật), eval-gate components + all, slop-check, get_errors, budget vẫn ≤1100.
6. Critic độc lập trước khi đóng; full Playwright suite làm bằng chứng cuối.
7. Regenerate `www/status.json` + report.

## Risks
- Check nào phụ thuộc mạng? Không — toàn bộ offline deterministic.
- `auto-learn status` fail nếu drafts>0? Không, nó là info; marker `KN ID integrity OK` vẫn in khi drafts>0 → power không phạt drafts (đúng: drafts là trạng thái, `health=warn` do generate-status xử lý).
- Timeout tổng: mỗi check ≤60s nhưng thực tế <5s; nếu có check treo → fail check đó, không treo cả lệnh.

## Addendum 2026-09-25 — Critic round + full-suite evidence (KN-078)
- **Critic (read-only) findings:** B1 `registry` không thể fail (marker liveness) · B2 `guards` không thể fail (không exit) · M1 mirror stale-green · M2 self-test thiếu negative control · M3 evals chỉ `--scope components`.
- **Đã xử lý:** registry → forbid `⚠️ mismatch`/`❌ missing`; guards → `--json` + floor `withGuard ≥ 50`; status-mirror → freshness (registry mtime) + đủ 5 counts; thêm link `cosmos-freshness` (scale.json < 24h, khớp badge); evals → `--scope all`; self-test 6 → 7 case + 2 negative probe thực thi; `isMain` → repo idiom.
- **Full suite:** lượt 1 `285/288` (1 real stale mirror + 2 timeout flake do tải — isolate: lab12 8/8 · rework 15/15 · freshness 4/4) → refresh mirrors → lượt 2 **288/288 pass**.
- **Follow-up đã ghi nhận (chưa làm, bounded):** một registry duy nhất với eval-gate (adopt runner no-shell của power) · đưa `npm run power` vào CI · marker Việt hoá dễ vỡ khi đổi message (hiện fail-loud, không false-green).
