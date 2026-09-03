---
description: "Ponytail-inspired minimal ladder — YAGNI gate, reuse-first, native-first, dead-code grep + scoreboard. Use when implementing feature, fixing bug, reviewing over-engineering, need minimal code, YAGNI, dead code, native platform, or user says ponytail/ladder/minimal/lean."
applyTo: "**"
---

# Minimal Ladder — Viết ít nhất có thể (học Ponytail)

> Best code là code không phải viết. Ladder chạy **sau khi đã đọc hiểu code**, không thay việc đọc.

## Khi nào áp dụng
- Mọi task Implement / Fix có code mới
- Review over-engineering (`/ponytail-review` tương đương)
- PRD có nguy cơ scope phình, Design có nguy cơ thêm component mới

## Ladder 7 nấc (dừng ở nấc đầu tiên đúng)
```
1. Cần tồn tại không? (YAGNI) → không: skip, không viết
2. Codebase đã có? → reuse, không rewrite
3. Stdlib làm được? → dùng stdlib
4. Native platform có? → dùng native (`<input type="date">`, CSS, Web API)
5. Dependency đã cài? → dùng, không cài mới
6. Một dòng xong? → một dòng
7. Mới viết tối thiểu — minimum that works
```

## Tích hợp Harness v2
- **PRD:** thêm YAGNI gate — liệt kê cái CẮT trước cái GIỮ. `Persistence · F5 · Scope` vẫn bắt buộc cho `www/`.
- **Design:** native-first — stdlib/native/dependency đã cài trước component mới. Không thêm dep nếu chưa chứng minh cần.
- **Implement:** chạy ladder sau Explore + đọc code chạm tới. Kết hợp `tdd-gate` (RED trước) + `systematic-debugging` (root cause trước).
- **Verify:** grep dead-code + scoreboard:
  - `grep` tên component/css mới thêm → phải có usage, không thì xóa
  - Diff stat: ghi số dòng/bytes thêm vs xóa vào bug/plan
  - `get_errors` affected files, build/test full scope

## Không bao giờ cắt (Lazy, not negligent)
- Validation ở trust-boundary, error handling, data-loss handling
- Security, accessibility (contrast ≥4.5:1, keyboard, aria)
- Test đang pass — FAIL chỉ fix bằng production code (KN-012)

## Checklist
- [ ] Đã đọc code chạm tới trước khi chọn nấc?
- [ ] PRD có dòng CẮT (YAGNI) không?
- [ ] Có reuse thay vì rewrite không?
- [ ] Có dùng native/stdlib trước dep mới không?
- [ ] Verify có grep dead-code + scoreboard không?
- [ ] Không cắt validation/security/a11y chứ?

---
*Instruction: minimal-ladder — học DietrichGebert/ponytail (MIT), enforce bởi Harness v2. KN-013.*
