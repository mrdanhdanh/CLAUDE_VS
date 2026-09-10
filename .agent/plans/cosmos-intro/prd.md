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
