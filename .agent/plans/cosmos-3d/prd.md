# PRD — COSMOS 3D (Vũ trụ Harness tương tác bằng three.js)

> Pipeline: `/harness` · Trạng thái: approved (operator request 2026-09-22)
> Canonical 2D vẫn là `www/cosmos/index.html` — 3D là **lớp trải nghiệm khám phá**, không thay thế.

## 1. Vision

Một trang 3D tương tác (`www/cosmos-3d/`) biến triết lý COSMOS của Harness v2 thành **vũ trụ bay được**:
lõi hệ thống phát sáng + 8 hành tinh pipeline quay quỹ đạo + chòm sao 15 vùng hệ thống + lỗ đen entropy đọc dữ liệu thật.
Người xem **orbit / hover / click** để hiểu cấu trúc hệ thống — trực quan hơn cuộn trang.

**Yêu cầu số 1 từ user: "sau này dễ update".** Nên kiến trúc là: nội dung = 1 file data duy nhất, layout = auto (thêm 1 dòng → tự lên quỹ đạo / tự vào chòm sao).

## 2. Người dùng & câu chuyện

| User | Story |
|------|-------|
| Operator (sếp) | "Mở trang 3D là thấy ngay hệ thống đang có gì, phase nào đứng đâu, S bao nhiêu" |
| Người mới | "Click từng hành tinh/ngôi sao để đọc nó là gì, file nào, mở link" |
| Dev tương lai | "Thêm 1 vùng hệ thống mới = thêm 1 object vào `scene-data.js`, không sửa engine" |

## 3. Scope (GIỮ)

1. **Zone 1 — Lõi hệ thống:** core sáng (Harness) + 8 hành tinh pipeline (Explore→Verify) quay quỹ đạo, màu theo gradient hiện có của 2D page + vòng quỹ đạo + nhãn hover.
2. **Zone 2 — Bản đồ sao:** 15 node hệ thống (CMB, Nón ánh sáng, Định luật…) thành tinh thể phát sáng tự xếp bằng fibonacci sphere + nhãn tên.
3. **Lỗ đen entropy:** vật thể đọc `scale.json` thật (`../cosmos/scale.json`) — màu theo level S (low/medium/high), click → panel + link dashboard scale.
4. **Tương tác:** OrbitControls (drag/zoom, damping) · hover glow · click → panel chi tiết (title/meta/desc/link) · Esc đóng · switcher 2 zone (camera bay có tween) · intro fly-in.
5. **Bền vững:** self-host three.js v0.186.0 trong `www/vendor/three/` (không phụ thuộc CDN) · fallback WebGL thiếu → báo + link về bản 2D · reduced-motion (không auto-quay, không intro) · pause khi tab ẩn.
6. **A11y:** skip-link, panel là `<dialog>`-like có aria, danh sách "Chỉ mục" (index) bằng `<button>` thật cho keyboard/AT (tương đương truy cập mọi object), contrast ≥4.5:1.
7. **Pháp lý/license:** kèm `www/vendor/three/LICENSE` (MIT, three.js authors) + `VERSION.txt` hướng dẫn nâng cấp.

## 4. Non-Goals (CẮT — YAGNI gate)

| Cắt | Vì sao |
|-----|--------|
| Replicate 12 lab lượng tử vào 3D | 2D đã làm tốt; 3D là bản đồ cấu trúc, không phải lab. Link sang 2D. |
| Load model GLTF / texture ngoài | Tăng bundle + fetch risk; hình khối procedural đủ đẹp, 0 asset. |
| Post-processing (bloom pass) | Nặng + thêm addon; giả lập glow bằng sprite additive rẻ hơn. |
| i18n đa ngữ | Cả `www/` đang tiếng Việt hardcode — theo convention dự án (không over-engineer 1 trang). |
| State persistence (lưu zone đã xem) | Không cần; F5 về mặc định là hành vi mong muốn. |
| Pin exact vị trí object trong data | Vị trí auto từ index/hash → data chỉ chứa nội dung. |
| Build step (vite/webpack) | Pages là static; importmap + ES modules là đủ (manual §Installation). |

