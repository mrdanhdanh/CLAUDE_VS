# Plan: WEB 011 Part 8 — Real PWA + Real Permissions

Dùng design: giữ nguyên design system hiện tại (base.css variables) · offline.html reuse tokens.

| # | Todo | Ladder nấc | Entangled with |
|---|------|-----------|----------------|
| 1 | PRD mini | 7 | prd.md |
| 2 | sw.js v2: precache + cache-first static + network-first HTML + offline fallback | 7 (minimum that works) | offline.html, pwa-lab |
| 3 | offline.html fallback | 4 (native HTML/CSS) | sw.js, base.css tokens |
| 4 | permission-manager real API (Notification/getUserMedia/geolocation/clipboard) | 7 | app.js (renderPermissions) |
| 5 | pwa-lab: bỏ "stub" text + nút Clear caches | 6 (1 dòng mỗi chỗ) | sw.js |
| 6 | Verify: node --check + get_errors + báo cáo | — | — |

## Verify checklist
- [ ] `node --check` pass cho sw.js (SW scope, không import), permission-manager.js, pwa-lab/index.js
- [ ] `get_errors` affected files
- [ ] CACHE version = `web-universe-v2`, activate xóa cache cũ
- [ ] Không hardcode màu mới — reuse CSS variables
