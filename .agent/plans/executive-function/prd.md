# PRD — Executive Function × Harness (ADHD-aware)

> Đưa mô hình ADHD/executive function vào harness như tầng triết lý + vận hành + sản phẩm trang `www/executive-function/`.
> Cosmic-Quantum: Macro harness = khung xương ngoài của executive function (externalize) · Micro 6 EF ↔ cơ chế đã có, mỗi mapping phải trỏ cơ chế thật trong repo · Entanglement `.github/instructions/*` ↔ `docs/knowleged.md` ↔ `www/executive-function/` ↔ `generate-status.mjs` ↔ `tests/e2e/`

## Problem
- Harness đã giải quyết nhiều failure modes của "bộ não hữu hạn" (3-fix limit, todo, `context.mjs`, plans...) nhưng **rải rác, không có mô hình chung** → mỗi lần gặp lại xử như bug mới; cả agent lẫn người dùng không hiểu *vì sao* các cơ chế tồn tại.
- ADHD (mô hình Barkley — EF deficit): không phải thiếu chú ý — là khó **điều hành** chú ý/hành vi; giải pháp nền tảng = **externalize** (bộ nhớ / thời gian / luật / động lực ra môi trường). Cùng nguyên lý áp đúng cho AI agents (context = working memory hữu hạn, không time-sense, dễ distraction).
- YUNIE + agents chưa có **output rules thân thiện working memory** (kết luận trước, 1 next step, chunk, micro-win) — nằm rải trong personality §7/§17 nhưng chưa hệ thống hóa.

## User stories
- **Người dùng harness:** hiểu vì sao hệ thống này thân thiện với người khó tập trung/ADHD; có trang trực quan + lab demo để *cảm nhận* (không phải đọc lý thuyết).
- **Agent trong harness:** có instruction `executive-function` — gặp loop/quên/né/wall-of-text → tra bảng EF failure modes thay vì fix mò từng lần.
- **YUNIE:** persona có section ADHD-friendly output — kết luận trước, 1 next step, chunk, micro-win, không dội tường chữ.

## Scope (trong)
1. Instruction `.github/instructions/executive-function.instructions.md` — **create qua `harness-manager`** (sync registry).
2. KN-054 + anti-patterns vào `docs/knowleged.md`.
3. Output rules: `yunie-personality.instructions.md` §18 + bullet trong `yunie.agent.md` + focus guard ngắn trong `harness-workflow.instructions.md`.
4. Trang `www/executive-function/index.html` — **mapping explorer** (tabs 6 EF ↔ cơ chế harness) + **lab "working memory bị chiếm"** (nhớ → nhiễu → nhớ lại → kết quả).
5. `generate-status.mjs` pageMeta + regenerate `www/status.json` + `export-claude` mirror `.claude/`.
6. E2E `tests/e2e/executive-function.spec.ts` (tabs, lab flow, responsive 375, no pageerror, link về STATUS).

## Non-goals (CẮT — YAGNI)
- ❌ Không app/persistence — lab chạy in-memory, F5 reset. Không backend.
- ❌ Không thêm dependency mới (0-dep, house style).
- ❌ Không tư vấn y khoa/chẩn đoán — trang ghi rõ "không thay thế chẩn đoán chuyên khoa"; không quiz tự đánh giá lâm sàng.
- ❌ Không copy nguyên văn tài liệu ADHD — paraphrase tối thiểu đủ dùng (tránh copyright + slop).
- ❌ Không đụng core pipeline 8 phase — chỉ thêm 1 section focus guard ngắn vào `harness-workflow`.
- ❌ Không thêm cơ chế harness mới chỉ để "map đẹp" — mapping BẮT BUỘC trỏ cơ chế đã tồn tại.

## Persistence
Persistence: **không lưu** (in-memory state của lab) · F5: **reset** · Scope: per-browser session. Trang static thuần, mọi link relative (`./`, `../index.html`), không fetch ngoài deploy root.

## Success metrics (đo được)
- [ ] `harness-manager status` thấy instructions enabled 18→19 + registry có `executive-function`.
- [ ] E2E `executive-function.spec.ts` pass (tabs aria + lab flow điểm 4/4 & 2/4 + responsive 375 + no pageerror).
- [ ] `generate-status.mjs` chạy → `status.json` có entry `executive-function/index.html`.
- [ ] Full suite Playwright không regression (status/cosmos specs cũ).
- [ ] KN-054 có trong bảng tóm tắt + chi tiết; `audit.mjs verify` chain OK.
- [ ] `slop-check.mjs` pass trên changed files.

## Dissent Review (KN-018)
- **Framing đối lập #1:** "Có cần instruction mới không, hay chỉ cần trang web giáo dục?" → Trang web chỉ *giáo dục người*; agent không bao giờ load (wise loading: chỉ load khi description match). Agent failure modes cần **enforcement** (luật load sẵn), không phải education → cần instruction. Giữ cả hai nhưng vai khác nhau: trang = cho người, instruction = cho agent.
- **Framing đối lập #2:** "ADHD metaphor cho agent dễ thành nhãn dán vô nghĩa (vanity-mapping)" → Giảm thiểu bằng quy tắc cứng: mỗi mapping trong instruction **phải trỏ tới cơ chế đã tồn tại** (file/script/limit cụ thể), không thêm cơ chế mới chỉ để map đẹp + test bắt invariant trên trang. Nếu một EF không có cơ chế thật → ghi thẳng "chưa có" thay vì bịa.
- **Who did you think with?:** Critic framing tự đặt (2 đối trọng trên) + đối chiếu `minimal-ladder` (cắt gì: app/persistence/dep mới) + `fund-the-friction` (giữ gì: lab tương tác vì trực giác hóa là giá trị, không cắt thành trang chữ).
- **Pilot-in-command:** sếp chọn hướng C; YUNIE là crew thực thi.

## Nguồn
- Mô hình EF deficit của ADHD (Russell Barkley) — paraphrase tối thiểu, không copy.
- DSM-5: 3 presentation types (inattentive / hyperactive-impulsive / combined).
- House pattern: `www/waymo-effect/` (slide), `KN-018` (dissent review), `KN-047` (slop gate), `KN-050` (a11y contract).
