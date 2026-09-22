# Verify — COSMOS 3D (three.js)

> Ngày: 2026-09-22 · Người chạy: YUNIE · Plan: `.agent/plans/cosmos-3d/`

## 1. Exit conditions (theo plan.md — command, không phải vibe)

| # | Điều kiện | Lệnh | Kết quả |
|---|-----------|------|---------|
| 1 | Guard spec 3D pass | `npx playwright test tests/e2e/cosmos-3d.spec.ts` | ✅ **10 passed** |
| 2 | Không regression suite cosmos | `npx playwright test "tests/e2e/cosmos"` | ✅ **88 passed** (1 fail có sẵn `cosmos-freshness` do mirror cũ 4 ngày → `npm run cosmos:refresh` → xanh lại) |
| 3 | Slop gate | `node scripts/slop-check.mjs www/cosmos-3d/scene.js www/cosmos-3d/scene-data.js` | ✅ Clean (sau refactor `wireUI`/`main` → factory nhỏ) |
| 4 | Screenshot 3 breakpoint + stats | spec test "screenshot 1280/768/375" + `__COSMOS3D.stats()` | ✅ `cosmos-3d-{1280,768,375}.png` · objects 26 · items 25 · labels 25 · entropyS 9 |
| 5 | Audit log | `audit.mjs log` | ✅ (xem §4) |

## 2. Guard spec — 10 test (tests/e2e/cosmos-3d.spec.ts)

| Test | KN | Nội dung |
|------|----|----------|
| boot sạch lỗi + contract | KN-032 | 0 pageerror / 0 console error; `items === phases + nodes + 2`; HUD khớp |
| data 3D khớp nội dung 2D | — | số node 3D === số `MAPS` 2D (1 nguồn nội dung) |
| drawer DOM = data | a11y | 25 nút thật trong "Chỉ mục" = 25 vật thể |
| không 404 cho 3 dạng URL | KN-030 | `/cosmos-3d/index.html` · `/cosmos-3d/` · `/cosmos-3d` |
| click lõi giữa màn hình → panel | — | raycast thật qua chuột, panel mở đúng nội dung |
| mở node qua API + Esc | — | panel/link đúng; Esc đóng; entropy meta có `S =` |
| chuyển zone → camera bay | — | cameraPos.x đổi >40; aria-pressed đúng |
| 375 panel = bottom sheet | KN-055 | rộng >340, chạm đáy, cao <520 (vẫn thấy canvas) |
| reduced-motion | KN-031 | `reducedMotion:true`, camera đứng ở zone core, không intro |
| screenshot 3 breakpoint | KN-028 | evidence visual |

## 3. Bằng chứng visual

- `shot-1-hero.png` … `shot-5-mobile.png` — 5 ảnh chụp tay (hero, core, map, panel, mobile)
- `cosmos-3d-1280.png` · `cosmos-3d-768.png` · `cosmos-3d-375.png` — spec tự chụp
- Canvas invariant: `clientWidth × min(dpr,2)` === drawingBuffer (đo tại 375: 375×720 khớp, ratio 1)

## 4. Governance

- `policy-check` cho lệnh tải three.js: ✅ PERMITTED
- Audit log các edit chính: xem `.agent/audit.jsonl` (tail)
- Bug tái lập của KN-030 → `.agent/bugs/2026-09-22-local-serve-404-cho-thu-muc-moi-can-rewrite-trong-/bug.md` + KN-075 draft (chờ dev duyệt)

## 5. Ghi chú kỹ thuật (đã verify)

1. **three.js v0.186.0 self-host**: npm không ship `*.min.js` (unpkg 404, GitHub tag 404) → lấy bản min từ jsdelivr + **patch 1 string** import `./three.core.js` → `./three.core.min.js`. Ghi đầy đủ ở `www/vendor/three/VERSION.txt`.
2. **Layout addons phải khớp upstream** (`addons/controls/`, `addons/renderers/`) vì importmap map `three/addons/` → thư mục vendor.
3. **Local serve cần rewrite** cho thư mục mới (đã thêm `/cosmos-3d` + `/cosmos` vào `www/serve.json`).
4. **`THREE.Clock` deprecated** ở r186 → dùng `THREE.Timer` (tự pause theo `visibilitychange`).
5. **Fail-safe 12s**: nếu module/scene không khởi động (import fail, fetch treo) → hiện fallback thay vì treo spinner.
