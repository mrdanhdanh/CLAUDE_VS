> 🤖 Auto-log bởi auto-learn.mjs — 2026-09-16T14:51:15.771Z
> **Error:** `Instruction pool applyTo ** phinh khong ngan sach: 17/19 file always-on = 1395 dong (~25k tokens) load moi session; Anti-Patterns 'Never section' chi co dong luc them khong co dong luc xoa; khong co gate nao FAIL khi pool phinh`
> **File:** `.github/instructions`
> **Title:** instruction budget always-on phinh khong nguong

> 🔁 **RADAR TÁI LẬP** — đối chiếu KN + bug cũ thấy nghi vấn:
> - 🔁 NGHI TÁI LẬP **[KN-037]** (score 90.9): Evals Gap — "single biggest predictor" là evals discipline (Andrew Ng, Agentic AI Playbook 2026)
> - 🔁 NGHI TÁI LẬP **[KN-053]** (score 57): `git checkout HEAD -- <file>` revert nhầm refactor chưa commit — recover bằng VS Code Local History
> - 🔁 NGHI TÁI LẬP **[KN-015]** (score 47.7): GitHub Pages deploy fail — 2 workflows cùng `github-pages` env + eval-gate Node 18 CJS
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-14-routing-failover-chuan-hoa-pattern-khoa-luoi`** (score 57.4): Routing & Failover cho chain model/provider — chuẩn hoá pattern + khoá lưới chuỗ
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-10-observatory-fetch-404-ngoai-www-va-relative-url`** (score 44): observatory-fetch-404-ngoai-www-va-relative-url
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-04-pages-deploy-conflict-2-workflows`** (score 34.8): pages deploy conflict 2 workflows
> → Đã đọc Cách phòng tránh KN-037/047/056 trước khi làm. **Kết luận radar: KHÔNG phải tái lập thật** — mọi hit là false positive BM25 (khác chủ thể/nguyên nhân gốc). Đây là bài học MỚI → tạo lưới mới (không phải nâng lưới cũ).
# Bug/Lesson: instruction budget always-on phình không ngưỡng

## Meta

- **Slug:** `2026-09-16-instruction-budget-always-on-phinh-khong-nguong`
- **Ngày:** 2026-09-16
- **Severity:** `major`
- **Layer:** `process` — tầng tri thức/đo lường: không gate nào FAIL khi pool instruction phình.
- **Reporter:** YUNIE (`/article-lesson` — HackerNoon "How to Write a CLAUDE.md That Actually Helps Claude Code", Xi Yang, 16/09/2026; mirror `www/ai-news/curated.json`)
- **Related KN:** `KN-068`
- **Tags:** `process` `knowledge` `wise-loading` `token-budget` `guard`
- **Guard:** `tests/e2e/instruction-budget.spec.ts` + `npm run budget:check` (ratchet 1400)
- **Status:** `fixed`

---

## 1. Reproduce

### Steps
1. Chạy `node scripts/instruction-budget.mjs` (script mới, đo thật).
2. Quan sát: pool always-on (`applyTo: "**"`) = **17/19 files · 1395 dòng · ~24,916 tokens** — load MỌI session bất kể task.
3. Grep `applyTo` → kể cả file chuyên biệt (`awesome-design` 70 dòng — chỉ cần khi task UI; `platform-seam` 79 dòng — chỉ khi thêm capability; `plugin-seam` 56 dòng) đều `**`.
4. Không có lệnh nào FAIL khi thêm file/dòng always-on mới (trước 16/09).

### Expected vs Actual
- **Expected:** Pool always-on có ngân sách đo được + gate chặn phình; file chuyên biệt path-scoped; anti-pattern máy giữ được thì trỏ check, không restate.
- **Actual:** 1395 dòng always-on không ngân sách/không gate; §7 Anti-Patterns 21 mục trộn cái-máy-giữ với cái-người-phải-nhớ; pattern "Never section" (chỉ có động lực thêm) bắt đầu hình thành.

### Evidence
- Đo thật (script mới):
```
📏 Instruction Budget — .github\instructions
Tổng: 1571 dòng (~27093 tokens) · 19 files
Always-on ("**"): 17 files · 1395 dòng (~24916 tokens)
On-demand (scoped): 2 files · 176 dòng
Top always-on: yunie-personality (217) · agent-governance (130) · harness-workflow (128) · library-rag (117) · auto-learn (107) · platform-seam (79) · cosmic-quantum (75) · awesome-design (70)
```
- Nguồn bài học: bài gốc 16/09 — "Never section chỉ có motivation to add, never to remove... turns into a graveyard of historical incidents"; "a good CLAUDE.md should be under 200 lines"; "leave a lot of that to hooks".

### Environment
- Branch: `main` · OS: Windows · Node 18+ · Đo tại session 2026-09-16.

---

## 2. Root Cause (5 Whys)

- **File:Line:** `.github/instructions/*.instructions.md:3` (`applyTo`) + `scripts/instruction-budget.mjs` (chưa tồn tại trước fix)
- **Why 1:** Mỗi capability mới (platform-seam, plugin-seam, executive-function...) được thêm file riêng với `applyTo: "**"` — không ai đo TỔNG.
- **Why 2:** Instruction chỉ có cơ chế write — không có kế toán (accounting) đếm dòng/token theo `applyTo`.
- **Why 3:** Thêm instruction rẻ (1 file md), phát hiện pool phình đắt (đo tay) → mất cân bằng incentive: chỉ có động lực thêm, không có động lực xóa/gộp.
- **Why 4:** Cùng họ KN-047 (exit condition = vibe không command) + KN-056 (rule không lưới = wishlist) — nhưng áp ở tầng instruction pool chưa ai chạm.
- **Why 5 (Root):** Vùng "always-on" không có invariant đo được: chặn phình cần (a) số đo + (b) ngưỡng + (c) lệnh FAIL — thiếu cả 3 → trôi tự do (drift) như mọi wishlist khác.

- **Impact:** Mọi session trả ~25k token thuế thường trú (context window + chi phí + nhiễu attention) bất kể task — task UI trả thuế cho platform-seam, task backend trả thuế cho awesome-design. Không bug nào đỏ khi thêm file → trôi âm thầm.
- **Hypothesis:** Có ngân sách + ratchet + gate → thêm file mới buộc path-scope hoặc gộp. Đã verify bằng script + spec.
- **Confidence:** `HIGH` — đo thật trước/sau; gate khoá bằng 3 test (fixture vượt/trong + fail-closed); batch 18/18 + full suite 206 pass (7 cosmos fail = flake parallel — solo 23/23 pass).

---

## 3. Fix

- **Approach:** Đo trước — gate sau — phân loại cuối (bounded; KHÔNG đổi semantics `applyTo` của 17 file khi chưa có eval riêng):
  1. `scripts/instruction-budget.mjs` — kế toán dòng/~token theo `applyTo`; gate `--budget` exit 1; fail-closed exit 2.
  2. Ratchet: freeze pool tại mức đo được (1395 → ngưỡng 1400) + `npm run budget:check`.
  3. `tests/e2e/instruction-budget.spec.ts` — khoá 4 invariant: JSON hợp lệ + alwaysOn khớp tổng + ratchet + gate/fail-closed.
  4. §7 Anti-Patterns: quy ước "🤖 = máy đã giữ (trỏ check, đừng restate; mục mới phải kèm guard hoặc lý do không-guard-được)" — audit 21 mục: 3 mục trỏ guard thật (`angle.spec`+`cosmos-rework.spec` cho --angle; `hooks-integrity.spec` cho PS syntax; `slop-check.mjs`+`eval-gate.mjs` cho Evals/Slop gate); 18 mục còn lại là agent-behavior → máy không bắt được → giữ prose (không flip mù — bounded edit KN-060).
- **Files Changed:**
  - `scripts/instruction-budget.mjs` — script mới (0-dep, Node 18+).
  - `tests/e2e/instruction-budget.spec.ts` — guard mới (3 test).
  - `package.json` — thêm `budget:check`.
  - `.github/copilot-instructions.md` — §7 quy ước 🤖 + 3 pointer.
  - `CLAUDE.md` + `.claude/` — regen qua `harness-manager export-claude` (không sửa tay).
- **Diff tóm tắt:**
```diff
+ scripts/instruction-budget.mjs (mới)  + tests/e2e/instruction-budget.spec.ts (mới)
+ package.json: "budget:check": "node scripts/instruction-budget.mjs --budget 1400"
~ .github/copilot-instructions.md §7: quy ước 🤖 + 3 pointer guard
```
- **Non-Goals:** KHÔNG đổi `applyTo` các file hiện có; KHÔNG thêm workflow CI mới; KHÔNG flip toàn bộ 21 anti-pattern sang positive rule.
- **Fix Confidence:** `HIGH`.
- **get_errors:** affected files 0 errors; full scope 0 errors.

---

## 4. Verification

- [x] Re-run steps reproduce → **Fixed** (Expected = Actual): script báo cáo chuẩn, pool 1395 ≤ 1400 (headroom 5).
- [x] Edge cases:
  - [x] fixture 63 dòng always-on + `--budget 10` → exit 1
  - [x] dir rỗng / không tồn tại → exit 2 (fail-closed)
- [x] Regression: batch 4 specs 18/18 pass; full suite 206 pass (7 fail cosmos = flake parallel — `--workers=1` 23/23 pass, không regression từ thay đổi này).
- [x] `get_errors` toàn scope → 0 errors.
- [x] Slop gate (KN-047): lần 1 bắt `main()` 84 dòng/CC 23 → refactor `parseArgs/readRows/buildReport/printReport` → ✅ clean exit 0.
- [x] `export-claude --check` → không drift.
- [x] Fresh-eyes tier: `RECOMMENDED` (regression-prone — batch + full suite đã chạy).

**Kết quả:**
```
budget:check → ✅ Trong budget 1400 dòng (always-on 1395, headroom 5) · exit 0
instruction-budget.spec.ts → 3 passed
export-claude --check → ✅ khớp
slop-check → ✅ Clean
```

---

## 5. Lesson (1 câu)

> Pool instruction always-on (`applyTo: "**"`) là thuế token thường trú — phải có số đo + ngưỡng (ratchet) + lệnh FAIL, và anti-pattern nên phân loại theo "máy giữ được không": cái máy giữ rồi thì trỏ check, không restate.

---

## 6. Prevention

- **Cách phòng tránh lần sau:**
  - [x] Thêm file/dòng always-on mới → chạy `npm run budget:check` trước khi Done; vượt 1400 → path-scope (`applyTo` hẹp) hoặc gộp.
  - [x] Anti-pattern mới: nếu máy giữ được → thêm guard + trỏ check; không thì ghi rõ lý do không-guard-được (quy ước 🤖 §7).
- **Guard (lưới chống tái lập — KN-056):**
  - [x] `- **Guard:**` đã điền: `tests/e2e/instruction-budget.spec.ts` + `npm run budget:check`.
  - [x] Không phải tái lập (RADAR false positive — đã ghi ở đầu file).
- **Cần cập nhật:**
  - [x] `docs/knowleged.md` → `KN-068` (Bảng tóm tắt + Chi tiết) — paste sau khi `propose` sinh draft.
  - [x] Guard mới: `tests/e2e/instruction-budget.spec.ts`.

---

## References

- `docs/knowleged.md#KN-068` · `docs/knowleged.md#KN-047` (slop/exit-condition) · `docs/knowleged.md#KN-056` (guard)
- Nguồn: HackerNoon 16/09/2026 (mirror `www/ai-news/curated.json` entry `curated-hackernoon-claudemd-resume`)
- Plan: `.agent/plans/instruction-budget/`
