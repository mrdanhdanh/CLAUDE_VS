# PRD — Dark Energy D: sửa HIGH giả do mẫu toàn lịch sử

> Ship 2026-09-12 — user yêu cầu trực tiếp ("Dark Energy D HIGH, hãy sửa").
> Pipeline: `/harness` rút gọn (Explore quick → Clarify → PRD mini → Design mini → Plan → Implement → Polish → Verify).

## Vấn đề

`scale.json` báo `D=7 high` ("decollaboration đang nở rộng") trong khi thực tế **23/23 plans gần nhất (từ 2026-09-07, ngày KN-018 ra đời) chỉ thiếu 1 Dissent** (`web-011-part8`, birth 2026-09-09). D HIGH là **giả** — do `measurePlans()` đếm toàn bộ 72 plans kể từ 2026-08-29, gồm 49 plans sinh **trước khi gate tồn tại** (0/49 có Dissent là đúng luật thời đó). Metric trừng phạt quá khứ không thể sửa → alarm fatigue + Dissent gate mất uy tín.

## Giải pháp (GIỮ)

1. `cosmic-scale.mjs`: `measurePlans()` chỉ đếm plans có `prd.md mtime >= 2026-09-07` (ngày KN-018) — plans cũ hơn là "tiền-gate", không tính D/G. Thêm `plansLegacy` (số plans bỏ qua) vào output để minh bạch.
2. `web-011-part8/prd.md`: append 1 section `Who did you think with?` (Dissent thật cho plan đó) — plan duy nhất trong cửa sổ gate còn thiếu.
3. `scale.html#de`: hiển thị thêm dòng "tiền-gate: N plans (trước KN-018, không tính)" từ `plansLegacy` — dashboard trung thực, không sửa tay.

## Non-goals (CẮT — YAGNI)

- ❌ Backfill 49 PRD cũ bằng Dissent giả — viết Dissent cho quá khứ là bịa (Grice Quality), không ai review được.
- ❌ Đổi công thức `D = (1−dissentRatio)×10` hay thang high/medium/low — công thức đúng, chỉ sai mẫu.
- ❌ Gate `--budget/--trend` cho D — D là metric xã hội (informational), không phải nợ chặn feature như S.
- ❌ Xóa/archieve plans cũ để D đẹp — plans là trace pipeline (fund-the-friction), xóa là mất bằng chứng.

## Acceptance (rubric viết TRƯỚC — KN-037)

| # | Tiêu chí | Đo bằng |
|---|----------|---------|
| 1 | `D` sau fix ≤ 1 (23/23 dissent sau khi vá part8) | `node cosmic-scale.mjs --json` → `darkEnergy.D` |
| 2 | `plansLegacy = 49`, `plansTotal = 23` | cùng JSON trên |
| 3 | `web-011-part8/prd.md` chứa `Who did you think with?` | grep |
| 4 | `scale.html` hiển thị `plansLegacy` (không 404, không pageerror) | playwright `cosmos-dark-energy.spec.ts` (verify actor) |
| 5 | Full suite không regression | playwright full |
| 6 | Slop 0 findings trên file sửa | `node scripts/slop-check.mjs` |
| 7 | `npm run cosmos:refresh` ghi `scale.json` mới có `plansLegacy` | refresh + grep JSON |

## Persistence · F5 · Scope

`Persistence: www/cosmos/scale.json (commit file + routine daily refresh) · F5: giữ (data commit, UI fetch no-store) · Scope: global (mọi người xem cùng số)`.

## Cosmic-Quantum

Macro: D là lực nở của vũ trụ plans — đo sai mẫu = đo sai vũ trụ · Micro: 1 section Dissent append vào part8 = sụp đổ 1 trạng thái thiếu · Entanglement: `cosmic-scale.mjs` ↔ `scale.json` ↔ `scale.html#de` ↔ `web-011-part8/prd.md` ↔ instructions/SKILL (mô tả D — không đổi công thức).

## Who did you think with? (Dissent Review — KN-018)

- **Rival #1:** *"Backfill 49 PRD cũ cho D về 0 nhanh nhất."* Phản biện: Dissent viết sau cho quá khứ không ai challenge được = fake dissent (persona §16 cấm); 49 edits cũng vượt diff reviewable ~200 LOC (KN-047). Cửa sổ gate trung thực hơn.
- **Assumption có thể sai:** *"mtime prd.md = ngày sinh plan."* Đã verify: git birth (`git log --diff-filter=A --follow`) khớp mtime trong 5/5 mẫu (focus-flow 08-29, part8 09-09, escape/agentic/yt 09-12); plans là file commit, không ai touch mtime sau sinh.
- **Framing #3 (ngoài phạm vi):** *đo D theo 30 plans gần nhất (sliding window) thay vì cutoff cố định.* Bác bỏ: window trượt làm D nhảy khó giải thích ("sao hôm qua D=0 nay D=2 dù không thêm plan?"); cutoff ngày KN-018 là mốc luật cố định, đọc được bằng mắt.
