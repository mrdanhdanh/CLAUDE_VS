# Design mini — COSMOS Intro Cinematic

> Tokens reuse 100% từ trang (`--cosmos-*`, fonts, radius) — không thêm màu/font mới ngoài sắc độ đã có.

## Vibe
`cosmic dark cinematic` — void đen → Big Bang → tinh vân hình thành chữ. Không neon rẻ tiền: glow tím `#7c3aed` / cyan `#06b6d4` / vàng `#f59e0b` / hồng `#ec4899` đúng palette trang, nền `#03040c` sâu hơn body để tách tầng.

## Timeline (TOTAL ≈ 5.0s → exit 0.65s)
| t | Phase | Visual |
|---|-------|--------|
| 0.00s | Void | Nền đen tuyệt đối + vignette. Singularity 12px trắng-cyan pulse (scale 1↔1.6, 0.5s) |
| 0.85s | Big Bang | Flash trắng 0.9s (đỉnh 8%) + 240 particle bung hướng tâm (drag .988, fade) + shockwave ring giãn nở |
| 1.35→2.10s | Title | "COSMOS · QUANTUM" từng ký tự: blur(12px)+translateY(24px) → rõ, stagger 45ms; letter-spacing thu .34em→.08em; glow kép tím/cyan; underline sweep |
| 2.35s | Subtitle | "PROCESS LÀ ĐỊNH LUẬT · VERIFY LÀ QUAN SÁT" mono cyan, fade + tracking thu |
| 3.10s | Tagline + hint | "8 phase · 1 vũ trụ · 0 đoán" + hint `Esc` chip |
| 0→4.8s | Progress | Bar đáy 3px, gradient tím→cyan→vàng, width 0→100% linear |
| 5.00s | Exit | overlay scale(1.12) + fade 0.65s → display:none, scroll unlock |

Skip (nút/Esc/click): exit nhanh 0.28s. Reduced-motion: bản tĩnh — title+sub hiện ngay, auto-out 1.8s, không canvas/flash/core/zoom.

## Wireframe (desktop)
```
┌──────────────────────────────────────────────┐
│                                [ ⏭ Bỏ qua ] │  ← top-right, fixed, luôn visible
│                                              │
│                    ✨                        │  ← singularity (0–0.85s)
│                                              │     → burst particles (canvas)
│        C O S M O S  ·  Q U A N T U M         │  ← char stagger + glow kép
│   ─────────────  (underline sweep)  ────────  │
│   PROCESS LÀ ĐỊNH LUẬT · VERIFY LÀ QUAN SÁT  │  ← mono cyan
│        8 phase · 1 vũ trụ · 0 đoán           │
│                                              │
│  ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │  ← progress bar (0→4.8s)
│        Nhấn [Esc] hoặc click để vào ngay     │  ← hint
└──────────────────────────────────────────────┘
```

## States
- Skip: default (ghost + border trắng 8%) · hover (nền sáng hơn, translateY(-1px)) · focus-visible (outline tím 2px) · active (scale .98).
- Hint `kbd`: chip nhỏ mono, border trắng 14%.
- Title char: blur-out → settled (không loop) · `·` vàng pulse nhẹ 2s loop.

## Responsive
- Title `clamp(30px, 7.5vw, 68px)`, 375px: 1 dòng wrap 2 hàng giữa, letter-spacing thu ngắn; skip button thu text còn icon+«Bỏ qua»; canvas DPR-aware (`min(dpr,2)`).
- 768/1280: giữ nguyên nhịp, title to dần theo vw.

## A11y
- `role="dialog" aria-modal="true" aria-label` + focus vào overlay khi mở; background `inert`/`aria-hidden` khi intro chạy; Esc = skip; skip button là control thật (Tab đầu tiên).
- Contrast: title trắng trên #03040c (>15:1); hint #94a3b8 tier >4.5:1; skip text #e2e8f0.
- `prefers-reduced-motion: reduce` → không flash/burst/zoom — chỉ fade.

## Native-first (minimal-ladder)
Canvas API + CSS animations + `requestAnimationFrame` — **0 dependency, 0 file mới ngoài trang**. Không lib particle, không video asset.

---

