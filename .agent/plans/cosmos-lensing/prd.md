# PRD (mini) — Gravitational Lensing · Blast radius 2-hop

> Roadmap card 🌐 `www/cosmos/index.html#future` (Q1 2027 — ship sớm): *"entangle --lens --hops 2 — vẽ blast radius trước khi refactor (pre-flight) kèm test set tối thiểu cần chạy"*.

Cosmic-Quantum: Macro lensing v3 của entangle — bẻ cong text-refs quá 2 hop trong vũ trụ graph.json (1613 edges) để pre-flight refactor · Micro BFS reverse, shortest-hop thắng, dedup · Entanglement `entangle.mjs` ↔ `www/cosmos/graph.json` ↔ `scale.html#web` ↔ `index.html#future` + `slides.html` + 2 spec cũ.

## User story

Là dev sắp refactor file X: chạy `entangle --lens --file X --hops 2` → thấy **hop 1** (ai ref X — đụng ngay) + **hop 2** (ai ref người đó — bẻ cong) + **test set tối thiểu phải chạy trước khi sửa** — không refactor mù.

## Scope (GIỮ)

1. CLI `--lens --file X [--hops 2 (1..3)] [--json] [--out] [--max]`: blast hop1/hop2 + testSet + counts. Cùng semantics edges với `--graph`.
2. `--graph` nhúng `edges` ([from,to]) vào graph.json — reuse cho lens client-side (không tạo file mới).
3. `forwardRefs`: ref bắt đầu `/` = **web-root** (specs `page.goto('/cosmos/x')`, `request.get('/cosmos/graph.json')`) → graph bắt được cạnh test→page (accuracy fix — trước đây các cạnh này bị rơi).
4. `scale.html#web`: widget 🔭 **Lensing** — select file → hop1/hop2 chips + test set (BFS client-side từ edges).
5. Roadmap swap: gỡ card Lensing (đã ship) → card mới ☄️ **Cosmic Ray — flaky detector** (khớp note "chân không lượng tử ↔ Flaky" trong skill) · counter 10 shipped · slides sync.
6. Docs sync: `cosmic-quantum` instruction §8 + SKILL.md; export-claude mirrors.

## Non-goals (CẮT — YAGNI gate)

- CẮT `--changed` (git diff trigger) — đó là card LIGO (Gravitational Waves).
- CẮT lens >3 hop (nhiễu) · CẮT canvas viz · CẮT `edges.json` riêng (nhúng graph.json).
- CẮT runtime impact analysis — chỉ **text-refs reachability**; không claim "will break"/"safe to merge".

## Persistence

Persistence: `www/cosmos/graph.json` (repo file, commit + regenerate `npm run cosmos:refresh`) · F5: giữ · Scope: toàn cục (site tĩnh đọc file) · CLI: local, không persist.

## Who did you think with?

- **Dissent 1** (archify research — "authored reachability ≠ blast radius/runtime impact"): adopt **mechanism** — output CLI + widget + JSON ghi rõ `method: text-refs pre-flight · không phải runtime impact · không thấy ≠ an toàn`. Không adopt label rỗng "blast radius" như runtime truth.
- **Dissent 2** (đề tài thay thế): giữ 6 card theo precedent (mỗi ship thay 1 card: Cosmic Web→Lensing); chọn ☄️ Cosmic Ray (flaky detector — đo được: `--repeat-each N` + đối chiếu đỏ/xanh). Sếp muốn còn 5 đề tài → sửa 1 dòng.
- **Dissent 3** (webroot-refs fix đổi hub counts): accuracy fix, spec cũ chỉ assert *shape* (không pin số) — verify full suite sau regen.

## Nguồn từ thư viện

Không dùng (task nội bộ harness — nguồn là code hiện có: `entangle.mjs`, `graph.json`, specs).
