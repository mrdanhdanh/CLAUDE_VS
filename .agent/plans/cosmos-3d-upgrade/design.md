# Design — COSMOS 3D: Deep Space Observatory

> Design direction: local `awesome-design-md` search “cosmic dark space nebula immersive 3d observatory” → `spacex`, score 10.0.
> Dùng cảm hứng mission-control/black canvas; palette hiện tại của COSMOS được giữ để không phá liên kết với bản 2D.

## Direction
- **Canvas:** absolute black-blue, nhiều tầng depth: nebula wash → starfield → constellation lines → bodies → HUD glass.
- **Display:** Space Grotesk / system fallback, eyebrow monospace, tracking rộng cho nhãn telemetry.
- **Signature motion:** warp pulse ngắn khi đổi zone; black hole có 3 lớp accretion + halo; core có energy ring nhẹ. Không bloom pass.
- **Glass rule:** chỉ header/HUD/switcher/drawer/panel sử dụng glass; không phủ blur lên nội dung dày.

## Tokens
Bổ sung semantic tokens trong `style.css`:
`--c3d-ink`, `--c3d-surface-2`, `--c3d-ok`, `--c3d-warn`, `--c3d-danger`, `--c3d-line`, `--c3d-glass-fill`, `--c3d-glass-rim`, `--c3d-motion-fast`, `--c3d-motion-slow`, z-index scale.

## Layout desktop
- Header mảnh phía trên.
- HUD góc phải: 5 signal rows, freshness badge.
- Signal rail dưới header: source + generated time + status.
- Core zone giữa; panel trái 380px; switcher dưới.
- Footer/source nhỏ, không che scene.

## Layout mobile
- HUD thành một telemetry card gọn ở dưới header, không fixed rộng vượt viewport.
- Signal rail wrap 2 dòng; không `aria-live` liên tục.
- Panel bottom sheet max 52dvh; drawer full inset 10px.
- Buttons tối thiểu 44px; label không bị cắt.

## Components / states
- `.telemetry-card`: loading skeleton → loaded → stale/unavailable; mỗi status có icon + text + màu, không chỉ màu.
- `.signal-rail`: provenance + generatedAt; copy rõ khi fetch lỗi.
- `.warp-flash`: pseudo-element/sprite pulse 220ms, `prefers-reduced-motion` không hiện.
- `.c3d-link`: constellation line, opacity thấp; labels chỉ hiện ở map/focus.
- Buttons: hover lift nhẹ, focus ring cyan, active scale 0.98, disabled 0.5.
- Panel: `role=dialog`, focus vào close khi mở từ drawer, Esc đóng và trả focus về trigger; drawer có aria-expanded.

## Motion budget
- Ambient scene: star rotation, orbit, black-hole ring.
- Interaction feedback: 150–300ms; warp pulse 220ms.
- Reduced motion: tắt ambient/tween/pulse, giữ opacity feedback và camera initial position.
- Mobile: giảm particle count qua config theo aspect nếu cần; không thêm draw call không cần thiết.

## Visual eval rubric
- C1: nhìn 3 giây hiểu ngay đây là observatory có telemetry, không phải dashboard 2D.
- C2: click core/phase/node nhận được lore ngắn + nguồn/link; không cần mở 2D để hiểu khái niệm.
- C3: black hole và warp đủ memorable nhưng scene vẫn đọc được ở 375px.
- C4: không label/HUD clip ở 375/768/1280; keyboard path hoàn chỉnh.
- C5: không cảm giác “dựng effect để giấu data”; mọi effect có mục đích quan sát.
