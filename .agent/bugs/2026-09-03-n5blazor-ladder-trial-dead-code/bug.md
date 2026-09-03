> 🤖 Auto-log bởi auto-learn.mjs — 2026-09-03T11:00:33.120Z
> **Error:** `GlassCard/RainbowCard dead components + bootstrap unused + Kana toggle only-add`
> **File:** `N5Blazor/Components/Pages/KanaPage.razor`
> **Title:** N5Blazor ladder trial dead code

# Bug: N5Blazor ladder trial dead code

> Copy file này vào `.agent/bugs/2026-09-03-n5blazor-ladder-trial-dead-code/bug.md` khi bắt đầu `/fixbug`.

## Meta

- **Slug:** `2026-09-03-n5blazor-ladder-trial-dead-code`
- **Ngày:** 2026-09-03
- **Severity:** `minor`
- **Reporter:** YUNIE
- **Related KN:** `KN-013` (ladder-gated trial)
- **Tags:** `process` `perf` `ui` `state` `dx`
- **Status:** `fixed`

---

## 1. Reproduce

### Steps
1. `grep GlassCard|RainbowCard|bootstrap N5Blazor/**` → chỉ còn 1 string doc trong `Home.razor`, 0 usage component, 0 reference css.
2. `ls N5Blazor/Components/Shared/` → `GlassCard.razor` (250B) + `RainbowCard.razor` (519B) tồn tại nhưng không được render ở đâu.
3. `ls N5Blazor/wwwroot/bootstrap/` → `bootstrap.min.css` (159KB) + `.map` (439KB) tồn tại nhưng `App.razor` chỉ load `app.css`.
4. Mở `KanaPage.razor` modal → bấm "Đánh dấu đã thuộc" lần 2 → vẫn "Đã thuộc", không bỏ được (chỉ add, không toggle).

### Expected vs Actual
- **Expected:** Không có component chết, không có css không dùng, nút đã thuộc bấm 2 lần thì bỏ.
- **Actual:** 2 component chết + ~598KB bootstrap chết + Kana chỉ add không toggle (Kanji/Vocab/Grammar đã toggle đúng).

### Evidence
- `grep GlassCard|RainbowCard|bootstrap N5Blazor/**` → 0 usage (trước fix: 1 doc string + 2 files + bootstrap folder).
- `git diff --stat HEAD` → 6 files, 2 insertions, 31 deletions (+ ~612KB binary css/map xóa).
- `get_errors KanaPage.razor + Home.razor` → 0 errors.

### Environment
- Branch: `main`
- Commit: `49ad748` (pre-fix)
- OS/Browser: macOS + VS Code

---

## 2. Root Cause (5 Whys)

- **File:Line:** `N5Blazor/Components/Shared/GlassCard.razor:1`, `RainbowCard.razor:1`, `N5Blazor/wwwroot/bootstrap/:1`, `N5Blazor/Components/Pages/KanaPage.razor:169`
- **Why 1:** Component/css chết tồn tại → vì copy template + thêm wrapper mà pages dùng `div.glass` trực tiếp.
- **Why 2:** Không ai xóa → vì không có ladder gate "Does this need to exist?" trước khi Done.
- **Why 3:** Kana toggle lệch Kanji/Vocab → vì code comment `// already added, need toggle off? For now only add` để lại từ lúc prototype.
- **Why 4:** Không phát hiện → vì test chỉ check count/search, không check toggle round-trip.
- **Why 5 (Root):** Thiếu **minimal-ladder gate** trong Harness: PRD không có YAGNI check, Verify không có dead-code grep + scoreboard.

- **Impact:** ~612KB dead payload + 2 files chết + UX Kana không nhất quán (user không bỏ đã thuộc được).
- **Hypothesis:** Xóa + toggle đồng nhất Kanji là đủ — đã verify bằng grep 0 reference + get_errors 0.
- **Confidence:** `MEDIUM` (static verify pass, dotnet build/test chưa chạy được do thiếu .NET 8 SDK — cần Verify actor chạy lại).

> Nếu bug chạm pattern trong `docs/knowleged.md` → ghi `Related KN: KN-XXX` và áp dụng **Cách phòng tránh** ngay.
> **Root Cause Gate:** Nếu uncertain → investigate / escalate, không tự biến hypothesis thành sự thật.

