> 🤖 Auto-log bởi auto-learn.mjs — 2026-09-14T16:08:21.179Z
> **Error:** `Routing & Failover cho Microsoft.Extensions.AI (MEAI 10.9, .NET Blog 12/08/2026): RoutingChatClient chon client theo request + SemanticRoutingChatClient (route theo nghia) + FailoverChatClient (retry: reselect khi fail TRUOC khi commit output; output da commit = terminal, khong mid-stream recovery) + OrderedFailoverChatClient. Pattern chuan: sticky selection 1 lan/session thay vi re-route moi turn (mat prompt cache + reasoning/continuation state bi strand), telemetry MOI attempt ke ca success (Duration/TimeToFirstUpdate) de route bang do khong bang vibe. Harness: pattern chua chuan hoa thanh KN + chuoi failover that duy nhat (gtx->gtx2->mymemory trong scripts/yt-summary/build.mjs) chua co luoi khoa invariants`
> **File:** `scripts/yt-summary/build.mjs`
> **Title:** routing failover - chuẩn hoá pattern, khoá lưới

> 🔁 **RADAR TÁI LẬP** — đối chiếu KN + bug cũ thấy nghi vấn:
> - 🔁 NGHI TÁI LẬP **[KN-041]** (score 228): YT Summary: mọi lane trích transcript no-key bị chặn + dịch vi fail hàng loạt
> - 🔁 NGHI TÁI LẬP **[KN-037]** (score 209.6): Evals Gap — "single biggest predictor" là evals discipline (Andrew Ng, Agentic AI Playbook 2026)
> - 🔁 NGHI TÁI LẬP **[KN-008]** (score 173.9): dotnet build fail MSB3027/MSB3021 do file lock — N5Blazor.exe đang chạy
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-12-yt-summary-youtube-block-va-dich-no-key`** (score 252.6): YT Summary — mọi lane trích transcript no-key bị chặn + dịch vi fail hàng loạt
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-08-30-dotnet-build-fail-do-file-lock-n5blazor-exe-ang-ch`** (score 176.8): dotnet build fail do file lock N5Blazor.exe đang chạy
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-04-pages-deploy-conflict-2-workflows`** (score 137.7): pages deploy conflict 2 workflows
> → Đọc **Cách phòng tránh** trong `docs/knowleged.md` TRƯỚC khi fix. Nếu là tái lập thật: ghi rõ "tái lập của KN-041" + **vì sao lưới cũ không bắt được** → nâng lưới (Guard) rồi mới fix.
# Bug: Routing & Failover cho chain model/provider — chuẩn hoá pattern + khoá lưới chuỗi gtx→gtx2→mymemory

> Knowledge-gap bug (article-lesson), không phải incident runtime: RADAR nghi **KN-041 (228)** — **liên quan, không tái lập**. KN-041 fix sự cố provider chết; gap mới = chuỗi failover sinh ra từ đó chưa được chuẩn hoá thành pattern và chưa có lưới khoá invariants. Final ID: **KN-063** (re-ID 061→062→063 — double-yield với Memora: cả 2 cùng yield, mình nhường tiếp; Memora giữ KN-062; đã update toàn bộ self-refs).

## Meta

- **Slug:** `2026-09-14-routing-failover-chuan-hoa-pattern-khoa-luoi`
- **Ngày:** 2026-09-14
- **Severity:** major
- **Reporter:** YUNIE / user request (article-lesson)
- **Related KN:** KN-041 (chain + per-host breaker sinh từ đó) · KN-056 (guard gate) · KN-060 (article-lesson edit gate) · KN-019 (route bằng đo) · KN-052 (mechanism vs claim) · KN-047 (spec ≠ wish)
- **Tags:** `process` `api` `architecture` `failover` `verify`
- **Guard:** `tests/e2e/yt-summary-chain.spec.ts` — invariant khoá chuỗi gtx→gtx2→mymemory + negative control (mutant source phải FAIL)
- **Status:** fixed

---

## 1. Reproduce

### Steps
1. Grep `docs/knowleged.md`: `failover|routing|RoutingChat|multi-model` → **0 match** — không KN nào mô tả pattern, dù code đã dùng.
2. Xem lưới hiện có cho chuỗi failover duy nhất của harness — `scripts/yt-summary/build.mjs` (gtx → gtx2 → mymemory, breaker theo host).
3. Grep `tests/` cho `gtx|GTX_URL` → chỉ có `ai-news-vi.spec.ts` (chain clients5→MyMemory của **trang** ai-news, page-level). Spec yt-summary chỉ cover `pipeline.mjs` (parse/clean/segment/chunk) — **`build.mjs` không được test** (CLI chạy `main()` lúc import → không import-test được, KN-014).
4. Thử phá invariant: xoá breaker-per-host / đảo thứ tự chain / bỏ fallback `vi = ch` / bỏ timeout → **không test nào fail** (suite vẫn xanh).

### Expected vs Actual
- **Expected:** Pattern routing/failover được chuẩn hoá (vocabulary + invariants) và chuỗi production có lưới khoá invariants — provider chết không thể âm thầm làm gãy pipeline qua một refactor.
- **Actual:** Pattern chỉ tồn tại dạng implementation detail; 0 KN + 0 test chain-level (thứ tự failover · breaker theo host · terminal-on-commit · fallback giữ gốc · telemetry mọi attempt).

### Evidence
- Log / screenshot / test fail / video:
```
- grep docs/knowleged.md "failover|routing|RoutingChat|multi-model" → (empty)
- grep tests/ "gtx|GTX_URL|clients5" → chỉ ai-news-vi.spec.ts (page-level, không phải build.mjs)
- Bài MEAI 10.9 (.NET Blog 12/08/2026): 4 primitives — RoutingChatClient (select trước khi gọi) ·
  SemanticRoutingChatClient (route theo nghĩa, threshold + topK) · FailoverChatClient (reselect khi fail
  TRƯỚC khi commit output; output đã commit = terminal, "no mid-stream recovery") ·
  OrderedFailoverChatClient (đi theo list xếp hạng). Kèm: sticky selection (chốt route 1 lần/session —
  tránh mất prompt cache + reasoning/continuation state bị strand); telemetry MỌI attempt kể cả success
  (Duration/TimeToFirstUpdate) — route bằng đo (KN-019).
