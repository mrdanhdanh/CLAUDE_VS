# Design — YUNIE Chat

## Design system (tokens từ claude DESIGN.md)
```css
--canvas: #faf9f5;        /* warm cream floor */
--surface-card: #efe9de;  /* bubble user */
--surface-soft: #f5f0e8;  /* bubble yunie */
--ink: #141413;           /* headings */
--body: #3d3d3a;          /* body text */
--muted: #6c6a64;
--hairline: #e6dfd8;
--primary: #cc785c;       /* coral — send button, accents */
--primary-active: #a9583e;
--accent-teal: #5db8a6;   /* online dot */
--error: #c64545;
--radius: 12px; --radius-sm: 8px;
--shadow: 0 1px 3px rgba(20,20,19,.06), 0 8px 24px rgba(20,20,19,.08);
```
Typography: system serif display (Georgia fallback) cho header + Inter/system sans cho body. Spacing 4/8px.

## Layout
```
┌────────────────────────────────┐
│ Header: avatar YUNIE + tên +   │  sticky, cream, hairline bottom
│ status dot teal + model select │
├────────────────────────────────┤
│  Messages (scroll)             │  max-width 720px center
│  [YUNIE bubble] [USER bubble]  │  yunie trái cream-soft, user phải coral-soft
│  [typing indicator 3 dots]     │
├────────────────────────────────┤
│ Composer: textarea + send btn  │  sticky bottom, Enter gửi, Shift+Enter xuống dòng
└────────────────────────────────┘
```

## States
- **Empty:** welcome card — chào YUNIE + 3 gợi ý câu hỏi (click gửi luôn).
- **Loading:** typing indicator (3 dots bounce 1.2s) + nút Send → Stop.
- **Error:** bubble error đỏ nhạt + message cụ thể (thiếu key / 401 / CORS / network) + nút hành động.
- **Settings:** modal dán API key (password input + eye toggle + link opencode.ai/auth) + nút Xóa key.
- **Streaming:** text render dần, auto-scroll (trừ khi user scroll lên).

## A11y
- `aria-live="polite"` cho messages, label cho input, focus-visible ring coral, contrast: ink trên canvas 15.9:1, body 8.9:1, white trên coral 3.2:1 → dùng coral đậm hơn cho text nhỏ, white chỉ trên nút ≥18px bold.
- Keyboard: Enter gửi, Esc đóng modal, skip-link.

## Responsive
- 375px: full-width bubbles, composer co, header gọn (ẩn model label).
- 768px: giữ 1 cột, max-width 720px.
- 1280px: như 768 + shadow nhẹ hơn.
