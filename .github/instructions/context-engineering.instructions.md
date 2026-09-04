---
description: "Context engineering — dynamic context pipeline (scratchpad/compress/isolate) + anti-poisoning. Use when managing RAG context, hitting window limits, or debugging wrong/missing context."
applyTo: "**"
---

# Context Engineering — Quản lý context động (học Lesson 12)

> Prompt = static 1 lần. Context Engineering = quản lý *dynamic* info qua thời gian để agent luôn có đúng info cho bước tiếp theo.

## Khi nào áp dụng
- RAG trả quá nhiều hits / context window gần đầy
- Agent bị distraction (lặp vô ích), confusion (instructions mâu thuẫn), poisoning (hallucination lọt vào)
- Multi-subtask cần isolate context riêng

## Quy tắc (BẮT BUỘC)

### 1. Pipeline — quarantine → compress → isolate → inspect
```bash
node .github/harness/scripts/context.mjs quarantine --text "<candidate>"
node .github/harness/scripts/context.mjs compress --max-chars 2000 --file hits.json
node .github/harness/scripts/context.mjs isolate --subtask "plan" --subtask "implement"
node .github/harness/scripts/context.mjs inspect --file hits.json
```
- **Quarantine trước:** validate + redact secret (`sk-`, `cpk-`), reject prompt-injection pattern.
- **Compress:** giữ top-score, truncate snippet — không drop hit quan trọng.
- **Isolate:** mỗi subtask 1 bounded summary (max 1000 chars), không lẫn.
- **Inspect:** chỉ counts/ids/hashes — không log raw prompt.

### 2. Failures & Fix (Lesson 12)
| Failure | Dấu hiệu | Fix |
|---------|----------|-----|
| Poisoning | Hallucination bị reference lặp, impossible goal | `quarantine` + validate qua API trước khi add |
| Distraction | Context lớn, model lặp history | `compress` (summarize/trim) |
| Confusion | Nhiều instructions mâu thuẫn | `isolate` per subtask, clear priority |
| Clash | Context mới mâu thuẫn memory cũ | Versioning (ts + source) |

### 3. Checklist cho agent
- [ ] Đã `quarantine` candidate trước khi add vào context?
- [ ] Context >2000 chars → đã `compress`?
- [ ] Multi-subtask → đã `isolate`?
- [ ] Debug → đã `inspect` (không log raw)?

## Liên kết
- Script: `.github/harness/scripts/context.mjs` (Node 18+, no deps)
- Knowledge: `docs/knowleged.md` · Sách: `AI-Agents-for-Beginners-Distilled.md` Lesson 12

---
*Instruction: context-engineering — enforce bởi Harness 2.1 P1-4.*
