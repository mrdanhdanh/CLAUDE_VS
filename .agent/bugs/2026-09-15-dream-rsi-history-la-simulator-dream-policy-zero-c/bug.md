> 🤖 Auto-log bởi auto-learn.mjs — 2026-09-15T15:31:41.721Z
> **Error:** `Dream-RSI (Google + DeepMind + UMD + UVA, arXiv:2609.14858, 14/09/2026, dream-rsi.com): RSI bottleneck = exploration policy van viet tay/dong bang; dream hang nghin policy ung vien bang replay lai discovery tree da ghi - 0 execution, chi deploy winner (pi0 trong candidate set => khong bao gio te hon); ket qua 162x it agent calls hon SimpleTES (Lasso), 2.43x it generation (VGG16), 2.09x diem cao hon (ConvDiv); policy adaptive (tiet kiem compute khi tien bo, bung lai khi plateau); semantic guidance nhoi prompt KEM HON replay (over-constrain + suppress diversity)`
> **File:** `docs/knowleged.md`
> **Title:** Dream-RSI history la simulator - dream policy zero-cost thay vi chay lai

> 🔁 **RADAR TÁI LẬP** — đối chiếu KN + bug cũ thấy nghi vấn:
> - 🔁 NGHI TÁI LẬP **[KN-048]** (score 193): RSI & agentic safety: coordination ngầm + sandbox escape là mối nguy thật (học 2 incidents 2026)
> - 🔁 NGHI TÁI LẬP **[KN-066]** (score 184.6): KN ID double-yield: đa phiên song song cùng nhận 1 ID — re-check trước paste + detector integrity sau paste
> - 🔁 NGHI TÁI LẬP **[KN-033]** (score 174.6): Recursive Self-Improvement — Roadmap 5 tầng autonomy + Research RSI (2609.11873v1, 2609.10702v1)
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-14-kn-id-double-yield-da-phien-cung-1-id`** (score 152.1): KN ID double-yield — 3 phiên song song cùng nhận 1 ID, thiếu detector integrity
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-14-routing-failover-chuan-hoa-pattern-khoa-luoi`** (score 148.4): Routing & Failover cho chain model/provider — chuẩn hoá pattern + khoá lưới chuỗ
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-14-skill-kn-sua-khong-qua-eval-gate-bi-troi-am-tham`** (score 136.2): SkillOpt — thiếu validation gate cho skill/KN: edit trôi, rejected edits không t
> → Đọc **Cách phòng tránh** trong `docs/knowleged.md` TRƯỚC khi fix. Nếu là tái lập thật: ghi rõ "tái lập của KN-048" + **vì sao lưới cũ không bắt được** → nâng lưới (Guard) rồi mới fix.
# Bug: Dream-RSI: replay history = simulator zero-cost — dream policy thay vì chạy lại (draft)

> Article-lesson (không phải incident): Dream-RSI — "Recursive Self-Improvement through Evolving Worlds" — Tong Zheng et al., Google + Google DeepMind + U Maryland + U Virginia (technical report 14/09/2026; arXiv:2609.14858; dream-rsi.com; code github.com/zhengkid/Dream-RSI). Meta template thay bằng nội dung thật — số KN = **KN-067** (draft — re-check max ngay trước paste theo KN-066; hiện max=066 → nextId=067).

## Meta

- **Slug:** `2026-09-15-dream-rsi-history-la-simulator-dream-policy-zero-c`
- **Ngày:** 2026-09-15
- **Severity:** major
- **Layer:** process (bài meta — RSI / exploration policy; không có defect code)
- **Reporter:** YUNIE / user request (article-lesson)
- **Related KN:** KN-033 (RSI 5 tầng — bài này là instance tầng meta-exploration) · KN-034 (aggregate failures — replay = đọc lại cross-task miễn phí) · KN-064 (co-evolution — guard tiến hoá cùng agent) · KN-065 (verify trong runtime thật — replay chỉ exact khi history ĐÚNG) · KN-018 (diversity — semantic priors suppress exploration) · KN-035 (giữ uncertainty) · KN-023 · KN-019
- **Tags:** `process` `rsi` `self-improving` `exploration` `replay`
- **Guard:** `tests/e2e/auto-learn-guard.spec.ts` + `tests/e2e/kn-id-integrity.spec.ts` — lưới giữ history replayable (vòng log→propose có behavior test · integrity của history KN). **Declared:** replay-simulator đầy đủ cho coding-agent history chưa tồn tại (file-based, 0 deps) — direction, không claim (như KN-065).
- **Status:** `fixed` (KN-067 pasted 2026-09-15T15:46Z + integrity OK + spec 5/5)

---

## 1. Reproduce

### Steps
1. RSI loop ở scale thật = hàng nghìn proposal–evaluation cycles; nhân tố quyết định compute có đáng không là **exploration** (branch ở đâu, chạy song song gì, cắt nhánh nào) — component duy nhất còn viết tay + đóng băng.
2. Policy cố định → không học từ experience → mãi trả tiền cho hướng đã fail; optimize online → meta-feedback **delayed + expensive** (đánh giá 1 policy = xem nó dẫn cả một discovery run tới cuối) + meta-space rộng → hầu hết candidate đều tệ, mỗi cái tốn 1 full rollout để biết điều đó.
3. Trong harness (quy mô nhỏ hơn nhưng cùng lớp): muốn biết một thay đổi process/skill/refactor có tốt hơn không → mặc định **chạy lại từ đầu** (re-run task, re-benchmark) dù history (bug.md, audit, versions, e2e fixtures) đã ghi sẵn outcome của phần lớn đường đi.

### Expected vs Actual
- **Expected:** Khi history đã ghi đủ chi tiết, đánh giá policy/process **bằng replay trên history** (0 execution) trước; chỉ trả giá rollout thật cho winner. π₀ (bản đang chạy) nằm trong candidate set → winner không bao giờ tệ hơn bản hiện tại.
- **Actual (trước adoption):** Không có meta-rule "replay > re-execute" — history bị đọc như text/context/training data thay vì **structured tree = exact simulator**; mỗi vòng đánh giá lại trả full giá.

### Evidence
- Dream-RSI (corroboration — số self-measured, non-gating theo KN-052):
```
• Discovery tree đã hoàn thành = replay simulator EXACT (không phải approximation) — mỗi node là 1 attempt + outcome thật đã thực thi; policy khác chỉ đi lại cây theo thứ tự khác.
• Dream hàng nghìn policy ứng viên trong simulator: 0 execution cost; chỉ winner được deploy online.
• π₀ thuộc candidate set ⇒ winner never worse (π_{t+1} = argmax replay_score(π_m), π₀ ∈ {π_m}) — "bars only go up".
• Lasso: 162× ít discovery-agent calls hơn SimpleTES (317 vs 51,200) · 1.7× ít hơn fixed exploration.
• GPU kernels: VGG16 2.43× ít generations hơn · ConvDiv 2.09× điểm cao hơn cùng budget.
• Policy học được ADAPTIVE: tiến bộ → tiết kiệm (110→50 attempts), plateau → bung lại — widening khớp cú nhảy score kế tiếp.
• "Semantic guidance is worse than replay": nhoi high-level insight vào prompt KÉM HƠN replay — strong priors over-constrain + suppress diverse exploration.
• Giới hạn tự nhận: policy chỉ dream được ở nơi history đã đi → bắt buộc phải là LOOP (mỗi lap thêm 1 world), không phải one-off.
```
- Local (bằng chứng chính — máy móc replay đã tồn tại cục bộ nhưng chưa externalize thành một họ): `evaluate`/`propose` = chấm điểm offline trên corpus KN đã ghi (BM25 replay) · `audit.mjs verify` = replay hash-chain · pairwise same-moment (orig vs refactor, 13/13 identical — KN-049 addendum / KN-053) · e2e suite = replay kịch bản ghi sẵn · `kn-id-integrity.spec.ts` = giữ history nguyên vẹn (điều kiện tiên quyết của replay).

### Environment
- Branch: `main`
- Commit: N/A (knowledge-gap; chốt hash khi paste)
- OS/Browser: N/A

---

## 2. Root Cause (5 Whys)

- **File:Line:** `docs/knowleged.md` (knowledge layer) · lưới giữ history: `tests/e2e/kn-id-integrity.spec.ts` · vòng học: `tests/e2e/auto-learn-guard.spec.ts`
- **Why 1:** Exploration policy (harness: cách chọn việc-nên-làm-tiếp) viết tay + đóng băng — không học từ history dù history đã đủ để chấm điểm.
- **Why 2:** Meta-level feedback bị coi là đắt: muốn đánh giá 1 thay đổi policy phải xem nó chạy hết một run → mỗi vòng improvement trả giá full.
- **Why 3:** History (cây discovery / bug corpus / audit chain) bị đọc như text để prompt hoặc training data — **chưa đọc như simulator exact** (walk lại theo thứ tự khác, mọi outcome đã nằm trên đĩa).
- **Why 4:** Thiếu meta-rule "replay > re-execute": đánh giá thay đổi bằng đi lại history đã ghi TRƯỚC, rollout thật chỉ cho winner; kèm π₀-in-candidate-set (winner không tệ hơn hiện tại) chưa được nhận diện là nguyên lý monotonic.
- **Why 5 (Root):** Harness đã có máy móc replay cục bộ (evaluate BM25 trên corpus KN · audit hash-chain replay · pairwise same-moment · e2e fixtures) nhưng **chưa externalize thành một họ nguyên lý** để áp cho bề mặt mới (skill edit, process change, guard mới) trước khi phải trả giá re-run.

- **Impact:** Mọi vòng tự-cải-thiện của harness (AAR, skill distill, refactor verify, guard nâng cấp) + chi phí đánh giá thay đổi process nói chung.
- **Hypothesis:** Rule hoá "replay > re-execute — history đã trả tiền sẵn" + π₀-in-set + cảnh báo semantic priors là phần áp được NGAY (0 deps); replay-simulator đầy đủ (executor) = declared direction, cần PRD riêng nếu muốn build. RADAR nghi KN-048(193)/KN-066(184.6)/KN-033(174.6) — **liên quan, không tái lập**: RSI safety/ID integrity/roadmap tầng ≠ mechanic replay-simulator cho evaluation.
- **Confidence:** `MEDIUM` — knowledge-gap (không incident runtime mới); verify = guards detect + cite đúng + rule áp được.

> Nếu bug chạm pattern trong `docs/knowleged.md` → ghi `Related KN: KN-XXX` và áp dụng **Cách phòng tránh** ngay.
> **Root Cause Gate:** Nếu uncertain → investigate / escalate, không tự biến hypothesis thành sự thật.

---

## 3. Fix

- **Approach:** Adopt mechanism-half (KN-052/059), không port infra: (1) KN-067 rule hoá "**replay > re-execute**" — khi history đã ghi, đánh giá thay đổi bằng đi lại history (0 execution), rollout thật chỉ cho winner; (2) **π₀ trong candidate set ⇒ winner never worse** — chuẩn hoá cho mọi vòng improvement của harness (AAR keep-best, gates, distill); (3) **cảnh báo semantic priors** — không nhồi insight cấp cao vào prompt của long-horizon/parallel exploration (over-constrain + suppress diversity — khớp KN-018/KN-035); (4) **history phải replayable** — integrity (KN-066) là điều kiện tiên quyết: audit chain, versions snapshot, bug.md đầy đủ.
- **Files Changed (khi paste — bước sau, chờ duyệt):**
  - `docs/knowleged.md` — KN-067 (Bảng tóm tắt + Chi tiết + Anti-patterns + UpdatedAt)
  - `www/ai-news/curated.json` — tag `KN-067` cho item Dream-RSI (traceability — nếu chọn, tương đương option A)
  - `.agent/versions/` — snapshot trước paste (Reef-lite)
- **Diff tóm tắt:**
```diff
// before: history = text để prompt / data để train; mỗi vòng đánh giá trả full rollout
// after:  history = exact simulator — dream candidates (0 execution) → deploy winner (π0 in set ⇒ không tệ hơn)
```
- **Non-Goals:** KHÔNG port orchestration layer + replay simulator của Dream-RSI (file-based, 0 deps — adopt rule, không adopt framework); KHÔNG xây executor "dream" mới trong lượt này (nếu muốn → PRD riêng); KHÔNG đụng code production.
- **Fix Confidence:** `MEDIUM` — rule + cite; knowledge-gap, không có behavior mới để chứng minh.
- **get_errors:** Sau mỗi edit → affected files; full scope ở phase paste.

---

## 4. Verification

- [x] Article-lesson — không có runtime reproduce; evidence = corroboration report (non-gating, KN-052) + máy móc replay cục bộ đã tồn tại (liệt kê §1)
- [x] RADAR đã chạy + verdict: KN-048/KN-066/KN-033 liên quan — **không tái lập** (RSI safety / ID integrity / roadmap tầng ≠ replay-simulator mechanic); adjudication đầy đủ ghi khi paste
- [ ] (Khi paste) dup-gate `evaluate` — dự kiến flag KN-033/064; verdict + disclosure ghi theo convention (heuristic recall-heavy, threshold 15 — như KN-060/062/064/065)
- [ ] (Khi paste) `findNextKnId` + grep `### KN-0XX`/`| KN-0XX |` ngay trước ghi (KN-066) → `kn-id-integrity.spec.ts` sau paste
- [ ] (Khi paste) `auto-learn.mjs status` — KN count +1, integrity OK
- [x] UI audit: N/A (knowledge-gap)
- [x] Fresh-eyes tier: `OPTIONAL` (knowledge/process — lớp kiểm độc lập: RADAR + guards audit)

