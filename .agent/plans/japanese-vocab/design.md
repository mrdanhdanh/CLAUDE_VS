# Design — Nihongo N5 Trainer (`www/japanese/`)

## 1. Design tokens (CSS variables, 2 theme)

### Palette — "Washi × Ai" (giấy Nhật + màu chàm 藍)

| Token | Light | Dark | Dùng cho |
|-------|-------|------|----------|
| `--bg` | `#f6f3ec` | `#101218` | nền trang |
| `--surface` | `#fffdf8` | `#1a1e29` | card/panel |
| `--surface-2` | `#efe9dd` | `#222736` | nền phụ (table head, chip) |
| `--ink` | `#20242e` | `#edf0f7` | text chính |
| `--ink-muted` | `#5b6070` | `#9aa3b8` | text phụ |
| `--border` | `#e0d8c8` | `#2b3142` | viền |
| `--primary` | `#2f4fa3` (ai) | `#8fabff` | action chính |
| `--primary-ink` | `#ffffff` | `#0d1120` | text trên primary |
| `--accent` | `#b8456f` (sakura tràm) | `#f08bb0` | highlight, kana |
| `--success` | `#1e7a4e` | `#57d19b` | đúng |
| `--danger` | `#b3261e` | `#ff8a80` | sai/xóa |
| `--warn` | `#8a5a00` | `#e8b45a` | cảnh báo |

> Contrast: ink/bg light 13.2:1 · ink/bg dark 15.4:1 · primary-ink/primary ≥5.2:1 (đạt AA cho text ≥14px bold + UI); accent trên surface ≥4.6:1. Kana dùng `--accent`, nghĩa dùng `--ink`.

- **Typography:** JP: `"Hiragino Sans","Yu Gothic UI","Meiryo","Noto Sans JP",system-ui,sans-serif`; VI/latin: `system-ui,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif`. **Không load font ngoài** (tránh KN-029 script-blocking).
- **Scale (clamp):** kanji `clamp(44px,9vw,76px)` · kana `clamp(20px,4vw,30px)` · nghĩa `clamp(17px,3.2vw,23px)` · body 15-16px.
- **Spacing:** 4/8 system. **Radius:** 10/14/18/999. **Shadow:** 2 mức (soft, lift). Transition 150-250ms (transform/opacity).

## 2. Wireframe

### Trang Học (`index.html`) — desktop
```
┌──────────────────────────────────────────────────────────┐
│ header: 日本語 N5 · [学習 Học][試験 Kiểm tra][辞書 Từ điển] · 🌓 │
├───────────────────────────┬──────────────────────────────┤
│ Bài học (chips checkbox)  │ STAGE                        │
│  ☑ Bài 1 · 13 từ          │  progress ▓▓▓░░ 3/24         │
│  ☑ Bài 2 · 12 từ          │  ┌────────────────────────┐  │
│  ☐ Bài 3 · 12 từ          │  │        私              │  │
│  [chọn tất cả][bỏ chọn]   │  │      わたし            │  │
│  [ ] Trộn thứ tự          │  │   tôi, tớ              │  │
│                           │  │   • わたしは 学生です。 │  │
│                           │  │   • Tôi là học sinh.    │  │
│                           │  └────────────────────────┘  │
│                           │  Giọng JA ✓ · VI ✓           │
├───────────────────────────┴──────────────────────────────┤
│ [▶ Phát][⏹ Dừng][🔊 Thường][⚡ Nhanh][文 Mẫu câu]  (sticky) │
└──────────────────────────────────────────────────────────┘
```
**Mobile (375):** stage lên trên, chips bài học gấp gọn bên dưới (details/compact), control bar sticky đáy.

### Trang Từ điển (`dictionary.html`)
```
│ [Bài học]                    │ [＋ Bài mới]          │
│  • Bài 1 (13)  ✎ ✕          │ 🔍 search  x/y dòng   │
│  • Bài 2 (12)  ✎ ✕          │ [＋ Dòng][Import][Export bài][Export tất cả][Khôi phục mẫu]
│                              │ ┌──┬───┬────┬─────┬────┬────┐
│                              │ │# │漢字│かな│Nghĩa│Mẫu │ ⋯  │  (sort cột)
```
- Mobile: table scroll ngang có chỉ báo (KN-042: namespace `.jp-tbl`), hoặc card-list? → chọn **table scroll ngang** (đơn giản, giữ nguyên tính bảng).

