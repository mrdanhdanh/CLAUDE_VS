> 🤖 Auto-log bởi auto-learn.mjs — 2026-09-04T09:16:17.657Z
> **Error:** `node -e import mcp-server.mjs treo vinh vien — MCP stdio server cho input stdin, smoke test khong chay tiep; kem 2 bug phu: self-verify 1/4 checks do verify chay truoc khi record.json duoc ghi; regex frontmatter thieu flag m`
> **File:** `www/library/mcp-server.mjs`
> **Title:** Import MCP stdio server trong smoke test gay treo + verify order + regex m flag

# Bug: Import MCP stdio server trong smoke test gay treo + verify order + regex m flag

> Copy file này vào `.agent/bugs/2026-09-04-import-mcp-stdio-server-trong-smoke-test-gay-treo-/bug.md` khi bắt đầu `/fixbug`.

## Meta

- **Slug:** `2026-09-04-import-mcp-stdio-server-trong-smoke-test-gay-treo-`
- **Ngày:** 2026-09-04
- **Severity:** `minor`
- **Reporter:** YUNIE (DisCo Phase 3 verify)
- **Related KN:** `KN-014`
- **Tags:** `process` `dx` `mcp` `testing` `regex`
- **Status:** `fixed`

---

## 1. Reproduce

### Steps
1. Chạy smoke test Phase 3 dạng one-liner: `node -e "import('./www/library/mcp-server.mjs')"` rồi tiếp tục `node --input-type=module -e "...smoke router..."`.
2. Lệnh đầu khởi động MCP stdio server → process chờ input trên stdin vĩnh viễn.
3. Terminal chuyển background, phần smoke phía sau không bao giờ chạy.

### Expected vs Actual
- **Expected:** Smoke test chạy xong và exit, in kết quả list/search/get_skill.
- **Actual:** Terminal treo vĩnh viễn ("produced no new output for an extended period"), phải kill terminal.

### Evidence
- Terminal bị move to background ID `c8efeaca-...`, output dừng ở `--- MCP SMOKE ---`.
- 2 bug phụ cùng session (đã fix cùng lúc):
  - `distill-agnostic.mjs` self-verify chỉ 1/4 checks → `files-exist`/`record-complete` fail vì `record.json` chưa được ghi lúc verify chạy.
  - Verdict `3/4` sau fix order → regex frontmatter `/^name:\s*harness-/` thiếu flag `m`, `^name:` không match vì file bắt đầu bằng `---`.

### Environment
- Branch: `main`
- OS: macOS, zsh, Node 18+

---

## 2. Root Cause (5 Whys)

- **File:Line:** `www/library/mcp-server.mjs` (side-effect start server khi import) · `.github/harness/scripts/distill-agnostic.mjs` (verify order + regex)
- **Why 1:** Terminal treo → vì process node không exit.
- **Why 2:** Process không exit → vì import `mcp-server.mjs` có side-effect khởi động MCP stdio server, chờ input stdin vĩnh viễn.
- **Why 3:** Verify 1/4 checks → vì `verifySkill()` chạy trước khi `record.json` được ghi, check phụ thuộc file sinh ra sau.
- **Why 4:** Regex `^name:` không match → vì thiếu flag `m`, `^` chỉ match đầu string (string bắt đầu bằng `---`).
- **Why 5 (Root):** Thiếu quy tắc: (a) cấm import module có side-effect khởi động server trong smoke one-liner; (b) self-verify phải chạy sau khi mọi file đã ghi; (c) regex `^`/`$` multi-line luôn thêm flag `m`.

- **Impact:** Mất 1 vòng verify, treo terminal; không ảnh hưởng production (lỗi verify-only).
- **Hypothesis:** Đã verify — fix xong distiller ra 5/5 G-accepted 4/4 checks, smoke qua router functions chạy sạch.
- **Confidence:** `HIGH` (proven + re-run pass)

---

## 3. Fix

- **Approach:** Sửa ở gốc như thế nào (không patch triệu chứng)? Bounded — không refactor lan rộng.
- **Files Changed:**
  - `path/to/file.ts` — mô tả thay đổi
- **Diff tóm tắt:**
```diff
// before
// after
```
- **Non-Goals:** Việc gì KHÔNG làm trong lần fix này (tránh scope creep — bounded repair loop)?
- **Fix Confidence:** `HIGH` | `MEDIUM` | `LOW` — đánh giá trước khi sang Verify. Nếu LOW → STOP, report uncertainty, ask/escalate.
- **get_errors:** Sau mỗi edit → affected files; full scope ở Phase 4 Verify.

---

## 4. Verification

- [ ] Re-run steps reproduce → **Fixed** (Expected = Actual)
- [ ] Edge cases:
  - [ ] case 1: ...
  - [ ] case 2: ...
- [ ] Regression: các case liên quan vẫn pass
- [ ] `get_errors` **toàn scope** → 0 errors (Phase 3 chỉ check affected files)
- [ ] `lint` / `build` / `test` → PASS (ghi lệnh đã chạy)
- [ ] UI audit (nếu là bug UI): responsive 375/768/1280, states, a11y
- [ ] Fresh-eyes tier: `REQUIRED` (UX/UI/workflow/ambiguous) | `RECOMMENDED` (regression-prone) | `OPTIONAL` (deterministic: typo/null check/API mapping) — ghi tier đã áp dụng

**Kết quả:**
```
< dán output verify >
```

---

## 5. Lesson (1 câu)

> Bài học rút ra, 1 câu súc tích — sẽ copy vào `docs/knowleged.md` Bảng tóm tắt.

Ví dụ: *Mọi overlay/modal phải có ESC + focus trap + aria-modal.*

---

## 6. Prevention

- **Cách phòng tránh lần sau:**
  - [ ] ...
  - [ ] Thêm checklist vào `docs/knowleged.md` Anti-patterns / Checklist phòng tránh chung
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
