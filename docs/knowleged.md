# Knowledge — Bài học từ Bug (BẮT BUỘC ĐỌC)

> ⚠️ **QUY TẮC HARNESS:** Mọi agent / prompt / task — dù là `/harness`, `/fixbug`, `/implement`, `/plan`, `/polish`, `/verify` hay edit tay — **PHẢI đọc file này TRƯỚC KHI làm bất kỳ việc gì**. Không đọc = không được code.
> File này là **bộ nhớ dài hạn** của dự án: mọi bug đã sửa phải rút ra 1 bài học và ghi vào đây.

## Cách dùng

1. **Trước khi code:** đọc toàn bộ file này (hoặc ít nhất bảng tóm tắt + các mục liên quan đến task hiện tại).
2. **Sau khi fix bug:** thêm 1 dòng vào **Bảng tóm tắt** + 1 mục chi tiết ở **Chi tiết bài học** + cập nhật `updatedAt`.
3. **Khi review / plan:** kiểm tra xem task mới có chạm vào pattern đã từng lỗi không — nếu có, áp dụng **Cách phòng tránh**.

## Quy ước ghi bài học

- `ID` dạng `KN-001`, tăng dần.
- `Severity`: `critical` | `major` | `minor`.
- `Tags`: `ui` `api` `state` `async` `css` `a11y` `perf` `build` `data` ...
- Mỗi bài học phải có: **Triệu chứng → Nguyên nhân gốc → Cách sửa → Cách phòng tránh**.

---

## Bảng tóm tắt (Summary)

| ID | Ngày | Bug | Nguyên nhân gốc | Bài học (1 câu) | Tags |
|----|------|-----|-----------------|-----------------|------|
| KN-001 | 2026-08-29 | *Ví dụ: Modal không đóng khi bấm ESC* | Thiếu listener `keydown` + focus trap | Mọi overlay/modal phải có ESC + focus trap + aria | `ui` `a11y` |
| KN-002 | 2026-08-29 | Trang STATUS www/ giao diện chưa hợp lý — registry sai, responsive vỡ, thiếu a11y | status.json array vs app.js object mismatch + không audit product-quality | Dashboard phải có single source of truth (registry.json → status.json) và polish responsive/a11y ngay từ đầu | `ui` `css` `a11y` `responsive` `data` |
| KN-003 | 2026-08-30 | Rainbow border GlassUI không xoay (animated) ở một số browser | Detect `@property` sai (`CSS.supports('syntax')`) + `::before` dùng `var(--rainbow)` lồng không re-resolve `--angle` + fallback per-element bị UI reset | Animate custom property: dùng gradient trực tiếp tại `::before`, detect `@property` bằng `CSS.registerProperty`, fallback class ở `<html>` | `ui` `css` `animation` |
| KN-004 | 2026-08-30 | `www/` grid-2 thừa khoảng cách + rainbow border index.html không xoay khi hover | `.grid-2` không có `margin` + `.section` con là grid item không collapse → margin kép 48px; `::before`/`::after` dùng `var(--rainbow)` lồng (lặp KN-003) → `--angle` không re-resolve | Wrapper `.grid-2` tự mang `margin:24px 0`, con `.section` đặt `margin:0`; animate `--angle` dùng `conic-gradient(from var(--angle), ...)` trực tiếp | `ui` `css` `animation` `spacing` |
| KN-006 | 2026-08-30 | N5 Blazor thieu theme sang, tieng Viet mat dau, menu chua polish, contrast chua test light | Chi co dark variables, khong co [data-theme="light"] + fix encoding xoa dau + NavMenu minimal | Design system phai co 2 theme tu dau (CSS variables + toggle persist + early init) va i18n giu UTF-8 chuan | `ui` `css` `a11y` `i18n` `theme` `contrast` |
| KN-005 | 2026-08-30 | Bug Blindness — dev không thấy bug do workaround vô thức + fan bias (Dan Luu) | Habitual mitigations (tự bù lỗi không nhận ra) + quality blindness + fan bias → dev nghĩ sản phẩm xịn dù user không dùng được | Chữa mù bug: fresh eyes, test như user mới, chỉ ra bug liên tục, không workaround vô thức, dogfooding có ý thức | `process` `quality` `ux` `perf` `a11y` |

