# PRD (mini) — Cosmic Web · Entangle v2

- **Ngày:** 2026-09-12 · **Actor:** YUNIE · **Nguồn:** user "ship tiếp đề tài roadmap kế" (card #1 `index.html#future-grid`: "🕸️ Cosmic Web — Entangle v2 · → Q4 2026 · entangle.mjs --graph + scale.json").
- **Cosmic-Quantum:** Macro — repo là vũ trụ, `entangle --graph` dựng **mạng nhện vũ trụ**: hub (nút nóng), cluster (cụm thiên hà đổi cùng nhau), dead filament (sợi tắt) · Micro — mọi số đo từ scan thật + git log, render trên dashboard · Entanglement — `entangle.mjs` ↔ `www/cosmos/graph.json` ↔ `scale.html` ↔ `cosmos-future.spec.ts`/`cosmos-slides.spec.ts` ↔ `package.json cosmos:refresh`.

## Vấn đề (evidence-based)
| # | Vấn đề | Bằng chứng |
|---|--------|-----------|
| 1 | `entangle.mjs` v1 chỉ trả lời **1 file**: forward/reverse refs — không thấy **cấu trúc lớn** (file nào là hub? cụm nào đổi cùng nhau? file nào mồ côi?) | `entangle.mjs:109` usage chỉ có `--file` |
| 2 | Reverse refs v1 là **O(n²)** (mỗi lần gọi quét lại toàn repo) → không thể dùng cho phân tích toàn cục | `reverseRefs()` walk toàn repo per target |
| 3 | Kiến thức "sửa là test rộng" / "code chết" nằm trong đầu dev, **không đo được** trên dashboard | roadmap card #1 chưa ship |
| 4 | Card roadmap hứa "6 đề tài mới" — giờ còn 6 nhưng #1 đã tới hạn Q4; trước sau gì cũng phải ship | `index.html:1865` future-grid |

## Giải pháp
1. `entangle.mjs --graph` — **1-pass scan** toàn repo → indegree → **hubs** (≥10 refs: sửa là phải test rộng) · **git co-change** (≥3 lần cùng commit, union-find) → **clusters** (gộp 1 plan) · `www/**` indegree 0 → **dead filaments** (grep usage rồi xoá — minimal-ladder).
2. Output `www/cosmos/graph.json` (mirror trong `www/` — KN-030), chain vào `npm run cosmos:refresh`.
3. Section **🕸️ Cosmic Web** trên `scale.html` (sau Timeline): 3 card Hubs / Clusters / Dead filaments + số đo thật + fresh badge + hint hành động.
4. Roadmap: Cosmic Web → "đã ship"; thêm card mới **🌐 Gravitational Lensing — Blast radius 2-hop** (Q1 2027) — v3 dùng chính graph này.

## Non-goals (YAGNI — CẮT)
- CẮT: vẽ force-graph SVG/canvas (list + chips đủ; canvas đã có timeline).
- CẮT: đụng `cosmic-scale.mjs` / `scale.json` — graph là artefact riêng (`graph.json`), không nhồi vào entropy.
- CẮT: thêm dependency (git qua `execFileSync` built-in).
- CẮT: 2-hop lensing (đó là card mới — không nhét vào v2).
- CẮT: đổi hành vi `--file` v1 (backward compat 100%).

## Persistence · F5 · Scope
`Persistence: none (graph.json sinh bởi script, commit như scale.json) · F5: n/a (read-only) · Scope: static GitHub Pages www/`

## Who did you think with? (Dissent — KN-018)
- **Framing đối lập:** *"Graph là vanity metric — đẹp để khoe, không ai dùng; Hawking Radiation (nợ tự phân rã) có ROI cao hơn."* → **Follow-up 2026-09-12 (user yêu cầu "xử lý"):** dissent được **hành động hoá** — ship Hawking watchdog ngay sau đó (`.agent/plans/cosmos-hawking/`). Không để dissent nằm trong reply (KN-018: không fake dissent). Xử lý gốc: (1) tôn trọng queue order — card #1, có ETA Q4 gần nhất; (2) **buộc mỗi số đo map 1 hành động verify đang tồn tại**: hub ⇒ `entangle --file` + test rộng (Verify phase), cluster ⇒ gộp plan, dead ⇒ grep + xoá (minimal-ladder §Verify) — không phải metric trang trí; (3) unblock card Lensing làm đề tài kế. Hawking vẫn nguyên trong roadmap.
- **Rival đã cân nhắc:** đo coupling bằng `git log --numstat` churn (khối lượng thay đổi) → chọn **co-change** (thay đổi *cùng nhau*) vì trả lời đúng câu hỏi coupling; churn chỉ đo to/nhỏ.

## Acceptance (Evals rubric — viết TRƯỚC, KN-037)
- [ ] `entangle --graph --json`: status 0 · JSON parse · `hubs` sorted desc, mọi `refs ≥ 10` · `clusters` mỗi cụm ≥3 file, weight ≥3 · `deadFilaments` đều `www/`, không `index.html` · counts khớp độ dài mảng.
- [ ] `--out <path>` ghi file JSON hợp lệ.
- [ ] `--file` v1 không đổi (regression: usage + output shape cũ).
- [ ] `scale.html`: section Cosmic Web render **từ graph.json thật** (fetch 200, không 404); hub rows = số hub; empty-state khi 0; no pageerror.
- [ ] 375px: section không tràn ngang.
- [ ] `npm run cosmos:refresh` sinh `www/cosmos/graph.json` (committed).
- [ ] Roadmap: 6 card, không còn "Cosmic Web" là đề tài chưa làm; "đã ship" = 6 hướng; slides slide 15 khớp; full suite xanh.
