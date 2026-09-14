# Proposal — Echoverse (MSR 30/07/2026) → KN-0XX (next free, §0) + Layer attribution surface (slim, critic-gated)

> Trạng thái: **ADOPTED & APPLIED ✅ (14/09 23:3x)** — owner duyệt + full apply xong: template/prompt (bfd386d) + auto-learn.mjs Layer wiring + spec mắt xích 5 (9/9) + KN-064 pasted. Bug: `.agent/bugs/2026-09-14-echoverse-co-evolution-check-do-doc-2-lan-world-fi/bug.md` (fixed).

## 0. ⚠️ Collision & coordination (phát hiện 14/09 ~23:30)

- Tại lúc chạy `propose` (~23:10): next free = **KN-061**.
- Sau đó, working tree xuất hiện **2 draft KN-061 chưa commit TỪ SESSION SONG SONG** — "Routing & Failover (MEAI 10.9)" (knowleged dòng 1310) + "Memora" (dòng 1330) — kèm bug folders untracked + `auto-learn.mjs` (+18) & `auto-learn-guard.spec.ts` (+51/-14) đang bị sửa dở.
- Hệ quả:
  1. **Echoverse paste = số kế tiếp SAU khi session kia commit/resolve** (khả năng KN-062/063) — trong tài liệu này gọi là **KN-0XX**, id chốt tại paste.
  2. **Không edit `auto-learn.mjs` / spec trong lúc file đang được session kia sửa** (2 writer trên cùng file = rủi ro ghi đè) → apply checklist §5 chờ session kia commit trước.
  3. 2 draft kia còn **đụng số với nhau** (cả hai cùng KN-061) — session kia tự renumber 1 trong 2; ta không đụng file của họ.
- Quyết định: **FREEZE mutate** — package sẵn sàng, chỉ chạy khi owner xác nhận session kia đã commit/resolve.

### UPDATE 14/09 23:20 — owner đã duyệt; thực thi partial (collision-safe)

- Tree 23:19 **vẫn dirty**; session Routing/Memora đang **renumber trực tiếp** (062→063 giữa 23:15→23:17): hiện `### KN-063` (Routing) + `### KN-061` (Memora detail) nhưng bảng tóm tắt ghi `KN-062` (Memora) → mismatch nội bộ chưa fix, **chưa commit**.
- Evolib session đã set rule (`.agent/plans/evolib-adopt/proposal.md` §5): không edit/`git add` `knowleged.md`/`auto-learn.mjs`/spec/`curated.json` khi session kia chưa commit → **tôn trọng** (KN-053: file dirty = vùng nguy hiểm).
- **ĐÃ LÀM an toàn (file sạch, policy-check PERMITTED + audit logged):** ✅ `_template/bug.md` thêm `Layer:` + ✅ `fixbug.prompt.md` sync (field list + rule bullet) — commit partial riêng.
- **Blocked P1–P4:** `auto-learn.mjs` + `tests/e2e/auto-learn-guard.spec.ts` + `docs/knowleged.md` (WIP session khác). Patch sẵn §7 — apply mechanical khi tree sạch.
- **Số KN của package:** = max+1 tại paste. Hiện max = KN-063 ⇒ dự kiến **KN-064**. KHÔNG chạm 060–063.

## 1. Framing (KN-052 — tách mechanism vs claim)

| Loại | Nội dung | Quyết định |
|------|----------|-----------|
| **Mechanism (verifiable → adopt)** | (a) Mỗi graded run đọc 2 lần: surviving failures → lesson/curriculum; defects (world/task/verifier hỏng) → repair. (b) World-first cho defect kiểm chứng được. (c) Depth bar + held-out form cho guard. (d) Diversity > volume. (e) Grounded reward = state diff, không appearance. | **Adopt — slim, 4 delta** (§3) |
| **Claim (self-measured → non-gating)** | Toàn bộ số của blog MSR (80→75 shallow, 16.2→38.5 co-evolution, 48→78%...). | Chỉ **corroboration**; không dùng làm gate nội bộ |
| **Evidence chính** | **Bug corpus local** — phần lớn "failure" bắt được nằm ở test/env/đo: severity regex 0/55 (KN-056), zeroRef FP (KN-049), slop scanner (KN-049), hooks PS parse (KN-039), spec pin data (2026-09-13) | Local dẫn dắt, MSR corroborate |

