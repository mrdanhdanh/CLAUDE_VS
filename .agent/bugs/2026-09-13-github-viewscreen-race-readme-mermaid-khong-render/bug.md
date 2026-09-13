> 🤖 Auto-log bởi auto-learn.mjs — 2026-09-13T16:18:45.321Z
> **Error:** `GitHub front page bao: Unable to render rich display - Cannot read properties of undefined (reading 'render') tai block mermaid trong README.md`
> **File:** `README.md`
> **Title:** GitHub viewscreen race - README mermaid khong render

> 🔁 **RADAR TÁI LẬP** — đối chiếu KN + bug cũ thấy nghi vấn:
> - 🔁 NGHI TÁI LẬP **[KN-015]** (score 103.9): GitHub Pages deploy fail — 2 workflows cùng `github-pages` env + eval-gate Node 18 CJS
> - 🔁 NGHI TÁI LẬP **[KN-045]** (score 77): STATUS audit: link footer 404 trên Pages + registry placeholder descriptions + aria-labelledby tab sai ID
> - 🔁 NGHI TÁI LẬP **[KN-053]** (score 60.7): `git checkout HEAD -- <file>` revert nhầm refactor chưa commit — recover bằng VS Code Local History
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-12-status-page-audit`** (score 71.9): STATUS page audit — footer link 404 + registry placeholder descriptions + aria-l
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-04-pages-deploy-conflict-2-workflows`** (score 69.8): pages deploy conflict 2 workflows
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-13-git-checkout-head-revert-nham-refactor-chua-commit`** (score 33.8): git checkout HEAD -- revert nhầm refactor chưa commit của auto-learn.mjs
> → Đọc **Cách phòng tránh** trong `docs/knowleged.md` TRƯỚC khi fix. Nếu là tái lập thật: ghi rõ "tái lập của KN-015" + **vì sao lưới cũ không bắt được** → nâng lưới (Guard) rồi mới fix.
# Bug: GitHub viewscreen race - README mermaid khong render

> Copy file này vào `.agent/bugs/2026-09-13-github-viewscreen-race-readme-mermaid-khong-render/bug.md` khi bắt đầu `/fixbug`.

## Meta

- **Slug:** `2026-09-13-github-viewscreen-race-readme-mermaid-khong-render`
- **Ngày:** 2026-09-13
- **Severity:** `minor` (cosmetic front page — không mất dữ liệu, không lỗi chức năng; nhưng user thấy ngay trang đầu repo)
- **Reporter:** @mrdanhdanh / YUNIE
- **Related KN:** `KN-058`
- **Tags:** `ui` `render` `github` `mermaid` `race` `docs` `verify`
- **Guard:** `tests/e2e/readme-guard.spec.ts` — cấm ` ```mermaid ` trong README.md + bắt buộc SVG light/dark tồn tại & được tham chiếu
- **Status:** `fixed`

---

## 1. Reproduce

### Steps
1. Mở `https://github.com/mrdanhdanh/CLAUDE_VS` (front page — README render) — một số môi trường browser/shard của GitHub
2. Tại section "Sơ đồ /harness + /fixbug": box đỏ **"Unable to render rich display"** thay cho diagram mermaid
3. So sánh: cùng block đó trên blob page `blob/main/README.md` render OK; `docs/harness-flow.md` (4 diagram) render OK

### Expected vs Actual
- **Expected:** flowchart pipeline hiện ra (như các diagram khác trong repo)
- **Actual:** `Unable to render rich display — Cannot read properties of undefined (reading 'render')` + link docs GitHub

### Evidence
- Error box (user paste + fetch tool xác nhận 3/3 lần trên front page):
```
Unable to render rich display
Cannot read properties of undefined (reading 'render')
For more information, see https://docs.github.com/get-started/writing-on-github/...
```
- **Repro 100% message bằng bundle thật của GitHub** (`viewscreen.githubusercontent.com/static/assets/mermaidMarkdown-0cdab810ac992b6822c1.js`, mermaid **11.17.2** embedded): load bundle trong iframe + parent gửi `ack` rồi dispatch `code_rendering_service:ready:ack` **TRƯỚC** `code_rendering_service:data:ready` → app post đúng message lỗi y nguyên:
```
{"type":"render","body":"error","payload":{"error":"Cannot read properties of undefined (reading 'render')..."}}
```
- Mermaid source **pass mọi version**: 10.2.1 → 11.17.2 (sweep 15 versions, có negative control) + render OK trong chính bundle GitHub khi thứ tự message đúng
- Live capture parent→iframe (4 lần): thứ tự chuẩn = `ack` → `branding` → `data:ready` → (render ~0.7s) → `ready:ack`

