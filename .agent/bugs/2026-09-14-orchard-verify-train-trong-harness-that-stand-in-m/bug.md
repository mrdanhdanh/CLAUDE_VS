> 🤖 Auto-log bởi auto-learn.mjs — 2026-09-14T16:19:34.523Z
> **Error:** `Orchard (MSR 03/08, arXiv:2605.15040, github.com/microsoft/Orchard): train/eval agent qua stand-in don gian hoa -> train-deploy mismatch khong bat duoc; check/hoc phai chay TRONG harness that (proxy ghi inference calls, rollout trong container rieng); generalization sang harness chua thay moi la thu that - 45.0 vs sup 3.6/0.0; env reuse cho ca train+eval+data`
> **File:** `docs/knowleged.md`
> **Title:** Orchard verify-train trong harness that - stand-in mismatch

> 🔁 **RADAR TÁI LẬP** — đối chiếu KN + bug cũ thấy nghi vấn:
> - 🔁 NGHI TÁI LẬP **[KN-037]** (score 167.3): Evals Gap — "single biggest predictor" là evals discipline (Andrew Ng, Agentic AI Playbook 2026)
> - 🔁 NGHI TÁI LẬP **[KN-015]** (score 156.4): GitHub Pages deploy fail — 2 workflows cùng `github-pages` env + eval-gate Node 18 CJS
> - 🔁 NGHI TÁI LẬP **[KN-057]** (score 104.8): Ranh giới vibe coding vs engineering ở review/verify chain, không ở label — "keep holding the wheel"
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-04-pages-deploy-conflict-2-workflows`** (score 136.1): pages deploy conflict 2 workflows
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-08-30-ai-server-slot-hardcode-tunnel`** (score 94.1): Slot máy chủ AI không hoạt động — hardcode localhost dev tunnel trong app releas
> - 🔁 NGHI TÁI LẬP **bug cũ `2026-09-14-echoverse-co-evolution-check-do-doc-2-lan-world-fi`** (score 94.1): Echoverse — co-evolution: check đỏ đọc 2 lần theo tầng (code · test · env · đo),
> → Đọc **Cách phòng tránh** trong `docs/knowleged.md` TRƯỚC khi fix. Nếu là tái lập thật: ghi rõ "tái lập của KN-037" + **vì sao lưới cũ không bắt được** → nâng lưới (Guard) rồi mới fix.
# Bug: Orchard verify-train trong harness that - stand-in mismatch

> Article-lesson (không phải incident): Orchard — Microsoft Research 03/08/2026 (open framework cho agentic modeling; arXiv:2605.15040; github.com/microsoft/Orchard — MIT; blog MSR "Orchard: An open framework for scalable agentic AI"). Meta template thay bằng nội dung thật — số KN = **KN-065** (chốt tại paste 23:29 14/09 — Echoverse=KN-064 committed `d63d8d8`; re-check max=064 → nextId=065 ✓; integrity check sau paste: rows 64 = details 64, không dup/orphan).

## Meta

