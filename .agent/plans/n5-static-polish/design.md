# Design mini — N5 Static Polish

Palette: giữ nguyên indigo #6366f1 → sky #0ea5e9 → amber #f59e0b, glass dark/light đã có.
Type: Inter + Noto Sans JP + JetBrains Mono (bỏ @import trùng, chỉ giữ <link>).

Layout: sidebar 260px / topbar sticky / content max 1200px — giữ. Mobile: sidebar ẩn → drawer, topbar badges gọn.

States cần sửa:
- `.theme-toggle` style rõ (40px, glass, hover).
- `.helper-toggle` xoay khi open (đã có) + `aria-expanded` sync.
- Modal: `role=dialog aria-modal=true`, focus close khi mở.
- Quiz/practice: selected/correct/wrong đã có, thêm `.quiz-done` dùng token success.
- Empty: thêm nút Xóa lọc ở kana (đã có ở kanji/vocab).
- Light: pill/formation/technique-card/drawer/footer/border dùng token, không hardcode #a5b4fc / rgba trắng.
- Motion: `@media (prefers-reduced-motion: reduce)` tắt rainbow-rotate/shimmer/hero-orb.

A11y: contrast ≥4.5:1 light (pill #4f46e5, formation #4338ca), focus-visible giữ, drawer panel dùng var(--surface).
