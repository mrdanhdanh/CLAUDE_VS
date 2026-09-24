> 🤖 Auto-log bởi auto-learn.mjs — 2026-09-23T15:39:29.249Z
> **Error:** `Space Bunny bị mô tả nhầm thành sản phẩm AI riêng thay vì model mới trên OpenCode đang cho dùng free`
> **File:** `www/space-bunny-free/index.html`
> **Title:** space-bunny-mo-ta-sai

> 🔁 **RADAR TÁI LẬP** — đối chiếu KN + bug cũ thấy nghi vấn:
> - 🔁 NGHI TÁI LẬP **[KN-034]** (score 65.8): Ecdysis — Failure diagnosis: model-specific vs harness-level, aggregate cross-task (2609.11677v1)
> - 🔁 NGHI TÁI LẬP **[KN-037]** (score 64.5): Evals Gap — "single biggest predictor" là evals discipline (Andrew Ng, Agentic AI Playbook 2026)
> - 🔁 NGHI TÁI LẬP **[KN-063]** (score 60.7): Routing & Failover: select trước khi gọi · output đã commit = terminal · sticky > re-route mỗi turn — chuẩn hoá pattern + lưới cho chuỗi gtx→gtx2→mymemory
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-10-edge-pc-khong-thay-hieu-ung-intro-reduced-motion`** (score 68.2): edge-pc-khong-thay-hieu-ung-intro-reduced-motion
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-10-observatory-fetch-404-ngoai-www-va-relative-url`** (score 58.3): observatory-fetch-404-ngoai-www-va-relative-url
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-19-scroll-dot-active-sai-do-thu-tu-mang-lech-dom`** (score 56.8): scroll-dot active sai do thứ tự mảng lệch DOM
> → Đọc **Cách phòng tránh** trong `docs/knowleged.md` TRƯỚC khi fix. Nếu là tái lập thật: ghi rõ "tái lập của KN-034" + **vì sao lưới cũ không bắt được** → nâng lưới (Guard) rồi mới fix.
# Bug: space-bunny-mo-ta-sai

## Meta

- **Slug:** `2026-09-23-space-bunny-mo-ta-sai`
- **Ngày:** 2026-09-24
- **Severity:** `major`
- **Detection:** `USER_REPORT`
- **Layer:** `process` — thiếu bước xác minh danh tính thực thể trước khi viết nội dung
- **Reporter:** @user (“lộn rồi, Space Bunny là 1 cái model mới ra trên OpenCode”)
- **Related KN:** `KN-075` (mới — xác minh danh tính thực thể trước khi viết)
- **Tags:** `process` `content` `verify` `data`
- **Guard:** `.github/skills/video-clip/SKILL.md` Phase 1 (Research bắt buộc + evidence ledger) + `.agent/plans/space-bunny-tiktok/plan.md` content guard
- **Status:** `fixed`

---

## 1. Reproduce

### Steps
1. User: “làm về nội dung AI, model Space Bunny Free, khoảng 40-60s”.
2. Agent viết PRD + kịch bản mô tả Space Bunny như **sản phẩm AI tự nghĩ ra**, không tra nguồn.
3. User: “lộn rồi, Space Bunny là 1 cái model mới ra trên OpenCode, đang cho xài free”.

### Expected vs Actual
- **Expected:** xác minh “Space Bunny” là gì (model? sản phẩm? công ty?) từ nguồn gốc trước khi viết dòng nào.
- **Actual:** tự suy danh tính từ 1 câu mô tả ngắn → viết sai hoàn toàn → phải làm lại PRD/kịch bản/voiceover.

### Evidence
```
User correction (2026-09-23): “lộn rồi, Space Bunny là 1 cái model mới ra trên OpenCode, đang cho xài free”
→ PRD + index.html + voiceover.txt viết lại từ đầu (từ “sản phẩm tự nghĩ” → “model ẩn danh trên OpenCode”)
→ sau đó còn sửa tiếp: context 1M (không phải 1.5M/2M) + mâu thuẫn retention OpenCode vs OpenRouter
```

### Environment
- Branch: `main` · 2026-09-23

---

## 2. Root Cause (5 Whys)

- **File:Line:** `.agent/plans/space-bunny-tiktok/prd.md` (bản đầu) + `www/space-bunny-free/index.html` (bản đầu)
- **Why 1:** Nội dung mô tả sai danh tính thực thể.
- **Why 2:** Không có bước tra cứu nào trước khi viết — nhảy thẳng từ yêu cầu sang sản phẩm.
- **Why 3:** Câu yêu cầu của user (“model Space Bunny Free”) bị coi là **đủ ngữ cảnh** để viết, dù chỉ là 1 mệnh đề không nguồn.
- **Why 4:** Pipeline harness có **Explore** (đọc codebase) nhưng không có bước xác minh thực thể **ngoài** codebase (sản phẩm/model/công ty được nhắc tên).
- **Why 5 (Root):** Với nội dung nói về thực thể có tên ở thế giới thật, “Explore” bị hiểu là chỉ đọc repo — thiếu luật “tra nguồn gốc trước khi viết”.

- **Impact:** Sai danh tính = viết lại 100% nội dung (PRD + clip + voiceover + tài liệu); nếu đã xuất bản là sai công khai.
- **Hypothesis:** Thiếu bước research → kiểm bằng cách bổ sung Research phase + evidence ledger; sau đó nội dung khớp nguồn (1M context, retention conflict đều truy được).
- **Confidence:** `HIGH` (nội dung đã viết lại + đối chiếu 4 nguồn)

> RADAR gợi ý KN-034/KN-037/KN-063 — **không khớp** (failure-diagnosis/evals/routing). Đây là bài học mới → `KN-075`.

---

## 3. Fix

- **Approach:** Thêm **Research phase bắt buộc** (bước 1/7) với **evidence ledger** gắn nhãn A/B/C/D trước khi viết nội dung về thực thể có tên; viết lại toàn bộ nội dung theo nguồn đã tra; giữ mâu thuẫn giữa các nguồn thay vì chọn phe.
- **Files Changed:**
  - `.agent/plans/space-bunny-tiktok/research.md` — mới: evidence ledger + capability assessment + mâu thuẫn retention.
  - `.agent/plans/space-bunny-tiktok/prd.md` — viết lại: facts có provenance, rubric C1–C7.
  - `www/space-bunny-free/index.html` + `voiceover-segments.json` — nội dung đúng danh tính + provenance.
  - `.github/skills/video-clip/SKILL.md` — Phase 1 = Research bắt buộc cho clip nói về sản phẩm/model.
- **Non-Goals:** Không tự đoán provider/model gốc; không biến “ẩn danh” thành suy đoán công ty.
- **Fix Confidence:** `HIGH`
- **get_errors:** 0 errors.

---

## 4. Verification

- [x] Re-run reproduce → **Fixed**: nội dung hiện mô tả đúng “model ẩn danh trên OpenCode, model id `space-bunny-free`”
- [x] Edge cases:
  - [x] Claim 1M context đối chiếu 4 nguồn (OpenCode X · OpenRouter · LM Market Cap · Benchable); `1.5M`/`2M` → **0 nguồn**
  - [x] Mâu thuẫn retention giữ nguyên (OpenCode 0 ngày vs OpenRouter “có thể lưu”), không chọn phe
- [x] Regression: video render 50s + audio guard PASS
- [x] `get_errors` → 0 errors
- [x] Fresh-eyes tier: `REQUIRED` (nội dung công khai) — đối chiếu nguồn, không dựa trí nhớ

**Kết quả:**
```
1M context: xác nhận (4 nguồn) · 1.5M/2M: không tồn tại
retention: mâu thuẫn 2 nền tảng — clip nêu đúng mâu thuẫn
clip 50s: mp4 avc1+mp4a, audio peak 0.9106 ✅
```

---

## 5. Lesson (1 câu)

> Khi viết nội dung về **thực thể có tên** (model/sản phẩm/công ty), phải tra nguồn gốc và lập evidence ledger TRƯỚC khi viết — một câu mô tả ngắn của user không phải là grounding.

---

## 6. Prevention

- **Cách phòng tránh lần sau:**
  - [x] Nội dung về thực thể có tên → **Research phase bắt buộc** + `research.md` với nhãn A (official primary) / B (official indexed) / C (aggregator) / D (rumor).
  - [x] Mỗi claim trong clip phải truy được về 1 dòng ledger; claim không truy được → cắt hoặc ghi “chưa xác minh”.
  - [x] Nguồn mâu thuẫn → **nêu mâu thuẫn**, không tự chọn phe.
  - [ ] Thêm checklist vào `docs/knowleged.md` (KN-075) + Anti-patterns.
- **Guard (lưới chống tái lập — KN-056):**
  - [x] `- **Guard:**` đã điền ở Meta → `video-clip` skill Phase 1 (Research + evidence ledger) là **lưới quy trình**; `plan.md` có content guard.
  - [x] ⚠️ **Giới hạn đã biết:** đây là lưới *quy trình*, **không phải test tự động** — không có spec nào fail khi agent viết sai danh tính. Muốn thành lưới cứng cần test đọc nội dung clip và đối chiếu ledger (chưa làm).
- **Cần cập nhật:**
  - [x] `docs/knowleged.md` → `KN-075`
  - [x] `.github/skills/video-clip/SKILL.md` — Phase 1 research bắt buộc

---

## References

- `docs/knowleged.md#KN-075` · KN-056 (nâng lưới trước khi fix)
- `.agent/plans/space-bunny-tiktok/research.md` (evidence ledger)
- `.github/skills/video-clip/SKILL.md` (Phase 1 Research)
- Commit fix: `<pending>`

*Template: `.agent/bugs/_template/bug.md` — dùng bởi `/fixbug` Phase 1 & 5.*
