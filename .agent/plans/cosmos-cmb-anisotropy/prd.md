# PRD — CMB Anisotropy: Bản đồ điểm lạnh (KN × tag × thời gian)

> Cosmic-Quantum: Macro `knowleged.md` = **CMB của Harness** — phông nền tri thức mọi quyết định in trên đó; đo anisotropy = tìm vùng trời lạnh · Micro `auto-learn.mjs stats --heatmap` đo 1 lần <100ms, state collapse tại `www/cosmos/heatmap.json` · Entanglement `www/cosmos/scale.html` ↔ `www/cosmos/heatmap.json` ↔ `cosmos-future.spec.ts`/`cosmos-slides.spec.ts` ↔ `www/cosmos/index.html#future` ↔ `slides.html` slide 15 ↔ `package.json` (cosmos:refresh)

**Ngày:** 2026-09-12 · **Nguồn:** roadmap card #3 `www/cosmos/index.html#future` (đã queue từ cosmos-future-roads, wording gốc: *"Đo phân bố KN theo tag × thời gian: điểm lạnh (ít KN nhưng bug hay nổ) = vùng trời sắp có biến → ưu tiên viết KN; KN 0 tham chiếu trong bugs/plans → gộp hoặc xoá cho CMB sạch."*)

## Vấn đề

`knowleged.md` là CMB — nhưng hiện **không ai đo được anisotropy của nó**:
- Phân bố KN theo tag × thời gian là ẩn — tag nào đang "nóng" (nhiều KN mới), tag nào đang "lạnh" (bug nổ nhiều hơn bài học) không nhìn thấy được.
- KN viết rồi không ai tham chiếu (0 refs trong bugs/plans) — nợ taxonomy tích tụ âm thầm, CMB ngày càng đục.
- `auto-learn.mjs status` chỉ đếm tổng + top 5 tag — không có chiều thời gian, không có cold-spot.

## Đo lường (user stories)

- **US-1:** Chạy `auto-learn.mjs stats --heatmap` → thấy ngay: bao nhiêu KN/bug/tag, tháng nào có bao nhiêu KN, **điểm lạnh** (bug > KN), **KN 0 tham chiếu**.
- **US-2:** Mở `scale.html#cmb` → nhìn heatmap tag × tháng (đậm = nhiều KN), danh sách điểm lạnh, danh sách KN 0 ref ngay trên dashboard — không cần terminal.
- **US-3:** `npm run cosmos:refresh` sinh `www/cosmos/heatmap.json` (mirror, cùng pattern graph/hawking/scale.json) — dashboard chỉ đọc, không ghi (KN-030).

## Scope

**GIỮ:**
1. Command mới `auto-learn.mjs stats --heatmap [--json] [--out <f>] [--now ISO]` (0 dep, đọc `docs/knowleged.md` + `.agent/bugs/**` + `.agent/plans/**`).
2. Điểm lạnh: `coldness = bugCount − knCount`, cold khi ≥1 (per tag, union 2 phía).
3. KN 0 tham chiếu: KN id không xuất hiện trong `.agent/bugs/**` + `.agent/plans/**` (md/json). Action: `fresh` nếu tuổi < 14 ngày (từ `--now`), ngược lại `merge-or-delete`.
4. Section `#cmb` trên `scale.html`: 3 card (heatmap grid / điểm lạnh / KN 0 ref) + code-block + fresh badge + error path.
5. `heatmap.json` mirror + bước mới trong `npm run cosmos:refresh`.
6. Đồng bộ vòng đời roadmap: gỡ card CMB khỏi `index.html#future` (5→4 đề tài, 8→9 hướng đã ship), thêm vào shipped-line slide 15 + chips 5→4, sync 3 spec.
7. Docs: cosmic-quantum SKILL + instruction §8 + mirror `.claude/rules/cosmic-quantum.md`.