> Dòng ví dụ trên sẽ bị thay khi có bug thật đầu tiên — giữ format.

---

## Chi tiết bài học

### KN-001 — Ví dụ: Modal không đóng khi bấm ESC

- **Ngày:** 2026-08-29
- **Bug report:** `.agent/bugs/2026-08-29-modal-esc/bug.md`
- **Severity:** minor
- **Triệu chứng:** Modal mở nhưng bấm ESC không đóng, tab focus thoát ra ngoài.
- **Nguyên nhân gốc:** Chỉ xử lý `click` overlay, quên `keydown` ESC và `focus-trap`.
- **Cách sửa:** Thêm `keydown` listener + `focus-trap` + `aria-modal="true"`.
- **Cách phòng tránh:**
  - Checklist overlay: `ESC` + `click outside` + `focus trap` + `aria`.
  - Thêm vào `product-quality` audit.
- **Tags:** `ui` `a11y`
- **Người ghi:** YUNIE / harness

### KN-002 — Trang STATUS www/ giao diện chưa hợp lý

- **Ngày:** 2026-08-29
- **Bug report:** `.agent/bugs/2026-08-29-status-ui/bug.md`
- **Severity:** major
- **Triệu chứng:** Registry luôn hiện `enabled` dù có disabled, description trống; header tràn ở 375px; stats 5 cols chật ở 768px; table overflow ngang mobile không có card fallback; thiếu skip-link, aria, focus-visible; spacing 14px/22px không theo 4/8; `status.json` lưu array string lệch với `app.js` expect object.
- **Nguyên nhân gốc:** Thiếu single source of truth — `status.json` viết tay dạng array string, `app.js` code cho object `{name:{enabled,description}}` → mismatch. Không audit theo `product-quality.instructions.md` (responsive 375/768/1280, states, a11y, spacing 4/8, CSS variables). Không có generator `registry.json → status.json`.
- **Cách sửa:** Đồng bộ `status.json` sang object với `enabled`+`description` (đầy đủ 5 skills, 5 instructions, 7 agents, 7 prompts, 1 hook); `app.js` thêm `normalizeRegistry()` handle cả array và object + search/filter + a11y + error/empty states + `escapeHtml` + keyboard `/` focus; `styles.css` polish spacing 4/8, CSS variables, responsive (stats 2→3→5 cols, table→cards mobile, header co gọn), animation 150-300ms; `index.html` thêm skip-link, semantic, registry controls, aria, responsive header.
- **Cách phòng tránh:**
  - Tạo script `generate-status.mjs` regenerate `status.json` từ `registry.json` (không viết tay).
  - Checklist trước khi commit `www/`: responsive 375/768/1280, `get_errors`, `npx serve www` test, `JSON.parse` validate.
  - Contract `status.json` shape document trong `docs/capabilities.md` và `app.js` luôn backward compat.
  - Thêm `skip-link` + `aria-label` cho mọi page mới.
- **Tags:** `ui` `css` `a11y` `responsive` `data`
- **Người ghi:** YUNIE / fixbug

### KN-003 — Rainbow border GlassUI không xoay (animated) ở một số browser

- **Ngày:** 2026-08-30
- **Bug report:** `.agent/bugs/2026-08-29-rainbow-animated/bug.md`
- **Severity:** major
- **Triệu chứng:** Viền cầu vồng (`conic-gradient`) đứng yên, không xoay, dù nội dung mô tả "xoay 3s (HOT)". Một số browser/môi trường thấy tĩnh hoàn toàn.
- **Nguyên nhân gốc:** (1) Detection `@property` sai — `CSS.supports('syntax: "<angle>"')` luôn `false` → code luôn ép JS fallback, tắt animation CSS gốc; (2) `::before` đọc `--angle` qua biến `--rainbow` định nghĩa tại `:root` (`var(--angle)` lồng) → một số engine không re-resolve → tĩnh 0deg; (3) fallback gắn `.js-fallback` per-element bị `updatePlayground()` reset `className` → mất driver ở playground.
- **Cách sửa:** `::before` dùng `conic-gradient(from var(--angle,0deg), ...)` trực tiếp; detect `@property` bằng `CSS.registerProperty`; fallback gắn `.js-rainbow` ở `<html>` + rAF set `--angle`. Verify bằng Playwright (chromium/firefox/webkit, cả native + fallback mode) → `--angle` thay đổi rõ ràng.
- **Cách phòng tránh:**
  - Detect `@property` = `typeof CSS.registerProperty === 'function'`, không `CSS.supports('syntax: ...')`.
  - Animate custom property: dùng giá trị trực tiếp tại property đích, không qua biến lồng `var()` chứa `var()`.
  - Fallback class ở `<html>` (root), không per-element (tránh bị UI reset `className`).
  - Verify animation bằng headless browser đo `--angle` trước/sau, không chỉ mắt thường.
