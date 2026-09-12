# Design — Refactor cấu trúc cosmic-scale.mjs

## Nguyên tắc

1. **Behavior-preserving tuyệt đối:** không đổi 1 byte output (JSON + human), không đổi exit codes, không đổi thứ tự side effects (registry read fail → exit 1 trước mọi thứ; write `--out` trước print; cổng budget/trend sau print).
2. **Mỗi hàm 1 mối quan tâm**, tên theo phase đo; comment đánh số gốc giữ nguyên ("// 1. mismatch…", "// 1b. dark matter…").
3. Không đổi constants module-level (`ROOT`/`REGISTRY_PATH`/`TYPE_DEFS`/`KEY_OF`/`pathsFor`).
4. `main().catch(e => { console.error(e); process.exit(1); })` giữ nguyên — lỗi async vẫn fail-loud.

## Cấu trúc mới (16 helper + main)

| Hàm | Nguồn (trong main() cũ) | Trả về / tác dụng |
|-----|-------------------------|-------------------|
| `parseArgs` | args parse prologue | `{asJson, outPath, budget, trendRequested, trendN}` |
| `scanRegistry` | block //1 | `{mismatches, missing, disabled}` |
| `scanOrphans` | block //1b | `{orphans, darkMatter, dmLevel, dmAdvice}` |
| `scanBugDrafts` | block //2a | `{drafts, bugsTotal}` |
| `scanKnowledge` | block //2b | `knTotal` (số) |
| `scanAudit` | block //3 | `{refused, failed, auditTotal}` |
| `buildBlackHoles` | block //4 | `blackHoles[]` |
| `measurePlans` | block //5a | `{plansTotal, plansWithDissent, plansWithCut}` |
| `energyMetrics` | block //5b (D + G + advice) | `{dissentRatio, darkEnergy, cutRatio, gravity, gLevel, gAdvice, deAdvice}` |
| `entropyOf` | block //6 | `{S, level, advice}` |
| `checkPolicy` | policy try/catch | `{ok:true}` / `{ok:false, error}` |
| `readHistory` | block //7a | `history[]` (slice −29) hoặc `[]` |
| `computeTrend` | block //7b | `{window, trend:{increases,needed,gate,window}}` |
| `writeOutput` | block write | ghi `--out` (mkdir + write) |
| `printHuman` | block `else { console.log… }` | in báo cáo người đọc |
| `runGates` | 2 cổng cuối (budget + trend) | `exit 1` khi cổng nổ |

`main()` mới: parse → load registry → gọi 16 hàm theo đúng thứ tự cũ → assemble `result` → `runGates`.

## Dead code dẹp được (chứng minh)

`policy: (() => { try { return { ok: true }; } catch { return { ok: false }; } })()` — IIFE không bao giờ throw (luôn `{ok:true}`) và luôn bị ghi đè ngay sau bằng `try { JSON.parse(POLICY_PATH) }` thật → thay bằng `policy: await checkPolicy()`. **Giá trị cuối cùng không đổi** (đã có hash diff chứng minh).

## Rủi ro & khóa hành vi

| Rủi ro | Khóa |
|--------|------|
| Dịch chuyển code sai thứ tự / điều kiện | sha256 normalized JSON + human byte + written file before/after |
| Quên nhánh (budget/trend gate exit 1) | 8 spec CLI (cosmos-escape.spec.ts) — assert exit code + stderr text |
| Vỡ render phía UI (đọc scale.json) | Full suite 101 (cosmos-freshness + web + hawking specs đọc scale.json/graph) |
| Slop mới (hàm mới quá to) | slop-check after = 0 findings + xem lại từng hàm ≤80/CC ≤12 |

## Evidence plan (`verify/`)

`slop-before.txt` · `slop-after.txt` · `out-before.json` · `out-after.json` · `human-before.txt` · `human-after.txt` · `written-before.json` · `written-after.json` · `exit-before.json` · `output-identical.txt` (hash + verdict 3 lớp so sánh).
