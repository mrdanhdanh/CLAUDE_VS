# Content Review — 7 bài học Agentic Academy (fresh-eyes audit)

> Ngày: 2026-09-12 · Người thực hiện: YUNIE + **Critic agent phản biện độc lập** (KN-005 fresh eyes · KN-018 dissent · KN-023 critique ngoài tác giả)
> Câu hỏi kiểm duyệt: **"Người dùng đọc vào có hiểu mình cần phải LÀM GÌ không?"**

## 1. Rubric viết TRƯỚC khi chấm (KN-037)

| # | Tiêu chí | Cách đo |
|---|----------|---------|
| 1 | Sau mỗi slide trả lời được "làm gì tiếp theo?" | Hành động cụ thể, không trừu tượng |
| 2 | Thuật ngữ lạ có giải thích ở lần dùng đầu | List từ lạ → phải có gloss |
| 3 | Biết **LÀM Ở ĐÂU** (file/folder/IDE nào) | Không phải đoán |
| 4 | Biết **KIỂM bằng gì** | Tiêu chí đo được / có lệnh / có đối tượng |
| 5 | Biết **CẦN GÌ TRƯỚC** | Prerequisite rõ ràng |
| 6 | Không mâu thuẫn giữa các bài | Số đếm, đường dẫn, yêu cầu khớp nhau |

## 2. Phương pháp

1. Tự đọc lại toàn bộ `lessons.js` + `index.html` bằng mắt người mới (nhưng tác giả tự đọc → mù bug, nên bước 2 quan trọng).
2. **Critic agent** (context độc lập, không biết mình đã viết gì) đọc 2 file và trả findings có quote + level [blocker/major/minor].
3. Hội tụ 2 nguồn → sửa → khóa lại bằng test.

## 3. Kết quả chấm — bản TOÀN CỦA CẢ 2 NGUỒN đồng ý

**Verdict tổng:** nội dung trả lời tốt câu hỏi WHAT (agentic là gì, hệ thống gồm gì, nguyên tắc nào) — nhưng **hụt ở WHERE/HOW/VERIFY**: người mới biết *cần xây gì* nhưng không chắc *làm ở đâu, bằng gì, kiểm thế nào*.

### Blocker đã sửa

| # | Vấn đề | Ở đâu | Đã sửa thành |
|---|--------|-------|--------------|
| B1 | **Không có điểm neo "xưởng"** — "Tạo docs/agent-notes.md" nhưng không nói project nào | K1 steps | Thêm slide 2 "Trước khi bắt đầu — chuẩn bị 3 thứ" + Bước 0 chốt folder (`mkdir my-agent-lab`) + mọi bài ghi rõ "trong folder xưởng" |
| B2 | **Path thiếu prefix** — `skills/code-review/SKILL.md`, `prompts/` ở root = **không IDE nào đọc** → theo đúng chữ sẽ fail auto-trigger | K4 outcome | `.github/skills/...` + ghi rõ biến thể `.agents/` `.claude/` theo IDE |
| B3 | **"review the demo file"** — file không tồn tại → bước auto-trigger bất khả thi | K4 steps | Đổi thành "review 1 file dài trong project của bạn + gọi đích danh nếu không auto" (auto-trigger giờ là điểm cộng, không phải điều kiện cứng) |
| B4 | **Cài IDE không có link/nơi tải** | K2 steps | Thêm 4 official domain (code.claude.com · code.visualstudio.com · developers.openai.com/codex · antigravity.google) + note "cần tài khoản, có bản free/thử" + Node check |
| B5 | **Component/E2E evals bị chấm nhưng chưa dạy** | K6 goal | Goal + bullet định nghĩa ngay: "component = chấm từng bước · E2E = chấm cả scenario" |
| B6 | **PRD mini là jargon nội bộ** | K7 criteria | Đổi thành "mô tả ngắn 5 dòng (mục tiêu · phạm vi · không làm gì · tiêu chí xong)" |

### Major đã sửa

