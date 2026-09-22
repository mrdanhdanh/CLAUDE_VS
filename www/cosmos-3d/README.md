# COSMOS · 3D — hướng dẫn update

Trang 3D (three.js) của COSMOS — vũ trụ Harness v2: lõi hệ thống + 8 hành tinh pipeline + lỗ đen entropy + chòm sao 15 vùng hệ thống.
Bản 2D đầy đủ (nội dung chi tiết, 12 lab lượng tử) vẫn ở `../cosmos/index.html`.

## Sửa gì thì sửa ở đâu?

| Muốn đổi | Sửa file | Ghi chú |
|----------|----------|---------|
| **Nội dung** (thêm/xoá hành tinh, vùng hệ thống, copy hero, link) | `scene-data.js` | ★ 90% trường hợp chỉ cần file này |
| **Hình dáng vũ trụ** (kích thước, tốc độ quay, số sao, thời gian bay camera) | `scene.js` → `CONFIG` (đầu file) | Không cần đọc phần dưới |
| **Giao diện** (màu, panel, responsive, chữ) | `style.css` → `:root` tokens | |
| **Nâng three.js** | `../vendor/three/VERSION.txt` | Có hướng dẫn 3 bước + lệnh patch |

### Thêm 1 hành tinh pipeline
Thêm 1 object vào `phases` trong `scene-data.js`:
```js
{ num: '09', name: 'Deploy', era: 'Kỷ nguyên mới', cosmic: '🚀 ...', desc: '...', color: '#22d3ee' },
```
→ Tự động: lên quỹ đạo (bán kính +2.4), có vòng quỹ đạo, nhãn, vào Chỉ mục, click mở panel. Không sửa engine.

### Thêm 1 vùng hệ thống
Thêm 1 object vào `nodes`:
```js
{ id: 'unique-id', ico: '🔧', name: 'Tên vùng', file: 'path/trong/repo', link: '', color: '#f472b6', desc: '...' },
```
→ Tự động xếp vào quả cầu fibonacci. **Nhớ thêm cả entry tương ứng vào `MAPS` của `../cosmos/index.html`** —
guard test `tests/e2e/cosmos-3d.spec.ts` so số lượng 2 bên, lệch là fail.

## Kiểm tra sau khi sửa

```bash
npx playwright test tests/e2e/cosmos-3d.spec.ts     # 10 guard: boot sạch lỗi, no-404, contract, a11y, responsive, reduced-motion
node scripts/slop-check.mjs www/cosmos-3d/scene.js www/cosmos-3d/scene-data.js
```

Chạy tay: `npx serve www` → mở `http://localhost:3000/cosmos-3d/index.html`
(URL dạng `/cosmos-3d/` cần rewrite trong `www/serve.json`; trên GitHub Pages thì mọi dạng đều chạy.)

## Kiến trúc (3 file, không build step)

```
index.html      — shell: a11y (skip-link, Chỉ mục, dialog), importmap, fail-safe 12s
style.css       — tokens --c3d-*, layout, panel/bottom-sheet, responsive 375/768/1280
scene-data.js   — ★ DỮ LIỆU: zones · hero · core · phases · nodes · entropy
scene.js        — engine: CONFIG → build scene → hover/click/panel/zone/camera
```

Nguyên tắc: **data ≠ engine**. Data chỉ chứa nội dung; vị trí/kích thước/tốc độ do engine tính từ index
(quỹ đạo: `orbit + i × step`, chòm sao: fibonacci sphere). Vì vậy thêm phần tử không cần tính toạ độ tay.

## API cho test (`window.__COSMOS3D`)

| Hàm | Trả về |
|-----|--------|
| `stats()` | `{ webgl, objects, items, phases, nodes, labels, entropyS, zone, reducedMotion, ... }` |
| `open(id)` | mở panel theo id (`core`, `phase-05`, `node-cmb`, `entropy`) |
| `zone('core'\|'map')` | bay camera tới vùng |
| `hovered()` | id vật thể đang hover |
| `cameraPos()` | `{x,y,z}` |

## A11y

Canvas là `role="img"` (trang trí cho AT) — **đường truy cập nội dung đầy đủ là nút "☰ Chỉ mục"**:
mọi vật thể (25) đều là `<button>` thật, mở cùng panel. Esc đóng panel → drawer → hero theo thứ tự.
`prefers-reduced-motion` → tắt auto-rotate, intro, tween camera; vẫn giữ fade opacity.
