# PRD — Escape Velocity: Gate theo đà S

> Roadmap card #2 ("Khai thác tương lai" → `cosmic-scale.mjs --trend N`) — ship 2026-09-12.
> Pipeline: `/harness` rút gọn (Explore quick → Clarify → PRD → Design → Plan → Implement → Polish → Verify).

## Vấn đề

`--budget` chặn feature theo **mức** S (Heat Death gate: S > ngân sách → exit 1). Nhưng nợ thường bắt đầu bằng **đà**: S tăng đều qua nhiều lần đo (mỗi lần push thêm 1 draft/mismatch) mà chưa vượt ngưỡng nào — tới lúc vượt mức thì đã trễ. Thiếu gate theo **vận tốc thoát** (escape velocity).

## Giải pháp (scope GIỮ)

- `cosmic-scale.mjs --trend N`: exit 1 khi S **tăng liên tiếp ≥ N lần đo** (mỗi bước ΔS ≥ 1, so với chính lần đo trước qua `history` trong scale.json). Không có `--trend` = chỉ ghi data + in đà, **không** gate.
- `scale.json` (và `--json` output) **luôn** có `trend: {increases, needed, gate, window[]}` — kể cả lần chạy refresh thường → UI data-driven (KN-030: mirror data trong `www/`).
- `scale.html#escape`: section 🚀 **Vận tốc thoát nợ** — đà hiện tại / cửa sổ đo gần nhất / trạng thái gate.
- `npm run cosmos:gate` = `--trend 3 --budget 10` — 1 lệnh kiểm tra trước khi thêm feature (mức + đà).
- Đồng bộ: roadmap `index.html#future` (gỡ card → "8 hướng cũ đã ship"), slides `#slide-15`, instructions/SKILL/README.

## Non-goals (CẮT — YAGNI)

- ❌ `--trend-delta D` (ngưỡng Δ mỗi bước) — "tăng nghiêm ngặt" đủ; thêm knob = phình config không có use case thật.
- ❌ Tự chạy gate trong `cosmos:refresh` — routine daily sẽ **fail-giả** khi đà lên đúng lúc; gate phải là hành vi tường minh lúc chuẩn bị feature (explicit > implicit).
- ❌ Notification/Slack/auto-issue — exit code + UI + audit đủ.
- ❌ Backfill card mới để giữ "6 đề tài" — đếm thật **5 đề tài** còn lại (honesty > vanity).
- ❌ Lưu trend riêng theo file/ngày — `history` đã nằm trong scale.json commit.

## Acceptance (rubric viết TRƯỚC — KN-037)

| # | Tiêu chí | Đo bằng |
|---|----------|---------|
| 1 | Gate nổ đúng: S tăng 3 lần liên tiếp → exit 1 + "ESCAPE VELOCITY" + chặn feature | CLI test (history dựng temp deterministic) |
| 2 | Không false positive: đà 3 < needed 4 → exit 0; history đi ngang/giảm → exit 0 | CLI test |
| 3 | `trend` luôn có trong output (kể cả không `--trend`) — gate:false không làm exit 1 | CLI test |
| 4 | Thiếu history (file chưa tồn tại) → increases 0, không crash | CLI test |
| 5 | `scale.html#escape` render từ data thật: advice khớp `increases/needed`, chips = window | UI test so scale.json |
| 6 | `gate:true` → UI hiện trạng thái ⛔ chặn (mock route) | UI test route-intercept |
| 7 | 375px không tràn ngang + 0 pageerror | UI test |
| 8 | Docs sync: roadmap 5 card/"8 hướng cũ", slides shipped-line có Escape Velocity + 5 chip, grep thấy `--trend` trong instructions/SKILL/README | grep + specs |

## Persistence · F5 · Scope

`Persistence: www/cosmos/scale.json (commit file + routine daily refresh) · F5: giữ (data commit, UI fetch no-store) · Scope: global (mọi người xem cùng số)`.

## Cosmic-Quantum

Macro: gate theo đà nối tiếp Heat Death gate trong pipeline (process = định luật) · Micro: exit 1 = sụp đổ trạng thái gate (đóng) · Entanglement: `cosmic-scale.mjs` ↔ `scale.json` ↔ `scale.html#escape` ↔ `index.html#future` ↔ `slides.html` ↔ instructions/SKILL/README ↔ tests.

## Who did you think with? (Dissent Review — KN-018)

- **Rival framing #1:** ship **CMB Anisotropy** trước (user nhắc tên đầu). Phản biện: CMB là **bản đồ** (informational — "điểm lạnh" heuristic mờ, rủi ro vanity metric như dissent Hawking trước đây), Escape Velocity là **gate** (exit code, fail-loudly, ép trả nợ — đúng nguyên lý "exit condition là command"). Queue order cũng xếp Escape Velocity trước CMB. → CMB là card kế tiếp, ship sau.
- **Assumption có thể sai:** "đà tăng liên tiếp là tín hiệu tốt" — nếu lịch sử đo thưa (routine tuần/ngày), streak ≥3 hiếm khi đủ. Chấp nhận: gate cố tình conservative (thà bỏ sót còn hơn false-positive chặn oan — 1 điểm đi ngang là reset đà); giá trị thật lộ khi 1 ngày push nhiều lần (refresh theo commit).
- **Framing #3 (ngoài phạm vi yêu cầu):** gate theo **độ dốc trung bình** (slope hồi quy) thay vì streak — bác bỏ: khó giải thích, 1 điểm tụt lớn bù được (dễ lách); "N lần liên tiếp" đọc được bằng mắt từ chính UI + window chips.

## Nguồn

Roadmap card #2 trong `www/cosmos/index.html#future` (2026-09-12). KN-018 (Dissent), KN-030 (mirror data), KN-037 (evals), KN-047 (diff ≤200 LOC production).
