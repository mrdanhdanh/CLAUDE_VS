---
name: video-clip
description: "Dựng clip dọc 9:16 (TikTok/Reels/Shorts) bằng canvas + Playwright MediaRecorder, voiceover tiếng Việt local (VieNeu-TTS) cắt theo beat, kèm 3 guard bắt buộc (layout/token, âm thanh, timing). Use when làm clip, dựng video, video dọc, TikTok, Reels, Shorts, storyboard, voiceover, lồng tiếng, render mp4, clip 50 giây, hoặc user nói làm video/tạo clip/dựng clip."
user-invocable: true
---

# Video Clip Studio — Dựng clip dọc có kiểm chứng

> Pipeline đã trả giá để rút ra: **canvas + MediaRecorder (không cần ffmpeg) + TTS local + 3 guard**. Mọi bước "trông ổn" đều đã từng lọt lỗi — nên ở đây không có bước nào tin bằng mắt.
> **Không cần ffmpeg, không cần API trả tiền, chạy offline sau lần tải model đầu.**

## When to Use

- Làm clip dọc **9:16** (1080×1920) cho TikTok / Reels / Shorts / YouTube Shorts
- Cần **voiceover tiếng Việt** chất lượng cao, offline, không trả phí
- Cần **storyboard bằng code** (beat/timeline) thay vì kéo thả trong editor
- User nói: `làm clip`, `dựng video`, `video dọc`, `storyboard`, `lồng tiếng`, `voiceover`, `render mp4`, `clip N giây`

> **Craft trước, render sau:** chốt hook / beat / bố cục safe zone / hệ màu bằng skill `clip-craft` (references: `layout.md` · `color.md` · `content.md`) — agent `clip-director` chạy quy trình đó và ghi vào `.agent/plans/<slug>/` trước khi implement trang canvas.

## Contract — mọi trang clip phải expose cái này

Renderer/guard đều generic nhờ 1 contract duy nhất. Trang clip **bắt buộc** có:

```js
window.__clip = {
  duration: 50,        // tổng giây
  width: 1080, height: 1920,
  draw,                // draw(t) — vẽ lại toàn bộ khung ở giây t
  beats: [...],        // [{ at, end, eyebrow, title, sub }] — dùng cho timing + guard
  freeze: false,       // render.mjs bật true để tắt rAF nội bộ khi capture
};
```

**Nguyên tắc vàng:** `draw(t)` phải **suy ra mọi thứ từ `t`** — không state tích lũy. Nhờ vậy chụp khung ở giây bất kỳ luôn ra đúng hình, guard mới kiểm được.

> Clip cũ dùng tên khác (`window.__spaceBunny`) — cùng shape. Template nhận `--global=` để đổi tên.

## Pipeline 7 phase

| # | Phase | Output | Thời gian thực tế |
|---|---|---|---|
| 1 | **Research** | `.agent/plans/<slug>/research.md` — evidence ledger, label A/B/C/D | 15–30 phút |
| 2 | **Script + beats** | `prd.md` (rubric C1–Cn) · `design.md` (tokens, beats) · `plan.md` | 20–30 phút |
| 3 | **Canvas page** | `www/<slug>/index.html` — contract ở trên | 1–2 giờ |
| 4 | **Layout guard** | `verify-frames.mjs` → N ảnh PNG từng beat | 5 phút |
| 5 | **Voiceover** | `tts-vieneu.py --segments` → WAV khớp beat | 20–40 phút (CPU) |
| 6 | **Render** | `render.mjs --voice-wav` → MP4 | ~1 phút |
| 7 | **Publish pack** | `publish.md` — caption + 3 set hashtag + checklist | 15 phút |

> Phase 1 không bỏ được khi nội dung có **claim về sản phẩm/model** — sai một chi tiết là mất uy tín. Nếu clip chỉ là giải trí thuần, gộp 1+2.

## Scaffold clip mới (3 lệnh)

