# PRD mini — Dream v0 (dream-simulator)

**Task:** `dream-simulator` — "kích hoạt dreaming" thủ công cho harness (Dream-RSI lite — học arXiv:2609.14858, xem KN-067 draft trong `.agent/bugs/2026-09-15-dream-rsi-history-la-simulator-dream-policy-zero-c/`): chấm candidate artifact (biến thể `knowleged.md`) bằng **replay trên history đã ghi — 0 execution** — chỉ deploy winner.

**User story:** Muốn thử sửa `knowleged.md` (viết lại summary/tags/cấu trúc) nhưng sợ "trông hợp lý hơn" mà thật ra làm `suggest` tệ đi (anti-pattern KN-060). Dream cho: 1 lệnh chấm candidate + baseline (π0) trên cùng battery → thấy Δ trước khi commit.

**Cosmic-Quantum:** Macro — history (bug corpus + KN corpus) là simulator của chính nó, không cần dựng world model; Micro — mỗi candidate = 1 hàm sóng, replay collapse thành score; Entanglement — `dream.mjs` ↔ `kn-parse.mjs` ↔ `auto-learn.mjs` (parity scoring) ↔ `tests/e2e/dream.spec.ts`.

**Scope (v0):**
- `dream.mjs score` — battery deterministic: (1) **integrity gate** (dup/orphan/order — KN-066: fail ⇒ score 0), (2) **recall@K** — mỗi bug title trong corpus (KN → `.agent/bugs/<slug>`) phải tìm lại được chính KN của nó qua BM25 (cùng máy với `suggest`), (3) **guards count** (info, không weight — KN-024).
- `dream.mjs run` — nhiều candidate + **π0-in-set ⇒ winner never worse**.
- **No-write guarantee** — không ghi file nào; deploy winner = copy đè thủ công.

**YAGNI gate — CẮT:** generator candidate (agent/người tự tạo file variant) · auto-deploy · LLM-judge scoring · port orchestration layer (K8s/proxy) của Dream-RSI · replay trên artifact không có history-link (skill/instruction — chưa có provenance liên kết, để bề mặt sau khi có nhu cầu thật).
**GIỮ:** score/run + `--json` + npm script `dream`.

**Who did you think with?:** Dissent — "recall@K trên bug title là proxy yếu: title dài/trùng từ, K=3 dễ trúng giả; candidate giữ nguyên title cũ gần như luôn hòa ⇒ dream vô dụng." Phản biện (giữ scope): v0 là probe đầu tiên trả-tiền-sẵn từ history; giá trị thật đến khi candidate **viết lại** title/tags/summary (recall phân biệt được); integrity gate là hard gate thật; và **miss list tự nó là bản đồ recall thật của corpus** (hữu ích độc lập). Giới hạn ghi rõ trong help/output. Nếu đo thực tế thấy phân biệt kém → đo trước, mở probe sau (không mở speculative).

**Non-goals:** auto-write · candidate generator · LLM judge · dashboard.
**Persistence:** N/A (script + plan files — git tracked) · F5: N/A · Scope: repo-wide.

## Acceptance
- [ ] `score` trên corpus thật chạy <2s, in recall + miss list + Δ vs baseline.
- [ ] `run` với mọi candidate ≤ baseline → winner = baseline (π0-in-set).
- [ ] Không ghi file nào (hash bất biến trước/sau).
- [ ] Spec `tests/e2e/dream.spec.ts`: 5 test hermetic (deterministic · phân biệt tốt/xấu · π0-in-set + no-write · gate dup · fail-closed 0 query).
- [ ] Exit code: 0 OK · 1 usage/IO · 2 fail-closed (0 KN parse / 0 query resolve / file không đọc được).
