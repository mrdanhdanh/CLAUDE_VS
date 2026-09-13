# Batch 1 — Core harness refactor (KN-047 debt paydown) — HOÀN THÀNH

**Task:** Trả nợ slop 3 file CLI core: `auto-researcher.mjs` (8) + `auto-learn.mjs` (18) + `harness-manager.mjs` (19) = **45 findings → 0**.

## Kết quả

| File | Slop | Pairwise verify | Ghi chú |
|------|------|-----------------|---------|
| `auto-researcher.mjs` | 8 → **0** ✅ | **7/7 IDENTICAL** | human · json · distill-skip · distill-construct (3 file viết ra) · report (stdout+file) · missing-task (exit 1) |
| `auto-learn.mjs` | 18 → **0** ✅ | **30/30 IDENTICAL** | 28 CLI scenarios (suggest/status/history/versions/watchdog --now/stats/evaluate/propose/get/help + 11 error paths) + 2 write paths (log → bug.md, record → record.json) |
| `harness-manager.mjs` | 19 → **0** ✅ | **23/23 + write cycle** | 23 CLI scenarios + create/disable/enable/uninstall/preset-save cross-version IDENTICAL + registry byte-exact HEAD sau test |

**Tổng: 45 → 0 findings** · 3 specs phụ thuộc (cosmos-cmb, cosmos-hawking, slop-check) **21/21 pass** · `export-claude --check` vẫn clean.

## Pattern refactor chính

- **Duplication propose↔commitCandidate** (auto-learn): tách `extractBugMeta` (defaults khác nhau giữ nguyên), `buildKnDraft`, `buildKnTableRow`, `findNextKnId` — dùng chung 3 chỗ (propose/evaluate/commit).
- **parseKNs/scoreKN** (auto-researcher + auto-learn): cùng split `parseKnTags`/`parseKnBlock`/`parseKnTableFallback` + `countTokenMatches`/`scoreToken` — giữ nguyên behavior từng file.
- **harness-manager:** `scanFs` (110/CC39) → `readDescFromFile`+`makeSkillEntry`+`makeFileEntry`+`scanEnabledEntries`+`scanDisabledEntries` (giữ nguyên key-order JSON); `install`/`installLocal` → `installSkillFromGh`/`installFileFromGh`/`installLocalSkill`/`installLocalFile` + `prepareSkillDest`; `exportClaude` (134/CC50) → `buildExportSet`+`makeWriteIfChanged`+`writeSkillDirs`+`cleanupOrphanExports`+`printExportSummary`; `main` (96/CC72) → dispatch Map + `run*` helpers.
- **auto-learn:** `main`-style dispatch đã có từ trước; thêm `readRecent*`/`print*Human`/`applyPresetItem` pattern cho `status`/`statsHeatmap`/`showHistory`.

## Verification protocol (pairwise same-moment)

1. Copy byte-exact bản gốc → `<file>.orig.mjs` cùng thư mục (giữ nguyên `__dirname` depth).
2. Refactor file chính.
3. Runner `.agent/plans/harness-core-refactor/pairwise.mjs` chạy cả 2 với cùng args, so stdout/stderr/exit (normalize ISO timestamps).
4. Write paths: capture file viết ra → cleanup → chạy bản kia → so file (normalize timestamp/id).
5. Cleanup: xóa `.orig.mjs` sau khi xong.

## Bài học rút ra (ứng viên KN-053)

