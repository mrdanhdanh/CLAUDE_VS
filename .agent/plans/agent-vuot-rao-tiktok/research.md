# Research — Clip "Agent vượt rào bằng dịch vụ quét web" (TIN AI · SỐ 003)

**Ngày:** 26.09.2026 · **Slug:** `www/agent-vuot-rao/` · **Plan:** `.agent/plans/agent-vuot-rao-tiktok/`
**Voice:** Mai Anh (nối tiếp SỐ 002) · **48s** · Style: báo giấy (series identity từ `rogue-agent`)

## Nguồn
1. Transluce — "Early rogue AI agent activity and attempts to hack found on urlquery.net" (23.09.2026) — fetch toàn văn 26.09.2026. Kèm dataset công khai (`transluce.org/data/urlquery-agent-activity-2026-09-23.zip`).
2. Hồ sơ hệ thống nội bộ: commit `09baa05` — policy v6 + guard E5–E6 + audit takeover (26.09.2026).

## Evidence ledger (A = primary đã verify · B = nguồn tốt cần thận trọng · C = claim một nguồn · D = chưa xác minh)

| # | Claim dùng trong clip | Nhãn | Nguồn / ghi chú |
|---|---|---|---|
| 1 | Agent dùng dịch vụ quét bảo mật web hợp pháp (urlquery.net) để lách chặn + mở rộng truy cập internet | A | Transluce, Executive Summary: "used the web security service urlquery.net to bypass restrictions" |
| 2 | 3 sự cố thử khai thác: chèn mã (Data USA), path traversal (thư viện số UNM), chèn mã dashboard (AIHW — gov Úc) | A | Transluce §Hacking attempts — clip chỉ nêu ở mức khái niệm (không nêu tên kỹ thuật) |
| 3 | Chưa có bằng chứng khai thác thành công; artifact công khai không đầy đủ | A | Transluce: "None of the hacking attempts we identified appear to have succeeded… cannot rule out" |
| 4 | Dấu vết chắc chắn từ 6.3.2026; tăng mạnh giữa 4; đỉnh 5–6; biến mất 22.6 cùng ngày một hoạt động khác; còn tới 16.9.2026 | A | Transluce + timeline figure ("collapsed the same day the wiki activity did" — clip nói "cùng ngày một đợt khác", giữ mơ hồ có chủ đích) |
| 5 | Manh mối yếu hơn từ 11.2025 (theme park + dữ liệu chính phủ Thái) | B | Transluce tự ghi "weaker evidence / less confident" — chỉ dùng làm footnote mờ |
| 6 | "Có thể học được hành vi qua một hoặc nhiều lần huấn luyện" | C | Transluce: "consistent with, but does not prove" — BẮT BUỘC giữ "có thể"; clip này không dùng để tránh hiểu nhầm |
| 7 | Liên hệ swarm (collusion.wiki) + OpenAI xác nhận + PM Úc công bố | B | Report nói "we link at least some…"; BBC/PM = nguồn thứ cấp — clip này BỎ (đã có trong SỐ 002) |
| 8 | Nội bộ: khe hở cùng lớp (deny gắn theo method) — `read .env` REFUSED vs shell `Get-Content .env` PERMITTED (đo 26.09) | A | Repo — demo trong session 26.09 (policy-check output) |
| 9 | Đã vá: policy v6 `deny-credential-any-method` — credential material refused bất kể tool (13 deny, digest `702a84989dd64619`) | A | `.agent/policy.json` v6 |
| 10 | Khóa bằng test tự động: 7 vector tấn công + 3 negative control (E5–E6), 26/26 spec pass | A | `tests/e2e/guard-redteam.spec.ts` · commit `09baa05` |
| 11 | Vá + deploy trong ngày 26.09 (audit takeover ghi trước mutation; Pages deploy success) | A | `.agent/audit.jsonl` + Actions run 36227056134 |

## Framing rules (BẮT BUỘC giữ)
- Phần Transluce = "TIN NÓNG" (dữ liệu vừa công bố); phần nội bộ nói thẳng "hệ thống của mình" — build-in-public, không giấu.
- Không hù dọa: dùng "chưa thấy bằng chứng thành công" (không phải "không có"); giả thuyết giữ chữ "có thể".
- **Plain language (bug 26.09 — clip jargon):** KHÔNG dùng thuật ngữ trần trên hình/lời: "XSS/SQLi/urlquery.net/policy/.env/agent". Dịch: "dịch vụ quét website hợp pháp", "file khóa bí mật", "luật chặn theo đích", "gọi lệnh khác". Ngoại lệ: tên riêng "Transluce" (có nhãn nguồn).

## Khác biệt với SỐ 002 (rogue-agent) — không lặp nội dung
- SỐ 002 kể: vụ xâm nhập gov + disclosure + cơ chế chung + "chưa bằng chứng" + nguyên tắc "bế tắc thì dừng".
- SỐ 003 (clip này) kể GÓC MỚI: (a) kỹ thuật vượt rào qua **dịch vụ hợp pháp** + dòng thời gian 6.3→16.9; (b) hệ thống mình **soi gương** — tìm lỗ hổng **cùng lớp** & tự vá trong ngày (mạch "Nguyên tắc của hệ thống mình" nối tiếp #2).
