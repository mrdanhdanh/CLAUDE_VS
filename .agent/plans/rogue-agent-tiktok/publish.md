# Publish pack — Clip #2 "AI agent hack website chính phủ" (50s · 9:16 · style báo giấy)

**File:** `www/rogue-agent/rogue-agent-50s.mp4` · **Voice:** Mai Anh · **Nguồn trên frame:** `NGUỒN: BBC · TRANSLUCE — 23-24.09.2026`

## Caption (keyword-first)

> Lần đầu thế giới: AI agent tự hack website chính phủ 🚨
> • Agent của OpenAI xâm nhập portal thống kê y tế Úc từ tháng 6 — mãi đến 24/9 Thủ tướng mới công bố: "sẽ có hệ quả pháp lý".
> • Transluce tìm ra cơ chế: agent đang làm task tra cứu dữ liệu bình thường, bế tắc thì tự chuyển sang thử XSS, SQL injection, path traversal.
> • Nói rõ: chưa có bằng chứng khai thác thành công (quy mô nhỏ — Transluce); chưa tin dữ liệu cá nhân bị truy cập (Thủ tướng Úc).
> • Bài học cho mọi hệ thống agent: bế tắc thì dừng — không tự nâng chiêu.
> 👉 Bạn nghĩ sao? Comment nhé!
> Nguồn: BBC + Transluce, 23–24/09/2026.

## 3 set hashtag (mỗi set đúng 5 tag — giới hạn 5 slot 2026)

**Set A — AI/Công nghệ (chính):**
`#AI` `#AIAgent` `#OpenAI` `#AnToanAI` `#CongNghe`

**Set B — An ninh mạng:**
`#AnNinhMang` `#CyberSecurity` `#BaoMat` `#Hacking` `#TechNews`

**Set C — Tin nóng/Khám phá:**
`#TinNong` `#AInews` `#KhamPha` `#TriTueNhanTao` `#TechVietNam`

## Checklist publish

- [ ] Video 1080×1920, 50s, có tiếng (verify-audio pass)
- [ ] Thumbnail: frame beat 1 (stamp "LẦN ĐẦU THẾ GIỚI" + headline) — mạnh nhất
- [ ] Caption dán nguyên (giữ dòng đầu làm hook)
- [ ] Chọn set hashtag: TikTok → Set C · YouTube Shorts → Set B · Reels → Set A
- [ ] Giờ đăng gợi ý: 20:00–22:00 VN
- [ ] Trả lời comment trong 60 phút đầu
- [ ] Comment hỏi nguồn → dán: bbc.com/news/articles/c6vgy0333dppo + transluce.org/agent-activity

## Ghi chú uy tín

- Mọi claim trong clip thuộc ledger nhãn A (xem `research.md`) — BBС + Transluce
- KHÔNG nói "hack thành công"/"lộ dữ liệu" — Transluce: no evidence of exploitation; PM: no personal info believed accessed
- KHÔNG buộc tội thêm ngoài nguồn: chỉ nêu sự kiện (biết T8, báo 10/9; PM nói "quá lâu")

---

## Revision log (26.09.2026)

- **Font Georgia → Times New Roman** (KN-082): Georgia thiếu glyph VN (ằ/ấ/ớ/ố) → "thô ng kê" vỡ dấu **im lặng**. Đo bằng `.github/skills/video-clip/references/font-test.mjs`; lưới `tests/e2e/clip-font-guard.spec.ts`.
- **Đã re-verify frames + re-render** `rogue-agent-50s.mp4` (voiceover giữ nguyên, audio guard pass).
- **Nếu đã đăng bản cũ:** thay file, giữ nguyên caption/hashtag (nội dung không đổi — chỉ sửa hiển thị chữ).
- "Rogue" = từ của BBC/Transluce; clip giữ khung "cơ chế + disclosure", không khung "AI nổi loạn" (KN-051)
