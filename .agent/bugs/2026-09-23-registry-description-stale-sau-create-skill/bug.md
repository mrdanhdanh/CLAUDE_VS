> 🤖 Auto-log bởi auto-learn.mjs — 2026-09-23T17:29:02.255Z
> **Error:** `harness-manager create skill luu description TU TEMPLATE vao registry.json, khong doc lai SKILL.md sau khi sua; disable/enable/sync deu khong refresh -> harness-manager list hien description sai (placeholder). Workaround: install skill --local <path> --force`
> **File:** `.github/harness/scripts/harness-manager.mjs`
> **Title:** registry description stale sau create skill

> 🔁 **RADAR TÁI LẬP** — đối chiếu KN + bug cũ thấy nghi vấn:
> - 🔁 NGHI TÁI LẬP **[KN-060]** (score 150.2): SkillOpt: sửa skill/KN không qua validation gate — edit trôi, rejected edits không thành negative feedback
> - 🔁 NGHI TÁI LẬP **[KN-016]** (score 128.8): harness-manager disable fail EPERM trên Windows (fs.rename folder bị chặn)
> - 🔁 NGHI TÁI LẬP **[KN-045]** (score 92.5): STATUS audit: link footer 404 trên Pages + registry placeholder descriptions + aria-labelledby tab sai ID
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-14-skill-kn-sua-khong-qua-eval-gate-bi-troi-am-tham`** (score 149.4): SkillOpt — thiếu validation gate cho skill/KN: edit trôi, rejected edits không t
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-06-archify-skill-port`** (score 136.5): Archify skill port — (A) EPERM rename trên Windows + (B) diagram tràn first-scre
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-10-google-fonts-chan-script-intro-khong-hien`** (score 101.2): google-fonts-chan-script-intro-khong-hien
> → Đọc **Cách phòng tránh** trong `docs/knowleged.md` TRƯỚC khi fix. Nếu là tái lập thật: ghi rõ "tái lập của KN-060" + **vì sao lưới cũ không bắt được** → nâng lưới (Guard) rồi mới fix.
# Bug: registry description stale sau create skill

> Copy file này vào `.agent/bugs/2026-09-23-registry-description-stale-sau-create-skill/bug.md` khi bắt đầu `/fixbug`.

## Meta

- **Slug:** `2026-09-23-registry-description-stale-sau-create-skill`
- **Ngày:** 2026-09-24
- **Severity:** `major`
- **Detection:** `UNKNOWN`
- **Layer:** `code` — harness-manager `create` + lưới L2 thiếu mẫu placeholder
- **Reporter:** YUNIE (phát hiện khi tạo skill `video-clip`)
- **Related KN:** **KN-045 (TÁI LẬP)** — cùng gốc “registry giữ description placeholder”
- **Tags:** `data` `verify` `pages` `process`
- **Guard:** `tests/e2e/status-audit.spec.ts` L2 (đã mở rộng: bắt cả placeholder prose của 4 template)
- **Status:** `fixed`

---

## 1. Reproduce

### Steps
1. `node .github/harness/scripts/harness-manager.mjs create skill my-skill`
2. Sửa `description` trong `.github/skills/my-skill/SKILL.md` thành mô tả thật.
3. `node .github/harness/scripts/harness-manager.mjs list --type skill` → vẫn hiện placeholder.
4. `node .github/harness/scripts/generate-status.mjs` → `www/status.json` (trang công khai) hiện placeholder cho skill đó.

### Expected vs Actual
- **Expected:** registry + `status.json` mang description thật sau khi sửa frontmatter.
- **Actual:** giữ nguyên câu template `"Mô tả skill — Use when ... (keyword-rich để agent tự tìm)"`; `disable`/`enable`/`sync` đều **không** refresh.

### Evidence
```
# registry.json sau create + sửa SKILL.md + disable/enable cycle:
{"source":"local","file":"video-clip/SKILL.md","enabled":true,
 "description":"Mô tả skill — Use when ... (keyword-rich để agent tự tìm)"}

# status.json (trang STATUS công khai) trước fix:
video-clip: "Mô tả skill — Use when ... (keyword-rich để agent tự tìm)"

