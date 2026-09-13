# Bug: Bug tái lập dù đã có KN — không gì phát hiện "tái lập" + KN không có lưới (kèm phép đo severity hỏng 0/55)

## Meta

- **Slug:** `2026-09-13-kn-recurrence-no-guard`
- **Ngày:** 2026-09-13
- **Severity:** major
- **Reporter:** @user (yêu cầu: "luôn có lúc vẫn tái lập bug — làm sao trong quá trình test lại vẫn phải log KN, hạn chế sửa đi sửa lại")
- **Related KN:** `KN-056`
- **Tags:** `process` `knowledge` `verification` `recurrence` `guard`
- **Guard:** `tests/e2e/auto-learn-guard.spec.ts` (6 test: radar dry-run không ghi file · radar inject bug.md · gateWarning JSON · `--strict` exit 1 · guard PASS strict · guards JSON + priority ≥10)
- **Status:** `fixed`

---

## 1. Reproduce

### Steps
1. Đọc `docs/knowleged.md` — 55 KN, nhưng phần lớn là văn xuôi: **không có gì FAIL khi bị vi phạm**.
2. Đo coverage: chỉ ~26/55 KN được test file tham chiếu (đo bằng `guards` sau fix).
3. Chạy `auto-learn.mjs log --error "<text giống bug cũ>"` (vd rainbow `var()` lồng — KN-003 đã fix 2026-08-30, KN-004 là tái lập của KN-003) → trước fix: **không có bất kỳ cảnh báo tái lập**, draft bug.md ra đời im lặng.
4. Kiểm phép đo phụ: `kn-parse` severity → **0/55 KN parse ra `major`** dù 46 KN là major (regex không khớp format `**Severity:**`).

### Expected vs Actual
- **Expected:** bug khớp KN cũ → hệ thống cảnh báo "nghi tái lập" + ép trả lời "vì sao lưới cũ không bắt được" trước khi fix; fix major/critical phải để lại lưới.
- **Actual:** log im lặng; không gate nào đòi lưới khi close; đo lường severity hỏng âm thầm (mọi KN hiện `minor`).

### Evidence
```
# trước fix
$ auto-learn log --error "rainbow hover" --dry-run   → không có RADAR
$ node -e "kn-parse severity ..."                    → 0/55 major (46 major thật)
$ auto-learn guards                                  → lệnh chưa tồn tại
```

### Environment
- Branch: `main` · OS: Windows · Node 18+ · ngày 2026-09-13

---

## 2. Root Cause (5 Whys)

- **File:Line:** `.github/harness/scripts/auto-learn.mjs` (logBug/propose) + `.github/harness/scripts/kn-parse.mjs:58`
- **Why 1:** Bug tái lập vì KN không tự FAIL khi bị vi phạm — không ai phát hiện tái lập tại thời điểm log.
- **Why 2:** `log` chỉ tạo draft, không đối chiếu KN/bug cũ; `propose` chỉ sinh draft, không đòi lưới; verify không có bước kiểm coverage.
- **Why 3:** KN được viết như văn xuôi để ĐỌC, không kèm cơ chế để ENFORCE — đúng lớp KN-047 (spec ≠ wish): wishlist không đếm là Done.
- **Why 4:** Quy trình fixbug kết thúc ở "ghi KN" mà không có định nghĩa Done đầy đủ: reproduce fixed + regression + **Guard** + KN.
- **Why 5 (Root):** Phép đo không đáng tin — severity parse hỏng im lặng (`Severity:\s*(\w+)` không khớp `**Severity:**`) → 0/55 major đọc ra minor → mọi ưu tiên/priority sai. Xây metric trên parser hỏng = sai âm thầm (KN-049 class); fix process trước, đo lại phép đo song song.

- **Impact:** Mọi bug major/critical từng fix có thể tái lập mà không ai biết cho tới khi user báo lần 3-4 (đúng lời user: "hạn chế sửa đi sửa lại nhiều lần").
- **Hypothesis:** đã verify — radar BM25 ngưỡng calibrate 25/18 tách sạch liên quan (≥31) vs nhiễu (≤15).
- **Confidence:** HIGH (proven + guard spec pass).

---

## 3. Fix

