# Design — Quantum Decision Lab

Vibe: cosmic dark (giữ nguyên design system của index.html — palette tím/cyan/hổ phách, Inter + Plus Jakarta Sans + JetBrains Mono, radius 12-16, spacing 4/8).

## Layout (trong lab-card, mobile-first)
```
┌─ lab-head: ⚛️ Quantum Decision — Superposition + Decoherence [badge: Decision]
├─ lab-body
│  ├─ p: giải thích 2 khái niệm
│  ├─ lab-demo
│  │  ├─ .qd-options: 3 option card ngang (dọc ở portrait)
│  │  │  └─ mỗi card: tên A/B/C + amplitude bar + % + trạng thái (song song/collapsed)
│  │  ├─ .qd-divider
│  │  └─ .qd-coherence: đồng hồ coherence (bar + %) + danh sách workaround signals
│  ├─ lab-controls: 📊 Nạp data · ⚡ Collapse · ↺ Superposition lại | 🧩 Thêm workaround · 🧹 Trả nợ · 📡 Đo thật
│  └─ lab-hint (aria-live)
```

## States
- **Superposition**: 3 card đều sáng, amplitude bar dao động nhẹ (animation), nút Collapse primary.
- **Collapsed**: card thắng glow tím + scale 1.05, 2 card mờ 0.35 + grayscale; hint hiện "data → A thắng".
- **Coherent**: bar xanh lá ≥70%, vàng 40-70, đỏ <40 + rung nhẹ khi decoherence.
- **Decoherence**: bar đỏ + cảnh báo "⚠️ Hệ mất kết dính — trả nợ trước khi thêm feature" (role=alert).
- **Đo thật**: badge loading → coherence từ scale.json (S parts), hint hiện số liệu thật.

## A11y
- Option card: `role=button` + tabindex + Enter/Space.
- Coherence bar: `role=meter` + aria-valuenow/min/max + aria-label.
- Hint: `aria-live=polite`. Cảnh báo decoherence: `role=alert`.
- Contrast: chữ trên nền tối ≥4.5:1 (dùng màu text hiện có).
- `prefers-reduced-motion`: tắt dao động amplitude + rung.

## Animation
- Amplitude dao động: 2.4s ease-in-out infinite (opacity/transform only).
- Collapse: 300ms cubic-bezier(.22,1,.36,1) — scale + glow.
- Coherence bar: width transition 250ms.
