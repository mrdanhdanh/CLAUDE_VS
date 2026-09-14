> 🤖 Auto-log bởi auto-learn.mjs — 2026-09-14T16:05:49.994Z
> **Error:** `Echoverse (MSR 30/07/2026): test/guard phai tien hoa cung agent — moi check do phai doc 2 lan (loi code vs loi world/task/verifier), sua world truoc; shallow world phan tac dung; depth > count; held-out form moi chung minh hoc duoc rule`
> **File:** `docs/knowleged.md`
> **Title:** Echoverse co-evolution: check do doc 2 lan, world-first, guard phai sau

> 🔁 **RADAR TÁI LẬP** — đối chiếu KN + bug cũ thấy nghi vấn:
> - 🔁 NGHI TÁI LẬP **[KN-056]** (score 113.9): Vòng chống tái lập: KN không lưới = wishlist — log RADAR + Guard gate + `guards` audit
> - 🔁 NGHI TÁI LẬP **[KN-027]** (score 85): Feedback-Enriched Environments + Consistency Gap + SOLID — Self-Improvement Without Verified Answers (2609.08404v1, 2609.08832v1, 2609.09957v1)
> - 🔁 NGHI TÁI LẬP **[KN-037]** (score 71.4): Evals Gap — "single biggest predictor" là evals discipline (Andrew Ng, Agentic AI Playbook 2026)
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-13-stop-hook-loi-dau-ngoac-trong-lenh-echo-bi-powersh`** (score 83.4): Stop hook lỗi — dấu ngoặc trong echo bị PowerShell parse thành subexpression
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-12-dark-energy-high-gia-tien-gate`** (score 76.3): dark-energy-high-gia-tien-gate
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-14-skill-kn-sua-khong-qua-eval-gate-bi-troi-am-tham`** (score 74.4): SkillOpt — thiếu validation gate cho skill/KN: edit trôi, rejected edits không t
> → Đọc **Cách phòng tránh** trong `docs/knowleged.md` TRƯỚC khi fix. Nếu là tái lập thật: ghi rõ "tái lập của KN-056" + **vì sao lưới cũ không bắt được** → nâng lưới (Guard) rồi mới fix.
# Bug: Echoverse — co-evolution: check đỏ đọc 2 lần theo tầng (code · test · env · đo), sửa 'world' trước; guard phải sâu + held-out

> Article-lesson (không phải incident): Echoverse — Microsoft Research 30/07/2026 (deep, evolving environments cho computer-use agents; github.com/microsoft/Echoverse). Meta template thay bằng nội dung thật — số KN cuối cùng: **KN-064** (chốt tại paste 14/09 23:3x sau khi tree sạch — KN-061/062/063 thuộc session song song; xem proposal §0 + §7).

## Meta

- **Slug:** `2026-09-14-echoverse-co-evolution-check-do-doc-2-lan-world-fi`
- **Ngày:** 2026-09-14
- **Severity:** major
- **Layer:** process (bài meta — dogfood taxonomy ngay trên chính bug.md này)
- **Reporter:** YUNIE / user request (article-lesson)
- **Related KN:** KN-034 (phân loại model-vs-harness — bài này mở rộng thành 5 tầng world + world-first), KN-049 (tách lớp ĐO + negative control), KN-056 (nâng lưới trước khi fix), KN-058 (tồn tại ≠ render — cùng họ shallow-check), CMB heatmap (diversity), KN-023, KN-052. Draft = **KN-064** (chốt tại paste 23:3x — Routing=063/Memora=062 thuộc session song song; gap 061). Dup-gate flag KN-033 (39.2) — đã đọc: RSI roadmap, KHÔNG trùng thật (xem §2).
- **Tags:** `process` `verify` `evals` `guard` `self-improving`
- **Guard:** `tests/e2e/auto-learn-guard.spec.ts` — **behavioral wiring test**: `propose` parse `Layer:` + soft-warn khi thiếu. **Nói thẳng: wiring test chỉ chứng minh parse/report; attribution ĐÚNG là human judgment — không claim là gate chặn** (critic 14/09). Soft-warn, không hard gate.
- **Status:** fixed

---

## 1. Reproduce

### Steps
1. Đọc một check đỏ (test fail / guard fail / suite đỏ) và mặc định quy cho "code/agent sai" → fix ngay ở tầng code.
2. Không có bước quy tầng failure: code · test/spec · env/fixture · đo lường/verifier (Echoverse tách thêm task-spec). Defect nằm ở fixture/spec/đo bị lưu thành bài học (KN/anti-pattern/bug lesson) thay vì được sửa.
3. Chiều ngược lại: capability mới đi qua sạch nhưng suite/guard không tiến hoá theo → saturate; nhồi thêm instance cùng vùng + guard nông (rời rạc, assert appearance) → xanh nhưng hollow.

### Expected vs Actual
- **Expected:** Mọi check đỏ được đọc 2 lần: failure sống sót qua attribution → thành bài học/curriculum; defect (env/test/đo) → sửa world TRƯỚC, không thành bài học. Guard tiến hoá cùng capability (co-evolution), có depth + held-out.
- **Actual (trước adoption):** (a) Zero mặc định = lỗi code — không có surface ghi tầng lỗi (bug.md thiếu field `Layer:`); (b) đã có tiền lệ verify/bài học bị viết từ đo hỏng — suite đỏ giả do spec pin data (2026-09-13, amend bởi verify actor) + anti-pattern "spec pin data"; (c) chưa có tiêu chuẩn depth/held-out cho guard mới — mới dừng ở "có test là được".

### Evidence
- **Evidence CHÍNH = bug corpus local** (đúng nguyên tắc "defect thuộc về world" đã tái diễn ngay tại repo này): severity regex parse 0/55 major (KN-056), zeroRef shorthand false-positive (KN-049), slop-scanner đếm-brace-từng-dòng + CRLF (KN-049), hooks PowerShell parse (KN-039), spec pin data → suite đỏ giả (2026-09-13, amend bởi verify actor + anti-pattern đã ghi). Đây là bằng chứng độc lập: phần lớn "failure" bắt được nằm ở test/env/đo — không phải ở code.
- **Corroboration (secondary) — MSR Echoverse blog 30/07/2026 + github.com/microsoft/Echoverse:** 12 worlds built (10 domain + 2 capability), **4 released** kèm grounded graders; số liệu self-measured — adopt mechanism-half, không dùng con số làm gate nội bộ (KN-052):
```
• "The model is not the only thing that learns": mỗi zero là test của CẢ stack (agent · environment · task · verifier); "most defects belong to the world" — chỉ failure sống sót cả 3 lớp mới thành model curriculum.
• World defects thật: EchoStay guest-count control hỏng → booking đúng không bao giờ đăng ký được; fix → completable 48%→78%. EchoChat verifier lệch data → gradable 34%→99%. EchoForum frontend fix → 0→36/37 tasks. EchoForge có backend logic nhưng không UI control để tới.
• Shallow world PHẢN TÁC DỤNG (cùng domain exposure): Allrecipes 80.0→75.0 (giảm), HF 48.0 flat; deep world → 85.0 / 65.0; step-budget exhausted 15→9/37. "A world can be perfectly stable and still be hollow."
• Depth giữ dependency structure + capability drill + held-out: datepicker 60.0→82.6 in-dist / 34.0→54.0 held-out; nested-filter held-out 62.8→84.1 — "learned a rule, not a layout".
• Co-evolution: EchoStay world v1→v2 → model 16.2→38.5 (GPT-5.4 ref 50.4). Scaling axes: 6.4k→20k trajectories trên fixed worlds → WebVoyager 54.8→55.6 (flat), Online-Mind2Web 40.1→37.2 (slip); thêm worlds → climb. Diversity > volume.
• RLE hygiene: reset per rollout + parallel + grounded reward (DB diff); live web không phải RLE (no reset, throttling, no ground truth → reward nhiễu như judge; policy học blind spots của judge).
```
- Đối chiếu harness: KN-049 (đo lường tách lớp + negative control), anti-pattern suite đỏ giả, KN-030/KN-046 (xanh giả), KN-056 (nâng lưới trước khi fix) — Echoverse generalize thành 4 cơ chế: attribution · world-first · depth bar · co-evolution.

### Environment
- Branch: `main`
- Commit: — (article-lesson, không phải incident)
- OS/Browser: N/A

---

## 2. Root Cause (5 Whys)

- **File:Line:** `docs/knowleged.md` (knowledge layer) · `.agent/bugs/_template/bug.md` (attribution surface) · `tests/e2e/auto-learn-guard.spec.ts` (guard)
- **Why 1:** Check đỏ bị đọc như tín hiệu một chiều về "agent/code" — không hỏi failure thuộc tầng nào.
- **Why 2:** Vì không có bước attribution: zero có thể đến từ code · test/spec · env/fixture · đo/verifier (Echoverse: "reading every zero as model supervision trains on defects that should have been repaired").
- **Why 3:** Vì quy tắc "sửa world trước" chưa tồn tại — defect trong env/đo được lưu thành bài học (KN viết từ run đỏ của đo hỏng = học chính defect).
- **Why 4:** Và guard/tests thiếu quality bar depth — shallow (rời rạc, không dependency structure, assert appearance) → false confidence, thậm chí phản tác dụng (shallow train: 80→75).
- **Why 5 (Root):** Thiếu vòng co-evolution — environment + task + verifier phải tiến hoá cùng capability (như KN-056 nâng lưới trước khi fix); suite tĩnh chỉ tăng count → saturate/slip, bottleneck chuyển sang internal structure (depth, coherence, outcome-vs-appearance).

- **Impact:** Mọi verification loop: bài học ghi sai tầng → fix sai chỗ + KN/anti-pattern sai; coverage chững dù thêm test; false-red/false-green tiếp diễn.
- **Hypothesis:** Mechanism-half của Echoverse adopt được ngay ở quy mô file-based, 0 deps — đã tách mechanism vs claim (số self-measured) theo KN-052. Verify = template Layer + spec guard + KN paste.
- **Confidence:** `MEDIUM` — verify đạt khi implement xong (spec RED→GREEN + guards detect); hiệu ứng dài hạn của attribution chưa đo riêng (disclosure).

> Nếu bug chạm pattern trong `docs/knowleged.md` → đã ghi `Related KN` ở Meta; RADAR flag KN-056/KN-027/KN-037 — đã đọc Cách phòng tránh, **không phải tái lập** (đây là generalization mới: attribution + world-first + depth bar; KN-056 chỉ phủ phần nâng-lưới-khi-tái-lập).
> **Root Cause Gate:** Root đã verify bằng đối chiếu cơ chế hiện có (thiếu Layer surface + thiếu depth bar) — không phải hypothesis mơ hồ.

---

## 3. Fix

- **Approach:** Adopt mechanism-half (KN-052/059), **slim theo critic (14/09) — 4 delta thật** (world-first · defect-vs-lesson hygiene · held-out · diversity>volume), cross-ref KN-034/049/056/058/CMB thay vì restate: (1) KN-064 slim vào `docs/knowleged.md` + 2 anti-patterns; (2) `Layer:` vào template bug.md; (3) `Layer` load-bearing: parse trong `extractBugMeta` + soft-warn ở `propose`; (4) behavioral test wiring; (5) sync `fixbug.prompt.md`.
- **Files Changed:**
  - `docs/knowleged.md` — KN-064 slim + 2 anti-patterns + row Bảng tóm tắt
  - `.agent/bugs/_template/bug.md` — Meta: thêm `Layer:` (menu 5 tầng world + process) + hướng dẫn "suspicion order", không phải luật
  - `.github/harness/scripts/auto-learn.mjs` — parse `Layer` + soft-warn (không hard gate)
  - `tests/e2e/auto-learn-guard.spec.ts` — behavioral test: propose parse + warn (TDD RED→GREEN)
  - `.github/prompts/fixbug.prompt.md` — thêm `Layer` vào field list
- **Diff tóm tắt:**
```diff
+ - **Layer:** code | test-spec | env-fixture | measure-verifier | task-spec | process — tầng chứa defect; check đỏ đọc 2 lần, lỗi ở test/env/measure → sửa world TRƯỚC (KN-064)
+ test('guard co-evolution: propose parse Layer + soft-warn khi thiếu (behavioral wiring)', ...)
```
- **Non-Goals:** Không sửa dup-gate heuristic trong proposal này (self-serving gate edit — smell KN-012; false-positive tăng do KN process mới = backlog riêng ở proposal §Open); không hard-gate `Layer`; không đổi RADAR/guard gate hiện có; không nâng sang RL thật (file-based, 0 deps — minimal ladder).
- **Fix Confidence:** `MEDIUM` → lên HIGH sau Verify (spec pass + guards detect).
- **get_errors:** Sau mỗi edit → affected files; full scope ở Phase 4.
- **Progress (14/09 23:3x — APPLIED ✅):** 6/6 file: `_template/bug.md` `Layer:` + `fixbug.prompt.md` sync (commit bfd386d partial prep) · `auto-learn.mjs` parse/soft-warn/json/draft-line · spec mắt xích 5 (RED→GREEN 9/9) · `docs/knowleged.md` KN-064 (row + detail + 2 anti-patterns + UpdatedAt chain). Điều kiện tree sạch đã đạt sau 25cb58f (Memora session tự commit); ID re-check ngay trước paste (anti-pattern KN-063) → KN-064 free ✓.

---

## 4. Verification

- [x] TDD RED: behavioral test fail TRƯỚC (exit 1 — `d1.layer?.present` = undefined)
- [x] `npx playwright test tests/e2e/auto-learn-guard.spec.ts` → **9/9 PASS** (6.3s)
- [x] Fixture no-Layer → soft-warn; fixture có Layer → parse đúng (`--json` trả `layer` + draft mang Layer line)
- [x] `guards --json` → `KN-064: ["tests/e2e/auto-learn-guard.spec.ts"]`, counts total 63 / withGuard 36, priority ⊅ KN-064
- [x] Regression: auto-learn-guard spec re-run sau paste (fresh) OK; CLI `status` smoke OK — **full suite không re-run (disclosure: thay đổi chỉ ở CLI parse + data doc)**
- [x] `get_errors` toàn scope → 0 errors
- [x] Sau paste KN: `guards` không report KN-064 "missing guard" ✓

**Kết quả:**
```
✅ APPLIED 14/09 23:3x — tree sạch sau 25cb58f (Memora session tự commit); ID re-check → KN-064 free.
- RED:  1 failed (layer.present undefined) — exit 1
- GREEN: 9 passed (6.3s) — npx playwright test tests/e2e/auto-learn-guard.spec.ts
- guards --json: KN-064 → ["tests/e2e/auto-learn-guard.spec.ts"]; counts total=63 withGuard=36; priority ⊅ 064
- KN-064 pasted: row + detail (Guard line trong 2500-char cap) + 2 anti-patterns + UpdatedAt chain
```

---

## 5. Lesson (1 câu)

> Mọi check đỏ phải đọc 2 lần — quy tầng (code · test · env · đo); defect ở world phải sửa TRƯỚC, chỉ failure sống sót cả stack mới được viết thành bài học; guard tiến hoá cùng capability (depth + held-out), không chỉ tăng count.

---

## 6. Prevention

- **Cách phòng tránh lần sau:**
  - [ ] Trước khi fix check đỏ → trả lời tầng lỗi (code · test-spec · env-fixture · measure-verifier · task-spec — hoặc process cho bài meta); không trả lời được → điều tra (Root Cause Gate).
  - [ ] Nghi fixture/spec/đo hỏng → sửa world TRƯỚC + re-run; chỉ failure sống sót mới viết KN/anti-pattern/bug lesson.
  - [ ] **Ranh giới KN-012 (critic bắt buộc):** world-first CHỈ áp cho defect kiểm chứng được (fixture hỏng, spec crash, measure lệch data — case 2026-09-13 là mẫu đúng); **CẤM hạ expectation để đỏ thành xanh** — spec/test vẫn qua `deny-test-mutate` + verify actor.
  - [ ] `Layer:` là "suspicion order" (gợi ý tầng nghi trước), KHÔNG phải luật — attribution cuối = judgment người.
  - [ ] Guard/evals mới phải có depth: dependency structure + assert outcome/state (không appearance) + held-out form hoặc negative control (KN-049).
  - [ ] Coverage chững → thêm cảnh mới ở vùng lạnh (CMB heatmap) trước khi thêm instance cùng vùng (diversity > volume).
  - [ ] Verify chỉ trên môi trường reset được (fixture/localhost/seed); evidence = state diff thật (không appearance).
  - [ ] Thêm 3 anti-patterns vào `docs/knowleged.md`.
- **Guard (lưới chống tái lập — KN-056):**
  - [x] `- **Guard:**` đã điền ở Meta (spec + GUARD GATE)
  - [ ] TÁI LẬP? → **không** — RADAR flag KN-056/027/037 nhưng đây là bài generalization mới (đã ghi ở §2)
- **Cần cập nhật:**
  - [x] `docs/knowleged.md` → KN-064 (Bảng tóm tắt + Chi tiết + Anti-patterns)
  - [ ] `.agent/bugs/_template/bug.md` → Layer
  - [ ] Test mới: `tests/e2e/auto-learn-guard.spec.ts`

---

## References

- `docs/knowleged.md#KN-064`
- Echoverse: https://www.microsoft.com/en-us/research/blog/echoverse-deep-evolving-environments-for-computer-use-agents/ · https://github.com/microsoft/Echoverse
- Related KN: KN-056 · KN-037 · KN-047 · KN-049 · KN-027 · KN-023 · KN-052
- Commit fix: `d63d8d8` (full apply) + `bfd386d` (template/prompt partial prep)

---
*Template: `.agent/bugs/_template/bug.md` — dùng bởi `/fixbug` Phase 1 & 5.*