```powershell
# 1. Tạo thư mục + copy template
New-Item -ItemType Directory -Force www\<slug> | Out-Null
Copy-Item .github\skills\video-clip\templates\* www\<slug>\ -Force

# 2. Sửa nội dung: www\<slug>\index.html (beats + draw) và voiceover-segments.json

# 3. Sinh voice → render (guard tự chạy)
D:\CLAUDE_VS\.venv-tts\Scripts\python.exe www\<slug>\tts-vieneu.py --segments www\<slug>\voiceover-segments.json --out www\<slug>\voiceover-<voice>-<N>s.wav
node www\<slug>\render.mjs --voice-wav=www\<slug>\voiceover-<voice>-<N>s.wav --out=www\<slug>\<slug>-<N>s.mp4
```

## 3 Guard — BẮT BUỘC, không được tắt

| Guard | Bắt được gì | Vì sao cần |
|---|---|---|
| `verify-frames.mjs` | Token thiếu trong object `C` + chụp N khung ra PNG | `ctx.fillStyle = undefined` **không throw** — nó giữ màu cũ ⇒ **chữ tàng hình**, không có exception nào |
| `verify-audio.mjs` | Track im lặng (peak/RMS = 0) trong MP4/WAV | File vẫn có box `soun`/`mp4a`, element vẫn "chạy" ⇒ tưởng có tiếng mà **im ru** |
| Guard timing trong `tts-vieneu.py` | Đoạn lời tràn khỏi beat/timeline (exit 1) | v3 Turbo **không có tham số `speed`** ⇒ phải cắt theo beat, tràn là lệch hình |

`render.mjs` **tự gọi** `verify-audio.mjs` sau khi ghi file — im lặng là fail, không ship.

## Traps đã trả giá (đừng lặp lại)

| Trap | Triệu chứng | Cách phòng |
|---|---|---|
| `new Audio('file://…')` + `createMediaElementSource` | MP4 có track audio nhưng **peak = 0** | Dùng `decodeAudioData` + `BufferSource` — media element bị coi là cross-origin trên trang `file://` |
| `ctx.fillStyle = C.<key>` với key chưa định nghĩa | Chữ tàng hình, **không có lỗi** | Một object token duy nhất + guard quét `C.<key>` vs key thực có |
| Vòng `requestAnimationFrame` của trang chạy song song vòng capture | Video nhảy/lặp khung | Bật `window.__clip.freeze = true` trước khi capture |
| Sinh nhiều giọng trong **1 tiến trình** | `Failed to allocate memory for requested buffer` | Mỗi giọng một tiến trình riêng (ONNX arena không nhả) |
| Ổ `C:` gần đầy | pip/onnx lỗi cấp phát giữa chừng; page file không giãn | Venv + `HF_HOME` + `TEMP` đặt trên ổ còn trống (`D:`) |
| Model xuất đỉnh > 1.0 | Tiếng bị méo khi clip | **Scale** về 0.98, đừng `np.clip` |
| VieNeu v3 Turbo không có `speed` | Không kéo dài giọng đọc được | Cắt lời theo beat + chèn khoảng nghỉ (`--segments`) |
| Font thiếu glyph VN (Georgia) | Chữ dấu vỡ **im lặng** — "thô ng kê", "Sớ m"; không throw, không console error | Đo trước bằng `references/font-test.mjs`; dùng Times New Roman / Cambria / Segoe UI; lưới `tests/e2e/clip-font-guard.spec.ts` + template verify-frames (KN-082) |

## B-roll AI (khi clip cần footage ngoài canvas)

- Canvas thuần cho chữ/số liệu; footage AI chỉ cho 1–2 beat "cảnh thật". Chọn tool + free tier + pattern segment 2–10s: xem `references/ai-broll-sources.md` (chụp 26/09/2026 — re-verify giá trước khi trả tiền).
- Tích hợp `<video>` + `drawImage` vào `draw(t)` — mechanics còn là `[hypothesis]`, verify ở clip đầu tiên dùng (caveat guard trong reference).

## TTS — VieNeu-TTS (local, 48 kHz)

