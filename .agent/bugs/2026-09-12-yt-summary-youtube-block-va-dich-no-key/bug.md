# Bug: YT Summary — mọi lane trích transcript no-key bị chặn + dịch vi fail hàng loạt

## Meta

- **Slug:** `2026-09-12-yt-summary-youtube-block-va-dich-no-key`
- **Ngày:** 2026-09-12
- **Severity:** `major`
- **Reporter:** user (yêu cầu feature) / YUNIE
- **Related KN:** `KN-041`
- **Tags:** `api` `data` `ci` `network` `i18n`
- **Status:** `fixed` (đổi kiến trúc theo reality đo được)

---

## 1. Reproduce

### Steps
1. `node scripts/yt-summary/build.mjs --url "https://youtu.be/aircAruvnKk"` (lane yt-dlp không cookie) → ❌ bot-check.
2. `python -m ytdlp --cookies-from-browser edge …` → ❌ DB locked; `--cookies-from-browser chrome` → ❌ DPAPI.
3. Probe Invidious ×6 + Piped + youtube-transcript-api + scrape watch-page → ❌ toàn bộ.
4. Build seed với dịch: gtx 429 retry nặng (14.5s/chunk), gtx2 bị "empty", mymemory fail 20 chunks.

### Expected vs Actual
- **Expected:** lấy transcript + dịch vi qua no-key pipelines; CI chạy được.
- **Actual:** mọi lane server-side bị YouTube chặn từ IP này; translator có nhưng lỗi parse/quota/circuit.

### Evidence
- `.agent/plans/yt-summary/verify/probe-net.log`, `probe-relay.log`, `probe-cors.log`, `probe-translators.log`, `probe-ytapi.py`.
- Log build: `gtx2 0 · mymemory 15 · fail 20`; sau fix: `gtx2 16 · fail 0`.

### Environment
- OS: Windows · Node 22 · Python 3.13 (yt-dlp 2026.08.19) · 2026-09-12.

---

## 2. Root Cause (5 Whys)

- Why1: YouTube trả **429 / "Sign in to confirm you're not a bot" / IpBlocked** cho mọi request server-side không cookie từ IP này (và dự kiến cả IP datacenter CI).
- Why2: Các relay công khai (Invidious 6 instance + Piped) **đã chết toàn bộ** (0/6, 403/HTML) — hướng "free no-key public relay" năm 2026 không còn đáng tin.
- Why3: Translator: gtx (`translate.googleapis.com`) bị **throttle theo IP** (429 burst) và **không CORS** (không dùng được trong browser); MyMemory có **quota ẩn danh ~5.000 ký tự/ngày/IP** (hết sau ~2 video); clients5 (`clients5.google.com`) sống nhưng **response shape khác** (`[["text","en"]]` — cặp string).
- Why4: Parser viết cho 1 shape (gtx nested pairs) → với clients5 trả `''` → bị coi là "empty" → **trip circuit breaker chung** (lúc đó dùng chung state cho cả 2 host) → mọi chunk sau skip luôn clients5 dù nó sống.
- Why5 (Root): **Thiết kế dựa trên giả định "scrape free dễ" thay vì đo trước**; không tách circuit theo host; không có lane nào "guaranteed 100%" không phụ thuộc network.

---

## 3. Fix

- Kiến trúc 3 lane: **(1) browser paste .vtt — guaranteed, xử lý tại chỗ + dịch MyMemory (CORS ✓); (2) CLI yt-dlp với cookies.txt/cookies browser — chạy chắc khi có cookie; (3) CI best-effort + secret `YT_COOKIES`**.
- Translator chain `gtx → clients5 → mymemory` với **circuit breaker theo host** (trip 2 phút → 15 phút), **fail-fast khi quota MyMemory hết**, **parser đa hình** (walk đệ quy mọi shape), chunk 900 ký tự an toàn URL.
- Cleaning: **sponsor-region detection** (từ marker → return marker, cap 90s) — lược cả block quảng cáo thay vì từng câu.
- UI nói thật: chip provider + cảnh báo partial; help section ghi rõ bằng chứng chặn + 3 cách chạy.

## 4. Prevention

- **Reality check trước khi thiết kế** (probe scripts trong `.agent/plans/<task>/verify/`).
- Circuit breaker **luôn theo host**; parser đa hình cho API ngoài; quota → fail-fast + ghi rõ reset time.
- Luôn có 1 lane **không phụ thuộc network bên thứ ba** (file input).
- Ghi lại các lane đã đo chết (Invidious/Piped/youtube-transcript-api) để không thử lại vô ích.

## 5. Links
- PRD: `.agent/plans/yt-summary/prd.md` (§3b Realitiy check · §12 tích hợp cộng đồng)
- KN: `docs/knowleged.md` KN-041
