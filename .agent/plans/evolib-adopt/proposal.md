# Proposal — EvoLib (MSR, 30/07/2026) → Harness: consolidate, KHÔNG thêm KN

> **Status:** ⏸ **HOLD apply** (14/09 23:15) — đánh giá + đo hoàn tất; 2 edits §4 chờ **working tree sạch** (session song song đang giữ `docs/knowleged.md` + `www/ai-news/curated.json` dirty — xem §5).
> **Ngày:** 2026-09-14 · **Actor:** YUNIE · **Trigger:** user post link EvoLib.
> **Nguồn:** [blog 30/07/2026](https://www.microsoft.com/en-us/research/blog/evolib-turning-experience-into-evolving-knowledge/) + paper "Test-Time Learning with an Evolving Library" + github.com/microsoft/EvoLib.
> **Who did you think with?:** Dissent nội tại 2 hướng — (a) "xây consolidation tool tự động" → bác bằng ĐO (§3); (b) "tạo KN-061 riêng cho EvoLib" → bác bằng dup-gate + chính luận điểm bài. Rival prior art: KN-026 papers (Experience Funnel), Engram-lite (attest), Memora (KN-062 in-flight).

---

## 1. Mechanism vs claim (KN-052 — tách 2 lớp)

**Mechanism (verifiable → đối chiếu được):**
- **Consolidation:** tri thức mới nạp → retrieve tri thức tương tự → **hợp nhất thành dạng tổng quát hơn**, không thêm bản sao.
- **Weighting:** importance = utility hiện tại **+ đóng góp tạo tri thức hữu ích cho task tương lai**; "knowledge with the greatest long-term impact naturally becomes more prominent".
- **Units:** skills (từ thành công) + insights (từ lỗi); self-supervised (không cần ground-truth); black-box (không update model); order-robust; token-efficient hơn top retrieval-based memory.

**Claim/narrative (KHÔNG adopt làm số nội bộ):** đường cong "improves more rapidly with compute", benchmark deltas — không đo được ở scale harness, không dùng làm deadline/target.

## 2. Coverage map — harness hiện có gì (đối chiếu từng mechanism)

| EvoLib mechanism | Harness | Evidence |
|---|---|---|
| Consolidation (retrieve similar → merge) | ✅ phần lớn | `experience-funnel.mjs` `distill|consolidate|evidence` (adopt KN-026) + KN-062 in-flight "gộp thay vì phân mảnh" + `evaluate` dup-gate |
| Weighting (utility + long-term impact) | ✅ bản tối giản | `attest` Engram-lite Wilson → `scoreKnWithWilson` (**base + wilson×2**) trong `suggest`; CMB heatmap refs |
| Không nhớ vô hạn (filter/evaporate) | ✅ | Guard gate KN-056 · Hawking evaporate (`--apply --sign`) · 0-ref policy (heatmap: gộp/xoá) |
| Skills + insights (2 loại unit) | ✅ | KN (insight) + skills `harness-*` (distill từ KN) |
| Black-box, no model update | ✅ | "Process > Model", file-based, model-agnostic |
| Order-robustness | ✅ | Pipeline không phụ thuộc thứ tự task |

→ EvoLib **xác nhận** kiến trúc hiện tại; phần "mới" không đủ để tạo tri thức mới (xem §3).

## 3. Đo (evidence ngoài model — KN-023)

**Dup-gate đo 14/09** — `auto-learn suggest "EvoLib memory alone is not learning evolving library consolidation weighting reusable skills insights"`:

| KN | Score | Nhận xét |
|----|-------|----------|
| KN-026 (Experience Funnel — consolidate) | **40** | ≥ ngưỡng 15 → tái lập chủ đề |
| KN-060 (SkillOpt — knowledge evolution) | **31.8** | ≥ ngưỡng 15 → tái lập chủ đề |
| KN-037 (Evals Gap) | 29.7 | liên quan gián tiếp |

→ Theo policy hiện hành (dup ≥ threshold → **GỘP/amend**, không fragment — KN-062 vừa ghi): tạo KN-061 cho EvoLib = fragment hoá, **vi phạm chính luận điểm bài** ("không thông minh hơn chỉ vì nhớ nhiều hơn").

**Đo phụ — negative finding (giá trị chính của phiên này):** pair-scan similarity thuần (query = title+tags mỗi KN vs toàn library, BM25 `kn-parse`):

| Cặp | Điểm | Thực tế |
|-----|------|---------|
| KN-054 (ADHD) ↔ KN-037 (Evals) | 86.6 | **khác chủ đề** |
| KN-040 ↔ KN-030 (2 bug Cosmos khác nhau) | 96.1 | **khác bài học** |
| KN-026 ↔ KN-036 (self-evolving family) | 80.6 | liên quan thật |

→ **Không phân tách** cặp khác chủ đề (70–96) khỏi cặp liên quan thật (80.6); scale phụ thuộc độ dài query (multi-token inflate). Kết luận: **KHÔNG xây auto-merge/auto-gộp bằng similarity thuần** — consolidation giữ human-in-loop (dup-gate + 0-ref policy + git trace). Đúng KN-049: đo sai → sửa/không dùng phép đo, không đụng knowledge.

## 4. Verdict + edits (ready-to-apply, bounded)

**KHÔNG tạo KN mới. KHÔNG sửa code. KHÔNG sửa KN-026** (nội dung consolidation đã được KN-026 + KN-062 phủ; thêm nữa = "nhớ thêm").

**Edit A — `docs/knowleged.md` Anti-patterns** (thêm 1 dòng, cạnh block KN-062 hiện có):

```md
- ❌ Tự động hoá "merge candidate" giữa các KN bằng similarity thuần (BM25 tên+tags) rồi gộp/xoá theo điểm — đo thật 14/09 (EvoLib adopt): cặp khác chủ đề vẫn 70–96 điểm (KN-054↔KN-037 86.6 · KN-040↔KN-030 96.1), không phân tách được khỏi cặp liên quan thật (KN-026↔KN-036 80.6) → không dùng làm căn cứ; consolidation giữ human-in-loop: dup-gate lúc nạp + 0-ref policy + git trace (KN-062 + KN-049 + KN-026; chi tiết `.agent/plans/evolib-adopt/proposal.md`).
```

**Edit B — `www/ai-news/curated.json` EvoLib entry** — append cuối `summary` + thêm tag `KN-026`:

```text
 → Đánh giá adopt 14/09 (`.agent/plans/evolib-adopt/`): mechanism-half đã có phần lớn trong harness — consolidation = KN-026 (experience-funnel) + KN-062 (gộp thay vì phân mảnh); weighting = attest Wilson trong `suggest` (base + wilson×2). Dup đo được vs KN-026 (40)/KN-060 (31.8) → CONSOLIDATE, không tạo KN mới; đo thêm: auto-similarity merge = nhiễu → không xây.
```

## 5. ⚠️ Coordination flag (14/09 23:15 — PHÁT HIỆN SESSION SONG SONG)

Session song song đang active (mtime `knowleged.md` = 23:14:36, thời điểm kiểm tra 23:15:13) — đang adopt Routing & Failover + Memora:

- **BUG đánh số (23:15):** `docs/knowleged.md` có **2 KN cùng số `KN-062`** — "Routing & Failover" (detail ~line 1311) + "Memora" (detail ~line 1331); **thiếu KN-061 hoàn toàn**. Bảng tóm tắt dòng 85–86 cũng trùng `KN-062`.
- **Update 23:18 — session kia đã TỰ renumber:** Memora → **KN-061**, Routing & Failover → **KN-063**; hiện header đi 060 → 063 → 061 (chưa sort lại) và **gap KN-062** (khả năng cao đang dành cho Echoverse in-flight — `echoverse-adopt`). Flag 23:15 giữ làm lịch sử; việc còn lại: xác nhận dãy số kín (Echoverse = 062?) + thứ tự block đúng khi session đó commit.
- Dirty khác (session đó): `auto-learn.mjs` (+18/-6 — `evaluate --dir` hermetic), `tests/e2e/auto-learn-guard.spec.ts` (+51/-3), `www/ai-news/curated.json` (+2/-2), `playwright-report/index.html`.
- **Rule (áp cho mọi session):** không edit/`git add` các file này từ bên ngoài khi session kia chưa commit — tránh sweep WIP (KN-053: file dirty là vùng nguy hiểm).

## 6. Apply checklist (sau khi tree sạch)

1. `git status --short` → `docs/knowleged.md` + `www/ai-news/curated.json` không còn dirty (hoặc phần còn lại không xung đột).
2. Kiểm dãy số KN liên tục, không trùng (23:15 có 2× `KN-062`; 23:18 session kia tự xử → 061/063, còn gap 062 — xem §5 update). Nếu commit cuối vẫn lệch: fix số + bảng tóm tắt thành commit riêng TRƯỚC khi apply edits.
3. Apply Edit A (anti-pattern) + Edit B (curated note + tag).
4. Verify: `JSON.parse` curated.json OK · `node .github/harness/scripts/auto-learn.mjs status` (KN count đúng, không dup id) · `grep -i evolib docs/knowleged.md www/ai-news/curated.json` thấy trace.
5. Commit riêng theo file: `docs(knowleged): EvoLib (MSR) adopt — không thêm KN; anti-pattern similarity-merge (đo nhiễu) + curated note`.
