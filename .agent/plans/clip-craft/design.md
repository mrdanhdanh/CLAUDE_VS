# Design — Clip Craft: kiến trúc skill + agent

> Ngày: 2026-09-26 · Input: `prd.md` + `upgrade-ideas.md`

## 1. Phân vai 3 lớp (không chồng lấn)

```
┌─────────────────────────────────────────────────────────────┐
│ clip-director (AGENT)      — "đạo diễn" chạy quy trình sáng tạo │
│   research → hook portfolio → beat sheet → visual brief      │
│   → review frames → publish pack   (output: .agent/plans/)   │
├─────────────────────────────────────────────────────────────┤
│ clip-craft (SKILL)         — "kiến thức" (WHAT/WHY)          │
│   layout.md · color.md · content.md                          │
├─────────────────────────────────────────────────────────────┤
│ video-clip (SKILL cũ)      — "kỹ thuật" (HOW)                │
│   canvas contract · TTS · render · 3 guard                   │
└─────────────────────────────────────────────────────────────┘
```

Nguyên tắc: **craft quyết định trước, render sau.** `clip-director` chốt hook/beat/layout/palette → `video-clip` pipeline implement + guard.

## 2. File tree

```
.github/skills/clip-craft/
├── SKILL.md              # overview + 10 craft laws + craft order 7 bước + checklist
└── references/
    ├── layout.md         # safe zone 2026 (số liệu+nguồn) · lưới dọc · type scale · text-on-video · motion rhythm · cover
    ├── color.md          # role system · contrast nền động · semantic evidence A/B/C/D · 3 công thức palette · series identity
    └── content.md        # promise · hook triad + archetypes · 4 structure template · retention + benchmark · script math VN · CTA/caption · series

.github/agents/clip-director.agent.md   # 6 bước + output format + constraints
```

## 3. Interface của clip-director (hợp đồng output)

Mọi output vào `.agent/plans/<slug>/` — khớp pipeline hiện có, không tạo format mới:

| Bước | Output | Nội dung tối thiểu |
|---|---|---|
| 1 Research | `research.md` (cập nhật) | Evidence ledger A/B/C/D (đã có format ở space-bunny) |
| 2 Hook portfolio | `script.md` | 3 hook + promise + lý do chọn |
| 3 Beat sheet | `script.md` | bảng beat: at/end, eyebrow, title, sub, visual idea, màu cảm xúc, từ budget |
| 4 Visual brief | `design.md` | safe-zone layout · palette + contrast đo được · type scale · motion rhythm · cover spec |
| 5 Frame review | ghi vào `script.md`/`design.md` | nhận xét 5 PNG như người lạ (muted, 30% zoom) → fix list |
| 6 Publish | `publish.md` | caption keyword-first · 3 set hashtag × 5 · cover pick · giờ đăng |

Handoff: `window.__clip` contract (video-clip) + guard 3 món — clip-director **không** render, **không** sửa guard.

## 4. Conventions

- **Ngôn ngữ:** VN-first (user làm clip tiếng Việt), thuật ngữ kỹ thuật giữ tiếng Anh (safe zone, hook, retention).
- **Số liệu:** luôn kèm nguồn + tháng + rule "re-verify" (nền tảng đổi UI 3–5 lần/năm).
- **Format:** bảng > prose; mỗi reference có checklist cuối file; ≤150 dòng/file (ngân sách context).
- **Ví dụ:** lấy từ clip thật của repo (space-bunny, openai-hf-hack) — không ví dụ chung chung.
- **Wise loading:** SKILL.md description chứa đủ keyword (clip, hook, storyboard, bố cục, màu sắc, content creator, TikTok/Reels/Shorts).

## 5. Quyết định thiết kế (có lý do)

| # | Quyết định | Lý do |
|---|---|---|
| D1 | Tách `clip-craft` khỏi `video-clip` | Wise loading: task "viết hook/bố cục" không cần chi tiết TTS/render; task render không cần đọc hết craft |
| D2 | Agent tên `clip-director`, không phải `designer` thứ 2 | `designer` lo UI web (responsive 375/768/1280); clip là medium khác (safe zone nền tảng, muted-first) |
| D3 | 3 references tách theo trục | Khớp cách người làm việc: chốt bố cục → màu → nội dung, hoặc tra cứu độc lập |
| D4 | Giữ format research/design/publish cũ | Zero migration — 2 clip cũ nằm đúng format |
| D5 | Số liệu safe zone kép (PostPlanify + RGBA) | 2 nguồn lệch nhau (bottom 320 vs 400) → dạy "design theo nguồn bảo thủ nhất" thay vì 1 con số |

## 6. Kiểm chứng (theo rubric PRD)

- [ ] C1: grep `900×1400` + link nguồn trong layout.md
- [ ] C2: `harness-manager.mjs list --type skill` / `--type agent` → enabled
- [ ] C3: đọc frontmatter 2 file
- [ ] C4: đếm bảng + checklist mỗi reference
- [ ] C5: grep cross-link 2 chiều
