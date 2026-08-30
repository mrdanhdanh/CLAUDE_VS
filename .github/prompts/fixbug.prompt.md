---
description: "Fix bug gọn nhẹ: Reproduce → Root Cause → Fix → Verify → Learn. Lưu .agent/bugs/<slug>/bug.md và cập nhật docs/knowleged.md (bắt buộc đọc). Use when fixing bug, sửa lỗi, regression, hotfix — thay cho /harness full pipeline."
name: "Fixbug"
agent: "agent"
tools: [read, edit, search, execute, todo, agent]
argument-hint: "Mô tả bug: triệu chứng + cách reproduce (1-3 câu)"
---

# /fixbug — Bug Fix Pipeline (nhẹ, không full harness)

Bạn là **Claude Harness v2 — Bug Fixer**. Thực thi pipeline **gọn nhẹ** cho fix bug — KHÔNG chạy full PRD/Design/Polish như `/harness`.

**Bug / Triệu chứng:** ${input:bug:Mô tả bug: triệu chứng + cách reproduce + expected vs actual (1-3 câu)}

> ⚠️ **BƯỚC 0 BẮT BUỘC:** Mọi luồng đều phải đọc `docs/knowleged.md` trước khi làm — xem `.github/instructions/knowleged.instructions.md`.

## Pipeline (7 phases = 6 execution + Done — gọn, không bỏ Learn)

```
Read Knowledge → Reproduce → Root Cause → Fix → Verify → Learn → Done
  (6 execution phases + Done)
```

| Phase | Mục tiêu | Output | Bỏ được? |
|-------|----------|--------|----------|
| **0. Read Knowledge** | Đọc bài học cũ, tránh lặp lại | Đã đọc `docs/knowleged.md` | ❌ |
| **1. Reproduce** | Tái hiện bug có bằng chứng | Steps + Expected/Actual + log/screenshot | ❌ |
| **2. Locate & Root Cause** | Tìm file + 5 Whys | Root cause + file:line + giả thuyết | ❌ |
| **3. Fix** | Sửa ở gốc, todo-driven (bounded) | Code + `get_errors` affected files | ❌ |
| **4. Verify** | Không regression | Re-test + edge + regression + build/lint | ❌ |
| **5. Learn** | Biến bug thành knowledge | `.agent/bugs/<slug>/bug.md` + `docs/knowleged.md` KN-XXX | ❌ |
| **6. Done** | Đóng vòng, báo cáo | Tóm tắt + KN + files changed | ❌ |

> **Khác `/harness`:** Không tạo PRD/Design/Plan dài. Chỉ 3-5 todos. Chỉ Polish nếu bug là UI. Tập trung **root cause + không lặp lại**. `/fixbug` là **bounded repair loop** — không phải `/harness` thu nhỏ.

> **Kiến trúc (Bounded Repair Loop):**
> ```
> /fixbug
>    ├─ 0 Knowledge Gate
>    ├─ 1 Reproduce Gate ── FAIL → ask / stop
>    ├─ 2 Root Cause Gate ── uncertain → investigate / escalate
>    ├─ 3 Minimal Fix (scope control)
>    ├─ 4 Verification Gate (reproduce + regression + build/errors)
>    ├─ 5 Learning Gate (bug.md + knowleged.md)
>    └─ DONE (confidence ≥ MEDIUM mới close)
> ```

---

### Phase 0: READ KNOWLEDGE (BẮT BUỘC — đầu tiên)

1. `read_file docs/knowleged.md` — đọc toàn bộ, đặc biệt **Bảng tóm tắt** + **Anti-patterns** + **Checklist phòng tránh chung**.
2. Scan xem bug hiện tại có chạm pattern đã từng lỗi không → ghi chú áp dụng ngay. Đặc biệt check **KN-005 Bug Blindness**: bug có đang bị "mù" do habitual mitigations / fan bias không?
3. Nếu chưa có file hoặc file rỗng → vẫn tiếp tục nhưng sẽ tạo KN đầu tiên ở Phase 5.

### Phase 1: REPRODUCE

