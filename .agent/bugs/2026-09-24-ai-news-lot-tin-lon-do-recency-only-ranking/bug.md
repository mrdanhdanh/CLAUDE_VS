# Bug: ai-news lọt tin lớn do recency-only ranking

> Entry gốc auto-log bởi auto-learn.mjs 2026-09-24T14:38:40Z; điền đầy đủ sau khi fix trong cùng session.

## Meta

- **Slug:** `2026-09-24-ai-news-lot-tin-lon-do-recency-only-ranking`
- **Ngày:** 2026-09-24
- **Severity:** `major` (mặt tiền sản phẩm — feed mất tin lớn nhất tuần, không ai biết cho tới khi tra tay)
- **Detection:** `manual` (phát hiện khi user hỏi "lấy tin AI mới nhất" — tra HN Algolia tay thấy story 718 pts không có trong feed)
- **Layer:** `code` (logic chọn tin trong `www/ai-news/fetch.mjs`)
- **Reporter:** YUNIE (phát hiện) / @user (bối cảnh task)
- **Related KN:** KN-076 (propose — chờ merge)
- **Tags:** `data` `api` `verification` `content-drift`
- **Guard:** `tests/e2e/ai-news-feed-ranking.spec.ts` (cap 5/ngày + sourceUrl hợp lệ)
- **Status:** `fixed`

---

## 1. Reproduce

### Steps
1. `node www/ai-news/fetch.mjs --days 7`
2. Kiểm tra feed: `node -e "const j=require('./www/ai-news/ai-news.json'); console.log(j.articles.some(a=>/CRISPR/.test(a.title)))"`
3. So với HN Algolia top-by-points: `https://hn.algolia.com/api/v1/search?tags=story&numericFilters=points>150&hitsPerPage=60`

### Expected vs Actual
- **Expected:** story "Claude discovers a novel enzyme system with CRISPR-like repeats" (**718 pts**, top story HN 23–24/09, 724 comments) nằm trong feed.
- **Actual:** không có trong 15 slot — feed toàn tin 09-24 (2–4 điểm) + HackerNoon.

### Evidence
```
[HN-top] got 24/60 AI-relevant stories (>= 150 pts)   ← story CÓ trong kết quả fetch
ART trong feed? false                                  ← nhưng KHÔNG vào 15 slot cuối
API check: {"id":"49820134","title":"Claude discovers a novel enzyme...","pts":718}
```

### Environment
- Branch: `main` · Commit trước fix: `dc55cbc`
- Node v22, Windows 11

---

## 2. Root Cause (5 Whys)

- **File:Line:** `www/ai-news/fetch.mjs` — `fetchHN()` (query text) + khối sort/`slice(0,15)` trong `main()`
- **Why 1:** Story 718 pts không xuất hiện trong 15 bài cuối?
- **Why 2:** 15 slot bị lấp bởi ~18 tin ngày 09-24, trong đó nhiều tin 2–4 điểm; story thuộc ngày 09-23.
- **Why 3:** Sort chính là `new Date(b.date) - new Date(a.date)` — date-desc thuần, ngày mới hơn thắng bất kể điểm/độ lớn.
- **Why 4:** Nguồn duy nhất bắt được story này trước đây là `fetchHN` query text `"AI"` — nhưng title "Claude discovers a novel enzyme system with CRISPR-like repeats" **không chứa chữ "AI"** → không bao giờ vào pool.
- **Why 5 (Root):** Feed không có (a) nguồn top-by-points độc lập với keyword, và (b) không có cơ chế chống "một ngày lũ tin đè hết slot" — recency-only ranking + single keyword source = tin lớn vô hình.

- **Impact:** Mất tín hiệu quan trọng nhất tuần trên mặt tiền sản phẩm (feed công khai + widget cho clip/curated đọc). Bug âm thầm — không throw, không test đỏ.
- **Hypothesis:** ban đầu nghi "query search không đủ" → đúng, nhưng chưa đủ; sau khi thêm `fetchHNTop` vẫn lọt ⇒ tìm ra nguyên nhân thứ 2 (slot flood) — verify bằng đo trực tiếp 2 lần fetch.
- **Confidence:** `HIGH` (reproduce bằng command + fixed + regression spec mới pass)

---

## 3. Fix

- **Approach (2 phần, cùng gốc "tin lớn phải sống sót"):**
  1. Thêm nguồn `fetchHNTop`: HN Algolia `points>150` (7 ngày), lọc AI-relevance bằng regex word-boundary (AI/LLM/GPT/Claude/agent/… + URL) — không phụ thuộc title chứa chữ "AI".
  2. Cap **5 tin/ngày** khi chọn 15 slot: `merged` sắp sẵn (trong ngày: hot → score) → mọi ngày đều có đại diện, tin lớn của ngày cũ không bị lũ tin mới đè.
