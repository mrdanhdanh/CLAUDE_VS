# Design — COSMOS 3D

> Nguồn: `awesome-design-md` search “space cosmic dark 3d stars” → **spacex** (score 10.0, pure-black canvas, mission-oriented) — lấy cảm hứng nền tối tuyệt đối; **tokens chính kế thừa `www/cosmos/index.html`** để 2D↔3D nhất quán.

## 1. Design tokens (kế thừa cosmos, đổi prefix `--c3d-`)

```css
:root{
  --c3d-bg:#050810;            /* spacex-vibe: tối hơn cosmos một bậc cho chiều sâu 3D */
  --c3d-surface:rgba(15,23,42,.72);
  --c3d-border:rgba(148,163,184,.16);
  --c3d-text:#e2e8f0;  --c3d-dim:#94a3b8;
  --c3d-violet:#7c3aed; --c3d-indigo:#6366f1; --c3d-cyan:#06b6d4;
  --c3d-emerald:#10b981; --c3d-amber:#f59e0b; --c3d-pink:#ec4899;
  --c3d-radius:14px; --c3d-radius-sm:10px;
  --c3d-shadow:0 18px 48px rgba(0,0,0,.55);
  --c3d-glass:blur(14px) saturate(1.25);
  --c3d-dur:.24s;      /* transitions 150–300ms */
}
```
Type: `Space Grotesk` (display, async load media=print trick — KN-029) + system stack cho body; mono = `JetBrains Mono` fallback ui-monospace. **Không tự host font** (tái dùng pattern async đã có guard ở cosmos).

## 2. Layout & wireframe

```
┌─────────────────────────────────────────────────────────────┐
│ skip-link · header mảnh: ◈ COSMOS·3D        [2D ⤴] [Help ?] │
│                                                             │
│                       3D CANVAS (fixed, 100dvh)             │
│        ✦ starfield ✦ nebula sprites ✦                       │
│                  ○ core + 8 quỹ đạo                         │
│                                                             │
│ ┌─Hero overlay (chỉ lần đầu, fade sau intro)────────────┐   │
│ │ COSMOS · 3D — Vũ trụ Harness v2                       │   │
│ │ Kéo để bay · Click để mở · 2 vùng để khám phá          │   │
│ │ [🚀 Khám phá]  [← Bản 2D đầy đủ]                       │   │
│ └───────────────────────────────────────────────────────┘   │
│ ┌ zone switcher (bottom-center, glass pill) ┐ ┌ HUD (top-right)┐
│ │ [◉ Lõi hệ thống] [✦ Bản đồ sao]           │ │ S=12 · 8 body  │
│ └────────────────────────────────────────────┘ └────────────────┘
│ ┌ detail panel (trái, 360px, slide-in) ─────┐                 │
│ │ 05 · Plan — Quỹ đạo hành tinh             │                 │
│ │ <meta> .agent/plans/<task>/ · Phase 5      │                 │
│ │ <desc> ...                                 │                 │
│ │ [→ mở file/link]              [✕ Esc]      │                 │
│ └────────────────────────────────────────────┘                 │
└─────── footer mảnh: nguồn · three.js v0.186.0 (MIT) · links ──┘
```

Responsive:
- **≥1024px:** panel trái 360px; switcher bottom-center; HUD top-right.
- **768–1023px:** panel 320px; HUD gọn (chỉ S).
- **<768px:** panel = **bottom sheet** (max-height 52dvh, kéo/scroll), switcher full-width dưới cùng, hero text nhỏ hơn, HUD ẩn (S vào trong panel).

## 3. 3D scene spec (đơn vị three.js)

