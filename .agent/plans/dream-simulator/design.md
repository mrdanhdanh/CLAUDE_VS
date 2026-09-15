# Design mini — Dream v0 (dream-simulator)

## Kiến trúc
- `dream.mjs` (CLI, 0 dep) **import `./kn-parse.mjs`** — 1 nguồn parse/integrity/scoring (đúng parity với `suggest`: `tokenize` → `computeIDF` → `scoreKN`).
- Ladder: nấc 2 (reuse `kn-parse.mjs` + máy scoring có sẵn) + nấc 4 (stdout/exit codes) — không thêm dependency.

## Battery (deterministic, offline — 0 execution)
```
evaluateArtifact(file, bugTitles, topK) → {
  file, knCount, guards,
  integrity: { ok, issues[] },          // checkKnIntegrity (KN-066)
  queries: { total, hits, recall, misses[] },
  score = integrity.ok ? recall : 0,    // gate trước, đo sau
  gate: 'pass' | 'fail'
}
```
- **Queries:** mỗi KN có dòng `Bug report:` trỏ `.agent/bugs/<slug>/bug.md` đọc được → query = title bug (`# Bug:`). Đây là "replay history": lịch sử phải tìm lại được chính bài học của nó.
- **Hit:** KN của chính query nằm top-K khi rank toàn bộ corpus bằng BM25 (top mặc định 3).
- **Guards:** đếm dòng `- **Guard:**` có giá trị thật (bỏ `—`, `⚠️`, `<`).

## run + π0-in-set
- Set = candidates ∪ {baseline}; baseline mặc định `docs/knowleged.md`.
- `winner = argmax(score)`; tie → giữ baseline (`>` strict) ⇒ **π(t+1) ≥ π(t)** — in guarantee trong output.
- **Không có code path ghi file** — deploy = người copy đè (như Dream-RSI: chỉ winner được deploy, người chạy).

## Output
- Human: bảng per artifact (`gate · recall@K (hits/total) Δ · kn/guards/misses · score`) + verdict vs π0 + winner + nhắc deploy manual.
- `--json`: schema cố định cho máy/spec: `{cmd, topK, baseline, candidates, winner, guarantee}`.
- Exit: `0` OK · `1` usage/IO · `2` fail-closed (0 KN parse được / 0 query resolve / file unreadable).

## Testability
- Flags cho fixture hermetic: `--file`, `--candidate <repeat>`, `--baseline`, `--bugs <dir>`, `--top`, `--json`.
- Spec fixture: 5 KN (2 có bug-link + 3 keyword-sink decoy) + 2 bug.md — đủ phân biệt candidate tốt/xấu ở topK=3.
