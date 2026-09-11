# PRD mini — COSMOS Intro Cinematic

- **Task:** Thêm intro cinematic "Big Bang → Reveal" cho `www/cosmos/index.html` — che toàn bộ nội dung, chạy xong mới mở, có nút Skip.
- **Ngày:** 2026-09-10 · **Owner:** YUNIE / sếp
- **Cosmic-Quantum:** Macro: intro = "Big Bang" của vũ trụ con `www/cosmos/` · Micro: trạng thái intro (playing/skipped/finished) sụp đổ 1 lần, đo được bằng Playwright · Entanglement: `www/cosmos/index.html` (1 file, inline CSS+JS theo convention trang)

## User stories
1. Là visitor, mở `www/cosmos/index.html` → thấy màn intro vũ trụ che kín nội dung: singularity → Big Bang (particle burst) → tên trang hiện từng ký tự → tagline → tự mở trang.
2. Là visitor vội, tôi bỏ qua intro bất cứ lúc nào: **nút "Bỏ qua"** (góc phải trên), **phím Esc**, hoặc **click bất kỳ đâu** — vào trang ngay ≤ 0.4s.

## Scope (GIỮ)
- Overlay `position:fixed` z-index 1000, nền opaque che hết content + scroll lock.
- Timeline CSS + canvas particles (native Canvas, 0 dependency): singularity pulse → flash + burst + shockwave → title stagger theo ký tự → subtitle → tagline + hint.
- Auto-reveal ~5.0s (exit zoom+fade 0.65s) · progress bar · hint "Esc để vào ngay".
- A11y: `role=dialog aria-modal`, focus vào intro, Esc, `inert` background, `prefers-reduced-motion` → bản tĩnh ngắn (1.8s, không flash/particle/zoom).
- No-JS fallback: không hiện intro (gate bằng class `intro-on` trên `<html>` set từ head script — tránh flash cả 2 chiều).

## Non-goals (CẮT — YAGNI, minimal-ladder)
- ❌ Sound/audio · ❌ Replay button · ❌ sessionStorage "chỉ chơi 1 lần" (giữ làm option tương lai, không bật) · ❌ Tách file CSS/JS riêng (trang đang single-file) · ❌ Áp dụng cho `slides.html` hay trang khác.

## Persistence · F5 · Scope
`Persistence: none (không lưu storage) · F5: intro replay mỗi lần tải (đúng yêu cầu demo) · Scope: per-load`
> Alternative đã cân nhắc: sessionStorage "once per session" — nếu sếp thấy replay phiền thì bật 1 dòng.

## Dissent Review (KN-018)
- **Who did you think with?:** Critic framing — "splash chặn nội dung là anti-pattern kinh điển (NN/g); Apple/Linear reveal bằng scroll, không chặn."
- **Đối trọng đã xử lý:** đây là yêu cầu chủ đích (trang triết lý/demo) → giảm hại bằng: tổng thời gian ngắn (5s), Skip nổi bật + Esc + click, reduced-motion được tôn trọng, no-JS không chặn.
- **Assumption có thể sai:** "5s là vừa" — nếu sếp thấy dài, sửa 1 hằng số `TOTAL_MS`.

## Acceptance criteria
- [ ] Overlay phủ kín viewport khi load (elementFromPoint tại 4 góc + tâm đều thuộc `#intro`).
- [ ] Auto-reveal sau ~5.0s (+exit): `html.intro-on` gỡ, `#intro` hidden, scroll mở lại.
- [ ] Skip (click nút / Esc / click overlay) → reveal ≤ 0.5s.
- [ ] `prefers-reduced-motion: reduce` → không particle/flash/zoom, reveal ≤ 2.5s.
- [ ] 375/768/1280: không tràn ngang, nút skip luôn thấy & bấm được.
- [ ] `get_errors` sạch; Playwright spec `tests/e2e/cosmos-intro.spec.ts` pass.

---

## V4 — Directorial upgrade (2026-09-11)

