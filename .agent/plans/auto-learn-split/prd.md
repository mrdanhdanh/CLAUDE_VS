# PRD — auto-learn-split

> Refactor thuần (behavior-preserving) trả nợ KN-047 lộ ra sau khi fix slop-check (KN-049): `auto-learn.mjs` có `watchdog()` 107 dòng/CC40 và `main()` 87 dòng/CC45 — vượt ngưỡng slop (≤80 dòng / CC ≤12).

**Who did you think with?:** Critic framing (đối lập): "auto-learn.mjs là script 1200+ dòng — tách 2 hàm có phải là tô son bề mặt, phần còn lại (evaluateCandidate CC41, status CC30, parseArgs CC16) vẫn mục?" — Quyết định: đúng, đây KHÔNG phải dọn sạch toàn bộ — chọn 2 hàm đội sổ nhất (watchdog + main là entry/exit critical path, hay sửa nhất), verify bằng hash-equivalence (không tin mắt), phần còn lại ghi backlog có số. Refactor trong khi tool đo vừa được sửa = thời điểm vàng (đo đúng mới trả đúng).

## Problem

- `watchdog()` CC40 + 107 dòng — Hawking mutation path (human sign-off gate) khó audit từng nhánh.
- `main()` CC45 + 87 dòng (help inline + if/else chain 14 nhánh) — thêm command mới phải sửa chuỗi if/else, dễ rơi nhánh.

## Scope

- **In:** tách helper cho `watchdog()` (scan/counts/dry-run/apply/print) + dispatch map cho `main()` + extract `printHelp()`. 1 file production: `.github/harness/scripts/auto-learn.mjs`.
- **Out (backlog có số — không phải lần này):** `evaluateCandidate` CC41 · `commitCandidate` CC29 · `status` CC30 · `parseArgs` CC16 · dup 10 dòng ×2 (361↔639).

## YAGNI / CẮT (minimal-ladder)

- ❌ Không tách module mới / không đổi API CLI / không đổi output format.
- ❌ Không thêm dep, không viết checker mới (reuse `slop-check.mjs`).
- ❌ Không refactor lan sang 4 hàm backlog — bounded theo precedent `cosmos-scale-split`.

## Acceptance (P0)

- P0-1: watchdog + main ≤80 dòng & CC ≤12 (slop-check sạch cho 2 hàm này; findings khác giữ nguyên hoặc giảm).
- P0-2: Output **hash-identical** (stdout/stderr/exit code + file `--out`) trên 10 case trước/sau — normalize timestamp.
- P0-3: Full e2e suite xanh (spec `cosmos-hawking` + `cosmos-cmb` + `status` là khoá behavior).
- P0-4: `get_errors` 0 · audit chain OK.

**Cosmic-Quantum:** Macro `auto-learn.mjs` là SDSS của vũ trụ Harness — đo đúng rồi mới phân loại được ✅ · Micro 2 hàm collapse về helpers ≤12 CC, giữ nguyên 100% observable behavior · Entanglement: `tests/e2e/cosmos-hawking.spec.ts`, `tests/e2e/cosmos-cmb.spec.ts`, `scripts/slop-check.mjs`, `package.json`.
