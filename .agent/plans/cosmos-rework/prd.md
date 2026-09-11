# PRD — COSMOS · QUANTUM Rework (2026-09-12)

Cosmic-Quantum: Macro — `www/cosmos/index.html` là vũ trụ con (3809 dòng, 254KB, 9 sections) · Micro — 3 bug đo được đã sụp đổ thành bằng chứng (screenshot + số liệu) · Entanglement — `index.html` ↔ `scale.html`/`slides.html`/`status.json`/`audit.json`/`scale.json`

## Who did you think with?
Dissent (không prompt trước): **"Rework toàn bộ giao diện" là sai hướng** — trang đã đẹp (visual check 3 breakpoint đạt), rework toàn phần = rủi ro regression cao, vi phạm minimal-ladder. Phản đề: chỉ rework **cái đo được là lỗi** (bug list bên dưới) + polish có bằng chứng. Rival work: các landing "space theme" thường dùng reveal-on-scroll với threshold cố định — chính pattern này gây bug #1 (element > viewport/threshold thì không bao giờ hiện). Quyết định: **fix bug + polish trúng**, không đập đi xây lại.

## Vấn đề (evidence-based, không đoán)
| # | Severity | Vấn đề | Bằng chứng |
|---|----------|--------|-----------|
| 1 | 🔴 critical | Section `#lab` (6696px @375) **không bao giờ reveal** trên mobile: IO `threshold:0.12` cần 803px hiển thị > viewport 780px → max ratio 0.116 → **cả 11 lab tàng hình vĩnh viễn trên điện thoại** | probe 375×780: `#lab maxRatio=0.116`; 1280×900: pass |
| 2 | 🔴 major | 2 link 404 ra ngoài deploy root (`../../docs/knowleged.md`, `../../.agent/policy.json`) — KN-030 class | diagnose.mjs: `brokenInternal: [{href: '../../docs/knowleged.md', status: 404}]`; policy.json lộ khi click map node |
| 3 | 🟠 major | Hover lift của `.card` bị parallax inline `transform` đè → hover không nhấc lên | đo: hover computed `matrix(1,0,0,1,0,0)` thay vì `-3px` |
| 4 | 🟠 minor | Lab card bị grid stretch → card ngắn (Heisenberg) thừa ~200px trống đáy | đo: card 2/3 cùng 718px dù nội dung khác |
| 5 | 🟡 minor | Anchor `#lab`/`#pipeline`… bị sticky header (56px) che khi click scroll | click "🧪 Mở Lab" → heading nằm sau header |
| 6 | 🟡 minor | Stat "ĐIỂM ĐO 9" thiếu đơn vị (là số điểm lịch sử, không phải điểm số) | code: `hist.length` |
| 7 | 🟡 minor | Superposition stack: label 2 card sau bị card giữa che → trông như chữ bị cắt ("CO…", "TO…") | screenshot lab-01 |

## Scope
- Fix 7 mục trên trong `www/cosmos/index.html` (không đổi cấu trúc section, không đổi nội dung).
- Thêm regression test cho bug #1 + #2 (bug chưa có test cover — 36/36 test xanh vẫn lọt).

## Non-goals (YAGNI — CẮT)
- CẮT: đổi font (đã kiểm chứng 180px: Plus Jakarta Sans render dấu đúng).
- CẮT: tái cấu trúc HTML/layout tổng thể, đổi palette.
- CẮT: accordion hoá lab trên mobile (fix reveal là đủ; 11 lab dạng scroll là chủ ý).
- CẮT: thêm dependency/framework mới.

## Persistence · F5 · Scope
`Persistence: none (trang đọc-only, fetch scale.json/audit.json tĩnh) · F5: n/a (không ghi dữ liệu) · Scope: static — GitHub Pages www/`

## Acceptance
- [ ] 375/390/768/1280: mọi `.reveal` hiển thị sau khi scroll (kể cả `#lab` 6.7k px).
- [ ] 0 link 404 khi click mọi map node + footer + hero.
- [ ] Card hover nhấc lên (đo computed transform ≠ 0).
- [ ] Lab card ngắn không còn void > 100px (demo grow).
- [ ] Anchor không bị header che (scroll-margin-top).
- [ ] 36 test cũ vẫn xanh + test mới cho bug #1/#2.