Nguồn có incentive (MSR tự đo, tự công bố) — theo KN-052: lấy mechanism-half. Echoverse release 4/12 worlds + grounded graders (github.com/microsoft/Echoverse) → phần mechanism có artifact kiểm chứng được, phần số liệu thì không (chưa reproduce độc lập).

## 2. Dissent Review (KN-018) — Critic verdict 14/09

- **Verdict:** ADOPT-WITH-CHANGES (8 changes bắt buộc). Delta thật chỉ ~4 điểm, ~60% đã tồn tại rải rác (KN-034/049/056/058 + CMB).
- **Framing đối lập mạnh nhất (critic, ghi nguyên văn — "Who did you think with"):**
  > *"60% KN-061 đã tồn tại rải rác (KN-034/049/056/058 + CMB) — nếu không chỉ được 1 case thật bị các KN cũ bắt hụt, đây là repackaging có tổ chức đúng thứ KN-024/KN-060 cảnh báo; và bằng chứng mạnh nhất cho 'defect thuộc về world' không phải blog MSR mà là chính bug corpus local — hãy để local dẫn dắt, MSR chỉ là corroboration."*
- **Cách xử lý trong package này:**

| # | Critic change | Xử lý |
|---|---------------|-------|
| 1 | Slim KN đúng 4 delta, cross-ref không restate; hoặc amend KN-034 — chốt 1 + 1 dòng lý do | ✅ **KN-0XX slim**; lý do chọn new-KN (không amend KN-034): `guards` audit + RADAR trỏ theo ID riêng; 4 delta tạo loop riêng (co-evolution), amend KN-034 sẽ phình scope "Ecdysis" ngoài pattern diagnost-only (tránh rewrite per KN-060) |
| 2 | `Layer` load-bearing hoặc bỏ test (theater) | ✅ `extractBugMeta` parse `Layer` + `propose` soft-warn + `--json` trả `layer` + behavioral test (spec) |
| 3 | Sửa Guard line (hết oversell) | ✅ "wiring only — attribution đúng = human judgment", soft-warn không hard gate |
| 4 | Ranh giới KN-012 | ✅ Ghi rõ: world-first chỉ cho defect kiểm chứng được; **cấm hạ expectation để đỏ thành xanh**; spec vẫn `deny-test-mutate` |
| 5 | Số liệu: local-first, chốt world count, non-gating | ✅ Evidence CHÍNH = local corpus; MSR = corroboration; 12 built (10 domain + 2 capability), 4 released |
| 6 | Không bypass dup-gate im lặng | ✅ Disclosure ký (owner duyệt trong session này) + backlog sửa phép đo riêng (§6) — **không sửa gate trong proposal này** (self-serving gate edit = smell KN-012) |
| 7 | Expectation đo được (KN-060) | ✅ Declared: wiring = test xanh; value attribution = declared judgment-tool; audit fill-rate `Layer` sau ≥3 bug mới — ~0 thì hạ claim |
| 8 | Sync `fixbug.prompt.md` | ✅ Thêm `Layer` vào field list |

## 3. Đề xuất chốt — 4 items (slim)

- **I1. KN-0XX slim (id chốt tại paste — §0)** — 4 delta: world-first · defect-vs-lesson hygiene · held-out form · diversity>volume. Cross-ref KN-034 (mở rộng 2-tầng → 5-tầng) / KN-049 / KN-056 / KN-058 / CMB / KN-012. Không giảng lại.
- **I2. Layer surface (load-bearing)** — `Layer:` vào Meta template + parse trong `extractBugMeta` + soft-warn ở `propose` (KHÔNG hard gate). Menu: `code | test-spec | env-fixture | measure-verifier | task-spec | process`. Là **suspicion order**, không phải luật.
- **I3. Guard** — behavioral wiring test trong `tests/e2e/auto-learn-guard.spec.ts` (TDD: RED trước): fixture no-Layer → propose warn; có Layer → parse. Nói thẳng đây là wiring test, không chứng minh attribution đúng.
- **I4. Anti-patterns ×2** (deduped với list hiện có) + 1 row Bảng tóm tắt.

**Non-goals:** không sửa dup-gate heuristic (backlog riêng — xem §6); không hard-gate Layer; không đổi RADAR/guard gate; không RL/optimizer (file-based, 0 deps — minimal ladder); curated.json đã có entry Echoverse (14/09) — không đổi.

## 4. KN-0XX draft (ready to paste — owner; id chốt tại paste theo §0)

