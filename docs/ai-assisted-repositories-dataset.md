# AI-Assisted Repositories Dataset — 1,324 repo Python mine từ GitHub (STRATA)

> **Mục đích:** Note tra cứu dataset nghiên cứu "AI-assisted code" — khi nào cần khảo sát/benchmark repo do AI hỗ trợ (skills, agents, harness, tooling) thì tìm file này TRƯỚC, đừng tự mine lại từ đầu. Kèm nguồn + lệnh refresh khi author update.
>
> **Ngày:** 2026-09-14 · **Người tổng hợp:** YUNIE (đo trực tiếp bằng `Import-Csv`, link verify HEAD 200) · **KN liên quan:** KN-057 (ranh giới vibe / AI-assisting / AI-assisted nằm ở review chain — `docs/knowleged.md`)

---

## 1. Dataset là gì

Phụ lục của paper **"Changes in Vocabulary Between Human-created and LLM-assisted Code Repositories"** (Taylor Lineman, RIT, 2025) — thuộc tool **STRATA** (*Software daTa Repository Analysis & Testing Architecture*).

Cách các repo được chọn (subcommand `find` của STRATA): quét GitHub repository-creation events → đánh dấu "AI-assisted" qua **2 heuristic**:
- **agent_files** — repo có AI-agent config files (CLAUDE.md, .cursorrules, agent skills…)
- **commits** — có commit authored/co-authored bởi AI agent (trailer trong commit message)

STRATA còn có `mine` (clone + mine commits + srcML) · `analyze` (lexical metrics, clustering) · `predict` (classify commit type: fix/feature/refactor/test/docs) · `sample` (stratified sampling) · `database` · `compare` (chạy so sánh 2 dataset ra graphs/tables — phần paper dùng).

## 2. Nguồn (verify ✅ 200 lúc 2026-09-14)

| File | Nội dung | Raw URL |
|------|----------|---------|
| `ai-assisted-repositories.csv` | nhóm AI-assisted — **1,324 rows** (~277 KB) | [raw](https://raw.githubusercontent.com/ActuallyTaylor/strata/main/paper/data/large/datasets/ai-assisted-repositories.csv) |
| `human-repositories.csv` | nhóm đối chứng (human-created) | [raw](https://raw.githubusercontent.com/ActuallyTaylor/strata/main/paper/data/large/datasets/human-repositories.csv) |
| `reaper-dataset.csv` | dataset bổ sung | [raw](https://raw.githubusercontent.com/ActuallyTaylor/strata/main/paper/data/large/datasets/reaper-dataset.csv) |

- Repo: [ActuallyTaylor/strata](https://github.com/ActuallyTaylor/strata) · Paper: [paper/](https://github.com/ActuallyTaylor/strata/tree/main/paper) · Steps tái lập: [REPRODUCTION.md](https://github.com/ActuallyTaylor/strata/blob/main/REPRODUCTION.md)
- Xem lịch sử update dataset: [commits của folder datasets](https://github.com/ActuallyTaylor/strata/commits/main/paper/data/large/datasets) (~5 tháng không đổi tính tới 14/09/2026)

## 3. Snapshot số liệu (đo 2026-09-14)

**Schema:** `repo_id, language, stars, url, description, default_branch, assistance_style`

| Chỉ số | Giá trị |
|--------|---------|
| Rows | **1,324** (một số nguồn ghi "1,325" — lệch 1, có thể do đếm cả header) |
| Language | **100% Python** |
| `assistance_style` | `agent_files` **1,172** (88.5%) · `commits` **152** (11.5%) · 0 repo cả hai |
| Stars | min **100** · median **253** · trung bình ~**1,659** · max **113,861** |
| Thiếu `description` | 118 rows |
| Keyword trong description | agent 419 · claude 261 · skill 180 · mcp 98 · memory 52 · research 49 · openclaw 33 · trading 14 |

**Top 10 theo stars:** anthropics/skills (113,861) · github/spec-kit (86,573) · nextlevelbuilder/ui-ux-pro-max-skill (61,897) · bytedance/deer-flow (59,890) · Zie619/n8n-workflows (53,635) · ComposioHQ/awesome-claude-skills (52,435) · karpathy/nanochat (51,486) · NousResearch/hermes-agent (43,631) · HKUDS/nanobot (38,752) · datawhalechina/hello-agents (34,895).

> Vui: dataset chứa chính các repo skill đã dùng trong harness này — `anthropics/skills`, `github/awesome-copilot`, `nextlevelbuilder/ui-ux-pro-max-skill` (nguồn của `ui-ux-pro-max` skill).

## 4. Refresh khi author update

```powershell
# 1. Tải bản mới (raw main luôn là bản mới nhất)
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/ActuallyTaylor/strata/main/paper/data/large/datasets/ai-assisted-repositories.csv" -OutFile "$env:TEMP\ai-assisted-repos.csv"

# 2. Thống kê lại nhanh (chuẩn hoá cột assistance_style — xem §5)
$csv = Import-Csv "$env:TEMP\ai-assisted-repos.csv"
"Rows: $($csv.Count)"
$csv | Group-Object { if ($_.assistance_style -match 'commits') { 'commits' } else { 'agent_files' } } | Select-Object Count, Name
$csv | Sort-Object { [int]$_.stars } -Descending | Select-Object -First 10 stars, repo_id
```

Nếu số liệu đổi đáng kể → cập nhật lại §3 + dòng Ngày ở header. Muốn phân tích sâu hơn (lexical, clustering) thì theo `REPRODUCTION.md` của repo gốc.

## 5. Cảnh báo chất lượng dữ liệu (đọc trước khi dùng)

- **Cột `assistance_style` bị artifact:** nhóm commits lưu chuỗi lặp `"commits, commits, commits…"` → **30 giá trị distinct** cho lẽ chỉ nên có 2. Phải chuẩn hoá (`contains 'commits'` vs không) trước mọi thống kê.
- **Cả 2 heuristic là proxy:** có CLAUDE.md ≠ code do AI viết; commit co-authored chỉ bắt phần AI được ghi credit → 2 nhóm bias ngược hướng nhau. Dùng để khảo sát xu hướng, **không** coi là ground truth.
- **Filter ≥100 stars** → thiên về repo "hot" của làn sóng Claude Code / Skills / OpenClaw 2025-2026, không đại diện toàn bộ AI-assisted repos.
- **Python-only** → không suy rộng sang ngôn ngữ khác (STRATA hỗ trợ Python, C, C++, Objective-C, Java cho `analyze`).

## 6. Áp dụng cho harness

- Khảo sát "thị trường": repo nào đang được dùng nhiều cho skills/agents/MCP/memory → tham khảo trước khi tự build (minimal-ladder nấc 2: reuse).
- Benchmark định vị: `agent_files` 88.5% cho thấy kỳ vọng mặc định của ecosystem là repo **có agent config** — harness này đi đúng hướng (`.github/` + instructions + skills).
- Đối chiếu triết lý: dataset phân biệt LLM-*assisted* bằng tín hiệu cấu hình/commit — khớp KN-057 (ranh giới nằm ở review/verify chain, không ở label).

---

*Note: `docs/ai-assisted-repositories-dataset.md` — tra cứu trước khi mine lại. Cập nhật khi dataset gốc đổi (§4).*
