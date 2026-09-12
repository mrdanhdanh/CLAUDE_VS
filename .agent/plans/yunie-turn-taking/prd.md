# PRD mini — YUNIE Turn-Taking v2.2

**Task:** Áp framework 5 conversational events (C/T/BC/I/NA) từ "A Framework for Conversational System Modeling" (HackerNoon 12/09/2026 — FinVolution "Teach AI When to Speak" 2026 + Patamia et al. MDPI 2025) vào persona YUNIE.

**User story:** Khi chat, YUNIE biết khi nào tiếp tục (C), nhường lượt (T), ack ngắn (BC), chen có lý do (I), im đúng lúc (NA) — tự nhiên như người, không robotic, không spam.

**Scope:** §17 mới trong `.github/instructions/yunie-personality.instructions.md` + pointer trong `.github/agents/yunie.agent.md` + regen `.claude/rules/` (export-claude).
**Non-goals:** Không làm voice/audio, không build model, không đổi workflow/todo logic.

**Who did you think with?:** Critic agent độc lập (chạy 12/09/2026 — không phải self-review; xem verdict cuối file). Assumption "điểm yếu thật của lượt dài" KHÔNG có bằng chứng đo được (0 bug turn-taking / 1104 turns) → hạ cấp thành hypothesis (KN-019); phần giữ lại dựa trên pain đo được: autonomy mandate (≥6 sessions "tự quyết đi") + tail cue ("vẫn lỗi/thử lại" ~20 lượt). Verdict: **TRIM** — đã áp dụng.

**Persistence:** N/A (instruction file — git tracked) · F5: N/A · Scope: repo-wide persona.

## Dissent Review — Verdict (12/09/2026)

**Reviewer:** Critic agent độc lập (report đầy đủ trong session log) · **Verdict: TRIM** (MEDIUM-HIGH confidence) — không REVERT (delta thật tồn tại), không KEEP (60–70% trùng lặp + 2 tension chưa xử lý).

**Findings đã áp dụng:**
1. **Claim không có bằng chứng** — 0 bug turn-taking, 0 complaint / 1104 turns; pain thật = autonomy + tail → hạ cấp hypothesis (KN-019).
2. **Redundancy** — §17 trùng gần verbatim §7 (handover, dồn câu hỏi), §5/§6 (ack examples), §8 (pestering), §13, §16, copilot-instructions (rule tail từng lặp tới 6 bản — gồm 1 dòng lặp sẵn trong copilot-instructions.md, đã xoá).
3. **BC voice-only** — "ack không đổi lượt" không tồn tại trong text (mọi message đều chiếm lượt) → rewrite thành **burst-handling** (nhiều tin liên tiếp → theo tin cuối).
4. **Gap đã bù** — burst, Done+silence (không chase, tối đa 1 nhắc), precedence §8 No Input vs NA, precedence §16 (sếp bực) vs I.
5. **Trim** — xoá principle 3 (trùng 100%), rút tail còn 1 câu + cross-ref.

**Không áp dụng (để ngỏ):** rival work CA 1974 (Sacks, Schegloff & Jefferson) — MEDIUM, không verify web được trong môi trường review → ghi nhận, không trích chính thức.

## Eval rubric mini (KN-037 — đo hành vi, không chỉ structure)

| # | Scenario | Expected | Fail nếu |
|---|----------|----------|----------|
| 1 | Sếp gửi 2–3 tin liên tiếp khi YUNIE đang chạy | Trả lời theo tin CUỐI, gộp fragment | Trả lời từng mảnh / bỏ sót tin cuối |
| 2 | Sếp: "oke để mình xem đã" | Im, không nhắc lại | Nhồi thêm câu hỏi/việc trong lượt kế |
| 3 | Giữa execution đã Clarify xong | Chạy tiếp, không hỏi lại | Hỏi "giờ làm gì ạ?" |
| 4 | Task Done + sếp im | Không chase (tối đa 1 nhắc) | Nhắc lặp >1 lần |
| 5 | Sếp bực + stuck ≥2 vòng | Cảnh báo critical, không dissent | Dissent khi sếp đang bực |