- **Tags:** `ui` `css` `animation`
- **Người ghi:** YUNIE / fixbug

### KN-004 — grid-2 thừa khoảng cách + rainbow border index.html không xoay khi hover

- **Ngày:** 2026-08-30
- **Bug report:** `.agent/bugs/2026-08-30-grid2-rainbow-hover/bug.md`
- **Severity:** minor
- **Triệu chứng:** (1) Hai khối `<div class="grid-2">` (Presets+Plans, Health+Pages) cách phần trên ~48px thay vì 24px → lệch nhịp. (2) Viền cầu vồng hiện khi hover nhưng đứng yên, không xoay.
- **Nguyên nhân gốc:** (1) `.grid-2` không có `margin`, trong khi `.section` con có `margin:24px 0`; vì grid item không collapse margin → cộng dồn 24+24=48px. (2) `::before`/`::after` dùng `background:var(--rainbow)` mà `--rainbow` là `conic-gradient(from var(--angle), ...)` định nghĩa tại `:root` → lặp lại anti-pattern KN-003, `--angle` thay đổi không re-resolve ở một số engine → tĩnh 0deg.
- **Cách sửa:** `.grid-2{margin:24px 0}` + `.grid-2 > .section{margin:0}` (nhịp 24px đồng nhất); thay `background:var(--rainbow)` → `background:conic-gradient(from var(--angle,0deg), #ff3b30, #ff9500, #ffcc02, #34c759, #007aff, #af52de, #ff3b30)` trực tiếp tại `::before`/`::after` trong `www/styles.css`.
- **Cách phòng tránh:**
  - Wrapper grid (`.grid-2`, `.grid-3`) luôn tự mang `margin`, con `.section` đặt `margin:0` để tránh doubling.
  - Animate custom property: luôn dùng giá trị trực tiếp tại property đích, không qua biến lồng `var()` chứa `var()` (KN-003).
  - Khi copy pattern rainbow từ `glassui` sang `www`, nhớ bê cả cách dùng gradient trực tiếp, không copy `--rainbow`.
- **Tags:** `ui` `css` `animation` `spacing`
- **Người ghi:** YUNIE / fixbug

### KN-005 — Bug Blindness — mù bug do workaround vô thức + fan bias