**Row Bảng tóm tắt:**

```
| KN-0XX | 2026-09-14 | Echoverse (MSR 30/07): test/guard phải tiến hoá cùng capability — check đỏ đọc 2 lần theo tầng; defect ở test/env/đo không được thành bài học; guard cần depth + held-out; diversity > volume | Zero mặc định = lỗi code — thiếu quy tầng + world-first + depth bar cho guard | Check đỏ đọc 2 lần (quy tầng → sửa world trước → chỉ failure sống sót mới thành lesson); guard tiến hoá cùng capability | `process` `verify` `evals` `guard` `self-improving` |
```

**Chi tiết (dán trước `<!-- Thêm bài học mới -->`):**

```md
### KN-0XX — Echoverse co-evolution: check đỏ đọc 2 lần theo tầng (world-first) — defect không thành bài học; guard tiến hoá (held-out · diversity > volume)

- **Ngày:** 2026-09-14
- **Bug report:** `.agent/bugs/2026-09-14-echoverse-co-evolution-check-do-doc-2-lan-world-fi/bug.md`
- **Severity:** major
- **Guard:** `tests/e2e/auto-learn-guard.spec.ts` — behavioral wiring test: `propose` parse `Layer:` + soft-warn khi thiếu. **Nói thẳng: wiring chỉ chứng minh parse/report; attribution ĐÚNG = human judgment (không phải gate chặn). Fill-rate audit sau ≥3 bug mới: ~0 → hạ claim.**
- **Triệu chứng:** Check đỏ bị đọc như tín hiệu một chiều về "code/agent" → fix sai tầng; bài học (KN/anti-pattern) viết từ failure do fixture/spec/đo hỏng = học chính defect; coverage chỉ tăng count → chững/slip (reported: thêm 3.4× trajectories cùng worlds — Online-Mind2Web 40.1%→37.2%); suite xanh nhưng hollow.
- **Nguyên nhân gốc (5 Whys):** Why1: zero không được quy tầng trước khi fix (KN-034 mới tách model-vs-harness 2 tầng; thiếu env/measure/task-spec). Why2: thiếu quy tắc "defect không được thành lesson" — failure do world hỏng lọt vào curriculum/bài học. Why3: thiếu world-first — sửa fixture/spec/đo TRƯỚC rồi re-run (Echoverse: most defects belong to the world; EchoStay control bug → completable 48%→78%; EchoChat verifier drift → gradable 34%→99% — reported). Why4: guard thiếu quality bar depth/held-out → shallow nuôi reflex sai (reported: shallow-train 80.0→75.0 vs deep →85.0; "learned a rule, not a layout" khi gain giữ trên form chưa từng sửa). Why5 (Root): thiếu co-evolution loop — environment/test/verifier phải tiến hoá cùng capability (KN-056 phủ phần nâng-lưới-khi-tái-lập; phần còn thiếu: diversity [cảnh mới ở vùng lạnh] > volume [instance cùng vùng]).
- **Cách sửa:** Adopt 4 delta (mechanism-half — KN-052/059), không restate KN-034/049/056/058: (1) `Layer:` trong bug.md (suspicion order: code · test-spec · env-fixture · measure-verifier · task-spec · process) + `propose` parse/soft-warn; (2) world-first cho defect kiểm chứng được + boundary KN-012; (3) held-out form / negative control là điều kiện của guard mới; (4) mở rộng coverage bằng cảnh mới ở vùng lạnh (CMB) trước khi thêm instance cùng vùng.
- **Cách phòng tránh:**
  - Trước khi fix check đỏ → trả lời tầng lỗi (code · test-spec · env-fixture · measure-verifier · task-spec); không trả lời được → điều tra, không fix (Root Cause Gate).
  - Nghi fixture/spec/đo hỏng → sửa world TRƯỚC + re-run; chỉ failure sống sót cả stack mới viết KN/anti-pattern/bug lesson.
  - **Ranh giới KN-012:** world-first KHÔNG được dùng để nới spec/xoá assertion — spec/test vẫn immutable (deny-test-mutate; amend chỉ bởi verify actor). Cấm hạ expectation để đỏ thành xanh.
  - Guard mới: assert outcome/state (không appearance) + held-out form hoặc negative control (KN-049) — shallow guard phản tác dụng, không phải "an toàn hơn".
  - `Layer:` là gợi ý nghi vấn, không phải luật — attribution cuối = judgment người.
  - Số liệu nguồn self-measured → chỉ corroboration; evidence chính = bug corpus local.
- **Dẫn chứng (local-first):** local: severity regex 0/55 (KN-056), zeroRef shorthand FP (KN-049), slop scanner dòng/CRLF (KN-049), hooks PS parse (KN-039), spec pin data (2026-09-13). Corroboration: MSR Echoverse 30/07/2026 (12 worlds built — 10 domain + 2 capability; 4 released + grounded graders) — mọi số non-gating.
- **Tags:** `process` `verify` `evals` `guard` `self-improving`
- **Người ghi:** YUNIE / article-lesson — Critic dissent gated 14/09 (ADOPT-WITH-CHANGES, 8/8 changes áp dụng); dup-gate flag KN-033(39.2) — adjudicated not-dup (RSI roadmap ≠ co-evolution/attribution), disclosure bypass có chủ đích (owner duyệt trong session); backlog: sửa heuristic false-positive inflation bằng proposal riêng.
```

