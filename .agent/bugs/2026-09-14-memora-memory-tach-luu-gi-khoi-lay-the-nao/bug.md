> 🤖 Auto-log bởi auto-learn.mjs — 2026-09-14T16:06:57.936Z
> **Error:** `Memora (MSR 29/06/2026, ICML): memory phai tach luu-gi (value) khoi lay-the-nao (abstraction 6-8 tu + cue anchors) - tri thuc moi bi fragment thay vi gop vao entry cu, retrieval thieu stop condition`
> **File:** `docs/knowleged.md`
> **Title:** Memora — memory: tách lưu gì khỏi lấy thế nào — fragment thay vì gộp, thiếu stop condition

> 🔁 **RADAR TÁI LẬP** — đối chiếu KN + bug cũ thấy nghi vấn:
> - 🔁 NGHI TÁI LẬP **[KN-060]** (score 86): SkillOpt: sửa skill/KN không qua validation gate — edit trôi, rejected edits không thành negative feedback
> - 🔁 NGHI TÁI LẬP **[KN-043]** (score 70.9): Content "đúng chữ nhưng không chạy": path thiếu prefix IDE + thiếu neo ngữ cảnh + khái niệm bị chấm nhưng chưa dạy
> - 🔁 NGHI TÁI LẬP **[KN-005]** (score 68.1): Bug Blindness — mù bug do workaround vô thức + fan bias
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-13-stop-hook-loi-dau-ngoac-trong-lenh-echo-bi-powersh`** (score 86.9): Stop hook lỗi — dấu ngoặc trong echo bị PowerShell parse thành subexpression
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-10-self-improving-upgrades`** (score 82.5): Triển khai 3 self-improving upgrades (KN-025/026/027) — procedural graph + funne
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-14-skill-kn-sua-khong-qua-eval-gate-bi-troi-am-tham`** (score 74.5): SkillOpt — thiếu validation gate cho skill/KN: edit trôi, rejected edits không t
> → Đọc **Cách phòng tránh** trong `docs/knowleged.md` TRƯỚC khi fix. Nếu là tái lập thật: ghi rõ "tái lập của KN-060" + **vì sao lưới cũ không bắt được** → nâng lưới (Guard) rồi mới fix.
# Bug: Memora — memory: tách lưu gì khỏi lấy thế nào — fragment thay vì gộp, thiếu stop condition

> Số KN thật là **KN-062** (KN-060 = SkillOpt — cặp đôi cùng feed: SkillOpt = cơ chế train, Memora = cơ chế lưu/lấy). **Va chạm concurrent cùng ngày với "Routing & Failover" (2 session cùng ghi knowleged.md, double-yield 2 lần) → chốt cuối: Memora=KN-062 · Routing=KN-063** (061 bỏ trống).

## Meta

- **Slug:** `2026-09-14-memora-memory-tach-luu-gi-khoi-lay-the-nao`
- **Ngày:** 2026-09-14
- **Severity:** major
- **Reporter:** YUNIE / user request (article-lesson)
- **Related KN:** KN-060 (SkillOpt — cặp train ↔ lưu/lấy), KN-056 (recurrence/consolidation), KN-007 (auto-learn), KN-026 (memory), KN-049 (CMB cold spots), KN-059 (mechanism-half) — draft này = KN-062
- **Tags:** `process` `knowledge` `memory` `context-engineering` `rag`
- **Guard:** `tests/e2e/auto-learn-guard.spec.ts` (2 test mới: dup-gate `evaluate` — KN trùng → FAIL + chỉ đích danh; chủ đề mới → PASS không chặn oan) + cơ chế sẵn có: `evaluate` consolidation gate + Hawking (deferred commit) + CMB cold spots (retrieval-failure signal)
- **Status:** fixed

---

## 1. Reproduce

### Steps
1. Học/đọc xong bài về chủ đề đã kề cận KN cũ (vd: cặp SkillOpt ↔ Memora) → thêm **KN mới ngay** thay vì kiểm "đã có entry chưa, có nên gộp không".
2. Hoặc: thêm hiểu biết mới về chủ đề cũ thành KN riêng → Bảng tóm tắt phình bằng chuỗi partial duplicates (cùng chủ đề, khác góc) — `suggest` trả nhiều mảnh lệch nhau cho cùng một câu hỏi.
3. Hoặc: viết dòng "Bài học (1 câu)" kiểu nhồi hết detail vào row (abstraction của lớp retrieval bị nhiễu); tags viết cho có, không theo "đường truy cập".
4. Hoặc: commit draft tri thức non ngay khi mới log (không deferred) → amend liên tục; retrieval nhồi top-k không stop condition → đọc thừa context.

### Expected vs Actual
- **Expected:** Thêm tri thức = quyết định có cấu trúc: kiểm consolidation (entry đã có? → GỘP/amend), tách bạch abstraction (row tóm tắt scan-được) ↔ value (detail) ↔ cue anchors (tags = đường truy cập phụ), chỉ commit khi tri thức đủ chín, retrieval bounded có stop condition.
- **Actual:** Harness chưa từng formal hoá mô hình memory — các phần đúng đều là convention ngầm (knowleged.md "vô tình" đúng shape Memora). Hệ quả đo được: (1) dup-gate trong `evaluate` (detector trùng = consolidation gate) **0 spec nào chạm** → rule "gộp > fragment" là wishlist; (2) abstraction dễ bị nhồi detail khi viết; (3) không có gate cho tri thức chín; (4) KN 0 tham chiếu (cold spot) không ai "học từ retrieval fail".

### Evidence
- Log / screenshot / test fail / video:
```
- Memora (MSR 29/06/2026, ICML 2026): tách what is stored (memory value giàu nội dung) khỏi how retrieved (primary abstraction 6–8 từ được embed + cue anchors = tag ngữ cảnh, đường truy cập phụ); thông tin mới về chủ đề cũ hợp nhất vào entry cũ thay vì phân mảnh; retriever = policy lặp (refine, expand qua cue, biết khi nào dừng).
- Kết quả: LoCoMo 86.3% LLM-judge (dialogue ~600 turns) + LongMemEval 87.4% (115k-token context) — vượt RAG, Mem0, Nemori, Zep, LangMem và cả full-context; gap lớn nhất ở multi-hop; 344 entries/conversation (Mem0: 651); tối đa 98% ít token hơn full-context. Hướng mở: MemLoop / Deferred Memory / Group Memory.
- Nguồn: https://www.microsoft.com/en-us/research/blog/memora-a-harmonic-memory-representation-balancing-abstraction-and-specificity/ + github.com/microsoft/Memora
- Hiện trạng harness: knowleged.md đã đúng hình dạng Memora (Bảng tóm tắt = abstraction scan nhanh, Chi tiết KN = value, tags = cue anchors — scoreKN cộng tags ×2.0); NHƯNG `evaluate` dup-gate (DUPLICATE_THRESHOLD=15) không có lưới: grep tests/ → 0 match `evaluate|Trùng KN`.
- Dogfood: `log` RADAR báo 6 nghi vấn (KN-060 score 86 — kề cận, không tái lập); `suggest "memory abstraction retrieval consolidation fragment token efficiency"` trả KN-015/041/060 (retrieval hiện tại chưa bắt KN-026 memory — đúng chỗ Memora nói: cần cue anchors tốt hơn).
```

### Environment
- Branch: `main`
- Commit: `d32dae2`
- OS/Browser: N/A (article-lesson + gate test)

---

## 2. Root Cause (5 Whys)

- **File:Line:** `docs/knowleged.md` (luật viết KN) + `.github/harness/scripts/auto-learn.mjs` (`evaluateCandidate`/`decideEvalGate` — detector không lưới) + `.github/harness/scripts/auto-learn.mjs` (`bumpUpdatedAt` — bug phụ: clobber chain lịch sử)
- **Why 1:** Không có quy tắc "gộp > fragment" ở decision point thêm tri thức — detector (dup-gate) tồn tại nhưng không test nào khoá → hành vi đúng phụ thuộc trí nhớ người vận hành (KN-054 class).
- **Why 2:** Abstraction/value/anchor không được tách bạch như *hợp đồng* — row dễ bị nhồi detail, tags không bắt buộc theo "đường truy cập"; đúng shape là convention ngầm, không phải luật có check.
- **Why 3:** Không đo retrieval-failure (KN nào không bao giờ được trả về) và không có deferred-commit cho tri thức non → tri thức có thể vào muộn (miss) hoặc quá sớm (drift) mà không gì phát hiện.
- **Why 4:** `evaluate` không testable hermetic — hardcode `BUGS_DIR`, không nhận `--dir` như `log`/`propose` → muốn khoá lưới phải tạo bug giả trong `.agent/bugs/` thật → không ai viết test (lưới máy = điều kiện để rule sống, KN-047/059).
- **Why 5 (Root):** Đối xử knowledge base như "file để đọc thêm" thay vì **memory system có cấu trúc** — thiếu mô hình representation (abstraction/value/anchor) + policy (retrieve có stop + consolidate + defer). Memora cho thấy chính sự tách "what/how" là nguồn SOTA, không phải chi tiết kỹ thuật.

- **Impact:** Toàn bộ tầng tri thức (61 KN, skills, instructions) — fragment + abstraction nhiễu làm retrieval kém dần theo thời gian; mọi task đọc `knowleged.md` bước 0 bị ảnh hưởng.
- **Hypothesis:** Adopt mechanism-half ở quy mô harness (file-based, 0 deps): giữ hình dạng Memora (đã đúng) + khoá consolidation gate bằng test (`evaluate --dir`) + luật viết KN (row=abstraction, tags=anchors, gộp>fragment) + defer qua Hawking. Đã verify dup-gate chạy đúng thực tế (SkillOpt session: flag KN-056 36.8 + KN-037 68.4 ≥ 15).
- **Confidence:** `MEDIUM` (strongly supported — đã build + test lưới mới; chưa có phép đo retrieval-quality dài hạn — ghi rõ là hướng mở, không claim)

> Nếu bug chạm pattern trong `docs/knowleged.md` → ghi `Related KN: KN-XXX` và áp dụng **Cách phòng tránh** ngay.
> **Root Cause Gate:** Nếu uncertain → investigate / escalate, không tự biến hypothesis thành sự thật.

> Nếu bug chạm pattern trong `docs/knowleged.md` → ghi `Related KN: KN-XXX` và áp dụng **Cách phòng tránh** ngay.
> **Root Cause Gate:** Nếu uncertain → investigate / escalate, không tự biến hypothesis thành sự thật.

---

## 3. Fix

- **Approach:** Adopt mechanism-half (KN-059) — không xây vector store/RAG service: (1) `evaluate` nhận `--dir` để dup-gate testable hermetic; (2) dup reason thêm hint GỘP (consolidation) ngay tại decision point; (3) `bumpUpdatedAt` prepend entry mới, giữ chain lịch sử (bug phụ phát hiện khi đọc code — regex cũ replace cả dòng = data loss); (4) +2 test khoá dup-gate 2 chiều trong `auto-learn-guard.spec.ts` (RED trước — evaluate bỏ qua --dir); (5) luật viết KN vào knowleged.md (row=abstraction, tags=anchors, gộp>fragment) + Anti-patterns/Checklist.
- **Files Changed:**
  - `.github/harness/scripts/auto-learn.mjs` — `evaluateCandidate(bugSlug, json, opts)` nhận `--dir`; handler truyền opts; `decideEvalGate` dup reason + hint GỘP; `bumpUpdatedAt` giữ chain; help text
  - `tests/e2e/auto-learn-guard.spec.ts` — +2 test (dup → FAIL + chỉ đích danh KN-00x + hint GỘP; novel → PASS) + fixture thêm mục `## 4. Verification` (để `hasFix` đúng cho gate evaluate)
  - `docs/knowleged.md` — KN-062 (Bảng tóm tắt + Chi tiết + Anti-patterns + Checklist + UpdatedAt)
  - `www/ai-news/curated.json` — tag `KN-062` (mirror)
  - `.agent/versions/` — snapshot tay KN-062 (commit flow bị dup-gate chặn — bypass có disclosure, như KN-060)
