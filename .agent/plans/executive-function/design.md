# Design — Executive Function × Harness (KN-054)

Design vibe: house **cosmic dark** (đồng bộ `www/waymo-effect/`, `www/styles.css`) · tham chiếu `linear.app` (dark product, calm — score 4.0) + `airtable` (sober editorial — score 5.0) từ `awesome-design-md/search.mjs` · Format: single-file HTML, 0-dep.

## Design System (tokens)
```css
--bg:#0b0f1a; --bg-card:#131a2b; --bg-card-2:#1a2338;
--text:#e8ecf4; --text-dim:#94a3b8;
--accent:#6366f1; --accent-2:#ec4899; --accent-3:#f59e0b;
--brain:#22d3ee;   /* cyan — accent riêng cho EF/neuron */
--ok:#10b981; --warn:#f59e0b;
--border:rgba(148,163,184,.18); --radius:16px; --space:8px;
```
- Typography: Inter (body) · Plus Jakarta Sans (display) · JetBrains Mono (code/kicker) — như house.
- Spacing: thang 8px · Radius: 16px card, 10px button, 999px pill.
- Animation: 150–300ms (transform/opacity), tôn trọng `prefers-reduced-motion`.

## Wireframe (mobile-first, 375 → 768 → 1280)
```
┌ Header sticky: [Y] EXECUTIVE FUNCTION · KN-054        [← STATUS] ┐
├ Hero: kicker 🧠 · H1 "ADHD không thiếu chú ý. Thiếu khung xương."
│   lead + 3 chips (6 EF · KN-054 · 0-dep)                          │
├ §1 ADHD 60 giây: 3 cards 3 dạng + 2 callout "hiểu sai thường gặp" │
├ §2 EXPLORER (interactive): [tablist 6 EF] ┆ [tabpanel]
│      panel: Định nghĩa → Khi yếu → Harness đã có → Vì sao (externalize)
├ §3 Agent cũng "ADHD": table failure mode ↔ guardrail (6 hàng)
├ §4 LAB: stepper (1 Nhớ → 2 Nhiễu → 3 Nhớ lại → Kết quả)
│      phase panels + progress bar + aria-live                       │
├ §5 Bộ luật EF: checklist những gì đã thêm vào harness              │
├ §6 Nếu bạn có ADHD: 5 tips dùng harness                            │
└ Footer: nguồn + disclaimer y khoa + KN-054                         ┘
Dots nav phải (fixed, ≥768px): 6 chấm, IO threshold:0 + fail-safe click.
```

## Explorer — 6 EF ↔ cơ chế harness (nội dung chuẩn)
| EF | Khi yếu | Harness đã có (cơ chế thật) |
|----|---------|------------------------------|
| Ức chế | blurting, phá rule | `policy.json` deny-first + fail-closed; 3-fix limit |
| Working memory | quên giữa chừng | `manage_todo_list`, `.agent/plans/`, `knowleged.md` |
| Điều tiết cảm xúc | panic khi lỗi | error handling 3 cấp, escalation, fresh-eyes tiered |
| Khởi động | mãi không bắt đầu | pipeline 8 phase, "1 next step", micro-win |
| Lập kế hoạch | scope phình, deadline trôi | PRD→Design→Plan, ≤200 LOC diff, scope control |
| Tự giám sát | tưởng xong nhưng chưa | verify + evals gate (KN-037) + slop gate (KN-047) + `get_errors` |

## Lab — state machine "Working memory bị chiếm"
```
idle ──Bắt đầu──▶ memorize (6s, 4 từ: hạt · đèn · sông · chuông, progress bar + countdown)
memorize ──hết giờ──▶ quiz (3 câu toán MCQ — distractor; ghi rõ "không tính điểm")
quiz ──đủ 3 câu──▶ recall (1 input: gõ các từ nhớ được)
recall ──Kiểm tra──▶ result (score x/4 + chips từng từ nhớ/quên + thông điệp externalize)
result ──Làm lại──▶ idle
```
- Từ cố định (deterministic cho test), không random.
- Quiz options cố định: `7+5∈{11,12,13}`, `9−3∈{5,6,7}`, `6+8∈{13,14,15}`.
- Scoring: normalize lowercase → tách `,|;|khoảng trắng` → giao với set 4 từ → đếm.
- Kết quả luôn kèm message: "Đây là lý do `.agent/plans/` tồn tại — não bạn không hỏng, nó chỉ giữ quá nhiều. Hệ thống ghi ra đĩa."

## States (đủ)
- Tab: default / hover / focus-visible / `aria-selected` (viền accent + nền sáng) / panel fade 150ms.
- Lab: idle → active phases → done; nút disabled khi chưa đủ điều kiện; countdown bar animate đều; result có score lớn + chips.
- Không có fetch → không cần error state network; `<noscript>` nhắc JS cho lab; tabs vẫn hoạt động không JS? (không — ghi noscript note).

## a11y contract (KN-050)
- Mọi control là `<button>` thật, target ≥44px, focus-visible outline.
- Tablist: `role=tablist/tab/tabpanel`, `aria-selected`, `aria-controls`, keyboard ←/→/Home/End.
- Lab: `aria-live="polite"` cho chuyển phase + kết quả; focus chuyển vào vùng lab khi phase đổi.
- Contrast ≥4.5:1 (text-dim #94a3b8 trên #0b0f1a ≈ 7:1; brain #22d3ee trên nền tối đạt).
- `prefers-reduced-motion`: tắt slide/fade, vẫn đổi trạng thái đúng.

## Tests (invariants — KN-046/047)
1. No pageerror; title đúng; link `../index.html` resolve.
2. Tablist: đủ 6 tab; click/ArrowRight đổi panel (heading đổi, aria-selected đúng); mọi tab có `aria-controls` trỏ panel tồn tại.
3. Lab full flow: start → recall (timeout 10s) → nhập "hạt đèn sông chuông" → "4/4"; làm lại → nhập "hạt đèn" → "2/4".
4. Responsive 375: `scrollWidth − clientWidth ≤ 2`; tablist không tràn.
5. Mọi section có `id` được dots nav trỏ tới (invariant "target phải resolve" — KN-046).
