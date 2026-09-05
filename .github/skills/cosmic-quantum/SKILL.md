---
name: cosmic-quantum
description: "Cosmic-Quantum Thinking — triết lý vũ trụ + lượng tử cho Harness. Use when designing system philosophy, harness theory, product vision, need cosmic/quantum metaphors, scale thinking, entanglement, superposition, uncertainty, or user says vũ trụ/lượng tử/cosmos/quantum/triết lý/lý thuyết/hệ thống/scale"
user-invocable: true
---

# Cosmic-Quantum Thinking — Skill

> **Vũ trụ (Macro) + Lượng tử (Micro) = Triết lý Harness.** Một ý tưởng là Big Bang, pipeline là định luật vật lý, mỗi phase là một trạng thái lượng tử — chỉ khi quan sát (verify) mới thành thật.

## When to Use
- Thiết kế triết lý hệ thống, product vision, harness theory
- Cần metaphor vũ trụ/lượng tử để giải thích scale, liên kết, bất định
- Task nhắc tới: vũ trụ, lượng tử, cosmos, quantum, triết lý, lý thuyết, hệ thống, scale, entanglement, superposition, uncertainty
- Muốn storytelling cho product (landing, docs, pitch) với vibe khoa học sâu
- Cần khung tư duy 2 tầng (macro/micro) để quyết định kiến trúc

## Core Philosophy — 2 Tầng

### 🌌 Tầng Vũ Trụ — Macro (Hệ thống)
| Khái niệm vũ trụ | Ánh xạ Harness | Ý nghĩa |
|------------------|----------------|---------|
| **Big Bang** | `Idea` | Một câu ý tưởng nổ ra → sinh không gian sản phẩm |
| **Vũ trụ giãn nở** | `Explore → Clarify` | Mở rộng không gian khả thi, rồi chọn hướng |
| **Hình thành thiên hà** | `PRD → Design` | Từ hỗn mang → cấu trúc, định luật, design system |
| **Hệ sao / Hành tinh** | `Plan → Implement` | Mỗi todo là một hành tinh, có quỹ đạo (dependency) |
| **Tinh vân Polish** | `Polish` | Bụi vũ trụ được đánh bóng thành sao sáng (UI đẹp) |
| **Quan sát thiên văn** | `Verify` | Không quan sát = không tồn tại (verify mới tính) |
| **Định luật vật lý** | `Process > Model` | Pipeline là định luật — model nào cũng phải tuân theo |

**Nguyên tắc Macro:**
- **Scale có cấu trúc:** `www/` là vũ trụ, mỗi `plan/skill/component` là thiên hà — không có cấu trúc = hỗn loạn.
- **Quy luật > Đoán:** Vũ trụ không đoán, Harness không đoán — mọi thứ qua pipeline.
- **Ánh sáng cần thời gian:** Product đẹp cần đủ 8 phase, không đốt cháy giai đoạn (như ánh sáng từ thiên hà xa).

### ⚛️ Tầng Lượng Tử — Micro (Thực thi)
| Khái niệm lượng tử | Ánh xạ Harness | Ý nghĩa |
|--------------------|----------------|---------|
| **Superposition** | Trước `Clarify` | Mọi ý tưởng đồng thời tồn tại — chưa chọn = chưa thật |
| **Sụp đổ hàm sóng** | `Clarify` | Hỏi 1 câu chốt → 1 trạng thái duy nhất |
| **Entanglement** | Liên kết phase | Sửa `Design` → `Implement`/`Polish` đổi tức thì |
| **Bất định Heisenberg** | `get_errors` / đo `--angle` | Không đo = không biết — phải verify mới xác định |
| **Đường hầm lượng tử** | `Minimal Ladder` | Tìm đường ngắn nhất qua rào cản (YAGNI, reuse, native) |
| **Decoherence** | Thiếu process | Không có pipeline → hệ mất kết dính, bug tràn |
| **Quan sát tạo thực tại** | `Verify` gate | Chỉ khi `build/test/lint` pass mới được claim Done |

**Nguyên tắc Micro:**
- **Không đoán — phải đo:** Như đo lượng tử, phải `get_errors`, Playwright đo `--angle`, `audit verify`.
- **Một thay đổi, toàn hệ đổi:** Entanglement — sửa 1 file phải check affected files.
- **Tối thiểu mà đủ:** Quantum tunneling — đi xuyên rào cản bằng cách tối thiểu (ladder nấc 1-7).

## Workflow — Áp dụng vào task

### 1. Khởi tạo (Big Bang + Superposition)
- Ghi ý tưởng 1 câu → liệt kê 3-5 khả thi (superposition) → `Clarify` chốt 1 (collapse).

### 2. Kiến trúc (Thiên hà + Entanglement)
- Vẽ map: `PRD` (định luật) → `Design` (cấu trúc) → `Plan` (quỹ đạo). Đánh dấu entanglement: file nào đổi sẽ kéo file nào.

### 3. Thực thi (Hành tinh + Tunneling)
- Chạy `Minimal Ladder` 7 nấc cho mỗi todo: YAGNI? reuse? stdlib? native? dep đã cài? 1 dòng? mới viết tối thiểu.
- Mỗi edit → `get_errors` (đo bất định) → fix ngay.

### 4. Polish & Verify (Tinh vân + Quan sát)
- Polish: responsive 375/768/1280, states, animation 150-300ms, a11y ≥4.5:1 (đánh bóng tinh vân).
- Verify: `build/test/lint` + visual check + `audit verify` — không quan sát = chưa xong.

## Integration với Harness v2

