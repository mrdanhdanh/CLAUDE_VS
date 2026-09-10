> 🤖 Auto-log bởi auto-learn.mjs — 2026-09-10
> **Error:** `Cosmos observatory fetch 404 trên GitHub Pages: fetch('../../.agent/audit.jsonl') trỏ ra ngoài www/ (Pages chỉ deploy www/) + fetch('./x') phân giải sai khi URL không có slash cuối (serve redirect /cosmos/index.html → /cosmos) → fallback demo + console đỏ`
> **File:** `www/cosmos/index.html`
> **Title:** observatory-fetch-404-ngoai-www-va-relative-url

# Bug: observatory-fetch-404-ngoai-www-va-relative-url

## Meta

- **Slug:** `2026-09-10-observatory-fetch-404-ngoai-www-va-relative-url`
- **Ngày:** 2026-09-10
- **Severity:** `major`
- **Reporter:** sếp (console trên trang Pages: `GET https://mrdanhdanh.github.io/.agent/audit.jsonl 404`)
- **Related KN:** `KN-030`
- **Tags:** `data` `pages` `fetch` `url` `verify`
- **Status:** `fixed`

---

## 1. Reproduce

### Steps
1. Mở trang cosmos đã deploy: `https://mrdanhdanh.github.io/CLAUDE_VS/cosmos/...` (mở Console).
2. Quan sát Network/Console.

### Expected vs Actual
- **Expected:** Observator "Event Horizon" hiện chuỗi audit THẬT (`✅ Chain OK — dữ liệu thật`).
- **Actual:** `GET .../.agent/audit.jsonl 404` — trang rơi về demo (`✅ Chain OK — demo`); card "Nón ánh sáng" bấm vào cũng 404. Dark Energy cũng `⚠️ demo (fetch fail)` khi host bằng `npx serve` local (URL bị redirect mất slash cuối).

### Evidence
- Console user report: `index.html:2878 GET https://mrdanhdanh.github.io/.agent/audit.jsonl 404 (Not Found)`
- Repro test (RED trước fix): `.agent/plans/cosmos-observatory/verify/` — badge "demo".
- Server log serve: `GET /cosmos → 200` rồi `GET /audit.json → 404` (fetch phân giải sai base).

### Environment
- GitHub Pages (project site: `mrdanhdanh.github.io/CLAUDE_VS/`) + local `npx serve www`.

---

## 2. Root Cause (5 Whys)

- **File:Line:** `www/cosmos/index.html` — `loadAudit()` (`fetch('../../.agent/audit.jsonl')`) + 3 chỗ `fetch('./scale.json')`.
- **Why 1:** Fetch trả 404 → observator không có data thật.
- **Why 2 (Pages):** `.agent/` không nằm trong `www/` — Pages chỉ deploy `www/`; từ `/CLAUDE_VS/cosmos/`, `../../` leo lên root host → `/.agent/audit.jsonl` không tồn tại.
- **Why 3 (local serve):** `fetch('./x')` phân giải theo document URL; khi URL là `/cosmos` (không slash cuối — `serve` redirect `/cosmos/index.html` → `/cosmos/index` → `/cosmos`), đoạn cuối bị coi là FILE → `'./x'` → `/x` → 404.
- **Why 4:** Code giả định URL luôn kết thúc bằng `/` hoặc `.html` — đúng trên Pages nhưng sai khi redirect bỏ slash; và giả định `.agent/` truy cập được từ web root.
- **Why 5 (Root):** Trang web tĩnh không được phép giả định **vị trí file ngoài deploy root** hay **hình dạng URL** — mọi tài nguyên phải nằm trong `www/` và URL phân giải phải robust với mọi dạng path.

- **Impact:** 100% lượt xem observator trên Pages + local serve: luôn demo, không bao giờ thật; console đỏ gây hiểu nhầm "trang lỗi".
- **Confidence:** `HIGH` (reproduced qua Playwright + server log; fix verified bằng spec mới + 2 badge "thật").

---

## 3. Fix

- **Approach:** (1) `generate-status.mjs` xuất mirror công khai `www/cosmos/audit.json` (50 events tail) — theo đúng pattern `scale.json` đã có; (2) helper `dirBase(pathname)` toàn cục — robust cả `/cosmos/`, `/cosmos`, `/cosmos/index.html`; (3) đổi cả 4 fetch site (audit + 3 scale) sang `dirBase(location.pathname)+'file.json'`; (4) card link "Nón ánh sáng" → `./audit.json`.
- **Files Changed:**
  - `.github/harness/scripts/generate-status.mjs` — sinh `www/cosmos/audit.json` (mirror)
  - `www/cosmos/index.html` — `dirBase()` + 4 fetch sites + card link
  - `tests/e2e/cosmos-observatory.spec.ts` — spec mới (RED→GREEN): badge "thật" x2, mirror 200, không 404 `.agent`
- **Diff tóm tắt:**
```diff
- const res=await fetch('../../.agent/audit.jsonl',{cache:'no-store'});
+ const res=await fetch(dirBase(location.pathname)+'audit.json',{cache:'no-store'});
+ function dirBase(p){ if(p.endsWith('/')) return p; const last=p.slice(p.lastIndexOf('/')+1); return last.includes('.') ? p.slice(0,p.lastIndexOf('/')+1) : p+'/'; }
```
- **Non-Goals:** Không đổi nội dung audit; không fix `scale.html` (trang riêng, hoạt động trên Pages — ghi chú follow-up).
- **Fix Confidence:** `HIGH`

---

## 4. Verification

- **Reproduce again:** Test "observatory đọc audit.json thật — không 404 ra ngoài www/" — RED trước fix (badge "demo"), GREEN sau fix.
- **Regression:** `npx playwright test cosmos-observatory.spec.ts cosmos-intro.spec.ts` → **10/10 pass**.
- **Assert chống tái phát:** không response 404 nào chứa `.agent`; mirror `/cosmos/audit.json` + `/cosmos/scale.json` phải 200; badge phải chứa "thật".
- **Visual:** `observatory-real-chain.png` — "✅ Chain OK — dữ liệu thật" + "✅ scale.json — thật" với events thật (git push, ai-news fetch).

---

## 5. Learn

- **Bài học:** Trang static chỉ được fetch tài nguyên **trong deploy root** (`www/`) — cái gì ngoài đó phải **mirror** vào (generate từ source, commit như `scale.json`). Và URL phân giải phải robust với **mọi hình dạng URL** (có/không slash cuối, có/không .html) — helper `dirBase` là mẫu chuẩn.
- **KN đề xuất:** `KN-030`.
- **Anti-pattern:** Fetch `../` ra ngoài deploy root; fetch relative không tính redirect bỏ slash; tin "trên Pages chạy được" mà không test host khác.
