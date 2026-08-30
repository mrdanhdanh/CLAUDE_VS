# Design: Auto-Learn

## 1. Design System
- **CLI style:** Node 18+, no deps, colors via ANSI (optional), JSON flag for machine
- **Output:** human-readable + `--json` for YUNIE/hooks
- **Tokens:** reuse harness colors (indigo primary), monospace for scores

## 2. Architecture
```
docs/knowleged.md ──parse──> KN[] ──BM25-lite──> suggest(query) → top 3
                                    │
                                    ├─→ log(error,file) → .agent/bugs/YYYY-MM-DD-slug/bug.md
                                    └─→ propose(bugSlug) → KN-XXX draft markdown
```

## 3. Components
### 3.1 auto-learn.mjs
- `parseKNs(text)` → [{id, title, date, tags[], lesson, detail, tokens}]
- `tokenize(text)` → tokens (lower, split, stopwords)
- `score(queryTokens, kn)` → number (overlap + tag boost 2x + title 1.5x)
- `suggest(query, topK)` → sorted KN with score, snippet
- `logBug({error,file,title,slug})` → create dir + bug.md from template
- `propose(bugSlug)` → read bug.md → next KN id → markdown draft
- `status()` → {knTotal, bugsTotal, drafts, lastUpdated, topTags}

### 3.2 Instruction auto-learn.instructions.md
- applyTo: **, enforce: trước khi code → suggest, sau lỗi → log, sau fix → propose

### 3.3 Agent learn.agent.md
- delegate khi cần suggest/log/propose, tools minimal

### 3.4 Hooks
- PostToolUse: reminder suggest
- Stop: reminder propose

## 4. Wireframe CLI
```
$ node auto-learn.mjs suggest "rainbow border không xoay"
→ [KN-003] score 4.5 — Rainbow border không xoay ...
  [KN-004] score 3.0 — grid-2 thừa khoảng cách ...

$ node auto-learn.mjs log --error "RZ9986" --file "Home.razor" --title "mat dau tieng Viet"
→ Created .agent/bugs/2026-08-30-mat-dau-tieng-viet/bug.md

$ node auto-learn.mjs propose --bug 2026-08-30-mat-dau-tieng-viet
→ ## KN-007 draft ...

$ node auto-learn.mjs status
→ KN: 6, Bugs: 5, Drafts: 1, Last: 2026-08-30
```

## 5. States
- Empty: chưa có KN → suggest trả "Chưa có bài học, hãy tạo KN đầu tiên"
- Error: knowleged.md không đọc được → warn + exit 1
- Loading: parse <50ms, suggest <20ms

## 6. Responsive / A11y
- CLI output plain text, không cần responsive
- Instruction/Agent markdown rõ ràng, có checklist

## 7. Risks
- Tokenize tiếng Việt có dấu → giữ nguyên, lower, split đúng
- Slug trùng → thêm -2, -3
- Next KN id race → đọc max hiện tại, không ghi tự động (chỉ propose)