**CẮT (YAGNI — minimal-ladder):**
- ❌ Không auto-merge/auto-xoá KN (chỉ báo cáo + gợi ý) — mutation cần human, giống Hawking sign-off.
- ❌ Không thêm flag `--top`, `--tag` filter, export CSV — chưa có nhu cầu thật.
- ❌ Không phân tích "tag mồ côi" (kn=1 bug=0) thành mục riêng — grid đã hiện các row mờ đó; thêm mục = vanity metric (bài học từ dissent Hawking trước).
- ❌ Không đụng `auto-learn.instructions.md` / `README.md` / `knowleged.md` — 3 file này đang được **session song song** (RSI/safety) sửa chưa commit; đụng vào = sweep thay đổi của họ. Ghi chú lại cho session đó.
- ❌ Không vẽ chart mới bằng canvas — heatmap là grid div + CSS (không cần canvas như timeline).

## Constraints (đo được)

- Command chạy < 500ms (đọc 252 ref files + parse KNs — recon đo thực tế).
- `heatmap.json` < 30KB (104 tag × 2 tháng + lists — thoải mái).
- Deterministic: cùng `--now` → cùng output (test được).
- Responsive 375/768/1280; a11y roles; không phá 101 test hiện có.
- Heatmap UI hiển thị top 12 rows (note phần còn lại) — card không dài quá các section khác.

## Non-goals

- Không gate exit-code theo cold spot (khác Escape Velocity — đây là bản đồ quan sát, không phải gate; gate dễ biến thành vanity alarm khi taxonomy còn nhiễu).
- Không tự động sửa tag taxonomy (104 tag/48 KN — cleanup là quyết định human dựa trên báo cáo này).

## Persistence · F5 · Scope

- `Persistence: www/cosmos/heatmap.json (committed mirror, sinh bởi stats --heatmap --out) · F5: giữ (static file) · Scope: global (mọi người thấy cùng bản mirror)` — dashboard **chỉ đọc**, không có nút ghi.

## Dissent Review

**Who did you think with?** Critic-pass tự chạy trên chính PRD này + recon data thật (`verify/recon-output.txt`):

1. **Rival framing — "làm heatmap = vanity metric":** bản đồ phân bố có thể chỉ để nhìn, không ép hành động (Hawking từng bị nghi vậy). *Phản biện:* CMB cho ra **hành động cụ thể**: (a) cold spot → viết KN cho đúng tag đó; (b) 0-ref KN → gộp/xoá. Cả hai đều actionable, và kết quả recon đầu tiên đã ra 5 cold + 3 zero-ref — không rỗng.
2. **Assumption có thể sai — "tag taxonomy đủ sạch để đo":** 104 tag/48 KN = phân mảnh cao (nhiều tag xuất hiện 1 lần, sinh từ research batches). *Xử lý:* formula chỉ flag cold khi bug≥1 (dữ liệu thật, không flag tag suông); UI hiện cả kn/bug để human tự phán; không gate exit-code. Ghi rõ hạn chế này trong design.
3. **Metric dissent — `coldness = bug − kn` là thô:** tag 10 KN/11 bug bị flag như tag 0 KN/1 bug. *Phản biện:* với N nhỏ (48/29), ratio nổ (1/0 = ∞) và khó giải thích; hiệu số trực quan ("bug nhiều hơn bài học"), threshold ≥1 bảo thủ; grid hiện số tuyệt đối để human phán — tool báo cáo, người quyết.

## Acceptance

- [ ] `stats --heatmap --json` valid JSON, invariant: mọi row `total === Σcells`; mọi cold `coldness === bug − kn > 0`; `--now` deterministic.
- [ ] `--out www/cosmos/heatmap.json` hoạt động; `cosmos:refresh` gồm bước mới.
- [ ] `scale.html#cmb` render 3 card từ mirror thật + error path + 375px không tràn.
- [ ] index.html còn 4 đề tài, counter "9 hướng cũ đã ship — còn 4"; slides 4 chips + shipped-line có CMB; 3 spec sync xanh.
- [ ] Full suite xanh (101 cũ + new); slop-check 0 finding mới; evidence đầy đủ; audit log + deploy + live verify.