- **Approach:** 3 mắt xích máy-enforce (thay vì nhắc nhở bằng văn xuôi):
  1. **Log RADAR** — `log` đối chiếu text bug với toàn bộ KN + bug cũ (BM25 kn-parse, ngưỡng KN 25 / bug 18) → in cảnh báo + inject block `🔁 RADAR TÁI LẬP` vào draft; flags `--dry-run`, `--no-scan`, `--dir`.
  2. **Guard gate** — template bug.md thêm field `Guard:`; `propose` major/critical thiếu Guard → `⛔ GUARD GATE FAIL` + `--strict` exit 1; draft KN luôn có dòng `- **Guard:**`.
  3. **Coverage audit** — lệnh `guards`: quét `tests/**` tìm tham chiếu `KN-XXX` + `Guard:` line trong KN detail → human/`--json`/`--out`; ưu tiên major/critical chưa lưới.
  Kèm fix phép đo: regex severity/date (`[^\w]*`/`[^\d]*`) trong `kn-parse.mjs` + `extractBugMeta`.
- **Files Changed:**
  - `.github/harness/scripts/auto-learn.mjs` — radar + guard gate + guards audit + flags
  - `.github/harness/scripts/kn-parse.mjs` — fix severity/date regex
  - `.agent/bugs/_template/bug.md` — field Guard + Prevention guard checklist
  - `.github/instructions/auto-learn.instructions.md` — §6 vòng chống tái lập
  - `.github/prompts/fixbug.prompt.md` — Phase 0 suggest, Phase 1 RADAR, Phase 5 Guard
  - `.github/hooks/hooks.json` — reminder guard
  - `tests/e2e/auto-learn-guard.spec.ts` — 6 test khoá 3 mắt xích (mới)
- **Non-Goals:** không viết lưới cho 27 KN major/critical cũ trong lần này (`guards` báo danh sách — trả nợ dần); không wire `guards` thành CI gate.
- **Fix Confidence:** HIGH
- **get_errors:** 0 errors (affected files; toàn scope ở Verify).

---

## 4. Verification

- [x] Re-run: `log` rainbow → RADAR bắt KN-003/KN-004 + 2 bug cũ (score 36–59)
- [x] `propose --strict` major thiếu Guard → exit 1; có Guard → exit 0
- [x] `guards` → coverage + priority đúng (27 major/critical chưa lưới)
- [x] Severity parse: 0/55 → 46 major + 3 critical + 6 minor
- [x] Spec mới `auto-learn-guard.spec.ts` 6/6
- [x] Full suite regression: **163/163 passed** ×2 (trước + sau refactor Slop Gate — KN-047 loop-it)
- [x] `slop-check` changed files: **Clean** (sau refactor: tách `computeGuardGate`/`enforceStrictGuard`/`printGuardGate`/`firstMatch` + bỏ describe wrapper 117 dòng)
- [x] Audit chain OK (142 entries, sig 142/142) — artifact cleanup có policy-check + audit trước khi xoá
- [x] Entropy S=19 → **9** (drafts 0, budget ≤10 pass) — dọn 2 artifact do test RED tự ghi nhầm vào repo (chưa có `--dir`/`--dry-run` lúc đó)

**Kết quả:**
```
auto-learn-guard.spec.ts: 6 passed
Full suite: 163 passed (2.1m) × 2
slop-check: Clean (3 files: auto-learn.mjs, kn-parse.mjs, auto-learn-guard.spec.ts)
cosmic-scale: S=9 ≤ 10 ✅ · guards coverage: 27/56 (priority major/critical còn 27)
```

---

## 5. Lesson (1 câu)

> KN không có lưới = wishlist: bug tái lập không phải vì thiếu KN, mà vì không có gì phát hiện "tái lập" (log RADAR) và không có gì FAIL khi thiếu lưới (Guard gate) — tái lập thật thì nâng lưới TRƯỚC, fix SAU.

---

## 6. Prevention

- **Cách phòng tránh lần sau:**
  - [ ] Bug major/critical: bắt buộc `- **Guard:**` + lưới thật (test/invariant) trước khi Done (KN-056)
  - [ ] RADAR báo nghi tái lập → trả lời "vì sao lưới cũ không bắt được" trong bug.md TRƯỚC khi fix
  - [ ] Định kỳ: `auto-learn.mjs guards` — trả nợ lưới dần cho major/critical chưa có
- **Guard (lưới chống tái lập — KN-056):**
  - [x] `- **Guard:**` điền ở Meta
  - [x] Lưới: `tests/e2e/auto-learn-guard.spec.ts` + KN-056 detail
- **Cần cập nhật:**
  - [x] `docs/knowleged.md` → `KN-056`
  - [x] Test mới: `tests/e2e/auto-learn-guard.spec.ts`

---

## References

- `docs/knowleged.md#KN-056`
- `docs/knowleged.md` KN-047 (spec ≠ wish), KN-049 (đo sai im lặng), KN-007 (auto-learn), KN-054 (externalize)
- `tests/e2e/auto-learn-guard.spec.ts`