| Object | Geometry / Material | Vị trí & chuyển động |
|--------|--------------------|----------------------|
| Core (Harness) | `IcosahedronGeometry(2.6, 3)` MeshStandard emissive `#7c3aed` + **sprite glow** (canvas radial, additive, scale 14) + pulse 0.98–1.02 | Tâm (0,0,0); xoay chậm 0.05 rad/s |
| 8 hành tinh pipeline | `SphereGeometry(0.55 + i*0.02, 24, 18)` MeshStandard, màu = gradient phase-num (indigo→cyan→emerald→amber→pink→violet) | `orbitR = 6.5 + i*2.4`, speed `0.16 - i*0.012`, tilt mỗi quỹ đạo ±6° |
| Vòng quỹ đạo | `LineLoop` 128 điểm, opacity .14 | Cùng tâm, cùng bán kính |
| Lỗ đen entropy (body #9) | `SphereGeometry(1.1)` MeshBasic `#0b1020` + torus nghiêng (accretion) emissive theo S: low `#10b981` / medium `#f59e0b` / high `#ef4444` | orbitR 27, speed 0.05 |
| 15 beacon hệ thống | `OctahedronGeometry(0.62, 0)` MeshStandard emissive mỗi cái, glow sprite nhỏ | **Fibonacci sphere** (r=16) quanh tâm zone 2 (90, 0, -10) — auto từ index |
| Starfield | 3 lớp `THREE.Points` (900+1400+2200) size attenuate, additive, màu trắng/lam nhạt | Cầu bán kính 120–420, quay 0.004 rad/s |
| Nebula | 3 `Sprite` additive (radial gradient canvas: violet/cyan/pink, opacity .16) | Rải (±60, ±20, -80) |

Camera: `PerspectiveCamera(55, aspect, .1, 900)`. Zone Lõi `pos(0,7,17) target(0,0,0)`; Zone Bản đồ sao `pos(90,6,12) target(90,0,-10)`. Tween 900ms easeInOutCubic (reduced-motion: instant).

Ánh sáng: `AmbientLight(#38406b, .9)` + `PointLight(#c4b5fd, 60, 260, 1.8)` tại core + `DirectionalLight` nhẹ cho beacons.

Raycast: pointermove (throttle theo rAF) → hover: `scale×1.18`, emissive×2.2, cursor pointer. Click: chỉ khi drag < 6px (tránh click sau khi orbit) → mở panel.

## 4. Panel & component states

- Panel trượt `translateX(-12px)+opacity` vào 240ms; nội dung: `num/ico`, `title`, `meta` (file/era), `desc`, `link`, nút ✕ (aria-label="Đóng"), Esc đóng, focus trap nhẹ (focus vào nút đóng).
- States: `hover` (glow + label sáng), `focus-visible` (outline 2px `--c3d-cyan`), `active`, `loading` (boot: “Đang khởi tạo vũ trụ…” + spinner), `empty` (WebGL fail → message + CTA 2D), `error` (scale.json thiếu → S hiển thị “—”, không crash).
- Zone switcher: pill glass, `aria-pressed`, item active có dot màu; chuyển zone = tween camera + đổi nhãn HUD.

## 5. A11y

- Skip-link → `#stage`; `main` landmark; heading h1 ẩn (sr-only) cho tên trang.
- **Index drawer** (“Chỉ mục”): danh sách 24 object là `<button>` thật (8 phase + 15 node + entropy) → mở cùng panel ⇒ keyboard/AT tiếp cận đủ nội dung (canvas không cần fallback text).
- Canvas `role="img"` + `aria-label` mô tả scene; mọi control đều native element.
- Contrast: text `#e2e8f0` trên `#050810` ≈ 15:1; dim `#94a3b8` ≈ 7:1 ✓
- `prefers-reduced-motion`: tắt auto-rotate + intro + tween đổi zone; pulse tắt.

## 6. File layout (dễ update)

```
www/cosmos-3d/
  index.html        — shell + a11y + importmap + UI tĩnh
  style.css         — tokens + layout + panel + responsive
  scene-data.js     — ★ NỘI DUNG DUY NHẤT (8 phases, 15 nodes, zone, hero) + comment hướng dẫn
  scene.js          — engine: build từ data → object; config tuning ở đầu file
  README.md         — “Muốn sửa gì thì sửa ở đâu” (3 bước) + nâng cấp three.js
www/vendor/three/   — three.core.min.js + three.module.min.js + addons/(OrbitControls, CSS2DRenderer) + LICENSE + VERSION.txt
```
Nguyên tắc update: **thêm/xoá 1 phần tử trong mảng `phases`/`nodes` ⇒ tự lên quỹ đạo/chòm sao; không đụng engine.** Đổi màu/size/speed = sửa `CONFIG` đầu `scene.js`.
