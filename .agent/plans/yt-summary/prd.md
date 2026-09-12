# PRD — YT Summary (YouTube → Transcript sạch → Bảng tóm tắt)

**Slug:** `yt-summary` · **Ngày:** 2026-09-12 · **Pipeline:** `/harness` (feature mới)
**Owner:** user (pilot-in-command) · **Crew:** YUNIE (analyst/implement/verify)

---

## 1. Vấn đề

Video YouTube dài (20–120 phút) rất khó nắm nhanh. Transcript thô (auto-caption) bị **lặp dòng liên tục**, có `[Music]`, `>>`, quảng cáo, "like & subscribe", filler (`uh`, `ờ`, `ừ`) → đọc mệt, không có cấu trúc, không biết phần nào nói gì.

**Mong muốn:** paste link → nhận (a) transcript **đã lược bỏ phần thừa**, (b) **bảng tóm tắt** theo phần có mốc thời gian.

## 2. User stories

| ID | Story |
|----|-------|
| US1 | Là người xem, tôi paste link YouTube → bấm "Phân tích" → xem **bảng tóm tắt** (phần nào · mốc nào · nói gì) trong vài phút. |
| US2 | Tôi mở rộng 1 phần trong bảng → đọc **transcript đã làm sạch** đúng đoạn đó. |
| US3 | Tôi thấy **phần nào bị lược** (quảng cáo/outro/music) + **% đã lược** để tin dữ liệu. |
| US4 | Tôi xem lại danh sách video **đã phân tích** (lưu trong repo, ai mở trang cũng xem được). |
| US5 | Tôi copy được transcript sạch (1 phần hoặc toàn bộ) để dán đi chỗ khác. |

## 3. Ràng buộc (Constraints) — quyết định kiến trúc

1. **GitHub Pages = static, không server.** → Trích xuất **phải chạy trong GitHub Actions (CI/CD)** rồi commit JSON vào `www/`.
2. **KHÔNG dùng AI API key** (không OpenAI/Gemini/Claude API). → "Tóm tắt" là **extractive** (TF-IDF + tín hiệu cấu trúc), **không generative**. UI phải ghi rõ điều này, không hứa hẹn như LLM.
3. **Luồng mặc định KHÔNG cần secret:** trang tạo **GitHub Issue prefill** → workflow `on: issues` chạy build → commit → **comment kết quả** vào issue.
4. **Luồng nhanh (tùy chọn):** user dán **fine-grained PAT** → trang gọi `workflow_dispatch` → poll kết quả. Token chỉ ở `localStorage`, không log, không commit.
5. **Chi phí CI:** chỉ 1 job/video, cache theo `videoId` → chạy lại không tốn (trừ `force`).
6. **Dịch tiếng Việt (bổ sung 2026-09-12):** mọi nội dung hiển thị (bảng tóm tắt + transcript) dịch sang tiếng Việt, giữ bản gốc để đối chiếu. Nguồn dịch no-key: Google `gtx` (chất lượng tốt, **node-only vì không CORS**, throttle khi burst) + MyMemory (CORS `*` → **dùng được trong browser**, giới hạn 500 chars/request + quota/ngày).

## 3b. REALITY CHECK — đo thật 2026-09-12 (không đoán — KN-023)

> Bằng chứng: `.agent/plans/yt-summary/verify/` (probe-net, probe-relay, probe-ytapi, probe-cors + logs).

| Lane trích transcript | Kết quả đo | Quyết định |
|---|---|---|
| Direct scrape watch-page (npm youtube-transcript cùng lớp) | ❌ 429 | Chỉ giữ làm lane cuối (0-cost thử 5s) |
| yt-dlp plain (no cookie) | ❌ bot-check "Sign in to confirm" | Lane mặc định, best-effort |
| yt-dlp + `--cookies-from-browser edge` | ❌ DB locked (browser đang chạy) | Document: đóng browser là chạy được |
| yt-dlp + `--cookies-from-browser chrome` | ❌ DPAPI/ABE (Chrome 127+) | Đi qua `cookies.txt` export (extension) |
| Invidious ×6 + Piped | ❌ 0/6 sống · 403 | **Bỏ** — instance công khai đã chết |
| youtube-transcript-api (8.3k⭐, Python) | ❌ `IpBlocked` (chính lib cảnh báo cloud IP) | **Bỏ** — thêm dep vô ích |
| **File .vtt/.srt/.json3 (paste/drop)** | ✅ luôn chạy (không cần network) | **Lane chính, guaranteed** |
| Google gtx dịch | ✅ 200 · 718ms lần đầu · ⚠️ throttle theo IP khi burst + **no CORS** | Dịch node (CI/local) |
| **clients5.google.com** (`dict-chrome-ex`) | ✅ **sustain với nhịp chậm** (đo 3/3 @2.5s gap) — shape `[["text","en"]]` | **Dịch node: primary thực tế** (gtx throttle) |
| MyMemory dịch | ✅ 200 · CORS `*` · ❌ **quota ẩn danh ~5.000 ký tự/ngày/IP** (đo: hết sau ~2 video, reset ~5h) | Dịch browser lane (quota-aware) + fallback node |

