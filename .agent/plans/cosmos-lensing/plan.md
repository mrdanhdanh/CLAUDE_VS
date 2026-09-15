# Plan (mini) — Gravitational Lensing · Blast radius 2-hop

| # | Todo | Status | Ladder | Entangled with |
|---|------|--------|--------|----------------|
| 1 | Plan mini + policy gates + audit | ✅ 3 gates PERMITTED + logged | 6 (docs ngắn) | `.agent/plans/cosmos-lensing/`, `.agent/audit.jsonl` |
| 2 | TDD RED — spec `entangle-lensing.spec.ts` (verify actor) | ✅ RED 4/4 fail → GREEN 4/4 | 4 (native e2e) | `tests/e2e/entangle-lensing.spec.ts` |
| 3 | Implement `--lens` + `edges` trong graph + webroot refs | ✅ `--file`/`--graph` shape giữ nguyên (+1 key `edges`) | 5 (reuse scanGraph, no dep) | `entangle.mjs` |
| 4 | GREEN CLI + regen `graph.json` (edges nhúng) | ✅ edges 1613→1732 (+119 webroot) · 192KB | 6 (1 lệnh refresh) | `www/cosmos/graph.json` |
| 5 | Widget 🔭 Lensing trên `scale.html#web` + spec GREEN | ✅ select + hop1/hop2 chips + test set · 375 OK | 2 (reuse `.web-chip`/`.bh-item`) | `www/cosmos/scale.html` |
| 6 | Roadmap swap (Lensing→Cosmic Ray) + slides + 2 spec edits (verify) | ✅ 10 hướng · 6 card giữ nguyên | 6 | `index.html`, `slides.html`, 2 specs |
| 7 | Docs sync + export-claude + Verify full suite + evidence | ✅ **210/210 pass** · gate S=9≤10 · shots 2 | — | `.github/instructions` + skill, `.claude/`, `verify/` |

## Evals rubric (viết TRƯỚC — KN-037) → kết quả

| Tiêu chí | Kết quả |
|----------|---------|
| `--lens --json` hop1/hop2 **khớp tự tính lại từ `graph.json.edges`** | ✅ test 1 (so sorted sets) |
| hop1 chứa ≥1 spec (`tests/`) cho target `www/cosmos/index.html` — chứng minh webroot-refs fix | ✅ specs xuất hiện hop 1 |
| testSet ⊆ blast + đúng pattern test (mirror policy) | ✅ |
| `--hops 1` → chỉ hop 1 · `--out` JSON hợp lệ · thiếu `--file` → exit 1 usage | ✅ tests 2–3 |
| Backward compat `--file` v1 + `--graph` vẫn pass | ✅ cosmos-web.spec xanh |
| scale.html widget: select → out có Hop 1 + test set, no pageerror, 375 không tràn | ✅ test 4 + 2 screenshots |
| Roadmap: 6 card, không còn Lensing trong future, "10 hướng cũ", slides khớp | ✅ future + slides specs |
| Full suite + slop-check | ✅ 210/210 · code mới pass mọi ngưỡng slop |

## Phát hiện & xử lý trong implement (evidence-based)

- **Noise từ artifacts lịch sử:** hop1 49 → 20 sau khi loại edges TỪ `.agent/bugs/` + `.agent/plans/` (mirror `gitClusters`); thêm `.agent/versions/` → 17. Docs sống (`docs/`, `.github/`) giữ — refactor có thể cần update docs.
- **Webroot refs:** specs `page.goto('/cosmos/x')` trước đây rơi khỏi graph (resolve sai về drive root) → fix → edges 1613→1732, test set bắt được spec thật.
- **Bug widget (bắt bởi RED→GREEN):** file ref người khác nhưng không ai ref nó = không phải key `lensRev` → `.size` undefined crash — guard `|| new Set()` (CLI đã guard, browser quên).
- **Slop gate:** `runLens` 87 dòng/CC 37 + `lensRun` CC 14 → extract `parseLensArgs`/`buildRev`/`lensBFS`/`printLensHop` + `resolveRefCand` → code mới pass hết; `forwardRefs` giảm 26→18 (9 findings còn lại = pre-existing, ngoài scope).

## Bounded diff (KN-047)

- Chunk A (script + spec): `entangle.mjs` + `entangle-lensing.spec.ts` + graph.json regen.
- Chunk B (site + roadmap + docs): `scale.html` + `index.html` + `slides.html` + 2 spec edits + docs sync.

## Ghi chú governance

- 3 spec ops (write 1 + edit 2) qua `policy-check --actor verify` → PERMITTED + audit log (KN-012).
- Không dependency mới · không pin `model:` · `--file` v1 + `--graph` shape giữ nguyên (chỉ thêm key `edges`).
- Flake test-env ghi nhận (không phải regression): slides first-test race autoplay dưới 4 workers + server lạnh — đọc đỏ lần 2 (1 worker, server ấm) = xanh (KN-064 quy tầng env).