- **Files Changed:**
  - `www/ai-news/fetch.mjs` — thêm `HN_TOP_MIN_POINTS`/`HN_AI_RE`/`isAIRelated`/`mapHNTopStory`/`fetchHNTop` + day-cap trong `main()` + cập nhật `engine` metadata
- **Diff tóm tắt:**
```diff
- const merged.sort(...date desc...); const fresh = merged.slice(0, 15);
+ const CAP_PER_DAY = 5; const fresh = [];
+ for (const a of merged) { dayCount[a.date]++; if (dayCount[a.date] > CAP_PER_DAY) continue; fresh.push(a); if (fresh.length >= 15) break; }
```
- **Non-Goals:** không refactor các fetcher khác (Reddit 403, HackerNoon CC 37 — pre-existing, ngoài scope); không đổi schema JSON; không đổi UI.
- **Fix Confidence:** `HIGH`
- **get_errors:** `node --check www/ai-news/fetch.mjs` → OK; slop-check: 0 finding mới (baseline 8 pre-existing — xem plan.md).

---

## 4. Verification

- [x] Re-run steps reproduce → **Fixed** (`ART trong feed? true`; feed trải 09-22/23/24, mỗi ngày ≤5)
- [x] Edge cases:
  - [x] Nguồn mỏng <3 ngày → cap không áp dụng (spec skip có chủ đích, không flaky)
  - [x] Story trùng giữa HN query và HN-top → dedupe theo title-40 (giữ 1)
  - [x] `--days 0` (không giới hạn) → filters chỉ còn `points>150`
- [x] Regression: `ai-news.spec.ts` + `ai-news-curated.spec.ts` + `ai-news-vi.spec.ts` → **9/9 pass**
- [x] `get_errors` toàn scope → 0 errors (JS không có diagnostics; `node --check` pass)
- [x] Test mới: `ai-news-feed-ranking.spec.ts` → **2/2 pass**
- [x] UI audit: bug này không phải UI. (Phát sinh phụ đã xử lý: nhãn `sources[0]` dài gây overflow 375px → rút gọn, xem bug `2026-09-24-chip-sources-dai-lam-tran-375px`)
- Fresh-eyes tier: `RECOMMENDED` (logic data — đã kiểm bằng 2 nguồn độc lập: output fetch + HTTP API thô)

**Kết quả:**
```
[HN-top] got 24/60 AI-relevant stories (>= 150 pts)
✅ Wrote 15 articles (15 hot)
1. 2026-09-24 ... / 8. 2026-09-23 Claude discovers a novel enzyme system with CRISPR-like repe...
ART trong feed? true | tong 15
```

---

## 5. Lesson (1 câu)

> Feed tin tức sort recency-only có 2 điểm mù: nguồn theo keyword bỏ lỡ tin lớn không chứa keyword, và một ngày lũ tin đè hết slot — cần nguồn top-by-points + cap theo ngày.

---

## 6. Prevention

- **Cách phòng tránh lần sau:**
  - [x] Mọi feed/ranking theo thời gian phải hỏi: "ngày cao điểm có đè hết slot không?" → cap theo bucket (ngày) hoặc mix nguồn.
  - [x] Nguồn tin phải có ít nhất 1 kênh **không phụ thuộc keyword** (top-by-points/top-by-trending).
  - [ ] Thêm vào `docs/knowleged.md` Anti-patterns: "recency-only ranking không cap bucket".
- **Guard (lưới chống tái lập — KN-056):**
  - [x] `- **Guard:** tests/e2e/ai-news-feed-ranking.spec.ts` — invariant: không ngày nào >5/15 slot (khi ≥3 ngày), mọi bài có sourceUrl hợp lệ.
  - [x] Không phải tái lập (không trùng KN cũ — RADAR chỉ báo trùng surface từ khóa "fetch/ranking", đã đọc và loại).
- **Cần cập nhật:**
  - [ ] `docs/knowleged.md` → `KN-076` (draft từ `propose`) — chờ duyệt
  - [x] Test mới: `tests/e2e/ai-news-feed-ranking.spec.ts`

---

## References

- Fix commit: `7ee12f5` (feat(ai-news): nguon HN top-by-points + cap 5 tin/ngay)
- Story gốc: https://www.anthropic.com/news/claude-discovers-novel-enzyme-system (HN 718 pts, objectID 49820134)
- Plan: `.agent/plans/claude-art-tiktok/plan.md` (mục Slop Gate note + Regression)
