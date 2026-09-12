# Design — CMB Anisotropy (heatmap KN × tag × tháng + điểm lạnh + KN 0 ref)

> Nguồn số liệu: `verify/recon-output.txt` (đo thật 2026-09-12: 48 KN · 29 bug · ~104 tag · 2 tháng · 5 cold · 3 zero-ref).
> Reuse 100% design system `scale.html` (cosmos dark) — không thêm palette/font. CSS mới namespace `.cmb-*` (KN-042: tránh trùng class toàn cục).

## 1. CLI — `auto-learn.mjs stats --heatmap`

**Data flow (đọc, không ghi nguồn):**
```
docs/knowleged.md ──parseKNs()──▶ KN{id,title,tags[],date}
.agent/bugs/*/bug.md ──Tags line + slug date──▶ bug{slug,date,tags[]}
.agent/bugs/** + .agent/plans/** (md/json) ──grep KN-XXX──▶ refCount
                    │
                    ▼
   grid (tag × month) · coldSpots (bug−kn ≥1) · zeroRef (refCount=0, action theo tuổi)
                    │
                    ▼
   stdout (human) | --json | --out www/cosmos/heatmap.json
```

**Ngày của KN:** `Ngày:` trong block (parseKNs) → fallback quét bảng tóm tắt `| KN-xxx | YYYY-MM-DD` (recon cho thấy 48/48 có ngày qua 2 đường này). Bucket = `YYYY-MM`; không có ngày → `unknown`.

**JSON schema:**
```json
{
  "generatedAt": "ISO (từ --now hoặc now)",
  "generatedBy": "auto-learn.mjs stats --heatmap",
  "policy": { "cold": "bugCount − knCount ≥ 1", "freshDays": 14,
              "refScope": [".agent/bugs", ".agent/plans"], "bucket": "YYYY-MM" },
  "counts": { "knTotal", "bugTotal", "tags", "coldSpots", "zeroRef", "refFiles", "months": [] },
  "grid": { "months": ["2026-08","2026-09"], "rows": [ { "tag","total","cells":[] } ] },
  "coldSpots": [ { "tag","kn","bug","coldness" } ],
  "zeroRef":  [ { "id","title","date","ageDays","action":"fresh|merge-or-delete" } ]
}
```

**Invariants (khóa bằng test):** `row.total === Σ row.cells`; row sort `total desc, tag asc`; cold sort `coldness desc, bug desc, tag asc`; `action = ageDays>=14 || date rỗng ? 'merge-or-delete' : 'fresh'`.

**Ladder:** nấc 2 (reuse `parseKNs`, `ageDaysFromSlug`-style slug date) → nấc 4 (native fs readdir/walk) → nấc 7 (chỉ viết phần mới: grid + cold + zeroRef). KHÔNG cài dep, KHÔNG canvas.

**Human output:** đếm tổng → ❄️ top cold (max 5) → 👻 zeroRef → gợi ý lệnh. `--heatmap` bắt buộc (view duy nhất); thiếu → exit 1 + ví dụ.

## 2. UI — section `#cmb` trên `scale.html`

**Vị trí:** giữa `#hawking` và `#blackholes` (observatory flow: Timeline → Escape → Web → Hawking → **CMB** → Black Holes → Theory).

**Wireframe (desktop 3 card, mobile stack):**
```
┌─ 🌡️ Bản đồ điểm lạnh — phân bố KN ──────────────────────────────┐
│ 48 KN · 29 bug · 104 tag · 2 tháng — ❄️ 5 điểm lạnh · 👻 3 KN 0 ref [fresh: 🟢]
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ │🗺️ Heatmap     │ │❄️ Điểm lạnh    │ │👻 KN 0 ref     │
│ │ tag × tháng   │ │ bug > KN     │ │ gộp hoặc xoá  │
│ │ [tag][▪][▪]   │ │ chatbot 1/0  │ │ KN-021 · 4d   │
│ │ [tag][▪][ ]   │ │ demo    1/0  │ │ ...           │
│ │ ...top 12     │ │ perf    3/2  │ │               │
│ └──────────────┘ └──────────────┘ └──────────────┘
│ [code-block: đo bằng stats --heatmap · coldness = bug − KN]
└────────────────────────────────────────────────────────────────┘
```

