# Design (mini) — Hawking Radiation · watchdog + section scale.html

## Data contract — `www/cosmos/hawking.json`
```json
{
  "generatedAt": "ISO", "generatedBy": "auto-learn.mjs watchdog",
  "policy": { "escalateDays": 30, "evaporateDays": 90 },
  "counts": { "bugsTotal": 29, "open": 0, "fresh": 0, "escalate": 0, "evaporate": 0, "closed": 29 },
  "bugs": [{ "slug": "2026-08-01-x", "date": "2026-08-01", "ageDays": 42, "status": "open", "action": "escalate" }]
}
```
`bugs[]` chỉ chứa bug **open** (đã sort ageDays desc). Journal: `.agent/hawking.jsonl` — `{ts, slug, ageDays, action, prev, note}`.

## Wireframe — section `#hawking` trên scale.html (sau Cosmic Web, trước Black Holes)
```
┌────────────────────────────────────────────────────────────────┐
│ 🌑 HAWKING RADIATION — Nợ bay hơi        [🟢 tươi · 1m]       │
│ 29 bug · 0 open · 0 escalate · 0 evaporate — ✅ không nợ hạn   │
├─────────────────┬──────────────────┬──────────────────────────┤
│ ⚪ Đang mở       │ 🔆 ≥30d escalate │ 🌑 ≥90d evaporate        │
│ 0 draft          │ — không có —      │ — không có —             │
│ (fresh + ngưỡng) │ (row: slug+tuổi)  │ (+ note → propose KN)    │
├─────────────────┴──────────────────┴──────────────────────────┤
│ ≥30d: journal + nhắc · ≥90d: note + Status→evaporated (giữ lịch sử) │
│ Đo: node .github/harness/scripts/auto-learn.mjs watchdog --apply     │
└────────────────────────────────────────────────────────────────┘
```

## Reuse (Ladder nấc 2)
| Thành phần | Class tái dùng |
|-----------|----------------|
| head + fresh badge | `.section`, `.section-head`, `.fresh` |
| 3 card | `.grid-3`, `.card` |
| row bug | `.bh-item` + `.bh-icon` + `.bh-info` (như Cosmic Web clusters) |
| empty state | `.web-empty` |
| hint | `.code-block` |

## States
| State | Điều kiện | Hình |
|-------|-----------|------|
| healthy | open=0 | 3 card hiện "✅ không có" + advice xanh |
| có nợ | open>0 | rows trong card tương ứng, badge warn/bad theo escalate/evaporate >0 |
| error | fetch fail | advice = lệnh refresh + lý do |
| loading | chưa fetch | advice "Đang tải hawking.json…" |

## A11y / Responsive
- `role="list"`/`listitem`; `#hawkingAdvice` `aria-live="polite"`; chữ trạng thái rõ (không chỉ màu).
- <768 stack dọc; slug `word-break:break-all`; không `min-width` cứng (KN-042).

## Script design (auto-learn watchdog)
- Options: `--json --out <f> --dir <bugsDir> --journal <f> --now <ISO> --escalate-days N --evaporate-days N --apply`
- Mặc định dir=`.agent/bugs`, journal `.agent/hawking.jsonl` (khi `--dir` custom → journal mặc định `<dir>/hawking.jsonl` để test cô lập).
- Open detection: `/-\s*\*\*Status:\*\*\s*`?open`?/i` (khớp status() + cosmic-scale). `fixed|resolved|wontfix|evaporated` = closed.
- `--apply`: ① journal entry khi action ĐỔI (so entry cuối cùng per slug) ② evaporate → ghi `hawking.md` (append) + replace dòng Status.
- `--now` để test tất định; default `new Date()`.

## Evals (component → E2E)
- Component: tính tuổi (slug/mtime/fallback) · phân hạng (3 mức, boundaries 29/30/89/90) · idempotency journal.
- E2E: scale.html render từ file thật; empty-state đúng khi open=0; 375 không tràn; no pageerror.
- Error analysis: mọi fail cùng loại (fixture/sort/format) fix ở hàm chung, không fix instance test.
