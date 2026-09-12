# Plan (mini) — Cosmic Web · Entangle v2

| # | Todo | Status | Ladder | Entangled with |
|---|------|--------|--------|----------------|
| 1 | TDD: spec `cosmos-web.spec.ts` (RED — script + E2E) | ✅ RED 4 fail → GREEN 5 pass | 4 (native e2e) | `tests/e2e/cosmos-web.spec.ts` |
| 2 | Implement `entangle.mjs --graph` | ✅ 1-pass scan · git co-change · dead-precision | 5 (execFileSync built-in, no dep) | `entangle.mjs` (`--file` v1 nguyên vẹn) |
| 3 | `package.json` chain + sinh `www/cosmos/graph.json` | ✅ `npm run cosmos:refresh` → graph.json + scale.json + status.json | 6 (1 dòng) | `package.json`, `www/cosmos/graph.json` |
| 4 | Section 🕸️ Cosmic Web trên `scale.html` | ✅ + scroll-margin-top (KN-040 class) + cap hub 6 + note | 2 (reuse `.part`/`.bh-item`/`.fresh`) | `scale.html` |
| 5 | Roadmap: Cosmic Web → shipped · thêm card 🌐 Lensing · "6 hướng" | ✅ | 6 | `index.html#future-grid` |
| 6 | Slides 15: shipped + Cosmic Web · topic → Lensing | ✅ | 6 | `slides.html` |
| 7 | Update specs cũ (verify actor + policy-check) | ✅ PERMITTED ×2 | — | `cosmos-future.spec.ts`, `cosmos-slides.spec.ts` |
| 8 | Sync docs (instruction §8 + cosmic-scale SKILL) + export-claude + distill | ✅ mirrors khớp | — | `.github/instructions/cosmic-quantum...`, `.github/skills/cosmic-scale/SKILL.md` |
| 9 | Verify: full suite + 375 + evidence + README counts | ✅ **86/86 pass** · 2 shots | — | `.agent/plans/cosmos-cosmic-web/verify/` |
| 10 | Audit log + báo cáo | ✅ | — | `.agent/audit.jsonl` |

## Evals rubric (viết TRƯỚC — KN-037) → kết quả
| Tiêu chí | Kết quả |
|----------|---------|
| `--graph --json`: hubs ≥10 refs sorted · clusters ≥3 file weight ≥3 · dead ⊆ www/ | ✅ (13 hub · 2 cluster · 0 dead) |
| `--out` ghi JSON hợp lệ | ✅ |
| `--file` v1 backward compat (usage + shape) | ✅ |
| scale.html render từ graph.json thật, rows khớp data, fetch 200 | ✅ |
| 375px không tràn ngang · no pageerror | ✅ |
| Chain `cosmos:refresh` sinh đủ 3 file | ✅ |
| Roadmap 6 card khớp slides · full suite xanh | ✅ 86/86 |

## Phát hiện & xử lý trong implement (evidence-based)
- **Directory refs** (`"www/"`, `"www/library"`) từng thành "hub" giả → `forwardRefs` skip `isDirectory()`.
- **False-positive dead filaments** (3/3): `crash-demo`, `speech-lab` (load động qua registry id), `proxy.mjs` (nhắc trong string lệnh) → thêm token-check "đặc trưng" (có `. - _`) chống load động; kết quả thật = 0.
- **Mega-merge cluster** (45 file, ×11) do file "keo dính" (pairDegree ≥6: registry, knowleged, README…) → GLUE_MIN=6 loại khỏi union-find; còn 2 cluster hành động được (ai-news ×4, todo-manager ×4).
- **Vendor hub noise** (archify vendor) → loại `/vendor/` khỏi hubs.

## Ghi chú governance
- 2 spec edits qua `policy-check --actor verify` → PERMITTED + audit log (lý do: topic QEC→Lensing, Cosmic Web→shipped).
- Docs sync `.github/` → `export-claude` (mirrors khớp) + `distill-agnostic` regenerated 5 harness-* skills.
- Không dependency mới · không pin `model:` · `--file` v1 giữ nguyên 100%.
