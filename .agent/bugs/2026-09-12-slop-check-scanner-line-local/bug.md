# Bug: Slop Check scanner line-local — hàm bị "nuốt" tới EOF + CC phụ thuộc LF/CRLF

## Meta

- **Slug:** `2026-09-12-slop-check-scanner-line-local`
- **Ngày:** 2026-09-12
- **Severity:** `major`
- **Reporter:** YUNIE (residual phát hiện khi fix CMB zeroRef) / @user "fix luôn"
- **Related KN:** `KN-049` (residual — sửa phép ĐO tạo số ảo, không sửa code bị đo)
- **Tags:** `metrics` `process` `tooling`
- **Status:** `fixed`

---

## 1. Reproduce

### Steps
1. Fixture A: `tpl()` 6 dòng chứa template literal đa dòng có `{` không cân bằng + `after()` 88 dòng thật
2. Fixture B: cùng nội dung `auto-learn.mjs` — bản LF vs bản CRLF
3. `node scripts/slop-check.mjs <fixture>`

### Expected vs Actual
- **Expected:** (A) `after()` được nhận diện riêng, `tpl()` không bị flag; (B) LF vs CRLF cho cùng findings
- **Actual:** (A) `tpl() — 96 dòng` (nuốt luôn `after`, nó không bao giờ được nhận diện); (B) parseKNs CC20@LF vs CC23@CRLF, `logBug` CC352 vs CC363

### Evidence
```
=== A ===
• [size] tpl-fixture.mjs:1 tpl() — 96 dòng (max 80)      ← tpl() thật chỉ 6 dòng!
   (after() 88 dòng KHÔNG xuất hiện — bị gán vào span tpl)

=== B (cùng nội dung, khác line-ending) ===
LF  : parseKNs() — CC 20 | scoreKN() 13 | suggest() 13 | logBug() CC 352
CRLF: parseKNs() — CC 23 | scoreKN() 14 | suggest() 14 | logBug() CC 363   ← identical: false

=== Bisect (16 dòng nhạy CRLF, đều là comment) ===
line 91: "// Extract tags: look for Tags: line..."
  stripLF: "    "                          (comment bị xóa)
  stripCR: "    // Extract tags ... ``\r"    (comment KHÔNG bị xóa)
```

### Environment
- Branch: `main` · Commit: `1c3997f`
- OS: Windows (working copy CRLF)

---

## 2. Root Cause (5 Whys)

