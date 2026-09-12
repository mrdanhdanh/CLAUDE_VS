# PRD (mini) — ⚫ Hawking Radiation · Nợ bay hơi (auto-learn watchdog)

- **Ngày:** 2026-09-12 · **Actor:** YUNIE · **Nguồn:** user "xử lý" **Dissent của Cosmic Web** — framing đối lập nói rõ: *"graph là vanity metric, Hawking watchdog ROI cao hơn"*. Xử lý thật = ship chính cái rival, không để dissent nằm trong reply (KN-018: không fake dissent).
- **Cosmic-Quantum:** Macro — nợ bug là khối lượng; lỗ đen không "ăn" thì **bay hơi**: draft già đi theo thời gian thay vì tích tụ tới heat death · Micro — mọi ngưỡng/entry đo được (ageDays, journal, fixture test) · Entanglement — `auto-learn.mjs` ↔ `www/cosmos/hawking.json` ↔ `scale.html#hawking` ↔ `cosmos-hawking.spec.ts` ↔ roadmap/slides ↔ routines.

## Vấn đề (evidence-based)
| # | Vấn đề | Bằng chứng |
|---|--------|-----------|
| 1 | Draft bug mở **không có cơ chế già hoá** — nằm mãi hoặc bị quên; `status` chỉ đếm `drafts>0` chung chung, không biết cái nào 40 ngày, cái nào 200 ngày | `auto-learn.mjs:782` chỉ `isOpen ? drafts++` |
| 2 | Entropy S tính `drafts×5` nhưng **drafts không tự phân rã** → heat death tích tụ (đúng cái card Hawking mô tả) | `cosmic-scale.mjs:104` |
| 3 | Roadmap card Hawking ghi ">30d escalate · >90d tự đóng/hoá KN" — chưa có script | `index.html#future-grid` |

## Giải pháp
`auto-learn.mjs watchdog` — phân rã nợ theo thời gian:
1. Quét `<dir>/*/bug.md`, chỉ tính bug **open**; tuổi = ngày trong slug `YYYY-MM-DD-*` (fallback mtime).
2. Phân hạng: `fresh` (<30d) · `escalate` (≥30d → journal + nhắc) · `evaporate` (≥90d → journal + note `hawking.md` + đổi `Status: open` → `` Status: `evaporated` `` kèm lý do).
3. `--apply` ghi **journal append-only** `.agent/hawking.jsonl` (idempotent — chỉ ghi khi action ĐỔI); note gợi ý `propose --bug` để **chuyển hoá thành KN** (không đóng mất kiến thức).
4. `--out www/cosmos/hawking.json` (mirror trong `www/` — KN-030) + chain `cosmos:refresh`.
5. Section `#hawking` trên `scale.html` + routine nhắc hằng tuần.

## Non-goals (YAGNI — CẮT)
- CẮT: tự xoá bug dir (không bao giờ — lịch sử là tài sản; chỉ đóng kèm note).
- CẮT: cron riêng/daemon — dùng routine có sẵn (floor 15m).
- CẮT: sửa `cosmic-scale.mjs` (entropy đã đếm `open`; `evaporated` tự rớt khỏi công thức — đã verify `cosmic-scale.mjs:104`).
- CẮT: UI mới ngoài 1 section (reuse `.bh-item`/`.fresh`/`.part`).

## Persistence · F5 · Scope
`Persistence: .agent/hawking.jsonl (append-only) + hawking.md per bug + www/cosmos/hawking.json (generated, committed) · F5: n/a trên trang (read-only) · Scope: repo-level (không phải per-browser)`

## Follow-up — siết gate: Human sign-off (2026-09-12, user duyệt)

**Yêu cầu:** "Sếp muốn gate chặt hơn (vd require human sign-off)" → OK.

**Thiết kế (tách intent/execution — rogue-trader hardening §3):**
1. `watchdog --apply` **thiếu `--sign`** → **REFUSED exit 2** + in **dry-run plan** (human review trước khi ký) + **không ghi gì** (fail-closed).
2. `--sign` bằng **danh tính agent** (`YUNIE/agent/bot/copilot/verify/implement/critic/ci…`, kể cả chứa trong tên như `ci-bot`) → **REFUSED exit 2** — agent không tự ký được.
3. `--sign "<tên người>"` hợp lệ → áp dụng; journal ghi `signedBy` (audit: ai ký, ký cái gì, lúc nào).
4. Routine tuần `3bf2c8` đổi prompt: agent chỉ **đề xuất + in dry-run** cho human duyệt — không tự apply.

**Acceptance:** 3 test mới (thiếu sign / agent sign / human sign + `signedBy` trong journal) — RED 3 fail → GREEN 5/5 toàn spec.

## Who did you think with? (Dissent — KN-018)
- **Framing đối lập:** *"tự đổi Status bug.md là mutation nguy hiểm — script sửa lịch sử bug report"*. Xử lý: (a) chỉ đổi **đúng 1 dòng Status** `open`→`evaporated`, không xoá gì; (b) ghi **note `hawking.md` nguyên nhân + ngày** trước khi đổi; (c) journal ghi lại state transition (ai/lúc nào/tuổi) → audit được; (d) `--apply` là **opt-in**, mặc định chỉ báo cáo.
- **Rival khác đã cân nhắc:** đo tuổi bằng git blame/mtime bug.md (chính xác theo "lần sửa cuối") → chọn **ngày trong slug** vì đó là "ngày bug nổ" — đúng ngữ nghĩa bay hơi; mtime đổi mỗi lần append nên sai. Fallback mtime chỉ khi slug không có ngày.

## Acceptance (Evals rubric — viết TRƯỚC, KN-037)
- [ ] Fixture: 4 bug (3 open tuổi 254/42/2 ngày + 1 fixed) → counts `{bugsTotal:4, open:3, fresh:1, escalate:1, evaporate:1, closed:1}`, ageDays đúng, sort desc.
- [ ] `_template/` bị bỏ qua · slug không có ngày → fallback mtime (không crash).
- [ ] `--apply` lần 1: journal 2 entry · bug 254d `Status: → evaporated` · note `hawking.md` tồn tại (có ngày + gợi ý propose).
- [ ] `--apply` lần 2 (idempotent): journal **không thêm** entry trùng; bug evaporate không còn trong open.
- [ ] `--out` ghi JSON hợp lệ; `--now` cho kết quả tất định.
- [ ] `scale.html#hawking`: render từ `hawking.json` thật (fetch 200, rows khớp), empty-state khi open=0, no pageerror; 375 không tràn.
- [ ] `cosmos:refresh` sinh `hawking.json`; roadmap/slides sync (7 hướng đã ship); full suite xanh.