> Input: review code thật + 6 hạng mục ưu tiên (3×P0 + 3×P1). **Không thêm particle, không thêm glow** — đạo diễn lại motion + 3–4 visual event mạnh. Narrative mới khớp Cosmic Calendar phía dưới trang: **BOOM → MATTER → GRAVITY → LIFE → INTELLIGENCE**.

### User stories V4
1. Là visitor, tôi thấy **Big Bang có lực**: không gian co lại → WHITE CUT ~90ms → sóng xung kích bẻ cong hạt (star warp + debris reaction) — không phải "particle burst".
2. Ở **1.4–2.0s** tôi thấy **một thiên hà thật** (silhouette rõ: 2 nhánh lớn grand-design + 2 nhánh phụ, vành cắt rõ, nhân sáng ◉) — không phải "đám hạt xoáy".
3. Title hình thành theo **3 giai đoạn**: hút → outline tinh thể (edge pixels) → fill → white collapse → chữ trắng hoàn chỉnh ("được tạo ra", không phải text animation).
4. **First Light** (2.83–2.99s): galaxy mờ đi, nhân ◉ → ✦, pulse trắng cực mềm chạy xuyên chữ (~140–220ms) — signature shot.
5. **Camera có quán tính**: kick lúc Big Bang (overshoot nhẹ), lùi về cho galaxy đọc rõ, rồi bay vào chậm — camera vật lý, không timeline cứng.
6. **Quantum Observation**: nhiễu hạt quanh chữ (superposition) → đúng lúc subtitle "Verify là quan sát" hiện, nhiễu **sụp đổ thành 2 hàng điểm trật tự** cyan — biến slogan thành hành động thị giác.
7. Frame **4.6s là hero shot**: galaxy sống, nhân sáng, nebula sâu, flyer bay qua camera, COSMOS · QUANTUM sạch ở giữa — screenshot phải đọc được "đây là một vũ trụ".

### Acceptance criteria V4 — ✅ 2026-09-11
- [x] WHITE CUT ≤ 120ms + pre-bang contraction đo được — screenshot frozen `v4-0800-contract.png` (singularity swell + dim) ✓
- [x] Camera: kick vùng 1.0–1.4s cam > 1.02 (đo 1.0273) · settle ≈ 1.02 @2.0s · push > 1.035 @4.6s (đo 1.0463, Δ 3.5→4.6s = +0.028) ✓
- [x] `__introDbg.qProg` = 0 trước 3.72s (đo 0 @3.5s), = 1 sau ~3.95s (đo 1 @4.6s), cloud 88 hạt ✓
- [x] Screenshot 2.0s đạt rubric "reads as a galaxy" ✓ (2 nhánh grand-design + nhân sáng + vành rõ); screenshot 4.6s đạt rubric hero-frame 5/5 ✓
- [x] No pageerror/console error (metrics + 12 evidence pages); suite cũ 11/11 + 6/6 spec cosmos khác ✓
- [x] Reduced-motion: không đổi hành vi (Edge spec pass, fade-only) ✓

### Non-goals V4 (CẮT — user explicit)
- ❌ Thêm particle / thêm glow · ❌ viết lại engine · ❌ đổi tổng thời lượng 5.6s + exit 560ms · ❌ sửa test cũ (chỉ thêm script verify mới)

### Persistence · F5 · Scope
`Persistence: none · F5: replay mỗi lần tải · Scope: per-load` (không đổi so với V1)

### Dissent Review (KN-018)
- **Who did you think with?:** Critic framing — "title solidify nhanh (0.3s) có thể mất chất 'từng ký tự kết tinh' của V3; silhouette galaxy 2 nhánh có thể trông 'ít sao' hơn 6 nhánh".
- **Đối trọng đã xử lý:** giữ stagger nhỏ (.014s, không zero) để còn nhịp; giữ minor arms + dust field để không mất độ dày; verify bằng screenshot 2.0s + 4.6s trước khi chốt.
- **Assumption có thể sai:** "2 major arms đọc ra galaxy nhanh hơn 3+3" — nếu screenshot phản đối, đổi hằng số MAJ/MIN (1 dòng).
