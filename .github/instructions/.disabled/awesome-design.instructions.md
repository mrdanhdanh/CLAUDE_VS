---
description: "Awesome DESIGN.md — 74 design systems local (VoltAgent/awesome-design-md). Use when user wants UI design, needs design inspiration, mentions vibe/style like linear/stripe/vercel/apple, or needs DESIGN.md for AI agent."
applyTo: "**"
---

# Awesome DESIGN.md — Local Design Library (74 systems)

> **Thư viện:** `awesome-design-md/` — 74 DESIGN.md trích từ website thật (VoltAgent/awesome-design-md, 114k⭐). Mỗi DESIGN.md là design system markdown để AI agent đọc và generate UI consistent (Google Stitch format). Local, offline, <50ms.

## Khi nào áp dụng
- User nói vibe/style: "kiểu Linear", "như Stripe", "dark minimal", "fintech gradient", "apple clean"
- Task cần design inspiration, chọn palette/typography, hoặc cần DESIGN.md cho agent
- Bất kỳ task UI nào — gợi ý design phù hợp trước khi code

## Quy tắc (BẮT BUỘC ở phase Explore/Design)

### 1. Search trước khi code
```bash
node awesome-design-md/search.mjs "linear dark lavender" --top_k 5
node awesome-design-md/search.mjs "stripe fintech purple gradient" --top_k 3 --json
node awesome-design-md/search.mjs "apple clean white premium" --top_k 3
node awesome-design-md/search.mjs --list          # xem hết 74
node awesome-design-md/search.mjs --status        # thống kê categories
```

### 2. Đưa vào PRD/Design/Plan
- **PRD:** Ghi `Design vibe: <slug> (score X) — <description>`
- **Design:** Copy tokens từ `awesome-design-md/design-md/<slug>/DESIGN.md` vào design system (colors, typography, spacing)
- **Plan:** Ghi `Dùng DESIGN.md: <slug> → awesome-design-md/design-md/<slug>/DESIGN.md`

### 3. Cách dùng DESIGN.md
```bash
cp awesome-design-md/design-md/linear.app/DESIGN.md ./DESIGN.md
# rồi bảo agent: "build me a page that looks like this"
```
- Mỗi design có `DESIGN.md` + `preview.html` (xem visual catalog)
- Format: 9 sections — Visual Theme, Colors, Typography, Components, Layout, Depth, Do's/Don'ts, Responsive, Agent Prompt Guide

### 4. Categories (74 designs)
| Category | Count | Ví dụ |
|----------|-------|-------|
| AI & LLM | 12 | Claude, Mistral, xAI, VoltAgent |
| Media | 12 | Apple, Spotify, SpaceX, WIRED |
| Productivity | 8 | Linear, Notion, Cal.com, Slack |
| Backend | 8 | Supabase, MongoDB, Sentry |
| Fintech | 7 | Stripe, Revolut, Coinbase |
| Automotive | 7 | Tesla, Ferrari, BMW |
| Dev Tools | 7 | Vercel, Cursor, Warp |
| Design Tools | 6 | Figma, Framer, Webflow |
| E-commerce | 5 | Airbnb, Nike, Shopify |
| Retro | 2 | Dell 1996, Nintendo 2001 |

### 5. Vibe keywords gợi ý
`dark`, `light`, `minimal`, `colorful`, `gradient`, `glassmorphism`, `brutalist`, `editorial`, `dashboard`, `fintech`, `saas`, `ecommerce`, `luxury`, `retro`, `neon`, `cinematic`, `playful`, `premium`

## Checklist cho agent
- [ ] Đã `search.mjs "<vibe>"` trước khi chọn design?
- [ ] Đã đọc `DESIGN.md` của top result và trích tokens?
- [ ] Đã ghi citation `slug · score · path` vào PRD/Design?

## Liên kết
- Thư viện: `awesome-design-md/design-md/<slug>/DESIGN.md` + `preview.html`
- Index: `awesome-design-md/index.json` (74 designs, auto-generated)
- Search: `awesome-design-md/search.mjs` (BM25-lite, offline)
- Source: `https://github.com/VoltAgent/awesome-design-md` + `https://getdesign.md/`
- Spec: `https://stitch.withgoogle.com/docs/design-md/specification/`

---
*Instruction: awesome-design — 74 DESIGN.md local, search <50ms, no network needed.*
