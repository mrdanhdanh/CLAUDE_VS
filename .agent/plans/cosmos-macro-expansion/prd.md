# PRD — Cosmos Macro Expansion (features #1–#4)

Cosmic-Quantum: Macro www/cosmos là vũ trụ con trong www/ — thêm 3 section bản đồ/quan sát · Micro superposition 3 layout → collapse 1 (timeline ngang, grid, vertical chain) · Entanglement www/cosmos/index.html ↔ www/cosmos/scale.json ↔ .agent/audit.jsonl ↔ www/cosmos/scale.html

Persistence: chỉ đọc dữ liệu (scale.json, audit.jsonl) qua fetch + fallback demo khi fetch fail (file:// / Pages không có audit.jsonl) · F5: không mất gì (read-only) · Scope: public static page

## Mục tiêu
1. **System Map 15 vùng** — bản đồ tương tác Harness→Cosmos: 15 node (CMB, nón ánh sáng, event horizon, quasar...), click → detail panel, link tới file thật.
2. **Cosmic Calendar** — 8 phase pipeline nén vào lịch sử vũ trụ, timeline ngang scrollable, click era → detail.
3. **Event Horizon monitor** — đọc audit.jsonl, vẽ chuỗi event (photon chain), tự verify hash chain (prevHash→hash), refused/failed rơi vào hố đen → callout takeover.
4. **Dark Energy trend** — đọc scale.json history, sparkline S theo thời gian + rate giãn nở (ΔS).

## YAGNI gate — CẮT
- Cắt: page riêng, framework, lib chart, backend, ghi dữ liệu về repo.
- Giữ: 3 section mới trong index.html + nav dots + CSS + JS fetch có fallback demo.

## Non-goals
- Không sửa scale.html / slides.html / scale.json (generator sở hữu).
- Không tự verify audit bằng script (chỉ hiển thị verify JS client-side).

## Design vibe
- Reuse design system sẵn của index.html (cosmos palette, cards, btn, toast) — không thêm font/màu mới.
