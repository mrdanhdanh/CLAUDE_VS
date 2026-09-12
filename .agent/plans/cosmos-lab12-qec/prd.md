# PRD (mini) — Cosmos · Lab #12 QEC + Roadmap Sync

- **Ngày:** 2026-09-12 · **Actor:** YUNIE · **Nguồn:** user "tiếp tục nâng cấp cho trang cosmos".
- **Cosmic-Quantum:** Macro `www/cosmos` là vũ trụ con (12 lab = 12 thí nghiệm khảo sát) · Micro mỗi fix phải đo bằng Playwright trước khi claim Done · Entanglement `www/cosmos/index.html` ↔ `slides.html` ↔ `cosmos-future.spec.ts`/`cosmos-slides.spec.ts`/`cosmos-rework.spec.ts` ↔ `scale.json`.

## Vấn đề (evidence-based)
| # | Severity | Vấn đề | Bằng chứng |
|---|----------|--------|-----------|
| 1 | 🐞 major | Scroll-dot **"Tương lai"** bấm không nhảy: section `Khai thác tương lai` thiếu `id="future"` → `document.getElementById('future')` = null; observer active-dot cũng bỏ luôn section cuối (`.filter(Boolean)`) | code: 9 dot (`data-target` gồm `future`) vs 8 section có `id`; `index.html:3805,3874` |
| 2 | ✨ gap | Roadmap tự khai báo **"QEC — Lab #12"** (Q1 2027) là đề tài tương lai — trang vẫn 11 lab | `index.html:1888`, `index.html:1412` "11 thí nghiệm" |
| 3 | 🟡 stale | Copy số lab: `index.html` nói "11 thí nghiệm"; STATUS page `www/index.html:167` nói "4 lab tương tác" (lệch 3 đời) | grep |
| 4 | 🟡 stale | Sau khi ship QEC, card roadmap + slide 15 vẫn xếp QEC vào "chưa làm" (drift class KN-038) | `slides.html:1029` |

## Giải pháp
1. **Ship Lab #12 — Quantum Error Correction**: lab tương tác thật — inject bit-flip → **đo syndrome** (RED chỉ đúng `file:line`) → fix gốc 1 lần là GREEN; "sửa test cho pass" bị **⛔ REFUSED (deny-test-mutate)**; 3 workaround → **3-fix limit ⇒ human takeover**.
2. **Fix bug #1**: thêm `id="future"` cho section tương lai (dot hoạt động + active tracking đủ 9 section).
3. **Sync copy**: 11 → 12 thí nghiệm (`index.html`), "4 lab tương tác" → "12 lab tương tác" (`www/index.html`).
4. **Roadmap sync**: QEC → dòng "đã ship"; thêm đề tài mới **🕰️ Light Echo — Replay quyết định từ audit** vào đúng chỗ (giữ 6 card / 6 chip ETA).
5. **Sync slides** slide 15 (đã ship + 5 mục; đổi QEC → Light Echo) — giữ invariant 6 chip.

## Non-goals (YAGNI — CẮT)
- CẮT: dependency mới, framework, canvas mới (lab dùng DOM + CSS như 11 lab cũ).
- CẮT: gọi harness thật từ trang (Pages static — lab là **mô phỏng** cơ chế, ghi rõ "thật: tdd-gate + policy").
- CẮT: thêm slide mới (giữ 15), sửa intro, đổi palette/layout.
- CẮT: rework 11 lab cũ.

## Persistence · F5 · Scope
`Persistence: none (state lab chỉ trong RAM) · F5: mất (chủ ý — lab là thí nghiệm) · Scope: static GitHub Pages www/`

## Who did you think with? (Dissent — KN-018)
- **Framing đối lập #1:** *"thêm lab #12 là feature creep — 11 lab đã đủ, người xem không bấm hết; ship thêm chỉ để tick roadmap"*. Xử lý: chỉ ship vì nó **dạy cơ chế chưa có lab nào dạy** — 3-fix limit → takeover + deny-test-mutate (reward hacking) — đúng 2 gate đang enforce thật trong repo; nếu không dạy được gì mới thì cắt.
- **Framing đối lập #2:** *"đáng ra phải viết replay audit (Light Echo) thay vì thêm 1 lab nữa"*. Giữ lại làm đề tài roadmap đúng chỗ (không thay thế) — nhưng ghi nhận: giá trị Light Echo cao hơn về mặt harness, thấp hơn về mặt trải nghiệm trang.

## Acceptance (Evals rubric viết TRƯỚC — KN-037)
- [ ] `#lab .lab-card` = 12; card QEC có badge + controls hoạt động.
- [ ] Luồng chuẩn: inject → measure (log chứa `FAIL` + `\.cs:\d+`) → fix gốc (log `GREEN`, fidelity 100%).
- [ ] "Sửa test cho pass" → log chứa `REFUSED` + `deny-test-mutate` (không im lặng).
- [ ] 3× workaround → log chứa takeover; inject sau takeover bị chặn.
- [ ] `#future` tồn tại; click dot "Tương lai" → section vào viewport; 9/9 dot có target tồn tại.
- [ ] 375/768/1280: không tràn ngang; lab card visible; không pageerror/console error (KN-032).
- [ ] 6 card + 6 chip ETA ở `index.html` & slide 15; slide 15 không còn xếp QEC vào "chưa làm".
