# Design — Clip "Thời của người khổng lồ" (style **FIRE & LATTICE** · 42s · 7 beat · rev2 27/09)

> **FIRE & LATTICE** = 2 motif xuyên suốt: **lửa hình học** (sức mạnh nguyên thuỷ) biến dần thành **lưới nút** (sức mạnh nhận thức). Mọi thứ vẽ bằng canvas, suy từ `t`.
> Nguồn craft: `clip-craft/references/{layout,color,content}.md` (safe zone 2026 · palette role system · script math). Mọi số dưới đây là số **tính được**, không phải cảm nhận.

## 1. Beat sheet (7 beat · tổng 42s — beat cuối kết thúc đúng 42; rev2: mốc suy từ lời)

| # | `at`–`end` | Eyebrow (mono) | Title (3 dòng, mỗi dòng ≤16 ký tự) | Sub — dòng phụ trên hình (≤2 dòng) | Tone màu |
|---|---|---|---|---|---|
| 1 | **0 – 4.85** | `ĐỌC VỊ 27.09 · TỪ HACKERNOON` | `Lửa từng` / `biến ta thành` / `khổng lồ.` | `Ý của bài: lửa tăng sức mạnh cơ bắp — AI tăng sức mạnh nhận thức.` | lửa = **amber** `#ffc857` trên `bg0`; eyebrow **cyan** |
| 2 | **4.85 – 9.99** | `01 · MỘT NGƯỜI BẰNG CẢ MỘT ĐỘI` | `Một người` / `giờ bằng` / `cả một đội.` | `Tác giả gọi đây là thời của người khổng lồ.` | **green** `#5dfc9b` (mở/tăng) + **violet** (AI) |
| 3 | **9.99 – 15.61** | `02 · CỬA SỔ ĐANG HẸP LẠI` | `Biết hỏi AI` / `không còn là` / `lợi thế.` | `Điểm mấu chốt của bài: thiết kế lại cách làm việc quanh AI.` | **amber** (áp lực) + **red** `#ff5d73` (tường hẹp); cửa **cyan** |
| 4 | **15.61 – 21.23** | `03 · CÂU HỎI NGƯỢC` | `AI làm cho ta —` / `hay ta dần` / `làm cho nó?` | `Tác giả: quan hệ đảo chiều — mà AI không cần "muốn" gì cả.` | **violet** (AI) ↔ **pink** `#ff9ecb` (người); nền tối hơn (`bg0`) |
| 5 | **21.23 – 27.33** | `04 · KHÔNG AI RA LỆNH` | `Ta dạy nó.` / `Rồi nó dạy lại` / `cách ta làm.` | `Đảo chiều không cần ác ý hay ý chí — chỉ cần ta quen dần.` | **violet** + `dim` (lưới nền uốn cong) |
| 6 | **27.33 – 33.83** | `05 · SỨC MẠNH KHUẾCH ĐẠI` | `Sức mạnh` / `không mang lại` / `khôn ngoan.` | `Nên "giữ mình cho thẳng" khi đã mạnh — không chỉ là bài toán kỹ thuật.` | **cyan** (nguồn sáng) + **green/red** 2 cột đối xứng |
| 7 | **33.83 – 42** | `06 · ĐIỀU CÒN LẠI` | `Thời của` / `người khổng lồ —` / `do bạn chọn.` | End card: `"Thiên niên kỷ thứ ba sẽ là tâm linh — hoặc sẽ không là gì cả."` + `— André Malraux (câu được trích phổ biến)` + `Ý tưởng: Benoît Kulesza · HackerNoon 27.09.2026 · quan điểm cá nhân` + CTA `Bạn đổi cách làm gì — vì AI? Kể 1 việc.` | ấm dần (**pink/amber**) → về tông cover (loop) |

> `sub` = **dòng phụ trên hình** (đặt động dưới title) — **khác** phụ đề burned-in (phụ đề = đúng lời VO, xem §9). Title dùng `\n` cho ngắt dòng trong `beats[]` (không dùng ký tự `|`).