### Environment
- Branch: `main`
- Commit: `1f227ee` (bug trên front page); fix local chưa commit
- OS/Browser: **environment-dependent** — fail trên fetch tool + browser user; pass trên Chromium (Playwright, 5 config: viewport 480/1280/1920/tall + CPU throttle 6x)

---

## 2. Root Cause (5 Whys)

- **File:Line:** GitHub `mermaidMarkdown-*.js` (viewscreen app, không thuộc repo) — handler `document.addEventListener(r.Yd.readyAck, () => this.onAfterLoad(i, !1))` với `i` (view) còn `undefined`
- **Why 1:** Box lỗi do `reportError` của viewscreen app gửi về parent khi `onAfterLoad` catch TypeError
- **Why 2:** `onAfterLoad(t)` gọi `t.render()` — `t` undefined vì event `ready:ack` xử lý TRƯỚC event `data` (view chưa được tạo)
- **Why 3:** Parent viewscreen gửi `ready:ack` để đáp lại status `ready` (ack:true) mà iframe gửi SAU khi render thành công — nhưng trong môi trường bị lỗi, ack này tới một DOCUMENT MỚI (iframe bị replace/reload sau khi render)
- **Why 4:** GitHub home page (React repo overview) thay/re-create DOM enrichment; race giữa "replace iframe" và "giao ready:ack (rAF + setTimeout 0)" → ack rơi vào document mới chưa có data
- **Why 5 (Root):** Race phía GitHub viewscreen — thứ tự `ready:ack` vs `data` không được bảo đảm; **nội dung mermaid KHÔNG liên quan** (crash xảy ra trước khi parse — repro được với bất kỳ diagram nào, kể cả không có data)

- **Impact:** Front page repo — block mermaid duy nhất trong README hiện box lỗi ở môi trường bị ảnh hưởng (fetch tool 3/3; user). Blob page + docs khác không ảnh hưởng.
- **Hypothesis:** Ban đầu nghi syntax mermaid (emoji/quotes/`<br/>`/Vietnamese) — **bác bỏ bằng sweep version + render bằng chính bundle GitHub**; sau đó nghi payload encode — bác bỏ bằng capture live (payload raw, `data-content` parse OK, 2 trang giống nhau byte)
- **Confidence:** `HIGH` cho root cause + fix (message repro y nguyên bằng bundle thật; fix loại bỏ iframe → không còn đường lỗi). Trigger môi trường cụ thể (vì sao replace) là suy luận — ghi rõ, không claim quá.

---

## 3. Fix

- **Approach:** Không thể sửa race phía GitHub → **loại bỏ đường lỗi**: front page dùng SVG tĩnh render bằng mermaid 11.17.2 (`htmlLabels:false` — portable trong `<img>`), `<picture>` với 2 theme (light/dark). Nguồn mermaid giữ ở `docs/harness-flow.md`.
- **Files Changed:**
  - `README.md` — block ` ```mermaid ` → `<picture>` + 2 SVG; update counts (57 KN/38-39 bugs/83 plans/19-19/16 demos); section Knowledge/Governance/Cấu trúc/Docs/footer
  - `docs/assets/harness-pipeline-light.svg` + `-dark.svg` — MỚI (dark có fill tối cho 2 node custom-style để đủ contrast)
  - `tests/e2e/readme-guard.spec.ts` — MỚI (guard 3 invariant)
  - `www/status.json` — regenerate (STATUS)
- **Diff tóm tắt:**
```diff
- ```mermaid\n flowch...  (iframe rich-display — race)
+ <picture><source media="(prefers-color-scheme: dark)" srcset="docs/assets/harness-pipeline-dark.svg">
+ <img alt="Harness pipeline: Idea → ... → Done (Fail → fix loop về Implement)" src="docs/assets/harness-pipeline-light.svg"></picture>
+ tests/e2e/readme-guard.spec.ts  (guard)
```
- **Non-Goals:** (1) Không sửa syntax mermaid — đã chứng minh vô nghĩa (crash trước parse); (2) Không đổi 4 diagram trong `docs/harness-flow.md` (blob page render OK); (3) Không file bug GitHub — không có account/kênh chính thức từ đây, đã ghi chép đầy đủ trong bug này để report nếu cần.
- **Fix Confidence:** `HIGH` — workaround loại bỏ hoàn toàn iframe (không còn code path gây lỗi); source of truth mermaid vẫn tồn tại.
- **get_errors:** README + spec → 0 errors.

