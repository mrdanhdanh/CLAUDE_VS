# Bug: power sweep false green — liveness không phải health

> 🤖 Auto-log bởi auto-learn.mjs — 2026-09-25T14:03:05.496Z

> 🔁 **RADAR TÁI LẬP** — đối chiếu KN + bug cũ thấy nghi vấn:
> - 🔁 NGHI TÁI LẬP **[KN-074]** (lớp gốc): gate "đã chạy" ≠ gate "khỏe" — nay tái lập ở tầng aggregator
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-14-status-mirror-stale-health-warn`**: mirror stale làm suite đỏ trong khi health tự báo ổn
> → Đây là **tái lập mở rộng của KN-074**: aggregator mới lặp lại đúng lớp bug nó sinh ra để chặn, nhưng ở tầng kế tiếp (marker chứng minh liveness, không chứng minh health). Lưới cũ không bắt được vì self-test chỉ test hygiene của `runCheck`, không có negative control cho từng link.

## Meta

- **Slug:** `2026-09-25-power-sweep-false-green-liveness-khong-phai-health`
- **Ngày:** 2026-09-25
- **Severity:** `major`
- **Detection:** `false-green` (full-suite + independent Critic)
- **Detection rule:** Một dòng metadata duy nhất, chỉ đúng một enum; không thêm suffix hoặc duplicate field.
- **Layer:** `code` — assertion của aggregator chỉ xác nhận liveness, không xác nhận health.
- **Reporter:** YUNIE (full-suite run) + Critic (read-only review)
- **Related KN:** `KN-078`
- **Tags:** `process` `verification` `gate` `false-green`
- **Guard:** `power-check --self-test` 7 case (missing marker / drift / exit lệch / arg exit 2 / mirror hỏng / scale missing + stale) + component eval `power-check-self-test`
- **Status:** `fixed` — 2026-09-25; 3 link có đường đỏ thật + 2 negative probe thực thi pass

---

## 1. Reproduce

### Steps
1. Chạy `npm run power` → `⚡ 9/9 ALL GREEN`.
2. Chạy full suite `npx playwright test` → `cosmos-freshness.spec.ts` đỏ: badge `🟡 hơi cũ · 44h` trong khi spec đòi `🟢 tươi` + class `ok`.
3. Critic đọc từng đích spawn: `registry` và `guards` in marker vô điều kiện, không bao giờ exit ≠ 0 → có thể green dù registry drift / guard coverage = 0.

### Expected vs Actual
- **Expected:** Sweep khẳng định "toàn bộ health" thì mọi link phải CÓ THỂ đỏ: drift registry, guard tụt, mirror stale đều phải làm sweep đỏ.
- **Actual:** 9/9 ALL GREEN trong khi mirror cosmos cũ 44h; 2/8 link không thể fail; status-mirror không kiểm freshness.

### Evidence
- Full suite lượt 1: `3 failed / 285 passed` — `cosmos-freshness` (badge `hơi cũ · 44h`), 2 timeout animation (flake do tải).
- Critic: bảng verify từng exit path — `harness-manager status()` không có exit logic; `guardsAudit` không có `process.exit` → marker in vô điều kiện.
- Negative controls thật: guard floor 0/59 → ĐỎ; registry mtime > status.generatedAt → ĐỎ.
- Sau fix: sweep 10/10 · self-test 7 case · full suite lượt 2 = **288/288 pass**.

### Environment
- Branch: working tree 2026-09-25 (chưa commit)
- OS/Browser: Windows · Node v22.22.2 · pwsh 7 · Playwright chromium (+ Edge projects)

---

## 2. Root Cause (5 Whys)

- **File:Line:** `.github/harness/scripts/power-check.mjs` (CHECKS `registry`/`guards`, `checkStatusMirror`)
- **Why 1:** Sweep báo green sai → vì 2 link chỉ assert "lệnh chạy xong" (exit 0 + in chữ) chứ không assert điều kiện sức khỏe.
- **Why 2:** Chọn marker = header văn bản (`Harness Status`, `GUARD COVERAGE`) — in vô điều kiện, kể cả khi metrics xấu.
- **Why 3:** Ngộ nhận "chạy được = khỏe": copy pattern marker proof-it-ran (KN-074) mà quên nửa sau — marker chỉ chứng minh ĐÃ CHẠY, không chứng minh KẾT QUẢ.
- **Why 4:** Không có negative control cho từng link (chỉ có self-test hygiene chung) → link chết không ai thấy.
- **Why 5 (Root):** Aggregator tái lập ĐÚNG lớp bug nó sinh ra để chặn (KN-074) — thiếu rule: **mọi link health phải có 1 điều kiện ĐỎ được chứng minh**.

- **Impact:** YUNIE `npm run power` có thể trấn an sai — hệ thống stale/drift mà vẫn ALL GREEN → che bug đúng như KN-005 (bug blindness) phiên bản máy.
- **Hypothesis:** Thay marker liveness bằng assertion thật (forbid drift / floor / freshness) + negative controls thực thi → link nào cũng có đường đỏ. Đã verify bằng probe thật.
- **Confidence:** `HIGH` (proven + regression pass)

---

## 3. Fix

- **Approach:**
  - `registry`: forbid `⚠️ mismatch` / `❌ missing` trong output `harness-manager list` (dùng detector sẵn có — không viết detector mới).
  - `guards`: parse `guards --json` + `assertGuardFloor` (withGuard < 50 → đỏ; hiện 59).
  - `status-mirror`: thêm freshness (mtime `registry.json` > `generatedAt` → đỏ "chạy generate-status") + kiểm đủ 5 counts + parse `generatedAt`.
  - Thêm link 10 `cosmos-freshness`: `scale.json` < 24h (khớp threshold badge `🟢 tươi` + guard spec).
  - `evals`: mở rộng `--scope components` → `--scope all`.
  - Self-test 6 → 7 case (thêm scale missing + stale); `isMain` đổi sang repo idiom (resolve path).
- **Files Changed:**
  - `.github/harness/scripts/power-check.mjs` — assertions thật + 7-case self-test (85 dòng chính).
  - `.github/harness/evals/components.json` — marker 7 case.
  - `www/cosmos/scale.json` + mirrors (`npm run cosmos:refresh`) — dữ liệu tươi lại.
- **Non-Goals:** Không sửa `harness-manager`/`auto-learn` (chỉ đọc output sẵn có); **không sửa spec/test** (policy immutable — KN-012); không đưa sweep vào CI (scope riêng); không merge một registry duy nhất với eval-gate (ghi follow-up).
- **Fix Confidence:** `HIGH` — mọi link mới có negative control chạy thật.
- **get_errors:** Affected files 0 errors.

---

## 4. Verification

- [x] Reproduce → Fixed: 3 link cũ giờ có đường đỏ; mirror stale đã refresh (<1h).
- [x] Edge cases:
  - [x] guard floor `0/59 < 50` → ĐỎ (probe thật, NEG-1)
  - [x] registry mtime mới hơn status → ĐỎ (probe thật, NEG-2)
  - [x] scale missing / stale → ĐỎ (self-test case)
  - [x] arg rác `--bogus` → exit 2
- [x] Regression: full suite lượt 2 = **288/288 pass** (lượt 1: 285/288 — 1 real stale + 2 flake do tải, đã isolate xác nhận: lab12 8/8 · rework 15/15 · freshness 4/4 khi chạy riêng — KN-064 đọc đỏ 2 lần).
- [x] `get_errors` toàn scope → 0 errors; `slop-check` clean (đã refactor CC 13/16 → ≤12); `eval-gate --scope all` pass.
- [x] UI audit: không áp dụng (CLI) — nhưng status/cosmos mirror đã regenerate + status-audit spec pass.
- [x] Fresh-eyes tier: `REQUIRED` — Critic độc lập tìm B1/B2/M1-M3; đã xử lý B1+B2+M1+M2+M3, phần còn lại ghi follow-up.

**Kết quả:**
```text
⚡ POWER SWEEP — 10/10 checks · 7.6s
✅ registry (forbid drift) · guards floor 59 · status-mirror fresh · cosmos-freshness tươi <1h
power-check self-test: 7 cases passed
NEG-1: guard floor 0/59 < 50 → ĐỎ (NEG-1 PASS)
NEG-2: stale mirror "registry.json mới hơn status.json" → ĐỎ (NEG-2 PASS)
npx playwright test → 288 passed (3.5m)
```

---

## 5. Lesson (1 câu)

> **Aggregator "1 lệnh = toàn bộ health" chỉ trung thực khi MỌI link có negative control chứng minh đường ĐỎ — marker chứng minh "đã chạy" không chứng minh "khỏe" (KN-074 tái lập ở tầng kế tiếp).**

---

## 6. Prevention

- **Cách phòng tránh lần sau:**
  - [x] Mỗi link health phải có assert điều kiện (forbid/threshold/freshness), không chỉ marker-in-output.
  - [x] Trước khi gọi một gate là "fail-closed", chạy negative control thật cho từng link.
  - [x] Aggregator mới phải tự chạy full-suite một lần trước khi tin (KN-065: đo trong runtime thật).
  - [x] Chạy `node .github/harness/scripts/auto-learn.mjs suggest "gate fail-closed marker false green"` trước khi viết gate mới.
- **Guard (lưới chống tái lập — KN-056):**
  - [x] `power-check --self-test` 7 case + component eval `power-check-self-test` (chạy trong `eval-gate --scope all`).
  - [x] Sweep tự nó là link trong registry → belt-and-braces với `setup-doctor-self-test`.
- **Cần cập nhật:**
  - [x] `docs/knowleged.md` → `KN-078` (Bảng tóm tắt + Chi tiết + Anti-patterns + Checklist)
  - [x] `docs/capabilities.md` §14 — 10 mắt xích
  - [x] `.github/agents/yunie.agent.md` §2 — 10 mắt xích

---

## References

- `docs/knowleged.md#KN-078`
- KN-074 (gốc: gate phải chứng minh ĐÃ CHẠY) · KN-002 (status mirror single-source) · KN-064 (đọc đỏ 2 lần) · KN-065 (đo trong runtime thật)
- Critic review 2026-09-25 (read-only, findings B1/B2/M1-M3)
- Commit fix: working tree (chưa commit)

---
*Template: `.agent/bugs/_template/bug.md` — dùng bởi `/fixbug` Phase 1 & 5.*