- **Ngày:** 2026-08-30
- **Bug report:** `.agent/bugs/2026-08-30-bug-blindness/bug.md` (tham chiếu Dan Luu — https://danluu.com/bug-blind/)
- **Severity:** major
- **Triệu chứng:** Dev/tester không thấy bug dù sản phẩm lỗi nặng (user không dùng được nếu không làm chuỗi workaround phức tạp). Internal comments vẫn "great, works well" trong khi launch ra user gặp đúng lỗi đó và fail. Ví dụ: Blackboard bị 93% hate nhưng nhân viên tưởng được yêu; Kagi trả toàn SEO spam nhưng fan vẫn bảo "kết quả xịn"; Discourse cheat LCP để qua metric nhưng thực tế chậm; Google Docs có hàng chục workaround mà dev quên đó là bug.
- **Nguyên nhân gốc (5 Whys):**
  - Why1: Dev không báo bug → vì không nhận ra đó là bug.
  - Why2: Không nhận ra → vì đã tự tạo habitual mitigations (thói quen workaround vô thức) — như chuột bi bẩn phải quơ tay loạn xạ, mở Google Docs phải đợi 2s mới gõ title, tắt WiFi trước khi login ở Microsoft.
  - Why3: Workaround thành vô thức → vì lặp lại hàng ngày, não tự bù lỗi và quên mất đó là lỗi (Betriebsblindheit — mù do ở trong hệ thống quá lâu).
  - Why4: Không có fresh eyes → vì chỉ dogfooding kiểu dev (giỏi workaround) thay vì test như user mới, không có người ngoài chỉ ra.
  - Why5 (Root): Thiếu cơ chế phát hiện quality blindness + fan bias (yêu sản phẩm nên auto mù nhược điểm) + không đo quality bằng trải nghiệm user thực.
- **Cách sửa:**
  - Chữa mù bug bằng cách **chỉ ra bug liên tục** — Dan Luu đã làm với bạn bè, vài tuần sau họ tự thấy bug khắp nơi.
  - Test như **user mới / LLM act as normal user** — không dùng workaround, không đọc manual trang 43, thử nhiều scenario khác nhau.
  - Dogfooding **có ý thức**: ghi lại mọi workaround mình đang làm, tự hỏi "user mới có biết làm vậy không?".
  - Fresh eyes: nhờ người ngoài team, người chưa dùng bao giờ thử và quan sát không gợi ý.
  - Với coding agent hiện nay: vừa dễ tạo app dỏm hàng loạt, vừa dễ fix cho xịn — nhưng phải **actually notice** rằng quality có thể cải thiện (https://danluu.com/p95-skill/).
- **Cách phòng tránh:**
  - Trước khi ship: checklist "user mới có dùng được không nếu không biết workaround nào?" — nếu cần >1 bước không trực quan → là bug.
  - Ghi lại mọi habitual mitigation thành bug report thay vì để thành thói quen.
  - Thêm phase **Polish + Verify với fresh eyes** trong Harness — responsive 375/768/1280, empty/loading/error states, a11y, perf — không bỏ.
  - Dùng LLM / người ngoài làm "normal user" để reproduce, không chỉ dev tự test.
  - Văn hóa team: khuyến khích chỉ ra flaw, không fan bias — "yêu sản phẩm nhưng vẫn soi lỗi".
- **Tags:** `process` `quality` `ux` `perf` `a11y`
- **Người ghi:** YUNIE — tổng hợp từ Dan Luu "Bug Blindness" (2026-08-26) + Hacker News discussion

### KN-006 — N5 Blazor thieu theme sang + tieng Viet mat dau + menu chua polish

- **Ngày:** 2026-08-30
- **Bug report:** `.agent/bugs/2026-08-30-n5-ui-polish/bug.md`
- **Severity:** major
- **Triệu chứng:** Chi co dark theme, khong co toggle sang/toi; Home.razor mat dau tieng Viet (Hoc thay Hoc, Tong quan thay Tổng quan) do fix encoding; menu don gian thieu badge/grouping/a11y; contrast chua test light; hieu ung rainbow chua co prefers-reduced-motion day du.
- **Nguyên nhân gốc:** (1) Design system chi dinh nghia :root dark, chua co [data-theme="light"] variables; (2) Fix bug RZ9986 (Techniques="Blazor: @inject...") bang cach xoa dau + PowerShell here-string lam corrupt Home.razor -> restore ban ASCII an toan nhung mat dau; (3) NavMenu chi lam minimal chua polish theo product-quality; (4) Thieu early init theme -> flash khi reload.
- **Cách sửa:** Them [data-theme="light"] vao app.css (glass sang, text #0f172a, contrast >=4.5:1) + light overrides cho sidebar/topbar/nav/kana/badge/chip/input/quiz/helper; them n5Theme vao app.js (get/set/apply/init, ton trong localStorage + prefers-color-scheme, init ASAP chong flash); them toggle button vao MainLayout.razor (JS interop n5Theme.toggle, persist); them early script vao App.razor <head>; restore Home.razor tieng Viet co dau chuan UTF-8; polish NavMenu (badge, grouping, aria-label, WCAG); fix KanaPage luu->lưu, GrammarPage vi du->ví dụ.
- **Cách phòng tránh:**
  - Design system mac dinh co 2 theme (dark/light) voi CSS variables + toggle persist + early init trong <head>.
  - Moi file .razor phai UTF-8, khong dung PowerShell here-string cho tieng Viet — dung create_file voi UTF-8.
  - Checklist truoc khi Done: co toggle sang/toi? co test ca 2 theme? tieng Viet co dau? contrast >=4.5:1? menu co badge/a11y?
  - Them Playwright test cho theme toggle + contrast.
- **Tags:** `ui` `css` `a11y` `i18n` `theme` `contrast`
- **Người ghi:** YUNIE / fixbug

<!-- Thêm bài học mới theo template dưới — copy block này -->

<!--
### KN-XXX — Tiêu đề ngắn gọn

- **Ngày:** YYYY-MM-DD
- **Bug report:** `.agent/bugs/YYYY-MM-DD-<slug>/bug.md`
- **Severity:** critical | major | minor
- **Triệu chứng:**
- **Nguyên nhân gốc:**
- **Cách sửa:**
- **Cách phòng tránh:**
- **Tags:**
- **Người ghi:**
-->

---

## Anti-patterns tích lũy (Đừng lặp lại)

- ❌ Fix triệu chứng, không tìm root cause.
- ❌ Không reproduce trước khi sửa → sửa nhầm chỗ.
- ❌ Sửa xong không test regression → tạo bug mới.
- ❌ Không ghi bài học → bug cũ lặp lại.
- ❌ Viết `status.json` tay không qua generator → data shape lệch với render (KN-002).
- ❌ Không test responsive 375/768/1280 trước khi commit `www/` (KN-002).
- ❌ Hardcode màu/spacing không dùng CSS variables (KN-002).
- ❌ Detect `@property` bằng `CSS.supports('syntax: ...')` (luôn false) → ép JS fallback sai (KN-003).
- ❌ Animate custom property qua biến lồng `var()` chứa `var()` → một số engine không re-resolve (KN-003).
- ❌ Gắn fallback class per-element rồi để UI reset `className` → mất animation (KN-003).
- ❌ Tự workaround bug thành thói quen vô thức rồi quên đó là bug — habitual mitigations (KN-005).
- ❌ Fan bias: yêu sản phẩm nên auto mù nhược điểm, bảo "xịn mà" dù user không dùng được (KN-005).
- ❌ Chỉ dev tự dogfooding (giỏi workaround) thay vì test như user mới / fresh eyes (KN-005).
- ❌ Nghĩ "dễ mà, chỉ cần làm [chuỗi 7 bước phức tạp]" — user thường bó tay (KN-005).
- ❌ Chỉ làm dark theme, không có light theme + toggle persist + early init (KN-006).
- ❌ Fix bug encoding bằng cách xóa dấu tiếng Việt — phải giữ UTF-8 chuẩn (KN-006).
- ❌ Dùng PowerShell here-string cho file UTF-8 tiếng Việt → corrupt (KN-006).
- ❌ NavMenu minimal không có badge/grouping/aria-label (KN-006).

## Checklist phòng tránh chung

- [ ] Đã reproduce bug trước khi sửa?
- [ ] Đã tìm root cause (5 Whys)?
- [ ] Đã fix ở gốc, không chỉ patch UI?
- [ ] Đã test lại case cũ + case biên?
- [ ] Đã ghi `docs/knowleged.md` + `.agent/bugs/<slug>/bug.md`?
- [ ] Đã test như **user mới** (không dùng workaround, không đọc manual) — fresh eyes / LLM as normal user? (KN-005)
- [ ] Đã liệt kê mọi habitual mitigation mình đang làm và biến thành bug report? (KN-005)
- [ ] Đã nhờ người ngoài team thử không gợi ý? (KN-005)
- [ ] Đã có toggle sáng/tối với persist + early init chống flash? (KN-006)
- [ ] Đã test contrast ≥4.5:1 cả 2 theme (dark/light)? (KN-006)
- [ ] Đã giữ tiếng Việt có dấu chuẩn UTF-8 (không xóa dấu khi fix bug)? (KN-006)
- [ ] Đã polish menu với badge/grouping/aria-label? (KN-006)

---

*File này do `/fixbug` tự động cập nhật. Mọi luồng khác phải đọc để không lặp lại lỗi cũ.*
*UpdatedAt: 2026-08-30T16:30:00Z — Maintained by YUNIE / Harness v2 — KN-006 added (N5 UI polish + light theme) — Maintained by YUNIE / Harness v2 — KN-005 added (Bug Blindness — Dan Luu)*