1. **Restore file bằng PowerShell string-piping (`git show | Out-File`) là SAI** — mangle encoding/EOL → file chạy ra kết quả khác (suýt tạo false alarm "behavioral diff"). Đúng: `git checkout -- <file>` + `Copy-Item`. Lỗi này suýt làm mình kết luận sai rằng refactor thay đổi behavior (distill null vs skipped).
2. **Test label sai → false failure:** lần 2 đo "baseline" chụp hash lúc state đang mid-test (item còn tồn tại) → so sai reference. True baseline verify = so với `git HEAD` hash.
3. **Pairwise mode lồng nhau:** `--distill` có 2 nhánh (skip khi đủ coverage vs construct) — task test phải chọn kỹ để chạm đúng nhánh (task gibberish chứa keyword "distill"/"task" vẫn hit KN ≥15). Random token thuần (`qwxz plmokn iuhbgy`) mới chạm construct.
4. **Key-order JSON khi refactor:** spread `{...disabled, ...enabled}` đổi thứ tự key so với insert-tuần-tự → phải giữ insertion order gốc (enabled trước, disabled sau) để registry.json byte-exact.

## Cleanup
- [x] 3 file `.orig.mjs` xóa
- [x] Test artifacts (distill dir, report file, preset/pw-test) dọn sạch
- [x] registry.json byte-exact HEAD
- [ ] Commit

---

# Phần 2 — kn-parse.mjs (diệt cross-file dup)

Sau khi 3 file riêng lẻ Clean, chạy chung phát hiện **10 cross-file dup** giữa `auto-researcher.mjs` ↔ `auto-learn.mjs` (parse/score family ~150 dòng). Đã từng drift tay → tách shared module:

- **`kn-parse.mjs`** (mới): `tokenize`, `computeIDF`, `parseKnTags`, `parseKnBlock`, `parseKnTableFallback`, `parseKNs(path)`, `countTokenMatches`, `scoreToken`, `scoreKN`.
- Cả 2 file import `{ tokenize, computeIDF, parseKNs, scoreKN }`; `parseKNs(KNOWLEGED)` truyền path (6 call sites AL + 1 AR).
- Slop 4 file cùng lúc: **Clean** ✅

## Re-verification (sau extract module)
- AR pairwise: **6/6 IDENTICAL** (orig byte-exact HEAD, gồm report write path)
- AL pairwise: **28/28 IDENTICAL** + log/record write re-test IDENTICAL
- Specs phụ thuộc (cosmos-cmb, cosmos-hawking, slop-check): chạy lại final

---

# ⚠️ Incident — suýt mất refactor auto-learn (đã recover)

**Chuyện gì:** Cuối session, chạy `git checkout HEAD -- auto-researcher.mjs auto-learn.mjs` để tạo bản orig byte-exact — nhưng auto-learn refactor **chưa commit** → bị revert luôn. Chỉ AR được save vào keep-file trước đó. ~12 edits auto-learn tưởng như mất trắng.

**Recovery:** VS Code Local History (`%APPDATA%\Code - Insiders\User\History\<hash>\`) — entry cuối chứa đúng bản refactored đầy đủ (check: `kn-parse` import + 6 `parseKNs(KNOWLEGED)` + không còn `function tokenize`) → copy về.

**Lessons (KN-053 candidate — đã log bug draft `.agent/bugs/2026-09-13-git-checkout-head-revert-nham-refactor-chua-commit/`):**
1. **KHÔNG BAO GIỜ `git checkout HEAD -- <file>` khi file có refactor chưa commit** — nó revert âm thầm. Checkout chỉ an toàn khi file đã commit hoặc đã copy ra chỗ khác TRƯỚC.
2. Quy trình đúng để tạo orig byte-exact: (a) save refactored → keep-file trước; (b) checkout; (c) copy làm `.orig`; (d) copy keep-file về. Hoặc đơn giản hơn: `Copy-Item` từ working tree trước khi edit (như đầu session đã làm — lần này tự phá quy trình của chính mình).
3. **VS Code Local History là safety net đáng tin** — có entry cho mọi lần save, recover được exact last state; nên nhớ đường dẫn khi cần.
4. Session dài + state phức tạp → thao tác phá hoại (checkout/reset) phải soi kỹ args trước khi Enter.
5. Restore file bằng string-piping PowerShell (`git show | Out-File`) là SAI (mangle) — dùng byte-level copy (`Copy-Item` / `git checkout` + copy), đã học ở part 1.