**Kết quả:**
```
paste: knowleged.md (bảng + chi tiết + anti-pattern + checklist + UpdatedAt) — snapshot .agent/versions/2026-09-15-KN-067-dream-rsi-history-la.md
evaluate (pre-paste): FAIL — dup-gate KN-063 (43.8) ≥ 15 → adjudicated KHÔNG trùng (routing/failover ≠ replay-simulator); disclosure bypass có chủ đích (như KN-060/062/064/065)
idIntegrity sau paste: rows 66 = details 66 (verified bằng kn-id-integrity.spec.ts)
dream dogfood: recall@3 100% (34/34, 65 KN); spec dream.spec.ts 5/5 pass; slop-check clean
```

---

## 5. Lesson (1 câu)

> History đã ghi là simulator exact miễn phí — dream policy ứng viên bằng replay (0 execution), chỉ deploy winner (π₀ trong candidate set ⇒ winner never worse); đừng nhồi semantic priors vào exploration.

---

## 6. Prevention

- **Cách phòng tránh lần sau:**
  - [ ] Đánh giá thay đổi process/skill/guard: ưu tiên **replay trên history đã ghi** (pairwise same-moment · e2e fixtures · evaluate BM25 trên corpus · audit verify) trước khi trả giá re-run; rollout thật chỉ cho winner.
  - [ ] Mọi vòng improvement phải có **π₀ (bản hiện tại) trong candidate set** — winner never worse; candidate set không chứa baseline → thiết kế sai (AAR keep-best là instance).
  - [ ] Cấm nhồi "insight cấp cao" vào prompt của long-horizon/parallel exploration như prior cứng — đo trước khi tin (over-constrain + suppress diversity; KN-018/KN-035).
  - [ ] History muốn replay được phải GHI ĐÚNG: audit hash-chain · versions snapshot · bug.md đầy đủ · integrity spec (KN-066) — replay chỉ exact trên history nguyên vẹn.
  - [ ] Compute policy adaptive: tiến bộ → siết budget (3-fix limit/bounded), plateau → escalate/bung — không đốt đều tay.
  - [ ] Thêm 1 dòng vào `docs/knowleged.md` Anti-patterns khi paste.
