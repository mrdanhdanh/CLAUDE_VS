# Bug — Content 7 bài Agentic Academy "đúng chữ nhưng không chạy được"

- **Ngày:** 2026-09-12
- **Slug:** `2026-09-12-academy-content-not-actionable`
- **Severity:** major
- **Phát hiện bởi:** Content review fresh-eyes (YUNIE) + Critic agent độc lập
- **Review đầy đủ:** `.agent/plans/agentic-academy/verify/content-review.md`

## Triệu chứng

Người dùng hỏi: *"Nếu là người dùng đọc vào thì có hiểu cần phải làm gì không?"* → Kiểm duyệt 7 bài bằng rubric 6 tiêu chí + Critic agent đọc độc lập → **hiểu ~60%**, 6 blocker + 10 major:

1. **Không neo ngữ cảnh:** "Tạo `docs/agent-notes.md`" — không nói project nào (bài đầu tiên, điểm neo mơ hồ nhất).
2. **Path thiếu prefix:** `skills/code-review/SKILL.md` → folder `skills/` ở root → **không IDE nào đọc** → tiêu chí "auto-trigger" fail ngay khi làm đúng chữ.
3. **Bước không tồn tại:** "review the demo file" — không có demo file nào trong khóa.
4. **Cài đặt mù:** không link tải IDE, không nói tài khoản/chi phí, không nói cần Node.js.
5. **Khái niệm bị chấm nhưng chưa dạy:** "component/E2E evals", "PRD mini".
6. **Mâu thuẫn:** K2 đòi 1 IDE vs K3/K7 đòi ≥2; homepage "vào bài nào cũng được" vs phụ thuộc thật.
7. **Tiêu chí rỗng nghĩa:** "không có secret trong config" — đương nhiên đạt.

## Reproduce

Đọc `lessons.js` bằng mắt người mới: thử làm theo từng bước, tự hỏi "file này nằm ở đâu, trong folder nào?" với mọi path → 4 blocker lộ ngay. Hoặc: nhờ agent có context độc lập đọc và trả lời "người mới cần làm gì tiếp?".

## Root Cause (5 Whys)

- **Why 1:** Tác giả tự đọc lại không thấy → **curse of knowledge** — path `skills/` "hiển nhiên" nằm trong `.github/` với người viết, sai với người copy nguyên văn.
- **Why 2:** Tự review không bắt được → self-review thiên vị (KN-023).
- **Why 3:** Không có checklist cho người mới → tiêu chí viết là "đủ nội dung" không phải "làm được".
- **Why 4 (ROOT):** Hướng dẫn viết từ góc nhìn người-đã-biết, không từ góc nhìn người-sẽ-làm; path/khái niệm/yêu cầu xuyên bài không được verify chéo như code.

## Fix

Rubric 6 tiêu chí viết trước → Critic agent đọc độc lập → sửa:

- Slide "Trước khi bắt đầu — chuẩn bị 3 thứ" + Bước 0 chốt folder "xưởng" (K1)
- Chip **"🧩 Cần trước"** trên cover mọi bài (data `need` mới) + chip homepage "Cần: 1 project"
- Path prefix đúng IDE: `.github/skills/…` + biến thể `.agents/`/`.claude/`
- Link tải 4 IDE official + note tài khoản/free + Node.js 18+ (K1/K2/K5)
- Gloss mọi thuật ngữ: state, hybrid, least-privilege, RAG, KN-XXX, "ngân sách bước"
- Chốt "1 IDE bắt buộc, IDE 2 = điểm cộng" (hết mâu thuẫn)
- Tiêu chí rỗng nghĩa → hành động đo được (K5, K7)
- Bỏ comment `//` trong JSON mẫu (copy là lỗi parse)

## Verify

- Spec `tests/e2e/agentic-academy.spec.ts` — thêm assertion chip "Cần trước" (test 6) + chip prep homepage (test 1): **10/10 pass** (RED → GREEN)
- Full suite: **70/70 pass** (`verify/full-run-content-fix.txt`)
- Grep đối chứng: `demo file`, `p: 'skills/…`, `PRD mini`, `accommodation`, `≥ 2 IDE` → **0 sót**
- Screenshots: `deck-k3-cover.png` (chip hiển thị), `home-light-1280.png`...

## Cách phòng tránh

- Mọi hướng dẫn phải trả lời đủ **4 câu**: Cần trước gì · Làm ở ĐÂU · Làm bằng GÌ · KIỂM bằng gì
- Path trong docs phải **copy-chạy được** — grep lại từng path sau khi viết
- Khái niệm trong tiêu chí/outcome phải được dạy trước hoặc gloss tại chỗ
- Yêu cầu xuyên bài phải nhất quán — grep chéo trước khi ship
- Tiêu chí hoàn thành phải đo được, không "đương nhiên đạt"
- Content dạy người mới phải qua **fresh-eyes/Critic độc lập** trước khi ship (KN-005 áp cho docs)

## KN

→ `docs/knowleged.md` **KN-043**

- **Tags:** `content` `docs` `verify` `fresh-eyes` `dx`
- **Người ghi:** YUNIE / /harness + Critic agent