- **Payoff** = beat 6 (27.33–33.83s) → rơi vào **65–81%** thời lượng (đỉnh ~75%) ✅ theo `content.md` §4.
- **Escalation:** hook (huyền thoại) → lợi ích → căng → câu hỏi đảo → cơ chế → cú chốt → ý nghĩa. Không beat nào "phẳng" >7s: beat ≤7.6s đều có interrupt nội bộ (§5).
- **Open loop:** mở ở B1 ("AI làm điều đó với trí óc bạn" — rồi sao?) → đóng ở B7 (lựa chọn thuộc về bạn).
- **Loop ending:** đốm lửa nhỏ tái xuất ở ~40.4s → match cut về B1.

## 2. Voiceover budget — rev2 (đo từ WAV thật, không đoán)

**Nguyên tắc rev2:** lời xếp **LIÊN TỤC** — `at` của đoạn sau = hết đoạn trước + **0.5s**; tổng clip = hết lời cuối + ~1.9s thở. Beat hình suy từ mốc lời (visual **lead 0.45s**).

| # | `at` | dur đo | Hết lời | Gap → đoạn sau | Âm tiết | Tốc độ đọc |
|---|---|---|---|---|---|---|
| 1 | 0.4 | 4.08s | 4.48 | 0.82s | 20 | 4.9/s |
| 2 | 5.3 | 4.48s | 9.78 | 0.66s | 20 | 4.5/s |
| 3 | 10.44 | 5.12s | 15.56 | 0.50s | 22 | 4.3/s |
| 4 | 16.06 | 5.20s | 21.26 | 0.42s | 22 | 4.2/s |
| 5 | 21.68 | 6.08s | 27.76 | 0.02s (nghe ~0.3s — đuôi/đầu block có im lặng nội bộ) | 25 | 4.1/s |
| 6 | 27.78 | 6.24s | 34.02 | 0.26s | 27 | 4.3/s |
| 7 | 34.28 | 5.84s | 40.12 | 1.88s (đuôi clip → loop) | 25 | 4.3/s |
| | | **37.0s** | | tổng clip **42.0s** | **~161** | |

**Vì sao rev2 (bài học "lủng củng" 27/09):** bản 50s cũ = 7 đoạn đặt theo beat grid → 6 khoảng lặng cấu trúc **~2.0–2.4s** (đo RMS 20ms: 42% im lặng, voiced 29.1s/50s) → nghe rời rạc dù từng câu ổn. rev2 còn **~29% im lặng**, phần lớn là nghỉ giữa câu (≤0.6s) — nghe như một mạch kể.

⚠️ **Đo biến động:** cùng text + voice, mỗi lần TTS có thể lệch **±5–8%** duration (vocoder sampling) — sửa lời/rerun thì đọc lại bảng này + chạy guard; đừng để gap âm (hai đoạn chồng nhau).

## 3. Palette semantic (token tái dùng — `C` object)

| Token | Hex | Nghĩa cố định trong clip | Contrast đo (WCAG 2.1, theo hex) |
|---|---|---|---|
| `bg0` | `#04070d` | nền sâu (60% diện tích) | — |
| `bg1` | `#081120` | dải/panel chìm | — |
| `panel` | `#0d1830` | thẻ, chip, end card | — |
| `line` | `#24365c` | viền, grid, track | — |
| `ink` | `#eef4ff` | chữ chính | **18.3:1** trên `bg0` · 16.0:1 trên `panel` |
| `muted` | `#93a7cc` | chữ phụ | **8.3:1** trên `bg0` |
| `dim` | `#5f7396` | trang trí (không chở info) | 4.4:1 — **chỉ decor** |
| `cyan` | `#4fe3e0` | **accent kênh** + dữ kiện trung tính (HUD, progress, eyebrow B1) | **12.9:1** |
| `amber` | `#ffc857` | **LỬA** (sức mạnh nguyên thuỷ) + số liệu/nhấn | **13.1:1** |
| `green` | `#5dfc9b` | **mở / tăng trưởng** (cửa mở, nửa tốt của khuếch đại) | **15.2:1** |
| `red` | `#ff5d73` | **áp lực / hẹp lại** (tường, mũi tên dội ngược) | **6.8:1** (5.9:1 trên `panel`) |
| `violet` | `#b18cff` | **AI / năng lực nhận thức** (lưới nút, khuôn AI) | **7.7:1** |
| `pink` | `#ff9ecb` | **NGƯỜI / lựa chọn** (bóng người, đường do bạn vẽ) | **10.6:1** |