`Persistence: none (scene state không lưu) · F5: reset về zone Lõi · Scope: per-viewer (local, không ảnh hưởng dữ liệu hệ thống)`

## 5. Metrics / Evals (đo trước khi Done)

| Tiêu chí | Cách đo (command/evidence) |
|----------|---------------------------|
| Trang chạy không lỗi console | Playwright: 0 pageerror + 0 console error (KN-032) |
| Canvas đúng geometry | `canvas.width === clientWidth * ratio(cap 2)` invariant (KN-028) |
| Object count ≥ 24 (1 core + 8 planets + 15 beacons) | assert qua API `window.__COSMOS3D.stats()` (contract, không pin số cứng — thêm node vẫn pass) |
| Click beacon → panel đúng tên node | test so với `scene-data.js` import (1 nguồn) |
| Zone switch đổi camera | assert target.position thay đổi sau tween |
| Không 404 asset | test network responses không có status ≥400 (KN-030) |
| Reduced motion | emulate `prefers-reduced-motion` → `autoRotate===false` |
| Responsive 375/768/1280 | screenshot 3 breakpoint + panel mở được ở 375 |
| Bundle vendor | ≤ 1.1MB tổng (three.core.min + wrapper + 2 addons) |

## 6. Nguồn research (đã thu thập trước khi làm)

- three.js manual — Installation (importmap/self-host), Fundamentals, Responsive (cap pixel ratio), Rendering on Demand, Optimize Lots of Objects (merge/points), Cleanup (ResourceTracker), Tips. `https://threejs.org/manual/`
- Version hiện hành: **three@0.186.0** (`registry.npmjs.org/three/latest`, 2026). Build tách `three.core.min.js` + wrapper `three.module.min.js`.
- Skill tham khảo (chưa cài — game-focused, không cần cho viz): `github/awesome-copilot · skills/game-engine` (Three.js/Babylon/A-Frame overview).
- Design vibe: `awesome-design-md` search "space cosmic dark 3d stars" → **spacex** (score 10, pure black canvas, mission-oriented) — dùng làm cảm hứng nền tối, tokens chính vẫn theo cosmos hiện có để nhất quán.
- KN áp dụng: KN-028 (geometry invariant + screenshot), KN-029 (third-party async/self-host), KN-030 (fetch mirror trong www/ + no-404), KN-031 (reduced motion), KN-032 (rAF engine phải assert no console error), KN-040 (sweep/links relative), KN-055 (minmax/overflow nhãn).

## 7. Dissent Review (KN-018)

`Who did you think with?: Critic framing — "3D là gimmick, sao không polish bản 2D?"`

| Framing đối lập | Cân nhắc | Kết luận |
|-----------------|----------|----------|
| **3D = gimmick, đầu tư lãng phí** | 2D đã đầy đủ nội dung + 3D nặng hơn (600KB), khó maintain | Giữ 3D nhưng **không move nội dung**: 3D chỉ hiển thị cấu trúc (8 phase + 15 node) + nhập môn; chi tiết vẫn ở 2D. Nếu WebGL fail → tự về 2D. Chi phí maintain chặn bằng data-driven (1 file). |
| Dùng Babylon.js / raw WebGL thay three.js | Babylon mạnh về game nhưng nặng hơn; raw WebGL (đã có ở web-universe) tốn code cho scene graph | three.js: ecosystem lớn nhất, user yêu cầu đích danh, addons (OrbitControls/CSS2DRenderer) giảm code. |
| React Three Fiber | Cần build step — vi phạm static Pages | Loại. |

## 8. Rủi ro & giảm thiểu

| Rủi ro | Giảm thiểu |
|--------|------------|
| WebGL không khả dụng | Feature-detect trước khởi tạo → màn hình fallback + link 2D |
| CDN ba.js chết / file lệch version | Self-host, pin 0.186.0, VERSION.txt, guard test no-404 |
| Trang nặng trên máy yếu | pixelRatio cap 2, Points thay mesh cho sao, pause khi tab ẩn, reduced-motion |
| Update lệch data | 1 nguồn `scene-data.js`; test import chính file đó để so |
| Tương lai đổi path thư mục | Import tương đối qua module URL (`import.meta.url`/importmap) — không dùng đường dẫn tuyệt đối |
