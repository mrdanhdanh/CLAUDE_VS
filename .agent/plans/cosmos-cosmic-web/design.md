# Design (mini) — Cosmic Web section trên scale.html

## Data contract — `www/cosmos/graph.json`
```json
{
  "generatedAt": "ISO", "generatedBy": "entangle.mjs --graph",
  "scanned": { "files": 412, "edges": 1330, "commits": 400 },
  "thresholds": { "hubMinRefs": 10, "coChangeMin": 3 },
  "hubs": [{ "file": "www/index.html", "refs": 25 }],
  "clusters": [{ "files": ["a","b","c"], "weight": 7 }],
  "deadFilaments": ["www/legacy/old.js"],
  "counts": { "hubs": 3, "clusters": 2, "deadFilaments": 1 }
}
```

## Placement
`scale.html` — chèn **giữa Timeline (#timeline) và Black Holes (#blackholes)**. Thứ tự đọc: Entropy → Dark Energy → Dark Matter → Timeline → **Cosmic Web** → Black Holes → Theory.

## Wireframe (desktop)
```
┌───────────────────────────────────────────────────────────────┐
│ 🕸️ COSMIC WEB — Mạng nhện vũ trụ        [🟢 tươi · 2m]      │
│ 412 files · 1330 edges · 400 commits — 3 hub · 2 cluster · 0 dead │
├──────────────────┬──────────────────┬─────────────────────────┤
│ 🌌 Hub           │ 🧩 Cluster       │ 🪶 Dead filament        │
│ (≥10 refs)       │ (đổi cùng nhau)   │ (0 ref · www/)          │
│ www/index.html 25│ ×7 chung commit   │ ✅ 0 — vũ trụ sạch      │
│ .github/.../x   14│ [file chips...]  │ hoặc: path + hint grep  │
├──────────────────┴──────────────────┴─────────────────────────┤
│ Hub ⇒ entangle --file + test rộng · Cluster ⇒ gộp 1 plan ·    │
│ Dead ⇒ grep usage rồi xoá (minimal-ladder)                    │
└───────────────────────────────────────────────────────────────┘
```

## Reuse (Ladder nấc 2 — không tạo component mới)
| Thành phần | Class tái dùng |
|-----------|----------------|
| Section/head | `.section`, `.container`, `.section-head`, `small` |
| Row số liệu | `.part` (span/b/i) |
| Item có icon (cluster, dead) | `.bh-item`, `.bh-icon`, `.bh-info` |
| Empty state | `.card` + `<p>` như orphanList |
| Fresh badge | `.fresh` (+ `.ok/.warn/.bad`) |
| Chips file (MỚI, ~4 dòng CSS) | `.web-chips` + `.web-chip` |

## States
| State | Điều kiện | Hình |
|-------|-----------|------|
| loading | chưa fetch xong | `#webAdvice` "Đang tải graph.json…" |
| data | fetch 200 + parse OK | 3 card render, fresh badge theo tuổi |
| empty | mảng rỗng (hubs/clusters/dead) | "— không có hub ≥10 refs —" / "✅ 0 dead filament…" |
| error | fetch fail | `#webAdvice` = lệnh refresh + lý do |

## Responsive & a11y
- ≥768: 3 card 1 hàng (`.grid-3` sẵn có); <768: stack dọc. Chip `word-break:break-all`, không `min-width` cứng (KN-042).
- `role="list"` + `role="listitem"` cho 3 danh sách; `aria-live="polite"` cho `#webAdvice`; fresh badge có text (không chỉ màu).
- IDs cho test: `#web-title`, `#webAdvice`, `#webFresh`, `#webHubs`, `#webClusters`, `#webDead`, `#webCode` (dòng hint).

## Evals (component → E2E)
- Component: 3 renderer (hubs/clusters/dead) — mỗi cái data→DOM đúng count + empty-state.
- E2E: scale.html đọc graph.json thật, rows khớp nội dung file; 375 không tràn; no pageerror.
- Error analysis: fail cùng loại (selector/count) → fix ở renderer chung, không fix từng test.