- Tỉ lệ **60-30-10**: 60% `bg0/bg1` · 30% panel + chữ · 10% accent. **≤2 accent/kg khung** (B1: amber+cyan · B3: amber+red · B4: violet+pink · B6: cyan+green/red).
- Không truyền tin **chỉ bằng màu**: mọi nhãn đều có chữ (`MỞ` / `HẸP LẠI` / `KHUẾCH ĐẠI`).
- Chữ quan trọng **không đặt trực tiếp trên nền động** → panel/scrim `rgba(4,7,13,0.72)` sau title + subtitle.
- Contrast đo bằng công thức WCAG trên cặp token (không phải đo tool) — verify-frames sẽ chụp ảnh để **mắt người** kiểm khung xấu nhất.

## 4. Safe zone 2026 + lưới riêng của clip

**Số liệu nền tảng (`layout.md` §1):** upload 1080×1920 nhưng thiết kế theo hộp **900×1400** giữa khung; TikTok che **đáy ~320px** (caption) + **phải ~120px** (action rail; bản bảo thủ dùng **180px**); top che 108–210px.

| Vùng | Toạ độ | Nội dung |
|---|---|---|
| HUD decor | y 60–108 | `●REC` · `ĐỌC VỊ #01` · `T+ss` — trang trí, có thể bị che |
| Eyebrow | y ≈300 | nhãn phụ (mono, màu theo beat) — trong hộp an toàn |
| **Chữ chính** | **y 750–1400** | title (760–1035) · sub (1085–1145) · **phụ đề burned-in** (1220–1400) · CTA (slot sub, ~1100) · end card |
| Visual | y 620–1560 | lửa/lưới/bóng người/bar — **không chở info thiết yếu** nếu bị che |
| Progress | y 1500 | bar 8px · vạch-giây động (TICKS = DURATION = 42) |
| Footer | y 1560 | brand + `QUAN ĐIỂM · HACKERNOON 27.09` |
| Hộp ngang | **x 90–900** | toàn bộ chữ (title maxW = 810px); chừa 180px phải cho action rail |
| **Cấm** | y >1660 · x >990 · x <90 | tam giác chết — không đặt gì thiết yếu |

> Phụ đề burned-in (y 1220–1400) có **scrim riêng** + highlight từ khoá — nằm dưới cùng dải chữ chính, không đè title/sub. CTA chỉ xuất hiện ở B7 (end card), đặt ở **slot sub (~1100)** để không chèn lên phụ đề.

> ⚠️ `layout.md` đặt progress 1596 / footer 1640; TikTok che đáy 320px → mốc an toàn thực tế **y ≤ 1600**. Bản này **đẩy progress lên 1500, footer 1560** (bảo thủ hơn, vẫn trong hộp 900×1400). Đuôi clip (y >1600) để nền tối sạch cho caption của app.

**Type scale** (`layout.md` §3): headline **80–88px** Arial/Segoe UI 800 (theo `size` từng beat trong `beats[]`), line-height 1.08 → 3 dòng ≈ 260–285px (760→1045, khít trong dải 750–1400) · sub Segoe UI 30px/600 · subtitle burned-in 46px/700 + scrim · eyebrow Consolas 28px/700 · HUD Consolas 22px · footer 24px · CTA 38px/700.
**Font an toàn VN:** Arial / Segoe UI / Consolas (✅ coverage dấu). **Cấm Georgia** (KN-082 — vỡ dấu im lặng); đo lại bằng `video-clip/references/font-test.mjs` trên máy render trước khi build.

## 5. Visual theo beat (canvas, suy từ `t`) + interrupt