## V2 — Cinematic upgrade (2026-09-10, refs: planet-nebula / galaxy-swirl / big-bang-flare)

> User: "chưa đủ wao" + 3 ảnh ref → nâng engine từ burst đơn giản lên sequence cinematic 4 tầng.

| Tầng | Kỹ thuật | Ref |
|------|----------|-----|
| **Big Bang** | Core gradient 3 stop + **lens streak ngang** (ellipse kéo giãn 8×/14×) + 14 tia quay chậm + 3 shockwave rings (cam→cyan→trắng) | ảnh 3 (flare cam trắng) |
| **Galaxy swirl** | ~150-420 particles vortex (86% cùng chiều xoáy) + motion streaks 3-frame + **galactic nucleus glow** bền (không tắt sau flash) | ảnh 2 (xoáy xanh-tím-đỏ) |
| **Nebula volumetric** | 20 puff sprites pre-render (6 palette: blue/violet/pink/orange/cyan/cream + noise texture), spawn dạng **đĩa (galactic plane)**, xoáy quanh tâm bằng toạ độ cực, lớn dần | ảnh 1 + 2 (mây khí dày) |
| **Debris** | 10 distant-galaxy sprites (ellipse gradient warm/cool) trôi ra + xoay | ảnh 3 (galaxies nền) |

**Perf budget:** sprite pre-render 1 lần; particle count scale theo diện tích (150-420); DPR cap 2; pixel poll sample center 400×400. **Timeline:** TOTAL 5000→5600ms (thêm thời gian ngắm galaxy). Reduced-motion giữ bản calm cũ (không canvas).
**Verify:** Edge thật 3 mốc (1.2s burst / 2.7s crystal / 4.6s swirl) — screenshots trong `verify/`.

---

## V3 — Narrative upgrade: BOOM → CHAOS → SILENCE → COSMOS (2026-09-10)

> User spec: "không chỉ tăng particle/glow — làm vũ trụ được SINH RA trước mắt". 14 điểm, mỗi effect phải trả lời "vũ trụ đang được sinh ra?".

| # | Điểm spec | Kỹ thuật |
|---|-----------|----------|
| §1 | Big Bang bẻ cong màn hình | Flash sắc (peak ~60ms) + **lens streak như vết cắt** (chỉ 0.35s) + starfield **warp** khi shockwave đi qua (displacement radial band 160px) + storm dust ngắn hạn |
| §2 | 5 depth layers | stars(.08-.42) → debris(.12-.32) → puffs(.16-.62) → spiral(.38-.80) → crystal. Parallax: `screen = center + (world−center)·(1+(cam−1)·depth)` |
| §3 | Spiral arms thật | Polar model `(r, θ, w)`: 3 major + 3 minor arms, `θ = arm + (r/R)·3.05 + gauss·scatter`, density `rFrac^0.68`, `w ∝ 1/(0.3+1.55rFrac)`, 86% cùng chiều; orbit dẹt trục y (.62) |
| §4 | Stellar birth | 16 sao: compress (0.16s ring co) → flare (0.3s, 4-6 tia) → steady point; 28% big có diffraction cross |
| §5 | Nebula flow | Polar orbit + shear (spin/dr) + 5 mây nền lớn (depth .16-.28) |
| §6 | Gravitational lensing | Angular speedup đỉnh ở vành Einstein (`+dt·.010·(1−dR/W)`) + Einstein ring 2 vòng mờ (ellipse .6) quanh nucleus |
| §7 | Title kết tinh | Offscreen canvas render glyph → sample alpha step 3px → ≤500 particle bay từ đĩa galaxy về đúng pixel chữ (easeOutCubic + delay + trail); crossfade DOM chars với **collapse flash** (glow trắng → đặc) |
| §8 | Silence | Envelope 2.05-2.30s: `sin(p·π)` → dim 62% tất cả + nền tối thêm 34% |
| §9 | Light sweep | Dải gradient mảnh (skewX −18°, mix-blend screen) chạy 1 lần lúc 3.5s |
| §10 | Dot quantum | box-shadow 2 copies: tách → orbit → merge (0.62s, 1 lần lúc 3.42s) |
| §11 | Micro-stars procedural | birthT 0.95-3.5s (14% sinh muộn), 95% mờ / 4% dim / 1% bright + diffraction; pop khi sinh |
| §12 | Camera move | `camAt(T)`: 1.00 → 1.02 (bang) → 1.00 → 1.015 → 1.035 → 1.06 (peak 4.6s) → 1.04; collapse +0.025 |
| §13 | Fly-through | ~10 streak screen-space (3.0-5.05s), radial outward, len 24→134px, alpha sin envelope |
| §14 | Exit collapse | Auto-finish → 560ms "universe → one point": spiral `r ×= 0.90^dt`, spin ×2.6, nucleus collapse flash; skip = instant (bỏ collapse) |