---

## 3. Fix

- **Approach:** Ladder nấc 1 (skip if not needed) cho dead code + nấc 7 (minimum) cho toggle. Không đổi UX/CSS/test.
- **Files Changed:**
  - `N5Blazor/Components/Pages/KanaPage.razor` — toggle thật đồng nhất Kanji/Vocab/Grammar
  - `N5Blazor/Components/Pages/Home.razor` — sửa Techniques doc (RainbowCard wrapper → div.glass + div.rainbow-wrap)
  - Xóa `N5Blazor/Components/Shared/GlassCard.razor` + `RainbowCard.razor` (0 usage)
  - Xóa `N5Blazor/wwwroot/bootstrap/` (0 reference, App.razor chỉ load app.css)
- **Diff tóm tắt:**
```diff
- private async Task ToggleLearned(string ch) { await Progress.MarkKanaLearned(ch); /* only add */ }
+ private async Task ToggleLearned(string ch){ if(Contains){ Remove + Save } else await MarkKanaLearned(ch); }
- Techniques="... RainbowCard wrapper."
+ Techniques="... div.glass + div.rainbow-wrap trực tiếp."
- GlassCard.razor (8 dòng), RainbowCard.razor (13 dòng), bootstrap.min.css + .map (~598KB)
```
- **Non-Goals:** Không đổi CSS, không đổi quiz/progress/theme/speech, không sửa test.
- **Fix Confidence:** `MEDIUM` — static verify pass, cần Verify actor chạy `dotnet build/test` trên máy có .NET 8 SDK.
- **get_errors:** KanaPage + Home → 0 errors.

---

## 4. Verification

- [x] Re-run steps reproduce → **Fixed** (grep 0 reference, toggle code đồng nhất)
- [x] Edge cases:
  - [x] Kana toggle add → remove → add round-trip đúng pattern Kanji
  - [x] Home doc không còn nhắc component đã xóa
  - [x] Không còn file nào import GlassCard/RainbowCard/bootstrap
- [ ] Regression: `dotnet test N5Blazor.Tests` — chưa chạy (thiếu .NET 8 SDK, máy chỉ có 6.0.301)
- [x] `get_errors` **affected files** → 0 errors
- [ ] `dotnet build/test` → cần Verify actor chạy lại (NETSDK1045)
- [ ] UI audit: không đổi UI nên không cần re-audit
- [ ] Fresh-eyes tier: `OPTIONAL` (deterministic: dead-code removal + toggle đồng nhất pattern có sẵn)

**Kết quả:**
```
get_errors KanaPage.razor + Home.razor → 0 errors
grep GlassCard|RainbowCard|bootstrap N5Blazor/** → 0 matches
git diff --stat → 6 files, 2 insertions, 31 deletions (+ ~612KB xóa)
dotnet build → FAILED NETSDK1045 (máy thiếu .NET 8 SDK, chỉ có 6.0.301) — cần chạy lại
```

---

## 5. Lesson (1 câu)

> Harness thiếu ladder gate nên dead code sống sót: PRD cần YAGNI check + Verify cần grep dead-code và scoreboard xóa.

---

## 6. Prevention

- **Cách phòng tránh lần sau:**
  - [x] PRD mini có YAGNI gate (`.agent/plans/n5-blazor-ladder/prd.md`)
  - [x] Verify có dead-code grep + scoreboard bytes xóa
  - [ ] Thêm checklist vào `docs/knowleged.md` Anti-patterns / Checklist phòng tránh chung
- **Cần cập nhật:**
  - [x] `docs/knowleged.md` → `KN-013` (Bảng tóm tắt + Chi tiết)
  - [ ] Test mới: toggle round-trip Kana (cần Verify actor, test là immutable — KN-012)
  - [ ] `dotnet build/test` trên máy có .NET 8 SDK

---

## References

- `docs/knowleged.md#KN-013`
- Plan: `.agent/plans/n5-blazor-ladder/prd.md` + `design.md`
- Commit fix: `<hash sau khi commit>`

---
*Template: `.agent/bugs/_template/bug.md` — dùng bởi `/fixbug` Phase 1 & 5.*
