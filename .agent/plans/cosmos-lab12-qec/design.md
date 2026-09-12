# Design (mini) — Lab #12 Quantum Error Correction

## Nguyên tắc
Reuse tối đa (Ladder nấc 2): `.lab-card/.lab-head/.lab-body/.lab-demo/.lab-controls/.lab-hint`, `.btn/.btn-primary/.btn-ghost`, tokens cosmos (`--cosmos-accent`, `--font-mono`). Chỉ thêm prefix `.qec-*` (namespace tránh KN-042).

## Palette (kế thừa token trang)
| Vai | Màu | Dùng |
|-----|-----|------|
| Cyan `--cosmos-accent` | #06b6d4 | syndrome đo được, nút primary |
| Đỏ `#f87171` | FAIL / bit-flip / takeover | log + tile flipped |
| Xanh `#6ee7b7` | GREEN / fidelity | log + meter fill |
| Amber `#fcd34d` | workaround (nợ) | log + chip |

## Wireframe (desktop — trong `.lab-demo`)
```
┌──────────────────────────────────────────────────────────┐
│ QUBIT RACK (3 file vật lý = 1 logical qubit)             │
│ ┌────────────┐ ┌────────────┐ ┌──────────────────────┐   │
│ │ Cart.cs    │ │ Cart.Tests │ │ docs/cart.md         │   │
│ │ ● ok       │ │ ● ok       │ │ ● ok                 │   │
│ └────────────┘ └────────────┘ └──────────────────────┘   │
│ SYNDROME RAIL  ● ● ●        → 1 đỏ = biết ai flip         │
│ LOG (mono, aria-live)                                    │
│  21:04 ⚛️ bit-flip: Cart.cs:42 — off-by-one              │
│  21:04 📡 FAIL CartTests.cs:87 → syndrome: Cart.cs:42    │
│  21:05 ✅ GREEN · 1 syndrome → 1 fix gốc                 │
│ STATS   fidelity ████████░░ 83% · clean 3 · blocked 1 ·  │
│         workaround 2                                     │
└──────────────────────────────────────────────────────────┘
```
Controls: `⚛️ Inject bit-flip` · `📡 Đo syndrome` · `🔧 Fix gốc` · `🧪 Sửa test cho pass` · `🩹 Workaround` · `↺ Reset`
Hint: "Thật trong repo: tdd-gate (RED→GREEN) · policy deny-test-mutate · 3-fix limit → takeover".

## States
| State | Điều kiện | Hình |
|-------|-----------|------|
| idle | chưa inject | 3 tile ok, rail xám, fidelity 100% |
| flipped | sau inject | tile lỗi `.flipped` (viền đỏ, rung 1 nhịp 200ms) |
| measured | sau measure | rail 1 đỏ + log FAIL kèm `file:line` |
| repaired | sau fix gốc | tile ok lại, log GREEN, fidelity ↑ |
| blocked | sau "sửa test" | log REFUSED (đỏ) — không đổi trạng thái qubit |
| takeover | workarounds ≥ 3 | banner "🌑 Event horizon", inject bị chặn tới khi Reset |

## Interaction contracts (test bám vào)
- IDs: `#qecState` (aria-live text ngắn), `#qecLog`, `#qecFidFill`/`#qecFidVal` (`role="meter"`), `#qecStats`, tiles `.qec-tile[data-file]` + class `.flipped`.
- Nút: `#btnQecInject`, `#btnQecMeasure`, `#btnQecFix`, `#btnQecTest`, `#btnQecHack`, `#btnQecReset`.
- Log line format giữ ổn định: `⚛️ bit-flip` · `📡 FAIL … → syndrome` · `✅ GREEN` · `⛔ REFUSED (deny-test-mutate)` · `🩹 workaround` · `🌑 Event horizon`.

## Responsive
- ≥768: rack 3 cột; <768: rack 1 cột (tile hàng ngang), log `max-height:120px` scroll, controls wrap.
- Không set `min-width` cứng (bài học KN-042).

## A11y
- Nút là `<button type="button">` có label tiếng Việt; meter `role="meter"` + aria-valuenow cập nhật; log `aria-live="polite"`; tile có `aria-label="<file> — trạng thái"`.
- Không phụ thuộc màu đơn thuần: mọi trạng thái đều có chữ (ok / bit-flip / takeover).
- Reduced-motion: animation rung tile bị tắt qua `@media (prefers-reduced-motion: reduce)`.

## Evals (rubric — KN-037)
Component evals: mỗi nút → 1 hành vi đo được (state + log). E2E evals: luồng inject→measure→fix cho GREEN; luồng hack bị chặn; luồng 3 workaround → takeover. Error analysis: mọi fail cùng loại (selector/log format) phải fix ở pattern, không fix từng test.