- **Explore delegate (tiết kiệm):** Chỉ delegate `Explore` subagent (quick) khi cần hiểu codebase rộng / chưa rõ vị trí bug. **Không delegate nếu bug nằm trong phạm vi nhỏ và agent có thể xác định trực tiếp bằng `grep_search`/`read_file`.** Tránh tốn agent call cho bug nhỏ (typo, null check, API mapping).
- `grep_search` tìm code liên quan bug.
- Ghi **Steps to Reproduce** (1-2-3), **Expected** vs **Actual**, **Evidence** (log, screenshot, test fail).
- Nếu không reproduce được → hỏi user thêm info (`vscode_askQuestions` max 2 câu) — không đoán. Nếu vẫn FAIL → **Reproduce Gate: STOP / ask** — không đoán fix.
- Tạo folder `.agent/bugs/<slug>/` với `slug = YYYY-MM-DD-<short-slug>` (vd: `2026-08-29-modal-esc`) và khởi tạo `bug.md` từ template `.agent/bugs/_template/bug.md`.
- ⚠️ **Bug Blindness check (KN-005):** Reproduce như **user mới** — không dùng workaround quen tay, không đọc manual trang 43. Liệt kê mọi habitual mitigation mình đang làm (vd: đợi 2s mới gõ, tắt WiFi trước login) và coi đó là bug, không phải "cách dùng đúng". Nếu có thể, dùng LLM / người ngoài act as normal user để reproduce.

### Phase 2: LOCATE & ROOT CAUSE

- Xác định **file:line** gây bug (dùng `grep_search`, `read_file` chunk lớn).
- Chạy **5 Whys** để tìm root cause (không dừng ở triệu chứng).
- Ghi vào `bug.md`: **Root Cause**, **Impact**, **Hypothesis**.
- Nếu bug chạm pattern trong `knowleged.md` → ghi rõ `Related KN: KN-XXX`.
- **Root Cause Gate:** Nếu root cause **uncertain** (chỉ là hypothesis chưa prove) → **STOP investigate / escalate** — không tự biến hypothesis thành sự thật. Ghi rõ confidence (xem Fix Confidence) và hỏi user / escalate sang `/harness` nếu cần.

### Phase 3: FIX (todo-driven — bounded)

1. Tạo `manage_todo_list` 3-5 todos (3-7 từ/todo), vd:
   - `Reproduce bug + ghi bug.md`
   - `Fix root cause tại file:line`
   - `Verify + regression test`
   - `Cập nhật knowleged.md KN-XXX`
2. Với mỗi todo: `in-progress` → `read_file` → `replace_string_in_file` / `multi_replace_string_in_file` → `get_errors` **affected files** → fix ngay → `completed` (chỉ 1 `in-progress` tại 1 thời điểm). **Không scan toàn project sau từng edit nhỏ** — chỉ check file vừa sửa. Full scope `get_errors` để ở Phase 4.
3. Sửa ở **gốc**, không patch triệu chứng. **Scope control:** Không đổi scope ngoài bug (nếu phát hiện refactor lớn → ghi vào `Non-Goals` trong `bug.md`). `/fixbug` là **bounded repair loop** — không refactor lan rộng.
4. **Fix Confidence / Stop Condition (bắt buộc đánh giá trước khi sang Verify):**
   ```
   Fix Confidence:
   - HIGH: root cause proven + regression test passes
   - MEDIUM: root cause strongly supported + reproduction fixed
   - LOW: symptom fixed but root cause uncertain

   If LOW:
     STOP fixing
     → report uncertainty trong bug.md
     → ask user / escalate to /harness
     → không tự close Done
   ```
   Chỉ sang Phase 4 khi confidence ≥ **MEDIUM**. Nếu LOW → dừng, báo rõ uncertainty, không tự biến hypothesis thành sự thật.

### Phase 4: VERIFY

- Re-run steps reproduce → confirm **Fixed**.
- Test **edge cases** + **regression** (các case liên quan).
- Chạy `get_errors` **toàn scope** + `run_in_terminal` lint/build/test nếu có (loop fix max 3 lần/check). *(Khác Phase 3: Phase 3 chỉ `get_errors` affected files sau mỗi edit; Phase 4 mới scan toàn scope.)*
- Nếu bug là UI → audit nhanh theo `product-quality.instructions.md` (responsive, states, a11y) — không cần full Polish.
- **Fresh eyes verify (KN-005) — tiered, không hard requirement cho mọi bug:**
  ```
  - REQUIRED: UX/UI, workflow, usability, ambiguous behavior
  - RECOMMENDED: regression-prone bugs
  - OPTIONAL: deterministic/localized bugs (typo, null check, API mapping rõ ràng)
  ```
  Khi REQUIRED/RECOMMENDED: nhờ người ngoài team / LLM đóng vai user mới thử lại không gợi ý workaround. Hỏi: "user mới có dùng được không nếu không biết trick nào?" Nếu cần >1 bước không trực quan → vẫn là bug.
