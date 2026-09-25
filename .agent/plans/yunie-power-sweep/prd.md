# PRD mini — YUNIE Power Sweep (1 lệnh = toàn bộ health)

**Task:** Nâng cấp YUNIE bằng MỘT lệnh kiểm tra sức khỏe toàn hệ thống, fail-closed, có bằng chứng "đã chạy".

## Vấn đề (evidence)
- "Kiểm tra tình trạng hệ thống" hiện là checklist tay 6 bước trong `yunie.agent.md` §2 — không gì chặn việc YUNIE chạy thiếu bước (KN-074: gate không chứng minh đã chạy).
- Các check rời rạc: registry status (harness), doctor, audit chain, policy, budget (KN-068), KN id integrity, guards coverage, component evals, status.json mirror. Không có lệnh gộp nào cover hết.
- CI Pages chỉ chạy `eval-gate --scope www/library` → phần lớn health không được kiểm tự động.

## User story
- Là YUNIE/dev, tôi gõ `npm run power` và nhận scoreboard ✓/✗ toàn hệ thống trong < 60s; có bất kỳ ✗ hoặc check nào im lặng (exit 0 nhưng không có output marker) → exit 1 + chỉ rõ check nào.

## Scope In
- Script `power-check.mjs`: chạy N check deterministic (spawn node con), mỗi check cần **exit đúng + marker chứng minh đã chạy**.
- Fail-closed: thiếu marker = FAIL (KN-074); arg rác/flag lạ = exit 2 (KN-069); có `--json`, `--self-test` (3 case synthetic).
- Wire: `package.json` script `power`, component eval `power-check-self-test`, YUNIE agent dùng làm bước 0.

## Scope Out (YAGNI — CẮT)
- ❌ Không thêm dependency, không daemon, không watch mode.
- ❌ Không thay `eval-gate`/`generate-status` (reuse, không rewrite) — power gọi lại chúng.
- ❌ Không sửa CI workflow (Pages vẫn chỉ eval www/library — wc ngoài scope).
- ❌ Không auto-fix khi fail — chỉ báo + chỉ lệnh fix.

## Success Metrics
- `npm run power` exit 0 khi mọi check xanh; exit 1 nếu bất kỳ check fail/missing marker.
- `--self-test` pass 3 case (pass / missing-marker→FAIL / exit-mismatch→FAIL).
- Diff ≤ ~200 LOC, slop-check clean.

## Who did you think with?
- **Framing đối lập (rival):** "Chỉ cần `eval-gate --scope all` là đủ, thêm lệnh mới = duplication (KN-047 slop)." → Cân nhắc thật: eval-gate KHÔNG cover audit chain, policy, budget, KN id integrity, guards coverage, status mirror, doctor. Rival bị bác bằng grep: 7/9 mắt xích không nằm trong eval-gate. Bài học áp dụng: KN-069 (arg fail-closed), KN-074 (prove-it-ran), KN-068 (budget không bị ảnh hưởng vì không thêm instruction always-on).
