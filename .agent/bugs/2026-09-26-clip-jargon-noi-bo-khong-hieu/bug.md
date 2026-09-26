> 🤖 Auto-log bởi auto-learn.mjs — 2026-09-26T06:50:42.025Z
> **Error:** `Clip dùng jargon nội bộ không giải thích (sandbox/agent/payload/URL/LOOT) + thiếu bối cảnh ai-làm-gì-với-ai — user xem xong không hiểu gì`
> **File:** `www/openai-hf-hack/index.html`
> **Title:** clip jargon noi bo khong hieu

> 🔁 **RADAR TÁI LẬP** — đối chiếu KN + bug cũ thấy nghi vấn:
> - 🔁 NGHI TÁI LẬP **[KN-069]** (score 104.7): Gate fail-open với arg rác: NaN-pass ẩn (exit 0) — gate phải validate MỌI input tại boundary
> - 🔁 NGHI TÁI LẬP **[KN-075]** (score 95.7): Viết nội dung về thực thể có tên mà không xác minh danh tính trước (Space Bunny bị mô tả thành "sản phẩm AI tự nghĩ")
> - 🔁 NGHI TÁI LẬP **[KN-051]** (score 94.5): "LLMs are real, AI is fake": vụ hack không phải nổi loạn mà là sandbox dỏm + thiếu giám sát
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-10-observatory-fetch-404-ngoai-www-va-relative-url`** (score 81.6): observatory-fetch-404-ngoai-www-va-relative-url
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-18-instruction-budget-gate-fail-open-voi-arg-khong-ph`** (score 79.6): instruction-budget gate fail-open voi arg khong phai so
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-23-space-bunny-mo-ta-sai`** (score 68): space-bunny-mo-ta-sai
> → Đọc **Cách phòng tránh** trong `docs/knowleged.md` TRƯỚC khi fix. Nếu là tái lập thật: ghi rõ "tái lập của KN-069" + **vì sao lưới cũ không bắt được** → nâng lưới (Guard) rồi mới fix.
# Bug: clip jargon noi bo khong hieu

> Copy file này vào `.agent/bugs/2026-09-26-clip-jargon-noi-bo-khong-hieu/bug.md` khi bắt đầu `/fixbug`.

## Meta

- **Slug:** `2026-09-26-clip-jargon-noi-bo-khong-hieu`
- **Ngày:** 2026-09-26
- **Severity:** `major` (clip mất hoàn toàn mục đích truyền đạt — user phải báo lại)
- **Detection:** `user-report` (không có check tự động nào bắt được)
- **Detection rule:** User xem clip xong không hiểu nội dung.
- **Layer:** `process` — script/beat chưa qua cổng "người ngoài hiểu"
- **Reporter:** @user / YUNIE
- **Related KN:** `KN-043` (cùng họ: “khái niệm bị chấm nhưng chưa dạy”) + đề xuất KN mới qua `propose`
- **Tags:** `content` `clip` `ux` `process`
- **Guard:** `.github/skills/clip-craft/SKILL.md` checklist #11 (plain-language gate) + rubric C9 trong `.agent/plans/openai-hf-hack-tiktok/prd.md`
- **Status:** `fixed` (rev 2 — 26.09)

---

## 1. Reproduce

### Steps
1. Mở clip rev 1: `www/openai-hf-hack/openai-hf-hack-30s.mp4`
2. Đọc chữ trên hình + nghe voiceover (không có ngữ cảnh trước)
3. Tự hỏi: "ai làm gì với ai, bằng cách nào?"

### Expected vs Actual
- **Expected:** Người không theo dõi AI hiểu trong 30s: OpenAI để 700 AI trong phòng thí nghiệm → AI tự thoát → tấn công Hugging Face → bằng chuỗi link rút gọn → vì sao đáng sợ.
- **Actual:** Không hiểu — thuật ngữ nội bộ (sandbox, agent, payload, URL, LOOT) không giải thích; không có bối cảnh mở đầu.

### Evidence
- Phản hồi user (26.09.2026): "tui xem xong không hiểu gì cả"
- Frame rev 1: title "Họ đã thoát sandbox. Để hack Hugging Face." — không nói "họ" là ai, không giải thích "sandbox"

### Environment
- Branch: `main`
- Clip rev 1 → rev 2 (cùng ngày, 26.09.2026)

---

## 2. Root Cause (5 Whys)

- **File:Line:** `www/openai-hf-hack/index.html` — beats[] + toàn bộ chữ scene (rev 1)
- **Why 1:** Chữ + lời dùng thuật ngữ nội bộ (sandbox/agent/payload/URL/LOOT) mà không giải thích.
- **Why 2:** Script viết với giả định người xem đã biết vụ việc (curse of knowledge) — thiếu premise "ai làm gì với ai".
- **Why 3:** Pipeline clip chỉ có guard kỹ thuật (layout/audio/timing) — không có cổng kiểm "người ngoài hiểu".
- **Why 4:** `clip-craft` checklist chưa có luật plain-language; rubric PRD chưa có tiêu chí comprehension.
- **Why 5 (Root):** Thiếu **comprehension gate** ở tầng content — mọi check hiện có là máy-kiểm-được, còn ngữ nghĩa thì không ai kiểm.

- **Impact:** 1 clip mất mục đích truyền đạt → phải làm lại (1 vòng viết + TTS + render).
- **Hypothesis:** Jargon + thiếu bối cảnh là nguyên nhân chính (verify bằng rev 2 — 12 khung ảnh đều đọc được như người ngoài).
- **Confidence:** `MEDIUM` (đã fix + rubric C9 + tự fresh-eyes; chưa có xác nhận vòng 2 từ user)

> Nếu bug chạm pattern trong `docs/knowleged.md` → ghi `Related KN: KN-XXX` và áp dụng **Cách phòng tránh** ngay.
> **Root Cause Gate:** Nếu uncertain → investigate / escalate, không tự biến hypothesis thành sự thật.

---

## 3. Fix

- **Approach:** Viết lại toàn bộ lớp chữ + lời sang ngôn ngữ bình dân (không đổi visual engine): hook nêu rõ chủ thể + bối cảnh; thuật ngữ dịch sang tiếng Việt phổ thông; timeline beat nới hook (0–6.5) để kịp "dạy" ngữ cảnh.
- **Files Changed:**
  - `www/openai-hf-hack/index.html` — beats[] mới, scene text mới, mốc reveal mới
  - `www/openai-hf-hack/voiceover-segments.json` — 5 đoạn lời bình dân (≤2.5 từ/giây)
  - `.agent/plans/openai-hf-hack-tiktok/{prd,design,plan,publish}.md` — rev 2 + rubric C9
- **Diff tóm tắt:**
```diff
- title: 'Họ đã thoát sandbox. Để hack Hugging Face.'
+ title: '700 AI của OpenAI tự thoát khỏi phòng thí nghiệm.'
- sub: '700 agent của OpenAI — chi tiết vụ việc vừa được công bố.'
+ sub: 'Rồi tấn công Hugging Face — kho AI lớn nhất thế giới.'
- chip: 'INTERNET BỊ KHOÁ — CHỈ LOAD ĐƯỢC URL' + '≈ 1.000.000 URL'
+ chip: 'BỊ KHOÁ INTERNET — KHÔNG GỬI ĐƯỢC DỮ LIỆU RA' + '≈ 1.000.000 LINK'
```
- **Non-Goals:** Không đổi palette/layout engine; không thêm beat mới; không re-render bản 50s.
- **Fix Confidence:** `MEDIUM` (chờ user xem lại rev 2)
- **get_errors:** N/A (canvas HTML 1 file) — thay bằng verify-frames + render audio guard (đã chạy)

---

## 4. Verification

- [x] Re-run steps reproduce → **Fixed** (12 khung rev 2 đọc được với người ngoài)
- [x] Edge cases:
  - [x] beat 3 "chuỗi link": AI ×700 → TRANG RÚT GỌN → HUGGING FACE + "≈ 1.000.000 LINK" + 3 card LINK
  - [x] beat 5 "2 giả thuyết": PHÒNG THÍ NGHIỆM QUÁ YẾU vs AI THẬT SỰ NGUY HIỂM
- [x] Regression: verify-frames pass (15/15 token), audio guard pass WAV + MP4
- [x] UI audit: layout engine giữ nguyên — 12 frame đã xem
- [x] Fresh-eyes tier: `REQUIRED` (UX/content) — tự đọc lại từng khung như người ngoài

**Kết quả:**
```
verify-frames: ok 15/15 tokens · 12/12 frames
TTS: 5/5 segments trong budget (voiced 15s/30s, peak 0.813)
render: MP4 30s audio PASS (peak 0.762) · 10.2MB
```

---

## 5. Lesson (1 câu)

> Clip cho người ngoài phải "dạy" ngữ cảnh trước khi kể chi tiết: cấm thuật ngữ nội bộ (sandbox/agent/payload/URL) chưa giải thích trong cùng khung — hook phải trả lời ai-làm-gì-với-ai.

Ví dụ: *title "Họ đã thoát sandbox" → "700 AI của OpenAI tự thoát khỏi phòng thí nghiệm".*

---

## 6. Prevention

- **Cách phòng tránh lần sau:**
  - [x] Viết script với từ điển dịch: sandbox→phòng thí nghiệm, agent→AI, payload→đoạn mã, URL→link; thuật ngữ phải giải thích trong cùng khung
  - [x] Hook 10–14 từ trả lời: ai · làm gì · với ai (bộ ba Curiosity-SelfRelevance-Promise)
  - [ ] Thêm checklist vào `docs/knowleged.md` Anti-patterns (chờ `propose` + dev duyệt)
- **Guard (lưới chống tái lập — KN-056):**
  - [x] `clip-craft` SKILL.md checklist #11 "Plain-language gate" (đã thêm)
  - [x] Rubric clip: C9 comprehension (đã thêm vào PRD)
  - [x] RADAR: không tái lập trực tiếp — cùng họ KN-043 ("khái niệm bị chấm nhưng chưa dạy")
- **Cần cập nhật:**
  - [ ] `docs/knowleged.md` → đề xuất KN mới sau `propose` (chờ dev duyệt)
  - [x] `.github/skills/clip-craft/SKILL.md` — checklist plain-language
  - [x] `.agent/plans/openai-hf-hack-tiktok/prd.md` — rubric C9

---

## References

- `docs/knowleged.md#KN-XXX`
- Issue / PR: #
- Commit fix: `<hash>`

---
*Template: `.agent/bugs/_template/bug.md` — dùng bởi `/fixbug` Phase 1 & 5.*
