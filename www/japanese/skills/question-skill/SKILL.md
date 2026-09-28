---
name: question-skill
description: "Sinh câu hỏi trắc nghiệm N5 từ từ vựng các bài học (4 loại, ID tất định) + quy trình import đề thi chính thức N5 nguyên văn. Lưu ngay trong www/japanese/ — không phụ thuộc máy thực thi. Use when cần sinh câu hỏi từ từ vựng, import đề N5, xây/dọn ngân hàng câu hỏi, hoặc user nói 'sinh câu hỏi', 'thư viện câu hỏi', 'import đề'."
---

# Question Skill — Sinh câu hỏi & Ngân hàng đề (日本語 N5 Trainer)

> Skill này sống **trong chính website** (`www/japanese/skills/question-skill/`). Bất kỳ máy nào mở repo, hoặc bất kỳ phiên AI nào đọc file này, đều có đủ: nguồn lấy → cách chọn câu → định dạng → checklist. Không cần hỏi lại context từ máy/phiên trước.

## 1. Khi nào dùng

- User nhờ "sinh câu hỏi từ vựng bài X" → chạy generator (in-site hoặc theo §6).
- User nhờ "import đề N5 năm Y" → theo §7 (import nguyên văn, không chế biến).
- Cần dọn/kiểm tra ngân hàng câu hỏi → §8 validation.

## 2. Nguồn (thứ tự ưu tiên)

| # | Nguồn | Ở đâu | Dùng cho |
|---|-------|-------|----------|
| A | **Từ vựng bài học** | `data/seed-lessons.json` hoặc Export từ tab Từ điển | 4 loại câu sinh từ vựng |
| B | **Mẫu câu của từng từ** (`examples[].jp/vi`) | cùng file trên | Loại "Điền vào mẫu câu" (cloze) |
| C | **Đề thi chính thức N5 các năm** | Import qua tab Ngân hàng (nguồn §7) | Quiz "official" — **nguyên văn, không sửa** |

## 3. Quy tắc chọn câu (generation rules — ENFORCED trong `js/qgen.js`)

1. **Eligibility per loại:**
   - `kanji-meaning` / `meaning-kanji`: cần `kanji|kana` + `vi`.
   - `reading` (kana → kanji): cần **cả** `kanji` và `kana`.
   - `cloze`: cần `examples[].jp` chứa chính từ (kanji hoặc kana) để thay bằng `＿＿＿`.
2. **Tối đa 1 câu / từ / loại** — không lặp cùng từ trong cùng loại.
3. **Distractor:** khác đáp án, không trùng nhau, ưu tiên cùng pool các bài đã chọn (3 distractor → 4 lựa chọn). Pool quá nhỏ vẫn cho phép 2–4 lựa chọn, dưới 2 → **bỏ câu** (không tạo MCQ giả).
4. **ID tất định:** `gen-<lessonId>-<wordId>-<type>` — sinh lại cùng input = **cập nhật** câu cũ (upsert), không nhân đôi. Không dùng random ID cho câu sinh.
5. **Deterministic content:** RNG seed = hash(lessonId:wordId:type) → cùng dữ liệu → cùng câu (reproducible trên mọi máy).
6. **Đề chính thức: KHÔNG chế biến** — giữ đúng câu gốc, chỉ xáo trộn thứ tự options **lúc làm bài** (runtime), không sửa nội dung options trong bank.
7. **Số lượng mặc định:** 5 câu/loại/lần sinh (1–50). Ưu tiên đủ 4 loại trước khi tăng số lượng.

## 4. Định dạng (schemas đầy đủ: `schema.json`)

```json
{
  "id": "gen-L-bai-01-w-b1-03-kanji-meaning",
  "source": "generated",            // official | generated | sample
  "kind": "kanji-meaning",          // kanji-meaning | meaning-kanji | reading | cloze
  "level": "N5", "year": "", "section": "Tự sinh",
  "type": "mcq",
  "prompt": "Chọn nghĩa đúng của từ:",   // hướng dẫn (VI hoặc JP cho đề chính thức)
  "question": "学生",
  "options": ["học sinh, sinh viên", "..."],
  "answer": 0,                       // index trong options NHƯ ĐÃ LƯU
  "explanation": "学生（がくせい）: học sinh, sinh viên",
  "lessonId": "L-bai-01", "wordId": "w-b1-03"
}
```

## 5. Quy trình in-site (người dùng không cần AI)

