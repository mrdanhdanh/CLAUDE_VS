# Plan — COSMOS 3D (three.js)

> Prereq: `knowledge` ✅ (đọc KN-028/029/030/031/032/040/055), `explore` ✅, `prd` ✅, `design` ✅.
> Ladder (minimal): (1) cần không? — user yêu cầu đích danh ✔ (2) codebase có? — `www/web-universe/js/modules/webgl-lab` là raw WebGL demo, KHÔNG đủ scene graph/orbit → dùng three.js (3) stdlib/native? — WebGL thuần quá tốn code cho orbit/label/raycast (4) dep đã cài? — chưa, self-host 1 thư viện duy nhất (5-7) viết tối thiểu: 4 file page + 1 file data.

## Todos

| # | Todo | Output | Verify |
|---|------|--------|--------|
| 1 | Vendor three.js 0.186.0 | `www/vendor/three/{three.core.min.js,three.module.min.js,addons/OrbitControls.js,addons/CSS2DRenderer.js,LICENSE,VERSION.txt}` | `node -e` check wrapper import `./three.core.min.js`; size ≤1.1MB; grep `import` trong addons chỉ từ `three` |
| 2 | Data file | `www/cosmos-3d/scene-data.js` — 8 phases (era+màu+cosmic), 15 nodes (ico/file/desc/link từ 2D page), zones, hero copy | `node --input-type=module -e "import('./www/cosmos-3d/scene-data.js').then(m=>console.log(m.SCENE_DATA.phases.length, m.SCENE_DATA.nodes.length))"` → `8 15` |
| 3 | Engine | `www/cosmos-3d/scene.js` — CONFIG + build core/planets/beacons/starfield/entropy + raycast + tween + panel wiring + `window.__COSMOS3D` API (stats/zone/open/nodeCount) | `get_errors` sạch; chạy `npx serve www` mở `/cosmos-3d/` không lỗi console |
| 4 | Shell + CSS | `index.html` (importmap, a11y, hero, switcher, HUD, panel, index drawer, fallback) + `style.css` (tokens, responsive 375/768/1280) | `get_errors`; Playwright screenshot 3 breakpoint |
| 5 | README update guide | `www/cosmos-3d/README.md` — “sửa gì ở đâu”, thêm node/planet, nâng three.js | Nội dung khớp code thật (đọc lại file) |
| 6 | Link từ 2D + Pages | `www/cosmos/index.html` thêm link “🌌 3D” ở hero/share row; `www/cosmos.html` shim giữ nguyên | grep href relative; `curl -I` local 200 |
| 7 | Guard test | `tests/e2e/cosmos-3d.spec.ts` — no console error (KN-032), canvas invariant (KN-028), object count ≥24 contract, click node → panel đúng data, zone switch đổi camera, no-404 (KN-030), reduced-motion flag (KN-031), 375 panel là bottom sheet | `npx playwright test tests/e2e/cosmos-3d.spec.ts` xanh |
| 8 | Polish/Verify/Done | Audit visual + chạy full spec cosmos cũ (không regression) + audit log + báo cáo | Screenshots + `npx playwright test tests/e2e/cosmos*.spec.ts` |

**Diff size:** ~4 file mới page (~700 LOC) + vendor (generated, không tính) + 1 spec (~130) + 1 dòng link. Vượt 200 LOC là do đây là **1 deliverable mới toàn phần** (không thể tách thành diff xanh từng phần: engine cần data, page cần engine) — review theo ranh giới file: data (nội dung) / engine (logic) / shell (UI) / spec.

## Files chạm

- ✚ `www/vendor/three/**` (mới)
- ✚ `www/cosmos-3d/{index.html,style.css,scene-data.js,scene.js,README.md}` (mới)
- ✎ `www/cosmos/index.html` (1 link)
- ✚ `tests/e2e/cosmos-3d.spec.ts`
- ✚ `.agent/plans/cosmos-3d/*` (đã có)

## Risks & mitigation

| Risk | Mitigation |
|------|-----------|
| jsdelivr `.min.js` bị re-minify → import `./three.core.js` (đã phát hiện khi research) | Tải từ **unpkg npm gốc**; **verify bằng node trước khi viết code** |
| OrbitControls mới kế thừa `Controls` — API khác bản cũ | Dùng constructor `(camera, domElement)` + `update()` — API ổn định; test chạy thật để chốt |
| CSS2DRenderer gây layout shift | container `pointer-events:none`, `overflow:hidden`, label absolute (KN-055 minmax cho list) |
| Test cũ cosmos vỡ do sửa index.html | Chỉ thêm 1 anchor relative; chạy lại full suite cosmos |
| `prefers-reduced-motion` bỏ sót | Flag expose `__COSMOS3D.reducedMotion` + assert trong spec |

## Exit conditions (command, không phải vibe — KN-047)

1. `npx playwright test tests/e2e/cosmos-3d.spec.ts` → pass (0 fail).
2. `npx playwright test tests/e2e/cosmos*.spec.ts` → không regression.
3. `node scripts/slop-check.mjs` trên file JS mới → 0 duplication ≥8 dòng / function ≤80 dòng / CC ≤12.
4. Screenshot 375/768/1280 + `__COSMOS3D.stats()` in ra ≥24 object, `webgl:true`.
5. Audit log: `policy-check` + `audit.mjs log` cho các edit chính.