- **Slug:** `2026-09-14-orchard-verify-train-trong-harness-that-stand-in-m`
- **Ngày:** 2026-09-14
- **Severity:** major
- **Layer:** process (bài meta — verify methodology)
- **Reporter:** YUNIE / user request (article-lesson)
- **Related KN:** KN-037 (Evals Gap — đo HOW WELL trên scenario thật) · KN-039 · KN-058 · KN-031 · KN-030 · KN-043 (lớp "verify môi trường thật" theo từng bề mặt: shell · viewscreen · browser channel · deploy root · IDE path) · KN-047 (yesterday's green + spec-vs-wish) · KN-060 (portability xuyên harness = tài sản) · KN-019 (đo không vibe) · KN-052 (mechanism vs claim)
- **Tags:** `process` `verify` `harness` `evals` `env`
- **Guard:** `tests/e2e/hooks-integrity.spec.ts` + `tests/e2e/status-audit.spec.ts` + `tests/e2e/readme-guard.spec.ts` — lưới "chạy trong runtime thật" (shell thật · serve www thật · decode thật). **Declared:** cơ chế train-in-harness đầy đủ (proxy + container/rollout) ngoài scope file-based — direction, không claim.
- **Status:** fixed (KN-065 — pasted 23:29 + verified 14/09)

---

## 1. Reproduce

### Steps
1. Verify một artifact bằng bản rút gọn ("stand-in"): nhìn code thấy đúng · render local · chạy tay không qua shell thật · mock thuần — suite xanh.
2. Chạy trong runtime đích → gãy ở lớp env-interaction mà stand-in không tái lập: hooks bị shell thật parse lỗi (KN-039), README vỡ trên viewscreen thật (KN-058), reduced-motion khác trên Edge thật (KN-031), fetch 404 trên deploy root (KN-030), path chết trong IDE thật (KN-043).
3. Chiều Orchard: open training stacks buộc train qua "simplified reimplementation" của harness → train–deploy mismatch; agent train xong tụt khi gặp harness thật (đo được: model train trong harness thật generalize sang harness CHƯA THẤY — xem Evidence).

### Expected vs Actual
- **Expected:** Check/học chạy trong (hoặc ít nhất đối chiếu với) harness thật khi có thể; stand-in rút gọn chỉ là smoke và phải dán nhãn "not proof".
- **Actual (trước adoption):** Không có meta-rule "check phải chạy ở đâu" — kết quả trên stand-in được ghi thành "đã verify" (false confidence); env bị coi là chi tiết triển khai thay vì phần của phép đo.

### Evidence
- Local-first (bằng chứng chính — KN-052): bug corpus lớp env — KN-039 (hook PS parse) · KN-058 (SVG decode) · KN-031 (Edge reduced-motion) · KN-030 (fetch /.agent 404 trên Pages) · KN-043 (path thiếu prefix IDE).
- Corroboration (MSR 03/08/2026 — arXiv:2605.15040 + README github.com/microsoft/Orchard; số self-measured → non-gating theo KN-052):
```
• Orchard-SWE (35B-A3B ~3B active) 73.0% SWE-bench Verified — ≈ hệ 10–30× lớn hơn.
  Train thẳng TRONG harness thật (Codex/OpenClaw/ZeroClaw) — OpenForge RL: proxy ghi inference calls
  của chính harness + rollout mỗi cái trong container riêng → xoá train–deploy mismatch.
• Generalization = thước thật: dưới harness CHƯA TỪNG THẤY khi train (Kimi-CLI) vẫn 45.0 SWE-bench
  + 20.1 Terminal-Bench; OpenSWE-32B sụp 28.7→3.6 và 0.0.
• Orchard-Claw: Codex harness 18.6% → 51.5% sau train; swap sang harness mạnh hơn (ZeroClaw) +14.3 pass@3.
• "switching the harness you train against is a change of command, not a change of image"
• 32,536 rollout unresolved vẫn thành training data (credit-assignment) — học từ hành trình thất bại.
```

### Environment
- Branch: `main`
- Commit: `e669219` (log 23:19Z — trước khi các session song song commit 99ca722/2657f51)
- OS/Browser: N/A (article-lesson + knowledge-gap)

---

## 2. Root Cause (5 Whys)

- **File:Line:** `docs/knowleged.md` (knowledge layer) · lưới hiện có `tests/e2e/hooks-integrity.spec.ts`, `status-audit.spec.ts`, `readme-guard.spec.ts`
- **Why 1:** Check thoả mãn cú pháp trên stand-in, không tái lập tương tác môi trường (shell thật, browser channel, deploy root, multi-process harness).
- **Why 2:** Verify gate không định nghĩa "check phải chạy ở đâu" — không phân biệt proof (chạy trong runtime đích) vs smoke (bản rút gọn).
- **Why 3:** Kết quả stand-in được ghi thành "đã verify" → false confidence; portfolio gate mất tín hiệu thật.
- **Why 4:** Env bị coi là chi tiết triển khai thay vì phần của phép đo — Orchard ngược lại (env service hạng nhất, dùng chung train+eval+data); mismatch train–deploy chính là loại nợ này ở quy mô training.
- **Why 5 (Root):** Harness thiếu meta-rule "đo trong môi trường đích" — các lưới hiện có phủ từng bề mặt (đúng, theo KN-039/058/031/030/043) nhưng rule chưa externalize thành KN để áp cho bề mặt MỚI trước khi nó gãy.

- **Impact:** Mọi verify gate + evals (KN-037) + mọi runtime mới thêm sau này (dependency/platform/deploy target).
- **Hypothesis:** Rule hoá "check trong harness thật khi có thể; stand-in = smoke, dán nhãn not proof" + cite lưới hiện có (không port hạ tầng K8s/proxy — file-based, 0 deps — minimal ladder). RADAR nghi KN-037 (167.3)/KN-015 (156.4)/KN-057 (104.8) — **liên quan, không tái lập**: đó là evals-gap & deploy/env từng bề mặt; đây là meta-rule + bằng chứng generalization xuyên harness.
- **Confidence:** `MEDIUM` — knowledge-gap (không có incident runtime mới); verify = guards detect + cite đúng + rule áp được.

> Nếu bug chạm pattern trong `docs/knowleged.md` → ghi `Related KN: KN-XXX` và áp dụng **Cách phòng tránh** ngay.
> **Root Cause Gate:** Nếu uncertain → investigate / escalate, không tự biến hypothesis thành sự thật.

---

## 3. Fix

- **Approach:** Chuẩn hoá meta-rule vào `docs/knowleged.md` (KN-065) + 2 anti-patterns + 1 checklist; cite lưới "runtime thật" hiện có làm enforcement từng bề mặt; tag curated. Knowledge-gap — không code.
- **Files Changed:**
  - `docs/knowleged.md` — KN-065 (Bảng tóm tắt + Chi tiết + Anti-patterns + Checklist + UpdatedAt)
  - `www/ai-news/curated.json` — tag `KN-065` cho item Orchard (traceability)
  - `.agent/versions/` — snapshot trước paste (Reef-lite — `.md` + `.json` metadata)
- **Diff tóm tắt:**
```diff
// before: rule "đo trong môi trường đích" chưa tồn tại — lưới chỉ phủ từng bề mặt đã gãy một lần
// after:  KN-0XX — check/học chạy trong harness thật khi có thể; stand-in = smoke dán nhãn "not proof"; đổi env → re-run
```
- **Non-Goals:** KHÔNG port proxy/container-per-rollout (Orchard infra) vào harness file-based — adopt rule, không adopt framework (minimal ladder); KHÔNG thêm spec mới (lưới hiện có phủ bề mặt; spec hoá "meta-rule" sẽ là theater — đối chiếu critic pattern 14/09).
- **Fix Confidence:** `MEDIUM` — rule + cite; không có behavior mới để chứng minh.
- **get_errors:** Sau mỗi edit → affected files; full scope ở Phase 4 Verify (paste phase).

---

## 4. Verification

- [x] Article-lesson — không có runtime reproduce; bằng chứng = bug corpus local + corroboration MSR (non-gating)
- [x] Guard files tồn tại: `hooks-integrity` · `status-audit` · `readme-guard` (verified 14/09 — Test-Path OK)
- [x] RADAR đã chạy + verdict ghi ở §2: KN-037/KN-015/KN-057 — liên quan, KHÔNG tái lập
- [x] Sau paste: `guards` detect KN-065 ✓ — `["hooks-integrity","status-audit","readme-guard"]` (counts: total 64 · withGuard 37)
- [x] Regression: 22 passed / 2 failed (4 spec: auto-learn-guard + kn-id-integrity + yt-summary-chain + ai-news-curated) — **2 red thuộc `kn-id-integrity.spec.ts` (WIP session khác): baseline thiếu order `063 → 062` [từ renumber 23:19, trước paste] + negative-control pin ID [stale khi 064/065 vào] — không do KN-065**
- [x] UI audit: N/A (knowledge-gap)
- [x] Fresh-eyes tier: `OPTIONAL` (knowledge/process — lớp kiểm độc lập: RADAR + guards audit)

**Kết quả:**
```
integrity: rows 64 = details 64 · dupRow none · dupDet none · orphan none · curated JSON OK
paste: knowleged.md + curated tag KN-065 + snapshot .agent/versions/2026-09-14-KN-065-orchard-verify-train.md
evaluate (post-paste): FAIL — self-match KN-065 66.7 (tự khớp sau paste); pre-paste RADAR: KN-037(167.3)/KN-015(156.4)/KN-057(104.8) liên quan, not-dup
  → disclosure bypass có chủ đích (như KN-060/062; heuristic recall-heavy, threshold 15)
kn-id-integrity 2 red: baseline `chi tiết sai thứ tự: KN-063 → KN-062` (pre-existing) + negative-control pin ID — handoff kn-id workstream
```

---

## 5. Lesson (1 câu)

> Bài học rút ra, 1 câu súc tích — sẽ copy vào `docs/knowleged.md` Bảng tóm tắt.

Check/học chỉ đáng tin khi chạy trong môi trường đích — bản rút gọn (stand-in) chỉ là smoke, phải dán nhãn "not proof"; env là phần của phép đo, không phải chi tiết triển khai (Orchard: generalization sang harness chưa thấy mới là thước thật — 45.0 vs sụp 3.6/0.0).

---

## 6. Prevention

- **Cách phòng tránh lần sau:**
  - [x] Check chạy được trong runtime thật (shell/browser/serve/IDE/viewscreen thật) → chạy ở đó, đừng thay bằng stand-in (KN-039/058/031/030/043)
  - [x] Stand-in bắt buộc dùng → dán nhãn "not proof" (như `mutation.mjs` "lite — đừng tin survived", KN-047)
  - [x] Đổi env/dependency/deploy target → chạy lại trong env mới ("yesterday's green không áp dụng" — KN-047 + Foundry curated: router đổi pool = đáng một lần eval)
  - [x] Không port hạ tầng training (K8s/proxy) — adopt rule, không adopt framework (minimal ladder)
  - [x] Portability xuyên runtime là tài sản (KN-060): chromium + msedge, local + CI
  - [x] Đã thêm Anti-patterns (2) + Checklist (1) vào `docs/knowleged.md` — KN-065
- **Guard (lưới chống tái lập — KN-056):**
  - [x] `- **Guard:**` đã điền ở Meta (cite lưới runtime-thật hiện có + declared cho phần ngoài scope)
  - [x] TÁI LẬP? → **không** — RADAR flag KN-037/015/057 nhưng đây là meta-rule mới (đã ghi ở §2)
- **Cần cập nhật:**
  - [x] `docs/knowleged.md` → `KN-065` (Bảng tóm tắt + Chi tiết + Anti-patterns + Checklist + UpdatedAt)
  - [x] `product-quality.instructions.md`: N/A (không phải chuẩn UI)
  - [x] Test mới: không — cite lưới hiện có (tránh theater)

---

## References

- `docs/knowleged.md#KN-065`
- Orchard: https://www.microsoft.com/en-us/research/blog/orchard-an-open-framework-for-scalable-agentic-ai/ · arXiv:2605.15040 · https://github.com/microsoft/Orchard · https://huggingface.co/datasets/microsoft/Orchard
- Related KN: KN-037 · KN-039 · KN-058 · KN-031 · KN-030 · KN-043 · KN-047 · KN-060 · KN-052
- Commit fix: `<hash>` (bundle với paste — commit sau khi paste + verify)

---
*Template: `.agent/bugs/_template/bug.md` — dùng bởi `/fixbug` Phase 1 & 5.*