### Trang Kiểm tra (`quiz.html`) — segmented tabs
```
[ Làm bài | Ngân hàng câu hỏi | Skill ]
Làm bài: Nguồn [☑ Chính thức][☑ Sinh][☐ Mẫu] · Năm [tất cả▾] · Số câu [10▾] · [☑ Xáo trộn] [Bắt đầu]
   → Card câu hỏi + options A-D (xáo trộn) → feedback đúng/sai → [Câu tiếp] → Kết quả x/y + danh sách câu sai
Ngân hàng: stats (tổng/chính thức/sinh/mẫu) · [Sinh & lưu từ bài học] · [Import][Export][Xóa câu sinh theo bài] · preview list
Skill: mô tả + link ./skills/question-skill/SKILL.md + schema.json + quy trình import đề chính thức
```

## 3. Component states (BẮT BUỘC)

Mọi interactive: `default / hover(translateY -1px) / focus-visible(outline 2px primary) / active(scale .98) / disabled(opacity .5)`.
- Chip bài học: checked = nền primary nhạt + viền primary + ✓.
- Control buttons: icon + label, ≥44px cao (mobile 48px).
- Quiz option: default → hover; sau trả lời: `.is-correct` (success border + icon ✓) / `.is-wrong` (danger + ✕) / khoá còn lại.
- Table: row hover; header sort có ▲▼ + `aria-sort`.
- Modal (`<dialog>`): ESC + click backdrop + focus vào field đầu; nút Hủy/Lưu.
- Toast: auto-dismiss 3s, có nút đóng, `role="status"`.
- **UX states:** loading (skeleton khi fetch seed), empty (chưa có bài/dòng/câu hỏi → CTA), error (fetch fail → banner + hướng dẫn), success (toast).

## 4. Animation & motion

- Word chuyển: fade+slide nhẹ 200ms (`transform/opacity`).
- Pulsing dot khi đang đọc (không ở reduced-motion → chỉ đổi màu).
- `prefers-reduced-motion: reduce` → tắt translate/scale, **giữ fade** (KN-031).

## 5. A11y

- Skip-link → `#main`; landmark: header/nav/main/footer.
- Keyboard: Space = Play/Pause (ngoài input/button), Esc đóng dialog; mọi control là `<button>` thật (KN-050).
- `aria-live="polite"` cho vùng "đang đọc …" + kết quả quiz.
- `aria-pressed` cho toggle (Mẫu câu, Trộn); `aria-current` cho tab đang mở.
- Contrast đạt AA (bảng trên); không truyền tin chỉ bằng màu (đúng/sai có icon + text).

## 6. Responsive

- Breakpoints 375 / 768 / 1280. Grid `.learn-layout` = `minmax(0,1fr)` cho mọi track (KN-055).
- Desktop: 2 cột (sidebar 320px + stage). Mobile: 1 cột, stage trước, control bar sticky đáy + safe-area.
- Bảng: wrapper `overflow-x:auto` + `-webkit-overflow-scrolling:touch`; cột Nghĩa min-width đủ đọc.

## 7. Kiến trúc file

```
www/japanese/
├─ index.html · quiz.html · dictionary.html   # 3 trang, header/footer render qua core.js
├─ styles.css                                 # design system trên
├─ js/ core.js (store+tts+i18n+ui) · learn.js · dict.js · quiz.js · qgen.js
├─ data/ seed-lessons.json · questions.json   # seed (commit; user export thay file này để chia sẻ)
├─ skills/question-skill/ SKILL.md · schema.json
└─ README.md
```
- **Không external CDN/font.** Scripts plain (không ESM) để chạy cả `file://` lẫn Pages.
- Theme init inline `<head>` chống FOUC (KN-006). Copy UI qua `data-i18n` + `t()` (locale-i18n instruction).
