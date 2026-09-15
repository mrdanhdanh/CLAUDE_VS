# Design (mini) — Lensing · Blast radius 2-hop

## 1. CLI (nguồn chân lý)

```
node .github/harness/scripts/entangle.mjs --lens --file <path> [--hops 2] [--json] [--out <file>] [--max N]
```

```
🌐 LENSING — blast radius of www/cosmos/index.html · 2 hop

Hop 1 — ref trực tiếp (12) — sửa là đụng ngay:
   tests/e2e/cosmos-future.spec.ts  (4 refs)
   www/cosmos/slides.html  (3 refs)
Hop 2 — bẻ cong qua hop 1 (7):
   file  (2 refs)   ← via www/cosmos/slides.html

🔬 Pre-flight test set (2) — chạy TRƯỚC khi refactor:
   tests/e2e/cosmos-future.spec.ts  (hop 1)

ⓘ Text-refs reachability (edges như --graph) — pre-flight checklist, không phải runtime impact.
   File không xuất hiện KHÔNG có nghĩa an toàn tuyệt đối.
```

- Exit 1: thiếu `--file` (usage) / file không tồn tại. Exit 0 kể cả blast rỗng (note "file mồ côi?").
- `--hops` clamp 1..3 · `--max` cap số dòng in mỗi hop (JSON giữ đủ).

## 2. JSON

```json
{
  "generatedAt": "ISO", "generatedBy": "entangle.mjs --lens",
  "file": "www/cosmos/index.html", "hops": 2,
  "method": "text-refs reachability (edges như --graph) — pre-flight, không phải runtime impact",
  "counts": { "byHop": { "1": 12, "2": 7 }, "blast": 19, "testSet": 2, "edgesScanned": 1613 },
  "blastRadius": [ { "file": "...", "hop": 1, "refs": 4, "via": ["www/cosmos/index.html"] } ],
  "testSet": [ { "file": "tests/e2e/x.spec.ts", "hop": 1, "via": ["..."] } ]
}
```

- BFS reverse từ target; shortest-hop thắng, dedup toàn cục; `via` = refs ở hop trước (đường lens).
- **Noise filter (mirror `gitClusters` precedent):** loại edge *từ* `.agent/bugs/` + `.agent/plans/` + `.agent/versions/` (artifacts lịch sử ref code nhưng không bị ảnh hưởng — frozen records). Docs sống (`docs/`, `.github/`) vẫn giữ (refactor có thể cần update docs).
- testSet = blast ∩ isTest(segment `test|tests|*.test|*.tests` hoặc `* .spec./.test.` — mirror rule policy `deny-test-mutate`).

## 3. graph.json (mở rộng)

Thêm `edges: [[from,to],...]` (~1613 cặp — ~100KB) — nguồn duy nhất cho widget client-side (không file mới).

## 4. scale.html#web — widget 🔭 Lensing (feedback loop)

- Đặt dưới `grid-3` của section `#web`. Id namespace `webLens*` (KN-042).
- Controls: `select#webLensFile` (top 80 target theo in-degree, default = #1) + `button#webLensBtn`.
- Output `#webLensOut` (aria-live): summary `hop 1: N · hop 2: M · test set: K` → chips hop1 (amber `#f59e0b`) → chips hop2 (violet `#c4b5fd`, title=via) → test rows (green `#6ee7b7`, mono).
- Cap 12 chip/hop + `+n nữa`; reuse `.web-chip` `.web-empty` `.bh-item` `.code-block`; 375px: `select{width:100%;min-width:0}`, chips wrap.
- States: graph.json lỗi → note như #webAdvice; chưa có `edges` → `— cần npm run cosmos:refresh —`; blast rỗng → note mồ côi.
- Honesty note (1 dòng, dim): text-refs pre-flight — không phải runtime impact.

## 5. Roadmap swap

- `index.html#future`: gỡ card 🌐 Lensing → thêm card ☄️ Cosmic Ray (`--repeat-each N` → quarantine spec dao động) · counter "9 hướng cũ" → "10 hướng cũ đã ship" (6 card giữ nguyên).
- `slides.html` s12: shipped-line + "Gravitational Lensing (entangle --lens)" · list swap Lensing→Cosmic Ray · "6 đề tài mới" giữ.

## 6. Palette (giữ cosmic dark)

hop1 amber `#f59e0b` · hop2 violet `#c4b5fd` · test green `#6ee7b7` · dim `#94a3b8` — không theme mới, không font mới.