**Heatmap grid:** `display:grid; grid-template-columns: minmax(88px,150px) repeat(N, minmax(0,1fr))` — header row = tháng, mỗi row = tag + ô. Ô: `.cmb-cell` level `h0`(0,mờ) `h1`(1) `h2`(2–3) `h3`(4–7) `h4`(≥8) — ramp tím `rgba(124,58,237,.12→.8)`, chữ số in trong ô khi ≥1. Ô `aria-label` đầy đủ (`process · 2026-09: 24 KN`), container `role="list"` mỗi row 1 item.

**Cold card:** `.bh-item.dynamic` (amber) — icon ❄️, `tag — bug X / KN Y`, sub "bug nổ nhiều hơn bài học → ưu tiên viết KN". Empty: `✅ không có điểm lạnh`. Max 6 + note.

**Zero-ref card:** `.bh-item` — KN id + title + `N ngày — fresh: còn mới, chờ tham chiếu | merge-or-delete: gộp hoặc xoá`. Empty: `✅ mọi KN đều được tham chiếu`.

**States:** loading (advice "Đang tải heatmap.json…") · error (`không tải được — chạy: npm run cosmos:refresh` + fresh badge '⛔ không có data' + 3 card placeholder) · empty (mỗi card message riêng). Nút `#btnRefresh` reload thêm `loadCmb()`. Hook: `loadCmb()` gọi cùng `load()/loadWeb()/loadHawking()`.

**A11y:** `aria-live="polite"` cho advice; heatmap `role="list"` + aria-label từng ô; badge fresh tái dùng `freshBadge()` sẵn có (DRY).

**Responsive:** 375 — tag col co `minmax(72px, 96px)`, cell cao 22px, font 9px; grid nằm trong card `overflow-x:auto` fail-safe (nhưng phải KHÔNG scroll — invariant test `scrollWidth ≤ clientWidth`).

## 3. Data mirror & refresh

- `www/cosmos/heatmap.json` — sinh bởi `--out`, commit như graph/hawking/scale.json.
- `package.json`: `cosmos:refresh` thêm bước `auto-learn.mjs stats --heatmap --json --out www/cosmos/heatmap.json` (sau watchdog).
- KN-030: dashboard fetch `./heatmap.json` relative (dirBase pattern đã có sẵn trong file? — scale.html dùng `fetch('./scale.json')` trực tiếp, giữ nhất quán).

## 4. Roadmap lifecycle sync

| File | Đổi |
|------|-----|
| `www/cosmos/index.html#future` | gỡ card CMB (5→4); counter "8 hướng cũ → 9", "còn 5 → còn 4" |
| `www/cosmos/slides.html` slide 15 | shipped-line + `CMB Anisotropy (điểm lạnh)`; xoá `<li>` CMB (5→4 chips); h2 "5 → 4 đề tài mới"; nút "🚀 5 → 🚀 4 đề tài mới" |
| `tests/e2e/cosmos-future.spec.ts` | 5→4 cards, eta 4→? (4), not CMB, counter text |
| `tests/e2e/cosmos-slides.spec.ts` | topic list bỏ CMB; chips 5→4; shipped-line chứa 'CMB Anisotropy' |
| `tests/e2e/cosmos-cmb.spec.ts` | **MỚI** — 5 CLI + 3 UI |

## 5. Docs

- `.github/skills/cosmic-quantum/SKILL.md`: bảng lệnh thêm `stats --heatmap` (cạnh watchdog).
- `.github/instructions/cosmic-quantum.instructions.md` §8: thêm bullet **CMB ↔ knowledge anisotropy**.
- `.claude/rules/cosmic-quantum.md`: mirror tay y hệt (⚠️ KHÔNG chạy export-claude — sẽ sweep file của session song song).
- ⏭️ Để lại cho session song song: `auto-learn.instructions.md` (đang modified) + README counts (đang modified).

## 6. Dissent kỹ thuật đã xử lý ở design

- **`--now` flag** không có trong roadmap contract — thêm vì cần test deterministic (cùng pattern watchdog `--now`). Không thêm gì khác.
- **Sort grid theo `total` desc** (không theo thời gian) — vì UI cần top rows "nóng nhất"; cold spots có card riêng.
- **Không highlight cold tag trong grid** — hai nơi nói một việc là scope creep nhỏ; cold card đứng riêng đủ rõ.
