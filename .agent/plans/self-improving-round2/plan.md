# Plan — Self-Improving Round 2 (KN-033/034/035/036)

- [x] Fetch + đọc 6 papers (arXiv abstracts, 2026-09-09/10)
- [x] Lưu `books/papers/` (6 files) + ingest library (115 sách, JSON OK)
- [x] `knowleged.md`: bảng tóm tắt + 4 chi tiết + anti-patterns + checklist + UpdatedAt
- [ ] `distill-agnostic.mjs` → regenerate `harness-process` skill (Entangled with: knowleged.md)
- [ ] `generate-status.mjs` → `status.json` (learn.knTotal 36)
- [ ] README sync (32 → 36 KN)
- [ ] Verify: auto-learn status + grep KN-033→036 + JSON + git status

## File Changes

- NEW: `books/papers/arxiv-2609.{11873,11677,11699,10702,10922,09625}v1.md` (6, gitignored source)
- PATCH: `docs/knowleged.md` (KN-033→036 + fix 3 dòng checklist hỏng)
- LOCAL: `www/library/export.json` (6 books ingest, backup tự động)
- GEN: `www/status.json`, `.github/skills/harness-process/*`
- PATCH: `README.md` (4 chỗ đếm KN)

## Verify Commands

```bash
node .github/harness/scripts/distill-agnostic.mjs
node .github/harness/scripts/generate-status.mjs
node .github/harness/scripts/auto-learn.mjs status
```