---

## 4. Verification

- [x] Re-run steps reproduce → **Fixed** (README không còn iframe rich-display — SVG tĩnh render ở mọi môi trường)
- [x] Edge cases:
  - [x] Dark mode: `<picture>` + `prefers-color-scheme` + SVG dark fill đủ contrast (đo bằng screenshot 2 theme)
  - [x] SVG portable trong `<img>`: `htmlLabels:false` (không foreignObject), font system, không external ref
- [x] Regression: blob pages + harness-flow diagrams không đổi; guard spec pass
- [x] `get_errors` **toàn scope** → 0 errors
- [x] `lint` / `build` / `test` → PASS
- [x] UI audit: không đổi UI; asset SVG có alt text + title thay thế
- [x] Fresh-eyes tier: `OPTIONAL` (deterministic — file-based assertion)

**Kết quả:**
```
$ npx playwright test tests/e2e/readme-guard.spec.ts --reporter=list
  3 passed (4.9s)
$ node .github/harness/scripts/generate-status.mjs
  ✅ Generated www\status.json — counts 19/19, 19/19, 9/9, 7/7, 1/1 — JSON valid ✅
```

---

## 5. Lesson (1 câu)

> Front page README không phụ thuộc renderer bên thứ ba — mermaid trên GitHub là iframe có race (`ready:ack` trước `data` → "Cannot read properties of undefined (reading 'render')"); syntax đúng không cứu được — dùng asset tĩnh (SVG `<picture>` light/dark) + guard cấm mermaid trong README.

---

## 6. Prevention

- **Cách phòng tránh lần sau:**
  - [x] Guard: `tests/e2e/readme-guard.spec.ts` — cấm ` ```mermaid ` trong README.md; bắt buộc SVG light/dark tồn tại + được tham chiếu; mermaid source phải còn ở `docs/harness-flow.md`
  - [x] Khi rich-display/lỗi render bên thứ ba: **repro bằng chính bundle của họ** (download asset → chạy in-process) trước khi sửa — tránh sửa mù theo triệu chứng (KN-023)
  - [x] Docs/trang quan trọng dùng asset tĩnh khi renderer ngoài không kiểm soát được — "renderable ở mọi môi trường" là tiêu chí, không phải "render được ở máy mình" (KN-019)
  - [x] Thêm checklist vào `docs/knowleged.md` Anti-patterns / Checklist phòng tránh chung

---

## 7. Report lên GitHub (nếu cần)

- Message: `Cannot read properties of undefined (reading 'render')`
- Asset: `viewscreen.githubusercontent.com/static/assets/mermaidMarkdown-*.js` (mermaid 11.17.2)
- Bộ repro: parent gửi `{cmd:'ack'}` → dispatch `code_rendering_service:ready:ack` trước `code_rendering_service:data:ready` → iframe posts error status y nguyên
- Thứ tự chuẩn đo được: `ack → branding → data:ready → (render) → ready:ack`
- **Guard (lưới chống tái lập — KN-056):**
  - [ ] Điền `- **Guard:**` ở Meta (test/invariant khoá bug) — major/critical bắt buộc, nếu không `propose --strict` exit 1
  - [ ] Nếu là **TÁI LẬP** (RADAR ở đầu bug.md báo): ghi rõ "tái lập của KN-XXX" + **vì sao lưới cũ không bắt được** + nâng lưới TRƯỚC khi fix
- **Cần cập nhật:**
  - [ ] `docs/knowleged.md` → `KN-XXX` (Bảng tóm tắt + Chi tiết)
  - [ ] `product-quality.instructions.md` (nếu là chuẩn UI mới)
  - [ ] Test mới: `path/to/test.spec.ts`

---

## References

- `docs/knowleged.md#KN-XXX`
- Issue / PR: #
- Commit fix: `<hash>`

---
*Template: `.agent/bugs/_template/bug.md` — dùng bởi `/fixbug` Phase 1 & 5.*
