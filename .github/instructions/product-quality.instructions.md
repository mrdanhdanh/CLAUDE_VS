---
description: "Product quality standard for web UI/UX — beautiful, responsive, accessible. Use when building web UI, need design system, responsive, a11y, polish, locale-owned copy."
applyTo: "**/*.{html,css,tsx,jsx,vue,js,ts}"
---

# Product Quality Standard — Web UI/UX

> Inspired by **DeepSeek Harness — Everything is a Plugin** (Cordis). Web UI cũng là 1 capability seam — mọi giá trị nhìn thấy phải qua token, mọi copy phải locale-owned.

Mọi sản phẩm web trong workspace này PHẢI đạt chuẩn sau. Nếu chưa đạt → chưa được gọi là xong.

## 1. Design System (BẮT BUỘC định nghĩa trước khi code)

```css
:root {
  /* Palette: 3-5 màu — primary, secondary, accent, neutral, surface */
  --color-primary: #6366f1;      /* Indigo — action chính */
  --color-secondary: #0ea5e9;    /* Sky — complement */
  --color-accent: #f59e0b;       /* Amber — highlight */
  --color-neutral-900: #0f172a;
  --color-neutral-100: #f8fafc;
  --color-surface: #ffffff;

  /* Typography: 1-2 font, scale rõ ràng */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-display: 'Plus Jakarta Sans', sans-serif;
  --text-xs: 0.75rem; --text-sm: 0.875rem; --text-base: 1rem;
  --text-lg: 1.125rem; --text-xl: 1.25rem; --text-2xl: 1.5rem;

  /* Spacing: 4/8px system */
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px;
  --space-6: 24px; --space-8: 32px;

  /* Radius & Shadow */
  --radius-sm: 8px; --radius-md: 12px; --radius-lg: 16px; --radius-full: 9999px;
  --shadow-sm: 0 1px 2px rgba(0,0,0,.06);
  --shadow-md: 0 4px 12px rgba(0,0,0,.08);
  --shadow-lg: 0 8px 24px rgba(0,0,0,.12);
}
```

- Không hardcode màu/spacing — dùng CSS variables
- Không inline style bừa bãi — dùng class / module / Tailwind
- Font: import từ Google Fonts, có fallback

## 2. Layout & Responsive

- Breakpoints: `375px` (mobile), `768px` (tablet), `1280px` (desktop)
- Không vỡ layout ở bất kỳ breakpoint nào — test bằng resize
- Dùng CSS Grid / Flexbox, không fixed width cứng
- Container: `max-width: 1280px; margin: 0 auto; padding: 0 16px`
- Image: luôn có `width`/`height` hoặc `aspect-ratio` để tránh layout shift

## 3. Component States

Mọi interactive element PHẢI có đủ states:

| State | Yêu cầu |
|-------|---------|
| `default` | Rõ ràng, đủ contrast (WCAG AA) |
| `hover` | Đổi màu/shadow/translateY(-1px), transition 150-200ms |
| `focus` | `outline: 2px solid var(--color-primary); outline-offset: 2px` |
| `active` | Scale 0.98 hoặc darken |
| `disabled` | `opacity: .5; cursor: not-allowed` |
| `loading` | Spinner/skeleton, disable interaction |

## 4. UX States (BẮT BUỘC)

Mọi view/list PHẢI xử lý 4 states:

- **Loading:** skeleton hoặc spinner, không để trắng
- **Empty:** illustration + message + CTA (VD: "Chưa có dữ liệu — Thêm mới")
- **Error:** message rõ ràng + nút Retry
- **Success:** toast/feedback 150-300ms, không giật

## 5. Animation & Feedback

- Transition: `150-300ms ease` cho mọi tương tác
- Không animation quá 500ms
- Dùng `transform` và `opacity` (GPU-accelerated), tránh `width`/`height` animation
- Toast: auto-dismiss 3s, có close button

## 6. Accessibility

- Contrast ratio ≥ 4.5:1 cho text
- Mọi button/input có `aria-label` nếu chỉ icon
- Keyboard navigable: Tab order hợp lý, Enter/Space trigger action
- Semantic HTML: `header`, `nav`, `main`, `section`, `button` (không div giả button)

## 7. Code Quality

- **Locale-owned copy:** Không hardcode text UI — mọi copy phải qua `t()` / `locales/vi.ts` (xem `locale-i18n.instructions.md`). `aria-label`/`alt` cũng locale-owned. Gate: `verify-client-ui-i18n` / grep hardcode.
- **Token invariant (UI-visible ⟺ token):** Mọi giá trị nhìn thấy (màu, spacing, radius, shadow, font) phải qua CSS variables / design tokens — không hardcode `#6366f1` hay `14px` lẻ trong component (xem `plugin-seam` § UI-visible ⟺ token).
- Component consistent: cùng 1 style cho cùng loại element
- Performance: lazy load image, không layout shift, không FOUC
- ESM + `strict: true` nếu là TS — không `any` không lý do

## 8. DeepSeek Invariants (học từ Everything is a Plugin)

- **UI-visible ⟺ token** — như `Model-visible ⟺ logged` của DeepSeek: cái gì user thấy phải reconstruct được từ token, không hardcode.
- **Seam = 3 vai:** Design System cũng là seam — `Definition` (tokens) + `Provider` (CSS variables) + `Consumer` (components). Thêm token mới phải đủ 3 vai.
- **Patchable:** Palette/spacing có thể override bằng patch layer (vd: `www/cordis.patch.yml`) mà không sửa gốc — như `cordis.patch.yml` của DeepSeek.

## 9. Polish Checklist (trước khi Verify)

- [ ] Palette + typography + spacing đã định nghĩa
- [ ] Responsive 375/768/1280 không vỡ
- [ ] Đủ hover/focus/active/disabled/loading states
- [ ] Đủ loading/empty/error/success states
- [ ] Animation mượt 150-300ms
- [ ] Contrast + keyboard + aria-label
- [ ] Không inline style bừa bãi
- [ ] Visual check bằng browser (screenshot nếu có thể)

> **Quy tắc:** Giao diện xấu = chưa xong. Phải qua Polish phase.