# L2 sau khi mở rộng lưới (RED):
+ Array [ + "skills/video-clip: \"Mô tả skill — Use when ... (keyword-rich để agent tự tìm)\"" ]
```

### Environment
- Branch: `main` · Node v22.22.2 · Windows 11

---

## 2. Root Cause (5 Whys)

- **File:Line:** `.github/harness/scripts/harness-manager.mjs:756-773` (`create` ghi registry từ biến `tmpl`) + `tests/e2e/status-audit.spec.ts:41` (L2)
- **Why 1:** Trang STATUS hiện câu template như thể là mô tả thật.
- **Why 2:** `generate-status.mjs` đọc `registry.json`, mà registry giữ description placeholder.
- **Why 3:** `create` lưu description **từ template vừa sinh**, không đọc lại frontmatter sau khi người dùng sửa; `enable`/`disable`/`sync` cũng không re-parse.
- **Why 4:** Lưới L2 (KN-045) chỉ khớp mẫu `^(skill|instruction|agent|prompt|hook|local)\s+<name>$` — tức dạng fallback `${type} ${name}`.
- **Why 5 (Root):** Template **skill** dùng placeholder dạng **prose** (`Mô tả skill — Use when ...`) không chứa type+name ⇒ regex L2 mù với nó. Lưới được thiết kế theo **một** mẫu placeholder, không theo **họ** placeholder ⇒ mẫu mới lọt ngay khi template đổi văn phong.

- **Impact:** Mọi skill/instruction/agent/prompt tạo bằng `create` rồi sửa description đều có thể hiện placeholder trên trang STATUS công khai + trong `list`.
- **Hypothesis:** `create` không re-read frontmatter → verify bằng disable/enable cycle (không đổi) và `install --local --force` (đổi ngay).
- **Confidence:** `HIGH` (RED chứng minh lưới bắt được → GREEN sau khi regenerate; registry đã đúng)

> **Tái lập của KN-045** (mục “registry placeholder descriptions”).
> **Vì sao lưới cũ không bắt được:** L2 chỉ có 1 mẫu `type + name`; placeholder của template skill là **câu prose có dấu `...`**, không có type/name → regex không khớp. KN-045 ghi “placeholder `${type} ${name}` không bao giờ được render” nhưng **không bao quát hết họ placeholder**.

---

## 3. Fix

- **Approach:** (a) Nâng lưới L2 TRƯỚC — nhận diện cả 3 họ placeholder (type+name · prose `^Mô tả (skill|agent|instruction|prompt|hook|ngắn)` · biến chưa resolve `{{NAME}}`); (b) regenerate `status.json` từ registry đã đúng; (c) ghi lại cách refresh đúng vào `docs/capabilities.md` để lần sau không mắc.
- **Files Changed:**
  - `tests/e2e/status-audit.spec.ts` — L2 nhận 3 họ placeholder (thay 1 regex).
  - `www/status.json` — regenerate từ registry (không sửa tay).
  - `docs/capabilities.md` — ghi bẫy + lệnh `install skill --local <path> --force`.
  - `.github/harness/registry.json` — `video-clip` có description thật (qua `install --local --force`, không sửa tay).
- **Diff tóm tắt:**
```diff
-const re = new RegExp(`^(skill|instruction|agent|prompt|hook|local)\\s+${esc(name)}$`, 'i');
-if (re.test(d)) out.push(`${g}/${name}: "${d}"`);
+const patterns = [
+  new RegExp(`^(skill|instruction|agent|prompt|hook|local)\\s+${esc(name)}$`, 'i'),
+  /^Mô tả (skill|agent|instruction|prompt|hook|ngắn)\b/i,
+  /\{\{[A-Z_]+\}\}/,
+];
+if (patterns.some((re) => re.test(d))) out.push(`${g}/${name}: "${d}"`);
```
- **Non-Goals:** Không sửa `harness-manager create` để auto-refresh (hành vi rộng hơn, cần thiết kế riêng) — chỉ khoá lưới + ghi workaround.
- **Fix Confidence:** `HIGH`
- **get_errors:** 0 errors trên spec + docs đã sửa.

---

## 4. Verification

- [x] Re-run reproduce → **Fixed**: `www/status.json` `video-clip` = mô tả thật, `placeholder còn lại: không có`
- [x] Edge cases:
  - [x] Lưới mới vẫn pass cho toàn bộ entry cũ (không false positive)
  - [x] `install skill --local --force` refresh registry đúng (kiểm bằng đọc `registry.json`)
- [x] Regression: `npx playwright test tests/e2e/status-audit.spec.ts` → **5 passed**
- [x] `get_errors` → 0 errors
- [x] Fresh-eyes tier: `REQUIRED` (data hiển thị công khai) — kiểm bằng test fetch `status.json`, không đọc mắt

**Kết quả:**
```
RED  (lưới mới, status.json còn placeholder): 1 failed — skills/video-clip: "Mô tả skill — Use when ..."
GREEN (sau regenerate):                       5 passed (9.3s)
```

---

## 5. Lesson (1 câu)

> Lưới chống placeholder phải nhận diện **họ** placeholder (type+name · prose template · biến `{{}}` chưa resolve), không phải một mẫu chuỗi — đổi văn phong template là mẫu cũ mù ngay.

---

## 6. Prevention

- **Cách phòng tránh lần sau:**
  - [x] Tạo customization bằng `harness-manager create` xong, sửa `description` → **bắt buộc** chạy `harness-manager install <type> --local <path> --force` rồi `generate-status.mjs`.
  - [x] Lưới L2 quét **họ** placeholder (3 pattern) — mẫu template mới thêm thì bổ sung vào mảng `patterns`.
  - [ ] Cân nhắc sửa `create` để đọc lại frontmatter khi `list`/`sync` (cần thiết kế riêng — ghi ở Non-Goals).
- **Guard (lưới chống tái lập — KN-056):**
  - [x] `- **Guard:**` đã điền ở Meta → `tests/e2e/status-audit.spec.ts` L2 (RED → GREEN đã chứng minh)
  - [x] **TÁI LẬP của KN-045** — đã ghi rõ lý do lưới cũ không bắt được (chỉ 1 mẫu) + nâng lưới TRƯỚC khi fix
- **Cần cập nhật:**
  - [x] `docs/knowleged.md` → amend KN-045 (ghi họ placeholder + lý do tái lập)
  - [x] `docs/capabilities.md` → bẫy + lệnh workaround

---

## References

- `docs/knowleged.md#KN-045` (tái lập) · KN-056 (nâng lưới trước khi fix)
- `tests/e2e/status-audit.spec.ts` L2 · `www/status.json` · `.github/harness/registry.json`
- Commit fix: `<pending>`

*Template: `.agent/bugs/_template/bug.md` — dùng bởi `/fixbug` Phase 1 & 5.*
