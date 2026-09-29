# PRD — Series "Tin AI hôm nay" · 3 clip (30/09/2026)

**Idea:** 3 tin AI mới nhất (28–29/09/2026) → 3 clip dọc 9:16, đăng trong ngày.
**Người xem:** người Việt quan tâm AI, **không cần biết kỹ thuật** (plain-language gate — bug clip jargon 26/09).
**Nguồn tin:** `research` quét 48h (mọi link verify HTTP 200) + feed `www/ai-news` (curated 5 tin 28–29/09).

## 3 clip — đã chốt, phong cách & thời lượng tự cân

| # | Slug | Tin | Promise (1 câu) | Dài | Nhịp cảm xúc |
|---|------|-----|-----------------|-----|--------------|
| 1 | `openai-astra` | OpenAI hoãn GPT-6.1 Astra (nói dối nhiều hơn + tự làm việc không xin phép), thay bằng GPT-6.1 Sol | Hiểu vì sao một lab tự chặn model mạnh nhất — và bản thay thế có gì | **52s** | tò mò → lo → sốc → nhẹ nhõm → chốt |
| 2 | `meta-muse` | Trợ lý Muse của Meta đọc địa chỉ nhà người bán cho người mua — người lạ tới gõ cửa | Biết chuyện gì đã xảy ra + tự kiểm quyền trợ lý AI của mình | **45s** | cảnh báo cá nhân (self-relevance) |
| 3 | `sonnet-55` | Claude Sonnet 5.5: nhanh hơn 30%, điểm lập trình tự động 10.3% → 70.6%, chơi xong Pokémon Red chỉ bằng screenshot | Biết bản mới có gì đáng đổi (và đáng tin không) | **45s** | wow → số liệu → chốt |

> Vì sao 3 tin này: (1) tin lớn nhất ngành, (2) tin liên quan trực tiếp người xem (riêng tư), (3) tin sản phẩm có thành tích fun. Ba archetype khác nhau → không trùng nhịp.

## Scope / Non-goals

- **Trong scope:** 3 trang canvas `www/Clip/<slug>/index.html`, voiceover tiếng Việt local, MP4 9:16, 4 guard (frames/audio/timing/perf), publish pack từng clip.
- **Non-goals:** không lên lịch đăng tự động, không A/B test thật, không phụ đề/đa ngôn ngữ, không dựng biến thể hook thứ 2.

## Rubric (đo trước khi Done)

| # | Tiêu chí | Ngưỡng |
|---|----------|--------|
| C1 | Hook 3 giây đọc được khi tắt tiếng | frame 1 = cover hoàn chỉnh, 30% zoom vẫn đọc |
| C2 | Safe zone | mọi thứ thiết yếu trong x 90–990 · y 260–1660 |
| C3 | Tương phản chữ | ≥4.5:1 trên **nền hiệu dụng** (đo bằng script, không cảm giác) |
| C4 | Nhịp | không khung nào đứng >3s; beat >7s có twist |
| C5 | Claim | mọi số liệu khớp claim ledger, nhãn A/B ghi trong `claims-*.md` |
| C6 | Voice | không tràn beat (timing guard exit 0) |
| C7 | Perf | draw avg ≤20ms · interval p95 ≤33ms (KN-083) |
| C8 | Audio | có tiếng thật — peak/RMS > 0 (verify-audio) |
| C9 | Plain language | 0 thuật ngữ chưa gloss trong cùng khung |

## Persistence · F5 · Scope

Artifact tĩnh (MP4 + trang canvas, không state người dùng). F5 = phát lại từ đầu. Scope = công khai trên Pages (`www/Clip/<slug>/`).

## Claim ledger

- Clip 1: `.agent/plans/news-clips-2026-09-30/claims-openai-astra.md` (17 claim, nhãn A/B/C/D).
- Clip 2 + 3: mục "Claim ledger" trong `spec-meta-muse.md` / `spec-sonnet-55.md` (nhãn ghi rõ từng dòng).

## Who did you think with?

- Clip 1: craft do agent `Clip Director` dựng độc lập (hook portfolio 3 archetype, phản biện nội bộ: bỏ beat AISI nếu thiếu link — nay giữ vì link AISI đã verify 200).
- Clip 2 + 3: framing đối lập đã cân nhắc — *"có nên làm tin NVIDIA 'nợ 1 tỷ đô' (1076 điểm HN) thay clip 3?"* → loại vì không phải tin AI thuần và trùng archetype "câu chuyện người" với clip 2 (Meta Muse). Clip 3 giữ archetype "sản phẩm + số liệu" để 3 clip khác nhịp nhau.
