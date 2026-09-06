# Design mini — cosmos-p0-upgrade

Vibe: cosmic dark giữ nguyên (nebula/starfield, không đổi palette/typography).

## Quyết định
- Canonical: `www/cosmos/index.html` (vì `www/index.html` + `status.json` + `scale.html` đều trỏ vào đây)
- `www/cosmos.html` → redirect meta + link fallback (giữ file để không vỡ `cosmos.html#lab` cũ)
- Black Hole lab: thêm nút `Đồng bộ S thật`, fetch `../cosmos/scale.json` (từ `cosmos.html`) và `./scale.json` (từ `index.html`), fallback S local nếu fetch fail
- Skill: sửa `đủ 48 thực thể` → `đủ 15 map`, giữ nguyên bảng 15 dòng
- History: `scale.json` thêm `history: [{t, S, level}]`, giữ tối đa 30 điểm; dashboard thêm sparkline canvas nhẹ

## States
- Redirect: meta refresh 0s + link thủ công
- Fetch S: loading → S thật → lỗi thì giữ S demo + toast
- History: có dữ liệu → vẽ sparkline; chưa có → ẩn

## Responsive/a11y
- Không đổi layout; giữ skip-link, aria, 375/768/1280
