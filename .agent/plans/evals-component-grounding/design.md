# Design — Component evals registry + Grounding grader (mini)

## 1. Component evals (KN-072/KN-037)
- **Data:** `.github/harness/evals/components.json` — mỗi entry = 1 mắt xích:
  ```json
  { "id": "policy-deny-first", "name": "policy-check — deny trước allow",
    "ref": "KN-012", "claim": "rm -rf / bị REFUSED, fail-closed",
    "cmd": "node .agent/scripts/policy-check.mjs --tool shell --target \"rm -rf /\"",
    "expect": { "exit": 1, "stdout": "REFUSED (deny-rm-rf-root)" } }
  ```
- **Logic:** `checkComponents()` trong `eval-gate.mjs` → chạy từng `cmd` (execSync, cwd=ROOT), so `exit` + `stdout.includes()`.
- **Nguyên tắc:** expectations = **số đo thật** (đo 2026-09-22), không đoán; 1 check / 1 component để lỗi định vị được.
- **Fail-closed:** registry thiếu/hỏng → check FAIL (không skip im lặng).
- **Scope:** `--scope components` | nằm trong `--scope all` (generate-status đã gọi `--scope all`).

## 2. Grounding fact-grader (Opus 5.5 pattern)
- **CLI:** `node .github/harness/scripts/eval-gate.mjs --scope grounding --content <f> --sources "a,b,c" [--min-claims N] [--warn] [--allow-empty] [--json]`
- **Claims:** number tokens (`/(?<!\w)\d[\d.,]*(?!\w)/`, kèm unit `%`/`K/M/B` expand) + quotes (`"…"`, `“…”`, `«…»`, `'…'` guarded khỏi apostrophe).
- **Chuẩn hoá:** thousands `1,846/1.846 → 1846`; decimal comma `68,83 → 68.83`; quote = lowercase + gộp whitespace; so bằng substring/set (deterministic, offline).
- **JSON content:** parse → walk string values (claims không có line number); lỗi parse → exit 2.
- **Kết quả:** PASS (exit 0) · unverified ≥1 (exit 1, list claim + line) · error/fail-closed (exit 2: thiếu content/sources, parse lỗi, claims < min-claims).
- **Sources:** file hoặc dir (recurse, allowlist đuôi text). Raw text read — không parse.
- **Giới hạn (disclose):** so NUMBER-only, không so đơn vị; số tính toán (derived) sẽ bị flag — đúng chủ đích "invented = fail", dùng `--warn` khi muốn advisory.

## 3. Guard spec (KN-056)
`tests/e2e/eval-gate-components.spec.ts` — fixtures tmp (như slop-check.spec):
1. registry: mọi component pass qua runner thật (`--json` parse).
2. grounding PASS: variants khớp (`$1,846`↔`1846`, quote khác case/whitespace).
3. grounding FAIL: số bịa + quote bịa → exit 1 + liệt kê.
4. fail-closed: thiếu content/sources/claims thấp → exit 2; `--allow-empty` → 0.

## 4. Tích hợp
- `generate-status.mjs`: label gate update (`+ component-evals`).
- `package.json`: `"evals:components"` chạy nhanh 1 lệnh.
- Skill `evals-gate`: §2 component → trỏ mechanism; thêm § Grounding grader; checklist +2 mục.