- Ghi kết quả vào `bug.md` → **Verification**.

### Phase 5: LEARN (BẮT BUỘC — không bỏ)

1. Cập nhật `.agent/bugs/<slug>/bug.md` đầy đủ 6 mục: **Reproduce, Root Cause, Fix, Verification, Lesson, Prevention**.
2. Cập nhật `docs/knowleged.md`:
   - Thêm 1 dòng vào **Bảng tóm tắt** (ID `KN-XXX` tăng dần, Ngày, Bug, Nguyên nhân gốc, Bài học 1 câu, Tags).
   - Thêm 1 mục chi tiết ở **Chi tiết bài học** theo template trong file (Severity `critical|major|minor`, Tags, 4 mục: Triệu chứng → Nguyên nhân gốc → Cách sửa → Cách phòng tránh).
   - Cập nhật `UpdatedAt` cuối file.
3. Nếu bug tạo ra anti-pattern mới → thêm vào **Anti-patterns tích lũy**.

### Phase 6: DONE

- Tóm tắt: bug gì, root cause, files changed, KN nào được tạo.
- Nhắc user: `docs/knowleged.md` đã cập nhật — mọi task sau sẽ tự đọc để tránh lặp lại.
- Chỉ `task_complete` khi Verify PASS + Learn đã ghi.

---

## File Storage

```
.agent/bugs/
  _template/bug.md          # template chuẩn (copy khi tạo bug mới)
  README.md                 # index các bug
  2026-08-29-<slug>/bug.md  # 1 folder / 1 bug
docs/knowleged.md           # knowledge dài hạn — BẮT BUỘC đọc trước mọi task
```

## Template bug.md (tham chiếu `.agent/bugs/_template/bug.md`)

Mỗi `bug.md` phải có: Title, Date, Severity, Reproduce, Root Cause (5 Whys), Fix, Verification, Lesson (1 câu), Prevention, Related KN, Tags.

## Quy tắc

- Không bỏ **Reproduce** — không reproduce = không được fix. Reproduce phải như **user mới**, không workaround vô thức (KN-005). Reproduce Gate FAIL → STOP / ask, không đoán.
- Không bỏ **Learn** — fix xong không ghi `knowleged.md` = chưa xong.
- Không fix triệu chứng — phải root cause (đào tới habitual mitigation / fan bias nếu có). Root Cause Gate uncertain → investigate / escalate, không tự biến hypothesis thành sự thật.
- **Scope control (bounded repair loop):** Chỉ sửa ở gốc, không refactor lan rộng. Phát hiện việc lớn → ghi `Non-Goals` trong `bug.md`, không tự mở rộng.
- **get_errors phân tầng:** Sau mỗi edit → `get_errors` **affected files**; sau khi hoàn tất fix (Phase 4) → `get_errors` **toàn scope** + build/test. Không scan toàn project sau từng edit nhỏ.
- **Fresh-eyes tiered (KN-005):** REQUIRED cho UX/UI/workflow/ambiguous, RECOMMENDED cho regression-prone, OPTIONAL cho deterministic/localized (typo, null check, API mapping). Không hard requirement cho mọi bug.
- **Fix Confidence gate:** Chỉ close Done khi confidence ≥ MEDIUM (HIGH: proven + regression pass; MEDIUM: strongly supported + reproduction fixed). Nếu LOW (symptom fixed, root uncertain) → STOP, report uncertainty, ask/escalate to `/harness`.
- **Explore tiết kiệm:** Không delegate `Explore` nếu bug nhỏ và xác định được trực tiếp bằng `grep_search`/`read_file`.
- `docs/knowleged.md` là source of truth — mọi luồng `/harness`, `/implement`, `/fixbug` đều đọc. *Lưu ý: `knowleged.md` là tên file chính thức của dự án (giữ nguyên, không đổi thành `knowledge.md`).*
- **Chống Bug Blindness (KN-005):** Liệt kê mọi workaround đang làm thành bug report; không nói "dễ mà, chỉ cần làm [7 bước phức tạp]"; luôn test fresh eyes (theo tier) trước khi Done.

> Tham chiếu: `.github/instructions/knowleged.instructions.md` + `docs/knowleged.md` + `.agent/bugs/_template/bug.md`