**Timeline V3:** BOOM .85 → CHAOS .88-2.05 → SILENCE 2.05-2.30 → CRYSTAL 2.30-2.85 → COSMOS 2.9-3.5 (chars 2.9 + i·.045) → sweep 3.5 · dot-quantum 3.42 · sub 3.7 · tagline 3.9 · hint 4.05 → camera peak 4.6 → collapse 5.6 (+560ms) → fade → mở trang ≈ 6.9s.
**Verify:** Edge thật 4 mốc (1.2 burst / 2.7 crystal / 3.5 title / 4.6 peak) + no-pageerror (KN-032) — full suite 12/12.
**Nguyên tắc (user):** "Không thêm hiệu ứng chỉ để nhiều hơn — mỗi effect phải làm vũ trụ như đang được sinh ra."

---

## V4 — BOOM → MATTER → GRAVITY → LIFE → INTELLIGENCE (2026-09-11)

> User đọc code thật + chấm ưu tiên: ① galaxy hero silhouette ★5 P0 · ② big bang distortion ★5 P0 · ③ crystal 3-stage ★5 P0 · ④ first light ★5 P1 · ⑤ camera inertia ★4 P1 · ⑥ quantum observation ★5 P1 · **KHÔNG thêm particle/glow**. Narrative mới foreshadow Cosmic Calendar phía dưới (Big Bang → … → Heavy Elements).

| Chương | t | Visual |
|--------|---|--------|
| SINGULARITY | 0–0.70 | void + **pre-stars 34%** (không gian có trước) + core pulse |
| SPACE CONTRACTS | 0.70–0.845 | pre-stars co vào tâm ×(−7.5%), dim 42%, nền tối thêm 30% |
| BOOM | 0.845–0.95 | **WHITE CUT ~90ms** (full-screen trắng, decay bậc 2) + flare ngắn 0.55s + lens streak 0.22s |
| MATTER | 0.9–1.9 | shockwave có lực (glow rộng ×5 + lõi sáng, sống tới ~1.5s/vành); **star warp push 52 + flash khi sóng quét qua**; **debris reaction** (impulse ×2 + flash khi bị sóng đập); storm tắt ~1.9 |
| GRAVITY | 1.05–2.05 | spiral hình thành nhanh (spawn 1.05–1.43, form .5s) → **hero silhouette window 1.4–2.05** (`heroAt`: arms ×1.32, nucleus ×1.35) |
| SILENCE | 2.05–2.30 | envelope cũ (dim 62% + nền tối 34%) |
| INTELLIGENCE | 2.30–2.94 | **crystal 3 stage**: edge ≤ ~2.52 (outline + lattice shimmer) → inner ≤ ~2.80 (fill) → white collapse flash 2.76–2.94 (dải chữ + vết cut ngang) + DOM chars solidify (stagger .014s, .3s/char) |
| FIRST LIGHT | 2.83–2.99 | `galDim ×(1−.42·fl)`, nucleus ◉ → ✦ (sparkle 2.90–2.99), **pulse trắng chạy xuyên chữ** (`.intro-firstlight` sweep 2.96s + .22s, mix-blend screen) |
| QUANTUM | 2.95–5.6 | 88 hạt nhiễu quanh chữ (superposition, flicker + orbit noise) → **3.72s collapse** thành 2 hàng × 44 điểm cyan (`.introDbg.qProg` 0→1 trong .22s), rồi trật tự giữ nguyên — "verify là quan sát" |