| Beat | Motif | Cách vẽ (deterministic) | Interrupt nội bộ |
|---|---|---|---|
| 1 | **Lửa → lưới** | Bóng người cỡ lớn giữa khung; trên đỉnh đầu một **ngọn lửa hình học** (3–4 polygon lồng, alpha thấp dần) + tia lửa (spark: 40 điểm, sin theo `t`). 1.5s cuối beat: lửa **morph** thành **lưới nút** violet (8 node, cạnh nối mờ dần) | **t≈2.8** lửa bùng (scale 1.0→1.18) + burst 12 spark |
| 2 | **Bóng lớn dần + 6 khung việc** | Bóng người scale từ 0.6→1.0 tới sát mép hộp an toàn; 6 panel nhỏ (job card) hiện quanh theo stagger 0.3s; phía sau mở **cửa** (portal) sáng green, ánh hắt vào sàn | **t≈9.4** 4 panel cuối bật sáng đồng loạt + portal mở rộng 15% |
| 3 | **Cửa hẹp lại** | 2 bức tường (bar red) trượt vào từ 2 mép → cửa cyan giữa hẹp dần theo `t`; hàng đám đông (6 figure đồng dạng) đứng trước cửa; 1 figure đi **đường vẽ riêng** (nét đứt cyan) và qua cửa trước khi khép | **t≈15.5** tường snap vào 12px + pulse đỏ + nhãn `HẸP LẠI` nháy |
| 4 | **Cán cân + 2 mũi tên đảo chiều** | Vòng lặp 2 mũi tên `TA ⇄ AI`: mũi tên "ta → AI" (dạy nó) nét ổn định; mũi tên "AI → ta" **dày lên** theo `t` và chuyển amber→red; cán cân nghiêng dần về AI; bóng người mờ + nhỏ đi | **t≈23.2** mũi tên "AI → ta" lật trọng số (dày ×2) + title pulse |
| 5 | **Lưới bị uốn** | Lưới vuông nền (grid 12×12, `dim`) ban đầu đều → uốn cong dần theo một **khuôn tròn** (do AI vẽ); một con trỏ người đi theo lưới đã cong mà không nhận ra; nhãn nhỏ `KHÔNG AI RA LỆNH` | **t≈30.6** lưới snap sang dạng tròn hoàn toàn + pulse nhẹ nền |
| 6 | **Tia khuếch đại + 2 cột đối xứng** | Nguồn sáng nhỏ giữa khung + tia phóng ra; 2 cột bar đối xứng (trái green = hào phóng/thông minh, phải red = tham lam/ngốc nghếch) **cùng cao lên** theo `t` (khuếch đại như nhau); nhãn chữ ở đầu mỗi cột | **t≈38.3** cả 2 cột đạt đỉnh + rung nhẹ, nền sáng lên 1 nhịp |
| 7 | **2 con đường + end card** | Bóng khổng lồ quay về; trước mặt 2 đường: một uốn theo khuôn AI (violet), một do người vẽ (pink) — camera "chọn" đường pink (sáng lên); **t≈45.5** chuyển sang **card chữ tĩnh** (nền sạch, quote Malraux hiện dần 3 dòng) + attribution + CTA; **t≈49** đốm lửa nhỏ tái xuất đáy (loop) | **t≈45.5** đổi layout lớn (card chữ) = pattern interrupt cuối |

> **rev2 mapping:** mốc interrupt trong bảng §5 ghi theo **khung gốc**; bản 42s co giãn bằng `sc()` trong `index.html` — quy đổi t_new = at_new + (t_old − at_old) × (len_new ÷ len_old).

**Cover frame (mẫu "Stack"):** cover = **t ≈ 2.1s** (lửa đỉnh + title đã hiện đủ) · backup **t ≈ 35.4s** (2 con đường + bóng người, tông ấm). Test 30% zoom + muted; **t=0 không fade từ đen** — title đã hiện (reveal 0.2s).

## 6. Motion

- Reveal 0.3–0.6s ease-out, `translate ≤24px` / `scale 0.96→1`; hold ≥1s trước element kế; **interrupt mỗi 2–3s** (§5).
- Mọi chuyển động là **hàm của `t`** — không state tích lũy (contract §8). Random (sparks) dùng PRNG seed cố định theo index.
- Transition giữa beat: **cut** (không cầu kỳ) + 1 nhịp nhấn nhá ở interrupt.
- Reduced-motion: giữ fade, bỏ zoom/typing/parallax.

## 7. A11y

- `role="img"` + `aria-label` mô tả clip; `<h1 class="sr">` ẩn cho screen reader.
- Contrast: ink 18.3:1 · muted 8.3:1 · amber 13.1:1 · green 15.2:1 · cyan 12.9:1 · pink 10.6:1 · violet 7.7:1 · red 6.8:1 — đều ≥4.5:1 (riêng `dim` 4.4:1 **chỉ decor**).
- Không chỉ dùng màu: nhãn chữ đi kèm mọi tín hiệu màu. Subtitle burned-in 46px + scrim + highlight từ khoá.

