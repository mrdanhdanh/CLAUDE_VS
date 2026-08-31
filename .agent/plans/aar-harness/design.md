# Design — AAR for Harness (auto-researcher)

## Design System (CLI + Docs)
- **Tone:** YUNIE GenZ thân thiện + chuyên nghiệp ấm áp — report markdown rõ ràng, có citation
- **Palette:** Dùng CSS variables hiện có (không thêm UI mới) — report dùng markdown
- **Typography:** Monospace cho code, sans cho report

## Architecture
```
User task
  → auto-researcher.mjs --task "xxx"
    ├─ 1. Suggest: parse docs/knowleged.md (BM25-lite, reuse auto-learn tokenize/IDF)
    ├─ 2. Library: load www/library/export.json → BM25 (reuse mcp-server tokenize/K1/B)
    ├─ 3. Propose: 3 methods template-based (keyword → variant)
    │     - Method A: minimal fix (áp KN phòng tránh)
    │     - Method B: polish + a11y (product-quality)
    │     - Method C: alternative (library-inspired)
    ├─ 4. Benchmark: build/test/get_errors checklist (HOW not just WHETHER)
    └─ 5. Report: markdown + keep best (score)
```

## Wireframe — Report Output
```
# AAR Report — <task>
## 1. Suggest (knowleged.md) — top 3 KN
## 2. Library — top 3 chunks (book · chunk · score)
## 3. Propose — 3 methods
## 4. Benchmark — table (build/test/a11y/responsive)
## 5. Recommendation — keep Method X
```

## States
- **Loading:** spinner text "Searching knowleged..."
- **Empty:** "Không tìm thấy KN liên quan — tiếp tục, ghi chú để tạo KN mới"
- **Error:** "export.json missing → báo user mở www/library/index.html → Xuất"
- **Success:** report.md sinh tại `.agent/plans/aar-harness/report-<slug>.md`

## A11y / Quality
- Report markdown có heading hierarchy, code block có lang
- Benchmark phải check: build pass, test pass, get_errors 0, contrast ≥4.5:1 (nếu UI), responsive 375/768/1280 (nếu UI)
- Học từ HF incident: benchmark check HOW (cách làm) không chỉ WHETHER (có pass không)

## File Changes
- `.github/skills/auto-researcher/SKILL.md` (new)
- `.github/harness/scripts/auto-researcher.mjs` (new)
- `.agent/plans/aar-harness/prd.md|design.md|plan.md` (new)
- `www/status.json` (regenerate)