```powershell
$env:HF_HOME='D:\hf-cache'; $env:PYTHONIOENCODING='utf-8'
D:\CLAUDE_VS\.venv-tts\Scripts\python.exe www\<slug>\tts-vieneu.py --list                    # 25 giọng
# ... --voice "Hải Đăng" --text-file voiceover.txt --out voiceover.wav                       # 1 giọng, cả bài
# ... --voice "Hải Đăng,Mai Anh" --text-file ... --out voiceover.wav                          # so sánh nhiều giọng
# ... --segments voiceover-segments.json --out voiceover-hai-dang-50s.wav                     # ghép theo beat (KHUYÊN DÙNG)
```

Giọng đã dùng tốt: **Hải Đăng** (nam · Bắc · tự nhiên) · Mai Anh (nữ · Bắc · tin tức) · Thùy Dung (nữ · Nam · tin tức).
Cài lần đầu: `python -m venv D:\CLAUDE_VS\.venv-tts` → `.venv-tts\Scripts\pip install --cache-dir D:\pip-cache vieneu` (RTF ≈ 1.0–1.4 trên CPU; ~17 s nạp model mỗi lần chạy).

## Kiểm tra độ dài trước khi render

```powershell
node www\<slug>\verify-audio.mjs www\<slug>\voiceover-<voice>-<N>s.wav   # duration phải ≈ duration clip
```

Voiceover **ngắn hơn** clip = an toàn (im lặng ở đuôi). **Dài hơn** = bị cắt cụt giữa câu → sửa lời hoặc tăng duration.

## Checklist trước khi gọi Done

- [ ] Trang clip expose đủ `window.__clip` (duration/width/height/draw/beats/freeze)?
- [ ] `verify-frames.mjs` pass + đã **xem ảnh** từng beat (không đoán)?
- [ ] `verify-audio.mjs` pass trên WAV voiceover **và** trên MP4 cuối?
- [ ] Guard timing không báo tràn beat?
- [ ] Voiceover ≤ duration clip?
- [ ] Nội dung claim có provenance (official vs community claim) nếu nói về sản phẩm?
- [ ] Clip dùng footage AI → đã đọc `references/ai-broll-sources.md`? (test free tier trước, video `muted`, không dựng người thật chưa có phép, không né nhãn AI của nền tảng)
- [ ] `publish.md` có caption + 3 set hashtag (mỗi set đúng 5 tag)?

## References

- Craft layer: skill `clip-craft` (safe zone 2026 · màu semantic · hook/retention/script math) + agent `clip-director`
- Ý tưởng nâng cấp đã audit: `.agent/plans/clip-craft/upgrade-ideas.md`
- Reference implementation: `www/space-bunny-free/` (clip 50 s, 5 beat, Hải Đăng)
- Plans + research: `.agent/plans/space-bunny-tiktok/` (research.md, prd.md, design.md, plan.md, publish.md)
- TTS: [`pnnbao97/VieNeu-TTS`](https://github.com/pnnbao97/VieNeu-TTS) (Apache-2.0) · dự phòng `edge-tts` (cần mạng)
- B-roll AI: `references/ai-broll-sources.md` — chọn tool · free tier · pattern segment 2–10s + ghép (run 26/09/2026)
- Font coverage VN: `references/font-test.mjs` — đo trên MÁY RENDER THẬT trước khi build (KN-082)
- Hashtag 2026: giới hạn **5 slot** đầu tiên · caption (keyword) quan trọng hơn hashtag — xem `publish.md`
- Bug đã log: `.agent/bugs/2026-09-23-clip-im-tieng-du-co-audio-track/` · `.agent/bugs/2026-09-23-mau-thieu-lam-chu-tang-hinh/` · `.agent/bugs/2026-09-26-font-georgia-vo-dau-tieng-viet-trong-canvas-clip/`

---
*Skill: video-clip — enforce bởi Harness v2. Mọi bước "trông ổn" đều từng lọt lỗi; guard mới là thứ giữ.*