**Anti-patterns (thêm vào `## Anti-patterns tích lũy`):**

```md
- ❌ Đọc mọi check đỏ là "code sai" — quy tầng trước (code · test-spec · env-fixture · measure-verifier · task-spec); defect ở world sửa TRƯỚC, chỉ failure sống sót mới thành bài học (KN-0XX + KN-034 + KN-049).
- ❌ Viết KN/anti-pattern/bug lesson từ failure do fixture/spec/đo hỏng — sửa world trước; "world-first" KHÔNG được hạ expectation để đỏ thành xanh (deny-test-mutate giữ nguyên) (KN-0XX + KN-012).
```

## 5. Apply checklist (thứ tự — bounded, TDD)

1. [ ] Spec: viết test behavioral RED trước (propose chưa parse Layer → fail)
2. [ ] `auto-learn.mjs`: `extractBugMeta` parse `Layer` + `propose` soft-warn + `--json` trả `layer` → spec GREEN
3. [ ] `.agent/bugs/_template/bug.md`: thêm `- **Layer:**` (menu + 1 dòng suspicion-order)
4. [ ] `.github/prompts/fixbug.prompt.md`: thêm `Layer` vào field list
5. [ ] `docs/knowleged.md`: paste KN-0XX + 2 anti-patterns + row Bảng tóm tắt (id = next free TẠI THỜI ĐIỂM PASTE — sau khi session song song commit/resolve; chạy lại `propose` để lấy nextId)
6. [ ] Verify: `npx playwright test tests/e2e/auto-learn-guard.spec.ts` + `guards --json` (KN-0XX có guard) + `get_errors` toàn scope
7. [ ] `evaluate --bug ...` → dự kiến vẫn FAIL dup (KN-033) — **disclosure ký, không sửa gate ở đây**
8. [ ] Bug.md: Status → `fixed` + paste verify output + commit fix hash
9. [ ] Commit: bug.md + knowleged.md + auto-learn.mjs + template + spec + fixbug.prompt (+ `.claude/` export nếu harness-manager yêu cầu)

## 6. Open questions (owner chốt) + Backlog

- **Q1 (chính):** Duyệt adopt cả package (I1–I4 + fixbug sync)? Hay chỉ muốn read-out + giữ KN draft?
- **Backlog (không làm trong proposal này):**
  - Dup-gate heuristic false-positive inflation: mỗi KN `process`/`self-improving` mới làm tăng điểm BM25 của các bài article-lesson sau (KN-056 đã 113.9; KN-060 bypass lần 1, bài này lần 2). Fix = proposal riêng đụng `evaluate`/`decideEvalGate` + test — tránh sửa gate trong lúc gate đang chặn chính mình (self-serving).
  - Audit fill-rate `Layer` sau ≥3 bug mới (expectation đo được — KN-060 discipline).
  - `status`/mirrors refresh sau adopt (S/scale/heatmap) theo `npm run cosmos:refresh` nếu cần.

## 7. Pending patches — apply khi tree sạch (collision-safe, mechanical)

> **Điều kiện tiên quyết:** `docs/knowleged.md` + `auto-learn.mjs` + `tests/e2e/auto-learn-guard.spec.ts` không còn dirty (session Routing/Memora đã commit + fix số). **Đã xong trước:** template `Layer:` + `fixbug.prompt.md` sync (commit partial — không làm lại).
> **Số KN:** chốt **KN-064** tại paste 23:3x (đã re-check ngay trước paste: max = KN-063; gap 061) ✓

