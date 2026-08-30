# PRD: Auto-Learn — Hệ thống tự học hỏi tự động

## 1. Vision
- **One-liner:** Mỗi lỗi/build fail/edit đều tự log, gợi ý KN liên quan ngay khi code, và đề xuất cập nhật `knowleged.md` — không cần nhớ tay.
- **Problem:** Hiện tại `knowleged.md` phải đọc tay, ghi tay sau `/fixbug`; dễ quên, dễ lặp bug cũ (KN-002..006).
- **Target:** Dev + YUNIE + mọi agent trong Harness v2.

## 2. User Stories
| ID | As a ... | I want ... | So that ... | P |
|----|----------|------------|-------------|---|
| US-01 | dev đang code | gõ task/mô tả lỗi → được gợi ý KN liên quan (score) | không lặp bug cũ | P0 |
| US-02 | hệ thống | khi `get_errors`/`build` fail → auto tạo draft `.agent/bugs/<slug>/bug.md` | không mất log | P0 |
| US-03 | dev sau khi fix | 1 lệnh tạo đề xuất KN mới cho `knowleged.md` (copy-paste) | ghi bài học nhanh | P0 |
| US-04 | agent/hook | tự chạy suggest trước khi edit (PostToolUse) | enforce không quên | P1 |
| US-05 | YUNIE | `status` hiện số KN, bug drafts, health | quan sát học hỏi | P1 |

## 3. Scope
### In Scope (P0)
- [x] Script `auto-learn.mjs` với 3 lệnh: `suggest`, `log`, `propose` + `status`
- [x] `suggest`: đọc `knowleged.md` → parse KN (ID, tags, keywords) → BM25-lite keyword match → trả top 3 KN + citation
- [x] `log`: tạo `.agent/bugs/YYYY-MM-DD-<slug>/bug.md` từ template + điền error/file
- [x] `propose`: từ bug.md → sinh markdown KN-XXX draft để dán vào `knowleged.md`
- [x] Instruction `auto-learn.instructions.md` (applyTo **) enforce suggest trước edit
- [x] Agent `learn.agent.md` (delegate khi cần suggest/log)
- [x] Hooks `hooks.json` thêm PostToolUse gọi auto-learn (echo + node)
- [x] Verify: `node auto-learn.mjs status` + `suggest` demo

### Nice to Have (P1)
- [ ] Watch `get_errors` output tự parse
- [ ] Tích hợp `www/status.json` hiện learn stats
- [ ] RAG library search kết hợp

### Non-Goals
- Không ML retrain, không server, không DB — chỉ file + BM25-lite
- Không tự ghi `knowleged.md` (chỉ propose, dev duyệt)

## 4. Success Metrics
- `suggest "rainbow border"` → trả KN-003/KN-004 score >0
- `log --error "RZ9986"` → tạo bug draft đúng template
- `propose --bug <slug>` → sinh KN draft đúng format
- `status` → counts KN, bugs, drafts

## 5. Edge Cases
- `knowleged.md` chưa có KN → suggest trả "chưa có bài học"
- Bug slug trùng → thêm suffix `-2`
- File path không tồn tại → vẫn log, warn

## 6. Assumptions
- Node 18+, không deps, chạy `node .github/harness/scripts/auto-learn.mjs`
- `knowleged.md` format chuẩn (Bảng tóm tắt + Chi tiết KN-XXX)
- Hooks chỉ echo + node, không block

## 7. Open Questions
- [x] Chốt: BM25-lite = token overlap + tag boost, đủ nhanh <50ms