- **File:Line:** `scripts/slop-check.mjs:strippedLine()` (`.replace(/\/\/.*$/, '')` + `` /`[^`]*`/g ``) & `bracesOf()`
- **Why 1:** Span/CC sai — hàm sau template bị gộp vào hàm trước; CC khác nhau giữa LF/CRLF.
- **Why 2:** `strippedLine` strip TỪNG DÒNG: template đa dòng không đóng trong 1 dòng → brace trong template bị đếm → depth không bao giờ về 0 → `scanFunctions` rơi vào fallback EOF (`len = lines.length - start`) → "nuốt" tới hết file.
- **Why 3 (CRLF):** `.replace(/\/\/.*$/, '')` — trong JS regex, `.` **không match line terminator** và `\r` **là** line terminator → dòng kết thúc `\r` (file CRLF) làm `.*$` fail → comment không bị strip → `if/for/&/||/?` trong comment bị đếm vào CC (16 dòng bị ảnh hưởng trong auto-learn).
- **Why 4:** Scanner giả định "mọi construct kết thúc trong 1 dòng" — đúng với code thường, sai với template/block-comment/CRLF.
- **Why 5 (Root):** Cùng lớp KN-049 — **cây thước đo sai tạo số ảo** (phantom `logBug 960 dòng/CC352` che mất bản đồ nợ thật; số CC thay đổi theo line-ending = kết quả không deterministic).

- **Impact:** Mọi finding function-sau-template/CRLF là ảo; repo scan 276 findings phần lớn sai span; gate slop-check không đáng tin trên file có template.
- **Confidence:** `HIGH` (RED 3 test fail → GREEN 5/5; true spans lộ ra; dogfood bắt chính mình CC13 → fix tiếp)

---

## 3. Fix

- **Approach:** Thay strip-từng-dòng bằng **lexer một lượt** (state machine: code/template/block-comment/single-line-comment + string/regex literal) + **normalize `\r\n`→`\n`** khi đọc. Sửa phép ĐO, không đụng code bị đo.
- **Files Changed:**
  - `scripts/slop-check.mjs` — `readScannable` normalize line-endings; lexer mới: `analyzeSource` + `codeStep`/`slashStep`/`braceStep`/`strStep`/`regexStep`/`tplStep`/`charStep`/`consumeLiteral` (template `${...}` interpolation có brace-stack riêng, template text inert, regex-flag aware); `scanFunctions` dùng `deltas/stripped` từ lexer; extract `isFnHeader` (dogfood bắt CC13 → tách).
  - `tests/e2e/slop-check.spec.ts` (mới, actor=verify) — 5 invariant: template span · LF=CRLF identical · comment chứa keyword không tính CC · regression (size/CC/dup) · fail-closed exit 2.
- **Diff tóm tắt:**
```diff
- const text = fs.readFileSync(file, 'utf8');                       // giữ \r\n
+ const text = fs.readFileSync(file, 'utf8').replace(/\r\n?/g, '\n');
- const stripped = strippedLine(raw); const [open, close] = bracesOf(stripped);   // line-local
+ const { stripped, deltas } = analyzeSource(fullText);             // lexer một lượt
```
- **Non-Goals:** Không fix nợ thật mới lộ ra (auto-learn `watchdog` CC40 / `main` CC45 / `evaluateCandidate` CC41... — 22 findings thật) — đó là backlog riêng, giờ mới NHÌN THẤY được. Không đổi ngưỡng/format/exit codes.
- **Fix Confidence:** `HIGH`
- **get_errors:** 0 errors.

---

## 4. Verification

- [x] Re-run reproduce → **Fixed**: `tpl()` không còn flag, `after()` đúng tên riêng; LF ≡ CRLF (output identical trong spec)
- [x] Edge: CRLF file comment-keyword → Clean; regex flags/char-class; template `${}` interpolation braces balanced; nested template; fail-closed 0 file exit 2
- [x] Regression: dup ≥8 cross-file + fn>80 + CC>12 vẫn bắt (spec test 4)
- [x] TDD: RED 3 failed (2 passed) → GREEN **5/5**
- [x] Full suite: **128/128** (123 cũ + 5 mới)
- [x] Dogfood: `slop-check.mjs` tự scan → phát hiện `scanFunctions CC13` → tách `isFnHeader` → **Clean**
- [x] `get_errors` toàn scope → 0
- [x] Fresh-eyes tier: `RECOMMENDED` (spec khoá cả 3 chiều + dogfood)

**Kết quả:**
```
spec slop-check: 5/5 · full suite: 128/128 · dogfood self: Clean
auto-learn after fix — TRUE spans: evaluateCandidate 95/CC41 · watchdog 107/CC40 · main 87/CC45
  (before: phantom logBug 960 dòng / CC352 — swallow tới EOF)
repo --scan: 276 → 313 findings (số cũ 276 phần lớn span ảo; 313 = bản đồ thật)
```

---

## 5. Lesson (1 câu)

> Scanner đo code phải parse bằng lexer đa dòng + normalize line-ending — strip từng dòng làm template/`\r` phá brace-depth, sinh span ảo ("nuốt" hàm sau tới EOF) và số CC đổi theo LF/CRLF.

---

## 6. Prevention

- **Cách phòng tránh lần sau:**
  - [x] Công cụ đo code: normalize `\r\n` khi đọc + lexer cho construct đa dòng (template/block-comment); test khoá LF≡CRLF.
  - [x] Dogfood: sau khi sửa tool, chạy tool lên chính nó (bắt được CC13 của chính mình).
  - [x] Khi số đo thay đổi lớn sau fix — đó thường là số ẢO trước đây lộ ra, không phải "regression của tool" (276→313 = bản đồ thật).
- **Cần cập nhật:**
  - [x] `docs/knowleged.md` → KN-049 addendum (mark fixed) + 2 anti-patterns + 1 checklist
  - [x] Test: `tests/e2e/slop-check.spec.ts`

---

## References

- `docs/knowleged.md#KN-049`
- Commit fix: `0b34d71` (lexer + spec + KN-049 addendum + README)
- Liên quan: KN-047 (Slop Gate) · KN-049 (metric vs hiện thực — root class) · KN-039 (Windows/PowerShell pitfalls)
