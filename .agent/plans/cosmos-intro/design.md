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
