# 日本語 N5 Trainer — `www/japanese/`

Mini-app static (không backend) để **học từ vựng tiếng Nhật thụ động** trên PC + mobile:
chọn nhiều bài → bật Play → lần lượt nghe **Kanji → cách đọc (thường + chậm) → nghĩa tiếng Việt**.

## 3 trang

| Trang | File | Chức năng |
|-------|------|-----------|
| **Học** | `index.html` | Chọn nhiều bài — **mỗi lần Phát xáo trộn mới, không lặp từ trong phiên**; Play/Pause/Stop, nghe thủ công Thường/Nhanh, toggle **Mẫu câu**, ẩn/hiện danh sách bài học, progress, badge giọng đọc |
| **Kiểm tra** | `quiz.html` | Tab *Làm bài* (đề chính thức import + câu sinh, **options xáo trộn**, chấm điểm, xem câu sai) · Tab *Ngân hàng câu hỏi* (import/export, sinh câu từ từ vựng, xóa câu sinh) · Tab *Skill* |
| **Từ điển** | `dictionary.html` | Quản lý bài học (tạo/sửa/xóa) + bảng từ vựng (thêm/xóa dòng, sort, tìm kiếm, import, export JSON) |

## Trình tự phát (Play)

```
từ hiện lên → 1s → đọc JP tốc độ thường (0.95) → đọc JP tốc độ chậm (0.6)
→ đọc nghĩa tiếng Việt → 1s → từ tiếp theo
```
- **Mẫu câu = Bật**: chèn thêm `mẫu câu JP → nghĩa VI` sau phần nghĩa.
- **Xáo trộn**: mỗi lần bấm Phát = thứ tự ngẫu nhiên mới; từ trùng giữa các bài (cùng kanji/kana) chỉ phát một lần trong phiên.
- **Pause**: chỉ hiện khi đang Play; dừng đúng chỗ, resume đọc lại segment đang dở (không dùng `speechSynthesis.pause()` vì lỗi trên vài browser).
- **Stop**: đặt lại về từ đầu.
- **Thường/Nhanh**: nghe lại từ hiện tại thủ công (khi đang Play sẽ nhắc Tạm dừng trước).
- Phím tắt: `Space` = Play/Pause.

## Lưu dữ liệu — Persistence

| | |
|---|---|
| **Storage** | `localStorage['nihongo:db:v1']` — lessons + words + questions |
| **Seed** | lần đầu mở trang: fetch `data/seed-lessons.json` + `data/questions.json` |
| **F5** | giữ nguyên (localStorage) |
| **Scope** | **per-browser** (máy khác mở sẽ thấy seed) |
| **Chia sẻ đa máy** | Tab Từ điển → **Export tất cả** → thay `data/seed-lessons.json` + `data/questions.json` → commit/push (Pages deploy) |
| **Khôi phục mẫu** | Tab Từ điển → nút *Khôi phục dữ liệu mẫu* (GHI ĐÈ — có xác nhận) |
| **Xóa** | Xóa dòng/bài là vĩnh viễn trong store; **ID không tái sử dụng** |

> `data/` nằm trong `www/` nên deploy lên GitHub Pages — máy nào mở cũng fetch được seed.

## Import / Export

- **Từ điển → Import**: nhận `array` từ vựng, `{words:[...]}` (export 1 bài) hoặc full backup `{lessons, words, questions}`. Chế độ: **Gộp (upsert theo ID)** hoặc **Thay thế**.
- **Từ điển → Export bài / Export tất cả** (backup gồm cả câu hỏi).
- Schema đầy đủ: `skills/question-skill/schema.json`.

## Ngân hàng câu hỏi + Skill

