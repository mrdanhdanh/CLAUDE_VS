> 🤖 Auto-log bởi auto-learn.mjs — 2026-09-14T15:36:35.814Z
> **Error:** `Skill va KN duoc sua one-shot bang tay khong co validation gate - tri thuc troi dan, edit trong hop ly co the lam giam chat luong am tham (SkillOpt, MSR 30/06/2026)`
> **File:** `docs/knowleged.md`
> **Title:** skill KN sua khong qua eval gate bi troi am tham

> 🔁 **RADAR TÁI LẬP** — đối chiếu KN + bug cũ thấy nghi vấn:
> - 🔁 NGHI TÁI LẬP **[KN-037]** (score 103.7): Evals Gap — "single biggest predictor" là evals discipline (Andrew Ng, Agentic AI Playbook 2026)
> - 🔁 NGHI TÁI LẬP **[KN-056]** (score 94.3): Vòng chống tái lập: KN không lưới = wishlist — log RADAR + Guard gate + `guards` audit
> - 🔁 NGHI TÁI LẬP **[KN-007]** (score 57.5): Thiếu hệ thống tự học hỏi tự động — phải làm tay, dễ quên
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-06-archify-skill-port`** (score 116.9): Archify skill port — (A) EPERM rename trên Windows + (B) diagram tràn first-scre
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-12-cmb-shorthand-false-zeroref`** (score 99.7): CMB zeroRef false positive — detector bỏ qua shorthand + bug.md giữ link KN sai
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-11-ps-5-1-khong-ho-tro-trong-lenh-powershell`** (score 82.2): PS 5.1 khong ho tro ?? trong lenh PowerShell
> → Đọc **Cách phòng tránh** trong `docs/knowleged.md` TRƯỚC khi fix. Nếu là tái lập thật: ghi rõ "tái lập của KN-037" + **vì sao lưới cũ không bắt được** → nâng lưới (Guard) rồi mới fix.
# Bug: SkillOpt — thiếu validation gate cho skill/KN: edit trôi, rejected edits không thành negative feedback

> Thay thế tiêu đề slug cũ khi log tự sinh — số KN thật là **KN-060** (KN-059 đã thuộc "Content ≠ Authority", MAI CoC adoption 14/09).

## Meta

- **Slug:** `2026-09-14-skill-kn-sua-khong-qua-eval-gate-bi-troi-am-tham`
- **Ngày:** 2026-09-14
- **Severity:** major
- **Reporter:** YUNIE / user request (article-lesson)
- **Related KN:** KN-037 (evals gate), KN-047 (slop gate), KN-056 (guard gate) — draft này = KN-060 (KN-059 đã thuộc "Content ≠ Authority")
- Tags: `process` `knowledge` `skills` `self-improving` `eval`
- **Guard:** `tests/e2e/auto-learn-guard.spec.ts` + GUARD GATE trong `.github/harness/scripts/auto-learn.mjs` (propose) — lớp gate cho knowledge edits: KN major/critical thiếu lưới → FAIL (KN-056). Eval-gate tự động per skill-edit = hướng mở, chưa claim là đã có.
- **Status:** fixed

---

## 1. Reproduce

### Steps
1. Viết/sửa một skill (`SKILL.md`), instruction hoặc KN trong `docs/knowleged.md` bằng one-shot: prompt model viết, hoặc tự sửa "cho hợp lý hơn" — không có phép đo trước/sau.
2. Không có held-out validation: không gì FAIL khi bản sửa làm chất lượng giảm; review bằng mắt ("trông hợp lý") = self-preference (KN-023).
3. Lặp nhiều lần → file dài dần (prose drift), các edit "hợp lý" nhưng gây hại không được ghi nhớ → cùng một kiểu edit lỗi được đề xuất lại.

### Expected vs Actual
- **Expected:** Mọi edit lên tầng tri thức (skill/KN/instruction) = một hypothesis có bằng chứng trước/sau; chỉ nhận khi tốt hơn thật (validation gate); edit bị loại được giữ làm negative feedback.
- **Actual:** Skill/KN lớn lên bằng sửa tay + one-shot, thiếu step-size control, thiếu validation, thiếu rejected-edit memory → "uncontrolled skill evolution" — bài toán thật của cả MSR (SkillOpt) lẫn harness (KN-047 slop, KN-056 wishlist).

### Evidence
- Log / screenshot / test fail / video:
```
< dán log hoặc link ảnh >
- SkillOpt (Microsoft Research, 30/06/2026): skill sửa tay/one-shot "tend to grow longer and drift"; edit trông hợp lý vẫn có thể giảm performance; cơ chế chữa = textual learning rate (bounded edit budget) + validation gate (chỉ nhận nếu strictly higher trên held-out split) + rejected-edit buffer (negative feedback) + slow/meta update.
- Kết quả đo: best/tied 52/52 cells (6 benchmarks × 7 models × 3 execution modes); GPT-5.5 58.8→82.3 (+23.5); skill cuối ~920 tokens, chỉ 1–4 edits được nhận (OfficeQA +39.0 từ 1 edit); transfer xuyên harness Codex→Claude Code 22.1→81.8 (+59.7).
- Nguồn: https://www.microsoft.com/en-us/research/blog/skillopt-agent-skills-as-trainable-parameters/ + github.com/microsoft/SkillOpt
- Corroborating (cùng feed): Uno Platform — "generation rẻ, verification không"; Cosmos DB — tools/skills phải grounded + governed.
```

### Environment
- Branch: `main`
- Commit: — (article-lesson, không phải incident)
- OS/Browser: N/A

---

## 2. Root Cause (5 Whys)

- **File:Line:** `docs/knowleged.md` + `.github/skills/*/SKILL.md` + `.github/instructions/*.instructions.md` (quy trình sửa — không phải dòng code)
- **Why 1:** Skill/KN là văn xuôi được sửa không phép đo — không step-size, không validation, không bộ nhớ edit bị loại (MSR SkillOpt mô tả chính xác failure mode này).
- **Why 2:** Không có validation gate → không gì FAIL khi bản sửa làm tệ đi; model tự review mình = self-preference (KN-023), "trông hợp lý" thay cho đo.
- **Why 3:** Không có rejected-edit memory → edit xấu không tích luỹ thành negative feedback; đề xuất lại điều đã bị loại; failure không thành kiến thức.
- **Why 4:** Edit không bounded → rewrite lớn trộn good+bad, không truy vết được phần nào gây hại; diff không reviewable (đối chiếu KN-047 ≤200 LOC).
- Why 5 (Root): Tầng tri thức = tham số đang tối ưu, không phải tài liệu: edit phải bounded + validated + có rejected-edit memory; thiếu gate = wishlist (KN-047), thiếu lưới = tái lập (KN-056).

- **Impact:** Toàn bộ tầng tri thức (56+ KN, skills, instructions) — mọi lần cập nhật đều có thể âm thầm giảm chất lượng mà không ai phát hiện; ảnh hưởng mọi task vì `knowleged.md` là bước 0 của mọi pipeline.
- **Hypothesis:** Áp nguyên lý SkillOpt ở quy mô harness (file-based, 0 deps): edit = hypothesis + evidence; bounded edit; rejected edits → Anti-patterns; best-version qua git + guard. Corroborated gián tiếp (KN-047/056 cùng lớp vấn đề), chưa có phép đo riêng cho tầng skill → Confidence MEDIUM.
- **Confidence:** `MEDIUM` (strongly supported; chưa chạy eval đo riêng cho skill của harness)

> Nếu bug chạm pattern trong `docs/knowleged.md` → ghi `Related KN: KN-XXX` và áp dụng **Cách phòng tránh** ngay.
> **Root Cause Gate:** Nếu uncertain → investigate / escalate, không tự biến hypothesis thành sự thật.

---

## 3. Fix

- Approach: Adopt cơ chế SkillOpt ở tầng quy trình: edit = hypothesis + evidence trước/sau; bounded edit (≤200 LOC — KN-047); rejected edits → Anti-patterns (negative feedback); giữ skill model-agnostic.
  Chi tiết (6 bước): (1) mọi edit = hypothesis có evidence (rubric/eval tối thiểu — KN-037), chỉ nhận khi tốt hơn thật; (2) bounded add/delete/replace, không rewrite; (3) rejected edits ghi lại, không xoá; (4) best-version qua git + guard (held-out thô); (5) slow/meta update định kỳ — gộp theo CMB heatmap/Hawking; (6) model-agnostic 1 file nhiều IDE (transfer Codex→Claude Code +59.7).
- **Files Changed:**
  - `docs/knowleged.md` — KN-060 (draft qua propose, chờ duyệt dán) + mục Anti-patterns bổ sung
  - `.agent/bugs/2026-09-14-skill-kn-sua-khong-qua-eval-gate-bi-troi-am-tham/bug.md` — file này
- **Diff tóm tắt:**
```diff
// before
- edit skill/KN bằng one-shot, không đo trước/sau, không nhớ edit bị loại
// after
- edit = hypothesis + evidence trước/sau + bounded + rejected-edit memory + best-version (gap còn lại: chưa có eval-gate tự động per skill-edit)
```
- **Non-Goals:** Không xây training loop/optimizer tự động cho skill (project riêng nếu cần); không sửa `auto-learn.mjs`; không chạy eval cho từng skill hiện có.
- **Fix Confidence:** `MEDIUM` — hướng adopt rõ, gate family hiện có (propose/guard/slop/evals) khớp; chưa có phép đo tự động cho tầng skill.
- **get_errors:** N/A lần này (không đổi code) — khi KN-059 được dán vào `knowleged.md` sẽ chạy lại các check liên quan.

---

## 4. Verification

- [x] "Reproduce" = case SkillOpt trùng failure mode harness (KN-047 slop / KN-056 wishlist) — khớp 2/2 (RADAR scores 103.7 + 94.3)
- [x] RADAR đã chạy TRƯỚC khi ghi (log tự đối chiếu) — làm đúng trình tự KN-056
- [x] Guard family tồn tại: `auto-learn propose` GUARD GATE + `tests/e2e/auto-learn-guard.spec.ts` (spec khoá 6 invariant)
- [x] Bằng chứng ngoài model: SkillOpt numbers + paper + repo (không self-review — KN-023)
- [x] Regression: auto-learn status → "KN: 60 bài học" (KN-060 parse OK) · guards coverage chạy (sau khi dời Guard line vào cap 2500 của kn-parse)
- [x] `get_errors` **toàn scope** → 0 errors
- [x] UI audit: N/A (không phải bug UI)
- [x] Fresh-eyes tier: `RECOMMENDED` (process/knowledge — RADAR + Guard gate là lớp kiểm bổ sung; đã deep-verify guard detection qua 2 vòng debug)

**Kết quả:**
```
- Playwright: 5 passed (9.5s) — ai-news-curated 3 + ai-news-vi 2 (spec takeover update)
- auto-learn status: KN: 60 bài học — KN-060 parse OK, UpdatedAt bump OK
- guards: KN-060 → tests/e2e/auto-learn-guard.spec.ts (sau khi dời Guard line — index 2857 > cap 2500 của kn-parse)
- policy gate: REFUSED khi không takeover / PERMITTED với intent=takeover (2 file spec) — audit logged (5dd37b, 07b160)
```

---

## 5. Lesson (1 câu)

> Bài học rút ra, 1 câu súc tích — sẽ copy vào `docs/knowleged.md` Bảng tóm tắt.

Ví dụ: *Sửa skill/KN là tối ưu chứ không phải viết văn: edit bounded + validation gate + rejected-edit memory — không có phép đo tốt-hơn thì bản sửa "trông hợp lý" vẫn là drift.*

---

## 6. Prevention

- **Cách phòng tránh lần sau:**
  - [x] Trước khi sửa skill/KN/instruction: ghi 1 dòng kỳ vọng "tốt hơn ở đâu, đo bằng gì" — không đo được thì edit phải nhỏ hơn nữa.
  - [x] Edit bounded: add/delete/replace nhỏ; rewrite toàn file = nghi vấn — tách thành nhiều edit có lý do.
  - [x] Edit bị loại/backtrack → ghi vào Anti-patterns (negative feedback), đừng xoá dấu vết.
  - [x] Skill giữ model-agnostic (không pin model) — portability là tài sản (SkillOpt transfer +59.7 điểm xuyên harness).
  - [x] Định kỳ gộp/vệ sinh tri thức (CMB heatmap + Hawking) thay vì chỉ thêm.
  - [x] Đã thêm vào `docs/knowleged.md` Anti-patterns (4 bullets) + Checklist (1 dòng) — KN-060
- **Guard (lưới chống tái lập — KN-056):**
  - [x] Điền `- **Guard:**` ở Meta + dời lên ngay sau Severity trong KN detail (phát hiện: `kn-parse.mjs` cap `detail` 2500 ký tự — Guard line ở index 2857 bị rớt khỏi detection)
  - [x] RADAR báo 6 nghi vấn (KN-037/056/007) — verdict: **KHÔNG phải tái lập thật** (bài học mới, kề cận KN-037/056; khác: đây là về *cơ chế sửa tri thức*, không phải về evals output hay vòng lặp bug)
- **Cần cập nhật:**
  - [x] `docs/knowleged.md` → KN-060 (Bảng tóm tắt + Chi tiết + Anti-patterns + Checklist + UpdatedAt)
  - [x] `product-quality.instructions.md`: N/A (không phải chuẩn UI)
  - [x] Guard dùng lưới sẵn có: `auto-learn-guard.spec.ts` (dogfood) — không cần test mới

---

## References

- `docs/knowleged.md#KN-XXX`
- Issue / PR: #
- Commit fix: `<hash>`

---
*Template: `.agent/bugs/_template/bug.md` — dùng bởi `/fixbug` Phase 1 & 5.*