- **PRD:** Thêm dòng `Cosmic-Quantum: Macro <vũ trụ scale> · Micro <lượng tử state> · Entanglement <file liên kết>`
- **Design:** Chọn vibe: `cosmic dark` (nebula, starfield) hoặc `quantum light` (glass, superposition blur) — dùng `awesome-design-md/search.mjs` để chọn DESIGN.md.
- **Plan:** Mỗi todo ghi `Entangled with: <files>` + `Ladder nấc: <1-7>`
- **Verify:** Checklist thêm `Đã đo (get_errors/build) chưa? Entanglement có vỡ không?`

## System Map — Harness → Cosmos (đủ 48 thực thể)

| Harness có sẵn | Map vũ trụ | Vì sao hợp |
|----------------|------------|------------|
| `docs/knowleged.md` (15 KN) | **CMB — bức xạ nền** | Tín hiệu mờ từ mọi vụ nổ quá khứ, agent nào cũng phải đọc trước khi code |
| `.agent/audit.jsonl` (`prevHash→hash`) | **Nón ánh sáng + mạng lưới vũ trụ** | Chuỗi nhân quả — `verify` là kiểm tra tính nhân quả |
| `.agent/policy.json` (deny trước allow) | **Định luật vật lý + chân trời sự kiện** | `refused` = không thoát như event horizon; luật vỡ là deny all |
| `.agent/credentials.enc.json` | **Vật chất tối** | Khối lượng vô hình giữ thiên hà, never logged, chỉ đếm |
| `.agent/routines.json` (cron) | **Pulsar** | Hải đăng tick chuẩn giờ — miss là biết hệ lệch |
| `www/status.json` + `index.html` | **Quasar + Đài thiên văn** | Vật sáng nhất nhìn từ xa; `index.html` là kính Hubble |
| `.github/harness/registry.json` | **Danh mục sao (Messier)** | Catalog 48 thiên thể; lệch filesystem là drift vũ trụ |
| `presets/` (full/web-product/api-minimal) | **Đa vũ trụ** | `preset apply` là nhảy vũ trụ song song |
| `**/.disabled/` | **Thiên hà ngủ đông** | Không xóa, chỉ ngủ — cần là đánh thức |
| `.agent/bugs/` + `.agent/plans/` (~40 plans) | **Tàn tích supernova + hệ hành tinh** | Mỗi bug nổ gieo nguyên tố mới (KN); mỗi plan là hệ sao |
| `auto-learn.mjs` suggest/log/propose | **Khảo sát bầu trời (SDSS)** | Quét CMB → phát hiện → ghi catalog tự động |
| `context.mjs` quarantine/compress/isolate | **Bộ lọc vũ trụ khả kiến** | Window có hạn như chân trời — phải lọc mới nhìn xa |
| `awesome-design-md/` (74 designs) | **Hubble Deep Field** | 74 thiên hà để soi vibe cosmic dark / quantum light |
| Wise loading (skill chỉ load khi match) | **Kích thích trường lượng tử** | Instruction là trường phủ khắp, skill là hạt khi đủ năng lượng |
| `manage_todo_list` (1 in-progress) | **Nguyên lý loại trừ Pauli** | 2 todo không chiếm cùng trạng thái — vi phạm là decoherence |

## New Theory — Mở rộng (vũ trụ học thật)

- **Dark Energy ↔ Scope creep:** vũ trụ giãn nở gia tốc như feature phình. Đối trọng là gravity = `minimal-ladder` + YAGNI. Đo bằng diff stat mỗi Verify.
- **Entropy / Heat death ↔ Tech debt:** không bơm năng lượng (audit + `generate-status` + polish) thì hệ drift tới hỗn loạn. Meter: `S = mismatch + dead-code + drafts`.
- **Black Hole ↔ Bottleneck:** `MSB3027 file lock` (KN-008), `2 workflow giành Pages env` (KN-015) — kỳ dị mà velocity không thoát. Qua event horizon là phải human takeover.
- **Cosmic web ↔ Entanglement graph:** audit hash + `Entangled with:` vẽ thành filament — sửa 1 file kéo theo chòm nào.
- **Double-slit + Schrödinger's bug ↔ Heisenbug:** KN-014 smoke treo vì import side-effect — quan sát làm đổi kết quả.
- **Quantum error correction ↔ 3-fix limit + TDD gate:** RED-GREEN-REFACTOR là mã sửa lỗi, `verify` là syndrome measurement.
- **Chân không lượng tử ↔ Flaky:** BOM, path `\` vs `/`, `node --check` CJS — dao động nền, cần quarantine trước.

Công thức Lab: bất định $\Delta x \cdot \Delta p \ge \hbar/2$ ↔ `get_errors` chính xác thì `build` mờ; entropy $S = k \log W$ ↔ debt tăng theo số trạng thái không đo.

## References
- `docs/harness-flow.md` — pipeline 8 phase (ánh xạ vũ trụ)
- `.github/instructions/cosmic-quantum.instructions.md` — rule enforce
- `www/cosmos.html` + `www/cosmos/index.html` (mirror) — demo visual vũ trụ + lượng tử
- `www/cosmos/scale.html` — dashboard entropy + black-hole (skill cosmic-scale)
- `.github/skills/cosmic-scale/SKILL.md` — đo entropy, bottleneck, dark-matter map
- `awesome-design-md/` — 74 DESIGN.md cho vibe cosmic/quantum
- Sách gợi ý (nếu có trong `www/library/`): search `vũ trụ`, `lượng tử`, `quantum`, `cosmos` qua MCP `search_library`

---
*Skill: cosmic-quantum — Triết lý 2 tầng cho Harness v2. Process là định luật, verify là quan sát.*