- **Đề chính thức N5 (nguyên văn, không chế biến)**: import qua tab Ngân hàng với `source: "official"` — nguồn tham khảo trong `skills/question-skill/SKILL.md` §7. Đáp án **chỉ xáo trộn lúc làm bài**, không sửa dữ liệu gốc.
- **Câu sinh từ từ vựng** (4 loại: kanji→nghĩa, nghĩa→kanji, kana→kanji, điền mẫu câu): nút *Sinh & lưu* — ID tất định `gen-<bài>-<từ>-<loại>` nên sinh lại = cập nhật, không nhân đôi. Rule nằm trong `js/qgen.js` (source of truth) + mô tả trong `skills/question-skill/SKILL.md`.
- **Câu `sample`** chỉ là demo UI, không phải đề chính thức.

## TTS (Web Speech API)

- Giọng Nhật `ja-JP` + Việt `vi-VN` lấy từ OS/browser. Badge **“Giọng đọc: JA ✓/✗ · VI ✓/✗”** trên trang Học — **bấm vào badge** để mở bảng kiểm tra: danh sách giọng trình duyệt đang thấy + nút **Kiểm tra lại** + hướng dẫn khi thiếu giọng.
- Không có TTS → app vẫn chạy như slideshow chữ + cảnh báo.

### Đo thật trên máy dev (2026-09-29)

| Nguồn | Giọng Nhật | Ai đọc được |
|-------|-----------|-------------|
| Registry SAPI5 desktop | `TTS_MS_JA-JP_HARUKA` | Chrome (path cũ) |
| Registry OneCore (gói Speech trong Settings) | Ayumi · Haruka · Ichiro · Sayaka — kèm vi `An` | Edge |
| **Edge (probe thật, headed)** | ✅ 4 giọng ja + 1 vi (tổng 8) | Chạy tốt ngay |
| Chrome (probe automation) | 0 giọng | Cần khởi động lại hoàn toàn sau khi cài gói Speech |

**Badge JA ✗ dù đã cài gói Speech — thứ tự xử lý:**
1. Đóng **hoàn toàn** trình duyệt (Task Manager — hết cả tiến trình nền) rồi mở lại: Windows chỉ nạp giọng mới khi browser khởi động lại.
2. Ưu tiên **Microsoft Edge** — đọc trọn bộ giọng hệ thống (4 giọng Nhật OneCore).
3. Trong trang: bấm badge **“Giọng đọc”** → **Kiểm tra lại** để quét danh sách mới.

> Lệnh kiểm tra nhanh trên Windows (PowerShell):
> `Get-ChildItem 'HKLM:\SOFTWARE\Microsoft\Speech\Voices\Tokens','HKLM:\SOFTWARE\Microsoft\Speech_OneCore\Voices\Tokens' | % PSChildName`

## Dev / Verify

- Chạy local: `npx serve www` → mở `http://localhost:3000/japanese/` (fetch seed cần HTTP, không dùng `file://`).
- E2E: `npx playwright test tests/e2e/japanese.spec.ts` (stub `speechSynthesis` + `window.__NIHONGO_TEST__` rút ngắn wait).
- Test seams (khai báo chính thức, không phải hack): `window.__NIHONGO_TEST__` (ms), `window.__JPQuizState()` (câu hỏi hiện tại).
- Cấu trúc:

```
www/japanese/
├─ index.html · quiz.html · dictionary.html
├─ styles.css                    # design tokens "Washi × Ai", 2 theme
├─ js/ core.js (store/tts/i18n/chrome) · learn.js · dict.js · quiz.js · qgen.js
├─ data/ seed-lessons.json · questions.json
├─ skills/question-skill/ SKILL.md · schema.json
└─ README.md
```

## Limitations (đã biết)

- Chất lượng giọng phụ thuộc thiết bị (Web Speech API, không phải file audio thu sẵn — có chủ đích: không license, không nặng repo, chạy offline).
- Dữ liệu per-browser — muốn nhiều máy giống nhau thì export/commit seed (§Persistence).
- Đề chính thức cần người dùng import (bản quyền Japan Foundation/JEES — chỉ dùng học cá nhân).
