# PRD — Quantum Decision Lab (⚛️ Lượng tử cho Decision)

Cosmic-Quantum: Macro www/cosmos là vũ trụ con — lab mới là 1 thiên hà trong section #lab · Micro superposition 2 layout (card trong #lab vs trang riêng lab-*.html) → collapse: card trong #lab (reuse design system, 0 file mới) · Entanglement index.html ↔ scale.json ↔ slides.html (tag roadmap)

## Vấn đề
Roadmap "⚛️ Lượng tử cho Decision" (future-card) hứa: dùng **superposition** giữ 3 phương án song song tới khi có data, **decoherence** phát hiện hệ mất kết dính (quá nhiều workaround). Chưa có lab nào mô phỏng decision có data.

## Giải pháp
Thêm lab card thứ 7 vào section `#lab` của `www/cosmos/index.html`:

1. **Superposition Decision** — 3 phương án A/B/C sống song song với amplitude (biên độ). Bấm "Nạp data" → evidence dịch chuyển amplitude (mô phỏng metrics về). Bấm "Collapse" → sụp đổ về phương án thắng theo amplitude (không random mù — data quyết định). "Superposition lại" để reset.
2. **Decoherence Detector** — đồng hồ kết dính (coherence %). Mỗi workaround (HACK/TODO/tạm-thế) làm coherence giảm; quá ngưỡng → cảnh báo decoherence (hệ mất kết dính, phải trả nợ). "Trả nợ" phục hồi. "Đo thật" fetch `scale.json` → coherence tính từ entropy parts thật (mismatch/drafts/refused/failed).

## Scope
- GIỮ: 1 lab card mới + CSS riêng gọn + JS ~120 dòng + cập nhật future-card (✅ Done) + section-head đếm 7 lab + tag slides.html roadmap → shipped.
- CẮT (YAGNI): trang riêng lab-quantum-decision.html, lưu decision vào localStorage, chỉnh sửa tên phương án, AI gợi ý phương án.

## Persistence · F5 · Scope
`Persistence: in-memory (state JS, không lưu) — nhất quán với 6 lab còn lại · F5: reset về superposition/coherence 100% · Scope: per-browser demo`

## Nguồn từ thư viện
Không dùng — kiến thức lượng tử đã có trong docs/cosmic-quantum + KN-018/KN-024.

## Who did you think with?
Dissent (Critic framing): "Lab này có gì khác lab Superposition cũ (đã có Collapse)?" → Khác ở chỗ: lab cũ collapse **random/người dùng chọn**; lab mới collapse **theo data** (amplitude dịch bởi evidence) + thêm nửa decoherence đo hệ thống — đúng tinh thần KN-023 "không đoán — phải đo". Giữ cả hai vì dạy 2 khái niệm khác nhau.