- **Mâu thuẫn 1 vs ≥2 IDE** (K2 cần 1, K3 criteria đòi 2, K7 checklist đòi 2) → chốt: **IDE chính = bắt buộc, IDE 2 = điểm cộng**; sửa cả 3 chỗ.
- **"Vào bài nào cũng được"** (homepage) mâu thuẫn phụ thuộc thật → thêm **chip "🧩 Cần trước"** trên cover mọi bài (data `need`) + đổi hint homepage thành "mỗi bài ghi rõ Cần trước".
- **Multi-IDE nhưng ví dụ chỉ VS Code** → K5 ghi rõ file config 3 IDE khác trong step; K3 tách rõ "VS Code không cần adapter"; bảng K2 giữ nguyên.
- **"Kiểm Ở ĐÂU" khi skill load** → thêm nguyên tắc "không thấy UI thì kiểm bằng HÀNH VI" (agent có theo checklist không) + test âm.
- **Tiêu chí rỗng nghĩa** (K5 "không có secret" — đương nhiên đạt; K7 "hỏi agent → đương nhiên đúng") → viết lại thành hành động đo được: K5 "đọc lại config xác nhận scope + token ở env var"; K7 "chạy trọn 1 vòng bug→KN→rule→lần sau không lặp".
- **Node.js chưa từng được nói tới** mà K5 dùng `npx` → thêm vào K1 prep + K2 step + K5 step + K5 need chip.
- **Thuật ngữ chưa giải thích:** state, hybrid, least-privilege (homepage), RAG, ngân sách bước, accommodation, rejected edits, trace tự tin, sprint, KN-XXX → đều thêm gloss tại chỗ.
- **K1 "3 khác biệt" mà liệt 5 bullet** → restructure đúng 3 khác biệt.
- **K5 JSON mẫu có comment `//`** → invalid JSON nếu copy → bỏ comment, chuyển giải thích vào steps.
- **K4 goal lệch criteria** (≥2 IDE vs ≥1) → goal đổi thành "chạy trên IDE của bạn, biết cách port".
- **K3 `@import` mơ hồ** ("tool không hỗ trợ import thì…" — user không biết tool mình có hỗ trợ không) → viết thẳng: VS Code không cần adapter; Claude Code 1 dòng trỏ, không chắc thì copy.

### Defer (ghi rõ lý do — không giấu)

| Vấn đề Critic nêu | Quyết định | Lý do |
|---|---|---|
| Tách **"Bài 0 — Chuẩn bị"** thành lesson riêng | ❌ Defer — đã fold vào K1 (slide 2 + Bước 0) + chip homepage | Thêm lesson thứ 8 = churn cấu trúc (7→8 card, đổi mẫu số progress, đổi docs). Fold giải quyết cùng vấn đề với chi phí nhỏ hơn (minimal-ladder). Nếu user muốn bài 0 riêng → nói là làm được |
| Đảo K2 (cài IDE) lên trước K1 như HF/Microsoft | ❌ Defer | Đổi thứ tự = đổi toàn bộ lộ trình + URL; K1 đã có "chuẩn bị 3 thứ" nói rõ sẽ cài ở Bài 2 |
| Quiz/answer key cho criteria | ❌ Defer | User chưa yêu cầu; criteria giờ đã đo được (hướng fresh-eyes) |
| Free compute path (GitHub Models/HF inference) | ❌ Defer | Ngoài scope 7 bài; ghi nhận làm ý tưởng mở rộng |
| Ảnh chụp UI từng IDE ("kiểm ở đâu" bằng screenshot) | ❌ Defer | Cần 4 IDE thật + screenshot; hiện dùng behavioral check thay thế (chạy được, không phụ thuộc UI version) |

## 4. Verification sau sửa

| Kiểm tra | Kết quả |
|---|---|
| Spec (10 test — thêm assertion chip "Cần trước" + chip chuẩn bị homepage) | **10/10 pass** (RED trước → GREEN) |
| Full suite | **70/70 passed** (`full-run-content-fix.txt`) |
| Grep đối chứng nội dung cũ | `demo file`, `p: 'skills/...`, `PRD mini`, `accommodation`, `rejected edits`, `trace tự tin`, `≥ 2 IDE` → **0 sót** |
| Grep nội dung mới | `need:` ×7 · `Cần trước/xưởng` ×7 chỗ |
| Screenshots | `deck-k3-cover.png` (chip Cần trước hiển thị) · chạy lại toàn bộ visual suite |

## 5. Trả lời trực tiếp câu hỏi kiểm duyệt

> *"Nếu là người dùng đọc vào thì có hiểu cần phải làm gì không?"*

- **Trước kiểm duyệt:** hiểu ~60% — biết khái niệm và mục tiêu từng bài, nhưng 4 chỗ blocker khiến bước đầu bế tắc (không biết làm trên project nào, không biết tải IDE ở đâu, path sai chữ → IDE không đọc, "demo file" không tồn tại).
- **Sau kiểm duyệt:** mỗi bài giờ có đủ 4 thứ: **(1) Cần trước** (chip) → **(2) làm ở đâu** (folder xưởng + path đúng) → **(3) làm bằng gì** (link official + lệnh cụ thể) → **(4) kiểm bằng gì** (criteria đo được + behavioral check).
- **Còn hạn chế trung thực:** nội dung dựa trên chat IDE (không có code agent chạy được như HF/Microsoft course); thời lượng thật cho người mới (kể cả cài đặt) ~60-90 phút/bài đầu, không phải 12-15 phút đọc.