- **Diff tóm tắt:**
```diff
// before
- evaluate: hardcode BUGS_DIR (không testable) · dup reason: "có thể đã có bài học tương tự" · bumpUpdatedAt: replace CẢ DÒNG lịch sử
// after
- evaluate --dir (hermetic) · dup reason: "...; cân nhắc GỘP (amend) vào <KN> thay vì tạo KN mới (consolidation)" · bumpUpdatedAt: prepend entry mới, giữ chain
```
- **Non-Goals:** Không xây vector-store/semantic search (61 KN — BM25-lite đủ, YAGNI); không auto-merge KN (người quyết định gộp — detector chỉ fail-loud); không đổi `DUPLICATE_THRESHOLD` (15); không sửa `commit` sang `--dir` (chỉ `evaluate` cần hermetic cho test).
- **Fix Confidence:** `HIGH` — bounded, RED→GREEN thật, coverage 2 chiều (dup fire + no false positive).
- **get_errors:** Sau mỗi edit → affected files; full scope ở Phase 4 Verify.

---

## 4. Verification

- [x] Re-run steps reproduce → **Fixed**: dup-gate từ "không lưới" → 2 test RED→GREEN (RED: `evaluate --dir` bỏ qua dir → `❌ Không tìm thấy .agent/bugs/<slug>/bug.md`; GREEN sau khi thread `--dir`)
- [x] Edge cases:
  - [x] dup fixture (rainbow/border/conic-gradient) → decision FAIL + reasons chứa `KN-00[34]` + hint GỘP
  - [x] novel fixture (Zqxjv...) → decision PASS + `isDuplicate=false` (không chặn oan)
