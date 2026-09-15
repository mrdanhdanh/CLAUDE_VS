> 🤖 Auto-log bởi auto-learn.mjs — 2026-09-15T15:35:01.510Z
> **Error:** `Visual prompt injection — quarantine text-only bo lot kenh anh/media (Meta: ASR >80% tren GPT-5.5/Qwen3.6; Muse phai lam classifier rieng cho images/media/files)`
> **File:** `.github/harness/scripts/context.mjs`
> **Title:** Visual prompt injection: kenh anh cung la kenh inject

> 🔁 **RADAR TÁI LẬP** — đối chiếu KN + bug cũ thấy nghi vấn:
> - 🔁 NGHI TÁI LẬP **[KN-059]** (score 97.3): Content ≠ Authority: adopt mechanism-half, không adopt doctrine-half
> - 🔁 NGHI TÁI LẬP **[KN-053]** (score 54.8): `git checkout HEAD -- <file>` revert nhầm refactor chưa commit — recover bằng VS Code Local History
> - 🔁 NGHI TÁI LẬP **[KN-057]** (score 44.7): Ranh giới vibe coding vs engineering ở review/verify chain, không ở label — "keep holding the wheel"
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-14-compresshits-bo-sot-marker-cho-prompt-injection-hi`** (score 148.6): compressHits bỏ sót marker cho prompt-injection hits
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-12-dark-energy-high-gia-tien-gate`** (score 45.2): dark-energy-high-gia-tien-gate
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-13-git-checkout-head-revert-nham-refactor-chua-commit`** (score 37.2): git checkout HEAD -- revert nhầm refactor chưa commit của auto-learn.mjs
> → Đọc **Cách phòng tránh** trong `docs/knowleged.md` TRƯỚC khi fix. Nếu là tái lập thật: ghi rõ "tái lập của KN-059" + **vì sao lưới cũ không bắt được** → nâng lưới (Guard) rồi mới fix.

> **⚖️ RADAR adjudication (YUNIE, 2026-09-15):** KHÔNG phải tái lập KN-059 — KN-059 xử lý ingest **TEXT** (`compressHits` marker cho text hits); đây là **mở rộng phạm vi modality** (ảnh/media/screenshot chưa từng có guard). Vì sao lưới cũ không phủ: provenance được định nghĩa theo kênh (text) thay vì theo nguyên lý (mọi modality đều untrusted). Kết luận: **amend KN-059** (mở rộng luật sang mọi modality — `evaluate` dup=42.5 khuyến nghị GỘP), KHÔNG tạo KN mới. Hành động: nâng lưới G3 (guard-redteam) TRƯỚC khi build vision path.
>
> **🔄 Trạng thái (15/09 — DONE):** D0a ✅ luật modality đã áp (`cua-safety` §1 + §5 checklist · `agent-governance` §8 bullet + checklist · re-export `.claude/rules` 2 cập nhật) · D0c ✅ amendment KN-059 đã dán · **D0b ✅ G3 ENFORCED** — human takeover "duyệt": gate demo refuse→takeover + audit 2 events (control + edit) + test G3 alt-text visual-injection; spec `guard-redteam.spec.ts` **18/18 GREEN**.
# Bug: Visual prompt injection: kenh anh cung la kenh inject

> ℹ️ **Article-lesson intake** — từ Meta research (Repeat-After-Me 07/09/2026 + "How We Built Safety Into Muse" 08/09/2026). Chi tiết đầy đủ: `docs/meta-research-deep-dive.md` §2.1–§2.2 + KN-067 draft §5.

> Copy file này vào `.agent/bugs/2026-09-15-visual-prompt-injection-kenh-anh-cung-la-kenh-inje/bug.md` khi bắt đầu `/fixbug`.

## Meta

- **Slug:** `2026-09-15-visual-prompt-injection-kenh-anh-cung-la-kenh-inje`
- **Ngày:** 2026-09-15
- **Severity:** `major`
- **Layer:** `process` (lớp guard được thiết kế theo kênh text — defect ở phạm vi luật, không ở code cụ thể)
- **Reporter:** YUNIE (research intake — fetch trực tiếp 2 nguồn Meta)
- **Related KN:** `KN-059` — **GỘP/amend** (draft amendment: `docs/meta-research-deep-dive.md` §5.1; `evaluate` khuyến nghị GỘP — dup 42.5)
- **Tags:** `safety` `prompt-injection` `context` `governance` `verify`
- **Guard:** `tests/e2e/guard-redteam.spec.ts` — case **G3** ✅ ENFORCED (15/09, human takeover — spec immutable mở bằng `--intent takeover`, KN-012)
- **Status:** `fixed` (15/09 — D0a+D0b+D0c done; Done per KN-056: reproduce ✅ + regression 18/18 ✅ + Guard G3 ✅ + KN-059 amend ghi ✅)
- **Progress (15/09):** D0a ✅ (`cua-safety` + `agent-governance` + re-export) · D0c ✅ (amendment KN-059) · D0b ✅ G3 (gate takeover + audit 2 events + spec 18/18)

---

## 1. Reproduce

### Steps (article-lesson — reproduce bằng đối chiếu guard vs kênh tấn công)
1. Đọc `context.mjs` quarantine → xác nhận chỉ regex text (line 32).
2. Grep toàn repo tìm guard cho visual/OCR/screenshot/alt-text/media → **0 kết quả**.
3. So với 2 nguồn Meta độc lập: Repeat-After-Me (visual injection ASR >80% — kể cả chỗ textual injection fails) + Muse architecture (classifier riêng cho: injection via images/media · via files downloaded · trong DOM).

### Expected vs Actual
- **Expected:** mọi modality vào context đi qua lớp provenance/injection — "ảnh/media/screenshot = 0 instruction authority", instruction nhúng bị flag + audit.
- **Actual:** chỉ text đi qua `context.mjs`; kênh ảnh/media/alt-text/screenshot không có đường provenance nào.

### Evidence
- `context.mjs:32` — regex text-only: `/ignore (all )?previous instructions|reveal (system )?prompt|delete all/i` — không có nhánh xử lý nguồn gốc pixel/OCR.
- Repeat-After-Me (Meta, 07/09/2026): ASR > 80% trên Qwen3.6-27B & GPT-5.5 (benign prompt không liên quan); demo OpenClaw: ảnh inject → ghi đè `TOOLS.md` → RCE + exfil; "works in cases where adaptive textual prompt injection fails".
- Muse safety blog (Meta, 08/09/2026): danh sách classifier production gồm cả "attempted prompt injection via images/media" + "via files downloaded via the browser".

### Environment
- Branch: `main`
- Commit: hiện tại (không có prod code change — intake)
- OS: Windows — harness chạy trên host (boundary khác VM isolation của Muse, đã disclose `cua-safety` §4)

---

## 2. Root Cause (5 Whys)

- **File:Line:** `.github/harness/scripts/context.mjs:32` (quarantine regex) · `:48-49` (`_quarantined`/`_injection` marker)
- **Why 1:** Kênh ảnh/media/screenshot không đi qua lớp provenance nào → không thể bị flag.
- **Why 2:** Guard được thiết kế quanh pipeline RAG text (`compressHits`/`quarantine`) — input path duy nhất có provenance là text.
- **Why 3:** Harness chưa từng có visual input path (CUA executor chưa tồn tại; screenshot hiện là evidence, không phải context) → guard theo kênh-hiện-có.
- **Why 4:** KN-059 (content ≠ authority) viết quanh "content" = text; chưa được khái quát thành "mọi modality".
- **Why 5 (Root):** Luật provenance định nghĩa **theo kênh** (enum các nguồn đã biết) thay vì **theo nguyên lý** (mọi kênh đều untrusted, kênh mới phải mặc định bị chặn) → kênh mới xuất hiện sẽ lại thiếu guard. Đây là default-allow cục bộ, vi phạm fail-closed (mirror `policy.json` deny-first).

- **Impact:** Khi harness có vision/OCR input path (CUA executor, visual verify đưa ảnh vào context) → injection qua ảnh có thể lọt và dẫn tới action ngoài ý muốn. Hiện tại chưa có vision input path nên chưa exploit được runtime trong harness — nhưng alt-text của ảnh là surface text đã tồn tại (markdown).
- **Hypothesis:** đã verify — đọc code trực tiếp + 2 nguồn Meta độc lập cùng kết luận (meta nguồn 2: Muse làm classifier riêng cho images/media/files downloaded).
- **Confidence:** `MEDIUM` — gap được chứng minh (code + 2 nguồn), nhưng chưa có runtime repro vì vision path chưa tồn tại; phần vision tương lai là **declared guard** (mirror KN-065), chưa phải enforced.

> Nếu bug chạm pattern trong `docs/knowleged.md` → ghi `Related KN: KN-XXX` và áp dụng **Cách phòng tránh** ngay.
> **Root Cause Gate:** Nếu uncertain → investigate / escalate, không tự biến hypothesis thành sự thật.

---

## 3. Fix

- **Approach:** Sửa ở gốc như thế nào (không patch triệu chứng)? Bounded — không refactor lan rộng.
- **Files Changed:**
  - `path/to/file.ts` — mô tả thay đổi
- **Diff tóm tắt:**
```diff
// before
// after
```
- **Non-Goals:** Việc gì KHÔNG làm trong lần fix này (tránh scope creep — bounded repair loop)?
- **Fix Confidence:** `HIGH` | `MEDIUM` | `LOW` — đánh giá trước khi sang Verify. Nếu LOW → STOP, report uncertainty, ask/escalate.
- **get_errors:** Sau mỗi edit → affected files; full scope ở Phase 4 Verify.

---

## 4. Verification

- [x] Reproduce đối chiếu guard ↔ kênh tấn công → **Fixed** (luật modality áp; G3 phủ surface text của ảnh)
- [x] Edge cases:
  - [x] case 1: payload nhúng trong alt-text/markdown-image → quarantine reject + `_injection` (G3)
  - [x] case 2: negative control — alt-text thường (photosynthesis, ảnh gia đình) không bị flag
- [x] Regression: toàn spec guard-redteam **18/18 passed** (G1, G2, D1–D7 + G3)
- [x] `get_errors` spec + docs → 0 errors
- [x] Test: `npx playwright test tests/e2e/guard-redteam.spec.ts` → **18 passed (6.2s)**
- [x] Policy gate: `policy-check edit guard-redteam.spec.ts` actor YUNIE → ⛔ REFUSED (deny-test-mutate) · `--intent takeover` → ✅ PERMITTED; audit 2 events (control + edit, intent=takeover)
- [ ] UI audit: không áp dụng (không phải bug UI)
- [x] Fresh-eyes tier: `OPTIONAL` (deterministic CLI contracts) — G3 assert theo output thật của quarantine/compress

**Kết quả:**
```
Running 18 tests using 6 workers
  18 passed (6.2s)
