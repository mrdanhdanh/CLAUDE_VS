---
name: archify
description: "Create polished, verifiable architecture, workflow, sequence, data-flow, lifecycle diagrams as self-contained HTML — typed JSON IR, deterministic validation, atomic delivery. Use when visualizing system architecture, infrastructure, cloud/security topology, workflow, API sequence, data pipeline, state machine, or converting Mermaid to beautiful diagrams. Port of tt-a1i/archify (50k⭐) for Harness v2, tháo lắp via harness-manager."
user-invocable: true
---

# Archify — Architecture as Code Skill (Port of tt-a1i/archify)

> **Port chính thức** của [tt-a1i/archify](https://github.com/tt-a1i/archify) (50.4k⭐, MIT) cho **CLAUDE HARNESS v2**. Biến mô tả hệ thống hoặc codebase thành **1 file HTML self-contained** (inline SVG, dark/light, motion hữu hạn, export PNG/SVG/WebM/Share Card) — qua **typed JSON IR + deterministic validation + atomic delivery**. Tháo lắp như plugin via `harness-manager`.

## When to Use

- Cần vẽ **architecture** (components, services, storage, trust boundaries), **workflow** (CI/CD, approvals, tool calls), **sequence** (API calls, cache fallback, auth), **data-flow** (pipeline, lineage, PII), **lifecycle** (states, retries, terminal)
- Muốn **convert Mermaid** (`flowchart`/`sequenceDiagram`/`stateDiagram`) thành diagram đẹp hơn — đọc topology rồi author lại JSON, không render Mermaid trực tiếp
- Ở phase **Design** của Harness v2: cần system map cho PRD/Design (ví dụ: map `www/` vũ trụ → `registry.json` → `audit.jsonl` → `policy.json`)
- User nói: `archify`, `architecture diagram`, `workflow diagram`, `sequence diagram`, `data flow`, `lifecycle`, `sơ đồ kiến trúc`, `sơ đồ hệ thống`, `vẽ diagram`, `Mermaid đẹp`

## Diagram Types — Chọn đúng loại

| Type | Best for | Prompt cần gì |
|------|----------|---------------|
| `architecture` | Components, services, cloud/security boundaries, infra | Scope, core components (8-12), primary path, external deps, trust boundaries |
| `workflow` | CI/CD, approvals, tool calls, runbooks | Participants, order, branches, exceptions |
| `sequence` | API call chains, request lifecycles, async traces | Callers, callees, returns, timing |
| `dataflow` | Pipelines, ETL/ELT, lineage, governance | Sources, transforms, stores, boundaries |
| `lifecycle` | State machines, retries, waits, terminal | States, events, retry/cancellation paths |

> Không chắc? Chạy `node archify/bin/archify.mjs guide "Show API request with Redis cache miss" --json` hoặc mở https://tt-a1i.github.io/archify/guide.html

## Fast Authoring Path (5 bước — BẮT BUỘC)

> Dùng bounded path này cho mọi generation. Đừng đọc `renderers/` hay `validator` trước khi có candidate đầu tiên.

### 1. Chọn type + đọc schema + example (chỉ 3 file)

```bash
# Đọc 1 schema + 1 example tương ứng, không đọc hết
# Ví dụ architecture:
# archify/schemas/architecture.schema.json + archify/schemas/common.schema.json + archify/examples/web-app.json
```

- Fresh authorship = new stable IDs, domain wording, layout — dùng example cho **field shape**, không copy facts
- Workflow mới dùng `schema_version: 2` (readable layout contract); giữ `v1` chỉ khi preserve legacy geometry
- Brand: `node archify/bin/archify.mjs brands "<name>" --json` khi cần product identity thật

### 2. Artifact first — viết candidate JSON ngay

- Đừng plan coordinates bằng prose — viết JSON luôn
- Bắt đầu với **1 main path rõ ràng**, side branches từ main-path node gần nhất, **≤12 primary nodes**, labels thưa
- `meta.quality_profile: "showcase"` (mặc định) — chỉ dùng `standard` khi user yêu cầu dense map
- Bắt đầu với **automatic routes/labels** — đừng thêm `via`, `channelX`, `channelY`, `labelAt` trước khi diagnostic yêu cầu; mỗi lần sửa chỉ thêm **1 geometry control**

### 3. Validate sau mỗi edit + trước handoff

```bash
node archify/bin/archify.mjs validate <type> <candidate.json> --quality showcase --json
```

- **Showcase pass** = 9 artifact checks + 0 composition errors + 0 warnings. 4 checks = basic, không phải showcase
- Nếu thiếu/sai `meta.quality_profile` → fix trước geometry
- Workflow v2: `node archify/bin/archify.mjs validate workflow <candidate.json> --layout-json` để lấy compiler receipt

### 4. Deliver — atomic commit duy nhất

```bash
node archify/bin/archify.mjs deliver <type> <candidate.json> <output.html> --quality showcase --json
# Optional: --open để mở ngay sau khi pass
```

- Non-zero exit = **không bao giờ** claim success
- Failed delivery giữ nguyên artifact cũ byte-for-byte — đừng chạy `visual-check` trên path đó (sẽ inspect stale artifact)
- Nếu fail: chỉ sửa `diagnostics[].subject` theo `evidence` + `supportedFixes`, rerun. Nếu 2 rounds liên tiếp không giảm error count → dừng và báo truthfully

### 5. Iterate — giữ structure ổn định

- Agent update source, unrelated structure giữ nguyên
- Mỗi lần sửa chỉ chạm diagnosed subject, không rewrite toàn bộ

## Harness v2 Integration — Dùng ở phase nào?

| Harness Phase | Dùng Archify thế nào |
|---------------|----------------------|
| **Explore** | Map codebase hiện tại: `Analyze this repo, then use archify to create runtime architecture (8-12 components, primary path, trust boundaries)` |
| **Clarify** | Vẽ 2-3 options (superposition) rồi collapse 1 — mỗi option là 1 candidate JSON |
| **PRD** | Thêm section `## System Map` với link `archify` HTML + `Cosmic-Quantum: Macro ... · Micro ... · Entanglement ...` |
| **Design** | **BẮT BUỘC** nếu PRD có system map — chọn vibe `classic` (default) hoặc `signal-flow`/`blueprint`/`editorial` khi user yêu cầu; copy tokens từ `awesome-design-md/` nếu cần |
| **Plan** | Mỗi todo ghi `Archify: <type> <candidate.json> → <output.html>` + `Entangled with: <files>` |
| **Verify** | `visual-check` + human review — 3 claims tách biệt: `deliver` (deterministic checks), `visual-check` (browser evidence), human (perceptual polish) |

**Ví dụ prompt cho CLAUDE_VS:**

```text
Use archify to draw Harness v2 runtime architecture:
Browser -> www/index.html -> status.json -> registry.json (Messier catalog)
-> audit.jsonl (light cone) -> policy.json (laws) -> credentials.enc.json (dark matter)
Show 10 core components, one primary path (Idea -> Product), trust boundaries, and put detail in cards.
```

```text
Analyze this repository, then use archify to create a high-level workflow diagram for Harness 8-phase pipeline.
Show Explore -> Clarify -> PRD -> Design -> Plan -> Implement -> Polish -> Verify, with branches for /fixbug loop.
```

## CLI Reference (zero-deps, Node 18+)

```bash
# Setup — chọn 1 trong 2:
npx skills add tt-a1i/archify -g                          # global (khuyên dùng)
# hoặc local vendor cho skill này:
node .github/skills/archify/scripts/install.mjs           # clone vào vendor/archify

# Doctor + demo
node archify/bin/archify.mjs doctor
node archify/bin/archify.mjs demo /tmp/archify-demo

# Guide (khi không chắc type)
node archify/bin/archify.mjs guide "Map Kafka topics, consumer groups, replay, DLQ" --json

# Validate / Deliver / Visual Check
node archify/bin/archify.mjs validate architecture candidate.json --quality showcase --json
node archify/bin/archify.mjs deliver architecture candidate.json out.html --quality showcase --json
node archify/bin/archify.mjs visual-check out.html --json

# Preview (desktop loopback-only, last-good)
node archify/bin/archify.mjs preview workflow input.json out.html --quality showcase

# Compare (Architecture Delta)
node archify/bin/archify.mjs compare architecture base.json head.json delta.html --json

# Brands (khi cần product identity thật)
node archify/bin/archify.mjs brands "Supabase" --json
node archify/bin/archify.mjs brands capture "https://supabase.com" --json
```

**Settings trong JSON:**

```json
{
  "meta": {
    "title": "Harness v2 Runtime",
    "locale": "en",
    "animation": "trace",
    "visual_preset": "classic",
    "quality_profile": "showcase"
  }
}
```

- `locale: en|zh-CN` chỉ localize Viewer UI, không dịch authored content
- `visual_preset` omit = `classic` (default); chỉ set `signal-flow`/`blueprint`/`editorial` khi user yêu cầu
- `animation: trace` là opt-in; static là default

## Authoring Invariants (rút gọn — đủ để pass showcase)

- **One main path** — side branches từ main-path node gần nhất; remove low-value edges trước khi thêm routing controls
- **Omit `visual_preset`/`subtitle`/`legend` mặc định** — chỉ thêm khi user yêu cầu rõ
- **Component types:** `frontend`, `backend`, `database`, `cloud`, `security`, `messagebus`, `external`; variants `default`/`emphasis`/`security`/`dashed`
- **Labels là semantic data** — khi collide: move label → adjust route/spacing → shorten wording (giữ meaning); không xóa label có protocol/action/direction
- **Spacing = clear gap**, không phải center distance; label clear gap > mask width
- **Automatic Port Spread** là default cho architecture/workflow/dataflow/lifecycle — skip khi có `via`/`channelX`/`channelY`/`labelAt` hoặc single relationship
- **Không bao giờ** để edge cross unrelated opaque node, ambiguous shared corridor, hoặc label mask another route
- **Viewer là first-screen artifact** — check 1440×900, 1600×1000, 1920×1080 (và 2048×1320 nếu wide); `scrollWidth <= innerWidth` và `scrollHeight <= innerHeight`
- Chi tiết đầy đủ: `references/authoring-contract.md` (chỉ đọc khi cần field enums, spacing math, geometry repair)

## Delivery & Verification — 3 claims tách biệt

1. **`deliver`** = deterministic artifact checks (9 checks showcase) — SHA-256 + byte counts
2. **`visual-check`** = bounded browser evidence (4 viewports, light/dark screenshots, contact sheet) — không approve perceptual polish
3. **Human review** = perceptual visual check — cần người hoặc image-capable reviewer

```bash
# Sau deliver, collect browser evidence (không modify HTML):
node archify/bin/archify.mjs visual-check <output.html> --json
```

- Keep 3 claims separate trong report — đừng claim visual inspection nếu không làm
- `preview` là loopback-only desktop mode: random `127.0.0.1` port, keep last-good qua failures, Ctrl-C để stop

## Mermaid Input — Đọc rồi author lại

- `flowchart`/`graph` → `workflow` hoặc `architecture`
- `sequenceDiagram` → `sequence`
- `stateDiagram` → `lifecycle`
- Đọc Mermaid cho **topology + meaning**, rồi author fresh Archify JSON — không copy Mermaid styling

## Tháo lắp (Harness Registry)

```bash
# Status
node .github/harness/scripts/harness-manager.mjs status
node .github/harness/scripts/harness-manager.mjs list --type skill

# Disable khi không cần (move → .disabled/, không xóa)
node .github/harness/scripts/harness-manager.mjs disable skill archify

# Enable lại
node .github/harness/scripts/harness-manager.mjs enable skill archify

# Preset: archify đã có trong web-product + full
node .github/harness/scripts/harness-manager.mjs preset apply web-product
```

- Registry: `.github/harness/registry.json` (source of truth, commit vào git)
- Sau `git clone`: `node .github/harness/scripts/harness-manager.mjs sync` để khôi phục
- Wise loading: chỉ load khi `description` match task (từ khóa `archify`, `diagram`, `architecture`, `workflow`, `sequence`, `Mermaid`)

## Examples cho CLAUDE_VS

- `examples/harness-architecture.json` — Harness v2 runtime (10 components, cosmic-quantum map)
- `examples/harness-workflow.json` — 8-phase pipeline + /fixbug loop
- `examples/web-app.html` — mở local để thử viewer (copy từ upstream)
- Live Proof Lab: https://tt-a1i.github.io/archify/gallery.html (11 scenarios, JSON sources, validation receipts)

## References

- Upstream: [tt-a1i/archify](https://github.com/tt-a1i/archify) · [Project page](https://tt-a1i.github.io/archify/) · [Guide](https://tt-a1i.github.io/archify/guide.html) · [Proof Lab](https://tt-a1i.github.io/archify/gallery.html)
- Skill contract: `archify/SKILL.md` (upstream) · Schema: `archify/schemas/README.md` · Cookbook: `docs/authoring-cookbook.md`
- Local: `scripts/install.mjs` (cài vendor) · `scripts/generate.mjs` (helper) · `references/authoring-contract.md` (invariants chi tiết)
- Harness: `.github/harness/registry.json` · `.github/harness/presets/*.json` · `docs/knowleged.md`

---
*Skill: archify v2.17 (port) — MIT, based on tt-a1i/archify. Tháo lắp via harness-manager, wise loading, 0 deps ngoài Node 18+.*
