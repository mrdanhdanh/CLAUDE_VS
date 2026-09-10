# Archify Authoring Contract — Rút gọn cho Harness v2

> Trích từ upstream `archify/SKILL.md` + `references/authoring-contract.md`. Đọc file này khi cần field enums, spacing math, geometry repair chi tiết. Mặc định chỉ cần `SKILL.md` Fast Authoring Path.

## Field Enums

### Architecture
- **Component `type`:** `frontend` | `backend` | `database` | `cloud` | `security` | `messagebus` | `external`
- **Component `variant`:** `default` | `emphasis` | `security` | `dashed`
- **Connection `variant`:** `default` | `emphasis` | `security` | `dashed`
- **Meta:** `title` (string), `subtitle` (omit mặc định), `locale` (`en`|`zh-CN`), `animation` (`trace` opt-in), `visual_preset` (omit=`classic` | `signal-flow`|`blueprint`|`editorial`), `quality_profile` (`showcase`|`standard`), `viewBox` ([w,h]), `legend` (`auto` default)

### Workflow (schema v2)
- Lanes, nodes, edges, route presets — xem `vendor/archify/schemas/workflow.schema.json`
- `schema_version: 2` cho workflow mới; `1` chỉ khi preserve legacy

### Sequence / Dataflow / Lifecycle
- Xem `vendor/archify/schemas/<type>.schema.json` tương ứng

## Spacing Math

- **Spacing = clear gap**, không phải center distance
- Label clear gap phải > measured mask width
- Automatic routes: first/final segment phải perpendicular với side
- **Port Spread:** default cho architecture/workflow/dataflow/lifecycle; skip khi có `via`/`channelX`/`channelY`/`labelAt` hoặc single relationship
- Near parallel ports dùng outside bridge để tránh sub-8px segment hoặc sub-16px interior turn
- Architecture: facing automatic ports (`left`/`right` hoặc `top`/`bottom`) giữ shared axis khi offset <16px và cả 2 ports còn corner clearance

## Geometry Repair Order

1. Move label
2. Adjust route/spacing
3. Shorten wording (giữ meaning)
4. Chỉ omit wording khi fully implied bởi cả 2 endpoints và không chứa protocol/action/direction/sync-async/cross-boundary mechanism
5. Mỗi lần sửa chỉ thêm **1 geometry control** (`via`, `channelX`, `channelY`, `labelAt`)

## Validation Gates

- **Showcase pass:** 9 artifact checks + 0 composition errors + 0 warnings
- **Basic:** 4 checks — không phải showcase acceptance
- Nếu thiếu/sai `meta.quality_profile` → fix trước geometry
- Workflow v2: `validate workflow <candidate> --layout-json` để lấy compiler receipt

## Delivery Contract

- `deliver` freeze spec bytes → private snapshot → render → check → atomic rename → SHA-256 receipt
- Non-zero exit = never success; failed delivery giữ artifact cũ byte-for-byte
- `visual-check` chỉ inspect delivered HTML, không modify/rerender; 4 viewports + light/dark screenshots + contact sheet
- 3 claims tách biệt: `deliver` (deterministic) | `visual-check` (browser evidence) | human (perceptual)

## Brand Marks

- Built-in ID trong `brand` khi node là real product
- Nếu không có preset và user cung cấp official URL: `node bin/archify.mjs brands capture "<url>" --json` → digest-pinned `brand` object
- Render/validate không bao giờ tự capture unpinned

## Mermaid Mapping

- `flowchart`/`graph` → `workflow` hoặc `architecture`
- `sequenceDiagram` → `sequence`
- `stateDiagram` → `lifecycle`
- Đọc topology + meaning, author fresh JSON — không copy Mermaid styling

## Viewer Runtime (chỉ khi user hỏi)

- Theme, pan/zoom, search, focus, reach, route, lens, story, presentation, exports đã có sẵn trong HTML
- `meta.animation: "trace"` opt-in; `meta.views` ≤5 chapters
- Deep links: `#focus=id`, `#route=src~dst`, `#lens=kind~kind`, `#view=id`, `#relation=id`
- Chi tiết: `vendor/archify/references/viewer-runtime.md` (upstream)

---
*Source: tt-a1i/archify — MIT. Rút gọn cho Harness v2, đủ để pass showcase.*