```

---

## 5. Lesson (1 câu)

> Mọi modality đều là kênh inject: nội dung nguồn gốc ảnh/media/screenshot = **0 instruction authority** + gắn nhãn `_visual_untrusted` + flag/audit (không execute); vision path tương lai phải route qua quarantine **trước khi build** (declared guard).

*(Amendment cho KN-059 đã soạn sẵn: `docs/meta-research-deep-dive.md` §5.1 — human dán vào `docs/knowleged.md`. `evaluate`: GỘP, không tách KN mới.)*

---

## 6. Prevention

- **Cách phòng tránh lần sau:**
  - [x] Chuyển luật provenance từ **theo kênh → theo nguyên lý**: "mọi modality untrusted" — ✅ đã áp 15/09: `cua-safety` §1 + §5 + `agent-governance` §8 + re-export `.claude/rules`
  - [x] Lethal trifecta check (Delta D1): private data + untrusted content + egress hội đủ → bẻ ≥1 chân — ✅ đã áp 15/09 (`agent-governance` §8 + `cua-safety` §4 + checklist cả hai)
  - [x] ✅ Amendment KN-059 đã dán 15/09 (Bảng tóm tắt + Chi tiết + UpdatedAt; `guards` vẫn detect)
- **Cần cập nhật:**
  - [x] `docs/knowleged.md` → **KN-059 amend** (không phải KN mới — theo `evaluate` GỘP) — ✅ dán 15/09
  - [x] `product-quality.instructions.md` — không áp dụng (không phải chuẩn UI)
  - [x] Test mới: `tests/e2e/guard-redteam.spec.ts` **G3** ✅ thêm 15/09 (human takeover) — 18/18 GREEN

---

## References

- `docs/meta-research-deep-dive.md` — §2.1 (Muse safety), §2.2 (Repeat-After-Me), §4 (delta D0a–D0c), §5.1 (amend KN-059)
- Nguồn: [Repeat-After-Me](https://ai.meta.com/research/publications/repeat-after-me-black-box-adaptive-visual-prompt-injection/) (07/09/2026) · [How We Built Safety Into Muse](https://research.meta.ai/blog/security-and-safety-for-ai-agents-our-approach-with-muse) (08/09/2026)
- `docs/knowleged.md#KN-059` (gốc — kênh text)
- Commit fix: — (article-lesson, chưa có prod fix; fix = rule + guard khi vision path được build)

---
*Template: `.agent/bugs/_template/bug.md` — dùng bởi `/fixbug` Phase 1 & 5.*