**Hệ quả thiết kế:** browser lane (paste .vtt → xử lý ngay trong trang) là lane đảm bảo-100%; CI extraction là best-effort + hỗ trợ secret `YT_COOKIES` (cookies.txt) cho ai muốn CI chạy chắc. UI phải nói thật về độ tin cậy từng lane.

## 4. Phạm vi

**LÀM:**
- `www/yt-summary/`: form dán link, trạng thái pipeline, **bảng tóm tắt**, transcript lọc theo phần, danh sách video đã xử lý, **toggle Tiếng Việt / Bản gốc**.
- `www/yt-summary/pipeline.mjs` — **module thuần dùng chung node + browser** (parse VTT/SRT/JSON3 → clean → segment → summarize → keywords → detect lang → chunk dịch).
- `scripts/yt-summary/build.mjs`: CLI — lane extraction (vtt | yt-dlp+cookies | scrape) → pipeline → **dịch vi** (gtx→mymemory) → JSON.
- **Browser lane:** paste/drop `.vtt` vào trang → pipeline chạy tại chỗ + dịch qua MyMemory (CORS) → bảng + tải JSON — không cần CI.
- `.github/workflows/yt-summary.yml`: trigger `workflow_dispatch` + `issues` (label `yt-summary`) → build → commit `www/yt-summary/data/*.json` → comment kết quả; hỗ trợ secret `YT_COOKIES` (tùy chọn).
- Test: pipeline (fixture VTT) + e2e page (fixture JSON + browser lane).

**KHÔNG LÀM (non-goals):**
- Không dịch máy; transcript giữ ngôn ngữ gốc.
- Không tải video/audio; chỉ dùng phụ đề.
- Không search full-text / DB / tài khoản / worker queue.
- Không sinh tóm tắt "văn phong người viết" (không có LLM).

## 5. YAGNI gate (minimal-ladder — CẮT trước, GIỮ sau)

**CẮT:** player nhúng (YouTube có sẵn link), DB, tài khoản/login, full-text search, i18n đa ngôn ngữ UI, embedding/vector store, queue service, webhook server, dark/light toggle riêng (dùng hệ `www/` sẵn có).
**GIỮ:** form + 2 cách trigger + render bảng + lọc transcript + **repo làm DB** (`data/*.json`).
**Reuse:** `dirBase()` (KN-030), pattern CI→commit JSON của `ai-news`, style tokens của `www/styles.css`.

## 6. Tiêu chí chấp nhận (Acceptance)

- **AC1:** Dán link hợp lệ → token mode: kết quả render tại trang (≤ ~3 phút, có progress); issue mode: issue được comment link `data/<id>.json`.
- **AC2:** Video > 10 phút → bảng có **≥ 3 dòng**, mỗi dòng: mốc thời gian · tên phần · tóm tắt · từ khóa.
- **AC3:** Transcript hiển thị đã lược: **không** còn dòng lặp auto-caption, **không** còn `[Music]`/`>>`, **không** còn cụm like/subscribe/sponsor; có **% đã lược** + số phần bị bỏ.
- **AC4:** Video không có phụ đề → báo lỗi rõ ràng + gợi ý (không crash, không tạo JSON rác).
- **AC5:** Danh sách video đã phân tích mở lại xem được bảng mà không chạy lại.
- **AC6:** 100% trên Pages, không server, không AI key.
- **AC7:** Link URL dạng `/yt-summary` (không slash cuối) vẫn fetch + link đúng (KN-030/KN-040).

## 7. Persistence · F5 · Scope (§3b bắt buộc)