## 8. Contract (bàn giao cho Implement)

```js
window.__clip = {
  duration: 42, width: 1080, height: 1920,
  draw,                 // draw(t) — vẽ LẠI TOÀN BỘ khung ở giây t, thuần tuý, không state tích lũy
  beats: [              // 7 beat khớp §1 — dùng cho timing + guard (title ngắt dòng bằng \n)
    { at: 0,     end: 4.85,  eyebrow: 'ĐỌC VỊ 27.09 · TỪ HACKERNOON',    size: 88, title: 'Lửa từng\nbiến ta thành\nkhổng lồ.', sub: 'Ý của bài: lửa tăng sức mạnh cơ bắp — AI tăng sức mạnh nhận thức.' },
    { at: 4.85,  end: 9.99,  eyebrow: '01 · MỘT NGƯỜI BẰNG CẢ MỘT ĐỘI', size: 88, title: 'Một người\ngiờ bằng\ncả một đội.', sub: 'Tác giả gọi đây là thời của người khổng lồ.' },
    { at: 9.99,  end: 15.61, eyebrow: '02 · CỬA SỔ ĐANG HẸP LẠI',       size: 88, title: 'Biết hỏi AI\nkhông còn là\nlợi thế.', sub: 'Điểm mấu chốt của bài: thiết kế lại cách làm việc quanh AI.' },
    { at: 15.61, end: 21.23, eyebrow: '03 · CÂU HỎI NGƯỢC',             size: 80, title: 'AI làm cho ta —\nhay ta dần\nlàm cho nó?', sub: 'Tác giả: quan hệ đảo chiều — mà AI không cần "muốn" gì cả.' },
    { at: 21.23, end: 27.33, eyebrow: '04 · KHÔNG AI RA LỆNH',          size: 84, title: 'Ta dạy nó.\nRồi nó dạy lại\ncách ta làm.', sub: 'Đảo chiều không cần ác ý hay ý chí — chỉ cần ta quen dần.' },
    { at: 27.33, end: 33.83, eyebrow: '05 · SỨC MẠNH KHUẾCH ĐẠI',        size: 84, title: 'Sức mạnh\nkhông mang lại\nkhôn ngoan.', sub: 'Nên "giữ mình cho thẳng" khi đã mạnh — không chỉ là bài toán kỹ thuật.' },
    { at: 33.83, end: 42.0,  eyebrow: '06 · ĐIỀU CÒN LẠI',               size: 84, title: 'Thời của\nngười khổng lồ —\ndo bạn chọn.', sub: 'Bạn đổi cách làm gì — vì AI? Kể 1 việc.' },
  ],
  freeze: false,        // render.mjs bật true để tắt rAF nội bộ khi capture
};
```

## 9. SUBS (phụ đề burned-in) — đúng lời VO, có highlight

Mảng `SUBS` trong `index.html` = **đúng text trong `voiceover-segments.json`** (nguồn: `voiceover-segments.draft.json`), có thể tách 1 đoạn beat thành 2 dòng phụ đề (ngắt ở dấu `.` / `—`). Mỗi cửa sổ phụ đề giữ `hi: [...]` = 1–2 cụm từ khoá để tô màu nổi.

| Beat | Cụm highlight gợi ý (`hi`) | Màu highlight |
|---|---|---|
| 1 | `lửa`, `trí óc của bạn` | amber · pink |
| 2 | `cả một nhóm`, `Cửa đang mở` | violet · green |
| 3 | `hẹp lại nhanh`, `sắp việc quanh nó` | red · amber |
| 4 | `làm cho nó`, `ý chí riêng` | red · violet |
| 5 | `Ta dạy nó`, `Không ai ra lệnh` | violet · pink |
| 6 | `khôn ngoan`, `tham lam` | pink · red |
| 7 | `dồn sức`, `do bạn` | amber · pink |

> Cache layout chữ 1 lần / cửa sổ (đo `measureText` lúc khởi tạo, không mỗi khung) — xem `www/Clip/lang-ai-era/index.html` để lấy mẫu code đã đo perf (KN-083).
