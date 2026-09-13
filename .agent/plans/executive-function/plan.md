# Plan — Executive Function × Harness (KN-054)

> Pipeline: `/harness` C-path (instruction + vận hành + trang). Model-agnostic, 0-dep.
> Thứ tự thi hành tối ưu cho "người đọc diff": instruction → knowledge → output rules → mirror → page → status → test.

## Todos

- [ ] **1. Instruction mới (create + content)** — Ladder nấc 2 (tái dùng template `harness-manager`) · Entangled: `.github/harness/registry.json`, `.claude/rules/`
- [ ] **2. KN-054 + anti-patterns** — Ladder nấc 2 (dùng format KN có sẵn) · Entangled: `docs/knowleged.md` (bảng + chi tiết + anti-patterns), `auto-learn` đếm KN
- [ ] **3. Output rules** — §18 vào `yunie-personality`, bullet `yunie.agent.md`, focus guard `harness-workflow` — Ladder nấc 6 (thêm mục ngắn, không tạo file mới) · Entangled: 3 files trên + user-facing behavior
- [ ] **4. export-claude mirror** — Ladder nấc 4 (lệnh có sẵn) · Entangled: `.claude/rules/*`
- [ ] **5. Trang `www/executive-function/`** — Ladder nấc 4 (native HTML/CSS/JS, house tokens, không lib) · Entangled: `generate-status.mjs`, tests, waymo-effect pattern
- [ ] **6. Status register + regenerate** — thêm `pageMeta` — Ladder nấc 6 (1 dòng map) · Entangled: `www/status.json` → dashboard
- [ ] **7. E2E test + chạy suite** — Ladder nấc 2 (pattern web-thuat-toan.spec) · Entangled: `tests/e2e/` + CI
- [ ] **8. Verify cuối** — slop-check + link check + audit + freshness (KN-023: đo, không đoán)

## Governance
- Mọi mutation chính qua `policy-check` + ghi `audit.mjs` (agent-governance).
- Không sửa test hiện có; test mới là file mới (được phép — không mutate verifier).
- `harness-manager` là đường duy nhất tạo instruction (registry sync — không sửa tay).

## Risks
- R1: Trang đè lên test status (counts) → đã check: không test nào hardcode số trang.
- R2: Lab timing 6s → test dùng timeout 10s, không dùng wall-clock cứng (KN-031).
- R3: Font блок Google Fonts → theo house dùng `display=swap` + không chặn script? House pages đều dùng `<link>` trong head (script-blocking risk KN-029) — page này KHÔNG có inline script phụ thuộc fonts vì JS của page nằm cuối body + chỉ là lab tương tác, chấp nhận pattern house như waymo-effect. (Không intro overlay nên không kịch bản kẹt màn hình.)
- R4: IO dots nav chết khi section thiếu id → invariant test "mọi target resolve" (KN-046).
