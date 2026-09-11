# Plan — COSMOS · QUANTUM Rework

Ladder: nấc 2 (reuse code hiện có) — không viết module mới, chỉ sửa CSS/JS tại chỗ + 1 spec test mới.

## Todos
1. [ ] Fix reveal: threshold 0 + scroll-sweep fail-safe (Ladder nấc 6 — sửa 1 block JS. Entangled: `.reveal` ở mọi section + `.lab-card`/`.phase` stagger)
2. [ ] Fix 2 link 404 → GitHub blob (Entangled: MAPS array chỉ trong index.html)
3. [ ] Fix card parallax → `translate` property (Entangled: `.card` hover + `.reveal` transform)
4. [ ] Lab card flex column + demo grow (Entangled: `.lab-card`, `.lab-body`, `.lab-demo`)
5. [ ] `scroll-margin-top` cho section[id] (Entangled: scroll dots + anchor links + btnLab)
6. [ ] Superposition stack polish (Entangled: `.super-card` hover vars + collapsed states)
7. [ ] "Điểm đo" thêm đơn vị (Entangled: render deStats)
8. [ ] Test mới `cosmos-rework.spec.ts`: lab reveal @375, links 0-404 sau click map, card hover transform, no pageerror (Evals Gate — rubric bên dưới)
9. [ ] Verify: full suite + screenshots 375/768/1280 + so sánh trước/sau

## Evals rubric (viết trước — KN-037)
- Reveal: mọi `.reveal` có `.in` sau scroll hết trang ở 375/390/768/1280 → pass/fail từng viewport.
- Links: click 15/15 map node → 0 response 404/ERR.
- Effects: brand `--angle` đổi sau 500ms; card hover computed transform ≠ none; `--angle` animations không regression.
- Không pageerror/console error sau mọi tương tác (KN-032).
- Visual: screenshot 3 breakpoint, không tràn ngang, không void > 100px trong lab card.
