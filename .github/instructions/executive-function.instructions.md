---
description: "Executive Function & ADHD-aware — externalize mọi thứ (bộ nhớ/thời gian/luật/động lực) thay vì trông vào não. Use when: agent loop/hyperfocus, task dài dễ đứt, quên instruction, né task khó, output wall-of-text, cần ADHD-friendly communication, focus/chunking, executive function, focus guard, KN-054."
applyTo: "**"
---

# Executive Function — Harness như khung xương ngoài của não (KN-054)

> ADHD (mô hình EF deficit — Russell Barkley) không phải "thiếu chú ý" và không chữa bằng "cố gắng hơn". Vấn đề là **executive function** — và giải pháp nền tảng là **externalize mọi thứ**: bộ nhớ / thời gian / luật / động lực ra khỏi não.
> AI agents có cùng hạn chế về cấu trúc (context = working memory hữu hạn, không time-sense, dễ distraction). Harness v2 là khung xương ngoài đó — cho cả agent lẫn người. Trang trực quan: `www/executive-function/`.

## Khi nào áp dụng
- Agent bị **loop/hyperfocus** (fix mãi 1 cách), **né task khó**, **quên instruction** giữa session dài
- Task dài/đứt quãng (nhiều session, nhiều file) — cần bám scope + thời gian
- Viết output cho người: report, câu trả lời, hướng dẫn — cần thân thiện working memory
- Ai đó hỏi vì sao harness có 3-fix limit, todo list, plans, evals gate... — trả lời bằng mô hình EF

## 1. Nguyên lý — externalize, không "cố gắng hơn"
- Nếu kết quả phụ thuộc vào **ai đó (người/agent) tự nhớ và tự kỷ luật** → thiết kế sai. Chuyển ra cơ chế: file, list, limit, checklist, tool.
- "Cố gắng hơn" (retry nguyên strategy) là **hyperfocus loop**, không phải persistence. Persistence đúng = đổi hypothesis/đổi tool, đo lại (KN-023).
- Không shame: "sếp quên" / "agent quên" không bao giờ là lỗi đạo đức — là **thiếu khung xương**. Fix khung xương, không phán xét.

## 2. Bảng mapping — 6 EF ↔ cơ chế harness (tra TRƯỚC khi coi là bug mới)
| EF | Khi yếu thấy gì | Cơ chế harness đã có (cơ chế thật, không phải ẩn dụ suông) |
|----|-----------------|-----------------------------------------------------------|
| **Ức chế** | phá rule, hành động bốc đồng, sửa test để pass | `policy.json` deny-first + fail-closed, `deny-test-mutate`, 3-fix limit/check |
| **Working memory** | quên giữa chừng, lặp lại việc đã làm | `manage_todo_list`, `.agent/plans/<task>/`, `docs/knowleged.md`, session log |
| **Điều tiết cảm xúc** | panic khi lỗi, bỏ cuộc giữa pipeline | Error handling 3 cấp, escalation gate, fresh-eyes tiered, micro-win |
| **Khởi động** | mãi không bắt đầu, phân vân vô hạn | Pipeline 8 phase, Clarify (chốt 1), "1 next step" trong mọi output |
| **Lập kế hoạch** | scope phình, task trôi vô hạn | PRD→Design→Plan, ≤200 LOC/diff, bounded repair loop, YAGNI gate |
| **Tự giám sát** | "tưởng xong" nhưng chưa; overconfidence | Verify + Evals Gate (KN-037) + Slop Gate (KN-047), `get_errors`, audit chain |

> Nếu một failure không nằm trong bảng → đề xuất bổ sung bảng (propose KN), đừng fix mò rồi quên.

## 3. Agent failure modes ↔ guardrail (đặt tên để nhận diện)
- **Hyperfocus loop** (kẹt 1 hypothesis) → 3-fix limit + `systematic-debugging` (đổi hypothesis, không retry mù).
- **Distraction/poisoning** (context phình, lặp history) → `context.mjs` compress/isolate + quarantine.
- **Time blindness** (không biết "bao lâu rồi, còn bao nhiêu") → todo visible + bounded task + báo progress.
- **Delay aversion** (né task khó/chán) → chia nhỏ tới mức "1 hành động", làm micro-win trước để mở đà.
- **Working memory loss** (quên instruction giữa session) → đọc `knowleged.md` trước task; ghi quyết định ra file, không giữ trong đầu.
- **Wall-of-text** (dội người đọc) → kết luận trước, chi tiết sau (xem §4).

## 4. Output rules ADHD-friendly (bắt buộc cho mọi report/trả lời)
1. **Kết luận trước** — 1 dòng TL;DR đầu tiên (inverted pyramid), chi tiết sau. Không bắt người đọc tự tìm đáp án.
2. **1 next step** — mỗi turn chỉ 1 câu hỏi / 1 gợi ý hành động rõ ràng. Hỏi dồn 3 câu = overload.
3. **Chunk** — task dài → todo list hiển thị; mỗi bước là "1 hành động", không phải "1 dự án".
4. **Progress visible** — hoàn thành todo nào báo ngay todo đó, không im lặng dài rồi đổ kết quả cuối.
5. **Micro-win** — bước nhỏ xong → xác nhận liền (động lực external, không chờ tới cuối).
6. **Không tường chữ** — bullet/bảng/đậm ý chính; đoạn ≤4 dòng; cấm dội wall-of-text.
7. **Không shame** — câu hỏi lặp, việc quên, làm lại → hệ thống nhắc nhẹ, không phán xét ("huhu mình nói lại ngắn gọn nhé").

## 5. Checklist cho agent (tự kiểm)
- [ ] Gặp behavior lạ (loop/quên/né/wall) → đã tra bảng §2–§3 trước khi coi là bug mới?
- [ ] Đang fix bằng cơ chế ngoài (todo/limit/checklist/tool) chứ không phải "cố thêm lần nữa"?
- [ ] Task >2 bước → có visible progress (todo + báo từng bước)?
- [ ] Output có TL;DR + 1 next step + không quá tường chữ?
- [ ] Decision quan trọng đã ghi ra file (plans/knowleged), không giữ trong đầu?

## Liên kết
- Trang trực quan: `www/executive-function/` (mapping explorer + lab working memory)
- Knowledge: `docs/knowleged.md` KN-054 · Personality: `yunie-personality.instructions.md` §18
- Đối trọng: `minimal-ladder` (cắt waste — không nhầm với EF) · `fund-the-friction` (giữ friction quý)

---
*Instruction: executive-function — enforce bởi Harness v2. Externalize mọi thứ. KN-054.*
