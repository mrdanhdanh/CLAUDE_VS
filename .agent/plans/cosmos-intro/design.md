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
**Verify:** Edge thật 3 mốc (1.2s burst / 2.4s title / 4.6s swirl) — screenshots trong `verify/`.

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
**Verify:** Edge thật 3 mốc (1.2s burst / 2.4s title / 4.6s swirl) — screenshots trong `verify/`.