1. Mở `quiz.html` → tab **Ngân hàng câu hỏi**.
2. Chọn bài học (chips) + loại câu + số câu mỗi loại → **Sinh & lưu**.
3. Kiểm tra bằng tab **Làm bài** (lọc nguồn "Sinh từ từ vựng").
4. Xóa câu sinh của bài: nút **Xóa câu sinh của bài đã chọn** (không ảnh hưởng đề official).

## 6. Quy trình cho AI agent (offline, khi user nhờ trong chat)

1. Lấy dữ liệu: đọc `www/japanese/data/seed-lessons.json` — hoặc bản Export mới nhất user đưa.
2. Áp §3 (eligibility, cap 1/từ/loại, distractor, ID tất định). Có thể chạy lại thuật toán: đọc `www/japanese/js/qgen.js` (đây là **source of truth của rule**, không phải mô tả trong file này nếu khác nhau).
3. Ghi kết quả: thêm vào `www/japanese/data/questions.json` (giữ shape `{version, questions:[...]}`) hoặc đưa file JSON cho user import qua UI.
4. Bắt buộc: ghi rõ `source` (`generated`/`official`), giữ `lessonId`/`wordId` khi sinh từ vựng.
5. Tự kiểm: mỗi câu phải pass `JPGen.validateQuestion` (id, question, 2–4 options không trùng, answer trong range). Chạy nhanh:
   ```bash
   node -e "const a=require('./www/japanese/data/questions.json'); const bad=a.questions.filter(q=>!q.id||!q.question||!Array.isArray(q.options)||q.options.length<2||q.options.length>4||new Set(q.options).size!==q.options.length||!(q.answer>=0&&q.answer<q.options.length)); console.log('total',a.questions.length,'bad',bad.length); process.exit(bad.length?1:0)"
   ```
6. Không sửa/xáo options của câu `official` trong file data — chấm điểm xáo trộn là việc của runtime.

## 7. Nguồn đề chính thức (import nguyên văn)

- **Mẫu đề chính thức của JLPT (Japan Foundation)**: trang Samples tại `jlpt.jp` (bản E: `https://www.jlpt.jp/e/samples/forlearners.html`) — 問題例 theo từng phần (文字・語彙 / 文法・読解 / 聴解).
- **公式問題集 — "Japanese-Language Proficiency Test Official Practice Workbook"** (JEES/Japan Foundation, bán tại nhà sách Nhật) — đề mẫu chính thức đầy đủ theo level.
- **Đề các năm**: thường được tập hợp trong sách luyện đề /社区 collections — **kiểm tra nguồn hợp lệ trước khi dùng**; đề gốc thuộc bản quyền Japan Foundation & JEES, chỉ dùng cho học cá nhân, **không redistribute công khai**.
- **Cách import:** tab Ngân hàng → **Import câu hỏi** → file JSON theo `schema.json`; mỗi câu đặt `source: "official"`, `year: "<năm-kỳ>"` (vd `2019-12`), `section` đúng phần thi.
- AI agent khi giúp import: **không tự bịa/tự "sáng tác" câu official**. Không đủ nguồn → nói rõ chưa có, đề xuất user cung cấp file.
- Trước khi kết luận nguồn nào "chính thức": xác minh bằng ≥1 nguồn thật (KN-075), không suy đoán từ trí nhớ.

## 8. Checklist chất lượng (trước khi lưu/commit)

- [ ] Mỗi câu có `id` duy nhất, `question`, `options` (2–4, không trùng), `answer` trong range.
- [ ] Câu sinh: đúng rule §3 (cap 1/từ/loại, distractor khác đáp án, ID tất định).
- [ ] Câu official: không sửa nội dung, có `year` + `section`.
- [ ] Chạy validation (§6.5) → `bad 0`.
- [ ] Kiểm tra UI: tab Làm bài chạy được với câu mới (chấm điểm + xáo trộn OK).

## 9. Anti-patterns (CẤM)

- ❌ Gán `source: "official"` cho câu do AI tự viết.
- ❌ Random ID cho câu sinh (gây nhân bản khi sinh lại).
- ❌ Sửa options/answer của câu official trong data.
- ❌ Sinh câu từ từ thiếu dữ liệu loại đó (vd cloze khi không có mẫu câu chứa từ).
- ❌ Distractor trùng đáp án hoặc trùng nhau (2 option giống nhau).