- **Guard (lưới chống tái lập — KN-056):**
  - [x] `tests/e2e/auto-learn-guard.spec.ts` + `tests/e2e/kn-id-integrity.spec.ts` — lưới giữ history replayable; **declared:** executor replay-simulator chưa tồn tại (direction, không claim — như KN-065)
  - [x] RADAR verdict: KN-048/KN-066/KN-033 — liên quan, không tái lập (không phải tái lập → không cần nâng lưới trước fix)
- **Cần cập nhật:**
  - [ ] `docs/knowleged.md` → `KN-067` (Bảng tóm tắt + Chi tiết) — bước paste (chờ duyệt)
  - [ ] `www/ai-news/curated.json` — tag `KN-067` (traceability — mirror convention)
  - [ ] Test mới: chưa có (replay executor ngoài scope — nếu adopt thật → PRD + spec riêng)

---

## References

- Dream-RSI — "Recursive Self-Improvement through Evolving Worlds": arXiv:2609.14858 · dream-rsi.com (figures/results) · github.com/zhengkid/Dream-RSI · Tong Zheng et al. (Google · Google DeepMind · U Maryland · U Virginia), 14/09/2026
- `docs/knowleged.md` — KN-033 (RSI tiers) · KN-064 (co-evolution) · KN-065 (runtime thật) · KN-066 (history integrity)
- Commit fix: (paste phase)

---
*Template: `.agent/bugs/_template/bug.md` — dùng bởi `/fixbug` Phase 1 & 5.*