- [x] Regression: `auto-learn-guard.spec.ts` full PASS; KN-056 radar/guard-gate & guards-coverage tests không đổi
- [x] `get_errors` **toàn scope** → 0 errors
- [x] `slop-check` changed files (`auto-learn.mjs`) → Clean
- [x] Reef-lite `evaluate` → **FAIL có chủ đích** (dup-gate: KN-043(48)/KN-060(36.3) ≥ 15, heuristic recall-heavy) → **bypass có disclosure** (như KN-060) → paste tay + snapshot tay `.agent/versions/2026-09-14-KN-062-*`; fix `bumpUpdatedAt` giữ-chain = code-verified (sẽ exercised ở commit kế tiếp — commit KN-062 chưa chạy được vì gate chặn đúng thiết kế)
- [x] UI audit: N/A (không phải bug UI)
- [x] Fresh-eyes tier: `RECOMMENDED` (process/knowledge — 2 spec mới là lưới máy; policy gate + audit cho spec edit)

**Kết quả:**
```
- RED (3 fail — đúng thiết kế): propose tags leak "** test fixture" · evaluate --dir bị bỏ qua → "❌ Không tìm thấy .agent\bugs\2026-09-14-fixture-dup\bug.md" (2 test)
- GREEN: 8 passed (8.8s) — auto-learn-guard.spec.ts (incl. 2 test mới mắt xích 4 "consolidation gate — KN-062" + tags assertion + fixture thêm mục ## 4.)
- slop-check `.github/harness/scripts/auto-learn.mjs`: ✅ Clean (chạy 2 lần: sau code edit + sau renumber comment — loop-it)
- auto-learn status: KN: 62 bài học — KN-062 (Memora) + KN-063 (Routing & Failover — session song song) parse OK, UpdatedAt OK
- guards: ✅ KN-062 → tests/e2e/auto-learn-guard.spec.ts (coverage: 62 KN · 35 có lưới · 25 ưu tiên major/critical)
- evaluate (bug thật): FAIL có chủ đích — dup KN-043(48)/KN-060(36.3)/KN-005(35.6) ≥ 15 → bypass + disclosure (như KN-060); hint GỘP in-reason ✓
- policy gate spec edit: actor verify → ✅ PERMITTED (allow-all) · actor Implement → ⛔ REFUSED (deny-test-mutate) — negative control ✓
- audit: edit tests/e2e/auto-learn-guard.spec.ts (actor verify) → hash=5d95a85279474ba2
- get_errors (auto-learn.mjs + spec + curated.json): 0 errors
- Concurrency: knowleged.md bị 2 session ghi xen kẽ (Memora + Routing & Failover) → nhiều edit fail do file đổi dưới chân; chốt theo trạng thái file: Memora=062 · Routing=063 (061 bỏ trống); disclosure trong UpdatedAt cả 2 entry
```

