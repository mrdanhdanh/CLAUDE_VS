# PRD — COSMOS 3D: Deep Space Observatory

> Yêu cầu operator: nâng cấp trang vũ trụ 3D, thêm thông tin và hiệu ứng mạnh nhưng có kiểm soát.
> Phiên bản này mở rộng từ `.agent/plans/cosmos-3d/`; không thay đổi bản 2D làm nguồn nội dung gốc.

## Vision
Biến `www/cosmos-3d/` thành **đài quan sát vũ trụ sống**: người xem nhìn thấy telemetry thật từ `scale.json`, hiểu các phase như các hành tinh, và có một khoảnh khắc “warp” rõ ràng khi chuyển vùng. Hiệu ứng phải phục vụ định hướng và kiến thức, không chỉ thêm glow.

## Scope in
- Giữ 8 phase, 15 beacon, core, entropy, drawer, fallback 2D và self-host three.js.
- HUD mission-control: Entropy S, policy, Dissent/Plans, Gravity, data freshness, object count.
- Thêm “signal strip” với các sự kiện/số liệu thật từ `scale.json`; stale/error hiển thị rõ.
- Nâng black hole: nhiều vòng accretion, halo, lensing glow, pulse nhẹ; không thêm post-processing.
- Thêm constellation links giữa các beacon theo 3 cụm, chỉ hiện ở map zone.
- Thêm warp transition ngắn 150–300ms khi chuyển zone; reduced-motion tắt hiệu ứng chuyển động.
- Thêm lore ngắn cho các phase/nodé trong panel; không nhân bản 12 lab 2D vào 3D.
- Responsive 375/768/1280, focus/hover/active, panel/drawer keyboard-friendly, nút ≥44px.

## Scope out / YAGNI
- Không thêm dependency mới, không GLTF/texture ngoài, không audio.
- Không bloom pass hay shader particle nặng; dùng Points + additive glow.
- Không tạo 15 dashboard cards; giữ 5 tín hiệu chính.
- Không tự tạo số liệu giả; telemetry chỉ hiển thị dữ liệu có `generatedAt`/source.
- Không thêm nội dung node mới nếu chưa đồng bộ `MAPS` bản 2D.

## Acceptance criteria
1. `tests/e2e/cosmos-3d.spec.ts` pass, không pageerror/console error/no-404.
2. `stats()` expose telemetry có `generatedAt`, `source`, `stale`; UI hiển thị cùng dữ liệu.
3. Drawer vẫn có `phases + nodes + 2` item; mọi item mở panel.
4. Có `LineSegments` links và warp pulse nhưng không tăng quá ngân sách draw calls/mobile không tràn.
5. 375/768/1280 không horizontal overflow; panel mobile là bottom sheet; control ≥44px.
6. Reduced motion: camera, orbit, stars, accretion, warp đứng yên; chức năng vẫn dùng được.
7. Slop check sạch; diff bounded theo batch.

## Persistence
`localStorage: none · F5: reset về Core · Scope: per-viewer; telemetry chỉ đọc, không ghi dữ liệu hệ thống.`

## Dissent review
**Who did you think with?:** Critic — framing “3D là gimmick, nên polish 2D” và rủi ro hiệu ứng làm tăng cognitive load.
**Quyết định:** giữ spectacle nhưng gắn mỗi hiệu ứng với một câu hỏi quan sát: telemetry, định hướng, entanglement hoặc entropy. Không thêm bloom/audio/particle stack; một set-piece warp làm signature.

## Cosmic-Quantum
Macro: observatories + constellation → khám phá scale. Micro: telemetry load → trạng thái; hover/click → observation; verify → tạo thực tại. Entangled files: `scene.js`, `scene-data.js`, `index.html`, `style.css`, `tests/e2e/cosmos-3d.spec.ts`.