- https://devblogs.microsoft.com/dotnet/routing-and-failover-for-microsoft-extensions-ai/
```

### Environment
- Branch: `main`
- Commit: `d32dae2`
- OS/Browser: N/A (knowledge-gap — không phải incident runtime)

---

## 2. Root Cause (5 Whys)

- **File:Line:** `scripts/yt-summary/build.mjs:139-215` (chuỗi dịch + breaker) · `docs/knowleged.md` (thiếu KN)
- **Why 1:** Chain failover được xây trong lúc chữa cháy KN-041 (provider chết) nhưng chưa bao giờ được nhìn nhận là *pattern* — chỉ là chi tiết triển khai trong 1 CLI.
- **Why 2:** Invariants của chain không được externalize → không gì bảo vệ khi refactor; lưới hiện có test page-level (ai-news-vi) + pipeline-level (yt-summary-build), không test chain-level.
- **Why 3:** Không lưới = lớp chịu lỗi provider (giá trị chính KN-041 đã trả giá để có) có thể mất âm thầm — đúng loại "suite xanh, fault-tolerance chết".
- **Why 4:** SDK chính chủ (MEAI 10.9) vừa chuẩn hoá vocabulary cho đúng bài toán này — bỏ lỡ thì mỗi chain tương lai (yunie-chat proxy 1 host, ai-news clients5→MyMemory) lại tự phát minh lại, không có từ vựng chung để review.
- **Why 5 (Root):** Tri thức vận hành (fault-tolerance) không được externalize thành KN + không được khoá bằng lưới máy — knowledge không Guard = wishlist (KN-056); invariant không test = spec-vs-wish (KN-047).

- **Impact:** Chuỗi dịch yt-summary (CI + local — hàng trăm chunks/lần chạy); mọi refactor tương lai của chain trong `www/` + `scripts/`.
- **Hypothesis:** Chuẩn hoá pattern thành KN-063 + khoá invariants bằng spec mới; **không** port primitives .NET (harness 0-dep Node — adopt pattern, không adopt framework).
- **Confidence:** `HIGH` cho phần gap (đo được: 0 KN match + spec không cover `build.mjs`) · `MEDIUM` tổng thể (knowledge-gap, không phải incident đang cháy)

> RADAR nghi **KN-041** — liên quan, **không phải tái lập**: KN-041 fix incident (provider bị chặn); KN-063 chuẩn hoá pattern + nâng lưới chain-level. "Vì sao lưới cũ không bắt được": lưới KN-041 chỉ cover page/pipeline, không cover chuỗi provider trong CLI.

---

## 3. Fix

- **Approach:** 2 phần bounded: (1) KN-063 chuẩn hoá pattern (vocabulary + adopt-list + cách phòng tránh); (2) guard spec static invariant khoá chuỗi thật — CLI không import được (`main()` chạy lúc import — KN-014) → theo precedent `readme-guard.spec.ts`/`hooks-integrity.spec.ts`, kèm negative control bằng mutant source (KN-058).
- **Files Changed:**
  - `tests/e2e/yt-summary-chain.spec.ts` — MỚI: invariant + negative control cho chuỗi failover
  - `docs/knowleged.md` — KN-063 (Bảng + Chi tiết + Anti-patterns + Checklist + UpdatedAt)
  - `www/ai-news/curated.json` — tag `KN-063` cho item routing (traceability)
  - `.agent/bugs/2026-09-14-routing-failover-chuan-hoa-pattern-khoa-luoi/bug.md` — file này
- **Diff tóm tắt:**
```diff
// before
- pattern failover chỉ tồn tại trong code; 0 KN; 0 test chain-level
// after
- KN-063 + yt-summary-chain.spec.ts — refactor phá failover/breaker/timeout sẽ FAIL suite
```
- **Non-Goals:** KHÔNG port MEAI primitives vào harness (0-dep — adopt pattern, không adopt framework); KHÔNG thêm failover cho yunie-chat proxy (1 host — quyết định riêng của user, option B); KHÔNG refactor `build.mjs`.
- **Fix Confidence:** `MEDIUM` — guard là static invariant (giới hạn đã biết: không behavioral); đủ chặn "mất invariant", behavioral test để lại khi tách module (nợ ghi rõ).
- **get_errors:** Sau mỗi edit → affected files; full scope ở Phase 4 Verify.

---

## 4. Verification

- [x] Reproduce steps 1-3 (gap đo được) → Fixed: KN-063 + spec tồn tại; step 4 (phá invariant) → mutant giờ FAIL (5 negative control)
- [x] Negative control: 5 mutant source (đảo thứ tự chain · breaker bỏ host · bỏ fallback · bỏ timeout · re-chunk restart) → violations non-empty — 5/5 FAIL đúng chỗ
- [x] Regression: `yt-summary-chain` (6) + `yt-summary-build` (6) + `yt-summary` (8) + `ai-news-curated` (3) + `ai-news-vi` (2) = 25/25 pass
- [x] `slop-check` vòng 1 FAIL `checkChain()` CC 32 → refactor 6 helper (CC ≤12) → vòng 2 `✅ Clean` (loop-it — KN-047)
- [x] policy-check: spec `REFUSED` với actor YUNIE (deny-test-mutate — gate hoạt động) / `PERMITTED` với actor verify (KN-012) → audit `b0ba59` / `2e2efa` / `e9cdaf`, chain OK
- [x] auto-learn `guards` nhận KN-063 → `tests/e2e/yt-summary-chain.spec.ts` (Guard line trong 2500 ký tự đầu — KN-060)
- [x] Va chạm ID concurrent: Memora + Echoverse cùng nhận 061 → routing re-ID 061→062→063 (double-yield) — status list không còn trùng KN ID
- [x] Fresh-eyes tier: `RECOMMENDED` (knowledge/process — RADAR + guard family là lớp kiểm bổ sung)

**Kết quả:**
```
- playwright: 6 passed (yt-summary-chain: 1 baseline + 5 negative control) · 23 passed (build+page+curated) · 2 passed (ai-news-vi)
- slop-check: ✅ Clean (sau refactor 6 helper — CC ≤12)
- auto-learn status: KN: 62 · list không trùng ID (…060, 062 Memora, 063 Routing)
- guards: ✅ KN-063 → tests/e2e/yt-summary-chain.spec.ts
- audit: 3 entry permitted (spec verify / knowleged / curated) + chain OK 173 chained · 0 legacy
```

---

## 5. Lesson (1 câu)

> Chain failover phải được chuẩn hoá + khoá bằng lưới (thứ tự failover · breaker theo host · output đã commit = terminal · fallback giữ gốc · telemetry mọi attempt) — fault-tolerance không có test là fault-tolerance sẽ mất.

---

## 6. Prevention

- **Cách phòng tránh lần sau:**
  - [ ] Chain mới (nhiều provider/model): ≥3 điều kiện — thứ tự failover rõ ràng; breaker/filter theo **đơn vị lỗi** (host/provider — không global); fallback cuối giữ dữ liệu gốc (chain không được crash pipeline).
  - [ ] Output đã commit = terminal: chỉ reselect TRƯỚC khi commit; mid-stream recovery cần thiết kế khác (buffer/checkpoint) — đừng giả định failover cứu được.
  - [ ] Phiên dài/multi-turn: sticky selection — chốt route 1 lần, pin sau khi response xong; không re-route mỗi turn (mất prompt cache + reasoning state).
  - [ ] Route bằng đo không bằng vibe: log mọi attempt (success + failure + latency) — đối chiếu audit.jsonl (KN-019).
  - [ ] Fail-fast > hammer: provider đã biết chết (breaker open / quota hết) → short-circuit, đừng gọi tiếp.
  - [ ] Lưới cho CLI không import được: static invariant + negative control mutant; behavioral test để lại khi tách module.
  - [ ] Thêm checklist vào `docs/knowleged.md` Anti-patterns / Checklist phòng tránh chung.
- **Guard (lưới chống tái lập — KN-056):**
  - [x] `- **Guard:**` ở Meta = `tests/e2e/yt-summary-chain.spec.ts` (+ negative control mutant)
  - [x] RADAR nghi KN-041 → ghi rõ "liên quan, không tái lập" + vì sao lưới cũ không bắt được (page/pipeline-level, thiếu chain-level)
- **Cần cập nhật:**
  - [x] `docs/knowleged.md` → KN-063 (Bảng tóm tắt + Chi tiết + Anti-patterns + Checklist)
  - [x] Test mới: `tests/e2e/yt-summary-chain.spec.ts`
  - [ ] `product-quality.instructions.md` — không cần (không phải chuẩn UI)

---

## References

- `docs/knowleged.md#KN-063`
- Article: https://devblogs.microsoft.com/dotnet/routing-and-failover-for-microsoft-extensions-ai/
- Related: `.agent/bugs/2026-09-12-yt-summary-youtube-block-va-dich-no-key/` (KN-041 — chain sinh từ đó)
- Commit fix: `99ca722` (disclosure: commit vô tình gồm 11 file đã-staged của session song song — policy v5 delegation + guard-redteam + plans; không mất gì, chỉ lệch attribution)

---
*Bug: `.agent/bugs/2026-09-14-routing-failover-chuan-hoa-pattern-khoa-luoi/` — KN-063 (article-lesson; re-ID 061→062→063 double-yield concurrent với Memora giữ 062).*