### Galaxy silhouette — density field (không vẽ ellipse)
- `R_EDGE = mDim×0.47`; `edgeF = 1−clamp01((rFrac−.82)/.16)` → vành cắt rõ, ngoài edge tắt hẳn
- **2 nhánh lớn grand-design (180°)** + 2 nhánh phụ (30% subset) + **14% dust field** (α .10–.24) → dark lanes tạo tương phản
- `PA = −0.35 rad` (nghiêng tự nhiên); plane squash `.62` giữ nguyên; wind-up 3.05 rad giữ nguyên
- α contrast: major `.66–1.0` · minor `.45–.75` · dust `.10–.24` (× edgeF) → silhouette đọc được ở 1.4–2.0s

### Camera vật lý (inertia — thay timeline cứng)
`camTarget(t)`: kick **1.034** @0.85 → settle **1.004** @2.30 (hero window) → **1.026** @3.60 → peak **1.058** @4.60 → 1.046; spring `camVel += Δ×.020×dt; camVel ×= .86^dt; cam += camVel×dt`, clamp [0.995, 1.13] → overshoot nhẹ (~4‰) khi kick. Debug hook: `window.__introDbg` (getters: T, cam, camTarget, qProg, cloudN).

### Verification (Evals Gate — KN-037)
- Script mới: `.agent/plans/cosmos-intro/verify/v4-verify.mjs` (self-serve static server + chromium, stub fonts) — viết TRƯỚC (RED) rồi GREEN.
- Asserts: `__introDbg` tồn tại · cam kick/settle/push ranges · cam tăng 3.5→4.6s · qProg 0→1 · canvas invariant (KN-028) · no pageerror (KN-032) · reveal hoàn tất.
- Screenshots: 0.6 / 0.8 / 1.25 / 1.7 / 2.0 / 2.5 / 2.7 / 2.95 / 3.1 / 3.5 / 4.6 / 4.9 → `verify/v4-*.png`.
- **Rubric hero-frame (4.6s)** — phải đạt ≥4/5: [ ] silhouette galaxy đọc được [ ] nhân sáng [ ] nebula có chiều sâu [ ] text sạch giữa [ ] có chuyển động nền.
- Regression: chạy lại `cosmos-intro.spec.ts` + `cosmos-intro-edge.spec.ts` (chromium + msedge) — không sửa assertion cũ.

### Giữ nguyên (không đụng)
Skip/Esc/click + grace 1000ms · focus/inert a11y · reduced-motion calm fade (KN-031) · fail-safe 9s head gate (KN-029) · total 5600ms + collapse 560ms + fade 650ms · dot-quantum 3.42 · underline 3.5 · sub 3.7 · tagline 3.9 · hint 4.05 · flyers 3.0–5.05.

### Kết quả verify V4 (2026-09-11) — GREEN
- `node .agent/plans/cosmos-intro/verify/v4-verify.mjs` → **12/12 pass** (lần đầu RED 4/11 fail — đúng TDD gate).
- Đo được: kick **1.0273** → settle **1.0256** (@2.0s) → push **1.0463** (@4.6s); qProg 0→1; cloud 88; 0 pageerror; canvas invariant giữ (KN-028).
- Evidence frozen 12 stage (freeze(ts) debug hook — screenshot không trôi): 0.6 void · 0.8 singularity swell · 1.25 wavefront+storm · 1.7 spiral hình thành · **2.0 galaxy silhouette ✓** · **2.52 crystal outline bằng hạt ✓** · 2.72 fill · 2.93 solidify wave + cut line · 3.16 first-light aftermath · 3.55 noise · **4.6 hero shot 5/5 ✓** · 4.9 ordered rows.
- Rubric hero-frame 4.6s: [x] silhouette galaxy [x] nhân sáng [x] nebula depth [x] text sạch giữa [x] chuyển động nền = **5/5**.
- Regression: `cosmos-intro.spec.ts` + `cosmos-intro-edge.spec.ts` **11/11 pass** (chromium + msedge, fonts treo, reduced-motion, 375/768); `cosmos-observatory/freshness/future` **6/6 pass**.
- Fix loop: 1 vòng (sparks ra halo + bulge cluster + streak 26→18 — sau khi soi rubric 2.0s thấy "confetti").
