---
name: auto-researcher
description: "AAR Automated Researcher self-improving AI — search knowleged + library BM25, propose 3 methods, benchmark 30m, keep best. Use when harness needs auto-research, need to search knowleged/library, propose methods, benchmark, keep best, or user says AAR/auto-researcher/self-improving/Tier 2"
user-invocable: true
---

# Auto-Researcher — AAR for Harness v2

> Inspired by **Anthropic AAR paper 28/08/2026** — *Automated Researchers Can Reliably Mitigate Alignment Failures* (Chen Yueh-Han). Search → Propose → Train 30m → Keep effective. Áp vào Harness v2: mỗi task đều search literature (knowleged.md + library) → propose 3 cách → benchmark chặt → giữ cái tốt nhất.

## When to Use
- User nói "AAR", "auto-researcher", "self-improving", "Tier 2"
- Trước khi `/harness` muốn search knowleged + library tự động (Tier 1)
- Cần propose 3 methods và benchmark để chọn best (Tier 2)
- Muốn áp paper Anthropic vào hệ thống hiện tại

## Workflow (5 bước — như paper)

1. **Suggest (knowleged.md):** `node auto-learn.mjs suggest "<task>" --top 3` — BM25-lite + IDF, reuse `docs/knowleged.md` (9 KN hiện tại)
2. **Library Search:** `node www/library/search.mjs "<task>" --top_k 3` hoặc `mcp-server.mjs search_library` — BM25 local 303 chunks, <100ms
3. **Propose 3 Methods (template-based, no LLM required):**
   - **A — Minimal fix:** Áp **Cách phòng tránh** từ KN top1 (tránh lặp bug cũ)
   - **B — Polish + a11y:** Theo `product-quality` (responsive 375/768/1280, contrast ≥4.5:1, states, animation 150-300ms)
   - **C — Library-inspired:** Dùng snippet từ library hit (nếu có) hoặc alternative approach
4. **Benchmark (30m loop stub):** `dotnet build + dotnet test + get_errors + a11y/responsive checklist` — phải check **HOW** not just **WHETHER** (học từ OpenAI HF incident 26/08/2026). Keep best, discard rest.
5. **Report:** Sinh markdown tại `.agent/plans/aar-harness/report-<slug>.md` + stdout — có citation `bookName · chunk # · score`

## CLI

```bash
# Tier 1 — search only (nhanh, 5s)
node .github/harness/scripts/auto-researcher.mjs --task "rainbow border không xoay" --top 3

# Tier 2 — full report + propose + benchmark
node .github/harness/scripts/auto-researcher.mjs --task "làm feature X" --top 3 --report

# JSON cho YUNIE/www
node .github/harness/scripts/auto-researcher.mjs --task "xxx" --json
```

## Benchmark Checklist (học từ HF warning shot)

- [ ] `dotnet build` pass (không MSB3027 file lock — KN-008)
- [ ] `dotnet test` pass
- [ ] `get_errors` 0
- [ ] Nếu UI: responsive 375/768/1280 không vỡ (KN-002/KN-004)
- [ ] Nếu UI: contrast ≥4.5:1, keyboard, aria-label (KN-006)
- [ ] Nếu animation: đo `--angle` bằng Playwright trước/sau 500ms (KN-003/KN-004)
- [ ] Không reward hacking — grader check HOW (cách làm) không chỉ WHETHER (có pass không)

## References
- Paper: `anthropic.com/research/automated-researchers-mitigate-alignment-failures` (28/08/2026)
- TechCrunch: `techcrunch.com/2026/08/28/an-anthropic-researcher-just-gave-us-a-peek-at-self-improving-ai/`
- OpenAI HF incident: `openai.com/index/hugging-face-incident-and-the-road-ahead/` (26/08/2026) — warning shot
- Harness: `docs/harness-flow.md` + `docs/knowleged.md` (9 KN) + `www/library/export.json` (6 books, 303 chunks)
- Scripts: `.github/harness/scripts/auto-learn.mjs` + `www/library/mcp-server.mjs` + `www/library/search.mjs`

---
*Skill: auto-researcher — AAR for Harness v2. Process > Model. $4/h vs $150/h, 6h thắng researcher người.*
