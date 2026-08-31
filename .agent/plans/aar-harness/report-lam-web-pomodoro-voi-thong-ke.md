# AAR Report — làm web pomodoro với thống kê

> Generated: 2026-08-30T18:34:16.894Z by auto-researcher.mjs (AAR for Harness v2)
> Paper: Anthropic AAR 28/08/2026 — Automated Researchers Can Reliably Mitigate Alignment Failures
> Warning shot: OpenAI HF incident 26/08/2026 — benchmark phải check HOW not just WHETHER

## 1. Suggest — knowleged.md (top 3)

- **[KN-007]** score 23.7 — Thiếu hệ thống tự học hỏi tự động — phải làm tay, dễ quên (minor, process knowledge automation dx)
  - Thiếu hệ thống tự học hỏi tự động — phải làm tay, dễ quên
  - snippet:  - **Ngày:** 2026-08-30 - **Bug report:** `.agent/bugs/auto-learn/bug.md` (feature, không phải bug — hệ thống tự học) - **Severity:** major - **Triệu …
- **[KN-005]** score 15.3 — Bug Blindness — mù bug do workaround vô thức + fan bias (minor, process quality ux perf a11y)
  - Bug Blindness — mù bug do workaround vô thức + fan bias
  - snippet:  - **Ngày:** 2026-08-30 - **Bug report:** `.agent/bugs/2026-08-30-bug-blindness/bug.md` (tham chiếu Dan Luu — https://danluu.com/bug-blind/) - **Sever…
- **[KN-006]** score 3.1 — N5 Blazor thieu theme sang + tieng Viet mat dau + menu chua polish (minor, ui css a11y i18n theme contrast)
  - N5 Blazor thieu theme sang + tieng Viet mat dau + menu chua polish
  - snippet:  - **Ngày:** 2026-08-30 - **Bug report:** `.agent/bugs/2026-08-30-n5-ui-polish/bug.md` - **Severity:** major - **Triệu chứng:** Chi co dark theme, kho…

## 2. Library — BM25 (303 chunks)

- **"Machine Learning - Andrew Ng (PDF bản dịch tiếng Việt).pdf"** · chunk #12 · page 127 · score 9.8
  >  năng. Việc phát triển thuật toán học mà được huấn luyện trên một phân phối này mà có thể khái quát hóa tốt trên một phân phối khác là một chủ đề nghiên cứu quan trọng. Tuy nhiên, nếu mục tiêu của bạn là cải tiến một ứng dụng học máy cụ thể thay vì làm nghiên cứu, thì tôi khuyên bạn chọn tập phát tr……
- **"Machine Learning - Andrew Ng (PDF bản dịch tiếng Việt).pdf"** · chunk #46 · page 127 · score 7.639
  > lượng một thuật toán học máy với chất lượng mức con người. Trong một vài chương trước, bạn đã học cách tính phương sai và độ chệch tránh được/không tránh được bằng cách xem xét tỉ lệ lỗi huấn luyện và tỉ lệ lỗi phát triển. Chương tiếp theo sẽ thảo luận về cách bạn có thể sử dụng những hiểu biết sâu ……
- **"Machine Learning - Andrew Ng (PDF bản dịch tiếng Việt).pdf"** · chunk #66 · page 127 · score 7.432
  > h. Nếu đang vận hành một trang web hoặc ứng dụng bán sách, bạn có thể lấy dữ liệu bằng cách hiển thị sách cho người dùng và xem những gì họ mua. Nếu không vận hành một trang web như vậy, bạn cần tìm những cách sáng tạo hơn để lấy dữ liệu.  Khó tin tưởng trực giác của con người. Ví dụ, gần như không ……
- File: `D:\CLAUDE_VS\www\library\export.json`

## 3. Propose — 3 methods

### [A] Minimal fix — Áp Cách phòng tránh từ KN ⭐ **KEEP**
- **Source:** KN-007 · Thiếu hệ thống tự học hỏi tự động — phải làm tay, dễ quên (score 23.7)
- **Mô tả:** Áp dụng **Cách phòng tránh** của KN-007: Thiếu hệ thống tự học hỏi tự động — phải làm tay, dễ quên
- **Steps:** Đọc chi tiết KN-007 trong docs/knowleged.md → Áp Cách phòng tránh vào code → Verify bằng checklist của KN
- **Pros:** Nhanh, ít rủi ro, tránh lặp bug cũ | **Cons:** Có thể chưa đủ nếu task mới hoàn toàn
- **When:** Khi task chạm pattern đã từng lỗi

### [B] Polish + a11y — Theo product-quality 
- **Source:** product-quality.instructions.md + KN-002/KN-006
- **Mô tả:** Chất lượng product: build/test pass, error/empty/loading states, a11y, không hardcode
- **Steps:** Thêm states đầy đủ → A11y audit → Verify build/test
- **Pros:** Đẹp, bền, đúng chuẩn Harness | **Cons:** Tốn thêm 20-30% thời gian
- **When:** Khi task có UI hoặc cần polish

### [C] Library-inspired — Dùng kiến thức từ sách 
- **Source:** Machine Learning - Andrew Ng (PDF bản dịch tiếng Việt).pdf · chunk #12 · page 127 · score 9.8
- **Mô tả:** Theo "Machine Learning - Andrew Ng (PDF bản dịch tiếng Việt).pdf" (chunk #12): " năng. Việc phát triển thuật toán học mà được huấn luyện trên một phân phối này mà có thể khái quát hóa tốt trên một phâ…"
- **Steps:** Đọc chunk #12 trang 127 → Trích pattern vào design → Implement + citation
- **Pros:** Có grounding, không bịa | **Cons:** Cần verify snippet có liên quan thật
- **When:** Khi thư viện có kiến thức liên quan

## 4. Benchmark checklist

- [ ] dotnet build pass (không MSB3027 file lock — KN-008) **(required)**
- [ ] dotnet test pass **(required)**
- [ ] get_errors 0 **(required)**
- [ ] Grader check HOW not just WHETHER (học từ HF incident) **(required)**
- [ ] Không reward hacking — không hardcode để qua test **(required)**
- [ ] Có safe stop nếu task impossible (học từ HF)

> Học từ HF incident: benchmark phải check **HOW** (cách làm) không chỉ **WHETHER** (có pass không). Không reward hacking.

## 5. Recommendation

**KEEP Method A** — Minimal fix — Áp Cách phòng tránh từ KN

Reason: Áp dụng **Cách phòng tránh** của KN-007: Thiếu hệ thống tự học hỏi tự động — phải làm tay, dễ quên

Next: Implement Method A todo-driven (tdd-gate) → benchmark → nếu fail thử method khác (max 3).

---
*Auto-Researcher — AAR for Harness v2. Process > Model. $4/h vs $150/h.*
