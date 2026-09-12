# Design — auto-learn-split

> Refactor cấu trúc, **không UI**. Design = sơ đồ tách hàm + hợp đồng bất biến.

## Sơ đồ tách `watchdog()` (CC40 → helpers ≤12 CC)

```
watchdog(opts)
├─ parseWatchdogOpts(opts)            → {asJson, apply, dir, journal, nowMs, escalateDays, evaporateDays, outPath}
├─ scanHawkingBugs(dir, nowMs, esc, eva) → {bugs(sort), closed}
├─ hawkingCounts(bugs, closed)        → counts
├─ [apply] refuseHawkingSignoff(sig, bugs)   → dry-run + exit 2 (fail-closed)
├─ [apply] applyHawking(...)          → entries[]
│   ├─ readHawkingJournal(journal)    → Map lastBySlug
│   ├─ applyHawkingEntry(b, ctx)      → append journal (idempotent) — guard clause
│   └─ evaporateBug(dir, b, ...)      → hawking.md note + Status flip
├─ writeWatchdogOutput(result, outPath)      → --out
└─ printWatchdogHuman(result, entries)       → stdout (verbose path)
```

**Bất biến (giữ nguyên 100%, kể cả quirk):**
- `asJson || outPath` → in JSON + return (KHÔNG in human) — giữ nguyên nhánh quirk cũ.
- Refused path exit 2 + dry-run format từng dòng.
- Journal idempotent: chỉ ghi khi action ĐỔI; kèm `signedBy`.
- `evaporate` → note Hawking + đổi đúng 1 dòng `Status: open` → `evaporated`.

## Sơ đồ tách `main()` (CC45 → dispatch)

```
main()
├─ parseArgs(process.argv)            (giữ nguyên)
├─ [no cmd|help|-h] printHelp()       → extract nguyên khối template
└─ try { dispatch(cmd, query, opts) } catch { exit 1 }
     ├─ guard: suggest|search (thiếu query → exit 1) · get (thiếu --bug → exit 1) · stats thiếu --heatmap → exit 1
     └─ handler map: log/propose/attest/status/watchdog/stats/record/report/evaluate/commit/history/versions
        └─ unknown → "❌ Lệnh không biết: …" exit 1
```

**Bất biến:** đủ 14 command cũ · message lỗi verbatim · exit codes verbatim · thứ tự guard trước map.

## Palette / Layout

N/A — không đổi UI. Design tokens không áp dụng.