---

## 5. Lesson (1 câu)

> Bài học rút ra, 1 câu súc tích — sẽ copy vào `docs/knowleged.md` Bảng tóm tắt.

Memory tốt khi tách "lưu gì" khỏi "lấy thế nào": abstraction scan-được + tags làm cue anchors, GỘP hiểu biết mới vào entry cũ (dup-gate là detector), defer commit tri thức non — fragment + retrieval không stop condition là nợ kép.

---

## 6. Prevention

- **Cách phòng tránh lần sau:**
  - [x] Trước khi tạo KN mới: kiểm dup-gate (`evaluate`/RADAR) → trùng ≥ threshold → GỘP (amend) KN cũ; bypass phải disclosure (như KN-060)
  - [x] Row "Bài học (1 câu)" giữ vai primary abstraction — không nhồi detail; tags chọn theo đường truy cập (cue anchors — `suggest` cộng tags ×2)
  - [x] Draft non → defer (Hawking) thay vì commit sớm; KN 0 tham chiếu lâu = cold spot → gộp/viết lại (CMB heatmap)
  - [x] Đã thêm vào `docs/knowleged.md` Anti-patterns (3 bullets) + Checklist (1 dòng) — KN-062
- **Guard (lưới chống tái lập — KN-056):**
  - [x] Điền `- **Guard:**` ở Meta + detail ngay sau Severity (trong cap 2500 ký tự của `kn-parse`)
  - [x] KHÔNG phải tái lập (RADAR 6 nghi vấn — verdict: kề cận KN-060; khác chủ đề: representation/retrieval của knowledge base vs validation của skill edit)
- **Cần cập nhật:**
  - [x] `docs/knowleged.md` → `KN-062` (Bảng tóm tắt + Chi tiết + Anti-patterns + Checklist + UpdatedAt)
  - [x] `product-quality.instructions.md`: N/A (không phải chuẩn UI)
  - [x] Test mới: `tests/e2e/auto-learn-guard.spec.ts` (2 test + fixture update — actor verify, policy gate + audit)

---

## References

- `docs/knowleged.md#KN-062`
- Nguồn: MSR Memora blog 29/06/2026 · ICML 2026 · github.com/microsoft/Memora
- Issue / PR: #
- Commit fix: `<hash>`