### P1. `tests/e2e/auto-learn-guard.spec.ts` — RED trước (TDD)

```ts
test('guard co-evolution: propose parse Layer + soft-warn khi thiếu (behavioral wiring, không hard gate)', () => {
  const dir = tmpdir('layer');
  writeFixture(dir, 'with-layer', fixtureBug('with-layer', '- **Layer:** env-fixture\n'));
  writeFixture(dir, 'no-layer', fixtureBug('no-layer'));

  const r1 = run(['propose', '--bug', 'with-layer', '--dir', dir, '--json']);
  expect(r1.status, r1.stderr).toBe(0);
  const d1 = JSON.parse(r1.stdout);
  expect(d1.layer?.present, 'Layer: env-fixture phải được parse (load-bearing, không theater)').toBe(true);
  expect(d1.layer.raw).toContain('env-fixture');
  expect(d1.layerWarning).toBeNull();
  expect(d1.draft, 'KN draft phải mang Layer line').toContain('**Layer:**');

  const r2 = run(['propose', '--bug', 'no-layer', '--dir', dir, '--json']);
  expect(r2.status).toBe(0);
  const d2 = JSON.parse(r2.stdout);
  expect(d2.layer?.present).toBe(false);
  expect(d2.layerWarning, 'thiếu Layer → soft-warn (không im lặng, không chặn)').toBeTruthy();
});
```

### P2. `.github/harness/scripts/auto-learn.mjs` — GREEN (4 block nhỏ, verify anchor lúc apply)

```js
// Block A — sau normalizeGuard():
// Layer (co-evolution, Echoverse): tầng chứa defect — suspicion order; defect ở world sửa TRƯỚC.
function normalizeLayer(raw) {
  const v = (raw || '').replace(/`/g, '').trim();
  if (!v) return { present: false, raw: '' };
  const low = v.toLowerCase();
  if (/^(—|–|-|n\/a|none|chưa|todo|<)/.test(low) || low.includes('chưa điền') || low.includes('chưa có')) return { present: false, raw: v };
  return { present: true, raw: v };
}

// Block B — extractBugMeta, trước return:
  const layer = normalizeLayer(firstMatch(bugText, [/\*\*Layer:\*\*\s*([^\n]+)/, /^\s*Layer:\s*([^\n]+)/m]));
  return { title, severity, tags, root, fix, guard, layer };

// Block C — buildKnDraft: thêm param + line trong template string
//   layerText = '—' (param) và `- **Layer:** ${layerText}` ngay sau dòng Guard

// Block D — propose():
  const { title, severity, tags, root, fix, guard, layer } = extractBugMeta(bugText, bugSlug);
  const layerWarning = layer.present ? null : 'Thiếu Layer — quy tầng trước khi fix (code · test-spec · env-fixture · measure-verifier · task-spec): defect ở test/env/đo → sửa world TRƯỚC; chỉ failure sống sót mới thành bài học (soft-warn, không chặn).';
  const draft = buildKnDraft({ nextId, title, severity, root, fix, tags, today, bugSlug, author: 'YUNIE / auto-learn propose', guardText, layerText: layer.present ? layer.raw : '— (chưa điền trong bug.md)' });
  // --json branch: thêm `layer, layerWarning` vào JSON.stringify(...)
  // non-json, sau printGuardGate(...): if (layerWarning) console.log(`\n💡 LAYER (soft): ${layerWarning}`);
```

### P3. `docs/knowleged.md` — paste §4 blocks

- Row Bảng tóm tắt + Chi tiết + 2 anti-patterns (§4) — đổi `KN-0XX` → id chốt (dự kiến `KN-064`).
- Cập nhật `UpdatedAt` cuối file.

### P4. Verify + close

1. `npx playwright test tests/e2e/auto-learn-guard.spec.ts` → PASS.
2. `node .github/harness/scripts/auto-learn.mjs guards --json` → KN-mới có guard.
3. `get_errors` toàn scope → 0.
4. `harness-manager.mjs export-claude` (fixbug.prompt → `.claude/commands`) — CHỈ chạy khi mọi instructions hết dirty kẻo sweep WIP.
5. bug.md: Status `fixed` + paste verify output + commit hash; commit theo file (bug + knowleged + script + spec).