```
Persistence: localStorage (`yt-summary:pat`, `yt-summary:repo`) + repo commit `www/yt-summary/data/*.json`
F5:         token/repo override → giữ · kết quả phân tích → giữ (nằm trong repo)
Scope:      kết quả = global (mọi người thấy sau khi Pages deploy) · token = per-browser (máy user)
```

## 8. Bảo mật

- PAT: fine-grained, chỉ `Actions: read & write` (+ `Contents: read` để poll raw); khuyến nghị TTL ngắn; **chỉ** gửi tới `api.github.com`; có nút **Xoá token**; không bao giờ log/commit.
- Workflow issue-mode dùng `GITHUB_TOKEN` mặc định với `permissions: contents: write, issues: write` — không cần secret thêm.
- Chống lạm dụng: dedupe theo `videoId` + `concurrency` group + chỉ nhận URL `youtube.com|youtu.be` (validate ở cả page lẫn script).
- Không lưu nội dung bản quyền ngoài transcript công khai (phụ đề) — ghi nguồn + link video gốc trong JSON.

## 9. Rủi ro & giảm thiểu

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|--------|-----------|-----------|
| YouTube chặn IP datacenter (yt-dlp fail) | Không lấy được transcript | Thử nhiều client (`--extractor-args`), fallback endpoint `youtube-transcript`, báo lỗi rõ + cho phép dán `.vtt/.srt` tay ở local mode |
| Video không có phụ đề (kể cả auto) | Job fail | Detect riêng → exit code 3 + message; không ghi JSON rác |
| Auto-caption tiếng Việt sai chính tả | Tóm tắt kém | Chuẩn hoá + keyword vẫn hữu ích; ghi `quality` (số cue lặp, tỉ lệ lược) để user biết độ tin cậy |
| Job lạm dụng / spam issue | Tốn CI minutes | Dedupe cache + validate URL + concurrency + hướng dẫn đóng issue |
| Pages chưa deploy kịp khi poll | Poll timeout | Poll `raw.githubusercontent.com` (nhanh hơn Pages) + cache-bust `?t=` + timeout ~4 phút |

## 10. Dissent Review (KN-018 — không bỏ dù gấp)

**Framing đối lập 1 — "Không LLM thì 'tóm tắt' chỉ là trích câu, không phải tóm tắt."**
→ **Chấp nhận đánh đổi** (ràng buộc no-AI-key của user). Bù bằng cấu trúc phần + keyword + transcript sạch. Giá trị thật của feature là **lược bỏ** (thứ CI làm rất tốt), không phải **viết lại**. UI ghi rõ "extractive", không ngụy trang thành AI summary.

**Framing đối lập 2 — "Sao không trích transcript ngay trong browser (khỏi CI)?"**
→ **Bác.** YouTube `timedtext` cần signature + không CORS; dùng proxy bên thứ 3 = phụ thuộc ngoài + rủi ro chết/Vi phạm ToS. CI cho kết quả ổn định, lưu vĩnh viễn, audit được.

**Framing đối lập 3 — "Issue-as-queue là lạm dụng issue tracker."**
→ **Chấp nhận đánh đổi** (đây là pattern phổ biến cho static site cần compute). Ưu điểm: 0 secret, có audit trail. Ai không thích → token mode (không tạo issue).

**Framing đối lập 4 — "CI extraction đã bị chặn thì giữ CI làm gì cho rối?"**
→ **Chấp nhận giữ** vì: (1) chặn là theo IP/thời điểm — GitHub IP có lúc chạy được; (2) secret `YT_COOKIES` biến CI thành lane chạy chắc cho ai cần; (3) issue-mode vẫn là cách trigger từ xa hợp lệ + có audit trail. Bù trừ bằng **lane browser + CLI** đảm bảo luôn có đường dùng được.

**Rival work:** `summarize.tech`, `notegpt.io`, `youtube-transcript.io` — đều **server + LLM + key/ads**, dữ liệu ra ngoài. Khác biệt của ta: self-host, no key, no server, **dữ liệu nằm repo mình**, chạy được trên Pages.

**Who did you think with?:** YUNIE (crew) đưa 4 framing đối lập + rival work + đo thật 6 lane; **user** (pilot-in-command) chốt ràng buộc "Pages + no AI key + CI/CD" + "dịch tiếng Việt" và quyết định hướng.

## 12. Tích hợp repo cộng đồng (đã đo, không copy mù)

| Nguồn | Vai trò trong sản phẩm | License |
|---|---|---|
| `yt-dlp` (130k⭐) | Lane extraction chính khi có cookies / IP sạch — CLI gọi từ build.mjs | Unlicense |
| MyMemory API | Dịch browser lane (CORS) | Public API free |
| Google gtx endpoint | Dịch node lane (chất lượng cao hơn) | Public endpoint free |
| `Kakulukian/youtube-transcript` (npm) | ❌ Không tích hợp — cùng lớp scrape đã bị 429 | MIT (không dùng) |
| `jdepoix/youtube-transcript-api` | ❌ Không tích hợp — IpBlocked | MIT (không dùng) |
| Invidious/Piped | ❌ Không tích hợp — đo 0/6 sống | AGPL (không dùng) |
| `kimtaeyoon83/mcp-server-youtube-transcript` | ❌ Không tích hợp — cho agent lúc dev, không dùng được trong CI | MIT (không dùng) |

**Nguyên tắc:** chỉ tích hợp cái đã đo sống; ghi rõ cái đã đo chết để lần sau không thử lại tốn thời gian.

## 11. Nguồn tái dùng

- `www/ai-news/` — CI fetch → commit JSON → static render (pattern chính).
- `dirBase()` + `fixRelLinks()` — KN-030 / KN-040 (URL không slash).
- `docs/knowleged.md` KN-002 (Pages fetch), KN-012 (test immutable), KN-029 (script-blocking), KN-037 (Evals Gate).
